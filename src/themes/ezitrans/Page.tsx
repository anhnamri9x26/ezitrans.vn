import React from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { AlertTriangle } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ContactPage from './ContactPage';
import TableOfContents from '@/plugins/table-of-contents/components/TableOfContents';
import { buildTableOfContents, getTocOptions } from '@/plugins/table-of-contents/lib/toc';

export default async function Page({ 
  post, 
  settings = {}, 
  isAuthorizedUser = false,
  formattedDate,
  formattedUpdateDate,
  skipHeader = false,
  skipFooter = false
}: { 
  post: any; 
  settings?: Record<string, string>; 
  isAuthorizedUser?: boolean; 
  formattedDate?: string; 
  formattedUpdateDate?: string; 
  skipHeader?: boolean; 
  skipFooter?: boolean 
}) {
  const siteLanguage = settings.site_language || 'vi';
  const showContentCta = settings.theme_ezitrans_content_cta_enabled !== 'false';
  const contentCtaTitle = settings.theme_ezitrans_content_cta_title || 'Bạn cần hỗ trợ thêm thông tin?';
  const contentCtaDescription = settings.theme_ezitrans_content_cta_description || 'Vui lòng liên hệ trực tiếp với chuyên viên chăm sóc khách hàng của Ezitrans.';
  const contentCtaLabel = settings.theme_ezitrans_content_cta_label || 'Liên Hệ Ngay';
  const contentCtaUrl = settings.theme_ezitrans_content_cta_url || '/lien-he';

  const banners = {
    vi: {
      trash: 'Trang này đang nằm trong Thùng rác. Chỉ hiển thị chế độ xem thử đối với Quản trị viên.',
      draft: 'Trang này là Bản nháp (Draft). Chỉ hiển thị chế độ xem thử đối với Quản trị viên.',
      scheduled: 'Trang này được lên lịch xuất bản lúc {time} (Chưa công khai)',
      no_content: 'Trang này chưa có nội dung.'
    },
    en: {
      trash: 'This page is in the Trash. Preview mode is only visible to Administrators.',
      draft: 'This page is a Draft. Preview mode is only visible to Administrators.',
      scheduled: 'This page is scheduled to be published at {time} (Not public yet)',
      no_content: 'This page has no content yet.'
    }
  };

  const t = (banners as any)[siteLanguage] || banners.vi;

  // Contact has a dedicated conversion-focused template independent of editor content.
  if (post?.slug === 'lien-he') {
    return <ContactPage post={post} settings={settings} />;
  }

  const tocOptions = getTocOptions(settings);
  const tocTypes = (settings.toc_content_types || 'POST').split(',');
  const tocEnabled = settings.plugin_table_of_contents_enabled !== 'false' && tocTypes.includes('PAGE');
  const tocResult = tocEnabled
    ? buildTableOfContents(post?.content || '', tocOptions)
    : { html: post?.content || '', items: [] };

  // Check if page builder layout is active
  const isFullWidth = post?.builderData || post?.pageLayout === 'FULL_WIDTH' || post?.pageLayout === 'CANVAS';

  if (isFullWidth) {
    return (
      <div className="ezi-theme">
        {!skipHeader && <Header settings={settings} />}

        {(post?.status === 'TRASH' || post?.status === 'DRAFT' || (post?.status === 'PUBLISHED' && new Date(post.publishedAt) > new Date())) && (
          <div className="ezi-container" style={{ marginTop: 20 }}>
            {post.status === 'TRASH' && (
              <div className="mb-4 p-4 rounded-xl text-sm font-semibold bg-rose-50 text-rose-800 border border-rose-100 flex items-center gap-2">
                <AlertTriangle className="text-rose-500 shrink-0" size={18} />
                {t.trash}
              </div>
            )}
            {post.status === 'DRAFT' && (
              <div className="mb-4 p-4 rounded-xl text-sm font-semibold bg-amber-50 text-amber-800 border border-amber-100 flex items-center gap-2">
                <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                {t.draft}
              </div>
            )}
            {post.status === 'PUBLISHED' && new Date(post.publishedAt) > new Date() && (
              <div className="mb-4 p-4 rounded-xl text-sm font-semibold bg-blue-50 text-red-500 border border-blue-200 flex items-center gap-2">
                <AlertTriangle className="text-red-500 shrink-0" size={18} />
                {t.scheduled.replace('{time}', new Date(post.publishedAt).toLocaleString(siteLanguage === 'vi' ? 'vi-VN' : 'en-US'))}
              </div>
            )}
          </div>
        )}

        <main className="page-builder-content" data-lexi-page-id={post?.id} dangerouslySetInnerHTML={{ __html: post?.content || `<p class="text-slate-400 italic">${t.no_content}</p>` }} />

        {!skipFooter && <Footer settings={settings} />}
      </div>
    );
  }

  return (
    <div className="ezi-theme">
      {!skipHeader && <Header settings={settings} />}

      {/* Hero Title Section (Spacious spacing & Centered) */}
      <section className="ezi-post-hero ezi-page-hero" style={{ paddingBlock: '60px 40px', textAlign: 'center' }}>
        <div className="ezi-container">
          <div className="ezi-post-hero-breadcrumbs">
            <Breadcrumbs
              settings={settings}
              items={[
                { label: settings.seo_breadcrumbs_home || 'Trang chủ', url: '/' },
                { label: post?.title }
              ]}
            />
          </div>
          <h1 style={{ marginInline: 'auto' }}>{post?.title}</h1>
          <div style={{ marginTop: 12, height: 4, width: 60, borderRadius: 2, background: 'var(--orange)', marginInline: 'auto' }} />
        </div>
      </section>

      {/* Content Layout (Clean 1-Column Centered Layout for Static Pages) */}
      <main className="ezi-static-page-main">
        <div className="ezi-container">
          
          {/* Admin Warnings */}
          {(post?.status === 'TRASH' || post?.status === 'DRAFT' || (post?.status === 'PUBLISHED' && new Date(post.publishedAt) > new Date())) && (
            <div className="mb-6 space-y-3">
              {post.status === 'TRASH' && (
                <div className="p-4 rounded-xl text-sm font-semibold bg-rose-50 text-rose-800 border border-rose-100 flex items-center gap-2">
                  <AlertTriangle className="text-rose-500 shrink-0" size={18} />
                  {t.trash}
                </div>
              )}
              {post.status === 'DRAFT' && (
                <div className="p-4 rounded-xl text-sm font-semibold bg-amber-50 text-amber-800 border border-amber-100 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                  {t.draft}
                </div>
              )}
              {post.status === 'PUBLISHED' && new Date(post.publishedAt) > new Date() && (
                <div className="p-4 rounded-xl text-sm font-semibold bg-blue-50 text-red-500 border border-blue-200 flex items-center gap-2">
                  <AlertTriangle className="text-red-500 shrink-0" size={18} />
                  {t.scheduled.replace('{time}', new Date(post.publishedAt).toLocaleString(siteLanguage === 'vi' ? 'vi-VN' : 'en-US'))}
                </div>
              )}
            </div>
          )}

          {/* Static Page Article Content */}
          <article className="ezi-static-card">
            {post?.featuredImage?.url && (
              <img 
                src={post.featuredImage.url} 
                alt={post.title} 
                className="ezi-post-featured-image"
              />
            )}

            {tocResult.items.length > 0 && (
              <TableOfContents items={tocResult.items} options={tocOptions} className="lexi-toc-inline" />
            )}

            <div 
              className="ezi-post-body ql-editor-view"
              dangerouslySetInnerHTML={{ __html: tocResult.html || `<p class="text-slate-400 italic">${t.no_content}</p>` }}
            />

            {/* Support CTA Block */}
            {showContentCta && <div style={{
              marginTop: 40,
              padding: '24px 30px',
              borderRadius: 8,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap'
            }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontWeight: 800, color: 'var(--navy)', fontSize: 15 }}>{contentCtaTitle}</h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>{contentCtaDescription}</p>
              </div>
              <Link href={contentCtaUrl} className="ezi-btn ezi-btn-primary">
                {contentCtaLabel}
              </Link>
            </div>}
          </article>

        </div>
      </main>

      {/* Embedded Styles for Quill CSS Fallbacks */}
      <style dangerouslySetInnerHTML={{ __html: `
        .ql-editor-view {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .ql-editor-view p {
          margin-bottom: 1.25rem;
        }
        /* Quill Alignments */
        .ql-editor-view .ql-align-center { text-align: center; }
        .ql-editor-view .ql-align-right { text-align: right; }
        .ql-editor-view .ql-align-justify { text-align: justify; }
        
        .ql-editor-view h1, .ql-editor-view h2, .ql-editor-view h3 {
          color: var(--navy);
          font-weight: 800;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          font-family: "Plus Jakarta Sans", sans-serif;
        }
        .ql-editor-view h1 { font-size: 1.8em; border-bottom: 1px solid var(--line); padding-bottom: 0.5rem; }
        .ql-editor-view h2 { font-size: 1.5em; }
        .ql-editor-view h3 { font-size: 1.2em; }
        .ql-editor-view ul, .ql-editor-view ol {
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .ql-editor-view ul { list-style-type: disc; }
        .ql-editor-view ol { list-style-type: decimal; }
        .ql-editor-view li {
          margin-bottom: 0.5rem;
        }
        .ql-editor-view a {
          color: var(--blue);
          text-decoration: none;
          font-weight: 600;
        }
        .ql-editor-view a:hover {
          color: var(--blue-dark);
          text-decoration: underline;
        }
        .ql-editor-view blockquote {
          border-left: 4px solid var(--orange);
          padding: 1rem 1rem 1rem 1.5rem;
          font-style: italic;
          color: var(--ink-muted);
          margin-bottom: 1.25rem;
          background: var(--surface);
          border-radius: 0 8px 8px 0;
        }
      `}} />

      {!skipFooter && <Footer settings={settings} />}
    </div>
  );
}
