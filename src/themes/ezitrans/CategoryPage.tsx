import React from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { Calendar, User, ArrowRight, Folder, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { generatePostUrl, formatDateWordPress } from '@/lib/permalink';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function CategoryPage({ 
  category, 
  posts = [], 
  settings = {},
  tag,
  pagination,
  skipHeader = false,
  skipFooter = false
}: { 
  category?: any; 
  posts?: any[]; 
  settings?: Record<string, string>; 
  tag?: any;
  pagination?: any;
  skipHeader?: boolean;
  skipFooter?: boolean;
}) {
  const permalinkStructure = settings.permalink_structure || '/%postname%.html';
  const siteLanguage = settings.site_language || 'vi';
  const dateFormat = settings.date_format || 'd/m/Y';

  // Determine Title, Description, and Base URL based on taxonomy context
  let title = 'Tin tức & Kinh nghiệm';
  let description = 'Cập nhật tin tức mới nhất về logistics, chuyển phát nhanh và kinh nghiệm xuất nhập khẩu.';
  let basePath = '/tin-tuc';
  let breadcrumbLabel = 'Tin tức';

  if (tag) {
    title = `Thẻ bài viết: #${tag.name}`;
    description = tag.description || `Danh sách bài viết được gắn thẻ #${tag.name}.`;
    basePath = `/tag/${tag.slug}`;
    breadcrumbLabel = `Thẻ: ${tag.name}`;
  } else if (category) {
    if (category.slug !== 'all') {
      title = `Chuyên mục: ${category.name}`;
      description = category.description || `Các bài viết thuộc chuyên mục ${category.name}.`;
      basePath = `/category/${category.slug}`;
      breadcrumbLabel = category.name;
    } else {
      title = settings.site_blog_title || 'Tin tức & Kinh nghiệm';
      description = settings.site_blog_description || description;
    }
  }

  // Helper to build pagination URL
  const getPageUrl = (pageNumber: number) => {
    return `${basePath}?page=${pageNumber}`;
  };

  return (
    <div className="ezi-theme">
      {!skipHeader && <Header settings={settings} />}

      {/* Hero Title Section (Centered) */}
      <section className="ezi-post-hero ezi-page-hero" style={{ paddingBlock: '60px 40px', textAlign: 'center' }}>
        <div className="ezi-container">
          <div className="ezi-post-hero-breadcrumbs">
            <Breadcrumbs
              settings={settings}
              items={[
                { label: settings.seo_breadcrumbs_home || 'Trang chủ', url: '/' },
                { label: breadcrumbLabel }
              ]}
            />
          </div>
          <h1 style={{ marginInline: 'auto' }}>{title}</h1>
          {description && (
            <p style={{ 
              margin: '12px auto 0', 
              fontSize: 14, 
              color: 'var(--ink-muted)', 
              maxWidth: 600, 
              lineHeight: 1.5 
            }}>
              {description}
            </p>
          )}
          <div style={{ marginTop: 16, height: 4, width: 60, borderRadius: 2, background: 'var(--orange)', marginInline: 'auto' }} />
        </div>
      </section>

      {/* Main Content Area */}
      <main className="ezi-static-page-main">
        <div className="ezi-container">
          
          {posts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: 'var(--surface)',
              borderRadius: 12,
              border: '1px solid var(--line)'
            }}>
              <Folder size={48} style={{ color: 'var(--ink-muted)', opacity: 0.5, marginBottom: 16 }} />
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--ink-muted)' }}>Chưa có bài viết nào trong mục này.</p>
            </div>
          ) : (
            <>
              {/* 3-Column Posts Grid */}
              <div className="ezi-archive-grid">
                {posts.map((post: any) => {
                  const postLink = generatePostUrl(post, permalinkStructure);
                  const formattedDate = formatDateWordPress(post.createdAt, dateFormat, siteLanguage);
                  const categoryName = post.categories && post.categories.length > 0 
                    ? post.categories[0].name 
                    : null;

                  return (
                    <article key={post.id} className="ezi-archive-card">
                      {/* Image block */}
                      <Link href={postLink} className="ezi-archive-card-image-wrapper">
                        {post.featuredImage?.url ? (
                          <img 
                            src={post.featuredImage.url} 
                            alt={post.title} 
                            className="ezi-archive-card-image"
                          />
                        ) : (
                          <div className="ezi-archive-card-placeholder">
                            <Folder size={32} />
                            <span>Ezitrans Logistics</span>
                          </div>
                        )}
                        {categoryName && (
                          <span className="ezi-archive-card-badge">
                            {categoryName}
                          </span>
                        )}
                      </Link>

                      {/* Content block */}
                      <div className="ezi-archive-card-body">
                        <div className="ezi-archive-card-meta">
                          <span className="ezi-archive-card-meta-item">
                            <User size={13} />
                            {post.author?.name || 'Admin'}
                          </span>
                          <span className="ezi-archive-card-meta-item">
                            <Calendar size={13} />
                            {formattedDate}
                          </span>
                        </div>

                        <h4 className="ezi-archive-card-title">
                          <Link href={postLink}>{post.title}</Link>
                        </h4>

                        <p className="ezi-archive-card-excerpt">
                          {post.excerpt || 'Đang cập nhật đoạn trích dẫn chi tiết cho bài viết này từ ban biên tập Ezitrans...'}
                        </p>

                        <Link href={postLink} className="ezi-archive-card-readmore">
                          Đọc tiếp
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Centered Pagination Section */}
              {pagination && pagination.totalPages > 1 && (
                <div className="ezi-pagination-container">
                  <div className="ezi-pagination-list">
                    {/* Previous Button */}
                    {pagination.currentPage > 1 ? (
                      <Link href={getPageUrl(pagination.currentPage - 1)} className="ezi-pagination-item ezi-pagination-nav">
                        <ChevronLeft size={16} />
                      </Link>
                    ) : (
                      <span className="ezi-pagination-item ezi-pagination-nav disabled">
                        <ChevronLeft size={16} />
                      </span>
                    )}

                    {/* Page Numbers */}
                    {Array.from({ length: pagination.totalPages }, (_, index) => {
                      const pageNum = index + 1;
                      const isActive = pageNum === pagination.currentPage;
                      return (
                        <Link 
                          href={getPageUrl(pageNum)} 
                          className={`ezi-pagination-item ${isActive ? 'active' : ''}`}
                          key={pageNum}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}

                    {/* Next Button */}
                    {pagination.currentPage < pagination.totalPages ? (
                      <Link href={getPageUrl(pagination.currentPage + 1)} className="ezi-pagination-item ezi-pagination-nav">
                        <ChevronRight size={16} />
                      </Link>
                    ) : (
                      <span className="ezi-pagination-item ezi-pagination-nav disabled">
                        <ChevronRight size={16} />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {!skipFooter && <Footer settings={settings} />}
    </div>
  );
}
