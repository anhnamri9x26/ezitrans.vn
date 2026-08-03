'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Mail, MapPin, MessageCircle, Phone, Send, X } from 'lucide-react';
import { buildChannelHref, parseContactWidgetConfig } from '../lib/contactWidgetConfig';
import type { ContactChannel } from '../lib/contactWidgetTypes';
import './contact-widget.css';

const iconFor = (channel: ContactChannel) => {
  if (channel.type === 'hotline') return <Phone size={20}/>;
  if (channel.type === 'email') return <Mail size={20}/>;
  if (channel.type === 'map') return <MapPin size={20}/>;
  if (channel.type === 'telegram') return <Send size={20}/>;
  if (channel.type === 'zalo') return <strong className="lcw-zalo">Zalo</strong>;
  if (channel.type === 'facebook') return <strong>f</strong>;
  if (channel.type === 'instagram') return <strong>◎</strong>;
  if (channel.type === 'youtube') return <strong>▶</strong>;
  if (channel.type === 'tiktok') return <strong>♪</strong>;
  if (channel.type === 'whatsapp') return <strong>☎</strong>;
  return channel.type === 'custom' ? <ExternalLink size={20}/> : <MessageCircle size={20}/>;
};

function ChannelLink({ channel, compact = false, onNavigate }: { channel: ContactChannel; compact?: boolean; onNavigate?: () => void }) {
  const href = buildChannelHref(channel, typeof window === 'undefined' ? undefined : { title: document.title, url: window.location.href });
  return <a className={`lcw-channel ${compact ? 'is-compact' : ''} ${channel.desktopEnabled ? '' : 'lcw-hide-desktop'} ${channel.mobileEnabled ? '' : 'lcw-hide-mobile'}`} href={href} target={channel.newTab ? '_blank' : undefined} rel={channel.newTab ? 'noopener noreferrer' : undefined} aria-label={channel.label} onClick={onNavigate} style={{ '--channel-color': channel.color } as React.CSSProperties}>
    <span className="lcw-channel-icon">{iconFor(channel)}</span>{!compact && <span><strong>{channel.label}</strong><small>{channel.type === 'hotline' ? channel.value : 'Nhấn để liên hệ'}</small></span>}
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
