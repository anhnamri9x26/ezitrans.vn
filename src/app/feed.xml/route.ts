import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePostUrl } from '@/lib/permalink';
import { absoluteUrl, escapeXml, getSiteUrl, stripHtml } from '@/lib/technicalSeo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbSettings = await prisma.setting.findMany();
    const settings = dbSettings.reduce((acc: Record<string, string>, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    const isSeoActive = settings.plugin_seo_enabled !== 'false';
    const rssEnabled = settings.seo_rss_enabled !== 'false';

    if (!isSeoActive || !rssEnabled) {
      return new NextResponse('RSS feed is disabled', { status: 404 });
    }

    const siteUrl = getSiteUrl(settings);
    const siteTitle = settings.site_title || 'Lexi';
    const siteDescription = settings.site_tagline || 'Vận Chuyển Hàng Quốc Tế';
    const permalinkStructure = settings.permalink_structure || '/%postname%.html';
    const includeServices = settings.seo_rss_include_services !== 'false';
    const limit = Math.min(Math.max(Number(settings.seo_rss_limit || 20), 1), 100);

    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
        type: includeServices ? { in: ['POST', 'SERVICE'] } : 'POST',
      },
      include: {
        author: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    const items = posts.map(post => {
      const link = absoluteUrl(generatePostUrl(post, permalinkStructure), siteUrl);
      const description = post.excerpt || stripHtml(post.content).slice(0, 240);
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(post.author?.name || 'Lexi')}</dc:creator>
      <description>${escapeXml(description)}</description>
    </item>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>${escapeXml(settings.site_language || 'vi')}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('RSS feed generation error:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
