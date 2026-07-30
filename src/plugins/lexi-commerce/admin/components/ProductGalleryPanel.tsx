"use client";

import React, { useState } from 'react';
import { ImageIcon, X } from 'lucide-react';
import MediaModal from '@/components/MediaModal';
import { ProductMetaData } from './ProductMetaPanel';

export interface ProductGalleryData extends ProductMetaData {
  salesStatus?: string;
  stockStatus?: string;
  isFeatured?: boolean;
  galleryIds?: string; // JSON string array of image URLs
}

interface ProductGalleryPanelProps {
  data: ProductGalleryData;
  onChange: (data: ProductGalleryData) => void;
  hideStatus?: boolean;
  hideGallery?: boolean;
}

const safeParseGallery = (value?: string): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((url) => typeof url === 'string' && url.trim() !== '') : [];
  } catch {
    return [];
  }
};

export default function ProductGalleryPanel({ data, onChange, hideStatus, hideGallery }: ProductGalleryPanelProps) {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const galleryUrls: string[] = safeParseGallery(data.galleryIds);

  const handleChange = (field: keyof ProductGalleryData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleAddImage = (image: any) => {
    const newUrls = Array.from(new Set([...galleryUrls, image.url].filter(Boolean)));
    handleChange('galleryIds', JSON.stringify(newUrls));
  };

  const handleRemoveImage = (index: number) => {
    const newUrls = [...galleryUrls];
    newUrls.splice(index, 1);
    handleChange('galleryIds', JSON.stringify(newUrls));
  };

  return (
    <>
      {!hideStatus && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trạng thái kinh doanh</label>
            <select
              value={data.salesStatus || 'AVAILABLE'}
              onChange={(e) => handleChange('salesStatus', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-brand-500 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="AVAILABLE">Đang bán</option>
              <option value="COMING_SOON">Sắp ra mắt</option>
              <option value="DISCONTINUED">Ngừng kinh doanh</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tình trạng kho hàng</label>
            <select
              value={data.stockStatus || 'IN_STOCK'}
              onChange={(e) => handleChange('stockStatus', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-brand-500 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="IN_STOCK">Có sẵn</option>
              <option value="PRE_ORDER">Đặt hàng trước</option>
              <option value="OUT_OF_STOCK">Hết hàng</option>
              <option value="IMPORT_ON_DEMAND">Nhập khẩu theo yêu cầu</option>
              <option value="CUT_TO_ORDER">Cắt theo yêu cầu</option>
              <option value="CONTACT_TO_CHECK">Liên hệ kiểm tra tồn kho</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2 group">
            <input 
              type="checkbox" 
              checked={data.isFeatured || false}
              onChange={(e) => handleChange('isFeatured', e.target.checked)}
              className="rounded text-brand-500 focus:ring-brand-500/30 border-slate-300 w-4 h-4 cursor-pointer" 
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-brand-600 transition-colors">Sản phẩm nổi bật</span>
          </label>
        </div>
      )}

      {!hideGallery && (
        <div className="space-y-3">
          {galleryUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {galleryUrls.map((url, idx) => (
                <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={url} alt={`Gallery \${idx}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                      title="Xoá ảnh"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button 
            type="button"
            onClick={() => setIsMediaModalOpen(true)}
            className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-brand-50 hover:border-brand-300 transition-colors group"
          >
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full mb-2 group-hover:bg-brand-100 group-hover:text-brand-600 text-slate-400 transition-colors">
              <ImageIcon size={18} />
            </div>
            <p className="font-medium text-slate-600 group-hover:text-brand-600 text-xs">Thêm ảnh vào thư viện</p>
          </button>
        </div>
      )}

      {!hideGallery && (
        <MediaModal 
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          multiple={true}
          onSelect={() => {}} // fallback if multiple is not used, though we enabled multiple
          onSelectMultiple={(images) => {
            const newUrls = Array.from(new Set([...galleryUrls, ...images.map(img => img.url)].filter(Boolean)));
            handleChange('galleryIds', JSON.stringify(newUrls));
          }}
        />
      )}
    </>
  );
}
