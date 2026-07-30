import { HookManager } from '@/lib/hooks/HookManager';
import { CORE_HOOKS } from '@/lib/hooks/coreHooks';

export function registerHooks(hooks: HookManager) {
  // Lightweight UI-only hooks. Keep Prisma/database code out of this file because
  // admin layout loads plugin hooks to render the sidebar on every admin page.
  hooks.addFilter(CORE_HOOKS.ADMIN_SIDEBAR_ITEMS, (items: any[]) => {
    items.push({
      label: 'Sản phẩm',
      href: '/admin/products',
      iconName: 'shopping-bag',
      pluginId: 'lexi-commerce',
      requiredCapability: 'edit_products',
    });
    items.push({
      label: 'Đánh giá sản phẩm',
      href: '/admin/products/reviews',
      iconName: 'star',
      pluginId: 'lexi-commerce',
      requiredCapability: 'edit_products',
      parentId: '/admin/products',
    });
    return items;
  }, 10, 'lexi-commerce');

  hooks.addFilter(CORE_HOOKS.ADMIN_DASHBOARD_CARDS, (cards: any[]) => {
    cards.push({
      title: 'Sản phẩm',
      value: 'PRODUCT_COUNT',
      description: 'Tổng số sản phẩm đã xuất bản',
      href: '/admin/products',
      pluginId: 'lexi-commerce',
    });
    return cards;
  }, 10, 'lexi-commerce');
}
