'use client';

export interface PluginManifest {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  version: string;
  author: string;
  icon: string;
  iconColor: string;
  settingKey: string;
  category: string;
  requires: string[];
  adminRoute: string | null;
  capabilities: string[];
  componentPath?: string;
  updateChannels?: Array<'zip' | 'git'>;
  repository?: string | null;
  changelog: Array<{
    version: string;
    date: string;
    changes: string[];
  }>;
}

export interface PluginRegistration {
  id: string;
  manifest: PluginManifest;
  kind: 'builder' | 'integration' | 'seo' | 'communication' | 'engagement' | 'other';
  componentPath?: string;
}

class PluginRegistry {
  private registrations = new Map<string, PluginRegistration>();
  private activeCache = new Map<string, boolean>();

  register(plugin: PluginRegistration) {
    this.registrations.set(plugin.id, plugin);
    return plugin;
  }

  registerBuilder(manifest: PluginManifest) {
    return this.register({
      id: manifest.id,
      manifest,
      kind: 'builder',
      componentPath: manifest.componentPath,
    });
  }

  getPlugin(id: string) {
    return this.registrations.get(id) || null;
  }

  getRegisteredPlugins() {
    return Array.from(this.registrations.values());
  }

  getActiveBuilder() {
    return this.getRegisteredPlugins().find(
      plugin => plugin.kind === 'builder' && this.activeCache.get(plugin.id) !== false
    ) || null;
  }

  setActiveState(id: string, isActive: boolean) {
    this.activeCache.set(id, isActive);
  }

  isPluginActive(id: string) {
    return this.activeCache.get(id) !== false;
  }
}

export const pluginRegistry = new PluginRegistry();

export async function fetchPluginActiveState(pluginId: string, fallback = true): Promise<boolean> {
  try {
    const res = await fetch('/api/plugins', { cache: 'no-store' });
    if (!res.ok) return fallback;

    const data = await res.json();
    const plugin = data?.plugins?.find((item: { id: string; isActive: boolean }) => item.id === pluginId);
    const isActive = plugin ? plugin.isActive !== false : fallback;
    pluginRegistry.setActiveState(pluginId, isActive);
    return isActive;
  } catch (error) {
    console.error(`Failed to fetch plugin state for ${pluginId}:`, error);
    return fallback;
  }
}
