import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, hashPassword, needsRehash } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { isIpLocked, recordFailedAttempt, resetAttempts } from '@/lib/rateLimit';
import speakeasy from 'speakeasy';
import { logSecurityEvent } from '@/lib/security/securityEvent';

export async function POST(req: Request) {
  // Get IP address from headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  try {
    // Check Rate Limiting first
    const rateCheck = isIpLocked(ip);
    if (rateCheck.locked) {
      await logSecurityEvent({
        type: 'login_locked',
        severity: 'warning',
        message: `IP bị khóa đăng nhập tạm thời sau nhiều lần sai: ${ip}`,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || null,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${rateCheck.remainingMinutes} phút.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password, token } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập Tên tài khoản và Mật khẩu!' },
        { status: 400 }
      );
    }

    // Locate user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: username.trim() }
        ]
      }
    });

    // Seeder fallback: if no users exist, auto-create a default admin
    if (!user) {
      const allUsersCount = await prisma.user.count();
      if (allUsersCount === 0) {
        user = await prisma.user.create({
          data: {
            username: 'admin',
            email: 'admin@lexi.vn',
            password: hashPassword('password123'),
            name: 'Administrator',
            role: 'ADMIN',
            emailVerified: true // Admin is auto-verified
          }
        });
      }
    }

    if (!user) {
      recordFailedAttempt(ip);
      await logSecurityEvent({
        type: 'login_failed',
        severity: 'warning',
        message: `Đăng nhập thất bại cho tài khoản không tồn tại: ${username}`,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || null,
        metadata: { username },
      });
      return NextResponse.json(
        { success: false, error: 'Tên tài khoản hoặc mật khẩu không chính xác!' },
        { status: 400 }
      );
    }

    // Verify password
    const isMatched = comparePassword(password, user.password);
    if (!isMatched) {
      // Fallback check for unhashed passwords (in case of old seeding)
      if (user.password === password) {
        // Upgrade password to bcrypt
        user = await prisma.user.update({
          where: { id: user.id },
          data: { password: hashPassword(password) }
        });
      } else {
        const lockout = recordFailedAttempt(ip);
        let errorMsg = 'Tên tài khoản hoặc mật khẩu không chính xác!';
        if (lockout.locked) {
          errorMsg = `Tên tài khoản hoặc mật khẩu không chính xác! Bạn đã bị khóa đăng nhập trong ${lockout.remainingMinutes} phút do nhập sai nhiều lần.`;
        }
        await logSecurityEvent({
          type: 'login_failed',
          severity: lockout.locked ? 'critical' : 'warning',
          message: `Đăng nhập thất bại cho user ${user.username} từ IP ${ip}`,
          userId: user.id,
          ipAddress: ip,
          userAgent: req.headers.get('user-agent') || null,
          metadata: { locked: lockout.locked },
        });
        return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
      }
    }

    // Password matches! Check if it needs rehash (if legacy hash was validated successfully)
    if (needsRehash(user.password)) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { password: hashPassword(password) }
      });
    }

    // Email activation check: if required and user is not verified (excluding Admin)
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    const requireVerify = settingsMap.registration_require_email_verify === 'true';
    if (requireVerify && !user.emailVerified && user.role !== 'ADMIN') {
      const origin = new URL(req.url).origin;
      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
      const devActivationLink = (isLocalhost && user.emailVerifyToken) 
        ? `${origin}/activate?token=${user.emailVerifyToken}` 
        : null;

      return NextResponse.json(
        {
          success: false,
          error: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoản của bạn.',
          unverified: true,
          email: user.email,
          devActivationLink
        },
        { status: 403 }
      );
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!token) {
        await logSecurityEvent({
          type: 'two_factor_required',
          severity: 'info',
          message: `Yêu cầu 2FA cho user ${user.username}`,
          userId: user.id,
          ipAddress: ip,
          userAgent: req.headers.get('user-agent') || null,
        });
        return NextResponse.json({ success: true, requires2fa: true, message: 'Yêu cầu xác thực 2 bước' });
      }

      if (!user.twoFactorSecret) {
         return NextResponse.json({ success: false, error: '2FA is enabled but secret is missing' }, { status: 500 });
      }

      const isValidOtp = speakeasy.totp.verify({ 
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token 
      });
      
      let isRecoveryCode = false;
      let validRecoveryCodes: string[] = [];
      if (!isValidOtp && user.twoFactorRecoveryCodes) {
        try {
          validRecoveryCodes = JSON.parse(user.twoFactorRecoveryCodes);
          if (validRecoveryCodes.includes(token)) {
            isRecoveryCode = true;
            validRecoveryCodes = validRecoveryCodes.filter(c => c !== token);
          }
        } catch { }
      }

      if (!isValidOtp && !isRecoveryCode) {
        recordFailedAttempt(ip);
        await logSecurityEvent({
          type: 'two_factor_failed',
          severity: 'warning',
          message: `Mã 2FA không hợp lệ cho user ${user.username}`,
          userId: user.id,
          ipAddress: ip,
          userAgent: req.headers.get('user-agent') || null,
        });
        return NextResponse.json({ success: false, error: 'Mã xác thực không hợp lệ' }, { status: 400 });
      }

      if (isRecoveryCode) {
        // Save used recovery code
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorRecoveryCodes: JSON.stringify(validRecoveryCodes) }
        });
      }
    }

    // Reset rate limiter on successful login
    resetAttempts(ip);

    // Check if IP is new
    if (user.lastLoginIp && user.lastLoginIp !== ip) {
      await logSecurityEvent({
        type: 'new_ip_login',
        severity: 'warning',
        message: `Đăng nhập từ IP mới: ${ip} (IP cũ: ${user.lastLoginIp})`,
        userId: user.id,
        ipAddress: ip,
      });
    }

    // Update last login info
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip }
    });

    // Create session (sets cookie as well)
    const userAgent = req.headers.get('user-agent') || '';
    await createSession(user.id, ip, userAgent);

    await logSecurityEvent({
      type: 'login_success',
      severity: 'info',
      message: `Đăng nhập thành công: ${user.username}`,
      userId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({ success: true, message: 'Đăng nhập thành công' });
  } catch (error: any) {
    console.error('Error logging in:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
