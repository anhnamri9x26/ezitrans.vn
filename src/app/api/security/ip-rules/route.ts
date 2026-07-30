import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/security/apiGuard';
import { requireLexiShieldEnabled } from '@/lib/security/pluginGuard';
import { blockIp, allowIp, unblockIp } from '@/lib/security/ipRules';

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;
    const pluginError = await requireLexiShieldEnabled();
    if (pluginError) return pluginError;

    const rules = await prisma.securityIpRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    console.error('Error fetching IP rules:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;
    const pluginError = await requireLexiShieldEnabled();
    if (pluginError) return pluginError;

    const { ip, type, reason } = await req.json();

    if (!ip || !type) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin' }, { status: 400 });
    }

    if (type === 'block') {
      await blockIp(ip, reason || 'Manual block');
    } else if (type === 'allow') {
      await allowIp(ip, reason || 'Manual allow');
    }

    return NextResponse.json({ success: true, message: 'Thêm quy tắc thành công' });
  } catch (error: any) {
    console.error('Error adding IP rule:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;
    const pluginError = await requireLexiShieldEnabled();
    if (pluginError) return pluginError;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await prisma.securityIpRule.delete({ where: { id: Number(id) } });
      return NextResponse.json({ success: true, message: 'Xóa quy tắc thành công' });
    }

    const ip = searchParams.get('ip');
    if (ip) {
      await unblockIp(ip);
      return NextResponse.json({ success: true, message: 'Xóa quy tắc thành công' });
    }

    return NextResponse.json({ success: false, error: 'Thiếu ID hoặc IP' }, { status: 400 });
  } catch (error: any) {
    console.error('Error removing IP rule:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
