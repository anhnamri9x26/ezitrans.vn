import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession } from '@/lib/session';

export async function POST() {
  try {
    // Destroy database-backed session token and clear token cookie
    await destroySession();

    // Also clear the legacy session cookie just in case
    const cookieStore = await cookies();
    cookieStore.set('lexi_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });

    return NextResponse.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await destroySession();

    const cookieStore = await cookies();
    cookieStore.set('lexi_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });

    return NextResponse.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
