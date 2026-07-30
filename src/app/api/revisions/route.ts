import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    const templateId = searchParams.get('templateId');

    if (!postId && !templateId) {
      return NextResponse.json({ success: false, error: 'Thiếu postId hoặc templateId' }, { status: 400 });
    }

    if (postId) {
      const hasCap = await userCan(user, 'edit_posts');
      if (!hasCap) {
        return NextResponse.json({ success: false, error: 'Bạn không có quyền truy cập lịch sử chỉnh sửa bài viết' }, { status: 403 });
      }
    } else if (templateId) {
      const hasCap = await userCan(user, 'manage_templates');
      if (!hasCap) {
        return NextResponse.json({ success: false, error: 'Bạn không có quyền truy cập lịch sử chỉnh sửa template' }, { status: 403 });
      }
    }

    const whereClause: any = {};
    if (postId) {
      whereClause.postId = Number(postId);
    } else if (templateId) {
      whereClause.templateId = Number(templateId);
    }

    const revisions = await prisma.pageRevision.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, revisions });
  } catch (error: any) {
    console.error('Error fetching revisions list:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      postId,
      templateId,
      revisionName,
      builderData,
      htmlContent,
      cssContent,
      isStarred,
      commitMessage,
    } = body;

    if (!postId && !templateId) {
      return NextResponse.json({ success: false, error: 'Thiếu postId hoặc templateId' }, { status: 400 });
    }
    if (!builderData || !htmlContent) {
      return NextResponse.json({ success: false, error: 'Thiếu builderData hoặc htmlContent' }, { status: 400 });
    }

    const creator = await getCurrentUser();
    if (!creator) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    if (postId) {
      const hasCap = await userCan(creator, 'edit_posts');
      if (!hasCap) {
        return NextResponse.json({ success: false, error: 'Bạn không có quyền lưu lịch sử chỉnh sửa bài viết' }, { status: 403 });
      }
    } else if (templateId) {
      const hasCap = await userCan(creator, 'manage_templates');
      if (!hasCap) {
        return NextResponse.json({ success: false, error: 'Bạn không có quyền lưu lịch sử chỉnh sửa template' }, { status: 403 });
      }
    }

    // Determine new version number (count current revisions + 1)
    const whereClause: any = {};
    if (postId) {
      whereClause.postId = Number(postId);
    } else {
      whereClause.templateId = Number(templateId);
    }

    const count = await prisma.pageRevision.count({
      where: whereClause,
    });
    const newVersion = count + 1;

    const newRevision = await prisma.pageRevision.create({
      data: {
        postId: postId ? Number(postId) : null,
        templateId: templateId ? Number(templateId) : null,
        version: newVersion,
        revisionName: revisionName || null,
        builderData,
        htmlContent,
        cssContent: cssContent || null,
        isStarred: Boolean(isStarred),
        commitMessage: commitMessage || null,
        createdById: creator?.id || null,
      },
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

    // Enforce a sensible limit of 50 permanent revisions to prevent database bloating
    const revisions = await prisma.pageRevision.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    if (revisions.length > 50) {
      // Keep starred revisions, delete unstarred oldest ones first
      const oldestRevisions = revisions.slice(50);
      const deleteIds = oldestRevisions
        .filter((r: (typeof oldestRevisions)[number]) => !r.isStarred)
        .map((r: (typeof oldestRevisions)[number]) => r.id);

      if (deleteIds.length > 0) {
        await prisma.pageRevision.deleteMany({
          where: { id: { in: deleteIds } },
        });
      }
    }

    return NextResponse.json({ success: true, revision: newRevision, message: 'Đã tạo bản lưu chỉnh sửa thành công!' });
  } catch (error: any) {
    console.error('Error creating revision:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
