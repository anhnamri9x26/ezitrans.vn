"use client";

import React, { useState, useEffect } from 'react';
import PostEditorCore from '@/components/PostEditorCore';
import ProductMetaPanel from './components/ProductMetaPanel';
import ProductGalleryPanel, { ProductGalleryData } from './components/ProductGalleryPanel';
import ProductShortDescriptionPanel from './components/ProductShortDescriptionPanel';

interface ProductEditorPageProps {
  productId?: number;
}

const defaultProductData: ProductGalleryData = {
  salesStatus: 'AVAILABLE',
  stockStatus: 'IN_STOCK',
  isFeatured: false,
  galleryIds: '[]',
  productKind: 'SIMPLE',
  priceMode: 'CONTACT_QUOTE',
  unit: 'kg',
  manageStock: false,
  allowBackorder: false,
  dynamicSpecs: '[]',
  specTable: '[]',
  documents: '[]',
  ctaLabel: 'Yêu cầu báo giá',
  quoteNote: 'Giá thay đổi theo quy cách và số lượng đặt hàng.'
};

export default function ProductEditorPage({ productId }: ProductEditorPageProps) {
  const [productData, setProductData] = useState<ProductGalleryData>(defaultProductData);

  // Load existing data if edit mode
  useEffect(() => {
    if (productId) {
      fetch(`/api/posts/${productId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.post && data.post.productMeta) {
            setProductData({ ...defaultProductData, ...data.post.productMeta });
          }
        })
        .catch(console.error);
    }
  }, [productId]);

  const handleProductDataChange = (newData: ProductGalleryData) => {
    setProductData(newData);
  };

  return (
    <PostEditorCore
      postType="PRODUCT"
      editId={productId}
      backUrl="/admin/products"
      backLabel="Sản phẩm"
      createTitle="Thêm Sản Phẩm Mới"
      editTitle="Chỉnh sửa sản phẩm"
      showCategories={true}
      showTags={true}
      customData={{ productMeta: productData }}
      customPanels={{
        mainWidgets: [
          {
            id: 'product-data',
            title: 'Dữ liệu sản phẩm',
            content: <ProductMetaPanel data={productData} onChange={handleProductDataChange} />
          },
          {
            id: 'product-short-description',
            title: 'Mô tả ngắn sản phẩm',
            content: <ProductShortDescriptionPanel data={productData} onChange={handleProductDataChange} />
          }
        ]
      }}
      customWidgets={[
        {
          id: 'product-gallery',
          title: 'Thư viện ảnh sản phẩm',
          content: <ProductGalleryPanel data={productData} onChange={handleProductDataChange} hideStatus={true} />
        }
      ]}
    />
  );
}
