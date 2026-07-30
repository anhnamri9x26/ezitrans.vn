import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_media');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý media' }, { status: 403 });
    }

    const { id } = await params;
    
    // 1. Find the media record
    const media = await prisma.media.findUnique({
      where: { id: Number(id) }
    });

    if (!media) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tệp tin phương tiện' }, { status: 404 });
    }

    // 2. Resolve absolute physical file path
    // relative url: e.g. /uploads/123456-file.png
    const physicalPath = path.join(process.cwd(), 'public', media.url);

    // 3. Try to physically delete the file and its cropped versions from disk
    const dotIndex = physicalPath.lastIndexOf('.');
    const baseUnique = dotIndex !== -1 ? physicalPath.substring(0, dotIndex) : physicalPath;
    const extUnique = dotIndex !== -1 ? physicalPath.substring(dotIndex) : '';

    const filesToDelete = [
      physicalPath,
      `${baseUnique}-150x150${extUnique}`,
      `${baseUnique}-300x300${extUnique}`,
      `${baseUnique}-1024x1024${extUnique}`
    ];

    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn(`Physical file not found or failed to delete: ${filePath}`);
      }
    }

    // 4. Delete the media record from database
    await prisma.media.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true, message: 'Đã xóa tệp tin đa phương tiện vĩnh viễn' });
  } catch (error: any) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
