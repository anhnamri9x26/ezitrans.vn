import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

export async function sendMail({ 
  to, 
  subject, 
  html,
  fromName,
  fromEmail,
  replyTo,
  cc,
  bcc
}: { 
  to: string; 
  subject: string; 
  html: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  cc?: string;
  bcc?: string;
}) {
  const settings = await prisma.setting.findMany();
  const s = settings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
    acc[cur.key] = cur.value;
    return acc;
  }, {});

  if (s.plugin_email_smtp_enabled === 'false') {
    console.warn("Plugin SMTP & Email đã bị vô hiệu hóa. Bỏ qua việc gửi email.");
    return { success: false, error: 'Plugin is disabled' };
  }

  if (!s.mail_smtp_host || !s.mail_smtp_username || !s.mail_smtp_password) {
    console.warn("SMTP chưa được cấu hình. Bỏ qua việc gửi email.");
    return { success: false, error: 'SMTP settings not configured' };
  }

  const isSSL = s.mail_smtp_encryption === 'ssl';
  const port = Number(s.mail_smtp_port || (isSSL ? 465 : 587));

  const transporter = nodemailer.createTransport({
    host: s.mail_smtp_host,
    port,
    secure: isSSL, // true cho port 465 (SSL), false cho các port khác (như 587 TLS/STARTTLS)
    auth: {
      user: s.mail_smtp_username,
      pass: s.mail_smtp_password,
    },
    tls: {
      rejectUnauthorized: false // Bỏ qua xác thực chứng chỉ tự ký để hoạt động ổn định hơn
    }
  });

  const finalFromName = fromName || s.mail_from_name || 'Lexi';
  const finalFromEmail = fromEmail || s.mail_from_email || s.mail_smtp_username;

  const mailOptions: any = {
    from: `"${finalFromName}" <${finalFromEmail}>`,
    to,
    subject,
    html,
  };

  if (replyTo) mailOptions.replyTo = replyTo;
  if (cc) mailOptions.cc = cc;
  if (bcc) mailOptions.bcc = bcc;

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error: any) {
    console.error("SMTP sendMail error:", error);
    return { success: false, error: error.message || String(error) };
  }
}
