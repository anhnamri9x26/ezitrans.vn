"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, User, Key, Eye, EyeOff, Lock, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [allowRegistration, setAllowRegistration] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devActivationLink, setDevActivationLink] = useState<string | null>(null);

  const [requires2fa, setRequires2fa] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    fetch('/api/setup', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.installed) {
          router.replace('/setup');
          return;
        }
        setCheckingSetup(false);
      })
      .catch(() => setCheckingSetup(false));
  }, [router]);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setAllowRegistration(data.settings.allow_user_registration === 'true');
        }
      })
      .catch((err) => console.error("Error loading settings:", err));
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập Tên tài khoản và Mật khẩu!');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setIsUnverified(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          token: requires2fa ? otpToken.trim() : undefined
        })
      });
      const data = await response.json();
      
      if (data.success) {
        if (data.requires2fa) {
          setRequires2fa(true);
          setSuccessMsg(data.message || 'Yêu cầu mã 2FA để tiếp tục.');
          return;
        }
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        setErrorMsg(data.error || 'Tên tài khoản hoặc mật khẩu không chính xác!');
        if (data.unverified) {
          setIsUnverified(true);
          setUnverifiedEmail(data.email);
          if (data.devActivationLink) {
            setDevActivationLink(data.devActivationLink);
          }
        }
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối đến máy chủ xác thực!');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendActivation = async () => {
    if (!unverifiedEmail) return;
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(data.message || 'Đã gửi lại email kích hoạt! Vui lòng kiểm tra hộp thư.');
        if (data.devActivationLink) {
          setDevActivationLink(data.devActivationLink);
        }
        setIsUnverified(false);
      } else {
        setErrorMsg(data.error || 'Lỗi gửi lại email kích hoạt.');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ!');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300 font-bold">
        Đang kiểm tra trạng thái cài đặt...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans text-[13px] relative overflow-hidden">
      
      {/* Decorative Blur Background Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-brand-900/20 blur-[120px] pointer-events-none animate-pulse" />

      {/* Main Glassmorphic Form Card */}
      <div className="w-[380px] bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl flex flex-col items-center relative z-10 animate-fade-in">
        
        {/* Shield Logo Header */}
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_-3px_rgba(79,70,229,0.3)] mb-4 animate-bounce">
          <Lock size={20} />
        </div>
        
        <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1">
          Lexi <span className="text-indigo-400">CMS</span>
        </h1>
        <p className="text-slate-400 font-medium text-[11px] mt-1 mb-6">Đăng nhập cổng quản trị nội dung</p>

        {/* Error message banner */}
        {errorMsg && (
          <div className="w-full mb-4 flex flex-col gap-2.5">
            <div className="w-full p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 font-semibold text-xs flex items-center gap-2">
              <ShieldAlert size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
            
            {devActivationLink && (
              <div className="w-full p-3 rounded-xl border border-indigo-500/20 bg-indigo-950/40 text-indigo-300 text-[11px] font-medium text-center space-y-2 shadow-inner animate-fade-in">
                <p className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px] flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                  Thử nghiệm Localhost
                </p>
                <p className="text-slate-300 text-[11px]">Vì đang chạy trên Localhost và chưa cấu hình SMTP, bạn có thể kích hoạt nhanh tài khoản tại đây:</p>
                <a 
                  href={devActivationLink}
                  className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-1.5 rounded-lg transition-all text-xs shadow-md shadow-indigo-600/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Kích hoạt tài khoản ngay
                </a>
              </div>
            )}
          </div>
        )}

        {/* Success message banner */}
        {successMsg && (
          <div className="w-full mb-4 flex flex-col gap-2.5">
            <div className="w-full p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 font-semibold text-xs flex items-center gap-2">
              <Sparkles size={14} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
            
            {devActivationLink && (
              <div className="w-full p-3 rounded-xl border border-indigo-500/20 bg-indigo-950/40 text-indigo-300 text-[11px] font-medium text-center space-y-2 shadow-inner animate-fade-in">
                <p className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px] flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                  Thử nghiệm Localhost
                </p>
                <p className="text-slate-300 text-[11px]">Đường dẫn kích hoạt nhanh:</p>
                <a 
                  href={devActivationLink}
                  className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-1.5 rounded-lg transition-all text-xs shadow-md shadow-indigo-600/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Kích hoạt tài khoản ngay
                </a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="w-full space-y-4 font-semibold text-slate-300">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tài khoản hoặc Email</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Nhập tên tài khoản hoặc email..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-800 rounded-lg bg-slate-950/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-white placeholder-slate-600"
                required
              />
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mật khẩu truy cập</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Nhập mật khẩu của bạn..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 border border-slate-800 rounded-lg bg-slate-950/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-white placeholder-slate-600"
                required
              />
              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {requires2fa && (
            <div className="animate-fade-in">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mã xác thực 2FA (hoặc Mã phục hồi)</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Nhập 6 số từ ứng dụng Authenticator..."
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-800 rounded-lg bg-slate-950/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-white placeholder-slate-600"
                  required={requires2fa}
                />
                <ShieldAlert size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              <Sparkles size={14} />
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-col gap-2.5 items-center w-full text-[11px] text-slate-400 font-semibold border-t border-slate-800/80 pt-4">
          <div className="flex justify-between w-full">
            <a href="/forgot-password" className="hover:text-indigo-400 transition-colors">Quên mật khẩu?</a>
            {allowRegistration && (
              <a href="/register" className="hover:text-indigo-400 transition-colors">Đăng ký tài khoản</a>
            )}
          </div>
          {isUnverified && (
            <button
              onClick={handleResendActivation}
              className="mt-2 text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer bg-transparent border-none outline-none p-0 text-[11px]"
            >
              Gửi lại email kích hoạt tài khoản
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
