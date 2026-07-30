'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Truck, 
  Globe2, 
  Search, 
  PhoneCall, 
  FileText, 
  Award, 
  Shield, 
  CheckCircle2, 
  ChevronRight, 
  Star,
  Link2,
  Receipt,
  Headphones,
  CreditCard,
  Send,
  Package,
  ShieldCheck,
  Users,
  Percent,
  Activity
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import './ezitrans.css';
import { generatePostUrl } from '@/lib/permalink';

type Post = {
  title?: string;
  slug?: string;
  excerpt?: string;
  publishedAt?: string;
  createdAt?: string;
  featuredImage?: {
    url: string;
  } | null;
};

const countries = [
  { name: 'Trung Quốc', url: '/mua-ho-hang-trung-quoc.html' },
  { name: 'Nhật Bản', url: '/mua-ho-hang-nhat-ban.html' },
  { name: 'Hàn Quốc', url: '/mua-ho-hang-han-quoc.html' },
  { name: 'Hoa Kỳ', url: '/mua-ho-hang-my.html' },
  { name: 'Úc', url: '/mua-ho-hang-uc.html' },
  { name: 'Anh', url: '/mua-ho-hang-anh.html' },
  { name: 'Đức', url: '/mua-ho-hang-duc.html' },
  { name: 'Singapore', url: '/mua-ho-hang-singapore.html' },
  { name: 'Thái Lan', url: '/mua-ho-hang-thai-lan.html' }
];

const steps = [
  {
    num: '1',
    icon: <Send size={20} />,
    title: 'Quý khách gửi thông tin sản phẩm',
    desc: 'Khách hàng gửi thông tin sản phẩm cần mua hộ cho Ezitrans qua mail contact@ezitrans.com hoặc click vào nút báo giá mua hộ bên dưới.'
  },
  {
    num: '2',
    icon: <Receipt size={20} />,
    title: 'Ezitrans lên đơn & Quý khách đặt cọc',
    desc: 'Sau khi khách hàng gửi thông tin về sản phẩm cho Ezitrans, chúng tôi sẽ tiếp nhận và báo giá cho bạn. Sau đó, bạn tiến hành đặt cọc để Ezitrans mua và gửi hàng cho bạn.'
  },
  {
    num: '3',
    icon: <Package size={20} />,
    title: 'Hàng về kho tại trụ sở nước ngoài',
    desc: 'Hàng hóa sẽ được Ezitrans chuyển về kho tại trụ sở nước ngoài. Bạn có thể sử dụng tính năng theo dõi đơn hàng trên Ezitrans.com để biết được trạng thái đơn hàng.'
  },
  {
    num: '4',
    icon: <Truck size={20} />,
    title: 'Hàng về Việt Nam & Giao cho quý khách',
    desc: 'Hàng hóa sẽ được vận chuyển từ nước ngoài về Việt Nam qua đường biển hoặc hàng không. Sau khi hàng về kho Ezitrans ở Việt Nam, chúng tôi sẽ kiểm hàng và tiến hành giao.'
  },
  {
    num: '5',
    icon: <CheckCircle2 size={20} />,
    title: 'Quý khách thanh toán và nhận hàng',
    desc: 'Bạn tiến hành thanh toán số tiền còn lại và sau đó Ezitrans sẽ gửi hàng đến địa chỉ của bạn.'
  }
];

const fallbackPosts: Post[] = [
  { 
    title: 'BH Photo Video là gì? Review chi tiết từ A–Z trước khi mua hàng năm 2026', 
    slug: 'bh-photo-video-la-gi',
    excerpt: 'Tìm hiểu về BH Photo Video, trang thương mại điện tử chuyên đồ công nghệ, máy ảnh hàng đầu tại Mỹ và kinh nghiệm mua hàng an toàn.',
    publishedAt: '2026-06-15T08:00:00.000Z'
  },
  { 
    title: 'Vận chuyển hàng xách tay Malaysia về Việt Nam bao thuế', 
    slug: 'van-chuyen-hang-xach-tay-malaysia-ve-viet-nam-bao-thue',
    excerpt: 'Dịch vụ vận chuyển hàng xách tay từ Malaysia về Việt Nam nhanh chóng, an toàn, hỗ trợ thông quan hải quan trọn gói từ A-Z.',
    publishedAt: '2026-06-12T08:00:00.000Z'
  },
  { 
    title: 'Nhận order hàng xách tay Malaysia về Việt Nam uy tín', 
    slug: 'nhan-order-hang-xách-tay-malaysia-ve-viet-nam-uy-tin',
    excerpt: 'Hướng dẫn tự mua hàng hoặc sử dụng dịch vụ mua hộ hàng Malaysia của Ezitrans để đảm bảo nguồn hàng chất lượng nhất.',
    publishedAt: '2026-06-10T08:00:00.000Z'
  }
];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Tin tức';
  try {
    const d = new Date(dateStr);
    return `${d.getDate()} Thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
  } catch (e) {
    return 'Tin tức';
  }
};

export default function Homepage({
  posts = [],
  settings = {},
  skipHeader = false,
  skipFooter = false
}: {
  posts?: Post[];
  settings?: Record<string, string>;
  skipHeader?: boolean;
  skipFooter?: boolean;
}) {
  const [query, setQuery] = useState('');
  const news = (posts.length ? posts : fallbackPosts).slice(0, 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    window.location.href = `/lien-he?link=${encodeURIComponent(query)}`;
  };

  return (
    <div className="ezi-theme">
      {!skipHeader && <Header settings={settings} />}

      <main id="main-content">
        {/* Banner / Hero Section */}
        <section className="ezi-hero">
          <div className="ezi-container ezi-heroin">
            
            {/* Left Column (Solid Blue Card matching screenshot) */}
            <div className="ezi-hero-left">
              <div>
                <h1>
                  Ezitrans - Một giải pháp công nghệ tiên tiến đáp ứng nhu cầu nhập khẩu lẻ hợp pháp từ các trang thương mại điện tử quốc tế (Cross border Ecommerce).
                </h1>
                
                <ul>
                  <li>Dịch vụ Proxy Shopping cho phép nhập khẩu ủy thác sản phẩm từ các trang thương mại điện tử quốc tế.</li>
                  <li>Ezitrans mang đến lợi ích cho người Việt tự thực hiện mua sắm điện tử từ các trang thương mại điện tử quốc tế. Chúng tôi cung cấp dịch vụ Package Forwarding Service để chuyển tiếp hàng hóa từ nước ngoại về Việt Nam.</li>
                </ul>
              </div>

              <div className="ezi-hero-left-actions">
                <Link href="/lien-he" className="ezi-btn ezi-btn-white">
                  <PhoneCall size={14} /> Liên hệ tư vấn
                </Link>
                <Link href="/van-chuyen-hang-trung-quoc-ve-viet-nam.html" className="ezi-btn ezi-btn-white-outline">
                  <FileText size={14} /> Bảng giá dịch vụ
                </Link>
              </div>
            </div>

            {/* Right Column (Redesigned White Form Card) */}
            <div className="ezi-hero-right">
              <div className="ezi-hero-right-header">
                <h2>Gửi yêu cầu và nhận báo giá ngay!</h2>
                <p>Nhập liên kết sản phẩm cần báo giá hoặc chọn tiện ích tra cứu nhanh bên dưới</p>
              </div>
              
              <div className="ezi-form-group">
                <form onSubmit={handleSubmit} className="ezi-hero-input-wrapper">
                  <Link2 className="ezi-hero-input-icon" size={16} />
                  <input
                    type="text"
                    className="ezi-hero-input"
                    placeholder="Dán link sản phẩm (Amazon, Ebay, Taobao, Mercari...)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button type="submit" className="ezi-hero-btn">
                    NHẬN BÁO GIÁ
                  </button>
                </form>

                {/* Highly-designed Quick Action Cards */}
                <div className="ezi-quick-links">
                  <Link href="/huong-dan-mua-hang" className="ezi-quick-box">
                    <div className="ezi-icon-circle">
                      <ShoppingCart size={18} />
                    </div>
                    <span className="ezi-quick-title">Quy trình</span>
                    <span className="ezi-quick-sub">Mua Hộ</span>
                  </Link>

                  <Link href="/van-chuyen-hang-trung-quoc-ve-viet-nam.html" className="ezi-quick-box">
                    <div className="ezi-icon-circle">
                      <Truck size={18} />
                    </div>
                    <span className="ezi-quick-title">Quy trình</span>
                    <span className="ezi-quick-sub">Ship Hộ</span>
                  </Link>

                  <Link href="/category/xuat-khau" className="ezi-quick-box">
                    <div className="ezi-icon-circle">
                      <Globe2 size={18} />
                    </div>
                    <span className="ezi-quick-title">Quy trình</span>
                    <span className="ezi-quick-sub">Xuất Khẩu</span>
                  </Link>

                  <Link href="/tracking-don-hang" className="ezi-quick-box highlight">
                    <div className="ezi-icon-circle">
                      <Search size={18} />
                    </div>
                    <span className="ezi-quick-title">Tracking</span>
                    <span className="ezi-quick-sub">Đơn Hàng</span>
                  </Link>
                </div>
              </div>

              <div className="ezi-divider" />

              <div className="ezi-hero-footer">
                <CheckCircle2 className="ezi-trust-check" size={14} />
                <span>Ezitrans - Uy tín đặt lên hàng đầu</span>
              </div>
            </div>

          </div>
        </section>

        {/* Centered Why Choose Us Section (Moved below Hero Banner) */}
        <section className="ezi-section ezi-section-alt">
          <div className="ezi-container">
            <div className="ezi-head-center">
              <h2>Tại sao nên lựa chọn Ezitrans</h2>
              <p>
                Trong suốt hơn 5 năm trôi qua, Ezitrans đã duy trì sự đáng tin cậy hàng đầu trong lĩnh vực mua hộ và vận chuyển hàng hóa từ các quốc gia như Mỹ, Đức, Nhật, Úc, Anh... về Việt Nam. Dịch vụ liên tục nâng cấp, tiến bộ nhằm đáp ứng tối đa nhu cầu của quý khách theo triết lý luôn cam kết bảo vệ quyền lợi của khách hàng ở mức định cao nhất. Khi tới với Ezitrans, quý khách sẽ trải nghiệm dịch vụ đặt hàng chuyên nghiệp, song song với mức phí dịch vụ thấp.
              </p>
            </div>

            <div className="ezi-why-container">
              <div className="ezi-why-card-item">
                <div className="ezi-why-card-icon">
                  <Truck size={24} />
                </div>
                <h3>Vận chuyển tới 195 quốc gia</h3>
                <p>Chúng tôi có thể vận chuyển hàng hóa từ Việt Nam đi tới 195 quốc và vùng lãnh thổ trên toàn thế giới.</p>
              </div>

              <div className="ezi-why-card-item">
                <div className="ezi-why-card-icon">
                  <Receipt size={24} />
                </div>
                <h3>Cước phí cạnh tranh</h3>
                <p>Vận chuyển bằng máy bay, kết hợp mạng lưới vận chuyển từ các đối tác lớn giúp Ezitrans cung cấp dịch vụ vận chuyển nhanh với giá cước cạnh tranh.</p>
              </div>

              <div className="ezi-why-card-item">
                <div className="ezi-why-card-icon">
                  <Headphones size={24} />
                </div>
                <h3>Chăm sóc KH tận tình</h3>
                <p>Bên cạnh dịch vụ cạnh tranh, Ezitrans cũng luôn mang tới chất lượng chăm sóc khách hàng tuyệt vời với những ưu đãi cực hấp dẫn cho khách cũ.</p>
              </div>

              <div className="ezi-why-card-item">
                <div className="ezi-why-card-icon">
                  <CreditCard size={24} />
                </div>
                <h3>Thanh toán đa dạng</h3>
                <p>Đa dạng các phương thức thanh toán: chuyển khoản, trực tiếp... giúp khách hàng có thêm nhiều lựa chọn khi sử dụng dịch vụ tại Ezitrans.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Mua hộ hàng hóa từ nước ngoài */}
        <section className="ezi-split-section">
          <div className="ezi-container ezi-split-grid">
            <div className="ezi-split-left">
              <span className="ezi-kicker">Mua Hộ Quốc Tế</span>
              <h2>Mua hộ hàng hóa từ nước ngoài</h2>
              <p>
                Việc order hàng từ nước ngoài chưa bao giờ dễ hơn với dịch vụ mua hộ hàng của Ezitrans. Bạn chỉ cần gửi link sản phẩm, chúng tôi sẽ báo giá cho bạn. Sau khi thanh toán, bạn chỉ là đợi hàng về đến tận nhà, việc còn lại cứ để Ezitrans lo!
              </p>
              <p>
                EziTrans hỗ trợ Quý khách mua hộ và thanh toán trên hầu hết các trang TMĐT như: Amazon, Ebay, Chemist Warehouse, Alibaba, Taobao, 1688, Tmall, AliExpress,...
              </p>

              <div className="ezi-split-actions">
                <Link href="/lien-he" className="ezi-btn ezi-btn-outline">
                  <PhoneCall size={14} /> Liên hệ tư vấn
                </Link>
                <Link href="/van-chuyen-hang-trung-quoc-ve-viet-nam.html" className="ezi-btn ezi-btn-primary">
                  <FileText size={14} /> Bảng giá dịch vụ
                </Link>
              </div>
            </div>

            <div className="ezi-split-right">
              <div className="ezi-mall-card">
                <h4>Hỗ trợ mua sắm toàn cầu</h4>
                <div className="ezi-mall-grid">
                  <div className="ezi-mall-tag">Amazon (Mỹ, Nhật)</div>
                  <div className="ezi-mall-tag">eBay (Mỹ)</div>
                  <div className="ezi-mall-tag">Mercari (Nhật)</div>
                  <div className="ezi-mall-tag">Taobao & 1688</div>
                  <div className="ezi-mall-tag">Alibaba (Trung Quốc)</div>
                  <div className="ezi-mall-tag">Tmall & AliExpress</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Ship hàng từ nước ngoài về Việt Nam */}
        <section className="ezi-split-section bg-light-blue">
          <div className="ezi-container ezi-split-grid reverse">
            <div className="ezi-split-left">
              <div className="ezi-warehouse-card">
                <h4>Hệ thống kho hàng Quốc tế</h4>
                <div className="ezi-warehouse-list">
                  <div className="ezi-warehouse-item">
                    <div className="ezi-wh-info">
                      <span className="ezi-wh-indicator active" />
                      <strong>Kho Hoa Kỳ (Mỹ)</strong>
                    </div>
                    <span className="ezi-wh-status">Oregon & California</span>
                  </div>
                  <div className="ezi-warehouse-item">
                    <div className="ezi-wh-info">
                      <span className="ezi-wh-indicator active" />
                      <strong>Kho Nhật Bản</strong>
                    </div>
                    <span className="ezi-wh-status">Tokyo</span>
                  </div>
                  <div className="ezi-warehouse-item">
                    <div className="ezi-wh-info">
                      <span className="ezi-wh-indicator active" />
                      <strong>Kho Hàn Quốc</strong>
                    </div>
                    <span className="ezi-wh-status">Seoul</span>
                  </div>
                  <div className="ezi-warehouse-item">
                    <div className="ezi-wh-info">
                      <span className="ezi-wh-indicator active" />
                      <strong>Kho Trung Quốc</strong>
                    </div>
                    <span className="ezi-wh-status">Quảng Châu</span>
                  </div>
                  <div className="ezi-warehouse-item">
                    <div className="ezi-wh-info">
                      <span className="ezi-wh-indicator active" />
                      <strong>Kho Đức</strong>
                    </div>
                    <span className="ezi-wh-status">Berlin</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ezi-split-right">
              <span className="ezi-kicker">Ký Gửi & Vận Chuyển</span>
              <h2>Ship hàng từ nước ngoài về Việt Nam</h2>
              <p>
                Dịch vụ vận chuyển hàng (Package Forwarding) của Ezitrans giúp kiều bào, du học sinh, đại lý và các khách hàng cá nhân tự mua sắm hàng hóa tại nước ngoài dễ dàng vận chuyển về Việt Nam một cách an toàn và tối ưu chi phí.
              </p>
              <p>
                Chúng tôi cung cấp địa chỉ kho nhận hàng chuyên dụng tại Mỹ, Nhật, Hàn, Đức, Trung Quốc... Quý khách chỉ cần ký gửi hàng vào kho, Ezitrans sẽ lo trọn gói các thủ tục hải quan, kiểm đếm và giao hàng tận nơi 63 tỉnh thành.
              </p>

              <div className="ezi-split-actions">
                <Link href="/van-chuyen-hang-trung-quoc-ve-viet-nam.html" className="ezi-btn ezi-btn-primary">
                  <FileText size={14} /> Báo giá vận chuyển
                </Link>
                <Link href="/lien-he" className="ezi-btn ezi-btn-outline">
                  <PhoneCall size={14} /> Quy trình ký gửi
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Xuất khẩu hàng từ Việt Nam đi Quốc tế */}
        <section className="ezi-section">
          <div className="ezi-container">
            <div className="ezi-head-center">
              <div className="ezi-service-badge">Dịch vụ</div>
              <h2>Xuất khẩu hàng từ Việt Nam đi Quốc tế</h2>
              <p>
                EziTrans cung cấp giải pháp vận chuyển hàng hóa xuất khẩu chuyên nghiệp, giúp sản phẩm của doanh nghiệp và cá nhân Việt Nam tiếp cận thị trường toàn cầu dễ dàng, nhanh chóng và tiết kiệm chi phí.
              </p>
            </div>

            {/* 4 Feature Cards */}
            <div className="ezi-export-features">
              <div className="ezi-export-feat-card">
                <div className="ezi-export-feat-icon">
                  <ShieldCheck size={20} />
                </div>
                <h3>UY TÍN & AN TOÀN</h3>
                <p>
                  Đảm bảo an toàn tuyệt đối mọi sản phẩm, bảo hiểm hàng hóa 100% để tránh tối đa tình trạng nhầm hàng, hư hỏng hoặc mất hàng hóa. Thời gian vận chuyển về Việt Nam từ 3 – 7 ngày, nguyên đai – nguyên kiện.
                </p>
              </div>

              <div className="ezi-export-feat-card">
                <div className="ezi-export-feat-icon">
                  <Users size={20} />
                </div>
                <h3>NHÂN VIÊN NHIỆT TÌNH, CHU ĐÁO</h3>
                <p>
                  Tư vấn lựa chọn các website mua hàng uy tín tại từng quốc gia một cách tường tận, giảm thiểu tối đa rủi ro cho khách hàng khi giao dịch qua Internet. Nhân viên nhiệt tình, năng động, trách nhiệm, hỗ trợ miễn phí 24/7.
                </p>
              </div>

              <div className="ezi-export-feat-card">
                <div className="ezi-export-feat-icon">
                  <Percent size={20} />
                </div>
                <h3>CƯỚC PHÍ CẠNH TRANH</h3>
                <p>
                  Giá cước hỗ trợ trọn gói các thủ tục thông quan hàng hóa, không có thêm phụ phí nào. Mức giá luôn ổn định không thay đổi bất ngờ.
                </p>
              </div>

              <div className="ezi-export-feat-card">
                <div className="ezi-export-feat-icon">
                  <Activity size={20} />
                </div>
                <h3>THEO DÕI TÌNH TRẠNG ĐƠN HÀNG DỄ DÀNG</h3>
                <p>
                  Ezitrans tích hợp tính năng tracking đơn hàng trực tuyến. Vì vậy, bạn có thể dễ dàng biết được tình hình đơn hàng của bạn hiện tại như thế nào.
                </p>
              </div>
            </div>

            {/* Quy trình xuất khẩu - Premium Grid Layout */}
            <div className="ezi-export-process-grid">
              
              <div className="ezi-export-intro-card">
                <h3>QUY TRÌNH XUẤT KHẨU HÀNG DI QUỐC TẾ</h3>
                <p>
                  Tại Ezitrans, bạn sẽ được trải nghiệm quy trình đặt hàng vô cùng tiện lợi và nhanh chóng với 5 bước đơn giản sau đây.
                </p>
              </div>

              <div className="ezi-export-step-card">
                <div className="ezi-export-step-num-bg">01</div>
                <div className="ezi-export-step-content">
                  <h3>Bước 1: Xác nhận thông tin đơn hàng</h3>
                  <p>
                    Khách hàng gửi thông tin đơn hàng cần vận chuyển đi nước ngoài cho EziTrans thông qua hotline: 0867.503.500 (Zalo) hoặc email: ezitrans.vn@gmail.com
                  </p>
                </div>
              </div>

              <div className="ezi-export-step-card">
                <div className="ezi-export-step-num-bg">02</div>
                <div className="ezi-export-step-content">
                  <h3>Bước 2: Tư vấn & Báo giá</h3>
                  <p>
                    Nhân viên của EziTrans sẽ liên hệ lại để tư vấn về cách thức đóng gói, quy trình gửi hàng, báo giá cước phí & thông báo lộ trình chuyến bay sớm nhất cho Quý khách.
                  </p>
                </div>
              </div>

              <div className="ezi-export-step-card">
                <div className="ezi-export-step-num-bg">03</div>
                <div className="ezi-export-step-content">
                  <h3>Bước 3: Gửi hàng về văn phòng EziTrans tại Việt Nam</h3>
                  <p>
                    Quý khách gửi hàng về văn phòng của EziTrans tại Việt Nam. Tại đây, chúng tôi sẽ cân đo, kiểm đếm & đóng gói hàng hóa. Sau đó, hệ thống sẽ báo lại tổng cước phí đơn hàng cho Quý khách.
                  </p>
                </div>
              </div>

              <div className="ezi-export-step-card">
                <div className="ezi-export-step-num-bg">04</div>
                <div className="ezi-export-step-content">
                  <h3>Bước 4: Thanh toán tiền cước</h3>
                  <p>
                    Quý khách vui lòng thanh toán tiền cước của toàn bộ đơn hàng. Chúng tôi có thể nhận tiền mặt hoặc chuyển khoản. Tùy theo yêu cầu của khách hàng.
                  </p>
                </div>
              </div>

              <div className="ezi-export-step-card">
                <div className="ezi-export-step-num-bg">05</div>
                <div className="ezi-export-step-content">
                  <h3>Bước 5: Gửi hàng từ Việt Nam đi nước ngoài</h3>
                  <p>
                    Sau khi đã nhận được thanh toán, EziTrans sẽ tiến hành làm các thủ tục thông quan và gửi hàng đến tận tay người nhận trong chuyến bay sớm nhất.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="ezi-section ezi-section-alt">
          <div className="ezi-container">
            <div className="ezi-head-center">
              <h2>Quy trình mua hộ từ nước ngoài về Việt Nam</h2>
              <p>
                Tại Ezitrans, bạn sẽ được trải nghiệm quy trình đặt hàng vô cùng tiện lợi và nhanh chóng với 5 bước đơn giản sau:
              </p>
            </div>

            <div className="ezi-process-timeline-container">
              {/* Horizontal Connector Line */}
              <div className="ezi-timeline-line" />
              
              <div className="ezi-timeline-wrapper">
                {steps.map((st) => (
                  <div className="ezi-timeline-step" key={st.num}>
                    <div className="ezi-timeline-icon-box">
                      {st.icon}
                      <div className="ezi-timeline-number">{st.num}</div>
                    </div>
                    <h3>{st.title}</h3>
                    <p>{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="ezi-countries-title" style={{ marginTop: 60, textAlign: 'center' }}>
              Thị Trường Mua Hộ & Ship Hộ Phổ Biến:
            </div>
            <div className="ezi-countries">
              {countries.map((c) => (
                <Link className="ezi-chip" href={c.url} key={c.name}>
                  <span>{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="ezi-testimonials-section">
          <div className="ezi-container ezi-testimonials-grid">
            
            {/* Left Column: Intro & Trust Badges */}
            <div className="ezi-testimonials-left">
              <span className="ezi-kicker">PHẢN HỒI TỪ KHÁCH HÀNG</span>
              <h2>Sự Hài Lòng Của Bạn Là Thành Công Của Chúng Tôi</h2>
              <p>
                Trong suốt hơn 5 năm qua, Ezitrans luôn lấy sự hài lòng và tin tưởng của quý khách làm tôn chỉ hoạt động. Hơn 10,000+ cá nhân và doanh nghiệp đã đồng hành cùng chúng tôi.
              </p>
              
              <div className="ezi-trust-stats">
                <div className="ezi-stat-box">
                  <h3>10,000+</h3>
                  <span>Khách hàng tin dùng</span>
                </div>
                <div className="ezi-stat-box">
                  <h3>99.2%</h3>
                  <span>Tỷ lệ hài lòng</span>
                </div>
              </div>
            </div>

            {/* Right Column: Cascading / Premium Cards */}
            <div className="ezi-testimonials-right">
              <div className="ezi-feedback-card featured">
                <div className="ezi-quote-mark">“</div>
                <div className="ezi-stars-rating">
                  <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline-block', marginRight: 2 }} />
                  <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline-block', marginRight: 2 }} />
                  <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline-block', marginRight: 2 }} />
                  <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline-block', marginRight: 2 }} />
                  <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline-block', marginRight: 2 }} />
                </div>
                <p className="ezi-feedback-text">
                  “Mình order máy ảnh và linh kiện điện tử từ Mỹ qua Ezitrans. Hàng đóng gỗ cẩn thận, nguyên seal, giá cước lại tốt hơn nhiều nơi khác.”
                </p>
                <div className="ezi-feedback-user">
                  <div className="ezi-user-avatar">HL</div>
                  <div className="ezi-user-meta">
                    <strong>Hoàng Linh</strong>
                    <span>Nhiếp ảnh gia • Hà Nội</span>
                  </div>
                  <span className="ezi-user-badge partner">Cá nhân</span>
                </div>
              </div>

              <div className="ezi-feedback-card">
                <div className="ezi-quote-mark">“</div>
                <div className="ezi-stars-rating">
                  <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline-block', marginRight: 2 }} />
                  <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline-block', marginRight: 2 }} />
                  <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline-block', marginRight: 2 }} />
                  <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline-block', marginRight: 2 }} />
                  <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline-block', marginRight: 2 }} />
                </div>
                <p className="ezi-feedback-text">
                  “Ezitrans hỗ trợ công ty mình nhập khẩu nguyên liệu từ Quảng Châu. Thủ tục hải quan nhanh chóng, chứng từ hóa đơn đầy đủ hợp lệ.”
                </p>
                <div className="ezi-feedback-user">
                  <div className="ezi-user-avatar">MN</div>
                  <div className="ezi-user-meta">
                    <strong>Minh Ngọc</strong>
                    <span>Giám đốc mua hàng • TP.HCM</span>
                  </div>
                  <span className="ezi-user-badge corp">Doanh nghiệp</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* News & Articles */}
        <section className="ezi-section ezi-section-alt">
          <div className="ezi-container">
            <div className="ezi-head">
              <div>
                <span className="ezi-kicker">Kinh Nghiệm & Tin Tức</span>
                <h2>Cẩm Nang Mua Hàng Quốc Tế</h2>
              </div>
              <Link href="/category/huong-dan-chia-se" className="ezi-service-link">
                Xem tất cả bài viết <ChevronRight size={13} />
              </Link>
            </div>

            <div className="ezi-news-grid">
              {news.map((n, idx) => {
                const permalinkStructure = settings.permalink_structure || '/%postname%.html';
                const postLink = generatePostUrl({
                  id: (n as any).id || 0,
                  slug: n.slug || '',
                  createdAt: n.createdAt || n.publishedAt || new Date().toISOString(),
                  type: 'POST'
                }, permalinkStructure);

                return (
                  <Link className="ezi-post-card" href={postLink} key={n.slug || idx}>
                  <div className="ezi-post-img-container">
                    {n.featuredImage?.url ? (
                      <img src={n.featuredImage.url} alt={n.title} className="ezi-post-img" />
                    ) : (
                      <div className="ezi-post-img-placeholder">
                        {[<Globe2 size={28} />, <Truck size={28} />, <FileText size={28} />][idx % 3]}
                      </div>
                    )}
                    <div className="ezi-post-date-badge">
                      {formatDate(n.publishedAt || n.createdAt)}
                    </div>
                  </div>
                  
                  <div className="ezi-post-content">
                    <span className="ezi-post-tag">Kinh nghiệm mua hàng</span>
                    <h3>{n.title || 'Tin tức Ezitrans'}</h3>
                    <p className="ezi-post-excerpt">
                      {n.excerpt || 'Đọc các bài viết chia sẻ kinh nghiệm mua sắm quốc tế, thủ tục nhập hàng và ký gửi vận chuyển giá rẻ tại Ezitrans.'}
                    </p>
                    <span className="ezi-post-link">
                      Đọc bài viết <ChevronRight size={13} />
                    </span>
                  </div>
                </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {!skipFooter && <Footer settings={settings} />}
    </div>
  );
}
