import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/session';
import { isIpBlocked } from '@/lib/security/ipRules';
import { prisma } from '@/lib/prisma';
import AdminLayoutClient from './AdminLayoutClient';
import { hooks } from '@/lib/hooks';
import { CORE_HOOKS } from '@/lib/hooks/coreHooks';
import { AdminI18nProvider } from '@/lib/i18n/AdminI18nProvider';
import { getAdminLocale } from '@/lib/i18n/server';
import { getDictionary } from '@/lib/i18n/dictionaries';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userCount = await prisma.user.count().catch(() => -1);
  if (userCount === 0) {
    redirect('/setup');
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect('/api/auth/clear-invalid-session');
  }

  // 1. IP Block check
  const headerStore = await headers();
  const ipAddress = headerStore.get('x-forwarded-for') || headerStore.get('x-real-ip') || '127.0.0.1';
  const isBlocked = await isIpBlocked(ipAddress.split(',')[0].trim());
  if (isBlocked) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>Access Denied</h1>
        <p>Your IP address has been blocked by Lexi Shield.</p>
      </div>
    );
  }

  // 2. Fetch Extra Sidebar Items from plugins
  let extraSidebarItems: any[] = [];
  try {
    const rawItems = await hooks.applyFilters(CORE_HOOKS.ADMIN_SIDEBAR_ITEMS, []);
    if (Array.isArray(rawItems)) {
      extraSidebarItems = rawItems.filter(item => 
        item && typeof item === 'object' && 
        typeof item.label === 'string' && 
        typeof item.href === 'string' &&
        typeof item.pluginId === 'string'
      );
    }
  } catch (err) {
    console.error("Hook ADMIN_SIDEBAR_ITEMS error:", err);
  }

  const locale = await getAdminLocale();
  const dictionary = getDictionary(locale);

  return (
    <AdminI18nProvider locale={locale} dictionary={dictionary}>
      <AdminLayoutClient extraSidebarItems={extraSidebarItems}>
        {children}
      </AdminLayoutClient>
    </AdminI18nProvider>
  );
}

