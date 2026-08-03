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
  { id: 'utility-guide', label: 'HÆ°á»›ng dáº«n mua hÃ ng', url: '/huong-dan-mua-hang', indent: 0 },
  { id: 'utility-bank', label: 'ThÃ´ng tin chuyá»ƒn khoáº£n', url: '#thong-tin-chuyen-khoan', indent: 0 },
  { id: 'utility-faq', label: 'CÃ¢u há»i thÆ°á»ng gáº·p', url: '/cau-hoi-thuong-gap', indent: 0 },
  { id: 'utility-contact', label: 'LiÃªn há»‡', url: '/lien-he', indent: 0 },
];

const fallbackPrimary = [
  { id: 'home', label: 'Trang chá»§', url: '/', indent: 0 },
  { id: 'about', label: 'Giá»›i thiá»‡u', url: '/gioi-thieu', indent: 0 },
  { id: 'buy', label: 'Mua há»™', url: '/category/mua-ho-thanh-toan-ho', indent: 0, isMega: true },
  { id: 'buy-asia', label: 'Khu vá»±c ChÃ¢u Ã', url: '/category/mua-ho-thanh-toan-ho', indent: 1 },
  { id: 'buy-cn', label: 'Mua há»™ hÃ ng Trung Quá»‘c', url: '/mua-ho-hang-trung-quoc.html', indent: 2 },
  { id: 'buy-jp', label: 'Mua há»™ hÃ ng Nháº­t Báº£n', url: '/mua-ho-hang-nhat-ban.html', indent: 2 },
  { id: 'buy-kr', label: 'Mua há»™ hÃ ng HÃ n Quá»‘c', url: '/mua-ho-hang-han-quoc.html', indent: 2 },
  { id: 'buy-west', label: 'Ã‚u - Má»¹ - Ãšc', url: '/category/mua-ho-thanh-toan-ho', indent: 1 },
  { id: 'buy-us', label: 'Mua há»™ hÃ ng Má»¹', url: '/mua-ho-hang-my.html', indent: 2 },
  { id: 'buy-ru', label: 'Mua há»™ hÃ ng Nga', url: '/mua-ho-hang-nga.html', indent: 2 },
  { id: 'buy-au', label: 'Mua há»™ hÃ ng Ãšc', url: '/mua-ho-hang-uc.html', indent: 2 },
  { id: 'ship', label: 'Ship há»™', url: '/category/chuyen-hang-tu-nuoc-ngoai-ve', indent: 0, isMega: true },
  { id: 'ship-asia', label: 'Váº­n chuyá»ƒn ChÃ¢u Ã', url: '/category/chuyen-hang-tu-nuoc-ngoai-ve', indent: 1 },
  { id: 'ship-cn', label: 'Ship hÃ ng Trung Quá»‘c', url: '/van-chuyen-hang-trung-quoc-ve-viet-nam.html', indent: 2 },
  { id: 'ship-jp', label: 'Ship hÃ ng Nháº­t Báº£n', url: '/van-chuyen-hang-nhat-ban-ve-viet-nam.html', indent: 2 },
  { id: 'ship-west', label: 'Váº­n chuyá»ƒn Ã‚u - Má»¹', url: '/category/chuyen-hang-tu-nuoc-ngoai-ve', indent: 1 },
  { id: 'ship-us', label: 'Ship hÃ ng Má»¹', url: '/van-chuyen-hang-my-ve-viet-nam.html', indent: 2 },
  { id: 'ship-ru', label: 'Ship hÃ ng Nga', url: '/van-chuyen-hang-nga-ve-viet-nam.html', indent: 2 },
  { id: 'export', label: 'Xuáº¥t kháº©u', url: '/category/xuat-khau', indent: 0 },
  { id: 'service', label: 'Dá»‹ch vá»¥ khÃ¡c', url: '/category/dich-vu-khac', indent: 0 },
  { id: 'blog', label: 'Chia sáº» kinh nghiá»‡m', url: '/category/huong-dan-chia-se', indent: 0 },
];

export default function Header({ settings = {} }: { settings?: Record<string, string> }) {
  const liveSettings = useThemeCustomizer(settings);
  const title = liveSettings.site_title || 'Ezitrans';
  const logo = liveSettings.site_logo;
  const showUtility = liveSettings.theme_ezitrans_header_show_utility !== 'false';
  const showCta = liveSettings.theme_ezitrans_header_cta_enabled !== 'false';
  const sticky = liveSettings.theme_ezitrans_header_sticky !== 'false';
  const ctaLabel = liveSettings.theme_ezitrans_header_cta_label || 'Gửi báo giá';
  const ctaUrl = liveSettings.theme_ezitrans_header_cta_url || '/lien-he';
  const utilityItems = getMenuItemsForLocation(liveSettings, 'header-utility');
  const primaryItems = getMenuItemsForLocation(liveSettings, 'header-primary');
  const utilityMenu = utilityItems.length > 0 ? utilityItems : fallbackUtility;
  const primaryTree = buildMenuTree(primaryItems.length > 0 ? primaryItems : fallbackPrimary);

  return <>
    {showUtility && <div className="ezi-top"><div className="ezi-container ezi-topin"><div className="ezi-toplinks">
      {utilityMenu.filter(item => item.indent === 0 && item.id !== 'utility-bank' && !item.label.toLowerCase().includes('chuyá»ƒn khoáº£n')).map(item => <Link key={item.id} href={item.url}>{item.label}</Link>)}
      <BankTransferMenu />
    </div></div></div>}
    <header id="site-header" className={`ezi-nav ${sticky ? '' : 'ezi-nav-static'}`}><div className="ezi-container ezi-navin">
      <Link href="/" className="ezi-brand" aria-label={`${title} - Trang chá»§`}>{logo ? <img src={logo} alt={title} className="ezi-brand-logo" /> : <><span className="ezi-mark">E</span><span>{title}</span></>}</Link>
      <HeaderNavigation menu={primaryTree} settings={liveSettings} />
      {showCta && <div className="ezi-nav-actions"><Link href={ctaUrl} className="ezi-btn ezi-btn-primary"><Send size={14}/> {ctaLabel}</Link></div>}
    </div></header>
  </>;
}
