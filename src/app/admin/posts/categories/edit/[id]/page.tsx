"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Folder } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
}

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id: rawId } = use(params);
  const catId = Number(rawId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch all categories (to populate parent category select)
        const type = 'POST';
        const catRes = await fetch(`/api/categories?type=${type}`);
        const catData = await catRes.json();
        let dbCategories: Category[] = [];
        if (catData.success) {
          dbCategories = catData.categories || [];
          setCategories(dbCategories);
        }

        // 2. Fetch current category details
        const res = await fetch(`/api/categories/${catId}`);
        const data = await res.json();
        
        if (data.success && data.category) {
          setName(data.category.name || '');
          setSlug(data.category.slug || '');
          setParentId(data.category.parentId ? String(data.category.parentId) : '');
          setDescription(data.category.description || '');
        } else {
          alert('Không tìm thấy danh mục hoặc có lỗi xảy ra!');
        }
      } catch (error) {
        console.error("Failed to load category edit data:", error);
        alert('Lỗi tải dữ liệu danh mục!');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [catId]);

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/categories/${catId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          parentId: parentId ? Number(parentId) : null,
          description: description
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Cập nhật danh mục thành công!');
        window.location.href = '/admin/posts/categories';
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

  const getHierarchicalCategoriesWithDepth = (cats: Category[]) => {
    const list: (Category & { depth: number })[] = [];
    const parents = cats.filter(c => !c.parentId);
    const children = cats.filter(c => c.parentId);

    const appendChildren = (parentId: number, currentDepth: number) => {
      const directChildren = children.filter(c => c.parentId === parentId);
      directChildren.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      
      directChildren.forEach(child => {
        list.push({ ...child, depth: currentDepth });
        appendChildren(child.id, currentDepth + 1);
      });
    };

    parents.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    parents.forEach(p => {
      list.push({ ...p, depth: 0 });
      appendChildren(p.id, 1);
    });

    cats.forEach(c => {
      if (!list.some(item => item.id === c.id)) {
        list.push({ ...c, depth: 0 });
      }
    });

    return list;
  };

  const hierarchicalCategories = getHierarchicalCategoriesWithDepth(categories);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu danh mục...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto font-sans pb-12">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => {
            window.location.href = '/admin/posts/categories';
          }}
          className="text-slate-500 hover:text-brand-600 transition-colors bg-white p-1.5 rounded-md border border-slate-200 hover:border-brand-200"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Folder className="text-brand-500" size={24} /> Chỉnh sửa danh mục
        </h1>
      </div>

      <form onSubmit={handleUpdateCategory} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6 text-xs text-slate-700">
        {/* Name input */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          <label className="text-sm font-semibold text-slate-800 md:pt-2 md:text-left">Tên</label>
          <div className="md:col-span-3 space-y-1.5">
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-xl px-3.5 py-2 border border-slate-200 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-slate-700 bg-white"
              required
            />
            <p className="text-[10px] text-slate-400 leading-relaxed">Tên là cách nó xuất hiện trên trang web của bạn.</p>
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

        {/* Parent Category selector */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-t border-slate-100 pt-6">
          <label className="text-sm font-semibold text-slate-800 md:pt-2 md:text-left">Danh mục cha</label>
          <div className="md:col-span-3 space-y-1.5">
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full max-w-sm px-3.5 py-2 border border-slate-200 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-slate-700 bg-white font-medium cursor-pointer"
            >
              <option value="">Không có</option>
              {hierarchicalCategories
                // Prevent circular dependency: cannot set category as its own child
                .filter(c => c.id !== catId)
                .map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.depth > 0 ? '— '.repeat(cat.depth) : ''}{cat.name}
                  </option>
                ))}
            </select>
            <p className="text-[10px] text-slate-400 leading-relaxed">Chuyên mục khác với thẻ, bạn có thể sử dụng nhiều cấp chuyên mục. Ví dụ: Trong chuyên mục Nhạc, bạn có thể có chuyên mục con là Rock, Jazz. Việc này hoàn toàn là tùy theo ý bạn.</p>
          </div>
        </div>

        {/* Description textarea */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-t border-slate-100 pt-6">
          <label className="text-sm font-semibold text-slate-800 md:pt-2 md:text-left">Miêu tả</label>
          <div className="md:col-span-3 space-y-1.5">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full max-w-xl px-3.5 py-2.5 border border-slate-200 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-slate-700 bg-white resize-none"
              rows={6}
            />
            <p className="text-[10px] text-slate-400 leading-relaxed">Thông thường mô tả này không được sử dụng trong các giao diện, tuy nhiên có vài giao diện có thể hiển thị mô tả này.</p>
          </div>
        </div>

        {/* Submit action */}
        <div className="flex gap-4 md:col-start-2 md:col-span-3 pt-6 border-t border-slate-100 justify-end">
          <Link
            href="/admin/posts/categories"
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 transition-colors rounded-lg text-slate-600 text-xs font-semibold cursor-pointer text-center"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all hover:shadow-brand-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save size={14} /> {isUpdating ? 'Đang cập nhật...' : 'Cập nhật danh mục'}
          </button>
        </div>
      </form>
    </div>
  );
}
