import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePostUrl } from '@/lib/permalink';
import { escapeXml, getSiteUrl } from '@/lib/technicalSeo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Load SEO settings
    const dbSettings = await prisma.setting.findMany();
    const settings = dbSettings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    const isSeoActive = settings['plugin_seo_enabled'] !== 'false';
    const sitemapEnabled = settings['seo_sitemap_enabled'] !== 'false';

    if (!isSeoActive || !sitemapEnabled) {
      return new NextResponse('Sitemap is disabled', { status: 404 });
    }

    const permalinkStructure = settings['permalink_structure'] || '/%postname%.html';

    // 2. Fetch all published posts and pages
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() }
      },
      select: {
        id: true,
        slug: true,
        type: true,
        legacyId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // 3. Fetch all categories
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
      },
    });

    // 4. Fetch all tags
    const tags = await prisma.tag.findMany({
      select: {
        slug: true,
      },
    });

    const siteUrl = getSiteUrl(settings);
    
    // Indexing settings
    const indexPosts = settings['seo_index_posts'] !== 'false';
    const indexPages = settings['seo_index_pages'] !== 'false';
    const indexServices = settings['seo_index_services'] !== 'false';
    const indexProducts = settings['seo_index_products'] !== 'false';
    const indexCategories = settings['seo_index_categories'] !== 'false';
    const indexTags = settings['seo_index_tags'] === 'true';

    // Sitemap settings (independent from indexing controls)
    const sitemapPosts = settings['seo_sitemap_posts'] !== undefined ? settings['seo_sitemap_posts'] !== 'false' : indexPosts;
    const sitemapPages = settings['seo_sitemap_pages'] !== undefined ? settings['seo_sitemap_pages'] !== 'false' : indexPages;
    const sitemapServices = settings['seo_sitemap_services'] !== undefined ? settings['seo_sitemap_services'] !== 'false' : indexServices;
    const sitemapProducts = settings['seo_sitemap_products'] !== undefined ? settings['seo_sitemap_products'] !== 'false' : indexProducts;
    const sitemapCategories = settings['seo_sitemap_categories'] !== undefined ? settings['seo_sitemap_categories'] !== 'false' : indexCategories;
    const sitemapTags = settings['seo_sitemap_tags'] !== undefined ? settings['seo_sitemap_tags'] === 'true' : indexTags;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Add posts, pages, and services based on independent sitemap controls
    posts
      .filter((post) => {
        if (post.type === 'PAGE') return sitemapPages;
        if (post.type === 'SERVICE') return sitemapServices;
        if (post.type === 'PRODUCT') return sitemapProducts;
        return sitemapPosts;
      })
      .forEach((post) => {
      let postUrl = '';
      if (post.type === 'PAGE') {
        postUrl = `${siteUrl}/${post.slug}`;
      } else {
        postUrl = `${siteUrl}${generatePostUrl(post, permalinkStructure)}`;
      }
      
      const lastmod = post.updatedAt.toISOString().split('T')[0];
      xml += `
  <url>
    <loc>${escapeXml(postUrl)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${post.type === 'PAGE' ? '0.8' : '0.7'}</priority>
  </url>`;
    });

    if (sitemapCategories) {
      categories.forEach((cat) => {
        xml += `
  <url>
    <loc>${escapeXml(`${siteUrl}/category/${cat.slug}`)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
      });
    }

    if (sitemapTags) {
      tags.forEach((tag) => {
        xml += `
  <url>
    <loc>${escapeXml(`${siteUrl}/tag/${tag.slug}`)}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`;
      });
    }

    xml += '\n</urlset>';

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
