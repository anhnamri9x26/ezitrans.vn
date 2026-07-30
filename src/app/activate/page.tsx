"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, ShieldCheck, Loader2, Sparkles, ArrowRight } from 'lucide-react';

export default function ActivatePage() {
  const router = useRouter();
  
  // Wrap in a Suspense block or let Next.js handle it safely on client side.
  // Wait, useSearchParams() requires Suspense if used directly in modern Next.js.
  // We can wrap the inner logic in a small component or just use raw window location check to be absolutely safe and avoid Suspense crashes!
  // Yes! Checking window.location.search is extremely robust and avoids any Suspense boundary issues on Next.js build time.
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState({ type: '', msg: '' });

  useEffect(() => {
    // Client-only check
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tokenVal = params.get('token');
      setToken(tokenVal);
      
      if (!tokenVal) {
        setStatus('error');
        setErrorMsg('Mã kích hoạt tài khoản không tồn tại hoặc không hợp lệ.');
        return;
      }

      // Call activation API
      fetch(`/api/auth/activate?token=${tokenVal}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStatus('success');
            setSuccessMsg(data.message);
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              router.push('/admin/dashboard');
              router.refresh();
            }, 3000);
          } else {
            setStatus('error');
            setErrorMsg(data.error || 'Kích hoạt tài khoản thất bại.');
          }
        })
        .catch((err) => {
          console.error(err);
          setStatus('error');
          setErrorMsg('Lỗi kết nối máy chủ khi kích hoạt tài khoản.');
        });
    }
  }, [router]);

  const handleResendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsResending(true);
    setResendStatus({ type: '', msg: '' });

    try {
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json();
      
      if (data.success) {
        setResendStatus({ type: 'success', msg: data.message || 'Liên kết kích hoạt mới đã được gửi vào hộp thư.' });
      } else {
        setResendStatus({ type: 'error', msg: data.error || 'Lỗi gửi lại email kích hoạt.' });
      }
    } catch (err) {
      setResendStatus({ type: 'error', msg: 'Lỗi kết nối máy chủ.' });
      console.error(err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans text-[13px] relative overflow-hidden">
      
      {/* Decorative Blur Background Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-brand-900/20 blur-[120px] pointer-events-none animate-pulse" />

      {/* Main Glassmorphic Card */}
      <div className="w-[400px] bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl flex flex-col items-center relative z-10 animate-fade-in text-center">
        
        {status === 'loading' && (
          <div className="space-y-6 py-6 w-full flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <div>
              <h2 className="text-base font-bold text-white mb-2">Đang xác thực tài khoản</h2>
              <p className="text-slate-400 text-xs">Vui lòng đợi trong giây lát, chúng tôi đang kích hoạt tài khoản của bạn...</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 py-4 w-full flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] animate-bounce">
              <ShieldCheck size={28} />
            </div>
            
            <div>
              <h2 className="text-base font-bold text-white mb-2">Kích hoạt tài khoản thành công!</h2>
              <p className="text-slate-400 text-xs px-2">{successMsg || 'Chúc mừng! Bạn đã xác thực email thành công và có thể bắt đầu sử dụng Lexi CMS.'}</p>
            </div>

            <div className="text-[11px] text-indigo-400 flex items-center gap-1.5 font-bold animate-pulse">
              <span>Đang tự động chuyển hướng đến trang quản trị</span>
              <ArrowRight size={12} />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 w-full flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)] animate-shake">
              <ShieldAlert size={28} />
            </div>

            <div>
              <h2 className="text-base font-bold text-white mb-2">Không thể kích hoạt tài khoản</h2>
              <p className="text-rose-300 text-xs px-2 font-medium">{errorMsg}</p>
            </div>

            {/* Resend activation form */}
            <div className="w-full border-t border-slate-800/80 pt-5 text-left space-y-3">
              <h3 className="text-xs font-bold text-slate-300">Yêu cầu gửi lại liên kết kích hoạt:</h3>
              
              {resendStatus.msg && (
                <div className={`p-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 ${
                  resendStatus.type === 'success' 
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' 
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                }`}>
                  <span>{resendStatus.msg}</span>
                </div>
              )}

              <form onSubmit={handleResendSubmit} className="flex gap-2 w-full">
                <input
                  type="email"
                  placeholder="Nhập email đăng ký của bạn..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-800 rounded-lg bg-slate-950/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-white placeholder-slate-600 text-[12px]"
                  required
                />
                <button
                  type="submit"
                  disabled={isResending}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg transition-all text-[11px] cursor-pointer"
                >
                  {isResending ? 'Đang gửi...' : 'Gửi lại'}
                </button>
              </form>
            </div>

            <div className="w-full border-t border-slate-800/80 pt-4">
              <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">Quay lại trang Đăng nhập</a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
