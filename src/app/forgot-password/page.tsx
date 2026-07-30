"use client";

import React, { useState } from 'react';
import { ShieldAlert, Mail, Lock, Sparkles, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ Email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Định dạng email không hợp lệ.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccessMsg(data.message || 'Đã gửi yêu cầu khôi phục mật khẩu. Vui lòng kiểm tra hộp thư của bạn.');
        setEmail('');
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ!');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans text-[13px] relative overflow-hidden">
      
      {/* Decorative Blur Background Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-brand-900/20 blur-[120px] pointer-events-none animate-pulse" />

      {/* Main Glassmorphic Card */}
      <div className="w-[380px] bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl flex flex-col items-center relative z-10 animate-fade-in">
        
        {/* Lock Icon Header */}
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_-3px_rgba(79,70,229,0.3)] mb-4 animate-bounce">
          <Lock size={20} />
        </div>
        
        <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1">
          Lexi <span className="text-indigo-400">CMS</span>
        </h1>
        <p className="text-slate-400 font-medium text-[11px] mt-1 mb-6">Khôi phục mật khẩu truy cập</p>

        {/* Error message banner */}
        {errorMsg && (
          <div className="w-full mb-4 p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 font-semibold text-xs flex items-center gap-2">
            <ShieldAlert size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success message banner */}
        {successMsg && (
          <div className="w-full mb-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 font-semibold text-xs flex items-center gap-2">
            <Sparkles size={14} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="w-full space-y-4 font-semibold text-slate-300">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Địa chỉ Email của bạn</label>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Nhập email tài khoản của bạn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-800 rounded-lg bg-slate-950/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-white placeholder-slate-600"
                  required
                />
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">Chúng tôi sẽ gửi một liên kết đặt lại mật khẩu vào địa chỉ email này nếu tài khoản tồn tại.</p>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                <Sparkles size={14} />
                {isLoading ? 'Đang gửi yêu cầu...' : 'Gửi liên kết khôi phục'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 flex justify-center w-full text-[11px] text-slate-400 font-semibold border-t border-slate-800/80 pt-4">
          <a href="/login" className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1">
            <ArrowLeft size={12} />
            Quay lại trang Đăng nhập
          </a>
        </div>
      </div>

    </div>
  );
}
