"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CapabilityGuard from '@/components/CapabilityGuard';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, EyeOff, UserCheck } from 'lucide-react';

export default function EditUserPage() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'EDITOR' | 'SUBSCRIBER'>('SUBSCRIBER');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);

  useEffect(() => {
    async function loadUserDetails() {
      if (!userId) return;
      try {
        // 1. Fetch active logged in user profile
        const profileRes = await fetch('/api/users/profile');
        const profileData = await profileRes.json();
        if (profileData.success && profileData.user) {
          setActiveProfileId(profileData.user.id);
        }

        // 2. Fetch specific user data
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        
        if (data.success && data.user) {
          setUsername(data.user.username);
          setEmail(data.user.email);
          setName(data.user.name || '');
          setRole(data.user.role);
        } else {
          alert('Không tìm thấy tài khoản người dùng!');
          router.push('/admin/users');
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        alert('Lỗi tải dữ liệu người dùng!');
      } finally {
        setIsLoading(false);
      }
    }
    loadUserDetails();
  }, [userId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      alert('Vui lòng nhập địa chỉ Email!');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          password: password.trim() !== '' ? password : undefined,
          role
        })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Đã cập nhật thông tin thành viên thành công!');
        router.push('/admin/users');
      } else {
        alert(`Lỗi: ${data.error}`);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const isCurrentSelf = activeProfileId === Number(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-slate-400 font-semibold text-xs animate-pulse">
        Đang tải dữ liệu thành viên...
      </div>
    );
  }

  return (
    <CapabilityGuard capability="manage_users">
      <div className="max-w-xl mx-auto font-sans text-[13px] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            <UserCheck size={18} className="text-indigo-600" /> Chỉnh sửa thành viên
          </h1>
          <p className="text-xs text-slate-400 font-medium">Chỉnh sửa phân quyền và cấu hình thông tin thành viên</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 font-semibold text-slate-700">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên tài khoản (Username)</label>
            <input 
              type="text" 
              value={username}
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed outline-none font-semibold"
            />
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Tên tài khoản không thể chỉnh sửa để đảm bảo tính toàn vẹn tác giả bài viết.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Địa chỉ Email <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              placeholder="nhanvien@lexi.vn..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên hiển thị (Name)</label>
            <input 
              type="text" 
              placeholder="Nguyễn Văn A..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Đặt lại Mật khẩu mới <span className="text-slate-400 font-medium">(Nhập nếu muốn đổi)</span></label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Nhập mật khẩu truy cập mới..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Bỏ trống trường này nếu không có nhu cầu thay đổi mật khẩu của thành viên.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vai trò thành viên</label>
            {isCurrentSelf ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-500 font-semibold select-none">
                Quản trị viên (Admin) - <span className="text-indigo-600 font-bold">Không thể hạ cấp quyền của chính mình</span>
              </div>
            ) : (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700"
              >
                <option value="SUBSCRIBER">Đăng ký (Subscriber) - Đọc nội dung</option>
                <option value="EDITOR">Biên tập viên (Editor) - Quản lý bài viết</option>
                <option value="ADMIN">Quản trị viên (Admin) - Toàn quyền hệ thống</option>
              </select>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <Link 
              href="/admin/users"
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 font-bold py-2.5 rounded-lg text-center transition-all cursor-pointer block active:scale-[0.98]"
            >
              Hủy bỏ
            </Link>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              <Save size={16} />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>

        </form>
      </div>

      </div>
    </CapabilityGuard>
  );
}
