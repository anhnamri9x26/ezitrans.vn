import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const OLD_KEY = 'plugin_grapesjs_enabled';
const NEW_KEY = 'plugin_lexi_page_builder_enabled';

export async function POST() {
  try {
    const [oldSetting, newSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: OLD_KEY } }),
      prisma.setting.findUnique({ where: { key: NEW_KEY } }),
    ]);

    if (!oldSetting && newSetting) {
      return NextResponse.json({
        success: true,
        migrated: false,
        message: 'Lexi Page Builder setting already exists.',
      });
    }

    const value = newSetting?.value ?? oldSetting?.value ?? 'true';

    await prisma.setting.upsert({
      where: { key: NEW_KEY },
      update: { value },
      create: { key: NEW_KEY, value },
    });

    return NextResponse.json({
      success: true,
      migrated: Boolean(oldSetting),
      oldKey: OLD_KEY,
      newKey: NEW_KEY,
      value,
      message: 'Lexi Page Builder plugin setting migrated successfully.',
    });
  } catch (error: any) {
    console.error('Error migrating Lexi Page Builder plugin setting:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
