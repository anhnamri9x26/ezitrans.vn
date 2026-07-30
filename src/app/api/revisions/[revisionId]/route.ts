import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

async function checkRevisionAccess(user: any, revision: any): Promise<boolean> {
  if (!user) return false;
  if (revision.postId) {
    return userCan(user, 'edit_posts');
  }
  if (revision.templateId) {
    return userCan(user, 'manage_templates');
  }
  return false;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { revisionId } = await params;

    const revision = await prisma.pageRevision.findUnique({
      where: { id: revisionId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!revision) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản lưu chỉnh sửa' }, { status: 404 });
    }

    const hasAccess = await checkRevisionAccess(user, revision);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền truy cập bản lưu chỉnh sửa này' }, { status: 403 });
    }

    return NextResponse.json({ success: true, revision });
  } catch (error: any) {
    console.error('Error fetching revision details:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { revisionId } = await params;
    const body = await req.json();
    const { action } = body;

    if (action !== 'restore' && action !== 'duplicate') {
      return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });
    }

    const revision = await prisma.pageRevision.findUnique({
      where: { id: revisionId },
    });

    if (!revision) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản lưu chỉnh sửa' }, { status: 404 });
    }

    const hasAccess = await checkRevisionAccess(user, revision);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền thao tác bản lưu chỉnh sửa này' }, { status: 403 });
    }

    const creator = user;

    if (action === 'duplicate') {
      const count = await prisma.pageRevision.count({
        where: revision.postId
          ? { postId: revision.postId }
          : { templateId: revision.templateId },
      });

      const duplicated = await prisma.pageRevision.create({
        data: {
          postId: revision.postId,
          templateId: revision.templateId,
          version: count + 1,
          revisionName: revision.revisionName ? `Bản sao của ${revision.revisionName}` : `Bản sao của v${revision.version}`,
          builderData: revision.builderData,
          htmlContent: revision.htmlContent,
          cssContent: revision.cssContent,
          commitMessage: `Nhân bản từ v${revision.version}${revision.revisionName ? ` (${revision.revisionName})` : ''}`,
          createdById: creator.id,
          isStarred: false,
        },
      });

      return NextResponse.json({
        success: true,
        revision: duplicated,
        message: `Nhân bản thành công thành v${duplicated.version}!`,
      });
    }

    // Action: restore
    let updatedPostOrTemplate;

    if (revision.postId) {
      // 2. Fetch the current post (before restore) to save as a backup revision
      const currentPost = await prisma.post.findUnique({
        where: { id: revision.postId },
      });

      if (!currentPost) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy trang' }, { status: 404 });
      }

      const count = await prisma.pageRevision.count({
        where: { postId: currentPost.id },
      });

      // Backup current state
      await prisma.pageRevision.create({
        data: {
          postId: currentPost.id,
          version: count + 1,
          revisionName: `Trước khi khôi phục v${revision.version}`,
          builderData: currentPost.builderData || '',
          htmlContent: currentPost.content || '',
          commitMessage: `Backup tự động trước khi khôi phục v${revision.version}`,
          createdById: creator.id,
        },
      });

      // Update Post
      updatedPostOrTemplate = await prisma.post.update({
        where: { id: currentPost.id },
        data: {
          builderData: revision.builderData,
          content: revision.htmlContent,
        },
      });

      // Create Reverted Version
      await prisma.pageRevision.create({
        data: {
          postId: currentPost.id,
          version: count + 2,
          revisionName: `Khôi phục từ v${revision.version}`,
          builderData: revision.builderData,
          htmlContent: revision.htmlContent,
          cssContent: revision.cssContent,
          commitMessage: `Đã khôi phục trạng thái từ bản lưu v${revision.version} (${revision.revisionName || 'Không tên'})`,
          createdById: creator.id,
        },
      });

      // Delete temporary autosaves
      await prisma.pageAutosave.deleteMany({
        where: { postId: currentPost.id },
      });

    } else if (revision.templateId) {
      // 2. Fetch current template
      const currentTemplate = await prisma.template.findUnique({
        where: { id: revision.templateId },
      });

      if (!currentTemplate) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy template' }, { status: 404 });
      }

      const count = await prisma.pageRevision.count({
        where: { templateId: currentTemplate.id },
      });

      // Backup current state
      await prisma.pageRevision.create({
        data: {
          templateId: currentTemplate.id,
          version: count + 1,
          revisionName: `Trước khi khôi phục v${revision.version}`,
          builderData: currentTemplate.builderData || '',
          htmlContent: currentTemplate.htmlContent || '',
          commitMessage: `Backup tự động trước khi khôi phục v${revision.version}`,
          createdById: creator.id,
        },
      });

      // Update Template
      updatedPostOrTemplate = await prisma.template.update({
        where: { id: currentTemplate.id },
        data: {
          builderData: revision.builderData,
          htmlContent: revision.htmlContent,
          cssContent: revision.cssContent,
        },
      });

      // Create Reverted Version
      await prisma.pageRevision.create({
        data: {
          templateId: currentTemplate.id,
          version: count + 2,
          revisionName: `Khôi phục từ v${revision.version}`,
          builderData: revision.builderData,
          htmlContent: revision.htmlContent,
          cssContent: revision.cssContent,
          commitMessage: `Đã khôi phục trạng thái từ bản lưu v${revision.version} (${revision.revisionName || 'Không tên'})`,
          createdById: creator.id,
        },
      });

      // Delete temporary autosaves
      await prisma.pageAutosave.deleteMany({
        where: { templateId: currentTemplate.id },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedPostOrTemplate,
      message: `Khôi phục thành công từ bản lưu v${revision.version}!`,
    });
  } catch (error: any) {
    console.error('Error restoring revision:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { revisionId } = await params;
    const revision = await prisma.pageRevision.findUnique({
      where: { id: revisionId }
    });

    if (!revision) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản lưu chỉnh sửa' }, { status: 404 });
    }

    const hasAccess = await checkRevisionAccess(user, revision);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền chỉnh sửa thông tin bản lưu này' }, { status: 403 });
    }

    const body = await req.json();
    const { revisionName, commitMessage, isStarred } = body;

    const updateData: any = {};
    if (revisionName !== undefined) updateData.revisionName = revisionName || null;
    if (commitMessage !== undefined) updateData.commitMessage = commitMessage || null;
    if (isStarred !== undefined) updateData.isStarred = Boolean(isStarred);

    const updated = await prisma.pageRevision.update({
      where: { id: revisionId },
      data: updateData,
    });

    return NextResponse.json({ success: true, revision: updated, message: 'Đã cập nhật thông tin thành công!' });
  } catch (error: any) {
    console.error('Error updating revision metadata:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { revisionId } = await params;
    const revision = await prisma.pageRevision.findUnique({
      where: { id: revisionId }
    });

    if (!revision) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bản lưu chỉnh sửa' }, { status: 404 });
    }

    const hasAccess = await checkRevisionAccess(user, revision);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền xóa bản lưu chỉnh sửa này' }, { status: 403 });
    }

    await prisma.pageRevision.delete({
      where: { id: revisionId },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa bản lưu chỉnh sửa thành công!' });
  } catch (error: any) {
    console.error('Error deleting revision:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
