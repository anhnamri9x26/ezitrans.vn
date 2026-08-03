import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, getGravatarUrl } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_users');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý người dùng' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });

    // Strip sensitive passwords and append Gravatar URLs
    const safeUsers = users.map(({ password, ...u }) => ({
      ...u,
      avatarUrl: getGravatarUrl(u.email)
    }));

    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const activeUser = await getCurrentUser();
    const hasCap = await userCan(activeUser, 'manage_users');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý người dùng' }, { status: 403 });
    }

    const body = await req.json();
    const { username, password, email, name, role } = body;

    if (!username || !password || !email) {
      return NextResponse.json({ success: false, error: 'Vui lòng điền đầy đủ Tên tài khoản, Mật khẩu và Email' }, { status: 400 });
    }

    // Email format validation
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Định dạng Email không hợp lệ!' }, { status: 400 });
    }

    // Password length validation
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Mật khẩu phải chứa ít nhất 6 ký tự!' }, { status: 400 });
    }

    // Check duplicate username or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: email.trim() }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === username.trim().toLowerCase()) {
        return NextResponse.json({ success: false, error: 'Tên tài khoản này đã tồn tại trong hệ thống' }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: 'Địa chỉ Email này đã tồn tại trong hệ thống' }, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashPassword(password), // Save hashed password
        email: email.trim(),
        name: name ? name.trim() : null,
        role: role || 'SUBSCRIBER'
      }
    });

    // Exclude password from response
    const { password: _, ...safeUser } = newUser;
    const userWithAvatar = {
      ...safeUser,
      avatarUrl: getGravatarUrl(safeUser.email)
    };

    // --- BACKGROUND EMAIL TRIGGER ---
    (async () => {
      try {
        const settingsList = await prisma.setting.findMany();
        const s = settingsList.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => { acc[cur.key] = cur.value; return acc; }, {});

        const notifyAdminUser = s.email_notify_admin_user !== 'false';

        const adminEmail = (s.site_email || s.mail_from_email || '').trim();
        if (notifyAdminUser && adminEmail) {
          const hostUrl = process.env.NEXTAUTH_URL || 'http://localhost:3005';
          const userLink = `${hostUrl}/users`;

          const adminHtml = `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px; margin-top: 0;">Thành viên mới đăng ký! 🎉</h2>
              <p>Xin chào quản trị viên,</p>
              <p>Hệ thống vừa ghi nhận có một tài khoản người dùng mới đăng ký thành công trên website.</p>
              
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4f46e5; font-size: 13px;">
                <p style="margin: 4px 0;"><strong>Tên tài khoản:</strong> ${newUser.username}</p>
                <p style="margin: 4px 0;"><strong>Email:</strong> ${newUser.email}</p>
                <p style="margin: 4px 0;"><strong>Họ và tên:</strong> ${newUser.name || 'Không cung cấp'}</p>
                <p style="margin: 4px 0;"><strong>Vai trò:</strong> <span style="font-weight: bold; color: #4f46e5;">${newUser.role}</span></p>
                <p style="margin: 4px 0;"><strong>Thời gian đăng ký:</strong> ${new Date(newUser.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="${userLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Quản lý thành viên</a>
              </div>
            </div>
          `;

          await sendMail({
            to: adminEmail,
            subject: `[Thành viên mới] Tài khoản "${newUser.username}" đã đăng ký`,
            html: adminHtml
          });
        }
      } catch (err) {
        console.error('Failed to execute new user register email trigger:', err);
      }
    })();

    return NextResponse.json({ success: true, user: userWithAvatar });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
