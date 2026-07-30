import { NextResponse } from 'next/server';
import { resolveTemplates, ResolveContext } from '@/lib/templateResolver';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageType = searchParams.get('pageType');

    if (!pageType) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tham số pageType' },
        { status: 400 }
      );
    }

    const postId = searchParams.get('postId') ? Number(searchParams.get('postId')) : undefined;
    const postType = searchParams.get('postType') || undefined;
    const authorId = searchParams.get('authorId') ? Number(searchParams.get('authorId')) : undefined;

    // Parse categoryIds (e.g. categoryIds=1,2,3)
    const categoryIdsStr = searchParams.get('categoryIds');
    const categoryIds = categoryIdsStr
      ? categoryIdsStr.split(',').map((id) => Number(id.trim())).filter((id) => !isNaN(id))
      : undefined;

    // Parse tagIds (e.g. tagIds=4,5,6)
    const tagIdsStr = searchParams.get('tagIds');
    const tagIds = tagIdsStr
      ? tagIdsStr.split(',').map((id) => Number(id.trim())).filter((id) => !isNaN(id))
      : undefined;

    const context: ResolveContext = {
      pageType: pageType as any,
      postId: isNaN(postId as any) ? undefined : postId,
      postType,
      categoryIds,
      tagIds,
      authorId: isNaN(authorId as any) ? undefined : authorId,
    };

    const resolved = await resolveTemplates(context);

    return NextResponse.json({
      success: true,
      context,
      resolved: {
        header: resolved.header ? { id: resolved.header.id, name: resolved.header.name, componentFile: resolved.header.componentFile, isDefault: resolved.header.isDefault } : null,
        footer: resolved.footer ? { id: resolved.footer.id, name: resolved.footer.name, componentFile: resolved.footer.componentFile, isDefault: resolved.footer.isDefault } : null,
        body: resolved.body ? { id: resolved.body.id, name: resolved.body.name, componentFile: resolved.body.componentFile, isDefault: resolved.body.isDefault } : null,
      },
    });
  } catch (error: any) {
    console.error('Error resolving template preview:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
