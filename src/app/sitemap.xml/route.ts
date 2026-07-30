import { GET as sitemapHandler } from '@/plugins/seo-analyzer/api/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  return sitemapHandler();
}
