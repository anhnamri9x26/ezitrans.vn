"use client";

import React from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { getMenuItemsForLocation } from '@/lib/navigation/client';

const FacebookIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const TwitterIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>;
const LinkedinIcon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;

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

export default function Header({ 
  settings, 
  previewDevice 
}: { 
  settings: Record<string, string>;
  previewDevice?: 'desktop' | 'tablet' | 'mobile';
}) {
  const siteLogo = settings.site_logo;
  const siteTitle = settings.site_title || 'FengYang Steel';
  const email = settings.contact_email || 'info@fengyang.com';
  const hotline = settings.contact_hotline || '0969 223 501';
  
  const [isQuoteModalOpen, setIsQuoteModalOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [expandedMobileMenus, setExpandedMobileMenus] = React.useState<Record<string, boolean>>({});

  const toggleMobileSubmenu = (idx: string) => {
    setExpandedMobileMenus(prev => ({...prev, [idx]: !prev[idx]}));
  };
  
  const rawMenuItems = getMenuItemsForLocation(settings, 'header-primary');

  const menuTree = buildMenuTree(rawMenuItems);

  return (
    <header className="w-full font-sans shadow-md sticky top-0 z-50 bg-white">
      {/* Top Bar */}
      <div className="bg-[#2D3753] text-white py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center text-[11px] sm:text-[13px]">
          <div className="flex flex-row items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
            <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-[#E31B23] transition-colors truncate max-w-[150px] sm:max-w-none">
              <Icons.Mail size={12} className="shrink-0" />
              <span className="truncate">{email}</span>
            </a>
            <a href={`tel:${hotline.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-[#E31B23] transition-colors shrink-0">
              <Icons.Phone size={12} className="shrink-0" />
              <span className="font-bold">Hotline: {hotline}</span>
            </a>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex gap-3">
              <a href="#" className="hover:text-[#E31B23] transition-colors"><FacebookIcon size={14} /></a>
              <a href="#" className="hover:text-[#E31B23] transition-colors"><TwitterIcon size={14} /></a>
              <a href="#" className="hover:text-[#E31B23] transition-colors"><LinkedinIcon size={14} /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={`max-w-7xl mx-auto px-6 py-4 flex flex-wrap ${previewDevice && previewDevice !== 'desktop' ? 'flex-wrap' : 'lg:flex-nowrap'} items-center justify-between gap-4`}>
        {/* Logo & Mobile Menu Toggle */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {(!previewDevice || previewDevice !== 'desktop') && (
            <button 
              className={`${previewDevice ? '' : 'lg:hidden'} p-2 -ml-2 text-slate-800 hover:text-[#E31B23] transition-colors`}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Menu"
            >
              <Icons.Menu size={28} />
            </button>
          )}

          {siteLogo ? (
            <Link href="/" className="block hover:opacity-90 transition-opacity">
              <img src={siteLogo} alt={siteTitle} className="h-16 max-w-[240px] object-contain" />
            </Link>
          ) : (
            <Link href="/" className="text-3xl font-black text-[#2D3753] tracking-tight hover:text-[#1e2538] transition-colors uppercase">
              {siteTitle}
            </Link>
          )}
        </div>

        {/* Search */}
        {(!previewDevice || previewDevice === 'desktop') && (
          <div className={`${previewDevice ? 'flex' : 'hidden md:flex'} flex-1 max-w-xl items-center mx-8`}>
            <form className="w-full relative flex items-center" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm, mác thép..." 
              className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2.5 outline-none focus:border-[#E31B23] transition-colors rounded-l-md"
            />
            <button 
              type="submit" 
              className="bg-[#2D3753] text-white px-5 py-2.5 rounded-r-md hover:bg-[#1e2538] transition-colors flex items-center justify-center border border-[#2D3753]"
            >
              <Icons.Search size={18} />
            </button>
          </form>
        </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {(!previewDevice || previewDevice === 'desktop') && (
            <a href={`tel:${hotline.replace(/\s/g, '')}`} className={`${previewDevice ? 'flex' : 'hidden lg:flex'} items-center gap-3`}>
              <div className="w-10 h-10 rounded-full bg-[#E31B23]/10 flex items-center justify-center text-[#E31B23]">
                <Icons.PhoneCall size={20} />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Tư vấn miễn phí</div>
                <div className="text-lg font-bold text-[#2D3753] leading-none">{hotline}</div>
              </div>
            </a>
          )}
          <button 
            onClick={() => setIsQuoteModalOpen(true)}
            className="bg-[#E31B23] hover:bg-[#c9181f] text-white font-bold text-sm px-5 py-2.5 rounded-md transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icons.ClipboardList size={16} />
            <span className={`${previewDevice && previewDevice === 'mobile' ? 'hidden' : 'hidden sm:inline'}`}>Báo Giá</span>
          </button>
        </div>
      </div>

      {/* Navigation Bar (Desktop) */}
      {(!previewDevice || previewDevice === 'desktop') && (
        <div className={`${previewDevice ? 'block' : 'hidden lg:block'} border-t border-slate-100 bg-white`}>
          <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center gap-8 relative">
            {menuTree.length === 0 ? (
              <div className="py-3 text-sm font-semibold text-[#2D3753] uppercase">Trang chủ</div>
            ) : (
              menuTree.map((item, idx) => {
                const hasChildren = item.children && item.children.length > 0;

                if (!hasChildren) {
                  return (
                    <Link 
                      key={idx} 
                      href={item.url} 
                      className="py-3 text-[14px] font-bold text-[#2D3753] uppercase tracking-wide hover:text-[#E31B23] transition-colors"
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <div key={idx} className="relative group py-3">
                    <button 
                      type="button"
                      className="flex items-center gap-1 text-[14px] font-bold text-[#2D3753] uppercase tracking-wide hover:text-[#E31B23] border-none bg-transparent cursor-pointer outline-none transition-colors"
                    >
                      <span>{item.label}</span>
                      <Icons.ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
                    </button>

                    {/* Mega Menu Dropdown */}
                    <div className="absolute top-full left-0 mt-0 bg-white border-t-2 border-[#E31B23] shadow-xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50 rounded-b-md w-64">
                      {item.children.map((sub, sIdx) => {
                        const hasSubChildren = sub.children && sub.children.length > 0;
                        return (
                          <div key={sIdx} className="relative group/sub border-b border-slate-50 last:border-0">
                            <Link 
                              href={sub.url}
                              className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-slate-700 hover:text-[#E31B23] hover:bg-slate-50 transition-colors"
                            >
                              <span>{sub.label}</span>
                              {hasSubChildren && (
                                <Icons.ChevronRight size={14} className="text-slate-400 group-hover/sub:text-[#E31B23]" />
                              )}
                            </Link>

                            {/* Flyout Submenu */}
                            {hasSubChildren && (
                              <div className="absolute left-full top-0 ml-0 w-64 bg-white border-l border-slate-100 shadow-xl opacity-0 translate-x-1 pointer-events-none group-hover/sub:opacity-100 group-hover/sub:translate-x-0 group-hover/sub:pointer-events-auto transition-all duration-150 z-50 rounded-r-md">
                                {sub.children.map((grand, gIdx) => (
                                  <Link
                                    key={gIdx}
                                    href={grand.url}
                                    className="block px-5 py-3 text-sm font-medium text-slate-600 hover:text-[#E31B23] hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
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
                  </div>
                );
              })
            )}
          </nav>
        </div>
      </div>
      )}

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-left-full duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <span className="font-black text-lg text-[#2D3753] uppercase">{siteTitle}</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
              >
                <Icons.X size={20} />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <form className="relative flex items-center" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm..." 
                  className="w-full bg-white border border-slate-200 text-sm px-4 py-3 outline-none focus:border-[#E31B23] transition-colors rounded-l-md shadow-sm"
                />
                <button 
                  type="submit" 
                  className="bg-[#2D3753] text-white px-4 py-3 rounded-r-md flex items-center justify-center border border-[#2D3753]"
                >
                  <Icons.Search size={18} />
                </button>
              </form>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <nav className="flex flex-col">
                {menuTree.length === 0 ? (
                  <div className="py-4 px-2 text-sm font-semibold text-slate-800">Trang chủ</div>
                ) : (
                  menuTree.map((item, idx) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedMobileMenus[idx.toString()];

                    if (!hasChildren) {
                      return (
                        <Link 
                          key={idx} 
                          href={item.url} 
                          className="py-4 px-2 text-[15px] font-bold text-[#2D3753] border-b border-slate-100 uppercase tracking-wide"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      );
                    }

                    return (
                      <div key={idx} className="border-b border-slate-100 flex flex-col">
                        <button 
                          className="flex items-center justify-between w-full py-4 px-2 text-[15px] font-bold text-[#2D3753] uppercase tracking-wide outline-none"
                          onClick={() => toggleMobileSubmenu(idx.toString())}
                        >
                          <span>{item.label}</span>
                          <Icons.ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isExpanded && (
                          <div className="bg-slate-50 flex flex-col rounded-md mb-2 overflow-hidden">
                            {item.children.map((sub, sIdx) => {
                              const hasSubChildren = sub.children && sub.children.length > 0;
                              const subIdx = `${idx}-${sIdx}`;
                              const isSubExpanded = expandedMobileMenus[subIdx];

                              return (
                                <div key={sIdx} className="flex flex-col border-b border-slate-100/50 last:border-0">
                                  {hasSubChildren ? (
                                    <>
                                      <button 
                                        className="flex items-center justify-between w-full py-3 px-4 text-[14px] font-semibold text-slate-700 outline-none"
                                        onClick={() => toggleMobileSubmenu(subIdx)}
                                      >
                                        <span>{sub.label}</span>
                                        <Icons.ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isSubExpanded ? 'rotate-180' : ''}`} />
                                      </button>
                                      {isSubExpanded && (
                                        <div className="bg-white/60 flex flex-col border-t border-slate-100/50">
                                          {sub.children.map((grand, gIdx) => (
                                            <Link
                                              key={gIdx}
                                              href={grand.url}
                                              className="py-2.5 pl-8 pr-4 text-[13px] font-medium text-slate-600 hover:text-[#E31B23]"
                                              onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                              {grand.label}
                                            </Link>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <Link 
                                      href={sub.url}
                                      className="py-3 px-4 text-[14px] font-semibold text-slate-700 hover:text-[#E31B23]"
                                      onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                      {sub.label}
                                    </Link>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </nav>
            </div>

            {/* Mobile Footer Info */}
            <div className="p-6 bg-slate-900 text-white mt-auto">
              <a href={`tel:${hotline.replace(/\s/g, '')}`} className="flex items-center justify-center gap-3 bg-[#E31B23] hover:bg-red-700 text-white py-3 px-4 rounded-lg font-bold w-full transition-colors">
                <Icons.PhoneCall size={18} />
                Gọi ngay: {hotline}
              </a>
              <a href={`mailto:${email}`} className="mt-4 flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                <Icons.Mail size={16} /> {email}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#2D3753] px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Icons.ClipboardList size={20} className="text-[#E31B23]" />
                YÊU CẦU BÁO GIÁ
              </h3>
              <button 
                onClick={() => setIsQuoteModalOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <Icons.X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-6">
                Vui lòng điền thông tin bên dưới, chuyên viên của FengYang sẽ liên hệ báo giá nhanh nhất cho bạn trong vòng 15 phút.
              </p>
              
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Cảm ơn bạn! Yêu cầu báo giá đã được gửi.'); setIsQuoteModalOpen(false); }}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Họ & Tên *</label>
                  <input type="text" required className="w-full border border-slate-200 rounded-md px-4 py-2.5 outline-none focus:border-[#E31B23] text-sm" placeholder="Nhập họ tên của bạn..." />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Số điện thoại *</label>
                    <input type="tel" required className="w-full border border-slate-200 rounded-md px-4 py-2.5 outline-none focus:border-[#E31B23] text-sm" placeholder="Ví dụ: 0901..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email</label>
                    <input type="email" className="w-full border border-slate-200 rounded-md px-4 py-2.5 outline-none focus:border-[#E31B23] text-sm" placeholder="Email nhận báo giá..." />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Sản phẩm cần báo giá *</label>
                  <textarea required rows={3} className="w-full border border-slate-200 rounded-md px-4 py-2.5 outline-none focus:border-[#E31B23] text-sm resize-none" placeholder="Nhập chi tiết mác thép, quy cách, số lượng..."></textarea>
                </div>
                
                <button type="submit" className="w-full bg-[#E31B23] hover:bg-[#c9181f] text-white font-bold py-3.5 rounded-md uppercase tracking-wider text-sm transition-colors mt-2 shadow-lg shadow-[#E31B23]/20 flex items-center justify-center gap-2">
                  <Icons.Send size={18} /> GỬI YÊU CẦU NGAY
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
