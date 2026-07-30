"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Upload, Search, X, Copy, Check, Trash2, Calendar, FileText, File, Puzzle } from 'lucide-react';
import CapabilityGuard from '@/components/CapabilityGuard';

interface MediaItem {
  id: number;
  filename: string;
  url: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

interface LibraryAction {
  label: string;
  actionId: string;
  pluginId: string;
  iconName?: string;
}

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [libraryActions, setLibraryActions] = useState<LibraryAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters State
  const [mimeFilter, setMimeFilter] = useState('all'); // 'all' | 'image' | 'other'
  const [dateFilter, setDateFilter] = useState('all'); // 'YYYY-MM'

  // Uploader State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Selected Detail Panel State
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    try {
      const response = await fetch('/api/media');
      const data = await response.json();
      if (data.success) {
        setMediaList(data.mediaList || []);
        setLibraryActions(data.libraryActions || []);
      } else {
        console.error('Failed to load media:', data.error);
      }
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUploadFiles = async (files: FileList) => {
    if (files.length === 0) return;
    setIsUploading(true);

    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/media', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (data.success) {
          uploadedCount++;
        } else {
          console.error(`Failed to upload ${file.name}:`, data.error);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }

    if (uploadedCount > 0) {
      await fetchMedia();
      setIsUploadOpen(false);
    }
    setIsUploading(false);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUploadFiles(e.target.files);
    }
  };

  const handleCopyLink = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleDeleteMedia = async (item: MediaItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá vĩnh viễn tệp tin "${item.filename}" khỏi máy chủ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/media/${item.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setMediaList(mediaList.filter(m => m.id !== item.id));
        if (selectedMedia?.id === item.id) {
          setSelectedMedia(null);
        }
        alert('Đã xóa tệp tin đa phương tiện thành công!');
      } else {
        alert(`Không thể xóa tệp: ${data.error}`);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error('Error deleting media:', error);
    }
  };

  const handlePluginAction = (actionId: string, item: MediaItem) => {
    alert(`Plugin action triggered: ${actionId} cho tệp ${item.filename}\n(V1: Tính năng chưa gọi endpoint thực thi)`);
  };

  // Generate dynamic date options from media list
  const getAvailableMonths = () => {
    const monthsMap = new Map<string, string>();
    mediaList.forEach(item => {
      const date = new Date(item.createdAt);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        const label = `Tháng ${date.getMonth() + 1}, ${year}`;
        monthsMap.set(key, label);
      }
    });
    return Array.from(monthsMap.entries()).map(([key, label]) => ({ key, label }));
  };

  // Helper: Format byte size
  const formatSize = (bytes: number | null) => {
    if (bytes === null) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // Real-time dynamic filtering
  const filteredMedia = mediaList.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesMime = true;
    const isImage = item.mimeType?.startsWith('image/');
    if (mimeFilter === 'image') matchesMime = isImage === true;
    else if (mimeFilter === 'other') matchesMime = isImage === false;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const date = new Date(item.createdAt);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const formatted = `${year}-${month}`;
        matchesDate = formatted === dateFilter;
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesMime && matchesDate;
  });

  return (
    <CapabilityGuard capability="upload_media">
      <div className="max-w-7xl mx-auto font-sans text-[13px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Thư viện Phương tiện</h1>
          <p className="text-xs text-slate-500 mt-1">Tải lên hình ảnh, tài liệu và quản lý các phương tiện lưu trữ</p>
        </div>
        <button 
          onClick={() => setIsUploadOpen(!isUploadOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] cursor-pointer text-xs"
        >
          <Upload size={16} /> {isUploadOpen ? 'Đóng tải lên' : 'Tải tập tin lên'}
        </button>
      </div>

      {/* WordPress-style Drag & Drop Upload Zone */}
      {isUploadOpen && (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging 
              ? 'border-indigo-600 bg-indigo-50/40 text-indigo-600 shadow-inner' 
              : 'border-slate-300 hover:border-slate-400 bg-white text-slate-500'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              <p className="text-xs font-bold text-slate-700">Đang tải lên máy chủ, vui lòng đợi...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <Upload size={40} className={`opacity-70 transition-transform ${isDragging ? 'scale-110 text-indigo-600' : ''}`} />
              <div>
                <p className="text-sm font-bold text-slate-700">Kéo thả các tập tin vào đây để tải lên</p>
                <p className="text-xs text-slate-400 font-medium mt-1">hoặc</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm active:scale-[0.98] cursor-pointer text-slate-700"
              >
                Chọn tập tin
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />
              <p className="text-[10px] text-slate-400 font-medium">Hỗ trợ tải lên nhiều hình ảnh, tài liệu (JPG, PNG, GIF, WEBP, PDF...)</p>
            </div>
          )}
        </div>
      )}

      {/* Main Content: Grid left, details sidebar right */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Side: Media grid with filters */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-5 w-full">
          {/* Filters Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
              {/* Type Filter */}
              <select
                value={mimeFilter}
                onChange={(e) => setMimeFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none bg-white font-semibold text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer h-9"
              >
                <option value="all">Tất cả phương tiện</option>
                <option value="image">Hình ảnh</option>
                <option value="other">Tài liệu & Tệp khác</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none bg-white font-semibold text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer h-9"
              >
                <option value="all">Tất cả ngày tháng</option>
                {getAvailableMonths().map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm tên tệp tin..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs w-full h-9 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold text-slate-700 bg-white"
              />
            </div>
          </div>

          {/* Grid list */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 min-h-[300px]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square bg-slate-50 border border-slate-200/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[350px] border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30 text-slate-400">
              <ImageIcon size={36} className="opacity-50 mb-2" />
              <p className="font-semibold text-xs">Chưa có phương tiện nào khớp với bộ lọc!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredMedia.map((item) => {
                const isImage = item.mimeType?.startsWith('image/');
                const isSelected = selectedMedia?.id === item.id;

                return (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedMedia(item)}
                    className={`group relative aspect-square bg-slate-50 rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm scale-[0.98]' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isImage ? (
                      <img 
                        src={item.url} 
                        alt={item.filename} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2">
                        {item.mimeType === 'application/pdf' ? (
                          <FileText size={32} className="text-red-500 mb-1" />
                        ) : (
                          <File size={32} className="text-slate-400 mb-1" />
                        )}
                        <span className="text-[10px] font-bold text-center break-all line-clamp-1 w-full px-1">
                          {item.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                      </div>
                    )}
                    
                    {/* Bottom overlay filename bar */}
                    <div className="absolute inset-x-0 bottom-0 bg-white/90 px-2 py-1.5 border-t border-slate-100 text-[10px] truncate font-semibold text-slate-700 select-none group-hover:text-indigo-600 transition-colors">
                      {item.filename}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: WordPress-style details panel drawer */}
        {selectedMedia && (
          <div className="w-full lg:w-80 lg:sticky lg:top-6 bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-5 animate-fade-in shrink-0 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg cursor-pointer transition-colors outline-none"
            >
              <X size={14} />
            </button>

            <h3 className="text-sm font-bold border-b border-slate-100 pb-2 text-slate-800">
              Chi tiết tệp tin
            </h3>

            {/* Thumbnail Preview */}
            <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
              {selectedMedia.mimeType?.startsWith('image/') ? (
                <img 
                  src={selectedMedia.url} 
                  alt={selectedMedia.filename} 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-slate-400 flex flex-col items-center gap-1 font-semibold text-xs">
                  {selectedMedia.mimeType === 'application/pdf' ? (
                    <FileText size={40} className="text-red-500" />
                  ) : (
                    <File size={40} className="text-slate-400" />
                  )}
                  Tài liệu văn bản
                </div>
              )}
            </div>

            {/* Meta Attributes */}
            <div className="space-y-2 border-b border-slate-100 pb-4 text-xs font-semibold text-slate-600">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Tên tệp tin:</span>
                <span className="text-slate-800 break-all">{selectedMedia.filename}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Loại tệp:</span>
                <span className="text-slate-700 text-[11px] font-bold">{selectedMedia.mimeType || 'Không rõ'}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Kích thước:</span>
                <span className="text-slate-700 text-[11px] font-bold">{formatSize(selectedMedia.size)}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Đã tải lên:</span>
                <span className="text-slate-700 text-[11px] font-bold">
                  {new Date(selectedMedia.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Copy File Link */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Liên kết tệp tin (URL):</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={selectedMedia.url} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-brand-600 font-bold outline-none select-all"
                />
                <button 
                  onClick={() => handleCopyLink(selectedMedia)}
                  className={`px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 transition-colors flex items-center justify-center shrink-0 cursor-pointer ${
                    copiedId === selectedMedia.id ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-white hover:bg-slate-50'
                  }`}
                  title="Sao chép đường dẫn"
                >
                  {copiedId === selectedMedia.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Deletion action */}
            <button 
              onClick={() => handleDeleteMedia(selectedMedia)}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer outline-none"
            >
              <Trash2 size={14} />
              Xóa tệp vĩnh viễn
            </button>

            {/* Plugin Actions */}
            {libraryActions.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-2">Từ Plugin mở rộng:</label>
                {libraryActions.map(action => (
                  <button 
                    key={action.actionId}
                    onClick={() => handlePluginAction(action.actionId, selectedMedia)}
                    className="w-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold py-2.5 px-4 rounded-lg text-xs transition-colors border border-slate-200 outline-none flex items-center justify-center gap-1.5"
                  >
                    <Puzzle size={14} className="opacity-70" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      </div>
    </CapabilityGuard>
  );
}
