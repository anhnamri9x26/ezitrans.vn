import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { syncActiveLegacyAliases } from '../src/lib/navigation/service';
import type { NavigationMenuItem } from '../src/lib/navigation/types';

const item = (
  id: string,
  label: string,
  url: string,
  indent = 0,
  options: Pick<NavigationMenuItem, 'isMega' | 'description' | 'icon'> = {},
): NavigationMenuItem => ({
  id,
  label,
  url,
  indent,
  isMega: options.isMega ?? false,
  description: options.description ?? '',
  icon: options.icon ?? '',
});

const purchaseRegions = [
  {
    id: 'asia',
    label: 'Khu vực Châu Á',
    countries: [
      ['Trung Quốc', '/mua-ho-hang-trung-quoc.html'],
      ['Nhật Bản', '/mua-ho-hang-nhat-ban.html'],
      ['Hàn Quốc', '/mua-ho-hang-han-quoc.html'],
      ['Úc', '/mua-ho-hang-uc.html'],
      ['Singapore', '/mua-ho-hang-singapore.html'],
      ['Malaysia', '/mua-ho-hang-malaysia.html'],
      ['Philippines', '/mua-ho-hang-philippines.html'],
      ['Indonesia', '/mua-ho-hang-indonesia.html'],
      ['Thái Lan', '/mua-ho-hang-thai-lan.html'],
    ],
  },
  {
    id: 'europe',
    label: 'Khu vực Châu Âu',
    countries: [
      ['Anh', '/mua-ho-hang-anh.html'],
      ['Đức', '/mua-ho-hang-duc.html'],
      ['Tây Ban Nha', '/mua-ho-hang-tay-ban-nha.html'],
      ['Nga', '/mua-ho-hang-nga.html'],
      ['CH Séc', '/mua-ho-hang-ch-sec.html'],
    ],
  },
  {
    id: 'america',
    label: 'Khu vực Châu Mỹ',
    countries: [['Mỹ', '/mua-ho-hang-my.html']],
  },
] as const;

const shippingRegions = [
  {
    id: 'asia',
    label: 'Khu vực Châu Á',
    countries: [
      ['Trung Quốc', '/van-chuyen-hang-trung-quoc-ve-viet-nam.html'],
      ['Nhật Bản', '/chuyen-hang-tu-nhat-ban-ve-viet-nam.html'],
      ['Hàn Quốc', '/chuyen-hang-tu-han-quoc-ve-viet-nam.html'],
      ['Úc', '/chuyen-hang-tu-uc-ve-viet-nam.html'],
      ['Singapore', '/chuyen-hang-tu-singapore-ve-viet-nam.html'],
      ['Malaysia', '/chuyen-hang-tu-malaysia-ve-viet-nam.html'],
      ['Philippines', '/chuyen-hang-tu-philippines-ve-viet-nam.html'],
      ['Indonesia', '/chuyen-hang-tu-indonesia-ve-viet-nam.html'],
      ['Thái Lan', '/chuyen-hang-tu-thai-lan-ve-viet-nam.html'],
    ],
  },
  {
    id: 'europe',
    label: 'Khu vực Châu Âu',
    countries: [
      ['Anh', '/chuyen-hang-tu-anh-ve-viet-nam.html'],
      ['Đức', '/chuyen-hang-tu-duc-ve-viet-nam.html'],
      ['Pháp', '/chuyen-hang-tu-phap-ve-viet-nam.html'],
      ['Tây Ban Nha', '/chuyen-hang-tu-tay-ban-nha-ve-viet-nam.html'],
      ['Nga', '/chuyen-hang-tu-nga-ve-viet-nam.html'],
      ['CH Séc', '/chuyen-hang-tu-ch-sec-ve-viet-nam.html'],
    ],
  },
  {
    id: 'america',
    label: 'Khu vực Châu Mỹ',
    countries: [['Mỹ', '/chuyen-hang-tu-my-ve-viet-nam.html']],
  },
] as const;

function regionItems(
  prefix: string,
  regions: ReadonlyArray<{
    id: string;
    label: string;
    countries: ReadonlyArray<readonly [string, string]>;
  }>,
): NavigationMenuItem[] {
  return regions.flatMap((region) => [
    item(`${prefix}-${region.id}`, region.label, `#${prefix}-${region.id}`, 1, { icon: 'Globe' }),
    ...region.countries.map(([label, url], index) =>
      item(`${prefix}-${region.id}-${index + 1}`, label, url, 2),
    ),
  ]);
}

const menuItems: NavigationMenuItem[] = [
  item('primary-home', 'Trang chủ', '/'),
  item('primary-about', 'Giới thiệu', '/gioi-thieu.html'),
  item('about-guide', 'Hướng dẫn mua hàng', '/huong-dan-mua-hang.html', 1),
  item('about-bank', 'Thông tin chuyển khoản', '#thong-tin-chuyen-khoan', 1),
  item('about-faq', 'Câu hỏi thường gặp', '#cau-hoi-thuong-gap', 1),
  item('about-contact', 'Liên hệ', '/lien-he.html', 1),
  item('primary-buy', 'Mua hộ', '#mua-ho', 0, { isMega: true }),
  ...regionItems('buy', purchaseRegions),
  item('primary-ship', 'Ship hộ', '#ship-ho', 0, { isMega: true }),
  ...regionItems('ship', shippingRegions),
  item('primary-export', 'Xuất khẩu', '/category/xuat-khau'),
  item('export-cn', 'Gửi hàng đi Trung Quốc', '#gui-hang-di-trung-quoc', 1),
  item('export-jp', 'Gửi hàng đi Nhật Bản', '#gui-hang-di-nhat-ban', 1),
  item('export-ru', 'Gửi hàng đi Nga', '/gui-hang-di-nga.html', 1),
  item('export-us', 'Gửi hàng đi Mỹ', '/gui-hang-di-my.html', 1),
  item('export-au', 'Gửi hàng đi Úc', '/gui-hang-di-uc.html', 1),
  item('primary-services', 'Dịch vụ khác', '/category/dich-vu-khac'),
  item('service-alipay', 'Thanh toán hộ Alipay', '/thanh-toan-ho-alipay.html', 1),
  item('service-wechat', 'Thanh toán hộ Wechat', '/thanh-toan-ho-wechat.html', 1),
  item('service-paypal', 'Thanh toán hộ Paypal', '/thanh-toan-ho-paypal.html', 1),
  item('service-chemist', 'Mua hộ hàng Chemist', '/mua-ho-hang-chemist-warehouse.html', 1),
  item('service-1688', 'Mua hộ hàng 1688', '/mua-ho-hang-1688.html', 1),
  item('primary-experience', 'Chia sẻ kinh nghiệm', '#chia-se-kinh-nghiem'),
  item('experience-guides', 'Hướng dẫn chia sẻ', '/category/huong-dan-chia-se', 1),
  item('experience-trade', 'Kiến thức ngoại thương', '/category/kien-thuc-ngoai-thuong', 1),
];

const obsoleteEzitransSlugs = [
  'ezitrans-header-utility',
  'ezitrans-footer-primary',
  'ezitrans-footer-faq',
  'ezitrans-footer-buy',
  'ezitrans-footer-ship',
  'ezitrans-footer-export',
  'ezitrans-footer-services',
];

async function updateMenu() {
  await prisma.$transaction(async (tx) => {
    const menu = await tx.navigationMenu.upsert({
      where: { slug: 'ezitrans-header-primary' },
      update: {
        name: 'Ezitrans - Menu chính',
        items: JSON.stringify(menuItems),
      },
      create: {
        name: 'Ezitrans - Menu chính',
        slug: 'ezitrans-header-primary',
        items: JSON.stringify(menuItems),
      },
    });

    await tx.navigationMenu.deleteMany({
      where: { slug: { in: obsoleteEzitransSlugs } },
    });

    await tx.navigationMenuAssignment.deleteMany({
      where: {
        themeId: 'ezitrans',
        locationKey: { not: 'header-primary' },
      },
    });

    await tx.navigationMenuAssignment.upsert({
      where: {
        themeId_locationKey: {
          themeId: 'ezitrans',
          locationKey: 'header-primary',
        },
      },
      update: { menuId: menu.id },
      create: {
        themeId: 'ezitrans',
        locationKey: 'header-primary',
        menuId: menu.id,
      },
    });
  });

  await syncActiveLegacyAliases();
  console.log(`Đã tạo lại một menu Ezitrans duy nhất với ${menuItems.length} mục phân cấp.`);
}

updateMenu()
  .catch((error) => {
    console.error('Không thể tạo lại menu Ezitrans:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
