"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CapabilityGuard from '@/components/CapabilityGuard';
import { Plus, Search, Edit, Trash2, Shield, User as UserIcon, CheckSquare, Square } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'EDITOR' | 'SUBSCRIBER';
  createdAt: string;
  avatarUrl?: string;
  _count: {
    posts: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);

  // WordPress-style Filters & Bulk Actions
  const [roleTabFilter, setRoleTabFilter] = useState('all');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  const fetchUsersAndProfile = async () => {
    try {
      // Fetch users list
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }

      // Fetch active logged in user profile to label "(Bạn)"
      const profileRes = await fetch('/api/users/profile');
      const profileData = await profileRes.json();
      if (profileData.success && profileData.user) {
        setActiveProfileId(profileData.user.id);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndProfile();
  }, []);

  const handleDeleteUser = async (id: number, username: string) => {
    if (activeProfileId === id) {
      alert('Cảnh báo bảo mật: Bạn không thể tự xóa tài khoản quản trị chính đang đăng nhập của mình!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xoá tài khoản thành viên "${username}"? Thao tác này không thể hoàn tác!`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(users.filter(user => user.id !== id));
        setSelectedUserIds(selectedUserIds.filter(selectedId => selectedId !== id));
        alert('Đã xoá tài khoản người dùng thành công!');
      } else {
        alert(`Không thể xoá tài khoản: ${data.error}`);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error("Error deleting user:", error);
    }
  };

  // Bulk action apply
  const handleBulkActionApply = async () => {
    if (selectedUserIds.length === 0) {
      alert('Vui lòng chọn ít nhất một thành viên để áp dụng thao tác!');
      return;
    }

    if (bulkAction === 'delete') {
      // Filter out logged in user to prevent self-deletion
      const validIdsToDelete = selectedUserIds.filter(id => id !== activeProfileId);
      
      if (validIdsToDelete.length === 0) {
        alert('Cảnh báo bảo mật: Bạn đang chọn chính tài khoản đang đăng nhập! Không thể tự xóa.');
        return;
      }

      if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ${validIdsToDelete.length} tài khoản thành viên đã chọn?`)) {
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const id of validIdsToDelete) {
        try {
          const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE',
          });
          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
        }
      }

      await fetchUsersAndProfile();
      setSelectedUserIds([]);
      setBulkAction('');
      alert(`Đã hoàn tất thao tác hàng loạt: Xóa thành công ${successCount} thành viên${failCount > 0 ? `, thất bại ${failCount} mục` : ''}.`);
    } else {
      alert('Vui lòng chọn một hành động hợp lệ!');
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handleToggleSelectUser = (id: number) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  // Local real-time filtering
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = user.username.toLowerCase().includes(query) || 
                          user.email.toLowerCase().includes(query) || 
                          (user.name && user.name.toLowerCase().includes(query));
    
    const matchesRoleTab = roleTabFilter === 'all' || user.role === roleTabFilter;
    
    return matchesSearch && matchesRoleTab;
  });

  const getRoleBadge = (role: 'ADMIN' | 'EDITOR' | 'SUBSCRIBER') => {
    switch (role) {
      case 'ADMIN':
        return { text: 'Quản trị viên', classes: 'bg-indigo-50 text-indigo-700 border border-indigo-200/55' };
      case 'EDITOR':
        return { text: 'Biên tập viên', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200/55' };
      default:
        return { text: 'Đăng ký', classes: 'bg-slate-50 text-slate-500 border border-slate-200/55' };
    }
  };

  const getAvatarLetters = (user: User) => {
    const source = user.name || user.username;
    const parts = source.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return source.substring(0, 2).toUpperCase();
  };

  return (
    <CapabilityGuard capability="manage_users">
      <div className="max-w-6xl mx-auto font-sans text-[13px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <UserIcon size={24} className="text-indigo-600 animate-pulse" /> Thành viên hệ thống
          </h1>
          <p className="text-xs text-slate-500 mt-1">Quản lý và cấp quyền truy cập cho nhân viên, quản trị viên</p>
        </div>
        <Link 
          href="/admin/users/create" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] cursor-pointer text-xs animate-fade-in"
        >
          <Plus size={16} /> Thêm người dùng
        </Link>
      </div>

      {/* WordPress-style Quick Status Tabs */}
      <div className="flex items-center gap-3.5 mb-4 text-xs font-semibold text-slate-500">
        <button 
          onClick={() => setRoleTabFilter('all')} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            roleTabFilter === 'all' 
              ? 'text-indigo-600 border-indigo-600 font-bold' 
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          Tất cả <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded-full ml-0.5">{users.length}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button 
          onClick={() => setRoleTabFilter('ADMIN')} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            roleTabFilter === 'ADMIN' 
              ? 'text-indigo-600 border-indigo-600 font-bold' 
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          Quản trị viên <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded-full ml-0.5">{users.filter(u => u.role === 'ADMIN').length}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button 
          onClick={() => setRoleTabFilter('EDITOR')} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            roleTabFilter === 'EDITOR' 
              ? 'text-indigo-600 border-indigo-600 font-bold' 
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          Biên tập viên <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded-full ml-0.5">{users.filter(u => u.role === 'EDITOR').length}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button 
          onClick={() => setRoleTabFilter('SUBSCRIBER')} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            roleTabFilter === 'SUBSCRIBER' 
              ? 'text-indigo-600 border-indigo-600 font-bold' 
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          Đăng ký <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded-full ml-0.5">{users.filter(u => u.role === 'SUBSCRIBER').length}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Multi-layered Filters Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Bulk Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              value={bulkAction} 
              onChange={(e) => setBulkAction(e.target.value)} 
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white outline-none focus:border-indigo-500 text-slate-700 font-semibold cursor-pointer h-9 w-40"
            >
              <option value="">Thao tác hàng loạt</option>
              <option value="delete">Xóa tài khoản</option>
            </select>
            <button 
              onClick={handleBulkActionApply}
              className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2 border border-slate-200 rounded-lg text-xs cursor-pointer h-9 transition-colors hover:border-slate-300 active:scale-[0.98]"
            >
              Áp dụng
            </button>
            
            {selectedUserIds.length > 0 && (
              <span className="text-[11px] text-indigo-600 font-bold ml-1 animate-pulse">
                Đã chọn {selectedUserIds.length} mục
              </span>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo tên hiển thị, username hoặc email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs w-full h-9 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700 bg-white"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600 min-w-[700px]">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10 text-center font-semibold">
                  <button 
                    onClick={handleToggleSelectAll} 
                    className="focus:outline-none cursor-pointer flex items-center justify-center mx-auto"
                  >
                    {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? (
                      <CheckSquare size={16} className="text-indigo-600" />
                    ) : (
                      <Square size={16} className="text-slate-400 hover:text-indigo-600" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold min-w-[180px]">Tên người dùng</th>
                <th className="px-4 py-3 font-semibold min-w-[140px]">Tên hiển thị</th>
                <th className="px-4 py-3 font-semibold min-w-[200px]">Email</th>
                <th className="px-4 py-3 font-semibold w-40">Vai trò</th>
                <th className="px-4 py-3 font-semibold text-center w-28">Số bài viết</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-medium animate-pulse">
                    Đang tải dữ liệu thành viên...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-semibold">
                    Không tìm thấy thành viên nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const badge = getRoleBadge(user.role);
                  const isCurrent = activeProfileId === user.id;

                  return (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50 group transition-colors">
                      <td className="px-4 py-3.5 text-center">
                        <button 
                          onClick={() => handleToggleSelectUser(user.id)}
                          className="focus:outline-none cursor-pointer flex items-center justify-center mx-auto"
                        >
                          {selectedUserIds.includes(user.id) ? (
                            <CheckSquare size={16} className="text-indigo-600 animate-scale-in" />
                          ) : (
                            <Square size={16} className="text-slate-300 hover:text-indigo-600" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Gravatar / Letter Avatar */}
                          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm border border-indigo-200/40 bg-gradient-to-br from-indigo-50 to-indigo-100/50 flex items-center justify-center">
                            {user.avatarUrl ? (
                              <img 
                                src={user.avatarUrl} 
                                alt={user.username} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp';
                                }}
                              />
                            ) : (
                              <span className="font-bold text-xs text-indigo-700">
                                {getAvatarLetters(user)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-brand-600 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                              {user.username}
                              {isCurrent && (
                                <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  Bạn
                                </span>
                              )}
                            </p>
                            
                            {/* Hover Actions */}
                            <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link 
                                href={`/admin/users/edit/${user.id}`} 
                                className="text-brand-600 font-bold hover:text-indigo-600 hover:underline text-[11px] whitespace-nowrap"
                              >
                                Chỉnh sửa
                              </Link>
                              {!isCurrent && (
                                <>
                                  <span className="text-slate-300 text-[10px]">|</span>
                                  <button 
                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                    className="text-red-500 font-bold hover:text-red-700 hover:underline text-[11px] whitespace-nowrap cursor-pointer"
                                  >
                                    Xoá
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">{user.name || <span className="text-slate-300 font-normal italic">Chưa điền</span>}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-500">{user.email}</td>
                      <td className="px-4 py-3.5">
                        <span className={`font-semibold px-2.5 py-0.5 rounded-full text-[10px] ${badge.classes}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {user._count?.posts || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </CapabilityGuard>
  );
}
