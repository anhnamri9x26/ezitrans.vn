'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Mail, MapPin, MessageCircle, Send, X } from 'lucide-react';
import { buildChannelHref, parseContactWidgetConfig } from '../lib/contactWidgetConfig';
import type { ContactChannel } from '../lib/contactWidgetTypes';
import './contact-widget.css';

export function ContactChannelIcon({ channel, size = 22 }: { channel: ContactChannel; size?: number }) {
  if (channel.type === 'hotline') return <svg className="lcw-brand-svg lcw-phone-svg" viewBox="0 0 48 48" aria-hidden="true"><path d="M13.5 7.5 19 6c1.2-.3 2.4.3 2.9 1.4l3 7.1c.4 1 .1 2.1-.7 2.8l-3.3 2.8a27.3 27.3 0 0 0 7 7l2.8-3.3c.7-.8 1.8-1.1 2.8-.7l7.1 3c1.1.5 1.7 1.7 1.4 2.9l-1.5 5.5c-.4 1.5-1.8 2.5-3.3 2.5C22.7 37 11 25.3 11 10.8c0-1.5 1-2.9 2.5-3.3Z" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (channel.type === 'email') return <Mail size={size}/>;
  if (channel.type === 'map') return <MapPin size={size}/>;
  if (channel.type === 'telegram') return <Send size={size} fill="currentColor"/>;
  if (channel.type === 'zalo') return <svg className="lcw-brand-svg" viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M9 8h30a5 5 0 0 1 5 5v18a5 5 0 0 1-5 5H24l-9 6 2-6H9a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5Z"/><text x="24" y="28" textAnchor="middle" fill="var(--channel-color)" fontSize="13" fontWeight="900" fontFamily="Arial">Zalo</text></svg>;
  if (channel.type === 'facebook') return <svg className="lcw-brand-svg" viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M28.7 44V26.2h6l.9-6.9h-6.9v-4.4c0-2 .6-3.4 3.5-3.4h3.7V5.3c-.6-.1-2.9-.3-5.5-.3-5.4 0-9.1 3.3-9.1 9.4v4.9h-6.1v6.9h6.1V44h7.4Z"/></svg>;
  if (channel.type === 'messenger') return <svg className="lcw-brand-svg" viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M24 5C13.2 5 5 12.9 5 23.3c0 5.5 2.3 10.4 6.2 13.8V44l6.7-3.7c1.9.5 3.9.8 6.1.8 10.8 0 19-7.8 19-17.8S34.8 5 24 5Zm1.9 24.6-4.8-5.1-9.3 5.1L22 18.8l4.9 5.1 9.2-5.1-10.2 10.8Z"/></svg>;
  if (channel.type === 'whatsapp') return <svg className="lcw-brand-svg" viewBox="0 0 48 48" aria-hidden="true"><path d="M39.5 24A15.5 15.5 0 0 1 16 37.3L7.5 40l2.7-8.2A15.5 15.5 0 1 1 39.5 24Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 15.5c.7-.2 1.4.1 1.7.8l1.8 4.2c.2.6.1 1.2-.4 1.6l-1.8 1.6a15 15 0 0 0 6 6l1.6-1.8c.4-.5 1.1-.6 1.6-.4l4.2 1.8c.7.3 1 1 .8 1.7l-.9 3.2c-.2.8-1 1.4-1.9 1.4-9.5 0-17.3-7.8-17.3-17.3 0-.9.6-1.7 1.4-1.9l3.2-.9Z" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (channel.type === 'instagram') return <svg className="lcw-brand-svg" viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="8" width="32" height="32" rx="10" fill="none" stroke="currentColor" strokeWidth="4"/><circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" strokeWidth="4"/><circle cx="34.5" cy="13.5" r="2.5" fill="currentColor"/></svg>;
  if (channel.type === 'youtube') return <svg className="lcw-brand-svg" viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M43 15.3a5 5 0 0 0-3.5-3.5C36.4 11 24 11 24 11s-12.4 0-15.5.8A5 5 0 0 0 5 15.3 52 52 0 0 0 4.2 24 52 52 0 0 0 5 32.7a5 5 0 0 0 3.5 3.5C11.6 37 24 37 24 37s12.4 0 15.5-.8a5 5 0 0 0 3.5-3.5c.8-3.1.8-8.7.8-8.7s0-5.6-.8-8.7ZM20 30V18l10.4 6L20 30Z"/></svg>;
  if (channel.type === 'tiktok') return <svg className="lcw-brand-svg" viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M31 6c.8 4.5 3.3 7.1 7.7 7.4V20a19 19 0 0 1-7.6-2v12.2A11.2 11.2 0 1 1 21.4 19v6.7a4.7 4.7 0 1 0 3 4.4V6H31Z"/></svg>;
  return <ExternalLink size={size}/>;
}

function ChannelLink({ channel, compact = false, onNavigate }: { channel: ContactChannel; compact?: boolean; onNavigate?: () => void }) {
  const href = buildChannelHref(channel, typeof window === 'undefined' ? undefined : { title: document.title, url: window.location.href });
  return <a className={`lcw-channel ${compact ? 'is-compact' : ''} ${channel.desktopEnabled ? '' : 'lcw-hide-desktop'} ${channel.mobileEnabled ? '' : 'lcw-hide-mobile'}`} href={href} target={channel.newTab ? '_blank' : undefined} rel={channel.newTab ? 'noopener noreferrer' : undefined} aria-label={channel.label} onClick={onNavigate} style={{ '--channel-color': channel.color } as React.CSSProperties}>
    <span className="lcw-channel-icon"><ContactChannelIcon channel={channel}/></span>{!compact && <span><strong>{channel.label}</strong><small>{channel.type === 'hotline' ? channel.value : 'Nhấn để liên hệ'}</small></span>}
  </a>;
}

export default function FloatingContactButtons({ settings }: { settings: Record<string, string> }) {
  const config = parseContactWidgetConfig(settings);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const channels = config.channels.filter(channel => channel.enabled && channel.value);
  const mobileChannels = config.mobileBarChannelIds.map(id => channels.find(channel => channel.id === id)).filter((channel): channel is ContactChannel => Boolean(channel)).slice(0, 3);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    const outside = (event: MouseEvent) => panelRef.current && !panelRef.current.contains(event.target as Node) && setOpen(false);
    window.addEventListener('keydown', close); document.addEventListener('mousedown', outside);
    return () => { window.removeEventListener('keydown', close); document.removeEventListener('mousedown', outside); };
  }, [open]);

  if (!config.enabled || channels.length === 0) return null;
  const sideClass = config.position === 'left' ? 'is-left' : 'is-right';
  return <>
    <div ref={panelRef} className={`lcw-root ${sideClass} ${config.mode === 'stack' ? 'is-stack' : 'is-hub'}`} style={{ '--lcw-primary': config.primaryColor, '--lcw-desktop-offset': `${config.desktopOffset}px`, '--lcw-mobile-offset': `${config.mobileOffset}px` } as React.CSSProperties}>
      {config.mode === 'stack' ? <div className="lcw-stack">{channels.map(channel => <ChannelLink key={channel.id} channel={channel} compact/>)}</div> : <>
        <div id="lcw-panel" className={`lcw-panel ${open ? 'is-open' : ''}`} aria-hidden={!open}>
          <div className="lcw-panel-head"><div><strong>{config.panelTitle}</strong><p>{config.panelSubtitle}</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Đóng bảng liên hệ"><X size={19}/></button></div>
          <div className="lcw-channel-list">{channels.map(channel => <ChannelLink key={channel.id} channel={channel} onNavigate={() => setOpen(false)}/>)}</div>
        </div>
        <button className="lcw-trigger" type="button" aria-expanded={open} aria-controls="lcw-panel" aria-label={open ? 'Đóng bảng liên hệ' : 'Mở bảng liên hệ'} onClick={() => setOpen(value => !value)}>{open ? <X size={23}/> : <MessageCircle size={23}/>}<span>{config.hubLabel}</span></button>
      </>}
    </div>
    {config.showMobileBar && mobileChannels.length > 0 && <nav className="lcw-mobile-bar" aria-label="Liên hệ nhanh">{mobileChannels.map(channel => <ChannelLink key={channel.id} channel={channel}/>)}</nav>}
  </>;
}
