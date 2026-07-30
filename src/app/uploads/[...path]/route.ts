import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

interface UploadRouteContext {
  params: Promise<{
    path?: string[];
  }>;
}

export async function GET(_req: NextRequest, context: UploadRouteContext) {
  try {
    const { path: pathSegments = [] } = await context.params;

    if (pathSegments.length === 0) {
      return new NextResponse('Not found', { status: 404 });
    }

    const contentDir = process.env.CONTENT_DIR || path.join(process.cwd(), 'content');
    const uploadDir = path.resolve(contentDir, 'uploads');
    const requestedPath = path.resolve(uploadDir, ...pathSegments);

    if (!requestedPath.startsWith(uploadDir + path.sep)) {
      return new NextResponse('Invalid path', { status: 400 });
    }

    const fileBuffer = await fs.readFile(requestedPath);
    const ext = path.extname(requestedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new NextResponse('Not found', { status: 404 });
    }

    console.error('Error serving uploaded file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
