import { NextResponse } from 'next/server';
import { hooks } from '@/lib/hooks';
import { pluginLoader } from '@/lib/pluginLoader';
import { permissionManager } from '@/lib/permissions';
import { safeMode } from '@/lib/safeMode';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

async function requireAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!(await userCan(user, 'manage_settings'));
  } catch {
    return false;
  }
}

/**
 * GET — Kiểm tra sức khỏe hệ thống Extension
 */
export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize hooks to ensure active plugins are loaded
    await hooks.ensureInitialized();

    // Hook System stats
    const registeredHooks = hooks.getRegisteredHooks();
    const hookErrors = hooks.getErrorLog(20);

    // Plugin stats
    const pluginsDir = path.join(process.cwd(), 'src', 'plugins');
    const themesDir = path.join(process.cwd(), 'src', 'themes');
    
    let pluginCount = 0;
    let themeCount = 0;
    let totalPluginSize = 0;
    let totalThemeSize = 0;

    if (fs.existsSync(pluginsDir)) {
      const folders = fs.readdirSync(pluginsDir, { withFileTypes: true }).filter(d => d.isDirectory());
      pluginCount = folders.filter(f => {
        return fs.existsSync(path.join(pluginsDir, f.name, 'manifest.json'));
      }).length;
      totalPluginSize = getDirSize(pluginsDir);
    }

    if (fs.existsSync(themesDir)) {
      const folders = fs.readdirSync(themesDir, { withFileTypes: true }).filter(d => d.isDirectory());
      themeCount = folders.filter(f => {
        return fs.existsSync(path.join(themesDir, f.name, 'theme.json'));
      }).length;
      totalThemeSize = getDirSize(themesDir);
    }

    // Safe mode status
    const safeModeStatus = await safeMode.getStatus();

    // Permission stats
    const allPermissions = permissionManager.getAllPermissions();

    // Storage stats
    const storageDir = path.join(process.cwd(), 'storage');
    let storageSize = 0;
    let backupCount = 0;
    
    if (fs.existsSync(storageDir)) {
      storageSize = getDirSize(storageDir);
    }

    // Count backups
    if (fs.existsSync(pluginsDir)) {
      backupCount += fs.readdirSync(pluginsDir).filter(f => f.includes('_backup_')).length;
    }
    if (fs.existsSync(themesDir)) {
      backupCount += fs.readdirSync(themesDir).filter(f => f.includes('_backup_')).length;
    }

    return NextResponse.json({
      success: true,
      health: {
        status: safeModeStatus.active ? 'safe-mode' : (hookErrors.length > 0 ? 'warning' : 'healthy'),
        timestamp: new Date().toISOString(),
      },
      hooks: {
        enabled: hooks.enabled,
        totalActions: registeredHooks.actions.length,
        totalFilters: registeredHooks.filters.length,
        totalCallbacks: registeredHooks.actions.reduce((sum, a) => sum + a.callbacks, 0) +
                        registeredHooks.filters.reduce((sum, f) => sum + f.callbacks, 0),
        recentErrors: hookErrors,
        registeredHooks,
      },
      plugins: {
        total: pluginCount,
        totalSize: totalPluginSize,
        totalSizeFormatted: formatBytes(totalPluginSize),
      },
      themes: {
        total: themeCount,
        totalSize: totalThemeSize,
        totalSizeFormatted: formatBytes(totalThemeSize),
      },
      safeMode: safeModeStatus,
      permissions: allPermissions,
      storage: {
        totalSize: storageSize,
        totalSizeFormatted: formatBytes(storageSize),
        backupCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

function getDirSize(dirPath: string): number {
  let totalSize = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += getDirSize(fullPath);
      } else if (entry.isFile()) {
        try {
          totalSize += fs.statSync(fullPath).size;
        } catch { /* noop */ }
      }
    }
  } catch { /* noop */ }
  return totalSize;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
