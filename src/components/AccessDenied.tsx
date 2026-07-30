import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-6 text-center">
      <div className="max-w-md w-full bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-5 animate-pulse">
          <ShieldAlert size={32} />
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">
          Truy cập bị từ chối
        </h2>
        
        <p className="text-slate-500 text-xs leading-relaxed mb-6">
          Tài khoản của bạn không có đủ quyền hạn để truy cập trang này. 
          Vui lòng liên hệ với Quản trị viên hệ thống nếu bạn cần hỗ trợ thêm.
        </p>
        
        <div className="flex justify-center">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm hover:shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            Quay lại Tổng quan
          </Link>
        </div>
      </div>
    </div>
  );
}
