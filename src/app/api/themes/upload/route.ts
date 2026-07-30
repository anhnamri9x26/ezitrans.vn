import { NextResponse } from 'next/server';
import { requireAdminFromCookies } from '@/lib/zipSecurity';
import { installRuntimePackage } from '@/lib/updates/runtimePackageInstaller';

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const auth = await requireAdminFromCookies(cookieHeader);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Admin mới có quyền cài đặt theme!' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Không có file được upload!' }, { status: 400 });
    }

    const result = await installRuntimePackage({
      file,
      type: 'THEME',
      maxSizeBytes: 100 * 1024 * 1024,
      manifestFile: 'theme.json',
      requiredFields: ['id', 'name', 'version'],
      requiredFiles: ['Homepage.tsx'],
    });

    return NextResponse.json({
      success: true,
      theme: result.manifest,
      installedPackage: result.installedPackage,
      installedPath: result.installedPath,
      backupPath: result.backupPath,
      message: `Theme "${result.manifest.name}" v${result.manifest.version} đã được cài đặt vào content/themes thành công!`,
      securityWarnings: result.securityWarnings,
    });
  } catch (error: any) {
    console.error('Error uploading theme:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi cài đặt theme!' },
      { status: 500 }
    );
  }
}
