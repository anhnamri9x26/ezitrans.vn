import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
}

async function upsertSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ success: true, installed: userCount > 0 });
  } catch (error: any) {
    return NextResponse.json({ success: false, installed: false, error: error.message || 'Database is not ready.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json({ success: false, error: 'Hệ thống đã được cài đặt.' }, { status: 403 });
    }

    const body = await req.json();
    const siteTitle = String(body?.siteTitle || '').trim();
    const username = String(body?.username || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!siteTitle || !username || !email || !password) {
      return NextResponse.json({ success: false, error: 'Vui lòng điền đầy đủ thông tin cài đặt.' }, { status: 400 });
    }

    if (!isValidUsername(username)) {
      return NextResponse.json({ success: false, error: 'Username chỉ được chứa chữ, số, gạch dưới/gạch ngang và dài 3-30 ký tự.' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Email không đúng định dạng.' }, { status: 400 });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      return NextResponse.json({ success: false, error: 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashPassword(password),
        name: username,
        role: 'ADMIN',
        emailVerified: true,
      },
    });

    await Promise.all([
      upsertSetting('site_title', siteTitle),
      upsertSetting('site_tagline', 'Just another Ezitrans site'),
      upsertSetting('site_language', 'vi'),
      upsertSetting('allow_user_registration', 'false'),
      upsertSetting('registration_require_email_verify', 'false'),
      upsertSetting('default_registration_role', 'SUBSCRIBER'),
      upsertSetting('plugin_contact_enabled', 'true'),
    ]);

    return NextResponse.json({ success: true, userId: user.id, message: 'Cài đặt hoàn tất. Bạn có thể đăng nhập ngay.' });
  } catch (error: any) {
    console.error('Setup failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Không thể hoàn tất cài đặt.' }, { status: 500 });
  }
}
