"use client";

import React, { useState } from 'react';
import { Star, FileText } from 'lucide-react';
import ProductReviewsSection from './ProductReviewsSection';

interface ProductTabsProps {
  postId: number;
  contentHtml: string;
  title: string;
}

export default function ProductTabs({ postId, contentHtml, title }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 sm:px-6 sm:py-4 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors whitespace-nowrap border-none cursor-pointer outline-none ${
            activeTab === 'overview'
              ? 'text-[#E31B23] bg-white border-t-2 border-t-[#E31B23] border-r border-r-slate-200'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-t-2 border-t-transparent border-r border-r-transparent'
          }`}
        >
          <FileText size={16} className="shrink-0" /> Tổng quan
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 sm:px-6 sm:py-4 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors whitespace-nowrap border-none cursor-pointer outline-none ${
            activeTab === 'reviews'
              ? 'text-[#E31B23] bg-white border-t-2 border-t-[#E31B23] border-l border-l-slate-200'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-t-2 border-t-transparent border-l border-l-transparent'
          }`}
        >
          <Star size={16} className="shrink-0" /> Đánh giá
        </button>
      </div>

      <div className="p-6 sm:p-8">
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-extrabold text-[#2D3753] uppercase border-l-4 border-[#E31B23] pl-3 mb-6 tracking-wide">
              {title}
            </h2>
            <div 
              className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base ql-editor-view break-words whitespace-pre-wrap"
              style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: contentHtml || `<p class="text-slate-400 italic">Nội dung chi tiết đang được cập nhật.</p>` }}
            />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="animate-fade-in">
            <ProductReviewsSection postId={postId} />
          </div>
        )}
      </div>
    </div>
  );
}
