import { permanentRedirect } from 'next/navigation';
import NotFoundContent from './NotFoundContent';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Calendar, User, ArrowLeft, Home, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Metadata } from 'next';
import PublicCommentsSection from '@/components/PublicCommentsSection';
import { cookies } from 'next/headers';
import { resolveMetaTemplate } from '@/lib/metaTemplate';
import { resolveTemplates } from '@/lib/templateResolver';
import { loadTemplateComponent } from '@/lib/templateLoader';
import TemplateShell from '@/components/TemplateShell';
import { getCurrentUser } from '@/lib/session';
import DefaultPageTemplate from '@/themes/default/Page';
import DefaultPostTemplate from '@/themes/default/PostPage';
import DefaultProductTemplate from '@/themes/default/ProductPage';
import { cache } from 'react';
import { loadHydratedSettings } from '@/lib/navigation/settings';
import SearchArchive from './SearchArchive';
import AuthorArchive from './AuthorArchive';

interface CatchAllProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

import { parsePermalinkStructure, generatePostUrl, formatDateWordPress, resolvePostFromUrl } from '@/lib/permalink';
import {
  buildBreadcrumbSchema,
  getPostCanonicalUrl,
  getRobotsDirectives,
  getSiteUrl,
  getSocialImageUrl,
} from '@/lib/technicalSeo';

const getCachedSettings = cache(loadHydratedSettings);

const getCachedPostFromUrl = cache(async (urlPath: string, structure: string, productStructure: string) => {
  return resolvePostFromUrl(urlPath, structure, productStructure, prisma);
});

const normalizePathForCompare = (path: string) => path.endsWith('/') ? path.slice(0, -1) : path;

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: CatchAllProps): Promise<Metadata> {
  const { slug } = await params;
  const urlPath = '/' + slug.join('/');

  // 1. Fetch settings
  const settings = await getCachedSettings();

  const siteTitle = settings['site_title'] || 'lexi.vn';
  const siteUrl = getSiteUrl(settings);

  // 1.5 Intercept Taxonomy Routing
  const categoryBase = settings['permalink_category_base'] || 'category';
  const tagBase = settings['permalink_tag_base'] || 'tag';
  const productCategoryBase = settings['permalink_product_category_base'] || 'danh-muc-san-pham';

  if (slug.length >= 2) {
    if (slug[0] === categoryBase) {
      const taxonomySlug = slug[1];
      const cat = await prisma.category.findUnique({ where: { slug: taxonomySlug } });
      if (cat) return { title: `Chuyên mục: ${cat.name} | ${siteTitle}`, description: cat.description };
    } else if (slug[0] === tagBase) {
      const taxonomySlug = slug[1];
      const tag = await prisma.tag.findUnique({ where: { slug: taxonomySlug } });
      if (tag) return { title: `Thẻ: ${tag.name} | ${siteTitle}` };
    } else if (slug[0] === productCategoryBase) {
      const taxonomySlug = slug[1];
      const cat = await prisma.category.findUnique({ where: { slug: taxonomySlug } });
      if (cat) return { title: `Danh mục sản phẩm: ${cat.name} | ${siteTitle}`, description: cat.description };
    }
  }

  // Archive routes are valid pages, not missing-content pages.
  if (slug.length === 1 && slug[0] === 'tim-kiem') {
    return {
      title: `Tìm kiếm | ${siteTitle}`,
      description: `Tìm kiếm bài viết và dịch vụ trên ${siteTitle}`,
      robots: getRobotsDirectives(settings, { index: false }),
    };
  }

  if (slug.length === 2 && slug[0] === 'author') {
    const author = await prisma.user.findUnique({
      where: { username: slug[1] },
      select: { name: true, username: true }
    });
    if (author) {
      const authorName = author.name || author.username;
      return {
        title: `Tác giả: ${authorName} | ${siteTitle}`,
        description: `Các bài viết được xuất bản bởi ${authorName} trên ${siteTitle}`,
      };
    }
  }

  if (slug.length === 1 && slug[0] === 'tin-tuc') {
    return {
      title: `Tất cả bài viết | ${siteTitle}`,
      description: settings['site_tagline'] || `Tất cả bài viết trên ${siteTitle}`,
    };
  }

  if (slug.length === 1 && slug[0] === (settings['permalink_product_base'] || 'san-pham')) {
    return {
      title: `Tất cả sản phẩm | ${siteTitle}`,
      description: settings['site_tagline'] || `Tất cả sản phẩm trên ${siteTitle}`,
    };
  }

  const isSeoEnabled = settings['plugin_seo_enabled'] !== 'false';
  const structure = settings['permalink_structure'] || '/%postname%.html';
  const productBaseSetting = settings['permalink_product_base'] || 'san-pham';
  const productStructureBase = productBaseSetting.startsWith('/') ? productBaseSetting : '/' + productBaseSetting;
  const productStructure = productStructureBase.endsWith('/') ? productStructureBase + '%postname%/' : productStructureBase + '/%postname%/';

  // 2. Resolve post from URL (includes fallback logic)
  const post = await getCachedPostFromUrl(urlPath, structure, productStructure);

  if (!post) {
    return {
      title: 'KhÃ´ng tÃ¬m tháº¥y ná»™i dung',
      robots: getRobotsDirectives(settings, { index: false })
    };
  }


  // siteTitle is already defined at the top
  
  let titleText = post.title;
  let description = post.excerpt || `Äá»c ${post.title} trÃªn ${siteTitle}`;

  if (isSeoEnabled) {
    if (post.seoTitle) {
      titleText = post.seoTitle;
    } else {
      const template = post.type === 'PAGE'
        ? settings['seo_meta_title_page'] || '%title% %sep% %sitename%'
        : post.type === 'SERVICE'
          ? settings['seo_meta_title_service'] || '%title% %sep% %sitename%'
          : post.type === 'PRODUCT'
            ? settings['seo_meta_title_product'] || '%title% %sep% %sitename%'
            : settings['seo_meta_title_post'] || '%title% %sep% %sitename%';
      
      const sep = settings['seo_meta_separator'] || '|';
      const mainCategory = post.categories?.[0]?.name || '';
      titleText = resolveMetaTemplate(template, {
        title: post.title,
        slug: post.slug || '',
        category: mainCategory,
        sep,
        sitename: siteTitle,
        excerpt: post.excerpt || post.content?.replace(/<[^>]*>/g, '').substring(0, 160) || '',
        author: post.author?.name || '',
        tagline: settings['site_tagline'] || '',
      });
    }

    if (post.seoDescription) {
      description = post.seoDescription;
    } else {
      const template = post.type === 'PAGE'
        ? settings['seo_meta_desc_page'] || '%excerpt%'
        : post.type === 'SERVICE'
          ? settings['seo_meta_desc_service'] || '%excerpt%'
          : post.type === 'PRODUCT'
            ? settings['seo_meta_desc_product'] || '%excerpt%'
            : settings['seo_meta_desc_post'] || '%excerpt%';
      
      const sep = settings['seo_meta_separator'] || '|';
      const mainCategory = post.categories?.[0]?.name || '';
      description = resolveMetaTemplate(template, {
        title: post.title,
        slug: post.slug || '',
        category: mainCategory,
        sep,
        sitename: siteTitle,
        excerpt: post.excerpt || post.content?.replace(/<[^>]*>/g, '').substring(0, 160) || '',
        author: post.author?.name || '',
        tagline: settings['site_tagline'] || '',
      });
    }
  } else {
    titleText = `${post.title} | ${siteTitle}`;
  }
  
  let canonicalBaseUrl = siteUrl;
  if (settings['seo_canonical_mode'] === 'custom' && settings['seo_canonical_custom_domain']) {
    canonicalBaseUrl = settings['seo_canonical_custom_domain'].replace(/\/+$/, '');
  }
  const canonical = getPostCanonicalUrl(post, structure, canonicalBaseUrl);
  const image = getSocialImageUrl(post, settings, siteUrl);
  const isPublic = post.status === 'PUBLISHED' && new Date(post.publishedAt) <= new Date();
  const typeIndexSetting = post.type === 'PAGE'
    ? settings['seo_index_pages'] !== 'false'
    : post.type === 'SERVICE'
      ? settings['seo_index_services'] !== 'false'
      : post.type === 'PRODUCT'
        ? settings['seo_index_products'] !== 'false'
        : settings['seo_index_posts'] !== 'false';

  return {
    title: titleText,
    description,
    keywords: isSeoEnabled ? (post.seoKeywords || undefined) : undefined,
    alternates: {
      canonical,
    },
    robots: getRobotsDirectives(settings, { index: isPublic && typeIndexSetting }),
    openGraph: {
      type: post.type === 'PAGE' ? 'website' : 'article',
      title: titleText,
      description,
      url: canonical,
      siteName: siteTitle,
      images: image ? [{ url: image, alt: titleText }] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: titleText,
      description,
      images: image ? [image] : undefined,
    },
  };
}

const frontendDict: { [key: string]: { [key: string]: string } } = {
  vi: {
    home: 'Trang chủ',
    dashboard: 'Bảng điều khiển',
    posted_on: 'Đăng ngày',
    updated_on: 'Cập nhật ngày',
    no_content: 'Bài viết này chưa có nội dung.',
    content_removed: 'Nội dung đã bị gỡ bỏ',
    removed_desc: 'Nội dung bài viết "{title}" đã được quản trị viên gỡ bỏ vĩnh viễn khỏi trang web. Chúng tôi xin lỗi vì sự bất tiện này.',
    back_home: 'Quay về Trang chủ',
    trash_banner: 'Bài viết này đang nằm trong Thùng rác. Chỉ hiển thị chế độ xem thử đối với Quản trị viên.',
    draft_banner: 'Bài viết này là Bản nháp (Draft). Chỉ hiển thị chế độ xem thử đối với Quản trị viên.',
    scheduled_banner: 'Bài viết này được lên lịch xuất bản lúc {time} (Chưa công khai)',
  },
  en: {
    home: 'Home',
    dashboard: 'Dashboard',
    posted_on: 'Posted on',
    updated_on: 'Updated on',
    no_content: 'This post has no content yet.',
    content_removed: 'Content Removed',
    removed_desc: 'The content of "{title}" has been permanently removed by the administrator. We apologize for the inconvenience.',
    back_home: 'Back to Homepage',
    trash_banner: 'This post is in the Trash. Preview mode is only visible to Administrators.',
    draft_banner: 'This post is a Draft. Preview mode is only visible to Administrators.',
    scheduled_banner: 'This post is scheduled to be published at {time} (Not public yet)',
  },
  zh: {
    home: '首页',
    dashboard: '仪表盘',
    posted_on: '发布于',
    updated_on: '更新于',
    no_content: '此文章暂无内容。',
    content_removed: '内容已被删除',
    removed_desc: '文章"{title}"已被管理员永久删除。给您带来不便，我们深表歉意。',
    back_home: '返回首页',
    trash_banner: '此文章已移至回收站。预览模式仅对管理员可见。',
    draft_banner: '此文章为草稿。预览模式仅对管理员可见。',
    scheduled_banner: '此文章计划于 {time} 发布（尚未公开）',
  },
  ja: {
    home: 'ホーム',
    dashboard: 'ダッシュボード',
    posted_on: '投稿日:',
    updated_on: '更新日:',
    no_content: 'この投稿にはまだコンテンツがありません。',
    content_removed: 'コンテンツが削除されました',
    removed_desc: '投稿「{title}」は管理者によって完全に削除されました。ご不便をおかけして申し訳ありません。',
    back_home: 'ホームに戻る',
    trash_banner: 'この投稿はゴミ箱にあります。プレビューモードは管理者にのみ表示されます。',
    draft_banner: 'この投稿は下書きです。プレビューモードは管理者にのみ表示されます。',
    scheduled_banner: 'この投稿は {time} に公開予定です（まだ非公開）',
  }
};

function replaceDynamicTags(text: string, post: any, settings: Record<string, string>, canonicalUrl: string) {
  if (!text) return '';
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());
  const currentDate = `${day}/${month}/${year}`;

  return text
    .replaceAll('{{site_name}}', settings['site_title'] || settings['site_name'] || 'lexi.vn')
    .replaceAll('{{site_url}}', settings['site_url'] || '')
    .replaceAll('{{site_phone}}', settings['site_phone'] || settings['contact_phone'] || '')
    .replaceAll('{{site_email}}', settings['site_email'] || settings['contact_email'] || '')
    .replaceAll('{{site_address}}', settings['site_address'] || settings['contact_address'] || '')
    .replaceAll('{{page_title}}', post.title || '')
    .replaceAll('{{page_url}}', canonicalUrl || '')
    .replaceAll('{{current_date}}', currentDate)
    .replaceAll('{{current_year}}', year);
}

import CategoryArchive from './CategoryArchive';
import TagArchive from './TagArchive';

export default async function CatchAllPage({ params, searchParams }: CatchAllProps) {
  const { slug } = await params;
  const query = await searchParams;
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const currentPage = Math.max(1, Number(rawPage) || 1);
  const urlPath = '/' + slug.join('/');

  // --- Step 1: Resolve an explicit redirect without mutating the database. ---
  const normalizeUrl = (url: string) => {
    let normalized = url.trim();
    try {
      if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
        normalized = new URL(normalized).pathname;
      }
    } catch {}
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized.toLowerCase();
  };

  const redirectRecord = await prisma.redirect.findUnique({
    where: { oldUrl: urlPath },
    select: { newUrl: true, active: true }
  });

  if (
    redirectRecord?.active !== false &&
    redirectRecord?.newUrl &&
    normalizeUrl(redirectRecord.newUrl) !== normalizeUrl(urlPath)
  ) {
    permanentRedirect(redirectRecord.newUrl);
  }

  // --- Step 3: Fetch Discussion & Permalink Settings ---
  const settings = await getCachedSettings();

  const currentStructure = settings['permalink_structure'] || '/%postname%.html';
  const productBaseSetting = settings['permalink_product_base'] || 'san-pham';
  const productStructureBase = productBaseSetting.startsWith('/') ? productBaseSetting : '/' + productBaseSetting;
  const productStructure = productStructureBase.endsWith('/') ? productStructureBase + '%postname%/' : productStructureBase + '/%postname%/';
  
  const siteLanguageSetting = settings['site_language'] || 'vi';
  const langKey = (siteLanguageSetting in frontendDict) ? siteLanguageSetting : 'vi';
  const t = frontendDict[langKey];

  // --- Step 2: Check DeletedPostHistory for 410 Gone ---
  const deletedRecord = await prisma.deletedPostHistory.findUnique({
    where: { url: urlPath }
  });
  if (deletedRecord) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-4">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">{t.content_removed}</h1>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">
            {t.removed_desc.replace('{title}', deletedRecord.title || urlPath)}
          </p>
          <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all hover:shadow-indigo-500/10">
            <Home size={14} /> {t.back_home}
          </Link>
        </div>
      </div>
    );
  }

  // --- Step 3.5: Intercept Taxonomy Routing ---
  const categoryBase = settings['permalink_category_base'] || 'category';
  const tagBase = settings['permalink_tag_base'] || 'tag';
  const productCategoryBase = settings['permalink_product_category_base'] || 'danh-muc-san-pham';

  const taxonomyBases = new Set([categoryBase, tagBase, productCategoryBase]);
  if (taxonomyBases.has(slug[0]) && slug.length !== 2) {
    return <NotFoundContent settings={settings} />;
  }

  if (slug.length === 2) {
    if (slug[0] === categoryBase) {
      return <CategoryArchive slug={slug[1]} type="POST" settings={settings} activeTheme={settings['active_theme'] || 'default'} currentPage={currentPage} />;
    } else if (slug[0] === tagBase) {
      return <TagArchive slug={slug[1]} settings={settings} activeTheme={settings['active_theme'] || 'default'} currentPage={currentPage} />;
    } else if (slug[0] === productCategoryBase) {
      return <CategoryArchive slug={slug[1]} type="PRODUCT" settings={settings} activeTheme={settings['active_theme'] || 'default'} currentPage={currentPage} />;
    }
  }

  // --- Step 3.6: Intercept Search, Author and Post Type Archive Routing ---
  const postArchiveBase = 'tin-tuc'; // Standard news archive base

  if (slug.length === 1 && slug[0] === 'tim-kiem') {
    const rawQuery = Array.isArray(query.q) ? query.q[0] : query.q;
    return <SearchArchive query={rawQuery || ''} settings={settings} activeTheme={settings['active_theme'] || 'default'} currentPage={currentPage} />;
  }

  if (slug.length === 2 && slug[0] === 'author') {
    return <AuthorArchive username={slug[1]} settings={settings} activeTheme={settings['active_theme'] || 'default'} currentPage={currentPage} />;
  }

  if (slug.length === 1) {
    if (slug[0] === productBaseSetting) {
      return <CategoryArchive slug="all" type="PRODUCT" settings={settings} activeTheme={settings['active_theme'] || 'default'} currentPage={currentPage} />;
    } else if (slug[0] === postArchiveBase) {
      return <CategoryArchive slug="all" type="POST" settings={settings} activeTheme={settings['active_theme'] || 'default'} currentPage={currentPage} />;
    }
  }

  // --- Step 4: Parse URL according to active structure ---
  let post = await getCachedPostFromUrl(urlPath, currentStructure, productStructure);

  // --- Step 5: Strict Canonical Enforcement & Redirect (Runtime Only) ---
  if (post) {
    const correctUrl = generatePostUrl(post, currentStructure, productStructureBase);
    const normUrlPath = normalizePathForCompare(urlPath);
    const normCorrectUrl = normalizePathForCompare(correctUrl);
    
    if (normUrlPath !== normCorrectUrl) {
      // Canonical redirects are runtime-only. Mutating redirect records while
      // rendering made navigation slower and could produce route-dependent state.
      permanentRedirect(correctUrl);
    }
  }

  // --- Step 6: Validate post existence & view permissions ---
  // Do not perform database writes before notFound(). During client navigation,
  // awaiting the analytics upsert keeps the transition pending and leaves the
  // previous route visible and non-interactive until a hard reload.
  if (!post) {
    return <NotFoundContent settings={settings} />;
  }

  // User session authorization (for previewing Draft/Trash)
  const user = await getCurrentUser();
  const isAuthorizedUser = !!(user && (user.role === 'ADMIN' || user.role === 'EDITOR'));

  // Hide draft or trashed posts from guests
  if (post.status === 'TRASH' && !isAuthorizedUser) {
    return <NotFoundContent settings={settings} />;
  }
  if (post.status === 'DRAFT' && !isAuthorizedUser) {
    return <NotFoundContent settings={settings} />;
  }
  if (post.status === 'PUBLISHED' && new Date(post.publishedAt) > new Date() && !isAuthorizedUser) {
    return <NotFoundContent settings={settings} />;
  }

  if (post.type === 'PRODUCT') {
    const productMetaRows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "ProductMeta" WHERE "postId" = ${post.id} LIMIT 1
    `;
    
    let categoryRelatedProducts: any[] = [];
    if (post.categories && post.categories.length > 0) {
      categoryRelatedProducts = await prisma.post.findMany({
        where: {
          type: 'PRODUCT',
          status: 'PUBLISHED',
          id: { not: post.id },
          categories: {
            some: {
              id: post.categories[0].id
            }
          }
        },
        include: {
          productMeta: true
        },
        take: 4,
        orderBy: { publishedAt: 'desc' }
      });
    }

    post = {
      ...post,
      productMeta: productMetaRows[0] || null,
      categoryRelatedProducts
    } as any;
  }

  const dateFormatSetting = settings['date_format'] || 'j F, Y';

  const formattedDate = formatDateWordPress(post.createdAt, dateFormatSetting, siteLanguageSetting);
  const formattedUpdateDate = formatDateWordPress(post.updatedAt, dateFormatSetting, siteLanguageSetting);

  const activeTheme = settings['active_theme'] || 'default';

  // Keep template selection statically analyzable for Turbopack.
  // Use explicit switch cases so we don't have open-ended module graphs.
  let TemplateComponent: React.ComponentType<any>;
  
  if (activeTheme === 'ezitrans') {
    if (post.type === 'PAGE') {
      TemplateComponent = (await import('@/themes/ezitrans/Page')).default;
    } else if (post.type === 'PRODUCT') {
      TemplateComponent = DefaultProductTemplate;
    } else {
      TemplateComponent = (await import('@/themes/ezitrans/PostPage')).default;
    }
  } else {
    // Default theme fallback
    if (post.type === 'PAGE') {
      TemplateComponent = DefaultPageTemplate;
    } else if (post.type === 'PRODUCT') {
      TemplateComponent = DefaultProductTemplate;
    } else {
      TemplateComponent = DefaultPostTemplate;
    }
  }

  // --- Step 7.5: Template System Override Layer ---
  const resolveContext = {
    pageType: post.type === 'PAGE' 
      ? ('SINGLE_PAGE' as const) 
      : post.type === 'PRODUCT'
        ? ('SINGLE_PRODUCT' as const)
        : ('SINGLE_POST' as const),
    postId: post.id,
    postType: post.type,
    categoryIds: post.categories ? post.categories.map((c: any) => c.id) : [],
    tagIds: (post as any).tags ? (post as any).tags.map((t: any) => t.id) : [],
    authorId: post.authorId,
  };

  const resolvedTemplates = await resolveTemplates(resolveContext);
  if (activeTheme === 'ezitrans' && post.type === 'PAGE' && post.slug === 'lien-he') {
    TemplateComponent = (await import('@/themes/ezitrans/Page')).default;
  } else if (resolvedTemplates.body) {
    TemplateComponent = await loadTemplateComponent(
      resolvedTemplates.body,
      activeTheme,
      post.type === 'PAGE' ? 'Page' : post.type === 'PRODUCT' ? 'Product' : 'PostPage'
    );
  }

  let canonicalBaseUrl = getSiteUrl(settings);
  if (settings['seo_canonical_mode'] === 'custom' && settings['seo_canonical_custom_domain']) {
    canonicalBaseUrl = settings['seo_canonical_custom_domain'].replace(/\/+$/, '');
  }
  const canonicalUrl = getPostCanonicalUrl(post, currentStructure, canonicalBaseUrl);

  // Replace dynamic tags in post content and title
  const processedPost = {
    ...post,
    title: replaceDynamicTags(post.title, post, settings, canonicalUrl),
    content: replaceDynamicTags(post.content || '', post, settings, canonicalUrl),
  };

  const breadcrumbSchema = settings['seo_breadcrumbs_enabled'] !== 'false'
    ? buildBreadcrumbSchema([
      { name: settings['seo_breadcrumbs_home'] || 'Trang chá»§', url: getSiteUrl(settings) },
      ...(processedPost.type !== 'PAGE' && processedPost.categories?.[0]
        ? [{ name: processedPost.categories[0].name, url: `${getSiteUrl(settings)}/category/${processedPost.categories[0].slug}` }]
        : []),
      { name: processedPost.title, url: canonicalUrl },
    ])
    : null;

  return (
    <>
      {breadcrumbSchema && (
        <script
          id="yoast-breadcrumb-schema"
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <TemplateShell
        context={resolveContext}
        settings={settings}
        activeTheme={activeTheme}
      >
        <TemplateComponent
          post={processedPost}
          settings={settings}
          isAuthorizedUser={isAuthorizedUser}
          formattedDate={formattedDate}
          formattedUpdateDate={formattedUpdateDate}
          skipHeader={post.pageLayout === 'CANVAS'}
          skipFooter={post.pageLayout === 'CANVAS'}
        />
      </TemplateShell>
    </>
  );
}

