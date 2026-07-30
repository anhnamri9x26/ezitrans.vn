"use client";

import React, { useState, useEffect } from 'react';
import { Save, MessageSquare, Settings, ShieldCheck, Layers, ListOrdered, CheckCircle, ShieldAlert } from 'lucide-react';

export default function DiscussionSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Discussion Form States
  const [commentGlobalEnabled, setCommentGlobalEnabled] = useState(true);
  const [commentRequireNameEmail, setCommentRequireNameEmail] = useState(true);
  const [commentRequireLogin, setCommentRequireLogin] = useState(false);
  const [commentCookieOptin, setCommentCookieOptin] = useState(true);
  const [commentThreadComments, setCommentThreadComments] = useState(true);
  const [commentThreadDepth, setCommentThreadDepth] = useState(5);
  const [commentModerationManually, setCommentModerationManually] = useState(true);
  const [commentPreviouslyApproved, setCommentPreviouslyApproved] = useState(true);
  const [commentPagination, setCommentPagination] = useState(false);
  const [commentPerPage, setCommentPerPage] = useState(50);
  const [commentOrder, setCommentOrder] = useState('asc');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.settings) {
          const s = data.settings;
          setCommentGlobalEnabled(s.comment_global_enabled !== 'false');
          setCommentRequireNameEmail(s.comment_require_name_email !== 'false');
          setCommentRequireLogin(s.comment_require_login === 'true');
          setCommentCookieOptin(s.comment_cookie_optin !== 'false');
          setCommentThreadComments(s.comment_thread_comments !== 'false');
          setCommentThreadDepth(s.comment_thread_depth ? Number(s.comment_thread_depth) : 5);
          setCommentModerationManually(s.comment_moderation_manually !== 'false');
          setCommentPreviouslyApproved(s.comment_previously_approved !== 'false');
          setCommentPagination(s.comment_pagination === 'true');
          setCommentPerPage(s.comment_per_page ? Number(s.comment_per_page) : 50);
          setCommentOrder(s.comment_order || 'asc');
        }
      } catch (error) {
        console.error("Failed to load discussion settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setAlertMsg(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_global_enabled: String(commentGlobalEnabled),
          comment_require_name_email: String(commentRequireNameEmail),
          comment_require_login: String(commentRequireLogin),
          comment_cookie_optin: String(commentCookieOptin),
          comment_thread_comments: String(commentThreadComments),
          comment_thread_depth: String(commentThreadDepth),
          comment_moderation_manually: String(commentModerationManually),
          comment_previously_approved: String(commentPreviouslyApproved),
          comment_pagination: String(commentPagination),
          comment_per_page: String(commentPerPage),
          comment_order: commentOrder
        })
      });

      const data = await res.json();
      if (data.success) {
        setAlertMsg({ type: 'success', text: 'Cập nhật cấu hình cài đặt bình luận thành công!' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setAlertMsg({ type: 'error', text: 'Lỗi: ' + data.error });
      }
    } catch (error) {
      setAlertMsg({ type: 'error', text: 'Lỗi kết nối máy chủ!' });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-medium animate-pulse text-xs">Đang tải cấu hình cài đặt bình luận...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveSettings} className="max-w-4xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <MessageSquare className="text-slate-600 animate-pulse" size={24} /> Cài đặt Bình luận
          </h1>
          <p className="text-slate-500 text-xs mt-1">Cấu hình các tùy chọn hiển thị, phê duyệt và quyền tương tác thảo luận kiểu WordPress.</p>
        </div>
        <button 
          type="submit"
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-semibold text-xs flex items-center gap-2 shadow-sm transition-all hover:shadow-indigo-500/20 active:translate-y-0.5 disabled:opacity-50 cursor-pointer border-none outline-none"
        >
          <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {/* Alert message */}
      {alertMsg && (
        <div className={`p-4 rounded-lg mb-6 border flex items-start gap-3 transition-all duration-300 text-xs font-semibold ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 animate-fade-in' 
            : 'bg-red-50 border-red-200 text-red-800 animate-fade-in'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle size={16} className="shrink-0 text-emerald-500" /> : <ShieldAlert size={16} className="shrink-0 text-red-500" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* 1. Default Article Settings */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
            <Settings size={18} className="text-indigo-500" /> Cài đặt mặc định
          </h2>
          
          <div className="space-y-4 max-w-3xl text-xs">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={commentGlobalEnabled}
                onChange={(e) => setCommentGlobalEnabled(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">Cho phép mọi người gửi bình luận về bài viết mới</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Đây là thiết lập chung cho toàn bộ bài viết và trang tĩnh mới. Bạn vẫn có thể ghi đè (tắt/bật) trên từng bài cụ thể.</p>
              </div>
            </label>
          </div>
        </section>

        {/* 2. Other Comment Settings */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
            <Layers size={18} className="text-indigo-500" /> Tùy chọn bình luận khác
          </h2>
          
          <div className="space-y-5 max-w-3xl text-xs">
            {/* Require name and email */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={commentRequireNameEmail}
                onChange={(e) => setCommentRequireNameEmail(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">Tác giả bình luận phải điền tên và email</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Áp dụng đối với khách vãng lai chưa đăng nhập. Giúp xác thực thông tin người gửi bình luận.</p>
              </div>
            </label>

            {/* Require login */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={commentRequireLogin}
                onChange={(e) => setCommentRequireLogin(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">Thành viên phải đăng ký và đăng nhập để bình luận</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Khóa form bình luận đối với khách vãng lai, chỉ cho phép tài khoản đã đăng nhập thực hiện tương tác.</p>
              </div>
            </label>

            {/* Cookie Opt-in checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={commentCookieOptin}
                onChange={(e) => setCommentCookieOptin(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">Hiển thị hộp chọn cho phép lưu cookie của người bình luận</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Hiển thị checkbox "Lưu tên và email cho lần bình luận tiếp theo" ở form viết bài. Thuận tiện và tuân thủ chuẩn GDPR.</p>
              </div>
            </label>

            {/* Threaded / Nested comments */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={commentThreadComments}
                  onChange={(e) => setCommentThreadComments(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">Bật bình luận theo luồng (lồng nhau)</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Cho phép người đọc nhấn "Trả lời" trực tiếp một bình luận cụ thể để tạo cuộc hội thoại dạng cây phân cấp.</p>
                </div>
              </label>

              {commentThreadComments && (
                <div className="flex items-center gap-3 ml-7 bg-slate-50 p-3 rounded-lg border border-slate-100 w-fit">
                  <span className="text-slate-600 font-medium">Số lượng cấp độ lồng nhau tối đa:</span>
                  <select 
                    value={commentThreadDepth}
                    onChange={(e) => setCommentThreadDepth(Number(e.target.value))}
                    className="px-2 py-1 border border-slate-200 rounded text-slate-700 bg-white font-semibold cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                      <option key={level} value={level}>{level} cấp</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Comment Moderation Settings */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
            <ShieldCheck size={18} className="text-indigo-500" /> Điều kiện phê duyệt bình luận
          </h2>
          
          <div className="space-y-4 max-w-3xl text-xs">
            {/* Manually approve */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={commentModerationManually}
                onChange={(e) => setCommentModerationManually(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">Bình luận phải được phê duyệt thủ công</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Tất cả bình luận mới gửi lên sẽ mặc định ở trạng thái Chờ duyệt (Pending), Admin/Editor phải duyệt thì mới hiển thị ra ngoài web.</p>
              </div>
            </label>

            {/* Previously approved comment author */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={commentPreviouslyApproved}
                onChange={(e) => setCommentPreviouslyApproved(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 cursor-pointer"
              />
              <div>
                <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">Người bình luận phải có ít nhất một bình luận đã được duyệt trước đó</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Nếu được bật, hệ thống sẽ tự động duyệt bình luận mới của một email nếu email đó đã có tối thiểu 1 bình luận ở trạng thái Đã duyệt trước đây.</p>
              </div>
            </label>
          </div>
        </section>

        {/* 4. Pagination & Order Settings */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
            <ListOrdered size={18} className="text-indigo-500" /> Phân trang & Sắp xếp bình luận
          </h2>
          
          <div className="space-y-5 max-w-3xl text-xs">
            {/* Pagination Enable */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={commentPagination}
                  onChange={(e) => setCommentPagination(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">Chia bình luận thành các trang</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Bật phân trang danh sách bình luận giúp tăng tốc thời gian tải trang đối với các bài viết có hàng ngàn phản hồi.</p>
                </div>
              </label>

              {commentPagination && (
                <div className="flex items-center gap-3 ml-7 bg-slate-50 p-3 rounded-lg border border-slate-100 w-fit">
                  <span className="text-slate-600 font-medium">Bình luận cấp cao nhất (Top-level) trên mỗi trang:</span>
                  <input 
                    type="number" 
                    value={commentPerPage}
                    onChange={(e) => setCommentPerPage(Math.max(1, Number(e.target.value)))}
                    className="px-2 py-1 border border-slate-200 rounded text-slate-700 bg-white font-semibold outline-none w-16 text-center focus:ring-1 focus:ring-indigo-500"
                    min="1"
                  />
                </div>
              )}
            </div>

            {/* Display Order */}
            <div className="grid grid-cols-3 items-center gap-4 border-t border-slate-100 pt-4">
              <label className="font-semibold text-slate-700 text-left">Thứ tự hiển thị bình luận</label>
              <select 
                value={commentOrder}
                onChange={(e) => setCommentOrder(e.target.value)}
                className="col-span-2 max-w-xs px-3 py-2 border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-slate-700 bg-white font-medium cursor-pointer"
              >
                <option value="asc">Bình luận cũ hơn ở đầu mỗi trang (Cũ nhất trước)</option>
                <option value="desc">Bình luận mới hơn ở đầu mỗi trang (Mới nhất trước)</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </form>
  );
}
