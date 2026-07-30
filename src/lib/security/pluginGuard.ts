import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const LEXI_SHIELD_SETTING_KEY = 'plugin_lexi_shield_enabled';

export async function isLexiShieldEnabled() {
  const setting = await prisma.setting.findUnique({ where: { key: LEXI_SHIELD_SETTING_KEY } });
  return setting?.value !== 'false';
}

export async function requireLexiShieldEnabled() {
  const enabled = await isLexiShieldEnabled();
  if (!enabled) {
    return NextResponse.json(
      { success: false, error: 'Lexi Shield Security plugin is disabled' },
      { status: 403 }
    );
  }
  return null;
}
