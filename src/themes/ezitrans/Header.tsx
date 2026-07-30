import Link from 'next/link';
import { Send, FileSearch } from 'lucide-react';
import './ezitrans.css';

export default function Header({ settings = {} }: { settings?: Record<string, string> }) {
  const title = settings.site_title || 'Ezitrans';
  
  return (
    <>
      {/* Top Utility Links */}
      <div className="ezi-top">
        <div className="ezi-container ezi-topin">
          <div className="ezi-toplinks">
            <Link href="/huong-dan-mua-hang">Hướng dẫn mua hàng</Link>
            <Link href="/chuyen-khoan">Thông tin chuyển khoản</Link>
            <Link href="/faq">Câu hỏi thường gặp</Link>
            <Link href="/lien-he">Liên hệ</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="ezi-nav">
        <div className="ezi-container ezi-navin">
          {/* Brand Logo */}
          <Link href="/" className="ezi-brand" aria-label="Ezitrans - Trang chủ">
            <span className="ezi-mark">E</span>
            <span>{title}</span>
          </Link>

          {/* Nav Links */}
          <nav className="ezi-menu" aria-label="Điều hướng chính">
            <Link href="/">Trang chủ</Link>
            <Link href="/gioi-thieu">Giới thiệu</Link>
            <Link href="/mua-ho-hang-trung-quoc.html">Mua hộ</Link>
            <Link href="/van-chuyen-hang-trung-quoc-ve-viet-nam.html">Ship hộ</Link>
            <Link href="/category/xuat-khau">Xuất khẩu</Link>
            <Link href="/dich-vu-khac">Dịch vụ khác</Link>
            <Link href="/category/huong-dan-chia-se">Chia sẻ kinh nghiệm</Link>
          </nav>

          {/* Action Buttons */}
          <div className="ezi-nav-actions">
            <Link href="/lien-he" className="ezi-btn ezi-btn-primary" style={{ backgroundColor: 'var(--blue)' }}>
              <Send size={14} /> Gửi báo giá
            </Link>
            <Link href="/tracking-don-hang" className="ezi-btn ezi-btn-orange">
              <FileSearch size={14} /> Tra cứu Tracking
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
