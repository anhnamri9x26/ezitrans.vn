import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';

export default function Footer({ settings = {} }: { settings?: Record<string, string> }) {
  const title = settings.site_title || 'Ezitrans';
  
  return (
    <footer className="ezi-footer">
      <div className="ezi-container ezi-footergrid">
        
        {/* Logo and Contacts */}
        <div className="ezi-footer-brand-col">
          <Link href="/" className="ezi-brand" style={{ color: 'white' }}>
            <span className="ezi-mark" style={{ background: 'var(--orange)' }}>E</span>
            <span>EZITRANS LOGO</span>
          </Link>
          
          <p>
            Ezitrans là một trong những công ty hàng đầu về lĩnh vực giao nhận vận tải tại Việt Nam. Chúng tôi cung cấp đầy đủ, toàn diện các dịch vụ và giải pháp tốt nhất trong lĩnh vực logistics.
          </p>
          
          <div className="ezi-footer-contacts">
            <div className="ezi-footer-contact-item">
              <MapPin className="ezi-footer-contact-icon" size={16} />
              <span>Address: Số 8, Ngõ 79/14 Đường Quảng Khánh, Tây Hồ, Hà Nội</span>
            </div>
            <div className="ezi-footer-contact-item">
              <Phone className="ezi-footer-contact-icon" size={16} />
              <span>Hotline: 0868.375.300 (Zalo)</span>
            </div>
            <div className="ezi-footer-contact-item">
              <Mail className="ezi-footer-contact-icon" size={16} />
              <span>Email: ezitrans.vn@gmail.com</span>
            </div>
            <div className="ezi-footer-contact-item">
              <Globe className="ezi-footer-contact-icon" size={16} />
              <span>Website: www.ezitrans.vn</span>
            </div>
          </div>
        </div>

        {/* GIỚI THIỆU & FAQs */}
        <div>
          <div className="ezi-footer-link-group">
            <h3>GIỚI THIỆU</h3>
            <div className="ezi-footer-links-list">
              <Link href="/gioi-thieu" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Về công ty
              </Link>
              <Link href="/chinh-sach-bao-mat" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Chính sách bảo mật
              </Link>
              <Link href="/thong-tin-chuyen-khoan" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Thông tin chuyển khoản
              </Link>
              <Link href="/faqs" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Câu hỏi thường gặp
              </Link>
              <Link href="/lien-he" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Liên hệ
              </Link>
            </div>
          </div>

          <div className="ezi-footer-link-group">
            <h3>FAQs</h3>
            <div className="ezi-footer-links-list">
              <Link href="/tracking-number-la-gi" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Tracking Number là gì?
              </Link>
              <Link href="/tai-khoan-paypal-la-gi" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Tài khoản Paypal là gì?
              </Link>
              <Link href="/dau-gia-ebay-la-gi" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Đấu giá Ebay là gì?
              </Link>
              <Link href="/thanh-toan-chuyen-khoan-nhu-the-nao" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Thanh toán chuyển khoản như thế nào?
              </Link>
            </div>
          </div>
        </div>

        {/* MUA HỘ & SHIP HỘ */}
        <div>
          <div className="ezi-footer-link-group">
            <h3>MUA HỘ</h3>
            <div className="ezi-footer-links-list">
              <Link href="/mua-ho-hang-trung-quoc.html" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Mua hộ hàng Trung Quốc
              </Link>
              <Link href="/mua-ho-hang-nhat-ban.html" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Mua hộ hàng Nhật Bản
              </Link>
              <Link href="/mua-ho-hang-nga.html" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Mua hộ hàng Nga
              </Link>
              <Link href="/mua-ho-hang-my.html" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Mua hộ hàng Mỹ
              </Link>
              <Link href="/mua-ho-hang-uc.html" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Mua hộ hàng Úc
              </Link>
            </div>
          </div>

          <div className="ezi-footer-link-group">
            <h3>SHIP HỘ</h3>
            <div className="ezi-footer-links-list">
              <Link href="/van-chuyen-hang-trung-quoc-ve-viet-nam.html" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Vận chuyển hàng Trung Quốc
              </Link>
              <Link href="/van-chuyen-hang-nhat-ban-ve-viet-nam.html" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Vận chuyển hàng Nhật Bản
              </Link>
              <Link href="/van-chuyen-hang-nga-ve-viet-nam.html" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Vận chuyển hàng Nga
              </Link>
              <Link href="/van-chuyen-hang-my-ve-viet-nam.html" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Vận chuyển hàng Mỹ
              </Link>
              <Link href="/van-chuyen-hang-uc-ve-viet-nam.html" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Vận chuyển hàng Úc
              </Link>
            </div>
          </div>
        </div>

        {/* XUẤT KHẨU & DỊCH VỤ KHÁC */}
        <div>
          <div className="ezi-footer-link-group">
            <h3>XUẤT KHẨU</h3>
            <div className="ezi-footer-links-list">
              <Link href="/gui-hang-di-trung-quoc" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Gửi hàng đi Trung Quốc
              </Link>
              <Link href="/gui-hang-di-nhat-ban" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Gửi hàng đi Nhật Bản
              </Link>
              <Link href="/gui-hang-di-nga" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Gửi hàng đi Nga
              </Link>
              <Link href="/gui-hang-di-my" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Gửi hàng đi Mỹ
              </Link>
              <Link href="/gui-hang-di-uc" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Gửi hàng đi Úc
              </Link>
            </div>
          </div>

          <div className="ezi-footer-link-group">
            <h3>DỊCH VỤ KHÁC</h3>
            <div className="ezi-footer-links-list">
              <Link href="/thanh-toan-ho-alipay" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Thanh toán hộ Alipay
              </Link>
              <Link href="/thanh-toan-ho-wechat" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Thanh toán hộ Wechat
              </Link>
              <Link href="/thanh-toan-ho-paypal" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Thanh toán hộ Paypal
              </Link>
              <Link href="/mua-ho-hang-chemist" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Mua hộ hàng Chemist
              </Link>
              <Link href="/mua-ho-hang-1688" className="ezi-footer-link">
                <span className="ezi-footer-bullet">›</span> Mua hộ hàng 1688
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Bottom Bar */}
      <div className="ezi-footer-bottom">
        <div className="ezi-container ezi-footer-bottom-in">
          <span>Copyright 2020 - 2026 {title} Logistics JSC. All Rights Reserved.</span>
          <div className="ezi-footer-socials">
            <a href="#" className="ezi-footer-social-link" aria-label="Facebook">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" className="ezi-footer-social-link" aria-label="Twitter">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
            <a href="#" className="ezi-footer-social-link" aria-label="Youtube">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/><path d="m10 15 5-3-5-3z"/></svg>
            </a>
            <a href="#" className="ezi-footer-social-link" aria-label="Linkedin">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
