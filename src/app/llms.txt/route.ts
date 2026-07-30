import { GET as llmsTxtHandler } from '@/plugins/seo-analyzer/api/llms-txt';

export const dynamic = 'force-dynamic';

export async function GET() {
  return llmsTxtHandler();
}
