"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CapabilityGuard from '@/components/CapabilityGuard';
import { ArrowLeft, Plus, Search, Tag as TagIcon } from 'lucide-react';

interface Tag {
  id: number;
  name: string;
  slug: string;
  type?: string;
  _count?: {
    posts: number;
  };
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add tag inputs
  const [nameInput, setNameInput] = useState('');
  const [slugInput, setSlugInput] = useState('');

  const fetchTags = async () => {
    try {
      const type = 'POST';
      const res = await fetch(`/api/tags?type=${type}`);
      const data = await res.json();
      if (data.success) {
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsSubmitting(true);
    try {
      const type = 'POST';
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput,
          slug: slugInput || undefined,
          type
        })
      });
      const data = await res.json();
      if (data.success) {
        setNameInput('');
        setSlugInput('');
        fetchTags();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa thẻ "${name}"? Các bài viết sẽ không còn liên kết với thẻ này nữa.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchTags();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const filteredTags = tags.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentType = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('type') || 'POST' : 'POST';

  return (
    <CapabilityGuard capability="manage_tags">
      <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={currentType === 'PRODUCT' ? '/admin/products' : '/admin/posts'} className="text-slate-500 hover:text-brand-600 transition-colors bg-white p-1.5 rounded-md border border-slate-200 hover:border-brand-200">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {currentType === 'PRODUCT' ? 'Thẻ sản phẩm' : 'Thẻ (Tags)'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Form: Add Tag */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 h-fit">
          <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 text-sm flex items-center gap-1.5">
            <Plus size={16} className="text-brand-500" /> Thêm thẻ mới
          </h3>
          <form onSubmit={handleAddTag} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Tên thẻ</label>
              <input 
                type="text" 
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ví dụ: Cambridge 18" 
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none text-slate-700 bg-white"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">Tên thẻ là cách nó xuất hiện trên trang web của bạn.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Đường dẫn thân thiện (Slug)</label>
              <input 
                type="text" 
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="cambridge-18" 
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none text-slate-700 bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">“slug” là đường dẫn thân thiện của tên. Nó thường chỉ bao gồm ký tự viết thường, số và dấu gạch ngang, không dùng tiếng Việt có dấu.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-lg font-semibold shadow-sm transition-all hover:shadow-brand-500/20 cursor-pointer disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> {isSubmitting ? 'Đang tạo...' : 'Thêm Thẻ Mới'}
            </button>
          </form>
        </div>

        {/* Right Table: Tags List */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[500px]">
          {/* Search bar */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Tìm kiếm thẻ..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-md text-xs w-full h-8 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-slate-700 bg-white"
              />
            </div>
            <div className="text-slate-400 text-xs font-medium">
              Tổng số: <span className="text-slate-600 font-bold">{tags.length}</span> thẻ bài viết
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-[13px] text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold min-w-[200px]">Tên thẻ</th>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold text-right">Số bài viết</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-slate-400 font-medium animate-pulse">
                      Đang tải danh sách thẻ...
                    </td>
                  </tr>
                ) : filteredTags.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-slate-400">
                      {searchQuery ? 'Không tìm thấy thẻ nào phù hợp.' : 'Chưa có thẻ nào.'}
                    </td>
                  </tr>
                ) : (
                  filteredTags.map((tag) => (
                    <tr key={tag.id} className="border-b border-slate-100 hover:bg-slate-50/50 group transition-all duration-150">
                      <td className="px-4 py-3.5 text-slate-800 align-top min-w-[200px] max-w-[280px]">
                        <div className="font-semibold text-slate-900 flex items-center">
                          <TagIcon size={14} className="text-slate-400 mr-1.5 shrink-0 inline" />
                          <span className="truncate">{tag.name}</span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[11px] font-semibold text-slate-400">
                          <Link
                            href={`/admin/posts/tags/edit/${tag.id}`}
                            className="text-brand-600 hover:text-brand-700 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Chỉnh sửa
                          </Link>
                          <span className="text-slate-300 select-none">|</span>
                          <button
                            onClick={() => handleDeleteTag(tag.id, tag.name)}
                            className="text-red-500 hover:text-red-600 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Xóa
                          </button>
                          <span className="text-slate-300 select-none">|</span>
                          <a
                            href={`/tag/${tag.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Xem ngoài web
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs align-top font-mono">
                        {tag.slug}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs align-top text-right font-semibold font-mono">
                        {tag._count?.posts ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </CapabilityGuard>
  );
}
