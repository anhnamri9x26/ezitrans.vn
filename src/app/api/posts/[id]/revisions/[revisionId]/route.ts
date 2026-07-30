import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reconstructRevisions } from '@/lib/diff';
import { createRevision, deleteRevisions } from '@/lib/revisions';
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
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  try {
    const authError = await checkAuth();
    if (authError) return authError;

    const { id, revisionId } = await params;
    const revisions = await prisma.revision.findMany({
      where: { postId: Number(id) },
      orderBy: { createdAt: 'desc' },
    });

    const reconstructed = reconstructRevisions(revisions);
    const revision = reconstructed.find(r => r.id === Number(revisionId));

    if (!revision) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản sửa đổi' }, { status: 404 });
    }

    return NextResponse.json({ success: true, revision });
  } catch (error) {
    console.error('Error fetching revision details:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  try {
    const authError = await checkAuth();
    if (authError) return authError;

    const { id, revisionId } = await params;

    // 1. Fetch and reconstruct revisions to find the full content of the target revision
    const revisions = await prisma.revision.findMany({
      where: { postId: Number(id) },
      orderBy: { createdAt: 'desc' },
    });
    
    const reconstructed = reconstructRevisions(revisions);
    const revision = reconstructed.find(r => r.id === Number(revisionId));

    if (!revision) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản sửa đổi' }, { status: 404 });
    }

    // 2. Fetch the current post (before restore) to save it as a revision
    const currentPost = await prisma.post.findUnique({
      where: { id: Number(id) },
    });

    if (!currentPost) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài viết' }, { status: 404 });
    }

    // 3. Create a revision for the current state (so the user can undo this restore)
    await createRevision(
      currentPost.id,
      currentPost.title,
      currentPost.content,
      currentPost.slug
    );

    // 4. Restore the post properties
    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: {
        title: revision.title,
        content: revision.content,
        slug: revision.slug,
      },
    });

    return NextResponse.json({ success: true, post: updatedPost, message: 'Khôi phục bài viết thành công' });
  } catch (error) {
    console.error('Error restoring revision:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  try {
    const authError = await checkAuth();
    if (authError) return authError;

    const { id, revisionId } = await params;

    await deleteRevisions(Number(id), [Number(revisionId)]);

    return NextResponse.json({ success: true, message: 'Xóa bản sửa đổi thành công' });
  } catch (error) {
    console.error('Error deleting revision:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
