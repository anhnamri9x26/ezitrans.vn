"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, Globe2, Loader2, Lock, Mail, MapPin, Phone, Sparkles, User, Wand2 } from 'lucide-react';

type SetupState = 'checking' | 'ready' | 'installed' | 'error' | 'submitting' | 'done';

export default function SetupPage() {
  const router = useRouter();
  const [state, setState] = useState<SetupState>('checking');
  const [siteTitle, setSiteTitle] = useState('');
  const [siteTagline, setSiteTagline] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [siteEmail, setSiteEmail] = useState('');
  const [sitePhone, setSitePhone] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteLegalName, setSiteLegalName] = useState('');
  const [siteLanguage, setSiteLanguage] = useState('vi');
  const [username, setUsername] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/setup', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.installed) {
          setState('installed');
          setMessage('Hệ thống đã được cài đặt. Bạn có thể đăng nhập.');
        } else {
          setState('ready');
        }
      })
      .catch(() => {
        setState('error');
        setMessage('Không thể kiểm tra trạng thái database. Hãy đảm bảo PostgreSQL đang chạy.');
      });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setState('submitting');
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteTitle, siteTagline, siteUrl, siteEmail, sitePhone, siteAddress, siteLegalName, siteLanguage,
          username, email, password,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        setMessage(data.error || 'Không thể hoàn tất cài đặt.');
        setState('ready');
        return;
      }
      setState('done');
      setMessage(data.message || 'Cài đặt hoàn tất.');
      window.setTimeout(() => router.push('/login'), 1200);
    } catch {
      setMessage('Không thể kết nối tới API cài đặt.');
      setState('ready');
    }
  };

  const disabled = state === 'submitting' || state === 'checking' || state === 'done';

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,.24),transparent_36%),linear-gradient(135deg,#f8fafc,#eef2ff_45%,#fdf2f8)] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-2xl shadow-indigo-500/30 ring-8 ring-white/70">
            <Wand2 size={36} />
          </div>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
          <div className="border-b border-slate-200/80 bg-white/80 px-8 py-7">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700 ring-1 ring-indigo-100">
              <Sparkles size={13} /> 5-minute install
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Welcome to Lexi CMS</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Khai báo identity chính thức của website và tài khoản quản trị đầu tiên. Lexi CMS sẽ dùng các thông tin này cho giao diện, SEO, schema và liên hệ. Lexi Starter sẽ được kích hoạt làm giao diện ban đầu và có thể tùy biến sau khi đăng nhập.
            </p>
          </div>

          {state === 'checking' ? (
            <div className="flex items-center gap-3 px-8 py-10 font-bold text-slate-500"><Loader2 className="animate-spin" size={18} /> Đang kiểm tra database...</div>
          ) : state === 'installed' ? (
            <div className="px-8 py-10">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                <CheckCircle2 className="mb-3" />
                <p className="font-black">{message}</p>
                <button onClick={() => router.push('/login')} className="mt-5 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700">Đi tới đăng nhập</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 py-8">
              <h2 className="mb-5 text-xl font-black text-slate-900">Thông tin website</h2>

              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-700">Tên website *</span>
                    <input required value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} disabled={disabled} placeholder="Tên thương hiệu hoặc website" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Globe2 size={15} /> URL chính thức *</span>
                    <input required type="url" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} disabled={disabled} placeholder="https://your-domain.com" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-700">Tagline / mô tả ngắn</span>
                  <input value={siteTagline} onChange={(e) => setSiteTagline(e.target.value)} disabled={disabled} placeholder="Mô tả ngắn về website" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
                </label>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Mail size={15} /> Email website</span><input type="email" value={siteEmail} onChange={(e) => setSiteEmail(e.target.value)} disabled={disabled} placeholder="contact@your-domain.com" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label>
                  <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Phone size={15} /> Điện thoại</span><input value={sitePhone} onChange={(e) => setSitePhone(e.target.value)} disabled={disabled} placeholder="Để trống nếu không công khai" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label>
                </div>
                <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><MapPin size={15} /> Địa chỉ</span><input value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} disabled={disabled} placeholder="Để trống nếu không công khai" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block"><span className="mb-2 block text-sm font-black text-slate-700">Tên pháp lý / tổ chức</span><input value={siteLegalName} onChange={(e) => setSiteLegalName(e.target.value)} disabled={disabled} placeholder="Tùy chọn" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label>
                  <label className="block"><span className="mb-2 block text-sm font-black text-slate-700">Ngôn ngữ</span><select value={siteLanguage} onChange={(e) => setSiteLanguage(e.target.value)} disabled={disabled} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none"><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label>
                </div>

                <h2 className="border-t border-slate-100 pt-6 text-xl font-black text-slate-900">Tài khoản quản trị</h2>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><User size={15} /> Username</span>
                    <input required value={username} onChange={(e) => setUsername(e.target.value)} disabled={disabled} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
                    <span className="mt-1 block text-[11px] text-slate-500">Chữ, số, gạch dưới hoặc gạch ngang.</span>
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Mail size={15} /> Email quản trị</span>
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={disabled} placeholder="admin@your-domain.com" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"><Lock size={15} /> Password</span>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} disabled={disabled} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span className="mt-1 block text-[11px] text-slate-500">Ít nhất 8 ký tự, có chữ hoa, chữ thường và số.</span>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-700">Confirm Password</span>
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={disabled} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
                  </label>
                </div>
              </div>

              {message && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{message}</div>}

              <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
                <p className="max-w-md text-xs leading-5 text-slate-500">Sau khi hoàn tất, setup sẽ tự khóa lại để bảo mật. Muốn cài lại thì cần reset database.</p>
                <button disabled={disabled} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-3 text-sm font-black text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:opacity-60">
                  {state === 'submitting' ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  Install Lexi CMS
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
