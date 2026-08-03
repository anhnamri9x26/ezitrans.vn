import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hooks, HOOK_NAMES } from '@/lib/hooks';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { getHydratedNavigation } from '@/lib/navigation/service';
import { hydrateSettingsWithNavigation } from '@/lib/navigation/settings';
import { normalizeSiteUrl } from '@/lib/site-identity';

function validateTrackingValue(label: string, rawValue: unknown, pattern: RegExp) {
  const value = String(rawValue ?? '').trim();
  if (!value) return '';
  if (!pattern.test(value)) {
    throw new Error(`${label}: mã cấu hình không đúng định dạng`);
  }
  return label === 'Ahrefs Analytics' ? value : value.toUpperCase();
}

export async function GET(req: Request) {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});
    
    // Fallback default_category_id if not present
    if (!settingsMap['default_category_id']) {
      let defaultCat = await prisma.category.findUnique({
        where: { slug: 'chua-phan-loai' }
      });
      if (!defaultCat) {
        defaultCat = await prisma.category.create({
          data: {
            name: 'Chưa phân loại',
            slug: 'chua-phan-loai',
            description: 'Danh mục mặc định'
          }
        });
      }
      
      // Save default_category_id in DB setting table
      await prisma.setting.upsert({
        where: { key: 'default_category_id' },
        update: { value: String(defaultCat.id) },
        create: { key: 'default_category_id', value: String(defaultCat.id) }
      });

      settingsMap['default_category_id'] = String(defaultCat.id);
    }

    // Fallback plugin_seo_enabled if not present
    if (!settingsMap['plugin_seo_enabled']) {
      await prisma.setting.upsert({
        where: { key: 'plugin_seo_enabled' },
        update: { value: 'true' },
        create: { key: 'plugin_seo_enabled', value: 'true' }
      });
      settingsMap['plugin_seo_enabled'] = 'true';
    }

    // Discussion / Comment & Permalink default configurations
    const defaultCommentSettings: { [key: string]: string } = {
      comment_global_enabled: 'true',
      comment_require_name_email: 'true',
      comment_require_login: 'false',
      comment_cookie_optin: 'true',
      comment_thread_comments: 'true',
      comment_thread_depth: '5',
      comment_moderation_manually: 'true',
      comment_previously_approved: 'true',
      comment_pagination: 'false',
      comment_per_page: '50',
      comment_order: 'asc',
      permalink_structure: '/%postname%.html',
      permalink_category_base: 'category',
      permalink_tag_base: 'tag',
      permalink_product_base: '/san-pham/',
      permalink_product_category_base: 'danh-muc-san-pham',
      site_language: 'vi',
      date_format: 'j F, Y',
      date_format_custom: '',
      time_format: 'g:i a',
      time_format_custom: '',
      start_of_week: '1',
      site_logo: '',
      site_logo_id: '',
      site_favicon: '',
      site_favicon_id: '',
      // Plugins Activation settings
      plugin_email_smtp_enabled: 'true',
      plugin_lexi_page_builder_enabled: settingsMap['plugin_grapesjs_enabled'] ?? 'true',
      // Member registration settings
      allow_user_registration: 'true',
      default_registration_role: 'SUBSCRIBER',
      registration_require_email_verify: 'true',
      // Theme, Menu & Footer Settings
      active_theme: 'default',
      theme_menu_header: '[{"id":"1","label":"TRANG CHỦ","url":"/","indent":0},{"id":"2","label":"GIỚI THIỆU","url":"/gioi-thieu","indent":0},{"id":"3","label":"MUA HỘ","url":"/category/mua-ho-thanh-toan-ho","indent":0},{"id":"4","label":"SHIP HỘ","url":"/category/chuyen-hang-tu-nuoc-ngoai-ve","indent":0},{"id":"5","label":"XUẤT KHẨU","url":"/category/xuat-khau","indent":0},{"id":"6","label":"DỊCH VỤ KHÁC","url":"/category/dich-vu-khac","indent":0},{"id":"7","label":"CHIA SẺ KINH NGHIỆM","url":"/category/huong-dan-chia-se","indent":0},{"id":"8","label":"LIÊN HỆ","url":"/lien-he","indent":0}]',
      theme_menu_footer: '[{"label":"Trang chủ","url":"/"},{"label":"Giới thiệu","url":"/gioi-thieu"},{"label":"Mua hộ","url":"/category/mua-ho-thanh-toan-ho"},{"label":"Ship hộ","url":"/category/chuyen-hang-tu-nuoc-ngoai-ve"},{"label":"Liên hệ","url":"/lien-he"}]',
      footer_copyright: '',
      footer_about_text: '',
      footer_phone: '',
      footer_email: '',
      footer_address: '',
      // SMTP & Email Notification Settings
      mail_from_email: '',
      mail_from_name: '',
      mail_force_from_email: 'false',
      mail_smtp_host: '',
      mail_smtp_port: '465',
      mail_smtp_encryption: 'ssl',
      mail_smtp_auth: 'true',
      mail_smtp_username: '',
      mail_smtp_password: '',
      email_notify_admin_comment: 'true',
      email_notify_admin_user: 'true',
      email_notify_user_approved: 'true',
      email_notify_user_reply: 'true',
      // Contact & Floating Buttons Settings
      plugin_contact_enabled: 'true',
      contact_hotline_1: '',
      contact_hotline_1_color: '#ef4444',
      contact_hotline_2: '',
      contact_hotline_2_color: '#ef4444',
      contact_hotline_3: '',
      contact_hotline_3_color: '#ef4444',
      contact_hotline_bar: 'false',
      contact_zalo: '',
      contact_telegram: '',
      contact_instagram: '',
      contact_youtube: '',
      contact_tiktok: '',
      contact_facebook: '',
      contact_messenger: '',
      contact_whatsapp: '',
      contact_viber: '',
      contact_map: '',
      contact_map_color: '#10b981',
      contact_link: '',
      contact_link_color: '#3b82f6',
      contact_widget_config_v2: '',
      // Yoast SEO & Frontend settings
      seo_sitemap_enabled: 'true',
      seo_breadcrumbs_enabled: 'true',
      seo_breadcrumbs_separator: '»',
      seo_breadcrumbs_home: 'Trang chủ',
      seo_google_verification: '',
      seo_bing_verification: '',
      seo_yandex_verification: '',
      seo_google_analytics: '',
      seo_google_tag_manager: '',
      seo_ahrefs_analytics_key: '',
      seo_google_verified: 'false',
      seo_bing_verified: 'false',
      seo_yandex_verified: 'false',
      seo_schema_type: 'organization',
      seo_schema_name: '',
      seo_schema_logo: '',
      seo_facebook_url: '',
      seo_instagram_url: '',
      seo_zalo_url: '',
      seo_default_og_image: '',
      seo_schema_alt_name: '',
      seo_schema_x_url: '',
      seo_schema_description: '',
      seo_schema_email: '',
      seo_schema_phone: '',
      seo_schema_legal_name: '',
      seo_schema_founding_date: '',
      seo_schema_tax_id: '',
      seo_llms_txt_enabled: 'true',
      seo_llms_txt_mode: 'automatic',
      seo_llms_txt_about_id: '',
      seo_llms_txt_contact_id: '',
      seo_llms_txt_terms_id: '',
      seo_llms_txt_privacy_id: '',
      seo_llms_txt_shop_id: '',
      seo_robots_txt_enabled: 'true',
      seo_robots_disallow_paths: '/api/\n/login\n/admin/',
      seo_rss_enabled: 'true',
      seo_rss_include_services: 'true',
      seo_rss_limit: '20',
      seo_index_posts: 'true',
      seo_index_pages: 'true',
      seo_index_services: 'true',
      seo_index_categories: 'true',
      seo_index_tags: 'false',
      // Dynamic sitemap default settings
      seo_sitemap_posts: 'true',
      seo_sitemap_pages: 'true',
      seo_sitemap_services: 'true',
      seo_sitemap_categories: 'true',
      seo_sitemap_tags: 'false',
      // Granular level archives
      seo_index_posts_archive: 'true',
      seo_sitemap_posts_archive: 'true',
      seo_index_services_archive: 'true',
      seo_sitemap_services_archive: 'true',
      seo_index_author_archive: 'false',
      seo_sitemap_author_archive: 'false',
      seo_index_date_archive: 'false',
      seo_sitemap_date_archive: 'false',
      seo_index_search_archive: 'false',
      seo_sitemap_search_archive: 'false',
      seo_robots_max_snippet: '-1',
      seo_robots_max_image_preview: 'large',
      seo_robots_max_video_preview: '-1',
      posts_per_page: '10',
      // Meta Templates settings
      seo_meta_title_post: '%title% %sep% %sitename%',
      seo_meta_desc_post: '%excerpt%',
      seo_meta_title_page: '%title% %sep% %sitename%',
      seo_meta_desc_page: '%excerpt%',
      seo_meta_title_service: '%title% %sep% %sitename%',
      seo_meta_desc_service: '%excerpt%',
      seo_meta_title_category: '%term% %sep% %sitename%',
      seo_meta_desc_category: 'Xem toàn bộ bài viết chuyên mục %term% tại %sitename%.',
      seo_meta_title_tag: '%term% %sep% %sitename%',
      seo_meta_desc_tag: 'Bài viết được gắn thẻ %term% trên %sitename%.',
      seo_meta_title_home: '%sitename% %sep% %tagline%',
      seo_meta_desc_home: '',
      seo_meta_separator: '|'
    };

    for (const [key, value] of Object.entries(defaultCommentSettings)) {
      if (!settingsMap[key]) {
        await prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
        settingsMap[key] = value;
      }
    }


    // Fetch actual counts dynamically from the DB ONLY if requested
    const url = new URL(req.url);
    const includeCounts = url.searchParams.get('counts') === 'true';
    let counts = undefined;

    if (includeCounts) {
      const [postsCount, pagesCount, servicesCount, categoriesCount, tagsCount] = await Promise.all([
        prisma.post.count({ where: { status: 'PUBLISHED', type: 'POST' } }),
        prisma.post.count({ where: { status: 'PUBLISHED', type: 'PAGE' } }),
        prisma.post.count({ where: { status: 'PUBLISHED', type: 'SERVICE' } }),
        prisma.category.count(),
        prisma.tag.count()
      ]);
      counts = {
        posts: postsCount,
        pages: pagesCount,
        services: servicesCount,
        categories: categoriesCount,
        tags: tagsCount
      };
    }

    const navigation = await getHydratedNavigation(settingsMap.active_theme || 'default');
    const hydratedSettings = hydrateSettingsWithNavigation(settingsMap, navigation);

    return NextResponse.json({ 
      success: true, 
      settings: hydratedSettings,
      counts
    });
  } catch (error: any) {
    console.error('Error getting settings:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'manage_settings');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý cài đặt hệ thống' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      default_category_id, 
      site_title,
      site_tagline,
      site_url,
      site_email,
      site_phone,
      site_address,
      plugin_seo_enabled,
      comment_global_enabled,
      comment_require_name_email,
      comment_require_login,
      comment_cookie_optin,
      comment_thread_comments,
      comment_thread_depth,
      comment_moderation_manually,
      comment_previously_approved,
      comment_pagination,
      comment_per_page,
      comment_order,
      permalink_structure,
      permalink_category_base,
      permalink_tag_base,
      permalink_product_base,
      permalink_product_category_base,
      site_language,
      date_format,
      date_format_custom,
      time_format,
      time_format_custom,
      start_of_week,
      site_logo,
      site_logo_id,
      site_favicon,
      site_favicon_id,
      plugin_email_smtp_enabled,
      plugin_lexi_page_builder_enabled,
      plugin_grapesjs_enabled,
      // Theme, Menu & Footer Settings
      active_theme,
      theme_menu_header,
      theme_menu_footer,
      footer_copyright,
      footer_about_text,
      footer_phone,
      footer_email,
      footer_address,
      // SMTP & Email Notification Settings
      mail_from_email,
      mail_from_name,
      mail_force_from_email,
      mail_smtp_host,
      mail_smtp_port,
      mail_smtp_encryption,
      mail_smtp_auth,
      mail_smtp_username,
      mail_smtp_password,
      email_notify_admin_comment,
      email_notify_admin_user,
      email_notify_user_approved,
      email_notify_user_reply,
      // Contact Settings
      plugin_contact_enabled,
      contact_hotline_1,
      contact_hotline_1_color,
      contact_hotline_2,
      contact_hotline_2_color,
      contact_hotline_3,
      contact_hotline_3_color,
      contact_hotline_bar,
      contact_zalo,
      contact_telegram,
      contact_instagram,
      contact_youtube,
      contact_tiktok,
      contact_facebook,
      contact_messenger,
      contact_whatsapp,
      contact_viber,
      contact_map,
      contact_map_color,
      contact_link,
      contact_link_color,
      contact_widget_config_v2,
      // Yoast SEO & Frontend Settings
      seo_sitemap_enabled,
      seo_breadcrumbs_enabled,
      seo_breadcrumbs_separator,
      seo_breadcrumbs_home,
      seo_google_verification,
      seo_bing_verification,
      seo_yandex_verification,
      seo_google_analytics,
      seo_google_tag_manager,
      seo_ahrefs_analytics_key,
      seo_google_verified,
      seo_bing_verified,
      seo_yandex_verified,
      seo_schema_type,
      seo_schema_name,
      seo_schema_logo,
      seo_facebook_url,
      seo_instagram_url,
      seo_zalo_url,
      seo_default_og_image,
      seo_schema_alt_name,
      seo_schema_x_url,
      seo_schema_description,
      seo_schema_email,
      seo_schema_phone,
      seo_schema_legal_name,
      seo_schema_founding_date,
      seo_schema_tax_id,
      seo_llms_txt_enabled,
      seo_llms_txt_mode,
      seo_llms_txt_about_id,
      seo_llms_txt_contact_id,
      seo_llms_txt_terms_id,
      seo_llms_txt_privacy_id,
      seo_llms_txt_shop_id,
      seo_robots_txt_enabled,
      seo_robots_disallow_paths,
      seo_rss_enabled,
      seo_rss_include_services,
      seo_rss_limit,
      seo_index_posts,
      seo_index_pages,
      seo_index_services,
      seo_index_categories,
      seo_index_tags,
      // New granular sitemap and archives destructuring
      seo_sitemap_posts,
      seo_sitemap_pages,
      seo_sitemap_services,
      seo_sitemap_categories,
      seo_sitemap_tags,
      seo_index_posts_archive,
      seo_sitemap_posts_archive,
      seo_index_services_archive,
      seo_sitemap_services_archive,
      seo_index_author_archive,
      seo_sitemap_author_archive,
      seo_index_date_archive,
      seo_sitemap_date_archive,
      seo_index_search_archive,
      seo_sitemap_search_archive,
      seo_robots_max_snippet,
      seo_robots_max_image_preview,
      seo_robots_max_video_preview,
      posts_per_page,
      seo_canonical_mode,
      seo_canonical_custom_domain,
      seo_robots_mode,
      // Meta Templates
      seo_meta_title_post,
      seo_meta_desc_post,
      seo_meta_title_page,
      seo_meta_desc_page,
      seo_meta_title_service,
      seo_meta_desc_service,
      seo_meta_title_category,
      seo_meta_desc_category,
      seo_meta_title_tag,
      seo_meta_desc_tag,
      seo_meta_title_home,
      seo_meta_desc_home,
      seo_meta_separator,
      // Member registration settings
      allow_user_registration,
      default_registration_role,
      registration_require_email_verify
    } = body;

    if (site_url !== undefined && !normalizeSiteUrl(String(site_url))) {
      return NextResponse.json({ success: false, error: 'URL website không đúng định dạng HTTP/HTTPS.' }, { status: 400 });
    }
    if (site_email !== undefined && String(site_email).trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(site_email).trim())) {
      return NextResponse.json({ success: false, error: 'Email website không đúng định dạng.' }, { status: 400 });
    }
    if (site_phone !== undefined && String(site_phone).trim() && !/^[+\d][\d\s().-]{5,24}$/.test(String(site_phone).trim())) {
      return NextResponse.json({ success: false, error: 'Số điện thoại không đúng định dạng.' }, { status: 400 });
    }

    const dataToSave = {
      allow_user_registration: allow_user_registration !== undefined ? String(allow_user_registration) : undefined,
      default_registration_role: default_registration_role !== undefined ? String(default_registration_role) : undefined,
      registration_require_email_verify: registration_require_email_verify !== undefined ? String(registration_require_email_verify) : undefined,
      default_category_id: default_category_id ? String(default_category_id) : undefined,
      site_title,
      site_tagline,
      site_url: site_url !== undefined ? String(site_url).trim().replace(/\/+$/, '') : undefined,
      site_email: site_email !== undefined ? String(site_email).trim().toLowerCase() : undefined,
      site_phone: site_phone !== undefined ? String(site_phone).trim() : undefined,
      site_address: site_address !== undefined ? String(site_address).trim() : undefined,
      footer_email: site_email !== undefined ? String(site_email).trim().toLowerCase() : footer_email !== undefined ? String(footer_email) : undefined,
      footer_phone: site_phone !== undefined ? String(site_phone).trim() : footer_phone !== undefined ? String(footer_phone) : undefined,
      footer_address: site_address !== undefined ? String(site_address).trim() : footer_address !== undefined ? String(footer_address) : undefined,
      plugin_seo_enabled: plugin_seo_enabled !== undefined ? String(plugin_seo_enabled) : undefined,
      comment_global_enabled: comment_global_enabled !== undefined ? String(comment_global_enabled) : undefined,
      comment_require_name_email: comment_require_name_email !== undefined ? String(comment_require_name_email) : undefined,
      comment_require_login: comment_require_login !== undefined ? String(comment_require_login) : undefined,
      comment_cookie_optin: comment_cookie_optin !== undefined ? String(comment_cookie_optin) : undefined,
      comment_thread_comments: comment_thread_comments !== undefined ? String(comment_thread_comments) : undefined,
      comment_thread_depth: comment_thread_depth !== undefined ? String(comment_thread_depth) : undefined,
      comment_moderation_manually: comment_moderation_manually !== undefined ? String(comment_moderation_manually) : undefined,
      comment_previously_approved: comment_previously_approved !== undefined ? String(comment_previously_approved) : undefined,
      comment_pagination: comment_pagination !== undefined ? String(comment_pagination) : undefined,
      comment_per_page: comment_per_page !== undefined ? String(comment_per_page) : undefined,
      comment_order: comment_order !== undefined ? String(comment_order) : undefined,
      permalink_structure: permalink_structure !== undefined ? String(permalink_structure) : undefined,
      permalink_category_base: permalink_category_base !== undefined ? String(permalink_category_base) : undefined,
      permalink_tag_base: permalink_tag_base !== undefined ? String(permalink_tag_base) : undefined,
      permalink_product_base: permalink_product_base !== undefined ? String(permalink_product_base) : undefined,
      permalink_product_category_base: permalink_product_category_base !== undefined ? String(permalink_product_category_base) : undefined,
      site_language: site_language !== undefined ? String(site_language) : undefined,
      date_format: date_format !== undefined ? String(date_format) : undefined,
      date_format_custom: date_format_custom !== undefined ? String(date_format_custom) : undefined,
      time_format: time_format !== undefined ? String(time_format) : undefined,
      time_format_custom: time_format_custom !== undefined ? String(time_format_custom) : undefined,
      start_of_week: start_of_week !== undefined ? String(start_of_week) : undefined,
      site_logo: site_logo !== undefined ? String(site_logo) : undefined,
      site_logo_id: site_logo_id !== undefined ? String(site_logo_id) : undefined,
      site_favicon: site_favicon !== undefined ? String(site_favicon) : undefined,
      site_favicon_id: site_favicon_id !== undefined ? String(site_favicon_id) : undefined,
      plugin_email_smtp_enabled: plugin_email_smtp_enabled !== undefined ? String(plugin_email_smtp_enabled) : undefined,
      plugin_lexi_page_builder_enabled: plugin_lexi_page_builder_enabled !== undefined
        ? String(plugin_lexi_page_builder_enabled)
        : plugin_grapesjs_enabled !== undefined
          ? String(plugin_grapesjs_enabled)
          : undefined,
      // Theme, Menu & Footer Settings
      active_theme: active_theme !== undefined ? String(active_theme) : undefined,
      theme_menu_header: theme_menu_header !== undefined ? String(theme_menu_header) : undefined,
      theme_menu_footer: theme_menu_footer !== undefined ? String(theme_menu_footer) : undefined,
      footer_copyright: footer_copyright !== undefined ? String(footer_copyright) : undefined,
      footer_about_text: footer_about_text !== undefined ? String(footer_about_text) : undefined,
      // SMTP & Email Notification Settings
      mail_from_email: mail_from_email !== undefined ? String(mail_from_email) : undefined,
      mail_from_name: mail_from_name !== undefined ? String(mail_from_name) : undefined,
      mail_force_from_email: mail_force_from_email !== undefined ? String(mail_force_from_email) : undefined,
      mail_smtp_host: mail_smtp_host !== undefined ? String(mail_smtp_host) : undefined,
      mail_smtp_port: mail_smtp_port !== undefined ? String(mail_smtp_port) : undefined,
      mail_smtp_encryption: mail_smtp_encryption !== undefined ? String(mail_smtp_encryption) : undefined,
      mail_smtp_auth: mail_smtp_auth !== undefined ? String(mail_smtp_auth) : undefined,
      mail_smtp_username: mail_smtp_username !== undefined ? String(mail_smtp_username) : undefined,
      mail_smtp_password: mail_smtp_password !== undefined ? String(mail_smtp_password) : undefined,
      email_notify_admin_comment: email_notify_admin_comment !== undefined ? String(email_notify_admin_comment) : undefined,
      email_notify_admin_user: email_notify_admin_user !== undefined ? String(email_notify_admin_user) : undefined,
      email_notify_user_approved: email_notify_user_approved !== undefined ? String(email_notify_user_approved) : undefined,
      email_notify_user_reply: email_notify_user_reply !== undefined ? String(email_notify_user_reply) : undefined,
      // Contact Settings
      plugin_contact_enabled: plugin_contact_enabled !== undefined ? String(plugin_contact_enabled) : undefined,
      contact_hotline_1: contact_hotline_1 !== undefined ? String(contact_hotline_1) : undefined,
      contact_hotline_1_color: contact_hotline_1_color !== undefined ? String(contact_hotline_1_color) : undefined,
      contact_hotline_2: contact_hotline_2 !== undefined ? String(contact_hotline_2) : undefined,
      contact_hotline_2_color: contact_hotline_2_color !== undefined ? String(contact_hotline_2_color) : undefined,
      contact_hotline_3: contact_hotline_3 !== undefined ? String(contact_hotline_3) : undefined,
      contact_hotline_3_color: contact_hotline_3_color !== undefined ? String(contact_hotline_3_color) : undefined,
      contact_hotline_bar: contact_hotline_bar !== undefined ? String(contact_hotline_bar) : undefined,
      contact_zalo: contact_zalo !== undefined ? String(contact_zalo) : undefined,
      contact_telegram: contact_telegram !== undefined ? String(contact_telegram) : undefined,
      contact_instagram: contact_instagram !== undefined ? String(contact_instagram) : undefined,
      contact_youtube: contact_youtube !== undefined ? String(contact_youtube) : undefined,
      contact_tiktok: contact_tiktok !== undefined ? String(contact_tiktok) : undefined,
      contact_facebook: contact_facebook !== undefined ? String(contact_facebook) : undefined,
      contact_messenger: contact_messenger !== undefined ? String(contact_messenger) : undefined,
      contact_whatsapp: contact_whatsapp !== undefined ? String(contact_whatsapp) : undefined,
      contact_viber: contact_viber !== undefined ? String(contact_viber) : undefined,
      contact_map: contact_map !== undefined ? String(contact_map) : undefined,
      contact_map_color: contact_map_color !== undefined ? String(contact_map_color) : undefined,
      contact_link: contact_link !== undefined ? String(contact_link) : undefined,
      contact_link_color: contact_link_color !== undefined ? String(contact_link_color) : undefined,
      contact_widget_config_v2: contact_widget_config_v2 !== undefined ? String(contact_widget_config_v2) : undefined,
      // Yoast SEO & Frontend Settings
      seo_sitemap_enabled: seo_sitemap_enabled !== undefined ? String(seo_sitemap_enabled) : undefined,
      seo_breadcrumbs_enabled: seo_breadcrumbs_enabled !== undefined ? String(seo_breadcrumbs_enabled) : undefined,
      seo_breadcrumbs_separator: seo_breadcrumbs_separator !== undefined ? String(seo_breadcrumbs_separator) : undefined,
      seo_breadcrumbs_home: seo_breadcrumbs_home !== undefined ? String(seo_breadcrumbs_home) : undefined,
      seo_google_verification: seo_google_verification !== undefined ? String(seo_google_verification) : undefined,
      seo_bing_verification: seo_bing_verification !== undefined ? String(seo_bing_verification) : undefined,
      seo_yandex_verification: seo_yandex_verification !== undefined ? String(seo_yandex_verification) : undefined,
      seo_google_analytics: seo_google_analytics !== undefined ? validateTrackingValue('Google Analytics', seo_google_analytics, /^G-[A-Z0-9]+$/i) : undefined,
      seo_google_tag_manager: seo_google_tag_manager !== undefined ? validateTrackingValue('Google Tag Manager', seo_google_tag_manager, /^GTM-[A-Z0-9]+$/i) : undefined,
      seo_ahrefs_analytics_key: seo_ahrefs_analytics_key !== undefined ? validateTrackingValue('Ahrefs Analytics', seo_ahrefs_analytics_key, /^[A-Za-z0-9+/=_-]{8,128}$/) : undefined,
      seo_google_verified: seo_google_verified !== undefined ? String(seo_google_verified) : undefined,
      seo_bing_verified: seo_bing_verified !== undefined ? String(seo_bing_verified) : undefined,
      seo_yandex_verified: seo_yandex_verified !== undefined ? String(seo_yandex_verified) : undefined,
      seo_schema_type: seo_schema_type !== undefined ? String(seo_schema_type) : undefined,
      seo_schema_name: seo_schema_name !== undefined ? String(seo_schema_name) : undefined,
      seo_schema_logo: seo_schema_logo !== undefined ? String(seo_schema_logo) : undefined,
      seo_facebook_url: seo_facebook_url !== undefined ? String(seo_facebook_url) : undefined,
      seo_instagram_url: seo_instagram_url !== undefined ? String(seo_instagram_url) : undefined,
      seo_zalo_url: seo_zalo_url !== undefined ? String(seo_zalo_url) : undefined,
      seo_default_og_image: seo_default_og_image !== undefined ? String(seo_default_og_image) : undefined,
      seo_schema_alt_name: seo_schema_alt_name !== undefined ? String(seo_schema_alt_name) : undefined,
      seo_schema_x_url: seo_schema_x_url !== undefined ? String(seo_schema_x_url) : undefined,
      seo_schema_description: seo_schema_description !== undefined ? String(seo_schema_description) : undefined,
      seo_schema_email: seo_schema_email !== undefined ? String(seo_schema_email) : undefined,
      seo_schema_phone: seo_schema_phone !== undefined ? String(seo_schema_phone) : undefined,
      seo_schema_legal_name: seo_schema_legal_name !== undefined ? String(seo_schema_legal_name) : undefined,
      seo_schema_founding_date: seo_schema_founding_date !== undefined ? String(seo_schema_founding_date) : undefined,
      seo_schema_tax_id: seo_schema_tax_id !== undefined ? String(seo_schema_tax_id) : undefined,
      seo_llms_txt_enabled: seo_llms_txt_enabled !== undefined ? String(seo_llms_txt_enabled) : undefined,
      seo_llms_txt_mode: seo_llms_txt_mode !== undefined ? String(seo_llms_txt_mode) : undefined,
      seo_llms_txt_about_id: seo_llms_txt_about_id !== undefined ? String(seo_llms_txt_about_id) : undefined,
      seo_llms_txt_contact_id: seo_llms_txt_contact_id !== undefined ? String(seo_llms_txt_contact_id) : undefined,
      seo_llms_txt_terms_id: seo_llms_txt_terms_id !== undefined ? String(seo_llms_txt_terms_id) : undefined,
      seo_llms_txt_privacy_id: seo_llms_txt_privacy_id !== undefined ? String(seo_llms_txt_privacy_id) : undefined,
      seo_llms_txt_shop_id: seo_llms_txt_shop_id !== undefined ? String(seo_llms_txt_shop_id) : undefined,
      seo_robots_txt_enabled: seo_robots_txt_enabled !== undefined ? String(seo_robots_txt_enabled) : undefined,
      seo_robots_disallow_paths: seo_robots_disallow_paths !== undefined ? String(seo_robots_disallow_paths) : undefined,
      seo_rss_enabled: seo_rss_enabled !== undefined ? String(seo_rss_enabled) : undefined,
      seo_rss_include_services: seo_rss_include_services !== undefined ? String(seo_rss_include_services) : undefined,
      seo_rss_limit: seo_rss_limit !== undefined ? String(seo_rss_limit) : undefined,
      seo_index_posts: seo_index_posts !== undefined ? String(seo_index_posts) : undefined,
      seo_index_pages: seo_index_pages !== undefined ? String(seo_index_pages) : undefined,
      seo_index_services: seo_index_services !== undefined ? String(seo_index_services) : undefined,
      seo_index_categories: seo_index_categories !== undefined ? String(seo_index_categories) : undefined,
      seo_index_tags: seo_index_tags !== undefined ? String(seo_index_tags) : undefined,
      // New granular sitemap and archives mapping
      seo_sitemap_posts: seo_sitemap_posts !== undefined ? String(seo_sitemap_posts) : undefined,
      seo_sitemap_pages: seo_sitemap_pages !== undefined ? String(seo_sitemap_pages) : undefined,
      seo_sitemap_services: seo_sitemap_services !== undefined ? String(seo_sitemap_services) : undefined,
      seo_sitemap_categories: seo_sitemap_categories !== undefined ? String(seo_sitemap_categories) : undefined,
      seo_sitemap_tags: seo_sitemap_tags !== undefined ? String(seo_sitemap_tags) : undefined,
      seo_index_posts_archive: seo_index_posts_archive !== undefined ? String(seo_index_posts_archive) : undefined,
      seo_sitemap_posts_archive: seo_sitemap_posts_archive !== undefined ? String(seo_sitemap_posts_archive) : undefined,
      seo_index_services_archive: seo_index_services_archive !== undefined ? String(seo_index_services_archive) : undefined,
      seo_sitemap_services_archive: seo_sitemap_services_archive !== undefined ? String(seo_sitemap_services_archive) : undefined,
      seo_index_author_archive: seo_index_author_archive !== undefined ? String(seo_index_author_archive) : undefined,
      seo_sitemap_author_archive: seo_sitemap_author_archive !== undefined ? String(seo_sitemap_author_archive) : undefined,
      seo_index_date_archive: seo_index_date_archive !== undefined ? String(seo_index_date_archive) : undefined,
      seo_sitemap_date_archive: seo_sitemap_date_archive !== undefined ? String(seo_sitemap_date_archive) : undefined,
      seo_index_search_archive: seo_index_search_archive !== undefined ? String(seo_index_search_archive) : undefined,
      seo_sitemap_search_archive: seo_sitemap_search_archive !== undefined ? String(seo_sitemap_search_archive) : undefined,
      seo_robots_max_snippet: seo_robots_max_snippet !== undefined ? String(seo_robots_max_snippet) : undefined,
      seo_robots_max_image_preview: seo_robots_max_image_preview !== undefined ? String(seo_robots_max_image_preview) : undefined,
      seo_robots_max_video_preview: seo_robots_max_video_preview !== undefined ? String(seo_robots_max_video_preview) : undefined,
      posts_per_page: posts_per_page !== undefined ? String(posts_per_page) : undefined,
      seo_canonical_mode: seo_canonical_mode !== undefined ? String(seo_canonical_mode) : undefined,
      seo_canonical_custom_domain: seo_canonical_custom_domain !== undefined ? String(seo_canonical_custom_domain) : undefined,
      seo_robots_mode: seo_robots_mode !== undefined ? String(seo_robots_mode) : undefined,
      // Meta Templates
      seo_meta_title_post: seo_meta_title_post !== undefined ? String(seo_meta_title_post) : undefined,
      seo_meta_desc_post: seo_meta_desc_post !== undefined ? String(seo_meta_desc_post) : undefined,
      seo_meta_title_page: seo_meta_title_page !== undefined ? String(seo_meta_title_page) : undefined,
      seo_meta_desc_page: seo_meta_desc_page !== undefined ? String(seo_meta_desc_page) : undefined,
      seo_meta_title_service: seo_meta_title_service !== undefined ? String(seo_meta_title_service) : undefined,
      seo_meta_desc_service: seo_meta_desc_service !== undefined ? String(seo_meta_desc_service) : undefined,
      seo_meta_title_category: seo_meta_title_category !== undefined ? String(seo_meta_title_category) : undefined,
      seo_meta_desc_category: seo_meta_desc_category !== undefined ? String(seo_meta_desc_category) : undefined,
      seo_meta_title_tag: seo_meta_title_tag !== undefined ? String(seo_meta_title_tag) : undefined,
      seo_meta_desc_tag: seo_meta_desc_tag !== undefined ? String(seo_meta_desc_tag) : undefined,
      seo_meta_title_home: seo_meta_title_home !== undefined ? String(seo_meta_title_home) : undefined,
      seo_meta_desc_home: seo_meta_desc_home !== undefined ? String(seo_meta_desc_home) : undefined,
      seo_meta_separator: seo_meta_separator !== undefined ? String(seo_meta_separator) : undefined
    };

    for (const [key, value] of Object.entries(dataToSave)) {
      if (value !== undefined) {
        await prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      }
    }

    // Lưu trữ settings tùy biến từ các plugin (VD: Đa ngôn ngữ)
    if (body.customSettings && typeof body.customSettings === 'object') {
      for (const [key, value] of Object.entries(body.customSettings)) {
        if (value !== undefined) {
          await prisma.setting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) }
          });
        }
      }
    }

    // Hook: settings.beforeSave — thông báo plugins về thay đổi settings
    await hooks.doAction(HOOK_NAMES.SETTINGS_BEFORE_SAVE, dataToSave);

    return NextResponse.json({ success: true, message: 'Cập nhật cài đặt thành công!' });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
