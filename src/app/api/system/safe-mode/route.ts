import { NextResponse } from 'next/server';
import { safeMode } from '@/lib/safeMode';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

/**
 * Kiểm tra user hiện tại là ADMIN
 */
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

async function requireAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!(await userCan(user, 'manage_settings'));
  } catch {
    return false;
  }
}

/**
 * GET — Lấy trạng thái Safe Mode
 */
export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const status = await safeMode.getStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST — Bật/tắt Safe Mode
 * Body: { action: 'activate' | 'deactivate', reason?: string }
 */
export async function POST(req: Request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, reason } = body;

    if (action === 'activate') {
      const result = await safeMode.activate(reason || 'Bật thủ công bởi Admin');
      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Safe Mode đã được bật! Đã tắt ${result.disabledPlugins.length} plugin.`
          : 'Không thể bật Safe Mode.',
        disabledPlugins: result.disabledPlugins,
      });
    }

    if (action === 'deactivate') {
      const result = await safeMode.deactivate();
      return NextResponse.json({
        success: result.success,
        message: result.success
          ? 'Safe Mode đã tắt! Hệ thống plugin đã hoạt động trở lại.'
          : 'Không thể tắt Safe Mode.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "activate" or "deactivate".' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
