import Link from 'next/link';
import { Mail, MapPin, Phone, Sparkles } from 'lucide-react';
import { getMenuItemsForLocation } from '@/lib/navigation/client';
import './starter.css';
export default function Footer({settings={}}:{settings?:Record<string,string>}){
 const title=settings.site_title||'Website',logo=settings.site_logo;
 const email=settings.site_email||settings.footer_email||'',phone=settings.site_phone||settings.footer_phone||'',address=settings.site_address||settings.footer_address||'';
 const links=getMenuItemsForLocation(settings,'footer-primary').filter(item=>item.indent===0).slice(0,7);
 return <footer className="starter-footer"><div className="starter-container"><div className="starter-footer-grid">
  <div><Link href="/" className="starter-brand" style={{color:'#fff'}}>{logo?<img className="starter-logo" src={logo} alt={title}/>:<><span className="starter-mark"><Sparkles size={19}/></span>{title}</>}</Link>{settings.footer_about_text&&<p>{settings.footer_about_text}</p>}</div>
  {links.length>0&&<div><h3>Khám phá</h3><div className="starter-footer-links">{links.map(item=><Link key={item.id} href={item.url}>{item.label}</Link>)}</div></div>}
  {(email||phone||address)&&<div><h3>Liên hệ</h3><div className="starter-footer-contact">{address&&<span><MapPin size={16}/>{address}</span>}{phone&&<a href={`tel:${phone.replace(/[^\d+]/g,'')}`}><Phone size={16}/>{phone}</a>}{email&&<a href={`mailto:${email}`}><Mail size={16}/>{email}</a>}</div></div>}
 </div><div className="starter-footer-bottom">{settings.footer_copyright||`© ${new Date().getFullYear()} ${title}. All rights reserved.`}</div></div></footer>
}
