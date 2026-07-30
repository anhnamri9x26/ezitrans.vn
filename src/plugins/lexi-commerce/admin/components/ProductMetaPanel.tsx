"use client";

import React, { useMemo, useState } from 'react';
import { Archive, Box, FileText, Link2, Package, PhoneCall, Settings2, SlidersHorizontal, Tag } from 'lucide-react';
import { LinkedProductsSelect } from './LinkedProductsSelect';

export type ProductSpecItem = Record<string, string>;
export type ProductSpecRow = Record<string, string>;
export type ProductDocumentItem = Record<string, string>;

export interface ProductMetaData {
  sku?: string;
  englishName?: string;
  technicalName?: string;
  shortDescription?: string;
  regularPrice?: string;
  salePrice?: string;
  salesStatus?: string;
  stockStatus?: string;
  isFeatured?: boolean;
  galleryIds?: string;
  productKind?: string;
  priceMode?: string;
  unit?: string;
  manageStock?: boolean;
  stockQuantity?: number | string | null;
  allowBackorder?: boolean;
  steelGrade?: string;
  hardness?: string;
  surface?: string;
  origin?: string;
  dynamicSpecs?: string;
  specTable?: string;
  documents?: string;
  linkedProducts?: string;
  ctaLabel?: string;
  quoteForm?: string;
  quotePhone?: string;
  quoteNote?: string;
  advancedNote?: string;
}

interface ProductMetaPanelProps {
  data: ProductMetaData;
  onChange: (data: ProductMetaData) => void;
}

type ProductTab = 'general' | 'inventory' | 'technical' | 'specs' | 'documents' | 'links' | 'cta' | 'advanced';

const tabs: Array<{ id: ProductTab; label: string; icon: React.ReactNode }> = [
  { id: 'general', label: 'Chung', icon: <SlidersHorizontal size={15} /> },
  { id: 'inventory', label: 'Kho hàng', icon: <Archive size={15} /> },
  { id: 'technical', label: 'Thông số kỹ thuật', icon: <Settings2 size={15} /> },
  { id: 'specs', label: 'Quy cách', icon: <Box size={15} /> },
  { id: 'documents', label: 'Tài liệu', icon: <FileText size={15} /> },
  { id: 'links', label: 'Liên kết', icon: <Link2 size={15} /> },
  { id: 'cta', label: 'CTA báo giá', icon: <PhoneCall size={15} /> },
  { id: 'advanced', label: 'Nâng cao', icon: <Package size={15} /> },
];

const parseJson = <T,>(value: string | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export default function ProductMetaPanel({ data, onChange }: ProductMetaPanelProps) {
  const [activeTab, setActiveTab] = useState<ProductTab>('general');

  const dynamicSpecs = useMemo(() => parseJson<ProductSpecItem[]>(data.dynamicSpecs, []), [data.dynamicSpecs]);
  const specTable = useMemo(() => parseJson<ProductSpecRow[]>(data.specTable, []), [data.specTable]);
  const documents = useMemo(() => parseJson<ProductDocumentItem[]>(data.documents, []), [data.documents]);

  const handleChange = (field: keyof ProductMetaData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateJsonList = <T extends Record<string, string>>(field: keyof ProductMetaData, items: T[]) => {
    handleChange(field, JSON.stringify(items));
  };

  const handleProductKindChange = (productKind: string) => {
    handleChange('productKind', productKind);
  };

  const handlePriceModeChange = (priceMode: string) => {
    onChange({
      ...data,
      priceMode,
      regularPrice: priceMode === 'DISPLAY_PRICE' ? data.regularPrice : '',
      salePrice: priceMode === 'DISPLAY_PRICE' ? data.salePrice : '',
    });
  };

  const handleUnitChange = (unit: string) => {
    handleChange('unit', unit);
  };

  const handleStockStatusChange = (stockStatus: string) => {
    onChange({
      ...data,
      stockStatus,
      allowBackorder: stockStatus === 'PRE_ORDER' ? true : data.allowBackorder,
      stockQuantity: stockStatus === 'OUT_OF_STOCK' && data.manageStock ? '0' : data.stockQuantity,
    });
  };

  const handleManageStockChange = (manageStock: boolean) => {
    onChange({
      ...data,
      manageStock,
      stockQuantity: manageStock ? (data.stockQuantity ?? '0') : '',
      allowBackorder: manageStock ? data.allowBackorder : false,
    });
  };

  const handleStockQuantityChange = (value: string) => {
    const normalized = value === '' ? '' : String(Math.max(0, Number(value || 0)));
    onChange({
      ...data,
      stockQuantity: normalized,
      stockStatus: normalized !== '' && Number(normalized) <= 0 && !data.allowBackorder ? 'OUT_OF_STOCK' : data.stockStatus,
    });
  };

  const handleBackorderChange = (allowBackorder: boolean) => {
    onChange({
      ...data,
      allowBackorder,
      stockStatus: allowBackorder && data.stockStatus === 'OUT_OF_STOCK' ? 'PRE_ORDER' : data.stockStatus,
    });
  };

  const addPresetAttribute = (name: string, placeholder: string = '') => {
    const current = parseJson<{ name: string; value: string }[]>(data.dynamicSpecs, []);
    if (!current.some((c) => c.name === name)) {
      updateJsonList('dynamicSpecs', [...current, { name, value: placeholder }]);
    }
  };

  const fieldClass = 'w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 bg-white dark:bg-slate-800 text-sm transition-all';
  const labelClass = 'block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider';
  const effectivePriceMode = data.priceMode || 'CONTACT_QUOTE';
  const effectiveUnit = data.unit || 'kg';
  const isPriceEntryMode = effectivePriceMode === 'DISPLAY_PRICE' || effectivePriceMode === 'UNIT_BASED';
  const regularPriceNumber = parsePrice(data.regularPrice);
  const salePriceNumber = parsePrice(data.salePrice);
  const hasInvalidSalePrice = isPriceEntryMode
    && regularPriceNumber !== null
    && salePriceNumber !== null
    && salePriceNumber >= regularPriceNumber;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-brand-500" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-50">Dữ liệu sản phẩm</h3>
            <p className="text-xs text-slate-500">Quản lý giá, kho hàng, thông số, quy cách và báo giá.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Loại sản phẩm
            <select value={data.productKind === 'VARIABLE' ? 'VARIABLE' : 'SIMPLE'} onChange={(e) => handleProductKindChange(e.target.value)} className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
              <option value="SIMPLE">Sản phẩm đơn giản</option>
              <option value="VARIABLE">Sản phẩm có biến thể</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[210px_1fr] min-h-[430px]">
        <div className="border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/20 p-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-left transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm border border-slate-200 dark:border-slate-800' : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/70'}`}>
                {tab.icon}<span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Kiểu giá</label>
                  <select value={data.priceMode || 'CONTACT_QUOTE'} onChange={(e) => handlePriceModeChange(e.target.value)} className={fieldClass}>
                    <option value="CONTACT_QUOTE">Liên hệ báo giá</option>
                    <option value="DISPLAY_PRICE">Hiển thị giá cố định</option>
                    <option value="SPEC_BASED">Giá theo quy cách</option>
                    <option value="UNIT_BASED">Đơn giá theo đơn vị</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">{getPriceModeHelp(effectivePriceMode, effectiveUnit)}</p>
                </div>
                <div>
                  <label className={labelClass}>Đơn vị tính</label>
                  <select value={effectiveUnit} onChange={(e) => handleUnitChange(e.target.value)} className={fieldClass}>
                    <option value="kg">kg</option>
                    <option value="cay">cây</option>
                    <option value="met">mét</option>
                    <option value="tam">tấm</option>
                    <option value="cuon">cuộn</option>
                    <option value="bo">bộ</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Dùng cho tồn kho, báo giá và cách hiển thị giá theo đơn vị.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Trạng thái kinh doanh</label>
                  <select
                    value={data.salesStatus || 'AVAILABLE'}
                    onChange={(e) => handleChange('salesStatus', e.target.value)}
                    className={fieldClass}
                  >
                    <option value="AVAILABLE">Đang bán</option>
                    <option value="COMING_SOON">Sắp ra mắt</option>
                    <option value="DISCONTINUED">Ngừng kinh doanh</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-4 group">
                    <input 
                      type="checkbox" 
                      checked={data.isFeatured || false}
                      onChange={(e) => handleChange('isFeatured', e.target.checked)}
                      className="rounded text-brand-500 focus:ring-brand-500/30 border-slate-300 w-4 h-4 cursor-pointer" 
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-brand-600 transition-colors">Sản phẩm nổi bật</span>
                  </label>
                </div>
              </div>

              {data.productKind === 'VARIABLE' && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/20 dark:text-violet-200">
                  Sản phẩm có biến thể nên dùng tab <strong>Quy cách</strong> để khai báo size/chiều dài/tình trạng. Bảng biến thể đầy đủ có thể bổ sung sau.
                </div>
              )}
              {isPriceEntryMode ? (
                <div className="space-y-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/40 p-4">
                  {effectivePriceMode === 'UNIT_BASED' && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                      <strong>Đơn giá theo {getUnitLabel(effectiveUnit)}</strong> nghĩa là giá được hiểu theo từng {getUnitLabel(effectiveUnit)}, ví dụ 45.000đ/{getUnitLabel(effectiveUnit)}. Tổng tiền thực tế sẽ phụ thuộc số lượng, khối lượng hoặc quy cách khách yêu cầu.
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PriceField
                      label={effectivePriceMode === 'UNIT_BASED' ? `Đơn giá tham khảo / ${getUnitLabel(effectiveUnit)} (VNĐ)` : 'Giá thường (VNĐ)'}
                      value={data.regularPrice || ''}
                      onChange={(value) => handleChange('regularPrice', value)}
                      placeholder={effectivePriceMode === 'UNIT_BASED' ? `Ví dụ: 45000 / ${getUnitLabel(effectiveUnit)}` : 'Ví dụ: 459999'}
                    />
                    <PriceField
                      label={effectivePriceMode === 'UNIT_BASED' ? `Đơn giá ưu đãi / ${getUnitLabel(effectiveUnit)} (VNĐ)` : 'Giá khuyến mãi (VNĐ)'}
                      value={data.salePrice || ''}
                      onChange={(value) => handleChange('salePrice', value)}
                      placeholder="Phải nhỏ hơn giá thường"
                      invalid={hasInvalidSalePrice}
                    />
                  </div>
                  {hasInvalidSalePrice && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                      Giá khuyến mãi/ưu đãi phải nhỏ hơn giá thường. Nếu không có ưu đãi, hãy để trống field này.
                    </div>
                  )}
                  {regularPriceNumber !== null && !hasInvalidSalePrice && (
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {effectivePriceMode === 'UNIT_BASED' ? 'Đơn giá hiển thị' : 'Giá hiển thị'}: <strong>{formatVnd(regularPriceNumber)}{effectivePriceMode === 'UNIT_BASED' ? `/${getUnitLabel(effectiveUnit)}` : ''}</strong>
                      {salePriceNumber !== null && <> · Ưu đãi: <strong>{formatVnd(salePriceNumber)}{effectivePriceMode === 'UNIT_BASED' ? `/${getUnitLabel(effectiveUnit)}` : ''}</strong></>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 dark:bg-blue-950/10 dark:border-blue-900/40 p-4 text-sm text-blue-800 dark:text-blue-200">Sản phẩm đang để chế độ báo giá hoặc giá theo quy cách, nên giá thường và giá khuyến mãi sẽ không hiển thị mặc định.</div>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Mã sản phẩm / SKU</label>
                  <input type="text" value={data.sku || ''} onChange={(e) => handleChange('sku', e.target.value)} className={fieldClass} placeholder="FY-S45C-C45" />
                </div>
                <div>
                  <label className={labelClass}>Tình trạng hàng</label>
                  <select value={data.stockStatus || 'IN_STOCK'} onChange={(e) => handleStockStatusChange(e.target.value)} className={fieldClass}>
                    <option value="IN_STOCK">Có sẵn</option>
                    <option value="PRE_ORDER">Đặt hàng trước</option>
                    <option value="OUT_OF_STOCK">Hết hàng</option>
                    <option value="IMPORT_ON_DEMAND">Nhập khẩu theo yêu cầu</option>
                    <option value="CUT_TO_ORDER">Cắt theo yêu cầu</option>
                    <option value="CONTACT_TO_CHECK">Liên hệ kiểm tra tồn kho</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">{getStockStatusHelp(data.stockStatus || 'IN_STOCK')}</p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={Boolean(data.manageStock)} onChange={(e) => handleManageStockChange(e.target.checked)} className="rounded text-brand-500 focus:ring-brand-500/30" />
                Bật quản lý số lượng tồn kho
              </label>

              {data.manageStock ? (
                <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/20 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Số lượng tồn</label>
                      <input type="number" min="0" value={data.stockQuantity ?? ''} onChange={(e) => handleStockQuantityChange(e.target.value)} className={fieldClass} placeholder="0" />
                      <p className="mt-1 text-xs text-slate-500">Không cho nhập số âm. Nếu số lượng bằng 0 và không cho đặt trước, trạng thái nên là Hết hàng.</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200 mt-7">
                      <input type="checkbox" checked={Boolean(data.allowBackorder)} onChange={(e) => handleBackorderChange(e.target.checked)} className="rounded text-brand-500 focus:ring-brand-500/30" />
                      Cho phép đặt hàng trước khi hết tồn
                    </label>
                  </div>
                  {Number(data.stockQuantity || 0) <= 0 && !data.allowBackorder && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                      Số lượng tồn đang bằng 0. Sản phẩm sẽ nên hiển thị là <strong>Hết hàng</strong> nếu không cho đặt trước.
                    </div>
                  )}
                  {data.allowBackorder && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200">
                      Khách vẫn có thể gửi yêu cầu/đặt trước dù số lượng tồn thấp hoặc bằng 0.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 dark:bg-blue-950/10 dark:border-blue-900/40 p-4 text-sm text-blue-800 dark:text-blue-200">
                  Không quản lý số lượng cụ thể. Website sẽ dựa vào <strong>Tình trạng hàng</strong> để hiển thị.
                </div>
              )}
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">Thông tin bổ sung</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Tên kỹ thuật / Tiêu chuẩn</label><input type="text" value={data.technicalName || ''} onChange={(e) => handleChange('technicalName', e.target.value)} className={fieldClass} placeholder="Ví dụ: JIS / RoHS / Model 2024..." /></div>
                  <div><label className={labelClass}>Tên quốc tế / English name</label><input type="text" value={data.englishName || ''} onChange={(e) => handleChange('englishName', e.target.value)} className={fieldClass} placeholder="Ví dụ: English Name / Export Name..." /></div>
                </div>
              </div>

              {(data.steelGrade || data.hardness || data.surface || data.origin) && (
                <div className="space-y-3 p-4 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Trường thông số cũ (Legacy)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.steelGrade !== undefined && <div><label className={labelClass}>Mác thép</label><input value={data.steelGrade || ''} onChange={(e) => handleChange('steelGrade', e.target.value)} className={fieldClass} /></div>}
                    {data.hardness !== undefined && <div><label className={labelClass}>Độ cứng</label><input value={data.hardness || ''} onChange={(e) => handleChange('hardness', e.target.value)} className={fieldClass} /></div>}
                    {data.surface !== undefined && <div><label className={labelClass}>Bề mặt</label><input value={data.surface || ''} onChange={(e) => handleChange('surface', e.target.value)} className={fieldClass} /></div>}
                    {data.origin !== undefined && <div><label className={labelClass}>Xuất xứ</label><input value={data.origin || ''} onChange={(e) => handleChange('origin', e.target.value)} className={fieldClass} /></div>}
                  </div>
                  <p className="text-xs text-slate-500">Các trường này hiển thị vì có dữ liệu cũ. Đối với thông số mới, khuyên dùng Bảng thuộc tính động bên dưới.</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">Bảng thuộc tính động</h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-medium mr-1">Gợi ý thêm nhanh:</span>
                    <button type="button" onClick={() => addPresetAttribute('Thương hiệu')} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">+ Thương hiệu</button>
                    <button type="button" onClick={() => addPresetAttribute('Xuất xứ')} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">+ Xuất xứ</button>
                    <button type="button" onClick={() => addPresetAttribute('Chất liệu')} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">+ Chất liệu</button>
                    <button type="button" onClick={() => addPresetAttribute('Kích thước')} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">+ Kích thước</button>
                    <button type="button" onClick={() => addPresetAttribute('Trọng lượng')} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">+ Trọng lượng</button>
                    <button type="button" onClick={() => addPresetAttribute('Bảo hành')} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">+ Bảo hành</button>
                  </div>
                </div>
                <div className="pt-2">
                  <EditableList title="" items={dynamicSpecs} emptyItem={{ name: '', value: '' }} columns={[{ key: 'name', label: 'Thuộc tính', placeholder: 'Ví dụ: Tốc độ / Màu sắc' }, { key: 'value', label: 'Giá trị', placeholder: 'Ví dụ: Đen / 100Mbps' }]} onChange={(items) => updateJsonList('dynamicSpecs', items)} addLabel="+ Thêm thông số tuỳ chỉnh" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Phân loại / Quy cách (Variants)</h4>
              </div>
              {effectivePriceMode === 'SPEC_BASED' && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 dark:bg-blue-950/10 dark:border-blue-900/40 p-3 text-sm text-blue-800 dark:text-blue-200">
                  Bạn đang chọn <strong>Giá theo quy cách</strong>. Hãy nhập giá bán cụ thể cho từng dòng phân loại bên dưới để hiển thị đúng trên website.
                </div>
              )}
              <EditableList 
                title="" 
                items={specTable} 
                emptyItem={{ spec: '', price: '', status: '', note: '' }} 
                columns={[
                  { key: 'spec', label: 'Phân loại / Tên quy cách', placeholder: 'Ví dụ: Size M - Đỏ / Ø20' },
                  ...(effectivePriceMode === 'SPEC_BASED' ? [{ key: 'price', label: 'Giá bán (VNĐ)', placeholder: 'Ví dụ: 150000' }] : []),
                  { key: 'status', label: 'Tình trạng / Kho', placeholder: 'Ví dụ: Có sẵn / 10' },
                  { key: 'note', label: 'SKU / Ghi chú', placeholder: 'Ví dụ: SKU-001' }
                ]} 
                onChange={(items) => updateJsonList('specTable', items)} 
                addLabel="+ Thêm phân loại / quy cách" 
              />
            </div>
          )}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Tài liệu đính kèm</h4>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 dark:bg-blue-950/10 dark:border-blue-900/40 p-3 text-sm text-blue-800 dark:text-blue-200">
                Cung cấp thêm catalogue, hướng dẫn sử dụng, chứng nhận (CO/CQ) hoặc bất kỳ file nào cho khách hàng tải về. Bạn có thể tải file lên thư viện Media rồi dán link vào cột URL.
              </div>
              <EditableList 
                title="" 
                items={documents} 
                emptyItem={{ label: '', url: '', type: '' }} 
                columns={[
                  { key: 'label', label: 'Tên tài liệu', placeholder: 'Ví dụ: Hướng dẫn sử dụng / Catalogue' }, 
                  { key: 'url', label: 'Liên kết (URL)', placeholder: 'https://...' }, 
                  { key: 'type', label: 'Định dạng', placeholder: 'Ví dụ: PDF / DOCX / Link' }
                ]} 
                onChange={(items) => updateJsonList('documents', items)} 
                addLabel="+ Thêm tài liệu đính kèm" 
              />
            </div>
          )}
          {activeTab === 'links' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Chiến lược bán kèm / nâng cấp</h4>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 dark:bg-emerald-950/10 dark:border-emerald-900/40 p-3 text-sm text-emerald-800 dark:text-emerald-200">
                Tạo các gợi ý Upsell, Mua kèm, Combo hoặc Sản phẩm thay thế kèm lý do, badge, CTA và thông điệp giá để tăng giá trị đơn hàng.
              </div>
              <LinkedProductsSelect 
                value={data.linkedProducts || ''} 
                onChange={(val) => handleChange('linkedProducts', val)} 
              />
            </div>
          )}
          {activeTab === 'cta' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className={labelClass}>Nút chính</label><input value={data.ctaLabel || ''} onChange={(e) => handleChange('ctaLabel', e.target.value)} className={fieldClass} placeholder="Yêu cầu báo giá" /></div><div><label className={labelClass}>Form liên hệ</label><input value={data.quoteForm || ''} onChange={(e) => handleChange('quoteForm', e.target.value)} className={fieldClass} placeholder="Form báo giá sản phẩm" /></div><div><label className={labelClass}>Số điện thoại / Zalo riêng</label><input value={data.quotePhone || ''} onChange={(e) => handleChange('quotePhone', e.target.value)} className={fieldClass} placeholder="090..." /></div><div className="md:col-span-2"><label className={labelClass}>Ghi chú báo giá</label><textarea value={data.quoteNote || ''} onChange={(e) => handleChange('quoteNote', e.target.value)} rows={4} className={fieldClass} placeholder="Giá thay đổi theo quy cách và số lượng đặt hàng." /></div></div>}
          {activeTab === 'advanced' && <div><label className={labelClass}>Ghi chú nâng cao</label><textarea value={data.advancedNote || ''} onChange={(e) => handleChange('advancedNote', e.target.value)} rows={8} className={fieldClass} placeholder="Ghi chú nội bộ, logic hiển thị hoặc cấu hình nâng cao..." /></div>}
        </div>
      </div>
    </div>
  );
}

interface EditableListProps<T extends Record<string, string>> {
  title: string;
  items: T[];
  emptyItem: T;
  columns: Array<{ key: keyof T; label: string; placeholder: string }>;
  onChange: (items: T[]) => void;
  addLabel: string;
}

function EditableList<T extends Record<string, string>>({ title, items, emptyItem, columns, onChange, addLabel }: EditableListProps<T>) {
  const rows = items.length > 0 ? items : [emptyItem];
  const updateRow = (index: number, key: keyof T, value: string) => {
    const next = [...rows].map((row) => ({ ...row }));
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };
  const removeRow = (index: number) => onChange(rows.filter((_, idx) => idx !== index));

  return (
    <div className="space-y-3">
      <h4 className="font-bold text-slate-800 dark:text-slate-100">{title}</h4>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950/40 text-xs uppercase tracking-wider text-slate-500"><tr>{columns.map((column) => <th key={String(column.key)} className="px-3 py-2 text-left font-bold">{column.label}</th>)}<th className="w-16 px-3 py-2" /></tr></thead>
          <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-slate-100 dark:border-slate-800">{columns.map((column) => <td key={String(column.key)} className="p-2"><input value={row[column.key] || ''} onChange={(e) => updateRow(rowIndex, column.key, e.target.value)} className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-brand-500" placeholder={column.placeholder} /></td>)}<td className="p-2 text-right"><button type="button" onClick={() => removeRow(rowIndex)} className="px-2 py-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-bold">Xoá</button></td></tr>)}</tbody>
        </table>
      </div>
      <button type="button" onClick={() => onChange([...rows, emptyItem])} className="text-brand-600 hover:text-brand-700 font-bold text-sm">{addLabel}</button>
    </div>
  );
}

function parsePrice(value?: string): number | null {
  if (!value) return null;
  const normalized = String(value).replace(/[^0-9]/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizePriceInput(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

interface PriceFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  invalid?: boolean;
}

function PriceField({ label, value, onChange, placeholder, invalid }: PriceFieldProps) {
  const parsedValue = parsePrice(value);

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wider">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(normalizePriceInput(e.target.value))}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-sm transition-all ${invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500/10'}`}
        placeholder={placeholder}
      />
      {parsedValue !== null && (
        <p className="mt-1 text-xs text-slate-500">{formatVnd(parsedValue)}</p>
      )}
    </div>
  );
}

function getUnitLabel(unit: string): string {
  const labels: Record<string, string> = {
    kg: 'kg',
    cay: 'cây',
    met: 'mét',
    tam: 'tấm',
    cuon: 'cuộn',
    bo: 'bộ',
  };
  return labels[unit] || unit;
}

function getPriceModeHelp(priceMode: string, unit: string): string {
  if (priceMode === 'DISPLAY_PRICE') return 'Dùng khi sản phẩm có giá bán cố định và có thể hiển thị trực tiếp trên website.';
  if (priceMode === 'SPEC_BASED') return 'Dùng khi mỗi quy cách/size có giá khác nhau. Khai báo chi tiết ở tab Quy cách.';
  if (priceMode === 'UNIT_BASED') return `Dùng khi báo giá theo ${getUnitLabel(unit)}. Đơn vị tính sẽ ảnh hưởng tới nội dung báo giá/frontend.`;
  return 'Dùng cho sản phẩm B2B cần khách gửi yêu cầu báo giá thay vì hiển thị giá cố định.';
}

function getStockStatusHelp(stockStatus: string): string {
  const descriptions: Record<string, string> = {
    IN_STOCK: 'Sản phẩm có sẵn để bán hoặc gửi báo giá ngay.',
    PRE_ORDER: 'Khách có thể đặt trước hoặc gửi yêu cầu dù chưa có sẵn hàng.',
    OUT_OF_STOCK: 'Sản phẩm tạm hết hàng. Nếu muốn nhận yêu cầu, bật đặt hàng trước.',
    IMPORT_ON_DEMAND: 'Hàng nhập theo yêu cầu, thường cần khách gửi thông tin để báo thời gian và giá.',
    CUT_TO_ORDER: 'Hàng cần cắt/gia công theo yêu cầu trước khi giao.',
    CONTACT_TO_CHECK: 'Tồn kho thay đổi nhanh, cần khách liên hệ để kiểm tra trước.',
  };
  return descriptions[stockStatus] || descriptions.IN_STOCK;
}
