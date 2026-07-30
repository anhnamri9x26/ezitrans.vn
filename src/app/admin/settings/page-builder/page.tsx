"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CapabilityGuard from '@/components/CapabilityGuard';
import { Save, Sparkles, ClipboardList, Key, Settings, HelpCircle, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, Wand2, Type, Sliders, ChevronRight, ExternalLink, FileText, Loader2, X, Layout, PackageCheck } from 'lucide-react';

interface AIConfig {
  enableAI: boolean;
  model: string;
  temperature: number;
  maxRequestsPerDay: number;
  allowedRoles: string[];
}

interface LogEntry {
  id: number;
  userId: number;
  promptSummary: string;
  model: string;
  tokens: number;
  status: 'SUCCESS' | 'FAILED';
  error: string | null;
  createdAt: string;
  user: {
    username: string;
    name: string | null;
    role: string;
  };
}

interface BuilderPluginInfo {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
  updateChannels?: string[];
}

export default function PageBuilderSettingsPage() {
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [role, setRole] = useState<string>('');

  // Configuration State
  const [enableAI, setEnableAI] = useState(false);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [maxRequestsPerDay, setMaxRequestsPerDay] = useState(50);
  const [allowedRoles, setAllowedRoles] = useState<string[]>(['ADMIN', 'EDITOR']);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [builderPlugin, setBuilderPlugin] = useState<BuilderPluginInfo | null>(null);

  // Agent Selection & Verification States
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'unchecked' | 'checking' | 'valid' | 'invalid'>('unchecked');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/page-builder/ai/settings');
        const data = await res.json();
        
        // Fetch current user details for role checking
        const profileRes = await fetch('/api/users/profile');
        const profileData = await profileRes.json();
        if (profileData.success && profileData.user) {
          setRole(profileData.user.role);
        }

        if (data.success && data.settings) {
          const cfg = data.settings;
          setEnableAI(cfg.enableAI);
          setModel(cfg.model);
          setTemperature(cfg.temperature);
          setMaxRequestsPerDay(cfg.maxRequestsPerDay);
          setAllowedRoles(cfg.allowedRoles);
          setGeminiApiKey(cfg.geminiApiKey || '');
          setHasApiKey(data.hasApiKey);
        }

        const pluginsRes = await fetch('/api/plugins');
        const pluginsData = await pluginsRes.json();
        if (pluginsData.success && Array.isArray(pluginsData.plugins)) {
          const lexiPlugin = pluginsData.plugins.find((plugin: BuilderPluginInfo) => plugin.id === 'lexi-page-builder');
          setBuilderPlugin(lexiPlugin || null);
        }
      } catch (err) {
        console.error('Lỗi khi tải cấu hình AI:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Fetch pages and check connection status once settings loaded
  useEffect(() => {
    async function loadPagesAndCheck() {
      try {
        const pagesRes = await fetch('/api/posts?type=PAGE');
        const pagesData = await pagesRes.json();
        if (pagesData.success && pagesData.posts) {
          setPages(pagesData.posts);
          if (pagesData.posts.length > 0) {
            setSelectedPageId(pagesData.posts[0].id.toString());
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách trang:', err);
      }

      if (hasApiKey) {
        setConnectionStatus('checking');
        try {
          const verifyRes = await fetch('/api/page-builder/ai/verify', { method: 'POST' });
          const verifyData = await verifyRes.json();
          if (verifyData.success && verifyData.valid) {
            setConnectionStatus('valid');
            setConnectionError(null);
          } else {
            setConnectionStatus('invalid');
            setConnectionError(verifyData.error || 'Gemini API Key không hợp lệ.');
          }
        } catch (err) {
          setConnectionStatus('invalid');
          setConnectionError('Không thể kết nối máy chủ để kiểm tra.');
        }
      }
    }

    if (!isLoading) {
      loadPagesAndCheck();
    }
  }, [isLoading, hasApiKey]);

  // Fetch logs whenever the user clicks the logs tab
  useEffect(() => {
    if (activeTab !== 'logs' || role !== 'ADMIN') return;

    async function loadLogs() {
      setIsLoadingLogs(true);
      try {
        const res = await fetch('/api/page-builder/ai/logs');
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải nhật ký AI:', err);
      } finally {
        setIsLoadingLogs(false);
      }
    }
    loadLogs();
  }, [activeTab, role]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'ADMIN') {
      alert('Chỉ quản trị viên mới có quyền lưu cấu hình này.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/page-builder/ai/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enableAI,
          model,
          temperature,
          maxRequestsPerDay,
          allowedRoles,
          geminiApiKey
        })
      });
      const data = await res.json();
      if (data.success) {
        setHasApiKey(geminiApiKey.trim() !== '' || hasApiKey);
        
        // Dynamic verification immediately after saving
        setConnectionStatus('checking');
        const verifyRes = await fetch('/api/page-builder/ai/verify', { method: 'POST' });
        const verifyData = await verifyRes.json();
        
        if (verifyData.success && verifyData.valid) {
          setConnectionStatus('valid');
          setConnectionError(null);
          setIsAgentModalOpen(true);
        } else {
          setConnectionStatus('invalid');
          setConnectionError(verifyData.error || 'API Key kiểm tra thất bại.');
          alert('Đã lưu cấu hình, nhưng Gemini API Key không vượt qua thử nghiệm kết nối: ' + (verifyData.error || 'Lỗi không xác định'));
        }
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối máy chủ để lưu cấu hình.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleToggle = (targetRole: string) => {
    if (allowedRoles.includes(targetRole)) {
      if (allowedRoles.length === 1) {
        alert('Phải chọn ít nhất một vai trò được phép truy cập.');
        return;
      }
      setAllowedRoles(allowedRoles.filter(r => r !== targetRole));
    } else {
      setAllowedRoles([...allowedRoles, targetRole]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="text-slate-500 font-semibold animate-pulse text-xs">Đang tải thiết lập...</div>
      </div>
    );
  }

  if (builderPlugin?.isActive === false) {
    return (
      <div className="max-w-2xl mx-auto font-sans pt-12 pb-24 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-6 shrink-0 shadow-sm border border-indigo-100">
            <Sparkles size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Lexi Page Builder Chưa Kích Hoạt</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
            Hệ thống Theme Builder và tính năng hỗ trợ thiết kế bằng AI Copilot hiện đang bị tắt. Vui lòng kích hoạt lại plugin trong Plugin Manager để mở trang cấu hình AI.
          </p>
          <Link 
            href="/admin/settings/plugins" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-98"
          >
            Kích hoạt Plugin ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CapabilityGuard capability="manage_templates">
      <div className="max-w-4xl mx-auto font-sans pb-12 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Sparkles className="text-brand-500" size={24} /> Cấu hình Page Builder AI Design
          </h1>
          <p className="text-slate-500 text-xs mt-1">Thiết lập kết nối, phân quyền và giám sát lịch sử tạo giao diện tự động bằng AI.</p>
        </div>
        {activeTab === 'config' && role === 'ADMIN' && (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-indigo-500/20 active:translate-y-0.5 disabled:opacity-50 cursor-pointer border-none outline-none text-xs"
          >
            <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 bg-slate-100/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-xs border-none cursor-pointer ${
            activeTab === 'config'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'bg-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings size={14} />
          Cấu hình AI Design
        </button>
        {role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-xs border-none cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList size={14} />
            Lịch sử cuộc gọi AI
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'config' ? (
        <form onSubmit={handleSave} className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-sm">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                  <Layout size={22} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">Lexi Page Builder</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${(builderPlugin?.isActive as any) === false ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {(builderPlugin?.isActive as any) === false ? 'Đang tắt' : 'Đang bật'}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-indigo-700 ring-1 ring-indigo-100">
                      v{builderPlugin?.version || '1.0.0'}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-2xl text-[11px] font-medium leading-5 text-slate-600">
                    Plugin dựng trang kéo thả chính thức. Hỗ trợ cập nhật qua ZIP upload và Git-based workflow, đồng thời quản lý bật/tắt tại Plugin Manager.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/settings/plugins"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[11px] font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                <PackageCheck size={14} /> Quản lý Plugin <ExternalLink size={13} />
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
              <Settings size={18} className="text-indigo-500" /> Cài đặt chung
            </h2>

            <div className="space-y-5 max-w-2xl">
              {/* Enable AI design */}
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-slate-700 text-right">Kích hoạt AI Design</label>
                <div className="col-span-2">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={enableAI}
                      onChange={(e) => setEnableAI(e.target.checked)}
                      disabled={role !== 'ADMIN'}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ml-3 text-[11px] font-semibold text-slate-500">
                      {enableAI ? 'Bật tính năng thiết kế tự động bằng AI' : 'Tắt AI (ngăn người dùng gọi prompt)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* API Key Input and Status */}
              <div className="grid grid-cols-3 items-start gap-4">
                <div className="text-right mt-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-end gap-1">
                    <Key size={12} className="text-slate-400" /> Gemini API Key
                  </label>
                </div>
                <div className="col-span-2 space-y-2">
                  <input 
                    type="password"
                    placeholder="Nhập Gemini API Key tại đây..."
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    disabled={role !== 'ADMIN'}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 bg-white font-mono text-xs max-w-md w-full"
                  />
                  <div className={`p-3.5 rounded-xl border flex flex-col gap-3.5 max-w-md ${
                    hasApiKey 
                      ? connectionStatus === 'valid' 
                        ? 'bg-emerald-50/40 border-emerald-200/60 text-emerald-950' 
                        : connectionStatus === 'invalid'
                          ? 'bg-rose-50/40 border-rose-200/60 text-rose-950'
                          : 'bg-slate-50/50 border-slate-200 text-slate-700'
                      : 'bg-amber-50/50 border-amber-200/60 text-amber-950'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      {hasApiKey ? (
                        connectionStatus === 'valid' ? (
                          <>
                            <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <div className="font-extrabold text-[11px] text-emerald-950 uppercase tracking-wider">API Key hợp lệ & Đã kết nối</div>
                              <div className="text-[10.5px] text-emerald-800/90 font-medium mt-1 leading-relaxed">
                                Kết nối đến Gemini API hoạt động rất tốt. Dịch vụ AI Design đã sẵn sàng hoạt động trên Page Builder.
                              </div>
                            </div>
                          </>
                        ) : connectionStatus === 'invalid' ? (
                          <>
                            <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-extrabold text-[11px] text-rose-950 uppercase tracking-wider">Lỗi kết nối Gemini API</div>
                              <div className="text-[10.5px] text-rose-800/95 font-medium mt-1 leading-relaxed">
                                Cấu hình lỗi: {connectionError || 'API Key không hợp lệ.'}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <Loader2 size={16} className="text-indigo-500 shrink-0 mt-0.5 animate-spin" />
                            <div>
                              <div className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider">Đang kiểm tra kết nối...</div>
                              <div className="text-[10.5px] text-slate-500 font-medium mt-1">Đang thực hiện cuộc gọi thử đến API Gemini...</div>
                            </div>
                          </>
                        )
                      ) : (
                        <>
                          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-extrabold text-[11px] text-amber-950 uppercase tracking-wider">Chưa cấu hình API Key</div>
                            <div className="text-[10.5px] text-amber-800/90 font-medium mt-1 leading-relaxed">
                              Vui lòng nhập API Key để kích hoạt tính năng AI Design cho Page Builder.
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {hasApiKey && connectionStatus === 'valid' && (
                      <div className="pt-2 border-t border-emerald-100 flex justify-between items-center">
                        <span className="text-[10px] text-emerald-600/80 font-bold">Trợ lý AI sẵn sàng!</span>
                        <button
                          type="button"
                          onClick={() => setIsAgentModalOpen(true)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition-all flex items-center gap-1 border-none cursor-pointer"
                        >
                          ⚡ Xem các Agent của bạn
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Default Model */}
              <div className="grid grid-cols-3 items-center gap-4">
                <label className="text-xs font-bold text-slate-700 text-right">Mô hình AI mặc định</label>
                <div className="col-span-2">
                  <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={role !== 'ADMIN'}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 bg-white font-bold cursor-pointer max-w-xs w-full"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Nhanh, chuẩn)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Tiết kiệm cước phí)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Thông minh nhất, phản hồi chậm hơn)</option>
                  </select>
                </div>
              </div>

              {/* Temperature */}
              <div className="grid grid-cols-3 items-start gap-4">
                <label className="text-xs font-bold text-slate-700 text-right mt-2">Độ sáng tạo (Temperature)</label>
                <div className="col-span-2">
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.0" 
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      disabled={role !== 'ADMIN'}
                      className="w-48 accent-indigo-600"
                    />
                    <span className="font-mono font-bold text-slate-700 text-xs bg-slate-100 px-2 py-0.5 rounded border">{temperature}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Chỉ số thấp = thiết kế quy chuẩn, an toàn. Chỉ số cao = thiết kế phong phú, phá cách hơn.</p>
                </div>
              </div>

              {/* Requests limit quota */}
              <div className="grid grid-cols-3 items-start gap-4">
                <label className="text-xs font-bold text-slate-700 text-right mt-2">Giới hạn số yêu cầu / Ngày</label>
                <div className="col-span-2">
                  <input 
                    type="number" 
                    min="1" 
                    max="1000"
                    value={maxRequestsPerDay}
                    onChange={(e) => setMaxRequestsPerDay(parseInt(e.target.value) || 0)}
                    disabled={role !== 'ADMIN'}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 bg-white font-bold max-w-[120px]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Tổng số yêu cầu tối đa toàn hệ thống được gửi đến Gemini API trong một ngày.</p>
                </div>
              </div>

              {/* Allowed Roles */}
              <div className="grid grid-cols-3 items-start gap-4">
                <label className="text-xs font-bold text-slate-700 text-right mt-1.5">Vai trò được phép dùng</label>
                <div className="col-span-2 space-y-2">
                  {['ADMIN', 'EDITOR'].map(r => (
                    <label key={r} className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-700 hover:text-indigo-600 transition-colors w-fit">
                      <input 
                        type="checkbox" 
                        checked={allowedRoles.includes(r)}
                        onChange={() => handleRoleToggle(r)}
                        disabled={role !== 'ADMIN'}
                        className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer rounded"
                      />
                      <span>{r === 'ADMIN' ? 'Administrator (Quản trị viên)' : 'Editor (Biên tập viên)'}</span>
                    </label>
                  ))}
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Quyết định xem thành viên nhóm quyền nào có thể thấy nút trợ lý AI trong Page Builder.</p>
                </div>
              </div>
            </div>
          </section>
        </form>
      ) : (
        /* Logs Tab Content (ADMIN only) */
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
            <ClipboardList size={18} className="text-indigo-500" /> Nhật ký cuộc gọi AI gần đây
          </h2>

          {isLoadingLogs ? (
            <div className="text-center text-slate-400 py-10 font-bold">
              Đang tải lịch sử cuộc gọi AI...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center text-slate-400 py-10">
              Chưa có cuộc gọi AI nào được thực hiện hoặc ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase tracking-wider bg-slate-50/50">
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3">Người dùng</th>
                    <th className="py-2.5 px-3">Hành động / Tóm tắt</th>
                    <th className="py-2.5 px-3">Mô hình</th>
                    <th className="py-2.5 px-3 text-center">Tokens (Ước tính)</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600 font-medium">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-700">{log.user.name || log.user.username}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">{log.user.role}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-[280px]">
                        <div className="font-semibold text-slate-800 break-words">{log.promptSummary}</div>
                        {log.error && (
                          <div className="text-[9.5px] text-rose-500 bg-rose-50 border border-rose-100/50 p-1.5 rounded mt-1 break-words font-sans">
                            {log.error}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-500">
                        {log.model}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                        {log.tokens}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {log.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/50 font-bold text-[9px]">
                            <CheckCircle2 size={10} className="text-emerald-500" /> THÀNH CÔNG
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200/50 font-bold text-[9px]">
                            <XCircle size={10} className="text-rose-500" /> THẤT BẠI
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Agent Selection Modal */}
      <AgentSelectionModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        pages={pages}
        selectedPageId={selectedPageId}
        setSelectedPageId={setSelectedPageId}
        connectionStatus={connectionStatus}
        connectionError={connectionError}
      />
      </div>
    </CapabilityGuard>
  );
}

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: any[];
  selectedPageId: string;
  setSelectedPageId: (id: string) => void;
  connectionStatus: 'unchecked' | 'checking' | 'valid' | 'invalid';
  connectionError: string | null;
}

function AgentSelectionModal({
  isOpen,
  onClose,
  pages,
  selectedPageId,
  setSelectedPageId,
  connectionStatus,
  connectionError
}: AgentSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="fixed inset-0 cursor-default" onClick={onClose} />
      <div className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/50 max-w-2xl w-full flex flex-col z-10 mx-4 overflow-hidden p-6 md:p-8 animate-scale-up">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Trung tâm Trợ lý AI Design (AI Agents)</h3>
              <p className="text-[10px] text-indigo-600/80 font-bold uppercase tracking-wider mt-0.5">
                Trí tuệ nhân tạo Gemini đã sẵn sàng hỗ trợ bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer transition-colors border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        {/* Connection Status Banner */}
        <div className="mt-5">
          {connectionStatus === 'checking' && (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <Loader2 size={14} className="animate-spin text-indigo-500" />
              <span>Đang kiểm tra kết nối với Gemini API...</span>
            </div>
          )}
          {connectionStatus === 'valid' && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-[11px] font-semibold text-left">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <div>
                <span className="text-emerald-950 font-bold">Kết nối thành công!</span> Gemini API Key hợp lệ và sẵn sàng hoạt động.
              </div>
            </div>
          )}
          {connectionStatus === 'invalid' && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-start gap-2.5 text-[11px] font-semibold text-left">
              <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-rose-950 font-bold">Lỗi kết nối Gemini API.</span>
                <p className="text-[10px] text-rose-600/80 font-medium mt-1">{connectionError || 'Không thể xác thực API Key.'}</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Agents Grid */}
        <div className="mt-6 space-y-3 text-left">
          <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Danh sách các AI Agent khả dụng</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Agent 1 */}
            <div className="p-4 rounded-2xl border border-slate-200/60 bg-slate-50/50 hover:bg-white hover:border-purple-200 transition-all group hover:shadow-md hover:shadow-purple-500/5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                <Sparkles size={16} />
              </div>
              <h5 className="font-bold text-slate-800 text-[11px] group-hover:text-purple-700 transition-colors">Agent Tạo Section</h5>
              <p className="text-[9.5px] text-slate-400 font-medium mt-1 leading-normal">
                Tạo section Hero, Dịch vụ, FAQ, CTA, Bảng giá... hoàn chỉnh từ mô tả ý tưởng của bạn.
              </p>
              <div className="text-[8.5px] text-purple-600/80 font-bold mt-2.5 uppercase tracking-wide">
                LeftSidebar → AI
              </div>
            </div>

            {/* Agent 2 */}
            <div className="p-4 rounded-2xl border border-slate-200/60 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all group hover:shadow-md hover:shadow-indigo-500/5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                <Wand2 size={16} />
              </div>
              <h5 className="font-bold text-slate-800 text-[11px] group-hover:text-indigo-700 transition-colors">Agent Cải Tiến Layout</h5>
              <p className="text-[9.5px] text-slate-400 font-medium mt-1 leading-normal">
                Tự động cải tiến, sắp xếp lại khoảng cách, bo góc và chỉnh style cho một Container bất kỳ.
              </p>
              <div className="text-[8.5px] text-indigo-600/80 font-bold mt-2.5 uppercase tracking-wide">
                Chọn Container
              </div>
            </div>

            {/* Agent 3 */}
            <div className="p-4 rounded-2xl border border-slate-200/60 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all group hover:shadow-md hover:shadow-blue-500/5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Type size={16} />
              </div>
              <h5 className="font-bold text-slate-800 text-[11px] group-hover:text-blue-700 transition-colors">Agent Tối Ưu Content</h5>
              <p className="text-[9.5px] text-slate-400 font-medium mt-1 leading-normal">
                Viết lại văn bản, chỉnh giọng điệu chuyên nghiệp, thu hút CTA hoặc làm ngắn gọn súc tích.
              </p>
              <div className="text-[8.5px] text-blue-600/80 font-bold mt-2.5 uppercase tracking-wide">
                Chọn khối chữ
              </div>
            </div>
          </div>
        </div>

        {/* Start Designing Section */}
        <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/30 rounded-2xl p-4 border text-left">
          <h4 className="text-[11px] font-extrabold uppercase text-slate-700 tracking-wider flex items-center gap-1.5 mb-3">
            <ExternalLink size={12} className="text-slate-500" /> Bắt đầu thiết kế ngay với AI
          </h4>
          
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-grow space-y-1.5 w-full">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chọn trang muốn thiết kế:</label>
              <select
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                {pages.length > 0 ? (
                  pages.map(page => (
                    <option key={page.id} value={page.id.toString()}>
                      {page.title} ({page.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'})
                    </option>
                  ))
                ) : (
                  <option value="">-- Chưa có trang tĩnh nào --</option>
                )}
              </select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                type="button"
                onClick={() => {
                  if (selectedPageId) {
                    window.location.href = `/admin/pages/edit/${selectedPageId}?builder=true`;
                  } else {
                    window.location.href = '/admin/pages';
                  }
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer border-none"
              >
                🚀 Mở Page Builder
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/admin/pages/create';
                }}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
              >
                Tạo trang mới
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-slate-400 font-medium text-center mt-5 font-sans">
          💡 Bạn có thể sử dụng các Agent này trực tiếp bằng cách chọn các khối tương ứng trên Canvas.
        </p>
      </div>
    </div>
  );
}
