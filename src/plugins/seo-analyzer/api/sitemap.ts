import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePostUrl } from '@/lib/permalink';
import { escapeXml, getSiteUrl } from '@/lib/technicalSeo';

export const dynamic = 'force-dynamic';

type SitemapEntry = { url: string; lastmod?: Date; changefreq: string; priority: string };

export async function GET() {
  try {
    const dbSettings = await prisma.setting.findMany();
    const settings = dbSettings.reduce<Record<string, string>>((acc, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});
    if (settings.plugin_seo_enabled === 'false' || settings.seo_sitemap_enabled === 'false') {
      return new NextResponse('Sitemap is disabled', { status: 404 });
    }

    const now = new Date();
    const [posts, categories, tags, authors] = await Promise.all([
      prisma.post.findMany({
        where: { status: 'PUBLISHED', publishedAt: { lte: now } },
        select: { id: true, slug: true, type: true, legacyId: true, createdAt: true, publishedAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.category.findMany({
        where: { posts: { some: { status: 'PUBLISHED', publishedAt: { lte: now } } } },
        select: { slug: true },
      }),
      prisma.tag.findMany({
        where: { posts: { some: { status: 'PUBLISHED', publishedAt: { lte: now } } } },
        select: { slug: true },
      }),
      prisma.user.findMany({
        where: { posts: { some: { status: 'PUBLISHED', publishedAt: { lte: now }, type: { in: ['POST', 'SERVICE'] } } } },
        select: { username: true },
      }),
    ]);

    const siteUrl = getSiteUrl(settings);
    const permalinkStructure = settings.permalink_structure || '/%postname%.html';
    const categoryBase = settings.permalink_category_base || 'category';
    const tagBase = settings.permalink_tag_base || 'tag';
    const entries: SitemapEntry[] = [{ url: `${siteUrl}/`, changefreq: 'daily', priority: '1.0' }];
    const allow = {
      POST: settings.seo_index_posts !== 'false' && settings.seo_sitemap_posts !== 'false',
      PAGE: settings.seo_index_pages !== 'false' && settings.seo_sitemap_pages !== 'false',
      SERVICE: settings.seo_index_services !== 'false' && settings.seo_sitemap_services !== 'false',
      PRODUCT: settings.seo_index_products !== 'false' && settings.seo_sitemap_products !== 'false',
    } as Record<string, boolean>;

    for (const post of posts) {
      if (!allow[post.type] || (post.type === 'PAGE' && post.slug === 'trang-chu')) continue;
      const path = post.type === 'PAGE' ? `/${post.slug}` : generatePostUrl(post, permalinkStructure);
      entries.push({ url: `${siteUrl}${path}`, lastmod: post.updatedAt, changefreq: 'weekly', priority: post.type === 'PAGE' ? '0.8' : '0.7' });
    }
    if (settings.seo_index_categories !== 'false' && settings.seo_sitemap_categories !== 'false') {
      categories.forEach(category => entries.push({ url: `${siteUrl}/${categoryBase}/${category.slug}`, changefreq: 'weekly', priority: '0.5' }));
    }
    if (settings.seo_index_tags === 'true' && settings.seo_sitemap_tags === 'true') {
      tags.forEach(tag => entries.push({ url: `${siteUrl}/${tagBase}/${tag.slug}`, changefreq: 'monthly', priority: '0.3' }));
    }
    if (settings.seo_index_author_archive === 'true' && settings.seo_sitemap_author_archive === 'true') {
      authors.forEach(author => entries.push({ url: `${siteUrl}/author/${author.username}`, changefreq: 'monthly', priority: '0.4' }));
    }

    const unique = [...new Map(entries.map(entry => [entry.url, entry])).values()];
    const body = unique.map(entry => `  <url>\n    <loc>${escapeXml(entry.url)}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod.toISOString()}</lastmod>` : ''}\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Sitemap dynamic generation error:', error);
    return new NextResponse('Error generating sitemap XML', { status: 500 });
  }
}
