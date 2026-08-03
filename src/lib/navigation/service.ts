import { prisma } from '@/lib/prisma';
import { parseMenuItems } from './menuTree';
import { NavigationValidationError, slugifyMenuName, validateMenuItems, validateMenuName } from './validation';
import type { HydratedNavigationData, NavigationMenuItem } from './types';

async function getUniqueSlug(name: string, excludeId?: number): Promise<string> {
  const base = slugifyMenuName(name);
  let slug = base;
  let suffix = 2;
  while (await prisma.navigationMenu.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function ensureLegacyMenus(): Promise<void> {
  const initialized = await prisma.setting.findUnique({ where: { key: 'navigation_menus_initialized' } });
  if (initialized) return;

  const settings = await prisma.setting.findMany({ where: { key: { in: ['active_theme', 'theme_menu_header', 'theme_menu_footer'] } } });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));
  const themeId = map.get('active_theme') || 'default';
  const candidates = [
    { name: 'Menu Header', slug: 'menu-header', items: map.get('theme_menu_header'), locationKey: 'header-primary' },
    { name: 'Menu Footer', slug: 'menu-footer', items: map.get('theme_menu_footer'), locationKey: 'footer-primary' },
  ].filter((candidate) => candidate.items);

  await prisma.$transaction(async (tx) => {
    if (await tx.navigationMenu.count() === 0) {
      for (const candidate of candidates) {
        const menu = await tx.navigationMenu.create({ data: { name: candidate.name, slug: candidate.slug, items: candidate.items || '[]' } });
        await tx.navigationMenuAssignment.create({ data: { themeId, locationKey: candidate.locationKey, menuId: menu.id } });
      }
    }
    await tx.setting.upsert({
      where: { key: 'navigation_menus_initialized' },
      update: { value: 'true' },
      create: { key: 'navigation_menus_initialized', value: 'true' },
    });
  });
}

export async function listNavigationMenus() {
  await ensureLegacyMenus();
  const menus = await prisma.navigationMenu.findMany({ include: { assignments: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }] });
  return menus.map((menu) => ({ ...menu, items: parseMenuItems(menu.items), itemCount: parseMenuItems(menu.items).length }));
}

export async function getNavigationMenu(id: number) {
  const menu = await prisma.navigationMenu.findUnique({ where: { id }, include: { assignments: true } });
  return menu ? { ...menu, items: parseMenuItems(menu.items) } : null;
}

export async function createNavigationMenu(input: { name: unknown; cloneFromId?: unknown }) {
  const name = validateMenuName(input.name);
  let items: NavigationMenuItem[] = [];
  if (input.cloneFromId !== undefined && input.cloneFromId !== null) {
    const source = await prisma.navigationMenu.findUnique({ where: { id: Number(input.cloneFromId) } });
    if (!source) throw new NavigationValidationError('Không tìm thấy menu nguồn', 404);
    items = parseMenuItems(source.items).map((item, index) => ({ ...item, id: `menu_item_${Date.now()}_${index}` }));
  }
  const slug = await getUniqueSlug(name);
  const menu = await prisma.navigationMenu.create({ data: { name, slug, items: JSON.stringify(items) } });
  return { ...menu, items };
}

export async function updateNavigationMenu(id: number, input: { name: unknown; items: unknown; expectedUpdatedAt?: unknown }) {
  const existing = await prisma.navigationMenu.findUnique({ where: { id } });
  if (!existing) throw new NavigationValidationError('Không tìm thấy menu', 404);
  if (typeof input.expectedUpdatedAt === 'string' && existing.updatedAt.toISOString() !== input.expectedUpdatedAt) {
    throw new NavigationValidationError('Menu đã được thay đổi ở một cửa sổ khác. Vui lòng tải lại trước khi lưu.', 409);
  }
  const name = validateMenuName(input.name);
  const items = validateMenuItems(input.items);
  const slug = name === existing.name ? existing.slug : await getUniqueSlug(name, id);
  const menu = await prisma.navigationMenu.update({ where: { id }, data: { name, slug, items: JSON.stringify(items) } });
  await syncActiveLegacyAliases();
  return { ...menu, items };
}

export async function deleteNavigationMenu(id: number) {
  const existing = await prisma.navigationMenu.findUnique({ where: { id }, include: { assignments: true } });
  if (!existing) throw new NavigationValidationError('Không tìm thấy menu', 404);
  await prisma.navigationMenu.delete({ where: { id } });
  await syncActiveLegacyAliases();
  return existing.assignments;
}

export async function replaceThemeAssignments(themeId: string, assignments: Array<{ locationKey: string; menuId: number | null }>, allowedKeys: string[]) {
  const allowed = new Set(allowedKeys);
  const normalized = assignments.map((assignment) => ({
    locationKey: String(assignment.locationKey || ''),
    menuId: assignment.menuId === null ? null : Number(assignment.menuId),
  }));
  if (normalized.some((assignment) => !allowed.has(assignment.locationKey))) {
    throw new NavigationValidationError('Vị trí menu không được theme đăng ký');
  }
  const menuIds = [...new Set(normalized.flatMap((assignment) => assignment.menuId ? [assignment.menuId] : []))];
  const existingCount = await prisma.navigationMenu.count({ where: { id: { in: menuIds } } });
  if (existingCount !== menuIds.length) throw new NavigationValidationError('Một menu được chọn không còn tồn tại', 404);

  await prisma.$transaction(async (tx) => {
    for (const assignment of normalized) {
      if (assignment.menuId === null) {
        await tx.navigationMenuAssignment.deleteMany({ where: { themeId, locationKey: assignment.locationKey } });
      } else {
        await tx.navigationMenuAssignment.upsert({
          where: { themeId_locationKey: { themeId, locationKey: assignment.locationKey } },
          update: { menuId: assignment.menuId },
          create: { themeId, locationKey: assignment.locationKey, menuId: assignment.menuId },
        });
      }
    }
  });
  await syncActiveLegacyAliases();
}

export async function getHydratedNavigation(themeId: string): Promise<HydratedNavigationData> {
  await ensureLegacyMenus();
  const [menus, assignments] = await Promise.all([
    prisma.navigationMenu.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }] }),
    prisma.navigationMenuAssignment.findMany({ where: { themeId }, include: { menu: true } }),
  ]);
  return {
    themeId,
    menus: menus.map((menu) => ({ id: menu.id, name: menu.name, slug: menu.slug, items: parseMenuItems(menu.items), updatedAt: menu.updatedAt.toISOString() })),
    locations: Object.fromEntries(assignments.map((assignment) => [assignment.locationKey, {
      menuId: assignment.menuId,
      menuName: assignment.menu.name,
      items: parseMenuItems(assignment.menu.items),
    }])),
  };
}

export async function syncActiveLegacyAliases() {
  const activeTheme = await prisma.setting.findUnique({ where: { key: 'active_theme' } });
  const navigation = await getHydratedNavigation(activeTheme?.value || 'default');
  const aliases = [
    ['theme_menu_header', navigation.locations['header-primary']],
    ['theme_menu_footer', navigation.locations['footer-primary']],
  ] as const;
  for (const [key, location] of aliases) {
    const value = JSON.stringify(location?.items || []);
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
}

export async function copyCompatibleThemeAssignments(fromThemeId: string, toThemeId: string, allowedKeys: string[]) {
  const source = await prisma.navigationMenuAssignment.findMany({ where: { themeId: fromThemeId, locationKey: { in: allowedKeys } } });
  for (const assignment of source) {
    await prisma.navigationMenuAssignment.upsert({
      where: { themeId_locationKey: { themeId: toThemeId, locationKey: assignment.locationKey } },
      update: {},
      create: { themeId: toThemeId, locationKey: assignment.locationKey, menuId: assignment.menuId },
    });
  }
  await syncActiveLegacyAliases();
}
