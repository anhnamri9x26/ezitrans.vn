"use client";

import React, { useState } from 'react';
import { Phone, MapPin, ExternalLink, MessageCircle, Send } from 'lucide-react';

interface FloatingContactButtonsProps {
  settings: { [key: string]: string };
}

export default function FloatingContactButtons({ settings }: FloatingContactButtonsProps) {
  const [showHotlineList, setShowHotlineList] = useState(false);

  // Read settings
  const hl1 = settings.contact_hotline_1 || '';
  const hl1Color = settings.contact_hotline_1_color || '#ef4444';
  const hl2 = settings.contact_hotline_2 || '';
  const hl2Color = settings.contact_hotline_2_color || '#ef4444';
  const hl3 = settings.contact_hotline_3 || '';
  const hl3Color = settings.contact_hotline_3_color || '#ef4444';
  const showHotlineBar = settings.contact_hotline_bar === 'true';

  const zalo = settings.contact_zalo || '';
  const telegram = settings.contact_telegram || '';
  const instagram = settings.contact_instagram || '';
  const youtube = settings.contact_youtube || '';
  const tiktok = settings.contact_tiktok || '';
  const facebook = settings.contact_facebook || '';
  const messenger = settings.contact_messenger || '';
  const whatsapp = settings.contact_whatsapp || '';
  const viber = settings.contact_viber || '';
  const map = settings.contact_map || '';
  const mapColor = settings.contact_map_color || '#10b981';
  const contactLink = settings.contact_link || '';
  const contactLinkColor = settings.contact_link_color || '#3b82f6';

  // Format URLs helper
  const getZaloUrl = (val: string) => {
    if (!val) return '';
    const clean = val.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    if (clean.length > 5 && !val.includes('http')) {
      return `https://zalo.me/${clean}`;
    }
    return val;
  };

  const getWhatsappUrl = (val: string) => {
    if (!val) return '';
    const clean = val.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    return `https://wa.me/${clean}`;
  };

  const getViberUrl = (val: string) => {
    if (!val) return '';
    const clean = val.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    return `viber://chat?number=%2B${clean}`;
  };

  const activeHotlines = [
    { number: hl1, color: hl1Color, label: 'Hotline 1' },
    { number: hl2, color: hl2Color, label: 'Hotline 2' },
    { number: hl3, color: hl3Color, label: 'Hotline 3' }
  ].filter(h => h.number !== '');

  const hasMultipleHotlines = activeHotlines.length > 1;

  const hasAnyContact = activeHotlines.length > 0 || zalo || telegram || instagram || youtube || tiktok || facebook || messenger || whatsapp || viber || map || contactLink;
  if (!hasAnyContact) return null;

  // Compile pure, high-performance hardware-accelerated CSS
  const dynamicStyles = `
    .floating-contact-container {
      padding: 16px !important; /* Extremely safe breathing room for box-shadows */
      overflow: visible !important;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    
    .floating-contact-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      border-radius: 9999px;
      color: white;
      cursor: pointer;
      transition: transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1) !important;
      overflow: visible !important;
      z-index: 10;
    }
    
    .floating-contact-btn:hover {
      transform: translateY(-4px) scale(1.07) !important;
      z-index: 20;
    }
    
    /* Viber */
    .btn-viber {
      background-color: #7360f2 !important;
      box-shadow: 0 0 0 5px rgba(115, 96, 242, 0.18) !important;
    }
    .btn-viber:hover {
      box-shadow: 0 0 0 8px rgba(115, 96, 242, 0.35) !important;
    }
    
    /* Whatsapp */
    .btn-whatsapp {
      background-color: #25d366 !important;
      box-shadow: 0 0 0 5px rgba(37, 211, 102, 0.18) !important;
    }
    .btn-whatsapp:hover {
      box-shadow: 0 0 0 8px rgba(37, 211, 102, 0.35) !important;
    }
    
    /* Telegram */
    .btn-telegram {
      background-color: #0088cc !important;
      box-shadow: 0 0 0 5px rgba(0, 136, 204, 0.18) !important;
    }
    .btn-telegram:hover {
      box-shadow: 0 0 0 8px rgba(0, 136, 204, 0.35) !important;
    }
    
    /* Messenger */
    .btn-messenger {
      box-shadow: 0 0 0 5px rgba(168, 85, 247, 0.18) !important;
    }
    .btn-messenger:hover {
      box-shadow: 0 0 0 8px rgba(168, 85, 247, 0.35) !important;
    }
    
    /* Zalo */
    .btn-zalo {
      background-color: #0068ff !important;
      box-shadow: 0 0 0 5px rgba(0, 104, 255, 0.18) !important;
    }
    .btn-zalo:hover {
      box-shadow: 0 0 0 8px rgba(0, 104, 255, 0.35) !important;
    }
    
    /* Google Map */
    .btn-map {
      background-color: ${mapColor} !important;
      box-shadow: 0 0 0 5px ${mapColor}26 !important;
    }
    .btn-map:hover {
      box-shadow: 0 0 0 8px ${mapColor}4D !important;
    }
    
    /* Custom Link */
    .btn-link {
      background-color: ${contactLinkColor} !important;
      box-shadow: 0 0 0 5px ${contactLinkColor}26 !important;
    }
    .btn-link:hover {
      box-shadow: 0 0 0 8px ${contactLinkColor}4D !important;
    }
    
    /* Hotline */
    .btn-hotline {
      background-color: ${activeHotlines[0]?.color || hl1Color} !important;
      box-shadow: 0 0 0 5px ${(activeHotlines[0]?.color || hl1Color)}26 !important;
    }
    .btn-hotline:hover {
      box-shadow: 0 0 0 8px ${(activeHotlines[0]?.color || hl1Color)}4D !important;
    }
  `;

  return (
    <>
      {/* Native CSS Injection */}
      <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />

      {/* Floating Action Buttons Container */}
      <div className="fixed right-6 bottom-24 sm:bottom-6 z-50 floating-contact-container font-sans">
        
        {/* Hotline Dropdown Menu */}
        {hasMultipleHotlines && showHotlineList && (
          <div className="absolute bottom-16 right-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-4 min-w-[200px] flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 z-50">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 mb-0.5">Danh sách Hotline</span>
            {activeHotlines.map((h, i) => (
              <a
                key={i}
                href={`tel:${h.number.replace(/\./g, '').replace(/\s+/g, '')}`}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 rounded-xl transition-all group shrink-0"
              >
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: h.color }}
                >
                  <Phone size={12} className="group-hover:animate-bounce" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 block">{h.label}</span>
                  <span className="text-xs font-bold text-slate-800 tracking-tight block">{h.number}</span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Viber */}
        {viber && (
          <a
            href={getViberUrl(viber)}
            target="_blank"
            rel="noopener noreferrer"
            className="group floating-contact-btn btn-viber"
          >
            {/* Viber Slanted Phone & Soundwaves Clean SVG */}
            <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-none stroke-current shrink-0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              <path d="M14.05 2a9 9 0 0 1 8 8" strokeWidth="2" />
              <path d="M14.05 5a6 6 0 0 1 5 5" strokeWidth="2" />
            </svg>
            <span className="absolute right-14 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-sm whitespace-nowrap z-50">Viber</span>
          </a>
        )}

        {/* Whatsapp */}
        {whatsapp && (
          <a
            href={getWhatsappUrl(whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="group floating-contact-btn btn-whatsapp"
          >
            {/* Whatsapp Premium SVG */}
            <svg viewBox="0 0 24 24" className="w-6.5 h-6.5 fill-white shrink-0">
              <path d="M12.012 2c-5.508 0-9.984 4.476-9.984 9.984 0 1.764.456 3.48 1.332 5.004l-1.416 5.172 5.292-1.392c1.476.804 3.132 1.224 4.776 1.224 5.508 0 9.984-4.476 9.984-9.984 0-5.508-4.476-9.984-9.984-9.984Zm6.036 14.124c-.252.708-1.464 1.296-2.004 1.344-.492.048-1.128.072-3.18-.78-2.628-1.092-4.296-3.756-4.428-3.936-.132-.18-.984-1.308-.984-2.496 0-1.188.624-1.776.84-2.016.216-.24.48-.3.636-.3.156 0 .312 0 .444.012.144.004.336-.052.528.408.192.468.66 1.608.72 1.728.06.12.096.264.012.432-.084.168-.132.276-.264.432-.132.156-.276.348-.396.468-.132.132-.276.276-.12.54.156.264.7 1.152 1.5 1.86.132.12.264.24.408.348.912.78 1.488.984 1.776 1.044.288.06.456.012.624-.18.168-.192.732-.852.924-1.14.192-.288.384-.24.648-.144.264.096 1.68.792 1.968.936.288.144.48.216.552.336.072.132.072.768-.18 1.476Z"/>
            </svg>
            <span className="absolute right-14 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-sm whitespace-nowrap z-50">Whatsapp</span>
          </a>
        )}

        {/* Telegram */}
        {telegram && (
          <a
            href={telegram.includes('http') ? telegram : `https://t.me/${telegram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group floating-contact-btn btn-telegram"
          >
            <Send size={18} className="fill-white stroke-none relative right-0.5 shrink-0" />
            <span className="absolute right-14 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-sm whitespace-nowrap z-50">Telegram</span>
          </a>
        )}

        {/* Messenger */}
        {messenger && (
          <a
            href={messenger.includes('http') ? messenger : `https://m.me/${messenger}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group floating-contact-btn btn-messenger"
          >
            {/* Styled Gradient Container to support standard gradients */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 z-0" />
            {/* Messenger SVG */}
            <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current shrink-0 relative z-10"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.9 1.18 5.37 3.12 7.06a.78.78 0 0 1 .25.59l-.04 2.14a.78.78 0 0 0 1.13.7l2.36-1.3a.85.85 0 0 1 .74-.08c.78.22 1.62.35 2.44.35 5.64 0 10-4.13 10-9.66C22 6.13 17.64 2 12 2Zm4.83 8.52-2.73 4.35a.86.86 0 0 1-1.25.26l-2.22-1.66a.43.43 0 0 0-.52 0l-2.88 2.2a.37.37 0 0 1-.57-.42l2.73-4.35a.86.86 0 0 1 1.25-.26l2.22 1.66a.43.43 0 0 0 .52 0l2.88-2.2a.37.37 0 0 1 .57.42Z"/></svg>
            <span className="absolute right-14 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-sm whitespace-nowrap z-50">Facebook Messenger</span>
          </a>
        )}

        {/* Zalo */}
        {zalo && (
          <a
            href={getZaloUrl(zalo)}
            target="_blank"
            rel="noopener noreferrer"
            className="group floating-contact-btn btn-zalo"
          >
            <img 
              src="https://page.widget.zalo.me/static/images/2.0/Logo.svg" 
              alt="Zalo Logo" 
              className="w-8.5 h-8.5 shrink-0 select-none drop-shadow-sm"
              draggable="false"
            />
            <span className="absolute right-14 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-sm whitespace-nowrap z-50">Chat Zalo</span>
          </a>
        )}

        {/* Google Map */}
        {map && (
          <a
            href={map}
            target="_blank"
            rel="noopener noreferrer"
            className="group floating-contact-btn btn-map"
          >
            <MapPin size={18} className="shrink-0" />
            <span className="absolute right-14 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-sm whitespace-nowrap z-50">Bản đồ</span>
          </a>
        )}

        {/* Contact Page Link */}
        {contactLink && (
          <a
            href={contactLink}
            className="group floating-contact-btn btn-link"
          >
            <ExternalLink size={18} className="shrink-0" />
            <span className="absolute right-14 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-sm whitespace-nowrap z-50">Liên hệ</span>
          </a>
        )}

        {/* Main Hotline Call Button */}
        {activeHotlines.length > 0 && (
          <div className="relative shrink-0 select-none">
            {/* Ripple Pulse Rings */}
            <div 
              className="absolute -inset-2.5 rounded-full opacity-35 animate-ping z-0 pointer-events-none"
              style={{ 
                backgroundColor: activeHotlines[0].color,
                animationDuration: '1.8s'
              }}
            />
            
            <button
              onClick={() => {
                if (hasMultipleHotlines) {
                  setShowHotlineList(prev => !prev);
                } else {
                  window.location.href = `tel:${activeHotlines[0].number.replace(/\./g, '').replace(/\s+/g, '')}`;
                }
              }}
              className="relative z-10 floating-contact-btn btn-hotline active:scale-95 cursor-pointer focus:outline-none"
            >
              <Phone size={18} className="animate-bounce stroke-[2.2]" />
            </button>
            
            <span className="absolute right-14 top-2.5 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-sm whitespace-nowrap z-50">
              {hasMultipleHotlines ? 'Hotline liên hệ' : `Gọi ngay: ${activeHotlines[0].number}`}
            </span>
          </div>
        )}
      </div>

      {/* Sticky Hotline Bar on Mobile */}
      {showHotlineBar && activeHotlines.length > 0 && (
        <div 
          className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex justify-around p-2.5 shadow-2xl font-sans"
          style={{ contentVisibility: 'auto' }}
        >
          {activeHotlines.slice(0, 3).map((h, i) => (
            <a
              key={i}
              href={`tel:${h.number.replace(/\./g, '').replace(/\s+/g, '')}`}
              className="flex-1 flex flex-col items-center justify-center py-1.5 hover:bg-slate-50 transition-colors rounded-xl shrink-0"
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 mb-0.5 shadow-sm"
                style={{ backgroundColor: h.color }}
              >
                <Phone size={14} className="animate-pulse" />
              </div>
              <span className="text-[9px] font-extrabold text-slate-800 tracking-tight block mt-0.5">{h.number}</span>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
