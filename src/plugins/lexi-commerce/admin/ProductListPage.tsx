"use client";

import React from 'react';
import AdminContentList from '@/components/AdminContentList';

export default function ProductListPage() {
  return (
    <AdminContentList
      type="PRODUCT"
      title="Tất cả sản phẩm"
      description="Quản lý, tìm kiếm và tối ưu danh mục sản phẩm của website"
    />
  );
}
