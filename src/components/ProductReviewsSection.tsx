"use client";

import React, { useState, useEffect } from 'react';
import { User, Send, Loader2, Star, StarHalf } from 'lucide-react';

interface Comment {
  id: number;
  content: string;
  authorName: string;
  authorEmail: string;
  rating: number | null;
  createdAt: string;
  avatarUrl: string;
}

interface ProductReviewsSectionProps {
  postId: number;
}

export default function ProductReviewsSection({ postId }: ProductReviewsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');

  const [currentUser, setCurrentUser] = useState<{ name?: string; username: string; email: string } | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const userRes = await fetch('/api/users/profile');
        const userData = await userRes.json();
        if (userData.success && userData.user) {
          setCurrentUser(userData.user);
        }
      } catch (err) {}
    }
    init();
  }, []);

  useEffect(() => {
    async function loadReviews() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/comments?postId=${postId}&public=true&page=1`);
        const data = await res.json();
        if (data.success) {
          setComments(data.comments || []);
        }
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    }
    loadReviews();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    setAlert(null);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: content.trim(),
          rating,
          authorName: currentUser ? undefined : authorName,
          authorEmail: currentUser ? undefined : authorEmail,
          parentId: null
        })
      });

      const data = await res.json();
      if (data.success) {
        setContent('');
        setRating(5);
        setAlert({
          type: 'success',
          message: data.message || 'Đánh giá của bạn đã được gửi thành công!'
        });
        // Tải lại đánh giá mới (hoặc để chờ duyệt tuỳ cài đặt)
        const refreshRes = await fetch(`/api/comments?postId=${postId}&public=true&page=1`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setComments(refreshData.comments || []);
        }
      } else {
        setAlert({
          type: 'error',
          message: data.error || 'Có lỗi xảy ra khi gửi đánh giá.'
        });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Lỗi mạng, vui lòng thử lại sau.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (ratingValue: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          className={`${
            i <= ratingValue ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
          }`}
        />
      );
    }
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  const calculateAverageRating = () => {
    const validComments = comments.filter(c => c.rating);
    if (validComments.length === 0) return 0;
    const total = validComments.reduce((acc, c) => acc + (c.rating as number), 0);
    return (total / validComments.length).toFixed(1);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-8 mb-10 border-b border-slate-200 pb-8">
        <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-slate-50 p-6 rounded-2xl">
          <div className="text-5xl font-black text-slate-800 mb-2">{calculateAverageRating()}</div>
          {renderStars(Math.round(Number(calculateAverageRating())))}
          <div className="text-sm font-medium text-slate-500 mt-2">{comments.filter(c => c.rating).length} đánh giá</div>
        </div>
        
        <div className="w-full md:w-2/3">
          <h4 className="text-lg font-bold text-slate-800 mb-4">Gửi đánh giá của bạn</h4>
          
          {alert && (
            <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${alert.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {alert.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium text-slate-700">Chất lượng sản phẩm:</span>
              <div className="flex items-center gap-1 cursor-pointer" onMouseLeave={() => setHoverRating(null)}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={24}
                    className={`transition-colors ${
                      star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'
                    }`}
                    onMouseEnter={() => setHoverRating(star)}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>

            {!currentUser && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Họ tên của bạn *"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
                <input
                  type="email"
                  placeholder="Email của bạn *"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            )}
            
            <textarea
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-32 resize-none"
              required
            />
            
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-lg font-bold text-slate-800 mb-6">Đánh giá nổi bật</h4>
        
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên!</div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-4 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">
                {comment.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">{comment.authorName}</span>
                  <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                {comment.rating && <div className="mb-2">{renderStars(comment.rating)}</div>}
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{comment.content}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
