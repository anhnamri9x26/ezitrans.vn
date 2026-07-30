import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

async function checkAuth() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const hasCap = await userCan(user, 'manage_seo');
  if (!hasCap) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function GET() {
  try {
    const authError = await checkAuth();
    if (authError) return authError;

    const redirects = await prisma.redirect.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, redirects });
  } catch (error: any) {
    console.error('Error fetching redirects:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authError = await checkAuth();
    if (authError) return authError;

    const { oldUrl, newUrl, statusCode } = await req.json();
    
    if (!oldUrl || !newUrl) {
      return NextResponse.json({ success: false, error: 'Vui lòng điền đầy đủ thông tin' }, { status: 400 });
    }

    // Standardize URL paths (leading slash)
    let cleanOld = oldUrl.trim();
    if (!cleanOld.startsWith('/') && !cleanOld.startsWith('http://') && !cleanOld.startsWith('https://')) {
      cleanOld = '/' + cleanOld;
    }
    let cleanNew = newUrl.trim();
    if (!cleanNew.startsWith('/') && !cleanNew.startsWith('http://') && !cleanNew.startsWith('https://')) {
      cleanNew = '/' + cleanNew;
    }

    // Prevent direct self loop redirect
    if (cleanOld.toLowerCase() === cleanNew.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Không thể chuyển hướng một trang về chính nó!' }, { status: 400 });
    }

    const redirect = await prisma.redirect.upsert({
      where: { oldUrl: cleanOld },
      update: {
        newUrl: cleanNew,
        statusCode: Number(statusCode || 301)
      },
      create: {
        oldUrl: cleanOld,
        newUrl: cleanNew,
        statusCode: Number(statusCode || 301)
      }
    });

    return NextResponse.json({ success: true, redirect });
  } catch (error: any) {
    console.error('Error creating redirect:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authError = await checkAuth();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get('id');
    
    if (!idStr) {
      return NextResponse.json({ success: false, error: 'Thiếu ID chuyển hướng' }, { status: 400 });
    }

    await prisma.redirect.delete({
      where: { id: Number(idStr) }
    });

    return NextResponse.json({ success: true, message: 'Đã xóa chuyển hướng thành công!' });
  } catch (error: any) {
    console.error('Error deleting redirect:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authError = await checkAuth();
    if (authError) return authError;

    const { id, active } = await req.json();
    
    if (id === undefined || active === undefined) {
      return NextResponse.json({ success: false, error: 'Thiếu ID hoặc trạng thái hoạt động' }, { status: 400 });
    }

    const redirect = await prisma.redirect.update({
      where: { id: Number(id) },
      data: { active: Boolean(active) }
    });

    return NextResponse.json({ success: true, redirect });
  } catch (error: any) {
    console.error('Error updating redirect active status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
