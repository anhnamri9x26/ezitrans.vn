import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ success: false, error: '2FA is not enabled' }, { status: 400 });
    }

    // You might want to require password to disable 2FA in a highly secure environment
    // For now, simple disable since user is authenticated
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: null
      }
    });

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error: any) {
    console.error('Error in 2FA disable:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
