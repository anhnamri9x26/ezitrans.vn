"use client";

import React from 'react';
import { ProductMetaData } from './ProductMetaPanel';

interface ProductShortDescriptionPanelProps {
  data: ProductMetaData;
  onChange: (data: ProductMetaData) => void;
}

export default function ProductShortDescriptionPanel({ data, onChange }: ProductShortDescriptionPanelProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider">
          Mô tả ngắn sản phẩm
        </label>
        <textarea
          value={data.shortDescription || ''}
          onChange={(e) => onChange({ ...data, shortDescription: e.target.value })}
          rows={5}
          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 bg-white dark:bg-slate-800 text-sm custom-scrollbar"
          placeholder="Nhập mô tả ngắn hiển thị ở phần tóm tắt sản phẩm, khu vực báo giá hoặc trang danh sách..."
        />
      </div>
      <p className="text-xs text-slate-500">
        Nội dung này là mô tả marketing ngắn hiển thị ở frontend, không phải dữ liệu kỹ thuật.
      </p>
    </div>
  );
}
