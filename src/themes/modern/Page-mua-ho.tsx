"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { 
  ArrowLeft, 
  Calculator, 
  CheckCircle, 
  ExternalLink, 
  HelpCircle, 
  DollarSign, 
  FileText,
  ShoppingBag,
  Sparkles,
  Link2
} from 'lucide-react';

export default function ModernPageMuaHo({ 
  post, 
  settings = {}, 
}: { 
  post: any; 
  settings: any; 
  isAuthorizedUser: boolean;
  formattedDate: string;
  formattedUpdateDate: string;
}) {
  const [exchangeRateCNY, setExchangeRateCNY] = useState(3550); // Mặc định tỷ giá Tệ
  const [exchangeRateJPY, setExchangeRateJPY] = useState(175);  // Mặc định tỷ giá Yên

  // State cho Form tính toán
  const [currency, setCurrency] = useState<'CNY' | 'JPY'>('CNY');
  const [productLink, setProductLink] = useState('');
  const [productName, setProductName] = useState('');
  const [attributes, setAttributes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [domesticShip, setDomesticShip] = useState<number | ''>('');
  
  // Kết quả tính toán
  const currentRate = currency === 'CNY' ? exchangeRateCNY : exchangeRateJPY;
  const rateSymbol = currency === 'CNY' ? '¥' : '¥ (JPY)';
  
  const priceRaw = (Number(unitPrice) || 0) * quantity + (Number(domesticShip) || 0);
  const priceVND = priceRaw * currentRate;
  
  // Tính phí dịch vụ mua hộ (mặc định 3% giá trị đơn hàng, tối thiểu 20,000 VND)
  const serviceFeePercentage = 0.03;
  const serviceFeeVND = Math.max(priceVND * serviceFeePercentage, 20000);
  
  const totalEstimatedVND = priceVND + serviceFeeVND;

  const quickSources = [
    { name: 'Taobao', url: 'https://taobao.com', desc: 'Sàn bán lẻ khổng lồ của Alibaba', logo: 'https://img.alicdn.com/tfs/TB1_uT8a5ERMeJjSspiXXb38VXa-112-112.png' },
    { name: '1688', url: 'https://1688.com', desc: 'Bán buôn giá xưởng Trung Quốc', logo: 'https://gw.alicdn.com/tfs/TB1d7_7a5ERMeJjSspiXXb38VXa-112-112.png' },
    { name: 'Tmall', url: 'https://tmall.com', desc: 'Hàng hiệu chính hãng Trung Quốc', logo: 'https://img.alicdn.com/tfs/TB1Lzd7a5ERMeJjSspiXXb38VXa-112-112.png' },
    { name: 'Yahoo JP', url: 'https://auctions.yahoo.co.jp', desc: 'Đấu giá & Mua sắm Nhật Bản', logo: 'https://s.yimg.jp/c/logo/f/2.0/auction_r_34_2x.png' },
    { name: 'Mercari', url: 'https://jp.mercari.com', desc: 'Chợ đồ cũ lớn nhất Nhật Bản', logo: 'https://static.mercdn.net/images/mercari_profile.png' },
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
              <Sparkles size={11} /> Dịch vụ nhập hàng trọn gói
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-4">
              Mua Hộ Hàng Quốc Tế
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
              Đặt mua hàng trực tiếp từ các website thương mại điện tử hàng đầu Trung Quốc (Taobao, 1688, Tmall) và Nhật Bản (Yahoo, Mercari, Amazon JP). Nhập thông tin sản phẩm dưới đây để ước tính giá về Việt Nam.
            </p>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-xl">
                Tỷ giá CNY: <span className="font-extrabold text-indigo-300">{exchangeRateCNY.toLocaleString()}đ</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-xl">
                Tỷ giá JPY: <span className="font-extrabold text-indigo-300">{exchangeRateJPY.toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left + Mid Columns: Calculator Form */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 sm:p-8 shadow-md">
              <h2 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3.5">
                <Calculator size={18} className="text-indigo-600" />
                Công cụ tính phí & gửi yêu cầu mua hộ
              </h2>

              <div className="space-y-6 text-xs">
                {/* Chọn quốc gia / tiền tệ */}
                <div>
                  <label className="block font-extrabold text-slate-700 mb-2.5">Thị trường mua hàng</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrency('CNY')}
                      className={`py-3 rounded-xl border font-extrabold transition-all cursor-pointer ${
                        currency === 'CNY'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                      }`}
                    >
                      Trung Quốc (CNY - ¥)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('JPY')}
                      className={`py-3 rounded-xl border font-extrabold transition-all cursor-pointer ${
                        currency === 'JPY'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                      }`}
                    >
                      Nhật Bản (JPY - ¥)
                    </button>
                  </div>
                </div>

                {/* Đường dẫn sản phẩm */}
                <div>
                  <label className="block font-extrabold text-slate-700 mb-2 flex items-center gap-1">
                    <Link2 size={13} className="text-indigo-500" />
                    Đường dẫn sản phẩm (Product Link) *
                  </label>
                  <input
                    type="url"
                    value={productLink}
                    onChange={(e) => setProductLink(e.target.value)}
                    placeholder="Ví dụ: https://item.taobao.com/item.htm?id=..."
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tên sản phẩm */}
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-2">Tên sản phẩm *</label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Ví dụ: Áo phao nam dày"
                      className="w-full px-3.5 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white"
                      required
                    />
                  </div>

                  {/* Thuộc tính */}
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-2">Thuộc tính (Màu sắc, kích thước...)</label>
                    <input
                      type="text"
                      value={attributes}
                      onChange={(e) => setAttributes(e.target.value)}
                      placeholder="Ví dụ: Màu đen, size L"
                      className="w-full px-3.5 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Số lượng */}
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-2">Số lượng</label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3.5 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-extrabold text-center"
                    />
                  </div>

                  {/* Đơn giá tệ/yên */}
                  <div className="col-span-2">
                    <label className="block font-extrabold text-slate-700 mb-2">Đơn giá ({rateSymbol}) *</label>
                    <input
                      type="number"
                      min={0}
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Nhập giá web"
                      className="w-full px-3.5 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-extrabold"
                      required
                    />
                  </div>
                </div>

                {/* Phí ship nội địa nước ngoài */}
                <div>
                  <label className="block font-extrabold text-slate-700 mb-2">Phí ship nội địa (Nếu có) ({rateSymbol})</label>
                  <input
                    type="number"
                    min={0}
                    value={domesticShip}
                    onChange={(e) => setDomesticShip(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Mặc định: 0"
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 bg-white font-semibold"
                  />
                </div>

                {/* Kết quả tạm tính */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 mt-4 space-y-3.5">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Tổng tiền sản phẩm ({currency}):</span>
                    <span className="font-extrabold text-slate-900">{priceRaw.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Quy đổi VND:</span>
                    <span className="font-extrabold text-slate-900">{priceVND.toLocaleString()} đ</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Phí dịch vụ mua hộ (3%):</span>
                    <span className="font-extrabold text-slate-900">{serviceFeeVND.toLocaleString()} đ</span>
                  </div>
                  <div className="border-t border-indigo-100 pt-3.5 flex justify-between items-center text-slate-800">
                    <span className="font-black">Tổng tạm tính:</span>
                    <span className="text-base font-black text-indigo-600">{totalEstimatedVND.toLocaleString()} đ</span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic font-semibold mt-1">
                    * Giá tạm tính chưa bao gồm cước cân nặng vận chuyển quốc tế từ kho Trung/Nhật về Việt Nam.
                  </p>
                </div>

                {/* Nút gửi yêu cầu */}
                <button
                  type="button"
                  onClick={() => alert(`Yêu cầu mua hộ sản phẩm "${productName || 'Không rõ tên'}" đã được ghi nhận. Đội ngũ Lexi sẽ liên hệ lại qua Hotline trong vòng 5 phút!`)}
                  className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-md"
                >
                  <ShoppingBag size={15} /> Gửi yêu cầu mua hộ ngay
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Fee Table & Quick Links */}
          <div className="space-y-8">
            
            {/* Nguồn hàng uy tín */}
            <section className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-md">
              <h2 className="text-xs font-black text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ExternalLink size={15} className="text-indigo-600" />
                Nguồn hàng khuyên dùng
              </h2>
              
              <div className="space-y-3">
                {quickSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/60 transition-colors group cursor-pointer"
                  >
                    <img 
                      src={source.logo} 
                      alt={source.name} 
                      className="w-7 h-7 rounded-lg object-contain bg-white border border-slate-100 p-0.5" 
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold text-[11px] text-slate-800 group-hover:text-indigo-600 transition-colors block">
                        {source.name}
                      </span>
                      <span className="text-[9px] text-slate-400 block truncate font-semibold mt-0.5">{source.desc}</span>
                    </div>
                    <ExternalLink size={10} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </a>
                ))}
              </div>
            </section>

            {/* Bảng giá dịch vụ mua hộ */}
            <section className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-md">
              <h2 className="text-xs font-black text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
                <DollarSign size={15} className="text-indigo-600" />
                Biểu phí dịch vụ mua hộ
              </h2>

              <div className="overflow-x-auto text-[10px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 font-black text-slate-500">Giá trị đơn hàng</th>
                      <th className="text-right py-2 font-black text-slate-500">Phí mua hộ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    <tr>
                      <td className="py-2.5 text-slate-600 font-semibold">&lt; 10.000.000 đ</td>
                      <td className="text-right py-2.5 text-indigo-600">3.0% (Tối thiểu 20k)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-slate-600 font-semibold">10M - 50M đ</td>
                      <td className="text-right py-2.5 text-indigo-600">2.5%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-slate-600 font-semibold">50M - 200M đ</td>
                      <td className="text-right py-2.5 text-indigo-600">2.0%</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-slate-600 font-semibold">&gt; 200.000.000 đ</td>
                      <td className="text-right py-2.5 text-indigo-600">1.5%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] leading-relaxed text-slate-500 font-medium">
                <strong className="text-slate-700 font-extrabold block mb-1">Quy định cọc hàng:</strong>
                Quý khách vui lòng đặt cọc trước từ 70% - 100% giá trị đơn hàng tạm tính để tiến hành mua hàng.
              </div>
            </section>
          </div>

        </div>

        {/* Content Section - Render post content (from Admin) */}
        {post.content && (
          <section className="bg-white rounded-3xl border border-slate-200/50 p-6 sm:p-10 shadow-md mt-10">
            <h2 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              Chi tiết hướng dẫn mua hộ hàng
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
