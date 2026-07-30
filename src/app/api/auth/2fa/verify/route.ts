import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';
import crypto from 'crypto';

function generateRecoveryCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex'));
  }
  return codes;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ success: false, error: '2FA is already enabled' }, { status: 400 });
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json({ success: false, error: '2FA setup not initiated' }, { status: 400 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid OTP token' }, { status: 400 });
    }

    const recoveryCodes = generateRecoveryCodes();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: JSON.stringify(recoveryCodes)
      }
    });

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
      recoveryCodes
    });
  } catch (error: any) {
    console.error('Error in 2FA verify:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
