import { NextResponse } from 'next/server';
import { localeCookieName, supportedLocales } from '@/lib/i18n/config';

export async function POST(req: Request) {
  try {
    const { locale } = await req.json();
    if (!supportedLocales.includes(locale)) {
      return NextResponse.json({ success: false, error: 'Invalid locale' }, { status: 400 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(localeCookieName, locale, { path: '/', sameSite: 'lax' });
    return res;
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Bad request' }, { status: 400 });
  }
}
