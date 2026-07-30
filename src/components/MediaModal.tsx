"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Check } from 'lucide-react';

interface MediaItem {
  id: number;
  filename: string;
  url: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: { id: number; url: string }) => void;
  selectedId?: number | null;
  multiple?: boolean;
  onSelectMultiple?: (images: { id: number; url: string }[]) => void;
}

export default function MediaModal({ isOpen, onClose, onSelect, selectedId, multiple, onSelectMultiple }: MediaModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/media');
      const data = await response.json();
      if (data.success) {
        setMediaList(data.mediaList || []);
        // Auto-select the current featured image if it exists in the list
        if (selectedId) {
          const current = data.mediaList.find((item: MediaItem) => item.id === selectedId);
          if (current) {
            setSelectedItem(current);
            setSelectedItems([current]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, selectedId]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success && data.media) {
        // Add to list and select it
        setMediaList([data.media, ...mediaList]);
        setSelectedItem(data.media);
        if (multiple) {
          setSelectedItems([...selectedItems, data.media]);
        } else {
          setSelectedItems([data.media]);
        }
        // Switch to library tab
        setActiveTab('library');
      } else {
        alert('Tải lên thất bại: ' + (data.error || 'Lỗi không xác định'));
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ!');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isUploading) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleConfirmSelect = () => {
    if (multiple && onSelectMultiple) {
      onSelectMultiple(selectedItems.map(item => ({ id: item.id, url: item.url })));
      onClose();
    } else if (selectedItem) {
      onSelect({ id: selectedItem.id, url: selectedItem.url });
      onClose();
    }
  };

  const handleToggleItem = (item: MediaItem) => {
    if (multiple) {
      const isSelected = selectedItems.some(i => i.id === item.id);
      if (isSelected) {
        setSelectedItems(selectedItems.filter(i => i.id !== item.id));
        if (selectedItem?.id === item.id) {
          setSelectedItem(selectedItems.length > 1 ? selectedItems.find(i => i.id !== item.id) || null : null);
        }
      } else {
        setSelectedItems([...selectedItems, item]);
        setSelectedItem(item);
      }
    } else {
      setSelectedItem(item);
      setSelectedItems([item]);
    }
  };

  const formatBytes = (bytes: number | null, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100"
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Thư viện phương tiện</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-slate-100 bg-slate-50/50 flex gap-4 text-xs font-semibold text-slate-500">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`py-3.5 border-b-2 transition-all ${activeTab === 'upload' ? 'border-brand-500 text-brand-600 font-bold' : 'border-transparent hover:text-slate-800'}`}
          >
            Tải tập tin lên
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`py-3.5 border-b-2 transition-all ${activeTab === 'library' ? 'border-brand-500 text-brand-600 font-bold' : 'border-transparent hover:text-slate-800'}`}
          >
            Thư viện
          </button>
        </div>

        {/* Modal Main Content Container */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Active Tab View */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            
            {activeTab === 'upload' ? (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-xl h-full flex flex-col items-center justify-center text-center p-8 cursor-pointer transition-all ${isUploading ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'border-slate-300 hover:bg-brand-50/30 hover:border-brand-300 group'}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                  accept="image/*"
                  disabled={isUploading}
                />
                <div className={`p-4 rounded-full mb-4 transition-colors ${isUploading ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-slate-100 text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600'}`}>
                  <Upload size={32} />
                </div>
                {isUploading ? (
                  <div>
                    <p className="font-semibold text-slate-700">Đang tải tập tin lên hệ thống...</p>
                    <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-slate-700 group-hover:text-brand-700 transition-colors">Thả tập tin vào đây để tải lên</p>
                    <p className="text-xs text-slate-400 mt-1.5">Hoặc click để chọn tệp từ máy tính của bạn</p>
                    <p className="text-[10px] text-slate-400/80 mt-1">Hỗ trợ JPG, PNG, WEBP, GIF</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {isLoading && mediaList.length === 0 ? (
                  <div className="flex items-center justify-center py-20 text-slate-400 font-medium animate-pulse">
                    Đang tải thư viện ảnh...
                  </div>
                ) : mediaList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                    <ImageIcon size={48} className="opacity-30 mb-3" />
                    <p className="font-medium">Chưa có phương tiện nào trong thư viện</p>
                    <button 
                      onClick={() => setActiveTab('upload')}
                      className="mt-3 text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Tải lên hình ảnh đầu tiên &rarr;
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {mediaList.map((item) => {
                      const isSelected = multiple ? selectedItems.some(i => i.id === item.id) : selectedItem?.id === item.id;
                      return (
                        <div 
                          key={item.id}
                          onClick={() => handleToggleItem(item)}
                          className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer group bg-slate-50 transition-all ${isSelected ? 'border-brand-500 ring-2 ring-brand-500/20 scale-[0.98]' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <img 
                            src={item.url} 
                            alt={item.filename} 
                            className="w-full h-full object-cover select-none"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-brand-500 text-white p-1 rounded-full shadow-md z-10">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sidebar Detail Area */}
          {activeTab === 'library' && (
            <div className="w-72 border-l border-slate-100 p-6 bg-slate-50/50 flex flex-col justify-between overflow-y-auto">
              {selectedItem ? (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Thông tin phương tiện</h3>
                  <div className="aspect-video bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-1.5 shadow-sm">
                    <img 
                      src={selectedItem.url} 
                      alt={selectedItem.filename} 
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-2 border-b border-slate-200/60 pb-4">
                    <p className="font-semibold text-slate-700 break-all">{selectedItem.filename}</p>
                    <p><span className="font-medium text-slate-400">Ngày đăng:</span> {new Date(selectedItem.createdAt).toLocaleDateString('vi-VN')}</p>
                    <p><span className="font-medium text-slate-400">Dung lượng:</span> {formatBytes(selectedItem.size)}</p>
                    <p><span className="font-medium text-slate-400">Định dạng:</span> {selectedItem.mimeType || 'Không rõ'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Liên kết tệp</label>
                    <input 
                      type="text" 
                      value={selectedItem.url} 
                      readOnly 
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded text-slate-600 cursor-pointer outline-none focus:border-slate-300"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-10">
                  <ImageIcon size={32} className="opacity-30 mb-2" />
                  <p className="text-xs">Chọn hình ảnh trong thư viện để xem thông tin chi tiết</p>
                </div>
              )}

              {/* Confirm Actions */}
              <div className="pt-6 border-t border-slate-200/60 mt-6 flex gap-2">
                <button 
                  onClick={onClose}
                  className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex-1"
                >
                  Huỷ bỏ
                </button>
                <button 
                  disabled={multiple ? selectedItems.length === 0 : !selectedItem}
                  onClick={handleConfirmSelect}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all hover:shadow-brand-500/20 active:translate-y-0.5 flex-1"
                >
                  {multiple && selectedItems.length > 0 ? `Chọn ${selectedItems.length} ảnh` : 'Chọn ảnh'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
