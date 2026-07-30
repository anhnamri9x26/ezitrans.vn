import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createSession, destroyAllSessions } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Thông tin không đầy đủ.' },
        { status: 400 }
      );
    }

    // Validate password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu phải dài ít nhất 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.' },
        { status: 400 }
      );
    }

    const resetRequest = await prisma.passwordReset.findFirst({
      where: {
        token,
        used: false,
      },
      include: {
        user: true,
      },
    });

    if (!resetRequest) {
      return NextResponse.json(
        { success: false, error: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.' },
        { status: 400 }
      );
    }

    if (resetRequest.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Liên kết đặt lại mật khẩu đã hết hạn.' },
        { status: 400 }
      );
    }

    // Hash and update password
    const hashedPassword = hashPassword(password);
    
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRequest.userId },
        data: {
          password: hashedPassword,
          emailVerified: true // Set email to verified if they successfully resetting password via email
        },
      }),
      prisma.passwordReset.update({
        where: { id: resetRequest.id },
        data: { used: true },
      }),
    ]);

    // Force log out everywhere (destroy sessions)
    await destroyAllSessions(resetRequest.userId);

    // Auto log in user on current device
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';
    await createSession(resetRequest.userId, ip, userAgent);

    return NextResponse.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Đang chuyển hướng bạn đến trang quản trị...'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
