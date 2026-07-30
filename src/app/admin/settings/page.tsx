import React from 'react';
import { hooks } from '@/lib/hooks';
import { CORE_HOOKS } from '@/lib/hooks/coreHooks';
import AdminSettingsClient, { SettingsPanelItem } from './AdminSettingsClient';

export default async function AdminSettingsPage() {
  let extraPanels: SettingsPanelItem[] = [];
  
  try {
    const rawPanels = await hooks.applyFilters(CORE_HOOKS.SETTINGS_PANELS, []);
    if (Array.isArray(rawPanels)) {
      extraPanels = rawPanels.filter(item => 
        item && typeof item === 'object' && 
        typeof item.title === 'string' && 
        typeof item.href === 'string' &&
        typeof item.pluginId === 'string'
      );
    }
  } catch (err) {
    console.error("Hook SETTINGS_PANELS error:", err);
  }

  return <AdminSettingsClient extraPanels={extraPanels} />;
}
