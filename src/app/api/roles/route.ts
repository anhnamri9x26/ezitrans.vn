import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { 
  ALL_CAPABILITIES, 
  DEFAULT_CAPABILITIES, 
  getRoleCapabilities, 
  requireCapability,
  ForbiddenError
} from '@/lib/capabilities';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    // Require user to be logged in and have read/manage capabilities access
    if (!user) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }
    
    // We only allow users with manage_roles or manage_settings to see capabilities
    const hasAccess = user.role === Role.ADMIN || (user.role === Role.EDITOR);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const [adminCaps, editorCaps, subscriberCaps] = await Promise.all([
      getRoleCapabilities(Role.ADMIN),
      getRoleCapabilities(Role.EDITOR),
      getRoleCapabilities(Role.SUBSCRIBER)
    ]);

    return NextResponse.json({
      success: true,
      roles: {
        ADMIN: adminCaps,
        EDITOR: editorCaps,
        SUBSCRIBER: subscriberCaps
      },
      allCapabilities: ALL_CAPABILITIES
    });
  } catch (error: any) {
    console.error('Error fetching role capabilities:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    // Check if authorized
    try {
      await requireCapability(user, 'manage_roles');
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        return NextResponse.json({ success: false, error: err.message }, { status: 403 });
      }
      throw err;
    }

    const body = await req.json();
    const { role, capabilities } = body;

    if (!role || !Array.isArray(capabilities)) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin role hoặc danh sách capabilities' }, { status: 400 });
    }

    if (!Object.values(Role).includes(role as Role)) {
      return NextResponse.json({ success: false, error: 'Vai trò không hợp lệ' }, { status: 400 });
    }

    if (role === Role.ADMIN) {
      return NextResponse.json({ success: false, error: 'Không thể chỉnh sửa quyền của Quản trị viên (ADMIN)' }, { status: 400 });
    }

    // Filter valid capability keys
    const validKeys = ALL_CAPABILITIES.map(c => c.key);
    const filteredCapabilities = capabilities.filter((cap: string) => validKeys.includes(cap));

    const settingKey = `role_capabilities_${role}`;
    
    // Save to settings table
    await prisma.setting.upsert({
      where: { key: settingKey },
      update: { value: JSON.stringify(filteredCapabilities) },
      create: { key: settingKey, value: JSON.stringify(filteredCapabilities) }
    });

    return NextResponse.json({
      success: true,
      message: `Cập nhật quyền cho vai trò ${role} thành công!`,
      capabilities: filteredCapabilities
    });
  } catch (error: any) {
    console.error('Error updating role capabilities:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
