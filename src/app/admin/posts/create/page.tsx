"use client";

import React from 'react';
import CapabilityGuard from '@/components/CapabilityGuard';
import PostEditorCore from '@/components/PostEditorCore';

export default function PostCreatePage() {
  return (
    <CapabilityGuard capability="edit_posts">
      <PostEditorCore 
        postType="POST" 
        backUrl="/admin/posts" 
        backLabel="Bài viết" 
        createTitle="Thêm Bài Viết Mới" 
        editTitle="Chỉnh sửa bài viết" 
        showCategories={true}
        showTags={true}
      />
    </CapabilityGuard>
  );
}
