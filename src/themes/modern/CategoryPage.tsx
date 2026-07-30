import React from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { Calendar, User, ArrowRight, Folder, Sparkles } from 'lucide-react';
import { generatePostUrl, formatDateWordPress } from '@/lib/permalink';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function ModernCategoryPage({ 
  category, 
  posts = [], 
  settings = {},
  skipHeader = false,
  skipFooter = false
}: { 
  category: any; 
  posts: any[]; 
  settings: any; 
  skipHeader?: boolean;
  skipFooter?: boolean;
}) {
  const permalinkStructure = settings.permalink_structure || '/%postname%.html';
  const siteLanguage = settings.site_language || 'vi';
  const dateFormat = settings.date_format || 'j F, Y';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
      {!skipHeader && <Header settings={settings} />}

      {/* Hero Category with beautiful modern background */}
      <section className="py-14 relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 text-white px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_45%)]" />
        <div className="max-w-5xl mx-auto flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-indigo-300 shrink-0 shadow-lg">
            <Folder size={24} />
          </div>
          <div>
            <span className="text-[9px] font-extrabold text-indigo-300 uppercase tracking-widest block mb-1">Chuyên mục bài viết</span>
            <h2 className="text-2xl font-black tracking-tight leading-tight">
              {category.name}
            </h2>
            {category.description ? (
              <p className="text-slate-300 text-xs mt-1.5 font-medium max-w-xl leading-relaxed">{category.description}</p>
            ) : (
              <p className="text-slate-400 text-[10px] mt-1.5 font-semibold italic">Xem các bài viết hướng dẫn và tin tức mới nhất về chuyên mục này.</p>
            )}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full relative z-10">
        <Breadcrumbs
          settings={settings}
          items={[
            { label: settings.seo_breadcrumbs_home || 'Trang chủ', url: '/' },
            { label: `Chuyên mục: ${category.name}` }
          ]}
        />
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/50 shadow-sm">
            <p className="text-slate-400 text-xs font-semibold">Chưa có bài viết nào được xuất bản trong chuyên mục này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map((post: any) => {
              const postLink = generatePostUrl(post, permalinkStructure);
              const formattedDate = formatDateWordPress(post.createdAt, dateFormat, siteLanguage);
              
              return (
                <article 
                  key={post.id} 
                  className="group bg-white/85 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-indigo-500/20"
                >
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                        <span className="flex items-center gap-1">
                          <User size={11} className="text-slate-300" /> {post.author?.name || 'Admin'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-300" /> {formattedDate}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug hover:text-indigo-600 transition-colors duration-150 group-hover:text-indigo-600 line-clamp-2">
                        <Link href={postLink}>{post.title}</Link>
                      </h4>
                      
                      <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 mt-2.5 font-medium font-sans">
                        {post.excerpt || 'Không có đoạn trích dẫn bài viết nào.'}
                      </p>
                    </div>

                    <Link 
                      href={postLink} 
                      className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 transition-all duration-150 group-hover:gap-1.5 self-start pt-2"
                    >
                      Đọc tiếp <ArrowRight size={11} className="transition-transform duration-150" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {!skipFooter && <Footer settings={settings} />}
    </div>
  );
}
