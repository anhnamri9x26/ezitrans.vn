"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import GrapesEditor from '@/components/GrapesEditor';

export default function BuilderPage() {
  const params = useParams();
  const pageId = params.id as string;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [postData, setPostData] = useState<any>(null);

  useEffect(() => {
    async function loadPageDetails() {
      if (!pageId) return;
      try {
        const response = await fetch(`/api/posts/${pageId}`);
        const data = await response.json();
        
        if (data.success && data.post) {
          setPostData(data.post);
        } else {
          alert('Không tìm thấy trang hoặc đã xảy ra lỗi!');
          router.push('/admin/pages');
        }
      } catch (error) {
        console.error('Failed to load page data:', error);
        alert('Có lỗi xảy ra khi tải dữ liệu.');
      } finally {
        setIsLoading(false);
      }
    }
    loadPageDetails();
  }, [pageId, router]);

  const handleSaveFromGrapes = async (compiledHtml: string, projectDataJson: string, pageSettings: any) => {
    if (!postData) return;
    
    const nextPageLayout = pageSettings?.pageLayout ?? postData.pageLayout ?? 'THEME_DEFAULT';
    const nextContentWidth = pageSettings?.contentWidth ?? postData.contentWidth ?? 'BOXED';
    const nextContentMaxWidth = pageSettings?.contentMaxWidth ?? postData.contentMaxWidth ?? '1200px';

    const payload = {
      id: Number(pageId),
      title: postData.title,
      slug: postData.slug,
      content: compiledHtml,
      status: postData.status,
      type: postData.type,
      parentId: postData.parentId,
      featuredImageId: postData.featuredImage?.id,
      visibility: postData.visibility,
      publishedAt: postData.publishedAt,
      seoTitle: postData.seoTitle,
      seoDescription: postData.seoDescription,
      seoKeywords: postData.seoKeywords,
      builderData: projectDataJson,
      pageLayout: nextPageLayout,
      contentWidth: nextContentWidth,
      contentMaxWidth: nextContentMaxWidth,
    };

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.success) {
        // Update local state to reflect new settings
        setPostData({
          ...postData,
          builderData: projectDataJson,
          content: compiledHtml,
          pageLayout: nextPageLayout,
          contentWidth: nextContentWidth,
          contentMaxWidth: nextContentMaxWidth
        });
      } else {
        alert(`Lỗi: ${data.error}`);
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error saving from builder:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white fixed inset-0 z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
          <span className="text-lg font-medium animate-pulse text-slate-300">Đang khởi tạo trình thiết kế...</span>
        </div>
      </div>
    );
  }

  if (!postData) return null;

  return (
    <GrapesEditor
      initialContent={postData.content || ''}
      initialData={postData.builderData || ''}
      pageTitle={postData.title || 'Trang không có tiêu đề'}
      postId={Number(pageId)}
      initialPageLayout={postData.pageLayout || 'THEME_DEFAULT'}
      initialContentWidth={postData.contentWidth || 'BOXED'}
      initialContentMaxWidth={postData.contentMaxWidth || '1200px'}
      onSave={handleSaveFromGrapes}
      onPreview={() => { window.open(`/${postData.slug}`, '_blank'); }}
      onClose={() => { window.location.href = `/admin/pages/edit/${pageId}`; }}
    />
  );
}
