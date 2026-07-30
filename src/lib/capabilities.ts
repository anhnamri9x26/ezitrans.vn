import { prisma } from './prisma';
import { Role, User } from '@prisma/client';

export interface CapabilityMeta {
  key: string;
  label: string;
  group: string;
}

export const CAPABILITY_GROUPS = {
  SYSTEM: 'Quản trị hệ thống',
  POSTS: 'Bài viết',
  PAGES: 'Trang',
  PRODUCTS: 'Sản phẩm',
  TAXONOMY: 'Phân loại',
  MEDIA: 'Thư viện',
  COMMENTS: 'Bình luận',
  SEO_FORM: 'SEO & Form',
  TEMPLATES: 'Giao diện',
  ACCOUNT: 'Tài khoản'
};

export const ALL_CAPABILITIES: CapabilityMeta[] = [
  // Quản trị hệ thống
  { key: 'manage_settings', label: 'Quản lý cài đặt hệ thống', group: CAPABILITY_GROUPS.SYSTEM },
  { key: 'manage_users', label: 'Quản lý người dùng (CRUD)', group: CAPABILITY_GROUPS.SYSTEM },
  { key: 'manage_roles', label: 'Quản lý phân quyền vai trò', group: CAPABILITY_GROUPS.SYSTEM },
  { key: 'manage_plugins', label: 'Quản lý plugins/extensions', group: CAPABILITY_GROUPS.SYSTEM },
  { key: 'manage_themes', label: 'Quản lý giao diện', group: CAPABILITY_GROUPS.SYSTEM },
  { key: 'manage_tools', label: 'Sử dụng công cụ (import, editor)', group: CAPABILITY_GROUPS.SYSTEM },

  // Bài viết
  { key: 'edit_posts', label: 'Tạo/Sửa bài viết của mình', group: CAPABILITY_GROUPS.POSTS },
  { key: 'edit_others_posts', label: 'Sửa bài viết của người khác', group: CAPABILITY_GROUPS.POSTS },
  { key: 'publish_posts', label: 'Xuất bản bài viết', group: CAPABILITY_GROUPS.POSTS },
  { key: 'delete_posts', label: 'Xóa bài viết', group: CAPABILITY_GROUPS.POSTS },

  // Trang
  { key: 'edit_pages', label: 'Tạo/Sửa trang', group: CAPABILITY_GROUPS.PAGES },
  { key: 'publish_pages', label: 'Xuất bản trang', group: CAPABILITY_GROUPS.PAGES },
  { key: 'delete_pages', label: 'Xóa trang', group: CAPABILITY_GROUPS.PAGES },

  // Sản phẩm
  { key: 'edit_products', label: 'Tạo/Sửa sản phẩm', group: CAPABILITY_GROUPS.PRODUCTS },
  { key: 'publish_products', label: 'Xuất bản sản phẩm', group: CAPABILITY_GROUPS.PRODUCTS },
  { key: 'delete_products', label: 'Xóa sản phẩm', group: CAPABILITY_GROUPS.PRODUCTS },

  // Phân loại
  { key: 'manage_categories', label: 'Quản lý danh mục', group: CAPABILITY_GROUPS.TAXONOMY },
  { key: 'manage_tags', label: 'Quản lý thẻ', group: CAPABILITY_GROUPS.TAXONOMY },

  // Thư viện
  { key: 'upload_media', label: 'Upload media', group: CAPABILITY_GROUPS.MEDIA },
  { key: 'manage_media', label: 'Quản lý/Xóa media', group: CAPABILITY_GROUPS.MEDIA },

  // Bình luận
  { key: 'moderate_comments', label: 'Duyệt/Quản lý bình luận', group: CAPABILITY_GROUPS.COMMENTS },

  // SEO & Form
  { key: 'manage_seo', label: 'Quản lý SEO', group: CAPABILITY_GROUPS.SEO_FORM },
  { key: 'view_form_submissions', label: 'Xem phản hồi form', group: CAPABILITY_GROUPS.SEO_FORM },

  // Giao diện
  { key: 'manage_templates', label: 'Quản lý templates (Page Builder)', group: CAPABILITY_GROUPS.TEMPLATES },

  // Tài khoản
  { key: 'view_dashboard', label: 'Xem trang Tổng quan', group: CAPABILITY_GROUPS.ACCOUNT },
  { key: 'edit_profile', label: 'Sửa hồ sơ cá nhân', group: CAPABILITY_GROUPS.ACCOUNT },
  { key: 'read', label: 'Đọc nội dung/Truy cập admin panel', group: CAPABILITY_GROUPS.ACCOUNT },
];

export const DEFAULT_CAPABILITIES: Record<Role, string[]> = {
  ADMIN: ALL_CAPABILITIES.map(c => c.key),
  EDITOR: [
    'manage_templates',
    'view_dashboard',
    'publish_posts',
    'edit_posts',
    'edit_others_posts',
    'delete_posts',
    'publish_pages',
    'edit_pages',
    'delete_pages',
    'edit_products',
    'publish_products',
    'delete_products',
    'manage_categories',
    'manage_tags',
    'upload_media',
    'manage_media',
    'moderate_comments',
    'manage_seo',
    'edit_profile',
    'read'
  ],
  SUBSCRIBER: [
    'view_dashboard',
    'edit_profile',
    'read'
  ]
};

export async function getRoleCapabilities(role: Role): Promise<string[]> {
  // ADMIN always has all capabilities and cannot be modified
  if (role === Role.ADMIN) {
    return DEFAULT_CAPABILITIES.ADMIN;
  }

  try {
    const settingKey = `role_capabilities_${role}`;
    const setting = await prisma.setting.findUnique({
      where: { key: settingKey }
    });

    if (setting) {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error(`Error parsing capabilities for role ${role}:`, error);
  }

  return DEFAULT_CAPABILITIES[role];
}

export async function userCan(user: User | null, capability: string): Promise<boolean> {
  if (!user) return false;
  
  // ADMIN bypasses all capability checks
  if (user.role === Role.ADMIN) return true;

  const userCapabilities = await getRoleCapabilities(user.role);
  return userCapabilities.includes(capability);
}

export class ForbiddenError extends Error {
  constructor(message = 'Bạn không có quyền thực hiện hành động này') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export async function requireCapability(user: User | null, capability: string): Promise<void> {
  if (!user) {
    throw new ForbiddenError('Chưa đăng nhập hoặc phiên làm việc đã hết hạn');
  }

  const hasCap = await userCan(user, capability);
  if (!hasCap) {
    throw new ForbiddenError(`Tài khoản của bạn không có quyền: ${capability}`);
  }
}
