/**
 * Lexi CMS — Plugin Loader
 * 
 * Scan, validate, load và quản lý runtime code của plugins.
 * Supports:
 * - Hook registrations (qua hooks.ts trong thư mục plugin)
 * - Widget declarations (inject vào frontend)
 * - Admin page declarations
 * - API route declarations
 */

import fs from 'fs';
import path from 'path';
import { hooks } from './hooks';
import { hookRegistry } from './generated/hook-registry';

// ─── Interfaces ─────────────────────────────────────────────────

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
  changelog: Array<{ version: string; date: string; changes: string[] }>;

  // Runtime code declarations (optional)
  hooks?: string;                    // Relative path to hooks file (e.g. 'hooks.ts')
  widgets?: WidgetDeclaration[];
  adminPages?: AdminPageDeclaration[];
  apiRoutes?: ApiRouteDeclaration[];
  
  // Permissions
  permissions?: string[];
  
  // Safe mode
  safeMode?: {
    critical?: boolean;              // true = cannot be disabled in safe mode
    loadOrder?: number;              // Lower = load first (default: 10)
  };
}

export interface WidgetDeclaration {
  id: string;
  component: string;                // Relative path to component file
  position: 'body-end' | 'header' | 'footer' | 'sidebar';
  description?: string;
}

export interface AdminPageDeclaration {
  path: string;                      // Admin route path
  component: string;                 // Relative path to component file
  label: string;                     // Menu label
}

export interface ApiRouteDeclaration {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;                      // API route path
  handler: string;                   // Relative path to handler file
}

export interface LoadedPlugin {
  manifest: PluginManifest;
  isActive: boolean;
  loadedAt: Date;
  hooksRegistered: number;
  errors: string[];
}

// ─── Plugin Loader ──────────────────────────────────────────────

class PluginLoader {
  private loadedPlugins: Map<string, LoadedPlugin> = new Map();
  private _initialized: boolean = false;
  private _initializingPromise: Promise<void> | null = null;
  private _reloadingPromise: Promise<void> | null = null;

  async ensureInitialized(): Promise<void> {
    if (this._initialized) return;
    if (this._initializingPromise) return this._initializingPromise;
    
    this._initializingPromise = (async () => {
      try {
        const { prisma } = await import('./prisma');
        const settings = await prisma.setting.findMany();
        const settingsMap = settings.reduce((acc: any, s: any) => { acc[s.key] = s.value; return acc; }, {});
        await this.loadAll(settingsMap);
      } catch (e) {
        console.warn('[PluginLoader] DB not ready for ensureInitialized');
      } finally {
        this._initializingPromise = null;
      }
    })();
    return this._initializingPromise;
  }

  async reloadAll(): Promise<void> {
    if (this._reloadingPromise) return this._reloadingPromise;

    this._reloadingPromise = (async () => {
      try {
        if (this._initializingPromise) {
          await this._initializingPromise;
        }

        const { hooks } = await import('./hooks');
        hooks.clearAll();

        this.loadedPlugins.clear();
        this._initialized = false;
        this._initializingPromise = null;

        await this.ensureInitialized();
      } finally {
        this._reloadingPromise = null;
      }
    })();

    return this._reloadingPromise;
  }

  /**
   * Scan src/plugins/ và load tất cả plugin đang active
   */
  async loadAll(settings: Record<string, string>): Promise<void> {
    if (this._initialized) return;

    const pluginsDir = path.join(process.cwd(), 'src', 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      this._initialized = true;
      return;
    }

    const folders = fs.readdirSync(pluginsDir, { withFileTypes: true })
      .filter(d => d.isDirectory());

    // Collect manifests with load order
    const manifests: { manifest: PluginManifest; folderName: string }[] = [];

    for (const folder of folders) {
      const manifestPath = path.join(pluginsDir, folder.name, 'manifest.json');
      if (!fs.existsSync(manifestPath)) continue;

      try {
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        const manifest: PluginManifest = JSON.parse(raw);
        if (manifest.id === folder.name) {
          manifests.push({ manifest, folderName: folder.name });
        }
      } catch (err) {
        console.error(`[PluginLoader] Failed to parse manifest for "${folder.name}":`, err);
      }
    }

    // Sort by loadOrder (lower first)
    manifests.sort((a, b) => {
      const orderA = a.manifest.safeMode?.loadOrder ?? 10;
      const orderB = b.manifest.safeMode?.loadOrder ?? 10;
      return orderA - orderB;
    });

    // Load active plugins
    for (const { manifest } of manifests) {
      const isActive = settings[manifest.settingKey] !== 'false';
      if (isActive) {
        await this.loadPlugin(manifest);
      } else {
        this.loadedPlugins.set(manifest.id, {
          manifest,
          isActive: false,
          loadedAt: new Date(),
          hooksRegistered: 0,
          errors: [],
        });
      }
    }

    this._initialized = true;
    console.log(`[PluginLoader] Loaded ${this.getActivePlugins().length} active plugins`);
  }

  /**
   * Load single plugin — đọc hooks.ts và đăng ký hooks
   */
  async loadPlugin(manifest: PluginManifest): Promise<LoadedPlugin> {
    const errors: string[] = [];
    let hooksRegistered = 0;

    // Load hooks file if declared
    if (manifest.hooks) {
      try {
        const pluginHooksModule = hookRegistry[manifest.id];
        if (pluginHooksModule) {
          if (typeof pluginHooksModule.registerHooks === 'function') {
            pluginHooksModule.registerHooks(hooks);
            hooksRegistered = hooks.getPluginHooks(manifest.id).length;
          } else {
            console.warn(`[PluginLoader] Plugin "${manifest.id}" missing exported registerHooks(hooks) function in its hook file.`);
            errors.push(`Missing exported registerHooks() function in hook file.`);
          }
        } else {
           console.warn(`[PluginLoader] Plugin "${manifest.id}" hooks module not found in registry (Did you run 'npm run generate'?).`);
        }
      } catch (err: any) {
        errors.push(`Failed to load hooks: ${err.message}`);
        console.error(`[PluginLoader] Failed to load hooks for "${manifest.id}":`, err);
      }
    }

    const loaded: LoadedPlugin = {
      manifest,
      isActive: true,
      loadedAt: new Date(),
      hooksRegistered,
      errors,
    };

    this.loadedPlugins.set(manifest.id, loaded);
    return loaded;
  }

  /**
   * Unload plugin — gỡ tất cả hooks của plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    hooks.removeAllHooks(pluginId);
    const loaded = this.loadedPlugins.get(pluginId);
    if (loaded) {
      loaded.isActive = false;
      loaded.hooksRegistered = 0;
    }
  }

  // ─── Widgets ──────────────────────────────────────────────────

  /**
   * Lấy tất cả widgets đang active theo position
   */
  getWidgets(position?: string): (WidgetDeclaration & { pluginId: string })[] {
    const result: (WidgetDeclaration & { pluginId: string })[] = [];

    for (const [pluginId, loaded] of this.loadedPlugins) {
      if (!loaded.isActive || !loaded.manifest.widgets) continue;
      for (const widget of loaded.manifest.widgets) {
        if (!position || widget.position === position) {
          result.push({ ...widget, pluginId });
        }
      }
    }

    return result;
  }

  /**
   * Lấy tất cả admin pages từ plugins
   */
  getAdminPages(): (AdminPageDeclaration & { pluginId: string })[] {
    const result: (AdminPageDeclaration & { pluginId: string })[] = [];

    for (const [pluginId, loaded] of this.loadedPlugins) {
      if (!loaded.isActive || !loaded.manifest.adminPages) continue;
      for (const page of loaded.manifest.adminPages) {
        result.push({ ...page, pluginId });
      }
    }

    return result;
  }

  // ─── Query ────────────────────────────────────────────────────

  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  getAllPlugins(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  getActivePlugins(): LoadedPlugin[] {
    return this.getAllPlugins().filter(p => p.isActive);
  }

  get initialized(): boolean {
    return this._initialized;
  }

  // ─── Safe Mode ────────────────────────────────────────────────

  /**
   * Enter safe mode — unload tất cả plugin không phải critical
   */
  async enterSafeMode(): Promise<string[]> {
    const disabled: string[] = [];

    for (const [pluginId, loaded] of this.loadedPlugins) {
      if (!loaded.isActive) continue;
      if (loaded.manifest.safeMode?.critical) continue; // Giữ critical plugins

      await this.unloadPlugin(pluginId);
      disabled.push(pluginId);
    }

    return disabled;
  }

  /**
   * Reset loader (dùng cho testing)
   */
  reset(): void {
    this.loadedPlugins.clear();
    this._initialized = false;
  }

  // ─── Private ──────────────────────────────────────────────────

  private countPluginHooks(pluginId: string): number {
    return hooks.getPluginHooks(pluginId).length;
  }
}

// Singleton
export const pluginLoader = new PluginLoader();
