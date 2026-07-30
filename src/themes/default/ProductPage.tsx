import React from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { Phone, FileText, CheckCircle, Package, Sparkles, ChevronRight, MessageCircle, FileDown, ShieldCheck, Truck, Headphones, Scissors } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductTabs from '@/components/ProductTabs';
import ProductImageGallery from '@/components/ProductImageGallery';
import { prisma } from '@/lib/prisma';

export default async function DefaultProductPage({ 
  post, 
  settings = {}, 
  isAuthorizedUser = false,
  skipHeader = false,
  skipFooter = false
}: { 
  post: any; 
  settings: any; 
  isAuthorizedUser: boolean;
  formattedDate?: string;
  formattedUpdateDate?: string;
  skipHeader?: boolean;
  skipFooter?: boolean;
}) {
  const siteLanguage = settings.site_language || 'vi';
  const hotline = settings.contact_hotline || settings.contact_phone || '0969 223 501';

  const t = {
    vi: {
      in_stock: 'Có sẵn tại kho',
      contact_quote: 'Yêu cầu báo giá',
      specifications: 'Thông số cơ bản',
      variants: 'Bảng quy cách',
      product_detail: 'Tổng quan sản phẩm',
      documents: 'Tài liệu tải xuống',
      contact_for_price: 'Liên hệ báo giá',
      related_products: 'Sản phẩm liên quan',
    },
    en: {
      in_stock: 'In Stock',
      contact_quote: 'Request Quote',
      specifications: 'Specifications',
      variants: 'Variants',
      product_detail: 'Product Overview',
      documents: 'Downloads',
      contact_for_price: 'Contact for Quote',
      related_products: 'Related Products',
      other_products: 'Other Products',
    }
  }[siteLanguage === 'vi' ? 'vi' : 'en'];

  // Fetch some products for the sidebar
  const sidebarProducts = await prisma.post.findMany({
    where: { type: 'PRODUCT', status: 'PUBLISHED', id: { not: post.id } },
    include: { productMeta: true, featuredImage: true },
    orderBy: { publishedAt: 'desc' },
    take: 4
  });

  // --- PARSE DYNAMIC DATA ---
  const productMeta = post.productMeta || {};
  const dynamicSpecs = (() => { try { return JSON.parse(post.dynamicSpecs || productMeta.dynamicSpecs || '[]'); } catch { return []; } })();
  const specTable = (() => { try { return JSON.parse(post.specTable || productMeta.specTable || '[]'); } catch { return []; } })();
  const documents = (() => { try { return JSON.parse(post.documents || productMeta.documents || '[]'); } catch { return []; } })();
  const linkedProducts = (() => { try { return JSON.parse(post.linkedProducts || productMeta.linkedProducts || '[]'); } catch { return []; } })();

  let galleryItems: string[] = [];
  try {
    const parsed = JSON.parse(post.galleryIds || productMeta.galleryIds || '[]');
    if (Array.isArray(parsed)) {
      galleryItems = parsed.map(item => typeof item === 'string' ? item : (item.url || ''));
    }
  } catch (e) {
    // Ignore
  }
  const mainImageUrl = post.featuredImage?.url;
  const allImages = mainImageUrl ? [mainImageUrl, ...galleryItems].filter(Boolean) : galleryItems;

  const cleanExcerpt = (post.excerpt || '').replace(/&nbsp;/g, ' ').replace(/<[^>]*>?/gm, '');

  const legacySpecs = [];
  if (productMeta.steelGrade) legacySpecs.push({ name: 'Mác thép', value: productMeta.steelGrade });
  if (productMeta.origin) legacySpecs.push({ name: 'Xuất xứ', value: productMeta.origin });
  if (productMeta.hardness) legacySpecs.push({ name: 'Độ cứng', value: productMeta.hardness });
  if (productMeta.surface) legacySpecs.push({ name: 'Bề mặt', value: productMeta.surface });

  const displaySpecs = dynamicSpecs.length > 0 ? dynamicSpecs : legacySpecs;

  // Header keys for spec table
  const specTableHeaders = specTable.length > 0 ? Object.keys(specTable[0]) : [];
  const headerLabels: Record<string, string> = {
    spec: 'Quy cách',
    price: 'Giá',
    status: 'Tình trạng',
    note: 'Ghi chú',
    length: 'Chiều dài'
  };

  // Pricing Logic
  const priceMode = productMeta.priceMode || 'CONTACT';
  const regularPrice = Number(productMeta.regularPrice || 0);
  const salePrice = Number(productMeta.salePrice || 0);
  const displayUnit = productMeta.unit ? ` / ${productMeta.unit}` : '';

  const renderPricing = () => {
    if (priceMode === 'CONTACT' || (!regularPrice && !salePrice && priceMode !== 'SPEC_BASED')) {
      return (
        <div className="bg-red-50 text-[#E31B23] border border-red-100 rounded-lg p-3 inline-block w-full text-center sm:text-left mb-6">
          <span className="text-xl font-extrabold">{t.contact_for_price}</span>
        </div>
      );
    }
    
    if (priceMode === 'SPEC_BASED') {
      return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 inline-block w-full mb-6">
          <span className="text-xl font-bold text-[#E31B23]">Giá theo quy cách</span>
          <span className="text-slate-500 text-sm block mt-1">Xem bảng chi tiết phía dưới</span>
        </div>
      );
    }

    const currentPrice = salePrice > 0 ? salePrice : regularPrice;
    const hasDiscount = salePrice > 0 && regularPrice > salePrice;

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex items-baseline text-[#E31B23]">
            <span className="text-3xl font-black tracking-tight">{new Intl.NumberFormat('vi-VN').format(currentPrice)}<span className="text-xl">đ</span></span>
            {priceMode === 'UNIT_BASED' && <span className="text-lg font-semibold text-slate-500 ml-1">{displayUnit}</span>}
          </div>
          {hasDiscount && (
            <div className="text-base font-medium text-slate-400 line-through mb-1">
              {new Intl.NumberFormat('vi-VN').format(regularPrice)}đ
            </div>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-2">
          * Giá có thể thay đổi tùy thời điểm và số lượng đặt hàng.
        </div>
      </div>
    );
  };

  // CTA info
  const displayPhone = post.quotePhone || productMeta.quotePhone || hotline;
  const displayCta = post.ctaLabel || productMeta.ctaLabel || t.contact_quote;
  const displayNote = post.quoteNote || productMeta.quoteNote || 'Liên hệ để được tư vấn chọn mác thép phù hợp.';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased">
      {!skipHeader && <Header settings={settings} />}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-4">
          <Breadcrumbs
            settings={settings}
            items={[
              { label: settings.seo_breadcrumbs_home || 'Trang chủ', url: '/' },
              ...(post.categories && post.categories.length > 0 ? [
                { label: post.categories[0].name, url: `/danh-muc-san-pham/${post.categories[0].slug}` }
              ] : []),
              { label: post.title }
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          
          {/* LEFT: GALLERY (4 cols) */}
          <div className="lg:col-span-4">
            <ProductImageGallery images={allImages} title={post.title} />
          </div>

          {/* MIDDLE: INFO & CTA (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1 text-xs font-bold self-start mb-4 uppercase tracking-wider">
              <CheckCircle size={14} />
              <span>{t.in_stock}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] mb-4 leading-tight">
              {post.title}
            </h1>
            
            {(productMeta.shortDescription || post.excerpt) && (
              <p className="text-sm text-slate-600 mb-6 line-clamp-3 leading-relaxed">
                {productMeta.shortDescription || cleanExcerpt}
              </p>
            )}

            {renderPricing()}

            {/* Quick Specs */}
            {displaySpecs.length > 0 && (
              <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.specifications}</h3>
                <div className="flex flex-col gap-2">
                  {displaySpecs.slice(0, 5).map((spec: any, idx: number) => (
                    <div key={idx} className="flex text-sm">
                      <span className="w-1/3 text-slate-500 font-medium">{spec.name || spec.label}</span>
                      <span className="w-2/3 text-slate-900 font-semibold">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-auto pt-2">
              <div className="flex flex-col gap-3">
                <Link 
                  href={post.quoteForm || "/lien-he"}
                  className="w-full bg-[#E31B23] hover:bg-[#c9181f] text-white py-3.5 px-4 rounded-lg font-bold text-center flex items-center justify-center gap-2 text-sm uppercase transition-all shadow-lg shadow-[#E31B23]/20"
                >
                  <MessageCircle size={18} /> {displayCta}
                </Link>
                <a 
                  href={`tel:${displayPhone.replace(/\./g, '')}`}
                  className="w-full bg-white hover:bg-slate-50 border-2 border-[#2D3753] text-[#2D3753] py-3 px-4 rounded-lg font-bold text-center flex items-center justify-center gap-2 text-sm uppercase transition-all"
                >
                  <Phone size={18} /> Gọi Hotline: {displayPhone}
                </a>
              </div>
              {displayNote && (
                <div className="text-xs text-center text-slate-500 mt-3 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  {displayNote}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: TRUST & DOCUMENTS (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            {/* Trust Box */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Chính sách & Hỗ trợ</h3>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg shrink-0"><ShieldCheck size={18} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">CO/CQ đầy đủ</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Cung cấp chứng chỉ chất lượng & xuất xứ nhà máy.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg shrink-0"><Scissors size={18} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Cắt theo quy cách</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Gia công cắt lẻ, xẻ băng theo yêu cầu bản vẽ.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="bg-orange-50 text-orange-600 p-1.5 rounded-lg shrink-0"><Truck size={18} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Giao hàng toàn quốc</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Vận chuyển nhanh từ kho Bắc Ninh & Bình Dương.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg shrink-0"><Headphones size={18} /></div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Tư vấn kỹ thuật</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Hỗ trợ chọn mác thép phù hợp dự án.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Documents Box */}
            {documents.length > 0 && (
              <div className="bg-[#2D3753] rounded-xl border border-slate-800 p-5 shadow-sm text-white">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
                  <FileDown size={16} /> {t.documents}
                </h3>
                <div className="flex flex-col gap-2.5">
                  {documents.map((doc: any, idx: number) => (
                    <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700 p-2.5 rounded-lg transition-colors border border-slate-700">
                      <FileText size={16} className="shrink-0 text-red-400" /> 
                      <span className="truncate font-medium flex-1">{doc.label || 'Tải tài liệu'}</span>
                      <FileDown size={14} className="text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: DETAILED SPECS & CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          <div className="lg:col-span-9">
            {/* Spec Table (Variants) */}
            {specTable.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#2D3753] uppercase tracking-wide">{t.variants}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-700">
                    <thead className="bg-white border-b-2 border-slate-100 text-slate-900 uppercase text-xs font-black">
                      <tr>
                        {specTableHeaders.map(key => (
                          <th key={key} className="px-6 py-4 whitespace-nowrap">{headerLabels[key] || key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {specTable.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                          {specTableHeaders.map(key => (
                            <td key={key} className="px-6 py-3.5">
                              {key === 'price' && row[key] ? (
                                <span className="font-bold text-[#E31B23]">{row[key]}</span>
                              ) : key === 'status' && row[key] ? (
                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                  {row[key]}
                                </span>
                              ) : (
                                <span className="font-medium text-slate-600">{row[key]}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Tabs (Description & Reviews) */}
            <ProductTabs postId={post.id} contentHtml={post.content || ''} title={t.product_detail} />
          </div>
          
          <div className="lg:col-span-3 hidden lg:block space-y-6">
            {sidebarProducts.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-24">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3">
                  <h3 className="font-extrabold text-slate-800 uppercase text-sm">{siteLanguage === 'vi' ? 'Sản phẩm khác' : t.other_products}</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {sidebarProducts.map((sp) => {
                    const spMeta = (sp.productMeta || {}) as any;
                    const spHasPrice = spMeta.salePrice || spMeta.regularPrice;
                    return (
                      <Link href={`/${sp.slug}`} key={sp.id} className="flex gap-3 p-4 hover:bg-slate-50 transition-colors group">
                        <div className="w-16 h-16 shrink-0 bg-white border border-slate-100 rounded-md flex items-center justify-center overflow-hidden">
                          {sp.featuredImage?.url ? (
                            <img src={sp.featuredImage.url} alt={sp.title} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
                          ) : (
                            <Package size={20} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="font-bold text-slate-700 text-sm leading-snug line-clamp-2 group-hover:text-[#E31B23] transition-colors mb-1">{sp.title}</h4>
                          {spHasPrice ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-extrabold text-[#E31B23]">
                                {new Intl.NumberFormat('vi-VN').format(Number(spMeta.salePrice || spMeta.regularPrice))}đ
                              </span>
                              {spMeta.salePrice && (
                                <span className="text-[10px] font-medium text-slate-400 line-through">
                                  {new Intl.NumberFormat('vi-VN').format(Number(spMeta.regularPrice))}đ
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-[#E31B23]">{t.contact_for_price}</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Linked Products (Upsells/Cross-sells) */}
        {linkedProducts.length > 0 && (
          <div className="mb-10 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-[#2D3753] uppercase tracking-wide">
                {t.related_products}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {linkedProducts.sort((a: any, b: any) => Number(a.priority || 99) - Number(b.priority || 99)).map((p: any) => {
                let badgeColor = "bg-amber-500 text-white";
                let tagColor = "bg-slate-100 text-slate-600";
                let typeLabel = "Liên quan";

                if (p.relationType === 'UPSELL') { tagColor = "bg-purple-100 text-purple-700"; typeLabel = "Nâng cấp"; badgeColor = "bg-purple-500 text-white"; }
                if (p.relationType === 'CROSS_SELL') { tagColor = "bg-blue-100 text-blue-700"; typeLabel = "Mua kèm"; badgeColor = "bg-blue-500 text-white"; }
                if (p.relationType === 'BUNDLE') { tagColor = "bg-emerald-100 text-emerald-700"; typeLabel = "Combo"; badgeColor = "bg-emerald-500 text-white"; }
                if (p.relationType === 'ALTERNATIVE') { tagColor = "bg-slate-100 text-slate-700"; typeLabel = "Thay thế"; }

                const hasPrice = p.offerPrice || p.compareAtPrice;

                return (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col group">
                    {p.badge && (
                      <div className={`absolute -top-3 -right-3 ${badgeColor} text-[11px] font-bold px-3 py-1 rounded-full shadow-sm z-10 flex items-center gap-1`}>
                        <Sparkles size={12} /> {p.badge}
                      </div>
                    )}
                    
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${tagColor} px-2.5 py-1 rounded-md w-fit mb-3`}>
                      {typeLabel}
                    </div>
                    
                    <h4 className="font-bold text-slate-800 text-base mb-1.5 group-hover:text-[#E31B23] transition-colors line-clamp-2">{p.title}</h4>
                    {p.reason && <p className="text-xs text-slate-500 mb-4 line-clamp-2">{p.reason}</p>}
                    
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      {p.priceNote && <div className="text-xs font-bold text-emerald-600 mb-1.5 bg-emerald-50 inline-block px-2 py-0.5 rounded">{p.priceNote}</div>}
                      
                      {hasPrice && (
                        <div className="flex items-baseline gap-2 mb-3">
                          {p.offerPrice && <span className="text-lg font-extrabold text-[#E31B23]">{new Intl.NumberFormat('vi-VN').format(Number(p.offerPrice))}đ</span>}
                          {p.compareAtPrice && <span className="text-xs font-medium text-slate-400 line-through">{new Intl.NumberFormat('vi-VN').format(Number(p.compareAtPrice))}đ</span>}
                        </div>
                      )}
                      
                      <Link href={`/${p.slug || '#'}`} className="mt-2 w-full flex items-center justify-center gap-1.5 bg-slate-50 text-slate-700 border border-slate-200 text-sm font-bold py-2 rounded-lg group-hover:bg-[#E31B23] group-hover:text-white group-hover:border-[#E31B23] transition-all">
                        {p.ctaLabel || 'Xem chi tiết'} <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Related Products */}
        {post.categoryRelatedProducts && post.categoryRelatedProducts.length > 0 && (
          <div className="mb-10 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-[#2D3753] uppercase tracking-wide">
                Sản phẩm cùng danh mục
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {post.categoryRelatedProducts.map((p: any) => {
                const pMeta = p.productMeta || {};
                const hasPrice = pMeta.salePrice || pMeta.regularPrice;

                return (
                  <Link href={`/${p.slug || '#'}`} key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col group">
                    <div className="aspect-square bg-white rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                      {p.featuredImage?.url ? (
                        <img src={p.featuredImage.url} alt={p.title} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
                      ) : (
                        <Package size={32} className="text-slate-300" />
                      )}
                    </div>
                    
                    <h4 className="font-bold text-slate-800 text-base mb-1.5 group-hover:text-[#E31B23] transition-colors line-clamp-2">{p.title}</h4>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      {hasPrice ? (
                        <div className="flex items-baseline gap-2 mb-3">
                          {pMeta.salePrice ? (
                            <>
                              <span className="text-lg font-extrabold text-[#E31B23]">{new Intl.NumberFormat('vi-VN').format(Number(pMeta.salePrice))}đ</span>
                              <span className="text-xs font-medium text-slate-400 line-through">{new Intl.NumberFormat('vi-VN').format(Number(pMeta.regularPrice))}đ</span>
                            </>
                          ) : (
                            <span className="text-lg font-extrabold text-[#E31B23]">{new Intl.NumberFormat('vi-VN').format(Number(pMeta.regularPrice))}đ</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-[#E31B23] mb-3">{t.contact_for_price}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Embedded Styles for Quill CSS Fallbacks B2B Style */}
      <style dangerouslySetInnerHTML={{ __html: `
        .ql-editor-view p {
          margin-bottom: 1.25rem;
          color: #334155;
        }
        .ql-editor-view h2, .ql-editor-view h3 {
          color: #0f172a;
          font-weight: 800;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }
        .ql-editor-view h2 { font-size: 1.5em; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; }
        .ql-editor-view h3 { font-size: 1.25em; }
        .ql-editor-view ul, .ql-editor-view ol {
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .ql-editor-view ul { list-style-type: disc; }
        .ql-editor-view ol { list-style-type: decimal; }
        .ql-editor-view li {
          margin-bottom: 0.5rem;
          color: #334155;
        }
        .ql-editor-view a {
          color: #E31B23;
          text-decoration: none;
          font-weight: 600;
        }
        .ql-editor-view a:hover {
          text-decoration: underline;
        }
        .ql-editor-view blockquote {
          border-left: 4px solid #E31B23;
          padding-left: 1.25rem;
          font-style: italic;
          color: #475569;
          margin-bottom: 1.5rem;
          background: #f8fafc;
          padding: 1.25rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .ql-editor-view table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 2rem;
          font-size: 0.875rem;
        }
        .ql-editor-view th, .ql-editor-view td {
          border: 1px solid #cbd5e1;
          padding: 0.75rem 1rem;
          text-align: left;
        }
        .ql-editor-view th {
          background-color: #f1f5f9;
          color: #0f172a;
          font-weight: 800;
          text-transform: uppercase;
        }
        .ql-editor-view tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .ql-editor-view tr:hover {
          background-color: #f1f5f9;
        }
      `}} />

      {!skipFooter && <Footer settings={settings} />}
    </div>
  );
}
