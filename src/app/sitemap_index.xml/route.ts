import { NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/technicalSeo';
import { loadHydratedSettings } from '@/lib/navigation/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await loadHydratedSettings();
  const siteUrl = getSiteUrl(settings);
  const lastmod = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`;
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
