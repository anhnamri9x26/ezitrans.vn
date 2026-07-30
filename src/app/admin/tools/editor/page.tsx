"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import CapabilityGuard from '@/components/CapabilityGuard';
import { 
  Save, RotateCcw, Type, Bold, Italic, Underline, Strikethrough, Quote, 
  List, ListOrdered, IndentDecrease, IndentIncrease, Link2, ImageIcon, Video, 
  Eraser, Heading1, Heading2, Heading3, Heading4, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, Code, Subscript, Superscript, Palette, Highlighter, 
  CheckSquare, CaseSensitive, ALargeSmall, ArrowRightLeft, SquareFunction, 
  ListChecks, Braces, SquareCode, Sliders, Check, Wand2, Sparkles, Eye, 
  Layout, HelpCircle, Laptop
} from 'lucide-react';
import RichTextEditor, { buildQuillToolbar } from '@/components/RichTextEditor';

// Define all available toolbar items with metadata
interface ToolbarItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  group: string;
  quillFormat: string | Record<string, any>;
  defaultEnabled: boolean;
}

const TOOLBAR_GROUPS = [
  { id: 'font', label: 'Phông chữ & Kích thước', description: 'Chọn font, cỡ chữ cho văn bản', icon: <CaseSensitive size={16} /> },
  { id: 'heading', label: 'Tiêu đề', description: 'Cấp độ tiêu đề từ H1 đến H4', icon: <Type size={16} /> },
  { id: 'text-style', label: 'Kiểu chữ', description: 'Định dạng văn bản cơ bản', icon: <Bold size={16} /> },
  { id: 'block', label: 'Khối nội dung', description: 'Trích dẫn, code, danh sách', icon: <Quote size={16} /> },
  { id: 'alignment', label: 'Căn chỉnh lề', description: 'Căn lề trái, phải, giữa, đều', icon: <AlignLeft size={16} /> },
  { id: 'indent', label: 'Thụt lề & Hướng', description: 'Thụt lề văn bản, viết ngược', icon: <IndentIncrease size={16} /> },
  { id: 'color', label: 'Màu sắc chữ', description: 'Màu chữ và màu nền highlight', icon: <Palette size={16} /> },
  { id: 'media', label: 'Phương tiện nhúng', description: 'Chèn liên kết, hình ảnh, video', icon: <ImageIcon size={16} /> },
  { id: 'script', label: 'Chỉ số & Ký hiệu', description: 'Chỉ số trên/dưới, công thức', icon: <Subscript size={16} /> },
  { id: 'code', label: 'Code & Mã nguồn', description: 'Inline code, khối mã nguồn', icon: <SquareCode size={16} /> },
  { id: 'utility', label: 'Dọn dẹp tiện ích', description: 'Xoá định dạng để bắt đầu lại', icon: <Eraser size={16} /> },
];

const ALL_TOOLBAR_ITEMS: ToolbarItem[] = [
  // Font & Size
  { id: 'font', label: 'Chọn phông chữ', description: 'Font Family (Sans, Serif, Mono...)', icon: <CaseSensitive size={14} />, group: 'font', quillFormat: 'font', defaultEnabled: false },
  { id: 'size', label: 'Cỡ chữ', description: 'Font Size (Small, Normal, Large, Huge)', icon: <ALargeSmall size={14} />, group: 'font', quillFormat: 'size', defaultEnabled: false },

  // Heading
  { id: 'header', label: 'Dropdown tiêu đề', description: 'Chọn kiểu Normal / H1 / H2 / H3 / H4', icon: <Type size={14} />, group: 'heading', quillFormat: 'header-dropdown', defaultEnabled: true },
  { id: 'header-1', label: 'Tiêu đề H1', description: 'Heading 1 — Tiêu đề lớn nhất', icon: <Heading1 size={14} />, group: 'heading', quillFormat: 'header-1', defaultEnabled: false },
  { id: 'header-2', label: 'Tiêu đề H2', description: 'Heading 2 — Tiêu đề chính mục', icon: <Heading2 size={14} />, group: 'heading', quillFormat: 'header-2', defaultEnabled: false },
  { id: 'header-3', label: 'Tiêu đề H3', description: 'Heading 3 — Tiêu đề phụ', icon: <Heading3 size={14} />, group: 'heading', quillFormat: 'header-3', defaultEnabled: false },
  { id: 'header-4', label: 'Tiêu đề H4', description: 'Heading 4 — Tiêu đề nhỏ nhất', icon: <Heading4 size={14} />, group: 'heading', quillFormat: 'header-4', defaultEnabled: false },

  // Text Style
  { id: 'bold', label: 'In đậm', description: 'Bold (Ctrl+B)', icon: <Bold size={14} />, group: 'text-style', quillFormat: 'bold', defaultEnabled: true },
  { id: 'italic', label: 'In nghiêng', description: 'Italic (Ctrl+I)', icon: <Italic size={14} />, group: 'text-style', quillFormat: 'italic', defaultEnabled: true },
  { id: 'underline', label: 'Gạch chân', description: 'Underline (Ctrl+U)', icon: <Underline size={14} />, group: 'text-style', quillFormat: 'underline', defaultEnabled: true },
  { id: 'strike', label: 'Gạch ngang', description: 'Strikethrough — Đánh dấu xóa', icon: <Strikethrough size={14} />, group: 'text-style', quillFormat: 'strike', defaultEnabled: true },

  // Block
  { id: 'blockquote', label: 'Trích dẫn', description: 'Blockquote — Khối trích dẫn', icon: <Quote size={14} />, group: 'block', quillFormat: 'blockquote', defaultEnabled: true },
  { id: 'list-ordered', label: 'Danh sách số', description: 'Ordered List (1, 2, 3...)', icon: <ListOrdered size={14} />, group: 'block', quillFormat: 'list-ordered', defaultEnabled: true },
  { id: 'list-bullet', label: 'Danh sách chấm', description: 'Bullet List (•)', icon: <List size={14} />, group: 'block', quillFormat: 'list-bullet', defaultEnabled: true },
  { id: 'list-check', label: 'Danh sách kiểm tra', description: 'Checklist (☑ ☐)', icon: <ListChecks size={14} />, group: 'block', quillFormat: 'list-check', defaultEnabled: false },

  // Alignment
  { id: 'align-left', label: 'Căn trái', description: 'Align Left (mặc định)', icon: <AlignLeft size={14} />, group: 'alignment', quillFormat: 'align-left', defaultEnabled: true },
  { id: 'align-center', label: 'Căn giữa', description: 'Align Center', icon: <AlignCenter size={14} />, group: 'alignment', quillFormat: 'align-center', defaultEnabled: true },
  { id: 'align-right', label: 'Căn phải', description: 'Align Right', icon: <AlignRight size={14} />, group: 'alignment', quillFormat: 'align-right', defaultEnabled: true },
  { id: 'align-justify', label: 'Căn đều', description: 'Justify — Dàn đều hai bên', icon: <AlignJustify size={14} />, group: 'alignment', quillFormat: 'align-justify', defaultEnabled: true },

  // Indent & Direction
  { id: 'indent-decrease', label: 'Giảm thụt lề', description: 'Outdent (-1 cấp)', icon: <IndentDecrease size={14} />, group: 'indent', quillFormat: 'indent-decrease', defaultEnabled: true },
  { id: 'indent-increase', label: 'Tăng thụt lề', description: 'Indent (+1 cấp)', icon: <IndentIncrease size={14} />, group: 'indent', quillFormat: 'indent-increase', defaultEnabled: true },
  { id: 'direction-rtl', label: 'Viết phải → trái', description: 'RTL Direction (Arabic, Hebrew...)', icon: <ArrowRightLeft size={14} />, group: 'indent', quillFormat: 'direction-rtl', defaultEnabled: false },

  // Color
  { id: 'color', label: 'Màu chữ', description: 'Text Color — Chọn màu cho văn bản', icon: <Palette size={14} />, group: 'color', quillFormat: 'color', defaultEnabled: false },
  { id: 'background', label: 'Màu nền chữ', description: 'Background Color / Highlight', icon: <Highlighter size={14} />, group: 'color', quillFormat: 'background', defaultEnabled: false },

  // Media
  { id: 'link', label: 'Liên kết', description: 'Chèn liên kết URL', icon: <Link2 size={14} />, group: 'media', quillFormat: 'link', defaultEnabled: true },
  { id: 'image', label: 'Hình ảnh', description: 'Chèn hình ảnh từ URL hoặc upload', icon: <ImageIcon size={14} />, group: 'media', quillFormat: 'image', defaultEnabled: true },
  { id: 'video', label: 'Video', description: 'Nhúng video (YouTube hoặc Tự lưu trữ)', icon: <Video size={14} />, group: 'media', quillFormat: 'video', defaultEnabled: true },
  { id: 'formula', label: 'Công thức toán', description: 'Chèn công thức LaTeX (cần KaTeX)', icon: <SquareFunction size={14} />, group: 'media', quillFormat: 'formula', defaultEnabled: false },

  // Script & Symbol
  { id: 'script-sub', label: 'Chỉ số dưới', description: 'Subscript (H₂O, CO₂)', icon: <Subscript size={14} />, group: 'script', quillFormat: 'script-sub', defaultEnabled: false },
  { id: 'script-super', label: 'Chỉ số trên', description: 'Superscript (x², m³, ®)', icon: <Superscript size={14} />, group: 'script', quillFormat: 'script-super', defaultEnabled: false },

  // Code & Technical
  { id: 'code', label: 'Inline Code', description: 'Code trong dòng — monospace', icon: <Braces size={14} />, group: 'code', quillFormat: 'code', defaultEnabled: false },
  { id: 'code-block', label: 'Khối Code', description: 'Code Block — Khối mã nguồn', icon: <SquareCode size={14} />, group: 'code', quillFormat: 'code-block', defaultEnabled: false },

  // Utility
  { id: 'clean', label: 'Xoá định dạng', description: 'Remove Formatting — Xóa tất cả style', icon: <Eraser size={14} />, group: 'utility', quillFormat: 'clean', defaultEnabled: true },
];

const PRESETS = {
  minimal: {
    font: false, size: false,
    header: false, 'header-1': false, 'header-2': false, 'header-3': false, 'header-4': false,
    bold: true, italic: true, underline: false, strike: false,
    blockquote: false, 'list-ordered': false, 'list-bullet': false, 'list-check': false,
    'align-left': false, 'align-center': false, 'align-right': false, 'align-justify': false,
    'indent-decrease': false, 'indent-increase': false, 'direction-rtl': false,
    color: false, background: false,
    link: true, image: false, video: false, formula: false,
    'script-sub': false, 'script-super': false,
    code: false, 'code-block': false,
    clean: true
  },
  standard: {
    font: false, size: false,
    header: true, 'header-1': false, 'header-2': false, 'header-3': false, 'header-4': false,
    bold: true, italic: true, underline: true, strike: false,
    blockquote: true, 'list-ordered': true, 'list-bullet': true, 'list-check': false,
    'align-left': true, 'align-center': true, 'align-right': true, 'align-justify': true,
    'indent-decrease': true, 'indent-increase': true, 'direction-rtl': false,
    color: false, background: false,
    link: true, image: true, video: true, formula: false,
    'script-sub': false, 'script-super': false,
    code: false, 'code-block': false,
    clean: true
  },
  full: {
    font: true, size: true,
    header: true, 'header-1': true, 'header-2': true, 'header-3': true, 'header-4': true,
    bold: true, italic: true, underline: true, strike: true,
    blockquote: true, 'list-ordered': true, 'list-bullet': true, 'list-check': true,
    'align-left': true, 'align-center': true, 'align-right': true, 'align-justify': true,
    'indent-decrease': true, 'indent-increase': true, 'direction-rtl': true,
    color: true, background: true,
    link: true, image: true, video: true, formula: true,
    'script-sub': true, 'script-super': true,
    code: true, 'code-block': true,
    clean: true
  }
};

function getDefaultConfig(): Record<string, boolean> {
  const config: Record<string, boolean> = {};
  ALL_TOOLBAR_ITEMS.forEach(item => {
    config[item.id] = item.defaultEnabled;
  });
  return config;
}

export default function EditorSettingsPage() {
  const [config, setConfig] = useState<Record<string, boolean>>(getDefaultConfig());
  const [initialConfig, setInitialConfig] = useState<Record<string, boolean>>(getDefaultConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Live preview editor content
  const [previewContent, setPreviewContent] = useState<string>(
    '<h2>Chào mừng đến với Trình soạn thảo eziTrans! ✨</h2><p>Đây là <strong>bản xem trước trực tiếp</strong> của trình soạn thảo. Khi bạn bật hoặc tắt các nút bấm ở bảng cấu hình bên trái, thanh công cụ ở đây sẽ <em>cập nhật và đồng bộ ngay lập tức</em>.</p><p>Hãy thử gõ hoặc chỉnh sửa nội dung này để xem trải nghiệm thực tế nhé! 📝</p>'
  );

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.settings?.editor_toolbar_config) {
          const savedConfig = JSON.parse(data.settings.editor_toolbar_config);
          const merged = { ...getDefaultConfig(), ...savedConfig };
          setConfig(merged);
          setInitialConfig(merged);
        }
      } catch (err) {
        console.error('Failed to load editor config:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    const changed = JSON.stringify(config) !== JSON.stringify(initialConfig);
    setHasChanges(changed);
  }, [config, initialConfig]);

  const toggleItem = (id: string) => {
    setConfig(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGroup = (groupId: string, enable: boolean) => {
    setConfig(prev => {
      const next = { ...prev };
      ALL_TOOLBAR_ITEMS.filter(i => i.group === groupId).forEach(i => {
        next[i.id] = enable;
      });
      return next;
    });
  };

  const applyPreset = (presetName: 'minimal' | 'standard' | 'full') => {
    const presetData = PRESETS[presetName];
    setConfig({ ...getDefaultConfig(), ...presetData });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customSettings: {
            editor_toolbar_config: JSON.stringify(config)
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setInitialConfig({ ...config });
        setHasChanges(false);
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save editor config:', err);
      alert('Lỗi khi lưu cài đặt!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaults = getDefaultConfig();
    setConfig(defaults);
  };

  const enabledCount = Object.values(config).filter(Boolean).length;
  const totalCount = ALL_TOOLBAR_ITEMS.length;

  const activePreset = (): 'minimal' | 'standard' | 'full' | 'custom' => {
    const stringified = JSON.stringify(config);
    if (stringified === JSON.stringify({ ...getDefaultConfig(), ...PRESETS.minimal })) return 'minimal';
    if (stringified === JSON.stringify({ ...getDefaultConfig(), ...PRESETS.standard })) return 'standard';
    if (stringified === JSON.stringify({ ...getDefaultConfig(), ...PRESETS.full })) return 'full';
    return 'custom';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <div className="text-slate-500 font-medium text-xs animate-pulse">Đang tải cấu hình trình soạn thảo...</div>
        </div>
      </div>
    );
  }

  // Generate dynamic key to force dynamic remounting of RichTextEditor preview when toolbar changes
  const previewEditorKey = JSON.stringify(config);

  return (
    <CapabilityGuard capability="manage_tools">
      <div className="max-w-[1240px] mx-auto px-4 py-2">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 rounded-2xl p-6 mb-8 text-white shadow-xl shadow-indigo-500/10">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
          <Sparkles size={320} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
              Hệ thống CMS Premium
            </span>
            <h1 className="text-2xl font-black mt-2 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner">
                <Sliders size={20} className="text-white" />
              </div>
              Cài đặt Trình soạn thảo
            </h1>
            <p className="text-sm text-indigo-100/90 mt-2 font-medium max-w-xl leading-relaxed">
              Tùy chỉnh tính năng của trình soạn thảo WYSIWYG trên toàn hệ thống. Kéo thả, bật/tắt các công cụ định dạng để tạo trải nghiệm viết bài tối ưu nhất.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleReset}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer backdrop-blur-sm active:scale-95"
            >
              <RotateCcw size={14} className="animate-spin-hover" />
              Mặc định ban đầu
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="bg-white text-indigo-700 hover:bg-slate-50 disabled:bg-white/50 disabled:text-white/70 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg shadow-black/10 active:scale-95"
            >
              <Save size={14} />
              {isSaving ? 'Đang lưu cài đặt...' : 'Lưu tất cả thay đổi'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showSaveSuccess && (
        <div className="mb-6 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-scale-up">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check size={14} />
          </div>
          <span>Đã cập nhật cấu hình trình soạn thảo thành công! Tất cả các bài viết sẽ được áp dụng ngay lập tức.</span>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Group Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-1.5 h-4 bg-indigo-600 rounded-full" />
              Cấu hình các nhóm công cụ
            </h2>
            <span className="text-[10.5px] font-bold text-slate-500 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-lg">
              Đang chọn {enabledCount} / {totalCount} công cụ
            </span>
          </div>

          <div className="space-y-4">
            {TOOLBAR_GROUPS.map(group => {
              const groupItems = ALL_TOOLBAR_ITEMS.filter(i => i.group === group.id);
              const enabledInGroup = groupItems.filter(i => config[i.id]).length;
              const allEnabled = enabledInGroup === groupItems.length;
              const noneEnabled = enabledInGroup === 0;

              return (
                <div 
                  key={group.id} 
                  className={`bg-white border rounded-2xl shadow-sm transition-all duration-300 overflow-hidden ${
                    enabledInGroup > 0 
                      ? 'border-indigo-100 shadow-indigo-100/10' 
                      : 'border-slate-200 shadow-slate-100/5 hover:border-slate-300'
                  }`}
                >
                  {/* Group Header */}
                  <div className={`flex items-center justify-between px-5 py-4 border-b transition-colors ${
                    enabledInGroup > 0 ? 'bg-indigo-50/20 border-indigo-50' : 'bg-slate-50/50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        enabledInGroup > 0 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {group.icon}
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-800 tracking-tight">{group.label}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{group.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleGroup(group.id, true)}
                        disabled={allEnabled}
                        className={`text-[9.5px] font-extrabold px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                          allEnabled
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/50'
                        }`}
                      >
                        Bật hết
                      </button>
                      <button
                        onClick={() => toggleGroup(group.id, false)}
                        disabled={noneEnabled}
                        className={`text-[9.5px] font-extrabold px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                          noneEnabled
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            : 'bg-red-50/60 text-red-600 hover:bg-red-100/80 border border-red-200/30'
                        }`}
                      >
                        Tắt hết
                      </button>
                    </div>
                  </div>

                  {/* Group Items */}
                  <div className="divide-y divide-slate-100 bg-white">
                    {groupItems.map(item => {
                      const isEnabled = config[item.id];
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-all duration-200 hover:bg-slate-50/50 ${
                            isEnabled ? 'bg-indigo-50/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              isEnabled
                                ? 'bg-indigo-100/60 border border-indigo-200/40 text-indigo-700 font-bold scale-105'
                                : 'bg-slate-100/60 border border-slate-200/40 text-slate-400'
                            }`}>
                              {item.icon}
                            </div>
                            <div>
                              <span className={`text-[11.5px] font-bold block transition-colors duration-200 ${
                                isEnabled ? 'text-slate-800' : 'text-slate-400 font-medium'
                              }`}>
                                {item.label}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium leading-tight">{item.description}</span>
                            </div>
                          </div>

                          {/* Beautiful Toggle Switch */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleItem(item.id);
                            }}
                            className={`relative inline-flex h-5.5 w-10.5 items-center rounded-full transition-all duration-300 cursor-pointer outline-none ${
                              isEnabled 
                                ? 'bg-indigo-600 shadow-md shadow-indigo-600/20' 
                                : 'bg-slate-200 hover:bg-slate-300'
                            }`}
                            role="switch"
                            aria-checked={isEnabled}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                                isEnabled ? 'translate-x-[22px]' : 'translate-x-[4px]'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Sticky Preview Panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 space-y-6">
            
            {/* Presets Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Wand2 size={15} className="text-indigo-600" />
                Cấu hình mẫu (Presets)
              </h2>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => applyPreset('minimal')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                    activePreset() === 'minimal'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold shadow-md shadow-indigo-600/5'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="text-[11px] font-bold block">Tối giản</span>
                  <span className="text-[8.5px] text-slate-400 mt-1 block leading-tight">Chỉ định dạng cơ bản</span>
                </button>

                <button
                  onClick={() => applyPreset('standard')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                    activePreset() === 'standard'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold shadow-md shadow-indigo-600/5'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="text-[11px] font-bold block">Cơ bản</span>
                  <span className="text-[8.5px] text-slate-400 mt-1 block leading-tight">Phù hợp mọi tin bài</span>
                </button>

                <button
                  onClick={() => applyPreset('full')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                    activePreset() === 'full'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold shadow-md shadow-indigo-600/5'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="text-[11px] font-bold block">Đầy đủ</span>
                  <span className="text-[8.5px] text-slate-400 mt-1 block leading-tight">Đầy đủ 33 tính năng</span>
                </button>
              </div>
            </div>

            {/* Live Interactive Preview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md shadow-slate-100/60 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Xem trước trực tiếp (Live)
                </h2>
                <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md font-semibold">
                  <Laptop size={10} />
                  <span>Real-time Interactive</span>
                </div>
              </div>

              {/* Toolbar Visual Preview */}
              <div className="mb-4 bg-slate-50/80 border border-slate-200/80 rounded-xl p-3">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Thứ tự nút hiển thị:</span>
                <div className="flex flex-wrap items-center gap-1 min-h-[36px] content-start bg-white border border-slate-200/50 rounded-lg p-2">
                  {enabledCount === 0 ? (
                    <span className="text-[10px] text-slate-400 italic font-medium">Chưa có nút bấm nào được bật. Hãy bật một số công cụ ở bên trái.</span>
                  ) : (
                    ALL_TOOLBAR_ITEMS.filter(item => config[item.id]).map(item => (
                      <div 
                        key={item.id}
                        title={item.label}
                        className="w-6.5 h-6.5 flex items-center justify-center bg-slate-50 border border-slate-200/60 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-all shrink-0 cursor-help"
                      >
                        {item.icon}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dynamic Interactive Editor Box */}
              <div className="relative group">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Soạn thảo thử nghiệm:</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner">
                  <RichTextEditor
                    key={previewEditorKey}
                    content={previewContent}
                    setContent={setPreviewContent}
                    setHasUnsavedChanges={() => {}}
                    placeholder="Hãy viết hoặc kiểm tra các phím chức năng..."
                    className="h-[250px]"
                    modules={{ toolbar: buildQuillToolbar(config) }}
                  />
                </div>
                <div className="mt-2.5 flex items-start gap-1.5 text-slate-400">
                  <HelpCircle size={12} className="shrink-0 mt-0.5" />
                  <span className="text-[9.5px] font-medium leading-normal">
                    Trình soạn thảo trên được khởi tạo với cấu hình toolbar hiện tại của bạn. Mọi hành động gõ chữ và định dạng đều hoạt động bình thường!
                  </span>
                </div>
              </div>
            </div>

            {/* Helper Tips Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 text-xs text-slate-500 leading-relaxed shadow-inner">
              <h3 className="font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Sparkles size={13} className="text-violet-500" />
                Lời khuyên tối ưu
              </h3>
              <ul className="list-disc pl-4.5 space-y-1 text-[11px] font-medium">
                <li>Nên bật <strong className="text-indigo-600">Dropdown tiêu đề</strong> thay vì các nút H1-H4 rời rạc để giao diện viết bài gọn gàng hơn.</li>
                <li>Không nên bật tất cả 33 công cụ cùng một lúc, điều này có thể làm vỡ dòng thanh công cụ trên màn hình di động nhỏ.</li>
                <li>Sử dụng preset <strong className="text-indigo-600">Cơ bản</strong> là lựa chọn phù hợp nhất cho hầu hết quản trị viên CMS.</li>
              </ul>
            </div>

          </div>
        </div>

      </div>

      {/* Sticky Bottom Bar for Changes */}
      {hasChanges && (
        <div className="fixed bottom-0 left-56 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-8 py-3.5 flex items-center justify-between z-40 shadow-[0_-8px_30px_rgba(43,111,238,0.1)] animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs text-slate-600 font-bold">
              Bạn có thay đổi chưa lưu! Hãy bấm Lưu thay đổi để áp dụng cấu hình mới.
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfig({ ...initialConfig })}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border border-slate-200 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer active:scale-95"
            >
              Hủy thay đổi
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-indigo-500/25 transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Save size={13} />
              {isSaving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
            </button>
          </div>
        </div>
      )}
      </div>
    </CapabilityGuard>
  );
}
