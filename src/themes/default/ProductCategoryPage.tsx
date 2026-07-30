import React from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { Calendar, User, ArrowRight, Folder, Package, Phone } from 'lucide-react';
import { generatePostUrl } from '@/lib/permalink';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function FengYangProductCategoryPage({ 
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
  const hotline = settings.contact_hotline || settings.contact_phone || '0969 223 501';

  const t = {
    vi: {
      category_label: 'Danh mục sản phẩm',
      no_products: 'Không tìm thấy sản phẩm nào trong danh mục này.',
      view_detail: 'Xem chi tiết',
      contact_quote: 'Liên hệ báo giá',
    },
    en: {
      category_label: 'Product Category',
      no_products: 'No products found in this category.',
      view_detail: 'View Details',
      contact_quote: 'Request Quote',
    }
  }[siteLanguage === 'vi' ? 'vi' : 'en'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {!skipHeader && <Header settings={settings} />}

      {/* Hero Category Banner */}
      <section className="bg-[#2D3753] text-white py-16 shadow-inner relative overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b486b_1px,transparent_1px),linear-gradient(to_bottom,#3b486b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>
        
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-[#E31B23] shrink-0 shadow-lg">
            <Package size={28} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5 block">{t.category_label}</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight border-l-4 border-[#E31B23] pl-4 uppercase">
              {category.name}
            </h2>
            {category.description && (
              <p className="text-slate-300 text-sm md:text-base font-medium mt-3 max-w-3xl leading-relaxed pl-4">{category.description}</p>
            )}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="mb-8 border-b border-slate-200 pb-4">
          <Breadcrumbs
            settings={settings}
            items={[
              { label: settings.seo_breadcrumbs_home || 'Trang chủ', url: '/' },
              { label: `${t.category_label}: ${category.name}` }
            ]}
          />
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 font-medium">{t.no_products}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {posts.map((post: any) => {
              const productLink = generatePostUrl(post, permalinkStructure);
              
              return (
                <article key={post.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-lg hover:border-[#E31B23]/30 duration-300 group">
                  <div>
                    {/* Product Image Square */}
                    <Link href={productLink} className="aspect-square bg-slate-50 overflow-hidden relative flex items-center justify-center p-6 border-b border-slate-100">
                      {post.featuredImage?.url ? (
                        <img 
                          src={post.featuredImage.url} 
                          alt={post.title} 
                          className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center gap-1.5">
                          <Package size={48} />
                          <span className="text-[11px] font-medium text-slate-400">Hình ảnh đang cập nhật</span>
                        </div>
                      )}
                    </Link>

                    {/* Product Content */}
                    <div className="p-5 text-center">
                      <h4 className="text-base font-bold text-[#2D3753] tracking-tight leading-snug mb-3 group-hover:text-[#E31B23] transition-colors line-clamp-2 min-h-[3rem] flex items-center justify-center">
                        <Link href={productLink}>{post.title}</Link>
                      </h4>
                      
                      <div className="w-10 h-0.5 bg-[#E31B23] mx-auto mb-4"></div>
                      
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
                        Giá: Liên hệ báo giá
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-5 pt-0 flex flex-col gap-2">
                    <Link 
                      href={productLink} 
                      className="w-full text-center text-xs font-bold text-[#2D3753] bg-slate-100 hover:bg-slate-200 py-2.5 rounded-lg transition-all duration-300 uppercase tracking-wider block"
                    >
                      {t.view_detail}
                    </Link>
                    <a 
                      href={`tel:${hotline.replace(/\./g, '')}`}
                      className="w-full text-center text-xs font-bold text-white bg-[#E31B23] hover:bg-[#c9181f] py-2.5 rounded-lg transition-all duration-300 uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <Phone size={12} /> {t.contact_quote}
                    </a>
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
