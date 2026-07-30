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

    const logs = await prisma.fourOhFourLog.findMany({
      orderBy: [
        { visits: 'desc' },
        { updatedAt: 'desc' }
      ]
    });
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Error fetching 404 logs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authError = await checkAuth();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get('id');
    const clearAll = searchParams.get('clearAll');

    if (clearAll === 'true') {
      await prisma.fourOhFourLog.deleteMany();
      return NextResponse.json({ success: true, message: 'Đã xóa toàn bộ nhật ký lỗi 404!' });
    }
    
    if (!idStr) {
      return NextResponse.json({ success: false, error: 'Thiếu ID nhật ký 404' }, { status: 400 });
    }

    await prisma.fourOhFourLog.delete({
      where: { id: Number(idStr) }
    });

    return NextResponse.json({ success: true, message: 'Đã xóa nhật ký lỗi 404 thành công!' });
  } catch (error: any) {
    console.error('Error deleting 404 log:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
