import React, { useEffect, useRef, useState } from 'react';
import { Database, Image as ImageIcon, Settings, Wrench, X } from 'lucide-react';
import { getDynamicFieldLabel } from './utils';
import type { DynamicInputProps } from './types';

export const DynamicInput: React.FC<DynamicInputProps> = ({
  label,
  type,
  value,
  onChange,
  dynamicConfig,
  onDynamicChange,
  linkSettings,
  onLinkSettingsChange,
  placeholder,
  onOpenMedia,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLinkSettings, setShowLinkSettings] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowLinkSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectField = (source: string, field: string) => {
    onDynamicChange({
      enabled: true,
      source,
      field,
      before: dynamicConfig?.before || '',
      after: dynamicConfig?.after || '',
      fallback: dynamicConfig?.fallback || '',
    });
    setShowDropdown(false);
  };

  const handleClearDynamic = () => {
    onDynamicChange({
      enabled: false,
      source: '',
      field: '',
      before: '',
      after: '',
      fallback: '',
    });
    setShowAdvanced(false);
  };

  const handleAdvancedChange = (key: string, val: string) => {
    onDynamicChange({
      ...dynamicConfig,
      [key]: val,
    });
  };

  const isDynamic = Boolean(dynamicConfig?.enabled);

  return (
    <div ref={containerRef} className="space-y-1.5 relative w-full font-sans">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      </div>

      {isDynamic ? (
        <div className="space-y-1.5 w-full">
          <div className="flex items-center justify-between w-full h-8 px-2.5 bg-brand-50/40 border border-brand-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-brand-50/60">
            <button
              type="button"
              onClick={() => setShowAdvanced(prev => !prev)}
              className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 transition-colors font-semibold"
              title="Cài đặt nâng cao"
            >
              <Wrench size={11} className="text-brand-500" />
              <span>{getDynamicFieldLabel(dynamicConfig?.source || '', dynamicConfig?.field || '')}</span>
            </button>
            <div className="flex items-center gap-1.5">
              {type === 'link' && (
                <button
                  type="button"
                  onClick={() => setShowLinkSettings(prev => !prev)}
                  className={`text-slate-400 hover:text-brand-500 transition-colors ${showLinkSettings ? 'text-brand-500' : ''}`}
                  title="Cài đặt liên kết"
                >
                  <Settings size={11} />
                </button>
              )}
              <button
                type="button"
                onClick={handleClearDynamic}
                className="text-slate-400 hover:text-rose-500 transition-colors"
                title="Xóa liên kết động"
              >
                <X size={11} />
              </button>
            </div>
          </div>

          {showLinkSettings && type === 'link' && (
            <div className="absolute right-0 top-16 z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 p-3 w-[220px] text-slate-700 font-sans animate-scale-up space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-[9px] uppercase tracking-wider text-slate-500">Tùy chọn liên kết</span>
                <button type="button" onClick={() => setShowLinkSettings(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={10} />
                </button>
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(linkSettings?.openInNewWindow)}
                  onChange={(e) => onLinkSettingsChange?.({ ...linkSettings, openInNewWindow: e.target.checked })}
                  className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
                />
                <span className="text-[10px] font-semibold text-slate-600">Mở trong cửa sổ mới</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(linkSettings?.nofollow)}
                  onChange={(e) => onLinkSettingsChange?.({ ...linkSettings, nofollow: e.target.checked })}
                  className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
                />
                <span className="text-[10px] font-semibold text-slate-600">Thêm nofollow</span>
              </label>
              
              <div className="space-y-1">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Thuộc tính tùy chỉnh</span>
                <textarea
                  value={linkSettings?.customAttributes || ''}
                  onChange={(e) => onLinkSettingsChange?.({ ...linkSettings, customAttributes: e.target.value })}
                  rows={2}
                  placeholder="Ví dụ: role|button (mỗi dòng 1 thuộc tính)"
                  className="w-full p-1.5 border border-slate-200 rounded text-[10px] font-mono outline-none focus:border-brand-500 resize-none"
                />
              </div>
            </div>
          )}

          {showAdvanced && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 animate-slide-down shadow-inner text-[10px]">
              <div className="font-bold text-slate-500 uppercase tracking-wider mb-1">Thiết lập nâng cao</div>
              <div className="space-y-1">
                <label className="block text-slate-600 font-bold">Trước (Before)</label>
                <input
                  type="text"
                  value={dynamicConfig?.before || ''}
                  onChange={(e) => handleAdvancedChange('before', e.target.value)}
                  className="w-full px-2 py-1 border border-slate-200 rounded bg-white outline-none focus:border-brand-500 text-xs"
                  placeholder="Ví dụ: Giá: "
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 font-bold">Sau (After)</label>
                <input
                  type="text"
                  value={dynamicConfig?.after || ''}
                  onChange={(e) => handleAdvancedChange('after', e.target.value)}
                  className="w-full px-2 py-1 border border-slate-200 rounded bg-white outline-none focus:border-brand-500 text-xs"
                  placeholder="Ví dụ: VNĐ"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-600 font-bold">Dự phòng (Fallback)</label>
                <input
                  type="text"
                  value={dynamicConfig?.fallback || ''}
                  onChange={(e) => handleAdvancedChange('fallback', e.target.value)}
                  className="w-full px-2 py-1 border border-slate-200 rounded bg-white outline-none focus:border-brand-500 text-xs"
                  placeholder="Giá trị hiển thị nếu dữ liệu rỗng"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          {type === 'textarea' ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              placeholder={placeholder}
              className="w-full pr-8 pl-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-brand-500 text-slate-700 text-xs font-medium bg-white"
            />
          ) : type === 'image' ? (
            value ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group aspect-video pr-8">
                <img src={value} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => onOpenMedia?.(onChange)}
                    className="px-2 py-1 bg-white text-slate-800 rounded text-[10px] font-bold shadow cursor-pointer hover:bg-slate-50"
                  >
                    Thay đổi
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenMedia?.(onChange)}
                className="w-full h-20 border border-dashed border-slate-300 hover:border-brand-500 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-1 transition-all cursor-pointer bg-slate-50/50"
              >
                <ImageIcon size={16} />
                <span className="text-[10px] font-bold">Chọn ảnh từ thư viện</span>
              </button>
            )
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={`w-full pl-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-brand-500 text-slate-700 text-xs font-medium bg-white ${
                type === 'link' ? 'pr-14' : 'pr-8'
              }`}
            />
          )}

          {/* Icons overlay */}
          {type === 'image' ? (
            <div className="absolute right-2 top-2 z-10 flex items-center">
              <button
                type="button"
                onClick={() => setShowDropdown(prev => !prev)}
                className={`text-slate-400 hover:text-brand-500 transition-colors ${showDropdown ? 'text-brand-500' : ''}`}
                title="Dữ liệu động"
              >
                <Database size={11} />
              </button>
            </div>
          ) : type === 'link' ? (
            <div className="absolute right-2 top-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowLinkSettings(prev => !prev)}
                className={`text-slate-400 hover:text-brand-500 transition-colors ${showLinkSettings ? 'text-brand-500' : ''}`}
                title="Cài đặt liên kết"
              >
                <Settings size={11} />
              </button>
              <button
                type="button"
                onClick={() => setShowDropdown(prev => !prev)}
                className={`text-slate-400 hover:text-brand-500 transition-colors ${showDropdown ? 'text-brand-500' : ''}`}
                title="Dữ liệu động"
              >
                <Database size={11} />
              </button>
            </div>
          ) : (
            <div className="absolute right-2 top-2">
              <button
                type="button"
                onClick={() => setShowDropdown(prev => !prev)}
                className={`text-slate-400 hover:text-brand-500 transition-colors ${showDropdown ? 'text-brand-500' : ''}`}
                title="Dữ liệu động"
              >
                <Database size={11} />
              </button>
            </div>
          )}

          {showLinkSettings && type === 'link' && (
            <div className="absolute right-0 top-8 z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 p-3 w-[220px] text-slate-700 font-sans animate-scale-up space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-[9px] uppercase tracking-wider text-slate-500">Tùy chọn liên kết</span>
                <button type="button" onClick={() => setShowLinkSettings(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={10} />
                </button>
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(linkSettings?.openInNewWindow)}
                  onChange={(e) => onLinkSettingsChange?.({ ...linkSettings, openInNewWindow: e.target.checked })}
                  className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
                />
                <span className="text-[10px] font-semibold text-slate-600">Mở trong cửa sổ mới</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(linkSettings?.nofollow)}
                  onChange={(e) => onLinkSettingsChange?.({ ...linkSettings, nofollow: e.target.checked })}
                  className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
                />
                <span className="text-[10px] font-semibold text-slate-600">Thêm nofollow</span>
              </label>
              
              <div className="space-y-1">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Thuộc tính tùy chỉnh</span>
                <textarea
                  value={linkSettings?.customAttributes || ''}
                  onChange={(e) => onLinkSettingsChange?.({ ...linkSettings, customAttributes: e.target.value })}
                  rows={2}
                  placeholder="Ví dụ: role|button (mỗi dòng 1 thuộc tính)"
                  className="w-full p-1.5 border border-slate-200 rounded text-[10px] font-mono outline-none focus:border-brand-500 resize-none"
                />
              </div>
            </div>
          )}

          {showDropdown && (
            <div className="absolute right-0 top-8 z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 w-[220px] text-slate-700 font-sans animate-scale-up max-h-[300px] overflow-y-auto custom-scrollbar">
              <div className="px-2.5 pb-1 mb-1 border-b border-slate-100 text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400">Chọn dữ liệu động</div>
              
              <div className="space-y-0.5">
                {/* 1. POST */}
                <div className="px-2.5 py-0.5 text-[8.5px] font-black text-brand-600 uppercase bg-brand-50/50">Bài viết (Post)</div>
                <button type="button" onClick={() => handleSelectField('post', 'title')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tiêu đề bài viết</button>
                <button type="button" onClick={() => handleSelectField('post', 'content')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Nội dung bài viết</button>
                <button type="button" onClick={() => handleSelectField('post', 'excerpt')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Mô tả ngắn</button>
                <button type="button" onClick={() => handleSelectField('post', 'slug')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Slug bài viết</button>
                <button type="button" onClick={() => handleSelectField('post', 'url')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">URL bài viết</button>
                <button type="button" onClick={() => handleSelectField('post', 'id')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">ID bài viết</button>
                <button type="button" onClick={() => handleSelectField('post', 'status')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Trạng thái bài viết</button>
                <button type="button" onClick={() => handleSelectField('post', 'publishedAt')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ngày xuất bản</button>
                <button type="button" onClick={() => handleSelectField('post', 'modifiedAt')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ngày cập nhật</button>
                <button type="button" onClick={() => handleSelectField('post', 'featuredImage')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ảnh đại diện bài viết</button>

                {/* 2. AUTHOR */}
                <div className="px-2.5 py-0.5 text-[8.5px] font-black text-rose-600 uppercase bg-rose-50/50 mt-1">Tác giả (Author)</div>
                <button type="button" onClick={() => handleSelectField('author', 'name')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tên tác giả</button>
                <button type="button" onClick={() => handleSelectField('author', 'displayName')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tên hiển thị tác giả</button>
                <button type="button" onClick={() => handleSelectField('author', 'email')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Email tác giả</button>
                <button type="button" onClick={() => handleSelectField('author', 'bio')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Giới thiệu tác giả</button>
                <button type="button" onClick={() => handleSelectField('author', 'avatar')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Avatar tác giả</button>
                <button type="button" onClick={() => handleSelectField('author', 'url')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">URL tác giả</button>

                {/* 3. TAXONOMY */}
                <div className="px-2.5 py-0.5 text-[8.5px] font-black text-cyan-600 uppercase bg-cyan-50/50 mt-1">Phân loại (Taxonomy)</div>
                <button type="button" onClick={() => handleSelectField('category', 'name')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tên chuyên mục</button>
                <button type="button" onClick={() => handleSelectField('category', 'description')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Mô tả chuyên mục</button>
                <button type="button" onClick={() => handleSelectField('category', 'url')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">URL chuyên mục</button>
                <button type="button" onClick={() => handleSelectField('tag', 'name')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tên thẻ (Tag)</button>
                <button type="button" onClick={() => handleSelectField('tag', 'url')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">URL thẻ (Tag)</button>

                {/* 4. SITE */}
                <div className="px-2.5 py-0.5 text-[8.5px] font-black text-indigo-600 uppercase bg-indigo-50/50 mt-1">Website (Site)</div>
                <button type="button" onClick={() => handleSelectField('site', 'title')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tên trang web</button>
                <button type="button" onClick={() => handleSelectField('site', 'tagline')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Mô tả trang web</button>
                <button type="button" onClick={() => handleSelectField('site', 'url')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">URL trang web</button>
                <button type="button" onClick={() => handleSelectField('site', 'logo')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Logo trang web</button>
                <button type="button" onClick={() => handleSelectField('site', 'email')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Email liên hệ</button>
                <button type="button" onClick={() => handleSelectField('site', 'phone')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Số điện thoại</button>
                
                {/* 5. CURRENT USER & LEARNING */}
                <div className="px-2.5 py-0.5 text-[8.5px] font-black text-amber-600 uppercase bg-amber-50/50 mt-1">Thành viên & Học tập</div>
                <button type="button" onClick={() => handleSelectField('user', 'name')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tên hiển thị</button>
                <button type="button" onClick={() => handleSelectField('user', 'email')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Email thành viên</button>
                <button type="button" onClick={() => handleSelectField('user', 'avatar')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ảnh đại diện</button>
                <button type="button" onClick={() => handleSelectField('user', 'role')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Vai trò</button>
                <button type="button" onClick={() => handleSelectField('user', 'id')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">ID thành viên</button>
                <button type="button" onClick={() => handleSelectField('user', 'xp')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Điểm tích lũy (XP)</button>
                <button type="button" onClick={() => handleSelectField('user', 'streak')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Chuỗi ngày học</button>
                <button type="button" onClick={() => handleSelectField('user', 'level')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Cấp độ học viên</button>
                <button type="button" onClick={() => handleSelectField('user', 'band')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Band hiện tại</button>
                <button type="button" onClick={() => handleSelectField('user', 'targetBand')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Band mục tiêu</button>
                <button type="button" onClick={() => handleSelectField('user', 'completedLessons')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Bài học đã làm</button>
                <button type="button" onClick={() => handleSelectField('user', 'completedTests')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Bài thi đã làm</button>
                <button type="button" onClick={() => handleSelectField('user', 'studyTime')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Thời gian học</button>

                {/* 6. DATE & TIME */}
                <div className="px-2.5 py-0.5 text-[8.5px] font-black text-purple-600 uppercase bg-purple-50/50 mt-1">Thời gian (Date & Time)</div>
                <button type="button" onClick={() => handleSelectField('dateTime', 'currentDate')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ngày hiện tại</button>
                <button type="button" onClick={() => handleSelectField('dateTime', 'currentTime')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Giờ hiện tại</button>
                <button type="button" onClick={() => handleSelectField('dateTime', 'currentYear')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Năm hiện tại</button>
                <button type="button" onClick={() => handleSelectField('dateTime', 'currentMonth')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tháng hiện tại</button>

                {/* 7. REQUEST / URL */}
                <div className="px-2.5 py-0.5 text-[8.5px] font-black text-orange-600 uppercase bg-orange-50/50 mt-1">Yêu cầu (Request / URL)</div>
                <button type="button" onClick={() => handleSelectField('request', 'url')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">URL hiện tại</button>
                <button type="button" onClick={() => handleSelectField('request', 'path')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Path hiện tại</button>
                <button type="button" onClick={() => handleSelectField('request', 'query')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Query String hiện tại</button>
                <button type="button" onClick={() => handleSelectField('request', 'referrer')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Referrer URL</button>

                {/* 8. SEO */}
                <div className="px-2.5 py-0.5 text-[8.5px] font-black text-emerald-600 uppercase bg-emerald-50/50 mt-1">SEO</div>
                <button type="button" onClick={() => handleSelectField('seo', 'title')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Tiêu đề SEO</button>
                <button type="button" onClick={() => handleSelectField('seo', 'description')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Mô tả SEO</button>
                <button type="button" onClick={() => handleSelectField('seo', 'canonicalUrl')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Đường dẫn Canonical</button>
                <button type="button" onClick={() => handleSelectField('seo', 'ogImage')} className="w-full text-left px-4 py-1 text-[11px] hover:bg-slate-50 transition-colors font-medium">Ảnh Open Graph</button>

                {/* 9. CUSTOM FIELDS */}
                <div className="px-2.5 py-0.5 text-[8.5px] font-black text-blue-600 uppercase bg-blue-50/50 mt-1">Trường tùy biến</div>
                <div className="px-2 pb-1 bg-slate-50/80 pt-1.5 space-y-1 border-t border-slate-100">
                  <span className="block text-[8px] font-extrabold text-slate-400 uppercase px-1">Gợi ý nhanh</span>
                  <div className="flex flex-wrap gap-1 px-1 mb-1">
                    <button type="button" onClick={() => handleSelectField('custom_field', 'course_price')} className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 hover:text-brand-500 font-medium">Giá</button>
                    <button type="button" onClick={() => handleSelectField('custom_field', 'course_level')} className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 hover:text-brand-500 font-medium">Trình độ</button>
                    <button type="button" onClick={() => handleSelectField('custom_field', 'teacher_name')} className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 hover:text-brand-500 font-medium">Tên GV</button>
                    <button type="button" onClick={() => handleSelectField('custom_field', 'teacher_avatar')} className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 hover:text-brand-500 font-medium">Ảnh GV</button>
                    <button type="button" onClick={() => handleSelectField('custom_field', 'duration')} className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 hover:text-brand-500 font-medium">Thời lượng</button>
                  </div>
                  
                  <span className="block text-[8px] font-extrabold text-slate-400 uppercase px-1">Nhập khóa tùy chỉnh</span>
                  <input
                    type="text"
                    placeholder="Nhập Key..."
                    id="custom-field-key-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          handleSelectField('custom_field', val);
                        }
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-1.5 py-0.5 border border-slate-200 rounded bg-white text-[10px] outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = document.getElementById('custom-field-key-input') as HTMLInputElement | null;
                      const val = input?.value.trim();
                      if (val) {
                        handleSelectField('custom_field', val);
                      }
                    }}
                    className="w-full py-0.5 bg-brand-500 text-white rounded text-[9px] font-bold text-center hover:bg-brand-600 transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}