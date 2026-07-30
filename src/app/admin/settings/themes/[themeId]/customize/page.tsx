"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2, Monitor, Smartphone, Tablet } from 'lucide-react';
import { broadcastSettings } from '@/hooks/useThemeCustomizer';

export default function ThemeCustomizerPage() {
  const params = useParams();
  const router = useRouter();
  const themeId = params.themeId as string;

  const [theme, setTheme] = useState<any>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [activePanel, setActivePanel] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Khởi tạo
  useEffect(() => {
    async function init() {
      // Fetch categories
      try {
        const catRes = await fetch('/api/categories');
        const catData = await catRes.json();
        if (catData.categories) setCategories(catData.categories);
      } catch (e) { console.error('Failed to fetch categories', e); }

      // 1. Fetch themes
      const themesRes = await fetch('/api/themes');
      const themesData = await themesRes.json();
      const currentTheme = themesData.themes?.find((t: any) => t.id === themeId);
      
      if (!currentTheme) {
        alert('Không tìm thấy theme!');
        router.push('/admin/settings/themes');
        return;
      }
      setTheme(currentTheme);

      // 2. Fetch settings
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      const globalSettings = settingsData.settings || {};
      
      // Initialize local state with existing settings or defaults from schema
      const initialSettings: Record<string, string> = {};
      if (currentTheme.customizer) {
        currentTheme.customizer.forEach((item: any) => {
          if (item.type === 'panel' && item.sections) {
            item.sections.forEach((section: any) => {
              section.fields?.forEach((field: any) => {
                const key = `theme_${themeId}_${field.id}`;
                initialSettings[key] = globalSettings[key] !== undefined ? globalSettings[key] : (field.default || '');
              });
            });
          } else if (item.fields) {
            item.fields.forEach((field: any) => {
              const key = `theme_${themeId}_${field.id}`;
              initialSettings[key] = globalSettings[key] !== undefined ? globalSettings[key] : (field.default || '');
            });
          }
        });
      }
      setSettings(initialSettings);
    }
    init();
  }, [themeId, router]);


  const sendLiveSettings = (nextSettings: Record<string, string>) => {
    broadcastSettings(nextSettings);
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => {
      const nextSettings = { ...prev, [key]: value };
      sendLiveSettings(nextSettings);
      return nextSettings;
    });
  };

  const handleImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(prev => ({ ...prev, [key]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success && data.media?.url) {
        handleChange(key, data.media.url);
      } else {
        alert('Lỗi upload ảnh: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi upload.');
    } finally {
      setIsUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare batch updates
      const body = {
        action: 'batch_update',
        keys: Object.keys(settings),
        customSettings: settings
      };
      
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Đã lưu cấu hình thành công!');
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (e) {
      alert('Đã xảy ra lỗi khi lưu.');
    } finally {
      setIsSaving(false);
    }
  };

  const getIframeUrl = () => {
    let url = '/';
    if (activePanel && activePanel.url) {
      url = activePanel.url;
    }
    return `${url}${url.includes('?') ? '&' : '?'}preview=1&theme=${themeId}`;
  };

  if (!theme) {
    return <div className="flex h-screen items-center justify-center bg-slate-100"><Loader2 className="animate-spin text-indigo-600" /></div>;
  }

  const iframeWidth = previewMode === 'desktop' ? '100%' : (previewMode === 'tablet' ? '768px' : '375px');

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-[320px] bg-white border-r border-slate-200 flex flex-col z-10 shrink-0 shadow-xl relative overflow-hidden">
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <button 
            onClick={() => {
              if (activePanel) {
                setActivePanel(null);
                setActiveSection(null);
              } else {
                router.push('/admin/settings/themes');
              }
            }} 
            className="text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded hover:bg-slate-200"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="font-bold text-sm text-slate-800 truncate px-2">
            {activePanel ? activePanel.title : `Tùy biến ${theme.name}`}
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Lưu
          </button>
        </div>

        <div className="flex-1 overflow-y-auto relative">
          {/* Màn hình Panel (Cấp 1) */}
          <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${activePanel ? '-translate-x-full' : 'translate-x-0'}`}>
            {theme.customizer && theme.customizer.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {theme.customizer.map((item: any) => {
                  if (item.type === 'panel') {
                    return (
                      <button 
                        key={item.id}
                        onClick={() => setActivePanel(item)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors bg-white text-left"
                      >
                        <span className="font-semibold text-slate-700 text-sm">{item.title}</span>
                        <span className="text-slate-400 text-xs">▶</span>
                      </button>
                    );
                  }
                  return null; // Handle direct sections here if needed later
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-sm">
                Theme này không hỗ trợ tùy biến (không có cấu hình customizer).
              </div>
            )}
          </div>

          {/* Màn hình Section (Cấp 2) */}
          <div className={`absolute inset-0 transition-transform duration-300 ease-in-out bg-white ${activePanel ? 'translate-x-0' : 'translate-x-full'}`}>
            {activePanel && activePanel.sections && (
              <div className="divide-y divide-slate-100">
                {activePanel.sections.map((section: any) => (
                  <div key={section.id} className="bg-white">
                    <button 
                      onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-semibold text-slate-700 text-sm">{section.title}</span>
                      <span className="text-slate-400 text-xs">{activeSection === section.id ? '▼' : '▶'}</span>
                    </button>
                    
                    {activeSection === section.id && (
                      <div className="px-4 pb-5 pt-1 space-y-4 bg-slate-50/50">
                        {section.fields?.map((field: any) => {
                          const key = `theme_${themeId}_${field.id}`;
                          const value = settings[key] !== undefined ? settings[key] : '';
                          
                          return (
                            <div key={field.id} className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-slate-600">{field.label}</label>
                              
                              {field.type === 'textarea' ? (
                                <textarea 
                                  value={value}
                                  onChange={(e) => handleChange(key, e.target.value)}
                                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[80px]"
                                />
                              ) : field.type === 'color' ? (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="color" 
                                    value={value}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0"
                                  />
                                  <input 
                                    type="text" 
                                    value={value}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="flex-1 border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-800 focus:outline-none uppercase font-mono"
                                  />
                                </div>
                              ) : field.type === 'category' ? (
                                <select
                                  value={value}
                                  onChange={(e) => handleChange(key, e.target.value)}
                                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                                >
                                  <option value="">-- Chọn danh mục --</option>
                                  {categories.map(c => (
                                    <option key={c.id} value={c.slug}>{c.name}</option>
                                  ))}
                                </select>
                              ) : field.type === 'image' ? (
                                <div className="flex flex-col gap-2">
                                  {value && (
                                    <div className="relative aspect-video rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                                      <img src={value} alt="Preview" className="w-full h-full object-contain" />
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <label className="flex-1 cursor-pointer bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 text-sm py-1.5 px-3 rounded-md text-center transition-colors">
                                      {isUploading[key] ? 'Đang tải lên...' : 'Chọn ảnh'}
                                      <input 
                                        type="file" 
                                        accept="image/*"
                                        className="hidden" 
                                        onChange={(e) => handleImageUpload(key, e)} 
                                        disabled={isUploading[key]}
                                      />
                                    </label>
                                    <input 
                                      type="text" 
                                      value={value}
                                      onChange={(e) => handleChange(key, e.target.value)}
                                      className="flex-[2] border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                      placeholder="Hoặc dán link ảnh"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <input 
                                  type={field.type === 'number' ? 'number' : 'text'}
                                  value={value}
                                  onChange={(e) => handleChange(key, e.target.value)}
                                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col bg-slate-200/50">
        <div className="h-10 border-b border-slate-200 flex items-center justify-center gap-2 bg-white/50 backdrop-blur-sm shrink-0">
          <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded transition-colors ${previewMode === 'desktop' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}>
            <Monitor size={16} />
          </button>
          <button onClick={() => setPreviewMode('tablet')} className={`p-1.5 rounded transition-colors ${previewMode === 'tablet' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}>
            <Tablet size={16} />
          </button>
          <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded transition-colors ${previewMode === 'mobile' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}>
            <Smartphone size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 md:p-8 flex items-start justify-center">
          <div 
            className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300 ring-1 ring-slate-900/5"
            style={{ width: iframeWidth, height: '100%', minHeight: '600px' }}
          >
            <iframe 
              key={getIframeUrl()}
              ref={iframeRef}
              src={getIframeUrl()} 
              className="w-full h-full border-none"
              title="Theme Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
