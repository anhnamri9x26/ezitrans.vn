import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

async function authorize() {
  const user = await getCurrentUser();
  return user && await userCan(user, 'view_form_submissions');
}

export async function GET(req: Request) {
  try {
    if (!await authorize()) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const limit = Math.min(30, Math.max(5, Number(new URL(req.url).searchParams.get('limit')) || 10));
    const [notifications, unreadCount] = await prisma.$transaction([
      prisma.adminNotification.findMany({ orderBy: { createdAt: 'desc' }, take: limit }),
      prisma.adminNotification.count({ where: { isRead: false } }),
    ]);
    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('GET admin notifications error', error);
    return NextResponse.json({ success: false, error: 'Không thể tải thông báo.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!await authorize()) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const now = new Date();
    if (body.all === true) {
      await prisma.$transaction([
        prisma.adminNotification.updateMany({ where: { isRead: false }, data: { isRead: true, readAt: now } }),
        prisma.formSubmission.updateMany({ where: { isRead: false }, data: { isRead: true, readAt: now } }),
      ]);
      return NextResponse.json({ success: true });
    }
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ success: false, error: 'ID không hợp lệ.' }, { status: 400 });
    const notification = await prisma.adminNotification.findUnique({ where: { id } });
    if (!notification) return NextResponse.json({ success: false, error: 'Không tìm thấy thông báo.' }, { status: 404 });
    await prisma.$transaction(async tx => {
      await tx.adminNotification.update({ where: { id }, data: { isRead: true, readAt: now } });
      if (notification.type === 'form_submission' && notification.referenceId && /^\d+$/.test(notification.referenceId)) {
        await tx.formSubmission.updateMany({ where: { id: Number(notification.referenceId) }, data: { isRead: true, readAt: now } });
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH admin notifications error', error);
    return NextResponse.json({ success: false, error: 'Không thể cập nhật thông báo.' }, { status: 500 });
  }
}
