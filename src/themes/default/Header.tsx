'use client';
import Link from 'next/link';
import { Menu, Sparkles } from 'lucide-react';
import { getMenuItemsForLocation } from '@/lib/navigation/client';
import { useThemeCustomizer } from '@/hooks/useThemeCustomizer';
import './starter.css';
export default function Header({settings={}}:{settings?:Record<string,string>}){
 const live=useThemeCustomizer(settings),title=live.site_title||'Website',logo=live.site_logo;
 const primary=live.theme_default_primary_color||'#6d5dfc',accent=live.theme_default_accent_color||'#1bc5bd';
 const menu=getMenuItemsForLocation(live,'header-primary').filter(item=>item.indent===0);
 const ctaLabel=live.theme_default_header_cta_label||'',ctaUrl=live.theme_default_header_cta_url||'/lien-he';
 return <header id="site-header" className="starter-header" style={{'--starter-primary':primary,'--starter-accent':accent} as React.CSSProperties}><div className="starter-container starter-nav">
  <Link href="/" className="starter-brand">{logo?<img className="starter-logo" src={logo} alt={title}/>:<><span className="starter-mark"><Sparkles size={19}/></span><span>{title}</span></>}</Link>
  <nav className="starter-menu" aria-label="Điều hướng chính">{menu.map(item=><Link key={item.id} href={item.url}>{item.label}</Link>)}</nav>
  {ctaLabel&&<Link className="starter-cta" href={ctaUrl}>{ctaLabel}</Link>}
  <button className="starter-mobile-toggle" aria-label="Mở menu"><Menu size={20}/></button>
 </div></header>
}
