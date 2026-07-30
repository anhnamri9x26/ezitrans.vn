"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  CheckSquare, 
  Square, 
  Users, 
  Settings as SettingsIcon, 
  Lock, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import CapabilityGuard from '@/components/CapabilityGuard';

interface CapabilityMeta {
  key: string;
  label: string;
  group: string;
}

const DEFAULT_CAPABILITIES: Record<string, string[]> = {
  ADMIN: [
    'manage_settings', 'manage_users', 'manage_roles', 'manage_plugins', 'manage_themes', 'manage_tools',
    'edit_posts', 'edit_others_posts', 'publish_posts', 'delete_posts',
    'edit_pages', 'publish_pages', 'delete_pages',
    'manage_categories', 'manage_tags',
    'upload_media', 'manage_media',
    'moderate_comments',
    'manage_seo', 'view_form_submissions',
    'manage_templates',
    'view_dashboard', 'edit_profile', 'read'
  ],
  EDITOR: [
    'manage_templates',
    'view_dashboard',
    'publish_posts',
    'edit_posts',
    'edit_others_posts',
    'delete_posts',
    'publish_pages',
    'edit_pages',
    'delete_pages',
    'manage_categories',
    'manage_tags',
    'upload_media',
    'manage_media',
    'moderate_comments',
    'manage_seo',
    'edit_profile',
    'read'
  ],
  SUBSCRIBER: [
    'view_dashboard',
    'edit_profile',
    'read'
  ]
};

const GROUP_ICONS: Record<string, string> = {
  'Quản trị hệ thống': '🛡️',
  'Bài viết': '📝',
  'Trang': '📄',
  'Phân loại': '🗂️',
  'Thư viện': '🖼️',
  'Bình luận': '💬',
  'SEO & Form': '🔍',
  'Giao diện': '🎨',
  'Tài khoản': '👤'
};

export default function RoleCapabilitiesPage() {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'EDITOR' | 'SUBSCRIBER'>('EDITOR');
  const [capabilities, setCapabilities] = useState<Record<string, string[]>>({
    ADMIN: [],
    EDITOR: [],
    SUBSCRIBER: []
  });
  const [allCapabilities, setAllCapabilities] = useState<CapabilityMeta[]>([]);
  const [checkedCaps, setCheckedCaps] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load capabilities from server
  useEffect(() => {
    async function loadCapabilities() {
      try {
        const res = await fetch('/api/roles');
        const data = await res.json();
        if (data.success) {
          setCapabilities(data.roles);
          setAllCapabilities(data.allCapabilities);
        } else {
          setMessage({ type: 'error', text: data.error || 'Không thể tải cấu hình phân quyền.' });
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
        setMessage({ type: 'error', text: 'Có lỗi xảy ra khi kết nối máy chủ.' });
      } finally {
        setIsLoading(false);
      }
    }
    loadCapabilities();
  }, []);

  // Update checked checkboxes when selectedRole or loaded capabilities change
  useEffect(() => {
    if (capabilities[selectedRole]) {
      setCheckedCaps(capabilities[selectedRole]);
    }
  }, [selectedRole, capabilities]);

  // Handle individual capability toggle
  const handleToggleCapability = (capKey: string) => {
    if (selectedRole === 'ADMIN') return; // ADMIN is immutable
    
    setCheckedCaps(prev => {
      if (prev.includes(capKey)) {
        // Prevent removing manage_roles if somehow attempted, though interface handles it
        return prev.filter(k => k !== capKey);
      } else {
        return [...prev, capKey];
      }
    });
  };

  // Select/Unselect group
  const handleToggleGroup = (groupName: string, isGroupChecked: boolean) => {
    if (selectedRole === 'ADMIN') return;

    const groupKeys = allCapabilities.filter(c => c.group === groupName).map(c => c.key);
    
    setCheckedCaps(prev => {
      if (isGroupChecked) {
        // Remove all group keys
        return prev.filter(k => !groupKeys.includes(k));
      } else {
        // Add all group keys (avoiding duplicates)
        const filteredPrev = prev.filter(k => !groupKeys.includes(k));
        return [...filteredPrev, ...groupKeys];
      }
    });
  };

  // Restore Defaults
  const handleRestoreDefaults = () => {
    if (selectedRole === 'ADMIN') return;
    if (confirm(`Bạn có chắc chắn muốn khôi phục quyền mặc định cho vai trò ${selectedRole}?`)) {
      setCheckedCaps(DEFAULT_CAPABILITIES[selectedRole]);
      setMessage({ type: 'success', text: 'Đã khôi phục quyền về mặc định. Nhấn Lưu để áp dụng!' });
    }
  };

  // Save changes
  const handleSaveChanges = async () => {
    if (selectedRole === 'ADMIN') return;
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          capabilities: checkedCaps
        })
      });

      const data = await res.json();
      if (data.success) {
        setCapabilities(prev => ({
          ...prev,
          [selectedRole]: data.capabilities
        }));
        setMessage({ type: 'success', text: `Đã lưu cấu hình phân quyền cho vai trò ${selectedRole} thành công!` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể lưu thay đổi.' });
      }
    } catch (err) {
      console.error('Save roles error:', err);
      setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ khi đang lưu dữ liệu.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Đang tải cấu hình phân quyền...</p>
      </div>
    );
  }

  // Group capabilities by category
  const groupedCapabilities: Record<string, CapabilityMeta[]> = {};
  allCapabilities.forEach(cap => {
    if (!groupedCapabilities[cap.group]) {
      groupedCapabilities[cap.group] = [];
    }
    groupedCapabilities[cap.group].push(cap);
  });

  return (
    <CapabilityGuard capability="manage_roles">
      <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-brand-600" size={24} />
            Quản lý Phân quyền Vai trò
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập chi tiết quyền hạn (capabilities) cho từng vai trò người dùng trong hệ thống Lexi CMS.
          </p>
        </div>

        {selectedRole !== 'ADMIN' && (
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={handleRestoreDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all duration-150"
            >
              <RotateCcw size={14} />
              Khôi phục mặc định
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-xs font-bold shadow-md shadow-brand-600/10 hover:shadow-brand-600/20 transition-all duration-150"
            >
              <Save size={14} />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
      </div>

      {/* Alert Notifications */}
      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border transition-all duration-200 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
          ) : (
            <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
          )}
          <span className="text-xs font-medium">{message.text}</span>
        </div>
      )}

      {/* Role Switcher Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-md">
        {(['ADMIN', 'EDITOR', 'SUBSCRIBER'] as const).map(role => {
          const isSelected = selectedRole === role;
          return (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                isSelected 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {role === 'ADMIN' ? (
                <Lock size={12} className="text-amber-500" />
              ) : role === 'EDITOR' ? (
                <SettingsIcon size={12} className="text-indigo-500" />
              ) : (
                <Users size={12} className="text-emerald-500" />
              )}
              {role === 'ADMIN' ? 'Quản trị viên' : role === 'EDITOR' ? 'Biên tập viên' : 'Đăng ký viên'}
            </button>
          );
        })}
      </div>

      {/* Info Warning for Admin */}
      {selectedRole === 'ADMIN' && (
        <div className="p-4 rounded-xl border border-amber-100 bg-amber-50 text-amber-900 flex items-start gap-3">
          <Lock className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div className="text-xs">
            <strong className="font-bold block">Vai trò Quản trị viên (ADMIN) được bảo vệ:</strong>
            Quyền hạn của tài khoản Admin là tuyệt đối để duy trì khả năng kiểm soát toàn bộ website và không thể chỉnh sửa nhằm tránh việc vô tình khóa quyền quản trị của chính mình.
          </div>
        </div>
      )}

      {/* Grid of Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(groupedCapabilities).map(([groupName, caps]) => {
          // Check if all caps in this group are checked
          const groupKeys = caps.map(c => c.key);
          const checkedGroupCount = groupKeys.filter(k => checkedCaps.includes(k)).length;
          const isAllGroupChecked = checkedGroupCount === groupKeys.length;
          const isSomeGroupChecked = checkedGroupCount > 0 && checkedGroupCount < groupKeys.length;
          
          return (
            <div 
              key={groupName}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-sm">{GROUP_ICONS[groupName] || '⚙️'}</span>
                  {groupName}
                </h3>
                {selectedRole !== 'ADMIN' && (
                  <button
                    onClick={() => handleToggleGroup(groupName, isAllGroupChecked)}
                    className="text-[10px] font-bold text-brand-600 hover:text-brand-700 transition-colors uppercase tracking-wider"
                  >
                    {isAllGroupChecked ? 'Bỏ chọn hết' : 'Chọn hết nhóm'}
                  </button>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 divide-y divide-slate-50">
                {caps.map(cap => {
                  const isChecked = checkedCaps.includes(cap.key);
                  const isDisabled = selectedRole === 'ADMIN';

                  return (
                    <div 
                      key={cap.key}
                      onClick={() => !isDisabled && handleToggleCapability(cap.key)}
                      className={`flex items-start gap-3 py-2.5 transition-colors ${
                        isDisabled ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50/50 rounded-lg px-2 -mx-2'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckSquare 
                            size={16} 
                            className={`${isDisabled ? 'text-amber-500/70' : 'text-brand-600'}`} 
                          />
                        ) : (
                          <Square 
                            size={16} 
                            className="text-slate-300" 
                          />
                        )}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${
                          isChecked ? 'text-slate-800' : 'text-slate-500'
                        }`}>
                          {cap.label}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Mã quyền: <code className="font-mono text-slate-500 bg-slate-100 px-1 py-0.2 rounded text-[9px]">{cap.key}</code>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button Sticky Footer (mobile optimized) */}
      {selectedRole !== 'ADMIN' && (
        <div className="flex items-center justify-end gap-3 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
          <span className="text-[11px] text-slate-400 font-semibold mr-auto hidden sm:inline">
            * Sau khi cấu hình, hãy nhớ lưu lại để thay đổi có hiệu lực.
          </span>
          <button
            onClick={handleRestoreDefaults}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all duration-150"
          >
            <RotateCcw size={14} />
            Khôi phục mặc định
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-xs font-bold shadow-md shadow-brand-600/10 hover:shadow-brand-600/20 transition-all duration-150"
          >
            <Save size={14} />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      )}
      </div>
    </CapabilityGuard>
  );
}
