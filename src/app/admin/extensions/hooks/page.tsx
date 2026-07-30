"use client";

import React, { useState, useEffect } from 'react';
import CapabilityGuard from '@/components/CapabilityGuard';
import {
  Zap, AlertTriangle, CheckCircle, RefreshCw, X, Search, Activity, Clock
} from 'lucide-react';
import Link from 'next/link';

interface HookDetails {
  hookName: string;
  type: 'action' | 'filter';
  pluginId: string;
  priority: number;
  lastRun?: string;
  lastError?: string;
}

interface HookErrorLog {
  hookName: string;
  pluginId: string;
  error: string;
  timestamp: string;
}

export default function HooksDashboard() {
  const [hooks, setHooks] = useState<HookDetails[]>([]);
  const [errors, setErrors] = useState<HookErrorLog[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch('/api/system/hooks');
      const data = await res.json();
      if (data.success) {
        setHooks(data.hooks);
        setErrors(data.errors);
        setEnabled(data.enabled);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredHooks = hooks.filter(h => 
    h.hookName.toLowerCase().includes(search.toLowerCase()) || 
    h.pluginId.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium text-xs animate-pulse">Đang tải dữ liệu Hooks...</span>
        </div>
      </div>
    );
  }

  return (
    <CapabilityGuard capability="manage_settings">
      <div className="max-w-6xl mx-auto font-sans pb-12 text-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin/extensions" className="text-slate-400 hover:text-slate-700 transition-colors">
                &larr; Quay lại
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Zap className="text-white" size={18} />
              </div>
              Hook Registry Dashboard
            </h1>
            <p className="text-slate-500 text-xs mt-1.5 ml-[46px]">
              Theo dõi, giám sát và kiểm tra trạng thái hoạt động của các Action/Filter do plugin đăng ký.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${enabled ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
              System: {enabled ? 'ENABLED' : 'DISABLED'}
            </div>
            <button
              onClick={() => { setIsLoading(true); loadData(); }}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] transition-all active:scale-95 cursor-pointer border-none"
            >
              <RefreshCw size={13} /> Làm mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng số Callbacks</div>
            <div className="text-2xl font-black text-slate-800">{hooks.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Actions</div>
            <div className="text-2xl font-black text-blue-600">{hooks.filter(h => h.type === 'action').length}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filters</div>
            <div className="text-2xl font-black text-indigo-600">{hooks.filter(h => h.type === 'filter').length}</div>
          </div>
          <div className="bg-white rounded-xl border border-red-100 p-4 shadow-sm bg-red-50/30">
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Lỗi gần đây</div>
            <div className="text-2xl font-black text-red-600">{errors.length}</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Tìm kiếm hook, plugin..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3">Hook Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Plugin ID</th>
                <th className="px-4 py-3 text-center">Priority</th>
                <th className="px-4 py-3">Trạng thái (Last Run)</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {filteredHooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Không tìm thấy hook nào.
                  </td>
                </tr>
              ) : filteredHooks.map((hook, i) => (
                <tr key={i} className={`hover:bg-slate-50 transition-colors ${hook.lastError ? 'bg-red-50/30 hover:bg-red-50/50' : ''}`}>
                  <td className="px-4 py-3 font-mono font-medium text-slate-700">
                    {hook.hookName}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${hook.type === 'action' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {hook.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-600">
                    {hook.pluginId}
                  </td>
                  <td className="px-4 py-3 text-center font-mono">
                    {hook.priority}
                  </td>
                  <td className="px-4 py-3">
                    {hook.lastError ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-red-600 font-bold">
                          <X size={12} /> Báo lỗi
                        </div>
                        <span className="text-[10px] text-red-500 line-clamp-1" title={hook.lastError}>{hook.lastError}</span>
                      </div>
                    ) : hook.lastRun ? (
                      <div className="flex flex-col gap-1 text-emerald-600">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle size={12} /> Thành công
                        </div>
                        <span className="text-[10px] text-emerald-500 flex items-center gap-1"><Clock size={10} /> {new Date(hook.lastRun).toLocaleTimeString('vi-VN')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Activity size={12} /> Chưa chạy
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </CapabilityGuard>
  );
}
