import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { normalizeContactWidgetConfig, parseContactWidgetConfig } from '@/plugins/contact-widget/lib/contactWidgetConfig';

async function readSettings() {
  const rows = await prisma.setting.findMany({ where: { key: { startsWith: 'contact_' } } });
  const settings = Object.fromEntries(rows.map(row => [row.key, row.value]));
  const plugin = await prisma.setting.findUnique({ where: { key: 'plugin_contact_enabled' } });
  if (plugin) settings.plugin_contact_enabled = plugin.value;
  return settings;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!await userCan(user, 'manage_settings')) return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý cài đặt' }, { status: 403 });
  const settings = await readSettings();
  return NextResponse.json({ success: true, config: parseContactWidgetConfig(settings) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!await userCan(user, 'manage_settings')) return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý cài đặt' }, { status: 403 });
  try {
    const config = normalizeContactWidgetConfig(await request.json());
    await prisma.$transaction([
      prisma.setting.upsert({ where: { key: 'contact_widget_config_v2' }, update: { value: JSON.stringify(config) }, create: { key: 'contact_widget_config_v2', value: JSON.stringify(config) } }),
      prisma.setting.upsert({ where: { key: 'plugin_contact_enabled' }, update: { value: String(config.enabled) }, create: { key: 'plugin_contact_enabled', value: String(config.enabled) } }),
    ]);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Contact widget settings error:', error);
    return NextResponse.json({ success: false, error: 'Cấu hình không hợp lệ' }, { status: 400 });
  }
}
