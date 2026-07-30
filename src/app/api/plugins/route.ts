import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { scanAllPlugins, syncInstalledPackage } from '@/lib/updates/runtimePackages';
import type { PluginManifest } from '@/lib/plugins/manifest.schema';

interface PluginInfo extends PluginManifest {
  isActive: boolean;
  installedAt?: string;
  folderName: string;
  warnings?: string[];
  source: 'BUILT_IN' | 'CONTENT';
  packageStatus?: string;
  canActivate: boolean;
  activationBlockReason?: string;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_plugins');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý plugins' }, { status: 403 });
    }

    const { validPluginsData, invalidPlugins } = scanAllPlugins();
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) settingsMap[s.key] = s.value;

    const packages = await prisma.installedPackage.findMany({ where: { type: 'PLUGIN' } });
    const packageMap = new Map(packages.map((pkg) => [pkg.slug, pkg]));

    const plugins: PluginInfo[] = [];
    for (const item of validPluginsData) {
      const m = item.manifest;
      const legacySettingKey = m.id === 'lexi-page-builder' ? 'plugin_grapesjs_enabled' : undefined;
      const activeValue = settingsMap[m.settingKey] ?? (legacySettingKey ? settingsMap[legacySettingKey] : undefined);
      const isActive = activeValue !== 'false';
      const pkg = packageMap.get(m.id);
      const status = isActive ? 'ACTIVE' : (pkg?.status || 'INACTIVE');

      await syncInstalledPackage({
        type: 'PLUGIN',
        slug: m.id,
        name: m.name,
        version: m.version,
        source: item.source,
        status: status as any,
        manifest: m,
      });

      plugins.push({
        ...m,
        isActive,
        installedAt: settingsMap[`plugin_${m.id}_installed_at`] || undefined,
        folderName: item.folderName,
        warnings: item.warnings,
        source: item.source,
        packageStatus: status,
        canActivate: item.canActivate,
        activationBlockReason: item.activationBlockReason,
      });
    }

    return NextResponse.json({ success: true, plugins, invalidPlugins });
  } catch (error: any) {
    console.error('Error scanning plugins:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_plugins');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý plugins' }, { status: 403 });
    }

    const body = await req.json();
    const { action, pluginId, settingKey } = body;

    if ((action === 'toggle' || action === 'deactivate') && !settingKey) {
      return NextResponse.json({ success: false, error: 'Missing settingKey' }, { status: 400 });
    }

    const { validPluginsData } = scanAllPlugins();
    const plugin = validPluginsData.find((item) => item.manifest.id === pluginId || item.manifest.settingKey === settingKey);
    if (!plugin) {
      return NextResponse.json({ success: false, error: `Plugin "${pluginId}" không tồn tại!` }, { status: 404 });
    }

    if (!plugin.canActivate && action === 'toggle') {
      return NextResponse.json({ success: false, error: plugin.activationBlockReason || 'Plugin này chưa thể kích hoạt.' }, { status: 400 });
    }

    const current = await prisma.setting.findUnique({ where: { key: settingKey } });
    const currentActive = current?.value !== 'false';
    const nextActive = action === 'deactivate' ? false : !currentActive;
    const newValue = String(nextActive);

    await prisma.setting.upsert({
      where: { key: settingKey },
      update: { value: newValue },
      create: { key: settingKey, value: newValue },
    });

    await syncInstalledPackage({
      type: 'PLUGIN',
      slug: plugin.manifest.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      source: plugin.source,
      status: nextActive ? 'ACTIVE' : 'INACTIVE',
      manifest: plugin.manifest,
    });

    let runtimeReloaded = false;
    try {
      const { pluginLoader } = await import('@/lib/pluginLoader');
      await pluginLoader.reloadAll();
      runtimeReloaded = true;
    } catch (err) {
      console.error('Failed to reload hooks runtime:', err);
    }

    const runtimeWarning = plugin.source === 'CONTENT' && plugin.manifest.hooks
      ? 'Runtime plugin state updated, but hooks from content/plugins are metadata-only until runtime hook loading is implemented.'
      : undefined;

    return NextResponse.json({
      success: true,
      pluginId: plugin.manifest.id,
      isActive: nextActive,
      runtimeReloaded,
      message: nextActive ? `Plugin "${plugin.manifest.id}" đã được kích hoạt!` : `Plugin "${plugin.manifest.id}" đã được vô hiệu hóa!`,
      warning: runtimeWarning || (!runtimeReloaded ? 'Plugin state updated in DB, but Hook runtime failed to reload.' : undefined),
    });
  } catch (error: any) {
    console.error('Error managing plugin:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
