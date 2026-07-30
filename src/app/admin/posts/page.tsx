"use client";

import React from 'react';
import AdminContentList from '@/components/AdminContentList';
import CapabilityGuard from '@/components/CapabilityGuard';

export default function AdminPostsPage() {
  return (
    <CapabilityGuard capability="edit_posts">
      <AdminContentList 
        type="POST" 
        title="Tất cả bài viết" 
        description="Quản lý, tìm kiếm và tối ưu bài viết chuyên mục của website" 
      />
    </CapabilityGuard>
  );
}

