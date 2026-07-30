process.env.DATABASE_URL = "postgresql://ezitrans:change-me@localhost:5432/ezitrans?schema=public";

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const menuItems = [
  { id: '1', label: 'TRANG CHỦ', url: '/', indent: 0 },
  { id: '2', label: 'GIỚI THIỆU', url: '/gioi-thieu', indent: 0 },
  { id: '3', label: 'SẢN PHẨM', url: '/san-pham', indent: 0, isMega: true },
  { id: '31', label: 'Thép Tròn Đặc', url: '/san-pham/thep-tron-dac', indent: 1 },
  { id: '32', label: 'Thép Khuôn Mẫu', url: '/san-pham/thep-khuon-mau', indent: 1 },
  { id: '33', label: 'Thép Ống - Hộp', url: '/san-pham/thep-ong', indent: 1 },
  { id: '34', label: 'Thép Tấm - Cuộn', url: '/san-pham/thep-tam', indent: 1 },
  { id: '35', label: 'Thép Không Gỉ (Inox)', url: '/san-pham/inox', indent: 1 },
  { id: '4', label: 'DỊCH VỤ', url: '/dich-vu', indent: 0 },
  { id: '41', label: 'Gia Công Cắt Chặt', url: '/dich-vu/gia-cong-cat-chat', indent: 1 },
  { id: '42', label: 'Xử Lý Bề Mặt', url: '/dich-vu/xu-ly-be-mat', indent: 1 },
  { id: '5', label: 'TIN TỨC', url: '/tin-tuc', indent: 0 },
  { id: '6', label: 'LIÊN HỆ', url: '/lien-he', indent: 0 }
];

async function updateMenu() {
  try {
    const existing = await prisma.setting.findUnique({
      where: { key: 'theme_menu_header' }
    });
    
    if (existing) {
      await prisma.setting.update({
        where: { key: 'theme_menu_header' },
        data: { value: JSON.stringify(menuItems) }
      });
    } else {
      await prisma.setting.create({
        data: { key: 'theme_menu_header', value: JSON.stringify(menuItems) }
      });
    }
    console.log('Menu updated successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

updateMenu();
