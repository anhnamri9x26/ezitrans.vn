import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Package, Home, Headphones } from 'lucide-react';
import Header from '@/themes/ezitrans/Header';
import Footer from '@/themes/ezitrans/Footer';

export default async function NotFound() {
  let settings: Record<string, string> = {};
  try {
    const dbSettings = await prisma.setting.findMany();
    settings = dbSettings.reduce<Record<string, string>>((acc: Record<string, string>, cur: { key: string; value: string }) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});
  } catch (error) {
    console.error("Failed to load settings in NotFound:", error);
  }

  return (
    <div className="ezi-theme min-h-screen flex flex-col justify-between" style={{ background: 'var(--paper)' }}>
      <Header settings={settings} />

      <main className="ezi-404-container">
        <div className="ezi-404-icon-wrapper">
          <Package className="ezi-404-icon" size={40} />
          <span className="ezi-404-badge">!</span>
        </div>

        <h1 className="ezi-404-title">404</h1>
        <h2 className="ezi-404-subtitle">Trang Không Tồn Tại</h2>
        
        <p className="ezi-404-text">
          Đường dẫn này không tồn tại hoặc đã được di dời sang địa chỉ mới. Vui lòng quay trở lại Trang chủ hoặc liên hệ hỗ trợ từ Ezitrans.
        </p>

        <div className="ezi-404-actions">
          <Link href="/" className="ezi-btn ezi-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Home size={15} />
            Quay Về Trang Chủ
          </Link>
          <Link href="/lien-he" className="ezi-btn" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            color: 'var(--navy)'
          }}>
            <Headphones size={15} />
            Liên Hệ Hỗ Trợ
          </Link>
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
