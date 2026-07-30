"use client";

import React, { use } from 'react';
import CapabilityGuard from '@/components/CapabilityGuard';
import PostEditorCore from '@/components/PostEditorCore';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPageProps) {
  const { id: rawId } = use(params);
  const postId = Number(rawId);

  return (
    <CapabilityGuard capability="edit_posts">
      <PostEditorCore 
        postType="POST"
        editId={postId}
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
