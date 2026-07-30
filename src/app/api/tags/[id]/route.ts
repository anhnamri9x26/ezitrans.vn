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
    const tagId = Number(id);

    const tag = await prisma.tag.findUnique({
      where: { id: tagId }
    });

    if (!tag) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thẻ' }, { status: 404 });
    }

    return NextResponse.json({ success: true, tag });
  } catch (error: any) {
    console.error('Error fetching tag:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_tags');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý thẻ' }, { status: 403 });
    }

    const { id } = await params;
    const tagId = Number(id);
    const body = await req.json();
    const { name, slug: customSlug } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Tên thẻ không được để trống' }, { status: 400 });
    }

    // Check if tag exists
    const tagExists = await prisma.tag.findUnique({
      where: { id: tagId }
    });

    if (!tagExists) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thẻ' }, { status: 404 });
    }

    let baseSlug = generateSlug(customSlug || name);
    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await prisma.tag.findFirst({
        where: {
          slug,
          NOT: { id: tagId }
        }
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    if (tagExists.slug !== slug) {
      try {
        const oldUrl = `/tag/${tagExists.slug}`;
        const newUrl = `/tag/${slug}`;
        if (oldUrl !== newUrl) {
          await prisma.redirect.upsert({
            where: { oldUrl },
            update: { newUrl },
            create: { oldUrl, newUrl }
          });
        }
      } catch (err) {
        console.error("Error creating redirect on tag slug change:", err);
      }
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        name: name.trim(),
        slug
      }
    });

    return NextResponse.json({ success: true, tag: updatedTag });
  } catch (error: any) {
    console.error('Error updating tag:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_tags');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý thẻ' }, { status: 403 });
    }

    const { id } = await params;
    const tagId = Number(id);

    // Check if tag exists
    const tagExists = await prisma.tag.findUnique({
      where: { id: tagId }
    });

    if (!tagExists) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thẻ' }, { status: 404 });
    }

    // Delete the tag
    await prisma.tag.delete({
      where: { id: tagId }
    });

    return NextResponse.json({ success: true, message: 'Đã xóa thẻ thành công' });
  } catch (error: any) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
