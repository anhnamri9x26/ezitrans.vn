import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { scanAllThemes, syncInstalledPackage } from '@/lib/updates/runtimePackages';
import type { ThemeManifest } from '@/lib/themes/manifest.schema';

interface ThemeInfo extends ThemeManifest {
  isActive: boolean;
  folderName: string;
  components: string[];
  warnings?: string[];
  source: 'BUILT_IN' | 'CONTENT';
  packageStatus?: string;
  canActivate: boolean;
  activationBlockReason?: string;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_themes');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý giao diện' }, { status: 403 });
    }

    const { validThemesData, invalidThemes } = scanAllThemes();
    const activeThemeSetting = await prisma.setting.findUnique({ where: { key: 'active_theme' } });
    const activeThemeId = activeThemeSetting?.value || 'default';
    const packages = await prisma.installedPackage.findMany({ where: { type: 'THEME' } });
    const packageMap = new Map(packages.map((pkg) => [pkg.slug, pkg]));

    const themes: ThemeInfo[] = [];
    for (const item of validThemesData) {
      const manifest = item.manifest;
      const isActive = manifest.id === activeThemeId;
      const pkg = packageMap.get(manifest.id);
      const status = isActive ? 'ACTIVE' : (pkg?.status || 'INSTALLED');

      await syncInstalledPackage({
        type: 'THEME',
        slug: manifest.id,
        name: manifest.name,
        version: manifest.version,
        source: item.source,
        status: status as any,
        manifest,
      });

      themes.push({
        ...manifest,
        isActive,
        folderName: item.folderName,
        components: item.components || [],
        warnings: item.warnings,
        source: item.source,
        packageStatus: status,
        canActivate: item.canActivate,
        activationBlockReason: item.activationBlockReason,
      });
    }

    return NextResponse.json({ success: true, themes, invalidThemes, activeThemeId });
  } catch (error: any) {
    console.error('Error scanning themes:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_themes');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý giao diện' }, { status: 403 });
    }

    const body = await req.json();
    const { themeId } = body;
    if (!themeId) return NextResponse.json({ success: false, error: 'Missing themeId' }, { status: 400 });

    const { validThemesData, invalidThemes } = scanAllThemes();
    const theme = validThemesData.find((item) => item.manifest.id === themeId);
    if (!theme) {
      const isInvalid = invalidThemes.some((item) => item.manifestId === themeId || item.folderName === themeId);
      if (isInvalid) return NextResponse.json({ success: false, error: `Theme "${themeId}" không hợp lệ, không thể kích hoạt.` }, { status: 400 });
      return NextResponse.json({ success: false, error: `Theme "${themeId}" không tồn tại!` }, { status: 404 });
    }

    if (!theme.canActivate) {
      return NextResponse.json({ success: false, error: theme.activationBlockReason || `Theme "${themeId}" chưa thể kích hoạt an toàn.` }, { status: 400 });
    }

    await prisma.setting.upsert({
      where: { key: 'active_theme' },
      update: { value: themeId },
      create: { key: 'active_theme', value: themeId },
    });

    await prisma.installedPackage.updateMany({ where: { type: 'THEME', status: 'ACTIVE' }, data: { status: 'INSTALLED' } });
    await syncInstalledPackage({
      type: 'THEME',
      slug: theme.manifest.id,
      name: theme.manifest.name,
      version: theme.manifest.version,
      source: theme.source,
      status: 'ACTIVE',
      manifest: theme.manifest,
    });

    return NextResponse.json({ success: true, themeId, message: `Theme "${themeId}" đã được kích hoạt!` });
  } catch (error: any) {
    console.error('Error activating theme:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
