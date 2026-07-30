"use client";

import React, { useState, useEffect, useRef } from 'react';
import CapabilityGuard from '@/components/CapabilityGuard';
import { 
  Sparkles, Mail, MessageCircle, Layout, Search, Filter, 
  ToggleLeft, ToggleRight, ChevronRight, Upload, Package, 
  CheckCircle, XCircle, Clock, Tag, Info, X, ExternalLink,
  Shield, Zap, FileText, History, ChevronDown, AlertTriangle
} from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

interface PluginInfo {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  version: string;
  author: string;
  icon: string;
  iconColor: string;
  settingKey: string;
  category: string;
  requires: string[];
  adminRoute: string | null;
  capabilities: string[];
  changelog: ChangelogEntry[];
  isActive: boolean;
  folderName: string;
  warnings?: string[];
  source?: 'BUILT_IN' | 'CONTENT';
  packageStatus?: string;
  canActivate?: boolean;
  activationBlockReason?: string;
}

interface InvalidPluginInfo {
  folderName: string;
  manifestId?: string;
  errors: string[];
  warnings: string[];
}

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles size={22} />,
  mail: <Mail size={22} />,
  'message-circle': <MessageCircle size={22} />,
  layout: <Layout size={22} />,
  shield: <Shield size={22} />,
};

const categoryLabels: Record<string, string> = {
  seo: 'SEO',
  communication: 'Giao tiếp',
  engagement: 'Tương tác',
  builder: 'Thiết kế',
  security: 'Bảo mật',
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  seo: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  communication: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  engagement: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  builder: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  security: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
};

type FilterMode = 'all' | 'active' | 'inactive';

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [invalidPlugins, setInvalidPlugins] = useState<InvalidPluginInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [detailPlugin, setDetailPlugin] = useState<PluginInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPlugins();
  }, []);

  async function loadPlugins() {
    try {
      const res = await fetch('/api/plugins');
      const data = await res.json();
      if (data.success) {
        setPlugins(data.plugins || []);
        setInvalidPlugins(data.invalidPlugins || []);
      }
    } catch (err) {
      console.error('Failed to load plugins:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleToggle = async (plugin: PluginInfo) => {
    setTogglingId(plugin.id);
    setAlertMsg(null);
    try {
      const res = await fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          pluginId: plugin.id,
          settingKey: plugin.settingKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlugins(prev =>
          prev.map(p => (p.id === plugin.id ? { ...p, isActive: data.isActive } : p))
        );
        setAlertMsg({ type: 'success', text: data.warning ? `${data.message} ${data.warning}` : data.message });
        // Reload after short delay to update sidebar
        setTimeout(() => window.location.reload(), 800);
      } else {
        setAlertMsg({ type: 'error', text: data.error });
      }
    } catch {
      setAlertMsg({ type: 'error', text: 'Lỗi kết nối máy chủ!' });
    } finally {
      setTogglingId(null);
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
      setUploadProgress('Đang giải nén và cài đặt...');
      const res = await fetch('/api/plugins/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setAlertMsg({ type: 'success', text: data.message });
        setUploadProgress(null);
        await loadPlugins();
      } else {
        setAlertMsg({ type: 'error', text: data.error });
        setUploadProgress(null);
      }
    } catch {
      setAlertMsg({ type: 'error', text: 'Lỗi upload plugin!' });
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filter and search
  const filteredPlugins = plugins.filter(p => {
    if (filterMode === 'active' && !p.isActive) return false;
    if (filterMode === 'inactive' && p.isActive) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.nameEn?.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = plugins.filter(p => p.isActive).length;
  const inactiveCount = plugins.filter(p => !p.isActive).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium text-xs animate-pulse">Đang quét danh sách plugin...</span>
        </div>
      </div>
    );
  }

  return (
    <CapabilityGuard capability="manage_plugins">
      <div className="max-w-6xl mx-auto font-sans pb-12 text-xs">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Package className="text-white" size={18} />
            </div>
            Tính năng mở rộng
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 ml-[46px]">
            Quản lý, kích hoạt và cài đặt các plugin mở rộng cho hệ thống CMS.
          </p>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-[11px] shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer border-none"
        >
          <Upload size={14} />
          {isUploading ? 'Đang cài đặt...' : 'Tải lên Plugin (.zip)'}
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
        <div className="mb-4 p-3 rounded-xl bg-violet-50 border border-violet-200 text-violet-800 font-semibold text-xs flex items-center gap-2 animate-pulse">
          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
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
          {alertMsg.type === 'success' ? <CheckCircle size={15} className="shrink-0 mt-px" /> : <XCircle size={15} className="shrink-0 mt-px" />}
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="ml-auto text-current opacity-50 hover:opacity-100 cursor-pointer bg-transparent border-none">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Invalid Plugins Warning */}
      {invalidPlugins.length > 0 && (
        <div className="mb-6 bg-red-50/50 border border-red-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-red-100/50 px-5 py-3 border-b border-red-200 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <h2 className="text-sm font-bold text-red-900">Plugin không hợp lệ cần xử lý ({invalidPlugins.length})</h2>
          </div>
          <div className="p-5 divide-y divide-red-100">
            {invalidPlugins.map((ip, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0">
                <h3 className="font-bold text-red-800 text-[13px] mb-2 flex items-center gap-1.5">
                  <Package size={14} className="text-red-500" />
                  {ip.folderName}
                  {ip.manifestId && <span className="font-normal text-red-600/70 text-[11px]">(ID: {ip.manifestId})</span>}
                </h3>
                <ul className="space-y-1.5 ml-5 list-disc">
                  {ip.errors.map((err, i) => (
                    <li key={`err-${i}`} className="text-red-600 leading-snug">
                      <span className="font-semibold text-red-700">Lỗi:</span> {err}
                    </li>
                  ))}
                  {ip.warnings.map((warn, i) => (
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

      {/* Toolbar: Search + Filter */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm plugin..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
          {([
            { key: 'all' as FilterMode, label: 'Tất cả', count: plugins.length },
            { key: 'active' as FilterMode, label: 'Đang hoạt động', count: activeCount },
            { key: 'inactive' as FilterMode, label: 'Đã tắt', count: inactiveCount },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterMode(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-none ${
                filterMode === tab.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 bg-transparent'
              }`}
            >
              {tab.label} <span className="opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Plugins List */}
      {filteredPlugins.length === 0 ? (
        <div className="text-center py-16">
          <Package size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 font-semibold">Không tìm thấy plugin nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlugins.map(plugin => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              isToggling={togglingId === plugin.id}
              onToggle={() => handleToggle(plugin)}
              onViewDetail={() => setDetailPlugin(plugin)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailPlugin && (
        <PluginDetailModal
          plugin={detailPlugin}
          onClose={() => setDetailPlugin(null)}
        />
      )}
      </div>
    </CapabilityGuard>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Plugin Card Component                                          */
/* ─────────────────────────────────────────────────────────────── */

function PluginCard({
  plugin,
  isToggling,
  onToggle,
  onViewDetail,
}: {
  plugin: PluginInfo;
  isToggling: boolean;
  onToggle: () => void;
  onViewDetail: () => void;
}) {
  const catColor = categoryColors[plugin.category] || categoryColors.builder;

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg group ${
        plugin.isActive
          ? 'border-emerald-200/80 shadow-sm shadow-emerald-500/5'
          : 'border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-5 p-5">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
            plugin.isActive ? 'bg-gradient-to-br shadow-lg' : 'bg-slate-100'
          }`}
          style={
            plugin.isActive
              ? {
                  background: `linear-gradient(135deg, ${plugin.iconColor}22, ${plugin.iconColor}44)`,
                  color: plugin.iconColor,
                }
              : { color: '#94a3b8' }
          }
        >
          {iconMap[plugin.icon] || <Package size={22} />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-slate-800 text-[13px] leading-tight truncate">
              {plugin.name}
            </h3>
            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0">
              v{plugin.version}
            </span>
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${catColor.bg} ${catColor.text} ${catColor.border} border`}>
              {categoryLabels[plugin.category] || plugin.category}
            </span>
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${plugin.source === 'CONTENT' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              {plugin.source === 'CONTENT' ? 'CONTENT' : 'BUILT_IN'}
            </span>
            {plugin.packageStatus && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {plugin.packageStatus}
              </span>
            )}
            {plugin.isActive ? (
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                <CheckCircle size={10} /> Đang hoạt động
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md">
                <XCircle size={10} /> Đã tắt
              </span>
            )}
            {plugin.warnings && plugin.warnings.length > 0 && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-md">
                <AlertTriangle size={10} /> Có cảnh báo
              </span>
            )}
          </div>

          {plugin.nameEn && (
            <p className="text-[10px] text-slate-400 font-medium mb-1">{plugin.nameEn}</p>
          )}

          <p className="text-slate-500 text-[11px] leading-relaxed mb-2.5 line-clamp-2">
            {plugin.description}
          </p>

          {plugin.activationBlockReason && (
            <p className="mb-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold text-amber-700">
              {plugin.activationBlockReason}
            </p>
          )}

          {plugin.warnings && plugin.warnings.length > 0 && (
            <p className="mb-2.5 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-[10px] font-semibold text-yellow-700">
              {plugin.warnings[0]}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Shield size={10} /> {plugin.author}
            </span>
            {plugin.capabilities.length > 0 && (
              <span className="flex items-center gap-1">
                <Zap size={10} /> {plugin.capabilities.length} tính năng
              </span>
            )}
            {plugin.changelog.length > 0 && (
              <span className="flex items-center gap-1">
                <History size={10} /> {plugin.changelog.length} phiên bản
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onViewDetail}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
          >
            <Info size={12} /> Chi tiết
          </button>

          {plugin.adminRoute && plugin.isActive && (
            <a
              href={plugin.adminRoute}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-all no-underline"
            >
              <ExternalLink size={12} /> Cài đặt
            </a>
          )}

          <button
            onClick={onToggle}
            disabled={isToggling || (!plugin.isActive && plugin.canActivate === false)}
            className={`focus:outline-none transition-all duration-200 active:scale-90 cursor-pointer disabled:opacity-50 bg-transparent border-none p-0 ${
              plugin.isActive ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-400'
            }`}
            title={plugin.activationBlockReason || (plugin.isActive ? 'Vô hiệu hóa' : 'Kích hoạt')}
          >
            {plugin.isActive ? (
              <ToggleRight size={38} className="stroke-[1.5]" />
            ) : (
              <ToggleLeft size={38} className="stroke-[1.5]" />
            )}
          </button>
        </div>
      </div>

      {/* Capabilities Bar */}
      {plugin.isActive && plugin.capabilities.length > 0 && (
        <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Tính năng:</span>
          {plugin.capabilities.map(cap => (
            <span
              key={cap}
              className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white border border-slate-200 text-slate-500 whitespace-nowrap"
            >
              {cap}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Plugin Detail Modal                                            */
/* ─────────────────────────────────────────────────────────────── */

function PluginDetailModal({
  plugin,
  onClose,
}: {
  plugin: PluginInfo;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-md"
              style={{
                background: `linear-gradient(135deg, ${plugin.iconColor}22, ${plugin.iconColor}44)`,
                color: plugin.iconColor,
              }}
            >
              {iconMap[plugin.icon] || <Package size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-800 text-base leading-tight">{plugin.name}</h2>
              {plugin.nameEn && (
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{plugin.nameEn}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                  v{plugin.version}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  bởi <span className="text-slate-600 font-semibold">{plugin.author}</span>
                </span>
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
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText size={12} className="text-slate-400" /> Mô tả
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed">{plugin.description}</p>
          </div>

          {/* Capabilities */}
          {plugin.capabilities.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap size={12} className="text-slate-400" /> Tính năng ({plugin.capabilities.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {plugin.capabilities.map(cap => (
                  <span
                    key={cap}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-violet-50 border border-violet-200 text-violet-700"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {plugin.requires.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-amber-500" /> Phụ thuộc
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {plugin.requires.map(dep => (
                  <span
                    key={dep}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-700"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Changelog */}
          {plugin.changelog.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History size={12} className="text-slate-400" /> Lịch sử phiên bản
              </h4>
              <div className="space-y-3">
                {plugin.changelog.map((entry, idx) => (
                  <div key={entry.version} className="relative pl-5">
                    {/* Timeline line */}
                    {idx < plugin.changelog.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-0 w-px bg-slate-200" />
                    )}
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 ${
                        idx === 0
                          ? 'bg-violet-500 border-violet-300'
                          : 'bg-white border-slate-300'
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
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag size={12} className="text-slate-400" /> Thông tin kỹ thuật
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-slate-400 font-medium">Plugin ID:</span>
                <span className="text-slate-700 font-bold ml-1">{plugin.id}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Setting Key:</span>
                <span className="text-slate-700 font-bold ml-1">{plugin.settingKey}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Category:</span>
                <span className="text-slate-700 font-bold ml-1">{categoryLabels[plugin.category] || plugin.category}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Folder:</span>
                <span className="text-slate-700 font-bold ml-1">src/plugins/{plugin.folderName}/</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
