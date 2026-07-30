"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CapabilityGuard from '@/components/CapabilityGuard';
import { ArrowLeft, Plus, Search, Folder } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  type?: string;
  _count?: {
    posts: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add category inputs
  const [nameInput, setNameInput] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [parentIdInput, setParentIdInput] = useState<string>('');
  const [descriptionInput, setDescriptionInput] = useState('');

  const [defaultCategoryId, setDefaultCategoryId] = useState<number | null>(null);

  const fetchCategories = async () => {
    try {
      const type = 'PRODUCT';
      const res = await fetch(`/api/categories?type=${type}&counts=true`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }

      // Fetch default category setting
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.settings?.default_category_id) {
        setDefaultCategoryId(Number(settingsData.settings.default_category_id));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsSubmitting(true);
    try {
      const type = 'PRODUCT';
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput,
          slug: slugInput || undefined,
          parentId: parentIdInput ? Number(parentIdInput) : null,
          description: descriptionInput,
          type
        })
      });
      const data = await res.json();
      if (data.success) {
        setNameInput('');
        setSlugInput('');
        setParentIdInput('');
        setDescriptionInput('');
        fetchCategories();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"? Các danh mục con (nếu có) sẽ tự động được chuyển thành danh mục không có cha.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
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

  // Search logic preserving the indentation structure or showing simple matches
  const filteredCategories = searchQuery.trim() === ''
    ? hierarchicalCategories
    : hierarchicalCategories.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const currentType = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('type') || 'POST' : 'POST';

  return (
    <CapabilityGuard capability="manage_categories">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={currentType === 'PRODUCT' ? '/admin/products' : '/admin/posts'} className="text-slate-500 hover:text-brand-600 transition-colors bg-white p-1.5 rounded-md border border-slate-200 hover:border-brand-200">
            <ArrowLeft size={16} />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {currentType === 'PRODUCT' ? 'Danh mục sản phẩm' : 'Danh mục'}
          </h1>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Form: Add Category */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 h-fit">
          <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 text-sm flex items-center gap-1.5">
            <Plus size={16} className="text-brand-500" /> Thêm danh mục mới
          </h3>
          <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Tên danh mục</label>
              <input 
                type="text" 
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ví dụ: Dịch vụ mua hộ" 
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none text-slate-700 bg-white"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">Tên danh mục là cách nó xuất hiện trên trang web của bạn.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Đường dẫn thân thiện (Slug)</label>
              <input 
                type="text" 
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="dich-vu-mua-ho" 
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none text-slate-700 bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">“slug” là đường dẫn thân thiện của tên. Nó thường chỉ bao gồm ký tự viết thường, số và dấu gạch ngang, không dùng tiếng Việt có dấu.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Danh mục cha</label>
              <select
                value={parentIdInput}
                onChange={(e) => setParentIdInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none text-slate-700 bg-white"
              >
                <option value="">Không có</option>
                {hierarchicalCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.depth > 0 ? '— '.repeat(cat.depth) : ''}{cat.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Chuyên mục khác với thẻ, bạn có thể sử dụng nhiều cấp chuyên mục. Ví dụ: Trong chuyên mục Nhạc, bạn có thể có chuyên mục con là Rock, Jazz. Việc này hoàn toàn là tùy theo ý bạn.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Mô tả</label>
              <textarea 
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Mô tả cho danh mục này..." 
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none text-slate-700 bg-white resize-none"
                rows={4}
              />
              <p className="text-[10px] text-slate-400 mt-1">Thông thường mô tả này không được sử dụng trong các giao diện, tuy nhiên có vài giao diện có thể hiển thị mô tả này.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-lg font-semibold shadow-sm transition-all hover:shadow-brand-500/20 cursor-pointer disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> {isSubmitting ? 'Đang tạo...' : 'Thêm Danh Mục'}
            </button>
          </form>
        </div>

        {/* Right Table: Categories List */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[500px]">
          {/* Search bar */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Tìm kiếm danh mục..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-md text-xs w-full h-8 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all text-slate-700 bg-white"
              />
            </div>
            <div className="text-slate-400 text-xs font-medium">
              Tổng số: <span className="text-slate-600 font-bold">{categories.length}</span> danh mục
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-[13px] text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold min-w-[240px]">Tên danh mục</th>
                  <th className="px-4 py-3 font-semibold">Mô tả</th>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold text-right">Số bài viết</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400 font-medium animate-pulse">
                      Đang tải danh mục...
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                      {searchQuery ? 'Không tìm thấy danh mục nào phù hợp.' : 'Chưa có danh mục nào.'}
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50/50 group transition-all duration-150">
                      <td className="px-4 py-3.5 text-slate-800 align-top min-w-[240px] max-w-[320px]">
                        <div className="font-semibold text-slate-900 flex items-center">
                          {cat.depth > 0 && (
                            <span className="text-slate-300 mr-1.5 select-none font-light">
                              {'—'.repeat(cat.depth)}
                            </span>
                          )}
                          <Folder size={14} className="text-slate-400 mr-1.5 shrink-0 inline" />
                          <span className="truncate">{cat.name}</span>
                          {cat.id === defaultCategoryId && (
                            <span className="ml-2 bg-indigo-50 border border-indigo-200/50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide">
                              Mặc định
                            </span>
                          )}
                        </div>
                        {/* Inline Actions visible on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[11px] font-semibold text-slate-400">
                          <Link
                            href={`/admin/products/categories/edit/${cat.id}`}
                            className="text-brand-600 hover:text-brand-700 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Chỉnh sửa
                          </Link>
                          {cat.id !== defaultCategoryId && (
                            <>
                              <span className="text-slate-300 select-none">|</span>
                              <button
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                className="text-red-500 hover:text-red-600 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                Xóa
                              </button>
                            </>
                          )}
                          <span className="text-slate-300 select-none">|</span>
                          <Link
                            href={`/admin/posts?category=${cat.id}`}
                            className="text-slate-500 hover:text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Lọc bài viết
                          </Link>
                          <span className="text-slate-300 select-none">|</span>
                          <a
                            href={cat.type === 'PRODUCT' ? `/danh-muc-san-pham/${cat.slug}` : `/category/${cat.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Xem ngoài web
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs align-top whitespace-pre-wrap max-w-[280px]">
                        {cat.description || <span className="text-slate-300 italic">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs align-top font-mono">
                        {cat.slug}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs align-top text-right font-semibold font-mono">
                        {cat._count?.posts ?? 0}
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
