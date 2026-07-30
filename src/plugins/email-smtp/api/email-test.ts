import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

export async function handleTestEmail(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const hasCap = await userCan(user, 'manage_settings');
    if (!hasCap) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const {
      to,
      mail_from_email,
      mail_from_name,
      mail_smtp_host,
      mail_smtp_port,
      mail_smtp_encryption,
      mail_smtp_username,
      mail_smtp_password,
    } = body;

    if (!to) {
      return NextResponse.json({ success: false, error: 'Thiếu email người nhận' }, { status: 400 });
    }

    // Nếu không truyền thông số cấu hình lên, chúng ta sẽ lấy từ CSDL
    let host = mail_smtp_host;
    let portStr = mail_smtp_port;
    let encryption = mail_smtp_encryption;
    let username = mail_smtp_username;
    let password = mail_smtp_password;
    let fromEmail = mail_from_email;
    let fromName = mail_from_name;

    if (!host || !username) {
      const settings = await prisma.setting.findMany();
      const s = settings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
        acc[cur.key] = cur.value;
        return acc;
      }, {});
      host = host || s.mail_smtp_host;
      portStr = portStr || s.mail_smtp_port;
      encryption = encryption || s.mail_smtp_encryption;
      username = username || s.mail_smtp_username;
      password = password || s.mail_smtp_password;
      fromEmail = fromEmail || s.mail_from_email;
      fromName = fromName || s.mail_from_name;
    }

    if (!host || !username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Vui lòng cấu hình đầy đủ thông tin SMTP (Host, Username, Password) trước khi thử nghiệm.' 
      }, { status: 400 });
    }

    const isSSL = encryption === 'ssl';
    const port = Number(portStr || (isSSL ? 465 : 587));

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSSL,
      auth: {
        user: username,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"${fromName || 'Lexi Test'}" <${fromEmail || username}>`,
      to,
      subject: `[Lexi] Thư kiểm thử cấu hình SMTP`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px; margin-top: 0;">Kiểm thử SMTP thành công! 🎉</h2>
          <p>Xin chào,</p>
          <p>Email này được gửi tự động để xác nhận rằng cấu hình SMTP của bạn trên hệ thống <strong>Lexi</strong> đang hoạt động hoàn hảo.</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 13px; border-left: 4px solid #4f46e5;">
            <p style="margin: 4px 0;"><strong>SMTP Host:</strong> ${host}</p>
            <p style="margin: 4px 0;"><strong>Cổng kết nối (Port):</strong> ${port} (${encryption.toUpperCase()})</p>
            <p style="margin: 4px 0;"><strong>Tài khoản đăng nhập:</strong> ${username}</p>
            <p style="margin: 4px 0;"><strong>Thông tin người gửi:</strong> "${fromName || 'Lexi Test'}" &lt;${fromEmail || username}&gt;</p>
            <p style="margin: 4px 0;"><strong>Thời gian gửi:</strong> ${new Date().toLocaleString('vi-VN')}</p>
          </div>
          <p>Hiện tại, các tính năng thông báo email nền tự động đã sẵn sàng hoạt động. Hệ thống sẽ tự động thông báo khi có bình luận mới, phản hồi hoặc đăng ký thành viên mới dựa trên cấu hình tùy chọn của bạn.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-bottom: 0;">Lexi CMS - Giải pháp quản trị nội dung chuyên nghiệp</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, message: 'Gửi thư thử nghiệm thành công! Vui lòng kiểm tra hộp thư của bạn.' });

  } catch (error: any) {
    console.error('SMTP test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Lỗi kết nối SMTP không xác định',
      code: error.code || 'UNKNOWN_ERROR',
      command: error.command || ''
    }, { status: 500 });
  }
}
