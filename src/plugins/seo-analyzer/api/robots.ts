import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSiteUrl } from '@/lib/technicalSeo';

export const dynamic = 'force-dynamic';

const DEFAULT_DISALLOW = ['/api/', '/login', '/admin/'];

export async function GET() {
  try {
    const dbSettings = await prisma.setting.findMany();
    const settings = dbSettings.reduce((acc: Record<string, string>, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    const isSeoActive = settings.plugin_seo_enabled !== 'false';
    const robotsEnabled = settings.seo_robots_txt_enabled !== 'false';

    if (!isSeoActive || !robotsEnabled) {
      return new NextResponse('User-agent: *\nDisallow: /', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const siteUrl = getSiteUrl(settings);
    const configuredPaths = (settings.seo_robots_disallow_paths || '')
      .split(/\r?\n|,/)
      .map(path => path.trim())
      .filter(Boolean);
    const disallowPaths = configuredPaths.length > 0 ? configuredPaths : DEFAULT_DISALLOW;

    const txt = [
      'User-agent: *',
      'Allow: /',
      ...disallowPaths.map(path => `Disallow: ${path.startsWith('/') ? path : `/${path}`}`),
      '',
      `Sitemap: ${siteUrl}/sitemap.xml`,
      '',
    ].join('\n');

    return new NextResponse(txt, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('robots.txt generation error:', error);
    return new NextResponse('User-agent: *\nDisallow:', { status: 500 });
  }
}
