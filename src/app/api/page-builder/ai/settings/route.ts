import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

// Helper to get active session user and role
async function getAuthenticatedUser() {
  return await getCurrentUser();
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasCap = await userCan(user, 'manage_templates');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'ai_design_enabled',
            'ai_design_model',
            'ai_design_temperature',
            'ai_design_max_requests_per_day',
            'ai_design_allowed_roles',
            'ai_design_gemini_api_key'
          ]
        }
      }
    });

    const settingsMap = settings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    const dbApiKey = settingsMap['ai_design_gemini_api_key'];
    const hasApiKey = Boolean(dbApiKey && dbApiKey.trim() !== '') || Boolean(process.env.GEMINI_API_KEY);
    const geminiApiKey = hasApiKey ? '••••••••••••••••' : '';

    // Provide sensible defaults
    const config = {
      enableAI: settingsMap['ai_design_enabled'] === 'true',
      model: settingsMap['ai_design_model'] || 'gemini-2.5-flash',
      temperature: parseFloat(settingsMap['ai_design_temperature'] || '0.7'),
      maxRequestsPerDay: parseInt(settingsMap['ai_design_max_requests_per_day'] || '50', 10),
      allowedRoles: settingsMap['ai_design_allowed_roles'] 
        ? JSON.parse(settingsMap['ai_design_allowed_roles']) 
        : ['ADMIN', 'EDITOR'],
      geminiApiKey
    };

    return NextResponse.json({ 
      success: true, 
      settings: config,
      hasApiKey
    });
  } catch (error: any) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only administrators can edit settings
    const hasCap = await userCan(user, 'manage_settings');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Chỉ Admin mới có quyền cập nhật cấu hình AI.' }, { status: 403 });
    }

    const body = await req.json();
    const { enableAI, model, temperature, maxRequestsPerDay, allowedRoles, geminiApiKey } = body;

    const updates = [
      { key: 'ai_design_enabled', value: String(Boolean(enableAI)) },
      { key: 'ai_design_model', value: model || 'gemini-2.5-flash' },
      { key: 'ai_design_temperature', value: String(Number(temperature ?? 0.7)) },
      { key: 'ai_design_max_requests_per_day', value: String(Number(maxRequestsPerDay ?? 50)) },
      { key: 'ai_design_allowed_roles', value: JSON.stringify(allowedRoles || ['ADMIN', 'EDITOR']) }
    ];

    if (geminiApiKey !== undefined && geminiApiKey !== '••••••••••••••••') {
      const { encrypt } = await import('@/lib/crypto');
      const encryptedKey = geminiApiKey.trim() ? encrypt(geminiApiKey.trim()) : '';
      updates.push({ key: 'ai_design_gemini_api_key', value: encryptedKey });
    }

    for (const update of updates) {
      await prisma.setting.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value }
      });
    }

    return NextResponse.json({ success: true, message: 'Cập nhật cấu hình AI Design thành công!' });
  } catch (error: any) {
    console.error('Error updating AI settings:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
