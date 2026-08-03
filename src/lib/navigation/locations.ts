import type { MenuLocationDefinition } from './types';

export const FALLBACK_MENU_LOCATIONS: MenuLocationDefinition[] = [
  { key: 'header-primary', label: 'Menu chính đầu trang', description: 'Điều hướng chính trên desktop và mobile.' },
  { key: 'footer-primary', label: 'Menu chính chân trang', description: 'Các liên kết chính trong chân trang.' },
];

export function normalizeMenuLocations(value: unknown): MenuLocationDefinition[] {
  if (!Array.isArray(value)) return FALLBACK_MENU_LOCATIONS;
  const seen = new Set<string>();
  const locations = value.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return [];
    const record = raw as Record<string, unknown>;
    const key = typeof record.key === 'string' ? record.key.trim() : '';
    const label = typeof record.label === 'string' ? record.label.trim() : '';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) || !label || seen.has(key)) return [];
    seen.add(key);
    return [{
      key,
      label: label.slice(0, 120),
      description: typeof record.description === 'string' ? record.description.trim().slice(0, 240) : undefined,
    }];
  });
  return locations.length > 0 ? locations : FALLBACK_MENU_LOCATIONS;
}
