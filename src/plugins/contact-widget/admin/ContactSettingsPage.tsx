"use client";

import React, { useState, useEffect } from 'react';
import { Save, MessageSquare, Phone, Send, Info, Eye, ExternalLink, Globe, MapPin, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export function ContactSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPluginActive, setIsPluginActive] = useState(true);
  const [activeTab, setActiveTab] = useState<'hotline' | 'socials' | 'facebook' | 'others'>('hotline');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // hotline state
  const [contactHotline1, setContactHotline1] = useState('');
  const [contactHotline1Color, setContactHotline1Color] = useState('#ef4444');
  const [contactHotline2, setContactHotline2] = useState('');
  const [contactHotline2Color, setContactHotline2Color] = useState('#ef4444');
  const [contactHotline3, setContactHotline3] = useState('');
  const [contactHotline3Color, setContactHotline3Color] = useState('#ef4444');
  const [contactHotlineBar, setContactHotlineBar] = useState('false');

  // socials state
  const [contactZalo, setContactZalo] = useState('');
  const [contactTelegram, setContactTelegram] = useState('');
  const [contactInstagram, setContactInstagram] = useState('');
  const [contactYoutube, setContactYoutube] = useState('');
  const [contactTiktok, setContactTiktok] = useState('');

  // facebook state
  const [contactFacebook, setContactFacebook] = useState('');
  const [contactMessenger, setContactMessenger] = useState('');

  // others state
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactViber, setContactViber] = useState('');
  const [contactMap, setContactMap] = useState('');
  const [contactMapColor, setContactMapColor] = useState('#10b981');
  const [contactLink, setContactLink] = useState('');
  const [contactLinkColor, setContactLinkColor] = useState('#3b82f6');

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.settings) {
          const s = data.settings;
          const isPluginEnabled = s.plugin_contact_enabled !== 'false';
          setIsPluginActive(isPluginEnabled);

          if (!isPluginEnabled) {
            setIsLoading(false);
            return;
          }

          if (s.contact_hotline_1) setContactHotline1(s.contact_hotline_1);
          if (s.contact_hotline_1_color) setContactHotline1Color(s.contact_hotline_1_color);
          if (s.contact_hotline_2) setContactHotline2(s.contact_hotline_2);
          if (s.contact_hotline_2_color) setContactHotline2Color(s.contact_hotline_2_color);
          if (s.contact_hotline_3) setContactHotline3(s.contact_hotline_3);
          if (s.contact_hotline_3_color) setContactHotline3Color(s.contact_hotline_3_color);
          if (s.contact_hotline_bar) setContactHotlineBar(s.contact_hotline_bar);

          if (s.contact_zalo) setContactZalo(s.contact_zalo);
          if (s.contact_telegram) setContactTelegram(s.contact_telegram);
          if (s.contact_instagram) setContactInstagram(s.contact_instagram);
          if (s.contact_youtube) setContactYoutube(s.contact_youtube);
          if (s.contact_tiktok) setContactTiktok(s.contact_tiktok);

          if (s.contact_facebook) setContactFacebook(s.contact_facebook);
          if (s.contact_messenger) setContactMessenger(s.contact_messenger);

          if (s.contact_whatsapp) setContactWhatsapp(s.contact_whatsapp);
          if (s.contact_viber) setContactViber(s.contact_viber);
          if (s.contact_map) setContactMap(s.contact_map);
          if (s.contact_map_color) setContactMapColor(s.contact_map_color);
          if (s.contact_link) setContactLink(s.contact_link);
          if (s.contact_link_color) setContactLinkColor(s.contact_link_color);
        }
      } catch (error) {
        console.error("Failed to load contact settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToastMsg(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_hotline_1: contactHotline1,
          contact_hotline_1_color: contactHotline1Color,
          contact_hotline_2: contactHotline2,
          contact_hotline_2_color: contactHotline2Color,
          contact_hotline_3: contactHotline3,
          contact_hotline_3_color: contactHotline3Color,
          contact_hotline_bar: contactHotlineBar,
          contact_zalo: contactZalo,
          contact_telegram: contactTelegram,
          contact_instagram: contactInstagram,
          contact_youtube: contactYoutube,
          contact_tiktok: contactTiktok,
          contact_facebook: contactFacebook,
          contact_messenger: contactMessenger,
          contact_whatsapp: contactWhatsapp,
          contact_viber: contactViber,
          contact_map: contactMap,
          contact_map_color: contactMapColor,
          contact_link: contactLink,
          contact_link_color: contactLinkColor
        })
      });

      const data = await response.json();
      if (data.success) {
        setToastMsg({ type: 'success', text: 'Đã lưu cấu hình nút liên hệ thành công!' });
      } else {
        setToastMsg({ type: 'error', text: 'Không thể lưu cài đặt: ' + data.error });
      }
    } catch (error) {
      console.error("Save settings error:", error);
      setToastMsg({ type: 'error', text: 'Lỗi kết nối máy chủ khi lưu cấu hình!' });
    } finally {
      setIsSaving(false);
      // Auto clear toast after 3s
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-medium animate-pulse">Đang tải cấu hình nút liên hệ...</div>
      </div>
    );
  }

  // Deactivated Plugin Screen
  if (!isPluginActive) {
    return (
      <div className="max-w-2xl mx-auto font-sans pt-12 pb-24 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 mx-auto mb-6">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Plugin Nút Liên Hệ Chưa Kích Hoạt</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
            Hệ thống nút liên hệ nổi ngoài Frontend đang tạm tắt. Quý khách vui lòng kích hoạt plugin này trong danh sách để mở cấu hình và hiển thị widget.
          </p>
          <Link 
            href="/settings/plugins" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-98"
          >
            Kích hoạt Plugin ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Nút liên hệ nổi & Chat Widget
          </h1>
          <p className="text-slate-500 text-xs mt-1">Cấu hình các hotline liên hệ và tài khoản mạng xã hội nổi ngoài giao diện chính của website.</p>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className={`p-4 rounded-xl mb-6 border flex items-center gap-3 transition-all duration-300 text-xs font-bold ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm shadow-emerald-500/5' 
            : 'bg-rose-50 border-rose-200 text-rose-800 shadow-sm shadow-rose-500/5'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab('hotline')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'hotline' 
                ? 'border-brand-600 text-brand-600 font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Phone size={14} /> Hotline & Gọi điện
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('socials')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'socials' 
                ? 'border-brand-600 text-brand-600 font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send size={14} /> Mạng xã hội nổi tiếng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('facebook')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'facebook' 
                ? 'border-brand-600 text-brand-600 font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare size={14} /> Facebook & Messenger
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('others')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'others' 
                ? 'border-brand-600 text-brand-600 font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe size={14} /> Bản đồ & Đường dẫn khác
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          
          {/* TAB 1: HOTLINE */}
          {activeTab === 'hotline' && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-600 text-xs leading-relaxed">
                <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Thông tin Hotline</span>
                  Hệ thống cho phép cấu hình tối đa 3 số hotline. Ngoài nút nổi, khi khách hàng di chuột/nhấp vào nút gọi sẽ hiển thị một danh sách Hotline nhanh chuyên nghiệp để lựa chọn. Bản màu sắc sẽ quyết định màu của nút ngoài trang chủ.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hotline 1 */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold text-xs">Hotline 1 (Số điện thoại chính)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={contactHotline1}
                      onChange={(e) => setContactHotline1(e.target.value)}
                      placeholder="Ví dụ: 0968.123.456"
                      className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                    />
                    <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 bg-slate-50 shrink-0">
                      <input
                        type="color"
                        value={contactHotline1Color}
                        onChange={(e) => setContactHotline1Color(e.target.value)}
                        className="w-6 h-6 border-0 cursor-pointer p-0 bg-transparent rounded"
                      />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{contactHotline1Color}</span>
                    </div>
                  </div>
                </div>

                {/* Hotline 2 */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold text-xs">Hotline 2</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={contactHotline2}
                      onChange={(e) => setContactHotline2(e.target.value)}
                      placeholder="Ví dụ: 0988.111.222"
                      className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                    />
                    <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 bg-slate-50 shrink-0">
                      <input
                        type="color"
                        value={contactHotline2Color}
                        onChange={(e) => setContactHotline2Color(e.target.value)}
                        className="w-6 h-6 border-0 cursor-pointer p-0 bg-transparent rounded"
                      />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{contactHotline2Color}</span>
                    </div>
                  </div>
                </div>

                {/* Hotline 3 */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold text-xs">Hotline 3</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={contactHotline3}
                      onChange={(e) => setContactHotline3(e.target.value)}
                      placeholder="Ví dụ: 0123 456 789"
                      className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                    />
                    <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 bg-slate-50 shrink-0">
                      <input
                        type="color"
                        value={contactHotline3Color}
                        onChange={(e) => setContactHotline3Color(e.target.value)}
                        className="w-6 h-6 border-0 cursor-pointer p-0 bg-transparent rounded"
                      />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{contactHotline3Color}</span>
                    </div>
                  </div>
                </div>

                {/* Hotline Bar Toggle */}
                <div className="space-y-2 flex flex-col justify-center">
                  <span className="text-slate-700 font-bold text-xs block mb-1">Hiển thị Hotline Bar ở mobile</span>
                  <label className="flex items-center gap-2 cursor-pointer self-start">
                    <input
                      type="checkbox"
                      checked={contactHotlineBar === 'true'}
                      onChange={(e) => setContactHotlineBar(e.target.checked ? 'true' : 'false')}
                      className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                    />
                    <span className="text-slate-600 text-xs font-semibold">Hiện thanh Hotline ngang cố định dưới cùng ở phiên bản điện thoại</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOCIALS */}
          {activeTab === 'socials' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Zalo */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold text-xs block">Tài khoản Zalo (Số điện thoại / Link)</label>
                  <input
                    type="text"
                    value={contactZalo}
                    onChange={(e) => setContactZalo(e.target.value)}
                    placeholder="Ví dụ: 0868375300 hoặc link https://zalo.me/..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 block leading-normal">Nhập số điện thoại Zalo hoặc link chat Zalo trực tiếp của doanh nghiệp.</span>
                </div>

                {/* Telegram */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold text-xs block">Telegram (Link / Username)</label>
                  <input
                    type="text"
                    value={contactTelegram}
                    onChange={(e) => setContactTelegram(e.target.value)}
                    placeholder="Ví dụ: https://t.me/username"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                {/* Instagram */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold text-xs block">Instagram Link</label>
                  <input
                    type="text"
                    value={contactInstagram}
                    onChange={(e) => setContactInstagram(e.target.value)}
                    placeholder="Ví dụ: https://instagram.com/account"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                {/* Youtube */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold text-xs block">Youtube Channel Link</label>
                  <input
                    type="text"
                    value={contactYoutube}
                    onChange={(e) => setContactYoutube(e.target.value)}
                    placeholder="Ví dụ: https://youtube.com/c/channel"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                {/* Tiktok */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold text-xs block">Tiktok Link</label>
                  <input
                    type="text"
                    value={contactTiktok}
                    onChange={(e) => setContactTiktok(e.target.value)}
                    placeholder="Ví dụ: https://tiktok.com/@username"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FACEBOOK */}
          {activeTab === 'facebook' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Facebook Fanpage */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold text-xs block">Đường dẫn Fanpage Facebook</label>
                  <input
                    type="text"
                    value={contactFacebook}
                    onChange={(e) => setContactFacebook(e.target.value)}
                    placeholder="Ví dụ: https://facebook.com/lexi"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 block leading-normal">Trang Facebook chính thức của quý doanh nghiệp.</span>
                </div>

                {/* Facebook Messenger */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold text-xs block">Đường dẫn Messenger Chat</label>
                  <input
                    type="text"
                    value={contactMessenger}
                    onChange={(e) => setContactMessenger(e.target.value)}
                    placeholder="Ví dụ: https://m.me/lexi hoặc m.me/username"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 block leading-normal">Khi khách hàng nhấn nút này sẽ được chuyển hướng trực tiếp đến ứng dụng nhắn tin Messenger.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OTHERS */}
          {activeTab === 'others' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Whatsapp */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold text-xs block">Whatsapp Number</label>
                  <input
                    type="text"
                    value={contactWhatsapp}
                    onChange={(e) => setContactWhatsapp(e.target.value)}
                    placeholder="Ví dụ: 0968123456"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                {/* Viber */}
                <div className="space-y-2">
                  <label className="text-slate-700 font-bold text-xs block">Viber Number</label>
                  <input
                    type="text"
                    value={contactViber}
                    onChange={(e) => setContactViber(e.target.value)}
                    placeholder="Ví dụ: 0968123456"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                {/* Map Link */}
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-slate-700 font-bold text-xs block">Google Map Location Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={contactMap}
                      onChange={(e) => setContactMap(e.target.value)}
                      placeholder="Ví dụ: https://maps.google.com/?q=Số+1+Hoàng+Đạo+Thúy..."
                      className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                    />
                    <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 bg-slate-50 shrink-0">
                      <input
                        type="color"
                        value={contactMapColor}
                        onChange={(e) => setContactMapColor(e.target.value)}
                        className="w-6 h-6 border-0 cursor-pointer p-0 bg-transparent rounded"
                      />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{contactMapColor}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Page Link */}
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-slate-700 font-bold text-xs block">Contact Page Link (Trang liên hệ riêng)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={contactLink}
                      onChange={(e) => setContactLink(e.target.value)}
                      placeholder="Ví dụ: /lien-he/ hoặc /contact.html"
                      className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-brand-500 transition-colors"
                    />
                    <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 bg-slate-50 shrink-0">
                      <input
                        type="color"
                        value={contactLinkColor}
                        onChange={(e) => setContactLinkColor(e.target.value)}
                        className="w-6 h-6 border-0 cursor-pointer p-0 bg-transparent rounded"
                      />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{contactLinkColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Form Controls / Buttons */}
        <div className="flex items-center justify-between bg-slate-100/80 border border-slate-200 rounded-2xl p-4 shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
            <Info size={14} className="text-slate-400" />
            <span>Mọi thay đổi sẽ có hiệu lực ngay lập tức ngoài trang chủ khi nhấp lưu.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <Save size={14} />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>

      </form>
    </div>
  );
}
