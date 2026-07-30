"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Settings } from 'lucide-react';

interface ImageConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { alt: string; title: string; width: string; height: string }) => void;
  initialData: {
    src: string;
    alt: string;
    title: string;
    width: string;
    height: string;
  };
}

export default function ImageConfigModal({ isOpen, onClose, onSave, initialData }: ImageConfigModalProps) {
  const [alt, setAlt] = useState('');
  const [title, setTitle] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAlt(initialData.alt || '');
      setTitle(initialData.title || '');
      setWidth(initialData.width || '');
      setHeight(initialData.height || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ alt, title, width, height });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Settings size={18} />
            </div>
            <h2 className="text-base font-black text-slate-800 tracking-tight">Cấu hình Hình ảnh</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Image Preview */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-slate-250 shrink-0 flex items-center justify-center">
                {initialData.src ? (
                  <img src={initialData.src} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đường dẫn hình ảnh</span>
                <span className="block text-xs font-semibold text-slate-600 truncate break-all select-all mt-0.5" title={initialData.src}>
                  {initialData.src}
                </span>
              </div>
            </div>

            {/* Alt text field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Thẻ Alt (Văn bản thay thế)</label>
                <span className="text-[10px] font-bold text-emerald-600">Khuyên dùng cho SEO</span>
              </div>
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Mô tả nội dung của hình ảnh này..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all font-semibold text-slate-700"
              />
              <p className="text-[10px] text-slate-400 leading-normal">
                Giúp công cụ tìm kiếm Google hiểu nội dung ảnh và hiển thị thay thế nếu ảnh lỗi tải.
              </p>
            </div>

            {/* Title text field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tiêu đề hình ảnh (Title)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mẹo nhỏ hiển thị khi di chuột qua..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all font-semibold text-slate-700"
              />
              <p className="text-[10px] text-slate-400 leading-normal">
                Đoạn văn ngắn xuất hiện dạng tooltip khi người đọc rê con trỏ chuột vào hình ảnh.
              </p>
            </div>

            {/* Dimension fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Chiều rộng (Width)</label>
                <input
                  type="text"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Ví dụ: 100% hoặc 600px"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all font-semibold text-slate-750"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Chiều cao (Height)</label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Ví dụ: tự động hoặc 400px"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all font-semibold text-slate-750"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-slate-100 text-slate-600 font-semibold py-2 px-3 border border-slate-200 hover:border-slate-300 rounded-lg text-xs transition-all active:scale-[0.98] cursor-pointer text-center"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-brand-500/25 hover:shadow-lg text-center flex items-center justify-center gap-1.5"
            >
              <Save size={14} />
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
