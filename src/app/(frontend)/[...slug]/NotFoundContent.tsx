import Link from 'next/link';
import { Headphones, Home, Package } from 'lucide-react';
import Header from '@/themes/ezitrans/Header';
import Footer from '@/themes/ezitrans/Footer';

/**
 * Inline 404 component rendered directly as page content.
 * This bypasses the not-found boundary mechanism entirely, avoiding
 * client-side navigation issues where the old route stays visible.
 */
export default function NotFoundContent() {
  return (
    <div className="ezi-theme min-h-screen flex flex-col justify-between" style={{ background: 'var(--paper)' }}>
      <Header />
      <main className="ezi-404-container">
        <div className="ezi-404-icon-wrapper">
          <Package className="ezi-404-icon" size={40} />
          <span className="ezi-404-badge">!</span>
        </div>
        <h1 className="ezi-404-title">404</h1>
        <h2 className="ezi-404-subtitle">Trang Không Tồn Tại</h2>
        <p className="ezi-404-text">
          Đường dẫn này không tồn tại hoặc đã được di dời. Bạn có thể quay về Trang chủ hoặc liên hệ Ezitrans để được hỗ trợ.
        </p>
        <div className="ezi-404-actions">
          <Link href="/" className="ezi-btn ezi-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Home size={15} /> Quay Về Trang Chủ
          </Link>
          <Link
            href="/lien-he"
            className="ezi-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              color: 'var(--navy)',
            }}
          >
            <Headphones size={15} /> Liên Hệ Hỗ Trợ
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
