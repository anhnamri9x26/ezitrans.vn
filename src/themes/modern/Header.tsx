"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { getMenuItemsForLocation } from '@/lib/navigation/client';

interface MenuItem {
  id?: string;
  label: string;
  url: string;
  indent?: number;
  isMega?: boolean;
  description?: string;
  icon?: string;
}

interface Level2Item extends MenuItem {}

interface Level1Item extends MenuItem {
  children: Level2Item[];
}

interface Level0Item extends MenuItem {
  children: Level1Item[];
}

const DynamicIcon = ({ name, className, size = 14 }: { name?: string; className?: string; size?: number }) => {
  if (!name) return null;
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} size={size} />;
};

const buildMenuTree = (flatList: MenuItem[]): Level0Item[] => {
  const tree: Level0Item[] = [];
  let currentL0: Level0Item | null = null;
  let currentL1: Level1Item | null = null;

  flatList.forEach((item) => {
    const indent = item.indent || 0;
    
    if (indent === 0) {
      const node: Level0Item = { ...item, children: [] };
      tree.push(node);
      currentL0 = node;
      currentL1 = null;
    } else if (indent === 1) {
      const node: Level1Item = { ...item, children: [] };
      if (currentL0) {
        currentL0.children.push(node);
      } else {
        const rootFallback: Level0Item = { id: 'fallback', label: '', url: '#', children: [node] };
        tree.push(rootFallback);
        currentL0 = rootFallback;
      }
      currentL1 = node;
    } else if (indent === 2) {
      const node: Level2Item = { ...item };
      if (currentL1) {
        currentL1.children.push(node);
      } else if (currentL0) {
        const columnFallback: Level1Item = { id: 'col_fallback', label: '', url: '#', children: [node] };
        currentL0.children.push(columnFallback);
        currentL1 = columnFallback;
      } else {
        const rootFallback: Level0Item = { 
          id: 'fallback_root', 
          label: '', 
          url: '#', 
          children: [{ id: 'col_fallback', label: '', url: '#', children: [node] }] 
        };
        tree.push(rootFallback);
        currentL0 = rootFallback;
        currentL1 = rootFallback.children[0];
      }
    }
  });
  return tree;
};

export default function ModernHeader({ settings }: { settings: any }) {
  const siteLogo = settings.site_logo;
  const siteTitle = settings.site_title || 'Lexi';
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

  // Portal mount state (SSR safety)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Modals state
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  
  // Quote form state
  const [quoteForm, setQuoteForm] = useState({ url: '', name: '', phone: '', note: '' });
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  
  // Tracking form state
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const rawMenuItems = getMenuItemsForLocation(settings, 'header-primary');

  const menuTree = buildMenuTree(rawMenuItems);

  const handleQuoteClick = () => {
    setQuoteForm({ url: '', name: '', phone: '', note: '' });
    setQuoteSuccess(false);
    setQuoteLoading(false);
    setIsQuoteOpen(true);
  };

  const handleTrackingClick = () => {
    setTrackingResult(null);
    setTrackingCode('');
    setTrackingLoading(false);
    setIsTrackingOpen(true);
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.name || !quoteForm.phone) {
      alert("Vui lòng điền đầy đủ Họ tên và Số điện thoại!");
      return;
    }
    setQuoteLoading(true);
    setTimeout(() => {
      setQuoteLoading(false);
      setQuoteSuccess(true);
    }, 1200);
  };

  const handleTrackingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      alert("Vui lòng nhập mã vận đơn!");
      return;
    }
    setTrackingLoading(true);
    setTrackingResult(null);
    setTimeout(() => {
      setTrackingLoading(false);
      const cleanCode = trackingCode.trim().toUpperCase();
      setTrackingResult({
        code: cleanCode,
        weight: "2.5 kg",
        destination: "Hà Nội, Việt Nam",
        type: "Dịch vụ vận chuyển quốc tế",
        status: "Đang vận chuyển quốc tế",
        steps: [
          { title: "Đã tiếp nhận yêu cầu", desc: "Hệ thống Lexi đã ghi nhận mã vận đơn.", time: "25/05/2026 09:30", done: true },
          { title: "Đã gom hàng tại kho gửi", desc: "Nhận hàng tại kho đối tác nước ngoài thành công.", time: "26/05/2026 14:15", done: true },
          { title: "Đang vận chuyển quốc tế", desc: "Hàng đang được trung chuyển hàng không/hàng hải quốc tế.", time: "27/05/2026 23:45", current: true },
          { title: "Đến kho khai thác Việt Nam", desc: "Khai thác phân loại hàng và làm thủ tục thông quan hàng hóa.", time: "Chờ cập nhật", pending: true },
          { title: "Giao hàng thành công", desc: "Đơn vị vận chuyển nội địa bàn giao đơn hàng.", time: "Chờ cập nhật", pending: true }
        ]
      });
    }, 1000);
  };

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <>
    <header className="sticky top-0 left-0 right-0 z-50 w-full font-sans shadow-sm bg-white/95 backdrop-blur-md border-b border-slate-200/50">
      
      {/* ================= TẦNG 0: TOP UTILITY BAR (Cao 32px, Nền Slate-50) ================= */}
      <div className="w-full bg-slate-50 border-b border-slate-200/40 py-1.5">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 w-full flex justify-end items-center gap-5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          <Link href="/mua-ho" className="hover:text-brand-500 transition-colors flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block mr-1" /> Hướng dẫn mua hàng
          </Link>
          <div className="relative group/sublink cursor-pointer hover:text-brand-500 transition-colors flex items-center gap-0.5">
            <span>Thông tin chuyển khoản</span>
            <Icons.ChevronDown size={10} />
            <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-slate-200/60 shadow-lg rounded-xl py-1 opacity-0 pointer-events-none group-hover/sublink:opacity-100 group-hover/sublink:pointer-events-auto transition-all text-[9.5px] font-bold text-slate-600 z-50 before:content-[''] before:absolute before:top-[-4px] before:left-0 before:right-0 before:h-[4px]">
              <div className="px-3.5 py-1.5 hover:bg-slate-50 hover:text-brand-500 transition-colors border-b border-slate-100/50">
                <p className="font-extrabold text-slate-800">Techcombank</p>
                <p className="text-[8.5px] text-slate-400 font-medium">19035085503031</p>
              </div>
              <div className="px-3.5 py-1.5 hover:bg-slate-50 hover:text-brand-500 transition-colors">
                <p className="font-extrabold text-slate-800">Vietcombank</p>
                <p className="text-[8.5px] text-slate-400 font-medium">0941000019297</p>
              </div>
            </div>
          </div>
          <Link href="#" className="hover:text-brand-500 transition-colors">Câu hỏi thường gặp</Link>
          <Link href="#" className="hover:text-brand-500 transition-colors">Liên hệ</Link>
        </div>
      </div>

      {/* ================= TẦNG 1: MAIN NAVIGATION BAR (Nền trắng kính mờ) ================= */}
      <div className="w-full py-3.5 relative">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 w-full flex items-center justify-between gap-6">
          
          {/* Logo bên trái */}
          {siteLogo ? (
            <Link href="/" className="flex items-center hover:opacity-85 transition-opacity shrink-0">
              <img src={siteLogo} alt={siteTitle} className="h-9 sm:h-10 max-w-[160px] object-contain" />
            </Link>
          ) : (
            <Link href="/" className="text-xl font-black tracking-tight bg-gradient-to-r from-brand-500 to-indigo-600 bg-clip-text text-transparent hover:opacity-90 transition-opacity shrink-0">
              {siteTitle}
            </Link>
          )}

          {/* Navigation Menu ở giữa (Ẩn ở kích thước < 1200px để chống tràn, chồng lấn hoàn toàn) */}
          <nav className="hidden xl:flex items-center justify-center gap-5 relative min-w-0 flex-1 px-4">
            {/* Nút Home */}
            <Link href="/" className="text-slate-400 hover:text-brand-500 transition-colors shrink-0" title="Trang chủ">
              <Icons.Home size={15} />
            </Link>

            {menuTree.map((item, idx) => {
              const hasChildren = item.children && item.children.length > 0;
              const isMega = item.isMega;

              if (!hasChildren) {
                return (
                  <Link 
                    key={idx} 
                    href={item.url} 
                    className="text-[12.5px] font-bold text-slate-600 hover:text-brand-500 transition-colors duration-150 shrink-0"
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <div key={idx} className="relative group py-1.5 shrink-0">
                  <button 
                    type="button"
                    className="flex items-center gap-0.5 text-[12.5px] font-bold text-slate-600 hover:text-brand-500 border-none bg-transparent cursor-pointer outline-none"
                  >
                    <span>{item.label}</span>
                    <Icons.ChevronDown size={11} className="text-slate-400 group-hover:text-brand-500 transition-transform group-hover:rotate-180" />
                  </button>

                  {/* Mega Menu hoặc Dropdown */}
                  {isMega ? (
                    <div 
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-fit min-w-[500px] max-w-[800px] bg-white/95 backdrop-blur-lg border border-slate-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-2xl p-6 opacity-0 translate-y-3 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50 flex gap-8 before:content-[''] before:absolute before:top-[-10px] before:left-0 before:right-0 before:h-[10px]"
                    >
                      {item.children.map((column, colIdx) => (
                        <div 
                          key={colIdx} 
                          className="flex-1 min-w-[140px] space-y-3"
                        >
                          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                            {column.icon && (
                              <DynamicIcon name={column.icon} className="text-brand-500 shrink-0" size={12} />
                            )}
                            <span className="font-extrabold text-[9.5px] text-slate-800 uppercase tracking-widest block">
                              {column.label}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {column.children.map((sub, sIdx) => (
                              <Link 
                                key={sIdx}
                                href={sub.url}
                                className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-50 text-[10px] font-semibold text-slate-500 hover:text-brand-500 transition-all duration-150 group/link"
                              >
                                {sub.icon && (
                                  <DynamicIcon name={sub.icon} className="text-slate-400 group-hover/link:text-brand-500 shrink-0" size={11} />
                                )}
                                <span className="truncate">{sub.label}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="absolute top-full left-0 mt-3 w-44 bg-white border border-slate-200/60 shadow-[0_12px_32px_rgba(0,0,0,0.04)] rounded-xl py-1.5 opacity-0 translate-y-3 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50 before:content-[''] before:absolute before:top-[-12px] before:left-0 before:right-0 before:h-[12px]">
                      {item.children.map((sub, sIdx) => {
                        const hasSubChildren = sub.children && sub.children.length > 0;
                        return (
                          <div key={sIdx} className="relative group/sub">
                            <Link 
                              href={sub.url}
                              className="flex items-center justify-between px-3.5 py-2 text-[10px] font-semibold text-slate-600 hover:text-brand-500 hover:bg-slate-50 transition-all duration-150"
                            >
                              <span className="flex items-center gap-1.5">
                                {sub.icon && (
                                  <DynamicIcon name={sub.icon} className="text-slate-400" size={11} />
                                )}
                                {sub.label}
                              </span>
                              {hasSubChildren && (
                                <Icons.ChevronRight size={10} className="text-slate-400 group-hover/sub:text-brand-500" />
                              )}
                            </Link>

                            {hasSubChildren && (
                              <div className="absolute left-full top-0 ml-0.5 w-40 bg-white border border-slate-200/60 shadow-[0_8px_24px_rgba(0,0,0,0.04)] rounded-xl py-1 opacity-0 translate-x-2 pointer-events-none group-hover/sub:opacity-100 group-hover/sub:translate-x-0 group-hover/sub:pointer-events-auto transition-all duration-200 z-50 before:content-[''] before:absolute before:top-0 before:bottom-0 before:left-[-2px] before:w-[2px]">
                                {sub.children.map((grand, gIdx) => (
                                  <Link 
                                    key={gIdx}
                                    href={grand.url}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[9.5px] font-semibold text-slate-500 hover:text-brand-500 hover:bg-slate-50 transition-all duration-150"
                                  >
                                    {grand.icon && (
                                      <DynamicIcon name={grand.icon} size={10} />
                                    )}
                                    <span>{grand.label}</span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Sibling CTA Buttons bên phải - Thiết kế phân lớp rõ ràng chống overlap */}
          <div className="hidden xl:flex items-center gap-2.5 shrink-0">
            {/* Button Tra cứu Tracking (Secondary Action) */}
            <button
              onClick={handleTrackingClick}
              className="border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold text-[10.5px] px-4.5 py-2.5 rounded-full transition-all duration-200 active:scale-95 uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
            >
              <Icons.Search size={11} className="text-slate-400" /> Tra cứu
            </button>

            {/* Button Gửi báo giá (Primary Action) */}
            <button
              onClick={handleQuoteClick}
              className="bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-[10.5px] px-4.5 py-2.5 rounded-full transition-all duration-200 active:scale-95 uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0 shadow-md shadow-brand-500/10"
            >
              <Icons.Send size={11} /> Gửi báo giá
            </button>
          </div>

          {/* Burger Trigger Button cho màn hình di động/tablet (< 1200px) */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="xl:hidden flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer outline-none"
            aria-label="Mở menu di động"
          >
            <Icons.Menu size={20} />
          </button>

        </div>
      </div>

      {/* ================= MOBILE DRAWER MENU (Hệ thống slide-in kính mờ sang trọng) ================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-[100] xl:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Content panel */}
          <div className="relative w-[300px] max-w-xs bg-white h-full shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto z-10 transition-transform duration-300 transform translate-x-0">
            {/* Close button inside drawer */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase text-brand-600 tracking-wider flex items-center gap-1">
                <Icons.Compass size={13} /> Menu Lexi
              </span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer outline-none"
              >
                <Icons.X size={18} />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col space-y-1 flex-1 text-xs">
              <Link 
                href="/" 
                className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-slate-50 font-bold text-slate-700 hover:text-brand-500 transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                <Icons.Home size={14} /> Trang chủ
              </Link>

              {menuTree.map((item, idx) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems[item.label] || false;

                if (!hasChildren) {
                  return (
                    <Link 
                      key={idx} 
                      href={item.url} 
                      className="flex items-center p-2.5 rounded-lg hover:bg-slate-50 font-bold text-slate-700 hover:text-brand-500 transition-colors"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <div key={idx} className="space-y-1">
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 font-bold text-slate-700 hover:text-brand-500 transition-colors text-left border-none bg-transparent cursor-pointer outline-none"
                    >
                      <span>{item.label}</span>
                      <Icons.ChevronDown size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-brand-500' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="pl-4 space-y-1 border-l border-slate-100 ml-3.5">
                        {item.children.map((sub, sIdx) => {
                          const hasSubChildren = sub.children && sub.children.length > 0;
                          const isSubExpanded = expandedItems[`${item.label}-${sub.label}`] || false;

                          if (!hasSubChildren) {
                            return (
                              <Link
                                key={sIdx}
                                href={sub.url}
                                className="block p-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-500 hover:text-brand-500 transition-colors"
                                onClick={() => setIsMobileOpen(false)}
                              >
                                {sub.label}
                              </Link>
                            );
                          }

                          return (
                            <div key={sIdx} className="space-y-1">
                              <button
                                onClick={() => toggleExpand(`${item.label}-${sub.label}`)}
                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-500 hover:text-brand-500 transition-colors text-left border-none bg-transparent cursor-pointer outline-none"
                              >
                                <span>{sub.label}</span>
                                <Icons.ChevronDown size={12} className={`text-slate-400 transition-transform ${isSubExpanded ? 'rotate-180 text-brand-500' : ''}`} />
                              </button>

                              {isSubExpanded && (
                                <div className="pl-4 space-y-1 border-l border-slate-100/80 ml-2.5">
                                  {sub.children.map((grand, gIdx) => (
                                    <Link
                                      key={gIdx}
                                      href={grand.url}
                                      className="block p-1.5 rounded-lg hover:bg-slate-50 font-medium text-slate-400 hover:text-brand-500 transition-colors"
                                      onClick={() => setIsMobileOpen(false)}
                                    >
                                      {grand.label}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Mobile Actions Drawer Bottom */}
            <div className="pt-6 border-t border-slate-100 space-y-3.5 text-center">
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  handleTrackingClick();
                }}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[11px] py-3 rounded-full transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm bg-white"
              >
                <Icons.Search size={12} className="text-slate-400" /> Tra cứu
              </button>

              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  handleQuoteClick();
                }}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-[11px] py-3 rounded-full transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-brand-500/10 border-none"
              >
                <Icons.Send size={12} /> Gửi báo giá
              </button>
            </div>
          </div>
        </div>
      )}

    </header>

      {mounted && isQuoteOpen && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsQuoteOpen(false)}
          />
          
          {/* Centering wrapper */}
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            {/* Modal Container */}
            <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-lg border border-slate-200/60 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden z-10 transition-all duration-300 transform scale-100 p-6 sm:p-8 text-left my-8">
              
              {/* Close Button */}
              <button
                onClick={() => setIsQuoteOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer outline-none"
              >
                <Icons.X size={18} />
              </button>

              {!quoteSuccess ? (
                <form onSubmit={handleQuoteSubmit} className="space-y-5">
                  <div className="text-center space-y-1.5 pb-2 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto text-brand-500 shadow-inner">
                      <Icons.Send size={20} />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight uppercase">Yêu cầu báo giá nhanh</h3>
                    <p className="text-xs text-slate-400 font-semibold">Lexi sẽ phản hồi báo giá chi tiết cho bạn sau 10 - 15 phút</p>
                  </div>

                  <div className="space-y-4">
                    {/* Link sản phẩm */}
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Link sản phẩm cần mua</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Icons.Link size={14} />
                        </div>
                        <input
                          type="url"
                          required
                          value={quoteForm.url}
                          onChange={(e) => setQuoteForm({ ...quoteForm, url: e.target.value })}
                          placeholder="Dán đường dẫn sản phẩm Amazon, Ebay, Taobao..."
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 bg-slate-50/50 transition-all"
                        />
                      </div>
                    </div>

                    {/* Họ và tên */}
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Họ và tên</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Icons.User size={14} />
                        </div>
                        <input
                          type="text"
                          required
                          value={quoteForm.name}
                          onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                          placeholder="Họ và tên của bạn"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 bg-slate-50/50 transition-all"
                        />
                      </div>
                    </div>

                    {/* Số điện thoại */}
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Số điện thoại (Zalo nhận báo giá)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Icons.Phone size={14} />
                        </div>
                        <input
                          type="tel"
                          required
                          value={quoteForm.phone}
                          onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                          placeholder="Nhập số điện thoại để tư vấn viên liên hệ"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 bg-slate-50/50 transition-all"
                        />
                      </div>
                    </div>

                    {/* Ghi chú */}
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">Ghi chú yêu cầu (Không bắt buộc)</label>
                      <div className="relative">
                        <div className="absolute top-3.5 left-3.5 text-slate-400">
                          <Icons.FileText size={14} />
                        </div>
                        <textarea
                          value={quoteForm.note}
                          onChange={(e) => setQuoteForm({ ...quoteForm, note: e.target.value })}
                          placeholder="Mô tả thêm về kích thước, màu sắc, số lượng hoặc các lưu ý khác..."
                          rows={3}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 bg-slate-50/50 transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={quoteLoading}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all duration-200 active:scale-98 uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-brand-500/20 border-none"
                  >
                    {quoteLoading ? (
                      <>
                        <Icons.Loader2 size={14} className="animate-spin" /> Đang gửi yêu cầu...
                      </>
                    ) : (
                      <>
                        <Icons.Send size={13} /> Gửi yêu cầu ngay
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                    <Icons.CheckCircle size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-800">Gửi yêu cầu thành công!</h3>
                    <p className="text-xs text-slate-500 font-semibold px-4 leading-relaxed">
                      Hệ thống Lexi đã ghi nhận thông tin báo giá của bạn. Chuyên viên của chúng tôi sẽ liên hệ báo giá chi tiết qua số Zalo/SĐT **{quoteForm.phone}** trong ít phút.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsQuoteOpen(false)}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all border-none cursor-pointer"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      , document.body)}

      {mounted && isTrackingOpen && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsTrackingOpen(false)}
          />
          
          {/* Centering wrapper */}
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            {/* Modal Container */}
            <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-lg border border-slate-200/60 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden z-10 transition-all duration-300 transform scale-100 p-6 sm:p-8 text-left my-8">
              
              {/* Close Button */}
              <button
                onClick={() => setIsTrackingOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer outline-none"
              >
                <Icons.X size={18} />
              </button>

              <div className="text-center space-y-1.5 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto text-brand-500 shadow-inner">
                  <Icons.Search size={20} />
                </div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight uppercase">Tra cứu vận đơn logistics</h3>
                <p className="text-xs text-slate-400 font-semibold">Theo dõi chi tiết trạng thái và lịch trình thời gian thực</p>
              </div>

              {/* Search Form */}
              <form onSubmit={handleTrackingSearch} className="py-4 flex gap-2.5">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Icons.Package size={14} />
                  </div>
                  <input
                    type="text"
                    required
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="Nhập mã vận đơn (Ví dụ: EZI889922)..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 bg-slate-50/50 transition-all uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-400 text-white font-extrabold text-xs px-6 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer border-none shadow-md shadow-brand-500/10 active:scale-95"
                >
                  {trackingLoading ? (
                    <Icons.Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Icons.Search size={13} />
                  )}
                  <span>Tìm kiếm</span>
                </button>
              </form>

              {/* Result / Placeholder Area */}
              <div className="space-y-4 py-2">
                {trackingLoading && (
                  <div className="text-center py-12 space-y-3">
                    <Icons.Loader2 size={36} className="text-brand-500 animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">Đang truy vấn lịch trình đơn hàng...</p>
                  </div>
                )}

                {!trackingLoading && !trackingResult && (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40 space-y-2">
                    <Icons.ClipboardCheck size={28} className="text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">Chưa có thông tin tra cứu</p>
                    <p className="text-[10px] text-slate-400 max-w-[320px] mx-auto leading-normal">
                      Hãy nhập mã vận đơn ghi trên phiếu gửi hàng hoặc email thông báo để cập nhật lịch trình thời gian thực.
                    </p>
                    <div className="pt-2">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Mã vận đơn mẫu:</span>
                      <button 
                        type="button"
                        onClick={() => setTrackingCode('EZI889922')}
                        className="text-[9.5px] font-bold text-brand-500 hover:underline bg-brand-50 px-2.5 py-1 rounded-md border-none cursor-pointer"
                      >
                        EZI889922
                      </button>
                    </div>
                  </div>
                )}

                {!trackingLoading && trackingResult && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Info Box */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-[10.5px]">
                      <div className="space-y-1">
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Mã vận đơn</p>
                        <p className="text-slate-800 font-extrabold text-xs">{trackingResult.code}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Hình thức</p>
                        <p className="text-slate-800 font-extrabold text-xs">{trackingResult.type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Khối lượng</p>
                        <p className="text-slate-800 font-extrabold text-xs">{trackingResult.weight}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 font-bold uppercase tracking-wider">Đích đến</p>
                        <p className="text-slate-800 font-extrabold text-xs">{trackingResult.destination}</p>
                      </div>
                    </div>

                    {/* Status Banner */}
                    <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Trạng thái hiện tại:</span>
                      <span className="font-extrabold text-brand-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping inline-block" />
                        {trackingResult.status}
                      </span>
                    </div>

                    {/* Timeline Flow */}
                    <div className="pl-4 pr-2 space-y-6 relative before:content-[''] before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                      {trackingResult.steps.map((step: any, sIdx: number) => (
                        <div key={sIdx} className="flex gap-4 relative">
                          {/* Bullet */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm
                            ${step.done ? 'bg-emerald-500 text-white' : ''}
                            ${step.current ? 'bg-brand-500 text-white ring-4 ring-brand-500/20' : ''}
                            ${step.pending ? 'bg-slate-100 text-slate-400' : ''}
                          `}>
                            {step.done && <Icons.CheckCircle size={14} />}
                            {step.current && <Icons.Package size={14} />}
                            {step.pending && <Icons.MapPin size={14} />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pt-1.5 space-y-0.5">
                            <div className="flex justify-between items-center">
                              <h4 className={`text-[11.5px] font-extrabold 
                                ${step.done ? 'text-slate-800' : ''}
                                ${step.current ? 'text-brand-500' : ''}
                                ${step.pending ? 'text-slate-400' : ''}
                              `}>
                                {step.title}
                              </h4>
                              <span className="text-[9.5px] font-bold text-slate-400">{step.time}</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-400 leading-normal">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      , document.body)}

    </>
  );
}
