import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/apiGuard';
import { requireLexiShieldEnabled } from '@/lib/security/pluginGuard';
import { getSecurityHealth } from '@/lib/security/health';

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;
    const pluginError = await requireLexiShieldEnabled();
    if (pluginError) return pluginError;

    const health = await getSecurityHealth();
    return NextResponse.json({ success: true, ...health });
  } catch (error: any) {
    console.error('Error fetching security health:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
