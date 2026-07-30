'use client';

import React, { useState, useEffect } from 'react';
import { X, History, RotateCcw, FileText, Trash2 } from 'lucide-react';
import { stripHtml } from '@/lib/diff';

interface Revision {
  id: number;
  postId: number;
  title: string;
  content: string | null;
  slug: string;
  createdAt: string;
}

interface RevisionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  currentTitle: string;
  currentContent: string;
  currentSlug: string;
  onRestore: (restoredData: { title: string; content: string; slug: string }) => void;
}

export default function RevisionsModal({
  isOpen,
  onClose,
  postId,
  currentTitle,
  currentContent,
  currentSlug,
  onRestore,
}: RevisionsModalProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts/${postId}/revisions`);
      const data = await res.json();
      if (data.success) {
        setRevisions(data.revisions);
        if (data.revisions.length > 0) {
          setSelectedRevision(data.revisions[0]);
        } else {
          setSelectedRevision(null);
        }
      }
    } catch (err) {
      console.error('Error fetching revisions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && postId) {
      fetchRevisions();
    }
  }, [isOpen, postId]);

  if (!isOpen) return null;

  const handleRestore = async (revision: Revision) => {
    if (!confirm(`Bạn có chắc chắn muốn khôi phục bài viết về phiên bản từ ${formatTime(revision.createdAt)} không? Phiên bản hiện tại trước khôi phục sẽ được lưu lại làm bản sao lưu.`)) {
      return;
    }
    try {
      setRestoring(true);
      const res = await fetch(`/api/posts/${postId}/revisions/${revision.id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        onRestore({
          title: revision.title,
          content: revision.content || '',
          slug: revision.slug,
        });
        onClose();
      } else {
        alert(data.error || 'Khôi phục thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi khôi phục');
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteSingle = async (e: React.MouseEvent, revisionId: number) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa bản sửa đổi này không?')) return;
    
    try {
      setDeleting(true);
      const res = await fetch(`/api/posts/${postId}/revisions/${revisionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        const updatedRevs = revisions.filter(r => r.id !== revisionId);
        setRevisions(updatedRevs);
        
        if (selectedRevision?.id === revisionId) {
          setSelectedRevision(updatedRevs[0] || null);
        }
        
        setSelectedIds(prev => prev.filter(id => id !== revisionId));
      } else {
        alert(data.error || 'Xóa thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi xóa bản sửa đổi');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} bản sửa đổi đã chọn không?`)) return;
    
    try {
      setDeleting(true);
      const res = await fetch(`/api/posts/${postId}/revisions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedRevs = revisions.filter(r => !selectedIds.includes(r.id));
        setRevisions(updatedRevs);
        
        if (selectedRevision && selectedIds.includes(selectedRevision.id)) {
          setSelectedRevision(updatedRevs[0] || null);
        }
        
        setSelectedIds([]);
      } else {
        alert(data.error || 'Xóa thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi xóa các bản sửa đổi');
    } finally {
      setDeleting(false);
    }
  };

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const isTitleChanged = selectedRevision ? selectedRevision.title !== currentTitle : false;
  const isSlugChanged = selectedRevision ? selectedRevision.slug !== currentSlug : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in text-slate-800">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-all scale-100 animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                Lịch sử chỉnh sửa (Revisions)
              </h3>
              <p className="text-xs text-slate-500">
                Xem lại các thay đổi và khôi phục về trạng thái trước đó. Tối đa 50 phiên bản gần nhất.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-white">
          
          {/* Left Sidebar - Revisions List */}
          <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center h-14">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Các bản sửa đổi ({revisions.length})
              </span>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleDeleteMultiple}
                  disabled={deleting}
                  className="text-[11px] font-bold text-red-600 hover:text-white hover:bg-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={11} />
                  Xóa ({selectedIds.length})
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-sm">Đang tải lịch sử...</span>
                </div>
              ) : revisions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <History size={36} className="text-slate-300 mb-2" />
                  <span className="text-sm text-slate-500 font-medium">Chưa có bản sửa đổi nào</span>
                  <span className="text-xs text-slate-400 mt-1">Các bản lưu sẽ tự động tạo khi có thay đổi được lưu.</span>
                </div>
              ) : (
                revisions.map((rev, index) => {
                  const isSelected = selectedRevision?.id === rev.id;
                  const isChecked = selectedIds.includes(rev.id);
                  return (
                    <div
                      key={rev.id}
                      className={`w-full group/item relative rounded-xl transition border flex items-center gap-2 pr-3 pl-2.5 py-3 ${
                        isSelected
                          ? 'bg-indigo-50/60 border-indigo-200'
                          : 'border-slate-100 hover:bg-slate-100/70'
                      }`}
                    >
                      {/* Checkbox for batch action */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, rev.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== rev.id));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500/30 border-slate-300 w-3.5 h-3.5 cursor-pointer"
                      />

                      {/* Clickable Card Body */}
                      <div
                        onClick={() => setSelectedRevision(rev)}
                        className="flex-1 cursor-pointer min-w-0"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-semibold text-xs ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-700'}`}>
                            {formatTime(rev.createdAt)}
                          </span>
                          {index === 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-medium">
                              Mới nhất
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate max-w-xs block font-mono mt-0.5">
                          ID: #{rev.id} • {rev.slug}
                        </span>
                      </div>

                      {/* Trash button (visible on hover) */}
                      <button
                        onClick={(e) => handleDeleteSingle(e, rev.id)}
                        disabled={deleting}
                        className="opacity-0 group-hover/item:opacity-100 p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition disabled:opacity-30 cursor-pointer"
                        title="Xóa bản sửa đổi này"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel - Comparison view */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {selectedRevision ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Control bar for Comparison */}
                <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full">
                    <FileText size={13} />
                    Đang so sánh bản sửa đổi với bản nháp hiện tại
                  </span>

                  <button
                    onClick={() => handleRestore(selectedRevision)}
                    disabled={restoring}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-md hover:shadow-indigo-500/10 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    {restoring ? 'Đang khôi phục...' : 'Khôi phục phiên bản này'}
                  </button>
                </div>

                {/* Split Comparison Area */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-2 gap-5 h-full">
                    {/* Left: Selected Revision */}
                    <div className="border border-slate-200 rounded-2xl flex flex-col overflow-hidden bg-white shadow-sm">
                      <div className="px-4 py-3 bg-amber-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-amber-800 font-semibold text-xs">Bản sửa đổi ({formatTime(selectedRevision.createdAt)})</span>
                        <span className="font-mono bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold">REVISION</span>
                      </div>
                      <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-white">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tiêu đề</span>
                          <h4 className="font-bold text-base text-slate-800 leading-snug">{selectedRevision.title}</h4>
                        </div>
                        <hr className="border-slate-100" />
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Slug</span>
                          <code className={`text-xs font-mono block break-all px-2 py-1 rounded w-fit ${
                            isSlugChanged 
                              ? 'bg-amber-50 text-amber-700 font-semibold' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {selectedRevision.slug}
                          </code>
                        </div>
                        <hr className="border-slate-100" />
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nội dung</span>
                          <div className="text-xs whitespace-pre-wrap leading-relaxed font-sans break-words overflow-x-hidden text-slate-600">
                            {stripHtml(selectedRevision.content || '')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Current Draft */}
                    <div className="border border-slate-200 rounded-2xl flex flex-col overflow-hidden bg-white shadow-sm">
                      <div className="px-4 py-3 bg-sky-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-sky-800 font-semibold text-xs">Bản nháp hiện tại</span>
                        <span className="font-mono bg-sky-100 text-sky-700 text-[10px] px-2 py-0.5 rounded font-bold">CURRENT</span>
                      </div>
                      <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-white">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tiêu đề</span>
                          <h4 className="font-bold text-base text-slate-800 leading-snug">{currentTitle}</h4>
                        </div>
                        <hr className="border-slate-100" />
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Slug</span>
                          <code className={`text-xs font-mono block break-all px-2 py-1 rounded w-fit ${
                            isSlugChanged 
                              ? 'bg-sky-50 text-sky-700 font-semibold' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {currentSlug}
                          </code>
                        </div>
                        <hr className="border-slate-100" />
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nội dung</span>
                          <div className="text-xs whitespace-pre-wrap leading-relaxed font-sans break-words overflow-x-hidden text-slate-600">
                            {stripHtml(currentContent)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                <History size={48} className="text-slate-300 mb-3 animate-pulse" />
                <h4 className="font-semibold text-slate-700 text-sm">Chọn một phiên bản sửa đổi từ danh sách bên trái</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Bạn có thể xem sự khác biệt chi tiết so với nội dung hiện tại và quyết định khôi phục lại khi cần.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
