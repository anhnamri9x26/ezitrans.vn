"use client";

import { useEffect, useState, use } from 'react';
import { ProductEditorPage } from '@/plugins/lexi-commerce';
import CapabilityGuard from '@/components/CapabilityGuard';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminProductEditPage({ params }: EditPageProps) {
  const { id: rawId } = use(params);
  const productId = Number(rawId);

  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setEnabled(d.settings?.plugin_lexi_commerce_enabled !== 'false');
      })
      .catch(() => setEnabled(false));
  }, []);

  if (enabled === null) return null; // loading
  if (!enabled) {
    return (
      <div className="p-8 text-center text-slate-500">
        Plugin Lexi Commerce chưa được kích hoạt. Vui lòng kích hoạt trong Cài đặt tính năng.
      </div>
    );
  }

  return (
    <CapabilityGuard capability="edit_products">
      <ProductEditorPage productId={productId} />
    </CapabilityGuard>
  );
}
