import React from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { Calendar, User, MessageSquare, Phone, Mail } from 'lucide-react';
import PublicCommentsSection from '@/components/PublicCommentsSection';
import Breadcrumbs from '@/components/Breadcrumbs';
import { prisma } from '@/lib/prisma';
import { getSiteUrl } from '@/lib/technicalSeo';
import { generatePostUrl } from '@/lib/permalink';
import TableOfContents from '@/plugins/table-of-contents/components/TableOfContents';
import { buildTableOfContents, getTocOptions } from '@/plugins/table-of-contents/lib/toc';
import ConsultationForm from './ConsultationForm';

export default async function PostPage({ 
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
  const permalinkStructure = settings.permalink_structure || '/%postname%.html';
  const tocOptions = getTocOptions(settings);
  const tocTypes = (settings.toc_content_types || 'POST').split(',');
  const tocEnabled = settings.plugin_table_of_contents_enabled !== 'false' && tocTypes.includes(post.type);
  const tocResult = tocEnabled
    ? buildTableOfContents(post.content || '', tocOptions)
    : { html: post.content || '', items: [] };

  // Fetch recent posts for the sidebar
  let recentPosts: any[] = [];
  try {
    recentPosts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        type: 'POST',
        id: { not: post.id }
      },
      take: 5,
      orderBy: {
        publishedAt: 'desc'
      },
      include: {
        featuredImage: true
      }
    });
  } catch (error) {
    console.error("Failed to fetch recent posts for sidebar:", error);
  }

  return (
    <div className="ezi-theme">
      {!skipHeader && <Header settings={settings} />}

      {/* Hero Header Area */}
      <section className="ezi-post-hero">
        <div className="ezi-container">
          <div className="ezi-post-hero-breadcrumbs">
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

          <span className="ezi-post-category-badge">
            {post.categories && post.categories.length > 0 ? post.categories[0].name : 'Cẩm nang'}
          </span>
          
          <h1>{post.title}</h1>

          <div className="ezi-post-meta">
            <div className="ezi-post-meta-item">
              <User className="ezi-post-meta-icon" size={14} />
              {post.author?.username ? <Link href={`/author/${post.author.username}`}>{post.author.name || post.author.username}</Link> : <span>{post.author?.name || 'Administrator'}</span>}
            </div>
            <div className="ezi-post-meta-item">
              <Calendar className="ezi-post-meta-icon" size={14} />
              <span>
                {isPost 
                  ? `Đăng ngày: ${formattedDate}` 
                  : `Cập nhật ngày: ${formattedUpdateDate}`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="ezi-post-main-container">
        <div className="ezi-container ezi-post-grid">
          
          {/* Left Column: Post Content */}
          <main className="ezi-post-content-card">
            {post.featuredImage?.url && (
              <img 
                src={post.featuredImage.url} 
                alt={post.title} 
                className="ezi-post-featured-image"
              />
            )}

            {tocResult.items.length > 0 && tocOptions.position === 'inline' && (
              <TableOfContents items={tocResult.items} options={tocOptions} className="lexi-toc-inline" />
            )}

            <article 
              className="ezi-post-body ql-editor-view"
              dangerouslySetInnerHTML={{ __html: tocResult.html || '<p className="italic text-slate-400">Bài viết này chưa có nội dung.</p>' }}
            />

            {post.type === 'SERVICE' && <ConsultationForm serviceTitle={post.title} />}

            {/* Comments Section */}
            {isPost && post.status === 'PUBLISHED' && (
              <div className="ezi-comments-container">
                <PublicCommentsSection postId={post.id} />
              </div>
            )}
          </main>

          {/* Right Column: Sidebar */}
          <aside className="ezi-sidebar">
            {tocResult.items.length > 0 && tocOptions.position === 'sidebar' && (
              <TableOfContents items={tocResult.items} options={tocOptions} />
            )}
            
            {/* Widget 1: Recent Posts */}
            <div className="ezi-sidebar-widget">
              <h3>Bài viết mới nhất</h3>
              <div className="ezi-sidebar-posts">
                {recentPosts.map((rp, idx) => {
                  const postLink = generatePostUrl(rp, permalinkStructure);
                  return (
                    <Link href={postLink} className="ezi-recent-post-card" key={rp.slug || idx}>
                    <div className="ezi-recent-thumb">
                      {rp.featuredImage?.url ? (
                        <img src={rp.featuredImage.url} alt={rp.title} />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="ezi-recent-info">
                      <h4>{rp.title}</h4>
                      <span>
                        {new Date(rp.createdAt).toLocaleDateString(siteLanguage === 'vi' ? 'vi-VN' : 'en-US')}
                      </span>
                    </div>
                  </Link>
                  );
                })}
                {recentPosts.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Không có bài viết liên quan.</p>
                )}
              </div>
            </div>

            {/* Widget 2: Services Link List */}
            <div className="ezi-sidebar-widget">
              <h3>Dịch vụ Ezitrans</h3>
              <div className="ezi-sidebar-links">
                <Link href="/mua-ho-hang-trung-quoc.html" className="ezi-sidebar-link-item">
                  <span className="ezi-sidebar-bullet">›</span> Mua hộ hàng Trung Quốc
                </Link>
                <Link href="/mua-ho-hang-nhat-ban.html" className="ezi-sidebar-link-item">
                  <span className="ezi-sidebar-bullet">›</span> Mua hộ hàng Nhật Bản
                </Link>
                <Link href="/van-chuyen-hang-trung-quoc-ve-viet-nam.html" className="ezi-sidebar-link-item">
                  <span className="ezi-sidebar-bullet">›</span> Chuyển hàng về Việt Nam
                </Link>
                <Link href="/category/xuat-khau" className="ezi-sidebar-link-item">
                  <span className="ezi-sidebar-bullet">›</span> Xuất khẩu đi Quốc tế
                </Link>
                <Link href="/lien-he" className="ezi-sidebar-link-item">
                  <span className="ezi-sidebar-bullet">›</span> Yêu cầu báo giá nhanh
                </Link>
              </div>
            </div>

            {/* Widget 3: Support Contact Card */}
            <div className="ezi-sidebar-widget ezi-sidebar-support-card">
              <h3>Hỗ trợ trực tuyến</h3>
              <p>Bạn cần tư vấn chi tiết về thủ tục ký gửi hàng hóa hoặc chi phí mua hộ? Hãy liên hệ ngay.</p>
              <div className="ezi-sidebar-contact-info">
                <div className="ezi-sidebar-contact-row">
                  <Phone size={14} className="text-orange" />
                  <span>Hotline: <strong>{settings.contact_hotline_1 || settings.footer_phone || '0868.375.300'}</strong></span>
                </div>
                <div className="ezi-sidebar-contact-row">
                  <Mail size={14} className="text-orange" />
                  <span>{settings.footer_email || 'ezitrans.vn@gmail.com'}</span>
                </div>
              </div>
              <Link href="/lien-he" className="ezi-btn ezi-btn-orange" style={{ width: '100%' }}>
                GỬI YÊU CẦU
              </Link>
            </div>

          </aside>

        </div>
      </div>

      {!skipFooter && <Footer settings={settings} />}
    </div>
  );
}
