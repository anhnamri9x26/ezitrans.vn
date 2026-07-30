"use client";

import React from 'react';

interface ScreenOptionsProps {
  showAuthorCol: boolean;
  showCategoryCol: boolean;
  showSeoCol: boolean;
  showReadabilityCol: boolean;
  showDateCol: boolean;
  isSeoPluginEnabled: boolean;
  postsPerPage: number;
  type: 'POST' | 'PAGE' | 'SERVICE' | 'PRODUCT';
  handleToggleCol: (colName: 'author' | 'category' | 'seo' | 'readability' | 'date', val: boolean) => void;
  handlePostsPerPageChange: (val: number) => void;
}

export default function ScreenOptions({
  showAuthorCol,
  showCategoryCol,
  showSeoCol,
  showReadabilityCol,
  showDateCol,
  isSeoPluginEnabled,
  postsPerPage,
  type,
  handleToggleCol,
  handlePostsPerPageChange,
}: ScreenOptionsProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm animate-fade-in font-semibold text-slate-650 text-xs">
      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs mb-3 uppercase tracking-wider">Tùy chọn hiển thị</h3>
      <div className="space-y-4">
        {/* Columns Toggle */}
        <div>
          <p className="font-bold text-[10px] text-slate-400 uppercase mb-2">Hiển thị các cột trong bảng</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
              <input
                type="checkbox"
                checked={showAuthorCol}
                onChange={(e) => handleToggleCol('author', e.target.checked)}
                className="w-4 h-4 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span>Tác giả</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
              <input
                type="checkbox"
                checked={showCategoryCol}
                onChange={(e) => handleToggleCol('category', e.target.checked)}
                className="w-4 h-4 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span>{type === 'PAGE' ? 'Trang cha' : 'Chuyên mục'}</span>
            </label>
            {isSeoPluginEnabled && (
              <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
                <input
                  type="checkbox"
                  checked={showSeoCol}
                  onChange={(e) => handleToggleCol('seo', e.target.checked)}
                  className="w-4 h-4 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span>Điểm SEO</span>
              </label>
            )}
            {isSeoPluginEnabled && (
              <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
                <input
                  type="checkbox"
                  checked={showReadabilityCol}
                  onChange={(e) => handleToggleCol('readability', e.target.checked)}
                  className="w-4 h-4 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span>Tính dễ đọc</span>
              </label>
            )}
            <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
              <input
                type="checkbox"
                checked={showDateCol}
                onChange={(e) => handleToggleCol('date', e.target.checked)}
                className="w-4 h-4 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span>Thời gian</span>
            </label>
          </div>
        </div>

        {/* Custom Items Per Page */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[10px] text-slate-400 uppercase">Số bản ghi hiển thị trên một trang:</span>
            <input
              type="number"
              min={1}
              max={200}
              value={postsPerPage}
              onChange={(e) => {
                const val = Math.max(1, Number(e.target.value));
                handlePostsPerPageChange(val);
              }}
              className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded w-16 text-center font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
