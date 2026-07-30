import React from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { Calendar, User, ArrowRight, Tag } from 'lucide-react';
import { generatePostUrl, formatDateWordPress } from '@/lib/permalink';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function FengYangTagPage({ 
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
  const dateFormat = settings.date_format || 'd/m/Y';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {!skipHeader && <Header settings={settings} />}

      {/* Hero Tag */}
      <section className="bg-[#2D3753] text-white py-16 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-[#E31B23] flex items-center justify-center text-[#2D3753] shrink-0 shadow-lg">
            <Tag size={32} />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 block">Từ khóa (Tag)</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              #{tag.name}
            </h2>
            {tag.description && (
              <p className="text-slate-300 text-sm md:text-base font-medium mt-3 max-w-3xl leading-relaxed">{tag.description}</p>
            )}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="mb-8 border-b border-slate-200 pb-4">
          <Breadcrumbs
            settings={settings}
            items={[
              { label: settings.seo_breadcrumbs_home || 'Trang chủ', url: '/' },
              { label: `Thẻ: ${tag.name}` }
            ]}
          />
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 font-medium">Chưa có bài viết nào được gắn thẻ này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {posts.map((post: any) => {
              const postLink = generatePostUrl(post, permalinkStructure);
              const formattedDate = formatDateWordPress(post.createdAt, dateFormat, siteLanguage);
              
              return (
                <article key={post.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-1 duration-300 group">
                  {/* Image Placeholder */}
                  <Link href={postLink} className="aspect-video bg-slate-200 overflow-hidden relative">
                    <div className="absolute inset-0 bg-slate-300 flex items-center justify-center text-slate-500 font-medium text-sm transition-transform duration-500 group-hover:scale-105">
                      Ảnh minh họa bài viết
                    </div>
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                        <span className="flex items-center gap-1.5">
                          <User size={14} className="text-[#2D3753]" /> {post.author?.name || 'Admin'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-[#2D3753]" /> {formattedDate}
                        </span>
                      </div>
                      
                      <h4 className="text-xl font-bold text-[#2D3753] tracking-tight leading-snug mb-3 group-hover:text-[#E31B23] transition-colors line-clamp-2">
                        <Link href={postLink}>{post.title}</Link>
                      </h4>
                      
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-6">
                        {post.excerpt || 'Không có đoạn trích dẫn bài viết nào.'}
                      </p>
                    </div>

                    <Link 
                      href={postLink} 
                      className="text-sm font-bold text-[#E31B23] hover:text-[#E31B23] flex items-center gap-2 group/link self-start uppercase"
                    >
                      Đọc tiếp <ArrowRight size={14} className="transition-transform group-hover/link:translate-x-1" />
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
