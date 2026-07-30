import { NextResponse } from 'next/server';
import { requireAdminFromCookies } from '@/lib/zipSecurity';
import { installRuntimePackage } from '@/lib/updates/runtimePackageInstaller';

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const auth = await requireAdminFromCookies(cookieHeader);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Admin mới có quyền cài đặt plugin!' },
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
      type: 'PLUGIN',
      maxSizeBytes: 50 * 1024 * 1024,
      manifestFile: 'manifest.json',
      requiredFields: ['id', 'name', 'version', 'settingKey'],
    });

    return NextResponse.json({
      success: true,
      plugin: result.manifest,
      installedPackage: result.installedPackage,
      installedPath: result.installedPath,
      backupPath: result.backupPath,
      message: `Plugin "${result.manifest.name}" v${result.manifest.version} đã được cài đặt vào content/plugins thành công!`,
      securityWarnings: result.securityWarnings,
    });
  } catch (error: any) {
    console.error('Error uploading plugin:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi cài đặt plugin!' },
      { status: 500 }
    );
  }
}
