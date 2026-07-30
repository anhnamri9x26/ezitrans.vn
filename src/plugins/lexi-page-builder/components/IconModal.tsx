"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, Check, Upload, Image as ImageIcon } from 'lucide-react';
import * as Lucide from 'lucide-react';

interface IconModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string, iconStyle: 'outline' | 'solid' | 'brands' | 'custom') => void;
  selectedIcon?: string;
  selectedIconStyle?: 'outline' | 'solid' | 'brands' | 'custom';
}

const ALL_LUCIDE_ICONS = Object.keys(Lucide).filter(key => {
  return /^[A-Z][a-zA-Z0-9]*$/.test(key) && key !== 'LucideIcon' && key !== 'Icon';
});

const BRAND_KEYWORDS = [
  'facebook', 'youtube', 'twitter', 'instagram', 'linkedin', 'github', 'gitlab', 
  'trello', 'twitch', 'slack', 'chrome', 'figma', 'apple', 'android', 'codepen', 
  'dribbble', 'spotify', 'skype', 'snapchat', 'reddit', 'pinterest', 'microsoft',
  'google', 'amazon', 'paypal', 'stripe', 'inbox', 'globe', 'mail', 'phone'
];

const BRANDS_ICONS = ALL_LUCIDE_ICONS.filter(name => 
  BRAND_KEYWORDS.some(keyword => name.toLowerCase().includes(keyword))
);

const CATEGORIES = [
  { id: 'all', name: 'Tất cả các biểu tượng', icon: 'Menu' },
  { id: 'outline', name: 'Lucide - Bình thường', icon: 'Flag' },
  { id: 'solid', name: 'Lucide - Solid', icon: 'Star' },
  { id: 'brands', name: 'Lucide - Thương hiệu', icon: 'Globe' }
];

export default function IconModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedIcon = 'Star',
  selectedIconStyle = 'outline' 
}: IconModalProps) {
  const [activeTab, setActiveTab] = useState<string>(selectedIconStyle);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tempSelected, setTempSelected] = useState<string>(selectedIcon);
  const [tempSelectedStyle, setTempSelectedStyle] = useState<'outline' | 'solid' | 'brands' | 'custom'>(selectedIconStyle);
  const [displayCount, setDisplayCount] = useState<number>(200);
  
  // Custom uploaded SVG icons
  const [customSvgs, setCustomSvgs] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCustomSvgs = async () => {
    setIsLoadingCustom(true);
    try {
      const response = await fetch('/api/media');
      const data = await response.json();
      if (data.success && data.mediaList) {
        // Filter only SVG files
        const svgs = data.mediaList.filter((item: any) => 
          item.url.endsWith('.svg') || 
          (item.mimeType && item.mimeType.includes('svg'))
        );
        setCustomSvgs(svgs);
      }
    } catch (error) {
      console.error("Error fetching custom SVGs:", error);
    } finally {
      setIsLoadingCustom(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomSvgs();
      setTempSelected(selectedIcon);
      setTempSelectedStyle(selectedIconStyle);
      setActiveTab(selectedIconStyle);
      setDisplayCount(200);
    }
  }, [isOpen, selectedIcon, selectedIconStyle]);

  const handleSvgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      alert('Vui lòng chỉ tải lên tệp định dạng .svg');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.media) {
        setCustomSvgs(prev => [data.media, ...prev]);
        setTempSelected(data.media.url);
        setTempSelectedStyle('custom');
        setActiveTab('custom');
      } else {
        alert('Tải lên thất bại: ' + (data.error || 'Lỗi không xác định'));
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const iconsToDisplay = useMemo(() => {
    if (activeTab === 'custom') return [];

    let pool: { name: string; style: 'outline' | 'solid' | 'brands' }[] = [];
    
    if (activeTab === 'all') {
      ALL_LUCIDE_ICONS.forEach(name => pool.push({ name, style: 'outline' }));
    } else if (activeTab === 'outline') {
      ALL_LUCIDE_ICONS.forEach(name => pool.push({ name, style: 'outline' }));
    } else if (activeTab === 'solid') {
      ALL_LUCIDE_ICONS.forEach(name => pool.push({ name, style: 'solid' }));
    } else if (activeTab === 'brands') {
      BRANDS_ICONS.forEach(name => pool.push({ name, style: 'brands' }));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      pool = pool.filter(item => item.name.toLowerCase().includes(q));
    } else {
      pool = pool.slice(0, displayCount);
    }

    return pool;
  }, [activeTab, searchQuery, displayCount]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 200) {
      setDisplayCount(prev => prev + 200);
    }
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelect(tempSelected, tempSelectedStyle);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-5xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-white">
              <Lucide.Menu size={14} strokeWidth={2.5} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-black">Thư viện biểu tượng</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-black transition-colors p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Toolbar: Search */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={15} />
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm biểu tượng..."
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20 text-slate-700 font-medium"
            />
          </div>
        </div>

        {/* Modal Main Area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Categories Sidebar */}
          <div className="w-64 border-r border-slate-200 bg-slate-50 p-3 overflow-y-auto flex flex-col gap-1 select-none">
            {CATEGORIES.map(category => {
              const IconComponent = (Lucide as any)[category.icon] || Lucide.Flag;
              const isActive = activeTab === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveTab(category.id);
                    setSearchQuery('');
                    setDisplayCount(200);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
                    isActive 
                      ? 'bg-[#eaeaea] text-[#23282d] font-black border-l-4 border-[#23282d] -ml-3 pl-[11px] rounded-l-none' 
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <IconComponent size={14} className={isActive ? 'text-[#23282d]' : 'text-slate-400'} />
                  <span>{category.name}</span>
                </button>
              );
            })}

            <div className="my-2 border-t border-slate-200" />

            {/* Thư viện của tôi (Custom SVGs) */}
            <div 
              onClick={() => {
                setActiveTab('custom');
                setSearchQuery('');
              }}
              className={`flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-[#eaeaea] text-[#23282d] font-black border-l-4 border-[#23282d] -ml-3 pl-[11px] rounded-l-none' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-bold">
                <ImageIcon size={14} className={activeTab === 'custom' ? 'text-[#23282d]' : 'text-slate-400'} />
                <span>Thư viện của tôi</span>
              </span>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleSvgUpload} 
                accept=".svg" 
                className="hidden" 
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
                className="bg-[#54595f] hover:bg-[#33373b] disabled:opacity-50 text-white px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Upload size={10} />
                {isUploading ? '...' : 'Tải lên'}
              </button>
            </div>
          </div>

          {/* Grid area */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/20" onScroll={handleScroll}>
            {activeTab === 'custom' ? (
              // Custom SVGs display
              isLoadingCustom && customSvgs.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-slate-400 font-medium animate-pulse">
                  Đang tải biểu tượng SVG...
                </div>
              ) : customSvgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <ImageIcon size={40} className="opacity-30 mb-3" />
                  <p className="text-xs font-bold">Thư viện của bạn chưa có biểu tượng SVG nào</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 text-xs font-bold text-[#54595f] hover:underline cursor-pointer"
                  >
                    Tải lên biểu tượng SVG đầu tiên &rarr;
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {customSvgs.map(item => {
                    const isSelected = tempSelected === item.url;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setTempSelected(item.url);
                          setTempSelectedStyle('custom');
                        }}
                        className={`relative flex flex-col items-center justify-center p-3 border aspect-square rounded-xl cursor-pointer bg-white transition-all hover:scale-[1.03] select-none ${
                          isSelected 
                            ? 'border-black ring-2 ring-black/10 shadow-md scale-[0.98]' 
                            : 'border-slate-200 hover:border-slate-400 hover:shadow-sm'
                        }`}
                      >
                        <img 
                          src={item.url} 
                          alt={item.filename} 
                          className="w-10 h-10 object-contain pointer-events-none select-none"
                        />
                        <span className="text-[7px] font-bold text-center mt-2.5 break-all max-w-full text-slate-400 line-clamp-1">
                          {item.filename}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-black text-white p-0.5 rounded-full shadow-sm">
                            <Check size={8} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Lucide standard icons display
              iconsToDisplay.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-medium text-center">
                  <span className="text-3xl mb-2 opacity-35">☹</span>
                  <p className="text-xs">Không tìm thấy biểu tượng phù hợp</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {iconsToDisplay.map(item => {
                    const IconComponent = (Lucide as any)[item.name];
                    if (!IconComponent) return null;
                    
                    const isSelected = tempSelected === item.name && tempSelectedStyle === item.style;
                    return (
                      <div 
                        key={`${item.name}-${item.style}`}
                        onClick={() => {
                          setTempSelected(item.name);
                          setTempSelectedStyle(item.style);
                        }}
                        className={`relative flex flex-col items-center justify-center p-3 border aspect-square rounded-xl cursor-pointer bg-white transition-all hover:scale-[1.03] select-none ${
                          isSelected 
                            ? 'border-black ring-2 ring-black/10 shadow-md text-black scale-[0.98]' 
                            : 'border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-800 hover:shadow-sm'
                        }`}
                      >
                        <IconComponent 
                          size={24} 
                          strokeWidth={1.8} 
                          fill={item.style === 'solid' ? 'currentColor' : 'none'} 
                        />
                        <span className="text-[8px] font-bold text-center mt-2.5 break-all max-w-full text-slate-400 uppercase tracking-tight">
                          {item.name}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-black text-white p-0.5 rounded-full shadow-sm">
                            <Check size={8} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider max-w-lg truncate">
            {tempSelected ? `Đang chọn: ${tempSelectedStyle.toUpperCase()} - ${tempSelected.substring(tempSelected.lastIndexOf('/') + 1)}` : 'Chưa có lựa chọn'}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button 
              disabled={!tempSelected}
              onClick={handleConfirm}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all hover:shadow-brand-500/20 active:translate-y-0.5 cursor-pointer"
            >
              Chèn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
