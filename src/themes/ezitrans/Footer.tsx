import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import { getMenuItemsForLocation } from '@/lib/navigation/client';
import type { NavigationMenuItem } from '@/lib/navigation/types';

const fallbackFooterItems: NavigationMenuItem[] = [
  { id: 'group-about', label: 'GIỚI THIỆU', url: '#footer-about', indent: 0 },
  { id: 'about-company', label: 'Về công ty', url: '/gioi-thieu.html', indent: 1 },
  { id: 'about-privacy', label: 'Chính sách bảo mật', url: '/chinh-sach-bao-mat.html', indent: 1 },
  { id: 'about-bank', label: 'Thông tin chuyển khoản', url: '#thong-tin-chuyen-khoan', indent: 1 },
  { id: 'about-contact', label: 'Liên hệ', url: '/lien-he.html', indent: 1 },
  { id: 'group-faq', label: 'FAQs', url: '#footer-faq', indent: 0 },
  { id: 'faq-tracking', label: 'Tracking Number là gì?', url: '/tracking-number-la-gi.html', indent: 1 },
  { id: 'faq-paypal', label: 'Tài khoản Paypal là gì?', url: '/tai-khoan-paypal-la-gi.html', indent: 1 },
  { id: 'faq-ebay', label: 'Đấu giá Ebay là gì?', url: '/dau-gia-ebay-la-gi.html', indent: 1 },
  { id: 'group-buy', label: 'MUA HỘ', url: '#footer-buy', indent: 0 },
  { id: 'buy-cn', label: 'Mua hộ hàng Trung Quốc', url: '/mua-ho-hang-trung-quoc.html', indent: 1 },
  { id: 'buy-jp', label: 'Mua hộ hàng Nhật Bản', url: '/mua-ho-hang-nhat-ban.html', indent: 1 },
  { id: 'buy-ru', label: 'Mua hộ hàng Nga', url: '/mua-ho-hang-nga.html', indent: 1 },
  { id: 'buy-us', label: 'Mua hộ hàng Mỹ', url: '/mua-ho-hang-my.html', indent: 1 },
  { id: 'group-ship', label: 'SHIP HỘ', url: '#footer-ship', indent: 0 },
  { id: 'ship-cn', label: 'Vận chuyển hàng Trung Quốc', url: '/van-chuyen-hang-trung-quoc-ve-viet-nam.html', indent: 1 },
  { id: 'ship-jp', label: 'Vận chuyển hàng Nhật Bản', url: '/chuyen-hang-tu-nhat-ban-ve-viet-nam.html', indent: 1 },
  { id: 'ship-ru', label: 'Vận chuyển hàng Nga', url: '/chuyen-hang-tu-nga-ve-viet-nam.html', indent: 1 },
  { id: 'ship-us', label: 'Vận chuyển hàng Mỹ', url: '/chuyen-hang-tu-my-ve-viet-nam.html', indent: 1 },
  { id: 'group-export', label: 'XUẤT KHẨU', url: '#footer-export', indent: 0 },
  { id: 'export-cn', label: 'Gửi hàng đi Trung Quốc', url: '/gui-hang-di-trung-quoc.html', indent: 1 },
  { id: 'export-jp', label: 'Gửi hàng đi Nhật Bản', url: '/gui-hang-di-nhat-ban.html', indent: 1 },
  { id: 'export-ru', label: 'Gửi hàng đi Nga', url: '/gui-hang-di-nga.html', indent: 1 },
  { id: 'export-us', label: 'Gửi hàng đi Mỹ', url: '/gui-hang-di-my.html', indent: 1 },
  { id: 'group-services', label: 'DỊCH VỤ KHÁC', url: '#footer-services', indent: 0 },
  { id: 'service-alipay', label: 'Thanh toán hộ Alipay', url: '/thanh-toan-ho-alipay.html', indent: 1 },
  { id: 'service-wechat', label: 'Thanh toán hộ Wechat', url: '/thanh-toan-ho-wechat.html', indent: 1 },
  { id: 'service-paypal', label: 'Thanh toán hộ Paypal', url: '/thanh-toan-ho-paypal.html', indent: 1 },
  { id: 'service-chemist', label: 'Mua hộ hàng Chemist', url: '/mua-ho-hang-chemist-warehouse.html', indent: 1 },
];

function FooterGroup({ title, items }: { title: string; items: NavigationMenuItem[] }) {
  return (
    <div className="ezi-footer-link-group">
      <h3>{title}</h3>
      <div className="ezi-footer-links-list">
        {items.map((item) => (
          <Link key={item.id} href={item.url} className="ezi-footer-link">
            <span className="ezi-footer-bullet">›</span> {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Footer({ settings = {} }: { settings?: Record<string, string> }) {
  const title = settings.site_title || 'Ezitrans';
  const configuredItems = getMenuItemsForLocation(settings, 'footer-primary');
  const sourceItems = configuredItems.some((item) => item.indent > 0) ? configuredItems : fallbackFooterItems;
  const groups = sourceItems.reduce<Array<{ id: string; title: string; items: NavigationMenuItem[] }>>((result, item) => {
    if (item.indent === 0) {
      result.push({ id: item.id, title: item.label, items: [] });
    } else if (item.indent === 1 && result.length > 0) {
      result[result.length - 1].items.push(item);
    }
    return result;
  }, []);
  const groupColumns = [groups.filter((_, index) => index % 3 === 0), groups.filter((_, index) => index % 3 === 1), groups.filter((_, index) => index % 3 === 2)];
  const footerLogo = settings.theme_ezitrans_footer_logo || settings.site_logo;
  const socialLinks = [
    { label: 'Facebook', url: settings.theme_ezitrans_footer_facebook },
    { label: 'YouTube', url: settings.theme_ezitrans_footer_youtube },
    { label: 'TikTok', url: settings.theme_ezitrans_footer_tiktok },
    { label: 'Instagram', url: settings.theme_ezitrans_footer_instagram },
  ].filter((item) => item.url);
  return (
    <footer id="site-footer" className="ezi-footer" style={{ background: settings.theme_ezitrans_footer_color || undefined }}>
      <div className="ezi-container ezi-footergrid">
        <div className="ezi-footer-brand-col">
          <Link href="/" className="ezi-brand" style={{ color: 'white' }}>
            {footerLogo ? <img src={footerLogo} alt={title} className="ezi-footer-logo" /> : <><span className="ezi-mark" style={{ background: 'var(--orange)' }}>E</span><span>{title}</span></>}
          </Link>
          <p>{settings.footer_about_text || 'Ezitrans là một trong những công ty hàng đầu về lĩnh vực giao nhận vận tải tại Việt Nam. Chúng tôi cung cấp đầy đủ, toàn diện các dịch vụ và giải pháp tốt nhất trong lĩnh vực logistics.'}</p>
          <div className="ezi-footer-contacts">
            <div className="ezi-footer-contact-item"><MapPin className="ezi-footer-contact-icon" size={16} /><span>{settings.footer_address || 'Address: Số 8, Ngõ 79/14 Đường Quảng Khánh, Tây Hồ, Hà Nội'}</span></div>
            <div className="ezi-footer-contact-item"><Phone className="ezi-footer-contact-icon" size={16} /><span>Hotline: {settings.footer_phone || '0868.375.300 (Zalo)'}</span></div>
            <div className="ezi-footer-contact-item"><Mail className="ezi-footer-contact-icon" size={16} /><span>Email: {settings.footer_email || 'ezitrans.vn@gmail.com'}</span></div>
            <div className="ezi-footer-contact-item"><Globe className="ezi-footer-contact-icon" size={16} /><span>Website: {settings.site_url || 'www.ezitrans.vn'}</span></div>
          </div>
        </div>
        {groupColumns.map((column, columnIndex) => (
          <div key={`footer-column-${columnIndex}`}>
            {column.map((group) => <FooterGroup key={group.id} title={group.title} items={group.items} />)}
          </div>
        ))}
      </div>
      <div className="ezi-footer-bottom">
        <div className="ezi-container ezi-footer-bottom-in">
          <span>{settings.footer_copyright || `Copyright 2020 - ${new Date().getFullYear()} ${title} Logistics JSC. All Rights Reserved.`}</span>
          {socialLinks.length > 0 && <div className="ezi-footer-socials">
            {socialLinks.map((item) => <a key={item.label} href={item.url} target="_blank" rel="noopener noreferrer" className="ezi-footer-social-link" aria-label={item.label}>{item.label.slice(0, 1)}</a>)}
          </div>}
        </div>
      </div>
    </footer>
  );
}
