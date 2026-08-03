import Link from 'next/link';
import { Search, Calendar, User, ArrowRight, FileSearch, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { generatePostUrl, formatDateWordPress } from '@/lib/permalink';

export default function SearchPage({ query = '', posts = [], settings = {}, pagination, skipHeader = false, skipFooter = false }: any) {
  const permalinkStructure = settings.permalink_structure || '/%postname%.html';
  const dateFormat = settings.date_format || 'd/m/Y';
  const siteLanguage = settings.site_language || 'vi';
  const pageUrl = (page: number) => `/tim-kiem?q=${encodeURIComponent(query)}&page=${page}`;

  return <div className="ezi-theme">
    {!skipHeader && <Header settings={settings} />}
    <section className="ezi-post-hero ezi-page-hero ezi-search-hero"><div className="ezi-container">
      <div className="ezi-post-hero-breadcrumbs"><Breadcrumbs settings={settings} items={[{ label: settings.seo_breadcrumbs_home || 'Trang chủ', url: '/' }, { label: 'Tìm kiếm' }]} /></div>
      <span className="ezi-eyebrow">Kho kiến thức Ezitrans</span>
      <h1>Tìm kiếm bài viết</h1>
      <p>Tìm hướng dẫn mua hộ, vận chuyển quốc tế và kiến thức ngoại thương bạn cần.</p>
      <form action="/tim-kiem" method="get" className="ezi-search-form" role="search">
        <label htmlFor="search-page-query" className="ezi-sr-only">Nhập từ khóa tìm kiếm</label>
        <Search size={20} aria-hidden="true" />
        <input id="search-page-query" name="q" defaultValue={query} placeholder="Ví dụ: mua hộ hàng Nhật Bản..." maxLength={120} />
        <button id="search-page-submit" type="submit">Tìm kiếm</button>
      </form>
    </div></section>
    <main className="ezi-static-page-main"><div className="ezi-container">
      <div className="ezi-result-summary">{query ? <><strong>{pagination.totalItems}</strong> kết quả cho “<strong>{query}</strong>”</> : 'Nhập từ khóa để bắt đầu tìm kiếm.'}</div>
      {posts.length === 0 ? <div className="ezi-empty-state"><FileSearch size={48}/><h2>{query ? 'Không tìm thấy nội dung phù hợp' : 'Bạn đang tìm thông tin gì?'}</h2><p>{query ? 'Hãy thử từ khóa ngắn hơn hoặc khám phá các chuyên mục của Ezitrans.' : 'Nhập từ khóa vào ô phía trên để tìm kiếm.'}</p>{query && <Link href="/tin-tuc" className="ezi-btn ezi-btn-primary">Xem tất cả bài viết</Link>}</div> : <>
        <div className="ezi-archive-grid">{posts.map((post: any) => {
          const href = generatePostUrl(post, permalinkStructure);
          return <article key={post.id} className="ezi-archive-card">
            <Link href={href} className="ezi-archive-card-image-wrapper">{post.featuredImage?.url ? <img src={post.featuredImage.url} alt={post.title} className="ezi-archive-card-image"/> : <div className="ezi-archive-card-placeholder"><Search size={30}/><span>Ezitrans Logistics</span></div>}{post.categories?.[0] && <span className="ezi-archive-card-badge">{post.categories[0].name}</span>}</Link>
            <div className="ezi-archive-card-body"><div className="ezi-archive-card-meta"><span><User size={13}/>{post.author?.name || post.author?.username || 'Admin'}</span><span><Calendar size={13}/>{formatDateWordPress(post.createdAt, dateFormat, siteLanguage)}</span></div><h2 className="ezi-archive-card-title"><Link href={href}>{post.title}</Link></h2><p className="ezi-archive-card-excerpt">{post.excerpt || 'Khám phá thông tin chi tiết trong bài viết từ Ezitrans.'}</p><Link href={href} className="ezi-archive-card-readmore">Đọc tiếp <ArrowRight size={14}/></Link></div>
          </article>;
        })}</div>
        {pagination.totalPages > 1 && <nav className="ezi-pagination-container" aria-label="Phân trang tìm kiếm"><div className="ezi-pagination-list">{pagination.currentPage > 1 && <Link href={pageUrl(pagination.currentPage - 1)} className="ezi-pagination-item"><ChevronLeft size={16}/></Link>}{Array.from({length: pagination.totalPages}, (_: any, i: number) => i + 1).filter((p: number) => Math.abs(p-pagination.currentPage) <= 2 || p === 1 || p === pagination.totalPages).map((p: number) => <Link key={p} href={pageUrl(p)} className={`ezi-pagination-item ${p === pagination.currentPage ? 'active' : ''}`}>{p}</Link>)}{pagination.currentPage < pagination.totalPages && <Link href={pageUrl(pagination.currentPage + 1)} className="ezi-pagination-item"><ChevronRight size={16}/></Link>}</div></nav>}
      </>}
    </div></main>
    {!skipFooter && <Footer settings={settings}/>}</div>;
}
