"use client";

import React, { useState, useEffect } from 'react';
import { Save, Info, Phone, Mail, MapPin, ShieldAlert, Sparkles } from 'lucide-react';

export default function AdminFooterSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Lưu trữ cài đặt gốc từ server
  const [settings, setSettings] = useState<any>({});

  // States lưu các thuộc tính Footer
  const [footerCopyright, setFooterCopyright] = useState('');
  const [footerAboutText, setFooterAboutText] = useState('');
  const [footerPhone, setFooterPhone] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerAddress, setFooterAddress] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
          const s = data.settings;
          if (s.footer_copyright) setFooterCopyright(s.footer_copyright);
          if (s.footer_about_text) setFooterAboutText(s.footer_about_text);
          if (s.footer_phone) setFooterPhone(s.footer_phone);
          if (s.footer_email) setFooterEmail(s.footer_email);
          if (s.footer_address) setFooterAddress(s.footer_address);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          footer_copyright: footerCopyright,
          footer_about_text: footerAboutText,
          footer_phone: footerPhone,
          footer_email: footerEmail,
          footer_address: footerAddress
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Đã lưu cài đặt chân trang thành công!');
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-medium animate-pulse text-xs">Đang tải cấu hình chân trang...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveSettings} className="max-w-4xl mx-auto font-sans pb-12 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Sparkles className="text-slate-600" size={24} /> Cấu hình Chân trang (Footer)
          </h1>
          <p className="text-slate-500 text-xs mt-1">Cấu hình các thông số liên hệ, giới thiệu doanh nghiệp và thông tin bản quyền hiển thị dưới chân trang (Footer) của mọi Theme.</p>
        </div>
        <button 
          type="submit"
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-indigo-500/20 active:translate-y-0.5 disabled:opacity-50 cursor-pointer border-none outline-none text-xs"
        >
          <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Form Fields */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Section 1: About Company Footer text */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-sm font-extrabold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
              <Info size={18} className="text-indigo-500" /> Thông tin giới thiệu & Bản quyền
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Đoạn giới thiệu ngắn chân trang</label>
                <textarea 
                  value={footerAboutText}
                  onChange={(e) => setFooterAboutText(e.target.value)}
                  placeholder="Ví dụ: Lexi là đơn vị vận chuyển hàng đầu cung cấp dịch vụ logistics quốc tế..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">Một đoạn văn bản ngắn (1-2 câu) giới thiệu về năng lực hoặc thương hiệu hiển thị ở cột 1 chân trang.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Thông tin bản quyền (Copyright)</label>
                <input 
                  type="text"
                  value={footerCopyright}
                  onChange={(e) => setFooterCopyright(e.target.value)}
                  placeholder={`© ${new Date().getFullYear()} Lexi.vn - All rights reserved.`}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">Dòng chữ hiển thị dưới đáy chân trang cùng năm hiện tại.</p>
              </div>
            </div>
          </section>

          {/* Section 2: Contact Info */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-sm font-extrabold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
              <Phone size={18} className="text-indigo-500" /> Thông tin liên hệ chân trang
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Số điện thoại liên hệ</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                    <Phone size={14} />
                  </div>
                  <input 
                    type="text"
                    value={footerPhone}
                    onChange={(e) => setFooterPhone(e.target.value)}
                    placeholder="Ví dụ: 0968.123.456"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Hộp thư điện tử (Email)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                    <Mail size={14} />
                  </div>
                  <input 
                    type="email"
                    value={footerEmail}
                    onChange={(e) => setFooterEmail(e.target.value)}
                    placeholder="Ví dụ: contact@lexi.vn"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Địa chỉ trụ sở</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                    <MapPin size={14} />
                  </div>
                  <input 
                    type="text"
                    value={footerAddress}
                    onChange={(e) => setFooterAddress(e.target.value)}
                    placeholder="Ví dụ: Số 1 Hoàng Đạo Thúy, Cầu Giấy, Hà Nội"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-medium"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Help */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-500" />
              Tại sao lại lưu động?
            </h2>
            <div className="space-y-3 text-[11px] leading-relaxed text-slate-500 font-medium">
              <p>
                Việc tách biệt thông tin liên hệ và giới thiệu ra khỏi code HTML của giao diện giúp bạn:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Khi đổi Theme, các thông tin liên hệ chân trang vẫn được **giữ nguyên hoàn hảo**.</li>
                <li>Hạn chế tối đa việc phải chỉnh sửa trực tiếp mã nguồn code React của trang web.</li>
                <li>Dễ dàng cập nhật nhanh thông tin khi doanh nghiệp thay đổi số hotline hoặc văn phòng.</li>
              </ul>
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-800 text-[10px] leading-relaxed mt-2">
                <strong>💡 Lưu ý:</strong> Footer ở cả 2 theme **Classic** và **Modern** đều được lập trình để tự động đồng bộ hóa dữ liệu bạn nhập bên trái.
              </div>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
