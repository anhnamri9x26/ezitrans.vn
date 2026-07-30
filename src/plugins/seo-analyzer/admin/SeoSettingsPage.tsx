"use client";

import React, { useState, useEffect } from 'react';
import { Save, Search, Eye, Sparkles, Layout, Globe, User, ShieldAlert, Check, Image as ImageIcon, BarChart3, FileText, Settings, HelpCircle, ToggleLeft, ToggleRight, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Bot, Navigation, ListChecks, Folder, Tag, Archive, Briefcase, File, Calendar, Link2, Trash2, Plus, Type, Home } from 'lucide-react';
import MediaModal from '@/components/MediaModal';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function DonutChart({ data }: { data: DonutSegment[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg width="144" height="144" viewBox="0 0 100 100" className="-rotate-90">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="#cbd5e1"
            strokeWidth="9"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-xl font-bold text-slate-400">0</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tài liệu</span>
        </div>
      </div>
    );
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89
  let accumulatedPercent = 0;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg width="144" height="144" viewBox="0 0 100 100" className="-rotate-90">
        {/* Background track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth="9"
        />
        {data.map((item, idx) => {
          if (item.value === 0) return null;
          const percentage = item.value / total;
          const strokeLength = percentage * circumference;
          const strokeOffset = circumference - strokeLength;
          const rotateOffset = accumulatedPercent * 360;
          accumulatedPercent += percentage;

          return (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              style={{
                transformOrigin: '50px 50px',
                transform: `rotate(${rotateOffset}deg)`,
                transition: 'all 0.5s ease'
              }}
            />
          );
        })}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black text-slate-800 tracking-tight">{total}</span>
        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Tài liệu</span>
      </div>
    </div>
  );
}

function CustomCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 cursor-pointer outline-none ${
        checked
          ? 'bg-brand-600 border-brand-600 text-white shadow-sm shadow-brand-500/20 scale-105'
          : 'bg-white border-slate-350 hover:border-brand-400 text-transparent'
      }`}
    >
      <Check size={11} strokeWidth={3.5} className={`transition-transform duration-200 ${checked ? 'scale-100' : 'scale-50 opacity-0'}`} />
    </button>
  );
}

export default function YoastSeoSettingsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'indexing' | 'webmaster' | 'schema' | 'redirects' | '404' | 'templates'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // References for change detection (unsaved changes warnings)
  const originalSettingsRef = React.useRef<any>(null);
  const checkIsDirtyRef = React.useRef<() => boolean>(() => false);

  const checkIsDirty = () => {
    if (!originalSettingsRef.current) return false;
    const orig = originalSettingsRef.current;
    
    return (
      sitemapEnabled !== orig.seo_sitemap_enabled ||
      breadcrumbsEnabled !== orig.seo_breadcrumbs_enabled ||
      breadcrumbsSeparator !== orig.seo_breadcrumbs_separator ||
      breadcrumbsHome !== orig.seo_breadcrumbs_home ||
      googleVerification !== orig.seo_google_verification ||
      bingVerification !== orig.seo_bing_verification ||
      yandexVerification !== orig.seo_yandex_verification ||
      googleAnalytics !== orig.seo_google_analytics ||
      googleTagManager !== orig.seo_google_tag_manager ||
      googleVerified !== (orig.seo_google_verified === 'true') ||
      bingVerified !== (orig.seo_bing_verified === 'true') ||
      yandexVerified !== (orig.seo_yandex_verified === 'true') ||
      schemaType !== orig.seo_schema_type ||
      schemaName !== orig.seo_schema_name ||
      schemaLogo !== orig.seo_schema_logo ||
      facebookUrl !== orig.seo_facebook_url ||
      instagramUrl !== orig.seo_instagram_url ||
      zaloUrl !== orig.seo_zalo_url ||
      defaultOgImage !== orig.seo_default_og_image ||
      schemaAltName !== orig.seo_schema_alt_name ||
      schemaXUrl !== orig.seo_schema_x_url ||
      schemaDescription !== orig.seo_schema_description ||
      schemaEmail !== orig.seo_schema_email ||
      schemaPhone !== orig.seo_schema_phone ||
      schemaLegalName !== orig.seo_schema_legal_name ||
      schemaFoundingDate !== orig.seo_schema_founding_date ||
      schemaTaxId !== orig.seo_schema_tax_id ||
      llmsEnabled !== orig.seo_llms_txt_enabled ||
      llmsMode !== orig.seo_llms_txt_mode ||
      llmsAboutId !== orig.seo_llms_txt_about_id ||
      llmsContactId !== orig.seo_llms_txt_contact_id ||
      llmsTermsId !== orig.seo_llms_txt_terms_id ||
      llmsPrivacyId !== orig.seo_llms_txt_privacy_id ||
      llmsShopId !== orig.seo_llms_txt_shop_id ||
      robotsTxtEnabled !== orig.seo_robots_txt_enabled ||
      robotsDisallowPaths !== orig.seo_robots_disallow_paths ||
      rssEnabled !== orig.seo_rss_enabled ||
      rssIncludeServices !== orig.seo_rss_include_services ||
      rssLimit !== orig.seo_rss_limit ||
      seoCanonicalMode !== orig.seo_canonical_mode ||
      seoCanonicalCustomDomain !== orig.seo_canonical_custom_domain ||
      seoRobotsMode !== orig.seo_robots_mode ||
      indexPosts !== orig.seo_index_posts ||
      sitemapPosts !== orig.seo_sitemap_posts ||
      indexPages !== orig.seo_index_pages ||
      sitemapPages !== orig.seo_sitemap_pages ||
      indexServices !== orig.seo_index_services ||
      sitemapServices !== orig.seo_sitemap_services ||
      indexCategories !== orig.seo_index_categories ||
      sitemapCategories !== orig.seo_sitemap_categories ||
      indexTags !== orig.seo_index_tags ||
      sitemapTags !== orig.seo_sitemap_tags ||
      indexPostsArchive !== orig.seo_index_posts_archive ||
      sitemapPostsArchive !== orig.seo_sitemap_posts_archive ||
      indexServicesArchive !== orig.seo_index_services_archive ||
      sitemapServicesArchive !== orig.seo_sitemap_services_archive ||
      indexAuthorArchive !== orig.seo_index_author_archive ||
      sitemapAuthorArchive !== orig.seo_sitemap_author_archive ||
      indexDateArchive !== orig.seo_index_date_archive ||
      sitemapDateArchive !== orig.seo_sitemap_date_archive ||
      indexSearchArchive !== orig.seo_index_search_archive ||
      sitemapSearchArchive !== orig.seo_sitemap_search_archive ||
      seoMetaTitlePost !== orig.seo_meta_title_post ||
      seoMetaDescPost !== orig.seo_meta_desc_post ||
      seoMetaTitlePage !== orig.seo_meta_title_page ||
      seoMetaDescPage !== orig.seo_meta_desc_page ||
      seoMetaTitleService !== orig.seo_meta_title_service ||
      seoMetaDescService !== orig.seo_meta_desc_service ||
      seoMetaTitleCategory !== orig.seo_meta_title_category ||
      seoMetaDescCategory !== orig.seo_meta_desc_category ||
      seoMetaTitleTag !== orig.seo_meta_title_tag ||
      seoMetaDescTag !== orig.seo_meta_desc_tag ||
      seoMetaTitleHome !== orig.seo_meta_title_home ||
      seoMetaDescHome !== orig.seo_meta_desc_home ||
      seoMetaSeparator !== orig.seo_meta_separator
    );
  };

  // Keep checkIsDirtyRef up-to-date
  checkIsDirtyRef.current = checkIsDirty;

  // Intercept browser reload / tab close / back/forward navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (checkIsDirtyRef.current()) {
        e.preventDefault();
        e.returnValue = 'Bạn có thay đổi chưa lưu trên trang cấu hình SEO. Bạn có chắc chắn muốn rời đi?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Intercept Next.js layout sidebar routing clicks in capture phase
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (!checkIsDirtyRef.current()) return;

      let target = e.target as HTMLElement | null;
      while (target && target !== document.body) {
        if (target.tagName === 'A' || target.getAttribute('role') === 'button' || target.tagName === 'BUTTON') {
          const href = target.getAttribute('href') || '';
          if (href && !href.startsWith('#') && !href.includes('/settings/seo')) {
            const confirmLeave = window.confirm('Bạn có thay đổi chưa lưu trên trang cấu hình SEO. Bạn có chắc chắn muốn rời đi mà không lưu?');
            if (!confirmLeave) {
              e.preventDefault();
              e.stopPropagation();
            }
            break;
          }
        }
        target = target.parentElement;
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  // Meta Templates states
  const [seoMetaTitlePost, setSeoMetaTitlePost] = useState('%title% %sep% %sitename%');
  const [seoMetaDescPost, setSeoMetaDescPost] = useState('%excerpt%');
  const [seoMetaTitlePage, setSeoMetaTitlePage] = useState('%title% %sep% %sitename%');
  const [seoMetaDescPage, setSeoMetaDescPage] = useState('%excerpt%');
  const [seoMetaTitleService, setSeoMetaTitleService] = useState('%title% %sep% %sitename%');
  const [seoMetaDescService, setSeoMetaDescService] = useState('%excerpt%');
  const [seoMetaTitleCategory, setSeoMetaTitleCategory] = useState('%term% %sep% %sitename%');
  const [seoMetaDescCategory, setSeoMetaDescCategory] = useState('Xem toàn bộ bài viết chuyên mục %term% tại %sitename%.');
  const [seoMetaTitleTag, setSeoMetaTitleTag] = useState('%term% %sep% %sitename%');
  const [seoMetaDescTag, setSeoMetaDescTag] = useState('Bài viết được gắn thẻ %term% trên %sitename%.');
  const [seoMetaTitleHome, setSeoMetaTitleHome] = useState('%sitename% %sep% %tagline%');
  const [seoMetaDescHome, setSeoMetaDescHome] = useState('');
  const [seoMetaSeparator, setSeoMetaSeparator] = useState('|');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(text);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === text ? null : prev));
      }, 1500);
    }).catch((err) => {
      console.error('Failed to copy text: ', err);
    });
  };

  const [metaTab, setMetaTab] = useState<'home' | 'post' | 'page' | 'service' | 'category' | 'tag'>('home');

  const handleReset = (id: string) => {
    if (id === 'home') {
      setSeoMetaTitleHome('%sitename% %sep% %tagline%');
      setSeoMetaDescHome('');
    } else if (id === 'post') {
      setSeoMetaTitlePost('%title% %sep% %sitename%');
      setSeoMetaDescPost('%excerpt%');
    } else if (id === 'page') {
      setSeoMetaTitlePage('%title% %sep% %sitename%');
      setSeoMetaDescPage('%excerpt%');
    } else if (id === 'service') {
      setSeoMetaTitleService('%title% %sep% %sitename%');
      setSeoMetaDescService('%excerpt%');
    } else if (id === 'category') {
      setSeoMetaTitleCategory('%term% %sep% %sitename%');
      setSeoMetaDescCategory('Xem toàn bộ bài viết chuyên mục %term% tại %sitename%.');
    } else if (id === 'tag') {
      setSeoMetaTitleTag('%term% %sep% %sitename%');
      setSeoMetaDescTag('Bài viết được gắn thẻ %term% trên %sitename%.');
    }
  };

  const validateTemplate = (template: string) => {
    if (!template) return { isValid: true, errors: [] };
    const errors: string[] = [];
    const validPlaceholders = [
      '%title%', '%sep%', '%sitename%', '%tagline%', 
      '%term%', '%excerpt%', '%author%', '%slug%', 
      '%category%', '%currentyear%', '%currentmonth%'
    ];

    // Find variables like %something%
    const matches = template.match(/%[a-zA-Z0-9_]+%/g) || [];
    for (const p of matches) {
      if (!validPlaceholders.includes(p.toLowerCase())) {
        errors.push(`Biến ${p} không hợp lệ`);
      }
    }

    // Check for unclosed percent signs
    const parts = template.split('%');
    if (parts.length % 2 === 0) {
      errors.push("Phát hiện dấu '%' chưa đóng (Ví dụ: %title%)");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Canonical and Robots modes
  const [seoCanonicalMode, setSeoCanonicalMode] = useState<'automatic' | 'custom'>('automatic');
  const [seoCanonicalCustomDomain, setSeoCanonicalCustomDomain] = useState('');
  const [seoRobotsMode, setSeoRobotsMode] = useState<'automatic' | 'custom'>('automatic');

  // Redirect Manager state
  const [redirects, setRedirects] = useState<any[]>([]);
  const [redirectsLoading, setRedirectsLoading] = useState(false);
  const [newOldUrl, setNewOldUrl] = useState('');
  const [newNewUrl, setNewNewUrl] = useState('');
  const [newStatusCode, setNewStatusCode] = useState(301);
  const [redirectSearch, setRedirectSearch] = useState('');
  const [testUrlInput, setTestUrlInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  // 404 Monitor state
  const [fourOhFourLogs, setFourOhFourLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [redirectSourceUrl, setRedirectSourceUrl] = useState('');
  const [redirectTargetUrl, setRedirectTargetUrl] = useState('');

  // General Settings State
  const [sitemapEnabled, setSitemapEnabled] = useState(true);
  const [breadcrumbsEnabled, setBreadcrumbsEnabled] = useState(true);
  const [breadcrumbsSeparator, setBreadcrumbsSeparator] = useState('»');
  const [breadcrumbsHome, setBreadcrumbsHome] = useState('Trang chủ');

  // LLMS.txt State
  const [llmsEnabled, setLlmsEnabled] = useState(true);
  const [llmsMode, setLlmsMode] = useState<'automatic' | 'manual'>('automatic');
  const [llmsAboutId, setLlmsAboutId] = useState('');
  const [llmsContactId, setLlmsContactId] = useState('');
  const [llmsTermsId, setLlmsTermsId] = useState('');
  const [llmsPrivacyId, setLlmsPrivacyId] = useState('');
  const [llmsShopId, setLlmsShopId] = useState('');

  // Technical SEO State
  const [robotsTxtEnabled, setRobotsTxtEnabled] = useState(true);
  const [robotsDisallowPaths, setRobotsDisallowPaths] = useState('/api/\n/login\n/admin/');
  const [rssEnabled, setRssEnabled] = useState(true);
  const [rssIncludeServices, setRssIncludeServices] = useState(true);
  const [rssLimit, setRssLimit] = useState('20');
  const [indexPosts, setIndexPosts] = useState(true);
  const [sitemapPosts, setSitemapPosts] = useState(true);
  const [indexPages, setIndexPages] = useState(true);
  const [sitemapPages, setSitemapPages] = useState(true);
  const [indexServices, setIndexServices] = useState(true);
  const [sitemapServices, setSitemapServices] = useState(true);
  const [indexCategories, setIndexCategories] = useState(true);
  const [sitemapCategories, setSitemapCategories] = useState(true);
  const [indexTags, setIndexTags] = useState(false);
  const [sitemapTags, setSitemapTags] = useState(false);

  // Granular post and service archives sitemaps/indexing
  const [indexPostsArchive, setIndexPostsArchive] = useState(true);
  const [sitemapPostsArchive, setSitemapPostsArchive] = useState(true);
  const [indexServicesArchive, setIndexServicesArchive] = useState(true);
  const [sitemapServicesArchive, setSitemapServicesArchive] = useState(true);

  // General system archives sitemaps/indexing
  const [indexAuthorArchive, setIndexAuthorArchive] = useState(false);
  const [sitemapAuthorArchive, setSitemapAuthorArchive] = useState(false);
  const [indexDateArchive, setIndexDateArchive] = useState(false);
  const [sitemapDateArchive, setSitemapDateArchive] = useState(false);
  const [indexSearchArchive, setIndexSearchArchive] = useState(false);
  const [sitemapSearchArchive, setSitemapSearchArchive] = useState(false);

  // Dynamically loaded content type counts from database
  const [counts, setCounts] = useState({ posts: 0, pages: 0, services: 0, categories: 0, tags: 0 });

  // Webmaster Tools State
  const [googleVerification, setGoogleVerification] = useState('');
  const [bingVerification, setBingVerification] = useState('');
  const [yandexVerification, setYandexVerification] = useState('');
  const [googleAnalytics, setGoogleAnalytics] = useState('');
  const [googleTagManager, setGoogleTagManager] = useState('');
  const [googleVerified, setGoogleVerified] = useState(false);
  const [bingVerified, setBingVerified] = useState(false);
  const [yandexVerified, setYandexVerified] = useState(false);
  const [isVerifyingMap, setIsVerifyingMap] = useState<{[key: string]: boolean}>({});

  // Schema.org State
  const [schemaType, setSchemaType] = useState<'organization' | 'person'>('organization');
  const [schemaName, setSchemaName] = useState('Lexi');
  const [schemaLogo, setSchemaLogo] = useState('');
  const [schemaLogoId, setSchemaLogoId] = useState('');
  const [schemaAltName, setSchemaAltName] = useState('');
  const [schemaXUrl, setSchemaXUrl] = useState('');
  const [schemaDescription, setSchemaDescription] = useState('');
  const [schemaEmail, setSchemaEmail] = useState('');
  const [schemaPhone, setSchemaPhone] = useState('');
  const [schemaLegalName, setSchemaLegalName] = useState('');
  const [schemaFoundingDate, setSchemaFoundingDate] = useState('');
  const [schemaTaxId, setSchemaTaxId] = useState('');

  // Social Settings State
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [zaloUrl, setZaloUrl] = useState('');
  const [defaultOgImage, setDefaultOgImage] = useState('');
  const [defaultOgImageId, setDefaultOgImageId] = useState('');

  // Media selector modal
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'logo' | 'social' | null>(null);

  // Pages List for manual llms mapping
  const [pages, setPages] = useState<any[]>([]);

  // Statistics Dashboard State
  const [contentTypeFilter, setContentTypeFilter] = useState<'POST' | 'PAGE' | 'SERVICE'>('POST');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [seoStats, setSeoStats] = useState({ good: 0, ok: 0, bad: 0, none: 0 });
  const [readabilityStats, setReadabilityStats] = useState({ good: 0, ok: 0, bad: 0, none: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);

  // Meta Templates helper for preview
  const getPreview = (template: string, type: 'post' | 'page' | 'service' | 'category' | 'tag' | 'home') => {
    const sep = seoMetaSeparator;
    const sitename = schemaName || 'Lexi';
    const tagline = 'Giải pháp vận chuyển chuyên nghiệp';
    const vars: Record<string, string> = {
      sep,
      sitename,
      tagline,
    };
    
    if (type === 'post') {
      vars.title = 'Bảng giá cước vận chuyển hàng Trung Quốc mới nhất';
      vars.slug = 'bang-gia-cuoc-van-chuyen-trung-quoc';
      vars.category = 'Vận chuyển Trung Quốc';
      vars.excerpt = 'Cập nhật bảng giá cước dịch vụ mua hộ, ký gửi và vận chuyển hàng Trung Quốc Việt Nam mới nhất năm 2026 với ưu đãi cực sốc...';
      vars.author = 'lexi_admin';
    } else if (type === 'page') {
      vars.title = 'Giới thiệu về chúng tôi';
      vars.slug = 'gioi-thieu';
      vars.excerpt = 'Lexi là đơn vị hàng đầu cung cấp dịch vụ logistics, mua hộ và vận chuyển hàng Trung Quốc chính ngạch...';
      vars.author = 'lexi_admin';
    } else if (type === 'service') {
      vars.title = 'Dịch vụ Mua Hộ Hàng Taobao Giá Gốc';
      vars.slug = 'dich-vu-mua-ho-taobao';
      vars.excerpt = 'Nhận order mua hộ hàng trên Taobao, Tmall, 1688 trọn gói từ A-Z, cam kết đền bù 100% nếu thất lạc hàng hóa...';
      vars.author = 'lexi_admin';
    } else if (type === 'category') {
      vars.term = 'Vận chuyển Trung Quốc';
    } else if (type === 'tag') {
      vars.term = 'Taobao';
    } else if (type === 'home') {
      vars.title = 'Trang chủ';
    }
    
    let result = template || '';
    const defaultVars = {
      currentyear: new Date().getFullYear().toString(),
      currentmonth: String(new Date().getMonth() + 1).padStart(2, '0'),
      ...vars,
    };

    for (const [k, v] of Object.entries(defaultVars)) {
      result = result.replace(new RegExp(`%${k}%`, 'gi'), v || '');
    }
    result = result.replace(/%[a-zA-Z0-9_]+%/g, '');
    result = result.replace(/\s+/g, ' ');

    const escapedSep = sep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    result = result.replace(new RegExp(`\\s*${escapedSep}\\s*(?=\\s*${escapedSep})`, 'g'), '');
    result = result.replace(new RegExp(`^\\s*${escapedSep}\\s*`), '');
    result = result.replace(new RegExp(`\\s*${escapedSep}\\s*$`), '');

    return result.trim() || '—';
  };

  // Load configuration and pages on mount
  useEffect(() => {
    setIsMounted(true);
    async function initSettingsAndPages() {
      try {
        const [settingsRes, pagesRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/posts?type=PAGE')
        ]);
        
        const settingsData = await settingsRes.json();
        const pagesData = await pagesRes.json();

        if (settingsData.success && settingsData.settings) {
          const s = settingsData.settings;
          setSitemapEnabled(s.seo_sitemap_enabled !== 'false');
          setBreadcrumbsEnabled(s.seo_breadcrumbs_enabled !== 'false');
          if (s.seo_breadcrumbs_separator) setBreadcrumbsSeparator(s.seo_breadcrumbs_separator);
          if (s.seo_breadcrumbs_home) setBreadcrumbsHome(s.seo_breadcrumbs_home);
          if (s.seo_google_verification) setGoogleVerification(s.seo_google_verification);
          if (s.seo_bing_verification) setBingVerification(s.seo_bing_verification);
          if (s.seo_yandex_verification) setYandexVerification(s.seo_yandex_verification);
          if (s.seo_google_analytics) setGoogleAnalytics(s.seo_google_analytics);
          if (s.seo_google_tag_manager) setGoogleTagManager(s.seo_google_tag_manager);
          setGoogleVerified(s.seo_google_verified === 'true');
          setBingVerified(s.seo_bing_verified === 'true');
          setYandexVerified(s.seo_yandex_verified === 'true');
          if (s.seo_schema_type) setSchemaType(s.seo_schema_type as any);
          if (s.seo_schema_name) setSchemaName(s.seo_schema_name);
          if (s.seo_schema_logo) setSchemaLogo(s.seo_schema_logo);
          if (s.seo_facebook_url) setFacebookUrl(s.seo_facebook_url);
          if (s.seo_instagram_url) setInstagramUrl(s.seo_instagram_url);
          if (s.seo_zalo_url) setZaloUrl(s.seo_zalo_url);
          if (s.seo_default_og_image) setDefaultOgImage(s.seo_default_og_image);
          if (s.seo_schema_alt_name) setSchemaAltName(s.seo_schema_alt_name);
          if (s.seo_schema_x_url) setSchemaXUrl(s.seo_schema_x_url);
          if (s.seo_schema_description) setSchemaDescription(s.seo_schema_description);
          if (s.seo_schema_email) setSchemaEmail(s.seo_schema_email);
          if (s.seo_schema_phone) setSchemaPhone(s.seo_schema_phone);
          if (s.seo_schema_legal_name) setSchemaLegalName(s.seo_schema_legal_name);
          if (s.seo_schema_founding_date) setSchemaFoundingDate(s.seo_schema_founding_date);
          if (s.seo_schema_tax_id) setSchemaTaxId(s.seo_schema_tax_id);

          // Meta Templates configs
          if (s.seo_meta_title_post) setSeoMetaTitlePost(s.seo_meta_title_post);
          if (s.seo_meta_desc_post) setSeoMetaDescPost(s.seo_meta_desc_post);
          if (s.seo_meta_title_page) setSeoMetaTitlePage(s.seo_meta_title_page);
          if (s.seo_meta_desc_page) setSeoMetaDescPage(s.seo_meta_desc_page);
          if (s.seo_meta_title_service) setSeoMetaTitleService(s.seo_meta_title_service);
          if (s.seo_meta_desc_service) setSeoMetaDescService(s.seo_meta_desc_service);
          if (s.seo_meta_title_category) setSeoMetaTitleCategory(s.seo_meta_title_category);
          if (s.seo_meta_desc_category) setSeoMetaDescCategory(s.seo_meta_desc_category);
          if (s.seo_meta_title_tag) setSeoMetaTitleTag(s.seo_meta_title_tag);
          if (s.seo_meta_desc_tag) setSeoMetaDescTag(s.seo_meta_desc_tag);
          if (s.seo_meta_title_home) setSeoMetaTitleHome(s.seo_meta_title_home);
          if (s.seo_meta_desc_home) setSeoMetaDescHome(s.seo_meta_desc_home);
          if (s.seo_meta_separator) setSeoMetaSeparator(s.seo_meta_separator);

          // llms.txt configs
          setLlmsEnabled(s.seo_llms_txt_enabled !== 'false');
          setLlmsMode(s.seo_llms_txt_mode || 'automatic');
          setLlmsAboutId(s.seo_llms_txt_about_id || '');
          setLlmsContactId(s.seo_llms_txt_contact_id || '');
          setLlmsTermsId(s.seo_llms_txt_terms_id || '');
          setLlmsPrivacyId(s.seo_llms_txt_privacy_id || '');
          setLlmsShopId(s.seo_llms_txt_shop_id || '');

          // Technical SEO configs
          setRobotsTxtEnabled(s.seo_robots_txt_enabled !== 'false');
          if (s.seo_robots_disallow_paths) setRobotsDisallowPaths(s.seo_robots_disallow_paths);
          setRssEnabled(s.seo_rss_enabled !== 'false');
          setRssIncludeServices(s.seo_rss_include_services !== 'false');
          setRssLimit(s.seo_rss_limit || '20');
          setSeoCanonicalMode(s.seo_canonical_mode || 'automatic');
          setSeoCanonicalCustomDomain(s.seo_canonical_custom_domain || '');
          setSeoRobotsMode(s.seo_robots_mode || 'automatic');
           setIndexPosts(s.seo_index_posts !== 'false');
          setSitemapPosts(s.seo_sitemap_posts !== 'false');
          setIndexPages(s.seo_index_pages !== 'false');
          setSitemapPages(s.seo_sitemap_pages !== 'false');
          setIndexServices(s.seo_index_services !== 'false');
          setSitemapServices(s.seo_sitemap_services !== 'false');
          setIndexCategories(s.seo_index_categories !== 'false');
          setSitemapCategories(s.seo_sitemap_categories !== 'false');
          setIndexTags(s.seo_index_tags === 'true');
          setSitemapTags(s.seo_sitemap_tags === 'true');

          setIndexPostsArchive(s.seo_index_posts_archive !== 'false');
          setSitemapPostsArchive(s.seo_sitemap_posts_archive !== 'false');
          setIndexServicesArchive(s.seo_index_services_archive !== 'false');
          setSitemapServicesArchive(s.seo_sitemap_services_archive !== 'false');

          setIndexAuthorArchive(s.seo_index_author_archive === 'true');
          setSitemapAuthorArchive(s.seo_sitemap_author_archive === 'true');
          setIndexDateArchive(s.seo_index_date_archive === 'true');
          setSitemapDateArchive(s.seo_sitemap_date_archive === 'true');
          setIndexSearchArchive(s.seo_index_search_archive === 'true');
          setSitemapSearchArchive(s.seo_sitemap_search_archive === 'true');

          // Update original settings reference for change detection
          originalSettingsRef.current = {
            seo_sitemap_enabled: s.seo_sitemap_enabled !== 'false',
            seo_breadcrumbs_enabled: s.seo_breadcrumbs_enabled !== 'false',
            seo_breadcrumbs_separator: s.seo_breadcrumbs_separator || '»',
            seo_breadcrumbs_home: s.seo_breadcrumbs_home || 'Trang chủ',
            seo_google_verification: s.seo_google_verification || '',
            seo_bing_verification: s.seo_bing_verification || '',
            seo_yandex_verification: s.seo_yandex_verification || '',
            seo_google_analytics: s.seo_google_analytics || '',
            seo_google_tag_manager: s.seo_google_tag_manager || '',
            seo_google_verified: s.seo_google_verified || 'false',
            seo_bing_verified: s.seo_bing_verified || 'false',
            seo_yandex_verified: s.seo_yandex_verified || 'false',
            seo_schema_type: (s.seo_schema_type || 'organization') as any,
            seo_schema_name: s.seo_schema_name || '',
            seo_schema_logo: s.seo_schema_logo || '',
            seo_facebook_url: s.seo_facebook_url || '',
            seo_instagram_url: s.seo_instagram_url || '',
            seo_zalo_url: s.seo_zalo_url || '',
            seo_default_og_image: s.seo_default_og_image || '',
            seo_schema_alt_name: s.seo_schema_alt_name || '',
            seo_schema_x_url: s.seo_schema_x_url || '',
            seo_schema_description: s.seo_schema_description || '',
            seo_schema_email: s.seo_schema_email || '',
            seo_schema_phone: s.seo_schema_phone || '',
            seo_schema_legal_name: s.seo_schema_legal_name || '',
            seo_schema_founding_date: s.seo_schema_founding_date || '',
            seo_schema_tax_id: s.seo_schema_tax_id || '',
            seo_llms_txt_enabled: s.seo_llms_txt_enabled !== 'false',
            seo_llms_txt_mode: s.seo_llms_txt_mode || 'automatic',
            seo_llms_txt_about_id: s.seo_llms_txt_about_id || '',
            seo_llms_txt_contact_id: s.seo_llms_txt_contact_id || '',
            seo_llms_txt_terms_id: s.seo_llms_txt_terms_id || '',
            seo_llms_txt_privacy_id: s.seo_llms_txt_privacy_id || '',
            seo_llms_txt_shop_id: s.seo_llms_txt_shop_id || '',
            seo_robots_txt_enabled: s.seo_robots_txt_enabled !== 'false',
            seo_robots_disallow_paths: s.seo_robots_disallow_paths || '/api/\n/login\n/admin/',
            seo_rss_enabled: s.seo_rss_enabled !== 'false',
            seo_rss_include_services: s.seo_rss_include_services !== 'false',
            seo_rss_limit: s.seo_rss_limit || '20',
            seo_canonical_mode: s.seo_canonical_mode || 'automatic',
            seo_canonical_custom_domain: s.seo_canonical_custom_domain || '',
            seo_robots_mode: s.seo_robots_mode || 'automatic',
            seo_index_posts: s.seo_index_posts !== 'false',
            seo_sitemap_posts: s.seo_sitemap_posts !== 'false',
            seo_index_pages: s.seo_index_pages !== 'false',
            seo_sitemap_pages: s.seo_sitemap_pages !== 'false',
            seo_index_services: s.seo_index_services !== 'false',
            seo_sitemap_services: s.seo_sitemap_services !== 'false',
            seo_index_categories: s.seo_index_categories !== 'false',
            seo_sitemap_categories: s.seo_sitemap_categories !== 'false',
            seo_index_tags: s.seo_index_tags === 'true',
            seo_sitemap_tags: s.seo_sitemap_tags === 'true',
            seo_index_posts_archive: s.seo_index_posts_archive !== 'false',
            seo_sitemap_posts_archive: s.seo_sitemap_posts_archive !== 'false',
            seo_index_services_archive: s.seo_index_services_archive !== 'false',
            seo_sitemap_services_archive: s.seo_sitemap_services_archive !== 'false',
            seo_index_author_archive: s.seo_index_author_archive === 'true',
            seo_sitemap_author_archive: s.seo_sitemap_author_archive === 'true',
            seo_index_date_archive: s.seo_index_date_archive === 'true',
            seo_sitemap_date_archive: s.seo_sitemap_date_archive === 'true',
            seo_index_search_archive: s.seo_index_search_archive === 'true',
            seo_sitemap_search_archive: s.seo_sitemap_search_archive === 'true',
            seo_meta_title_post: s.seo_meta_title_post || '%title% %sep% %sitename%',
            seo_meta_desc_post: s.seo_meta_desc_post || '%excerpt%',
            seo_meta_title_page: s.seo_meta_title_page || '%title% %sep% %sitename%',
            seo_meta_desc_page: s.seo_meta_desc_page || '%excerpt%',
            seo_meta_title_service: s.seo_meta_title_service || '%title% %sep% %sitename%',
            seo_meta_desc_service: s.seo_meta_desc_service || '%excerpt%',
            seo_meta_title_category: s.seo_meta_title_category || '%term% %sep% %sitename%',
            seo_meta_desc_category: s.seo_meta_desc_category || 'Xem toàn bộ bài viết chuyên mục %term% tại %sitename%.',
            seo_meta_title_tag: s.seo_meta_title_tag || '%term% %sep% %sitename%',
            seo_meta_desc_tag: s.seo_meta_desc_tag || 'Bài viết được gắn thẻ %term% trên %sitename%.',
            seo_meta_title_home: s.seo_meta_title_home || '%sitename% %sep% %tagline%',
            seo_meta_desc_home: s.seo_meta_desc_home || '',
            seo_meta_separator: s.seo_meta_separator || '|'
          };

          if (settingsData.counts) {
            setCounts(settingsData.counts);
          }
        }

        if (pagesData.success) {
          setPages(pagesData.posts || []);
        }
      } catch (err) {
        console.error('Failed to initialize SEO configurations:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initSettingsAndPages();
  }, []);

  // Fetch statistics based on filter conditions
  useEffect(() => {
    async function loadStats() {
      setStatsLoading(true);
      try {
        const res = await fetch(`/api/settings/seo/stats?type=${contentTypeFilter}&category=${categoryFilter}`);
        const data = await res.json();
        if (data.success) {
          setSeoStats(data.stats.seo);
          setReadabilityStats(data.stats.readability);
          setCategories(data.categories || []);
          setTotalCount(data.totalCount || 0);
        }
      } catch (err) {
        console.error('Failed to load SEO dashboard statistics:', err);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, [contentTypeFilter, categoryFilter]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seo_sitemap_enabled: String(sitemapEnabled),
          seo_breadcrumbs_enabled: String(breadcrumbsEnabled),
          seo_breadcrumbs_separator: breadcrumbsSeparator,
          seo_breadcrumbs_home: breadcrumbsHome,
          seo_google_verification: googleVerification,
          seo_bing_verification: bingVerification,
          seo_yandex_verification: yandexVerification,
          seo_google_analytics: googleAnalytics,
          seo_google_tag_manager: googleTagManager,
          seo_google_verified: String(googleVerified),
          seo_bing_verified: String(bingVerified),
          seo_yandex_verified: String(yandexVerified),
          seo_schema_type: schemaType,
          seo_schema_name: schemaName,
          seo_schema_logo: schemaLogo,
          seo_facebook_url: facebookUrl,
          seo_instagram_url: instagramUrl,
          seo_zalo_url: zaloUrl,
          seo_default_og_image: defaultOgImage,
          seo_schema_alt_name: schemaAltName,
          seo_schema_x_url: schemaXUrl,
          seo_schema_description: schemaDescription,
          seo_schema_email: schemaEmail,
          seo_schema_phone: schemaPhone,
          seo_schema_legal_name: schemaLegalName,
          seo_schema_founding_date: schemaFoundingDate,
          seo_schema_tax_id: schemaTaxId,
          // Save llms txt
          seo_llms_txt_enabled: String(llmsEnabled),
          seo_llms_txt_mode: llmsMode,
          seo_llms_txt_about_id: String(llmsAboutId),
          seo_llms_txt_contact_id: String(llmsContactId),
          seo_llms_txt_terms_id: String(llmsTermsId),
          seo_llms_txt_privacy_id: String(llmsPrivacyId),
          seo_llms_txt_shop_id: String(llmsShopId),
          // Save technical SEO
          seo_robots_txt_enabled: String(robotsTxtEnabled),
          seo_robots_disallow_paths: robotsDisallowPaths,
          seo_rss_enabled: String(rssEnabled),
          seo_rss_include_services: String(rssIncludeServices),
          seo_rss_limit: rssLimit,
          seo_index_posts: String(indexPosts),
          seo_sitemap_posts: String(sitemapPosts),
          seo_index_pages: String(indexPages),
          seo_sitemap_pages: String(sitemapPages),
          seo_index_services: String(indexServices),
          seo_sitemap_services: String(sitemapServices),
          seo_index_categories: String(indexCategories),
          seo_sitemap_categories: String(sitemapCategories),
          seo_index_tags: String(indexTags),
          seo_sitemap_tags: String(sitemapTags),
          // Save granular post/service archives indexing and sitemaps
          seo_index_posts_archive: String(indexPostsArchive),
          seo_sitemap_posts_archive: String(sitemapPostsArchive),
          seo_index_services_archive: String(indexServicesArchive),
          seo_sitemap_services_archive: String(sitemapServicesArchive),
          // Save system archives indexing and sitemaps
          seo_index_author_archive: String(indexAuthorArchive),
          seo_sitemap_author_archive: String(sitemapAuthorArchive),
          seo_index_date_archive: String(indexDateArchive),
          seo_sitemap_date_archive: String(sitemapDateArchive),
          seo_index_search_archive: String(indexSearchArchive),
          seo_sitemap_search_archive: String(sitemapSearchArchive),
          seo_canonical_mode: seoCanonicalMode,
          seo_canonical_custom_domain: seoCanonicalCustomDomain,
          seo_robots_mode: seoRobotsMode,
          // Save Meta Templates
          seo_meta_title_post: seoMetaTitlePost,
          seo_meta_desc_post: seoMetaDescPost,
          seo_meta_title_page: seoMetaTitlePage,
          seo_meta_desc_page: seoMetaDescPage,
          seo_meta_title_service: seoMetaTitleService,
          seo_meta_desc_service: seoMetaDescService,
          seo_meta_title_category: seoMetaTitleCategory,
          seo_meta_desc_category: seoMetaDescCategory,
          seo_meta_title_tag: seoMetaTitleTag,
          seo_meta_desc_tag: seoMetaDescTag,
          seo_meta_title_home: seoMetaTitleHome,
          seo_meta_desc_home: seoMetaDescHome,
          seo_meta_separator: seoMetaSeparator
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Đã lưu cấu hình cài đặt SEO thành công!');
        // Update original settings reference with newly saved values to reset change detection
        originalSettingsRef.current = {
          seo_sitemap_enabled: sitemapEnabled,
          seo_breadcrumbs_enabled: breadcrumbsEnabled,
          seo_breadcrumbs_separator: breadcrumbsSeparator,
          seo_breadcrumbs_home: breadcrumbsHome,
          seo_google_verification: googleVerification,
          seo_bing_verification: bingVerification,
          seo_yandex_verification: yandexVerification,
          seo_google_analytics: googleAnalytics,
          seo_google_tag_manager: googleTagManager,
          seo_google_verified: String(googleVerified),
          seo_bing_verified: String(bingVerified),
          seo_yandex_verified: String(yandexVerified),
          seo_schema_type: schemaType,
          seo_schema_name: schemaName,
          seo_schema_logo: schemaLogo,
          seo_facebook_url: facebookUrl,
          seo_instagram_url: instagramUrl,
          seo_zalo_url: zaloUrl,
          seo_default_og_image: defaultOgImage,
          seo_schema_alt_name: schemaAltName,
          seo_schema_x_url: schemaXUrl,
          seo_schema_description: schemaDescription,
          seo_schema_email: schemaEmail,
          seo_schema_phone: schemaPhone,
          seo_schema_legal_name: schemaLegalName,
          seo_schema_founding_date: schemaFoundingDate,
          seo_schema_tax_id: schemaTaxId,
          seo_llms_txt_enabled: llmsEnabled,
          seo_llms_txt_mode: llmsMode,
          seo_llms_txt_about_id: llmsAboutId,
          seo_llms_txt_contact_id: llmsContactId,
          seo_llms_txt_terms_id: llmsTermsId,
          seo_llms_txt_privacy_id: llmsPrivacyId,
          seo_llms_txt_shop_id: llmsShopId,
          seo_robots_txt_enabled: robotsTxtEnabled,
          seo_robots_disallow_paths: robotsDisallowPaths,
          seo_rss_enabled: rssEnabled,
          seo_rss_include_services: rssIncludeServices,
          seo_rss_limit: rssLimit,
          seo_canonical_mode: seoCanonicalMode,
          seo_canonical_custom_domain: seoCanonicalCustomDomain,
          seo_robots_mode: seoRobotsMode,
          seo_index_posts: indexPosts,
          seo_sitemap_posts: sitemapPosts,
          seo_index_pages: indexPages,
          seo_sitemap_pages: sitemapPages,
          seo_index_services: indexServices,
          seo_sitemap_services: sitemapServices,
          seo_index_categories: indexCategories,
          seo_sitemap_categories: sitemapCategories,
          seo_index_tags: indexTags,
          seo_sitemap_tags: sitemapTags,
          seo_index_posts_archive: indexPostsArchive,
          seo_sitemap_posts_archive: sitemapPostsArchive,
          seo_index_services_archive: indexServicesArchive,
          seo_sitemap_services_archive: sitemapServicesArchive,
          seo_index_author_archive: indexAuthorArchive,
          seo_sitemap_author_archive: sitemapAuthorArchive,
          seo_index_date_archive: indexDateArchive,
          seo_sitemap_date_archive: sitemapDateArchive,
          seo_index_search_archive: indexSearchArchive,
          seo_sitemap_search_archive: sitemapSearchArchive,
          seo_meta_title_post: seoMetaTitlePost,
          seo_meta_desc_post: seoMetaDescPost,
          seo_meta_title_page: seoMetaTitlePage,
          seo_meta_desc_page: seoMetaDescPage,
          seo_meta_title_service: seoMetaTitleService,
          seo_meta_desc_service: seoMetaDescService,
          seo_meta_title_category: seoMetaTitleCategory,
          seo_meta_desc_category: seoMetaDescCategory,
          seo_meta_title_tag: seoMetaTitleTag,
          seo_meta_desc_tag: seoMetaDescTag,
          seo_meta_title_home: seoMetaTitleHome,
          seo_meta_desc_home: seoMetaDescHome,
          seo_meta_separator: seoMetaSeparator
        };
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (err) {
      alert('Không thể kết nối tới máy chủ!');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyTool = async (type: 'google' | 'bing' | 'yandex', code: string) => {
    if (!code) {
      alert('Vui lòng nhập mã cấu hình trước khi tiến hành xác minh!');
      return;
    }
    
    setIsVerifyingMap(prev => ({ ...prev, [type]: true }));
    
    try {
      // Fetch the home page to inspect meta tags
      const res = await fetch('/');
      if (!res.ok) throw new Error('Không thể tải trang chủ');
      const html = await res.text();
      
      let isVerified = false;
      if (type === 'google') {
        isVerified = html.includes('name="google-site-verification"') && html.includes(`content="${code}"`);
      } else if (type === 'bing') {
        isVerified = html.includes('name="msvalidate.01"') && html.includes(`content="${code}"`);
      } else if (type === 'yandex') {
        isVerified = html.includes('name="yandex-verification"') && html.includes(`content="${code}"`);
      }
      
      if (isVerified) {
        if (type === 'google') setGoogleVerified(true);
        if (type === 'bing') setBingVerified(true);
        if (type === 'yandex') setYandexVerified(true);
        
        // Save status immediately in the database
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [`seo_${type}_verified`]: 'true'
          })
        });

        alert(`Chúc mừng! Xác minh ${type === 'google' ? 'Google Search Console' : type === 'bing' ? 'Bing Webmaster' : 'Yandex Webmaster'} thành công! Giao diện đã chuyển sang ĐÃ XÁC MINH.`);
      } else {
        alert(`Không tìm thấy thẻ meta xác minh của ${type === 'google' ? 'Google' : type === 'bing' ? 'Bing' : 'Yandex'} trên trang chủ. Vui lòng đảm bảo bạn đã nhập đúng mã và đã click nút "Lưu cấu hình" ở trên cùng trước khi xác minh!`);
      }
    } catch (e: any) {
      console.error(e);
      alert('Đã có lỗi xảy ra trong quá trình xác minh: ' + e.message);
    } finally {
      setIsVerifyingMap(prev => ({ ...prev, [type]: false }));
    }
  };

  // --- Redirects and 404 logs operation handlers ---
  const fetchRedirects = async () => {
    setRedirectsLoading(true);
    try {
      const res = await fetch('/api/settings/seo/redirects');
      const data = await res.json();
      if (data.success) {
        setRedirects(data.redirects || []);
      }
    } catch (e) {
      console.error('Failed to fetch redirects:', e);
    } finally {
      setRedirectsLoading(false);
    }
  };

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOldUrl || !newNewUrl) {
      alert('Vui lòng điền đầy đủ thông tin đường dẫn');
      return;
    }
    try {
      const res = await fetch('/api/settings/seo/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldUrl: newOldUrl,
          newUrl: newNewUrl,
          statusCode: newStatusCode
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewOldUrl('');
        setNewNewUrl('');
        setNewStatusCode(301);
        fetchRedirects();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleDeleteRedirect = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đường dẫn chuyển hướng này?')) return;
    try {
      const res = await fetch(`/api/settings/seo/redirects?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchRedirects();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleToggleRedirectActive = async (id: number, currentActive: boolean) => {
    try {
      const res = await fetch('/api/settings/seo/redirects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive })
      });
      const data = await res.json();
      if (data.success) {
        setRedirects(prev => prev.map(r => r.id === id ? { ...r, active: !currentActive } : r));
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Reactive Redirect Testing Engine
  useEffect(() => {
    if (!testUrlInput || !testUrlInput.trim()) {
      setTestResult(null);
      return;
    }
    
    let current = testUrlInput.trim();
    if (!current.startsWith('/') && !current.startsWith('http://') && !current.startsWith('https://')) {
      current = '/' + current;
    }

    const visited = new Set<string>();
    const normalizeUrl = (url: string) => {
      let u = url.trim();
      try {
        if (u.startsWith('http://') || u.startsWith('https://')) {
          const parsedUrl = new URL(u);
          u = parsedUrl.pathname;
        }
      } catch (e) {}
      if (u.endsWith('/')) {
        u = u.slice(0, -1);
      }
      return u.toLowerCase();
    };

    const normalizedStart = normalizeUrl(current);
    visited.add(normalizedStart);

    let redirectChain: any[] = [];
    let redirectFound = false;
    let finalUrl = current;
    let isLoop = false;
    let statusCode = 301;

    while (true) {
      const match = redirects.find(r => normalizeUrl(r.oldUrl) === normalizeUrl(finalUrl) && r.active !== false);
      if (!match) break;

      const normalizedNew = normalizeUrl(match.newUrl);
      if (visited.has(normalizedNew)) {
        isLoop = true;
        redirectChain.push(match);
        break;
      }

      visited.add(normalizedNew);
      redirectChain.push(match);
      finalUrl = match.newUrl;
      statusCode = match.statusCode || 301;
      redirectFound = true;

      if (visited.size > 5) break; // chain depth limit
    }

    setTestResult({
      redirectFound,
      finalUrl,
      redirectChain,
      isLoop,
      statusCode
    });
  }, [testUrlInput, redirects]);

  const fetch404Logs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/settings/seo/404');
      const data = await res.json();
      if (data.success) {
        setFourOhFourLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to fetch 404 logs:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleDelete404Log = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhật ký lỗi 404 này?')) return;
    try {
      const res = await fetch(`/api/settings/seo/404?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetch404Logs();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleClearAll404Logs = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ nhật ký lỗi 404?')) return;
    try {
      const res = await fetch(`/api/settings/seo/404?clearAll=true`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetch404Logs();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleCreateRedirectFrom404 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redirectSourceUrl || !redirectTargetUrl) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      const res = await fetch('/api/settings/seo/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldUrl: redirectSourceUrl,
          newUrl: redirectTargetUrl,
          statusCode: 301
        })
      });
      const data = await res.json();
      if (data.success) {
        // Also delete this 404 log entry to clean up
        const logId = fourOhFourLogs.find(l => l.url === redirectSourceUrl)?.id;
        if (logId) {
          await fetch(`/api/settings/seo/404?id=${logId}`, { method: 'DELETE' });
        }
        setIsRedirectModalOpen(false);
        setRedirectSourceUrl('');
        setRedirectTargetUrl('');
        fetch404Logs();
        alert('Tạo chuyển hướng và dọn dẹp lỗi 404 thành công!');
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Fetch redirects and 404 logs when tab active
  useEffect(() => {
    if (activeTab === 'redirects') {
      fetchRedirects();
    } else if (activeTab === '404') {
      fetch404Logs();
    }
  }, [activeTab]);

  const handleSelectMedia = (image: { id: number; url: string }) => {
    if (mediaTarget === 'logo') {
      setSchemaLogo(image.url);
      setSchemaLogoId(String(image.id));
    } else if (mediaTarget === 'social') {
      setDefaultOgImage(image.url);
      setDefaultOgImageId(String(image.id));
    }
    setIsMediaOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-medium animate-pulse text-xs">Đang tải cấu hình cài đặt SEO...</div>
      </div>
    );
  }

  // Generate live JSON-LD Schema preview
  const siteUrl = 'https://lexi.vn';
  const publisherId = `${siteUrl}/#${schemaType}`;
  const logoId = `${siteUrl}/#logo`;
  const websiteId = `${siteUrl}/#website`;

  const livePublisherSchema = {
    '@type': schemaType === 'person' ? 'Person' : 'Organization',
    '@id': publisherId,
    'name': schemaName,
    ...(schemaType === 'organization' ? {
      'alternateName': schemaAltName || undefined,
      'legalName': schemaLegalName || undefined,
      'description': schemaDescription || undefined,
      'email': schemaEmail || undefined,
      'telephone': schemaPhone || undefined,
      'foundingDate': schemaFoundingDate || undefined,
      'taxID': schemaTaxId || undefined,
    } : {}),
    'url': siteUrl,
    'logo': schemaLogo ? {
      '@type': 'ImageObject',
      '@id': logoId,
      'url': schemaLogo,
      'caption': schemaName
    } : undefined,
    'image': schemaLogo ? {
      '@id': logoId
    } : undefined,
    'sameAs': [
      facebookUrl,
      schemaXUrl,
      instagramUrl,
      zaloUrl
    ].filter(Boolean)
  };

  const liveWebsiteSchema = {
    '@type': 'WebSite',
    '@id': websiteId,
    'url': siteUrl,
    'name': schemaName,
    'publisher': {
      '@id': publisherId
    },
    'potentialAction': [{
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${siteUrl}/?s={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }]
  };

  const liveGraphSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      livePublisherSchema,
      liveWebsiteSchema
    ]
  };

  const liveJsonLdString = JSON.stringify(liveGraphSchema, null, 2);

  // Generate segment statistics details
  const totalSeoCount = seoStats.good + seoStats.ok + seoStats.bad + seoStats.none;
  const totalReadabilityCount = readabilityStats.good + readabilityStats.ok + readabilityStats.bad + readabilityStats.none;

  const seoSegments: DonutSegment[] = [
    { label: 'Tốt', value: seoStats.good, color: '#72b21a' },
    { label: 'OK', value: seoStats.ok, color: '#ee7c1b' },
    { label: 'Cần cải thiện', value: seoStats.bad, color: '#dc3232' },
    { label: 'Chưa phân tích', value: seoStats.none, color: '#cbd5e1' }
  ];

  const readabilitySegments: DonutSegment[] = [
    { label: 'Tốt', value: readabilityStats.good, color: '#72b21a' },
    { label: 'OK', value: readabilityStats.ok, color: '#ee7c1b' },
    { label: 'Cần cải thiện', value: readabilityStats.bad, color: '#dc3232' },
    { label: 'Chưa phân tích', value: readabilityStats.none, color: '#cbd5e1' }
  ];

  const indexedContentTypes = [indexPosts, indexPages, indexServices, indexCategories, indexTags].filter(Boolean).length;
  const indexableUrlCount = totalCount;
  const noindexConfiguredCount = [indexPosts, indexPages, indexServices, indexCategories, indexTags].filter((v) => !v).length;
  const contentHealthRatio = totalSeoCount > 0 ? (seoStats.good + seoStats.ok) / totalSeoCount : 0;
  const contentHealthPoints = Math.round(contentHealthRatio * 15);
  const seoHealthScore = Math.min(100,
    (sitemapEnabled ? 15 : 0) +
    (robotsTxtEnabled ? 10 : 0) +
    (googleVerification ? 10 : 0) +
    (googleAnalytics ? 5 : 0) +
    (googleTagManager ? 5 : 0) +
    (bingVerification ? 2 : 0) +
    (yandexVerification ? 2 : 0) +
    (schemaName && schemaLogo ? 15 : schemaName ? 8 : 0) +
    (breadcrumbsEnabled ? 10 : 0) +
    (llmsEnabled ? 10 : 0) +
    (indexedContentTypes > 0 ? 10 : 0) +
    contentHealthPoints
  );
  const healthTone = seoHealthScore >= 85 ? 'emerald' : seoHealthScore >= 65 ? 'amber' : 'rose';
  const healthSummary = seoHealthScore >= 85
    ? 'Website đang có nền tảng SEO kỹ thuật tốt.'
    : seoHealthScore >= 65
      ? 'Website ổn nhưng vẫn còn vài cấu hình nên hoàn thiện.'
      : 'Website còn thiếu các cấu hình SEO nền tảng quan trọng.';

  const healthChecks = [
    { group: 'Sitemap', rows: [
      { ok: sitemapEnabled, text: sitemapEnabled ? 'Sitemap đang bật' : 'Sitemap đang tắt' },
      { ok: (counts.posts + counts.pages) > 0, text: `${counts.posts + counts.pages} nội dung được đưa vào sitemap` },
    ] },
    { group: 'Indexing', rows: [
      { ok: indexedContentTypes > 0, text: `${indexedContentTypes}/5 nhóm nội dung được phép index` },
      { ok: noindexConfiguredCount <= 2, warn: noindexConfiguredCount > 0, text: `${noindexConfiguredCount} nhóm đang noindex` },
    ] },
    { group: 'Schema', rows: [
      { ok: Boolean(schemaName), text: schemaName ? `${schemaType === 'organization' ? 'Organization' : 'Person'} Schema đã có tên` : 'Chưa có tên thực thể schema' },
      { ok: Boolean(schemaLogo), warn: !schemaLogo, text: schemaLogo ? 'Logo schema đã cấu hình' : 'Chưa cấu hình logo schema' },
      { ok: breadcrumbsEnabled, text: breadcrumbsEnabled ? 'Breadcrumb schema đang bật' : 'Breadcrumb đang tắt' },
    ] },
    { group: 'AI Crawl', rows: [
      { ok: llmsEnabled, text: llmsEnabled ? 'llms.txt đang bật' : 'llms.txt đang tắt' },
    ] },
    { group: 'Webmaster', rows: [
      { ok: Boolean(googleVerification), text: googleVerification ? (googleVerified ? 'Google Search Console đã xác minh' : 'Google Search Console chưa xác minh') : 'Thiếu Google Search Console' },
      { ok: Boolean(googleAnalytics), text: googleAnalytics ? 'Google Analytics đã cấu hình' : 'Thiếu Google Analytics' },
      { ok: Boolean(googleTagManager), text: googleTagManager ? 'Google Tag Manager đã cấu hình' : 'Thiếu Google Tag Manager' },
      { ok: Boolean(bingVerification), warn: !bingVerification, text: bingVerification ? (bingVerified ? 'Bing Webmaster đã xác minh' : 'Bing Webmaster chưa xác minh') : 'Thiếu Bing Webmaster' },
      { ok: Boolean(yandexVerification), warn: !yandexVerification, text: yandexVerification ? (yandexVerified ? 'Yandex Webmaster đã xác minh' : 'Yandex Webmaster chưa xác minh') : 'Thiếu Yandex Webmaster' },
    ] },
  ];

  return (
    <div className="max-w-6xl mx-auto font-sans pb-12 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Sparkles className="text-brand-600 animate-pulse" size={24} /> SEO Health & Settings
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Theo dõi sức khỏe SEO website và cấu hình indexing, crawler, schema, webmaster theo từng mục tiêu.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {checkIsDirty() && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-[10px] font-bold animate-pulse shadow-sm">
              <ShieldAlert size={12} className="shrink-0" />
              <span>Có thay đổi chưa lưu!</span>
            </div>
          )}
          <button 
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all active:translate-y-0.5 disabled:opacity-50 cursor-pointer border-none outline-none text-xs ${
              checkIsDirty()
                ? 'bg-rose-600 hover:bg-rose-700 text-white hover:shadow-rose-500/20 animate-pulse'
                : 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-brand-500/20'
            }`}
          >
            <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </div>

      {/* Redesigned Navigation & Panel Container - Vertical on desktop, horizontal on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Navigation Sidebar */}
        <aside className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible lg:sticky lg:top-4 bg-white border border-slate-200 rounded-xl p-2 gap-1 shadow-sm shrink-0 scrollbar-none select-none">
          <div className="hidden lg:block px-3 py-2 border-b border-slate-100 mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Danh mục cấu hình</span>
          </div>
          {[
            { key: 'overview', label: 'SEO Health', description: 'Điểm số & phân tích tổng quan', icon: BarChart3 },
            { key: 'technical', label: 'Technical SEO', description: 'Sitemap, Robots, Breadcrumbs, llms.txt & RSS', icon: Globe },
            { key: 'indexing', label: 'Indexing', description: 'Lập chỉ mục các nhóm nội dung', icon: ListChecks },
            { key: 'templates', label: 'Meta Templates', description: 'Cấu hình tiêu đề & mô tả mẫu', icon: Type },
            { key: 'redirects', label: 'Redirect Manager', description: 'Chuyển hướng đường dẫn 301/302', icon: Link2 },
            { key: '404', label: '404 Monitor', description: 'Theo dõi truy cập lỗi 404', icon: ShieldAlert },
            { key: 'webmaster', label: 'Webmaster', description: 'Xác minh quyền sở hữu website', icon: Layout },
            { key: 'schema', label: 'Schema & Social', description: 'Dữ liệu cấu trúc & MXH', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center lg:items-start gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer text-left w-full border-none whitespace-nowrap lg:whitespace-normal shrink-0 ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 font-bold border-b-2 lg:border-b-0 lg:border-l-[3px] border-brand-500 rounded-b-none lg:rounded-b-lg lg:rounded-l-none'
                    : 'bg-transparent text-slate-655 hover:bg-slate-50 border-b-2 lg:border-b-0 border-transparent lg:border-l-[3px] lg:border-transparent hover:text-slate-900'
                }`}
              >
                <Icon size={15} className={`shrink-0 mt-0.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold tracking-wide">{tab.label}</span>
                  <span className="hidden lg:block text-[9px] text-slate-400 font-medium mt-0.5 leading-tight">
                    {tab.description}
                  </span>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Tab Panels */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-w-0">
        
        {/* TAB 0: SEO HEALTH */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <BarChart3 size={16} className="text-brand-500" /> SEO Health Dashboard
              </h3>
            </div>

            {statsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 font-semibold">
                <RefreshCw size={24} className="animate-spin text-brand-500" />
                <span>Đang tính toán lại sức khỏe SEO...</span>
              </div>
            ) : (
              <>
                {/* Clean, Premium Glassmorphism Health Score Card */}
                <div className={`rounded-2xl p-6 border overflow-hidden relative flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 shadow-sm ${
                  healthTone === 'emerald' 
                    ? 'bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-emerald-500/20 text-slate-800' 
                    : healthTone === 'amber' 
                      ? 'bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20 text-slate-800' 
                      : 'bg-gradient-to-r from-rose-500/5 to-red-500/5 border-rose-500/20 text-slate-800'
                }`}>
                  {/* Subtle top background decorative glow */}
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-30 ${
                    healthTone === 'emerald' ? 'bg-emerald-400' : healthTone === 'amber' ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                  
                  <div className="relative z-10 space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">SEO Health Score</div>
                    <div className="flex items-baseline gap-1 pt-0.5">
                      <span className="text-5xl font-black tracking-tight text-slate-850 leading-none">{seoHealthScore}</span>
                      <span className="text-sm font-bold text-slate-400">/100</span>
                    </div>
                    <p className="text-xs font-bold text-slate-650 mt-2 leading-relaxed flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full inline-block animate-pulse ${
                        healthTone === 'emerald' ? 'bg-emerald-500' : healthTone === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      {healthSummary}
                    </p>
                  </div>

                  <div className="relative z-10 w-full md:w-56 shrink-0 space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <span>RỦI RO</span>
                      <span>KHOẺ MẠNH</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100/80 overflow-hidden p-0.5 border border-slate-200/50 shadow-inner">
                      <div className={`h-full rounded-full transition-all duration-700 ease-out ${
                        healthTone === 'emerald' 
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-500' 
                          : healthTone === 'amber' 
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                            : 'bg-gradient-to-r from-rose-400 to-red-500'
                      }`} style={{ width: `${seoHealthScore}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Styled Active Health Check Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    const checkIcons: { [key: string]: any } = {
                      'Sitemap': Globe,
                      'Indexing': ListChecks,
                      'Schema': Layout,
                      'AI Crawl': Bot,
                      'Webmaster': Search,
                    };
                    return healthChecks.map((section) => {
                      const CheckIcon = checkIcons[section.group] || HelpCircle;
                      return (
                        <div key={section.group} className="border border-slate-200/60 rounded-xl p-4 bg-white shadow-sm hover:shadow-md/5 transition-all">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                              <CheckIcon size={13} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-[11px] font-black text-slate-850 uppercase tracking-wider">{section.group}</h4>
                          </div>
                          <div className="space-y-2.5">
                            {section.rows.map((row) => (
                              <div key={row.text} className="flex items-start gap-2 text-[10px] text-slate-650 font-medium">
                                {row.ok ? (
                                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                ) : row.warn ? (
                                  <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                                ) : (
                                  <ShieldAlert size={13} className="text-rose-500 shrink-0 mt-0.5" />
                                )}
                                <span className="leading-tight">{row.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Content SEO & Readability Section Header & Visual Filter Toolbar */}
                <div className="border-t border-slate-100 pt-6 mt-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart3 size={14} className="text-brand-500 animate-pulse" /> Phân tích & Đánh giá chi tiết nội dung
                      </h4>
                      <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">
                        Thống kê điểm chuẩn SEO và mức độ dễ đọc chi tiết cho từng loại trang và danh mục.
                      </p>
                    </div>

                    {/* Highly-Polished Visual Filter Toolbar Console */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-50/80 border border-slate-200/70 rounded-xl p-1.5 px-2.5 shadow-inner self-start sm:self-center">
                      <span className="text-[9.5px] text-slate-500 font-black uppercase tracking-wider px-1">Lọc dữ liệu:</span>
                      <select 
                        value={contentTypeFilter} 
                        onChange={(e) => setContentTypeFilter(e.target.value as any)} 
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none font-bold text-slate-700 bg-white text-[10px] cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        <option value="POST">Bài viết</option>
                        <option value="PAGE">Trang tĩnh</option>
                      </select>
                      {contentTypeFilter === 'POST' && (
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          <select 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)} 
                            className="px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none font-bold text-slate-700 bg-white text-[10px] cursor-pointer max-w-[150px] truncate hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            <option value="all">Tất cả danh mục</option>
                            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="border border-slate-200/65 rounded-xl p-5 hover:shadow-md/5 transition-all relative overflow-hidden bg-gradient-to-br from-white to-slate-50/20">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="flex items-center gap-1.5"><BarChart3 size={14} className="text-brand-500" /> Content SEO Scores</span>
                      <span className="text-[9px] text-slate-400 font-bold font-mono">{totalSeoCount} items</span>
                    </h4>
                    <div className="flex items-center gap-6 pt-2">
                      <DonutChart data={seoSegments} />
                      <div className="flex-1 space-y-2">
                        {seoSegments.map((seg) => (
                          <div key={seg.label} className="flex items-center justify-between border-b border-slate-100/60 pb-1.5">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></span><span className="font-bold text-slate-600 text-[10px]">{seg.label}</span></div>
                            <span className="bg-slate-100/80 px-2 py-0.5 rounded text-[9px] font-bold text-slate-700">{seg.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="border border-slate-200/65 rounded-xl p-5 hover:shadow-md/5 transition-all relative overflow-hidden bg-gradient-to-br from-white to-slate-50/20">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="flex items-center gap-1.5"><BarChart3 size={14} className="text-brand-500" /> Readability Scores</span>
                      <span className="text-[9px] text-slate-400 font-bold font-mono">{totalReadabilityCount} items</span>
                    </h4>
                    <div className="flex items-center gap-6 pt-2">
                      <DonutChart data={readabilitySegments} />
                      <div className="flex-1 space-y-2">
                        {readabilitySegments.map((seg) => (
                          <div key={seg.label} className="flex items-center justify-between border-b border-slate-100/60 pb-1.5">
                            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></span><span className="font-bold text-slate-655 text-[10px]">{seg.label}</span></div>
                            <span className="bg-slate-100/80 px-2 py-0.5 rounded text-[9px] font-bold text-slate-700">{seg.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 1: TECHNICAL SEO */}
        {activeTab === 'technical' && (
          <div className="space-y-6 max-w-3xl">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Globe size={16} className="text-brand-500" /> Technical SEO: Sitemap, Robots, Canonical, Breadcrumbs & llms.txt
            </h3>

            {/* Sitemap Status Diagnostics Card */}
            <div className="bg-brand-50/30 border border-brand-100/65 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <div className="font-black text-slate-800 text-xs uppercase tracking-wider">XML Sitemap Diagnostics</div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
                    Tự động tạo lập sơ đồ trang web `/sitemap.xml` giúp các công cụ tìm kiếm thu thập dữ liệu nhanh hơn.
                  </p>
                </div>
                <button type="button" onClick={() => setSitemapEnabled(!sitemapEnabled)} className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent outline-none shrink-0">
                  {sitemapEnabled ? <ToggleRight className="text-emerald-500" size={30} /> : <ToggleLeft className="text-slate-300" size={30} />}
                  <span className="text-[10px] font-bold text-slate-600">{sitemapEnabled ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>

              {sitemapEnabled && (
                <div className="space-y-4 pt-1">
                  <div className="bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-500">Trạng thái sơ đồ sitemap</span>
                      <span className="bg-emerald-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full tracking-wider uppercase">Đang hoạt động</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center py-1">
                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Bài viết (Posts)</div>
                        <div className="text-lg font-black text-slate-800 mt-0.5">{counts.posts}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Trang tĩnh (Pages)</div>
                        <div className="text-lg font-black text-slate-800 mt-0.5">{counts.pages}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Danh mục (Categories)</div>
                        <div className="text-lg font-black text-slate-800 mt-0.5">{counts.categories}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-450 font-medium pt-1">
                      <span>Cập nhật gần nhất: <strong className="text-slate-650 font-bold">Thời gian thực (Real-time)</strong></span>
                      <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline font-bold inline-flex items-center gap-1">
                        Xem sitemap.xml <Eye size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Robots.txt Settings Card */}
            <div className="bg-sky-50/40 border border-sky-100 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <div className="font-black text-slate-800 text-xs uppercase tracking-wider">Robots.txt Mode</div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
                    Điều hướng các robot bò tống dữ liệu (Crawler) về vùng được phép/cấm trên website.
                  </p>
                </div>
                <button type="button" onClick={() => setRobotsTxtEnabled(!robotsTxtEnabled)} className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent outline-none shrink-0">
                  {robotsTxtEnabled ? <ToggleRight className="text-emerald-500" size={30} /> : <ToggleLeft className="text-slate-300" size={30} />}
                  <span className="text-[10px] font-bold text-slate-600">{robotsTxtEnabled ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>

              {robotsTxtEnabled && (
                <div className="space-y-4 pt-1">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input 
                        type="radio" 
                        name="seoRobotsMode" 
                        value="automatic" 
                        checked={seoRobotsMode === 'automatic'} 
                        onChange={() => setSeoRobotsMode('automatic')} 
                        className="w-3.5 h-3.5 text-brand-600 accent-brand-600 cursor-pointer"
                      />
                      Automatic (Khuyến nghị)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input 
                        type="radio" 
                        name="seoRobotsMode" 
                        value="custom" 
                        checked={seoRobotsMode === 'custom'} 
                        onChange={() => setSeoRobotsMode('custom')} 
                        className="w-3.5 h-3.5 text-brand-600 accent-brand-600 cursor-pointer"
                      />
                      Custom Paths
                    </label>
                  </div>

                  {seoRobotsMode === 'automatic' ? (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 text-[10px] text-slate-500 font-medium leading-relaxed">
                      💡 <strong>Chế độ Tự động:</strong> Hệ thống tự động cấu hình tối ưu robots.txt và ngăn chặn robot truy cập các thư mục nhạy cảm: <code className="bg-slate-200 px-1 py-0.5 rounded text-rose-600">/api/</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-rose-600">/login</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-rose-600">/admin/</code>.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-600">Nhập các thư mục cấm Crawl (mỗi dòng một đường dẫn):</span>
                      <textarea
                        value={robotsDisallowPaths}
                        onChange={(e) => setRobotsDisallowPaths(e.target.value)}
                        rows={5}
                        className="w-full px-3.5 py-2.5 border border-sky-100 rounded-lg outline-none font-mono text-[10px] text-slate-700 bg-white focus:border-brand-500 resize-none shadow-sm"
                        placeholder="/api/&#10;/login&#10;/admin/"
                      />
                    </div>
                  )}

                  <div className="pt-1 flex justify-between items-center text-[10px]">
                    <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline font-bold inline-flex items-center gap-1">
                      Xem robots.txt thực tế <Eye size={12} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Global Canonical Settings Card */}
            <div className="bg-amber-50/30 border border-amber-100 rounded-xl p-5 space-y-4">
              <div className="font-black text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3">Canonical URL (Đường dẫn chuẩn)</div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Thiết lập thẻ chuẩn canonical tránh Google phạt do trùng lặp nội dung khi website chạy song song nhiều domain (Alias, Subdomain).
              </p>

              <div className="space-y-4 pt-1">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input 
                      type="radio" 
                      name="seoCanonicalMode" 
                      value="automatic" 
                      checked={seoCanonicalMode === 'automatic'} 
                      onChange={() => setSeoCanonicalMode('automatic')} 
                      className="w-3.5 h-3.5 text-brand-600 accent-brand-600 cursor-pointer"
                    />
                    Automatic (Domain hiện tại)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input 
                      type="radio" 
                      name="seoCanonicalMode" 
                      value="custom" 
                      checked={seoCanonicalMode === 'custom'} 
                      onChange={() => setSeoCanonicalMode('custom')} 
                      className="w-3.5 h-3.5 text-brand-600 accent-brand-600 cursor-pointer"
                    />
                    Custom Domain
                  </label>
                </div>

                {seoCanonicalMode === 'custom' && (
                  <div className="space-y-2.5 bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm">
                    <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-600">
                      Nhập domain canonical tùy chỉnh (bao gồm cả protocol):
                      <input 
                        type="url" 
                        value={seoCanonicalCustomDomain} 
                        onChange={(e) => setSeoCanonicalCustomDomain(e.target.value)} 
                        placeholder="https://lexi.vn" 
                        className="px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50 focus:bg-white focus:border-brand-500 text-xs text-slate-700 font-bold"
                      />
                    </label>
                    <div className="text-[9.5px] text-slate-400 font-medium">
                      💡 Ví dụ: <code className="bg-slate-100 text-slate-650 px-1 py-0.5 rounded font-bold">https://lexi.vn</code> hoặc <code className="bg-slate-100 text-slate-650 px-1 py-0.5 rounded font-bold">https://www.lexi.vn</code>.
                    </div>
                  </div>
                )}

                {/* HTML canonical code preview box */}
                <div className="bg-slate-900 text-slate-100 font-mono text-[10px] p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[8.5px] text-slate-450 uppercase font-bold tracking-widest border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between">
                    <span>Mã nguồn HTML phát sinh</span>
                    <span className="text-[8px] text-emerald-400 border border-emerald-500/30 px-1 rounded font-bold">Live Preview</span>
                  </div>
                  <div>
                    <span className="text-slate-500">&lt;</span>
                    <span className="text-blue-400">link</span> <span className="text-purple-400">rel</span><span className="text-slate-400">=</span><span className="text-emerald-400">"canonical"</span> <span className="text-purple-400">href</span><span className="text-slate-400">=</span><span className="text-emerald-400">"{seoCanonicalMode === 'custom' && seoCanonicalCustomDomain ? seoCanonicalCustomDomain.replace(/\/+$/, '') : 'https://lexi.vn'}/[slug]"</span>
                    <span className="text-slate-500"> /&gt;</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RSS Feed Card */}
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <div className="font-black text-slate-800 text-xs uppercase tracking-wider">RSS Feed</div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
                    Sinh `/feed.xml` cho crawler, feed reader và kênh phân phối nội dung.
                  </p>
                </div>
                <button type="button" onClick={() => setRssEnabled(!rssEnabled)} className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent outline-none shrink-0">
                  {rssEnabled ? <ToggleRight className="text-emerald-500" size={30} /> : <ToggleLeft className="text-slate-300" size={30} />}
                  <span className="text-[10px] font-bold text-slate-600">{rssEnabled ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>
              {rssEnabled && (
                <>
                  <div className="max-w-[200px]">
                    <label className="flex flex-col gap-1 text-[10px] font-bold text-slate-600">
                      Số bài trong feed
                      <input type="number" min="1" max="100" value={rssLimit} onChange={(e) => setRssLimit(e.target.value)} className="px-3 py-2 border border-emerald-100 rounded-lg outline-none bg-white text-xs text-slate-700" />
                    </label>
                  </div>
                  <a href="/feed.xml" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-700 hover:underline font-bold inline-flex items-center gap-1">
                    Xem feed.xml <Eye size={12} />
                  </a>
                </>
              )}
            </div>

            {/* Breadcrumbs Settings Card */}
            <div className="bg-violet-50/40 border border-violet-100 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <div className="font-black text-slate-800 text-xs uppercase tracking-wider">Breadcrumbs Settings</div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
                    Giúp người dùng và Google hiểu vị trí của trang trong cấu trúc website, đồng thời hiển thị kết quả tìm kiếm thân thiện hơn.
                  </p>
                </div>
                <button type="button" onClick={() => setBreadcrumbsEnabled(!breadcrumbsEnabled)} className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent outline-none shrink-0">
                  {breadcrumbsEnabled ? <ToggleRight className="text-emerald-500" size={30} /> : <ToggleLeft className="text-slate-300" size={30} />}
                  <span className="text-[10px] font-bold text-slate-600">{breadcrumbsEnabled ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>

              {breadcrumbsEnabled && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-600">
                      Ký tự phân cách Breadcrumbs
                      <input type="text" value={breadcrumbsSeparator} onChange={(e) => setBreadcrumbsSeparator(e.target.value)} className="px-3 py-2 border border-brand-100/65 rounded-lg outline-none bg-white text-xs text-slate-700 font-mono" maxLength={5} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-600">
                      Nhãn liên kết trang chủ
                      <input type="text" value={breadcrumbsHome} onChange={(e) => setBreadcrumbsHome(e.target.value)} className="px-3 py-2 border border-brand-100/65 rounded-lg outline-none bg-white text-xs text-slate-700" />
                    </label>
                  </div>

                  <div className="bg-white border border-brand-100/65 rounded-lg p-3 text-[10px] font-semibold text-slate-500">
                    Preview: <span className="text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded ml-1.5">{breadcrumbsHome} {breadcrumbsSeparator} Dịch vụ {breadcrumbsSeparator} Ship hộ Trung Quốc</span>
                  </div>
                </div>
              )}
            </div>

            {/* llms.txt (AI Crawl Settings) Card */}
            <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <div className="font-black text-slate-800 text-xs uppercase tracking-wider">llms.txt (AI Crawl Settings)</div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
                    Định hình nội dung cấp cao giúp AI Crawler dễ dàng lập chỉ mục cho các trang quan trọng nhất của website.
                  </p>
                </div>
                <button type="button" onClick={() => setLlmsEnabled(!llmsEnabled)} className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent outline-none shrink-0">
                  {llmsEnabled ? <ToggleRight className="text-emerald-500" size={30} /> : <ToggleLeft className="text-slate-300" size={30} />}
                  <span className="text-[10px] font-bold text-slate-600">{llmsEnabled ? 'Bật' : 'Tắt'}</span>
                </button>
              </div>
              
              <div className="flex items-center justify-between text-[10px] font-medium">
                <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="text-violet-750 hover:underline font-bold inline-flex items-center gap-1">
                  Xem llms.txt thực tế <Eye size={12} />
                </a>
              </div>

              {llmsEnabled && (
                <div className="space-y-4 border-t border-violet-100/60 pt-4">
                  <div className="flex items-center gap-6 font-semibold text-slate-700 text-[10px]">
                    <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide mr-1">Chế độ phân tích:</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="llmsModeAi" checked={llmsMode === 'automatic'} onChange={() => setLlmsMode('automatic')} className="w-3.5 h-3.5 text-violet-600 accent-violet-600 cursor-pointer" /> 
                      Tự động (Automatic)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="llmsModeAi" checked={llmsMode === 'manual'} onChange={() => setLlmsMode('manual')} className="w-3.5 h-3.5 text-violet-600 accent-violet-600 cursor-pointer" /> 
                      Thủ công (Custom)
                    </label>
                  </div>
                  {llmsMode === 'manual' && (
                    <div className="grid grid-cols-2 gap-4 border-t border-violet-50 pt-4">
                      {[
                        ['About Page', llmsAboutId, setLlmsAboutId],
                        ['Contact Page', llmsContactId, setLlmsContactId],
                        ['Terms Page', llmsTermsId, setLlmsTermsId],
                        ['Privacy Page', llmsPrivacyId, setLlmsPrivacyId],
                        ['Shop/Service Page', llmsShopId, setLlmsShopId]
                      ].map(([label, value, setter]) => (
                        <label key={String(label)} className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-600">
                          {String(label)} *
                          <select value={String(value)} onChange={(e) => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)} className="px-3 py-2 border border-violet-100 rounded-lg outline-none bg-white text-xs text-slate-700 font-semibold focus:border-violet-500">
                            <option value="">-- Chọn trang --</option>
                            {pages.map((p) => (<option key={p.id} value={p.id}>{p.title}</option>))}
                          </select>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: INDEXING */}
        {activeTab === 'indexing' && (
          <div className="space-y-6 max-w-3xl">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <ListChecks size={16} className="text-brand-500" /> Bảng thiết lập Lập chỉ mục & Sitemap
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded">
                Granular Level Matrix
              </span>
            </div>

            <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-2xl -mt-2">
              Quản lý tập trung quyền lập chỉ mục (Google Index) và sơ đồ trang web (Sitemap) cho từng nhóm nội dung dưới dạng ma trận tối giản, loại bỏ lặp lại.
            </p>

            {/* Matrix Table Card */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                      <th className="py-3.5 px-4 font-semibold text-slate-550">Loại nội dung / Định dạng</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-550">Số lượng (Live)</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-550 text-center">Google Index</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-550 text-center">Đưa vào Sitemap</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-550 text-center">Canonical URL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                    
                    {/* SECTION: BÀI VIẾT */}
                    <tr className="bg-slate-50/30">
                      <td colSpan={5} className="py-2 px-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        Bài viết (Posts)
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-medium pl-6">
                        <div className="flex items-start gap-2.5">
                          <FileText size={16} className="text-brand-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-800 text-[11px]">Bài viết chi tiết (Single Posts)</div>
                            <span className="text-[8.5px] text-slate-450 font-normal">Trang nội dung chi tiết bài viết</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-brand-600 font-bold font-mono text-[10px]">{counts.posts} URLs</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CustomCheckbox checked={indexPosts} onChange={setIndexPosts} />
                          {indexPosts ? (
                            <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">INDEX</span>
                          ) : (
                            <span className="text-[7.5px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">NOINDEX</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CustomCheckbox checked={sitemapPosts} onChange={setSitemapPosts} />
                          {sitemapPosts ? (
                            <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">SITEMAP</span>
                          ) : (
                            <span className="text-[7.5px] bg-slate-100 text-slate-450 border border-slate-200 px-1.5 py-0.5 rounded font-black tracking-wider select-none">EXCLUDE</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 font-semibold">Tự động (Auto)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-medium pl-6">
                        <div className="flex items-start gap-2.5">
                          <Archive size={16} className="text-brand-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-800 text-[11px]">Trang lưu trữ bài viết (Post Archive / Blog)</div>
                            <span className="text-[8.5px] text-slate-450 font-normal">Trang danh sách tin tức / blog</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-bold font-mono text-[10px]">1 URL</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CustomCheckbox checked={indexPostsArchive} onChange={setIndexPostsArchive} />
                          {indexPostsArchive ? (
                            <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">INDEX</span>
                          ) : (
                            <span className="text-[7.5px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">NOINDEX</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CustomCheckbox checked={sitemapPostsArchive} onChange={setSitemapPostsArchive} />
                          {sitemapPostsArchive ? (
                            <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">SITEMAP</span>
                          ) : (
                            <span className="text-[7.5px] bg-slate-100 text-slate-455 border border-slate-200 px-1.5 py-0.5 rounded font-black tracking-wider select-none">EXCLUDE</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 font-semibold">Tự động (Auto)</td>
                    </tr>

                    {/* SECTION: TRANG TĨNH */}
                    <tr className="bg-slate-50/30">
                      <td colSpan={5} className="py-2 px-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        Trang tĩnh (Pages)
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-medium pl-6">
                        <div className="flex items-start gap-2.5">
                          <File size={16} className="text-brand-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-800 text-[11px]">Trang tĩnh chi tiết (Single Pages)</div>
                            <span className="text-[8.5px] text-slate-455 font-normal">Trang giới thiệu, liên hệ, chính sách,...</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-brand-600 font-bold font-mono text-[10px]">{counts.pages} URLs</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CustomCheckbox checked={indexPages} onChange={setIndexPages} />
                          {indexPages ? (
                            <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">INDEX</span>
                          ) : (
                            <span className="text-[7.5px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">NOINDEX</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CustomCheckbox checked={sitemapPages} onChange={setSitemapPages} />
                          {sitemapPages ? (
                            <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">SITEMAP</span>
                          ) : (
                            <span className="text-[7.5px] bg-slate-100 text-slate-455 border border-slate-200 px-1.5 py-0.5 rounded font-black tracking-wider select-none">EXCLUDE</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 font-semibold">Tự động (Auto)</td>
                    </tr>

                    {/* SECTION: PHÂN LOẠI */}
                    <tr className="bg-slate-50/30">
                      <td colSpan={5} className="py-2 px-4 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        Phân loại & Lưu trữ (Taxonomies)
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-medium pl-6">
                        <div className="flex items-start gap-2.5">
                          <Folder size={16} className="text-brand-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-800 text-[11px]">Trang Danh mục bài viết (Category Archives)</div>
                            <span className="text-[8.5px] text-slate-455 font-normal">Các trang lưu trữ danh mục bài viết</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-brand-600 font-bold font-mono text-[10px]">{counts.categories} danh mục</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CustomCheckbox checked={indexCategories} onChange={setIndexCategories} />
                          {indexCategories ? (
                            <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">INDEX</span>
                          ) : (
                            <span className="text-[7.5px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">NOINDEX</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CustomCheckbox checked={sitemapCategories} onChange={setSitemapCategories} />
                          {sitemapCategories ? (
                            <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">SITEMAP</span>
                          ) : (
                            <span className="text-[7.5px] bg-slate-100 text-slate-455 border border-slate-200 px-1.5 py-0.5 rounded font-black tracking-wider select-none">EXCLUDE</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 font-semibold">Tự động (Auto)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 font-medium pl-6">
                        <div className="flex items-start gap-2.5">
                          <Tag size={16} className="text-brand-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-800 text-[11px]">Trang Thẻ bài viết (Tag Archives)</div>
                            <span className="text-[8.5px] text-slate-455 font-normal">Các trang lưu trữ tag bài viết (Khuyến nghị noindex)</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-brand-600 font-bold font-mono text-[10px]">{counts.tags} tags</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CustomCheckbox checked={indexTags} onChange={setIndexTags} />
                          {indexTags ? (
                            <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">INDEX</span>
                          ) : (
                            <span className="text-[7.5px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">NOINDEX</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <CustomCheckbox checked={sitemapTags} onChange={setSitemapTags} />
                          {sitemapTags ? (
                            <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider select-none">SITEMAP</span>
                          ) : (
                            <span className="text-[7.5px] bg-slate-100 text-slate-455 border border-slate-200 px-1.5 py-0.5 rounded font-black tracking-wider select-none">EXCLUDE</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 font-semibold">Tự động (Auto)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Archives Section */}
            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h4 className="text-xs font-bold text-slate-800">Các trang lưu trữ hệ thống (Archives)</h4>
                <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider select-none animate-pulse">
                  ĐÃ KÍCH HOẠT
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-semibold leading-relaxed -mt-2">
                Các trang lưu trữ tự động của hệ thống (Archives) thường gây ra lỗi trùng lặp nội dung (duplicate content). Khuyến nghị tắt index/sitemap nếu không thật sự cần thiết.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Author Archives */}
                <div className="bg-slate-50/40 border border-slate-200 rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-[11px] border-b border-slate-100 pb-2">
                    <User size={15} className="text-brand-500" />
                    <span>Author Archives</span>
                  </div>
                  <p className="text-[8.5px] text-slate-450 font-normal leading-normal">
                    Trang gom tất cả bài viết viết bởi một tác giả cụ thể.
                  </p>
                  <div className="space-y-2 pt-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-650">
                      <span className="text-[9.5px]">Google Index</span>
                      <div className="flex items-center gap-1.5">
                        <CustomCheckbox checked={indexAuthorArchive} onChange={setIndexAuthorArchive} />
                        {indexAuthorArchive ? (
                          <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider">INDEX</span>
                        ) : (
                          <span className="text-[7.5px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded font-black tracking-wider">NOINDEX</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-650">
                      <span className="text-[9.5px]">Đưa vào Sitemap</span>
                      <div className="flex items-center gap-1.5">
                        <CustomCheckbox checked={sitemapAuthorArchive} onChange={setSitemapAuthorArchive} />
                        {sitemapAuthorArchive ? (
                          <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider">SITEMAP</span>
                        ) : (
                          <span className="text-[7.5px] bg-slate-100 text-slate-450 border border-slate-200 px-1.5 py-0.5 rounded font-black tracking-wider">EXCLUDE</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Archives */}
                <div className="bg-slate-50/40 border border-slate-200 rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-[11px] border-b border-slate-100 pb-2">
                    <Calendar size={15} className="text-brand-500" />
                    <span>Date Archives</span>
                  </div>
                  <p className="text-[8.5px] text-slate-450 font-normal leading-normal">
                    Trang gom tất cả bài viết viết theo từng ngày/tháng/năm.
                  </p>
                  <div className="space-y-2 pt-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-650">
                      <span className="text-[9.5px]">Google Index</span>
                      <div className="flex items-center gap-1.5">
                        <CustomCheckbox checked={indexDateArchive} onChange={setIndexDateArchive} />
                        {indexDateArchive ? (
                          <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider">INDEX</span>
                        ) : (
                          <span className="text-[7.5px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded font-black tracking-wider">NOINDEX</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-650">
                      <span className="text-[9.5px]">Đưa vào Sitemap</span>
                      <div className="flex items-center gap-1.5">
                        <CustomCheckbox checked={sitemapDateArchive} onChange={setSitemapDateArchive} />
                        {sitemapDateArchive ? (
                          <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider">SITEMAP</span>
                        ) : (
                          <span className="text-[7.5px] bg-slate-100 text-slate-455 border border-slate-200 px-1.5 py-0.5 rounded font-black tracking-wider">EXCLUDE</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Archives */}
                <div className="bg-slate-50/40 border border-slate-200 rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-[11px] border-b border-slate-100 pb-2">
                    <Search size={15} className="text-brand-500" />
                    <span>Search Archives</span>
                  </div>
                  <p className="text-[8.5px] text-slate-455 font-normal leading-normal">
                    Trang kết quả tìm kiếm nội bộ của trang web (Khuyến nghị NOINDEX).
                  </p>
                  <div className="space-y-2 pt-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-650">
                      <span className="text-[9.5px]">Google Index</span>
                      <div className="flex items-center gap-1.5">
                        <CustomCheckbox checked={indexSearchArchive} onChange={setIndexSearchArchive} />
                        {indexSearchArchive ? (
                          <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider">INDEX</span>
                        ) : (
                          <span className="text-[7.5px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded font-black tracking-wider">NOINDEX</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-650">
                      <span className="text-[9.5px]">Đưa vào Sitemap</span>
                      <div className="flex items-center gap-1.5">
                        <CustomCheckbox checked={sitemapSearchArchive} onChange={setSitemapSearchArchive} />
                        {sitemapSearchArchive ? (
                          <span className="text-[7.5px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded font-black tracking-wider">SITEMAP</span>
                        ) : (
                          <span className="text-[7.5px] bg-slate-100 text-slate-450 border border-slate-200 px-1.5 py-0.5 rounded font-black tracking-wider">EXCLUDE</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: META TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Type size={16} className="text-brand-500" /> Meta Templates: Cấu hình tiêu đề & mô tả mẫu
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Tự động tối ưu tiêu đề và thẻ mô tả của toàn bộ trang web theo khuôn mẫu định sẵn khi không cấu hình thủ công.
              </p>
            </div>

            {/* Separator Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md/5 transition-all">
              <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-2">
                <Settings size={14} className="text-brand-500" /> Dấu phân cách tiêu đề toàn cục (Separator)
              </h4>
              <p className="text-[10.5px] text-slate-400 mb-4">
                Dấu phân cách sẽ thay thế cho biến <code className="bg-slate-100 px-1 py-0.5 rounded text-brand-600">%sep%</code> trong các template.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {['|', '-', '–', '«', '»', '/', '•', '★'].map((sep) => (
                  <button
                    key={sep}
                    type="button"
                    onClick={() => setSeoMetaSeparator(sep)}
                    className={`px-4 py-2 rounded-lg font-bold border transition-all text-xs cursor-pointer ${
                      seoMetaSeparator === sep
                        ? 'bg-brand-50 border-brand-500 text-brand-600 shadow-sm scale-105'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350 hover:bg-slate-50'
                    }`}
                  >
                    {sep}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Table of Placeholders */}
            <div className="bg-brand-50/15 border border-brand-100 rounded-xl p-5">
              <h4 className="font-bold text-brand-850 text-xs mb-3 flex items-center gap-2">
                <HelpCircle size={14} className="text-brand-500" /> Các biến Placeholder hợp lệ <span className="text-[10px] text-slate-450 font-normal italic">(Nhấp vào ô để sao chép nhanh)</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {[
                  { name: '%title%', desc: 'Tiêu đề trang/bài' },
                  { name: '%sep%', desc: 'Dấu phân cách' },
                  { name: '%sitename%', desc: 'Tên Website' },
                  { name: '%tagline%', desc: 'Slogan Web' },
                  { name: '%term%', desc: 'Danh mục/Thẻ' },
                  { name: '%excerpt%', desc: 'Mô tả ngắn' },
                  { name: '%author%', desc: 'Tác giả' },
                  { name: '%slug%', desc: 'Đường dẫn tĩnh (Slug)' },
                  { name: '%category%', desc: 'Chuyên mục chính' },
                  { name: '%currentyear%', desc: 'Năm hiện tại' },
                  { name: '%currentmonth%', desc: 'Tháng hiện tại' },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleCopy(item.name)}
                    className={`relative overflow-hidden bg-white border rounded-lg p-2.5 flex flex-col gap-1 cursor-pointer text-left w-full transition-all duration-200 active:scale-[0.98] select-none outline-none ${
                      copiedKey === item.name
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-sm shadow-emerald-100'
                        : 'border-slate-200/80 hover:border-brand-400 hover:bg-brand-50/10 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full min-h-[14px]">
                      <code className={`text-[10px] font-mono font-bold transition-colors ${copiedKey === item.name ? 'text-emerald-600' : 'text-brand-600'}`}>
                        {item.name}
                      </code>
                      {copiedKey === item.name && (
                        <span className="text-[8px] font-bold text-emerald-600 bg-emerald-100 px-1 py-0.5 rounded scale-90 animate-fade-in-down">
                          Copied!
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium leading-none">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Horizontal Pill Tabs for Content Types */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 max-w-full overflow-x-auto gap-0.5 scrollbar-none select-none my-4 shadow-inner">
              {[
                { key: 'home', label: 'Trang chủ', icon: Home, show: true },
                { key: 'post', label: 'Bài viết (Posts)', icon: FileText, show: true },
                { key: 'page', label: 'Trang tĩnh (Pages)', icon: File, show: true },
                { key: 'service', label: 'Dịch vụ (Services)', icon: Briefcase, show: counts.services > 0 },
                { key: 'category', label: 'Chuyên mục', icon: Folder, show: counts.categories > 0 },
                { key: 'tag', label: 'Thẻ gắn (Tags)', icon: Tag, show: counts.tags > 0 },
              ]
                .filter((tab) => tab.show)
                .map((tab) => {
                  const Icon = tab.icon;
                  const isActive = metaTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setMetaTab(tab.key as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer border-none shrink-0 ${
                        isActive
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'bg-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon size={13.5} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
            </div>

            {/* Template forms for each post type */}
            {[
              {
                id: 'home',
                label: 'Trang chủ (Homepage)',
                desc: 'Hiển thị mặc định cho trang chủ của website.',
                titleState: seoMetaTitleHome,
                setTitleState: setSeoMetaTitleHome,
                descState: seoMetaDescHome,
                setDescState: setSeoMetaDescHome,
                url: 'https://lexi.vn/',
                vars: ['%sitename%', '%sep%', '%tagline%', '%currentyear%']
              },
              {
                id: 'post',
                label: 'Bài viết (Posts)',
                desc: 'Mẫu tiêu chuẩn áp dụng cho tất cả bài đăng Blog / Tin tức.',
                titleState: seoMetaTitlePost,
                setTitleState: setSeoMetaTitlePost,
                descState: seoMetaDescPost,
                setDescState: setSeoMetaDescPost,
                url: 'https://lexi.vn/bang-gia-cuoc-van-chuyen-trung-quoc.html',
                vars: ['%title%', '%sep%', '%sitename%', '%slug%', '%category%', '%excerpt%', '%author%', '%currentyear%']
              },
              {
                id: 'page',
                label: 'Trang tĩnh (Pages)',
                desc: 'Mẫu áp dụng cho các trang tĩnh như Giới thiệu, Liên hệ, Chính sách...',
                titleState: seoMetaTitlePage,
                setTitleState: setSeoMetaTitlePage,
                descState: seoMetaDescPage,
                setDescState: setSeoMetaDescPage,
                url: 'https://lexi.vn/gioi-thieu.html',
                vars: ['%title%', '%sep%', '%sitename%', '%slug%', '%excerpt%', '%currentyear%']
              },
              {
                id: 'service',
                label: 'Dịch vụ (Services)',
                desc: 'Mẫu tiêu đề và mô tả của các gói dịch vụ logistics, mua hộ.',
                titleState: seoMetaTitleService,
                setTitleState: setSeoMetaTitleService,
                descState: seoMetaDescService,
                setDescState: setSeoMetaDescService,
                url: 'https://lexi.vn/dich-vu-mua-ho-taobao.html',
                vars: ['%title%', '%sep%', '%sitename%', '%slug%', '%excerpt%', '%currentyear%']
              },
              {
                id: 'category',
                label: 'Chuyên mục (Categories)',
                desc: 'Mẫu áp dụng cho các trang lưu trữ chuyên mục (Category Archive).',
                titleState: seoMetaTitleCategory,
                setTitleState: setSeoMetaTitleCategory,
                descState: seoMetaDescCategory,
                setDescState: setSeoMetaDescCategory,
                url: 'https://lexi.vn/category/van-chuyen-trung-quoc',
                vars: ['%term%', '%sep%', '%sitename%', '%currentyear%']
              },
              {
                id: 'tag',
                label: 'Thẻ gắn (Tags)',
                desc: 'Mẫu tiêu đề/mô tả cho các trang danh sách thẻ (Tag Archive).',
                titleState: seoMetaTitleTag,
                setTitleState: setSeoMetaTitleTag,
                descState: seoMetaDescTag,
                setDescState: setSeoMetaDescTag,
                url: 'https://lexi.vn/tag/order-hang',
                vars: ['%term%', '%sep%', '%sitename%', '%currentyear%']
              }
            ]
              .filter((card) => card.id === metaTab)
              .map((card) => {
                const previewTitle = getPreview(card.titleState, card.id as any);
                const previewDesc = getPreview(card.descState, card.id as any);

                const titleLength = previewTitle === '—' ? 0 : previewTitle.length;
                const descLength = previewDesc === '—' ? 0 : previewDesc.length;

                const titleValidation = validateTemplate(card.titleState);
                const descValidation = validateTemplate(card.descState);

                return (
                  <div key={card.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md/5 transition-all space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{card.label}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{card.desc}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Inputs */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                              Tiêu đề Mẫu (Title Template)
                            </label>
                          </div>
                          
                          <input
                            type="text"
                            value={card.titleState}
                            onChange={(e) => card.setTitleState(e.target.value)}
                            placeholder="%title% %sep% %sitename%"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all font-medium text-slate-700 shadow-sm"
                          />
                          
                          {!titleValidation.isValid && (
                            <div className="text-[10px] text-rose-500 font-semibold mt-1 flex flex-col gap-0.5 animate-fade-in">
                              {titleValidation.errors.map((err, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <AlertCircle size={11} className="shrink-0" />
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                              Mô tả ngắn Mẫu (Description Template)
                            </label>
                          </div>

                          <textarea
                            rows={3}
                            value={card.descState}
                            onChange={(e) => card.setDescState(e.target.value)}
                            placeholder="%excerpt%"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all font-medium text-slate-700 resize-y shadow-sm"
                          />

                          {!descValidation.isValid && (
                            <div className="text-[10px] text-rose-500 font-semibold mt-1 flex flex-col gap-0.5 animate-fade-in">
                              {descValidation.errors.map((err, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <AlertCircle size={11} className="shrink-0" />
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Small Quick Insert Buttons */}
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[9px] text-slate-400 font-bold mr-1">Chèn nhanh:</span>
                          {card.vars.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                if (v === '%excerpt%') {
                                  card.setDescState(card.descState ? card.descState + ' ' + v : v);
                                } else {
                                  card.setTitleState(card.titleState ? card.titleState + ' ' + v : v);
                                }
                              }}
                              className="text-[9px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded cursor-pointer transition-all hover:text-brand-600 border border-slate-200/50"
                            >
                              {v}
                            </button>
                          ))}
                          
                          <button
                            type="button"
                            onClick={() => handleReset(card.id)}
                            className="text-[9px] text-brand-600 hover:text-brand-700 hover:underline font-bold flex items-center gap-1 cursor-pointer transition-all border-none bg-transparent ml-auto"
                          >
                            <RefreshCw size={11} className="animate-spin-hover" /> Khôi phục mặc định
                          </button>
                        </div>
                      </div>

                      {/* Google SERP Preview */}
                      <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-bold text-brand-600 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Eye size={12} /> Google Search Preview
                          </span>
                          
                          <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-sm max-w-full overflow-hidden">
                            <div className="text-[9.5px] text-slate-450 truncate mb-1">
                              {card.url}
                            </div>
                            <h5 className="text-[12.5px] font-semibold text-[#1a0dab] hover:underline cursor-pointer leading-tight mb-1 truncate">
                              {previewTitle}
                            </h5>
                            <p className="text-[10.5px] text-[#4d5156] leading-relaxed line-clamp-2 break-words">
                              {previewDesc || 'Nhập mô tả template để xem preview tại đây...'}
                            </p>
                          </div>
                        </div>

                        <div className="text-[9px] text-slate-450 italic mt-3 flex items-center gap-1">
                          <span>💡 Mẹo: Giữ tiêu đề khoảng 50-60 ký tự và mô tả khoảng 120-160 ký tự để tối ưu hiển thị tốt nhất trên Google.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* TAB: REDIRECT MANAGER */}
        {activeTab === 'redirects' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Link2 size={16} className="text-brand-500" /> Redirect Manager: Trình quản lý chuyển hướng 301/302
            </h3>

            {/* Grid Container for Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Add Form */}
              <div className="bg-brand-50/20 border border-slate-200/60 rounded-xl p-5 hover:shadow-md/5 transition-all flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Plus size={14} className="text-brand-500" /> Thêm đường dẫn chuyển hướng mới
                  </h4>
                  <form onSubmit={handleAddRedirect} className="space-y-4">
                    <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-600">
                      Đường dẫn cũ (Old URL) *
                      <input 
                        type="text" 
                        value={newOldUrl} 
                        onChange={(e) => setNewOldUrl(e.target.value)} 
                        placeholder="/tin-tuc/bai-viet-cu.html" 
                        required
                        className="px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:border-brand-500 text-xs text-slate-700 font-bold shadow-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-600">
                      Đường dẫn mới (New URL) *
                      <input 
                        type="text" 
                        value={newNewUrl} 
                        onChange={(e) => setNewNewUrl(e.target.value)} 
                        placeholder="/blog/bai-viet-moi" 
                        required
                        className="px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:border-brand-500 text-xs text-slate-700 font-bold shadow-sm"
                      />
                    </label>
                    <div className="flex gap-4 items-end">
                      <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-600 flex-1">
                        Mã trạng thái
                        <select 
                          value={newStatusCode} 
                          onChange={(e) => setNewStatusCode(Number(e.target.value))} 
                          className="px-2.5 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:border-brand-500 text-xs text-slate-700 cursor-pointer font-bold shadow-sm"
                        >
                          <option value="301">301 (Permanent Redirect)</option>
                          <option value="302">302 (Temporary Redirect)</option>
                        </select>
                      </label>
                      <button 
                        type="submit" 
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 h-9 rounded-lg flex items-center justify-center border-none cursor-pointer text-xs active:translate-y-0.5 shadow-sm transition-all shrink-0"
                      >
                        Thêm
                      </button>
                    </div>
                  </form>
                </div>
                <div className="text-[9.5px] text-slate-400 italic mt-4 flex items-center gap-1">
                  <span>💡 Hệ thống tự động phát hiện và chặn vòng lặp chuyển hướng một trang về chính nó.</span>
                </div>
              </div>

              {/* Redirect Test Widget */}
              <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-5 hover:shadow-md/5 transition-all flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Search size={14} className="text-brand-500" /> Kiểm tra chuyển hướng (Redirect Test)
                  </h4>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Nhập đường dẫn kiểm tra
                      </label>
                      <input 
                        type="text" 
                        value={testUrlInput} 
                        onChange={(e) => setTestUrlInput(e.target.value)} 
                        placeholder="Ví dụ: /abc-cu.html hoặc /trang-cu" 
                        className="px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:border-brand-500 text-xs text-slate-700 font-mono font-bold shadow-sm"
                      />
                    </div>

                    {/* Realtime Result Flow */}
                    {testResult && (
                      <div className="bg-white border border-slate-200/60 rounded-xl p-3.5 space-y-3 animate-fade-in shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 border-b border-slate-100 pb-1.5">
                          Kết quả phân tích đường dẫn
                        </div>
                        
                        {testResult.redirectFound ? (
                          <div className="space-y-2.5">
                            {/* Chain listing */}
                            <div className="space-y-2 font-mono text-[10.5px]">
                              {testResult.redirectChain.map((link: any, idx: number) => (
                                <div key={link.id} className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[9px] text-slate-500 font-bold shrink-0">
                                      {idx + 1}
                                    </span>
                                    <span className="text-slate-500 truncate break-all">{link.oldUrl}</span>
                                  </div>
                                  <div className="flex items-center gap-2 pl-6 my-0.5 text-slate-400 font-bold text-[9px]">
                                    <span>↓</span>
                                    <span className={`px-1.5 py-0.2 rounded ${link.statusCode === 301 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                      {link.statusCode} Redirect
                                    </span>
                                  </div>
                                </div>
                              ))}
                              
                              {!testResult.isLoop && (
                                <div className="flex items-center gap-2">
                                  <span className="w-4 h-4 rounded-full bg-brand-50 flex items-center justify-center text-[9px] text-brand-600 font-bold shrink-0">
                                    🎯
                                  </span>
                                  <span className="text-brand-600 font-bold truncate break-all">{testResult.finalUrl}</span>
                                </div>
                              )}
                            </div>

                            {testResult.isLoop ? (
                              <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[10px] font-bold animate-pulse">
                                <ShieldAlert size={12} className="shrink-0" />
                                <span>Phát hiện vòng lặp chuyển hướng vô hạn!</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold">
                                <CheckCircle2 size={12} className="shrink-0" />
                                <span>Đường dẫn hoạt động chính xác (Chuyển hướng {testResult.statusCode})</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200/50 text-slate-500 rounded-lg text-[10px] font-bold">
                            <CheckCircle2 size={12} className="text-slate-400 shrink-0" />
                            <span>Không chuyển hướng (Tải trang trực tiếp)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-[9.5px] text-slate-400 italic mt-4 flex items-center gap-1">
                  <span>💡 Kiểm tra nhanh các luồng chuyển tiếp để phát hiện và ngăn chặn vòng lặp.</span>
                </div>
              </div>
            </div>

            {/* List Redirects */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Danh sách chuyển hướng ({redirects.length})</span>
                
                {/* Search Redirects */}
                <div className="relative w-48 shrink-0">
                  <input 
                    type="text" 
                    value={redirectSearch} 
                    onChange={(e) => setRedirectSearch(e.target.value)} 
                    placeholder="Tìm kiếm chuyển hướng..." 
                    className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg outline-none text-[10px] bg-slate-50 focus:bg-white text-slate-700 font-bold"
                  />
                  <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {redirectsLoading ? (
                <div className="text-center py-8 text-slate-400 font-semibold animate-pulse text-[10px]">Đang tải danh sách chuyển hướng...</div>
              ) : redirects.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-[10px] font-semibold">Chưa có đường dẫn chuyển hướng nào được thiết lập.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10.5px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="py-2.5">Đường dẫn cũ</th>
                        <th className="py-2.5">Đường dẫn mới</th>
                        <th className="py-2.5 w-24 text-center">Mã lỗi</th>
                        <th className="py-2.5 w-24 text-center">Lượt truy cập</th>
                        <th className="py-2.5 w-20 text-center">Hoạt động</th>
                        <th className="py-2.5 w-16 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60 font-medium">
                      {redirects
                        .filter(r => 
                          r.oldUrl.toLowerCase().includes(redirectSearch.toLowerCase()) || 
                          r.newUrl.toLowerCase().includes(redirectSearch.toLowerCase())
                        )
                        .map((r) => (
                          <tr key={r.id} className={`hover:bg-slate-50/50 transition-colors ${!r.active ? 'opacity-65' : ''}`}>
                            <td className="py-3 pr-2 break-all text-slate-700 font-bold font-mono">{r.oldUrl}</td>
                            <td className="py-3 pr-2 break-all text-brand-600 font-bold font-mono">{r.newUrl}</td>
                            <td className="py-3 text-center">
                              <span className={`inline-block text-[8px] font-extrabold px-2 py-0.5 rounded-full ${r.statusCode === 301 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                {r.statusCode}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold ${r.hits > 0 ? 'bg-brand-50 text-brand-600 font-extrabold' : 'bg-slate-100 text-slate-400'}`}>
                                {r.hits || 0} lượt
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleRedirectActive(r.id, r.active !== false)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none border-none p-0 ${
                                  r.active !== false ? 'bg-brand-500' : 'bg-slate-200'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    r.active !== false ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="py-3 text-right">
                              <button 
                                type="button" 
                                onClick={() => handleDeleteRedirect(r.id)} 
                                className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: 404 MONITOR */}
        {activeTab === '404' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert size={16} className="text-brand-500 animate-pulse" /> 404 Monitor: Nhật ký truy cập lỗi 404
              </h3>
              {fourOhFourLogs.length > 0 && (
                <button 
                  type="button" 
                  onClick={handleClearAll404Logs} 
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-1.5 rounded-lg border border-rose-200/50 flex items-center gap-1 cursor-pointer text-[10px] transition-all shadow-sm"
                >
                  <Trash2 size={12} /> Xóa toàn bộ nhật ký
                </button>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl -mr-8 -mt-8" />
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px]">
                <span className="font-bold text-slate-700 uppercase tracking-wider">Lịch sử truy cập lỗi 404 ({fourOhFourLogs.length})</span>
                <p className="text-[9.5px] text-slate-400 font-medium">Theo dõi các URL hỏng để tạo chuyển hướng 301 kịp thời bảo vệ chỉ mục SEO.</p>
              </div>

              {logsLoading ? (
                <div className="text-center py-8 text-slate-400 font-semibold animate-pulse text-[10px]">Đang tải nhật ký lỗi 404...</div>
              ) : fourOhFourLogs.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 text-center text-slate-400 text-[10.5px] font-semibold space-y-1">
                  <div>🎉 Tuyệt vời! Hiện tại hệ thống không ghi nhận lỗi 404 nào.</div>
                  <div className="text-[9.5px] text-slate-400 font-normal">Tất cả đường dẫn trên website của bạn đều đang vận hành trơn tru!</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[10.5px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="py-2.5">Đường dẫn lỗi 404</th>
                        <th className="py-2.5 w-24 text-center">Số lượt xem</th>
                        <th className="py-2.5 w-36 text-center">Phát hiện lần cuối</th>
                        <th className="py-2.5 w-32 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60 font-medium text-slate-750">
                      {fourOhFourLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 pr-2 break-all font-bold font-mono text-slate-650">{log.url}</td>
                          <td className="py-3 text-center">
                            <span className="inline-block bg-rose-50 text-rose-600 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full border border-rose-100">
                              {log.visits} lượt xem
                            </span>
                          </td>
                          <td className="py-3 text-center text-slate-400 font-mono text-[9.5px]">
                            {isMounted ? `${new Date(log.updatedAt).toLocaleDateString('vi-VN')} ${new Date(log.updatedAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}` : '...'}
                          </td>
                          <td className="py-3 text-right space-x-1.5">
                            <button 
                              type="button" 
                              onClick={() => {
                                setRedirectSourceUrl(log.url);
                                setIsRedirectModalOpen(true);
                              }} 
                              className="text-brand-600 hover:text-brand-700 font-extrabold bg-brand-50 border border-brand-100 hover:bg-brand-100/70 px-2 py-1 rounded text-[8.5px] cursor-pointer transition-all inline-flex items-center gap-1"
                              title="Tạo chuyển hướng 301 cho URL lỗi này"
                            >
                              <Link2 size={11} /> Chuyển hướng
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDelete404Log(log.id)} 
                              className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer inline-block align-middle"
                              title="Xóa"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Redirect Conversion Modal */}
            {isRedirectModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 w-[450px] shadow-2xl relative animate-scaleUp">
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 size={15} className="text-brand-500" /> Sửa lỗi 404 bằng Chuyển hướng 301
                    </h4>
                    <p className="text-[9.5px] text-slate-400 font-semibold mt-1">Cấu hình URL thay thế cho link bị hỏng để giữ chân người dùng.</p>
                  </div>

                  <form onSubmit={handleCreateRedirectFrom404} className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Đường dẫn lỗi (Old URL)</span>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-650 font-bold font-mono text-xs overflow-hidden text-ellipsis">
                        {redirectSourceUrl}
                      </div>
                    </div>
                    <label className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-600">
                      Đường dẫn mới (Redirect Target URL) *
                      <input 
                        type="text" 
                        value={redirectTargetUrl} 
                        onChange={(e) => setRedirectTargetUrl(e.target.value)} 
                        placeholder="/blog/bai-viet-dung-dan" 
                        required
                        className="px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:border-brand-500 text-xs text-slate-700 font-bold"
                      />
                    </label>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsRedirectModalOpen(false);
                          setRedirectSourceUrl('');
                          setRedirectTargetUrl('');
                        }} 
                        className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold text-slate-600 text-[10px] cursor-pointer transition-colors"
                      >
                        Hủy
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg font-bold text-white text-[10px] cursor-pointer active:translate-y-0.5 shadow-sm transition-all border-none"
                      >
                        Xác nhận & Lưu
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: WEBMASTER TOOLS */}
        {activeTab === 'webmaster' && (
          <div className="space-y-6 max-w-3xl">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Layout size={16} className="text-brand-500" /> Công cụ quản trị trang Web (Webmaster & Analytics)
              </h3>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-2xl mt-1">
                Quản lý các đoạn mã theo dõi và xác minh quyền sở hữu trang web của bạn đối với Google Search Console, Google Analytics, Google Tag Manager và các công cụ tìm kiếm khác.
              </p>
            </div>

            {/* GROUP 1: CORE GOOGLE TOOLS (Quan trọng nhất) */}
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-brand-600 uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={11} className="animate-pulse" /> Các công cụ cốt lõi từ Google (Quan trọng nhất)
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Google Search Console */}
                <div className="bg-brand-50/20 border border-slate-200/70 rounded-xl p-4.5 space-y-3.5 hover:shadow-sm transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs tracking-wide">Google Search Console</span>
                      <span className={`inline-flex items-center gap-1 text-[8.5px] font-bold px-2 py-0.5 rounded-full ${
                        !googleVerification 
                          ? 'bg-rose-50 text-rose-500 border border-rose-100' 
                          : googleVerified 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-500 border border-amber-150 animate-pulse'
                      }`}>
                        {!googleVerification ? '❌ Chưa cấu hình' : googleVerified ? '✅ Đã xác minh' : '⚠️ Chưa xác minh'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[9.5px]">
                      <a 
                        href="https://support.google.com/webmasters/answer/9008080" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-450 hover:text-brand-600 font-bold inline-flex items-center gap-0.5"
                      >
                        📖 Hướng dẫn lấy mã
                      </a>
                      <a 
                        href="https://search.google.com/search-console" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-450 hover:text-brand-600 font-bold inline-flex items-center gap-0.5"
                      >
                        🔗 Mở Search Console →
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex flex-col gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      Mã xác nhận (Verification Code)
                      <input 
                        type="text" 
                        placeholder="e9_x736J2hsB928HGsja-71286"
                        value={googleVerification}
                        onChange={(e) => {
                          setGoogleVerification(e.target.value);
                          if (e.target.value !== (originalSettingsRef.current?.seo_google_verification || '')) {
                            setGoogleVerified(false);
                          }
                        }}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none font-mono text-slate-700 bg-white font-semibold shadow-sm"
                      />
                    </label>

                    {googleVerification && (
                      <button
                        type="button"
                        disabled={isVerifyingMap['google']}
                        onClick={() => handleVerifyTool('google', googleVerification)}
                        className="w-full py-1.5 mt-1 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg border-none cursor-pointer hover:shadow-sm active:translate-y-0.25 disabled:opacity-60 transition-all flex items-center justify-center gap-1"
                      >
                        {isVerifyingMap['google'] ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Xác minh ngay'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Google Analytics */}
                <div className="bg-slate-50/40 border border-slate-200/70 rounded-xl p-4.5 space-y-3.5 hover:shadow-sm transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs tracking-wide">Google Analytics</span>
                      <span className={`inline-flex items-center gap-1 text-[8.5px] font-bold px-2 py-0.5 rounded-full ${
                        !googleAnalytics 
                          ? 'bg-rose-50 text-rose-500 border border-rose-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {!googleAnalytics ? '❌ Chưa cấu hình' : '✅ Đang hoạt động'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[9.5px]">
                      <a 
                        href="https://support.google.com/analytics/answer/9539598" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-450 hover:text-brand-600 font-bold inline-flex items-center gap-0.5"
                      >
                        📖 Hướng dẫn lấy mã
                      </a>
                      <a 
                        href="https://analytics.google.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-450 hover:text-brand-600 font-bold inline-flex items-center gap-0.5"
                      >
                        🔗 Mở Analytics →
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex flex-col gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      Mã đo lường (Measurement ID)
                      <input 
                        type="text" 
                        placeholder="G-XXXXXXXXXX hoặc UA-XXXXXX-X"
                        value={googleAnalytics}
                        onChange={(e) => setGoogleAnalytics(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none font-mono text-slate-700 bg-white font-semibold shadow-sm"
                      />
                    </label>
                  </div>
                </div>

                {/* Google Tag Manager */}
                <div className="bg-slate-50/40 border border-slate-200/70 rounded-xl p-4.5 space-y-3.5 hover:shadow-sm transition-all flex flex-col justify-between md:col-span-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs tracking-wide">Google Tag Manager</span>
                      <span className={`inline-flex items-center gap-1 text-[8.5px] font-bold px-2 py-0.5 rounded-full ${
                        !googleTagManager 
                          ? 'bg-rose-50 text-rose-500 border border-rose-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {!googleTagManager ? '❌ Chưa cấu hình' : '✅ Đang hoạt động'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[9.5px]">
                      <a 
                        href="https://support.google.com/tagmanager/answer/6103696" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-450 hover:text-brand-600 font-bold inline-flex items-center gap-0.5"
                      >
                        📖 Hướng dẫn lấy mã
                      </a>
                      <a 
                        href="https://tagmanager.google.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-450 hover:text-brand-600 font-bold inline-flex items-center gap-0.5"
                      >
                        🔗 Mở Tag Manager →
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex flex-col gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      Mã GTM Container ID
                      <input 
                        type="text" 
                        placeholder="GTM-XXXXXXX"
                        value={googleTagManager}
                        onChange={(e) => setGoogleTagManager(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none font-mono text-slate-700 bg-white font-semibold shadow-sm"
                      />
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* GROUP 2: OTHER WEBMASTERS (Bing, Yandex...) */}
            <div className="space-y-4 pt-2">
              <div className="text-[10px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
                <Globe size={11} /> Các công cụ tìm kiếm khác (Ít quan trọng hơn)
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Bing Webmaster Tools */}
                <div className="bg-slate-50/40 border border-slate-200/70 rounded-xl p-4.5 space-y-3.5 hover:shadow-sm transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs tracking-wide">Bing Webmaster</span>
                      <span className={`inline-flex items-center gap-1 text-[8.5px] font-bold px-2 py-0.5 rounded-full ${
                        !bingVerification 
                          ? 'bg-rose-50 text-rose-500 border border-rose-100' 
                          : bingVerified 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-500 border border-amber-150 animate-pulse'
                      }`}>
                        {!bingVerification ? '❌ Chưa cấu hình' : bingVerified ? '✅ Đã xác minh' : '⚠️ Chưa xác minh'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[9.5px]">
                      <a 
                        href="https://www.bing.com/webmaster/help/how-to-add-and-verify-a-site-2062c3e1" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-450 hover:text-brand-600 font-bold inline-flex items-center gap-0.5"
                      >
                        📖 Hướng dẫn lấy mã
                      </a>
                      <a 
                        href="https://www.bing.com/webmasters" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-450 hover:text-brand-600 font-bold inline-flex items-center gap-0.5"
                      >
                        🔗 Mở Bing Console →
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex flex-col gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      Mã xác nhận Bing (msvalidate.01)
                      <input 
                        type="text" 
                        placeholder="Mã số trong msvalidate.01"
                        value={bingVerification}
                        onChange={(e) => {
                          setBingVerification(e.target.value);
                          if (e.target.value !== (originalSettingsRef.current?.seo_bing_verification || '')) {
                            setBingVerified(false);
                          }
                        }}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none font-mono text-slate-700 bg-white font-semibold shadow-sm"
                      />
                    </label>

                    {bingVerification && (
                      <button
                        type="button"
                        disabled={isVerifyingMap['bing']}
                        onClick={() => handleVerifyTool('bing', bingVerification)}
                        className="w-full py-1.5 mt-1 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg border-none cursor-pointer hover:shadow-sm active:translate-y-0.25 disabled:opacity-60 transition-all flex items-center justify-center gap-1"
                      >
                        {isVerifyingMap['bing'] ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Xác minh ngay'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Yandex Webmaster */}
                <div className="bg-slate-50/40 border border-slate-200/70 rounded-xl p-4.5 space-y-3.5 hover:shadow-sm transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs tracking-wide">Yandex Webmaster</span>
                      <span className={`inline-flex items-center gap-1 text-[8.5px] font-bold px-2 py-0.5 rounded-full ${
                        !yandexVerification 
                          ? 'bg-rose-50 text-rose-500 border border-rose-100' 
                          : yandexVerified 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-500 border border-amber-150 animate-pulse'
                      }`}>
                        {!yandexVerification ? '❌ Chưa cấu hình' : yandexVerified ? '✅ Đã xác minh' : '⚠️ Chưa xác minh'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[9.5px]">
                      <a 
                        href="https://yandex.com/support/webmaster/service/rights.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-450 hover:text-brand-600 font-bold inline-flex items-center gap-0.5"
                      >
                        📖 Hướng dẫn lấy mã
                      </a>
                      <a 
                        href="https://webmaster.yandex.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-450 hover:text-brand-600 font-bold inline-flex items-center gap-0.5"
                      >
                        🔗 Mở Yandex Console →
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex flex-col gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      Mã xác nhận Yandex
                      <input 
                        type="text" 
                        placeholder="Mã yandex-verification"
                        value={yandexVerification}
                        onChange={(e) => {
                          setYandexVerification(e.target.value);
                          if (e.target.value !== (originalSettingsRef.current?.seo_yandex_verification || '')) {
                            setYandexVerified(false);
                          }
                        }}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none font-mono text-slate-700 bg-white font-semibold shadow-sm"
                      />
                    </label>

                    {yandexVerification && (
                      <button
                        type="button"
                        disabled={isVerifyingMap['yandex']}
                        onClick={() => handleVerifyTool('yandex', yandexVerification)}
                        className="w-full py-1.5 mt-1 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg border-none cursor-pointer hover:shadow-sm active:translate-y-0.25 disabled:opacity-60 transition-all flex items-center justify-center gap-1"
                      >
                        {isVerifyingMap['yandex'] ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Xác minh ngay'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SCHEMA.ORG */}
        {activeTab === 'schema' && (
          <div className="space-y-6 max-w-3xl">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <User size={16} className="text-brand-500" /> Schema & Social Graph
            </h3>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-2xl">
              Cấu hình thực thể thương hiệu, logo, mạng xã hội và ảnh chia sẻ mặc định để Google, Facebook/Zalo và AI crawler hiểu website nhất quán.
            </p>

            {/* Entity Type Selection */}
            <div className="grid grid-cols-3 items-center gap-4 pt-2">
              <label className="text-xs font-bold text-slate-700 text-right">Bạn đại diện cho</label>
              <div className="col-span-2 flex items-center gap-6 font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="schemaType"
                    value="organization"
                    checked={schemaType === 'organization'}
                    onChange={() => setSchemaType('organization')}
                    className="text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Tổ chức / Công ty (Organization)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="schemaType"
                    value="person"
                    checked={schemaType === 'person'}
                    onChange={() => setSchemaType('person')}
                    className="text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Cá nhân sở hữu (Person)</span>
                </label>
              </div>
            </div>

            {/* Schema Name */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-xs font-bold text-slate-700 text-right">
                {schemaType === 'organization' ? 'Tên Tổ chức' : 'Tên Cá nhân'}
              </label>
              <input
                type="text"
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-semibold"
                required
              />
            </div>

            {schemaType === 'organization' && (
              <>
                {/* Alt Name */}
                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-xs font-bold text-slate-700 text-right">Tên tổ chức thay thế</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Lexi Logistics"
                    value={schemaAltName}
                    onChange={(e) => setSchemaAltName(e.target.value)}
                    className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-semibold"
                  />
                </div>

                {/* Legal Name */}
                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-xs font-bold text-slate-700 text-right">Tên pháp lý của tổ chức</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Công ty TNHH Vận Tải Lexi Việt Nam"
                    value={schemaLegalName}
                    onChange={(e) => setSchemaLegalName(e.target.value)}
                    className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-semibold"
                  />
                </div>
              </>
            )}

            {/* Schema Logo Selector */}
            <div className="grid grid-cols-3 items-start gap-4">
              <div className="text-right mt-2">
                <label className="text-xs font-bold text-slate-700 block">Logo hoặc Ảnh đại diện</label>
              </div>
              <div className="col-span-2 flex items-center gap-4">
                {schemaLogo ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group shrink-0 shadow-sm">
                    <img 
                      src={schemaLogo} 
                      alt="Schema Logo" 
                      className="h-16 w-32 object-contain p-1"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button 
                        type="button"
                        onClick={() => { setMediaTarget('logo'); setIsMediaOpen(true); }}
                        className="p-1 bg-white hover:bg-slate-100 rounded text-[9px] font-bold text-slate-800 transition-colors cursor-pointer border-none"
                      >
                        Sửa
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSchemaLogo('')}
                        className="p-1 bg-red-600 hover:bg-red-700 rounded text-[9px] font-bold text-white transition-colors cursor-pointer border-none"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => { setMediaTarget('logo'); setIsMediaOpen(true); }}
                    className="h-16 w-32 border-2 border-dashed border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50/10 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-brand-600 transition-all cursor-pointer outline-none shrink-0"
                  >
                    <ImageIcon size={18} className="opacity-75" />
                    <span className="text-[9px] font-bold">Chọn Ảnh</span>
                  </button>
                )}
                <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Chọn ảnh vuông hoặc logo chữ nhật để Google hiển thị đại diện thương hiệu trong biểu đồ tri thức tìm kiếm.
                </div>
              </div>
            </div>

            {schemaType === 'organization' && (
              <div className="border-t border-slate-100/60 pt-5 space-y-6">
                <div className="text-slate-500 font-bold uppercase text-[9px] tracking-wider mb-2">Thông tin tổ chức bổ sung</div>

                {/* Description */}
                <div className="grid grid-cols-3 items-start gap-4">
                  <label className="text-xs font-bold text-slate-700 text-right mt-2">Mô tả tổ chức</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả tóm tắt về hoạt động của tổ chức..."
                    value={schemaDescription}
                    onChange={(e) => setSchemaDescription(e.target.value)}
                    className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-semibold text-xs leading-relaxed resize-none"
                  />
                </div>

                {/* Email */}
                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-xs font-bold text-slate-700 text-right">Địa chỉ email của tổ chức</label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={schemaEmail}
                    onChange={(e) => setSchemaEmail(e.target.value)}
                    className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-semibold"
                  />
                </div>

                {/* Phone */}
                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-xs font-bold text-slate-700 text-right">Số điện thoại của tổ chức</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 0968123456"
                    value={schemaPhone}
                    onChange={(e) => setSchemaPhone(e.target.value)}
                    className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-semibold"
                  />
                </div>

                {/* Founding Date */}
                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-xs font-bold text-slate-700 text-right">Ngày thành lập tổ chức</label>
                  <input
                    type="date"
                    value={schemaFoundingDate}
                    onChange={(e) => setSchemaFoundingDate(e.target.value)}
                    className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-semibold"
                  />
                </div>

                {/* Tax ID */}
                <div className="grid grid-cols-3 items-center gap-4">
                  <label className="text-xs font-bold text-slate-700 text-right">Mã số thuế / Mã doanh nghiệp</label>
                  <input
                    type="text"
                    placeholder="Mã số đăng ký kinh doanh..."
                    value={schemaTaxId}
                    onChange={(e) => setSchemaTaxId(e.target.value)}
                    className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Social & sameAs Section - merged into Schema */}
            <div className="border-t border-slate-100/60 pt-5 space-y-6 mt-4">
              <div className="text-slate-500 font-bold uppercase text-[9px] tracking-wider mb-2">Mạng xã hội & Hình ảnh chia sẻ (sameAs)</div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-2xl -mt-3">
                Các liên kết mạng xã hội sẽ tự động được đưa vào thuộc tính <code className="bg-slate-100 px-1 py-0.5 rounded text-[9px] font-mono text-brand-600">sameAs</code> của Schema JSON-LD.
              </p>

              {/* Facebook Page URL */}
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-slate-700 text-right">Đường dẫn trang Facebook</label>
                <input
                  type="url"
                  placeholder="https://facebook.com/trang-cua-ban"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-semibold"
                />
              </div>

              {/* X / Twitter URL */}
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-slate-700 text-right">Đường dẫn X (Twitter)</label>
                <input
                  type="url"
                  placeholder="https://x.com/ten-cua-ban"
                  value={schemaXUrl}
                  onChange={(e) => setSchemaXUrl(e.target.value)}
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-semibold"
                />
              </div>

              {/* Instagram Page URL */}
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-slate-700 text-right">Đường dẫn Instagram</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/ten-cua-ban"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-semibold"
                />
              </div>

              {/* Zalo Link */}
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-slate-700 text-right">Liên kết Zalo (OA hoặc Cá nhân)</label>
                <input
                  type="text"
                  placeholder="https://zalo.me/0968123456"
                  value={zaloUrl}
                  onChange={(e) => setZaloUrl(e.target.value)}
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-500 outline-none text-slate-700 bg-white font-semibold"
                />
              </div>

              {/* Default Social Share Image */}
              <div className="grid grid-cols-3 items-start gap-4 border-t border-slate-100/60 pt-5">
                <div className="text-right mt-2">
                  <label className="text-xs font-bold text-slate-700 block">Hình ảnh chia sẻ mặc định</label>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Open Graph image.</p>
                </div>
                <div className="col-span-2 flex items-center gap-4">
                  {defaultOgImage ? (
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group shrink-0 shadow-sm">
                      <img 
                        src={defaultOgImage} 
                        alt="Default OG Share" 
                        className="h-16 w-32 object-cover p-1"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button 
                          type="button"
                          onClick={() => { setMediaTarget('social'); setIsMediaOpen(true); }}
                          className="p-1 bg-white hover:bg-slate-100 rounded text-[9px] font-bold text-slate-800 transition-colors cursor-pointer border-none"
                        >
                          Sửa
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDefaultOgImage('')}
                          className="p-1 bg-red-600 hover:bg-red-700 rounded text-[9px] font-bold text-white transition-colors cursor-pointer border-none"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => { setMediaTarget('social'); setIsMediaOpen(true); }}
                      className="h-16 w-32 border-2 border-dashed border-slate-200 rounded-lg hover:border-brand-500 hover:bg-brand-50/10 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-brand-600 transition-all cursor-pointer outline-none shrink-0"
                    >
                      <ImageIcon size={18} className="opacity-75" />
                      <span className="text-[9px] font-bold">Chọn Ảnh</span>
                    </button>
                  )}
                  <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Hình ảnh này sẽ tự động được sử dụng làm ảnh đại diện khi bài viết hoặc trang tĩnh được chia sẻ trên Facebook, Zalo, LinkedIn nếu bài viết đó không có ảnh tiêu biểu riêng. Khuyến nghị tỷ lệ 1.91:1 (Ví dụ: 1200x630px).
                  </div>
                </div>
              </div>
            </div>

            {/* Live Code Preview Block */}
            <div className="border-t border-slate-100/80 pt-6 mt-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Xem trước mã JSON-LD Schema (Live Preview)</h4>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Mã dữ liệu cấu trúc này sẽ tự động được đồng bộ và nhúng vào phần đầu của website.</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-bold border border-emerald-200 select-none animate-pulse">
                  ĐỒNG BỘ TRỰC TIẾP
                </span>
              </div>
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-950 shadow-inner relative overflow-hidden font-mono text-[9px] text-emerald-400 max-h-[300px] overflow-y-auto select-all leading-normal whitespace-pre-wrap">
                {liveJsonLdString}
              </div>
            </div>
          </div>
        )}

      </div>
      </div>

      <MediaModal
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        onSelect={handleSelectMedia}
      />
    </div>
  );
}
