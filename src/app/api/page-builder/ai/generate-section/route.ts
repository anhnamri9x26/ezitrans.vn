import { NextResponse } from 'next/server';
import { checkAIAccessAndLimits, createAiLog } from '@/lib/ai/aiAccess';
import { getActiveAIProvider } from '@/lib/ai/aiProvider';
import { transformDslToCraftNodeTree } from '@/lib/ai/dslTransformer';

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
    const { prompt, designSystem } = body;
    rawPrompt = prompt;

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin prompt để tạo Section.' }, { status: 400 });
    }

    const provider = await getActiveAIProvider();
    
    // Call the AI provider to generate the section layout DSL
    const dsl = await provider.generateSection(prompt, designSystem, access.model, access.temperature);

    // Transform DSL to CraftJS node tree (includes security validation and HTML sanitization)
    const craftTree = transformDslToCraftNodeTree(dsl);

    // Log the successful usage
    await createAiLog(userId, prompt, modelUsed, 'SUCCESS');

    return NextResponse.json({
      success: true,
      dsl,
      builderData: JSON.stringify(craftTree.nodes),
      rootNodeId: craftTree.rootNodeId
    });
  } catch (error: any) {
    console.error('Error in generate-section endpoint:', error);
    
    // Log the failure
    if (userId) {
      await createAiLog(userId, rawPrompt || 'Generate Section', modelUsed, 'FAILED', error.message);
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Không thể tạo Section bằng AI. Vui lòng thử lại.'
    }, { status: 500 });
  }
}
