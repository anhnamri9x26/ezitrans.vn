"use client";

import React, { useState, useEffect } from 'react';
import { Save, Mail, Key, Shield, Bell, Send, Eye, EyeOff, Terminal, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export function EmailSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Email Config State
  const [mailFromEmail, setMailFromEmail] = useState('');
  const [mailFromName, setMailFromName] = useState('Lexi');
  const [mailForceFromEmail, setMailForceFromEmail] = useState('false');
  const [mailSmtpHost, setMailSmtpHost] = useState('');
  const [mailSmtpPort, setMailSmtpPort] = useState('465');
  const [mailSmtpEncryption, setMailSmtpEncryption] = useState('ssl');
  const [mailSmtpAuth, setMailSmtpAuth] = useState('true');
  const [mailSmtpUsername, setMailSmtpUsername] = useState('');
  const [mailSmtpPassword, setMailSmtpPassword] = useState('');

  // Notification Config State
  const [emailNotifyAdminComment, setEmailNotifyAdminComment] = useState('true');
  const [emailNotifyAdminUser, setEmailNotifyAdminUser] = useState('true');
  const [emailNotifyUserApproved, setEmailNotifyUserApproved] = useState('true');
  const [emailNotifyUserReply, setEmailNotifyUserReply] = useState('true');

  // Test Tool State
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string; code?: string } | null>(null);
  const [isPluginActive, setIsPluginActive] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.settings) {
          const s = data.settings;
          const isPluginEnabled = s.plugin_email_smtp_enabled !== 'false';
          setIsPluginActive(isPluginEnabled);
          
          if (!isPluginEnabled) {
            setIsLoading(false);
            return;
          }

          if (s.mail_from_email) setMailFromEmail(s.mail_from_email);
          if (s.mail_from_name) setMailFromName(s.mail_from_name);
          if (s.mail_force_from_email) setMailForceFromEmail(s.mail_force_from_email);
          if (s.mail_smtp_host) setMailSmtpHost(s.mail_smtp_host);
          if (s.mail_smtp_port) setMailSmtpPort(s.mail_smtp_port);
          if (s.mail_smtp_encryption) setMailSmtpEncryption(s.mail_smtp_encryption);
          if (s.mail_smtp_auth) setMailSmtpAuth(s.mail_smtp_auth);
          if (s.mail_smtp_username) setMailSmtpUsername(s.mail_smtp_username);
          if (s.mail_smtp_password) setMailSmtpPassword(s.mail_smtp_password);

          if (s.email_notify_admin_comment) setEmailNotifyAdminComment(s.email_notify_admin_comment);
          if (s.email_notify_admin_user) setEmailNotifyAdminUser(s.email_notify_admin_user);
          if (s.email_notify_user_approved) setEmailNotifyUserApproved(s.email_notify_user_approved);
          if (s.email_notify_user_reply) setEmailNotifyUserReply(s.email_notify_user_reply);
        }
      } catch (error) {
        console.error("Failed to load email settings:", error);
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
          mail_from_email: mailFromEmail,
          mail_from_name: mailFromName,
          mail_force_from_email: mailForceFromEmail,
          mail_smtp_host: mailSmtpHost,
          mail_smtp_port: mailSmtpPort,
          mail_smtp_encryption: mailSmtpEncryption,
          mail_smtp_auth: mailSmtpAuth,
          mail_smtp_username: mailSmtpUsername,
          mail_smtp_password: mailSmtpPassword,
          email_notify_admin_comment: emailNotifyAdminComment,
          email_notify_admin_user: emailNotifyAdminUser,
          email_notify_user_approved: emailNotifyUserApproved,
          email_notify_user_reply: emailNotifyUserReply,
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Đã lưu cấu hình email và SMTP thành công!');
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

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) {
      alert('Vui lòng nhập địa chỉ email nhận thử nghiệm!');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/settings/email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          mail_from_email: mailFromEmail,
          mail_from_name: mailFromName,
          mail_smtp_host: mailSmtpHost,
          mail_smtp_port: mailSmtpPort,
          mail_smtp_encryption: mailSmtpEncryption,
          mail_smtp_username: mailSmtpUsername,
          mail_smtp_password: mailSmtpPassword,
        })
      });

      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message,
        error: data.error,
        code: data.code
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        error: 'Không thể gửi email kiểm thử do lỗi kết nối API. Vui lòng kiểm tra lại mạng.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-medium animate-pulse text-xs">Đang tải cấu hình email & SMTP...</div>
      </div>
    );
  }

  if (!isPluginActive) {
    return (
      <div className="max-w-md mx-auto font-sans text-xs py-16 text-center animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-6 shrink-0 shadow-sm border border-rose-100">
            <Mail size={32} className="stroke-[1.5]" />
          </div>
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight mb-2">Tính năng Cấu hình Email chưa được kích hoạt</h2>
          <p className="text-slate-500 leading-relaxed mb-6 font-medium max-w-sm">
            Plugin <strong>Cấu hình SMTP & Quản lý thông báo Email</strong> hiện đang bị vô hiệu hóa trong cài đặt hệ thống.
          </p>
          <a
            href="/settings/plugins"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-lg shadow-sm hover:shadow-indigo-500/20 active:translate-y-0.5 transition-all text-xs border-none cursor-pointer text-center no-underline"
          >
            Mở trang Tính năng mở rộng
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto font-sans pb-12 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Mail className="text-slate-600" size={24} /> Cấu hình Email & SMTP
          </h1>
          <p className="text-slate-500 text-xs mt-1">Cấu hình máy chủ gửi thư SMTP (tương tự WP Mail SMTP) và thiết lập thông báo email tự động.</p>
        </div>
        <button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-indigo-500/20 active:translate-y-0.5 disabled:opacity-50 cursor-pointer border-none outline-none text-xs animate-fade-in"
        >
          <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Settings Panel */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Section 1: General Mail Config */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
              <Mail size={18} className="text-indigo-500" /> Cài đặt chung gửi thư
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Email gửi đi (From Email)</label>
                <input 
                  type="email"
                  value={mailFromEmail}
                  onChange={(e) => setMailFromEmail(e.target.value)}
                  placeholder="name@your-domain.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Địa chỉ email mà tất cả các email từ trang web này sẽ được gửi đi.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Tên người gửi (From Name)</label>
                <input 
                  type="text"
                  value={mailFromName}
                  onChange={(e) => setMailFromName(e.target.value)}
                  placeholder="Lexi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Tên sẽ hiển thị làm tên người gửi trong hộp thư đến của khách hàng.</p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={mailForceFromEmail === 'true'}
                    onChange={(e) => setMailForceFromEmail(e.target.checked ? 'true' : 'false')}
                    className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800">Ép buộc sử dụng Email này (Force From Email)</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-normal">Nếu được chọn, tất cả email gửi đi sẽ sử dụng email trên, bỏ qua cấu hình riêng của các plugin khác.</p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* Section 2: SMTP Mailer Config */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
              <Key size={18} className="text-indigo-500" /> Thông số máy chủ SMTP
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Máy chủ SMTP (SMTP Host)</label>
                <input 
                  type="text"
                  value={mailSmtpHost}
                  onChange={(e) => setMailSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Địa chỉ máy chủ SMTP gửi thư của nhà cung cấp dịch vụ email của bạn.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Loại mã hóa (Encryption)</label>
                  <div className="flex gap-4 p-2 border border-slate-200 rounded-lg bg-slate-50/50">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="encryption" 
                        value="none"
                        checked={mailSmtpEncryption === 'none'}
                        onChange={(e) => {
                          setMailSmtpEncryption(e.target.value);
                          setMailSmtpPort('25');
                        }}
                        className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer" 
                      />
                      <span>None</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="encryption" 
                        value="ssl"
                        checked={mailSmtpEncryption === 'ssl'}
                        onChange={(e) => {
                          setMailSmtpEncryption(e.target.value);
                          setMailSmtpPort('465');
                        }}
                        className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer" 
                      />
                      <span>SSL</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="encryption" 
                        value="tls"
                        checked={mailSmtpEncryption === 'tls'}
                        onChange={(e) => {
                          setMailSmtpEncryption(e.target.value);
                          setMailSmtpPort('587');
                        }}
                        className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer" 
                      />
                      <span>TLS</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Cổng SMTP (SMTP Port)</label>
                  <input 
                    type="text"
                    value={mailSmtpPort}
                    onChange={(e) => setMailSmtpPort(e.target.value)}
                    placeholder="465"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer py-1.5">
                  <input 
                    type="checkbox"
                    checked={mailSmtpAuth === 'true'}
                    onChange={(e) => setMailSmtpAuth(e.target.checked ? 'true' : 'false')}
                    className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800">Yêu cầu xác thực SMTP (Authentication)</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-normal">Hầu hết mọi máy chủ SMTP chất lượng đều yêu cầu xác thực bảo mật.</p>
                  </div>
                </label>
              </div>

              {mailSmtpAuth === 'true' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Tên đăng nhập SMTP (SMTP Username)</label>
                    <input 
                      type="text"
                      value={mailSmtpUsername}
                      onChange={(e) => setMailSmtpUsername(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Thường là địa chỉ email đóng vai trò tài khoản gửi.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Mật khẩu SMTP (SMTP Password)</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={mailSmtpPassword}
                        onChange={(e) => setMailSmtpPassword(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 bg-transparent border-none cursor-pointer flex items-center justify-center"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Mật khẩu tài khoản hoặc <strong>Mật khẩu ứng dụng (App Password)</strong> đối với Gmail/Outlook.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          
          {/* Section 3: Notification Checkboxes */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
              <Bell size={18} className="text-indigo-500" /> Quản lý thông báo Email
            </h2>

            <div className="space-y-4">
              <p className="text-[10px] text-slate-400 leading-normal font-semibold mb-2">Lựa chọn các loại hành động sẽ tự động gửi email thông báo:</p>
              
              <div className="space-y-3.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={emailNotifyAdminComment === 'true'}
                    onChange={(e) => setEmailNotifyAdminComment(e.target.checked ? 'true' : 'false')}
                    className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800">[Admin] Bình luận mới</span>
                    <p className="text-[9px] text-slate-400 font-normal">Gửi mail báo Admin khi độc giả đăng bình luận cần phê duyệt.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={emailNotifyAdminUser === 'true'}
                    onChange={(e) => setEmailNotifyAdminUser(e.target.checked ? 'true' : 'false')}
                    className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800">[Admin] Thành viên mới</span>
                    <p className="text-[9px] text-slate-400 font-normal">Gửi mail báo Admin khi có tài khoản người dùng đăng ký mới.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={emailNotifyUserApproved === 'true'}
                    onChange={(e) => setEmailNotifyUserApproved(e.target.checked ? 'true' : 'false')}
                    className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800">[User] Bình luận được duyệt</span>
                    <p className="text-[9px] text-slate-400 font-normal">Thông báo cho độc giả khi bình luận của họ được Admin chấp thuận công khai.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={emailNotifyUserReply === 'true'}
                    onChange={(e) => setEmailNotifyUserReply(e.target.checked ? 'true' : 'false')}
                    className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800">[User] Phản hồi bình luận</span>
                    <p className="text-[9px] text-slate-400 font-normal">Thông báo cho độc giả khi có người trả lời (reply) bình luận của họ.</p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* Section 4: SMTP Test Console */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
              <Send size={18} className="text-indigo-500" /> Gửi email thử nghiệm
            </h2>

            <div className="space-y-4">
              <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                Nhập địa chỉ email nhận dưới đây để gửi thử nghiệm cấu hình SMTP đang nhập bên trái ngay lập tức (không cần lưu trước).
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5">Email người nhận</label>
                <div className="flex gap-2">
                  <input 
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="my-email@example.com"
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={isTesting || !testEmail}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 transition-all border-none"
                  >
                    {isTesting ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    <span>Gửi</span>
                  </button>
                </div>
              </div>

              {/* SMTP Test Console Result */}
              {testResult && (
                <div className="pt-2 animate-fade-in">
                  {testResult.success ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-2.5 items-start text-emerald-800">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-[11px] block">Thành công!</span>
                        <span className="text-[10px] leading-relaxed block font-medium mt-0.5">{testResult.message}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex gap-2.5 items-start text-rose-800">
                        <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-[11px] block">Gửi thư thất bại!</span>
                          <span className="text-[10px] leading-relaxed block font-medium mt-0.5">{testResult.error}</span>
                        </div>
                      </div>
                      
                      {/* Dark Terminal Error Console Logs */}
                      <div className="border border-slate-800 bg-slate-950 rounded-xl overflow-hidden shadow-lg">
                        <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800/80">
                          <span className="text-[9px] font-bold text-slate-400 font-mono flex items-center gap-1">
                            <Terminal size={10} /> SMTP DEBUG CONSOLE
                          </span>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-900/50">
                            ERR_CODE: {testResult.code || 'N/A'}
                          </span>
                        </div>
                        <div className="p-3.5 font-mono text-[9px] text-emerald-400 leading-normal max-h-48 overflow-auto whitespace-pre-wrap select-all">
                          <span className="text-slate-500 select-none">// Trace logs SMTP Server connection:</span>
                          <br />
                          <span className="text-rose-400 font-bold">Error:</span> {testResult.error}
                          {testResult.code && (
                            <>
                              <br />
                              <span className="text-amber-400">Code:</span> {testResult.code}
                            </>
                          )}
                          <br />
                          <span className="text-slate-500 select-none">-----------------------------------</span>
                          <br />
                          <span className="text-slate-400">Mẹo gỡ lỗi:</span>
                          <br />
                          - Nếu dùng <span className="text-indigo-400">Gmail</span>, đảm bảo đã bật <span className="text-white">Xác minh 2 bước</span> và sử dụng <span className="text-white">Mật khẩu ứng dụng (App Password)</span>.
                          <br />
                          - Kiểm tra lại cổng kết nối: SSL thường là <span className="text-indigo-400">465</span>, TLS thường là <span className="text-indigo-400">587</span>.
                          <br />
                          - Đảm bảo nhà cung cấp VPS/Server không chặn cổng gửi thư ra ngoài.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
