/**
 * Lexi CMS — Plugin Permission System
 * 
 * Quản lý quyền của plugin. Mỗi plugin khai báo permissions trong manifest.json
 * và chỉ được thực hiện các tác vụ đã được cấp phép.
 */

import fs from 'fs';
import path from 'path';

// ─── Permission Definitions ─────────────────────────────────────

export type Permission =
  | 'settings:read'        // Đọc settings từ DB
  | 'settings:write'       // Ghi settings vào DB
  | 'posts:read'           // Đọc bài viết
  | 'posts:write'          // Tạo/sửa bài viết
  | 'comments:read'        // Đọc bình luận
  | 'comments:write'       // Tạo/sửa bình luận
  | 'media:upload'         // Upload file
  | 'media:delete'         // Xóa file
  | 'users:read'           // Đọc thông tin người dùng
  | 'admin:pages'          // Thêm trang admin custom
  | 'admin:sidebar'        // Thêm menu vào admin sidebar
  | 'hooks:action'         // Đăng ký action hooks
  | 'hooks:filter'         // Đăng ký filter hooks
  | 'widgets:register'     // Đăng ký widget frontend
  | 'api:routes';          // Đăng ký API routes

// Permission metadata cho UI hiển thị
export const PERMISSION_META: Record<Permission, { 
  label: string; 
  labelVi: string; 
  risk: 'low' | 'medium' | 'high'; 
  description: string 
}> = {
  'settings:read': { 
    label: 'Read Settings', 
    labelVi: 'Đọc cài đặt', 
    risk: 'low', 
    description: 'Đọc dữ liệu cấu hình hệ thống' 
  },
  'settings:write': { 
    label: 'Write Settings', 
    labelVi: 'Ghi cài đặt', 
    risk: 'medium', 
    description: 'Thay đổi cấu hình hệ thống' 
  },
  'posts:read': { 
    label: 'Read Posts', 
    labelVi: 'Đọc bài viết', 
    risk: 'low', 
    description: 'Đọc nội dung bài viết' 
  },
  'posts:write': { 
    label: 'Write Posts', 
    labelVi: 'Ghi bài viết', 
    risk: 'medium', 
    description: 'Tạo hoặc chỉnh sửa bài viết' 
  },
  'comments:read': { 
    label: 'Read Comments', 
    labelVi: 'Đọc bình luận', 
    risk: 'low', 
    description: 'Đọc bình luận người dùng' 
  },
  'comments:write': { 
    label: 'Write Comments', 
    labelVi: 'Ghi bình luận', 
    risk: 'medium', 
    description: 'Tạo hoặc chỉnh sửa bình luận' 
  },
  'media:upload': { 
    label: 'Upload Media', 
    labelVi: 'Upload tệp', 
    risk: 'medium', 
    description: 'Tải tệp lên hệ thống' 
  },
  'media:delete': { 
    label: 'Delete Media', 
    labelVi: 'Xóa tệp', 
    risk: 'high', 
    description: 'Xóa tệp khỏi hệ thống' 
  },
  'users:read': { 
    label: 'Read Users', 
    labelVi: 'Đọc người dùng', 
    risk: 'medium', 
    description: 'Đọc thông tin tài khoản người dùng' 
  },
  'admin:pages': { 
    label: 'Admin Pages', 
    labelVi: 'Trang quản trị', 
    risk: 'medium', 
    description: 'Thêm trang vào bảng quản trị' 
  },
  'admin:sidebar': { 
    label: 'Admin Sidebar', 
    labelVi: 'Menu sidebar', 
    risk: 'low', 
    description: 'Thêm mục vào menu sidebar admin' 
  },
  'hooks:action': { 
    label: 'Action Hooks', 
    labelVi: 'Hook hành động', 
    risk: 'medium', 
    description: 'Đăng ký side-effects vào hệ thống' 
  },
  'hooks:filter': { 
    label: 'Filter Hooks', 
    labelVi: 'Hook lọc dữ liệu', 
    risk: 'medium', 
    description: 'Biến đổi dữ liệu khi xử lý' 
  },
  'widgets:register': { 
    label: 'Register Widgets', 
    labelVi: 'Đăng ký widget', 
    risk: 'low', 
    description: 'Thêm widget vào giao diện frontend' 
  },
  'api:routes': { 
    label: 'API Routes', 
    labelVi: 'API endpoints', 
    risk: 'high', 
    description: 'Đăng ký API endpoints riêng' 
  },
};

// ─── Permission Validation ──────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  highRiskPermissions: Permission[];
}

/**
 * Validate permissions khai báo trong manifest
 */
export function validatePermissions(permissions: string[]): ValidationResult {
  const validPermissions = Object.keys(PERMISSION_META) as Permission[];
  const errors: string[] = [];
  const warnings: string[] = [];
  const highRisk: Permission[] = [];

  for (const perm of permissions) {
    if (!validPermissions.includes(perm as Permission)) {
      errors.push(`Quyền "${perm}" không hợp lệ`);
    } else {
      const meta = PERMISSION_META[perm as Permission];
      if (meta.risk === 'high') {
        highRisk.push(perm as Permission);
        warnings.push(`Quyền "${meta.labelVi}" (${perm}) có mức rủi ro CAO`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    highRiskPermissions: highRisk,
  };
}

// ─── Permission Manager ─────────────────────────────────────────

class PluginPermissionManager {
  private pluginPermissions: Map<string, Set<Permission>> = new Map();

  /**
   * Đăng ký permissions cho plugin (gọi khi load plugin)
   */
  registerPlugin(pluginId: string, permissions: string[]): void {
    const validPerms = new Set<Permission>();
    for (const perm of permissions) {
      if (perm in PERMISSION_META) {
        validPerms.add(perm as Permission);
      }
    }
    this.pluginPermissions.set(pluginId, validPerms);
  }

  /**
   * Gỡ đăng ký plugin (gọi khi unload)
   */
  unregisterPlugin(pluginId: string): void {
    this.pluginPermissions.delete(pluginId);
  }

  /**
   * Kiểm tra plugin có quyền cụ thể không
   */
  hasPermission(pluginId: string, permission: Permission): boolean {
    const perms = this.pluginPermissions.get(pluginId);
    if (!perms) return false;
    return perms.has(permission);
  }

  /**
   * Lấy tất cả quyền của plugin
   */
  getPermissions(pluginId: string): Permission[] {
    const perms = this.pluginPermissions.get(pluginId);
    if (!perms) return [];
    return Array.from(perms);
  }

  /**
   * Lấy thông tin quyền cho tất cả plugin (dùng cho admin dashboard)
   */
  getAllPermissions(): Record<string, { permissions: Permission[]; riskLevel: 'low' | 'medium' | 'high' }> {
    const result: Record<string, { permissions: Permission[]; riskLevel: 'low' | 'medium' | 'high' }> = {};
    
    for (const [pluginId, perms] of this.pluginPermissions) {
      const permList = Array.from(perms);
      let maxRisk: 'low' | 'medium' | 'high' = 'low';
      for (const p of permList) {
        const meta = PERMISSION_META[p];
        if (meta.risk === 'high') maxRisk = 'high';
        else if (meta.risk === 'medium' && maxRisk !== 'high') maxRisk = 'medium';
      }
      result[pluginId] = { permissions: permList, riskLevel: maxRisk };
    }

    return result;
  }

  /**
   * Reset (dùng cho testing)
   */
  reset(): void {
    this.pluginPermissions.clear();
  }
}

// Singleton
export const permissionManager = new PluginPermissionManager();
