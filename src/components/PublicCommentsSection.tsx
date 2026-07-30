"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare, CornerDownRight, CornerUpLeft, User, Mail, Globe, Send, Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Comment {
  id: number;
  content: string;
  authorName: string;
  authorEmail: string;
  authorUrl: string | null;
  parentId: number | null;
  createdAt: string;
  avatarUrl: string;
  userId: number | null;
}

interface CommentsSectionProps {
  postId: number;
}

export default function PublicCommentsSection({ postId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [pagination, setPagination] = useState({
    enabled: false,
    currentPage: 1,
    totalPages: 1,
    perPage: 50
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Settings loaded from backend to adapt UI
  const [settings, setSettings] = useState({
    commentGlobalEnabled: true,
    commentRequireNameEmail: true,
    commentRequireLogin: false,
    commentCookieOptin: true,
    commentThreadComments: true,
    commentThreadDepth: 5
  });

  // Logged in user info
  const [currentUser, setCurrentUser] = useState<{ name?: string; username: string; email: string } | null>(null);

  // Form states
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [authorUrl, setAuthorUrl] = useState('');
  const [saveCookie, setSaveCookie] = useState(true);

  // Active reply form target
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // 1. Fetch user status and config settings
  useEffect(() => {
    async function initSection() {
      try {
        // Fetch current user if logged in
        const userRes = await fetch('/api/users/profile');
        const userData = await userRes.json();
        if (userData.success && userData.user) {
          setCurrentUser(userData.user);
        }

        // Fetch settings for Comments configurations
        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          const s = settingsData.settings;
          setSettings({
            commentGlobalEnabled: s.comment_global_enabled !== 'false',
            commentRequireNameEmail: s.comment_require_name_email !== 'false',
            commentRequireLogin: s.comment_require_login === 'true',
            commentCookieOptin: s.comment_cookie_optin !== 'false',
            commentThreadComments: s.comment_thread_comments !== 'false',
            commentThreadDepth: s.comment_thread_depth ? Number(s.comment_thread_depth) : 5
          });
        }

        // Load cookie / localStorage if guest
        const savedInfo = localStorage.getItem('lexi_guest_info');
        if (savedInfo) {
          try {
            const info = JSON.parse(savedInfo);
            setAuthorName(info.name || '');
            setAuthorEmail(info.email || '');
            setAuthorUrl(info.url || '');
          } catch (e) {
            console.error("Error parsing guest info:", e);
          }
        }
      } catch (err) {
        console.error("Failed to initialize comments section:", err);
      }
    }
    initSection();
  }, []);

  // 2. Fetch comments based on current page
  useEffect(() => {
    async function loadComments() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/comments?postId=${postId}&public=true&page=${currentPage}`);
        const data = await res.json();
        if (data.success) {
          setComments(data.comments || []);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      } catch (err) {
        console.error("Failed to fetch comments:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadComments();
  }, [postId, currentPage]);

  // 3. Handle submit main comment
  const handleSubmitComment = async (e: React.FormEvent) => {
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
          authorName: currentUser ? undefined : authorName,
          authorEmail: currentUser ? undefined : authorEmail,
          authorUrl: currentUser ? undefined : authorUrl,
          parentId: null
        })
      });

      const data = await res.json();
      if (data.success) {
        setContent('');
        setAlert({
          type: 'success',
          message: data.comment.status === 'APPROVED' 
            ? 'Bình luận của bạn đã được gửi và đăng thành công!'
            : 'Bình luận của bạn đã được gửi thành công và đang chờ kiểm duyệt từ quản trị viên.'
        });

        // Save cookie/localStorage if opted-in
        if (!currentUser && settings.commentCookieOptin && saveCookie) {
          localStorage.setItem('lexi_guest_info', JSON.stringify({
            name: authorName,
            email: authorEmail,
            url: authorUrl
          }));
        } else if (!saveCookie) {
          localStorage.removeItem('lexi_guest_info');
        }

        // If approved instantly, reload to see it
        if (data.comment.status === 'APPROVED') {
          // Refresh comments list
          const refreshRes = await fetch(`/api/comments?postId=${postId}&public=true&page=${currentPage}`);
          const refreshData = await refreshRes.json();
          if (refreshData.success) {
            setComments(refreshData.comments || []);
          }
        }
      } else {
        setAlert({ type: 'error', message: data.error || 'Đã có lỗi xảy ra.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Lỗi kết nối máy chủ.' });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle submit reply comment
  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    setAlert(null);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: replyContent.trim(),
          authorName: currentUser ? undefined : authorName,
          authorEmail: currentUser ? undefined : authorEmail,
          authorUrl: currentUser ? undefined : authorUrl,
          parentId
        })
      });

      const data = await res.json();
      if (data.success) {
        setReplyContent('');
        setActiveReplyId(null);
        setAlert({
          type: 'success',
          message: data.comment.status === 'APPROVED' 
            ? 'Phản hồi của bạn đã được gửi và đăng thành công!'
            : 'Phản hồi của bạn đã được gửi thành công và đang chờ kiểm duyệt từ quản trị viên.'
        });

        // Save guest details if checked
        if (!currentUser && settings.commentCookieOptin && saveCookie) {
          localStorage.setItem('lexi_guest_info', JSON.stringify({
            name: authorName,
            email: authorEmail,
            url: authorUrl
          }));
        }

        if (data.comment.status === 'APPROVED') {
          // Refresh comments list
          const refreshRes = await fetch(`/api/comments?postId=${postId}&public=true&page=${currentPage}`);
          const refreshData = await refreshRes.json();
          if (refreshData.success) {
            setComments(refreshData.comments || []);
          }
        }
      } else {
        setAlert({ type: 'error', message: data.error || 'Đã có lỗi xảy ra.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Lỗi kết nối máy chủ.' });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Recursively render comments tree
  const renderCommentNode = (comment: Comment, depth = 0) => {
    // Sub-replies of this comment
    const replies = settings.commentThreadComments 
      ? comments.filter(c => c.parentId === comment.id) 
      : [];

    const isReplying = activeReplyId === comment.id;
    const authorHasUrl = !!comment.authorUrl;

    const formattedDate = new Date(comment.createdAt).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div key={comment.id} className="group/item">
        {/* Comment Dòng */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 mt-4 shadow-sm hover:shadow-md transition-shadow relative">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <img 
              src={comment.avatarUrl} 
              alt={comment.authorName}
              className="w-10 h-10 rounded-full border border-slate-100 shrink-0 bg-slate-100 shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp';
              }}
            />
            
            {/* Content box */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {authorHasUrl ? (
                    <a 
                      href={comment.authorUrl!} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-bold text-slate-800 hover:text-indigo-600 transition-colors text-sm"
                    >
                      {comment.authorName}
                    </a>
                  ) : (
                    <span className="font-bold text-slate-800 text-sm">{comment.authorName}</span>
                  )}
                  {comment.userId && (
                    <span className="bg-indigo-50 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded font-extrabold border border-indigo-100">
                      Tác giả
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">{formattedDate}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap pt-1">{comment.content}</p>

              {/* Action Toolbar */}
              {settings.commentGlobalEnabled && (!settings.commentRequireLogin || currentUser) && (
                <div className="pt-2 flex items-center justify-end">
                  <button
                    onClick={() => {
                      if (isReplying) {
                        setActiveReplyId(null);
                      } else {
                        setActiveReplyId(comment.id);
                        setReplyContent('');
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none py-1 px-2 rounded hover:bg-indigo-50/50"
                  >
                    {isReplying ? (
                      <>
                        <CornerUpLeft size={12} /> Hủy bỏ
                      </>
                    ) : (
                      <>
                        <CornerDownRight size={12} /> Trả lời
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Inline Reply Form */}
          {isReplying && (
            <div className="mt-4 pt-4 border-t border-slate-100 pl-4 sm:pl-12">
              <div className="text-xs text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
                <CornerDownRight size={12} /> Đang trả lời <span className="text-slate-800 font-bold">@{comment.authorName}</span>
              </div>
              
              {/* Guest metadata form inside reply if not logged in */}
              {!currentUser && !settings.commentRequireLogin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Tên hiển thị *" 
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="email" 
                      placeholder="Email *" 
                      value={authorEmail}
                      onChange={(e) => setAuthorEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <textarea
                  placeholder="Gõ phản hồi của bạn tại đây..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-700 bg-white"
                  required
                />
                <div className="flex items-center justify-between flex-wrap gap-2">
                  {!currentUser && settings.commentCookieOptin && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400 font-medium select-none">
                      <input 
                        type="checkbox" 
                        checked={saveCookie}
                        onChange={(e) => setSaveCookie(e.target.checked)}
                        className="rounded text-indigo-600 border-slate-300 w-3 h-3 cursor-pointer"
                      />
                      Lưu thông tin cho lần sau
                    </label>
                  )}
                  <div className="flex justify-end gap-2 ml-auto">
                    <button
                      onClick={() => setActiveReplyId(null)}
                      className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={isSubmitting || !replyContent.trim()}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer border-none"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Đang gửi...
                        </>
                      ) : (
                        <>
                          <Send size={12} /> Phản hồi
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Render child comments recursively (indented) */}
        {replies.length > 0 && (
          <div className="ml-4 sm:ml-8 border-l-2 border-slate-100 pl-4 mt-2 space-y-2">
            {replies.map(child => renderCommentNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Filter root/top-level comments to boot up our recursion tree
  const rootComments = comments.filter(c => c.parentId === null);

  return (
    <div className="mt-12 bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm">
      {/* Title */}
      <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
        <MessageSquare size={18} className="text-indigo-500" /> Thảo luận ({comments.length})
      </h3>

      {/* Alert status */}
      {alert && (
        <div className={`p-4 rounded-xl mb-6 border flex items-start gap-3 transition-all duration-300 text-xs font-semibold ${
          alert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          {alert.type === 'success' ? <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Main Comment Form */}
      {!settings.commentGlobalEnabled ? (
        <div className="p-4 bg-slate-50 rounded-xl text-center text-xs font-semibold text-slate-500 border border-slate-100">
          Chức năng bình luận đã bị khóa cho toàn bài viết này.
        </div>
      ) : settings.commentRequireLogin && !currentUser ? (
        <div className="p-5 bg-indigo-50/50 rounded-xl text-center text-xs font-medium text-indigo-900 border border-indigo-100">
          Bạn phải{" "}
          <a href="/login" className="font-extrabold text-indigo-700 underline hover:text-indigo-900 transition-colors">
            Đăng nhập tài khoản
          </a>{" "}
          để tham gia gửi ý kiến phản hồi.
        </div>
      ) : (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          {currentUser ? (
            <div className="text-[11px] text-slate-500 font-semibold bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-50 w-fit">
              Bình luận với tư cách: <span className="text-indigo-900 font-bold">{currentUser.name || currentUser.username}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Tên hiển thị *" 
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-700 bg-white"
                  required={settings.commentRequireNameEmail}
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="email" 
                  placeholder="Email *" 
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-700 bg-white"
                  required={settings.commentRequireNameEmail}
                />
              </div>
              <div className="relative col-span-1">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="url" 
                  placeholder="Trang web (Không bắt buộc)" 
                  value={authorUrl}
                  onChange={(e) => setAuthorUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-700 bg-white"
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <textarea
              placeholder="Chia sẻ ý kiến của bạn ở đây..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full p-4 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-700 bg-white"
              required
            />
            <div className="flex items-center justify-between flex-wrap gap-2">
              {!currentUser && settings.commentCookieOptin && (
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400 font-semibold select-none">
                  <input 
                    type="checkbox" 
                    checked={saveCookie}
                    onChange={(e) => setSaveCookie(e.target.checked)}
                    className="rounded text-indigo-600 border-slate-300 w-3.5 h-3.5 cursor-pointer"
                  />
                  Lưu tên hiển thị và email cho lần thảo luận tiếp theo
                </label>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer ml-auto border-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Gửi bình luận
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List Section */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center text-xs font-semibold text-slate-400 italic">
            Chưa có ý kiến phản hồi nào. Hãy là người đầu tiên chia sẻ suy nghĩ của bạn!
          </div>
        ) : (
          <div className="space-y-4">
            {/* Threaded tree starts here recursively starting with root top-level comments */}
            {rootComments.map(comment => renderCommentNode(comment))}
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {pagination.enabled && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-500 disabled:opacity-30 cursor-pointer bg-white"
          >
            <ChevronLeft size={16} />
          </button>
          
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentPage === num
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25 border-none'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'
              }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
            disabled={currentPage === pagination.totalPages}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-500 disabled:opacity-30 cursor-pointer bg-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
