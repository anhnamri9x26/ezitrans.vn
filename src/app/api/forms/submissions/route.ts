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
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const perPage = Math.min(100, Math.max(10, Number(searchParams.get('perPage')) || 25));
    const search = (searchParams.get('search') || '').trim().slice(0, 200);
    const formId = (searchParams.get('formId') || '').trim().slice(0, 100);
    const where = {
      ...(formId ? { formId } : {}),
      ...(search ? { OR: [{ formName: { contains: search } }, { data: { contains: search } }, { pageUrl: { contains: search } }] } : {}),
    };
    const [submissions, total] = await prisma.$transaction([
      prisma.formSubmission.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
      prisma.formSubmission.count({ where }),
    ]);
    return NextResponse.json({ success: true, submissions, pagination: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) } });
  } catch (error) {
    console.error('GET form submissions error', error);
    return NextResponse.json({ success: false, error: 'Không thể tải phản hồi.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!await authorize()) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const rawId = new URL(req.url).searchParams.get('id') || '';
    if (!/^\d+$/.test(rawId) || Number(rawId) < 1) return NextResponse.json({ success: false, error: 'ID không hợp lệ.' }, { status: 400 });
    await prisma.formSubmission.delete({ where: { id: Number(rawId) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE form submission error', error);
    return NextResponse.json({ success: false, error: 'Không thể xóa phản hồi.' }, { status: 500 });
  }
}
