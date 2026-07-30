import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/apiGuard';
import { requireLexiShieldEnabled } from '@/lib/security/pluginGuard';
import { takeBaselineSnapshot } from '@/lib/security/scanner';

export async function POST() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;
    const pluginError = await requireLexiShieldEnabled();
    if (pluginError) return pluginError;

    const result = await takeBaselineSnapshot();
    return NextResponse.json({ ...result, message: `Đã chụp baseline cho ${result.files} file.` });
  } catch (error: any) {
    console.error('Error taking baseline snapshot:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
