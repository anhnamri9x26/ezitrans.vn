import React from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { Calendar, User, ArrowRight, Tag } from 'lucide-react';
import { generatePostUrl, formatDateWordPress } from '@/lib/permalink';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function ModernTagPage({ 
  tag, 
  posts = [], 
  settings = {},
  skipHeader = false,
  skipFooter = false
}: { 
  tag: any; 
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

      {/* Hero Tag with soft blur background */}
      <section className="py-12 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
            <Tag size={22} />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Từ khóa (Tag)</span>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              #{tag.name}
            </h2>
            {tag.description && (
              <p className="text-slate-500 text-[11px] font-medium mt-1">{tag.description}</p>
            )}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <main className="max-w-5xl mx-auto px-6 py-8 flex-1 w-full relative z-10">
        <Breadcrumbs
          settings={settings}
          items={[
            { label: settings.seo_breadcrumbs_home || 'Trang chủ', url: '/' },
            { label: `Thẻ: ${tag.name}` }
          ]}
        />
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-sm">
            <p className="text-slate-400 text-xs font-semibold">Chưa có bài viết nào được gắn thẻ này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map((post: any) => {
              const postLink = generatePostUrl(post, permalinkStructure);
              const formattedDate = formatDateWordPress(post.createdAt, dateFormat, siteLanguage);
              
              return (
                <article 
                  key={post.id} 
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-indigo-500/20"
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
                      
                      <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3 mt-2.5 font-medium">
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
