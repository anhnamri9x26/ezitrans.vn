"use client";

import React from 'react';
import { useTranslation } from "@/lib/i18n/AdminI18nProvider";
import Link from 'next/link';
import { Plus, Settings } from 'lucide-react';
import { useAdminContent } from '@/hooks/useAdminContent';
import ScreenOptions from './admin-list/ScreenOptions';
import FilterToolbar from './admin-list/FilterToolbar';
import ContentTable from './admin-list/ContentTable';
import Pagination from './admin-list/Pagination';

interface AdminContentListProps {
  type: 'POST' | 'PAGE' | 'SERVICE' | 'PRODUCT';
  title: string;
  description?: string;
}

export default function AdminContentList({
  type, title, description }: AdminContentListProps) {
  const { t } = useTranslation();
  const {
    posts,
    categories,
    allTags,
    isLoading,
    currentPage,
    postsPerPage,
    isScreenOptionsOpen,
    setIsScreenOptionsOpen,
    showAuthorCol,
    showCategoryCol,
    showSeoCol,
    showReadabilityCol,
    showDateCol,
    handleToggleCol,
    handlePostsPerPageChange,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
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
    isSeoPluginEnabled,
    permalinkStructure,
    filteredPosts,
    paginatedPosts,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    totalCount,
    publishedCount,
    draftCount,
    trashCount,
    handleDeletePost,
    getAvailableMonths,
    handleBulkActionApply,
    handleToggleSelectAll,
    handleToggleSelectPost,
    handlePageChange,
    getPageNumbers,
    permalinkProductBase,
  } = useAdminContent({ type });

  const pathPrefix = type === 'PAGE' ? '/admin/pages' : type === 'PRODUCT' ? '/admin/products' : type === 'SERVICE' ? '/admin/services' : '/admin/posts';
  const displayTypeName = type === 'PAGE' ? 'Trang tĩnh' : type === 'PRODUCT' ? 'Sản phẩm' : type === 'SERVICE' ? 'Dịch vụ' : 'Bài viết';
  const creationLabel = `Thêm ${displayTypeName} Mới`;

  return (
    <div className="max-w-6xl mx-auto font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t(title)}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {description || `Quản lý, tìm kiếm và tối ưu hóa danh sách ${displayTypeName.toLowerCase()} trên hệ thống`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsScreenOptionsOpen(!isScreenOptionsOpen)}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs cursor-pointer h-9 transition-colors hover:border-slate-300 active:scale-[0.98] flex items-center gap-1.5 outline-none"
          >
            <Settings size={14} className={isScreenOptionsOpen ? 'rotate-45 transition-transform duration-250 text-indigo-600' : 'transition-transform duration-250'} />
            <span className="hidden sm:inline">Tùy chọn hiển thị</span>
            <span className="sm:hidden">Tùy chọn</span>
          </button>
          <Link 
            href={`${pathPrefix}/create`} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 sm:gap-2 transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] cursor-pointer text-xs"
          >
            <Plus size={16} /> 
            <span className="hidden sm:inline">{creationLabel}</span>
            <span className="sm:hidden">Thêm mới</span>
          </Link>
        </div>
      </div>

      {/* Screen Options Panel */}
      {isScreenOptionsOpen && (
        <ScreenOptions
          showAuthorCol={showAuthorCol}
          showCategoryCol={showCategoryCol}
          showSeoCol={showSeoCol}
          showReadabilityCol={showReadabilityCol}
          showDateCol={showDateCol}
          isSeoPluginEnabled={isSeoPluginEnabled}
          postsPerPage={postsPerPage}
          type={type}
          handleToggleCol={handleToggleCol}
          handlePostsPerPageChange={handlePostsPerPageChange}
        />
      )}

      {/* WordPress-style Quick Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3.5 mb-4 text-xs font-semibold text-slate-500">
        <button 
          type="button"
          onClick={() => setStatusFilter('all')} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            statusFilter === 'all' 
              ? 'text-indigo-600 border-indigo-600 font-bold' 
              : 'border-transparent hover:text-slate-700 dark:text-slate-200'
          }`}
        >
          Tất cả <span className="text-[10px] text-slate-400 font-normal bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full ml-0.5">{totalCount}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button 
          type="button"
          onClick={() => setStatusFilter('published')} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            statusFilter === 'published' 
              ? 'text-indigo-600 border-indigo-600 font-bold' 
              : 'border-transparent hover:text-slate-700 dark:text-slate-200'
          }`}
        >
          Đã xuất bản <span className="text-[10px] text-slate-400 font-normal bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full ml-0.5">{publishedCount}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button 
          type="button"
          onClick={() => setStatusFilter('draft')} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            statusFilter === 'draft' 
              ? 'text-indigo-600 border-indigo-600 font-bold' 
              : 'border-transparent hover:text-slate-700 dark:text-slate-200'
          }`}
        >
          Bản nháp <span className="text-[10px] text-slate-400 font-normal bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full ml-0.5">{draftCount}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button 
          type="button"
          onClick={() => setStatusFilter('trash')} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            statusFilter === 'trash' 
              ? 'text-red-600 border-red-600 font-bold' 
              : 'border-transparent hover:text-slate-700 dark:text-slate-200'
          }`}
        >
          Thùng rác <span className="text-[10px] text-slate-400 font-normal bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full ml-0.5">{trashCount}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Dynamic Filter Toolbar */}
        <FilterToolbar
          type={type}
          categories={categories}
          allTags={allTags}
          isSeoPluginEnabled={isSeoPluginEnabled}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          seoFilter={seoFilter}
          setSeoFilter={setSeoFilter}
          readabilityFilter={readabilityFilter}
          setReadabilityFilter={setReadabilityFilter}
          selectedPostIds={selectedPostIds}
          bulkAction={bulkAction}
          setBulkAction={setBulkAction}
          statusFilter={statusFilter}
          handleBulkActionApply={handleBulkActionApply}
          getAvailableMonths={getAvailableMonths}
        />

        {/* Content Table displaying actual data rows */}
        <ContentTable
          type={type}
          posts={posts}
          filteredPosts={filteredPosts}
          paginatedPosts={paginatedPosts}
          selectedPostIds={selectedPostIds}
          showAuthorCol={showAuthorCol}
          showCategoryCol={showCategoryCol}
          showSeoCol={showSeoCol}
          showReadabilityCol={showReadabilityCol}
          showDateCol={showDateCol}
          isSeoPluginEnabled={isSeoPluginEnabled}
          permalinkStructure={type === 'PRODUCT' ? `${permalinkProductBase}/%postname%` : permalinkStructure}
          isLoading={isLoading}
          statusFilter={statusFilter}
          handleToggleSelectAll={handleToggleSelectAll}
          handleToggleSelectPost={handleToggleSelectPost}
          handleDeletePost={handleDeletePost}
        />

        {/* Page Pagination buttons bar */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          handlePageChange={handlePageChange}
          getPageNumbers={getPageNumbers}
        />
      </div>
    </div>
  );
}
