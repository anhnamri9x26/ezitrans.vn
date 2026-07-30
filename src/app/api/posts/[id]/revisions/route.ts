import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reconstructRevisions } from '@/lib/diff';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

async function checkAuth() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const hasCap = await userCan(user, 'edit_posts');
  if (!hasCap) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await checkAuth();
    if (authError) return authError;

    const { id } = await params;
    const revisions = await prisma.revision.findMany({
      where: { postId: Number(id) },
      orderBy: { createdAt: 'desc' },
    });
    
    // Reconstruct delta-compressed revisions
    const reconstructedRevisions = reconstructRevisions(revisions);
    
    return NextResponse.json({ success: true, revisions: reconstructedRevisions });
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await checkAuth();
    if (authError) return authError;

    const { id } = await params;
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Danh sách ID không hợp lệ' }, { status: 400 });
    }

    const { deleteRevisions } = await import('@/lib/revisions');
    await deleteRevisions(Number(id), ids.map(Number));

    return NextResponse.json({ success: true, message: 'Xóa các bản sửa đổi thành công' });
  } catch (error) {
    console.error('Error deleting revisions:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
