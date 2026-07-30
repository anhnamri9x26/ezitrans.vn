import React from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { Calendar, User, ArrowLeft, AlertTriangle } from 'lucide-react';
import PublicCommentsSection from '@/components/PublicCommentsSection';
import { formatDateWordPress } from '@/lib/permalink';
import Breadcrumbs from '@/components/Breadcrumbs';

import { prisma } from '@/lib/prisma';

export default async function FengYangPostPage({ 
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
      no_content: 'Bài viết này chưa có nội dung.',
      recent_posts: 'Bài viết mới nhất',
      view_all: 'Xem tất cả'
    },
    en: {
      trash: 'This post is in the Trash. Preview mode is only visible to Administrators.',
      draft: 'This post is a Draft. Preview mode is only visible to Administrators.',
      scheduled: 'This post is scheduled to be published at {time} (Not public yet)',
      no_content: 'This post has no content yet.',
      recent_posts: 'Recent Posts',
      view_all: 'View All'
    }
  };

  const t = (banners as any)[siteLanguage] || banners.vi;

  // Fetch recent posts for the sidebar
  let recentPosts: any[] = [];
  try {
    recentPosts = await prisma.post.findMany({
      where: {
        type: 'POST',
        status: 'PUBLISHED',
        id: { not: post.id }
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        featuredImage: true
      }
    });
  } catch (error) {
    console.error("Failed to fetch recent posts for sidebar:", error);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-800 antialiased">
      {!skipHeader && <Header settings={settings} />}

      {/* Hero Banner Section */}
      <div className="bg-[#2D3753] text-white py-12 relative overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b486b_1px,transparent_1px),linear-gradient(to_bottom,#3b486b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <style>{`
            .post-hero-breadcrumbs .text-slate-500 { color: #94a3b8 !important; }
            .post-hero-breadcrumbs .text-indigo-600 { color: #ffffff !important; }
            .post-hero-breadcrumbs .border-slate-100 { border-color: rgba(255,255,255,0.1) !important; margin-bottom: 1.5rem !important; }
            .post-hero-breadcrumbs a:hover { color: #ffffff !important; }
          `}</style>
          
          <div className="post-hero-breadcrumbs -mt-4">
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
          </div>

          <span className="inline-block bg-[#E31B23] text-white font-bold px-3 py-1 rounded text-xs mb-4 uppercase tracking-wider">
            {post.categories && post.categories.length > 0 ? post.categories[0].name : 'Tin tức'}
          </span>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <User size={16} className="text-white shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-none">{post.author?.name || 'Administrator'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-white shrink-0" />
              <span>
                {isPost 
                  ? `Đăng ngày: ${formattedDate}` 
                  : `Cập nhật ngày: ${formattedUpdateDate}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-2">
            <article className="relative mb-8">
              {/* Admin Banners */}
              {post.status === 'TRASH' && (
                <div className="mb-6 p-4 rounded-xl text-sm font-semibold bg-rose-50 text-rose-800 border border-rose-100 flex items-center gap-2">
                  <AlertTriangle className="text-rose-500 shrink-0" size={18} />
                  {t.trash}
                </div>
              )}

              {post.status === 'DRAFT' && (
                <div className="mb-6 p-4 rounded-xl text-sm font-semibold bg-amber-50 text-amber-800 border border-amber-100 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                  {t.draft}
                </div>
              )}

              {post.status === 'PUBLISHED' && new Date(post.publishedAt) > new Date() && (
                <div className="mb-6 p-4 rounded-xl text-sm font-semibold bg-blue-50 text-[#E31B23] border border-blue-200 flex items-center gap-2">
                  <AlertTriangle className="text-[#E31B23] shrink-0" size={18} />
                  {t.scheduled.replace('{time}', new Date(post.publishedAt).toLocaleString(siteLanguage === 'vi' ? 'vi-VN' : 'en-US'))}
                </div>
              )}

              {/* Featured Image if exists */}
              {post.featuredImage?.url && (
                <div className="aspect-video w-full rounded-xl overflow-hidden mb-8 border border-slate-100 shadow-inner relative">
                  <img 
                    src={post.featuredImage.url} 
                    alt={post.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Body Content */}
          <div 
            className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base ql-editor-view break-words overflow-hidden"
            dangerouslySetInnerHTML={{ __html: post.content || `<p class="text-slate-400 italic">${t.no_content}</p>` }}
          />
            </article>

            {/* Comments Section */}
            {isPost && post.status === 'PUBLISHED' && (
              <PublicCommentsSection postId={post.id} />
            )}
          </div>

          {/* Sidebar (Right Column) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-extrabold text-[#2D3753] uppercase border-l-4 border-[#E31B23] pl-3 mb-6 tracking-wide">
                {t.recent_posts}
              </h3>
              
              <div className="space-y-5">
                {recentPosts.map((rp, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    {/* Thumbnail */}
                    <Link href={`/${rp.slug}`} className="w-20 h-16 rounded overflow-hidden bg-slate-100 shrink-0 border border-slate-100 relative block">
                      {rp.featuredImage?.url ? (
                        <img 
                          src={rp.featuredImage.url} 
                          alt={rp.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                          No Image
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="flex flex-col justify-between py-0.5">
                      <Link 
                        href={`/${rp.slug}`} 
                        className="text-sm font-bold text-[#2D3753] line-clamp-2 hover:text-[#E31B23] transition-colors leading-tight"
                      >
                        {rp.title}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(rp.createdAt).toLocaleDateString(siteLanguage === 'vi' ? 'vi-VN' : 'en-US')}
                      </span>
                    </div>
                  </div>
                ))}

                {recentPosts.length === 0 && (
                  <p className="text-slate-400 text-sm italic">Không có bài viết nào khác.</p>
                )}
              </div>
            </div>
          </div>

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
