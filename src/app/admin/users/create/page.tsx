"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import CapabilityGuard from '@/components/CapabilityGuard';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, EyeOff, UserPlus } from 'lucide-react';

export default function CreateUserPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'EDITOR' | 'SUBSCRIBER'>('SUBSCRIBER');

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      alert('Vui lòng điền đầy đủ các trường Tên tài khoản, Email và Mật khẩu!');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          name: name.trim() || undefined,
          password: password,
          role
        })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Đã tạo mới thành viên thành công!');
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
            <UserPlus size={18} className="text-indigo-600" /> Thêm thành viên mới
          </h1>
          <p className="text-xs text-slate-400 font-medium">Tạo tài khoản và cấp quyền cho thành viên mới</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 font-semibold text-slate-700">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên tài khoản (Username) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="Nhập tên tài khoản (viết liền không dấu)..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Địa chỉ Email <span className="text-red-500">*</span></label>
            <input 
              type="email" 
              placeholder="vi-du: nhanvien@lexi.vn..."
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
              placeholder="Nhập họ và tên hiển thị (ví dụ: Nguyễn Văn A)..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mật khẩu <span className="text-red-500">*</span></label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Nhập mật khẩu truy cập..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-semibold text-slate-800"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vai trò thành viên</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none cursor-pointer focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700"
            >
              <option value="SUBSCRIBER">Đăng ký (Subscriber) - Đọc nội dung</option>
              <option value="EDITOR">Biên tập viên (Editor) - Quản lý bài viết</option>
              <option value="ADMIN">Quản trị viên (Admin) - Toàn quyền hệ thống</option>
            </select>
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
              {isSaving ? 'Đang tạo...' : 'Tạo thành viên'}
            </button>
          </div>

        </form>
      </div>

      </div>
    </CapabilityGuard>
  );
}
