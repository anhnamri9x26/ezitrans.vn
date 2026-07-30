import { GET as robotsHandler } from '@/plugins/seo-analyzer/api/robots';

export const dynamic = 'force-dynamic';

export async function GET() {
  return robotsHandler();
}
