"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CapabilityGuard from '@/components/CapabilityGuard';
import { 
  MessageSquare, Search, Edit, Trash2, CheckSquare, Square, 
  ExternalLink, Check, AlertOctagon, CornerDownRight, X, Send, Save, ArrowLeft, Settings 
} from 'lucide-react';
import { generatePostUrl } from '@/lib/permalink';

interface PostInfo {
  id: number;
  title: string;
  slug: string;
  createdAt: string;
  legacyId?: number | null;
  _count?: {
    comments: number;
  };
}

interface ParentInfo {
  id: number;
  authorName: string;
  content: string;
}

interface Comment {
  id: number;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'SPAM' | 'TRASH';
  ipAddress: string | null;
  userAgent: string | null;
  authorName: string;
  authorEmail: string;
  authorUrl: string | null;
  userId: number | null;
  postId: number;
  parentId: number | null;
  createdAt: string;
  avatarUrl?: string;
  rating?: number | null;
  post: PostInfo;
  parent?: ParentInfo | null;
}

export default function ProductReviewsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, spam, trash
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [permalinkStructure, setPermalinkStructure] = useState('/%postname%.html');

  // Selection & Bulk actions
  const [selectedCommentIds, setSelectedCommentIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  // Inline Reply state
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Inline Quick Edit state
  const [quickEditingId, setQuickEditingId] = useState<number | null>(null);
  const [quickEditName, setQuickEditName] = useState('');
  const [quickEditEmail, setQuickEditEmail] = useState('');
  const [quickEditUrl, setQuickEditUrl] = useState('');
  const [quickEditContent, setQuickEditContent] = useState('');
  const [quickEditRating, setQuickEditRating] = useState<number>(0);
  const [isSavingQuickEdit, setIsSavingQuickEdit] = useState(false);

  // Pagination & Screen Options State
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsPerPage, setCommentsPerPage] = useState(10);
  const [isScreenOptionsOpen, setIsScreenOptionsOpen] = useState(false);
  const [showAuthorCol, setShowAuthorCol] = useState(true);
  const [showCommentCol, setShowCommentCol] = useState(true);
  const [showPostCol, setShowPostCol] = useState(true);
  const [showDateCol, setShowDateCol] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('lexi_per_page_COMMENT');
      if (cached) setCommentsPerPage(Number(cached));
      
      const author = localStorage.getItem('lexi_show_col_comment_author');
      if (author !== null) setShowAuthorCol(author === 'true');
      const comment = localStorage.getItem('lexi_show_col_comment_content');
      if (comment !== null) setShowCommentCol(comment === 'true');
      const post = localStorage.getItem('lexi_show_col_comment_post');
      if (post !== null) setShowPostCol(post === 'true');
      const date = localStorage.getItem('lexi_show_col_comment_date');
      if (date !== null) setShowDateCol(date === 'true');
    }
  }, []);

  const handleToggleCol = (colName: 'author' | 'comment' | 'post' | 'date', val: boolean) => {
    if (typeof window === 'undefined') return;
    if (colName === 'author') {
      setShowAuthorCol(val);
      localStorage.setItem('lexi_show_col_comment_author', String(val));
    } else if (colName === 'comment') {
      setShowCommentCol(val);
      localStorage.setItem('lexi_show_col_comment_content', String(val));
    } else if (colName === 'post') {
      setShowPostCol(val);
      localStorage.setItem('lexi_show_col_comment_post', String(val));
    } else if (colName === 'date') {
      setShowDateCol(val);
      localStorage.setItem('lexi_show_col_comment_date', String(val));
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        status: statusFilter,
        search: searchQuery,
        postType: 'PRODUCT'
      });
      const res = await fetch(`/api/comments?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments || []);
      }

      // Fetch active profile
      const profileRes = await fetch('/api/users/profile');
      const profileData = await profileRes.json();
      if (profileData.success && profileData.user) {
        setActiveProfileId(profileData.user.id);
      }

      // Fetch settings for permalink structure
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.settings) {
        if (settingsData.settings.permalink_structure) {
          setPermalinkStructure(settingsData.settings.permalink_structure);
        }
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: 'PENDING' | 'APPROVED' | 'SPAM' | 'TRASH') => {
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        // Update state locally
        setComments(comments.map(c => c.id === id ? { ...c, status: newStatus } : c));
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      alert('Không thể kết nối máy chủ!');
    }
  };

  const handleDeletePermanent = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bình luận này? Thao tác này sẽ xóa tất cả các câu trả lời liên quan và không thể phục hồi!')) {
      return;
    }

    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setComments(comments.filter(c => c.id !== id));
        setSelectedCommentIds(selectedCommentIds.filter(selectedId => selectedId !== id));
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      alert('Không thể kết nối máy chủ!');
    }
  };

  // Bulk actions handler
  const handleBulkActionApply = async () => {
    if (selectedCommentIds.length === 0) {
      alert('Vui lòng chọn ít nhất một bình luận để áp dụng thao tác!');
      return;
    }

    if (!bulkAction) {
      alert('Vui lòng chọn một hành động hàng loạt!');
      return;
    }

    const actionText = 
      bulkAction === 'approved' ? 'duyệt' :
      bulkAction === 'pending' ? 'bỏ duyệt' :
      bulkAction === 'spam' ? 'đánh dấu spam' :
      bulkAction === 'trash' ? 'chuyển vào thùng rác' : 'xóa vĩnh viễn';

    if (!confirm(`Bạn có chắc chắn muốn áp dụng ${actionText} cho ${selectedCommentIds.length} bình luận đã chọn?`)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const id of selectedCommentIds) {
      try {
        if (bulkAction === 'delete') {
          const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) successCount++;
          else failCount++;
        } else {
          const res = await fetch(`/api/comments/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: bulkAction.toUpperCase() })
          });
          const data = await res.json();
          if (data.success) successCount++;
          else failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    await fetchComments();
    setSelectedCommentIds([]);
    setBulkAction('');
    alert(`Đã hoàn tất thao tác hàng loạt: Thành công ${successCount}${failCount > 0 ? `, thất bại ${failCount} mục` : ''}.`);
  };

  const handleToggleSelectAll = (filteredList: Comment[]) => {
    if (selectedCommentIds.length === filteredList.length) {
      setSelectedCommentIds([]);
    } else {
      setSelectedCommentIds(filteredList.map(c => c.id));
    }
  };

  const handleToggleSelectComment = (id: number) => {
    if (selectedCommentIds.includes(id)) {
      setSelectedCommentIds(selectedCommentIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedCommentIds([...selectedCommentIds, id]);
    }
  };

  // Submit Inline Reply
  const handleSendReply = async (comment: Comment) => {
    if (!replyContent.trim()) {
      alert('Vui lòng nhập nội dung câu trả lời!');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: comment.postId,
          parentId: comment.id,
          content: replyContent.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyContent('');
        setReplyingToId(null);
        await fetchComments();
        alert('Đã gửi câu trả lời và tự động duyệt bình luận thành công!');
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      alert('Không thể gửi bình luận!');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Trigger Quick Edit mode
  const startQuickEdit = (comment: Comment) => {
    setQuickEditingId(comment.id);
    setQuickEditName(comment.authorName || '');
    setQuickEditEmail(comment.authorEmail || '');
    setQuickEditUrl(comment.authorUrl || '');
    setQuickEditContent(comment.content || '');
    setQuickEditRating(comment.rating || 0);
    setReplyingToId(null);
  };

  const handleSaveQuickEdit = async (commentId: number) => {
    if (!quickEditName.trim() || !quickEditEmail.trim() || !quickEditContent.trim()) {
      return;
    }
    try {
      setIsSavingQuickEdit(true);
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: quickEditName,
          authorEmail: quickEditEmail,
          authorUrl: quickEditUrl,
          content: quickEditContent,
          rating: quickEditRating || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setComments(comments.map(c => c.id === commentId ? {
          ...c,
          authorName: quickEditName,
          authorEmail: quickEditEmail,
          authorUrl: quickEditUrl || null,
          content: quickEditContent
        } : c));
        setQuickEditingId(null);
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (error) {
      alert('Không thể kết nối máy chủ!');
    } finally {
      setIsSavingQuickEdit(false);
    }
  };

  // Frontend filters & searches
  const filteredComments = comments.filter(c => {
    // 1. Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      c.content.toLowerCase().includes(query) ||
      c.authorName.toLowerCase().includes(query) ||
      c.authorEmail.toLowerCase().includes(query) ||
      (c.post?.title && c.post.title.toLowerCase().includes(query));

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate status counts
  const totalCount = comments.length;
  const pendingCount = comments.filter(c => c.status === 'PENDING').length;
  const approvedCount = comments.filter(c => c.status === 'APPROVED').length;
  const spamCount = comments.filter(c => c.status === 'SPAM').length;
  const trashCount = comments.filter(c => c.status === 'TRASH').length;

  // Pagination Calculations
  const totalItems = filteredComments.length;
  const totalPages = Math.ceil(totalItems / commentsPerPage);
  const startIndex = (currentPage - 1) * commentsPerPage;
  const endIndex = Math.min(startIndex + commentsPerPage, totalItems);
  const paginatedComments = filteredComments.slice(startIndex, startIndex + commentsPerPage);

  const getColSpanCount = () => {
    let count = 1; // Checkbox (always 1)
    if (showAuthorCol) count++;
    if (showCommentCol) count++;
    if (showPostCol) count++;
    if (showDateCol) count++;
    return count;
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pageNumbers.push(-1);
      }
      
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      
      if (end < totalPages - 1) {
        pageNumbers.push(-1);
      }
      
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  return (
    <CapabilityGuard capability="moderate_comments">
      <div className="max-w-6xl mx-auto font-sans text-[13px] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <MessageSquare size={24} className="text-indigo-600 animate-pulse" /> Bình luận bài viết
          </h1>
          <p className="text-xs text-slate-500 mt-1">Duyệt, phản hồi và dọn dẹp các tương tác từ người đọc ngoài trang web</p>
        </div>
        <button
          type="button"
          onClick={() => setIsScreenOptionsOpen(!isScreenOptionsOpen)}
          className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-2 border border-slate-200 rounded-lg text-xs cursor-pointer h-9 transition-colors hover:border-slate-300 active:scale-[0.98] flex items-center gap-1.5 outline-none"
        >
          <Settings size={14} className={isScreenOptionsOpen ? 'rotate-45 transition-transform duration-250 text-indigo-600' : 'transition-transform duration-250'} />
          Tùy chọn hiển thị
        </button>
      </div>

      {/* Screen Options Panel */}
      {isScreenOptionsOpen && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm animate-fade-in font-semibold text-slate-650 text-xs">
          <h3 className="font-bold text-slate-800 text-xs mb-3 uppercase tracking-wider">Tùy chọn hiển thị</h3>
          <div className="space-y-4">
            {/* Columns Toggle */}
            <div>
              <p className="font-bold text-[10px] text-slate-400 uppercase mb-2">Hiển thị các cột trong bảng</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={showAuthorCol}
                    onChange={(e) => handleToggleCol('author', e.target.checked)}
                    className="w-4 h-4 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span>Tác giả</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={showCommentCol}
                    onChange={(e) => handleToggleCol('comment', e.target.checked)}
                    className="w-4 h-4 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span>Bình luận</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={showPostCol}
                    onChange={(e) => handleToggleCol('post', e.target.checked)}
                    className="w-4 h-4 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span>Trả lời cho</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={showDateCol}
                    onChange={(e) => handleToggleCol('date', e.target.checked)}
                    className="w-4 h-4 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span>Đã gửi vào</span>
                </label>
              </div>
            </div>

            {/* Custom Items Per Page */}
            <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[10px] text-slate-400 uppercase">Số bình luận hiển thị trên một trang:</span>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={commentsPerPage}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value));
                    setCommentsPerPage(val);
                    setCurrentPage(1);
                    localStorage.setItem('lexi_per_page_COMMENT', String(val));
                  }}
                  className="px-2.5 py-1 border border-slate-200 rounded w-16 text-center font-bold text-slate-700 bg-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WordPress-style Quick Status Tabs */}
      <div className="flex items-center gap-3.5 mb-4 text-xs font-semibold text-slate-500 flex-wrap">
        <button 
          onClick={() => { setStatusFilter('all'); setSelectedCommentIds([]); }} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            statusFilter === 'all' 
              ? 'text-indigo-600 border-indigo-600 font-bold' 
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          Tất cả <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded-full ml-0.5">{totalCount}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button 
          onClick={() => { setStatusFilter('pending'); setSelectedCommentIds([]); }} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            statusFilter === 'pending' 
              ? 'text-indigo-600 border-indigo-600 font-bold' 
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          Chờ duyệt <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-full ml-0.5">{pendingCount}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button 
          onClick={() => { setStatusFilter('approved'); setSelectedCommentIds([]); }} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            statusFilter === 'approved' 
              ? 'text-indigo-600 border-indigo-600 font-bold' 
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          Đã duyệt <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full ml-0.5">{approvedCount}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button 
          onClick={() => { setStatusFilter('spam'); setSelectedCommentIds([]); }} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            statusFilter === 'spam' 
              ? 'text-indigo-600 border-indigo-600 font-bold' 
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          Bình luận rác <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-full ml-0.5">{spamCount}</span>
        </button>
        <span className="text-slate-300">|</span>
        <button 
          onClick={() => { setStatusFilter('trash'); setSelectedCommentIds([]); }} 
          className={`pb-1 border-b-2 transition-all cursor-pointer ${
            statusFilter === 'trash' 
              ? 'text-indigo-600 border-indigo-600 font-bold' 
              : 'border-transparent hover:text-slate-700'
          }`}
        >
          Thùng rác <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded-full ml-0.5">{trashCount}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Multi-layered Filters Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Bulk Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              value={bulkAction} 
              onChange={(e) => setBulkAction(e.target.value)} 
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white outline-none focus:border-indigo-500 text-slate-700 font-semibold cursor-pointer h-9 w-44"
            >
              <option value="">Thao tác hàng loạt</option>
              <option value="approved">Duyệt bình luận</option>
              <option value="pending">Bỏ duyệt bình luận</option>
              <option value="spam">Đánh dấu là Spam</option>
              <option value="trash">Chuyển vào Thùng rác</option>
              {statusFilter === 'trash' && (
                <option value="delete">Xóa vĩnh viễn</option>
              )}
            </select>
            <button 
              onClick={handleBulkActionApply}
              className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2 border border-slate-200 rounded-lg text-xs cursor-pointer h-9 transition-colors hover:border-slate-300 active:scale-[0.98]"
            >
              Áp dụng
            </button>
            
            {selectedCommentIds.length > 0 && (
              <span className="text-[11px] text-indigo-600 font-bold ml-1 animate-pulse">
                Đã chọn {selectedCommentIds.length} mục
              </span>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo nội dung, email hoặc tác giả..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs w-full h-9 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700 bg-white"
            />
          </div>
        </div>

        {/* Comments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-600 min-w-[950px]">
            <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10 text-center font-semibold">
                  <button 
                    onClick={() => handleToggleSelectAll(filteredComments)} 
                    className="focus:outline-none cursor-pointer flex items-center justify-center mx-auto"
                  >
                    {selectedCommentIds.length === filteredComments.length && filteredComments.length > 0 ? (
                      <CheckSquare size={16} className="text-indigo-600" />
                    ) : (
                      <Square size={16} className="text-slate-400 hover:text-indigo-600" />
                    )}
                  </button>
                </th>
                {showAuthorCol && <th className="px-4 py-3 font-semibold w-56">Tác giả</th>}
                {showCommentCol && <th className="px-4 py-3 font-semibold">Bình luận</th>}
                {showPostCol && <th className="px-4 py-3 font-semibold w-56">Trả lời cho</th>}
                {showDateCol && <th className="px-4 py-3 font-semibold w-36 text-center">Đã gửi vào</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={getColSpanCount()} className="px-4 py-12 text-center text-slate-400 font-medium animate-pulse">
                    Đang tải danh sách bình luận...
                  </td>
                </tr>
              ) : filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={getColSpanCount()} className="px-4 py-12 text-center text-slate-400 font-semibold">
                    Không tìm thấy bình luận nào trong bộ lọc này.
                  </td>
                </tr>
              ) : (
                paginatedComments.map((comment) => {
                  const isSelected = selectedCommentIds.includes(comment.id);
                  const isPending = comment.status === 'PENDING';
                  const isSpam = comment.status === 'SPAM';
                  const isTrash = comment.status === 'TRASH';
                  
                  const isQuickEditing = quickEditingId === comment.id;
                  const isReplying = replyingToId === comment.id;

                  return (
                    <React.Fragment key={comment.id}>
                      <tr className={`border-b border-slate-100 hover:bg-slate-50/40 group transition-colors align-top ${
                        isPending ? 'bg-amber-50/25 hover:bg-amber-50/45' : ''
                      }`}>
                        {/* 1. Multi-select Checkbox */}
                        <td className="px-4 py-4 text-center">
                          <button 
                            onClick={() => handleToggleSelectComment(comment.id)}
                            className="focus:outline-none cursor-pointer flex items-center justify-center mx-auto"
                          >
                            {isSelected ? (
                              <CheckSquare size={16} className="text-indigo-600 animate-scale-in" />
                            ) : (
                              <Square size={16} className="text-slate-300 hover:text-indigo-600" />
                            )}
                          </button>
                        </td>

                        {/* 2. Column Tác giả */}
                        {showAuthorCol && (
                          <td className="px-4 py-4">
                            <div className="flex gap-3">
                              {/* Gravatar Avatar */}
                              <img 
                                src={comment.avatarUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp'} 
                                alt={comment.authorName} 
                                className="w-8 h-8 rounded-full border border-slate-200 shadow-sm shrink-0 object-cover"
                              />
                              <div className="truncate space-y-1">
                                <p className="font-bold text-slate-800 text-xs">
                                  {comment.authorUrl ? (
                                    <a 
                                      href={comment.authorUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-indigo-600 hover:underline flex items-center gap-0.5"
                                    >
                                      {comment.authorName} <ExternalLink size={10} className="inline shrink-0" />
                                    </a>
                                  ) : (
                                    comment.authorName
                                  )}
                                </p>
                                <a href={`mailto:${comment.authorEmail}`} className="block text-[11px] text-slate-500 hover:text-indigo-500 font-semibold truncate hover:underline">
                                  {comment.authorEmail}
                                </a>
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-650 font-mono text-[9px] font-semibold" title="Địa chỉ IP người gửi">
                                    IP: {comment.ipAddress === '::1' ? '127.0.0.1 (Local)' : (comment.ipAddress || 'Không có')}
                                  </span>
                                  {comment.status === 'PENDING' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      Chờ duyệt
                                    </span>
                                  )}
                                  {comment.status === 'APPROVED' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Đã duyệt
                                    </span>
                                  )}
                                  {comment.status === 'SPAM' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      Spam
                                    </span>
                                  )}
                                  {comment.status === 'TRASH' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                      Thùng rác
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* 3. Column Bình luận */}
                        {showCommentCol && (
                          <td className="px-4 py-4 text-slate-700">
                            {isQuickEditing ? (
                              /* Inline Quick Edit Mode */
                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 font-semibold text-xs text-slate-700 animate-fade-in">
                                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Sửa nhanh bình luận</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Tên tác giả</label>
                                    <input 
                                      type="text" 
                                      value={quickEditName} 
                                      onChange={(e) => setQuickEditName(e.target.value)}
                                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md outline-none focus:border-indigo-500 font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Email</label>
                                    <input 
                                      type="email" 
                                      value={quickEditEmail} 
                                      onChange={(e) => setQuickEditEmail(e.target.value)}
                                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md outline-none focus:border-indigo-500 font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Phản hồi Url</label>
                                    <input 
                                      type="text" 
                                      value={quickEditUrl} 
                                      onChange={(e) => setQuickEditUrl(e.target.value)}
                                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md outline-none focus:border-indigo-500 font-semibold"
                                      placeholder="http://..."
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Nội dung</label>
                                  <textarea 
                                    value={quickEditContent} 
                                    onChange={(e) => setQuickEditContent(e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md outline-none focus:border-indigo-500 font-semibold h-20 resize-none"
                                  />
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                  <label className="text-[10px] text-slate-400 uppercase font-bold">Đánh giá sao:</label>
                                  <select 
                                    value={quickEditRating}
                                    onChange={(e) => setQuickEditRating(Number(e.target.value))}
                                    className="px-2 py-1 text-xs border border-slate-200 rounded-md outline-none focus:border-indigo-500"
                                  >
                                    <option value={0}>Không đánh giá</option>
                                    <option value={5}>5 sao ⭐️⭐️⭐️⭐️⭐️</option>
                                    <option value={4}>4 sao ⭐️⭐️⭐️⭐️</option>
                                    <option value={3}>3 sao ⭐️⭐️⭐️</option>
                                    <option value={2}>2 sao ⭐️⭐️</option>
                                    <option value={1}>1 sao ⭐️</option>
                                  </select>
                                </div>

                                <div className="flex justify-end gap-2 text-[11px]">
                                  <button 
                                    onClick={() => setQuickEditingId(null)}
                                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-md font-bold transition-colors cursor-pointer"
                                  >
                                    Hủy bỏ
                                  </button>
                                  <button 
                                    onClick={() => handleSaveQuickEdit(comment.id)}
                                    disabled={isSavingQuickEdit}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <Save size={12} />
                                    {isSavingQuickEdit ? 'Đang lưu...' : 'Cập nhật'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Read Mode */
                              <div className="space-y-1.5">
                                {/* Reply Context Badge */}
                                {comment.parent && (
                                  <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded w-fit select-none">
                                    <CornerDownRight size={10} className="text-slate-400" />
                                    Trả lời cho @{comment.parent.authorName}
                                  </p>
                                )}
                                
                                <p className="text-slate-800 text-xs font-semibold leading-relaxed whitespace-pre-line pr-4">
                                  {comment.content}
                                </p>
                                
                                {comment.rating ? (
                                  <div className="flex text-amber-400 text-[10px] mt-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <span key={i} className={i < comment.rating! ? "opacity-100" : "text-slate-200"}>★</span>
                                    ))}
                                  </div>
                                ) : null}

                                {/* Hover actions menu */}
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold text-slate-400">
                                  {isPending ? (
                                    <button 
                                      onClick={() => handleUpdateStatus(comment.id, 'APPROVED')}
                                      className="text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-0.5"
                                    >
                                      Duyệt
                                    </button>
                                  ) : (
                                    !isSpam && !isTrash && (
                                      <button 
                                        onClick={() => handleUpdateStatus(comment.id, 'PENDING')}
                                        className="text-amber-600 hover:text-amber-700 cursor-pointer flex items-center gap-0.5"
                                      >
                                        Bỏ duyệt
                                      </button>
                                    )
                                  )}
                                  
                                  {!isSpam && !isTrash && (
                                    <>
                                      <span className="text-slate-200 select-none">|</span>
                                      <button 
                                        onClick={() => { setReplyingToId(comment.id); setQuickEditingId(null); setReplyContent(''); }}
                                        className="text-indigo-600 hover:text-indigo-700 cursor-pointer"
                                      >
                                        Trả lời
                                      </button>
                                      <span className="text-slate-200 select-none">|</span>
                                      <button 
                                        onClick={() => startQuickEdit(comment)}
                                        className="text-brand-600 hover:text-indigo-600 cursor-pointer"
                                      >
                                        Sửa nhanh
                                      </button>
                                      <span className="text-slate-200 select-none">|</span>
                                        <Link 
                                          href={`/admin/products/reviews/edit/${comment.id}`}
                                          className="text-slate-500 hover:text-indigo-600 cursor-pointer"
                                        >
                                          Sửa chi tiết
                                        </Link>
                                    </>
                                  )}

                                  {!isSpam && (
                                    <>
                                      <span className="text-slate-200 select-none">|</span>
                                      <button 
                                        onClick={() => handleUpdateStatus(comment.id, 'SPAM')}
                                        className="text-red-500 hover:text-red-700 cursor-pointer"
                                      >
                                        Spam
                                      </button>
                                    </>
                                  )}

                                  {isSpam && (
                                    <>
                                      <button 
                                        onClick={() => handleUpdateStatus(comment.id, 'APPROVED')}
                                        className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                                      >
                                        Không phải Spam (Duyệt)
                                      </button>
                                      <span className="text-slate-200 select-none">|</span>
                                    </>
                                  )}

                                  {!isTrash && (
                                    <>
                                      <span className="text-slate-200 select-none">|</span>
                                      <button 
                                        onClick={() => handleUpdateStatus(comment.id, 'TRASH')}
                                        className="text-red-600 hover:text-red-700 cursor-pointer"
                                      >
                                        Thùng rác
                                      </button>
                                    </>
                                  )}

                                  {isTrash && (
                                    <>
                                      <button 
                                        onClick={() => handleUpdateStatus(comment.id, 'APPROVED')}
                                        className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                                      >
                                        Phục hồi
                                      </button>
                                      <span className="text-slate-200 select-none">|</span>
                                      <button 
                                        onClick={() => handleDeletePermanent(comment.id)}
                                        className="text-rose-600 hover:text-rose-800 cursor-pointer"
                                      >
                                        Xóa vĩnh viễn
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        )}

                        {/* 4. Column Trả lời cho */}
                        {showPostCol && (
                          <td className="px-4 py-4 text-xs font-semibold align-top space-y-1">
                            <Link 
                              href={`/admin/posts/edit/${comment.postId}`} 
                              className="text-brand-600 hover:text-indigo-600 font-bold block max-w-[200px] truncate"
                              title={comment.post?.title}
                            >
                              {comment.post?.title}
                            </Link>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <a 
                                href={generatePostUrl({
                                  id: comment.post?.id,
                                  slug: comment.post?.slug,
                                  legacyId: comment.post?.legacyId,
                                  createdAt: comment.post?.createdAt || comment.createdAt
                                }, permalinkStructure)}
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-slate-400 hover:text-indigo-600 hover:underline text-[10px] flex items-center gap-0.5"
                              >
                                Xem bài viết <ExternalLink size={8} />
                              </a>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded text-[10px]" title="Tổng số bình luận trong bài viết">
                                {comment.post?._count?.comments || 1} <MessageSquare size={9} />
                              </span>
                            </div>
                          </td>
                        )}

                        {/* 5. Column Đã đăng vào */}
                        {showDateCol && (
                          <td className="px-4 py-4 text-center align-top text-xs text-slate-500 font-semibold space-y-1 font-mono">
                            <p>{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</p>
                            <p className="text-[10px] text-slate-400 font-normal font-sans">
                              lúc {new Date(comment.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                        )}
                      </tr>

                      {/* 6. Inline Reply Mode TextArea Insertion */}
                      {isReplying && (
                        <tr className="bg-indigo-50/20 border-b border-slate-100 animate-slide-down">
                          <td colSpan={getColSpanCount()} className="px-12 py-3.5">
                            <div className="border border-indigo-100 rounded-lg p-3 bg-white space-y-3 font-semibold text-xs max-w-3xl">
                              <p className="text-indigo-600 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                <CornerDownRight size={13} />
                                Trả lời bình luận của @{comment.authorName}
                              </p>
                              
                              <textarea 
                                placeholder="Viết câu trả lời kiểm duyệt của bạn..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="w-full p-2.5 border border-slate-200 rounded-md outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-semibold h-24 resize-none"
                              />

                              <div className="flex justify-end gap-2 text-[11px]">
                                <button 
                                  onClick={() => setReplyingToId(null)}
                                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-md font-bold transition-colors cursor-pointer"
                                >
                                  Hủy bỏ
                                </button>
                                <button 
                                  onClick={() => handleSendReply(comment)}
                                  disabled={isSubmittingReply}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  <Send size={11} />
                                  {isSubmittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </CapabilityGuard>
  );
}
