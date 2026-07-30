import React from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { Calendar, User, ArrowRight, ShieldCheck, Truck, ThumbsUp, Medal } from 'lucide-react';
import { generatePostUrl, formatDateWordPress } from '@/lib/permalink';

export default function FengYangHomepage({ 
  posts = [], 
  settings = {},
  skipHeader = false,
  skipFooter = false
}: { 
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

      {/* Hero Banner Section */}
      <section className="relative bg-[#2D3753] overflow-hidden">
        {/* Subtle engineering grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`, backgroundSize: `4rem 4rem` }}></div>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-slate-800/80 text-slate-300 border border-slate-700 px-3 py-1 rounded-full text-[10px] sm:text-xs mb-6 uppercase tracking-widest font-semibold backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E31B23] animate-pulse"></span>
              <span>Nhà phân phối Thép đặc chủng hàng đầu</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
              CHẤT LƯỢNG VƯỢT TRỘI <br /> <span className="text-[#E31B23]">BỀN VỮNG VỚI THỜI GIAN</span>
            </h1>
            <p className="text-slate-300 font-normal text-base md:text-lg max-w-xl mx-auto md:mx-0 leading-relaxed mb-10">
              Cung cấp các dòng thép không gỉ, thép hợp kim, thép khuôn mẫu và thép rèn với tiêu chuẩn quốc tế. Tối ưu hóa cho ngành công nghiệp chế tạo và khuôn mẫu tại Việt Nam.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <Link href="/san-pham" className="group bg-[#E31B23] hover:bg-[#c9181f] text-white font-bold text-sm px-8 py-3.5 rounded-full transition-all w-full sm:w-auto text-center shadow-lg shadow-[#E31B23]/25 uppercase tracking-wider flex items-center justify-center gap-2 border border-[#E31B23]">
                Xem Sản Phẩm <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#quote-modal" className="group bg-white/5 hover:bg-white text-white hover:text-[#2D3753] border border-white/20 hover:border-white font-bold text-sm px-8 py-3.5 rounded-full transition-all w-full sm:w-auto text-center uppercase tracking-wider flex items-center justify-center gap-2 backdrop-blur-sm">
                Nhận Báo Giá
              </a>
            </div>
          </div>
          <div className="flex-1 hidden md:block">
            {/* Real Industrial Steel Image */}
            <div className="aspect-[4/3] rounded-xl border border-white/10 shadow-2xl overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80" 
                alt="FengYang Industrial Special Steel" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#2D3753]/30 mix-blend-multiply"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Categories Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-extrabold text-[#2D3753] uppercase tracking-tight mb-3 md:mb-4">Danh Mục Sản Phẩm</h2>
            <div className="w-24 h-1.5 bg-[#E31B23] mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Thép Không Gỉ', slug: 'thep-khong-gi', desc: 'Inox 304, 316, 430 dạng tấm, cuộn, ống.', color: 'bg-blue-50' },
              { title: 'Thép Hợp Kim', slug: 'thep-hop-kim', desc: 'Sử dụng trong chế tạo cơ khí, chịu mài mòn cao.', color: 'bg-slate-50' },
              { title: 'Thép Làm Khuôn', slug: 'thep-lam-khuon', desc: 'Khuôn dập nóng, dập nguội, khuôn nhựa.', color: 'bg-orange-50' },
              { title: 'Thép Rèn', slug: 'thep-ren', desc: 'Đảm bảo độ cứng, chịu lực cực tốt.', color: 'bg-indigo-50' }
            ].map((cat, idx) => (
              <div key={idx} className={`${cat.color} p-8 rounded-xl border border-slate-100 hover:shadow-xl hover:border-[#E31B23]/30 transition-all duration-300 group flex flex-col justify-between h-full`}>
                <div>
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="text-[#2D3753] font-bold text-xl">0{idx + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#2D3753] mb-3">{cat.title}</h3>
                  <p className="text-slate-600 mb-6 text-sm">{cat.desc}</p>
                </div>
                <Link href={`/danh-muc-san-pham/${cat.slug}`} className="inline-flex items-center gap-2 text-[#2D3753] font-bold hover:text-[#E31B23] transition-colors text-sm uppercase mt-auto">
                  Khám phá <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-12 md:py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-extrabold text-[#2D3753] uppercase tracking-tight mb-3 md:mb-4">Cam Kết Của FengYang</h2>
            <div className="w-24 h-1.5 bg-[#E31B23] mx-auto rounded-full mb-4 md:mb-6"></div>
            <p className="text-slate-600 max-w-2xl mx-auto">Chúng tôi mang lại giá trị thực cho khách hàng thông qua những cam kết thiết thực về chất lượng và dịch vụ.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-slate-100">
              <div className="w-16 h-16 mx-auto bg-[#E31B23]/10 text-[#E31B23] rounded-full flex items-center justify-center mb-4">
                <Medal size={32} />
              </div>
              <h3 className="text-lg font-bold text-[#2D3753] mb-2">16 Năm Kinh Nghiệm</h3>
              <p className="text-slate-500 text-sm">Khẳng định vị thế hàng đầu trong ngành thép đặc chủng.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-slate-100">
              <div className="w-16 h-16 mx-auto bg-[#E31B23]/10 text-[#E31B23] rounded-full flex items-center justify-center mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-lg font-bold text-[#2D3753] mb-2">Chất Lượng CO/CQ</h3>
              <p className="text-slate-500 text-sm">100% sản phẩm đạt tiêu chuẩn, có đầy đủ chứng chỉ.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-slate-100">
              <div className="w-16 h-16 mx-auto bg-[#E31B23]/10 text-[#E31B23] rounded-full flex items-center justify-center mb-4">
                <ThumbsUp size={32} />
              </div>
              <h3 className="text-lg font-bold text-[#2D3753] mb-2">Giá Trực Tiếp</h3>
              <p className="text-slate-500 text-sm">Báo giá cạnh tranh trực tiếp từ nhà máy sản xuất.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-slate-100">
              <div className="w-16 h-16 mx-auto bg-[#E31B23]/10 text-[#E31B23] rounded-full flex items-center justify-center mb-4">
                <Truck size={32} />
              </div>
              <h3 className="text-lg font-bold text-[#2D3753] mb-2">Giao Hàng Nhanh</h3>
              <p className="text-slate-500 text-sm">Hệ thống kho bãi rộng lớn, đáp ứng tiến độ toàn quốc.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News / Blog Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16 w-full bg-white">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-10">
          <div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-[#2D3753] uppercase tracking-tight mb-3 md:mb-4">Tin Tức Mới Nhất</h2>
            <div className="w-24 h-1.5 bg-[#E31B23] rounded-full"></div>
          </div>
          <Link href="#" className="hidden md:inline-flex items-center gap-2 text-[#E31B23] font-bold hover:text-[#E31B23] transition-colors mt-4 md:mt-0 uppercase">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-500 font-medium">Chưa có bài viết nào được xuất bản.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.slice(0, 3).map((post: any) => {
              const postLink = generatePostUrl(post, permalinkStructure);
              const formattedDate = formatDateWordPress(post.createdAt, dateFormat, siteLanguage);
              
              return (
                <article key={post.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-1 duration-300 group">
                  {/* Image Placeholder */}
                  <Link href={postLink} className="aspect-video bg-slate-200 overflow-hidden relative block">
                    {post.featuredImage?.url ? (
                      <img 
                        src={post.featuredImage.url} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-slate-300 flex items-center justify-center text-slate-500 font-medium text-sm transition-transform duration-500 group-hover:scale-105">
                        Ảnh minh họa bài viết
                      </div>
                    )}
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                        <span className="flex items-center gap-1.5">
                          <User size={14} className="text-[#E31B23]" /> {post.author?.name || 'Admin'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-[#E31B23]" /> {formattedDate}
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
        
        <div className="mt-8 text-center md:hidden">
          <Link href="#" className="inline-flex items-center gap-2 text-[#E31B23] font-bold hover:text-[#E31B23] transition-colors uppercase">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {!skipFooter && <Footer settings={settings} />}
    </div>
  );
}
