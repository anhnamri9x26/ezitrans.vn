import { prisma } from '@/lib/prisma';
import { getHydratedNavigation } from './service';

export async function loadHydratedSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const settings = rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  const themeId = settings.active_theme || 'default';
  const navigation = await getHydratedNavigation(themeId);
  settings.navigation_menus = JSON.stringify(navigation.menus);
  settings.navigation_locations = JSON.stringify(navigation.locations);
  settings.navigation_theme_id = themeId;
  if (navigation.locations['header-primary']) settings.theme_menu_header = JSON.stringify(navigation.locations['header-primary'].items);
  if (navigation.locations['footer-primary']) settings.theme_menu_footer = JSON.stringify(navigation.locations['footer-primary'].items);
  return settings;
}

export function hydrateSettingsWithNavigation(settings: Record<string, string>, navigation: Awaited<ReturnType<typeof getHydratedNavigation>>) {
  const hydrated = { ...settings };
  hydrated.navigation_menus = JSON.stringify(navigation.menus);
  hydrated.navigation_locations = JSON.stringify(navigation.locations);
  hydrated.navigation_theme_id = navigation.themeId;
  if (navigation.locations['header-primary']) hydrated.theme_menu_header = JSON.stringify(navigation.locations['header-primary'].items);
  if (navigation.locations['footer-primary']) hydrated.theme_menu_footer = JSON.stringify(navigation.locations['footer-primary'].items);
  return hydrated;
}
