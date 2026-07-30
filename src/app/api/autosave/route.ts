import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    const templateId = searchParams.get('templateId');

    if (postId) {
      const pId = Number(postId);
      const autosave = await prisma.pageAutosave.findUnique({
        where: { postId_userId: { postId: pId, userId: user.id } },
      });
      if (autosave) {
        const post = await prisma.post.findUnique({
          where: { id: pId },
          select: { updatedAt: true },
        });
        const isNewer = post ? new Date(autosave.updatedAt) > new Date(post.updatedAt) : true;
        return NextResponse.json({ success: true, hasAutosave: isNewer, autosave });
      }
    } else if (templateId) {
      const tId = Number(templateId);
      const autosave = await prisma.pageAutosave.findUnique({
        where: { templateId_userId: { templateId: tId, userId: user.id } },
      });
      if (autosave) {
        const template = await prisma.template.findUnique({
          where: { id: tId },
          select: { updatedAt: true },
        });
        const isNewer = template ? new Date(autosave.updatedAt) > new Date(template.updatedAt) : true;
        return NextResponse.json({ success: true, hasAutosave: isNewer, autosave });
      }
    } else {
      // New post autosave
      const autosave = await prisma.pageAutosave.findFirst({
        where: { userId: user.id, postId: null, templateId: null },
      });
      if (autosave) {
        return NextResponse.json({ success: true, hasAutosave: true, autosave });
      }
    }

    return NextResponse.json({ success: true, hasAutosave: false });
  } catch (error: any) {
    console.error('Error fetching autosave:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { postId, templateId, title, slug, content, visibility, publishedAt, builderData, htmlContent } = body;

    const dataPayload = {
      title,
      slug,
      content,
      visibility,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      builderData,
      htmlContent,
    };

    if (postId) {
      const pId = Number(postId);
      await prisma.pageAutosave.upsert({
        where: { postId_userId: { postId: pId, userId: user.id } },
        update: dataPayload,
        create: { postId: pId, userId: user.id, ...dataPayload },
      });
    } else if (templateId) {
      const tId = Number(templateId);
      await prisma.pageAutosave.upsert({
        where: { templateId_userId: { templateId: tId, userId: user.id } },
        update: dataPayload,
        create: { templateId: tId, userId: user.id, ...dataPayload },
      });
    } else {
      // New post autosave
      const existing = await prisma.pageAutosave.findFirst({
        where: { userId: user.id, postId: null, templateId: null },
      });
      if (existing) {
        await prisma.pageAutosave.update({
          where: { id: existing.id },
          data: dataPayload,
        });
      } else {
        await prisma.pageAutosave.create({
          data: { userId: user.id, ...dataPayload },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Đã tự động lưu thành công!' });
  } catch (error: any) {
    console.error('Error saving autosave:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    const templateId = searchParams.get('templateId');

    if (postId) {
      await prisma.pageAutosave.deleteMany({
        where: { postId: Number(postId), userId: user.id },
      });
    } else if (templateId) {
      await prisma.pageAutosave.deleteMany({
        where: { templateId: Number(templateId), userId: user.id },
      });
    } else {
      await prisma.pageAutosave.deleteMany({
        where: { postId: null, templateId: null, userId: user.id },
      });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa bản tự động lưu!' });
  } catch (error: any) {
    console.error('Error deleting autosave:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
