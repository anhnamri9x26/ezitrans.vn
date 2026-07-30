"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Clock, Star, GitCompare, Edit2, Check, X,
  Trash2, RefreshCw, Eye, MoreVertical
} from 'lucide-react';
import CompareModal from '../components/CompareModal';

export interface Revision {
  id: string;
  version: number;
  revisionName: string | null;
  builderData: string;
  htmlContent: string;
  createdAt: string;
  commitMessage: string | null;
  isStarred: boolean;
  createdBy?: {
    name: string;
  } | null;
}

interface HistoryPanelProps {
  postId?: number;
  templateId?: number;
  ramHistory: { json: string; description: string; timestamp: Date }[];
  historyPointer: number;
  onSelectRamHistory: (index: number) => void;
  currentJson: string;
  onRestoreRevision: (builderData: string) => void;
  lastSavedAt?: Date | null;
  onPreviewRevision?: (revision: Revision | null) => void;
  previewingRevisionId?: string | null;
  restoreRef?: React.MutableRefObject<((revision: Revision) => Promise<void>) | null>;
}

type RevisionType = {
  label: 'MANUAL SAVE' | 'RESTORE' | 'AUTO BACKUP';
  className: string;
  dotClassName: string;
};

const normalizeJson = (value: string) => {
  try {
    return JSON.stringify(JSON.parse(value));
  } catch {
    return value;
  }
};

const getRevisionType = (revision: Revision): RevisionType => {
  const name = (revision.revisionName || '').toLowerCase();
  const message = (revision.commitMessage || '').toLowerCase();

  if (name.startsWith('trước khi khôi phục') || message.includes('backup tự động')) {
    return {
      label: 'AUTO BACKUP',
      className: 'bg-sky-50 text-sky-700 border-sky-100',
      dotClassName: 'bg-sky-500',
    };
  }

  if (name.startsWith('khôi phục từ') || message.includes('đã khôi phục')) {
    return {
      label: 'RESTORE',
      className: 'bg-violet-50 text-violet-700 border-violet-100',
      dotClassName: 'bg-violet-500',
    };
  }

  return {
    label: 'MANUAL SAVE',
    className: 'bg-teal-50 text-teal-700 border-teal-100',
    dotClassName: 'bg-teal-500',
  };
};

const formatElementorTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  
  let relative = '';
  if (diffSeconds < 45) {
    relative = 'Vừa xong';
  } else {
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      relative = `${diffMinutes} phút trước`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) {
        relative = `${diffHours} giờ trước`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) {
          relative = `${diffDays} ngày trước`;
        } else {
          relative = date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
        }
      }
    }
  }

  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayName = days[date.getDay()];
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStrFormatted = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;
  return `${relative} (${dateStrFormatted} lúc ${timeStr})`;
};

export default function HistoryPanel({
  postId,
  templateId,
  ramHistory,
  historyPointer,
  onSelectRamHistory,
  currentJson,
  onRestoreRevision,
  lastSavedAt,
  onPreviewRevision,
  previewingRevisionId,
  restoreRef,
}: HistoryPanelProps) {
  const [subTab, setSubTab] = useState<'actions' | 'versions'>('actions');
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Preview / Edit metadata states
  const [editingRevisionId, setEditingRevisionId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [updatingMetadata, setUpdatingMetadata] = useState(false);

  // Compare state
  const [comparingRevision, setComparingRevision] = useState<Revision | null>(null);
  const [localPreviewingRevisionId, setLocalPreviewingRevisionId] = useState<string | null>(null);

  const activePreviewId = onPreviewRevision ? previewingRevisionId : localPreviewingRevisionId;

  // Selected Revision for Elementor Action Bar
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);

  // Hover preview states
  const [hoveredRevisionId, setHoveredRevisionId] = useState<string | null>(null);
  const [hoveredRect, setHoveredRect] = useState<{ top: number; bottom: number } | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredRevisionId(id);
      setHoveredRect({ top: rect.top, bottom: rect.bottom });
    }, 350);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    setHoveredRevisionId(null);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const activeDbRevisionId = useMemo(() => {
    const normalizedCurrent = normalizeJson(currentJson);
    return revisions.find((rev) => normalizeJson(rev.builderData) === normalizedCurrent)?.id || null;
  }, [currentJson, revisions]);

  const fetchRevisions = useCallback(async () => {
    if (!postId && !templateId) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (postId) queryParams.set('postId', postId.toString());
      if (templateId) queryParams.set('templateId', templateId.toString());

      const res = await fetch(`/api/revisions?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRevisions(data.revisions);
      } else {
        setError(data.error || 'Failed to fetch revisions');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch revisions');
    } finally {
      setLoading(false);
    }
  }, [postId, templateId]);

  useEffect(() => {
    if (subTab !== 'versions') return;

    const refreshTimer = window.setTimeout(() => {
      fetchRevisions();
    }, 0);

    return () => window.clearTimeout(refreshTimer);
  }, [subTab, lastSavedAt, fetchRevisions]);

  useEffect(() => {
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // Star / Unstar
  const handleToggleStar = async (revision: Revision) => {
    setActiveMenuId(null);
    try {
      const res = await fetch(`/api/revisions/${revision.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !revision.isStarred }),
      });
      const data = await res.json();
      if (data.success) {
        setRevisions(prev => prev.map(r => r.id === revision.id ? { ...r, isStarred: !r.isStarred } : r));
        if (selectedRevision?.id === revision.id) {
          setSelectedRevision(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Revision
  const handleDeleteRevision = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản lưu này không?')) return;
    try {
      const res = await fetch(`/api/revisions/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setRevisions(prev => prev.filter(r => r.id !== id));
        if (selectedRevision?.id === id) {
          setSelectedRevision(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Duplicate Revision
  const handleDuplicateRevision = async (id: string) => {
    setActiveMenuId(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/revisions/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Nhân bản thành công!');
        fetchRevisions(); // reload DB revisions log
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Nhân bản thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Start Edit metadata
  const startEditMetadata = (revision: Revision) => {
    setEditingRevisionId(revision.id);
    setEditName(revision.revisionName || `Bản lưu v${revision.version}`);
    setEditMessage(revision.commitMessage || '');
  };

  // Save metadata
  const saveMetadata = async (id: string) => {
    setUpdatingMetadata(true);
    try {
      const res = await fetch(`/api/revisions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionName: editName, commitMessage: editMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setRevisions(prev => prev.map(r => r.id === id ? { ...r, revisionName: editName, commitMessage: editMessage } : r));
        setEditingRevisionId(null);
        if (selectedRevision?.id === id) {
          setSelectedRevision(prev => prev ? { ...prev, revisionName: editName, commitMessage: editMessage } : null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingMetadata(false);
    }
  };

  // Restore Revision (Git-revert style)
  const handleRestore = useCallback(async (revision: Revision) => {
    if (!confirm(`Bạn có chắc muốn khôi phục về "${revision.revisionName || `Bản lưu v${revision.version}`}"? Thao tác này sẽ tự động tạo một phiên bản Backup mới.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/revisions/${revision.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      const data = await res.json();
      if (data.success) {
        onRestoreRevision(revision.builderData);
        alert(data.message || 'Khôi phục thành công!');
        setSelectedRevision(null);
        fetchRevisions(); // reload DB revisions log
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Khôi phục thất bại');
    } finally {
      setLoading(false);
    }
  }, [onRestoreRevision, fetchRevisions]);

  useEffect(() => {
    if (restoreRef) {
      restoreRef.current = handleRestore;
    }
    return () => {
      if (restoreRef) {
        restoreRef.current = null;
      }
    };
  }, [restoreRef, handleRestore]);

  return (
    <div className="flex flex-col h-full bg-white text-slate-700 select-none">
      {/* Sub-tabs header */}
      <div className="flex border-b border-slate-200 shrink-0 bg-slate-50 p-1 gap-1">
        <button
          onClick={() => {
            setSubTab('actions');
            setSelectedRevision(null);
          }}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer border ${
            subTab === 'actions'
              ? 'bg-white text-slate-800 shadow-sm border-slate-200/60'
              : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 border-transparent'
          }`}
        >
          Hành động
        </button>
        <button
          onClick={() => setSubTab('versions')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer border ${
            subTab === 'versions'
              ? 'bg-white text-slate-800 shadow-sm border-slate-200/60'
              : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 border-transparent'
          }`}
        >
          Bản sửa đổi
        </button>
      </div>

      {/* Main panel scroll container */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-3">
        {subTab === 'actions' ? (
          /* RAM Actions Stack list */
          <div className="space-y-1">
            {ramHistory.length === 0 ? (
              <div className="text-center text-slate-400 py-10 text-xs">
                Chưa có thao tác nào được thực hiện.
              </div>
            ) : (
              [...ramHistory].reverse().map((item, revIdx) => {
                // Because we reversed, calculate real index
                const idx = ramHistory.length - 1 - revIdx;
                const isActive = idx === historyPointer;
                const isUndone = idx > historyPointer;

                return (
                  <button
                    key={idx}
                    onClick={() => onSelectRamHistory(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-start gap-2.5 group relative cursor-pointer ${
                      isActive
                        ? 'bg-brand-50 border-brand-200 text-brand-600'
                        : isUndone
                          ? 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60'
                          : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isActive 
                        ? 'bg-brand-500 text-white' 
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}>
                      <Clock size={11} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold leading-tight break-words truncate">
                        {item.description}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                        {new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>

                    {isActive && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* DB Versions log */
          <div className="space-y-2.5">
            {loading ? (
              <div className="text-center text-slate-400 py-10 text-xs flex flex-col items-center gap-2">
                <RefreshCw size={18} className="animate-spin text-slate-400" />
                Đang tải danh sách bản lưu...
              </div>
            ) : error ? (
              <div className="text-center text-rose-500 py-10 text-xs font-semibold">
                {error}
              </div>
            ) : revisions.length === 0 ? (
              <div className="text-center text-slate-400 py-10 text-xs">
                Chưa có phiên bản lưu nào.
              </div>
            ) : (
              revisions.map((rev) => {
                const isEditing = editingRevisionId === rev.id;
                const isSelected = selectedRevision?.id === rev.id;
                const isActive = activeDbRevisionId === rev.id;
                const revisionType = getRevisionType(rev);
                const initial = (rev.createdBy?.name || 'lexi').charAt(0).toUpperCase();

                return (
                  <div
                    key={rev.id}
                    onClick={() => {
                      if (!isEditing) {
                        setSelectedRevision(isSelected ? null : rev);
                      }
                    }}
                    className={`border rounded-xl p-3 bg-white transition-all duration-200 flex flex-col gap-2 relative cursor-pointer ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-full flex items-start gap-2.5">
                      {/* Teal Initial Avatar (Ben style) */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all shadow-inner ${
                        isSelected
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {initial}
                      </div>

                      <div className="flex-1 min-w-0 pr-1 select-text">
                        {isEditing ? (
                          <div className="space-y-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full text-xs font-bold px-2 py-1 border border-slate-200 rounded-md focus:outline-none focus:border-brand-500"
                              placeholder="Tên phiên bản..."
                            />
                            <textarea
                              value={editMessage}
                              onChange={(e) => setEditMessage(e.target.value)}
                              className="w-full text-[10px] px-2 py-1 border border-slate-200 rounded-md focus:outline-none focus:border-brand-500 h-12 resize-none"
                              placeholder="Ghi chú bản cập nhật..."
                            />
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => setEditingRevisionId(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                              <button
                                disabled={updatingMetadata}
                                onClick={() => saveMetadata(rev.id)}
                                className="p-1 text-teal-500 hover:text-teal-600 rounded cursor-pointer"
                              >
                                <Check size={12} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-[10px] text-slate-400 font-semibold leading-tight">
                              {formatElementorTime(rev.createdAt)}
                            </p>
                            <p className="text-[11px] font-bold text-slate-800 leading-snug mt-1 break-words flex items-center flex-wrap gap-1.5">
                              <span>
                                {rev.revisionName || (revisionType.label === 'MANUAL SAVE' ? 'Lưu thủ công' : revisionType.label === 'AUTO BACKUP' ? 'Sao lưu tự động' : 'Bản khôi phục')}
                              </span>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded select-none shrink-0">
                                  <span className="w-1 h-1 rounded-full bg-brand-500 inline-block animate-pulse" />
                                  Đang sử dụng
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-snug mt-0.5 font-medium truncate">
                              bởi <span className="font-bold text-slate-600">{rev.createdBy?.name || 'lexi'}</span> {`(#${rev.version})`}
                            </p>
                            {rev.commitMessage && (
                              <p className="text-[9.5px] text-slate-500 mt-1.5 leading-relaxed bg-slate-50 group-hover:bg-white border border-slate-100/60 p-2 rounded-lg font-medium italic break-words">
                              &ldquo;{rev.commitMessage}&rdquo;
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {rev.isStarred && (
                        <div className="ml-auto shrink-0 select-none pt-0.5" title="Stable version">
                          <Star size={11} fill="currentColor" className="text-amber-500 animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Expandable Action Row inside card when selected */}
                    {isSelected && !isEditing && (
                      <div 
                        className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between gap-2 select-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            if (onPreviewRevision) {
                              if (activePreviewId === rev.id) {
                                onPreviewRevision(null);
                              } else {
                                onPreviewRevision(rev);
                              }
                            } else {
                              setLocalPreviewingRevisionId(rev.id);
                            }
                          }}
                          className={`px-3 py-1.5 text-[10px] font-bold text-white rounded-lg shadow-sm cursor-pointer flex items-center gap-1 transition-all ${
                            activePreviewId === rev.id
                              ? 'bg-slate-800 hover:bg-slate-700 shadow-slate-850/20'
                              : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20'
                          }`}
                          title={activePreviewId === rev.id ? "Đang xem trước" : "Xem trước visual"}
                          onMouseEnter={(e) => handleMouseEnter(e, rev.id)}
                          onMouseLeave={handleMouseLeave}
                        >
                          {activePreviewId === rev.id ? (
                            <>
                              <Check size={12} />
                              Đang xem
                            </>
                          ) : (
                            <>
                              <Eye size={12} />
                              Xem trước
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          {!isActive && (
                            <button
                              onClick={() => handleRestore(rev)}
                              className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Khôi phục phiên bản này"
                            >
                              <RefreshCw size={10} />
                              Khôi phục
                            </button>
                          )}
                          
                          <div className="relative">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                setActiveMenuId(activeMenuId === rev.id ? null : rev.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
                              title="Thêm hành động"
                            >
                              <MoreVertical size={14} />
                            </button>
                            
                            {activeMenuId === rev.id && (
                              <div
                                onClick={(event) => event.stopPropagation()}
                                className="absolute right-0 bottom-8 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
                              >
                                <button
                                  onClick={() => {
                                    setComparingRevision(rev);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-[10px] font-bold text-slate-600 hover:bg-brand-50 hover:text-brand-600 flex items-center gap-2"
                                >
                                  <GitCompare size={12} />
                                  So sánh với hiện tại
                                </button>
                                
                                <button
                                  onClick={() => {
                                    handleDuplicateRevision(rev.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-[10px] font-bold text-slate-600 hover:bg-brand-50 hover:text-brand-600 flex items-center gap-2"
                                >
                                  <RefreshCw size={12} className="rotate-180 text-brand-600" />
                                  Nhân bản
                                </button>
                                
                                <button
                                  onClick={() => {
                                    startEditMetadata(rev);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2"
                                >
                                  <Edit2 size={12} />
                                  Đổi tên
                                </button>
                                
                                <button
                                  onClick={() => handleToggleStar(rev)}
                                  className="w-full px-3 py-2 text-left text-[10px] font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2"
                                >
                                  <Star size={12} fill={rev.isStarred ? 'currentColor' : 'none'} className="text-amber-500" />
                                  {rev.isStarred ? 'Bỏ sao (Stable)' : 'Đặt sao (Stable)'}
                                </button>
                                
                                {!rev.isStarred && !isActive && (
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleDeleteRevision(rev.id);
                                    }}
                                    className="w-full px-3 py-2 text-left text-[10px] font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <Trash2 size={12} />
                                    Xóa
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Compare Modal */}
      {comparingRevision && (
        <CompareModal
          isOpen={true}
          onClose={() => setComparingRevision(null)}
          revisionA={comparingRevision}
          revisionB={{
            id: 'current_canvas',
            version: Math.max(...revisions.map(r => r.version), 0) + 1,
            revisionName: 'Canvas Hiện Tại',
            builderData: currentJson,
            htmlContent: '', // HTML diff is computed from stripped contents, compare modal calculates JSON nodes
            createdAt: new Date().toISOString(),
            commitMessage: 'Dữ liệu chỉnh sửa hiện tại',
          }}
        />
      )}

      {/* Visual Sandbox Iframe Preview Modal (Only active if onPreviewRevision is not defined) */}
      {!onPreviewRevision && localPreviewingRevisionId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div 
            className="fixed inset-0 cursor-default" 
            onClick={() => setLocalPreviewingRevisionId(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full h-[80vh] flex flex-col z-10 mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2">
                  <Eye size={16} className="text-brand-600" />
                <span className="text-xs font-bold text-slate-800">
                   Xem trước trực quan phiên bản (v{revisions.find(r => r.id === localPreviewingRevisionId)?.version})
                </span>
              </div>
              <button
                onClick={() => setLocalPreviewingRevisionId(null)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-4 min-h-0">
              <iframe
                src={`/api/revisions/${localPreviewingRevisionId}/preview`}
                className="w-full h-full border border-slate-200 bg-white rounded-lg shadow-inner"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        </div>
      )}

      {/* Debounced Hover Viewport Thumbnail Preview */}
      {hoveredRevisionId && hoveredRect && (
        <div 
          className="fixed z-[200] w-[320px] h-[200px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-none select-none transition-all duration-200 ease-out animate-fade-in"
          style={{
            left: '328px',
            top: `${Math.max(60, Math.min(window.innerHeight - 220, hoveredRect.top - 80))}px`,
          }}
        >
          {/* Header indicator */}
          <div className="absolute top-0 inset-x-0 h-6 bg-slate-900/80 backdrop-blur-sm px-3 flex items-center justify-between text-[9px] text-slate-300 font-bold z-10">
            <span className="truncate">
              Xem nhanh v{revisions.find(r => r.id === hoveredRevisionId)?.version}
            </span>
            <span className="text-brand-600 uppercase">Live View</span>
          </div>
          {/* Zoomed Out Iframe Content */}
          <div className="w-full h-full pt-6 bg-slate-100 relative">
            <iframe
              src={`/api/revisions/${hoveredRevisionId}/preview`}
              className="w-[960px] h-[522px] border-0 absolute top-6 left-0 origin-top-left scale-[0.33]"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}
    </div>
  );
}
