import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

// Helper to get active session user and role
async function getAuthenticatedUser() {
  return await getCurrentUser();
}

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasCap = await userCan(user, 'manage_templates');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Load API Key from DB or fallback to env
    const dbKeySetting = await prisma.setting.findUnique({
      where: { key: 'ai_design_gemini_api_key' }
    });

    let apiKey = '';
    if (dbKeySetting && dbKeySetting.value) {
      apiKey = decrypt(dbKeySetting.value);
    } else {
      apiKey = process.env.GEMINI_API_KEY || '';
    }

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json({ success: true, valid: false, error: 'API Key chưa được cấu hình ở Database hoặc .env' });
    }

    // Quick test fetch to Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Kiểm tra' }] }]
      })
    });

    if (res.ok) {
      return NextResponse.json({ success: true, valid: true });
    } else {
      const errorText = await res.text();
      let errorMsg = `Lỗi kết nối Gemini API (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error?.message) {
          errorMsg += `: ${parsed.error.message}`;
        }
      } catch (e) {
        errorMsg += `: ${errorText.substring(0, 100)}`;
      }
      return NextResponse.json({ success: true, valid: false, error: errorMsg });
    }
  } catch (error: any) {
    console.error('API Verification error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
