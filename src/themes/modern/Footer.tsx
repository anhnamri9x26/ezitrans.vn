import React from 'react';
import Link from 'next/link';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  ChevronRight, 
  ArrowUpRight,
  Clock,
  Truck
} from 'lucide-react';
import { getMenuItemsForLocation } from '@/lib/navigation/client';

export default function ModernFooter({ settings }: { settings: any }) {
  const copyright = settings.footer_copyright || `Copyright 2020 - 2026 Lexi Logistics JSC. All Rights Reserved.`;
  const aboutText = settings.footer_about_text || "Lexi là một trong những công ty hàng đầu về lĩnh vực giao nhận vận tải tại Việt Nam. Chúng tôi cung cấp đầy đủ, toàn diện các dịch vụ và giải pháp tốt nhất trong lĩnh vực logistics.";
  const phone = settings.footer_phone || "0868.375.300";
  const email = settings.footer_email || "lexi.vn@gmail.com";
  const address = settings.footer_address || "Số 8, Ngõ 79/14 Dương Quảng Hàm, Cầu Giấy, Hà Nội";

  const menuItems = getMenuItemsForLocation(settings, 'footer-primary');

  // Smart Parser: Supports 3 structure types
  const hasHierarchy = menuItems.some((item: any) => item.indent && item.indent > 0);
  let sections: { title: string; links: any[] }[] = [];

  if (hasHierarchy) {
    let currentSection: { title: string; links: any[] } | null = null;
    menuItems.forEach((item: any) => {
      if (!item.indent || item.indent === 0) {
        currentSection = { title: item.label, links: [] };
        sections.push(currentSection);
      } else if (currentSection && item.indent === 1) {
        currentSection.links.push(item);
      }
    });
  } else if (menuItems.length > 0) {
    const third = Math.ceil(menuItems.length / 3);
    const col1Links = menuItems.slice(0, third);
    const col2Links = menuItems.slice(third, third * 2);
    const col3Links = menuItems.slice(third * 2);

    if (col1Links.length > 0) sections.push({ title: "Liên kết nhanh", links: col1Links });
    if (col2Links.length > 0) sections.push({ title: "Thông tin dịch vụ", links: col2Links });
    if (col3Links.length > 0) sections.push({ title: "Chính sách & Quy định", links: col3Links });
  } else {
    // Fallback: Rich menu from the website sample
    sections = [
      {
        title: "Giới thiệu",
        links: [
          { label: "Về công ty", url: "/gioi-thieu" },
          { label: "Chính sách bảo mật", url: "/chinh-sach-bao-mat" },
          { label: "Thông tin chuyển khoản", url: "/thong-tin-chuyen-khoan" },
          { label: "Câu hỏi thường gặp", url: "/cau-hoi-thuong-gap" },
          { label: "Liên hệ", url: "/lien-he" }
        ]
      },
      {
        title: "FAQs",
        links: [
          { label: "Tracking Number là gì?", url: "/tracking-number-la-gi" },
          { label: "Tài khoản Paypal là gì?", url: "/tai-khoan-paypal-la-gi" },
          { label: "Đấu giá Ebay là gì?", url: "/dau-gia-ebay-la-gi" },
          { label: "Thanh toán chuyển khoản", url: "/huong-dan-thanh-toan" }
        ]
      },
      {
        title: "Mua hộ",
        links: [
          { label: "Mua hộ hàng Trung Quốc", url: "/mua-ho-hang-trung-quoc" },
          { label: "Mua hộ hàng Nhật Bản", url: "/mua-ho-hang-nhat-ban" },
          { label: "Mua hộ hàng Nga", url: "/mua-ho-hang-nga" },
          { label: "Mua hộ hàng Mỹ", url: "/mua-ho-hang-my" },
          { label: "Mua hộ hàng Úc", url: "/mua-ho-hang-uc" }
        ]
      },
      {
        title: "Ship hộ",
        links: [
          { label: "Vận chuyển hàng Trung Quốc", url: "/van-chuyen-hang-trung-quoc" },
          { label: "Vận chuyển hàng Nhật Bản", url: "/van-chuyen-hang-nhat-ban" },
          { label: "Vận chuyển hàng Nga", url: "/van-chuyen-hang-nga" },
          { label: "Vận chuyển hàng Mỹ", url: "/van-chuyen-hang-my" },
          { label: "Vận chuyển hàng Úc", url: "/van-chuyen-hang-uc" }
        ]
      },
      {
        title: "Xuất khẩu",
        links: [
          { label: "Gửi hàng đi Trung Quốc", url: "/gui-hang-di-trung-quoc" },
          { label: "Gửi hàng đi Nhật Bản", url: "/gui-hang-di-nhat-ban" },
          { label: "Gửi hàng đi Nga", url: "/gui-hang-di-nga" },
          { label: "Gửi hàng đi Mỹ", url: "/gui-hang-di-my" },
          { label: "Gửi hàng đi Úc", url: "/gui-hang-di-uc" }
        ]
      },
      {
        title: "Dịch vụ khác",
        links: [
          { label: "Thanh toán hộ Alipay", url: "/thanh-toan-ho-alipay" },
          { label: "Thanh toán hộ Wechat", url: "/thanh-toan-ho-wechat" },
          { label: "Thanh toán hộ Paypal", url: "/thanh-toan-ho-paypal" },
          { label: "Mua hộ hàng Chemist", url: "/mua-ho-hang-chemist" },
          { label: "Mua hộ hàng 1688", url: "/mua-ho-hang-1688" }
        ]
      }
    ];
  }

  // Distribute sections into columns (max 4 visual columns for link groups)
  // Col 1 = brand + contact, Col 2-4 = menu sections (2 per column stacked if > 3)
  const colCount = Math.min(sections.length, 4);
  const columnSections: { title: string; links: any[] }[][] = [];
  
  if (sections.length <= 4) {
    sections.forEach(s => columnSections.push([s]));
  } else {
    // Distribute sections across 3-4 columns (stacking 2 per column)
    const perCol = Math.ceil(sections.length / 3);
    for (let i = 0; i < sections.length; i += perCol) {
      columnSections.push(sections.slice(i, i + perCol));
    }
  }

  // Social media links  
  const socialLinks = [
    { 
      label: "Facebook",
      url: settings.footer_facebook || "https://facebook.com/lexi",
      svg: <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
    },
    { 
      label: "YouTube",
      url: settings.footer_youtube || "https://youtube.com/@lexi",
      svg: <path d="M23.498 6.163c-.272-1.022-1.074-1.826-2.096-2.098C19.56 3.5 12 3.5 12 3.5s-7.56 0-9.402.565c-1.022.272-1.824 1.076-2.096 2.098C0 8.002 0 12 0 12s0 3.998.502 5.837c.272 1.022 1.074 1.826 2.096 2.098C4.44 20.5 12 20.5 12 20.5s7.56 0 9.402-.565c1.022-.272 1.824-1.076 2.096-2.098C24 15.998 24 12 24 12s0-3.998-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    },
    { 
      label: "Zalo",
      url: settings.footer_zalo || "https://zalo.me/0868375300",
      svg: <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248c-.14.452-.726 2.088-2.406 4.39-2.195 3.004-3.263 3.672-3.538 3.672-.172 0-.322-.16-.45-.478l-1.228-3.91c-.11-.358-.23-.53-.432-.53-.14 0-.6.28-1.072.558l-.638-.824c1.132-.996 2.243-2.14 2.773-2.14.456 0 .72.268.808.808.28 1.71.616 3.49.762 3.91.424-.786 1.16-2.388 1.16-2.774 0-.256-.076-.434-.34-.434-.133 0-.306.046-.492.138.658-2.154 1.922-3.208 3.17-3.208.822 0 1.208.554.923 1.822z"/>
    }
  ];

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-600 font-sans text-[13px] dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 dark:text-slate-400">
      
      {/* Top brand gradient accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />
      
      {/* Subtle ambient decorations */}
      <div className="absolute top-0 right-[15%] w-[400px] h-[400px] rounded-full bg-brand-500/[0.04] blur-[120px] pointer-events-none dark:bg-brand-500/[0.03]" />
      <div className="absolute bottom-0 left-[10%] w-[300px] h-[300px] rounded-full bg-brand-400/[0.03] blur-[100px] pointer-events-none dark:bg-brand-400/[0.02]" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-14 pb-8 relative z-10">
        
        {/* ──── MAIN GRID: Brand + Links ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10">
          
          {/* Brand & Contact Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-brand-500/25">
                ET
              </div>
              <div>
                <span className="text-slate-800 dark:text-white font-black text-lg tracking-tight block leading-tight">
                  Ezi<span className="text-brand-500">Trans</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Logistics Solutions
                </span>
              </div>
            </div>
            
            {/* About text */}
            <p className="text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium max-w-sm">
              {aboutText}
            </p>

            {/* Contact cards */}
            <div className="space-y-2.5">
              {/* Address */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-500/30 transition-all duration-300 group shadow-sm hover:shadow-md">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 group-hover:bg-brand-100 dark:group-hover:bg-brand-500/20 transition-colors">
                  <MapPin size={14} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Văn phòng</span>
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300 leading-snug block">{address}</span>
                </div>
              </div>

              {/* Phone */}
              <a 
                href={`tel:${phone.replace(/\(Zalo\)/g, '').replace(/\s/g, '').trim()}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-500/30 transition-all duration-300 group shadow-sm hover:shadow-md no-underline"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
                  <Phone size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Hotline (Zalo)</span>
                  <span className="text-[13px] font-extrabold text-slate-700 dark:text-slate-200">{phone}</span>
                </div>
              </a>

              {/* Email */}
              <a 
                href={`mailto:${email}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-500/30 transition-all duration-300 group shadow-sm hover:shadow-md no-underline"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                  <Mail size={14} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Email</span>
                  <span className="text-[12px] font-extrabold text-slate-700 dark:text-slate-200 truncate block">{email}</span>
                </div>
              </a>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2 pt-2">
              {socialLinks.map((soc) => (
                <a 
                  key={soc.label}
                  href={soc.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={soc.label}
                  title={soc.label}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all duration-300 hover:bg-brand-500 hover:border-brand-500 hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/25 group"
                >
                  <svg className="w-3.5 h-3.5 fill-current transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                    {soc.svg}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* ──── LINK COLUMNS (8 cols, distributed) ──── */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-8 lg:gap-6">
              {columnSections.map((col, colIdx) => (
                <div key={colIdx} className="space-y-8">
                  {col.map((section, sIdx) => (
                    <div key={sIdx}>
                      <h3 className="text-[12px] font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-brand-400 to-brand-600 inline-block" />
                        {section.title}
                      </h3>
                      <ul className="space-y-2">
                        {section.links.map((item: any, idx: number) => (
                          <li key={idx}>
                            <Link 
                              href={item.url} 
                              className="text-[12px] font-medium text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors duration-200 flex items-center gap-1.5 group no-underline"
                            >
                              <ChevronRight size={10} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                              <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                                {item.label}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ──── BOTTOM BAR ──── */}
        <div className="mt-12 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright + Status */}
            <div className="flex flex-col sm:flex-row items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <span>{copyright}</span>
              <span className="hidden sm:block w-px h-3 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Hệ thống hoạt động
              </div>
            </div>

            {/* Quick info badges */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                <Globe size={10} className="text-brand-500" />
                195 quốc gia
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                <Truck size={10} className="text-brand-500" />
                Vận chuyển quốc tế
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                <Clock size={10} className="text-brand-500" />
                T2 - CN: 8h - 21h
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
