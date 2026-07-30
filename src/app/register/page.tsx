"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, User, Key, Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devActivationLink, setDevActivationLink] = useState<string | null>(null);
  
  const [allowRegistration, setAllowRegistration] = useState(true); // default true before fetching
  
  // Real-time password strength calculations
  const [pwdStrength, setPwdStrength] = useState({ score: 0, text: 'Rất yếu', color: 'bg-rose-500' });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          const isAllowed = data.settings.allow_user_registration === 'true';
          setAllowRegistration(isAllowed);
          if (!isAllowed) {
            setErrorMsg('Đăng ký thành viên hiện đang bị đóng bởi quản trị viên.');
          }
        }
      })
      .catch((err) => console.error("Error loading settings:", err));
  }, []);

  useEffect(() => {
    if (!password) {
      setPwdStrength({ score: 0, text: 'Trống', color: 'bg-slate-700' });
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    let text = 'Rất yếu';
    let color = 'bg-rose-500';

    if (score >= 5) {
      text = 'Rất mạnh';
      color = 'bg-emerald-500';
    } else if (score >= 4) {
      text = 'Mạnh';
      color = 'bg-teal-500';
    } else if (score >= 3) {
      text = 'Trung bình';
      color = 'bg-amber-500';
    } else if (score >= 2) {
      text = 'Yếu';
      color = 'bg-orange-500';
    }

    setPwdStrength({ score, text, color });
  }, [password]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!allowRegistration) {
      setErrorMsg('Đăng ký thành viên hiện đang bị đóng.');
      return;
    }

    if (!username.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ các trường thông tin bắt buộc.');
      return;
    }

    // Alphanumeric username validation
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      setErrorMsg('Tên tài khoản chỉ được chứa chữ cái, số, gạch dưới, gạch ngang và dài từ 3-30 ký tự.');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Định dạng email không hợp lệ.');
      return;
    }

    // Password strength check
    if (pwdStrength.score < 4) {
      setErrorMsg('Mật khẩu chưa đủ mạnh. Mật khẩu phải dài ít nhất 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.toLowerCase().trim(),
          name: name.trim() || null,
          email: email.toLowerCase().trim(),
          password
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccessMsg(data.warning || data.message || 'Đăng ký tài khoản thành công!');
        if (data.devActivationLink) {
          setDevActivationLink(data.devActivationLink);
        }
        // If requiring email activation, clear input fields but keep success message visible
        if (data.warning || data.requireVerify) {
          setUsername('');
          setEmail('');
          setName('');
          setPassword('');
          setConfirmPassword('');
        } else {
          setTimeout(() => {
            router.push('/admin/dashboard');
            router.refresh();
          }, 1500);
        }
      } else {
        setErrorMsg(data.error || 'Đăng ký thất bại. Vui lòng thử lại.');
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

      {/* Main Glassmorphic Form Card */}
      <div className="w-[420px] bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl flex flex-col items-center relative z-10 animate-fade-in">
        
        {/* Logo Header */}
        <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_-3px_rgba(79,70,229,0.3)] mb-4 animate-bounce">
          <Lock size={20} />
        </div>
        
        <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1">
          Lexi <span className="text-indigo-400">CMS</span>
        </h1>
        <p className="text-slate-400 font-medium text-[11px] mt-1 mb-6">Tạo tài khoản thành viên mới</p>

        {/* Error message banner */}
        {errorMsg && (
          <div className="w-full mb-4 p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 font-semibold text-xs flex items-center gap-2">
            <ShieldAlert size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success message banner */}
        {successMsg && (
          <div className="w-full mb-4 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 font-semibold text-xs flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="shrink-0 animate-pulse" />
              <span>{successMsg}</span>
            </div>
            
            {devActivationLink && (
              <div className="mt-2 p-3 rounded-xl border border-indigo-500/20 bg-indigo-950/40 text-indigo-300 text-[11px] font-medium text-center space-y-2.5 shadow-inner animate-fade-in">
                <p className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px] flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                  Chế độ thử nghiệm (Localhost)
                </p>
                <p className="text-[11px] text-slate-300">Vì bạn đang chạy trên Localhost và chưa cấu hình SMTP, bạn có thể click vào nút bên dưới để kích hoạt tài khoản này ngay lập tức:</p>
                <a 
                  href={devActivationLink}
                  className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg transition-all text-xs shadow-md shadow-indigo-600/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Kích hoạt nhanh tài khoản
                </a>
              </div>
            )}
          </div>
        )}

        {allowRegistration && !successMsg && (
          <form onSubmit={handleRegisterSubmit} className="w-full space-y-4 font-semibold text-slate-300">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tên tài khoản *</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ví dụ: nguyen_van_a"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-800 rounded-lg bg-slate-950/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-white placeholder-slate-600"
                  required
                  autoComplete="off"
                />
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Họ và tên</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Nhập họ và tên..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-800 rounded-lg bg-slate-950/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-white placeholder-slate-600"
                />
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Địa chỉ Email *</label>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Vi dụ: email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-800 rounded-lg bg-slate-950/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-white placeholder-slate-600"
                  required
                  autoComplete="off"
                />
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mật khẩu *</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Tạo mật khẩu mạnh..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 border border-slate-800 rounded-lg bg-slate-950/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-white placeholder-slate-600"
                  required
                  autoComplete="new-password"
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

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Độ mạnh mật khẩu:</span>
                    <span className="font-bold text-slate-300">{pwdStrength.text}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${pwdStrength.color}`}
                      style={{ width: `${(pwdStrength.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Xác nhận mật khẩu *</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="Nhập lại mật khẩu..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 border border-slate-800 rounded-lg bg-slate-950/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-white placeholder-slate-600"
                  required
                  autoComplete="new-password"
                />
                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                <Sparkles size={14} />
                {isLoading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 flex justify-center w-full text-[11px] text-slate-400 font-semibold border-t border-slate-800/80 pt-4">
          <span>Đã có tài khoản? <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Đăng nhập ngay</a></span>
        </div>
      </div>

    </div>
  );
}
