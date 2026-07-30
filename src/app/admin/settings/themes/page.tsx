"use client";

import React, { useState, useEffect, useRef } from 'react';
import CapabilityGuard from '@/components/CapabilityGuard';
import {
  Palette, CheckCircle, Upload, X, Info, Eye, Clock,
  Tag, History, ChevronRight, Package, ExternalLink,
  Monitor, Layers, FileCode, Smartphone, Star
} from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

interface ThemeInfo {
  id: string;
  name: string;
  nameVi?: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  supports: string[];
  changelog: ChangelogEntry[];
  isActive: boolean;
  folderName: string;
  components: string[];
  warnings?: string[];
  source?: 'BUILT_IN' | 'CONTENT';
  packageStatus?: string;
  canActivate?: boolean;
  activationBlockReason?: string;
}

interface InvalidThemeInfo {
  folderName: string;
  manifestId?: string;
  errors: string[];
  warnings: string[];
}

/* ─────────────────────────────────────────────────────────────── */
/*  Inline Mockup Previews (thay cho screenshot file)             */
/* ─────────────────────────────────────────────────────────────── */

function DefaultThemeMockup() {
  return (
    <div className="w-full h-48 bg-slate-100 flex flex-col justify-between p-3.5 font-mono text-[9px] relative overflow-hidden select-none rounded-t-2xl">
      <div className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center justify-between shadow-sm">
        <span className="font-extrabold text-indigo-600">lexi.vn</span>
        <div className="flex gap-2.5 text-slate-400 font-bold text-[8px]">
          <span>Trang chủ</span>
          <span>Giới thiệu</span>
          <span>Liên hệ</span>
        </div>
      </div>
      <div className="bg-white border border-slate-200/60 rounded-lg p-2 text-center my-2 shadow-sm">
        <div className="font-extrabold text-slate-800 text-[10px]">Lexi CMS</div>
        <div className="text-[7px] text-slate-400 mt-0.5">Giải pháp quản trị chuyên nghiệp</div>
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1 items-stretch">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-8 h-1 bg-indigo-200 rounded mb-1" />
              <div className="w-12 h-1 bg-slate-300 rounded mb-1" />
              <div className="w-10 h-0.5 bg-slate-200 rounded mb-1" />
            </div>
            <div className="w-6 h-1 bg-indigo-500 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ModernThemeMockup() {
  return (
    <div className="w-full h-48 bg-slate-950 flex flex-col justify-between p-3.5 font-mono text-[9px] relative overflow-hidden select-none rounded-t-2xl bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500/20 to-pink-500/20 blur-2xl pointer-events-none" />
      <div className="w-full bg-white/10 backdrop-blur border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center justify-between shadow-lg relative z-10">
        <span className="font-extrabold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Lexi</span>
        <div className="flex gap-2.5 text-slate-300 font-bold text-[8px]">
          <span>Home</span>
          <span>About</span>
        </div>
      </div>
      <div className="text-center my-2 relative z-10">
        <span className="inline-block bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full text-[6px] font-bold uppercase tracking-wider">Premium UI</span>
        <div className="font-extrabold text-white text-[11px] mt-1 tracking-tight">Giao diện tương lai</div>
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1 items-stretch relative z-10">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/5 backdrop-blur border border-white/5 rounded-xl p-1.5 flex flex-col justify-between shadow-md">
            <div>
              <div className="w-8 h-1 bg-indigo-400/30 rounded mb-1" />
              <div className="w-12 h-1.5 bg-white/70 rounded mb-1" />
              <div className="w-10 h-0.5 bg-white/20 rounded" />
            </div>
            <div className="w-6 h-1 bg-gradient-to-r from-indigo-500 to-pink-500 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

const themeMockups: Record<string, React.ReactNode> = {
  default: <DefaultThemeMockup />,
  modern: <ModernThemeMockup />,
};

/* ─────────────────────────────────────────────────────────────── */
/*  Main Component                                                 */
/* ─────────────────────────────────────────────────────────────── */

export default function AdminThemesPage() {
  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const [invalidThemes, setInvalidThemes] = useState<InvalidThemeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [detailTheme, setDetailTheme] = useState<ThemeInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadThemes();
  }, []);

  async function loadThemes() {
    try {
      const res = await fetch('/api/themes');
      const data = await res.json();
      if (data.success) {
        setThemes(data.themes ?? []);
        setInvalidThemes(data.invalidThemes ?? []);
      }
    } catch (err) {
      console.error('Failed to load themes:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleActivate = async (themeId: string) => {
    setActivatingId(themeId);
    setAlertMsg(null);
    try {
      const res = await fetch('/api/themes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId }),
      });
      const data = await res.json();
      if (data.success) {
        setThemes(prev =>
          prev.map(t => ({ ...t, isActive: t.id === themeId }))
        );
        setAlertMsg({ type: 'success', text: data.message + ' Đang tải lại giao diện...' });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setAlertMsg({ type: 'error', text: data.error });
      }
    } catch {
      setAlertMsg({ type: 'error', text: 'Lỗi kết nối máy chủ!' });
    } finally {
      setActivatingId(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress('Đang tải lên...');
    setAlertMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress('Đang giải nén và cài đặt theme...');
      const res = await fetch('/api/themes/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setAlertMsg({ type: 'success', text: data.message });
        setUploadProgress(null);
        await loadThemes();
      } else {
        setAlertMsg({ type: 'error', text: data.error });
        setUploadProgress(null);
      }
    } catch {
      setAlertMsg({ type: 'error', text: 'Lỗi upload theme!' });
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium text-xs animate-pulse">Đang quét danh sách giao diện...</span>
        </div>
      </div>
    );
  }

  const activeTheme = themes.find(t => t.isActive);

  return (
    <CapabilityGuard capability="manage_themes">
      <div className="max-w-6xl mx-auto font-sans pb-12 text-xs">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Palette className="text-white" size={18} />
            </div>
            Giao diện Website
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 ml-[46px]">
            Quản lý, chuyển đổi và cài đặt giao diện cho website.
            {activeTheme && (
              <span className="ml-2 text-indigo-600 font-semibold">
                Đang sử dụng: {activeTheme.nameVi || activeTheme.name}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-[11px] shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer border-none"
        >
          <Upload size={14} />
          {isUploading ? 'Đang cài đặt...' : 'Tải lên Theme (.zip)'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-semibold text-xs flex items-center gap-2 animate-pulse">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          {uploadProgress}
        </div>
      )}

      {/* Alert */}
      {alertMsg && (
        <div
          className={`p-3.5 rounded-xl mb-5 border flex items-start gap-2.5 text-xs font-semibold transition-all duration-300 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {alertMsg.type === 'success' ? <CheckCircle size={15} className="shrink-0 mt-px" /> : <X size={15} className="shrink-0 mt-px" />}
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="ml-auto text-current opacity-50 hover:opacity-100 cursor-pointer bg-transparent border-none">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Invalid Themes Warning */}
      {invalidThemes.length > 0 && (
        <div className="mb-6 bg-red-50/50 border border-red-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-red-100/50 px-5 py-3 border-b border-red-200 flex items-center gap-2">
            <X size={16} className="text-red-600" />
            <h2 className="text-sm font-bold text-red-900">Giao diện không hợp lệ cần xử lý ({invalidThemes.length})</h2>
          </div>
          <div className="p-5 divide-y divide-red-100">
            {invalidThemes.map((it, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0">
                <h3 className="font-bold text-red-800 text-[13px] mb-2 flex items-center gap-1.5">
                  <Palette size={14} className="text-red-500" />
                  {it.folderName}
                  {it.manifestId && <span className="font-normal text-red-600/70 text-[11px]">(ID: {it.manifestId})</span>}
                </h3>
                <ul className="space-y-1.5 ml-5 list-disc">
                  {it.errors.map((err, i) => (
                    <li key={`err-${i}`} className="text-red-600 leading-snug">
                      <span className="font-semibold text-red-700">Lỗi:</span> {err}
                    </li>
                  ))}
                  {it.warnings.map((warn, i) => (
                    <li key={`warn-${i}`} className="text-yellow-600 leading-snug">
                      <span className="font-semibold text-yellow-700">Cảnh báo:</span> {warn}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {themes.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActivating={activatingId === theme.id}
            onActivate={() => handleActivate(theme.id)}
            onViewDetail={() => setDetailTheme(theme)}
          />
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200">
        <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <Package size={13} className="text-indigo-500" /> Cài đặt Theme mới
        </h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Để cài đặt theme mới, hãy tạo file ZIP chứa thư mục theme với các file: <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-[10px]">theme.json</code> (metadata), <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-[10px]">Homepage.tsx</code> (bắt buộc), và các component khác (Header, Footer, PostPage...). Sau đó bấm nút &quot;Tải lên Theme&quot; ở trên.
        </p>
      </div>

      {/* Detail Modal */}
      {detailTheme && (
        <ThemeDetailModal
          theme={detailTheme}
          onClose={() => setDetailTheme(null)}
        />
      )}
      </div>
    </CapabilityGuard>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Theme Card                                                     */
/* ─────────────────────────────────────────────────────────────── */

function ThemeCard({
  theme,
  isActivating,
  onActivate,
  onViewDetail,
}: {
  theme: ThemeInfo;
  isActivating: boolean;
  onActivate: () => void;
  onViewDetail: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden shadow-sm flex flex-col justify-between transition-all duration-300 group ${
        theme.isActive
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10'
          : 'border-slate-200 hover:shadow-lg hover:border-slate-300'
      }`}
    >
      {/* Preview Mockup */}
      <div className="relative">
        {themeMockups[theme.id] || (
          <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center rounded-t-2xl">
            <Palette size={40} className="text-slate-300" />
          </div>
        )}

        {/* Active Badge Overlay */}
        {theme.isActive && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-wider shadow-lg shadow-emerald-500/30">
            <CheckCircle size={11} /> Đang sử dụng
          </div>
        )}

        {/* Preview Button Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-t-2xl">
          <a
            href={`/?preview_theme=${theme.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur rounded-xl text-slate-800 font-bold text-[11px] shadow-lg hover:bg-white transition-all no-underline"
          >
            <Eye size={14} /> Xem trước
          </a>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight leading-tight">
              {theme.nameVi || theme.name}
            </h3>
            {theme.nameVi && (
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{theme.name}</p>
            )}
          </div>
          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0">
            v{theme.version}
          </span>
        </div>

        <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">
          {theme.description}
        </p>

        {/* Tags */}
        {theme.tags && theme.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {theme.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-50 border border-slate-200 text-slate-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

          {theme.activationBlockReason && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold text-amber-700">
              {theme.activationBlockReason}
            </p>
          )}

          {/* Meta */}
        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium pt-1 flex-wrap">
          <span>
            Tác giả: <span className="text-slate-600 font-semibold">{theme.author}</span>
          </span>
          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${theme.source === 'CONTENT' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            {theme.source === 'CONTENT' ? 'CONTENT' : 'BUILT_IN'}
          </span>
          {theme.packageStatus && (
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {theme.packageStatus}
            </span>
          )}
          <span className="flex items-center gap-1">
            <FileCode size={10} /> {theme.components.length} components
          </span>
          {theme.warnings && theme.warnings.length > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-md">
              <Info size={10} /> Có cảnh báo
            </span>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onViewDetail}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
          >
            <Info size={11} /> Chi tiết
          </button>

          <a
            href={`/?preview_theme=${theme.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all no-underline"
          >
            <Eye size={11} /> Xem trước
          </a>
        </div>

        {theme.isActive ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
              <Star size={11} className="fill-emerald-500 text-emerald-500" /> Đang hoạt động
            </span>
            <a href={`/admin/settings/themes/${theme.id}/customize`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-700 transition-colors no-underline shadow-sm">
              <Palette size={11} /> Tùy biến
            </a>
          </div>
        ) : (
          <button
            onClick={onActivate}
            disabled={isActivating || theme.canActivate === false}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg transition-all shadow-sm shadow-indigo-500/10 hover:shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer border-none text-[10px]"
            title={theme.activationBlockReason || 'Kích hoạt'}
          >
            {isActivating ? 'Đang kích hoạt...' : 'Kích hoạt'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Theme Detail Modal                                             */
/* ─────────────────────────────────────────────────────────────── */

function ThemeDetailModal({
  theme,
  onClose,
}: {
  theme: ThemeInfo;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md text-white shrink-0">
              <Palette size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-800 text-base leading-tight">
                {theme.nameVi || theme.name}
              </h2>
              {theme.nameVi && (
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{theme.name}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                  v{theme.version}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  bởi <span className="text-slate-600 font-semibold">{theme.author}</span>
                </span>
                {theme.isActive && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                    <CheckCircle size={10} /> Đang sử dụng
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer bg-transparent border-none"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Description */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Mô tả</h4>
            <p className="text-slate-600 text-xs leading-relaxed">{theme.description}</p>
          </div>

          {/* Tags */}
          {theme.tags && theme.tags.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag size={12} className="text-slate-400" /> Thẻ
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {theme.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Components */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers size={12} className="text-slate-400" /> Components ({theme.components.length})
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {theme.components.map(comp => (
                <div
                  key={comp}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <FileCode size={12} className="text-indigo-500" />
                  <span className="text-[10px] font-semibold text-slate-700">{comp}.tsx</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supports */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Monitor size={12} className="text-slate-400" /> Hỗ trợ
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(theme.supports || []).map(s => (
                <span key={s} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 capitalize">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Changelog */}
          {theme.changelog && theme.changelog.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History size={12} className="text-slate-400" /> Lịch sử phiên bản
              </h4>
              <div className="space-y-3">
                {theme.changelog.map((entry, idx) => (
                  <div key={entry.version} className="relative pl-5">
                    {idx < theme.changelog.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-0 w-px bg-slate-200" />
                    )}
                    <div
                      className={`absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 ${
                        idx === 0 ? 'bg-indigo-500 border-indigo-300' : 'bg-white border-slate-300'
                      }`}
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 text-[11px]">v{entry.version}</span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock size={10} /> {entry.date}
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-[11px] text-slate-600">
                      {entry.changes.map((change, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <ChevronRight size={10} className="text-slate-400 shrink-0 mt-0.5" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Info */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">Thông tin kỹ thuật</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-slate-400 font-medium">Theme ID:</span>
                <span className="text-slate-700 font-bold ml-1">{theme.id}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Folder:</span>
                <span className="text-slate-700 font-bold ml-1">src/themes/{theme.folderName}/</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
