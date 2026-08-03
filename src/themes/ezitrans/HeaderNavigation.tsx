'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, Search, X, CreditCard, Phone } from 'lucide-react';
import type { NavigationMenuTreeItem } from '@/lib/navigation/menuTree';

export default function HeaderNavigation({ menu, settings }: { menu: NavigationMenuTreeItem[]; settings: Record<string, string> }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileBankOpen, setMobileBankOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    const close = (event: KeyboardEvent) => event.key === 'Escape' && (setMobileOpen(false), setSearchOpen(false));
    window.addEventListener('keydown', close);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', close); };
  }, [mobileOpen]);

  return <>
    <nav className="ezi-menu" aria-label="Điều hướng chính">{menu.map(item => {
      const hasChildren = item.children.length > 0;
      return <div key={item.id} className={`ezi-menu-item${hasChildren?' ezi-menu-item-has-children':''}${item.isMega?' ezi-menu-item-mega':''}`}>
        <Link href={item.url || '#'} className="ezi-menu-trigger"><span>{item.label}</span>{hasChildren&&<ChevronDown size={13}/>}</Link>
        {hasChildren&&<div className={item.isMega?'ezi-mega-menu':'ezi-dropdown'}>{item.children.map(child=><div key={child.id} className={item.isMega?'ezi-mega-column':'ezi-dropdown-group'}><Link href={child.url||'#'} className={item.isMega?'ezi-mega-heading':'ezi-dropdown-link'}>{child.label}</Link>{child.children.length>0&&<div className={item.isMega?'ezi-mega-links':'ezi-dropdown-nested'}>{child.children.map(grand=><Link key={grand.id} href={grand.url||'#'}>{grand.label}</Link>)}</div>}</div>)}</div>}
      </div>})}</nav>
    <div className="ezi-header-tools">
      <button id="header-search-toggle" className="ezi-icon-button" aria-label="Tìm kiếm" aria-expanded={searchOpen} onClick={()=>setSearchOpen(value=>!value)}><Search size={18}/></button>
      <button id="mobile-menu-toggle" className="ezi-icon-button ezi-mobile-toggle" aria-label="Mở menu" aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={()=>setMobileOpen(true)}><Menu size={21}/></button>
    </div>
    {searchOpen&&<div className="ezi-header-popover ezi-search-popover"><form action="/tim-kiem" method="get" role="search"><label htmlFor="header-search-query" className="ezi-sr-only">Từ khóa tìm kiếm</label><Search size={17}/><input id="header-search-query" name="q" autoFocus placeholder="Tìm kiếm bài viết..." maxLength={120}/><button type="submit">Tìm</button></form></div>}
    <div className={`ezi-mobile-overlay ${mobileOpen?'is-open':''}`} onClick={()=>setMobileOpen(false)} />
    <aside id="mobile-navigation" className={`ezi-mobile-drawer ${mobileOpen?'is-open':''}`} aria-hidden={!mobileOpen}>
      <div className="ezi-mobile-head"><strong>Danh mục Ezitrans</strong><button id="mobile-menu-close" className="ezi-icon-button" onClick={()=>setMobileOpen(false)} aria-label="Đóng menu"><X size={21}/></button></div>
      <div className="ezi-mobile-scroll"><form action="/tim-kiem" method="get" className="ezi-mobile-search"><Search size={17}/><input name="q" placeholder="Tìm kiếm..." aria-label="Từ khóa tìm kiếm"/><button type="submit">Tìm</button></form>
        <div className="ezi-mobile-bank"><button id="mobile-bank-toggle" type="button" aria-expanded={mobileBankOpen} aria-controls="mobile-bank-panel" onClick={()=>setMobileBankOpen(value=>!value)}><span><CreditCard size={17}/> Thông tin CK</span><ChevronDown className={mobileBankOpen?'is-rotated':''} size={17}/></button><div id="mobile-bank-panel" className={`ezi-mobile-bank-panel ${mobileBankOpen?'is-open':''}`}><div className="ezi-bank-card"><strong>Techcombank</strong><span>Nguyễn Thanh Hoa</span><b>19035085503031</b></div><div className="ezi-bank-card"><strong>Vietcombank</strong><span>Nguyễn Thanh Hoa</span><b>0941000019297</b></div></div></div>
        <nav aria-label="Điều hướng mobile" className="ezi-mobile-menu">{menu.map(item=><div key={item.id} className="ezi-mobile-menu-group"><div className="ezi-mobile-menu-row"><Link href={item.url||'#'} onClick={()=>!item.children.length&&setMobileOpen(false)}>{item.label}</Link>{item.children.length>0&&<button type="button" aria-label={`Mở mục ${item.label}`} aria-expanded={!!expanded[item.id]} onClick={()=>setExpanded(value=>({...value,[item.id]:!value[item.id]}))}><ChevronDown className={expanded[item.id]?'is-rotated':''} size={17}/></button>}</div>{item.children.length>0&&<div className={`ezi-mobile-submenu ${expanded[item.id]?'is-open':''}`}>{item.children.map(child=><div key={child.id}><Link href={child.url||'#'} onClick={()=>setMobileOpen(false)}>{child.label}</Link>{child.children.map(grand=><Link key={grand.id} className="ezi-mobile-grandchild" href={grand.url||'#'} onClick={()=>setMobileOpen(false)}>{grand.label}</Link>)}</div>)}</div>}</div>)}</nav>
      </div>
      <a className="ezi-mobile-call" href={`tel:${(settings.contact_hotline_1||settings.footer_phone||'0868375300').replace(/[^0-9+]/g,'')}`}><Phone size={17}/> Gọi tư vấn ngay</a>
    </aside>
  </>;
}
