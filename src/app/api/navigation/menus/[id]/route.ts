import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { deleteNavigationMenu, getNavigationMenu, updateNavigationMenu } from '@/lib/navigation/service';
import { NavigationValidationError } from '@/lib/navigation/validation';

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new NavigationValidationError('ID menu không hợp lệ');
  return id;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const menu = await getNavigationMenu(parseId(id));
    if (!menu) return NextResponse.json({ success: false, error: 'Không tìm thấy menu' }, { status: 404 });
    return NextResponse.json({ success: true, menu });
  } catch (error: any) {
    const status = error instanceof NavigationValidationError ? error.status : 500;
    return NextResponse.json({ success: false, error: error.message || 'Không thể tải menu' }, { status });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!await userCan(user, 'manage_settings')) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý menu' }, { status: 403 });
    }
    const { id } = await params;
    const menu = await updateNavigationMenu(parseId(id), await req.json());
    return NextResponse.json({ success: true, menu });
  } catch (error: any) {
    const status = error instanceof NavigationValidationError ? error.status : 500;
    console.error('Error updating navigation menu:', error);
    return NextResponse.json({ success: false, error: error.message || 'Không thể lưu menu' }, { status });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!await userCan(user, 'manage_settings')) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý menu' }, { status: 403 });
    }
    const { id } = await params;
    const removedAssignments = await deleteNavigationMenu(parseId(id));
    return NextResponse.json({ success: true, removedAssignments });
  } catch (error: any) {
    const status = error instanceof NavigationValidationError ? error.status : 500;
    console.error('Error deleting navigation menu:', error);
    return NextResponse.json({ success: false, error: error.message || 'Không thể xóa menu' }, { status });
  }
}