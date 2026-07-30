"use client";

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  handlePageChange: (pageNum: number) => void;
  getPageNumbers: () => number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  handlePageChange,
  getPageNumbers,
}: PaginationProps) {
  if (totalPages <= 1) {
    return (
      <div className="p-4 border-t border-slate-200 bg-slate-50/20 flex items-center justify-between text-xs text-slate-500 font-semibold">
        <span>Hiển thị {startIndex + 1}-{endIndex} trong tổng số {totalItems} mục</span>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-slate-200 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-semibold">
      <span>Hiển thị {startIndex + 1}-{endIndex} trong tổng số {totalItems} mục</span>
      
      <div className="flex items-center gap-1">
        {/* Previous page button */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-bold select-none"
        >
          Trước
        </button>
        
        {/* Page numbers */}
        {getPageNumbers().map((num, idx) => {
          if (num === -1) {
            return <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 select-none font-bold">...</span>;
          }
          return (
            <button
              key={`page-${num}`}
              type="button"
              onClick={() => handlePageChange(num)}
              className={`px-3 py-1.5 border rounded-lg transition-all font-bold select-none cursor-pointer ${
                currentPage === num
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/10'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-650'
              }`}
            >
              {num}
            </button>
          );
        })}
        
        {/* Next page button */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-bold select-none"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
