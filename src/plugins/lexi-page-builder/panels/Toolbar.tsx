"use client";

import React, { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { Laptop, Tablet, Smartphone, Undo2, Redo2, Save, X, RotateCcw, Layers, FileText, Settings, Globe, Palette, Type, CreditCard, LayoutGrid, ChevronLeft, ChevronDown, Eye } from 'lucide-react';
import { usePageSettings } from '../PageSettingsContext';
import type { PageLayoutType } from '../PageSettingsContext';
import { WebsiteSettings } from '../utils/websiteSettingsHelper';

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Oswald',
  'Merriweather',
  'Playfair Display',
  'Nunito',
  'Source Sans 3',
  'Noto Sans',
  'Be Vietnam Pro',
  'Roboto Slab',
  'Raleway',
];

interface ToolbarProps {
  pageTitle: string;
  device: 'desktop' | 'tablet' | 'mobile';
  setDevice: (d: 'desktop' | 'tablet' | 'mobile') => void;
  hasUnsavedChanges: boolean;
  isAutoSaving: boolean;
  lastSavedAt: Date | null;
  onSave: () => void;
  onSaveVersion?: () => void;
  onSaveDraft?: () => void;
  onPreview?: () => void;
  onClose: () => void;
  isSaving: boolean;
  isSavingDraft?: boolean;
  isPreviewing?: boolean;
  showNavigator: boolean;
  setShowNavigator: (show: boolean) => void;
  websiteSettings: WebsiteSettings;
  setWebsiteSettings: React.Dispatch<React.SetStateAction<WebsiteSettings>>;
  backLabel?: string;
}

export default function Toolbar({
  pageTitle,
  device,
  setDevice,
  hasUnsavedChanges,
  isAutoSaving,
  lastSavedAt,
  onSave,
  onSaveVersion,
  onSaveDraft,
  onPreview,
  onClose,
  isSaving,
  isSavingDraft = false,
  isPreviewing = false,
  showNavigator,
  setShowNavigator,
  websiteSettings,
  setWebsiteSettings,
  backLabel,
}: ToolbarProps) {
  const { actions, canUndo, canRedo } = useEditor((_, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  const { pageLayout, setPageLayout } = usePageSettings();
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [showWebsiteSettings, setShowWebsiteSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'colors' | 'typography' | 'buttons' | 'layout'>('colors');
  const [isSavingWebsiteSettings, setIsSavingWebsiteSettings] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  const handleSaveWebsiteSettings = async () => {
    setIsSavingWebsiteSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customSettings: {
            website_settings: JSON.stringify(websiteSettings)
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Đã lưu Cài đặt website thành công!");
      } else {
        alert("Lỗi khi lưu cài đặt website: " + data.error);
      }
    } catch (err) {
      console.error("Save website settings error:", err);
      alert("Lỗi kết nối khi lưu cài đặt website!");
    } finally {
      setIsSavingWebsiteSettings(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thiết kế hiện tại không?')) {
      actions.deserialize({
        ROOT: {
          type: { resolvedName: 'Container' },
          isCanvas: true,
          props: {
            paddingTop: '0px',
            paddingBottom: '0px',
            paddingLeft: '0px',
            paddingRight: '0px',
            backgroundColor: 'transparent',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
          },
          displayName: 'Khung chứa',
          parent: null,
          hidden: false,
          nodes: [],
          linkedNodes: {},
        },
      });
    }
  };

  return (
    <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 font-sans shadow-sm z-[60] relative select-none">
      
      {/* Left section: Back and Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onClose(); }}
          className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg border shadow-sm transition-all cursor-pointer text-xs font-bold active:scale-[0.98] ${
            backLabel 
              ? 'bg-brand-50 hover:bg-brand-100/80 border-brand-200 text-brand-700 hover:text-brand-800 animate-fade-in' 
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
          }`}
          title={backLabel || "Trở về"}
        >
          <ChevronLeft size={14} />
          <span>{backLabel || "Trở về"}</span>
        </button>
        <div>
          <h2 className="text-xs font-bold text-slate-800 tracking-tight leading-tight max-w-[200px] truncate">
            {pageTitle || 'Trang không có tiêu đề'}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isAutoSaving ? (
              <span className="text-[9px] text-brand-500 font-bold animate-pulse">Đang tự động lưu...</span>
            ) : hasUnsavedChanges ? (
              <span className="text-[9px] text-amber-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> Chưa lưu thay đổi
              </span>
            ) : (
              <span className="text-[9px] text-emerald-500 font-bold">
                {lastSavedAt
                  ? `Đã lưu: ${lastSavedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : 'Đã lưu mọi thay đổi'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle section: Device Viewports & Undo/Redo */}
      <div className="flex items-center gap-4">
        {/* Device Switcher */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
          {(['desktop', 'tablet', 'mobile'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                device === d
                  ? 'bg-white text-brand-600 shadow-sm font-bold scale-[1.03]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title={d === 'desktop' ? 'Máy tính' : d === 'tablet' ? 'Máy tính bảng' : 'Điện thoại'}
            >
              {d === 'desktop' && <Laptop size={14} />}
              {d === 'tablet' && <Tablet size={14} />}
              {d === 'mobile' && <Smartphone size={14} />}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-slate-200"></div>

        {/* History Controls */}
        <div className="flex items-center gap-1 bg-slate-100/50 p-0.5 rounded-lg border border-slate-200/20">
          <button
            disabled={!canUndo}
            onClick={() => actions.history.undo()}
            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:hover:text-slate-400 rounded-md cursor-pointer transition-colors"
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo2 size={13} />
          </button>
          <button
            disabled={!canRedo}
            onClick={() => actions.history.redo()}
            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:hover:text-slate-400 rounded-md cursor-pointer transition-colors"
            title="Làm lại (Ctrl+Y / Ctrl+Shift+Z)"
          >
            <Redo2 size={13} />
          </button>
        </div>
      </div>

      {/* Right section: Action Buttons */}
      <div className="flex items-center gap-3">
        
        {/* Workspace Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowWorkspaceMenu(!showWorkspaceMenu);
              setShowSaveDropdown(false);
            }}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer active:scale-[0.98] ${
              showWorkspaceMenu || showPageSettings || showWebsiteSettings
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
            }`}
            title="Cài đặt Workspace"
          >
            <Settings size={14} />
            <span>Workspace</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${showWorkspaceMenu ? 'rotate-180' : ''}`} />
          </button>

          {showWorkspaceMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowWorkspaceMenu(false)} />
              <div className="absolute right-0 mt-2 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 animate-fade-in text-slate-700">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Không gian làm việc
                </div>
                
                <button
                  onClick={() => {
                    setShowNavigator(!showNavigator);
                    setShowWorkspaceMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 flex items-center gap-2 transition-colors ${
                    showNavigator ? 'text-brand-600 font-bold bg-brand-50/30' : 'text-slate-600'
                  }`}
                >
                  <Layers size={14} className={showNavigator ? 'text-brand-500' : 'text-slate-400'} />
                  <span>Cấu trúc Layers (Navigator)</span>
                  {showNavigator && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
                </button>

                <button
                  onClick={() => {
                    setShowPageSettings(true);
                    setShowWebsiteSettings(false);
                    setShowWorkspaceMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 flex items-center gap-2 text-slate-600 transition-colors"
                >
                  <Settings size={14} className="text-slate-400" />
                  <span>Cài đặt trang</span>
                </button>

                <button
                  onClick={() => {
                    setShowWebsiteSettings(true);
                    setShowPageSettings(false);
                    setShowWorkspaceMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 flex items-center gap-2 text-slate-600 transition-colors"
                >
                  <Globe size={14} className="text-slate-400" />
                  <span>Cài đặt website (Design System)</span>
                </button>

                <div className="border-t border-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    handleClear();
                    setShowWorkspaceMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
                >
                  <RotateCcw size={14} className="text-red-400" />
                  <span>Xóa sạch Canvas</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Separator */}
        <div className="h-4 w-px bg-slate-200"></div>

        {/* Actions Group */}
        <div className="flex items-center gap-2">
          {onPreview && (
            <button
              onClick={onPreview}
              disabled={isPreviewing}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-100 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              title="Xem trước trên tab mới"
            >
              <Eye size={14} />
              <span>{isPreviewing ? 'Đang tải...' : 'Xem trước'}</span>
            </button>
          )}

          <div className="flex items-center relative">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onSave(); }}
              disabled={isSaving || !hasUnsavedChanges}
              className={`active:scale-[0.98] disabled:opacity-60 text-white font-bold text-xs py-1.5 pl-3.5 pr-2.5 rounded-l-lg flex items-center gap-1.5 border-r border-white/20 transition-all cursor-pointer shadow-sm ${
                hasUnsavedChanges 
                  ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/30 shadow-md animate-pulse-slight'
                  : 'bg-slate-400 cursor-default'
              }`}
              title={hasUnsavedChanges ? "Lưu tất cả thay đổi" : "Không có thay đổi mới nào để lưu"}
            >
              <Save size={13} />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu'}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowSaveDropdown(!showSaveDropdown);
                setShowWorkspaceMenu(false);
              }}
              className={`text-white p-1.5 rounded-r-lg flex items-center justify-center transition-all cursor-pointer h-[30px] shadow-sm active:scale-[0.98] ${
                hasUnsavedChanges
                  ? 'bg-brand-600 hover:bg-brand-700'
                  : 'bg-slate-400 hover:bg-slate-500'
              }`}
              title="Lựa chọn lưu trữ"
            >
              <ChevronDown size={13} className={`transition-transform duration-200 ${showSaveDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSaveDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSaveDropdown(false)} />
                <div className="absolute right-0 mt-2 top-8 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 animate-fade-in text-slate-700">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Lựa chọn lưu
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onSave();
                      setShowSaveDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-start gap-2 transition-colors text-slate-600"
                  >
                    <Save size={14} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Lưu thay đổi</div>
                      <div className="text-[9px] text-slate-400 font-medium mt-0.5">Lưu đè dữ liệu thiết kế hiện tại</div>
                    </div>
                  </button>

                  {onSaveDraft && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onSaveDraft();
                        setShowSaveDropdown(false);
                      }}
                      disabled={isSavingDraft}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-start gap-2 transition-colors text-slate-600 disabled:opacity-50"
                    >
                      <FileText size={14} className="text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-800">{isSavingDraft ? 'Đang lưu...' : 'Lưu bản nháp'}</div>
                        <div className="text-[9px] text-slate-400 font-medium mt-0.5">Lưu dưới dạng nháp tạm thời</div>
                      </div>
                    </button>
                  )}

                  {onSaveVersion && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onSaveVersion();
                        setShowSaveDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-start gap-2 transition-colors text-slate-600"
                    >
                      <span className="text-[12px] mt-0.5">⭐</span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Lưu phiên bản (Version)</div>
                        <div className="text-[9px] text-slate-400 font-medium mt-0.5">Tạo mốc lưu trữ có tên để khôi phục</div>
                      </div>
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      alert("Trang sẽ được xuất bản đầy đủ sau khi bạn bấm lưu và nhấn nút Xuất bản/Cập nhật ở màn hình thiết lập trang chính.");
                      setShowSaveDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-start gap-2 transition-colors text-slate-500 hover:text-slate-700"
                  >
                    <Globe size={14} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5 text-slate-800">
                        <span>Xuất bản trang</span>
                        <span className="bg-brand-50 text-brand-600 text-[8px] font-bold px-1 py-0.2 rounded border border-brand-200">Gợi ý</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium mt-0.5">Mẹo: Cấu hình trạng thái bên ngoài trang thiết lập</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Page Settings Slide Panel */}
      {showPageSettings && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPageSettings(false)} />
          <div className="absolute top-14 right-4 z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings size={14} className="text-brand-500" />
                <h3 className="text-sm font-bold text-slate-800">Cài đặt trang</h3>
              </div>
              <button
                onClick={() => setShowPageSettings(false)}
                className="p-1 hover:bg-slate-100 rounded-md cursor-pointer transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Page Layout */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bố cục trang</label>
                <div className="space-y-1.5">
                  {([
                    { value: 'THEME_DEFAULT', label: 'Theme Default', desc: 'Header + Sidebar + Footer' },
                    { value: 'FULL_WIDTH', label: 'Full Width', desc: 'Header + Content 100% + Footer' },
                    { value: 'CANVAS', label: 'Canvas', desc: 'Chỉ nội dung, không Header/Footer' },
                  ] as { value: PageLayoutType; label: string; desc: string }[]).map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        pageLayout === opt.value
                          ? 'border-brand-300 bg-brand-50/50 ring-1 ring-brand-200'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pageLayout"
                        value={opt.value}
                        checked={pageLayout === opt.value}
                        onChange={() => setPageLayout(opt.value)}
                        className="mt-0.5 accent-brand-500"
                      />
                      <div>
                        <div className={`text-xs font-bold ${
                          pageLayout === opt.value ? 'text-brand-700' : 'text-slate-700'
                        }`}>{opt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Template</label>
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500">
                  Header/Footer sẽ tự hiển thị theo Bố cục trang. Mục Apply Template sẽ được mở rộng ở bước sau.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Website Settings (Design System) Slide Panel */}
      {showWebsiteSettings && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowWebsiteSettings(false)} />
          <div className="absolute top-14 right-4 z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl animate-fade-in flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-brand-500" />
                <h3 className="text-sm font-bold text-slate-800">Cài đặt website</h3>
              </div>
              <button
                onClick={() => setShowWebsiteSettings(false)}
                className="p-1 hover:bg-slate-100 rounded-md cursor-pointer transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            </div>

            {/* Inner Tabs */}
            <div className="flex border-b border-slate-100 text-[10px] font-bold text-slate-400 bg-slate-50/50 shrink-0 select-none">
              {([
                { id: 'colors', label: 'Màu sắc', icon: Palette },
                { id: 'typography', label: 'Font chữ', icon: Type },
                { id: 'buttons', label: 'Nút bấm', icon: CreditCard },
                { id: 'layout', label: 'Bố cục', icon: LayoutGrid },
              ] as const).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSettingsTab(tab.id)}
                    className={`flex-1 py-2 text-center border-b-2 transition-all flex items-center justify-center gap-1 ${
                      activeSettingsTab === tab.id
                        ? 'border-brand-500 text-brand-600 bg-white font-black'
                        : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    <Icon size={10} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
              
              {/* TAB: COLORS */}
              {activeSettingsTab === 'colors' && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Màu toàn trang (Global Colors)</h4>
                  {([
                    { key: 'primary', label: 'Primary (Chính)' },
                    { key: 'secondary', label: 'Secondary (Phụ)' },
                    { key: 'accent', label: 'Accent (Nhấn mạnh)' },
                    { key: 'success', label: 'Success (Thành công)' },
                    { key: 'warning', label: 'Warning (Cảnh báo)' },
                    { key: 'danger', label: 'Danger (Nguy hiểm)' },
                    { key: 'background', label: 'Màu nền trang' },
                    { key: 'text', label: 'Màu chữ chính' },
                  ] as const).map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <span className="font-semibold text-slate-600">{item.label}</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={websiteSettings.colors[item.key] || '#000000'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWebsiteSettings((prev: WebsiteSettings) => ({
                              ...prev,
                              colors: { ...prev.colors, [item.key]: val }
                            }));
                          }}
                          className="h-7 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                        />
                        <input
                          type="text"
                          value={websiteSettings.colors[item.key] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWebsiteSettings((prev: WebsiteSettings) => ({
                              ...prev,
                              colors: { ...prev.colors, [item.key]: val }
                            }));
                          }}
                          className="h-7 w-20 rounded border border-slate-200 px-2 text-[10px] font-mono text-slate-700 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB: TYPOGRAPHY */}
              {activeSettingsTab === 'typography' && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Phông chữ toàn trang (Global Typography)</h4>
                  
                  {([
                    { key: 'headingFont', label: 'Font tiêu đề (Heading)' },
                    { key: 'bodyFont', label: 'Font văn bản (Body)' },
                    { key: 'smallFont', label: 'Font chữ nhỏ (Small)' },
                    { key: 'buttonFont', label: 'Font chữ nút bấm' },
                  ] as const).map((item) => (
                    <div key={item.key} className="space-y-1">
                      <label className="block font-semibold text-slate-600">{item.label}</label>
                      <select
                        value={websiteSettings.typography[item.key] || 'Inter'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWebsiteSettings((prev: WebsiteSettings) => ({
                            ...prev,
                            typography: { ...prev.typography, [item.key]: val }
                          }));
                        }}
                        className="w-full h-8 px-2 border border-slate-200 rounded-lg outline-none cursor-pointer text-slate-700 bg-white font-medium"
                      >
                        {GOOGLE_FONTS.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB: BUTTON PRESETS */}
              {activeSettingsTab === 'buttons' && (
                <div className="space-y-5">
                  {/* Primary Button */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Primary Button Preset</h4>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Màu nền</span>
                      <input
                        type="color"
                        value={websiteSettings.buttons.primaryBg || '#3b82f6'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWebsiteSettings((prev: WebsiteSettings) => ({
                            ...prev,
                            buttons: { ...prev.buttons, primaryBg: val }
                          }));
                        }}
                        className="h-7 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Nền khi di chuột</span>
                      <input
                        type="color"
                        value={websiteSettings.buttons.primaryHoverBg || '#1d4ed8'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWebsiteSettings((prev: WebsiteSettings) => ({
                            ...prev,
                            buttons: { ...prev.buttons, primaryHoverBg: val }
                          }));
                        }}
                        className="h-7 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Màu chữ</span>
                      <input
                        type="color"
                        value={websiteSettings.buttons.primaryColor || '#ffffff'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWebsiteSettings((prev: WebsiteSettings) => ({
                            ...prev,
                            buttons: { ...prev.buttons, primaryColor: val }
                          }));
                        }}
                        className="h-7 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-600 block">Bo góc (Border Radius)</span>
                      <input
                        type="text"
                        value={websiteSettings.buttons.primaryRadius || '8px'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWebsiteSettings((prev: WebsiteSettings) => ({
                            ...prev,
                            buttons: { ...prev.buttons, primaryRadius: val }
                          }));
                        }}
                        className="w-full h-8 px-2 border border-slate-200 rounded-lg outline-none text-slate-700"
                        placeholder="8px"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-600 block">Padding dọc</span>
                        <input
                          type="text"
                          value={websiteSettings.buttons.primaryPaddingY || '12px'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWebsiteSettings((prev: WebsiteSettings) => ({
                              ...prev,
                              buttons: { ...prev.buttons, primaryPaddingY: val }
                            }));
                          }}
                          className="w-full h-8 px-2 border border-slate-200 rounded-lg outline-none text-slate-700 text-center font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-600 block">Padding ngang</span>
                        <input
                          type="text"
                          value={websiteSettings.buttons.primaryPaddingX || '24px'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWebsiteSettings((prev: WebsiteSettings) => ({
                              ...prev,
                              buttons: { ...prev.buttons, primaryPaddingX: val }
                            }));
                          }}
                          className="w-full h-8 px-2 border border-slate-200 rounded-lg outline-none text-slate-700 text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Secondary Button */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Secondary Button Preset</h4>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Màu nền</span>
                      <input
                        type="color"
                        value={websiteSettings.buttons.secondaryBg || '#475569'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWebsiteSettings((prev: WebsiteSettings) => ({
                            ...prev,
                            buttons: { ...prev.buttons, secondaryBg: val }
                          }));
                        }}
                        className="h-7 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Nền khi di chuột</span>
                      <input
                        type="color"
                        value={websiteSettings.buttons.secondaryHoverBg || '#334155'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWebsiteSettings((prev: WebsiteSettings) => ({
                            ...prev,
                            buttons: { ...prev.buttons, secondaryHoverBg: val }
                          }));
                        }}
                        className="h-7 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-600">Màu chữ</span>
                      <input
                        type="color"
                        value={websiteSettings.buttons.secondaryColor || '#ffffff'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWebsiteSettings((prev: WebsiteSettings) => ({
                            ...prev,
                            buttons: { ...prev.buttons, secondaryColor: val }
                          }));
                        }}
                        className="h-7 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-600 block">Bo góc (Border Radius)</span>
                      <input
                        type="text"
                        value={websiteSettings.buttons.secondaryRadius || '8px'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWebsiteSettings((prev: WebsiteSettings) => ({
                            ...prev,
                            buttons: { ...prev.buttons, secondaryRadius: val }
                          }));
                        }}
                        className="w-full h-8 px-2 border border-slate-200 rounded-lg outline-none text-slate-700"
                        placeholder="8px"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-600 block">Padding dọc</span>
                        <input
                          type="text"
                          value={websiteSettings.buttons.secondaryPaddingY || '12px'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWebsiteSettings((prev: WebsiteSettings) => ({
                              ...prev,
                              buttons: { ...prev.buttons, secondaryPaddingY: val }
                            }));
                          }}
                          className="w-full h-8 px-2 border border-slate-200 rounded-lg outline-none text-slate-700 text-center font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-600 block">Padding ngang</span>
                        <input
                          type="text"
                          value={websiteSettings.buttons.secondaryPaddingX || '24px'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWebsiteSettings((prev: WebsiteSettings) => ({
                              ...prev,
                              buttons: { ...prev.buttons, secondaryPaddingX: val }
                            }));
                          }}
                          className="w-full h-8 px-2 border border-slate-200 rounded-lg outline-none text-slate-700 text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: LAYOUT */}
              {activeSettingsTab === 'layout' && (
                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Bố cục hệ thống (Layout System)</h4>
                  
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-600 block">Chiều rộng nội dung (Max Content Width)</span>
                    <input
                      type="text"
                      value={websiteSettings.layout.contentWidth || '1200px'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWebsiteSettings((prev: WebsiteSettings) => ({
                          ...prev,
                          layout: { ...prev.layout, contentWidth: val }
                        }));
                      }}
                      className="w-full h-8 px-2 border border-slate-200 rounded-lg outline-none text-slate-700 font-mono"
                      placeholder="1200px"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-600 block">Khoảng cách Container (Container Gap)</span>
                    <input
                      type="text"
                      value={websiteSettings.layout.containerGap || '5px'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWebsiteSettings((prev: WebsiteSettings) => ({
                          ...prev,
                          layout: { ...prev.layout, containerGap: val }
                        }));
                      }}
                      className="w-full h-8 px-2 border border-slate-200 rounded-lg outline-none text-slate-700 font-mono"
                      placeholder="5px"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-600 block">Khoảng cách Section (Section Spacing)</span>
                    <input
                      type="text"
                      value={websiteSettings.layout.sectionSpacing || '80px'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWebsiteSettings((prev: WebsiteSettings) => ({
                          ...prev,
                          layout: { ...prev.layout, sectionSpacing: val }
                        }));
                      }}
                      className="w-full h-8 px-2 border border-slate-200 rounded-lg outline-none text-slate-700 font-mono"
                      placeholder="80px"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Footer containing Save button */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-b-xl shrink-0">
              <span className="text-[10px] text-slate-400 font-medium italic">Áp dụng toàn website</span>
              <button
                type="button"
                onClick={handleSaveWebsiteSettings}
                disabled={isSavingWebsiteSettings}
                className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Save size={11} />
                {isSavingWebsiteSettings ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
