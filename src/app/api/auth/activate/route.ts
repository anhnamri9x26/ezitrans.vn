import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRandomToken } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { sendMail } from '@/plugins/email-smtp/lib/mailer';

/**
 * GET: Activate account using token
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token kích hoạt không được cung cấp.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Mã kích hoạt không đúng hoặc tài khoản đã được kích hoạt.' },
        { status: 400 }
      );
    }

    if (user.emailVerifyTokenExpiresAt && user.emailVerifyTokenExpiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Đường dẫn kích hoạt đã hết hạn (chỉ có hiệu lực trong 24 giờ).' },
        { status: 400 }
      );
    }

    // Update user status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyTokenExpiresAt: null,
      },
    });

    // Auto log-in user
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';
    await createSession(user.id, ip, userAgent);

    return NextResponse.json({
      success: true,
      message: 'Kích hoạt tài khoản thành công! Đang chuyển hướng bạn đến trang quản trị...'
    });
  } catch (error) {
    console.error('Error activating account:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Resend verification email
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp email của bạn.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Return success to avoid user enumeration
      return NextResponse.json({
        success: true,
        message: 'Nếu email tồn tại trong hệ thống và chưa được kích hoạt, một liên kết kích hoạt mới đã được gửi.'
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Tài khoản này đã được kích hoạt trước đó. Vui lòng đăng nhập.' },
        { status: 400 }
      );
    }

    // Generate new token
    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: token,
        emailVerifyTokenExpiresAt: expiresAt,
      },
    });

    const origin = new URL(req.url).origin;
    const verifyLink = `${origin}/activate?token=${token}`;
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #4f46e5; border-bottom: 1px solid #eee; padding-bottom: 10px;">Yêu cầu kích hoạt lại tài khoản Lexi CMS</h2>
        <p>Chúng tôi nhận được yêu cầu gửi lại email kích hoạt cho tài khoản này. Vui lòng click vào nút dưới đây để kích hoạt tài khoản:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verifyLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Kích hoạt tài khoản</a>
        </p>
        <p>Nếu nút trên không hoạt động, bạn có thể copy link này:</p>
        <p style="word-break: break-all;"><a href="${verifyLink}">${verifyLink}</a></p>
        <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Liên kết này có hiệu lực trong vòng 24 giờ.</p>
      </div>
    `;

    const mailResult = await sendMail({
      to: user.email,
      subject: '[Lexi CMS] Gửi lại liên kết kích hoạt tài khoản',
      html: emailHtml
    });

    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const devActivationLink = isLocalhost ? verifyLink : null;

    if (!mailResult.success) {
      console.error("Gửi email kích hoạt lại thất bại:", mailResult.error);
      if (isLocalhost) {
        return NextResponse.json({
          success: true,
          devActivationLink,
          message: 'Không thể gửi email kích hoạt do chưa cấu hình SMTP, nhưng vì bạn đang chạy trên localhost, bạn có thể sử dụng nút kích hoạt nhanh.'
        });
      }
      return NextResponse.json(
        { success: false, error: 'Không thể gửi email kích hoạt. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      devActivationLink,
      message: 'Liên kết kích hoạt mới đã được gửi vào hộp thư của bạn. Vui lòng kiểm tra.'
    });

  } catch (error) {
    console.error('Error resending activation email:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
