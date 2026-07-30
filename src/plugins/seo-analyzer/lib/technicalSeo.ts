import { generatePostUrl } from '@/lib/permalink';

type SettingsMap = Record<string, string | undefined>;

type SeoPost = {
  id: number;
  slug: string;
  type?: string;
  legacyId?: number | null;
  createdAt: Date | string;
  publishedAt: Date | string;
  updatedAt: Date | string;
  featuredImage?: { url: string | null } | null;
};

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function getSiteUrl(settings: SettingsMap = {}) {
  const configured = settings.site_url || settings.siteUrl || 'https://lexi.vn';
  return configured.replace(/\/+$/, '');
}

export function absoluteUrl(pathOrUrl: string | null | undefined, siteUrl = 'https://lexi.vn') {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl.replace(/\/+$/, '')}${cleanPath}`;
}

export function normalizeCanonicalUrl(url: string) {
  if (!url) return url;
  const [base, query] = url.split('?');
  const cleanBase = base.length > 1 ? base.replace(/\/+$/, '') : base;
  return query ? `${cleanBase}?${query}` : cleanBase;
}

export function getPostCanonicalUrl(post: SeoPost, permalinkStructure: string, siteUrl: string) {
  const path = post.type === 'PAGE' ? `/${post.slug}` : generatePostUrl(post, permalinkStructure);
  return normalizeCanonicalUrl(absoluteUrl(path, siteUrl));
}

export function getSocialImageUrl(post: SeoPost | null | undefined, settings: SettingsMap, siteUrl: string) {
  return absoluteUrl(post?.featuredImage?.url || settings.seo_default_og_image || settings.site_logo || '', siteUrl) || undefined;
}

export function getRobotsDirectives(settings: SettingsMap, options: { index?: boolean } = {}) {
  const shouldIndex = options.index !== false;
  const imagePreview = settings.seo_robots_max_image_preview;
  const maxImagePreview: 'large' | 'none' | 'standard' =
    imagePreview === 'none' || imagePreview === 'standard' ? imagePreview : 'large';

  return {
    index: shouldIndex,
    follow: shouldIndex,
    nocache: false,
    googleBot: {
      index: shouldIndex,
      follow: shouldIndex,
      'max-snippet': Number(settings.seo_robots_max_snippet || -1),
      'max-image-preview': maxImagePreview,
      'max-video-preview': Number(settings.seo_robots_max_video_preview || -1),
    },
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function escapeXml(value: string | number | Date | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function stripHtml(html: string | null | undefined) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
