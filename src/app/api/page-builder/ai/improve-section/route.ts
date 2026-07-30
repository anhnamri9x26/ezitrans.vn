import { NextResponse } from 'next/server';
import { checkAIAccessAndLimits, createAiLog } from '@/lib/ai/aiAccess';
import { getActiveAIProvider } from '@/lib/ai/aiProvider';
import { transformCraftNodeTreeToDsl, transformDslToCraftNodeTree } from '@/lib/ai/dslTransformer';

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
    const { sectionNodes, rootNodeId, prompt, designSystem } = body;
    rawPrompt = prompt;

    if (!sectionNodes || !rootNodeId || !prompt) {
      return NextResponse.json({ success: false, error: 'Thiếu dữ liệu section, rootNodeId hoặc prompt để cải tiến.' }, { status: 400 });
    }

    // Translate current flat CraftJS node tree to nested AI Layout DSL
    const sectionDsl = transformCraftNodeTreeToDsl(sectionNodes, rootNodeId);

    const provider = await getActiveAIProvider();
    
    // Call the AI provider to improve the layout DSL
    const improvedDsl = await provider.improveSection(sectionDsl, prompt, designSystem, access.model, access.temperature);

    // Transform improved DSL back into flat CraftJS nodes
    const craftTree = transformDslToCraftNodeTree(improvedDsl);

    // Log the successful usage
    await createAiLog(userId, `Improve Section: ${prompt}`, modelUsed, 'SUCCESS');

    return NextResponse.json({
      success: true,
      dsl: improvedDsl,
      builderData: JSON.stringify(craftTree.nodes),
      rootNodeId: craftTree.rootNodeId
    });
  } catch (error: any) {
    console.error('Error in improve-section endpoint:', error);
    
    // Log the failure
    if (userId) {
      await createAiLog(userId, `Improve Section: ${rawPrompt || 'Improve Layout'}`, modelUsed, 'FAILED', error.message);
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Không thể cải tiến Section bằng AI. Vui lòng thử lại.'
    }, { status: 500 });
  }
}
