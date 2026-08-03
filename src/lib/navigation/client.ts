import { normalizeMenuItems } from './menuTree';
import type { NavigationMenuItem } from './types';

export function getMenuItemsForLocation(settings: Record<string, string> | undefined, locationKey: string): NavigationMenuItem[] {
  if (!settings) return [];
  try {
    const locations = JSON.parse(settings.navigation_locations || '{}');
    if (locations?.[locationKey]?.items) return normalizeMenuItems(locations[locationKey].items);
  } catch {}

  const fallbackKey = locationKey === 'header-primary'
    ? 'theme_menu_header'
    : locationKey === 'footer-primary'
      ? 'theme_menu_footer'
      : null;
  if (!fallbackKey || !settings[fallbackKey]) return [];
  try {
    return normalizeMenuItems(JSON.parse(settings[fallbackKey]));
  } catch {
    return [];
  }
}

export function getManagedMenusFromSettings(settings: Record<string, string> | undefined) {
  try {
    const menus = JSON.parse(settings?.navigation_menus || '[]');
    return Array.isArray(menus) ? menus : [];
  } catch {
    return [];
  }
}
