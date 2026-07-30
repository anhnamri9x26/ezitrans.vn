import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/security/apiGuard';
import { requireLexiShieldEnabled } from '@/lib/security/pluginGuard';

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;
    const pluginError = await requireLexiShieldEnabled();
    if (pluginError) return pluginError;

    const events = await prisma.securityEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    console.error('Error fetching security events:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
