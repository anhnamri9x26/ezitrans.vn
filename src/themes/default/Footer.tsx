import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Factory, ArrowRight } from 'lucide-react';

const Facebook = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const Twitter = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>;
const Youtube = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>;

export default function FengYangFooter({ settings }: { settings: any }) {
  const copyright = settings.footer_copyright || `© ${new Date().getFullYear()} Thép FengYang. Bản quyền thuộc về FengYang Special Steel.`;
  const aboutText = settings.footer_about_text || 'Thép FengYang tự hào là đơn vị hàng đầu cung cấp thép đặc chủng, thép chế tạo, thép công cụ với kinh nghiệm trên 16 năm tại thị trường Việt Nam.';
  const phone = settings.footer_phone || '0969 223 501';
  const email = settings.footer_email || 'info@fengyang.com';
  const address = settings.footer_address || 'Số 123 Đường Công Nghiệp, Khu Công Nghiệp ABC, TP.HCM';
  
  let menuItems = [];
  try {
    menuItems = settings.theme_menu_footer ? JSON.parse(settings.theme_menu_footer) : [
      { label: 'Thép không gỉ', url: '/danh-muc-san-pham/thep-khong-gi' },
      { label: 'Thép hợp kim', url: '/danh-muc-san-pham/thep-hop-kim' },
      { label: 'Thép Carbon', url: '/danh-muc-san-pham/thep-carbon' },
      { label: 'Thép làm khuôn', url: '/danh-muc-san-pham/thep-lam-khuon' },
      { label: 'Thép rèn', url: '/danh-muc-san-pham/thep-ren' },
    ];
  } catch (e) {
    console.error("Failed to parse footer menu JSON:", e);
  }

  return (
    <footer className="bg-[#2D3753] text-slate-300 font-sans text-[14px] mt-auto">
      {/* Top Banner Contact */}
      <div className="bg-[#1e2538] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-[#E31B23] shrink-0 border border-slate-850">
              <Factory size={24} />
            </div>
            <div>
              <h3 className="text-white text-xl font-bold uppercase">Nhà máy Thép FengYang</h3>
              <p className="text-slate-400 font-medium mt-1">Chất lượng - Uy tín - Giao hàng toàn quốc</p>
            </div>
          </div>
          <a href={`tel:${phone.replace(/\s/g, '')}`} className="bg-[#E31B23] hover:bg-[#c4151d] text-white font-bold px-8 py-3 rounded-md transition-colors flex items-center gap-2 uppercase tracking-wide">
            <Phone size={18} /> Gọi ngay: {phone}
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
        {/* Cột 1: Giới thiệu & Liên hệ */}
        <div className="space-y-6">
          <h3 className="text-white font-extrabold text-lg tracking-wide uppercase border-l-4 border-[#E31B23] pl-3">Liên hệ</h3>
          <p className="leading-relaxed text-slate-300">{aboutText}</p>
          <div className="space-y-4 pt-2">
            {address && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#E31B23] shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-[#E31B23] shrink-0" />
                <span className="font-bold text-white">{phone}</span>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-[#E31B23] shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-[#E31B23] transition-colors">{email}</a>
              </div>
            )}
          </div>
        </div>

        {/* Cột 2: Sản phẩm chính */}
        <div className="space-y-6">
          <h3 className="text-white font-extrabold text-lg tracking-wide uppercase border-l-4 border-[#E31B23] pl-3">Sản phẩm chính</h3>
          <ul className="space-y-3">
            {menuItems.slice(0, 6).map((item: any, idx: number) => (
              <li key={idx}>
                <Link href={item.url} className="flex items-center gap-3 hover:text-[#E31B23] transition-colors group">
                  <ArrowRight size={14} className="text-[#E31B23] shrink-0 transition-transform group-hover:translate-x-1" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Cột 3: Hỗ trợ khách hàng */}
        <div className="space-y-6">
          <h3 className="text-white font-extrabold text-lg tracking-wide uppercase border-l-4 border-[#E31B23] pl-3">Hỗ trợ khách hàng</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/gioi-thieu.html" className="flex items-center gap-3 hover:text-[#E31B23] transition-colors group">
                <ArrowRight size={14} className="text-[#E31B23] shrink-0 transition-transform group-hover:translate-x-1" />
                <span>Giới thiệu công ty</span>
              </Link>
            </li>
            <li>
              <Link href="/quy-dinh-mua-hang.html" className="flex items-center gap-3 hover:text-[#E31B23] transition-colors group">
                <ArrowRight size={14} className="text-[#E31B23] shrink-0 transition-transform group-hover:translate-x-1" />
                <span>Quy định mua hàng</span>
              </Link>
            </li>
            <li>
              <Link href="/chinh-sach-bao-hanh.html" className="flex items-center gap-3 hover:text-[#E31B23] transition-colors group">
                <ArrowRight size={14} className="text-[#E31B23] shrink-0 transition-transform group-hover:translate-x-1" />
                <span>Chính sách bảo hành</span>
              </Link>
            </li>
            <li>
              <Link href="/bang-bao-gia.html" className="flex items-center gap-3 hover:text-[#E31B23] transition-colors group">
                <ArrowRight size={14} className="text-[#E31B23] shrink-0 transition-transform group-hover:translate-x-1" />
                <span>Bảng báo giá</span>
              </Link>
            </li>
            <li>
              <Link href="/tin-tuc" className="flex items-center gap-3 hover:text-[#E31B23] transition-colors group">
                <ArrowRight size={14} className="text-[#E31B23] shrink-0 transition-transform group-hover:translate-x-1" />
                <span>Tin tức chuyên ngành</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 4: Kết nối / Mạng xã hội */}
        <div className="space-y-6">
          <h3 className="text-white font-extrabold text-lg tracking-wide uppercase border-l-4 border-[#E31B23] pl-3">Kết nối với chúng tôi</h3>
          <p>Nhận báo giá và tư vấn nhanh chóng từ đội ngũ chuyên gia.</p>
          <div className="flex gap-3">
            <a href="#" className="w-10 h-10 bg-white/5 border border-slate-700 rounded-md flex items-center justify-center hover:bg-[#E31B23] hover:text-white hover:border-[#E31B23] transition-all">
              <Facebook size={18} />
            </a>
            <a href="#" className="w-10 h-10 bg-white/5 border border-slate-700 rounded-md flex items-center justify-center hover:bg-[#E31B23] hover:text-white hover:border-[#E31B23] transition-all">
              <Twitter size={18} />
            </a>
            <a href="#" className="w-10 h-10 bg-white/5 border border-slate-700 rounded-md flex items-center justify-center hover:bg-[#E31B23] hover:text-white hover:border-[#E31B23] transition-all">
              <Youtube size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* Dòng bản quyền dưới cùng */}
      <div className="bg-[#131926] py-6 text-center text-slate-400 font-medium text-[13px]">
        <div className="max-w-7xl mx-auto px-6">
          {copyright}
        </div>
      </div>
    </footer>
  );
}
