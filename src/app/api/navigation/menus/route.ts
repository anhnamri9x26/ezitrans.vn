import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { createNavigationMenu, listNavigationMenus } from '@/lib/navigation/service';
import { NavigationValidationError } from '@/lib/navigation/validation';

export async function GET() {
  try {
    const menus = await listNavigationMenus();
    return NextResponse.json({ success: true, menus });
  } catch (error: any) {
    console.error('Error listing navigation menus:', error);
    return NextResponse.json({ success: false, error: error.message || 'Không thể tải danh sách menu' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!await userCan(user, 'manage_settings')) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý menu' }, { status: 403 });
    }
    const menu = await createNavigationMenu(await req.json());
    return NextResponse.json({ success: true, menu }, { status: 201 });
  } catch (error: any) {
    const status = error instanceof NavigationValidationError ? error.status : 500;
    console.error('Error creating navigation menu:', error);
    return NextResponse.json({ success: false, error: error.message || 'Không thể tạo menu' }, { status });
  }
}
