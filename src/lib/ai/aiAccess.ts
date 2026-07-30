import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

export interface AIAccessResult {
  authorized: boolean;
  user?: any;
  model?: string;
  temperature?: number;
  error?: string;
  status?: number;
}

export async function checkAIAccessAndLimits(): Promise<AIAccessResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { authorized: false, error: 'Vui lòng đăng nhập để sử dụng tính năng này.', status: 401 };
  }

  // Fetch AI Settings
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'ai_design_enabled',
          'ai_design_model',
          'ai_design_temperature',
          'ai_design_max_requests_per_day',
          'ai_design_allowed_roles'
        ]
      }
    }
  });

  const settingsMap = settings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
    acc[cur.key] = cur.value;
    return acc;
  }, {});

  const enableAI = settingsMap['ai_design_enabled'] === 'true';
  if (!enableAI) {
    return { authorized: false, error: 'Tính năng AI Design hiện đang bị tắt bởi quản trị viên.', status: 403 };
  }

  const hasCap = await userCan(user, 'manage_templates');
  if (!hasCap) {
    return { authorized: false, error: 'Vai trò tài khoản của bạn không được cấp quyền sử dụng AI Design.', status: 403 };
  }

  const maxRequestsPerDay = parseInt(settingsMap['ai_design_max_requests_per_day'] || '50', 10);

  // Quota check: Count requests today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.aiUsageLog.count({
    where: {
      createdAt: {
        gte: startOfDay
      }
    }
  });

  if (count >= maxRequestsPerDay) {
    return { authorized: false, error: 'Đã đạt giới hạn số lần yêu cầu AI tối đa trong ngày của hệ thống.', status: 429 };
  }

  const model = settingsMap['ai_design_model'] || 'gemini-2.5-flash';
  const temperature = parseFloat(settingsMap['ai_design_temperature'] || '0.7');

  return {
    authorized: true,
    user,
    model,
    temperature
  };
}

export async function createAiLog(userId: number, prompt: string, model: string, status: 'SUCCESS' | 'FAILED', error?: string) {
  try {
    // Truncate prompt for summary representation
    const promptSummary = prompt.length > 100 ? prompt.substring(0, 97) + '...' : prompt;
    
    // Estimate tokens roughly if not returned by API (e.g. 1 word ≈ 1.3 tokens)
    const estimatedTokens = Math.ceil(prompt.split(/\s+/).length * 1.5);

    await prisma.aiUsageLog.create({
      data: {
        userId,
        promptSummary,
        model,
        tokens: estimatedTokens,
        status,
        error: error || null
      }
    });
  } catch (err) {
    console.error('Lỗi khi tạo nhật ký sử dụng AI:', err);
  }
}
