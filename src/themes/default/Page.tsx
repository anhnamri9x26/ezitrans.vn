import React from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { AlertTriangle } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function FengYangPage({ 
  post, 
  settings = {}, 
  isAuthorizedUser = false,
  formattedDate,
  formattedUpdateDate,
  skipHeader = false,
  skipFooter = false
}: { 
  post: any; 
  settings: any; 
  isAuthorizedUser: boolean;
  formattedDate?: string;
  formattedUpdateDate?: string;
  skipHeader?: boolean;
  skipFooter?: boolean;
}) {
  const siteLanguage = settings.site_language || 'vi';

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

  const isFullWidth = post.builderData || post.pageLayout === 'FULL_WIDTH' || post.pageLayout === 'CANVAS';
  if (isFullWidth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
        {!skipHeader && <Header settings={settings} />}

        {(post.status === 'TRASH' || post.status === 'DRAFT' || (post.status === 'PUBLISHED' && new Date(post.publishedAt) > new Date())) && (
          <div className="max-w-7xl mx-auto w-full px-6 pt-6">
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
              <div className="mb-4 p-4 rounded-xl text-sm font-semibold bg-blue-50 text-[#E31B23] border border-blue-200 flex items-center gap-2">
                <AlertTriangle className="text-[#E31B23] shrink-0" size={18} />
                {t.scheduled.replace('{time}', new Date(post.publishedAt).toLocaleString(siteLanguage === 'vi' ? 'vi-VN' : 'en-US'))}
              </div>
            )}
          </div>
        )}

        <main className="page-builder-content flex-1 w-full" data-lexi-page-id={post.id} dangerouslySetInnerHTML={{ __html: post.content || `<p class="text-slate-400 italic">${t.no_content}</p>` }} />

        {!skipFooter && <Footer settings={settings} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {!skipHeader && <Header settings={settings} />}

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
        {/* Admin Banners */}
        {(post.status === 'TRASH' || post.status === 'DRAFT' || (post.status === 'PUBLISHED' && new Date(post.publishedAt) > new Date())) && (
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
              <div className="p-4 rounded-xl text-sm font-semibold bg-blue-50 text-[#E31B23] border border-blue-200 flex items-center gap-2">
                <AlertTriangle className="text-[#E31B23] shrink-0" size={18} />
                {t.scheduled.replace('{time}', new Date(post.publishedAt).toLocaleString(siteLanguage === 'vi' ? 'vi-VN' : 'en-US'))}
              </div>
            )}
          </div>
        )}

        <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 lg:p-12 shadow-sm relative overflow-hidden mb-10">
          <Breadcrumbs
            settings={settings}
            items={[
              { label: settings.seo_breadcrumbs_home || 'Trang chủ', url: '/' },
              { label: post.title }
            ]}
          />

          <header className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#2D3753] uppercase leading-tight">
              {post.title}
            </h1>
            <div className="mt-4 h-1.5 w-24 rounded-full bg-[#E31B23]" />
          </header>

          {/* Body Content */}
          <div 
            className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base ql-editor-view break-words overflow-hidden"
            dangerouslySetInnerHTML={{ __html: post.content || `<p class="text-slate-400 italic">${t.no_content}</p>` }}
          />
        </article>
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
          color: #2D3753;
          font-weight: 800;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
        }
        .ql-editor-view h1 { font-size: 1.8em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
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
          color: #E31B23;
          text-decoration: none;
          font-weight: 600;
        }
        .ql-editor-view a:hover {
          color: #E31B23;
        }
        .ql-editor-view blockquote {
          border-left: 4px solid #E31B23;
          padding-left: 1rem;
          font-style: italic;
          color: #475569;
          margin-bottom: 1.25rem;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
      `}} />

      {!skipFooter && <Footer settings={settings} />}
    </div>
  );
}
