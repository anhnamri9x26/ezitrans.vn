import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const catId = Number(id);

    const category = await prisma.category.findUnique({
      where: { id: catId }
    });

    if (!category) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy danh mục' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_categories');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý danh mục' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, parentId, description, slug: customSlug } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Tên danh mục không được để trống' }, { status: 400 });
    }

    // Check if category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: Number(id) }
    });

    if (!categoryExists) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy danh mục' }, { status: 404 });
    }

    let baseSlug = generateSlug(customSlug || name);
    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await prisma.category.findFirst({
        where: {
          slug,
          NOT: { id: Number(id) }
        }
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Prevent recursive parenting (setting a category as a child of its child, or child of itself)
    if (parentId && Number(parentId) === Number(id)) {
      return NextResponse.json({ success: false, error: 'Không thể chọn chính danh mục làm danh mục cha' }, { status: 400 });
    }

    if (categoryExists.slug !== slug) {
      try {
        const oldUrl = `/category/${categoryExists.slug}`;
        const newUrl = `/category/${slug}`;
        if (oldUrl !== newUrl) {
          await prisma.redirect.upsert({
            where: { oldUrl },
            update: { newUrl },
            create: { oldUrl, newUrl }
          });
        }
      } catch (err) {
        console.error("Error creating redirect on category slug change:", err);
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        name: name.trim(),
        slug,
        parentId: parentId ? Number(parentId) : null,
        description: description || null
      }
    });

    return NextResponse.json({ success: true, category: updatedCategory });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_categories');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý danh mục' }, { status: 403 });
    }

    const { id } = await params;
    const catId = Number(id);

    // Check if category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: catId }
    });

    if (!categoryExists) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy danh mục' }, { status: 404 });
    }

    // Check if this category is currently set as default category in settings
    const defaultCatSetting = await prisma.setting.findUnique({
      where: { key: 'default_category_id' }
    });
    if (defaultCatSetting && Number(defaultCatSetting.value) === catId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Không thể xóa danh mục mặc định của hệ thống. Vui lòng thiết lập danh mục mặc định khác trong phần Cài đặt trước.' 
      }, { status: 400 });
    }

    // Find all posts that are connected to this category
    const postsInCat = await prisma.post.findMany({
      where: {
        categories: {
          some: { id: catId }
        }
      },
      include: {
        categories: true
      }
    });

    // 1. Orphan child categories (set parentId to null)
    await prisma.category.updateMany({
      where: { parentId: catId },
      data: { parentId: null }
    });

    // 2. Delete the category (Prisma will automatically clean up the join table relation rows)
    await prisma.category.delete({
      where: { id: catId }
    });

    // 3. For any post that was connected to this category, check if it now has no categories left
    // Get default category ID
    let defaultCatId = 7; // Fallback to our seeded Uncategorized
    if (defaultCatSetting && defaultCatSetting.value) {
      defaultCatId = Number(defaultCatSetting.value);
    } else {
      const defaultCat = await prisma.category.findFirst({
        where: { slug: 'chua-phan-loai' }
      });
      if (defaultCat) defaultCatId = defaultCat.id;
    }

    for (const post of postsInCat) {
      const hasOtherCategories = post.categories.some((c: { id: number }) => c.id !== catId);
      if (!hasOtherCategories) {
        // Connect the post to the default category so it doesn't become category-less
        await prisma.post.update({
          where: { id: post.id },
          data: {
            categories: {
              connect: { id: defaultCatId }
            }
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Đã xóa danh mục thành công' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
