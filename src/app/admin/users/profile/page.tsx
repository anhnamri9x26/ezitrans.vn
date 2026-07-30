"use client";

import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Shield, Key, CheckCircle, AlertCircle, Save, Smartphone, QrCode } from 'lucide-react';
import CapabilityGuard from '@/components/CapabilityGuard';

export default function UserProfilePage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [otpVerifyToken, setOtpVerifyToken] = useState('');
  const [isSettingUp2fa, setIsSettingUp2fa] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  
  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      const data = await response.json();
      if (data.success && data.user) {
        setUsername(data.user.username);
        setEmail(data.user.email);
        setName(data.user.name || '');
        setRole(data.user.role);
        setAvatarUrl(data.user.avatarUrl || '');
        setTwoFactorEnabled(data.user.twoFactorEnabled || false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      alert('Vui lòng nhập địa chỉ Email!');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert('Định dạng Email không hợp lệ!');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined
        })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Đã cập nhật thông tin cá nhân thành công!');
        fetchProfile();
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (error) {
      alert('Không thể kết nối máy chủ!');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      alert('Vui lòng nhập đầy đủ các trường thông tin mật khẩu!');
      return;
    }

    // Password strength check
    if (newPassword.length < 6) {
      alert('Mật khẩu mới phải chứa ít nhất 6 ký tự!');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp nhau!');
      return;
    }

    setIsChangingPass(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          oldPassword,
          newPassword
        })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Đã đổi mật khẩu cá nhân thành công!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (error) {
      alert('Không thể kết nối máy chủ!');
      console.error(error);
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setQrCodeDataUrl(data.qrCode);
        setTwoFactorSecret(data.secret);
        setIsSettingUp2fa(true);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerifyToken) return;
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: otpVerifyToken })
      });
      const data = await res.json();
      if (data.success) {
        alert('Cài đặt 2FA thành công!');
        setTwoFactorEnabled(true);
        setIsSettingUp2fa(false);
        setRecoveryCodes(data.recoveryCodes);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Bạn có chắc muốn tắt 2FA? Tài khoản của bạn sẽ kém an toàn hơn.')) return;
    try {
      const res = await fetch('/api/auth/2fa/disable', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Đã tắt 2FA');
        setTwoFactorEnabled(false);
        setRecoveryCodes([]);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const getRoleLabel = (r: string) => {
    if (r === 'ADMIN') return 'Quản trị viên (Admin)';
    if (r === 'EDITOR') return 'Biên tập viên (Editor)';
    return 'Thành viên Đăng ký (Subscriber)';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-semibold text-xs animate-pulse">
        Đang tải hồ sơ tài khoản...
      </div>
    );
  }

  return (
    <CapabilityGuard capability="edit_profile">
      <div className="max-w-4xl mx-auto font-sans text-[13px] animate-fade-in">
      {/* Profile Header Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <UserIcon size={24} className="text-indigo-600" /> Hồ sơ cá nhân
        </h1>
        <p className="text-xs text-slate-500 mt-1">Cấu hình thông tin tài khoản hiển thị và đổi mật khẩu của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Display overview card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col items-center text-center">
            {/* Avatar Circle */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-brand-500 text-white font-extrabold text-xl flex items-center justify-center shadow-md select-none overflow-hidden border border-slate-100">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name || username} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp';
                  }}
                />
              ) : (
                name ? name.substring(0, 2).toUpperCase() : username.substring(0, 2).toUpperCase()
              )}
            </div>
            
            <h2 className="text-base font-bold text-slate-800 mt-4 leading-tight">
              {name || username}
            </h2>
            <p className="text-slate-400 font-semibold text-[11px] mt-1">@{username}</p>

            <div className="mt-5 w-full pt-4 border-t border-slate-100 flex flex-col items-start space-y-2.5 text-slate-600 font-semibold text-xs">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-slate-400 shrink-0" />
                <span className="text-slate-500">Quyền:</span>
                <span className="text-indigo-600 font-bold">{role}</span>
              </div>
              <div className="flex items-center gap-2 w-full truncate">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-700 truncate font-semibold" title={email}>{email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Configuration Forms */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Box 1: Profile Details Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold border-b border-slate-100 pb-2 flex items-center gap-2 text-slate-800 mb-4">
              <UserIcon size={16} className="text-indigo-600" /> Thông tin cá nhân
            </h3>

            <form onSubmit={handleUpdateDetails} className="space-y-4 font-semibold text-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên tài khoản (Username)</label>
                <input 
                  type="text" 
                  value={username} 
                  disabled 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed outline-none font-semibold"
                />
                <p className="text-[10px] text-slate-400 font-medium mt-1">Tên tài khoản cố định và không thể thay đổi.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên hiển thị (Name)</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Địa chỉ Email <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@lexi.vn..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vai trò hệ thống</label>
                <input 
                  type="text" 
                  value={getRoleLabel(role)} 
                  disabled 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed outline-none font-semibold"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-center flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  <Save size={15} />
                  {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>

          {/* Box 2: Secure Password Changer */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold border-b border-slate-100 pb-2 flex items-center gap-2 text-slate-800 mb-4">
              <Key size={16} className="text-indigo-600" /> Đổi mật khẩu bảo mật
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4 font-semibold text-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mật khẩu hiện tại (Cũ) <span className="text-red-500">*</span></label>
                <input 
                  type="password" 
                  placeholder="Nhập mật khẩu hiện tại của bạn..."
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mật khẩu mới <span className="text-red-500">*</span></label>
                  <input 
                    type="password" 
                    placeholder="Nhập mật khẩu mới..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Xác nhận mật khẩu mới <span className="text-red-500">*</span></label>
                  <input 
                    type="password" 
                    placeholder="Nhập lại mật khẩu mới..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  disabled={isChangingPass}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-center flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  <Key size={15} />
                  {isChangingPass ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>

          {/* Box 3: 2FA Changer */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold border-b border-slate-100 pb-2 flex items-center gap-2 text-slate-800 mb-4">
              <Smartphone size={16} className="text-indigo-600" /> Xác thực 2 bước (2FA)
            </h3>

            {twoFactorEnabled ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-green-800">2FA đang được bật</h4>
                    <p className="text-xs text-green-700 mt-1">Tài khoản của bạn đã được bảo vệ bằng mã xác thực 2 bước.</p>
                  </div>
                </div>

                {recoveryCodes.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <h4 className="font-bold text-yellow-800 flex items-center gap-2 mb-2">
                      <AlertCircle size={16} /> Mã phục hồi (Lưu lại ngay!)
                    </h4>
                    <p className="text-xs text-yellow-700 mb-3">Lưu các mã này vào nơi an toàn. Dùng khi bạn mất điện thoại.</p>
                    <div className="grid grid-cols-2 gap-2">
                      {recoveryCodes.map(code => (
                        <div key={code} className="bg-white p-2 rounded text-center font-mono text-sm border border-yellow-200 font-bold text-slate-700">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleDisable2FA}
                  className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 transition-colors"
                >
                  Tắt 2FA
                </button>
              </div>
            ) : isSettingUp2fa ? (
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <p className="text-xs text-slate-500 font-semibold mb-2">1. Quét mã QR này bằng ứng dụng Authenticator (Google Authenticator, Authy, ...)</p>
                {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" className="border p-2 rounded-lg bg-white" />}
                
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">2. Nhập mã 6 số từ ứng dụng</label>
                  <input 
                    type="text" 
                    value={otpVerifyToken}
                    onChange={e => setOtpVerifyToken(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800 font-mono"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700">
                    Xác nhận
                  </button>
                  <button type="button" onClick={() => setIsSettingUp2fa(false)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200">
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-4">Xác thực 2 bước tăng cường bảo mật cho tài khoản của bạn. Bạn sẽ cần nhập mã từ ứng dụng điện thoại mỗi khi đăng nhập.</p>
                <button 
                  onClick={handleSetup2FA}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <QrCode size={16} /> Bật 2FA
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
      </div>
    </CapabilityGuard>
  );
}
