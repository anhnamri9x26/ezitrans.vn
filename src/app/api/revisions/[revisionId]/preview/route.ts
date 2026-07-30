import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const { revisionId } = await params;

    const revision = await prisma.pageRevision.findUnique({
      where: { id: revisionId },
    });

    if (!revision) {
      return new Response('Không tìm thấy bản lưu chỉnh sửa', { status: 404 });
    }

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Xem trước bản lưu v${revision.version}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            background-color: #ffffff;
            color: #1e293b;
          }
        </style>
        ${revision.cssContent ? `<style>${revision.cssContent}</style>` : ''}
      </head>
      <body>
        ${revision.htmlContent}
      </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src * data:; font-src https: data:;",
      },
    });
  } catch (error: any) {
    console.error('Error generating revision preview HTML:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
