"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, MessageSquare, Shield, Mail, Globe, Eye, ExternalLink } from 'lucide-react';
import { generatePostUrl } from '@/lib/permalink';

export default function ProductReviewEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [authorUrl, setAuthorUrl] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'SPAM' | 'TRASH'>('PENDING');
  const [postTitle, setPostTitle] = useState('');
  const [postSlug, setPostSlug] = useState('');
  const [postRealId, setPostRealId] = useState<number | null>(null);
  const [postLegacyId, setPostLegacyId] = useState<number | null>(null);
  const [postCreatedAt, setPostCreatedAt] = useState('');
  const [permalinkStructure, setPermalinkStructure] = useState('/%postname%.html');

  useEffect(() => {
    const fetchCommentDetails = async () => {
      try {
        const res = await fetch(`/api/comments/${id}`);
        const data = await res.json();
        if (data.success && data.comment) {
          const c = data.comment;
          setAuthorName(c.authorName);
          setAuthorEmail(c.authorEmail);
          setAuthorUrl(c.authorUrl || '');
          setContent(c.content);
          setRating(c.rating || 0);
          setStatus(c.status);
          setPostTitle(c.post?.title || '');
          setPostSlug(c.post?.slug || '');
          setPostRealId(c.post?.id || null);
          setPostLegacyId(c.post?.legacyId || null);
          setPostCreatedAt(c.post?.createdAt || c.createdAt || '');
        } else {
          alert('Lỗi: ' + (data.error || 'Không tìm thấy bình luận'));
          router.push('/admin/comments');
        }

        // Fetch settings for permalink structure
        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          if (settingsData.settings.permalink_structure) {
            setPermalinkStructure(settingsData.settings.permalink_structure);
          }
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi kết nối máy chủ!');
        router.push('/admin/comments');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCommentDetails();
    }
  }, [id, router]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !authorEmail.trim() || !content.trim()) {
      alert('Vui lòng điền đầy đủ Tên, Email và Nội dung bình luận!');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail.trim())) {
      alert('Định dạng Email không hợp lệ!');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName,
          authorEmail,
          authorUrl: authorUrl.trim() || null,
          content,
          rating: rating || null,
          status
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Cập nhật chi tiết bình luận thành công!');
        router.push('/admin/comments');
        router.refresh();
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (err) {
      alert('Không thể kết nối máy chủ!');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-semibold text-xs animate-pulse">
        Đang tải thông tin bình luận chi tiết...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto font-sans text-[13px] animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <Link 
          href="/admin/products/reviews" 
          className="text-slate-500 hover:text-brand-600 transition-colors bg-white p-1.5 rounded-md border border-slate-200 hover:border-brand-200"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Chỉnh sửa Đánh giá sản phẩm
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thay đổi chi tiết tác giả, trạng thái kiểm duyệt, và nội dung phản hồi của mã #{id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Form Details */}
        <form onSubmit={handleFormSubmit} className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold border-b border-slate-100 pb-2 flex items-center gap-2 text-slate-800">
              <MessageSquare size={16} className="text-indigo-600" /> Nội dung & Tác giả
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-semibold text-slate-700">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  Tên tác giả <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Tên người bình luận..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    placeholder="email@example.com..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 font-semibold"
                    required
                  />
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="font-semibold text-slate-700">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Phản hồi Url (Website)
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={authorUrl}
                  onChange={(e) => setAuthorUrl(e.target.value)}
                  placeholder="http://example.com..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 font-semibold"
                />
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="font-semibold text-slate-700">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nội dung bình luận <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung bình luận..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 font-semibold h-44 resize-none leading-relaxed"
                required
              />
            </div>

            <div className="font-semibold text-slate-700">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Đánh giá (Số sao)
              </label>
              <select 
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-slate-800 font-semibold cursor-pointer"
              >
                <option value={0}>Không đánh giá</option>
                <option value={5}>5 sao ⭐️⭐️⭐️⭐️⭐️</option>
                <option value={4}>4 sao ⭐️⭐️⭐️⭐️</option>
                <option value={3}>3 sao ⭐️⭐️⭐️</option>
                <option value={2}>2 sao ⭐️⭐️</option>
                <option value={1}>1 sao ⭐️</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link 
              href="/admin/products/reviews"
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-all text-center text-xs cursor-pointer flex items-center justify-center"
            >
              Hủy bỏ
            </Link>
            <button 
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-center flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98] text-xs"
            >
              <Save size={15} />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>

        {/* Right Side: Sidebar Meta Info */}
        <div className="md:col-span-1 space-y-6">
          {/* Moderation Settings */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold border-b border-slate-100 pb-2 flex items-center gap-2 text-slate-800">
              <Shield size={16} className="text-indigo-600" /> Trạng thái & Kiểm duyệt
            </h3>

            <div className="font-semibold text-slate-700">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Trạng thái hiện tại</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all bg-white font-bold text-slate-700 cursor-pointer text-xs"
              >
                <option value="PENDING">Chờ kiểm duyệt (Pending)</option>
                <option value="APPROVED">Đã xuất bản (Approved)</option>
                <option value="SPAM">Bình luận rác (Spam)</option>
                <option value="TRASH">Thùng rác (Trash)</option>
              </select>
            </div>
          </div>

          {/* Context Post Relation */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold border-b border-slate-100 pb-2 flex items-center gap-2 text-slate-800">
              <Eye size={16} className="text-indigo-600" /> Liên kết bài viết
            </h3>

            <div className="space-y-3 font-semibold text-xs text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Tên bài viết</span>
                <Link 
                  href={`/admin/posts/edit/${postRealId || ''}`}
                  className="font-bold text-indigo-600 hover:underline block"
                >
                  {postTitle}
                </Link>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Đường dẫn thân thiện (Slug)</span>
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono break-all text-slate-700 font-bold block w-fit">
                  /{postSlug}
                </code>
              </div>

              <div className="pt-2">
                <a 
                  href={generatePostUrl({
                    id: postRealId || 0,
                    slug: postSlug,
                    legacyId: postLegacyId,
                    createdAt: postCreatedAt
                  }, permalinkStructure)}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 font-bold text-[11px] transition-colors"
                >
                  Xem bài viết <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
