import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { buildIdentitySettingValues, normalizeSiteUrl } from '@/lib/site-identity';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
}

function isValidPhone(phone: string) {
  return !phone || /^[+\d][\d\s().-]{5,24}$/.test(phone);
}

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ success: true, installed: userCount > 0 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, installed: false, error: error instanceof Error ? error.message : 'Database is not ready.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const siteTitle = String(body?.siteTitle || '').trim();
    const siteTagline = String(body?.siteTagline || '').trim();
    const siteUrl = normalizeSiteUrl(String(body?.siteUrl || ''));
    const siteEmail = String(body?.siteEmail || '').trim().toLowerCase();
    const sitePhone = String(body?.sitePhone || '').trim();
    const siteAddress = String(body?.siteAddress || '').trim();
    const siteLegalName = String(body?.siteLegalName || '').trim();
    const siteLanguage = String(body?.siteLanguage || 'vi').trim();
    const username = String(body?.username || '').trim();
    const adminEmail = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!siteTitle || !siteUrl || !username || !adminEmail || !password) {
      return NextResponse.json({ success: false, error: 'Tên website, URL chính thức và thông tin quản trị là bắt buộc.' }, { status: 400 });
    }
    if (siteTitle.length > 120 || siteTagline.length > 240 || siteAddress.length > 500 || siteLegalName.length > 200) {
      return NextResponse.json({ success: false, error: 'Một hoặc nhiều trường vượt quá độ dài cho phép.' }, { status: 400 });
    }
    if (!isValidUsername(username)) {
      return NextResponse.json({ success: false, error: 'Username chỉ được chứa chữ, số, gạch dưới/gạch ngang và dài 3-30 ký tự.' }, { status: 400 });
    }
    if (!isValidEmail(adminEmail) || (siteEmail && !isValidEmail(siteEmail))) {
      return NextResponse.json({ success: false, error: 'Email không đúng định dạng.' }, { status: 400 });
    }
    if (!isValidPhone(sitePhone)) {
      return NextResponse.json({ success: false, error: 'Số điện thoại không đúng định dạng.' }, { status: 400 });
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      return NextResponse.json({ success: false, error: 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.' }, { status: 400 });
    }

    const identitySettings = buildIdentitySettingValues({ siteTitle, siteTagline, siteUrl, siteEmail, sitePhone, siteAddress, siteLegalName, siteLanguage });
    const user = await prisma.$transaction(async (tx) => {
      if (await tx.user.count() > 0) throw new Error('SYSTEM_ALREADY_INSTALLED');
      const createdUser = await tx.user.create({
        data: { username, email: adminEmail, password: hashPassword(password), name: username, role: 'ADMIN', emailVerified: true },
      });
      const settings = {
        ...identitySettings,
        allow_user_registration: 'false',
        registration_require_email_verify: 'false',
        default_registration_role: 'SUBSCRIBER',
        plugin_contact_enabled: 'true',
        active_theme: 'default',
        starter_theme_version: '2.0.0',
      };
      await Promise.all(Object.entries(settings).map(([key, value]) => tx.setting.upsert({
        where: { key }, update: { value }, create: { key, value },
      })));
      return createdUser;
    });

    return NextResponse.json({ success: true, userId: user.id, message: 'Cài đặt hoàn tất. Bạn có thể đăng nhập ngay.' });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'SYSTEM_ALREADY_INSTALLED') {
      return NextResponse.json({ success: false, error: 'Hệ thống đã được cài đặt.' }, { status: 403 });
    }
    console.error('Setup failed:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Không thể hoàn tất cài đặt.' }, { status: 500 });
  }
}
