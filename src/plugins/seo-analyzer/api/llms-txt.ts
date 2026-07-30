import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePostUrl } from '@/lib/permalink';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch settings
    const dbSettings = await prisma.setting.findMany();
    const settings = dbSettings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    const isSeoActive = settings['plugin_seo_enabled'] !== 'false';
    const isLlmsTxtActive = settings['seo_llms_txt_enabled'] !== 'false';

    if (!isSeoActive || !isLlmsTxtActive) {
      return new NextResponse('llms.txt is disabled', { status: 404 });
    }

    const siteTitle = settings['site_title'] || 'Lexi';
    const siteTagline = settings['site_tagline'] || 'Vận Chuyển Hàng Quốc Tế';
    const permalinkStructure = settings['permalink_structure'] || '/%postname%.html';
    const siteUrl = 'https://lexi.vn';

    let txt = `# ${siteTitle}

> ${siteTagline}
> ${settings['footer_about_text'] || ''}

## Giới thiệu hệ thống
Hệ thống quản lý nội dung và logistics thông minh của ${siteTitle}. Dưới đây là danh sách toàn bộ liên kết tài nguyên, nội dung bài viết và trang dịch vụ chính thống được công khai phục vụ cho các mô hình ngôn ngữ lớn (LLM Crawler).

## Các trang chủ chốt (Core Pages)
`;

    const llmsMode = settings['seo_llms_txt_mode'] || 'automatic';

    if (llmsMode === 'manual') {
      const corePageKeys = [
        { key: 'seo_llms_txt_about_id', label: 'Về chúng tôi' },
        { key: 'seo_llms_txt_contact_id', label: 'Liên hệ' },
        { key: 'seo_llms_txt_terms_id', label: 'Điều khoản dịch vụ' },
        { key: 'seo_llms_txt_privacy_id', label: 'Chính sách bảo mật' },
        { key: 'seo_llms_txt_shop_id', label: 'Cửa hàng / Dịch vụ' }
      ];

      for (const item of corePageKeys) {
        const idVal = settings[item.key];
        if (idVal && !isNaN(Number(idVal))) {
          const corePage = await prisma.post.findUnique({
            where: { id: Number(idVal), status: 'PUBLISHED', publishedAt: { lte: new Date() } },
            select: { title: true, slug: true, excerpt: true }
          });
          if (corePage) {
            txt += `- [${corePage.title}](${siteUrl}/${corePage.slug}): ${corePage.excerpt || `Trang ${item.label} chính thức của chúng tôi.`}\n`;
          }
        }
      }
    } else {
      // Automatic: fetch first 5 published pages
      const autoPages = await prisma.post.findMany({
        where: { type: 'PAGE', status: 'PUBLISHED', publishedAt: { lte: new Date() } },
        select: { title: true, slug: true, excerpt: true },
        take: 5
      });
      autoPages.forEach(p => {
        txt += `- [${p.title}](${siteUrl}/${p.slug}): ${p.excerpt || `Xem thông tin trang ${p.title}.`}\n`;
      });
    }

    // Add latest posts / services
    txt += `
## Dịch vụ & Bài viết nổi bật (Services & Articles)
`;

    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED', type: { in: ['POST', 'SERVICE'] }, publishedAt: { lte: new Date() } },
      select: { id: true, title: true, slug: true, type: true, legacyId: true, createdAt: true, excerpt: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    posts.forEach(p => {
      const postUrl = `${siteUrl}${generatePostUrl(p, permalinkStructure)}`;
      const typeLabel = p.type === 'SERVICE' ? 'Dịch vụ' : 'Bài viết';
      txt += `- [${p.title}](${postUrl}): [${typeLabel}] ${p.excerpt || 'Đọc chi tiết nội dung của bài viết trên Lexi.'}\n`;
    });

    txt += `\n---
Tài liệu sinh tự động bởi SEO Plugin. Truy cập ${siteUrl} để cập nhật thông tin mới nhất.`;

    return new NextResponse(txt, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('llms.txt generation error:', error);
    return new NextResponse('Error generating llms.txt', { status: 500 });
  }
}
