export type SiteSettings = Record<string, string | undefined>;

export type SiteIdentity = {
  title: string;
  tagline: string;
  url: string;
  email: string;
  phone: string;
  address: string;
  legalName: string;
  logo: string;
  favicon: string;
  language: string;
};

const clean = (value: string | undefined) => String(value || '').trim();

export function normalizeSiteUrl(value: string | undefined) {
  const raw = clean(value);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    url.pathname = url.pathname.replace(/\/+$/, '');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

export function resolveSiteIdentity(settings: SiteSettings = {}): SiteIdentity {
  const configuredUrl = normalizeSiteUrl(settings.site_url || settings.siteUrl);
  const environmentUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL);
  return {
    title: clean(settings.site_title || settings.site_name),
    tagline: clean(settings.site_tagline),
    url: configuredUrl || environmentUrl,
    email: clean(settings.site_email || settings.footer_email || settings.contact_email),
    phone: clean(settings.site_phone || settings.footer_phone || settings.contact_phone || settings.contact_hotline_1),
    address: clean(settings.site_address || settings.footer_address || settings.contact_address),
    legalName: clean(settings.site_legal_name || settings.seo_schema_legal_name),
    logo: clean(settings.site_logo),
    favicon: clean(settings.site_favicon),
    language: clean(settings.site_language) || 'vi',
  };
}

export function getRequiredSiteUrl(settings: SiteSettings = {}) {
  const url = resolveSiteIdentity(settings).url;
  if (!url) throw new Error('Website URL has not been configured. Complete Setup Wizard or General Settings.');
  return url;
}

export function getSiteDisplayName(settings: SiteSettings = {}) {
  return resolveSiteIdentity(settings).title || 'Website';
}

export function buildIdentitySettingValues(input: {
  siteTitle: string;
  siteTagline?: string;
  siteUrl: string;
  siteEmail?: string;
  sitePhone?: string;
  siteAddress?: string;
  siteLegalName?: string;
  siteLanguage?: string;
}) {
  const title = clean(input.siteTitle);
  const tagline = clean(input.siteTagline);
  const url = normalizeSiteUrl(input.siteUrl);
  const email = clean(input.siteEmail).toLowerCase();
  const phone = clean(input.sitePhone);
  const address = clean(input.siteAddress);
  const legalName = clean(input.siteLegalName);
  return {
    site_title: title,
    site_tagline: tagline,
    site_url: url,
    site_email: email,
    site_phone: phone,
    site_address: address,
    site_legal_name: legalName,
    site_language: clean(input.siteLanguage) || 'vi',
    footer_email: email,
    footer_phone: phone,
    footer_address: address,
    mail_from_name: title,
    mail_from_email: email,
    seo_schema_name: title,
    seo_schema_legal_name: legalName,
    seo_schema_description: tagline,
    seo_schema_email: email,
    seo_schema_phone: phone,
    setup_identity_version: '1',
  };
}
