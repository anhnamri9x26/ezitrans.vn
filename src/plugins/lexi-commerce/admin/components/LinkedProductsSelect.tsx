"use client";

import React, { useEffect, useRef, useState } from 'react';
import { BadgePercent, Loader2, Search, Sparkles, X } from 'lucide-react';

export type RelationType = 'RELATED' | 'UPSELL' | 'CROSS_SELL' | 'ALTERNATIVE' | 'BUNDLE';
export type DiscountType = 'NONE' | 'AMOUNT' | 'PERCENT';

export interface LinkedProduct {
  id: number;
  title: string;
  relationType?: RelationType;
  reason?: string;
  badge?: string;
  priority?: string;
  ctaLabel?: string;
  offerPrice?: string;
  compareAtPrice?: string;
  discountType?: DiscountType;
  discountValue?: string;
  priceNote?: string;
}

interface LinkedProductsSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const relationOptions: { value: RelationType; label: string; hint: string }[] = [
  { value: 'RELATED', label: 'Liên quan', hint: 'Cùng nhóm / cùng nhu cầu' },
  { value: 'UPSELL', label: 'Upsell', hint: 'Bản nâng cấp' },
  { value: 'CROSS_SELL', label: 'Mua kèm', hint: 'Phụ kiện / bổ trợ' },
  { value: 'BUNDLE', label: 'Combo', hint: 'Bộ sản phẩm tiết kiệm' },
  { value: 'ALTERNATIVE', label: 'Thay thế', hint: 'Cùng tầm giá / còn hàng' },
];

const discountOptions: { value: DiscountType; label: string }[] = [
  { value: 'NONE', label: 'Không giảm' },
  { value: 'AMOUNT', label: 'Giảm tiền' },
  { value: 'PERCENT', label: 'Giảm %' },
];

function normalizeItem(item: LinkedProduct, index: number): LinkedProduct {
  return {
    ...item,
    relationType: item.relationType || 'RELATED',
    reason: item.reason || '',
    badge: item.badge || '',
    priority: item.priority || String(index + 1),
    ctaLabel: item.ctaLabel || 'Xem sản phẩm',
    offerPrice: item.offerPrice || '',
    compareAtPrice: item.compareAtPrice || '',
    discountType: item.discountType || 'NONE',
    discountValue: item.discountValue || '',
    priceNote: item.priceNote || '',
  };
}

function formatCurrency(value?: string) {
  const number = Number(String(value || '').replace(/[^0-9]/g, ''));
  if (!number) return '';
  return new Intl.NumberFormat('vi-VN').format(number) + 'đ';
}

export function LinkedProductsSelect({ value, onChange }: LinkedProductsSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LinkedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected: LinkedProduct[] = React.useMemo(() => {
    try {
      if (!value) return [];
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item, index) => normalizeItem(item, index));
    } catch {
      return [];
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts?type=PRODUCT&limit=10&search=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success && data.posts) setResults(data.posts.map((p: any) => ({ id: p.id, title: p.title })));
      } catch (err) {
        console.error('Failed to search products', err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const commit = (items: LinkedProduct[]) => onChange(JSON.stringify(items.map((item, index) => normalizeItem(item, index))));
  const updateItem = (id: number, patch: Partial<LinkedProduct>) => commit(selected.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const handleRemove = (id: number) => commit(selected.filter((p) => p.id !== id));

  const handleSelect = (product: LinkedProduct) => {
    if (!selected.find((p) => p.id === product.id)) commit([...selected, normalizeItem(product, selected.length)]);
    setQuery('');
    setIsOpen(false);
  };

  const applyPreset = (id: number, preset: 'upgrade' | 'cross' | 'bundle' | 'alternative') => {
    const presets: Record<typeof preset, Partial<LinkedProduct>> = {
      upgrade: { relationType: 'UPSELL', badge: 'Khuyên dùng', ctaLabel: 'Xem bản nâng cấp', priceNote: 'Chỉ thêm ... để lên bản tốt hơn' },
      cross: { relationType: 'CROSS_SELL', badge: 'Mua kèm', ctaLabel: 'Thêm vào combo', priceNote: 'Mua kèm giá tốt hơn' },
      bundle: { relationType: 'BUNDLE', badge: 'Tiết kiệm', ctaLabel: 'Xem combo', discountType: 'PERCENT', priceNote: 'Combo tiết kiệm ...%' },
      alternative: { relationType: 'ALTERNATIVE', badge: 'Sản phẩm thay thế', ctaLabel: 'Xem thay thế', priceNote: 'Lựa chọn thay thế cùng tầm giá' },
    };
    updateItem(id, presets[preset]);
  };

  return (
    <div className="space-y-4" ref={wrapperRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-slate-400" /></div>
        <input type="text" className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-900 dark:text-slate-100 placeholder-slate-400" placeholder="Tìm sản phẩm để tạo upsell, mua kèm, combo..." value={query} onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }} onFocus={() => setIsOpen(true)} />
        {loading && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><Loader2 className="h-4 w-4 text-brand-500 animate-spin" /></div>}
        {isOpen && query.trim().length >= 2 && (
          <div className="absolute z-10 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
            {loading && results.length === 0 ? <div className="p-3 text-sm text-slate-500 text-center">Đang tìm kiếm...</div> : results.length > 0 ? (
              <ul className="py-1">{results.map((product) => {
                const isSelected = selected.some((p) => p.id === product.id);
                return <li key={product.id} className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/30 ${isSelected ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-700 dark:text-slate-200'}`} onClick={() => !isSelected && handleSelect(product)}>{product.title}</li>;
              })}</ul>
            ) : <div className="p-3 text-sm text-slate-500 text-center">Không tìm thấy sản phẩm nào.</div>}
          </div>
        )}
      </div>

      {selected.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-sm text-slate-500 dark:text-slate-400">Chưa có chiến lược bán kèm nào. Hãy tìm sản phẩm để tạo upsell, mua kèm hoặc combo.</div>
      ) : (
        <div className="space-y-3">
          {selected.slice().sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99)).map((product) => {
            const relation = relationOptions.find((option) => option.value === product.relationType) || relationOptions[0];
            return (
              <div key={product.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="font-semibold text-slate-900 dark:text-white">{product.title}</h5>
                      {product.badge && <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-0.5 text-xs font-semibold"><Sparkles className="h-3 w-3 mr-1" />{product.badge}</span>}
                      <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-2 py-0.5 text-xs font-semibold">{relation.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{relation.hint}</p>
                  </div>
                  <button type="button" onClick={() => handleRemove(product.id)} className="text-red-500 hover:text-red-600 text-sm font-semibold inline-flex items-center gap-1"><X className="h-4 w-4" /> Xoá</button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <button type="button" onClick={() => applyPreset(product.id, 'upgrade')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/20 dark:text-purple-200 dark:border-purple-800">Bản nâng cấp</button>
                  <button type="button" onClick={() => applyPreset(product.id, 'cross')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800">Mua kèm</button>
                  <button type="button" onClick={() => applyPreset(product.id, 'bundle')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800">Combo tiết kiệm</button>
                  <button type="button" onClick={() => applyPreset(product.id, 'alternative')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">Thay thế</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Loại liên kết</label><select value={product.relationType || 'RELATED'} onChange={(e) => updateItem(product.id, { relationType: e.target.value as RelationType })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">{relationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Ưu tiên</label><input value={product.priority || ''} onChange={(e) => updateItem(product.id, { priority: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" placeholder="1" /></div>
                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Badge</label><input value={product.badge || ''} onChange={(e) => updateItem(product.id, { badge: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" placeholder="Khuyên dùng" /></div>
                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">CTA</label><input value={product.ctaLabel || ''} onChange={(e) => updateItem(product.id, { ctaLabel: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" placeholder="Xem bản nâng cấp" /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Lý do gợi ý</label><input value={product.reason || ''} onChange={(e) => updateItem(product.id, { reason: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" placeholder="Bền hơn, phù hợp mua kèm, bản cao cấp hơn..." /></div>
                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Giá đề xuất</label><input value={product.offerPrice || ''} onChange={(e) => updateItem(product.id, { offerPrice: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" placeholder="1850000" /></div>
                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Giá gạch</label><input value={product.compareAtPrice || ''} onChange={(e) => updateItem(product.id, { compareAtPrice: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" placeholder="2200000" /></div>
                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Kiểu giảm</label><select value={product.discountType || 'NONE'} onChange={(e) => updateItem(product.id, { discountType: e.target.value as DiscountType })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm">{discountOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
                  <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Giá trị giảm</label><input value={product.discountValue || ''} onChange={(e) => updateItem(product.id, { discountValue: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" placeholder="350000 hoặc 10" /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Ghi chú giá hiển thị</label><input value={product.priceNote || ''} onChange={(e) => updateItem(product.id, { priceNote: e.target.value })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm" placeholder="+350.000đ để lên bản tốt hơn" /></div>
                  <div className="md:col-span-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3 text-sm"><div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200 mb-1"><BadgePercent className="h-4 w-4 text-emerald-500" /> Preview giá</div><div className="text-slate-500 dark:text-slate-400">{product.priceNote || product.offerPrice || product.compareAtPrice ? <>{product.priceNote && <span>{product.priceNote}</span>}{product.offerPrice && <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-300">{formatCurrency(product.offerPrice)}</span>}{product.compareAtPrice && <span className="ml-2 line-through">{formatCurrency(product.compareAtPrice)}</span>}</> : 'Nhập giá hoặc ghi chú giá để preview thông điệp bán hàng.'}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
