import { prisma } from '../src/lib/prisma';

const menuItems = [
  { id: '1', label: 'TRANG CHỦ', url: '/', indent: 0 },
  { id: '2', label: 'GIỚI THIỆU', url: '/gioi-thieu', indent: 0 },
  { id: '3', label: 'MUA HỘ', url: '/category/mua-ho-thanh-toan-ho', indent: 0 },
  { id: '4', label: 'SHIP HỘ', url: '/category/chuyen-hang-tu-nuoc-ngoai-ve', indent: 0 },
  { id: '5', label: 'XUẤT KHẨU', url: '/category/xuat-khau', indent: 0 },
  { id: '6', label: 'DỊCH VỤ KHÁC', url: '/category/dich-vu-khac', indent: 0 },
  { id: '7', label: 'CHIA SẺ KINH NGHIỆM', url: '/category/huong-dan-chia-se', indent: 0 },
  { id: '8', label: 'LIÊN HỆ', url: '/lien-he', indent: 0 }
];

const footerMenuItems = [
  { label: 'Trang chủ', url: '/' },
  { label: 'Giới thiệu', url: '/gioi-thieu' },
  { label: 'Mua hộ', url: '/category/mua-ho-thanh-toan-ho' },
  { label: 'Ship hộ', url: '/category/chuyen-hang-tu-nuoc-ngoai-ve' },
  { label: 'Liên hệ', url: '/lien-he' }
];

async function updateMenu() {
  try {
    // 1. Update theme_menu_header
    await prisma.setting.upsert({
      where: { key: 'theme_menu_header' },
      update: { value: JSON.stringify(menuItems) },
      create: { key: 'theme_menu_header', value: JSON.stringify(menuItems) }
    });

    // 2. Update theme_menu_footer
    await prisma.setting.upsert({
      where: { key: 'theme_menu_footer' },
      update: { value: JSON.stringify(footerMenuItems) },
      create: { key: 'theme_menu_footer', value: JSON.stringify(footerMenuItems) }
    });

    // 3. Update defaults in the default_settings mapping for new boots
    console.log('Admin & frontend menus recreated successfully for Ezitrans Logistics!');
  } catch (err) {
    console.error('Error updating menus:', err);
  } finally {
    await prisma.$disconnect();
  }
}

updateMenu();
