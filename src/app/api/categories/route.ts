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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'POST') as any;
    const includeCounts = searchParams.get('counts') === 'true';

    let categories = await prisma.category.findMany({
      where: { type },
      orderBy: { name: 'asc' },
      ...(includeCounts && {
        include: {
          _count: {
            select: { posts: true }
          }
        }
      })
    });

    // Seeding default categories if database is empty and type is POST
    if (categories.length === 0 && type === 'POST') {
      const defaults = [
        { name: 'Chưa phân loại', slug: 'chua-phan-loai', description: 'Danh mục mặc định' },
        { name: 'Hướng dẫn chia sẻ', slug: 'huong-dan-chia-se' },
        { name: 'Chuyển hàng về VN', slug: 'chuyen-hang-ve-vn' },
        { name: 'Dịch vụ order', slug: 'dich-vu-order' }
      ];

      for (const item of defaults) {
        await prisma.category.create({
          data: item
        });
      }

      categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        ...(includeCounts && {
          include: {
            _count: {
              select: { posts: true }
            }
          }
        })
      });
    } else {
      // Ensure "Chưa phân loại" always exists
      const uncategorized = await prisma.category.findUnique({
        where: { slug: 'chua-phan-loai' }
      });
      if (!uncategorized && type === 'POST') {
        await prisma.category.create({
          data: {
            name: 'Chưa phân loại',
            slug: 'chua-phan-loai',
            description: 'Danh mục mặc định'
          }
        });
        categories = await prisma.category.findMany({
          where: { type },
          orderBy: { name: 'asc' },
          ...(includeCounts && {
            include: {
              _count: {
                select: { posts: true }
              }
            }
          })
        });
      }
    }

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_categories');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý danh mục' }, { status: 403 });
    }

    const body = await req.json();
    const { name, parentId, description, slug: customSlug, type = 'POST' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Tên danh mục không được để trống' }, { status: 400 });
    }

    let baseSlug = generateSlug(customSlug || name);
    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await prisma.category.findUnique({
        where: { slug }
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const category = await prisma.category.create({
      data: {
        type,
        name: name.trim(),
        slug,
        parentId: parentId ? Number(parentId) : null,
        description: description || null
      }
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
