import React from 'react';
import Script from 'next/script';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { resolveTemplates, ResolveContext } from '@/lib/templateResolver';
import { getCurrentUser } from '@/lib/session';

interface WpAdminBarProps {
  context?: ResolveContext;
  isPreview?: boolean;
  previewTemplateId?: number;
}

export default async function WpAdminBar({
  context,
  isPreview = false,
  previewTemplateId,
}: WpAdminBarProps) {
  // 1. Authorize session
  const user = await getCurrentUser();
  const isAuthorizedUser = !!(user && (user.role === 'ADMIN' || user.role === 'EDITOR'));
  const username = user?.username || user?.name || 'lexi';

  // Hide bar entirely from anonymous visitors (unless in preview mode)
  if (!isAuthorizedUser && !isPreview) {
    return null;
  }

  // 2. Fetch active templates if context is provided
  const resolved = context ? await resolveTemplates(context) : null;
  const hasTemplates = !!(resolved?.header || resolved?.body || resolved?.footer);

  // 3. Fetch active theme ID for Customize link
  const activeThemeSetting = await prisma.setting.findUnique({ where: { key: 'active_theme' } });
  const activeThemeId = activeThemeSetting?.value || 'default';

  return (
    <>
      {/* Dynamic Style Sheet for Toolbar and Body Offsets */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Inject body offset immediately when active */
        html.has-admin-bar body {
          padding-top: 38px !important;
        }
        /* Sticky/Fixed headers offsets for theme components */
        html.has-admin-bar header[class*="fixed"],
        html.has-admin-bar header[class*="sticky"],
        html.has-admin-bar div[class*="fixed-header"],
        html.has-admin-bar div[class*="sticky-header"],
        html.has-admin-bar .fixed-header,
        html.has-admin-bar .sticky-header {
          top: 38px !important;
        }

        #wpadminbar {
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px) saturate(160%);
          -webkit-backdrop-filter: blur(12px) saturate(160%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          height: 38px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          box-sizing: border-box;
          user-select: none;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
        }
        #wpadminbar .ab-left, #wpadminbar .ab-right {
          display: flex;
          align-items: center;
          height: 100%;
          gap: 4px;
        }
        #wpadminbar a, #wpadminbar .ab-item {
          color: #cbd5e1;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
          height: 38px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
          border-radius: 4px;
        }
        #wpadminbar a:hover, #wpadminbar .ab-item:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #60a5fa;
        }
        #wpadminbar .wp-logo-link {
          font-weight: 700;
          color: #fff !important;
          background: transparent !important;
          padding-left: 0;
        }
        #wpadminbar .wp-logo-link:hover {
          color: #60a5fa !important;
        }

        /* Hover Submenus CSS */
        #wpadminbar .menupop {
          position: relative;
          padding: 0;
        }
        #wpadminbar .menupop > .ab-label {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
          height: 38px;
          font-weight: 500;
          border-radius: 4px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #wpadminbar .menupop > .ab-label:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #60a5fa;
        }
        #wpadminbar .ab-sub-wrapper {
          opacity: 0;
          visibility: hidden;
          transform: translateY(8px);
          position: absolute;
          top: 100%;
          left: 0;
          background: rgba(15, 23, 42, 0.98);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
          min-width: 200px;
          z-index: 100000;
          border-radius: 8px;
          padding: 6px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 2px;
        }
        #wpadminbar .menupop:hover > .ab-sub-wrapper {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        #wpadminbar .ab-sub-wrapper a {
          height: auto !important;
          padding: 8px 12px !important;
          line-height: 1.4 !important;
          display: flex !important;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          text-align: left;
          border-radius: 6px;
          font-weight: 500;
        }
        #wpadminbar .ab-sub-wrapper a:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #60a5fa;
        }

        /* Highlighted Quick Edit Action Buttons */
        #wpadminbar .builder-btn-container {
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 4px;
        }
        #wpadminbar .builder-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          color: #fff !important;
          height: 26px !important;
          padding: 0 12px !important;
          border-radius: 6px;
          font-weight: 600;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        #wpadminbar .builder-btn:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%) !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
          transform: translateY(-0.5px);
        }

        #wpadminbar .exit-preview-btn {
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%) !important;
          color: #fff !important;
          height: 26px !important;
          padding: 0 12px !important;
          border-radius: 6px;
          font-weight: 600;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        #wpadminbar .exit-preview-btn:hover {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
          transform: translateY(-0.5px);
        }

        #wpadminbar .ab-sub-wrapper a.logout-link:hover {
          background: rgba(239, 68, 68, 0.1) !important;
          color: #fca5a5 !important;
        }

        /* Mobile Adjustments */
        @media screen and (max-width: 782px) {
          html.has-admin-bar body {
            padding-top: 48px !important;
          }
          html.has-admin-bar header[class*="fixed"],
          html.has-admin-bar header[class*="sticky"],
          html.has-admin-bar div[class*="fixed-header"],
          html.has-admin-bar div[class*="sticky-header"],
          html.has-admin-bar .fixed-header,
          html.has-admin-bar .sticky-header {
            top: 48px !important;
          }
          #wpadminbar {
            height: 48px;
            padding: 0 8px;
          }
          #wpadminbar a, #wpadminbar .ab-item, #wpadminbar .menupop > .ab-label {
            height: 48px;
            padding: 0 10px;
            font-size: 12px;
          }
          #wpadminbar .builder-btn {
            height: 32px !important;
            font-size: 11px;
            padding: 0 10px !important;
          }
          #wpadminbar .ab-sub-wrapper {
            min-width: 160px;
          }
          #wpadminbar .ab-sub-wrapper a {
            padding: 10px 14px !important;
          }
          #wpadminbar .user-greeting span {
            display: none;
          }
        }
        #wpadminbar-restore:hover {
          color: #60a5fa !important;
          background: rgba(15, 23, 42, 0.95) !important;
          border-color: rgba(96, 165, 250, 0.5) !important;
          box-shadow: 0 6px 20px rgba(0,0,0,0.4) !important;
        }
        #wpadminbar svg.ab-icon {
          display: inline-block;
          vertical-align: middle;
          flex-shrink: 0;
          color: inherit;
        }
        #wpadminbar .ab-sub-wrapper svg.ab-icon {
          opacity: 0.8;
        }

        @keyframes ab-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />

      {/* Floating Restore Button (when admin toolbar is hidden) */}
      <div 
        id="wpadminbar-restore" 
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 999999,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: '#cbd5e1',
          padding: '8px 16px',
          borderRadius: '30px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
          display: 'none',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        title="Hiển thị lại thanh quản trị"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>Hiện Toolbar</span>
      </div>

      {/* Main Admin Toolbar Bar */}
      <div id="wpadminbar">
        <div className="ab-left">
          {/* Logo Menu */}
          <div className="ab-item menupop">
            <a href="/admin/dashboard" className="wp-logo-link" title="Bảng quản trị Lexi">
              <svg 
                viewBox="0 0 24 24" 
                width="16" 
                height="16" 
                fill="none" 
                stroke="url(#lexi-logo-grad)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="ab-icon"
              >
                <defs>
                  <linearGradient id="lexi-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span>Lexi CMS</span>
            </a>
            <div className="ab-sub-wrapper">
              <a href="/admin/dashboard">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                  <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
                </svg>
                <span>Bảng điều khiển</span>
              </a>
              <a href="/admin/posts">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>Quản lý bài viết</span>
              </a>
              <a href="/admin/pages">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <span>Quản lý trang tĩnh</span>
              </a>
              <a href="/admin/templates">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
                </svg>
                <span>Theme Builder</span>
              </a>
              <a href="/admin/settings">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                  <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Cài đặt hệ thống</span>
              </a>
            </div>
          </div>
          
          {/* View Home Link */}
          <a href="/" title="Xem trang chủ">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Xem site</span>
          </a>

          {/* Customize Theme Link */}
          <a href={`/admin/settings/themes/${activeThemeId}/customize`} title="Tùy biến giao diện (Theme Customizer)">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
              <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
            </svg>
            <span>Tùy biến</span>
          </a>

          {/* New Dropdown Menu */}
          <div className="ab-item menupop">
            <span className="ab-label">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Tạo mới</span>
            </span>
            <div className="ab-sub-wrapper">
              <a href="/admin/posts/create">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>Bài viết mới</span>
              </a>
              <a href="/admin/pages/create">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Trang mới</span>
              </a>
              <a href="/admin/media">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                <span>Tải lên media</span>
              </a>
              <a href="/admin/users">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span>Tài khoản mới</span>
              </a>
            </div>
          </div>

          {/* Edit current page or post content (Standard edit page in admin) */}
          {context?.postId && context?.postType && (
            <a 
              href={
                context.postType === 'PAGE' ? `/admin/pages/edit/${context.postId}` : 
                context.postType === 'PRODUCT' ? `/admin/products/edit/${context.postId}` : 
                `/admin/posts/edit/${context.postId}`
              } 
              title="Chỉnh sửa nội dung văn bản & cài đặt"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
              </svg>
              <span>Sửa {
                context.postType === 'PAGE' ? 'trang' : 
                context.postType === 'PRODUCT' ? 'sản phẩm' : 
                'bài viết'
              }</span>
            </a>
          )}

          {/* Edit current page/post with Builder directly */}
          {context?.postId && context?.postType && (
            <div className="builder-btn-container">
              <a 
                href={
                  context.postType === 'PAGE' ? `/admin/pages/edit/${context.postId}?builder=true` : 
                  context.postType === 'PRODUCT' ? `/admin/products/edit/${context.postId}?builder=true` : 
                  `/admin/posts/edit/${context.postId}?builder=true`
                } 
                className="builder-btn" 
                title="Mở trình thiết kế trực quan bằng GrapesJS"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ab-icon" style={{ marginRight: '4px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="9" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="15" x2="21" y2="15" />
                </svg>
                <span>Sửa bằng Builder</span>
              </a>
            </div>
          )}

          {/* Theme Builder templates menu */}
          {hasTemplates && (
            <div className="ab-item menupop">
              <span className="ab-label">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5 3 15 3 16.5C3 18 1.5 19 1.5 20.5C1.5 22 3.5 22 5.5 22C7 22 8 20.5 9.5 20.5C11 20.5 12 22 12 22Z" />
                  <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
                  <circle cx="11.5" cy="7.5" r="1" fill="currentColor" />
                  <circle cx="16.5" cy="9.5" r="1" fill="currentColor" />
                  <circle cx="15.5" cy="14.5" r="1" fill="currentColor" />
                </svg>
                <span>Theme Builder ▼</span>
              </span>
              <div className="ab-sub-wrapper">
                {resolved?.header && (
                  <a href={`/admin/templates/builder/${resolved.header.id}`}>
                    Header: <strong>{resolved.header.name}</strong>
                  </a>
                )}
                {resolved?.body && (
                  <a href={`/admin/templates/builder/${resolved.body.id}`}>
                    Bố cục: <strong>{resolved.body.name}</strong>
                  </a>
                )}
                {resolved?.footer && (
                  <a href={`/admin/templates/builder/${resolved.footer.id}`}>
                    Footer: <strong>{resolved.footer.name}</strong>
                  </a>
                )}
                <a href="/admin/templates" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '4px' }}>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Quản lý điều kiện</span>
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="ab-right">
          {/* Preview banner state */}
          {isPreview && (
            <div className="ab-item" style={{ color: '#fbbf24', fontWeight: '700', gap: '6px' }}>
              <span className="preview-pulse-dot" style={{
                width: '8px',
                height: '8px',
                background: '#fbbf24',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'ab-pulse 1.5s infinite',
              }} />
              <span>Đang xem Preview</span>
            </div>
          )}
          {isPreview && previewTemplateId && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
              <a 
                href={`/admin/templates/builder/${previewTemplateId}`} 
                className="exit-preview-btn"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Thoát Preview</span>
              </a>
            </div>
          )}

          {/* View as visitor client toggle */}
          <div 
            className="ab-item" 
            id="hide-admin-bar-btn" 
            title="Ẩn tạm thời thanh công cụ quản trị để kiểm tra giao diện khách"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <span>Xem dạng Khách</span>
          </div>

          {/* User profile dropdown */}
          <div className="ab-item menupop">
            <div className="user-greeting" style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px', padding: '0 8px' }}>
              <span>Xin chào, <strong style={{ color: '#fff', fontWeight: '600' }}>{username}</strong></span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <img 
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40&q=80" 
                  alt="avatar" 
                  style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1.5px solid #818cf8', display: 'block' }} 
                />
                <span style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '7px',
                  height: '7px',
                  backgroundColor: '#10b981',
                  border: '1.5px solid rgba(15, 23, 42, 0.95)',
                  borderRadius: '50%'
                }} />
              </div>
            </div>
            <div className="ab-sub-wrapper" style={{ right: 0, left: 'auto' }}>
              <a href="/admin/users">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Quản lý tài khoản</span>
              </a>
              <a href="/api/auth/logout" className="logout-link" style={{ color: '#f87171' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ab-icon" style={{ color: '#f87171' }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Đăng xuất</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Script block to handle toolbar hide/show toggles and state preservation in localStorage */}
      <Script id="wpadminbar-script">
        {`
        (function() {
          var bar = document.getElementById('wpadminbar');
          var restoreBtn = document.getElementById('wpadminbar-restore');
          var hideBtn = document.getElementById('hide-admin-bar-btn');

          if (!bar || !restoreBtn) return;

          // 1. Initial State Check (run synchronously to prevent layout shift)
          if (localStorage.getItem('lexi_hide_admin_bar') === 'true') {
            bar.style.display = 'none';
            restoreBtn.style.display = 'flex';
          } else {
            document.documentElement.classList.add('has-admin-bar');
          }

          // 2. Hide Toolbar Handler
          if (hideBtn) {
            hideBtn.addEventListener('click', function(e) {
              e.preventDefault();
              document.documentElement.classList.remove('has-admin-bar');
              bar.style.display = 'none';
              restoreBtn.style.display = 'flex';
              localStorage.setItem('lexi_hide_admin_bar', 'true');
            });
          }

          // 3. Restore Toolbar Handler
          restoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.documentElement.classList.add('has-admin-bar');
            bar.style.display = 'flex';
            restoreBtn.style.display = 'none';
            localStorage.removeItem('lexi_hide_admin_bar');
          });
        })();
        `}
      </Script>
    </>
  );
}
