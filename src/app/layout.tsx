import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { prisma } from '@/lib/prisma';
import { generateWebsiteSettingsCss, defaultWebsiteSettings } from '@/components/craft/utils/websiteSettingsHelper';
import { hooks } from '@/lib/hooks';
import { CORE_HOOKS } from '@/lib/hooks/coreHooks';
import Script from 'next/script';

export const dynamic = 'force-dynamic';

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "vietnamese"],
});

// Dynamic metadata generation for site title, tagline, and favicon
export async function generateMetadata(): Promise<Metadata> {
  let siteTitle = 'Lexi';
  let siteTagline = 'Vận Chuyển Hàng Quốc Tế';
  let faviconUrl = '/favicon.ico';

  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    if (settingsMap['site_title']) siteTitle = settingsMap['site_title'];
    if (settingsMap['site_tagline']) siteTagline = settingsMap['site_tagline'];
    if (settingsMap['site_favicon']) faviconUrl = settingsMap['site_favicon'];
  } catch (e: any) {
    console.warn("generateMetadata: Using fallback settings (DB not ready):", e.message || e);
  }

  const metaObject: Metadata = {
    title: {
      default: `${siteTitle} | ${siteTagline}`,
      template: `%s`,
    },
    description: siteTagline,
    icons: {
      icon: faviconUrl,
      apple: faviconUrl,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'),
    openGraph: {
      title: siteTitle,
      description: siteTagline,
      siteName: siteTitle,
      images: [],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteTagline,
    },
  };

  try {
    return await hooks.applyFilters(CORE_HOOKS.SEO_META, metaObject);
  } catch (err) {
    console.error("Hook SEO_META error:", err);
    return metaObject;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Load site settings dynamically for lang attribute and fallback favicon
  let faviconUrl = '/favicon.ico';
  let siteLanguage = 'vi';
  let seoSettings: any = {};
  let parsedWebsiteSettings = defaultWebsiteSettings;

  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    if (settingsMap['site_favicon']) {
      faviconUrl = settingsMap['site_favicon'];
    }
    if (settingsMap['site_language']) {
      siteLanguage = settingsMap['site_language'];
    }
    if (settingsMap['website_settings']) {
      try {
        parsedWebsiteSettings = JSON.parse(settingsMap['website_settings']);
      } catch (err) {
        console.error("Failed to parse website settings JSON in RootLayout:", err);
      }
    }
    seoSettings = settingsMap;
  } catch (e: any) {
    console.warn("RootLayout: Settings fallback loaded (DB not ready):", e.message || e);
  }

  const isSeoActive = seoSettings['plugin_seo_enabled'] !== 'false';
  const googleVerification = isSeoActive ? seoSettings['seo_google_verification'] : '';
  const bingVerification = isSeoActive ? seoSettings['seo_bing_verification'] : '';
  const yandexVerification = isSeoActive ? seoSettings['seo_yandex_verification'] : '';
  const googleAnalytics = isSeoActive ? seoSettings['seo_google_analytics'] : '';
  const googleTagManager = isSeoActive ? seoSettings['seo_google_tag_manager'] : '';
  const schemaType = isSeoActive ? (seoSettings['seo_schema_type'] || 'organization') : 'organization';
  const schemaName = isSeoActive ? (seoSettings['seo_schema_name'] || 'Lexi') : 'Lexi';
  const schemaLogo = isSeoActive ? (seoSettings['seo_schema_logo'] || '') : '';
  const facebookUrl = isSeoActive ? (seoSettings['seo_facebook_url'] || '') : '';
  const instagramUrl = isSeoActive ? (seoSettings['seo_instagram_url'] || '') : '';
  const zaloUrl = isSeoActive ? (seoSettings['seo_zalo_url'] || '') : '';

  // New detailed Yoast SEO identity fields
  const schemaAltName = isSeoActive ? (seoSettings['seo_schema_alt_name'] || '') : '';
  const schemaXUrl = isSeoActive ? (seoSettings['seo_schema_x_url'] || '') : '';
  const schemaDescription = isSeoActive ? (seoSettings['seo_schema_description'] || '') : '';
  const schemaEmail = isSeoActive ? (seoSettings['seo_schema_email'] || '') : '';
  const schemaPhone = isSeoActive ? (seoSettings['seo_schema_phone'] || '') : '';
  const schemaLegalName = isSeoActive ? (seoSettings['seo_schema_legal_name'] || '') : '';
  const schemaFoundingDate = isSeoActive ? (seoSettings['seo_schema_founding_date'] || '') : '';
  const schemaTaxId = isSeoActive ? (seoSettings['seo_schema_tax_id'] || '') : '';

  const siteUrl = 'https://lexi.vn';
  const publisherId = `${siteUrl}/#${schemaType}`;
  const logoId = `${siteUrl}/#logo`;
  const websiteId = `${siteUrl}/#website`;

  const publisherSchema = {
    '@type': schemaType === 'person' ? 'Person' : 'Organization',
    '@id': publisherId,
    'name': schemaName,
    'alternateName': schemaAltName || undefined,
    'legalName': (schemaType === 'organization' && schemaLegalName) ? schemaLegalName : undefined,
    'description': schemaDescription || undefined,
    'email': schemaEmail || undefined,
    'telephone': schemaPhone || undefined,
    'foundingDate': (schemaType === 'organization' && schemaFoundingDate) ? schemaFoundingDate : undefined,
    'taxID': (schemaType === 'organization' && schemaTaxId) ? schemaTaxId : undefined,
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
    ].filter(Boolean),
    ...(schemaType === 'organization' ? {
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': schemaPhone || seoSettings['footer_phone'] || '',
        'contactType': 'customer service',
        'email': schemaEmail || seoSettings['footer_email'] || '',
        'address': seoSettings['footer_address'] || ''
      }
    } : {})
  };

  const websiteSchema = {
    '@type': 'WebSite',
    '@id': websiteId,
    'url': siteUrl,
    'name': seoSettings['site_title'] || schemaName,
    'description': seoSettings['site_tagline'] || '',
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

  const jsonLdSchema = isSeoActive ? {
    '@context': 'https://schema.org',
    '@graph': [
      publisherSchema,
      websiteSchema
    ]
  } : null;

  return (
    <html
      lang={siteLanguage}
      className={`${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href={faviconUrl} />
        {/* Google Fonts used by theme builder templates */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;600;700;800&family=Open+Sans:wght@300;400;500;600;700;800&family=Lato:wght@300;400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&family=Oswald:wght@300;400;500;600;700;800&family=Merriweather:wght@300;400;500;600;700;800&family=Playfair+Display:wght@300;400;500;600;700;800&family=Nunito:wght@300;400;500;600;700;800&family=Source+Sans+3:wght@300;400;500;600;700;800&family=Noto+Sans:wght@300;400;500;600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&family=Roboto+Slab:wght@300;400;500;600;700;800&family=Raleway:wght@300;400;500;600;700;800&display=swap"
        />
        {isSeoActive && googleVerification && (
          <meta name="google-site-verification" content={googleVerification} />
        )}
        {isSeoActive && bingVerification && (
          <meta name="msvalidate.01" content={bingVerification} />
        )}
        {isSeoActive && yandexVerification && (
          <meta name="yandex-verification" content={yandexVerification} />
        )}
        {isSeoActive && googleAnalytics && (
          <>
            <Script async src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalytics}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalytics}');
              `}
            </Script>
          </>
        )}
        {isSeoActive && googleTagManager && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${googleTagManager}');
            `}
          </Script>
        )}
        {jsonLdSchema && (
          <script
            id="yoast-schema-org"
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
          />
        )}
        <style
          id="lexi-website-settings"
          dangerouslySetInnerHTML={{
            __html: generateWebsiteSettingsCss(parsedWebsiteSettings)
          }}
        />
      </head>
      <body className="min-h-full flex flex-col text-[13px]" suppressHydrationWarning>
        {isSeoActive && googleTagManager && (
          <noscript dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${googleTagManager}"
            height="0" width="0" style="display:none;visibility:hidden"></iframe>`
          }} />
        )}
        {children}
      </body>
    </html>
  );
}

