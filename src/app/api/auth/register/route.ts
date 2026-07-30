import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateRandomToken } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { sendMail } from '@/plugins/email-smtp/lib/mailer';

export async function POST(req: Request) {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    const allowRegistration = settingsMap.allow_user_registration === 'true';
    if (!allowRegistration) {
      return NextResponse.json(
        { success: false, error: 'Đăng ký thành viên hiện đang bị đóng.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { username, email, password, name } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng điền đầy đủ thông tin Tên tài khoản, Email và Mật khẩu.' },
        { status: 400 }
      );
    }

    // Validate username (3-30 chars, alphanumeric + underscores/hyphens)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { success: false, error: 'Tên tài khoản chỉ được chứa chữ cái, số, gạch dưới, gạch ngang và dài từ 3-30 ký tự.' },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email không đúng định dạng.' },
        { status: 400 }
      );
    }

    // Validate password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu phải dài ít nhất 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.' },
        { status: 400 }
      );
    }

    // Check duplicate username or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase().trim() },
          { email: email.toLowerCase().trim() }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === username.toLowerCase().trim()) {
        return NextResponse.json(
          { success: false, error: 'Tên tài khoản đã tồn tại trong hệ thống.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Email đã được đăng ký tài khoản.' },
        { status: 400 }
      );
    }

    const requireVerify = settingsMap.registration_require_email_verify === 'true';
    const defaultRoleStr = settingsMap.default_registration_role || 'SUBSCRIBER';
    
    // Check role is valid enum
    const validRoles = ['ADMIN', 'EDITOR', 'SUBSCRIBER'];
    const role = (validRoles.includes(defaultRoleStr) ? defaultRoleStr : 'SUBSCRIBER') as any;

    const hashedPassword = hashPassword(password);
    const emailVerifyToken = requireVerify ? generateRandomToken() : null;
    const emailVerifyTokenExpiresAt = requireVerify ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null; // 24h

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name ? name.trim() : null,
        role,
        emailVerified: !requireVerify,
        emailVerifyToken,
        emailVerifyTokenExpiresAt,
      }
    });

    const origin = new URL(req.url).origin;

    if (requireVerify && emailVerifyToken) {
      // Send verification email
      const verifyLink = `${origin}/activate?token=${emailVerifyToken}`;
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4f46e5; border-bottom: 1px solid #eee; padding-bottom: 10px;">Chào mừng bạn đến với Lexi CMS!</h2>
          <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng click vào nút bên dưới để kích hoạt tài khoản của bạn:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Kích hoạt tài khoản</a>
          </p>
          <p>Nếu nút trên không hoạt động, bạn cũng có thể copy và paste đường link sau vào trình duyệt:</p>
          <p style="word-break: break-all;"><a href="${verifyLink}">${verifyLink}</a></p>
          <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Đường link này có hiệu lực trong vòng 24 giờ. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
        </div>
      `;

      const mailResult = await sendMail({
        to: newUser.email,
        subject: '[Lexi CMS] Kích hoạt tài khoản của bạn',
        html: emailHtml
      });

      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
      const devActivationLink = isLocalhost ? verifyLink : null;

      if (!mailResult.success) {
        console.error("Gửi email kích hoạt thất bại:", mailResult.error);
        return NextResponse.json({
          success: true,
          requireVerify: true,
          devActivationLink,
          warning: 'Đăng ký thành công nhưng không gửi được email kích hoạt. Vui lòng liên hệ quản trị viên.',
          message: 'Đăng ký thành công. Lỗi gửi email kích hoạt.'
        });
      }

      return NextResponse.json({
        success: true,
        requireVerify: true,
        devActivationLink,
        message: 'Đăng ký thành công! Vui lòng kiểm tra email của bạn để kích hoạt tài khoản.'
      });
    }

    // If verification is not required, log them in immediately
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';
    
    await createSession(newUser.id, ip, userAgent);

    return NextResponse.json({
      success: true,
      requireVerify: false,
      message: 'Đăng ký thành công và đăng nhập tự động!'
    });

  } catch (error: any) {
    console.error('Error registering user:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
