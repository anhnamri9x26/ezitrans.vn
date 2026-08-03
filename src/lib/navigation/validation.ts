import { normalizeMenuItems } from './menuTree';
import type { NavigationMenuItem } from './types';

const SAFE_SCHEMES = /^(https?:|mailto:|tel:)/i;
const DANGEROUS_SCHEMES = /^(javascript:|data:|vbscript:)/i;

export class NavigationValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'NavigationValidationError';
    this.status = status;
  }
}

export function slugifyMenuName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'menu';
}

export function isSafeMenuUrl(value: string): boolean {
  const url = value.trim();
  if (!url || DANGEROUS_SCHEMES.test(url)) return false;
  return url.startsWith('/') || url.startsWith('#') || url.startsWith('?') || SAFE_SCHEMES.test(url);
}

export function validateMenuName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new NavigationValidationError('Tên menu không được để trống');
  }
  return value.trim().slice(0, 180);
}

export function validateMenuItems(value: unknown): NavigationMenuItem[] {
  if (!Array.isArray(value)) {
    throw new NavigationValidationError('Danh sách mục menu không hợp lệ');
  }
  if (value.length > 500) {
    throw new NavigationValidationError('Mỗi menu hỗ trợ tối đa 500 mục');
  }

  const items = normalizeMenuItems(value);
  items.forEach((item, index) => {
    if (!item.label) throw new NavigationValidationError(`Mục menu #${index + 1} chưa có nhãn`);
    if (!isSafeMenuUrl(item.url)) throw new NavigationValidationError(`URL của mục “${item.label}” không hợp lệ`);
  });
  return items;
}
