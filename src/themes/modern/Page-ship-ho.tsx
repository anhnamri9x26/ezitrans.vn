"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { 
  ArrowLeft, 
  Calculator, 
  MapPin, 
  AlertTriangle, 
  Info, 
  Sparkles,
  Plane,
  Ship,
  TrendingUp,
  FileText,
  Copy,
  Check
} from 'lucide-react';

export default function ModernPageShipHo({ 
  post, 
  settings = {}, 
}: { 
  post: any; 
  settings: any; 
  isAuthorizedUser: boolean;
  formattedDate: string;
  formattedUpdateDate: string;
}) {
  const [route, setRoute] = useState<'CN_VN' | 'JP_VN'>('CN_VN');
  const [weight, setWeight] = useState<number | ''>('');
  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Tính phí vận chuyển ước tính
  // CN -> VN: Cân nặng dưới 10kg là 28.000đ/kg, từ 10kg trở lên là 25.000đ/kg. Phí thể tích tính bằng công thức dài*rộng*cao/6000 * 25.000đ.
  // JP -> VN: Cân nặng mặc định là 190.000đ/kg, thể tích tính bằng dài*rộng*cao/5000 * 190.000đ.
  const cnWeightRate = (Number(weight) || 0) < 10 ? 28000 : 25000;
  const jpWeightRate = 190000;

  const getShippingCost = () => {
    const w = Number(weight) || 0;
    const l = Number(length) || 0;
    const wd = Number(width) || 0;
    const h = Number(height) || 0;

    const volumeWeight = (l * wd * h) / (route === 'CN_VN' ? 6000 : 5000);
    const chargeableWeight = Math.max(w, volumeWeight);

    if (route === 'CN_VN') {
      return {
        chargeableWeight,
        rate: cnWeightRate,
        total: chargeableWeight * cnWeightRate
      };
    } else {
      return {
        chargeableWeight,
        rate: jpWeightRate,
        total: chargeableWeight * jpWeightRate
      };
    }
  };

  const costResult = getShippingCost();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const warehouses = [
    {
      id: 'wh_cn_gz',
      title: 'Kho Quảng Châu (Trung Quốc)',
      address: '广州市荔湾区芳村大道西塞坝路口 35号仓 (Mã Khách Hàng)',
      phone: '13826048123',
      instructions: 'Vui lòng ghi rõ mã khách hàng ở dòng địa chỉ 2 để tránh thất lạc hàng.'
    },
    {
      id: 'wh_cn_pt',
      title: 'Kho Bằng Tường (Trung Quốc)',
      address: '广西凭祥市凭祥镇北环路金祥小区 B-12号仓 (Mã Khách Hàng)',
      phone: '18978123456',
      instructions: 'Tuyến đi chậm hoặc hàng lô lớn nặng.'
    },
    {
      id: 'wh_jp_tokyo',
      title: 'Kho Tokyo (Nhật Bản)',
      address: '東京都足立区花畑 5-12-3 (Mã Khách Hàng)',
      phone: '080-1234-5678',
      instructions: 'Tuyến bay tốc độ cao 3-5 ngày làm việc.'
    }
  ];

  const prohibitedItems = [
    { category: 'Hàng cấm bay / Cấm nhập khẩu', list: 'Chất dễ cháy nổ, vũ khí, ma túy, hóa chất độc hại, sinh vật sống, thiết bị y tế đã qua sử dụng, văn hóa phẩm đồi trụy.' },
    { category: 'Hàng nhạy cảm (Phụ thu)', list: 'Mỹ phẩm dạng lỏng, thực phẩm chức năng, đồ điện tử có pin, hàng hiệu xa xỉ (Gucci, LV, Chanel...), nước hoa.' },
    { category: 'Hàng thông thường', list: 'Quần áo, giày dép, đồ gia dụng, linh kiện nhựa, sách vở, phụ kiện thời trang thông thường.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
      <Header settings={settings} />

      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 w-full relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex gap-2">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 bg-white border border-slate-200/60 hover:bg-slate-50 px-4 py-2 rounded-xl transition-all shadow-sm">
            <ArrowLeft size={11} /> Quay lại trang chủ
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl text-white p-8 sm:p-12 mb-10 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_40%)]" />
          <div className="max-w-2xl relative z-10">
            <span className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-extrabold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-6">
              <Sparkles size={11} /> Vận chuyển ký gửi chuyên nghiệp
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-4">
              Dịch Vụ Ship Hộ & Ký Gửi
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
              Tự mua hàng và ký gửi hàng hóa tại hệ thống kho của Lexi ở Quảng Châu, Bằng Tường (Trung Quốc) hoặc Tokyo (Nhật Bản). Chúng tôi nhận gom hàng, đóng gói và vận chuyển an toàn về tận tay bạn tại Việt Nam.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Shipping Calculator */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 sm:p-8 shadow-md">
              <h2 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3.5">
                <Calculator size={18} className="text-indigo-600" />
                Công cụ tính cước nhanh thông minh
              </h2>

              <div className="space-y-6 text-xs">
                {/* Chọn tuyến */}
                <div>
                  <label className="block font-extrabold text-slate-700 mb-2.5">Tuyến đường ký gửi</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRoute('CN_VN')}
                      className={`py-3 rounded-xl border font-extrabold transition-all cursor-pointer ${
                        route === 'CN_VN'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                      }`}
                    >
                      Trung Quốc → Việt Nam
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoute('JP_VN')}
                      className={`py-3 rounded-xl border font-extrabold transition-all cursor-pointer ${
                        route === 'JP_VN'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                      }`}
                    >
                      Nhật Bản → Việt Nam
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Trọng lượng thực */}
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-2">Trọng lượng (kg)</label>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="VD: 5"
                      className="w-full px-3.5 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-extrabold text-center"
                    />
                  </div>

                  {/* Dài */}
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-2">Dài (cm)</label>
                    <input
                      type="number"
                      min={1}
                      value={length}
                      onChange={(e) => setLength(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="VD: 30"
                      className="w-full px-3.5 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white text-center"
                    />
                  </div>

                  {/* Rộng */}
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-2">Rộng (cm)</label>
                    <input
                      type="number"
                      min={1}
                      value={width}
                      onChange={(e) => setWidth(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="VD: 20"
                      className="w-full px-3.5 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white text-center"
                    />
                  </div>

                  {/* Cao */}
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-2">Cao (cm)</label>
                    <input
                      type="number"
                      min={1}
                      value={height}
                      onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="VD: 15"
                      className="w-full px-3.5 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white text-center"
                    />
                  </div>
                </div>

                {/* Kết quả tạm tính */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mt-4 space-y-3.5">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Trọng lượng tính cước quy đổi:</span>
                    <span className="font-extrabold text-slate-900">{costResult.chargeableWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Đơn giá vận chuyển cơ bản:</span>
                    <span className="font-extrabold text-slate-900">{costResult.rate.toLocaleString()} đ/kg</span>
                  </div>
                  <div className="border-t border-indigo-100 pt-3.5 flex justify-between items-center text-slate-800">
                    <span className="font-black">Tổng cước ước tính:</span>
                    <span className="text-base font-black text-indigo-600">
                      {costResult.total > 0 ? `${costResult.total.toLocaleString()} đ` : '0 đ'}
                    </span>
                  </div>
                  <div className="flex gap-2 bg-white border border-slate-100 rounded-xl p-3 text-[10px] text-slate-400 font-semibold leading-normal">
                    <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <span>
                      Công thức quy đổi thể tích chuẩn IATA: (Dài x Rộng x Cao) / {route === 'CN_VN' ? '6000' : '5000'}. Trọng lượng tính cước sẽ lấy số lớn hơn giữa cân nặng thực tế và cân nặng quy đổi.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Kho hàng quốc tế */}
            <section className="bg-white rounded-2xl border border-slate-200/50 p-6 sm:p-8 shadow-md">
              <h2 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin size={17} className="text-indigo-600" />
                Hệ thống kho ký gửi quốc tế
              </h2>
              
              <div className="space-y-6 text-xs">
                {warehouses.map((wh) => (
                  <div key={wh.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3 relative group">
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-slate-800 block text-xs">{wh.title}</span>
                      <button
                        onClick={() => handleCopy(wh.address, wh.id)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1 border-none bg-transparent cursor-pointer flex items-center gap-1 font-bold text-[9px]"
                      >
                        {copiedText === wh.id ? (
                          <>
                            <Check size={11} className="text-emerald-500" /> Coppy thành công
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> Sao chép địa chỉ
                          </>
                        )}
                      </button>
                    </div>

                    <div className="font-mono text-[10px] text-slate-600 bg-white border border-slate-200/60 p-2.5 rounded-lg leading-relaxed select-all">
                      {wh.address}
                    </div>

                    <div className="text-[10px] text-slate-500">
                      <strong>Số điện thoại kho:</strong> {wh.phone}
                    </div>

                    <div className="text-[9px] text-slate-400 italic font-semibold">
                      * {wh.instructions}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Regulations & Guidelines */}
          <div className="space-y-8 text-xs">
            
            {/* Quy định hàng hóa */}
            <section className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-md">
              <h2 className="text-xs font-black text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                <AlertTriangle size={15} className="text-rose-500" />
                Danh mục quy định hàng hóa
              </h2>

              <div className="space-y-5">
                {prohibitedItems.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <span className="font-extrabold text-slate-800 block text-[11px] flex items-center gap-1.5">
                      {idx === 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                      {idx === 1 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      {idx === 2 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {item.category}
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold pl-3 border-l border-slate-100">
                      {item.list}
                    </p>
                  </div>
                ))}
              </div>
            </section>

          </div>

        </div>

        {/* Content Section - Render post content (from Admin) */}
        {post.content && (
          <section className="bg-white rounded-3xl border border-slate-200/50 p-6 sm:p-10 shadow-md mt-10">
            <h2 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              Chi tiết quy trình ship hộ
            </h2>
            <div 
              className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-[13px] sm:text-[14px] ql-editor-view font-medium"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </section>
        )}

      </main>

      {/* Embedded Styles for Quill CSS Fallbacks */}
      <style dangerouslySetInnerHTML={{ __html: `
        .ql-editor-view p {
          margin-bottom: 1.25rem;
        }
        .ql-editor-view h1, .ql-editor-view h2, .ql-editor-view h3 {
          color: #0f172a;
          font-weight: 800;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .ql-editor-view h1 { font-size: 1.4em; }
        .ql-editor-view h2 { font-size: 1.2em; }
        .ql-editor-view h3 { font-size: 1.1em; }
        .ql-editor-view ul, .ql-editor-view ol {
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .ql-editor-view ul { list-style-type: disc; }
        .ql-editor-view ol { list-style-type: decimal; }
        .ql-editor-view li {
          margin-bottom: 0.5rem;
        }
        .ql-editor-view a {
          color: #4f46e5;
          text-decoration: underline;
          font-weight: 700;
        }
        .ql-editor-view a:hover {
          color: #4338ca;
        }
        .ql-editor-view blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1rem;
          font-style: italic;
          color: #475569;
          margin-bottom: 1.25rem;
        }
      `}} />

      <Footer settings={settings} />
    </div>
  );
}
