import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePostUrl } from '@/lib/permalink';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { hooks } from '@/lib/hooks';
import { CORE_HOOKS } from '@/lib/hooks/coreHooks';
import { attachProductMeta } from '@/plugins/lexi-commerce/server/productMeta';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
      include: {
        featuredImage: true,
        categories: true,
        tags: true,
      }
    });

    if (!post) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài viết' }, { status: 404 });
    }

    let fetchedPost: any = post;
    if (fetchedPost.type === 'PRODUCT') {
      fetchedPost = await attachProductMeta(fetchedPost);
    }
    fetchedPost = await hooks.applyFilters(CORE_HOOKS.CONTENT_FETCHED, fetchedPost);

    return NextResponse.json({ success: true, post: fetchedPost });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { id } = await params;
    
    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: Number(id) }
    });

    if (!post) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài viết' }, { status: 404 });
    }

    const isPage = post.type === 'PAGE';
    const isProduct = post.type === 'PRODUCT';
    const { searchParams } = new URL(req.url);
    const forceDelete = searchParams.get('force') === 'true';
    const requiredCap = isPage ? 'delete_pages' : isProduct ? 'delete_products' : 'delete_posts';

    const hasCap = await userCan(sessionUser, requiredCap);
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền thực hiện hành động này' }, { status: 403 });
    }

    // Check ownership for non-page content. Products use product capabilities.
    if (!isPage && post.authorId !== sessionUser.id) {
      const canEditOthers = await userCan(sessionUser, isProduct ? 'edit_products' : 'edit_others_posts');
      if (!canEditOthers) {
        return NextResponse.json({ success: false, error: 'Bạn không có quyền xóa mục của người khác' }, { status: 403 });
      }
    }

    if (!forceDelete) {
      await prisma.post.update({
        where: { id: Number(id) },
        data: {
          status: 'TRASH',
          slug: `${post.slug}__trashed_${post.id}`
        }
      });

      return NextResponse.json({ success: true, message: 'Đã chuyển vào thùng rác' });
    }

    // Only permanent delete records a 410 Gone SEO history entry.
    try {
      const structureSetting = await prisma.setting.findUnique({
        where: { key: 'permalink_structure' }
      });
      const productBaseSetting = await prisma.setting.findUnique({
        where: { key: 'permalink_product_base' }
      });
      const structure = structureSetting?.value || '/%postname%.html';
      const productBase = productBaseSetting?.value || 'product';
      const postUrl = generatePostUrl(post, structure, productBase);

      await prisma.deletedPostHistory.upsert({
        where: { url: postUrl },
        update: { title: post.title },
        create: { url: postUrl, title: post.title }
      });
    } catch (err) {
      console.error("Error creating DeletedPostHistory record:", err);
    }

    await prisma.post.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true, message: 'Đã xóa vĩnh viễn' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
