"use client";

import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface RecoveryModalProps {
  isOpen: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  autosaveDate: string | Date;
}

export default function RecoveryModal({
  isOpen,
  onRestore,
  onDiscard,
  autosaveDate,
}: RecoveryModalProps) {
  if (!isOpen) return null;

  const formattedDate = new Date(autosaveDate).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 mx-4 overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/40 rounded-full filter blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-100/30 rounded-full filter blur-2xl pointer-events-none" />

        <div className="relative flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner mb-4 animate-bounce">
            <AlertTriangle size={24} strokeWidth={2} />
          </div>

          <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
            Phát hiện bản nháp tự động mới
          </h3>
          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            Khôi phục sau sự cố
          </p>

          <p className="text-slate-600 text-sm mt-4 leading-relaxed px-2">
            Hệ thống đã tự động lưu lại một bản sao thiết kế của bạn vào lúc{" "}
            <span className="font-bold text-slate-800">{formattedDate}</span>. Bản nháp này mới hơn phiên bản chính thức hiện tại trên máy chủ.
          </p>

          <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 mt-5 text-[11px] text-slate-500 leading-relaxed text-left flex gap-2">
            <span className="shrink-0 text-slate-400">💡</span>
            <span>
              Chọn <strong>Khôi phục</strong> để tải lại công việc đang dang dở của bạn. Chọn <strong>Bỏ qua</strong> nếu bạn muốn tiếp tục chỉnh sửa phiên bản chính thức trên máy chủ (bản nháp tự động sẽ bị xóa).
            </span>
          </div>

          <div className="flex gap-3 w-full mt-6">
            <button
              onClick={onDiscard}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <Trash2 size={13} className="opacity-70" />
              Bỏ qua
            </button>
            <button
              onClick={onRestore}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#5ad0d0] hover:bg-[#46bebe] text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-[#5ad0d0]/20 cursor-pointer"
            >
              <RefreshCw size={13} className="animate-spin-slow" />
              Khôi phục
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
