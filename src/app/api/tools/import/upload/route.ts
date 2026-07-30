import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

export const dynamic = 'force-dynamic';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'imports');

// POST: Tải lên file SQL hoặc WordPress WXR/XML vào /storage/imports/
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_tools');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền sử dụng công cụ' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename') || 'uploaded-wordpress-export.xml';
    
    // Đảm bảo tạo thư mục lưu trữ nếu chưa có
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }

    const safeFilename = path.basename(filename);
    const extension = path.extname(safeFilename).toLowerCase();
    if (!['.sql', '.xml'].includes(extension)) {
      return NextResponse.json({ success: false, error: 'Chỉ hỗ trợ file .sql hoặc WordPress .xml/WXR' }, { status: 400 });
    }

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const head = buffer.subarray(0, Math.min(buffer.length, 64 * 1024)).toString('utf8');
    const isWxr = extension === '.xml' && /<wp:wxr_version>\s*1\.[12]\s*<\/wp:wxr_version>/i.test(head);
    const isSql = extension === '.sql' && /(CREATE\s+TABLE|INSERT\s+INTO|--\s+(MySQL|MariaDB))/i.test(head);
    if (!isWxr && !isSql) {
      return NextResponse.json({ success: false, error: extension === '.xml' ? 'File XML không phải WordPress WXR hợp lệ.' : 'File không có cấu trúc SQL hợp lệ.' }, { status: 400 });
    }

    const destPath = path.join(STORAGE_DIR, safeFilename);
    fs.writeFileSync(destPath, buffer);

    return NextResponse.json({
      success: true,
      message: `Đã tải lên tệp ${isWxr ? 'WordPress WXR/XML' : 'SQL'} thành công!`,
      filename: safeFilename,
      format: isWxr ? 'xml' : 'sql',
      path: destPath.replace(/\\/g, '/')
    });
  } catch (err: any) {
    console.error('File upload write error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 550 });
  }
}

// DELETE: Xóa file SQL backup khỏi thư mục lưu trữ
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_tools');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền sử dụng công cụ' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ success: false, error: 'Thiếu tên file cần xóa' }, { status: 400 });
    }

    const safeFilename = path.basename(filename);
    const targetPath = path.join(STORAGE_DIR, safeFilename);

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy file trên máy chủ' }, { status: 404 });
    }

    fs.unlinkSync(targetPath);
    console.log(`Deleted WordPress import file: ${targetPath}`);

    return NextResponse.json({
      success: true,
      message: `Đã xóa file import thành công!`
    });
  } catch (err: any) {
    console.error('File deletion error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 550 });
  }
}
