"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

interface BreadcrumbsProps {
  settings?: Record<string, string>;
  items?: BreadcrumbItem[];
}

export default function Breadcrumbs({ settings = {}, items }: BreadcrumbsProps) {
  const pathname = usePathname();

  const isSeoActive = settings['plugin_seo_enabled'] !== 'false';
  const breadcrumbsEnabled = settings['seo_breadcrumbs_enabled'] !== 'false';
  const separator = settings['seo_breadcrumbs_separator'] || '»';
  const homeLabel = settings['seo_breadcrumbs_home'] || 'Trang chủ';
  const siteUrl = String(settings['site_url'] || settings['home_url'] || 'https://ezitrans.vn').replace(/\/+$/, '');

  // Do not render if SEO plugin or breadcrumbs display is disabled
  if (!isSeoActive || !breadcrumbsEnabled) {
    return null;
  }

  // If items are not passed, automatically build from pathname
  let breadcrumbItems: BreadcrumbItem[] = [];

  if (items && items.length > 0) {
    breadcrumbItems = items;
  } else {
    // Generate items from pathname
    breadcrumbItems.push({ label: homeLabel, url: '/' });
    
    const paths = pathname.split('/').filter(Boolean);
    let currentPath = '';
    
    paths.forEach((segment) => {
      currentPath += `/${segment}`;
      
      // Clean segment string for display
      let label = segment
        .replace(/-/g, ' ')
        .replace(/\.html$/, '') // Remove .html extension from slugs
        .trim();
        
      // Capitalize first letter
      label = label.charAt(0).toUpperCase() + label.slice(1);

      // Translate common administrative segments or dynamic paths if any
      if (segment.toLowerCase() === 'category') {
        label = 'Chuyên mục';
      } else if (segment.toLowerCase() === 'tag') {
        label = 'Thẻ';
      } else if (segment.toLowerCase() === 'posts') {
        label = 'Bài viết';
      }

      breadcrumbItems.push({
        label,
        url: currentPath,
      });
    });
  }

  // Generate Schema.org JSON-LD BreadcrumbList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.label,
      'item': item.url
        ? (item.url.startsWith('http') ? item.url : `${siteUrl}${item.url.startsWith('/') ? item.url : `/${item.url}`}`)
        : undefined,
    })),
  };

  return (
    <div className="ezi-breadcrumbs w-full py-3 mb-6 border-b border-slate-100 flex flex-col gap-1 text-[11px] font-semibold text-slate-500 font-sans select-none">
      <nav className="ezi-breadcrumbs-nav flex flex-wrap items-center gap-2" aria-label="Breadcrumb">
        {breadcrumbItems.map((item, idx) => {
          const isLast = idx === breadcrumbItems.length - 1;
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300 font-normal">{separator}</span>}
              {isLast || !item.url ? (
                <span className="text-indigo-600 font-bold max-w-[200px] truncate">{item.label}</span>
              ) : (
                <Link
                  href={item.url}
                  className="text-slate-500 hover:text-indigo-650 transition-colors hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* JSON-LD Structured Data */}
      <script
        id="yoast-schema-breadcrumbs"
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
