"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Tag as TagIcon } from 'lucide-react';

interface EditTagPageProps {
  params: Promise<{ id: string }>;
}

export default function EditTagPage({ params }: EditTagPageProps) {
  const { id: rawId } = use(params);
  const tagId = Number(rawId);

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/tags/${tagId}`);
        const data = await res.json();
        
        if (data.success && data.tag) {
          setName(data.tag.name || '');
          setSlug(data.tag.slug || '');
        } else {
          alert('Không tìm thấy thẻ hoặc có lỗi xảy ra!');
        }
      } catch (error) {
        console.error("Failed to load tag edit data:", error);
        alert('Lỗi tải dữ liệu thẻ!');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [tagId]);

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Cập nhật thẻ thành công!');
        window.location.href = '/admin/posts/tags';
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu thẻ...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto font-sans pb-12">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => {
            window.location.href = '/admin/posts/tags';
          }}
          className="text-slate-500 hover:text-brand-600 transition-colors bg-white p-1.5 rounded-md border border-slate-200 hover:border-brand-200"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <TagIcon className="text-brand-500" size={24} /> Chỉnh sửa thẻ
        </h1>
      </div>

      <form onSubmit={handleUpdateTag} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6 text-xs text-slate-700">
        {/* Name input */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          <label className="text-sm font-semibold text-slate-800 md:pt-2 md:text-left">Tên thẻ</label>
          <div className="md:col-span-3 space-y-1.5">
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-xl px-3.5 py-2 border border-slate-200 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-slate-700 bg-white"
              required
            />
            <p className="text-[10px] text-slate-400 leading-relaxed">Tên thẻ là cách nó xuất hiện trên trang web của bạn.</p>
          </div>
        </div>

        {/* Slug input */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-t border-slate-100 pt-6">
          <label className="text-sm font-semibold text-slate-800 md:pt-2 md:text-left">Đường dẫn thân thiện (Slug)</label>
          <div className="md:col-span-3 space-y-1.5 font-mono">
            <input 
              type="text" 
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full max-w-xl px-3.5 py-2 border border-slate-200 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-slate-700 bg-white"
            />
            <p className="text-[10px] text-slate-400 font-sans leading-relaxed font-normal">“slug” là đường dẫn thân thiện của tên. Nó thường chỉ bao gồm kí tự viết thường, số và dấu gạch ngang, không dùng tiếng Việt có dấu.</p>
          </div>
        </div>

        {/* Submit action */}
        <div className="flex gap-4 md:col-start-2 md:col-span-3 pt-6 border-t border-slate-100 justify-end">
          <Link
            href="/admin/posts/tags"
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 transition-colors rounded-lg text-slate-600 text-xs font-semibold cursor-pointer text-center"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all hover:shadow-brand-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save size={14} /> {isUpdating ? 'Đang cập nhật...' : 'Cập nhật thẻ'}
          </button>
        </div>
      </form>
    </div>
  );
}
