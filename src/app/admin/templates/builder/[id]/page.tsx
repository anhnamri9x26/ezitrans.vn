"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import GrapesEditor from '@/components/GrapesEditor';
import CapabilityGuard from '@/components/CapabilityGuard';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

interface Condition {
  id?: number;
  conditionType: 'INCLUDE' | 'EXCLUDE';
  targetType: string;
  targetId?: number | null;
  targetSlug?: string | null;
}

interface Template {
  id: number;
  name: string;
  type: string;
  status: string;
  componentFile?: string | null;
  htmlContent?: string | null;
  cssContent?: string | null;
  builderData?: string | null;
  isDefault: boolean;
  priority: number;
  createdAt: string;
  conditions: Condition[];
}

async function safeJson(res: Response) {
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Phản hồi không phải JSON hợp lệ (Mã HTTP: ${res.status}). Bắt đầu bằng: ${text.substring(0, 200)}...`);
  }
  return res.json();
}

export default function TemplateBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const returnTo = searchParams.get('returnTo') || '';

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchTemplateDetails();
  }, [id]);

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  async function fetchTemplateDetails() {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates?id=${id}`);
      const data = await safeJson(res);
      if (data.success && data.template) {
        setTemplate(data.template);
      } else {
        showAlert('error', data.error || 'Không tìm thấy template');
        setTimeout(() => router.push('/admin/templates'), 2000);
      }
    } catch (err) {
      console.error('Error fetching template detail:', err);
      showAlert('error', 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (
    compiledHtml: string,
    projectDataJson: string,
    pageSettings?: any,
    commitMessage?: string,
    revisionName?: string,
    isStarred?: boolean
  ) => {
    if (!template) return;
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: template.id,
          htmlContent: compiledHtml,
          builderData: projectDataJson,
          commitMessage,
          revisionName,
          isStarred,
        }),
      });
      const data = await safeJson(res);
      if (data.success) {
        showAlert('success', 'Đã lưu thiết kế Template thành công!');
        // Update local template state to keep sync
        setTemplate(prev => prev ? {
          ...prev,
          htmlContent: compiledHtml,
          builderData: projectDataJson
        } : null);
      } else {
        showAlert('error', data.error || 'Lỗi khi lưu thiết kế');
      }
    } catch (err) {
      showAlert('error', 'Lỗi kết nối máy chủ');
    }
  };

  const saveTemplateContent = async (
    compiledHtml: string,
    projectDataJson: string,
    options?: { status?: string; commitMessage?: string; revisionName?: string; isStarred?: boolean }
  ) => {
    if (!template) return null;
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        id: template.id,
        htmlContent: compiledHtml,
        builderData: projectDataJson,
        ...(options?.status ? { status: options.status } : {}),
        ...(options?.commitMessage ? { commitMessage: options.commitMessage } : {}),
        ...(options?.revisionName ? { revisionName: options.revisionName } : {}),
        ...(options?.isStarred !== undefined ? { isStarred: options.isStarred } : {}),
      }),
    });
    const data = await safeJson(res);
    if (!data.success) {
      throw new Error(data.error || 'Lỗi khi lưu template');
    }
    setTemplate(prev => prev ? {
      ...prev,
      ...(data.template || {}),
      htmlContent: compiledHtml,
      builderData: projectDataJson,
    } : null);
    return data;
  };

  const handleSaveDraft = async (
    compiledHtml: string,
    projectDataJson: string,
    pageSettings?: any,
    commitMessage?: string,
    revisionName?: string,
    isStarred?: boolean
  ) => {
    await saveTemplateContent(compiledHtml, projectDataJson, {
      status: 'INACTIVE',
      commitMessage,
      revisionName,
      isStarred,
    });
    showAlert('success', 'Đã lưu nháp template!');
  };

  const handlePreview = async (compiledHtml: string, projectDataJson: string) => {
    if (!template) return;
    const templateId = template.id;
    await saveTemplateContent(compiledHtml, projectDataJson);
    const previewUrl = `/template-preview/${templateId}`;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Đang tải template...</span>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center space-y-4 text-white">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <span className="text-sm font-bold">Không tìm thấy template hoặc có lỗi xảy ra</span>
      </div>
    );
  }

  return (
    <CapabilityGuard capability="manage_templates">
      <div className="relative w-full h-screen bg-slate-950">
      {/* Alert Component inside builder */}
      {alert && (
        <div className={`fixed top-20 right-4 z-[10000] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 ${
          alert.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">{alert.text}</span>
        </div>
      )}
      <GrapesEditor
        initialContent={template.htmlContent || ''}
        initialData={template.builderData || ''}
        pageTitle={template.name || 'Template không có tiêu đề'}
        templateType={template.type}
        templateId={template.id}
        backLabel={returnTo ? "Quay lại Page" : undefined}
        onSave={handleSave}
        onSaveDraft={handleSaveDraft}
        onPreview={handlePreview}
        initialPageLayout={template.type === 'HEADER' || template.type === 'FOOTER' ? 'CANVAS' : undefined}
        onClose={() => router.push(returnTo || '/admin/templates')}
        onAutoSave={async (compiledHtml, projectDataJson) => {
          try {
            const res = await fetch('/api/templates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update',
                id: template.id,
                htmlContent: compiledHtml,
                builderData: projectDataJson,
              }),
            });
            const data = await safeJson(res);
            if (data.success) {
              setTemplate(prev => prev ? {
                ...prev,
                htmlContent: compiledHtml,
                builderData: projectDataJson
              } : null);
              return true;
            }
            return false;
          } catch (err) {
            console.error('Autosave fetch failed:', err);
            return false;
          }
        }}
      />
      </div>
    </CapabilityGuard>
  );
}
