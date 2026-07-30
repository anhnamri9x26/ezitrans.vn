import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSeoScore, calculateReadabilityScore } from '@/hooks/useSeoAnalyzer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('type') || 'POST'; // POST or PAGE or SERVICE
    const categoryId = searchParams.get('category') || 'all';

    // Build prisma filter
    const where: any = {
      status: 'PUBLISHED',
      type: contentType as any,
      publishedAt: { lte: new Date() }
    };

    if (categoryId !== 'all' && contentType === 'POST') {
      where.categories = {
        some: {
          id: Number(categoryId)
        }
      };
    }

    const posts = await prisma.post.findMany({
      where,
      select: {
        title: true,
        content: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        slug: true
      }
    });

    const stats = {
      seo: { good: 0, ok: 0, bad: 0, none: 0 },
      readability: { good: 0, ok: 0, bad: 0, none: 0 }
    };

    posts.forEach(post => {
      // 1. Calculate SEO score
      if (!post.seoKeywords) {
        stats.seo.none++;
      } else {
        const seoScore = calculateSeoScore({
          title: post.title,
          content: post.content || '',
          seoTitle: post.seoTitle || '',
          seoDescription: post.seoDescription || '',
          seoKeywords: post.seoKeywords || '',
          slug: post.slug || ''
        });

        if (seoScore >= 80) stats.seo.good++;
        else if (seoScore >= 50) stats.seo.ok++;
        else stats.seo.bad++;
      }

      // 2. Calculate Readability score
      if (!post.content || post.content.replace(/<[^>]*>/g, '').trim().length === 0) {
        stats.readability.none++;
      } else {
        const readScore = calculateReadabilityScore({
          content: post.content || ''
        });

        if (readScore >= 80) stats.readability.good++;
        else if (readScore >= 50) stats.readability.ok++;
        else stats.readability.bad++;
      }
    });

    // Fetch categories list for dropdown filter
    const categories = await prisma.category.findMany({
      select: { id: true, name: true }
    });

    return NextResponse.json({
      success: true,
      stats,
      categories,
      totalCount: posts.length
    });
  } catch (error: any) {
    console.error('Failed to load SEO stats:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
