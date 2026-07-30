import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRandomToken } from '@/lib/auth';
import { sendMail } from '@/plugins/email-smtp/lib/mailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp địa chỉ Email.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // To prevent user enumeration, we return success even if the email doesn't exist.
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Nếu địa chỉ email tồn tại trong hệ thống, bạn sẽ nhận được đường dẫn đặt lại mật khẩu trong giây lát.'
      });
    }

    // Rate Limit check for password resets: Max 3 requests per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentResetsCount = await prisma.passwordReset.count({
      where: {
        userId: user.id,
        createdAt: { gte: oneHourAgo }
      }
    });

    if (recentResetsCount >= 3) {
      return NextResponse.json(
        { success: false, error: 'Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Vui lòng thử lại sau 1 giờ.' },
        { status: 429 }
      );
    }

    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      }
    });

    const origin = new URL(req.url).origin;
    const resetLink = `${origin}/reset-password?token=${token}`;

    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #4f46e5; border-bottom: 1px solid #eee; padding-bottom: 10px;">Yêu cầu đặt lại mật khẩu Lexi CMS</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Lexi CMS của bạn. Vui lòng click vào nút bên dưới để tiến hành thiết lập mật khẩu mới:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Đặt lại mật khẩu</a>
        </p>
        <p>Nếu nút trên không hoạt động, bạn có thể copy và paste đường link sau vào trình duyệt:</p>
        <p style="word-break: break-all;"><a href="${resetLink}">${resetLink}</a></p>
        <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Đường link này có hiệu lực trong vòng 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      </div>
    `;

    const mailResult = await sendMail({
      to: user.email,
      subject: '[Lexi CMS] Khôi phục mật khẩu tài khoản',
      html: emailHtml
    });

    if (!mailResult.success) {
      console.error("Lỗi gửi email reset password:", mailResult.error);
      return NextResponse.json(
        { success: false, error: 'Không thể gửi email khôi phục mật khẩu. Vui lòng thử lại sau.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Nếu địa chỉ email tồn tại trong hệ thống, bạn sẽ nhận được đường dẫn đặt lại mật khẩu trong giây lát.'
    });

  } catch (error) {
    console.error('Error in forgot-password API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
