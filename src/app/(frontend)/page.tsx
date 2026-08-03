import React from 'react';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { resolveMetaTemplate } from '@/lib/metaTemplate';
import { getRobotsDirectives, getSiteUrl } from '@/lib/technicalSeo';
import { resolveTemplates } from '@/lib/templateResolver';
import { loadTemplateComponent } from '@/lib/templateLoader';
import TemplateShell from '@/components/TemplateShell';
import { loadHydratedSettings } from '@/lib/navigation/settings';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadHydratedSettings();

  const siteTitle = settings['site_title'] || 'Lexi';
  const siteTagline = settings['site_tagline'] || 'Vận Chuyển Hàng Quốc Tế';
  const isSeoEnabled = settings['plugin_seo_enabled'] !== 'false';
  const siteUrl = getSiteUrl(settings);

  let titleText = `${siteTitle} | ${siteTagline}`;
  let description = siteTagline;

  if (isSeoEnabled) {
    const titleTemplate = settings['seo_meta_title_home'] || '%sitename% %sep% %tagline%';
    const descTemplate = settings['seo_meta_desc_home'] || '';
    const sep = settings['seo_meta_separator'] || '|';
    
    const vars = {
      sep,
      sitename: siteTitle,
      tagline: siteTagline,
      title: siteTitle,
      excerpt: settings['seo_schema_description'] || siteTagline,
    };
    
    titleText = resolveMetaTemplate(titleTemplate, vars);
    const resolvedDesc = resolveMetaTemplate(descTemplate, vars);
    if (resolvedDesc) {
      description = resolvedDesc;
    } else if (settings['seo_schema_description']) {
      description = settings['seo_schema_description'];
    }
  }

  return {
    title: titleText,
    description,
    alternates: {
      canonical: siteUrl,
    },
    robots: getRobotsDirectives(settings, { index: true }),
  };
}

export default async function PublicHomepage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const legacySearch = Array.isArray(params.s) ? params.s[0] : params.s;
  if (legacySearch && legacySearch.trim()) {
    const { redirect } = await import('next/navigation');
    redirect(`/tim-kiem?q=${encodeURIComponent(legacySearch.trim().slice(0, 120))}`);
  }

  // 1. Lấy tất cả cài đặt hệ thống và menu đã phân công
  const settings = await loadHydratedSettings();

  // Hỗ trợ preview theme qua query param ?preview_theme=modern
  const previewTheme = typeof params.preview_theme === 'string' ? params.preview_theme : null;
  const activeTheme = previewTheme || settings['active_theme'] || 'default';

  // 2. Lấy tất cả bài viết đã công khai (PUBLISHED)
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      type: 'POST',
      publishedAt: { lte: new Date() }
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      author: {
        select: {
          name: true,
          username: true
        }
      },
      featuredImage: true
    }
  });

  // 2.5 Lấy danh mục sản phẩm
  const productCategories = await prisma.category.findMany({
    where: { type: 'PRODUCT' },
    take: 4,
    orderBy: { id: 'asc' }
  });

  // 3. Tải động (Dynamic Import) template Trang chủ của Theme đang kích hoạt
  const { default: defaultHomepageTemplate } = await import(`@/themes/${activeTheme}/Homepage`);
  let HomepageTemplate = defaultHomepageTemplate;

  // --- Template System Override Layer ---
  const resolveContext = {
    pageType: 'HOMEPAGE' as const,
  };

  const resolvedTemplates = await resolveTemplates(resolveContext);
  if (resolvedTemplates.body) {
    HomepageTemplate = await loadTemplateComponent(
      resolvedTemplates.body,
      activeTheme,
      'Homepage'
    );
  }

  return (
    <>
      {/* Preview Mode Banner */}
      {previewTheme && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white',
          padding: '10px 20px',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
        }}>
          <span>👁️ Đang xem trước giao diện: <strong>{activeTheme}</strong></span>
          <span style={{ opacity: 0.6 }}>|</span>
          <span style={{ opacity: 0.8, fontSize: '11px' }}>Đây chỉ là bản xem trước, chưa được kích hoạt cho người dùng.</span>
        </div>
      )}
      <TemplateShell
        context={resolveContext}
        settings={settings}
        activeTheme={activeTheme}
      >
        <HomepageTemplate posts={posts} settings={settings} productCategories={productCategories} />
      </TemplateShell>
    </>
  );
}
