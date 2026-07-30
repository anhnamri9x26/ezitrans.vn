"use client";

import React from 'react';
import Link from 'next/link';
import { CheckSquare, Square, ExternalLink } from 'lucide-react';
import { generatePostUrl } from '@/lib/permalink';
import { calculateSeoScore, calculateReadabilityScore } from '@/hooks/useSeoAnalyzer';
import { PostItem } from '@/hooks/useAdminContent';

interface ContentTableProps {
  type: 'POST' | 'PAGE' | 'SERVICE' | 'PRODUCT';
  posts: PostItem[];
  filteredPosts: PostItem[];
  paginatedPosts: PostItem[];
  selectedPostIds: number[];
  showAuthorCol: boolean;
  showCategoryCol: boolean;
  showSeoCol: boolean;
  showReadabilityCol: boolean;
  showDateCol: boolean;
  isSeoPluginEnabled: boolean;
  permalinkStructure: string;
  isLoading: boolean;
  handleToggleSelectAll: (filteredList: PostItem[]) => void;
  handleToggleSelectPost: (id: number) => void;
  handleDeletePost: (id: number, title: string) => void;
  statusFilter: string;
}

export default function ContentTable({
  type,
  posts,
  filteredPosts,
  paginatedPosts,
  selectedPostIds,
  showAuthorCol,
  showCategoryCol,
  showSeoCol,
  showReadabilityCol,
  showDateCol,
  isSeoPluginEnabled,
  permalinkStructure,
  isLoading,
  handleToggleSelectAll,
  handleToggleSelectPost,
  handleDeletePost,
  statusFilter,
}: ContentTableProps) {
  const displayTypeName = type === 'PAGE' ? 'Trang tĩnh' : type === 'PRODUCT' ? 'Sản phẩm' : type === 'SERVICE' ? 'Dịch vụ' : 'Bài viết';
  const pathPrefix = type === 'PAGE' ? '/admin/pages' : type === 'PRODUCT' ? '/admin/products' : type === 'SERVICE' ? '/admin/services' : '/admin/posts';

  const getColSpanCount = () => {
    let count = 2; // Checkbox + Title
    if (showAuthorCol) count++;
    if (showCategoryCol) count++;
    if (isSeoPluginEnabled && showSeoCol) count++;
    if (isSeoPluginEnabled && showReadabilityCol) count++;
    if (showDateCol) count++;
    return count;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px] text-slate-600 min-w-[750px]">
        <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 w-10 text-center font-semibold">
              <button 
                type="button"
                onClick={() => handleToggleSelectAll(filteredPosts)} 
                className="focus:outline-none cursor-pointer"
              >
                {selectedPostIds.length === filteredPosts.length && filteredPosts.length > 0 ? (
                  <CheckSquare size={16} className="text-indigo-600" />
                ) : (
                  <Square size={16} className="text-slate-400 hover:text-indigo-600" />
                )}
              </button>
            </th>
            <th className="px-4 py-3 font-semibold min-w-[240px]">{type === 'PAGE' ? 'Tiêu đề trang' : 'Tiêu đề'}</th>
            {showAuthorCol && <th className="px-4 py-3 font-semibold w-36">Tác giả</th>}
            {showCategoryCol && <th className="px-4 py-3 font-semibold w-40">{type === 'PAGE' ? 'Trang cha' : 'Danh mục'}</th>}
            {isSeoPluginEnabled && showSeoCol && (
              <th className="px-4 py-3 font-semibold w-28">Điểm SEO</th>
            )}
            {isSeoPluginEnabled && showReadabilityCol && (
              <th className="px-4 py-3 font-semibold w-28">Dễ đọc</th>
            )}
            {showDateCol && <th className="px-4 py-3 font-semibold w-36">Thời gian</th>}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={getColSpanCount()} className="px-4 py-12 text-center text-slate-400 font-medium animate-pulse">
                Đang tải danh sách {displayTypeName.toLowerCase()}...
              </td>
            </tr>
          ) : filteredPosts.length === 0 ? (
            <tr>
              <td colSpan={getColSpanCount()} className="px-4 py-12 text-center text-slate-400 font-semibold">
                {posts.length === 0 
                  ? `Chưa có ${displayTypeName.toLowerCase()} nào. Hãy bấm "Thêm ${displayTypeName}" để tạo mục đầu tiên!`
                  : `Không tìm thấy ${displayTypeName.toLowerCase()} nào khớp với các bộ lọc.`
                }
              </td>
            </tr>
          ) : (
            paginatedPosts.map((post) => (
              <tr key={post.id} className="border-b border-slate-100 hover:bg-slate-50/50 group transition-colors">
                <td className="px-4 py-3.5 text-center">
                  <button 
                    type="button"
                    onClick={() => handleToggleSelectPost(post.id)}
                    className="focus:outline-none cursor-pointer"
                  >
                    {selectedPostIds.includes(post.id) ? (
                      <CheckSquare size={16} className="text-indigo-600 animate-scale-in" />
                    ) : (
                      <Square size={16} className="text-slate-300 hover:text-indigo-600" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-brand-600 mb-0.5 group-hover:text-indigo-600 transition-colors">
                    {post.title}
                  </p>
                  
                  {/* Hover actions row */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link 
                      href={`${pathPrefix}/edit/${post.id}`} 
                      className="text-brand-600 font-bold hover:text-indigo-600 hover:underline text-[11px] whitespace-nowrap"
                    >
                      Chỉnh sửa
                    </Link>
                    <span className="text-slate-300 text-[10px]">|</span>
                    <button 
                      type="button"
                      onClick={() => handleDeletePost(post.id, post.title)}
                      className="text-red-500 font-bold hover:text-red-700 hover:underline text-[11px] whitespace-nowrap cursor-pointer"
                    >
                      {statusFilter === 'trash' ? 'Xóa vĩnh viễn' : 'Bỏ vào thùng rác'}
                    </button>
                    <span className="text-slate-300 text-[10px]">|</span>
                    <a 
                      href={generatePostUrl({
                        id: post.id,
                        slug: post.slug,
                        createdAt: post.publishedAt || post.createdAt
                      }, type === 'PAGE' ? '/%postname%' : permalinkStructure)}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-slate-500 font-bold hover:text-indigo-600 hover:underline text-[11px] whitespace-nowrap flex items-center gap-0.5"
                    >
                      Xem ngoài web <ExternalLink size={10} />
                    </a>
                  </div>
                </td>
                {showAuthorCol && <td className="px-4 py-3.5 text-slate-500 text-xs font-medium">{post.author?.name || 'Administrator'}</td>}
                {showCategoryCol && (
                  <td className="px-4 py-3.5 text-slate-500 text-xs font-bold">
                    {type === 'PAGE' ? (
                      post.parent ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          {post.parent.title}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">Cấp cao nhất</span>
                      )
                    ) : (
                      post.categories && post.categories.length > 0 
                        ? post.categories.map(c => c.name).join(', ') 
                        : 'Chưa phân loại'
                    )}
                  </td>
                )}
                {isSeoPluginEnabled && showSeoCol && (
                  <td className="px-4 py-3.5 text-xs">
                    {(() => {
                      if (!post.seoKeywords) {
                        return (
                          <div className="flex items-center gap-1.5 font-semibold text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Chưa tối ưu
                          </div>
                        );
                      }
                      const score = calculateSeoScore({
                        title: post.title,
                        content: post.content || '',
                        seoTitle: post.seoTitle || '',
                        seoDescription: post.seoDescription || '',
                        seoKeywords: post.seoKeywords || '',
                        slug: post.slug || ''
                      });

                      const color = score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600';
                      const dotColor = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                      return (
                        <div className={`flex items-center gap-1.5 font-semibold ${color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div> {score}/100
                        </div>
                      );
                    })()}
                  </td>
                )}
                {isSeoPluginEnabled && showReadabilityCol && (
                  <td className="px-4 py-3.5 text-xs">
                    {(() => {
                      if (!post.content || post.content.replace(/<[^>]*>/g, '').trim().length === 0) {
                        return (
                          <div className="flex items-center gap-1.5 font-semibold text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Không có nội dung
                          </div>
                        );
                      }
                      const readScore = calculateReadabilityScore({
                        content: post.content || ''
                      });

                      const color = readScore >= 80 ? 'text-emerald-600' : readScore >= 50 ? 'text-amber-600' : 'text-rose-600';
                      const dotColor = readScore >= 80 ? 'bg-emerald-500' : readScore >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                      return (
                        <div className={`flex items-center gap-1.5 font-semibold ${color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div> {readScore}/100
                        </div>
                      );
                    })()}
                  </td>
                )}
                {showDateCol && (
                  <td className="px-4 py-3.5">
                    {(() => {
                      const isPublished = post.status === 'PUBLISHED';
                      const isTrash = post.status === 'TRASH';
                      const isFuture = post.publishedAt ? new Date(post.publishedAt) > new Date() : false;
                      
                      let badgeText = 'Bản nháp';
                      let badgeClasses = 'bg-slate-50 text-slate-500 border border-slate-200/55';
                      let dateToShow = post.createdAt;

                      if (isTrash) {
                        badgeText = 'Thùng rác';
                        badgeClasses = 'bg-red-50 text-red-600 border border-red-200/55';
                      } else if (isPublished) {
                        if (isFuture) {
                          badgeText = 'Hẹn giờ';
                          badgeClasses = 'bg-blue-50 text-brand-600 border border-brand-200/55';
                          dateToShow = post.publishedAt;
                        } else {
                          badgeText = 'Đã xuất bản';
                          badgeClasses = 'bg-emerald-50 text-emerald-600 border border-emerald-200/55';
                          dateToShow = post.publishedAt;
                        }
                      }

                      return (
                        <>
                          <span className={`font-semibold px-2.5 py-0.5 rounded-full text-[10px] ${badgeClasses}`}>
                            {badgeText}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1 font-medium">
                            {new Date(dateToShow).toLocaleDateString('vi-VN')}
                          </p>
                        </>
                      );
                    })()}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
