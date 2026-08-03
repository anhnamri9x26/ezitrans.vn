import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { scanAllThemes } from '@/lib/updates/runtimePackages';
import { FALLBACK_MENU_LOCATIONS, normalizeMenuLocations } from '@/lib/navigation/locations';
import { getHydratedNavigation, replaceThemeAssignments } from '@/lib/navigation/service';
import { NavigationValidationError } from '@/lib/navigation/validation';

function resolveTheme(themeId?: string) {
  const { validThemesData } = scanAllThemes();
  return validThemesData.find((entry) => entry.manifest.id === themeId) || validThemesData.find((entry) => entry.manifest.id === 'default');
}

export async function GET(req: Request) {
  try {
    const requestedThemeId = new URL(req.url).searchParams.get('themeId');
    const activeThemeSetting = requestedThemeId
      ? null
      : await prisma.setting.findUnique({ where: { key: 'active_theme' }, select: { value: true } });
    const theme = resolveTheme(requestedThemeId || activeThemeSetting?.value || 'default');
    const resolvedThemeId = theme?.manifest.id || 'default';
    const locations = theme?.manifest.menuLocations ? normalizeMenuLocations(theme.manifest.menuLocations) : FALLBACK_MENU_LOCATIONS;
    const navigation = await getHydratedNavigation(resolvedThemeId);
    return NextResponse.json({ success: true, themeId: resolvedThemeId, locations, assignments: Object.fromEntries(Object.entries(navigation.locations).map(([key, value]) => [key, value.menuId])) });
  } catch (error: any) {
    console.error('Error loading menu locations:', error);
    return NextResponse.json({ success: false, error: error.message || 'Không thể tải vị trí menu' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!await userCan(user, 'manage_settings')) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền quản lý vị trí menu' }, { status: 403 });
    }
    const body = await req.json();
    const theme = resolveTheme(body.themeId);
    if (!theme) throw new NavigationValidationError('Theme không tồn tại', 404);
    const locations = theme.manifest.menuLocations ? normalizeMenuLocations(theme.manifest.menuLocations) : FALLBACK_MENU_LOCATIONS;
    if (!Array.isArray(body.assignments)) throw new NavigationValidationError('Danh sách phân công không hợp lệ');
    await replaceThemeAssignments(theme.manifest.id, body.assignments, locations.map((location) => location.key));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error instanceof NavigationValidationError ? error.status : 500;
    console.error('Error saving menu locations:', error);
    return NextResponse.json({ success: false, error: error.message || 'Không thể lưu vị trí menu' }, { status });
  }
}
