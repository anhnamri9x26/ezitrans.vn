import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword, getGravatarUrl } from '@/lib/auth';
import { getCurrentUser } from '@/lib/session';
import { getRoleCapabilities, userCan } from '@/lib/capabilities';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET active profile details (based on active session token, fallback to first user in DB)
export async function GET() {
  try {
    let user = await getCurrentUser();

    if (!user) {
      // Seed fallback / backward compatibility
      user = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' }
      });
    }

    if (!user) {
      // Seed first admin if database is completely empty
      user = await prisma.user.create({
        data: {
          email: 'admin@lexi.vn',
          username: 'admin',
          password: hashPassword('password123'),
          name: 'Administrator',
          role: 'ADMIN',
          emailVerified: true
        }
      });
    }

    // Strip password and add avatarUrl
    const { password, ...safeUser } = user;
    const userCapabilities = await getRoleCapabilities(user.role);
    const userWithAvatar = {
      ...safeUser,
      capabilities: userCapabilities,
      avatarUrl: getGravatarUrl(safeUser.email)
    };

    return NextResponse.json({ success: true, user: userWithAvatar });
  } catch (error) {
    console.error('Error fetching active profile:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST update active profile details and change password securely
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, oldPassword, newPassword } = body;

    let user = await getCurrentUser();

    if (!user) {
      user = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' }
      });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ tài khoản' }, { status: 404 });
    }

    // Check capability to edit profile
    const hasCap = await userCan(user, 'edit_profile');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền cập nhật hồ sơ cá nhân' }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json({ success: false, error: 'Địa chỉ Email không được để trống' }, { status: 400 });
    }

    // Email validation
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Định dạng Email không hợp lệ!' }, { status: 400 });
    }

    // Check duplicate email for other users
    const duplicateEmail = await prisma.user.findFirst({
      where: {
        email: email.trim(),
        NOT: { id: user.id }
      }
    });

    if (duplicateEmail) {
      return NextResponse.json({ success: false, error: 'Địa chỉ Email này đã được sử dụng bởi một tài khoản khác' }, { status: 400 });
    }

    const updateData: any = {
      email: email.trim(),
      name: name ? name.trim() : null
    };

    // If attempting to change password
    if (newPassword && newPassword.trim() !== '') {
      if (!oldPassword || oldPassword.trim() === '') {
        return NextResponse.json({ success: false, error: 'Vui lòng nhập Mật khẩu cũ để đổi sang mật khẩu mới!' }, { status: 400 });
      }

      // Check if new password is at least 6 characters
      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'Mật khẩu mới phải chứa ít nhất 6 ký tự!' }, { status: 400 });
      }

      // Verify old password matches current database password
      const isMatched = comparePassword(oldPassword, user.password);
      if (!isMatched) {
        return NextResponse.json({ success: false, error: 'Mật khẩu cũ không chính xác!' }, { status: 400 });
      }

      updateData.password = hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    // Exclude password and append Gravatar url
    const { password: _, ...safeUser } = updatedUser;
    const userCapabilities = await getRoleCapabilities(updatedUser.role);
    const userWithAvatar = {
      ...safeUser,
      capabilities: userCapabilities,
      avatarUrl: getGravatarUrl(safeUser.email)
    };

    return NextResponse.json({ success: true, user: userWithAvatar });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
