"use client";

import React from 'react';
import AdminContentList from '@/components/AdminContentList';
import CapabilityGuard from '@/components/CapabilityGuard';

export default function AdminPagesPage() {
  return (
    <CapabilityGuard capability="edit_pages">
      <AdminContentList 
        type="PAGE" 
        title="Tất cả trang tĩnh" 
        description="Tạo và cấu hình các trang tĩnh như Giới thiệu, Liên hệ, Chính sách bảo mật..." 
      />
    </CapabilityGuard>
  );
}

