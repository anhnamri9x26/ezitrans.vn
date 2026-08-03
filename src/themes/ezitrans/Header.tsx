'use client';

import Link from 'next/link';
import { Send } from 'lucide-react';
import './ezitrans.css';
import { getMenuItemsForLocation } from '@/lib/navigation/client';
import { buildMenuTree } from '@/lib/navigation/menuTree';
import HeaderNavigation from './HeaderNavigation';
import BankTransferMenu from './BankTransferMenu';
import { useThemeCustomizer } from '@/hooks/useThemeCustomizer';

const fallbackUtility = [
  { id: 'utility-guide', label: 'Hướng dẫn mua hàng', url: '/huong-dan-mua-hang', indent: 0 },
  { id: 'utility-bank', label: 'Thông tin chuyển khoản', url: '#thong-tin-chuyen-khoan', indent: 0 },
  { id: 'utility-faq', label: 'Câu hỏi thường gặp', url: '/cau-hoi-thuong-gap', indent: 0 },
  { id: 'utility-contact', label: 'Liên hệ', url: '/lien-he', indent: 0 },
];

const fallbackPrimary = [
  { id: 'home', label: 'Trang chủ', url: '/', indent: 0 },
  { id: 'about', label: 'Giới thiệu', url: '/gioi-thieu', indent: 0 },
  { id: 'buy', label: 'Mua hộ', url: '/category/mua-ho-thanh-toan-ho', indent: 0, isMega: true },
  { id: 'buy-asia', label: 'Khu vực Châu Á', url: '/category/mua-ho-thanh-toan-ho', indent: 1 },
  { id: 'buy-cn', label: 'Mua hộ hàng Trung Quốc', url: '/mua-ho-hang-trung-quoc.html', indent: 2 },
  { id: 'buy-jp', label: 'Mua hộ hàng Nhật Bản', url: '/mua-ho-hang-nhat-ban.html', indent: 2 },
  { id: 'buy-kr', label: 'Mua hộ hàng Hàn Quốc', url: '/mua-ho-hang-han-quoc.html', indent: 2 },
  { id: 'buy-west', label: 'Âu - Mỹ - Úc', url: '/category/mua-ho-thanh-toan-ho', indent: 1 },
  { id: 'buy-us', label: 'Mua hộ hàng Mỹ', url: '/mua-ho-hang-my.html', indent: 2 },
  { id: 'buy-ru', label: 'Mua hộ hàng Nga', url: '/mua-ho-hang-nga.html', indent: 2 },
  { id: 'buy-au', label: 'Mua hộ hàng Úc', url: '/mua-ho-hang-uc.html', indent: 2 },
  { id: 'ship', label: 'Ship hộ', url: '/category/chuyen-hang-tu-nuoc-ngoai-ve', indent: 0, isMega: true },
  { id: 'ship-asia', label: 'Vận chuyển Châu Á', url: '/category/chuyen-hang-tu-nuoc-ngoai-ve', indent: 1 },
  { id: 'ship-cn', label: 'Ship hàng Trung Quốc', url: '/van-chuyen-hang-trung-quoc-ve-viet-nam.html', indent: 2 },
  { id: 'ship-jp', label: 'Ship hàng Nhật Bản', url: '/van-chuyen-hang-nhat-ban-ve-viet-nam.html', indent: 2 },
  { id: 'ship-west', label: 'Vận chuyển Âu - Mỹ', url: '/category/chuyen-hang-tu-nuoc-ngoai-ve', indent: 1 },
  { id: 'ship-us', label: 'Ship hàng Mỹ', url: '/van-chuyen-hang-my-ve-viet-nam.html', indent: 2 },
  { id: 'ship-ru', label: 'Ship hàng Nga', url: '/van-chuyen-hang-nga-ve-viet-nam.html', indent: 2 },
  { id: 'export', label: 'Xuất khẩu', url: '/category/xuat-khau', indent: 0 },
  { id: 'service', label: 'Dịch vụ khác', url: '/category/dich-vu-khac', indent: 0 },
  { id: 'blog', label: 'Chia sẻ kinh nghiệm', url: '/category/huong-dan-chia-se', indent: 0 },
];

export default function Header({ settings = {} }: { settings?: Record<string, string> }) {
  const liveSettings = useThemeCustomizer(settings);
  const title = liveSettings.site_title || 'Website';
  const logo = liveSettings.site_logo;
  const showUtility = liveSettings.theme_ezitrans_header_show_utility !== 'false';
  const showCta = liveSettings.theme_ezitrans_header_cta_enabled !== 'false';
  const sticky = liveSettings.theme_ezitrans_header_sticky !== 'false';
  const ctaLabel = liveSettings.theme_ezitrans_header_cta_label || 'Gửi báo giá';
  const ctaUrl = liveSettings.theme_ezitrans_header_cta_url || '/lien-he';
  const utilityItems = getMenuItemsForLocation(liveSettings, 'header-utility');
  const primaryItems = getMenuItemsForLocation(liveSettings, 'header-primary');
  const mobileItems = getMenuItemsForLocation(liveSettings, 'mobile-primary');
  const utilityMenu = utilityItems.length > 0 ? utilityItems : fallbackUtility;
  const primaryTree = buildMenuTree(primaryItems.length > 0 ? primaryItems : fallbackPrimary);
  const mobileTree = buildMenuTree(mobileItems.length > 0 ? mobileItems : (primaryItems.length > 0 ? primaryItems : fallbackPrimary));

  return <>
    {showUtility && <div className="ezi-top"><div className="ezi-container ezi-topin"><div className="ezi-toplinks">
      {utilityMenu.filter(item => item.indent === 0 && item.id !== 'utility-bank' && !item.label.toLowerCase().includes('chuyển khoản')).map(item => <Link key={item.id} href={item.url}>{item.label}</Link>)}
      <BankTransferMenu />
    </div></div></div>}
    <header id="site-header" className={`ezi-nav ${sticky ? '' : 'ezi-nav-static'}`}><div className="ezi-container ezi-navin">
      <Link href="/" className="ezi-brand" aria-label={`${title} - Trang chủ`}>{logo ? <img src={logo} alt={title} className="ezi-brand-logo" /> : <><span className="ezi-mark">E</span><span>{title}</span></>}</Link>
      <HeaderNavigation menu={primaryTree} mobileMenu={mobileTree} settings={liveSettings} />
      {showCta && <div className="ezi-nav-actions"><Link href={ctaUrl} className="ezi-btn ezi-btn-primary"><Send size={14}/> {ctaLabel}</Link></div>}
    </div></header>
  </>;
}
