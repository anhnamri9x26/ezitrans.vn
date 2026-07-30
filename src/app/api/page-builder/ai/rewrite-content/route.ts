import { NextResponse } from 'next/server';
import { checkAIAccessAndLimits, createAiLog } from '@/lib/ai/aiAccess';
import { getActiveAIProvider } from '@/lib/ai/aiProvider';

export async function POST(req: Request) {
  let modelUsed = 'gemini-2.5-flash';
  let userId = 0;
  let rawPrompt = '';

  try {
    const access = await checkAIAccessAndLimits();
    if (!access.authorized) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status || 400 });
    }

    userId = access.user.id;
    modelUsed = access.model || 'gemini-2.5-flash';

    const body = await req.json();
    const { content, prompt } = body;
    rawPrompt = prompt;

    if (!content || !prompt) {
      return NextResponse.json({ success: false, error: 'Thiếu nội dung văn bản hoặc yêu cầu viết lại.' }, { status: 400 });
    }

    const provider = await getActiveAIProvider();
    
    // Call the AI provider to rewrite the text content
    const rewrittenText = await provider.rewriteContent(content, prompt, access.model, access.temperature);

    // Log the successful usage
    await createAiLog(userId, `Rewrite Content: ${prompt}`, modelUsed, 'SUCCESS');

    return NextResponse.json({
      success: true,
      text: rewrittenText
    });
  } catch (error: any) {
    console.error('Error in rewrite-content endpoint:', error);
    
    // Log the failure
    if (userId) {
      await createAiLog(userId, `Rewrite: ${rawPrompt || 'Rewrite Text'}`, modelUsed, 'FAILED', error.message);
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Không thể viết lại văn bản bằng AI. Vui lòng thử lại.'
    }, { status: 500 });
  }
}
