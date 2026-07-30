"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import { 
  Calendar, 
  User, 
  ArrowRight, 
  Sparkles, 
  Search, 
  ShoppingBag, 
  CreditCard,
  Truck, 
  Star,
  Globe,
  Send,
  PhoneCall,
  DollarSign,
  ShieldCheck,
  Users,
  Eye,
  ArrowUpRight,
  X,
  CheckCircle,
  Mail,
  MapPin,
  ChevronRight,
  Loader2,
  Download,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Check
} from 'lucide-react';
import { generatePostUrl, formatDateWordPress } from '@/lib/permalink';

export default function ModernHomepage({ 
  posts = [], 
  settings = {},
  skipHeader = false,
  skipFooter = false
}: { 
  posts: any[]; 
  settings: any;
  skipHeader?: boolean;
  skipFooter?: boolean;
}) {
  const permalinkStructure = settings.permalink_structure || '/%postname%.html';
  const siteLanguage = settings.site_language || 'vi';
  const dateFormat = settings.date_format || 'j F, Y';

  // SSR mounted safety
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // State for Quick Quote Request Form (Hero Card)
  const [productUrl, setProductUrl] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // State for tracking search (Hero bottom)
  const [trackingCode, setTrackingCode] = useState('');

  // Premium Modals state
  const [isHomeModalOpen, setIsHomeModalOpen] = useState(false);
  const [homeModalType, setHomeModalType] = useState<'advisor' | 'price' | 'tracking' | 'purchase'>('advisor');

  // Tracking modal specific state
  const [modalTrackingCode, setModalTrackingCode] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<any>(null);

  // Advisory modal form state
  const [advisorForm, setAdvisorForm] = useState({ name: '', phone: '', service: 'Mua hộ', message: '' });
  const [advisorSuccess, setAdvisorSuccess] = useState(false);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  // Custom purchase request form (inside modal)
  const [purchaseForm, setPurchaseForm] = useState({ url: '', name: '', phone: '', qty: '1', note: '' });
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const openModal = (type: 'advisor' | 'price' | 'tracking' | 'purchase') => {
    setHomeModalType(type);
    if (type === 'advisor') {
      setAdvisorForm({ name: '', phone: '', service: 'Mua hộ', message: '' });
      setAdvisorSuccess(false);
      setAdvisorLoading(false);
    } else if (type === 'purchase') {
      setPurchaseForm({ url: '', name: '', phone: '', qty: '1', note: '' });
      setPurchaseSuccess(false);
      setPurchaseLoading(false);
    } else if (type === 'tracking') {
      setModalTrackingCode(trackingCode.trim().toUpperCase());
      setTrackingResult(null);
      setTrackingLoading(false);
    }
    setIsHomeModalOpen(true);
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      alert('Vui lòng nhập mã vận đơn để tra cứu!');
      return;
    }
    
    setModalTrackingCode(trackingCode.trim().toUpperCase());
    setTrackingLoading(true);
    setTrackingResult(null);
    setHomeModalType('tracking');
    setIsHomeModalOpen(true);

    setTimeout(() => {
      setTrackingLoading(false);
      const cleanCode = trackingCode.trim().toUpperCase();
      setTrackingResult({
        code: cleanCode,
        weight: "2.8 kg",
        destination: "Hà Nội, Việt Nam",
        type: "Vận chuyển nhanh hàng không",
        status: "Đang vận chuyển quốc tế",
        steps: [
          { title: "Đã tiếp nhận yêu cầu", desc: "Hệ thống Lexi đã ghi nhận mã vận đơn.", time: "25/05/2026 09:30", done: true },
          { title: "Đã gom hàng tại kho gửi", desc: "Nhận hàng tại kho đối tác nước ngoài thành công.", time: "26/05/2026 14:15", done: true },
          { title: "Đang vận chuyển quốc tế", desc: "Hàng đang được trung chuyển hàng không/hàng hải quốc tế.", time: "27/05/2026 23:45", current: true },
          { title: "Đến kho khai thác Việt Nam", desc: "Khai thác phân loại hàng và làm thủ tục thông quan hàng hóa.", time: "Chờ cập nhật", pending: true },
          { title: "Giao hàng thành công", desc: "Đơn vị vận chuyển nội địa bàn giao đơn hàng.", time: "Chờ cập nhật", pending: true }
        ]
      });
    }, 1200);
  };

  const handleModalTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTrackingCode.trim()) {
      alert('Vui lòng nhập mã vận đơn để tra cứu!');
      return;
    }
    setTrackingLoading(true);
    setTrackingResult(null);
    setTimeout(() => {
      setTrackingLoading(false);
      const cleanCode = modalTrackingCode.trim().toUpperCase();
      setTrackingResult({
        code: cleanCode,
        weight: "2.8 kg",
        destination: "Hà Nội, Việt Nam",
        type: "Vận chuyển nhanh hàng không",
        status: "Đang vận chuyển quốc tế",
        steps: [
          { title: "Đã tiếp nhận yêu cầu", desc: "Hệ thống Lexi đã ghi nhận mã vận đơn.", time: "25/05/2026 09:30", done: true },
          { title: "Đã gom hàng tại kho gửi", desc: "Nhận hàng tại kho đối tác nước ngoài thành công.", time: "26/05/2026 14:15", done: true },
          { title: "Đang vận chuyển quốc tế", desc: "Hàng đang được trung chuyển hàng không/hàng hải quốc tế.", time: "27/05/2026 23:45", current: true },
          { title: "Đến kho khai thác Việt Nam", desc: "Khai thác phân loại hàng và làm thủ tục thông quan hàng hóa.", time: "Chờ cập nhật", pending: true },
          { title: "Giao hàng thành công", desc: "Đơn vị vận chuyển nội địa bàn giao đơn hàng.", time: "Chờ cập nhật", pending: true }
        ]
      });
    }, 1000);
  };

  const handleQuoteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productUrl || !fullName || !phoneNumber) {
      alert('Vui lòng điền đầy đủ thông tin yêu cầu báo giá!');
      return;
    }
    setPurchaseForm({
      url: productUrl,
      name: fullName,
      phone: phoneNumber,
      qty: '1',
      note: 'Yêu cầu nhanh từ trang chủ'
    });
    setPurchaseSuccess(true);
    setHomeModalType('purchase');
    setIsHomeModalOpen(true);
    setProductUrl('');
    setFullName('');
    setPhoneNumber('');
  };

  const handleAdvisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorForm.name || !advisorForm.phone) {
      alert("Vui lòng nhập đầy đủ Họ tên và Số điện thoại!");
      return;
    }
    setAdvisorLoading(true);
    setTimeout(() => {
      setAdvisorLoading(false);
      setAdvisorSuccess(true);
    }, 1200);
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseForm.url || !purchaseForm.name || !purchaseForm.phone) {
      alert("Vui lòng điền đầy đủ thông tin yêu cầu mua hộ!");
      return;
    }
    setPurchaseLoading(true);
    setTimeout(() => {
      setPurchaseLoading(false);
      setPurchaseSuccess(true);
    }, 1200);
  };

  const services = [
    {
      title: 'Mua Hộ Hàng Hóa Từ Nước Nguồn',
      desc: 'Việc order hàng từ nước ngoài chưa bao giờ dễ hơn với dịch vụ mua hộ hàng của Lexi. Bạn chỉ cần gửi link sản phẩm, chúng tôi sẽ báo giá cho bạn. Sau khi thanh toán, bạn chỉ là đợi hàng về đến tận nhà, việc còn lại cứ để Lexi lo! Lexi hỗ trợ Quý khách mua hộ và thanh toán trên hầu hết các trang TMĐT như: Amazon, Ebay, Chemist Warehouse, Alibaba, Taobao, 1688, Tmall, AliExpress,...',
      shortDesc: 'Đặt mua hàng từ Amazon, Ebay, Taobao, Alibaba... dễ dàng với hỗ trợ thanh toán, vận chuyển và thủ tục hải quan trọn gói.',
      link: '/mua-ho',
      icon: ShoppingBag,
      channels: ['Amazon', 'Ebay', 'Chemist', 'Alibaba', 'Taobao', '1688', 'Tmall', 'AliExpress']
    },
    {
      title: 'Ship Hàng / Ký Gửi Quốc Tế (Ship Hộ)',
      desc: 'Cung cấp dịch vụ chuyển tiếp hàng hóa (Package Forwarding Service) từ các quốc gia như Mỹ, Đức, Nhật, Úc, Anh, Séc về Việt Nam chuyên nghiệp. Nhận hàng tại địa chỉ kho ngoại, gom chuyến bay/xe container nhanh chóng, đóng gỗ bảo vệ, hỗ trợ thủ tục thông quan hải quan trọn gói.',
      shortDesc: 'Chuyển tiếp bưu phẩm từ Mỹ, Đức, Nhật, Úc... về Việt Nam chuyên nghiệp, nhanh chóng với đóng gói bảo vệ tối đa và hỗ trợ hải quan trọn gói.',
      link: '/ship-ho',
      icon: Truck,
      channels: ['Mỹ', 'Đức', 'Nhật Bản', 'Anh Quốc', 'Úc', 'CH Séc', 'Hàn Quốc']
    },
    {
      title: 'Thanh Toán Hộ Quốc Tế (Tệ/USD)',
      desc: 'Nạp tệ Alipay, Wechat Pay, thanh toán hóa đơn PayPal quốc tế, chuyển khoản ngân hàng Trung Quốc với tỷ giá tốt nhất thị trường. Xử lý giao dịch nhanh gọn trong vòng 5 phút, bảo mật, an toàn tuyệt đối và có bill xác nhận.',
      shortDesc: 'Nạp tệ Alipay, WeChat Pay, thanh toán PayPal hóa đơn nước ngoài an toàn, bảo mật tuyệt đối với bill giao dịch trong 5 phút.',
      link: '#',
      icon: CreditCard,
      channels: ['Alipay', 'WeChat Pay', 'PayPal', 'Ngân hàng Trung Quốc']
    }
  ];

  const advantages = [
    {
      title: 'Vận chuyển tới 195 quốc gia',
      desc: 'Chúng tôi có thể vận chuyển hàng hóa từ Việt Nam đi tới 195 quốc gia và vùng lãnh thổ trên toàn thế giới.',
      icon: Globe
    },
    {
      title: 'Cước phí cạnh tranh',
      desc: 'Vận chuyển bằng máy bay, kết hợp mạng lưới vận chuyển từ các đối tác lớn giúp Lexi cung cấp dịch vụ vận chuyển nhanh với giá cước cạnh tranh.',
      icon: DollarSign
    },
    {
      title: 'Chăm sóc KH tận tình',
      desc: 'Bên cạnh dịch vụ cạnh tranh, Lexi cũng luôn mang tới chất lượng chăm sóc khách hàng tuyệt vời với những ưu đãi cực hấp dẫn cho khách cũ.',
      icon: PhoneCall
    },
    {
      title: 'Thanh toán đa dạng',
      desc: 'Đa dạng các phương thức thanh toán: chuyển khoản, trực tiếp… giúp khách hàng có thêm nhiều lựa chọn khi sử dụng dịch vụ tại Lexi.',
      icon: CreditCard
    }
  ];

  const exportAdvantages = [
    {
      title: 'Uy tín & An toàn',
      desc: 'Đảm bảo an toàn tuyệt đối mọi sản phẩm, bảo hiểm hàng hóa 100% để tránh tối đa tình trạng nhầm hàng, hư hỏng hoặc mất hàng hóa. Thời gian vận chuyển đi quốc tế từ 3 – 7 ngày, nguyên đai – nguyên kiện.'
    },
    {
      title: 'Nhân viên nhiệt tình, chu đáo',
      desc: 'Tư vấn lựa chọn các website mua hàng uy tín tại từng quốc gia một cách tường tận, giảm thiểu tối đa rủi ro cho khách hàng khi giao dịch qua Internet. Nhân viên hỗ trợ miễn phí 24/7.'
    },
    {
      title: 'Cước phí cạnh tranh',
      desc: 'Giá cước hỗ trợ trọn gói các thủ tục thông quan hàng hóa, không có thêm phụ phí nào. Mức giá luôn ổn định không thay đổi bất ngờ.'
    },
    {
      title: 'Theo dõi tình trạng đơn hàng dễ dàng',
      desc: 'Lexi tích hợp tính năng tracking đơn hàng trực tuyến. Vì vậy, bạn có thể dễ dàng biết được tình hình đơn hàng của bạn hiện tại như thế nào.'
    }
  ];

  const stepsBuy = [
    { num: '01', title: 'Quý khách gửi thông tin sản phẩm', desc: 'Khách hàng gửi thông tin sản phẩm cần mua hộ cho Lexi qua mail contact@lexi.com hoặc click vào nút báo giá mua hộ.' },
    { num: '02', title: 'Lexi lên đơn & Quý khách đặt cọc', desc: 'Sau khi khách hàng gửi thông tin về sản phẩm, chúng tôi báo giá cho bạn. Bạn tiến hành đặt cọc để Lexi mua và gửi hàng cho bạn.' },
    { num: '03', title: 'Hàng về kho tại trụ sở nước ngoài', desc: 'Hàng hóa sẽ được Lexi chuyển về kho tại trụ sở nước ngoài. Bạn có thể sử dụng tính năng theo dõi đơn hàng trên website để biết trạng thái.' },
    { num: '04', title: 'Hàng về Việt Nam & Tiến hành giao', desc: 'Hàng hóa vận chuyển về Việt Nam qua đường biển hoặc hàng không. Hàng về kho Việt Nam sẽ được kiểm hàng và tiến hành giao.' },
    { num: '05', title: 'Quý khách thanh toán và nhận hàng', desc: 'Bạn tiến hành thanh toán số tiền còn lại và sau đó Lexi sẽ gửi hàng đến tận địa chỉ của bạn.' }
  ];

  const stepsExport = [
    { num: '01', title: 'Xác nhận thông tin đơn hàng', desc: 'Khách hàng gửi thông tin đơn hàng cần vận chuyển đi nước ngoài cho Lexi thông qua hotline hoặc email của chúng tôi.' },
    { num: '02', title: 'Tư vấn & Báo giá', desc: 'Nhân viên sẽ liên hệ lại để tư vấn về cách thức đóng gói, quy trình gửi hàng, báo giá cước phí & thông báo lộ trình bay sớm nhất.' },
    { num: '03', title: 'Gửi hàng về văn phòng Việt Nam', desc: 'Quý khách gửi hàng về văn phòng của Lexi tại Việt Nam. Tại đây, chúng tôi cân đo, kiểm đếm & đóng gói hàng hóa.' },
    { num: '04', title: 'Thanh toán tiền cước', desc: 'Quý khách thanh toán tiền cước của toàn bộ đơn hàng bằng tiền mặt hoặc chuyển khoản tùy theo yêu cầu của Quý khách.' },
    { num: '05', title: 'Gửi hàng từ Việt Nam đi nước ngoài', desc: 'Sau khi nhận thanh toán, Lexi tiến hành thủ tục thông quan và gửi hàng đến tận tay người nhận trong chuyến bay sớm nhất.' }
  ];

  const partners = [
    { name: 'Taobao', url: 'https://taobao.com' },
    { name: '1688', url: 'https://1688.com' },
    { name: 'Tmall', url: 'https://tmall.com' },
    { name: 'Alibaba', url: 'https://alibaba.com' },
    { name: 'Amazon', url: '#' },
    { name: 'Ebay', url: '#' },
    { name: 'Chemist Warehouse', url: '#' }
  ];

  const testimonials = [
    {
      name: 'Lem Phanh',
      role: 'Kinh doanh Online',
      avatar: 'LP',
      text: 'Mình order qua nhiều công ty, nhưng khi có sự cố thì các cty toàn bơ không bồi thường gì cả, nhưng Công ty này phần chăm sóc khách hàng và hỗ trợ xử lí khiếu nại rất chuyên nghiệp, chu đáo, hỗ trợ mình khiếu nại và bồi thường hàng hóa rõ ràng.'
    },
    {
      name: 'Duong Do',
      role: 'Bán hàng Online',
      avatar: 'DD',
      text: 'Nhân viên hỗ trợ nhiệt tình. Nếu đợt nào hàng chậm, hay có vấn đề ib thì tl lại luôn và cập nhập thông tin đơn hàng liên tục cho khách. Không như bên cũ mình đi. Lúc nào đặt hàng thì tl nhanh nhưng cứ hỏi hàng hay khiếu nại thì im hết.'
    },
    {
      name: 'Hong Nguyen',
      role: 'Kinh doanh Online',
      avatar: 'HN',
      text: 'Mình đã mua đồ nhiều bên thấy bên này dịch vụ rất là ok nà. Service ổn và có bạn tóc goldie lùn lùn rất là nhiệt tình. Nói chung là sẽ quay lại sử dụng dịch vụ của bên này.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafbfe] flex flex-col font-sans text-slate-800 antialiased relative">
      {!skipHeader && <Header settings={settings} />}

      {/* 1. HERO SECTION — Premium Dusk Logistics Port Background with Elegant Dual-Card Layout */}
      <section 
        className="relative overflow-hidden w-full bg-cover bg-center py-16 sm:py-20 lg:py-24"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.65)), url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=80')`
        }}
      >
        {/* Subtle overlay lines for technical logistics feeling */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE4YzAtMS42NTctMS4zNDMtMy0zLTNzLTMgMS4zNDMtMyAzIDEuMzQzIDMgMyAzIDMtMS4zNDMgMy0zeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30 z-0" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-[130px] pointer-events-none z-0" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            
            {/* ===== LEFT CARD: Vibrant Royal-Blue Logistics Card (LG: 7 Cols) ===== */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-brand-600/90 backdrop-blur-md border border-brand-500/30 rounded-3xl p-8 lg:p-10 text-white shadow-2xl space-y-6">
              <div className="space-y-5">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-extrabold uppercase tracking-widest border border-white/5">
                  <Sparkles size={11} className="text-brand-300 animate-pulse" /> Lexi — Uy tín đặt lên hàng đầu!
                </div>
                
                {/* Main Heading */}
                <h1 className="text-xl sm:text-2xl lg:text-[2.15rem] font-extrabold text-white tracking-tight leading-[1.2]">
                  Lexi – Một giải pháp công nghệ tiên tiến đáp ứng nhu cầu{' '}
                  <span className="bg-gradient-to-r from-brand-300 to-sky-300 bg-clip-text text-transparent">
                    nhập khẩu lẻ hợp pháp
                  </span>{' '}
                  từ các trang thương mại điện tử quốc tế (Cross border Ecommerce).
                </h1>
                
                {/* Bullet Points */}
                <div className="space-y-4 text-white/90 text-xs sm:text-[13px] leading-relaxed font-medium">
                  <div className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-300 mt-2 shrink-0" />
                    <p>Dịch vụ Proxy Shopping cho phép nhập khẩu ủy thác sản phẩm từ các trang thương mại điện tử quốc tế.</p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-300 mt-2 shrink-0" />
                    <p>Lexi mang đến lợi ích cho người Việt tự thực hiện mua sắm điện tử từ các trang thương mại điện tử quốc tế. Chúng tôi cung cấp dịch vụ Package Forwarding Service để chuyển tiếp hàng hóa từ nước ngoài về Việt Nam.</p>
                  </div>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => openModal('advisor')}
                  className="inline-flex items-center gap-1.5 px-6 py-3 bg-white text-brand-600 hover:bg-slate-50 font-extrabold text-xs rounded-full transition-all duration-200 active:scale-95 uppercase tracking-wider shadow-md cursor-pointer border-none"
                >
                  <PhoneCall size={12} /> Liên hệ tư vấn
                </button>
                <button 
                  type="button"
                  onClick={() => openModal('price')}
                  className="inline-flex items-center gap-1.5 px-6 py-3 bg-brand-500 hover:bg-brand-550 border border-brand-400 text-white font-extrabold text-xs rounded-full transition-all duration-200 active:scale-95 uppercase tracking-wider shadow-md cursor-pointer"
                >
                  <DollarSign size={12} /> Bảng giá dịch vụ
                </button>
              </div>
            </div>
            
            {/* ===== RIGHT CARD: Clean Premium White Card (LG: 5 Cols) ===== */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100/80">
              {/* Quote Request Form */}
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                    Gửi yêu cầu và nhận báo giá ngay!
                  </h3>
                </div>

                <form onSubmit={handleQuoteRequest} className="space-y-3.5 text-xs">
                  <div>
                    <input 
                      type="url" 
                      required
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="Nhập link sản phẩm bạn muốn báo giá..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Họ và tên"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all placeholder:text-slate-400"
                    />
                    <input 
                      type="tel" 
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Số điện thoại"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all duration-200 cursor-pointer border-none flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-md shadow-brand-500/10 uppercase tracking-wider"
                  >
                    <Send size={12} /> NHẬN BÁO GIÁ
                  </button>
                </form>
              </div>
              
              {/* Premium White Service Quick Links */}
              <div className="grid grid-cols-4 gap-2 pt-5 mt-5 border-t border-slate-100">
                {[
                  { icon: ShoppingBag, label: 'Quy trình\nMua hộ', href: '/mua-ho' },
                  { icon: Truck, label: 'Quy trình\nShip hộ', href: '/ship-ho' },
                  { icon: Globe, label: 'Quy trình\nXuất khẩu', action: () => openModal('advisor') },
                  { icon: Search, label: 'Tracking\nĐơn hàng', action: () => openModal('tracking') },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  if (item.action) {
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={item.action}
                        className="flex flex-col items-center gap-1.5 py-3 px-1 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 border border-slate-100 rounded-xl text-center transition-all duration-200 group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-500 group-hover:text-brand-500 transition-colors">
                          <Icon size={14} />
                        </div>
                        <span className="text-[8.5px] font-black text-slate-600 group-hover:text-brand-600 leading-tight uppercase tracking-wider whitespace-pre-line">
                          {item.label}
                        </span>
                      </button>
                    );
                  }
                  return (
                    <Link 
                      key={idx} 
                      href={item.href || '#'}
                      className="flex flex-col items-center gap-1.5 py-3 px-1 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 border border-slate-100 rounded-xl text-center transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-500 group-hover:text-brand-500 transition-colors">
                        <Icon size={14} />
                      </div>
                      <span className="text-[8.5px] font-black text-slate-600 group-hover:text-brand-600 leading-tight uppercase tracking-wider whitespace-pre-line">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-10 max-w-2xl mx-auto">
            <form onSubmit={handleTrack} className="flex items-center p-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full focus-within:ring-4 focus-within:ring-brand-500/15 focus-within:border-brand-400/30 transition-all duration-300">
              <div className="flex items-center gap-2 pl-4 flex-1">
                <Search size={15} className="text-white/40" />
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Mã tracking đơn hàng của bạn..."
                  className="w-full py-2 border-none outline-none text-white font-bold bg-transparent text-xs placeholder:text-white/30"
                />
              </div>
              <button
                type="submit"
                className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-[11px] px-6 py-2.5 rounded-full transition-all duration-200 cursor-pointer border-none flex items-center gap-1.5 active:scale-95 uppercase tracking-wider shadow-sm"
              >
                Tra cứu
              </button>
            </form>
            <p className="text-center text-[10px] text-white/30 font-medium mt-2.5">Lexi – Uy tín <span className="text-brand-400">đặt lên</span> hàng đầu!</p>
          </div>
        </div>
      </section>

      {/* 2. TẠI SAO NÊN LỰA CHỌN LEXI — Balanced, High-Trust Logistics Dashboard */}
      <section className="relative w-full py-12 sm:py-16 bg-slate-50/50 border-t border-slate-100 overflow-hidden">
        {/* Faded logistics world map watermark for credibility */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=20')] opacity-[0.03] bg-cover bg-center pointer-events-none z-0" />
        
        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10 space-y-12">
          
          {/* Top Panel: High-Impact Typography & Stats Row (Re-balancing layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-slate-200/50 pb-8">
            <div className="lg:col-span-6 space-y-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-[10px] font-extrabold uppercase tracking-widest border border-brand-100/55">
                <Sparkles size={11} className="text-brand-500" /> Hệ thống Logistics hiện đại
              </div>
              <h2 className="text-2xl sm:text-3.5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Tại sao nên lựa chọn Lexi?
              </h2>
              <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed font-medium max-w-xl">
                Với hơn 5 năm kinh nghiệm hoạt động, Lexi tự hào là một trong những đơn vị mua hộ và chuyển tiếp hàng hóa quốc tế uy tín hàng đầu tại Việt Nam. Chúng tôi cam kết mang lại giải pháp vận chuyển thông suốt, chuyên nghiệp với chi phí tối ưu nhất cho quý khách.
              </p>
            </div>
            
            {/* Direct Operational Stats Panel (Building instant Trust & operational power) */}
            <div className="lg:col-span-6 grid grid-cols-4 gap-3 bg-white p-4.5 rounded-2xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              {[
                { number: '5+', label: 'Năm uy tín' },
                { number: '195+', label: 'Quốc gia' },
                { number: '15k+', label: 'Đơn hàng' },
                { number: '99.9%', label: 'An toàn' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center space-y-1 border-r last:border-none border-slate-100">
                  <span className="block text-base sm:text-lg font-black text-brand-550 leading-none">{stat.number}</span>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Panel: USP Grid with Perfectly Uniform Premium Backgrounds & High-Fidelity Color Accents */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: 'Vận chuyển tới 195 quốc gia',
                desc: 'Chúng tôi hỗ trợ gom hàng và gửi hàng thông suốt tới hơn <strong>195 quốc gia và vùng lãnh thổ</strong> trên toàn cầu bằng đường hàng không và đường biển nhanh chóng.',
                icon: Globe,
                badge: 'Mạng lưới toàn cầu',
                badgeColor: 'bg-brand-50 text-brand-600 border-brand-100/50',
                iconBg: 'bg-brand-50 text-brand-600 border-brand-100',
                cardStyle: 'bg-white border-slate-200/60 hover:border-brand-500 shadow-sm hover:shadow-[0_15px_35px_rgba(43,111,238,0.04)]'
              },
              {
                title: 'Cước phí cạnh tranh tối ưu',
                desc: 'Lexi tự hào cung cấp mức <strong>giá cước cạnh tranh nhất</strong> thị trường nhờ liên kết trực tiếp với các hãng hàng không lớn, tuyệt đối không có phụ phí phát sinh.',
                icon: DollarSign,
                badge: 'Tối ưu chi phí',
                badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
                iconBg: 'bg-emerald-50 text-emerald-650 border-emerald-100',
                cardStyle: 'bg-white border-slate-200/60 hover:border-emerald-500 shadow-sm hover:shadow-[0_15px_35px_rgba(16,185,129,0.04)]'
              },
              {
                title: 'Chăm sóc KH tận tình 24/7',
                desc: 'Đội ngũ chuyên viên tư vấn giàu kinh nghiệm luôn sẵn sàng giải đáp thắc mắc, cập nhật lộ trình đơn hàng và hỗ trợ khách hàng xử lý thủ tục hải quan <strong>24/7 hoàn hoàn miễn phí</strong>.',
                icon: PhoneCall,
                badge: 'Hỗ trợ tận tâm',
                badgeColor: 'bg-amber-50 text-amber-600 border-amber-100/50',
                iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
                cardStyle: 'bg-white border-slate-200/60 hover:border-amber-500 shadow-sm hover:shadow-[0_15px_35px_rgba(245,158,11,0.04)]'
              },
              {
                title: 'Thanh toán đa dạng, an toàn',
                desc: 'Hệ thống hỗ trợ <strong>đa dạng các phương thức thanh toán</strong> bảo mật: Chuyển khoản ngân hàng, ví điện tử và giao dịch trực tiếp, giúp quý khách hoàn toàn an tâm khi giao dịch.',
                icon: CreditCard,
                badge: 'Tiện lợi & Bảo mật',
                badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-100/50',
                iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                cardStyle: 'bg-white border-slate-200/60 hover:border-indigo-500 shadow-sm hover:shadow-[0_15px_35px_rgba(99,102,241,0.04)]'
              }
            ].map((adv, idx) => {
              const Icon = adv.icon;
              return (
                <div 
                  key={idx}
                  className={`flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 group hover:-translate-y-1 ${adv.cardStyle}`}
                >
                  <div className="space-y-4">
                    {/* Header: Icon & Badge */}
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.02)] border flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all duration-300 ${adv.iconBg}`}>
                        <Icon size={18} />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border ${adv.badgeColor}`}>
                        {adv.badge}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <h4 className="text-[13px] font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {adv.title}
                    </h4>
                    
                    <p 
                      className="text-[11.5px] text-slate-500 leading-relaxed font-medium"
                      dangerouslySetInnerHTML={{ __html: adv.desc }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. DỊCH VỤ NHẬP KHẨU NỔI BẬT — Premium Glassmorphic Service Catalog */}
      <section className="relative w-full py-16 sm:py-24 bg-white border-t border-b border-slate-100 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-100/30 blur-[100px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-[10px] font-extrabold uppercase tracking-widest border border-brand-100/50">
              Dịch vụ của chúng tôi
            </span>
            <h2 className="text-2xl sm:text-3.5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Dịch vụ nhập khẩu quốc tế chuyên nghiệp
            </h2>
            <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed font-semibold">
              Lexi cung cấp giải pháp mua sắm và vận chuyển trọn gói từ các trang thương mại điện tử hàng đầu thế giới về Việt Nam.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {services.map((svc, idx) => {
              const Icon = svc.icon;
              const handleAction = () => {
                if (idx === 0) {
                  openModal('purchase');
                } else {
                  openModal('advisor');
                }
              };
              return (
                <div 
                  key={idx}
                  className="glass-card hover-lift p-8 rounded-3xl border border-slate-200/50 bg-white/70 shadow-sm flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center shadow-inner">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                      {svc.title}
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed font-medium">
                      {svc.shortDesc}
                    </p>
                    <div className="pt-2">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                        Kênh hỗ trợ chính:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {svc.channels.map((chan, cIdx) => (
                          <span 
                            key={cIdx}
                            className="px-2 py-0.5 rounded bg-slate-50 text-slate-650 text-[10px] font-extrabold border border-slate-200/50"
                          >
                            {chan}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAction}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs rounded-2xl transition-all duration-200 active:scale-[0.98] uppercase tracking-wider shadow-md cursor-pointer border-none"
                  >
                    Liên hệ dịch vụ <ArrowRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. XUẤT KHẨU HÀNG HÓA QUỐC TẾ — Balanced High-Trust Dashboard */}
      <section className="relative w-full py-16 sm:py-24 bg-slate-50/50 overflow-hidden border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10 space-y-16">
          
          {/* Title & Introduction */}
          <div className="text-center max-w-2xl mx-auto space-y-3.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-[10px] font-extrabold uppercase tracking-widest border border-brand-100/50">
              Dịch vụ gửi hàng đi nước ngoài
            </span>
            <h2 className="text-2xl sm:text-3.5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Vận chuyển xuất khẩu đi 195 quốc gia
            </h2>
            <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed font-semibold">
              Lexi cung cấp dịch vụ gửi hàng đi Mỹ, Đức, Nhật, Úc, Anh... và hơn 190 quốc gia khác với quy trình thông quan nhanh gọn, cước phí tối ưu.
            </p>
          </div>

          {/* 4 Advantages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exportAdvantages.map((adv, idx) => {
              const icons = [ShieldCheck, Users, DollarSign, Eye];
              const Icon = icons[idx] || ShieldCheck;
              return (
                <div 
                  key={idx}
                  className="glass-card hover-lift p-6 rounded-2xl border border-slate-200/50 bg-white shadow-sm hover:border-brand-500 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-inner">
                      <Icon size={18} />
                    </div>
                    <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">
                      {adv.title}
                    </h4>
                    <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
                      {adv.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Process Timeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-8">
            <div className="lg:col-span-4 bg-brand-600 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white text-[9px] font-extrabold uppercase tracking-widest border border-white/10">
                  Quy trình chuẩn
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">
                  Quy trình xuất khẩu hàng đi quốc tế
                </h3>
                <p className="text-white/80 text-[12px] sm:text-xs leading-relaxed font-medium">
                  Tại Lexi, quý khách sẽ được trải nghiệm dịch vụ gửi hàng đi nước ngoài vô cùng chuyên nghiệp và nhanh chóng chỉ qua 5 bước đơn giản.
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => openModal('advisor')}
                className="w-full bg-white hover:bg-slate-100 text-brand-600 font-extrabold py-3.5 rounded-xl transition-all duration-200 cursor-pointer border-none flex items-center justify-center gap-1.5 active:scale-95 shadow-md uppercase tracking-wider text-[10px]"
              >
                Liên hệ gửi hàng ngay <ArrowUpRight size={12} />
              </button>
            </div>

            {/* Process Timeline Steps (LG: 8 cols) */}
            <div className="lg:col-span-8 space-y-4 relative pl-4 sm:pl-6 border-l border-slate-200/60 ml-2 sm:ml-4">
              {stepsExport.map((st, idx) => (
                <div 
                  key={idx} 
                  className="relative bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)] hover:border-slate-200/80 transition-all duration-300 group"
                >
                  {/* Step Indicator Dot */}
                  <div className="absolute -left-[33px] sm:-left-[41px] top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-brand-500 shadow-md flex items-center justify-center text-[10px] sm:text-xs text-brand-600 font-extrabold group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                    {st.num}
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-[13px] font-extrabold text-slate-800 group-hover:text-brand-600 transition-colors">
                      {st.title}
                    </h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed font-semibold">
                      {st.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 5. QUY TRÌNH MUA HỘ VẬN CHUYỂN — Dedicated Full-Width Process Timeline Section */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-20 w-full relative z-10 border-t border-slate-200/40">
        
        {/* Title Block */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-50 text-brand-600 text-[10px] font-extrabold uppercase tracking-widest border border-brand-100/50">
            Quy trình mua hộ
          </span>
          <h2 className="text-2xl sm:text-3.5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Quy trình mua hộ từ nước ngoài về Việt Nam
          </h2>
          <p className="text-slate-500 text-xs sm:text-[13px] leading-relaxed font-semibold max-w-xl mx-auto">
            Trải nghiệm đặt hàng vô cùng tiện lợi, dễ dàng và an tâm thông suốt chỉ qua 5 bước chuyển giao:
          </p>
        </div>

        {/* Process layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Buying Process Intro Card (LG: 4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white text-[9px] font-extrabold uppercase tracking-widest border border-white/10">
                Mua hộ quốc tế
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">
                Quy trình mua hộ cực nhanh
              </h3>
              <p className="text-white/80 text-[12px] sm:text-xs leading-relaxed font-medium">
                Bạn chỉ cần gửi link sản phẩm, chúng tôi sẽ lo trọn gói từ khâu mua hàng, thanh toán tệ/USD, nhận hàng kho ngoại và giao tận nhà.
              </p>
            </div>
            
            <button
              onClick={() => alert("Hãy gửi link sản phẩm cần mua hộ tại khung Báo giá siêu tốc ở đầu trang hoặc liên hệ Zalo để nhận báo giá chi tiết!")}
              className="w-full bg-white hover:bg-slate-100 text-slate-950 font-extrabold py-3.5 rounded-xl transition-all duration-200 cursor-pointer border-none flex items-center justify-center gap-1.5 active:scale-95 shadow-md uppercase tracking-wider text-[10px]"
            >
              Yêu cầu mua hộ ngay <ArrowUpRight size={12} />
            </button>
          </div>

          {/* Timeline Steps (LG: 8 cols) */}
          <div className="lg:col-span-8 space-y-4 relative pl-4 sm:pl-6 border-l border-slate-200/60 ml-2 sm:ml-4">
            {stepsBuy.map((st, idx) => (
              <div 
                key={idx} 
                className="relative bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)] hover:border-slate-200/80 transition-all duration-300 group"
              >
                {/* Step Indicator Dot */}
                <div className="absolute -left-[33px] sm:-left-[41px] top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-brand-500 shadow-md flex items-center justify-center text-[10px] sm:text-xs text-brand-600 font-extrabold group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                  {st.num}
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-[13px] font-extrabold text-slate-800 group-hover:text-brand-600 transition-colors">
                    {st.title}
                  </h4>
                  <p className="text-[12px] text-slate-500 leading-relaxed font-semibold">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. NHẬN XÉT CỦA KHÁCH HÀNG (REAL TESTIMONIALS) */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-24 w-full relative z-10 border-t border-slate-100">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-[10px] font-extrabold uppercase tracking-widest">
            Nhận xét của Khách Hàng
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Sự hài lòng của quý khách là động lực phấn đấu hàng đầu
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-semibold max-w-xl mx-auto">
            Chúng tôi chân thành cảm ơn những ý kiến đóng góp quý giá từ quý khách hàng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => (
            <div 
              key={idx}
              className="glass-card hover-lift p-8 rounded-2xl border border-white/60 bg-white/70 shadow-sm flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* Rating stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" />
                  ))}
                </div>
                <p className="text-[12.5px] text-slate-600 leading-relaxed font-semibold italic">
                  "{test.text}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100/50">
                <div className="w-10 h-10 rounded-full bg-brand-50 border-2 border-white shadow-md flex items-center justify-center text-xs font-extrabold text-brand-500 shrink-0">
                  {test.avatar}
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 text-[12.5px] block">{test.name}</span>
                  <span className="text-[9.5px] text-slate-400 block font-semibold uppercase tracking-wider mt-0.5">{test.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. PARTNERS */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-12 w-full relative z-10 border-t border-b border-slate-200/40">
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-4 items-center text-center">
          {partners.map((p, idx) => (
            <a
              key={idx}
              href={p.url}
              className="glass-card px-4 py-3.5 rounded-xl text-[11px] sm:text-xs font-black uppercase text-slate-400 hover:text-brand-500 tracking-wider hover:border-brand-500/20 shadow-none hover:shadow-sm hover:scale-105 transition-all duration-300 select-none block"
            >
              {p.name}
            </a>
          ))}
        </div>
      </section>

      {/* 8. ARTICLES GRID */}
      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-16 sm:py-24 flex-1 w-full relative z-10">
        <div className="flex items-center justify-between mb-12 border-b border-slate-200/50 pb-5">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" /> Tin tức - Chia sẻ kinh nghiệm
          </h3>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{posts.length} bài viết</span>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl border border-white/60 bg-white/70 shadow-sm">
            <p className="text-slate-400 text-xs font-semibold">Chưa có bài viết nào được xuất bản.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map((post: any) => {
              const postLink = generatePostUrl(post, permalinkStructure);
              const formattedDate = formatDateWordPress(post.createdAt, dateFormat, siteLanguage);
              
              return (
                <article 
                  key={post.id} 
                  className="glass-card hover-lift rounded-2xl border border-white/60 bg-white/70 shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-8 flex-1 flex flex-col justify-between space-y-5">
                    <div>
                      {/* Meta info */}
                      <div className="flex items-center gap-3 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        <span className="flex items-center gap-1">
                          <User size={11} className="text-slate-400/80" /> {post.author?.name || 'Admin'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400/80" /> {formattedDate}
                        </span>
                      </div>
                      
                      <h4 className="text-[14.5px] font-extrabold text-slate-900 tracking-tight leading-snug hover:text-brand-500 transition-colors duration-150 line-clamp-2">
                        <Link href={postLink}>{post.title}</Link>
                      </h4>
                      
                      <p className="text-slate-500 text-[12px] leading-relaxed line-clamp-3 mt-3 font-semibold">
                        {post.excerpt || 'Không có đoạn trích dẫn bài viết nào.'}
                      </p>
                    </div>

                    <div className="pt-4">
                      <Link 
                        href={postLink} 
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold text-brand-500 hover:text-brand-600 transition-all duration-150 group"
                      >
                        Đọc tiếp <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {!skipFooter && <Footer settings={settings} />}

      {/* Premium Interactive Modal Windows via React Portals */}
      {mounted && isHomeModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop layer */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsHomeModalOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10">
            {/* Header close button */}
            <button 
              type="button"
              onClick={() => setIsHomeModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full cursor-pointer z-50 border-none bg-transparent"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Modal Body / Dynamic contents */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-xs">
              
              {/* ================= TYPE 1: ADVISORY FORM ================= */}
              {homeModalType === 'advisor' && (
                <div className="space-y-6">
                  {advisorSuccess ? (
                    <div className="text-center py-8 space-y-4 animate-in fade-in duration-300">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center shadow-inner">
                        <CheckCircle size={36} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Đăng ký thành công!</h3>
                      <p className="text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
                        Cảm ơn bạn <span className="text-brand-600">{advisorForm.name}</span>. Yêu cầu tư vấn dịch vụ <span className="text-slate-800 font-bold">{advisorForm.service}</span> đã được ghi nhận. Đội ngũ Lexi sẽ liên hệ trực tiếp với bạn qua số điện thoại <span className="text-slate-800 font-bold">{advisorForm.phone}</span> trong vòng 10 phút.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsHomeModalOpen(false)}
                        className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition-all cursor-pointer border-none uppercase tracking-wider text-[10px]"
                      >
                        Đóng cửa sổ
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                          <PhoneCall size={16} className="text-brand-500" /> Liên hệ tư vấn trực tuyến
                        </h3>
                        <p className="text-slate-400 font-semibold mt-1">Đăng ký tư vấn miễn phí hoặc liên hệ trực tiếp với chúng tôi.</p>
                      </div>

                      {/* Immediate Contact Channels */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <a 
                          href="tel:0868375300"
                          className="flex items-center gap-3 p-3 bg-brand-50/50 hover:bg-brand-50 border border-brand-100 rounded-2xl transition-all group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-all">
                            <PhoneCall size={14} />
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hotline 24/7</span>
                            <span className="block text-[12px] font-black text-brand-650 tracking-tight">0868.375.300</span>
                          </div>
                        </a>

                        <a 
                          href="https://zalo.me/0868375300"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 p-3 bg-sky-50/50 hover:bg-sky-50 border border-sky-100 rounded-2xl transition-all group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-all">
                            <MessageSquare size={14} />
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trò chuyện Zalo</span>
                            <span className="block text-[12px] font-black text-sky-655 tracking-tight">Nhắn tin ngay</span>
                          </div>
                        </a>
                      </div>

                      <div className="relative text-center my-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                        <span className="relative bg-white px-3 text-slate-400 font-extrabold uppercase tracking-widest text-[9px]">Hoặc để lại lời nhắn</span>
                      </div>

                      {/* Request Form */}
                      <form onSubmit={handleAdvisorSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Họ và tên *</label>
                            <input 
                              type="text" 
                              required
                              value={advisorForm.name}
                              onChange={(e) => setAdvisorForm({ ...advisorForm, name: e.target.value })}
                              placeholder="Nguyễn Văn A"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Số điện thoại *</label>
                            <input 
                              type="tel" 
                              required
                              value={advisorForm.phone}
                              onChange={(e) => setAdvisorForm({ ...advisorForm, phone: e.target.value })}
                              placeholder="0912345678"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Dịch vụ quan tâm</label>
                          <select 
                            value={advisorForm.service}
                            onChange={(e) => setAdvisorForm({ ...advisorForm, service: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all"
                          >
                            <option value="Mua hộ">Mua hộ hàng quốc tế</option>
                            <option value="Ship hộ">Ship hàng ký gửi về VN</option>
                            <option value="Thanh toán hộ">Thanh toán hộ (Tệ/USD)</option>
                            <option value="Xuất khẩu">Gửi hàng đi nước ngoài</option>
                            <option value="Khác">Khác / Tư vấn chung</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Lời nhắn hoặc yêu cầu cụ thể</label>
                          <textarea 
                            rows={3}
                            value={advisorForm.message}
                            onChange={(e) => setAdvisorForm({ ...advisorForm, message: e.target.value })}
                            placeholder="Nhập loại mặt hàng cần gửi, cân nặng dự kiến hoặc link sản phẩm..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={advisorLoading}
                          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold py-3.5 rounded-xl transition-all duration-200 cursor-pointer border-none flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-md shadow-brand-500/10 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {advisorLoading ? (
                            <>
                              <Loader2 size={13} className="animate-spin" /> ĐANG XỬ LÝ...
                            </>
                          ) : (
                            <>
                              <Send size={12} /> GỬI YÊU CẦU TƯ VẤN
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* ================= TYPE 2: PRICING COMPARISON TABLE ================= */}
              {homeModalType === 'price' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <DollarSign size={16} className="text-brand-500" /> Bảng giá cước vận chuyển quốc tế
                    </h3>
                    <p className="text-slate-400 font-semibold mt-1">Bảng giá cước tham khảo cực tốt cho các tuyến vận chuyển chính về Việt Nam.</p>
                  </div>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-3 font-black text-slate-700 uppercase tracking-wider text-[10px]">Tuyến vận chuyển</th>
                          <th className="p-3 font-black text-slate-700 uppercase tracking-wider text-[10px] text-right">Giá bắt đầu từ</th>
                          <th className="p-3 font-black text-slate-700 uppercase tracking-wider text-[10px] text-right">Thời gian bay</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-semibold text-slate-650">
                        {[
                          { route: '🇨🇳 Trung Quốc (Kho Quảng Châu/Bằng Tường) -> VN', price: 'Từ 15.000đ / kg', time: '3 - 5 ngày' },
                          { route: '🇰🇷 Hàn Quốc -> VN (Ezi Korea Express)', price: 'Từ 99.000đ / kg', time: '4 - 6 ngày' },
                          { route: '🇯🇵 Nhật Bản -> VN (Ezi Japan Air)', price: 'Từ 120.000đ / kg', time: '5 - 7 ngày' },
                          { route: '🇦🇺 Australia -> VN (Ezi Australia Cargo)', price: 'Từ 150.000đ / kg', time: '7 - 10 ngày' },
                          { route: '🇺🇸 Mỹ (Kho Oregon/California) -> VN', price: 'Từ 180.000đ / kg', time: '9 - 12 ngày' },
                          { route: '🇩🇪 Đức -> VN (Ezi Europe Forward)', price: 'Từ 190.000đ / kg', time: '10 - 14 ngày' }
                        ].map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 font-extrabold text-slate-800 text-[11px]">{row.route}</td>
                            <td className="p-3 text-right font-black text-brand-600 text-[11px]">{row.price}</td>
                            <td className="p-3 text-right text-slate-500 font-bold text-[11px]">{row.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 text-[11.5px] leading-relaxed text-amber-800 font-medium space-y-1">
                    <span className="block font-black uppercase tracking-wider text-[10px] text-amber-900">Lưu ý giá cước:</span>
                    <p>Mức giá thực tế có thể dao động nhẹ tùy thuộc vào quy cách đóng gói hàng hóa, thể tích cồng kềnh, tính chất sản phẩm (hàng thường/hàng đặc biệt) và các chính sách ưu đãi cước theo sản lượng định kỳ của khách hàng.</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => openModal('advisor')}
                      className="flex-1 bg-brand-500 hover:bg-brand-655 text-white font-extrabold py-3 rounded-xl transition-all cursor-pointer border-none text-center uppercase tracking-wider text-[10px] shadow-md shadow-brand-500/10"
                    >
                      Liên hệ báo giá chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        alert("Bảng giá PDF đã được tải xuống bộ nhớ đệm (Demo)!");
                      }}
                      className="inline-flex items-center gap-1.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-all cursor-pointer border-none text-center uppercase tracking-wider text-[10px]"
                    >
                      <Download size={13} /> PDF
                    </button>
                  </div>
                </div>
              )}

              {/* ================= TYPE 3: STEPPER TRACKING ================= */}
              {homeModalType === 'tracking' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <Search size={16} className="text-brand-500" /> Tra cứu lộ trình vận đơn
                    </h3>
                    <p className="text-slate-400 font-semibold mt-1">Nhập mã vận đơn Lexi để kiểm tra vị trí thực tế của kiện hàng.</p>
                  </div>

                  {/* Inline tracking search form */}
                  <form onSubmit={handleModalTrackSearch} className="flex gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-brand-500/10 focus-within:border-brand-500 transition-all duration-300">
                    <input 
                      type="text" 
                      required
                      value={modalTrackingCode}
                      onChange={(e) => setModalTrackingCode(e.target.value)}
                      placeholder="Nhập mã vận đơn (VD: EZI889922)..."
                      className="flex-1 px-3 bg-transparent border-none outline-none font-bold text-slate-700 placeholder:text-slate-400 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={trackingLoading}
                      className="bg-brand-500 hover:bg-brand-600 text-white font-extrabold px-5 py-2.5 rounded-xl transition-all cursor-pointer border-none flex items-center gap-1.5 active:scale-95 uppercase tracking-wider disabled:opacity-50 text-[10px]"
                    >
                      {trackingLoading ? <Loader2 size={12} className="animate-spin" /> : "TRA CỨU"}
                    </button>
                  </form>

                  {/* Tracking Results Area */}
                  {trackingLoading && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-3.5">
                      <Loader2 size={36} className="text-brand-500 animate-spin" />
                      <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Đang liên kết dữ liệu hệ thống...</span>
                    </div>
                  )}

                  {!trackingLoading && trackingResult && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {/* Operational Header */}
                      <div className="grid grid-cols-2 gap-3.5 bg-slate-50/70 p-4 border border-slate-100 rounded-2xl text-[11px] font-semibold text-slate-500">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Mã vận đơn</span>
                          <span className="block text-[13px] font-black text-brand-600 uppercase tracking-tight">{trackingResult.code}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Trọng lượng</span>
                          <span className="block text-[13px] font-black text-slate-800 tracking-tight">{trackingResult.weight}</span>
                        </div>
                        <div className="border-t border-slate-100 pt-2.5">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Điểm đến</span>
                          <span className="block text-slate-700 font-extrabold">{trackingResult.destination}</span>
                        </div>
                        <div className="border-t border-slate-100 pt-2.5">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Phương thức</span>
                          <span className="block text-slate-700 font-extrabold">{trackingResult.type}</span>
                        </div>
                      </div>

                      {/* Stepper Timeline */}
                      <div className="space-y-4 relative pl-5 border-l border-slate-200/80 ml-2.5 mt-2">
                        {trackingResult.steps.map((step: any, sIdx: number) => (
                          <div key={sIdx} className="relative group">
                            
                            {/* Bullet indicator */}
                            <div className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center transition-all duration-300 ${
                              step.done ? 'border-brand-500 bg-brand-500 text-white' : 
                              step.current ? 'border-brand-500 bg-white ring-4 ring-brand-500/10' : 
                              'border-slate-300 bg-white'
                            }`}>
                              {step.done && <Check size={8} strokeWidth={4} />}
                              {step.current && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />}
                            </div>

                            <div className="space-y-0.5">
                              <h4 className={`text-[12.5px] font-black tracking-tight ${step.pending ? 'text-slate-400' : 'text-slate-900'}`}>
                                {step.title}
                              </h4>
                              <p className={`text-[11.5px] leading-relaxed font-semibold ${step.pending ? 'text-slate-400' : 'text-slate-500'}`}>
                                {step.desc}
                              </p>
                              <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-1">{step.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!trackingLoading && !trackingResult && (
                    <div className="py-8 text-center space-y-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <HelpCircle size={32} className="text-slate-400 mx-auto" />
                      <div className="space-y-1">
                        <span className="block text-slate-800 font-black uppercase tracking-tight text-[11px]">Chưa tìm thấy dữ liệu vận đơn</span>
                        <p className="text-slate-400 font-semibold text-[11px] max-w-xs mx-auto leading-relaxed">Vui lòng nhập mã vận đơn để tra cứu, hoặc dùng mã mẫu thử nghiệm bằng cách bấm nút ở dưới.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setModalTrackingCode('EZI889922');
                          setTrackingLoading(true);
                          setTrackingResult(null);
                          setTimeout(() => {
                            setTrackingLoading(false);
                            setTrackingResult({
                              code: "EZI889922",
                              weight: "2.8 kg",
                              destination: "Hà Nội, Việt Nam",
                              type: "Vận chuyển nhanh hàng không",
                              status: "Đang vận chuyển quốc tế",
                              steps: [
                                { title: "Đã tiếp nhận yêu cầu", desc: "Hệ thống Lexi đã ghi nhận mã vận đơn.", time: "25/05/2026 09:30", done: true },
                                { title: "Đã gom hàng tại kho gửi", desc: "Nhận hàng tại kho đối tác nước ngoài thành công.", time: "26/05/2026 14:15", done: true },
                                { title: "Đang vận chuyển quốc tế", desc: "Hàng đang được trung chuyển hàng không/hàng hải quốc tế.", time: "27/05/2026 23:45", current: true },
                                { title: "Đến kho khai thác Việt Nam", desc: "Khai thác phân loại hàng và làm thủ tục thông quan hàng hóa.", time: "Chờ cập nhật", pending: true },
                                { title: "Giao hàng thành công", desc: "Đơn vị vận chuyển nội địa bàn giao đơn hàng.", time: "Chờ cập nhật", pending: true }
                              ]
                            });
                          }, 1000);
                        }}
                        className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer text-[10px]"
                      >
                        Sử dụng mã mẫu: EZI889922
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ================= TYPE 4: DETAILED PURCHASE MODAL ================= */}
              {homeModalType === 'purchase' && (
                <div className="space-y-6">
                  {purchaseSuccess ? (
                    <div className="text-center py-8 space-y-4 animate-in fade-in duration-300">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center shadow-inner">
                        <CheckCircle size={36} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Yêu cầu báo giá thành công!</h3>
                      <p className="text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
                        Yêu cầu mua hộ sản phẩm của quý khách <span className="text-brand-600 font-extrabold">{purchaseForm.name}</span> đã được chuyển tới phòng mua sắm quốc tế Lexi. Chúng tôi sẽ thẩm định mức giá, phí mua hộ và gửi bảng báo giá trọn gói về số điện thoại <span className="text-slate-800 font-bold">{purchaseForm.phone}</span> hoặc Zalo của quý khách trong vòng 15 phút.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsHomeModalOpen(false)}
                        className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition-all cursor-pointer border-none uppercase tracking-wider text-[10px]"
                      >
                        Đóng cửa sổ
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                          <ShoppingBag size={16} className="text-brand-500" /> Yêu cầu mua hộ hàng quốc tế trọn gói
                        </h3>
                        <p className="text-slate-400 font-semibold mt-1">Gửi thông tin đường dẫn sản phẩm, Lexi sẽ lo trọn gói việc mua hàng và ship tận tay.</p>
                      </div>

                      <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Đường dẫn sản phẩm (Link mua hàng) *</label>
                          <input 
                            type="url" 
                            required
                            value={purchaseForm.url}
                            onChange={(e) => setPurchaseForm({ ...purchaseForm, url: e.target.value })}
                            placeholder="Nhập đường dẫn trên Amazon, Ebay, Taobao, 1688, Chemist..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Họ và tên người nhận báo giá *</label>
                            <input 
                              type="text" 
                              required
                              value={purchaseForm.name}
                              onChange={(e) => setPurchaseForm({ ...purchaseForm, name: e.target.value })}
                              placeholder="Nguyễn Văn A"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Số điện thoại / Zalo *</label>
                            <input 
                              type="tel" 
                              required
                              value={purchaseForm.phone}
                              onChange={(e) => setPurchaseForm({ ...purchaseForm, phone: e.target.value })}
                              placeholder="0912345678"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3.5 items-end">
                          <div className="col-span-1 space-y-1">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Số lượng</label>
                            <input 
                              type="number" 
                              min="1"
                              required
                              value={purchaseForm.qty}
                              onChange={(e) => setPurchaseForm({ ...purchaseForm, qty: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all"
                            />
                          </div>
                          <div className="col-span-2 text-[10.5px] leading-relaxed text-slate-400 font-semibold mb-2">
                            Lưu ý: Bạn có thể nhập nhiều liên kết sản phẩm khác nhau tại ô ghi chú dưới đây.
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Thông tin yêu cầu thêm (Màu sắc, kích cỡ, ghi chú...)</label>
                          <textarea 
                            rows={3}
                            value={purchaseForm.note}
                            onChange={(e) => setPurchaseForm({ ...purchaseForm, note: e.target.value })}
                            placeholder="Nhập màu sắc, kích thước, cấu hình sản phẩm, lời nhắn thêm cho bộ phận mua hộ..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={purchaseLoading}
                          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold py-3.5 rounded-xl transition-all duration-200 cursor-pointer border-none flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-md shadow-brand-500/10 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {purchaseLoading ? (
                            <>
                              <Loader2 size={13} className="animate-spin" /> ĐANG XỬ LÝ...
                            </>
                          ) : (
                            <>
                              <Send size={12} /> GỬI YÊU CẦU MUA HỘ
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
