"use client";

import React, { useState, useEffect, useCallback } from 'react';
import CapabilityGuard from '@/components/CapabilityGuard';
import {
  Package, Palette, Shield, Activity, Zap, AlertTriangle, CheckCircle,
  XCircle, ChevronRight, ToggleLeft, ToggleRight, RefreshCw, Heart,
  HardDrive, Layers, Lock, Unlock, Eye, Clock, TrendingUp, Info,
  ShieldAlert, ShieldCheck, Cpu, Database, Plug, X, FileCode
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────

interface HookInfo {
  name: string;
  callbacks: number;
  plugins: string[];
}

interface HookError {
  hookName: string;
  pluginId: string;
  error: string;
  timestamp: string;
}

interface SystemHealth {
  health: {
    status: 'healthy' | 'warning' | 'safe-mode';
    timestamp: string;
  };
  hooks: {
    enabled: boolean;
    totalActions: number;
    totalFilters: number;
    totalCallbacks: number;
    recentErrors: HookError[];
    registeredHooks: {
      actions: HookInfo[];
      filters: HookInfo[];
    };
  };
  plugins: {
    total: number;
    totalSize: number;
    totalSizeFormatted: string;
  };
  themes: {
    total: number;
    totalSize: number;
    totalSizeFormatted: string;
  };
  safeMode: {
    active: boolean;
    reason: string | null;
    activatedAt: string | null;
    consecutiveErrors: number;
  };
  permissions: Record<string, {
    permissions: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  storage: {
    totalSize: number;
    totalSizeFormatted: string;
    backupCount: number;
  };
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
  capabilities: string[];
  isActive: boolean;
  permissions?: string[];
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
  isActive: boolean;
  components: string[];
}

// ─── Main Component ─────────────────────────────────────────────

export default function ExtensionsPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [invalidPlugins, setInvalidPlugins] = useState<any[]>([]);
  const [themes, setThemes] = useState<ThemeInfo[]>([]);
  const [invalidThemes, setInvalidThemes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'hooks' | 'permissions' | 'errors'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [safeModeToggling, setSafeModeToggling] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [healthRes, pluginsRes, themesRes] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/plugins'),
        fetch('/api/themes'),
      ]);

      const healthData = await healthRes.json();
      const pluginsData = await pluginsRes.json();
      const themesData = await themesRes.json();

      if (healthData.success) setHealth(healthData);
      if (pluginsData.success) {
        setPlugins(pluginsData.plugins ?? []);
        setInvalidPlugins(pluginsData.invalidPlugins ?? []);
      }
      if (themesData.success) {
        setThemes(themesData.themes ?? []);
        setInvalidThemes(themesData.invalidThemes ?? []);
      }
    } catch (err) {
      console.error('Failed to load extension data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSafeModeToggle = async () => {
    if (!health) return;
    setSafeModeToggling(true);
    setAlertMsg(null);

    try {
      const action = health.safeMode.active ? 'deactivate' : 'activate';
      const res = await fetch('/api/system/safe-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: 'Toggled from Extensions Dashboard' }),
      });
      const data = await res.json();
      if (data.success) {
        setAlertMsg({ type: 'success', text: data.message });
        await loadData();
      } else {
        setAlertMsg({ type: 'error', text: data.error });
      }
    } catch {
      setAlertMsg({ type: 'error', text: 'Lỗi kết nối!' });
    } finally {
      setSafeModeToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium text-xs animate-pulse">Đang phân tích hệ thống...</span>
        </div>
      </div>
    );
  }

  const activePlugins = plugins.filter(p => p.isActive).length;
  const activeTheme = themes.find(t => t.isActive);
  const statusColor = health?.health.status === 'healthy'
    ? 'emerald' : health?.health.status === 'warning' ? 'amber' : 'red';

  return (
    <CapabilityGuard capability="manage_plugins">
      <div className="max-w-6xl mx-auto font-sans pb-12 text-xs">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Cpu className="text-white" size={18} />
            </div>
            Quản lý Hệ thống Extension
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 ml-[46px]">
            Hook System, Plugin Loader, Safe Mode, Permissions & Security
          </p>
        </div>

        <button
          onClick={() => { setIsLoading(true); loadData(); }}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] transition-all active:scale-95 cursor-pointer border-none"
        >
          <RefreshCw size={13} /> Làm mới
        </button>
      </div>

      {/* Alert */}
      {alertMsg && (
        <div className={`p-3.5 rounded-xl mb-5 border flex items-start gap-2.5 text-xs font-semibold transition-all duration-300 ${
          alertMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle size={15} className="shrink-0 mt-px" /> : <XCircle size={15} className="shrink-0 mt-px" />}
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="ml-auto text-current opacity-50 hover:opacity-100 cursor-pointer bg-transparent border-none">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── Status Cards Row ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* System Status */}
        <div className={`bg-white rounded-2xl border p-4 shadow-sm border-${statusColor}-200`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</span>
            <div className={`w-2.5 h-2.5 rounded-full bg-${statusColor}-500 animate-pulse`} />
          </div>
          <div className={`text-base font-extrabold text-${statusColor}-600 tracking-tight`}>
            {health?.health.status === 'healthy' ? 'Khỏe mạnh' :
             health?.health.status === 'warning' ? 'Cảnh báo' : 'Safe Mode'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Cập nhật: {health ? new Date(health.health.timestamp).toLocaleTimeString('vi-VN') : '—'}
          </p>
        </div>

        {/* Plugins */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plugins</span>
            <Package size={14} className="text-violet-500" />
          </div>
          <div className="text-base font-extrabold text-slate-800 tracking-tight">
            {activePlugins}<span className="text-slate-400 font-bold text-xs">/{plugins.length} active</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{invalidPlugins.length > 0 ? <span className="text-red-500 font-bold">{invalidPlugins.length} invalid</span> : 'All valid'}</span>
            <span>{health?.plugins.totalSizeFormatted || '—'}</span>
          </p>
        </div>

        {/* Themes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Themes</span>
            <Palette size={14} className="text-indigo-500" />
          </div>
          <div className="text-base font-extrabold text-slate-800 tracking-tight">
            {themes.length} <span className="text-slate-400 font-bold text-xs">valid</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 flex flex-col gap-0.5">
            <span>Đang dùng: {activeTheme?.nameVi || activeTheme?.name || '—'}</span>
            {invalidThemes.length > 0 && <span className="text-red-500 font-bold">{invalidThemes.length} invalid</span>}
          </p>
        </div>

        {/* Hooks */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm group hover:border-amber-300 hover:shadow-md transition-all relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-amber-600 transition-colors">Hooks</span>
            <Zap size={14} className="text-amber-500" />
          </div>
          <div className="text-base font-extrabold text-slate-800 tracking-tight">
            {health?.hooks.totalCallbacks || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{health?.hooks.totalActions || 0} actions · {health?.hooks.totalFilters || 0} filters</span>
            <a href="/admin/extensions/hooks" className="text-amber-600 font-bold hover:underline flex items-center gap-0.5">
              Chi tiết <ChevronRight size={10} />
            </a>
          </div>
        </div>
      </div>

      {/* ─── Safe Mode Banner ──────────────────────────────── */}
      <div className={`rounded-2xl border p-5 mb-6 flex items-center justify-between ${
        health?.safeMode.active
          ? 'bg-red-50 border-red-200'
          : 'bg-emerald-50/50 border-emerald-200/60'
      }`}>
        <div className="flex items-center gap-4">
          {health?.safeMode.active ? (
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
              <ShieldAlert size={20} className="text-red-600" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ShieldCheck size={20} className="text-emerald-600" />
            </div>
          )}
          <div>
            <h3 className={`font-bold text-sm ${health?.safeMode.active ? 'text-red-800' : 'text-emerald-800'}`}>
              {health?.safeMode.active ? 'Chế độ An toàn đang BẬT' : 'Chế độ An toàn đang TẮT'}
            </h3>
            <p className={`text-[11px] mt-0.5 ${health?.safeMode.active ? 'text-red-600' : 'text-emerald-600'}`}>
              {health?.safeMode.active
                ? `Lý do: ${health.safeMode.reason || 'Không rõ'}`
                : 'Tất cả plugins và hooks đang hoạt động bình thường.'}
            </p>
            {health?.safeMode.activatedAt && health?.safeMode.active && (
              <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                <Clock size={10} /> Kích hoạt: {new Date(health.safeMode.activatedAt).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleSafeModeToggle}
          disabled={safeModeToggling}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[11px] transition-all active:scale-95 cursor-pointer border-none disabled:opacity-50 shadow-sm ${
            health?.safeMode.active
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
              : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
          }`}
        >
          {health?.safeMode.active ? (
            <><Unlock size={13} /> {safeModeToggling ? 'Đang tắt...' : 'Tắt Safe Mode'}</>
          ) : (
            <><Lock size={13} /> {safeModeToggling ? 'Đang bật...' : 'Bật Safe Mode'}</>
          )}
        </button>
      </div>

      {/* ─── Tab Navigation ────────────────────────────────── */}
      <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 mb-6">
        {([
          { key: 'overview' as const, label: 'Tổng quan', icon: <Activity size={12} /> },
          { key: 'hooks' as const, label: 'Hook Explorer', icon: <Zap size={12} /> },
          { key: 'permissions' as const, label: 'Phân quyền', icon: <Shield size={12} /> },
          { key: 'errors' as const, label: `Lỗi (${health?.hooks.recentErrors.length || 0})`, icon: <AlertTriangle size={12} /> },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-none ${
              activeTab === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 bg-transparent'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ───────────────────────────────────── */}
      {activeTab === 'overview' && <OverviewTab plugins={plugins} themes={themes} health={health} />}
      {activeTab === 'hooks' && health && <HookExplorerTab hooks={health.hooks} />}
      {activeTab === 'permissions' && <PermissionsTab plugins={plugins} health={health} />}
      {activeTab === 'errors' && health && <ErrorsTab errors={health.hooks.recentErrors} />}
      </div>
    </CapabilityGuard>
  );
}

// ─── Overview Tab ───────────────────────────────────────────────

function OverviewTab({ plugins, themes, health }: {
  plugins: PluginInfo[];
  themes: ThemeInfo[];
  health: SystemHealth | null;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Plugins */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
            <Package size={14} className="text-violet-500" /> Plugins ({plugins.length})
          </h3>
          <a href="/settings/plugins" className="text-[10px] font-bold text-violet-600 hover:text-violet-700 no-underline flex items-center gap-1">
            Quản lý <ChevronRight size={10} />
          </a>
        </div>
        <div className="divide-y divide-slate-50">
          {plugins.map(plugin => (
            <div key={plugin.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                  plugin.isActive ? 'shadow-sm' : 'bg-slate-100'
                }`}
                style={plugin.isActive ? {
                  background: `linear-gradient(135deg, ${plugin.iconColor}15, ${plugin.iconColor}30)`,
                  color: plugin.iconColor,
                } : { color: '#94a3b8' }}
              >
                <Plug size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-[11px] truncate">{plugin.name}</span>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">v{plugin.version}</span>
                </div>
                <span className="text-[10px] text-slate-400">{plugin.author}</span>
              </div>
              {plugin.isActive ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Đang hoạt động" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" title="Đã tắt" />
              )}
            </div>
          ))}
          {plugins.length === 0 && (
            <div className="px-5 py-8 text-center text-slate-400 text-[11px]">Chưa có plugin nào</div>
          )}
        </div>
      </div>

      {/* Themes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
            <Palette size={14} className="text-indigo-500" /> Themes ({themes.length})
          </h3>
          <a href="/settings/themes" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 no-underline flex items-center gap-1">
            Quản lý <ChevronRight size={10} />
          </a>
        </div>
        <div className="divide-y divide-slate-50">
          {themes.map(theme => (
            <div key={theme.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                theme.isActive
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                <Palette size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-[11px] truncate">{theme.nameVi || theme.name}</span>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">v{theme.version}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400">{theme.author}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <FileCode size={9} /> {theme.components.length} components
                  </span>
                </div>
              </div>
              {theme.isActive && (
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle size={9} /> Active
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Storage Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
        <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2 mb-4">
          <HardDrive size={14} className="text-slate-500" /> Lưu trữ
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Plugins</span>
            <div className="text-sm font-extrabold text-slate-700 mt-1">{health?.plugins.totalSizeFormatted || '—'}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Themes</span>
            <div className="text-sm font-extrabold text-slate-700 mt-1">{health?.themes.totalSizeFormatted || '—'}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Backups</span>
            <div className="text-sm font-extrabold text-slate-700 mt-1">{health?.storage.backupCount || 0} bản sao</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hook Explorer Tab ──────────────────────────────────────────

function HookExplorerTab({ hooks: hookData }: { hooks: SystemHealth['hooks'] }) {
  const [showType, setShowType] = useState<'actions' | 'filters'>('actions');

  const items = showType === 'actions'
    ? hookData.registeredHooks.actions
    : hookData.registeredHooks.filters;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
          <Zap size={14} className="text-amber-500" />
          Hook Explorer
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            hookData.enabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {hookData.enabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </h3>
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setShowType('actions')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer border-none transition-all ${
              showType === 'actions' ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-500'
            }`}
          >
            Actions ({hookData.totalActions})
          </button>
          <button
            onClick={() => setShowType('filters')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer border-none transition-all ${
              showType === 'filters' ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-500'
            }`}
          >
            Filters ({hookData.totalFilters})
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-12 text-center text-slate-400">
          <Zap size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-[11px] font-semibold">Chưa có {showType === 'actions' ? 'action' : 'filter'} hook nào được đăng ký</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {items.map(hook => (
            <div key={hook.name} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                showType === 'actions' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {showType === 'actions' ? <Activity size={14} /> : <TrendingUp size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <code className="font-bold text-slate-700 text-[11px] bg-slate-50 px-2 py-0.5 rounded">{hook.name}</code>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Layers size={9} /> {hook.callbacks} callback{hook.callbacks > 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Plug size={9} /> {hook.plugins.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Permissions Tab ────────────────────────────────────────────

function PermissionsTab({ plugins, health }: { plugins: PluginInfo[]; health: SystemHealth | null }) {
  const riskColors = {
    low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <ShieldCheck size={12} /> },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Shield size={12} /> },
    high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <ShieldAlert size={12} /> },
  };

  return (
    <div className="space-y-4">
      {plugins.map(plugin => {
        const permData = health?.permissions[plugin.id];
        const risk = permData?.riskLevel || 'low';
        const colors = riskColors[risk];
        const permissions = permData?.permissions || plugin.permissions || [];

        return (
          <div key={plugin.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${plugin.iconColor}15, ${plugin.iconColor}30)`,
                  color: plugin.iconColor,
                }}
              >
                <Plug size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800 text-[12px]">{plugin.name}</h4>
                  {plugin.isActive ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{plugin.author} · v{plugin.version}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                {colors.icon}
                {risk === 'low' ? 'Thấp' : risk === 'medium' ? 'Trung bình' : 'Cao'}
              </div>
            </div>

            {permissions.length > 0 && (
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap gap-1.5">
                {permissions.map(perm => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white border border-slate-200 text-slate-600"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            )}

            {permissions.length === 0 && (
              <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                Plugin này không yêu cầu quyền đặc biệt (config-driven)
              </div>
            )}
          </div>
        );
      })}

      {plugins.length === 0 && (
        <div className="text-center py-16">
          <Shield size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 font-semibold text-[11px]">Chưa có plugin nào để hiển thị quyền.</p>
        </div>
      )}
    </div>
  );
}

// ─── Errors Tab ─────────────────────────────────────────────────

function ErrorsTab({ errors }: { errors: HookError[] }) {
  if (errors.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <Heart size={40} className="mx-auto text-emerald-300 mb-3" />
        <h3 className="text-sm font-bold text-slate-700 mb-1">Không có lỗi nào!</h3>
        <p className="text-[11px] text-slate-400">Tất cả hooks và plugins đang hoạt động hoàn hảo.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <AlertTriangle size={14} className="text-red-500" />
        <h3 className="font-bold text-slate-800 text-xs">Lỗi gần đây ({errors.length})</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {errors.map((err, idx) => (
          <div key={idx} className="px-5 py-3 hover:bg-red-50/30 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <code className="font-bold text-red-600 text-[11px] bg-red-50 px-2 py-0.5 rounded">{err.hookName}</code>
              <span className="text-[10px] text-slate-400">từ</span>
              <span className="font-bold text-slate-600 text-[11px]">{err.pluginId}</span>
            </div>
            <p className="text-[10px] text-red-500 font-medium">{err.error}</p>
            <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock size={9} /> {new Date(err.timestamp).toLocaleString('vi-VN')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
