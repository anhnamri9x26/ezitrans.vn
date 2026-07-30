import { prisma } from '@/lib/prisma';

export interface AIDslNode {
  type: 'section' | 'row' | 'column' | 'heading' | 'text' | 'image' | 'button' | 'divider' | 'video' | 'spacer' | 'icon' | 'accordion' | 'carousel' | 'counter' | 'progress' | 'social_icons';
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  backgroundColor?: string;
  backgroundGradient?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  shadow?: string;
  gap?: string;
  justifyContent?: string;
  alignItems?: string;
  width?: string;
  
  // Block specific props
  text?: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  link?: string;
  fontSize?: string;
  fontWeight?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  url?: string;
  videoUrl?: string;
  iconName?: string;
  items?: { title: string; content: string }[];
  
  // Counter specific props
  startNumber?: number;
  endNumber?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  useThousandSeparator?: boolean;
  titleTag?: string;
  
  // Progress Bar specific props
  title?: string;
  percentage?: number;
  displayPercentage?: boolean;
  barType?: 'default' | 'inner';
  stripeEnabled?: boolean;
  stripeAnimated?: boolean;
  
  children?: AIDslNode[];
  dynamicText?: {
    enabled: boolean;
    source: string;
    field: string;
    before?: string;
    after?: string;
    fallback?: string;
  };
  dynamicLink?: {
    enabled: boolean;
    source: string;
    field: string;
  };
  dynamicUrl?: {
    enabled: boolean;
    source: string;
    field: string;
  };
}

export interface AIProvider {
  generateSection(prompt: string, designSystem: any, model?: string, temperature?: number): Promise<AIDslNode>;
  improveSection(sectionDsl: AIDslNode, prompt: string, designSystem: any, model?: string, temperature?: number): Promise<AIDslNode>;
  rewriteContent(content: string, prompt: string, model?: string, temperature?: number): Promise<string>;
}

export class GeminiProvider implements AIProvider {
  private async getApiKey(): Promise<string> {
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && envKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      return envKey;
    }

    const dbKeySetting = await prisma.setting.findUnique({
      where: { key: 'ai_design_gemini_api_key' }
    });

    if (dbKeySetting && dbKeySetting.value) {
      const { decrypt } = await import('@/lib/crypto');
      const decrypted = decrypt(dbKeySetting.value);
      if (decrypted) return decrypted;
    }

    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng thiết lập khóa API trong Cấu hình AI ở phần Cài đặt hệ thống.');
  }

  private async callGemini(systemInstruction: string, prompt: string, model: string = 'gemini-2.5-flash', temperature: number = 0.7, jsonMode: boolean = true): Promise<string> {
    const apiKey = await this.getApiKey();
    // Support newer models, default to gemini-2.5-flash as requested
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody: any = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 8000,
      }
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [
          { text: systemInstruction }
        ]
      };
    }

    if (jsonMode) {
      requestBody.generationConfig.responseMimeType = 'application/json';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error (HTTP ${response.status}): ${errText || response.statusText}`);
    }

    const resJson = await response.json();
    const textOut = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOut) {
      throw new Error('Gemini API trả về kết quả rỗng hoặc không hợp lệ.');
    }

    return textOut;
  }

  async generateSection(prompt: string, designSystem: any, model?: string, temperature?: number): Promise<AIDslNode> {
    const systemInstruction = `You are a Visual Page Builder Layout Expert.
Your job is to generate a custom UI Section based on the user's prompt.
You must output a SINGLE JSON object representing the layout in our AI Layout DSL format.
The root DSL node MUST have type="section".

CRITICAL: You must strictly respect the following Design System parameters:
- Global colors: ${JSON.stringify(designSystem?.colors || {})}
- Global fonts: ${JSON.stringify(designSystem?.typography || {})}
- Spacing & Radius guidelines: Spacing should match layout standards. Primary/Secondary buttons should respect preset colors and border radius.
- Container max width: ${designSystem?.layout?.contentWidth || '1200px'}

DSL Types and Properties Reference:
- 'section': Root container. Can have children.
- 'row': Horizontal grid container.
- 'column': Child container inside a row. Must specify "width" prop (e.g. "50%", "33.3%", "100%").
- 'heading': Heading text. Props: level ('h1'-'h6'), fontSize, fontWeight, textColor, textAlign.
- 'text': Paragraph text. Props: fontSize, textColor, textAlign.
- 'image': Image block. Props: url, link.
- 'button': CTA Button. Props: text, link, backgroundColor, textColor, borderRadius.
- 'divider': Separator line.
- 'video': Video block. Props: videoUrl.
- 'spacer': Spacer block. Props: height.
- 'icon': Icon block. Props: iconName (Lucide icon name).
- 'accordion': FAQ container. Props: items (array of {title, content}).

Content guidelines:
- Never use Lorem Ipsum. Create realistic text in Vietnamese suitable for the prompt, business profile (e.g., Lexi - transport/shipping) or context.
- Use dynamic variables when appropriate:
  Format: "dynamicText": {"enabled": true, "source": "post" | "site" | "user" | "dateTime", "field": "title" | "excerpt" | "siteName" etc.}
  Examples:
  - For post title heading: dynamicText: { enabled: true, source: 'post', field: 'title' }
  - For site tagline paragraph: dynamicText: { enabled: true, source: 'site', field: 'tagline' }
`;

    const fullPrompt = `Hãy tạo một Section với yêu cầu sau: "${prompt}".
Hãy sử dụng đúng các thông số màu sắc và font chữ trong Design System đã cung cấp.`;

    const rawResult = await this.callGemini(systemInstruction, fullPrompt, model, temperature, true);
    return JSON.parse(rawResult) as AIDslNode;
  }

  async improveSection(sectionDsl: AIDslNode, prompt: string, designSystem: any, model?: string, temperature?: number): Promise<AIDslNode> {
    const systemInstruction = `You are a Visual Page Builder Layout Expert.
Your job is to modify and improve an existing layout section based on the user's instructions.
You are given the current section structure represented in the AI Layout DSL format.
You must output a SINGLE JSON object representing the improved layout in the exact same AIDslNode format.
Ensure that the output section has the same type="section" at the root.

CRITICAL: Keep the core content but rewrite, restyle, or reorganize it according to the user's prompt (e.g. "make it modern", "increase conversion rates", "optimize mobile spacing").
Respect the Design System parameters:
- Global colors: ${JSON.stringify(designSystem?.colors || {})}
- Global fonts: ${JSON.stringify(designSystem?.typography || {})}
`;

    const fullPrompt = `Dưới đây là cấu trúc hiện tại của Section ở định dạng JSON DSL:
${JSON.stringify(sectionDsl, null, 2)}

Yêu cầu cải tiến: "${prompt}".
Hãy trả về JSON DSL của Section sau khi đã tối ưu.`;

    const rawResult = await this.callGemini(systemInstruction, fullPrompt, model, temperature, true);
    return JSON.parse(rawResult) as AIDslNode;
  }

  async rewriteContent(content: string, prompt: string, model?: string, temperature?: number): Promise<string> {
    const systemInstruction = `You are a professional copywriting assistant.
Your job is to rewrite the user's text content according to their instruction/tone (e.g. "make it professional", "shorten it", "make it SEO-friendly", "educational tone").
Only return the rewritten text. Do NOT explain or include markdown wraps. Return raw text directly.`;

    const fullPrompt = `Nội dung gốc: "${content}"
Yêu cầu viết lại: "${prompt}"`;

    return await this.callGemini(systemInstruction, fullPrompt, model, temperature, false);
  }
}

export async function getActiveAIProvider(): Promise<AIProvider> {
  // Currently, we default to GeminiProvider.
  // In Phase 2, this factory can lookup the active provider key from the Settings table.
  return new GeminiProvider();
}
