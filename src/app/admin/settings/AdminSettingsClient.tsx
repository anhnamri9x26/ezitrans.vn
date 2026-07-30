"use client";

import React, { useState, useEffect } from 'react';
import { Save, Globe, Image as ImageIcon, X, Settings, Calendar, Clock, Languages, Puzzle } from 'lucide-react';
import CapabilityGuard from '@/components/CapabilityGuard';
import MediaModal from '@/components/MediaModal';
import Link from 'next/link';

export interface SettingsPanelItem {
  title: string;
  description?: string;
  href: string;
  pluginId: string;
}

interface Category {
  id: number;
  name: string;
  parentId: number | null;
}

interface AdminSettingsClientProps {
  extraPanels?: SettingsPanelItem[];
}

export default function AdminSettingsClient({ extraPanels = [] }: AdminSettingsClientProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // General Form states
  const [siteTitle, setSiteTitle] = useState('Lexi');
  const [siteTagline, setSiteTagline] = useState('Vận Chuyển Hàng Quốc Tế');
  const [siteEmail, setSiteEmail] = useState('pewnoy.com@gmail.com');
  const [defaultCategoryId, setDefaultCategoryId] = useState('');
  
  // Membership settings
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [defaultRegistrationRole, setDefaultRegistrationRole] = useState('SUBSCRIBER');
  const [registrationRequireEmailVerify, setRegistrationRequireEmailVerify] = useState(true);

  // Upgraded general settings states
  const [siteLanguage, setSiteLanguage] = useState('vi');
  const [dateFormat, setDateFormat] = useState('j F, Y');
  const [dateFormatCustom, setDateFormatCustom] = useState('');
  const [timeFormat, setTimeFormat] = useState('g:i a');
  const [timeFormatCustom, setTimeFormatCustom] = useState('');
  const [startOfWeek, setStartOfWeek] = useState('1'); // Monday

  // Logo & Favicon states
  const [siteLogo, setSiteLogo] = useState('');
  const [siteLogoId, setSiteLogoId] = useState('');
  const [siteFavicon, setSiteFavicon] = useState('');
  const [siteFaviconId, setSiteFaviconId] = useState('');

  // Media Selector states
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [activeMediaTarget, setActiveMediaTarget] = useState<'logo' | 'favicon' | null>(null);

  // Preserve other system settings (e.g. Permalink configuration, Discussion)
  const [permalinkStructure, setPermalinkStructure] = useState('/%postname%.html');
  const [permalinkCategoryBase, setPermalinkCategoryBase] = useState('category');
  const [permalinkTagBase, setPermalinkTagBase] = useState('tag');

  // Time ticks for live formatting previews
  const [previewTime, setPreviewTime] = useState<Date>(new Date());

  useEffect(() => {
    // Keep live preview timer ticking
    const timer = setInterval(() => {
      setPreviewTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch categories
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        if (catData.success) {
          setCategories(catData.categories || []);
        }

        // 2. Fetch settings
        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          const s = settingsData.settings;
          if (s.site_title) setSiteTitle(s.site_title);
          if (s.site_tagline) setSiteTagline(s.site_tagline);
          if (s.site_email) setSiteEmail(s.site_email);
          if (s.default_category_id) setDefaultCategoryId(s.default_category_id);
          
          if (s.allow_user_registration) setAllowRegistration(s.allow_user_registration === 'true');
          if (s.default_registration_role) setDefaultRegistrationRole(s.default_registration_role);
          if (s.registration_require_email_verify) setRegistrationRequireEmailVerify(s.registration_require_email_verify === 'true');
          
          // Upgraded values
          if (s.site_language) setSiteLanguage(s.site_language);
          if (s.date_format) {
            const builtInDates = ['j F, Y', 'Y-m-d', 'm/d/Y', 'd/m/Y', 'd.m.Y'];
            if (builtInDates.includes(s.date_format)) {
              setDateFormat(s.date_format);
            } else {
              setDateFormat('custom');
              setDateFormatCustom(s.date_format);
            }
          }
          if (s.date_format_custom) setDateFormatCustom(s.date_format_custom);
          if (s.time_format) {
            const builtInTimes = ['g:i a', 'g:i A', 'H:i'];
            if (builtInTimes.includes(s.time_format)) {
              setTimeFormat(s.time_format);
            } else {
              setTimeFormat('custom');
              setTimeFormatCustom(s.time_format);
            }
          }
          if (s.time_format_custom) setTimeFormatCustom(s.time_format_custom);
          if (s.start_of_week) setStartOfWeek(s.start_of_week);
          
          if (s.site_logo) setSiteLogo(s.site_logo);
          if (s.site_logo_id) setSiteLogoId(s.site_logo_id);
          if (s.site_favicon) setSiteFavicon(s.site_favicon);
          if (s.site_favicon_id) setSiteFaviconId(s.site_favicon_id);

          // Preserve permalinks
          if (s.permalink_structure) setPermalinkStructure(s.permalink_structure);
          if (s.permalink_category_base) setPermalinkCategoryBase(s.permalink_category_base);
          if (s.permalink_tag_base) setPermalinkTagBase(s.permalink_tag_base);
        }
      } catch (error) {
        console.error("Failed to load settings data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const activeDateFormat = dateFormat === 'custom' ? dateFormatCustom : dateFormat;
      const activeTimeFormat = timeFormat === 'custom' ? timeFormatCustom : timeFormat;

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_title: siteTitle,
          site_tagline: siteTagline,
          site_email: siteEmail,
          default_category_id: defaultCategoryId,
          allow_user_registration: allowRegistration,
          default_registration_role: defaultRegistrationRole,
          registration_require_email_verify: registrationRequireEmailVerify,
          site_language: siteLanguage,
          date_format: activeDateFormat,
          date_format_custom: dateFormatCustom,
          time_format: activeTimeFormat,
          time_format_custom: timeFormatCustom,
          start_of_week: startOfWeek,
          site_logo: siteLogo,
          site_logo_id: siteLogoId,
          site_favicon: siteFavicon,
          site_favicon_id: siteFaviconId,
          // Preserve permalinks
          permalink_structure: permalinkStructure,
          permalink_category_base: permalinkCategoryBase,
          permalink_tag_base: permalinkTagBase
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Đã lưu thay đổi cấu hình hệ thống thành công!');
        window.location.reload(); // Reload immediately to apply dynamic logo, favicon, and language changes to the Admin Layout sidebar and browser tab
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

  const getHierarchicalCategoriesWithDepth = (cats: Category[]) => {
    const list: (Category & { depth: number })[] = [];
    const parents = cats.filter(c => !c.parentId);
    const children = cats.filter(c => c.parentId);

    const appendChildren = (parentId: number, currentDepth: number) => {
      const directChildren = children.filter(c => c.parentId === parentId);
      directChildren.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      
      directChildren.forEach(child => {
        list.push({ ...child, depth: currentDepth });
        appendChildren(child.id, currentDepth + 1);
      });
    };

    parents.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    parents.forEach(p => {
      list.push({ ...p, depth: 0 });
      appendChildren(p.id, 1);
    });

    cats.forEach(c => {
      if (!list.some(item => item.id === c.id)) {
        list.push({ ...c, depth: 0 });
      }
    });

    return list;
  };

  const hierarchicalCategories = getHierarchicalCategoriesWithDepth(categories);

  // WordPress-style date and time formatting parser
  const formatDateWordPress = (date: Date, format: string, lang: string): string => {
    if (!format) return '';
    
    const pad = (n: number) => String(n).padStart(2, '0');
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    let ampmLower = 'am';
    let ampmUpper = 'AM';
    
    if (lang === 'vi') {
      ampmLower = hours >= 12 ? 'chiều' : 'sáng';
      ampmUpper = hours >= 12 ? 'chiều' : 'sáng'; // lower-cased equivalent in VN screenshots
    } else {
      ampmLower = hours >= 12 ? 'pm' : 'am';
      ampmUpper = hours >= 12 ? 'PM' : 'AM';
    }

    const monthsFullVi = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    const monthsFullEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthsShortVi = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
    const monthsShortEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let result = '';
    for (let i = 0; i < format.length; i++) {
      const char = format[i];
      if (char === '\\' && i + 1 < format.length) {
        result += format[i + 1];
        i++;
        continue;
      }
      
      switch (char) {
        case 'Y': result += date.getFullYear(); break;
        case 'y': result += String(date.getFullYear()).slice(-2); break;
        case 'm': result += pad(date.getMonth() + 1); break;
        case 'n': result += String(date.getMonth() + 1); break;
        case 'F': result += lang === 'vi' ? monthsFullVi[date.getMonth()] : monthsFullEn[date.getMonth()]; break;
        case 'M': result += lang === 'vi' ? monthsShortVi[date.getMonth()] : monthsShortEn[date.getMonth()]; break;
        case 'd': result += pad(date.getDate()); break;
        case 'j': result += String(date.getDate()); break;
        case 'g': result += String(hours % 12 || 12); break;
        case 'G': result += String(hours); break;
        case 'h': result += pad(hours % 12 || 12); break;
        case 'H': result += pad(hours); break;
        case 'i': result += pad(minutes); break;
        case 's': result += pad(seconds); break;
        case 'a': result += ampmLower; break;
        case 'A': result += ampmUpper; break;
        default: result += char;
      }
    }
    return result;
  };

  const handleSelectMedia = (image: { id: number; url: string }) => {
    if (activeMediaTarget === 'logo') {
      setSiteLogo(image.url);
      setSiteLogoId(String(image.id));
    } else if (activeMediaTarget === 'favicon') {
      setSiteFavicon(image.url);
      setSiteFaviconId(String(image.id));
    }
    setIsMediaModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-medium animate-pulse text-xs">Đang tải cấu hình cài đặt...</div>
      </div>
    );
  }

  return (
    <CapabilityGuard capability="manage_settings">
      <form onSubmit={handleSaveSettings} className="max-w-4xl mx-auto font-sans pb-12 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Settings className="text-slate-600" size={24} /> Cài đặt Tổng quan
          </h1>
          <p className="text-slate-500 text-xs mt-1">Cấu hình các tham số tổng quan, biểu tượng website và định dạng thời gian.</p>
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
        {/* Section 1: General Settings */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
            <Globe size={18} className="text-indigo-500" /> Cài đặt Tổng quan
          </h2>
          
          <div className="space-y-5 max-w-3xl">
            {/* Site Title */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-xs font-bold text-slate-700 text-right">Tiêu đề trang web</label>
              <input 
                type="text" 
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 bg-white" 
                required
              />
            </div>
            
            {/* Tagline */}
            <div className="grid grid-cols-3 items-start gap-4">
              <label className="text-xs font-bold text-slate-700 text-right mt-2">Dòng mô tả</label>
              <div className="col-span-2">
                <input 
                  type="text" 
                  value={siteTagline}
                  onChange={(e) => setSiteTagline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 bg-white" 
                />
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Giới thiệu ngắn gọn về lĩnh vực hoạt động của trang web.</p>
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-3 items-start gap-4">
              <label className="text-xs font-bold text-slate-700 text-right mt-2">Email quản trị</label>
              <div className="col-span-2">
                <input 
                  type="email" 
                  value={siteEmail}
                  onChange={(e) => setSiteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 bg-white" 
                  required
                />
              </div>
            </div>
            
            {/* Default Category Selector */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-xs font-bold text-slate-700 text-right">Danh mục mặc định</label>
              <select 
                value={defaultCategoryId}
                onChange={(e) => setDefaultCategoryId(e.target.value)}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 bg-white font-bold cursor-pointer"
                required
              >
                <option value="">— Chọn danh mục mặc định —</option>
                {hierarchicalCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.depth > 0 ? '— '.repeat(cat.depth) : ''}{cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Site Language */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-xs font-bold text-slate-700 text-right flex items-center justify-end gap-1.5">
                <Languages size={14} className="text-slate-400" /> Ngôn ngữ của trang
              </label>
              <select 
                value={siteLanguage}
                onChange={(e) => setSiteLanguage(e.target.value)}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 bg-white font-bold cursor-pointer"
                required
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English (United States)</option>
                <option value="zh">中文 (简体)</option>
                <option value="ja">日本語</option>
              </select>
            </div>

            {/* Timezone */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-xs font-bold text-slate-700 text-right">Múi giờ</label>
              <select className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-slate-400 bg-slate-50 outline-none cursor-not-allowed select-none" disabled>
                <option>UTC+7 (Hồ Chí Minh, Hà Nội)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section: Membership & Registration Settings */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
            <Globe size={18} className="text-indigo-500" /> Cài đặt thành viên & đăng ký (Membership)
          </h2>
          
          <div className="space-y-6 max-w-3xl">
            {/* Allow Registration Toggle */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-xs font-bold text-slate-700 text-right">Thành viên đăng ký</label>
              <div className="col-span-2 flex items-center">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={allowRegistration}
                    onChange={(e) => setAllowRegistration(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-3 text-xs font-semibold text-slate-600">Cho phép bất kỳ ai đăng ký tài khoản</span>
                </label>
              </div>
            </div>

            {/* Default Registration Role */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-xs font-bold text-slate-700 text-right">Vai trò mặc định</label>
              <select 
                value={defaultRegistrationRole}
                onChange={(e) => setDefaultRegistrationRole(e.target.value)}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 bg-white font-bold cursor-pointer w-[220px]"
                required
              >
                <option value="SUBSCRIBER">Subscriber (Đăng ký viên)</option>
                <option value="EDITOR">Editor (Biên tập viên)</option>
                <option value="ADMIN">Administrator (Quản trị viên)</option>
              </select>
            </div>

            {/* Email Verification Toggle */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-xs font-bold text-slate-700 text-right">Xác nhận email</label>
              <div className="col-span-2 flex items-center">
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={registrationRequireEmailVerify}
                    onChange={(e) => setRegistrationRequireEmailVerify(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-3 text-xs font-semibold text-slate-600">Yêu cầu kích hoạt tài khoản qua email trước khi đăng nhập</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Logo & Favicon Settings */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
            <ImageIcon size={18} className="text-indigo-500" /> Nhận diện Thương hiệu (Logo & Favicon)
          </h2>
          
          <div className="space-y-6 max-w-3xl">
            {/* Website Logo Selector */}
            <div className="grid grid-cols-3 items-start gap-4">
              <div className="text-right mt-2">
                <label className="text-xs font-bold text-slate-700 block">Logo Trang Web</label>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Hiển thị ở Header chính.</p>
              </div>
              <div className="col-span-2 flex items-center gap-4">
                {siteLogo ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group shrink-0 shadow-sm">
                    <img 
                      src={siteLogo} 
                      alt="Site Logo" 
                      className="h-16 w-32 object-contain p-1"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button 
                        type="button"
                        onClick={() => { setActiveMediaTarget('logo'); setIsMediaModalOpen(true); }}
                        className="p-1 bg-white hover:bg-slate-100 rounded text-[9px] font-bold text-slate-800 transition-colors cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setSiteLogo(''); setSiteLogoId(''); }}
                        className="p-1 bg-red-600 hover:bg-red-700 rounded text-[9px] font-bold text-white transition-colors cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => { setActiveMediaTarget('logo'); setIsMediaModalOpen(true); }}
                    className="h-16 w-32 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50/20 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-500 transition-all cursor-pointer outline-none shrink-0"
                  >
                    <ImageIcon size={18} className="opacity-75" />
                    <span className="text-[9px] font-bold">Chọn Logo</span>
                  </button>
                )}
                <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Logo định dạng ngang PNG hoặc SVG, khuyến nghị kích thước chiều cao trong khoảng 40px - 60px để hiển thị đẹp nhất.
                </div>
              </div>
            </div>

            {/* Website Favicon Selector */}
            <div className="grid grid-cols-3 items-start gap-4">
              <div className="text-right mt-2">
                <label className="text-xs font-bold text-slate-700 block">Favicon (Icon tab)</label>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Biểu tượng thu nhỏ của tab trình duyệt.</p>
              </div>
              <div className="col-span-2 flex items-center gap-4">
                {siteFavicon ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group shrink-0 shadow-sm w-16 h-16 flex items-center justify-center p-2">
                    <img 
                      src={siteFavicon} 
                      alt="Site Favicon" 
                      className="w-10 h-10 object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button 
                        type="button"
                        onClick={() => { setActiveMediaTarget('favicon'); setIsMediaModalOpen(true); }}
                        className="p-1 bg-white hover:bg-slate-100 rounded text-[9px] font-bold text-slate-800 transition-colors cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setSiteFavicon(''); setSiteFaviconId(''); }}
                        className="p-1 bg-red-600 hover:bg-red-700 rounded text-[9px] font-bold text-white transition-colors cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => { setActiveMediaTarget('favicon'); setIsMediaModalOpen(true); }}
                    className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50/20 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-500 transition-all cursor-pointer outline-none shrink-0 animate-fade-in"
                  >
                    <ImageIcon size={16} className="opacity-75" />
                    <span className="text-[9px] font-bold">Chọn Favicon</span>
                  </button>
                )}
                <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Favicon dạng hình vuông chuẩn (.ico, .png), tỷ lệ 1:1, khuyến nghị kích thước tối thiểu 16x16px hoặc 32x32px.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Date & Time Formats Settings */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
            <Calendar size={18} className="text-indigo-500" /> Định dạng ngày tháng & thời gian
          </h2>
          
          <div className="space-y-6 max-w-3xl">
            {/* UTC Info row */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 flex flex-col gap-1.5 text-[11px] font-semibold text-slate-600 max-w-xl ml-auto mr-0">
              <div className="flex justify-between">
                <span className="text-slate-400">Giờ quốc tế là:</span>
                <span className="font-mono text-slate-700 bg-slate-200/40 px-2 py-0.5 rounded">{previewTime.toISOString().slice(0, 19).replace('T', ' ')} (UTC)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Giờ địa phương là:</span>
                <span className="font-mono text-indigo-600 bg-indigo-50/40 px-2 py-0.5 rounded">
                  {previewTime.toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })} (UTC+7)
                </span>
              </div>
            </div>

            {/* Date Format Selectors */}
            <div className="grid grid-cols-3 items-start gap-4 border-b border-slate-100 pb-5">
              <label className="text-xs font-bold text-slate-700 text-right mt-1.5">Định dạng ngày tháng</label>
              <div className="col-span-2 space-y-3">
                {[
                  { label: 'j F, Y', format: 'j F, Y' },
                  { label: 'Y-m-d', format: 'Y-m-d' },
                  { label: 'm/d/Y', format: 'm/d/Y' },
                  { label: 'd/m/Y', format: 'd/m/Y' },
                  { label: 'd.m.Y', format: 'd.m.Y' }
                ].map(item => (
                  <label key={item.format} className="flex items-center gap-3.5 cursor-pointer font-semibold text-slate-700 hover:text-indigo-600 transition-colors w-fit">
                    <input 
                      type="radio" 
                      name="dateFormat"
                      value={item.format}
                      checked={dateFormat === item.format}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="w-40">{formatDateWordPress(previewTime, item.format, siteLanguage)}</span>
                    <code className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{item.label}</code>
                  </label>
                ))}
                
                {/* Custom Date format row */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3.5 cursor-pointer font-semibold text-slate-700 hover:text-indigo-600 transition-colors w-fit">
                    <input 
                      type="radio" 
                      name="dateFormat"
                      value="custom"
                      checked={dateFormat === 'custom'}
                      onChange={(e) => setDateFormat('custom')}
                      className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="w-16">Tùy chỉnh:</span>
                    <input 
                      type="text" 
                      value={dateFormatCustom}
                      onChange={(e) => {
                        setDateFormat('custom');
                        setDateFormatCustom(e.target.value);
                      }}
                      placeholder="j F, Y"
                      className="px-2.5 py-1 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded font-mono text-[11px] text-slate-700 bg-white w-[130px]"
                    />
                  </label>
                  {dateFormat === 'custom' && (
                    <div className="pl-7 font-bold text-[10px] text-slate-500">
                      Xem trước: <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{formatDateWordPress(previewTime, dateFormatCustom || 'j F, Y', siteLanguage)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Time Format Selectors */}
            <div className="grid grid-cols-3 items-start gap-4 border-b border-slate-100 pb-5">
              <label className="text-xs font-bold text-slate-700 text-right mt-1.5">Định dạng thời gian</label>
              <div className="col-span-2 space-y-3">
                {[
                  { label: 'g:i a', format: 'g:i a' },
                  { label: 'g:i A', format: 'g:i A' },
                  { label: 'H:i', format: 'H:i' }
                ].map(item => (
                  <label key={item.format} className="flex items-center gap-3.5 cursor-pointer font-semibold text-slate-700 hover:text-indigo-600 transition-colors w-fit">
                    <input 
                      type="radio" 
                      name="timeFormat"
                      value={item.format}
                      checked={timeFormat === item.format}
                      onChange={(e) => setTimeFormat(e.target.value)}
                      className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="w-40">{formatDateWordPress(previewTime, item.format, siteLanguage)}</span>
                    <code className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{item.label}</code>
                  </label>
                ))}
                
                {/* Custom Time format row */}
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3.5 cursor-pointer font-semibold text-slate-700 hover:text-indigo-600 transition-colors w-fit">
                    <input 
                      type="radio" 
                      name="timeFormat"
                      value="custom"
                      checked={timeFormat === 'custom'}
                      onChange={(e) => setTimeFormat('custom')}
                      className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="w-16">Tùy chỉnh:</span>
                    <input 
                      type="text" 
                      value={timeFormatCustom}
                      onChange={(e) => {
                        setTimeFormat('custom');
                        setTimeFormatCustom(e.target.value);
                      }}
                      placeholder="g:i a"
                      className="px-2.5 py-1 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded font-mono text-[11px] text-slate-700 bg-white w-[130px]"
                    />
                  </label>
                  {timeFormat === 'custom' && (
                    <div className="pl-7 font-bold text-[10px] text-slate-500">
                      Xem trước: <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{formatDateWordPress(previewTime, timeFormatCustom || 'g:i a', siteLanguage)}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <a 
                    href="https://wordpress.org/documentation/article/customize-date-and-time-format/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold text-[10px]"
                  >
                    Tài liệu về định dạng ngày và giờ.
                  </a>
                </div>
              </div>
            </div>

            {/* Start of Week Dropdown */}
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="text-xs font-bold text-slate-700 text-right">Tuần mới bắt đầu vào</label>
              <select 
                value={startOfWeek}
                onChange={(e) => setStartOfWeek(e.target.value)}
                className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 bg-white font-bold cursor-pointer w-[180px]"
                required
              >
                <option value="1">Thứ Hai</option>
                <option value="2">Thứ Ba</option>
                <option value="3">Thứ Tư</option>
                <option value="4">Thứ Năm</option>
                <option value="5">Thứ Sáu</option>
                <option value="6">Thứ Bảy</option>
                <option value="0">Chủ Nhật</option>
              </select>
            </div>
          </div>
        </section>
        </div>
      </form>

        {/* Plugin Settings Section */}
        {extraPanels.length > 0 && (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Puzzle className="text-indigo-500" size={24} /> Cài đặt từ Plugins
              </h2>
              <p className="text-sm text-slate-500 mt-1">Các thiết lập bổ sung được cung cấp bởi các tiện ích mở rộng đang hoạt động.</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {extraPanels.map((panel, idx) => (
                  <Link href={panel.href} key={`${panel.pluginId}-${idx}`} className="block border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all rounded-xl p-5 bg-white group">
                    <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{panel.title}</h3>
                    {panel.description && <p className="text-xs text-slate-500 mt-1.5">{panel.description}</p>}
                    <div className="mt-3 text-xs font-medium text-slate-400">Plugin ID: {panel.pluginId}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

      <MediaModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleSelectMedia}
      />
    </CapabilityGuard>
  );
}
