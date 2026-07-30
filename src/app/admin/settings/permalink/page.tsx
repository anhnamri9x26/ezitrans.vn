"use client";

import React, { useState, useEffect } from 'react';
import { Save, Link as LinkIcon, AlertTriangle, X } from 'lucide-react';

export default function AdminPermalinkSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Permalink states
  const [permalinkStructure, setPermalinkStructure] = useState('/%postname%.html');
  const [customStructure, setCustomStructure] = useState('/%postname%.html');
  const [permalinkCategoryBase, setPermalinkCategoryBase] = useState('category');
  const [permalinkTagBase, setPermalinkTagBase] = useState('tag');
  const [permalinkProductBase, setPermalinkProductBase] = useState('/san-pham/');
  const [permalinkProductCategoryBase, setPermalinkProductCategoryBase] = useState('danh-muc-san-pham');
  
  // Track original permalink and modal visibility state
  const [originalPermalinkStructure, setOriginalPermalinkStructure] = useState('');
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  // Other general settings to preserve when saving
  const [siteTitle, setSiteTitle] = useState('');
  const [siteTagline, setSiteTagline] = useState('');
  const [siteEmail, setSiteEmail] = useState('');
  const [defaultCategoryId, setDefaultCategoryId] = useState('');
  const [siteLanguage, setSiteLanguage] = useState('');
  const [dateFormat, setDateFormat] = useState('');
  const [dateFormatCustom, setDateFormatCustom] = useState('');
  const [timeFormat, setTimeFormat] = useState('');
  const [timeFormatCustom, setTimeFormatCustom] = useState('');
  const [startOfWeek, setStartOfWeek] = useState('');
  const [siteLogo, setSiteLogo] = useState('');
  const [siteLogoId, setSiteLogoId] = useState('');
  const [siteFavicon, setSiteFavicon] = useState('');
  const [siteFaviconId, setSiteFaviconId] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.settings) {
          const s = data.settings;
          // Preserve general settings
          if (s.site_title) setSiteTitle(s.site_title);
          if (s.site_tagline) setSiteTagline(s.site_tagline);
          if (s.site_email) setSiteEmail(s.site_email);
          if (s.default_category_id) setDefaultCategoryId(s.default_category_id);
          if (s.site_language) setSiteLanguage(s.site_language);
          if (s.date_format) setDateFormat(s.date_format);
          if (s.date_format_custom) setDateFormatCustom(s.date_format_custom);
          if (s.time_format) setTimeFormat(s.time_format);
          if (s.time_format_custom) setTimeFormatCustom(s.time_format_custom);
          if (s.start_of_week) setStartOfWeek(s.start_of_week);
          if (s.site_logo) setSiteLogo(s.site_logo);
          if (s.site_logo_id) setSiteLogoId(s.site_logo_id);
          if (s.site_favicon) setSiteFavicon(s.site_favicon);
          if (s.site_favicon_id) setSiteFaviconId(s.site_favicon_id);

          // Permalink mapping
          if (s.permalink_structure) {
            const pStr = s.permalink_structure;
            setOriginalPermalinkStructure(pStr);
            const builtInStructures = [
              '/?p=%post_id%',
              '/%year%/%monthnum%/%day%/%postname%/',
              '/%year%/%monthnum%/%postname%/',
              '/archives/%post_id%',
              '/%postname%/'
            ];
            
            if (builtInStructures.includes(pStr) || pStr === '/%postname%.html') {
              setPermalinkStructure(pStr);
            } else {
              setPermalinkStructure('custom');
              setCustomStructure(pStr);
            }
          }
          if (s.permalink_category_base) setPermalinkCategoryBase(s.permalink_category_base);
          if (s.permalink_tag_base) setPermalinkTagBase(s.permalink_tag_base);
          if (s.permalink_product_base) setPermalinkProductBase(s.permalink_product_base);
          if (s.permalink_product_category_base) setPermalinkProductCategoryBase(s.permalink_product_category_base);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const saveSettings = async (activeStructure: string) => {
    setIsSaving(true);
    setIsWarningModalOpen(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_title: siteTitle,
          site_tagline: siteTagline,
          site_email: siteEmail,
          default_category_id: defaultCategoryId,
          site_language: siteLanguage,
          date_format: dateFormat,
          date_format_custom: dateFormatCustom,
          time_format: timeFormat,
          time_format_custom: timeFormatCustom,
          start_of_week: startOfWeek,
          site_logo: siteLogo,
          site_logo_id: siteLogoId,
          site_favicon: siteFavicon,
          site_favicon_id: siteFaviconId,
          permalink_structure: activeStructure,
          permalink_category_base: permalinkCategoryBase,
          permalink_tag_base: permalinkTagBase,
          permalink_product_base: permalinkProductBase,
          permalink_product_category_base: permalinkProductCategoryBase
        })
      });

      const data = await res.json();
      if (data.success) {
        setOriginalPermalinkStructure(activeStructure); // update baseline
        alert('Đã lưu thay đổi cấu trúc đường dẫn thành công!');
        window.location.reload(); // Reload immediately to apply dynamic branding or language changes in sidebar layout
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeStructure = permalinkStructure === 'custom' ? customStructure : permalinkStructure;
    
    // Only show warning modal if the permalink structure is actually changing!
    if (activeStructure !== originalPermalinkStructure) {
      setIsWarningModalOpen(true);
    } else {
      await saveSettings(activeStructure);
    }
  };

  const insertTag = (tag: string) => {
    setPermalinkStructure('custom');
    if (!customStructure.includes(tag)) {
      setCustomStructure(prev => {
        const base = prev.endsWith('/') ? prev.slice(0, -1) : prev;
        return base + '/' + tag;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-medium animate-pulse text-xs">Đang tải cấu hình cài đặt...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveSettings} className="max-w-4xl mx-auto font-sans pb-12 text-xs">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <LinkIcon className="text-slate-600" size={24} /> Cấu trúc đường dẫn
          </h1>
          <p className="text-slate-500 text-xs mt-1">Cấu hình các tham số và cấu trúc đường dẫn cố định (Permalinks) tối ưu hóa cho SEO.</p>
        </div>
        <button 
          type="submit"
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-indigo-500/20 active:translate-y-0.5 disabled:opacity-50 cursor-pointer border-none outline-none text-xs"
        >
          <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="space-y-8">
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
            <LinkIcon size={18} className="text-indigo-500" /> Cấu trúc đường dẫn cố định (Permalinks)
          </h2>
          
          <div className="space-y-6">
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              Chọn cấu trúc đường dẫn cố định cho trang web của bạn. Thiết lập này giúp tạo ra các URL thân thiện với SEO, tăng thứ hạng bài viết và giữ nguyên đường dẫn khi di chuyển từ WordPress.
            </p>
            
            <div className="space-y-3 max-w-4xl">
              {/* Option 1: Plain /?p=123 */}
              <label className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/50 transition-colors">
                <input 
                  type="radio" 
                  name="permalink" 
                  value="/?p=%post_id%"
                  checked={permalinkStructure === '/?p=%post_id%'}
                  onChange={(e) => setPermalinkStructure(e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                />
                <div className="flex-1">
                  <span className="block font-bold text-slate-800">Mặc định (Plain)</span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">https://lexi.vn/?p=123</span>
                </div>
              </label>

              {/* Option 2: Day and name */}
              <label className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/50 transition-colors">
                <input 
                  type="radio" 
                  name="permalink" 
                  value="/%year%/%monthnum%/%day%/%postname%/"
                  checked={permalinkStructure === '/%year%/%monthnum%/%day%/%postname%/'}
                  onChange={(e) => setPermalinkStructure(e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                />
                <div className="flex-1">
                  <span className="block font-bold text-slate-800">Ngày và tên bài viết (Day and name)</span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">https://lexi.vn/2026/05/27/bai-mau/</span>
                </div>
              </label>

              {/* Option 3: Month and name */}
              <label className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/50 transition-colors">
                <input 
                  type="radio" 
                  name="permalink" 
                  value="/%year%/%monthnum%/%postname%/"
                  checked={permalinkStructure === '/%year%/%monthnum%/%postname%/'}
                  onChange={(e) => setPermalinkStructure(e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                />
                <div className="flex-1">
                  <span className="block font-bold text-slate-800">Tháng và tên bài viết (Month and name)</span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">https://lexi.vn/2026/05/bai-mau/</span>
                </div>
              </label>

              {/* Option 4: Numeric */}
              <label className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/50 transition-colors">
                <input 
                  type="radio" 
                  name="permalink" 
                  value="/archives/%post_id%"
                  checked={permalinkStructure === '/archives/%post_id%'}
                  onChange={(e) => setPermalinkStructure(e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                />
                <div className="flex-1">
                  <span className="block font-bold text-slate-800">Chuỗi mã bài viết (Numeric)</span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">https://lexi.vn/archives/123</span>
                </div>
              </label>

              {/* Option 5: Post name */}
              <label className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/50 transition-colors">
                <input 
                  type="radio" 
                  name="permalink" 
                  value="/%postname%/"
                  checked={permalinkStructure === '/%postname%/'}
                  onChange={(e) => setPermalinkStructure(e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                />
                <div className="flex-1">
                  <span className="block font-bold text-slate-800">Tiêu đề bài viết (Post name)</span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">https://lexi.vn/bai-mau/</span>
                </div>
              </label>

              {/* Option 6: WordPress Custom (html base) */}
              <label className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/50 transition-colors">
                <input 
                  type="radio" 
                  name="permalink" 
                  value="/%postname%.html"
                  checked={permalinkStructure === '/%postname%.html'}
                  onChange={(e) => setPermalinkStructure(e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                />
                <div className="flex-1">
                  <span className="block font-bold text-slate-800">Cấu trúc đuôi HTML (.html)</span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">https://lexi.vn/bai-mau.html</span>
                </div>
              </label>

              {/* Option 7: Custom structure */}
              <div className={`p-4 border rounded-xl flex flex-col gap-3 transition-colors ${
                permalinkStructure === 'custom' ? 'border-indigo-200 bg-indigo-50/10' : 'border-slate-200'
              }`}>
                <label className="flex items-center gap-4 cursor-pointer">
                  <input 
                    type="radio" 
                    name="permalink" 
                    value="custom"
                    checked={permalinkStructure === 'custom'}
                    onChange={(e) => setPermalinkStructure(e.target.value)}
                    className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                  />
                  <span className="font-bold text-slate-800">Cấu trúc tùy chỉnh (Custom structure)</span>
                </label>
                
                <div className="flex items-center gap-2 pl-8">
                  <span className="text-slate-400 font-mono select-none">https://lexi.vn</span>
                  <input 
                    type="text" 
                    value={customStructure} 
                    onChange={(e) => {
                      setPermalinkStructure('custom');
                      setCustomStructure(e.target.value);
                    }}
                    placeholder="/%postname%/"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                  />
                </div>

                {/* Placeholders buttons */}
                <div className="pl-8 pt-1">
                  <span className="block text-[10px] text-slate-400 font-bold mb-2">Các thẻ có sẵn:</span>
                  <div className="flex flex-wrap gap-1.5 max-w-2xl">
                    {['%year%', '%monthnum%', '%day%', '%hour%', '%minute%', '%second%', '%post_id%', '%postname%', '%category%', '%author%'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertTag(tag)}
                        className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-[10px] font-mono rounded font-bold border border-slate-200 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Prefixes */}
            <div className="border-t border-slate-100 pt-6 max-w-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                Tùy chọn nâng cao (Prefix Bases)
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                Nếu muốn, bạn có thể nhập các tiền tố tùy chỉnh tại đây để thay thế cho danh mục và thẻ. Ví dụ: nhập <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[9px]">danh-muc</code> để thay thế cho <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[9px]">category</code>.
              </p>

              <div className="grid grid-cols-3 items-center gap-4 pt-2">
                <label className="text-xs font-bold text-slate-700 text-right">Đường dẫn danh mục</label>
                <input 
                  type="text" 
                  value={permalinkCategoryBase}
                  onChange={(e) => setPermalinkCategoryBase(e.target.value)}
                  placeholder="category"
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white" 
                />
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-slate-700 text-right">Đường dẫn thẻ</label>
                <input 
                  type="text" 
                  value={permalinkTagBase}
                  onChange={(e) => setPermalinkTagBase(e.target.value)}
                  placeholder="tag"
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white" 
                />
              </div>

              <div className="grid grid-cols-3 items-center gap-4 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 text-right">Đường dẫn sản phẩm</label>
                <input 
                  type="text" 
                  value={permalinkProductBase}
                  onChange={(e) => setPermalinkProductBase(e.target.value)}
                  placeholder="/san-pham/"
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white" 
                />
              </div>

              <div className="grid grid-cols-3 items-center gap-4 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 text-right">Danh mục sản phẩm</label>
                <input 
                  type="text" 
                  value={permalinkProductCategoryBase}
                  onChange={(e) => setPermalinkProductCategoryBase(e.target.value)}
                  placeholder="danh-muc-san-pham"
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white" 
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Warning Modal for Permalink Change */}
      {isWarningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-scale-up">
            {/* Warning Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Xác nhận thay đổi Permalink</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ảnh hưởng toàn hệ thống</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsWarningModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Warning Content */}
            <div className="space-y-3.5 mb-6">
              <p className="text-slate-500 text-xs leading-relaxed">
                Bạn đang thay đổi cấu trúc đường dẫn cố định (Permalinks) của website. Thao tác này sẽ **ảnh hưởng trực tiếp đến toàn bộ liên kết (URLs)** của các bài viết ngoài Frontend.
              </p>
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-[11px] font-semibold text-slate-600">
                <div className="flex justify-between items-center gap-2 pb-2 border-b border-slate-200/50">
                  <span className="text-slate-400">Cấu trúc cũ:</span>
                  <span className="font-mono text-slate-700 bg-slate-200/50 px-1.5 py-0.5 rounded">{originalPermalinkStructure}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-amber-600">Cấu trúc mới:</span>
                  <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded flex-1 text-right">
                    {permalinkStructure === 'custom' ? customStructure : permalinkStructure}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-[10px] leading-relaxed text-amber-800 font-medium">
                <strong>LƯU Ý:</strong> Mặc dù hệ thống đã có cơ chế tự động chuyển hướng 301 (Permanent Redirect) để giữ dòng chảy SEO từ các URL cũ sang URL mới, việc thay đổi cấu trúc URL đột ngột vẫn có thể làm ảnh hưởng tạm thời đến chỉ mục tìm kiếm và thứ hạng SEO của website trên Google.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsWarningModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-[0.98] cursor-pointer text-center"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  const activeStructure = permalinkStructure === 'custom' ? customStructure : permalinkStructure;
                  await saveSettings(activeStructure);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-[0.98] shadow-sm shadow-indigo-500/20 hover:shadow-lg disabled:opacity-50 cursor-pointer text-center"
              >
                {isSaving ? 'Đang lưu...' : 'Tôi đã hiểu, Áp dụng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
