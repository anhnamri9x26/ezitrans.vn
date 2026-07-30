import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { getGravatarUrl } from '@/lib/auth';

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id }
    });

    const userWithAvatar = user ? {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: getGravatarUrl(user.email),
    } : null;

    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'site_logo',
            'site_title',
            'plugin_email_smtp_enabled',
            'plugin_contact_enabled',
            'plugin_seo_enabled',
            'plugin_lexi_page_builder_enabled',
            'plugin_grapesjs_enabled',
            'plugin_lexi_shield_enabled',
            'editor_toolbar_config'
          ]
        }
      }
    });

    const settingsMap = settings.reduce<Record<string, string>>((acc, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

    const activeTheme = settingsMap['active_theme'] || 'default';

    return NextResponse.json({
      success: true,
      user: userWithAvatar,
      settings: settingsMap,
      plugins: {
        active: 0, // Placeholder to avoid disk scan on every page load
        total: 0
      },
      theme: activeTheme
    });
  } catch (error: any) {
    console.error('Error in admin bootstrap:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
