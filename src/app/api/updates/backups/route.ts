import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { listRestorableBackups, restorePackageBackup } from '@/lib/updates/packageRestore';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'update_core');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền xem backup cập nhật' }, { status: 403 });
    }

    const backups = await listRestorableBackups(20);
    return NextResponse.json({ success: true, backups });
  } catch (error: any) {
    console.error('Error loading update backups:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'update_core');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền restore backup cập nhật' }, { status: 403 });
    }

    const body = await req.json();
    const action = body?.action;
    const backupId = Number(body?.backupId);
    if (!['dry-run', 'restore'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Action không hợp lệ.' }, { status: 400 });
    }
    if (!Number.isInteger(backupId) || backupId <= 0) {
      return NextResponse.json({ success: false, error: 'backupId không hợp lệ.' }, { status: 400 });
    }

    const result = await restorePackageBackup({
      backupId,
      action,
      createdById: user?.id || null,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error restoring update backup:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
