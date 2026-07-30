import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashPassword, getGravatarUrl } from '@/lib/auth';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const loggedInUser = await getCurrentUser();
    const hasCap = await userCan(loggedInUser, 'manage_users');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý người dùng' }, { status: 403 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản người dùng' }, { status: 404 });
    }

    // Omit password and add avatarUrl
    const { password, ...safeUser } = user;
    const userWithAvatar = {
      ...safeUser,
      avatarUrl: getGravatarUrl(safeUser.email)
    };

    return NextResponse.json({ success: true, user: userWithAvatar });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const loggedInUser = await getCurrentUser();
    const hasCap = await userCan(loggedInUser, 'manage_users');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý người dùng' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { email, name, role, password } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Địa chỉ Email không được để trống' }, { status: 400 });
    }

    // Email validation
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Định dạng Email không hợp lệ!' }, { status: 400 });
    }

    // Verify logged-in session via cookies to enforce self-downgrade blocking
    const loggedInUserId = loggedInUser ? loggedInUser.id : null;

    if (loggedInUserId === Number(id) && role && role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Không được phép tự hạ cấp vai trò Admin của chính mình để tránh mất quyền quản trị!'
      }, { status: 400 });
    }

    // Check duplicate email
    const duplicateEmail = await prisma.user.findFirst({
      where: {
        email: email.trim(),
        NOT: { id: Number(id) }
      }
    });

    if (duplicateEmail) {
      return NextResponse.json({ success: false, error: 'Địa chỉ Email này đã được sử dụng bởi tài khoản khác' }, { status: 400 });
    }

    const updateData: any = {
      email: email.trim(),
      name: name ? name.trim() : null,
      role: role || undefined
    };

    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return NextResponse.json({ success: false, error: 'Mật khẩu mới phải chứa ít nhất 6 ký tự!' }, { status: 400 });
      }
      updateData.password = hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData
    });

    // Strip password from returned user
    const { password: _, ...safeUser } = updatedUser;
    const userWithAvatar = {
      ...safeUser,
      avatarUrl: getGravatarUrl(safeUser.email)
    };

    return NextResponse.json({ success: true, user: userWithAvatar });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const loggedInUser = await getCurrentUser();
    const hasCap = await userCan(loggedInUser, 'manage_users');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý người dùng' }, { status: 403 });
    }

    const { id } = await params;

    const loggedInUserId = loggedInUser ? loggedInUser.id : null;

    // Prevent self-deletion of active admin session
    if (loggedInUserId === Number(id)) {
      return NextResponse.json({
        success: false, 
        error: 'Cảnh báo: Bạn không thể tự xóa tài khoản quản trị chính đang đăng nhập!' 
      }, { status: 400 });
    }

    // Fallback: Check if it's the primary (first created) admin user to prevent locking out the system
    const firstAdmin = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    if (firstAdmin && firstAdmin.id === Number(id)) {
      return NextResponse.json({
        success: false, 
        error: 'Cảnh báo: Bạn không thể xóa tài khoản Administrator đầu tiên của hệ thống!' 
      }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản người dùng' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, error: 'Không thể xóa tài khoản do tài khoản này đang liên kết với các bài viết đã xuất bản. Hãy gỡ liên kết trước khi xóa!' }, { status: 500 });
  }
}
