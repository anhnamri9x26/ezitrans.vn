import React from 'react';
import { hooks } from '@/lib/hooks';
import { CORE_HOOKS } from '@/lib/hooks/coreHooks';
import AdminDashboardClient, { DashboardCardItem } from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  let extraCards: DashboardCardItem[] = [];
  
  try {
    const rawCards = await hooks.applyFilters(CORE_HOOKS.ADMIN_DASHBOARD_CARDS, []);
    if (Array.isArray(rawCards)) {
      extraCards = rawCards.filter(item => 
        item && typeof item === 'object' && 
        typeof item.title === 'string' && 
        typeof item.value !== 'undefined' &&
        typeof item.pluginId === 'string'
      );
    }
  } catch (err) {
    console.error("Hook ADMIN_DASHBOARD_CARDS error:", err);
  }

  return <AdminDashboardClient extraCards={extraCards} />;
}
