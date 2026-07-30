"use client";

import React from 'react';
import { Search, Tag, Calendar, Layers } from 'lucide-react';
import { Category, TagItem } from '@/hooks/useAdminContent';

interface FilterToolbarProps {
  type: 'POST' | 'PAGE' | 'SERVICE' | 'PRODUCT';
  categories: Category[];
  allTags: TagItem[];
  isSeoPluginEnabled: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  tagFilter: string;
  setTagFilter: (val: string) => void;
  dateFilter: string;
  setDateFilter: (val: string) => void;
  seoFilter: 'all' | 'good' | 'ok' | 'bad' | 'none';
  setSeoFilter: (val: 'all' | 'good' | 'ok' | 'bad' | 'none') => void;
  readabilityFilter: 'all' | 'good' | 'ok' | 'bad' | 'none';
  setReadabilityFilter: (val: 'all' | 'good' | 'ok' | 'bad' | 'none') => void;
  selectedPostIds: number[];
  bulkAction: string;
  setBulkAction: (val: string) => void;
  statusFilter: string;
  handleBulkActionApply: () => void;
  getAvailableMonths: () => { key: string; label: string }[];
}

export default function FilterToolbar({
  type,
  categories,
  allTags,
  isSeoPluginEnabled,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  tagFilter,
  setTagFilter,
  dateFilter,
  setDateFilter,
  seoFilter,
  setSeoFilter,
  readabilityFilter,
  setReadabilityFilter,
  selectedPostIds,
  bulkAction,
  setBulkAction,
  statusFilter,
  handleBulkActionApply,
  getAvailableMonths,
}: FilterToolbarProps) {
  const isPostOrProduct = type === 'POST' || type === 'PRODUCT';
  return (
    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3.5">
      {/* Row 1: Search & Bulk Action */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select 
            value={bulkAction} 
            onChange={(e) => setBulkAction(e.target.value)} 
            className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-900 outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer h-9 w-full sm:w-40 flex-1 sm:flex-none"
          >
            <option value="">Thao tác hàng loạt</option>
            <option value="delete">{statusFilter === 'trash' ? 'Xóa vĩnh viễn' : 'Chuyển vào thùng rác'}</option>
          </select>
          <button 
            type="button"
            onClick={handleBulkActionApply}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs cursor-pointer h-9 transition-colors hover:border-slate-300 active:scale-[0.98] shrink-0"
          >
            Áp dụng
          </button>
          
          {selectedPostIds.length > 0 && (
            <span className="text-[11px] text-indigo-600 font-bold ml-1 animate-pulse w-full sm:w-auto mt-1 sm:mt-0">
              Đã chọn {selectedPostIds.length} mục
            </span>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tiêu đề hoặc slug..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs w-full h-9 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Row 2: Select Filters (Only show dynamic columns depending on Type) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${isPostOrProduct ? (isSeoPluginEnabled ? '5' : '3') : (isSeoPluginEnabled ? '4' : '2')} gap-3 pt-1`}>
        
        {/* Category Filter (Only for Posts/Products) */}
        {isPostOrProduct && (
          <div className="relative flex items-center">
            <Layers size={14} className="absolute left-3 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold text-slate-600 outline-none cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 h-9"
            >
              <option value="all">Tất cả chuyên mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tag Filter (Only for Posts/Products) */}
        {isPostOrProduct && (
          <div className="relative flex items-center">
            <Tag size={14} className="absolute left-3 text-slate-400" />
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold text-slate-600 outline-none cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 h-9"
            >
              <option value="all">Tất cả thẻ nhãn</option>
              {allTags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Date Filter (Applies to all) */}
        <div className="relative flex items-center">
          <Calendar size={14} className="absolute left-3 text-slate-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold text-slate-600 outline-none cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 h-9"
          >
            <option value="all">Lọc theo thời gian</option>
            {getAvailableMonths().map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* SEO Score Filter (If plugin enabled) */}
        {isSeoPluginEnabled && (
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 text-[10px] font-black tracking-wider">SEO</span>
            <select
              value={seoFilter}
              onChange={(e) => setSeoFilter(e.target.value as any)}
              className="w-full pl-11 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold text-slate-600 outline-none cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 h-9"
            >
              <option value="all">Tất cả điểm SEO</option>
              <option value="good">SEO: Tốt (Xanh)</option>
              <option value="ok">SEO: OK (Cam)</option>
              <option value="bad">SEO: Cần cải thiện (Đỏ)</option>
              <option value="none">SEO: Chưa phân tích</option>
            </select>
          </div>
        )}

        {/* Readability Score Filter (If plugin enabled) */}
        {isSeoPluginEnabled && (
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 text-[9px] font-black tracking-wider">READ</span>
            <select
              value={readabilityFilter}
              onChange={(e) => setReadabilityFilter(e.target.value as any)}
              className="w-full pl-12 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold text-slate-600 outline-none cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 h-9"
            >
              <option value="all">Tất cả điểm Đọc hiểu</option>
              <option value="good">Đọc: Tốt (Xanh)</option>
              <option value="ok">Đọc: OK (Cam)</option>
              <option value="bad">Đọc: Cần cải thiện (Đỏ)</option>
              <option value="none">Đọc: Chưa phân tích</option>
            </select>
          </div>
        )}

      </div>
    </div>
  );
}
