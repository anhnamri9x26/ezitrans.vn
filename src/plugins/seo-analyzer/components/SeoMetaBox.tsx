"use client";

import React, { useState } from 'react';
import { Settings, Eye, ArrowUpRight } from 'lucide-react';

interface SeoCheckItem {
  id: string;
  label: string;
  status: 'good' | 'improvement' | 'bad';
  message: string;
}

interface SeoMetaBoxProps {
  isSeoPluginEnabled: boolean;
  seoScore: number;
  readabilityScore: number;
  seoChecks: SeoCheckItem[];
  readabilityChecks: SeoCheckItem[];
  seoKeywords: string;
  setSeoKeywords: (val: string) => void;
  seoTitle: string;
  setSeoTitle: (val: string) => void;
  title: string;
  seoDescription: string;
  setSeoDescription: (val: string) => void;
  slug: string;
  onChangeTrigger?: () => void;
}

export default function SeoMetaBox({
  isSeoPluginEnabled,
  seoScore,
  readabilityScore,
  seoChecks,
  readabilityChecks,
  seoKeywords,
  setSeoKeywords,
  seoTitle,
  setSeoTitle,
  title,
  seoDescription,
  setSeoDescription,
  slug,
  onChangeTrigger
}: SeoMetaBoxProps) {
  const [activeSeoTab, setActiveSeoTab] = useState<'seo' | 'readability' | 'preview'>('seo');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [isGoodSeoExpanded, setIsGoodSeoExpanded] = useState(false);
  const [isGoodReadabilityExpanded, setIsGoodReadabilityExpanded] = useState(false);

  if (!isSeoPluginEnabled) return null;

  const handleFieldChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    if (onChangeTrigger) onChangeTrigger();
  };

  // Maps check IDs to DOM target selectors or input IDs
  const handleCheckClick = (checkId: string) => {
    // Map check ID → target element
    const targetMap: Record<string, { type: 'input' | 'editor'; selector: string }> = {
      // SEO checks → input fields
      'kw-title': { type: 'input', selector: '#seo-input-title' },
      'title-len': { type: 'input', selector: '#seo-input-title' },
      'kw-h1': { type: 'input', selector: '#seo-input-title' },
      'kw-desc': { type: 'input', selector: '#seo-input-description' },
      'desc-len': { type: 'input', selector: '#seo-input-description' },
      'no-keyword': { type: 'input', selector: '#seo-input-keywords' },
      'kw-slug': { type: 'input', selector: '#seo-input-slug' },
      // SEO checks → editor
      'kw-content': { type: 'editor', selector: '.ql-editor' },
      'kw-density': { type: 'editor', selector: '.ql-editor' },
      'kw-h2': { type: 'editor', selector: '.ql-editor' },
      'kw-h3': { type: 'editor', selector: '.ql-editor' },
      'kw-first-100': { type: 'editor', selector: '.ql-editor' },
      'kw-last-100': { type: 'editor', selector: '.ql-editor' },
      'content-len': { type: 'editor', selector: '.ql-editor' },
      'img-alt': { type: 'editor', selector: '.ql-editor' },
      'img-alt-kw': { type: 'editor', selector: '.ql-editor' },
      'img-count': { type: 'editor', selector: '.ql-editor' },
      'links': { type: 'editor', selector: '.ql-editor' },
      'links-internal': { type: 'editor', selector: '.ql-editor' },
      'links-external': { type: 'editor', selector: '.ql-editor' },
      // Readability checks → editor
      'word-count': { type: 'editor', selector: '.ql-editor' },
      'sentence-len': { type: 'editor', selector: '.ql-editor' },
      'headings-dist': { type: 'editor', selector: '.ql-editor' },
      'p-len': { type: 'editor', selector: '.ql-editor' },
      'transition': { type: 'editor', selector: '.ql-editor' },
      'avg-sentence': { type: 'editor', selector: '.ql-editor' },
      'list-usage': { type: 'editor', selector: '.ql-editor' },
    };

    const target = targetMap[checkId];
    if (!target) return;

    const el = document.querySelector(target.selector) as HTMLElement | null;
    if (!el) return;

    // Scroll into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (target.type === 'input') {
      // Focus the input
      setTimeout(() => {
        (el as HTMLInputElement | HTMLTextAreaElement).focus();
        el.classList.add('ring-2', 'ring-indigo-400', 'border-indigo-500');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-indigo-400', 'border-indigo-500');
        }, 2000);
      }, 300);
    } else {
      // Flash highlight the editor container
      const editorContainer = el.closest('.ql-container')?.parentElement;
      if (editorContainer) {
        editorContainer.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
        editorContainer.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.3)';
        editorContainer.style.borderColor = '#6366f1';
        setTimeout(() => {
          editorContainer.style.boxShadow = '';
          editorContainer.style.borderColor = '';
        }, 2000);
      }

      // Dispatch custom highlight event for the rich editor to handle deep highlighting
      const labelMap: Record<string, string> = {
        'sentence-len': 'Độ dài câu (>25 từ)',
        'p-len': 'Đoạn văn quá dài (>120 từ)',
        'list-usage': 'Danh sách thủ công',
        'transition': 'Từ chuyển tiếp',
        'avg-sentence': 'Độ dài câu trung bình',
        'word-count': 'Độ dài bài viết',
        'headings-dist': 'Phân nhóm tiêu đề',
        'kw-content': 'Từ khóa trong nội dung',
        'kw-density': 'Mật độ từ khóa',
        'kw-h2': 'H2 chứa từ khóa',
        'kw-h3': 'H3 chứa từ khóa',
        'kw-first-100': '100 từ đầu chứa từ khóa',
        'kw-last-100': '100 từ cuối chứa từ khóa',
        'content-len': 'Độ dài nội dung',
        'img-alt': 'Ảnh thiếu alt',
        'img-alt-kw': 'ALT ảnh chứa từ khóa',
        'img-count': 'Số lượng ảnh',
        'links': 'Liên kết',
        'links-internal': 'Liên kết nội bộ',
        'links-external': 'Liên kết ngoài'
      };
      
      const checkLabel = labelMap[checkId] || 'Lỗi bài viết';
      
      const event = new CustomEvent('trigger-seo-highlight', {
        detail: { checkId, label: checkLabel }
      });
      window.dispatchEvent(event);
    }
  };

  const isCheckClickable = (checkId: string) => {
    const editorCheckIds = [
      'kw-content', 'kw-density', 'kw-h2', 'kw-h3', 'kw-first-100', 'kw-last-100', 'content-len',
      'img-alt', 'img-alt-kw', 'img-count', 'links', 'links-internal', 'links-external',
      'word-count', 'sentence-len', 'headings-dist', 'p-len', 'transition', 'avg-sentence', 'list-usage'
    ];
    const inputCheckIds = ['kw-title', 'title-len', 'kw-h1', 'kw-desc', 'desc-len', 'no-keyword', 'kw-slug'];
    return [...inputCheckIds, ...editorCheckIds].includes(checkId);
  };

  const renderChecklistGroup = (
    checks: SeoCheckItem[],
    isExpanded: boolean,
    setIsExpanded: (val: boolean) => void,
    titleLabel: string
  ) => {
    const badChecks = checks.filter(c => c.status === 'bad');
    const warningChecks = checks.filter(c => c.status === 'improvement');
    const goodChecks = checks.filter(c => c.status === 'good');

    const actionRequired = [...badChecks, ...warningChecks];

    return (
      <div className="space-y-4 w-full">
        <h4 className="font-extrabold text-slate-700 text-xs mb-1.5 uppercase tracking-wider">{titleLabel}</h4>

        {/* 1. Needs Improvement (Errors & Warnings) */}
        {actionRequired.length > 0 ? (
          <div className="space-y-2.5">
            <h5 className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 text-rose-500 mt-2">
              <span className="w-1.5 h-3.5 bg-rose-500 rounded-full" />
              Cần cải thiện ({actionRequired.length})
            </h5>
            <div className="space-y-1 bg-rose-50/10 border border-rose-100/50 rounded-xl p-3">
              {actionRequired.map((check, idx) => renderCheckItem(check, idx))}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-scale-up">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-md">✓</span>
            Tuyệt vời! Trang đã đáp ứng toàn bộ mọi yêu cầu tối ưu quan trọng.
          </div>
        )}

        {/* 2. Success Items (Collapsible 2-Column Grid) */}
        {goodChecks.length > 0 && (
          <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/70 hover:bg-slate-100/80 text-[11px] font-extrabold text-slate-600 transition-colors border-none outline-none cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-extrabold shadow-sm">✓</span>
                Đã đạt yêu cầu ({goodChecks.length} tiêu chí)
              </span>
              <span className="text-[10px] text-indigo-650 hover:text-indigo-755 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-md transition-all font-extrabold">
                {isExpanded ? 'Thu gọn ▲' : 'Xem chi tiết ▼'}
              </span>
            </button>
            {isExpanded && (
              <div className="p-3.5 bg-white border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 transition-all duration-300 animate-fade-in max-h-[350px] overflow-y-auto scrollbar-thin">
                {goodChecks.map((check, idx) => {
                  const clickable = isCheckClickable(check.id);
                  return (
                    <div 
                      key={idx} 
                      onClick={clickable ? () => handleCheckClick(check.id) : undefined}
                      className={`flex items-start gap-2.5 p-2 rounded-lg transition-all duration-200 border border-transparent ${
                        clickable
                          ? 'cursor-pointer hover:bg-slate-50 hover:border-slate-100/80 group'
                          : ''
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-650 border border-emerald-100 flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5 shadow-sm">✓</span>
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-slate-700 text-[11px] group-hover:text-indigo-600 transition-colors truncate">{check.label}</span>
                        <span className="block text-[9.5px] text-slate-400 mt-0.5 leading-normal font-medium whitespace-pre-wrap">{check.message}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCheckItem = (check: SeoCheckItem, idx: number) => {
    const isClickable = isCheckClickable(check.id);
    const editorCheckIds = [
      'kw-content', 'kw-density', 'kw-h2', 'kw-h3', 'kw-first-100', 'kw-last-100', 'content-len',
      'img-alt', 'img-alt-kw', 'img-count', 'links', 'links-internal', 'links-external',
      'word-count', 'sentence-len', 'headings-dist', 'p-len', 'transition', 'avg-sentence', 'list-usage'
    ];
    const isEditorCheck = editorCheckIds.includes(check.id);

    return (
      <div
        key={idx}
        onClick={isClickable ? () => handleCheckClick(check.id) : undefined}
        className={`flex items-start gap-2.5 text-xs font-medium border-b border-slate-50 pb-2 last:border-0 rounded-md px-2 py-1.5 -mx-2 transition-all ${
          isClickable
            ? 'cursor-pointer hover:bg-slate-50 group'
            : ''
        }`}
      >
        <span className={`w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold text-white mt-0.5 ${
          check.status === 'good' ? 'bg-emerald-500' : check.status === 'improvement' ? 'bg-amber-500' : 'bg-rose-500'
        }`}>
          {check.status === 'good' ? '✓' : check.status === 'improvement' ? '!' : '✗'}
        </span>
        <div className="flex-1">
          <span className="block font-bold text-slate-855 text-[11.5px]">{check.label}</span>
          <span className="block text-[10.5px] text-slate-500 mt-0.5 font-medium leading-relaxed">{check.message}</span>
        </div>
        {isClickable && check.status !== 'good' && (
          isEditorCheck ? (
            <div className="flex items-center gap-1 shrink-0 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity" title="Tô màu lỗi trong văn bản">
              <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1 py-0.5 rounded hidden group-hover:inline animate-fade-in">Tô màu</span>
              <Eye size={13} className="text-slate-400 group-hover:text-indigo-500 hover:scale-110 transition-all cursor-pointer" />
            </div>
          ) : (
            <div className="flex items-center gap-1 shrink-0 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity" title="Đi tới ô nhập liệu">
              <ArrowUpRight size={13} className="text-slate-400 group-hover:text-indigo-500 hover:scale-110 transition-all cursor-pointer" />
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mt-8 animate-fade-in space-y-5">
      <h3 className="text-sm font-black mb-1 border-b border-slate-100 pb-3 flex items-center gap-2 text-slate-800">
        <Settings size={16} className="text-emerald-500 animate-spin-slow" /> Tối ưu SEO & Readability (Yoast Premium)
      </h3>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-1 bg-slate-50/50 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setActiveSeoTab('seo')}
          className={`flex items-center gap-1.5 py-2 px-4 rounded-md transition-all cursor-pointer ${
            activeSeoTab === 'seo'
              ? 'bg-white text-slate-850 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${
            seoScore >= 80 ? 'bg-emerald-500' : seoScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
          }`} />
          Tối ưu SEO ({seoScore}/100)
        </button>
        <button
          type="button"
          onClick={() => setActiveSeoTab('readability')}
          className={`flex items-center gap-1.5 py-2 px-4 rounded-md transition-all cursor-pointer ${
            activeSeoTab === 'readability'
              ? 'bg-white text-slate-855 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${
            readabilityScore >= 80 ? 'bg-emerald-500' : readabilityScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
          }`} />
          Tính dễ đọc ({readabilityScore}/100)
        </button>
        <button
          type="button"
          onClick={() => setActiveSeoTab('preview')}
          className={`flex items-center gap-1.5 py-2 px-4 rounded-md transition-all cursor-pointer ${
            activeSeoTab === 'preview'
              ? 'bg-white text-slate-855 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye size={13} className="text-slate-400" />
          Xem trước trên Google
        </button>
      </div>

      {/* Tab Contents */}
      <div className="py-2">
        {/* ──── TAB 1: SEO ANALYSIS ──── */}
        {activeSeoTab === 'seo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Score Wheel */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-slate-200 fill-none" strokeWidth="6" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className={`fill-none transition-all duration-500 ${
                      seoScore >= 80 ? 'stroke-emerald-500' : seoScore >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'
                    }`}
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - seoScore / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-base font-black text-slate-800">{seoScore}%</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">Điểm SEO</span>
            </div>

            {/* Checklist */}
            <div className="lg:col-span-9">
              {renderChecklistGroup(seoChecks, isGoodSeoExpanded, setIsGoodSeoExpanded, 'Đánh giá từ khóa & Meta')}
            </div>
          </div>
        )}

        {/* ──── TAB 2: READABILITY ──── */}
        {activeSeoTab === 'readability' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Score Wheel */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-slate-200 fill-none" strokeWidth="6" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className={`fill-none transition-all duration-500 ${
                      readabilityScore >= 80 ? 'stroke-emerald-500' : readabilityScore >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'
                    }`}
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - readabilityScore / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-base font-black text-slate-800">{readabilityScore}%</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">Đọc hiểu</span>
            </div>

            {/* Checklist */}
            <div className="lg:col-span-9">
              {renderChecklistGroup(readabilityChecks, isGoodReadabilityExpanded, setIsGoodReadabilityExpanded, 'Đánh giá tính dễ đọc bài viết')}
            </div>
          </div>
        )}

        {/* ──── TAB 3: GOOGLE PREVIEW SIMULATOR ──── */}
        {activeSeoTab === 'preview' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600">Bản xem trước kết quả tìm kiếm (Google SERP)</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    previewDevice === 'mobile' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-655 hover:bg-slate-300'
                  }`}
                >
                  Di động
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    previewDevice === 'desktop' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-655 hover:bg-slate-300'
                  }`}
                >
                  Máy tính
                </button>
              </div>
            </div>

            {/* Google Simulator Card */}
            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm font-sans">
              <div className={previewDevice === 'mobile' ? 'max-w-[360px] mx-auto border-x border-slate-100 px-3' : 'max-w-[600px]'}>
                <div className="flex items-center gap-1.5 text-xs text-[#202124] mb-1">
                  <span className="bg-[#f1f3f4] w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold text-[#5f6368] text-[9px]">E</span>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#202124] font-medium leading-none">lexi.vn</span>
                    <span className="text-[10px] text-[#5f6368] leading-none mt-0.5">https://lexi.vn &gt; {slug || 'slug-bai-viet'}</span>
                  </div>
                </div>
                <h4 className={`text-[#1a0dab] font-normal hover:underline leading-tight ${
                  previewDevice === 'mobile' ? 'text-[16px]' : 'text-[20px] mb-1'
                }`}>
                  {seoTitle || title || 'Vui lòng nhập tiêu đề bài viết...'}
                </h4>
                <p className="text-[12.5px] text-[#4d5156] leading-relaxed mt-1.5 font-normal">
                  {seoDescription || 'Hãy nhập thẻ mô tả Meta Description để xem trước đoạn trích hiển thị trên Google ở đây...'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Forms */}
      <div className="space-y-4 text-[13px] pt-5 border-t border-slate-200/60">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Cụm từ khóa chính</label>
            <input
              id="seo-input-keywords"
              type="text" 
              value={seoKeywords}
              onChange={(e) => handleFieldChange(setSeoKeywords, e.target.value)}
              placeholder="Nhập từ khóa tối ưu bài viết..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none bg-white font-medium text-slate-700" 
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block font-bold text-slate-700">Tiêu đề SEO</label>
              <span className={`text-[10px] font-bold ${
                (seoTitle || title || '').length >= 40 && (seoTitle || title || '').length <= 60 
                  ? 'text-emerald-600' 
                  : 'text-slate-400'
              }`}>
                {(seoTitle || title || '').length} ký tự (Khuyên dùng: 40-60)
              </span>
            </div>
            <input
              id="seo-input-title"
              type="text" 
              value={seoTitle || title}
              onChange={(e) => handleFieldChange(setSeoTitle, e.target.value)}
              placeholder="Mặc định lấy theo tiêu đề bài viết"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-brand-500/80 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none bg-white font-medium text-slate-700" 
            />
            {/* Visual Progress Bar for title character count */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full transition-all duration-300 ${
                  (seoTitle || title || '').length >= 40 && (seoTitle || title || '').length <= 60
                    ? 'bg-emerald-500'
                    : (seoTitle || title || '').length > 60
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, ((seoTitle || title || '').length / 75) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block font-bold text-slate-700">Thẻ mô tả (Meta Description)</label>
            <span className={`text-[10px] font-bold ${
              seoDescription.length >= 120 && seoDescription.length <= 160 
                ? 'text-emerald-600' 
                : 'text-slate-400'
            }`}>
              {seoDescription.length} ký tự (Khuyên dùng: 120-160)
            </span>
          </div>
          <textarea
            id="seo-input-description"
            value={seoDescription}
            onChange={(e) => handleFieldChange(setSeoDescription, e.target.value)}
            placeholder="Mô tả ngắn hiển thị trên kết quả tìm kiếm..."
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none resize-none bg-white font-medium text-slate-700" 
            rows={3}
          />
          {/* Visual Progress Bar for character count */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-300 ${
                seoDescription.length >= 120 && seoDescription.length <= 160
                  ? 'bg-emerald-500'
                  : seoDescription.length > 160
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, (seoDescription.length / 180) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
