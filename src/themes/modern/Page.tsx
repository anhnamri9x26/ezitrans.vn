import React from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function ModernPage({ 
  post, 
  settings = {}, 
  isAuthorizedUser = false,
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
      {!skipHeader && <Header settings={settings} />}

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full relative z-10">
        
        {/* Navigation Breadcrumb */}
        <Breadcrumbs
          settings={settings}
          items={[
            { label: settings.seo_breadcrumbs_home || 'Trang chủ', url: '/' },
            { label: post.title }
          ]}
        />

        <article className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 sm:p-10 shadow-lg shadow-slate-900/5 relative overflow-hidden mb-10">
          {/* Admin Banners */}
          {post.status === 'TRASH' && (
            <div className="mb-6 p-4 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-100 flex items-center gap-2">
              <AlertTriangle className="text-rose-500 shrink-0" size={16} />
              {t.trash}
            </div>
          )}

          {post.status === 'DRAFT' && (
            <div className="mb-6 p-4 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-100 flex items-center gap-2">
              <AlertTriangle className="text-amber-500 shrink-0" size={16} />
              {t.draft}
            </div>
          )}

          {post.status === 'PUBLISHED' && new Date(post.publishedAt) > new Date() && (
            <div className="mb-6 p-4 rounded-xl text-xs font-semibold bg-blue-50 text-indigo-800 border border-blue-200 flex items-center gap-2">
              <AlertTriangle className="text-indigo-500 shrink-0" size={16} />
              {t.scheduled.replace('{time}', new Date(post.publishedAt).toLocaleString(siteLanguage === 'vi' ? 'vi-VN' : 'en-US'))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8 bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">
            {post.title}
          </h1>

          {/* Body Content */}
          <div 
            className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-[13px] sm:text-[14px] ql-editor-view font-medium"
            dangerouslySetInnerHTML={{ __html: post.content || `<p class="text-slate-400 italic">${t.no_content}</p>` }}
          />
        </article>
      </main>

      {/* Embedded Styles for Quill CSS Fallbacks */}
      <style dangerouslySetInnerHTML={{ __html: `
        .ql-editor-view p {
          margin-bottom: 1.25rem;
        }
        .ql-editor-view h1, .ql-editor-view h2, .ql-editor-view h3 {
          color: #0f172a;
          font-weight: 800;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .ql-editor-view h1 { font-size: 1.4em; }
        .ql-editor-view h2 { font-size: 1.2em; }
        .ql-editor-view h3 { font-size: 1.1em; }
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
          color: #4f46e5;
          text-decoration: underline;
          font-weight: 700;
        }
        .ql-editor-view a:hover {
          color: #4338ca;
        }
        .ql-editor-view blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1rem;
          font-style: italic;
          color: #475569;
          margin-bottom: 1.25rem;
        }
      `}} />

      {!skipFooter && <Footer settings={settings} />}
    </div>
  );
}
