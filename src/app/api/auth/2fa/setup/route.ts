import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ success: false, error: '2FA is already enabled' }, { status: 400 });
    }

    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: process.env.NEXT_PUBLIC_SITE_NAME ? `${process.env.NEXT_PUBLIC_SITE_NAME} (${user.email})` : `Lexi CMS (${user.email})`
    });
    
    // Generate QR code data URL
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Save secret to user but keep enabled = false until verified
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret.base32, twoFactorEnabled: false }
    });

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl,
      secret: secret.base32
    });
  } catch (error: any) {
    console.error('Error in 2FA setup:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
