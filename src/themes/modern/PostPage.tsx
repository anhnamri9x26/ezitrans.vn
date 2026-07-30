"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { 
  Calendar, 
  User, 
  AlertTriangle, 
  ArrowLeft, 
  BookOpen, 
  List, 
  ShoppingBag, 
  Truck,
  MessageSquare
} from 'lucide-react';
import PublicCommentsSection from '@/components/PublicCommentsSection';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function ModernPostPage({ 
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
  const isPost = post.type === 'POST';
  const siteLanguage = settings.site_language || 'vi';

  const banners = {
    vi: {
      trash: 'Bài viết này đang nằm trong Thùng rác. Chỉ hiển thị chế độ xem thử đối với Quản trị viên.',
      draft: 'Bài viết này là Bản nháp (Draft). Chỉ hiển thị chế độ xem thử đối với Quản trị viên.',
      scheduled: 'Bài viết này được lên lịch xuất bản lúc {time} (Chưa công khai)',
      no_content: 'Bài viết này chưa có nội dung.'
    },
    en: {
      trash: 'This post is in the Trash. Preview mode is only visible to Administrators.',
      draft: 'This post is a Draft. Preview mode is only visible to Administrators.',
      scheduled: 'This post is scheduled to be published at {time} (Not public yet)',
      no_content: 'This post has no content yet.'
    }
  };

  const t = (banners as any)[siteLanguage] || banners.vi;

  // Trích xuất heading để làm Mục lục (TOC)
  const [headings, setHeadings] = useState<{ level: number; text: string; id: string }[]>([]);
  const [processedContent, setProcessedContent] = useState(post.content || '');

  useEffect(() => {
    if (!post.content) return;
    
    // Inject ID vào các thẻ heading
    let index = 0;
    const tempHeadings: { level: number; text: string; id: string }[] = [];
    
    const newContent = post.content.replace(/<h([2-3])([^>]*)>(.*?)<\/h\1>/gi, (match: string, level: string, attrs: string, text: string) => {
      const headingText = text.replace(/<[^>]*>/g, '').trim();
      const id = `toc-heading-${index++}`;
      tempHeadings.push({ level: parseInt(level), text: headingText, id });
      
      // Kiểm tra nếu thuộc tính đã có id thì giữ nguyên
      if (attrs.includes('id=')) return match;
      return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    });

    setHeadings(tempHeadings);
    setProcessedContent(newContent);
  }, [post.content]);

  // Cuộn mượt tới heading khi nhấn mục lục
  const handleScrollToHeading = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
      {!skipHeader && <Header settings={settings} />}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12 flex-1 w-full relative z-10">
        
        {/* Navigation Breadcrumb */}
        <Breadcrumbs
          settings={settings}
          items={[
            { label: settings.seo_breadcrumbs_home || 'Trang chủ', url: '/' },
            ...(post.categories && post.categories.length > 0 ? [
              { label: post.categories[0].name, url: `/category/${post.categories[0].slug}` }
            ] : []),
            { label: post.title }
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column - Article Content */}
          <div className="lg:col-span-2 space-y-8">
            <article className="bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/50 p-6 sm:p-10 shadow-lg shadow-slate-900/5 relative overflow-hidden">
              
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
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-4 bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent">
                {post.title}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-[9px] text-slate-400 border-b border-slate-100/80 pb-6 mb-8 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <User size={13} className="text-slate-300" />
                  <span className="text-slate-600">{post.author?.name || 'Administrator'}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-300" />
                  <span>
                    {isPost 
                      ? `Đăng ngày: ${formattedDate}` 
                      : `Cập nhật ngày: ${formattedUpdateDate}`}
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div 
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-[13px] sm:text-[14px] ql-editor-view font-medium"
                dangerouslySetInnerHTML={{ __html: processedContent || `<p class="text-slate-400 italic">${t.no_content}</p>` }}
              />
            </article>

            {/* Comments Section */}
            {isPost && post.status === 'PUBLISHED' && (
              <PublicCommentsSection postId={post.id} />
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8 text-xs font-semibold">
            
            {/* Table of Contents (Mục lục) */}
            {headings.length > 0 && (
              <section className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 shadow-md sticky top-24 max-h-[calc(100vh-140px)] overflow-y-auto">
                <h3 className="text-xs font-black text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <List size={16} className="text-indigo-600 animate-pulse" />
                  Mục lục bài viết
                </h3>
                <nav className="space-y-2">
                  {headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      onClick={(e) => handleScrollToHeading(e, heading.id)}
                      className={`block text-[11px] leading-relaxed text-slate-600 hover:text-indigo-600 transition-colors ${
                        heading.level === 3 ? 'pl-4 border-l border-slate-100 text-[10px] text-slate-500' : 'font-bold'
                      }`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </section>
            )}

            {/* Dịch vụ nổi bật Lexi */}
            <section className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg space-y-4">
              <span className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md inline-block">
                Lexi Logistics
              </span>
              <h3 className="text-sm font-black tracking-tight leading-snug">
                Bạn cần vận chuyển hoặc mua hộ hàng Trung - Nhật?
              </h3>
              <p className="text-slate-300 text-[10px] font-medium leading-relaxed">
                Lexi cung cấp dịch vụ logistics chuyên nghiệp với cước vận chuyển chỉ từ 16.000đ/kg. Hỗ trợ thông quan nhanh chóng, đền bù 100% nếu thất lạc.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-black">
                <Link
                  href="/mua-ho"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag size={12} /> Mua hộ
                </Link>
                <Link
                  href="/ship-ho"
                  className="bg-white hover:bg-slate-100 text-slate-900 py-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5"
                >
                  <Truck size={12} /> Ký gửi
                </Link>
              </div>
            </section>
            
            {/* Box tác giả */}
            {(() => {
              const authorName = post.author?.name || 'Ban Biên Tập Lexi';
              const getInitials = (name: string) => {
                const parts = name.trim().split(/\s+/);
                if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
              };
              const authorInitials = getInitials(authorName);
              
              let roleText = 'Tác giả chuyên môn';
              if (post.author?.role === 'ADMIN') roleText = 'Ban Biên Tập Lexi';
              else if (post.author?.role === 'EDITOR') roleText = 'Biên tập viên';

              return (
                <section className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-md text-center space-y-3.5">
                  <div className="w-14 h-14 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-500 mx-auto text-lg font-black shadow-sm uppercase">
                    {authorInitials}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-800 block text-xs">{authorName}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block mt-0.5">{roleText}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-semibold italic">
                    "Cung cấp thông tin chính xác, giải pháp hữu ích về thủ tục xuất nhập khẩu và kinh nghiệm mua hàng quốc tế."
                  </p>
                </section>
              );
            })()}

          </div>

        </div>

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
