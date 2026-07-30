import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    // 1. Destroy session in database and delete the lexi_session_token cookie
    await destroySession();

    // 2. Double-check and delete any legacy session cookies
    const cookieStore = await cookies();
    cookieStore.set('lexi_session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    cookieStore.set('lexi_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });

    // 3. Redirect back to login page
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('Error clearing invalid session:', error);
    // Fallback redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}
