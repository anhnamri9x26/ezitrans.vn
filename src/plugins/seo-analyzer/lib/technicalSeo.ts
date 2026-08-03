import { generatePostUrl } from '@/lib/permalink';
import { normalizeSiteUrl, resolveSiteIdentity } from '@/lib/site-identity';

type SettingsMap = Record<string, string | undefined>;

type SeoPost = {
  id: number;
  slug: string;
  title?: string;
  excerpt?: string | null;
  content?: string | null;
  type?: string;
  legacyId?: number | null;
  createdAt: Date | string;
  publishedAt: Date | string;
  updatedAt: Date | string;
  featuredImage?: { url: string | null } | null;
  author?: { name?: string | null; username?: string | null } | null;
  categories?: Array<{ name: string; slug: string }>;
};

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function getSiteUrl(settings: SettingsMap = {}) {
  return resolveSiteIdentity(settings).url;
}

export function absoluteUrl(pathOrUrl: string | null | undefined, siteUrl = '') {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return normalizeSiteUrl(pathOrUrl) || '';
  if (!siteUrl) return '';
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl.replace(/\/+$/, '')}${cleanPath}`;
}

export function normalizeCanonicalUrl(url: string) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    parsed.pathname = parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/+$/, '');
    return parsed.toString().replace(parsed.pathname === '/' ? /$/ : /\/$/, '');
  } catch {
    return '';
  }
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
    '@type': 'BreadcrumbList',
    '@id': `${items.at(-1)?.url || ''}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildSiteSchema(settings: SettingsMap) {
  const identity = resolveSiteIdentity(settings);
  const siteUrl = identity.url;
  const name = settings.seo_schema_name || identity.title;
  const logo = absoluteUrl(settings.seo_schema_logo || identity.logo, siteUrl);
  const publisherId = `${siteUrl}/#organization`;
  const logoId = `${siteUrl}/#logo`;
  const sameAs = [settings.seo_facebook_url, settings.seo_schema_x_url, settings.seo_instagram_url, settings.seo_zalo_url].filter(Boolean);
  return [
    {
      '@type': settings.seo_schema_type === 'person' ? 'Person' : 'Organization',
      '@id': publisherId,
      name,
      alternateName: settings.seo_schema_alt_name || undefined,
      legalName: settings.seo_schema_legal_name || identity.legalName || undefined,
      description: settings.seo_schema_description || identity.tagline || undefined,
      email: settings.seo_schema_email || identity.email || undefined,
      telephone: settings.seo_schema_phone || identity.phone || undefined,
      foundingDate: settings.seo_schema_founding_date || undefined,
      taxID: settings.seo_schema_tax_id || undefined,
      url: siteUrl,
      logo: logo ? { '@type': 'ImageObject', '@id': logoId, url: logo, contentUrl: logo, caption: name } : undefined,
      image: logo ? { '@id': logoId } : undefined,
      sameAs,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: identity.title || name,
      alternateName: identity.tagline || undefined,
      description: identity.tagline || undefined,
      publisher: { '@id': publisherId },
      inLanguage: identity.language,
      potentialAction: [{
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/?s={search_term_string}` },
        'query-input': 'required name=search_term_string',
      }],
    },
  ];
}

export function buildContentSchema(post: SeoPost, settings: SettingsMap, canonical: string, description: string, breadcrumbs: BreadcrumbItem[]) {
  const siteUrl = getSiteUrl(settings);
  const image = getSocialImageUrl(post, settings, siteUrl);
  const isArticle = post.type !== 'PAGE';
  const pageId = canonical;
  const graph: Record<string, unknown>[] = [
    {
      '@type': isArticle ? 'Article' : 'WebPage',
      '@id': isArticle ? `${canonical}#article` : pageId,
      url: canonical,
      name: post.title,
      headline: post.title,
      description,
      isPartOf: { '@id': `${siteUrl}/#website` },
      mainEntityOfPage: isArticle ? { '@id': pageId } : undefined,
      datePublished: new Date(post.publishedAt).toISOString(),
      dateModified: new Date(post.updatedAt).toISOString(),
      author: post.author ? { '@type': 'Person', name: post.author.name || post.author.username } : undefined,
      publisher: { '@id': `${siteUrl}/#organization` },
      image: image ? { '@id': `${canonical}#primaryimage` } : undefined,
      thumbnailUrl: image || undefined,
      articleSection: isArticle ? post.categories?.map(category => category.name) : undefined,
      breadcrumb: { '@id': `${canonical}#breadcrumb` },
      inLanguage: settings.site_language || 'vi',
    },
    ...(image ? [{ '@type': 'ImageObject', '@id': `${canonical}#primaryimage`, url: image, contentUrl: image, inLanguage: settings.site_language || 'vi' }] : []),
    buildBreadcrumbSchema(breadcrumbs),
  ];
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
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
