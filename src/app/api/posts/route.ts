import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRevision } from '@/lib/revisions';
import { hashPassword } from '@/lib/auth';
import { generatePostUrl } from '@/lib/permalink';
import { hooks, HOOK_NAMES } from '@/lib/hooks';
import { CORE_HOOKS } from '@/lib/hooks/coreHooks';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { saveProductMeta } from '@/plugins/lexi-commerce/server/productMeta';

const generateSlug = (text: string) => {
  return text.toString().toLowerCase()
    .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
    .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
    .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
    .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
    .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
    .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
    .replace(/đ/gi, 'd')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export async function POST(req: Request) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    let { id, title, slug, content, excerpt, status, featuredImageId, visibility, publishedAt, categoryIds, tags, seoTitle, seoDescription, seoKeywords, type, parentId, builderData, pageLayout, contentWidth, contentMaxWidth, commitMessage, revisionName, isStarred } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Tiêu đề không được để trống' }, { status: 400 });
    }

    const isPage = type === 'PAGE';
    const isProduct = type === 'PRODUCT';
    const isPublish = status === 'PUBLISHED' || status === 'published';
    
    let requiredCap = '';
    if (isPage) {
      requiredCap = isPublish ? 'publish_pages' : 'edit_pages';
    } else if (isProduct) {
      requiredCap = isPublish ? 'publish_products' : 'edit_products';
    } else {
      requiredCap = isPublish ? 'publish_posts' : 'edit_posts';
    }
    
    const hasCap = await userCan(sessionUser, requiredCap);
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền thực hiện hành động này' }, { status: 403 });
    }

    // Check ownership if updating
    if (id) {
      const existingPost = await prisma.post.findUnique({
        where: { id: Number(id) }
      });
      if (existingPost) {
        if (existingPost.authorId !== sessionUser.id && !isPage) {
          const canEditOthers = await userCan(sessionUser, 'edit_others_posts');
          if (!canEditOthers) {
            return NextResponse.json({ success: false, error: 'Bạn không có quyền chỉnh sửa bài viết của người khác' }, { status: 403 });
          }
        }
      }
    }

    // Xử lý unique slug thực tế trong Database
    let finalSlug = slug || 'bai-viet-moi';
    
    // Hook: CONTENT_TRANSFORM_SLUG
    finalSlug = await hooks.applyFilters(CORE_HOOKS.CONTENT_TRANSFORM_SLUG, finalSlug, body);
    
    // Hook: CONTENT_TRANSFORM_EXCERPT
    excerpt = await hooks.applyFilters(CORE_HOOKS.CONTENT_TRANSFORM_EXCERPT, excerpt || '', body);

    // Hook: CONTENT_VALIDATE
    const validationResult = await hooks.applyFilters(CORE_HOOKS.CONTENT_VALIDATE, {
      valid: true,
      errors: []
    }, { title, finalSlug, excerpt, content, status, type });

    if (validationResult && validationResult.valid === false) {
      return NextResponse.json({ success: false, error: validationResult.errors?.[0] || 'Dữ liệu không hợp lệ (Plugin chặn).' }, { status: 400 });
    }

    // Hook: CONTENT_BEFORE_PUBLISH
    if (isPublish) {
      const publishValidation = await hooks.applyFilters(CORE_HOOKS.CONTENT_BEFORE_PUBLISH, {
        valid: true,
        errors: []
      }, { title, finalSlug, excerpt, content, type });

      if (publishValidation && publishValidation.valid === false) {
        return NextResponse.json({ success: false, error: publishValidation.errors?.[0] || 'Không đủ điều kiện xuất bản (Plugin chặn).' }, { status: 400 });
      }
    }

    let counter = 2;
    const requestedSlug = finalSlug;
    while (true) {
      const existing = await prisma.post.findFirst({
        where: {
          slug: finalSlug,
          NOT: id ? { id: Number(id) } : undefined
        }
      });
      if (!existing) break;

      // Nếu slug chỉ đang bị giữ bởi bài/trang đã đưa vào thùng rác,
      // đổi slug của bản trong thùng rác để URL hiện tại có thể dùng lại ngay.
      if (existing.status === 'TRASH') {
        await prisma.post.update({
          where: { id: existing.id },
          data: { slug: `${existing.slug}__trashed_${existing.id}` }
        });
        break;
      }

      finalSlug = `${requestedSlug}-${counter}`;
      counter++;
    }
    
    // Process tags relations
    const tagConnects: { id: number }[] = [];
    if (Array.isArray(tags) && type !== 'PAGE') {
      for (const tagName of tags) {
        const cleanName = tagName.trim();
        if (!cleanName) continue;
        const tagSlug = generateSlug(cleanName);
        const tag = await prisma.tag.upsert({
          where: { slug: tagSlug },
          update: {},
          create: { name: cleanName, slug: tagSlug }
        });
        tagConnects.push({ id: tag.id });
      }
    }

    // Process default category if none is selected
    let finalCategoryIds = categoryIds;
    if (type !== 'PAGE') {
      if (!finalCategoryIds || !Array.isArray(finalCategoryIds) || finalCategoryIds.length === 0) {
        // Try to load from settings
        const defaultCatSetting = await prisma.setting.findUnique({
          where: { key: 'default_category_id' }
        });
        
        let defaultCat = null;
        if (defaultCatSetting && defaultCatSetting.value) {
          defaultCat = await prisma.category.findUnique({
            where: { id: Number(defaultCatSetting.value) }
          });
        }
        
        if (!defaultCat) {
          defaultCat = await prisma.category.findFirst({
            where: { slug: 'chua-phan-loai' }
          });
        }
        if (!defaultCat) {
          defaultCat = await prisma.category.findFirst();
        }
        if (!defaultCat) {
          defaultCat = await prisma.category.create({
            data: {
              name: 'Chưa phân loại',
              slug: 'chua-phan-loai',
              description: 'Danh mục mặc định khi không chọn danh mục'
            }
          });
        }
        finalCategoryIds = [defaultCat.id];
      }
    }

    // Hook: CONTENT_BEFORE_SAVE
    const beforeSavePayload = await hooks.applyFilters(CORE_HOOKS.CONTENT_BEFORE_SAVE, {
      title,
      slug: finalSlug,
      excerpt,
      seoTitle,
      seoDescription,
      seoKeywords
    }, body);

    if (beforeSavePayload) {
      if (beforeSavePayload.title) title = beforeSavePayload.title;
      if (beforeSavePayload.slug) finalSlug = beforeSavePayload.slug;
      if (beforeSavePayload.excerpt !== undefined) excerpt = beforeSavePayload.excerpt;
      if (beforeSavePayload.seoTitle !== undefined) seoTitle = beforeSavePayload.seoTitle;
      if (beforeSavePayload.seoDescription !== undefined) seoDescription = beforeSavePayload.seoDescription;
      if (beforeSavePayload.seoKeywords !== undefined) seoKeywords = beforeSavePayload.seoKeywords;
    }

    let post;

    if (id) {
      // Create revision from pre-updated state
      const currentPost = await prisma.post.findUnique({
        where: { id: Number(id) }
      });
      if (currentPost) {
        const isDifferent =
          currentPost.title !== title ||
          currentPost.content !== content ||
          currentPost.slug !== finalSlug;

        if (isDifferent) {
          await createRevision(
            currentPost.id,
            currentPost.title,
            currentPost.content,
            currentPost.slug
          );
        }

        // If slug changed, create an automatic 301 Redirect record
        if (currentPost.slug !== finalSlug) {
          try {
            const structureSetting = await prisma.setting.findUnique({
              where: { key: 'permalink_structure' }
            });
            const structure = structureSetting?.value || '/%postname%.html';
            
            const oldUrl = generatePostUrl(currentPost, structure);
            const newUrl = generatePostUrl({ ...currentPost, slug: finalSlug }, structure);

            if (oldUrl !== newUrl) {
              await prisma.redirect.upsert({
                where: { oldUrl },
                update: { newUrl, postId: currentPost.id },
                create: { oldUrl, newUrl, postId: currentPost.id }
              });
            }
          } catch (err) {
            console.error("Error creating redirect on slug change:", err);
          }
        }
      }

      const parseDate = (dateVal: any): Date | undefined => {
        if (!dateVal) return undefined;
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return undefined;
        return d;
      };

      post = await prisma.post.update({
        where: { id: Number(id) },
        data: {
          title,
          slug: finalSlug,
          excerpt,
          content,
          status: isPublish ? 'PUBLISHED' : 'DRAFT',
          type: type || undefined,
          parentId: parentId !== undefined ? (parentId ? Number(parentId) : null) : undefined,
          featuredImageId: featuredImageId ? Number(featuredImageId) : null,
          visibility: visibility || undefined,
          publishedAt: parseDate(publishedAt),
          seoTitle,
          seoDescription,
          seoKeywords,
          builderData,
          pageLayout: pageLayout || undefined,
          contentWidth: contentWidth || undefined,
          contentMaxWidth: contentMaxWidth !== undefined ? contentMaxWidth : undefined,
          categories: type === 'PAGE' ? { set: [] } : {
            set: finalCategoryIds.map((catId: any) => ({ id: Number(catId) }))
          },
          tags: type === 'PAGE' ? { set: [] } : (Array.isArray(tags) ? {
            set: tagConnects
          } : undefined)
        }
      });
    } else {
      const parseDate = (dateVal: any): Date | undefined => {
        if (!dateVal) return undefined;
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return undefined;
        return d;
      };

      post = await prisma.post.create({
        data: {
          title,
          slug: finalSlug,
          excerpt,
          content,
          status: isPublish ? 'PUBLISHED' : 'DRAFT',
          type: type || 'POST',
          parentId: parentId ? Number(parentId) : null,
          authorId: sessionUser.id,
          featuredImageId: featuredImageId ? Number(featuredImageId) : null,
          visibility: visibility || 'PUBLIC',
          publishedAt: parseDate(publishedAt) || new Date(),
          seoTitle,
          seoDescription,
          seoKeywords,
          builderData,
          pageLayout: pageLayout || 'THEME_DEFAULT',
          contentWidth: contentWidth || 'BOXED',
          contentMaxWidth: contentMaxWidth || '1200px',
          categories: type === 'PAGE' ? undefined : {
            connect: finalCategoryIds.map((catId: any) => ({ id: Number(catId) }))
          },
          tags: (type === 'PAGE' || tagConnects.length === 0) ? undefined : {
            connect: tagConnects
          }
        }
      });
    }

    // Create PageRevision if this is a PAGE or has builderData
    if (post && (post.type === 'PAGE' || builderData)) {
      const count = await prisma.pageRevision.count({
        where: { postId: post.id },
      });
      await prisma.pageRevision.create({
        data: {
          postId: post.id,
          version: count + 1,
          revisionName: revisionName || null,
          builderData: builderData || post.builderData || '',
          htmlContent: content || post.content || '',
          cssContent: null,
          isStarred: Boolean(isStarred),
          commitMessage: commitMessage || (post.status === 'PUBLISHED' ? 'Xuất bản trang' : 'Cập nhật bản nháp'),
          createdById: sessionUser.id,
        },
      });

      // Clear any temporary autosave for this post
      await prisma.pageAutosave.deleteMany({
        where: { postId: post.id },
      });
    }

    if (post.type === 'PRODUCT') {
      await saveProductMeta(post, body);
    }

    // Run hook: post.afterSave (action)
    hooks.doAction(CORE_HOOKS.CONTENT_AFTER_SAVE, post, body).catch(err => console.error(err));

    // Run hook: post.afterPublish (action) — chỉ khi publish
    if (post.status === 'PUBLISHED') {
      hooks.doAction(CORE_HOOKS.CONTENT_AFTER_PUBLISH, post, body).catch(err => console.error(err));
    }

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('Error saving post:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get('type');
    const searchParam = searchParams.get('search');
    const limitParam = searchParams.get('limit');
    
    const where: any = {};
    if (typeParam) where.type = typeParam;
    if (searchParam) {
      where.title = { contains: searchParam, mode: 'insensitive' };
    }
    
    const posts = await prisma.post.findMany({
      where,
      take: limitParam ? parseInt(limitParam) : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        featuredImage: true,
        categories: true,
        tags: true,
        parent: true,
      }
    });
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
