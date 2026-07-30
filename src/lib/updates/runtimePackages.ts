import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { contentFolders } from '@/lib/content/paths';
import { validatePluginManifest } from '@/lib/plugins/validator';
import { validateThemeManifest } from '@/lib/themes/validator';
import type { PluginManifest } from '@/lib/plugins/manifest.schema';
import type { ThemeManifest } from '@/lib/themes/manifest.schema';

type PackageSource = 'BUILT_IN' | 'CONTENT';

export interface RuntimeScanItem<T> {
  manifest: T;
  warnings: string[];
  source: PackageSource;
  folderName: string;
  components?: string[];
  canActivate: boolean;
  activationBlockReason?: string;
}

export interface RuntimeInvalidItem {
  folderName: string;
  manifestId?: string;
  errors: string[];
  warnings: string[];
  source: PackageSource;
}

function readJsonId(raw: string) {
  try {
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
    return typeof parsed?.id === 'string' ? parsed.id : undefined;
  } catch {
    return undefined;
  }
}

function listFolders(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
}

export function scanPluginDirectory(baseDir: string, source: PackageSource) {
  const validPluginsData: RuntimeScanItem<PluginManifest>[] = [];
  const invalidPlugins: RuntimeInvalidItem[] = [];

  for (const folder of listFolders(baseDir)) {
    const folderName = folder.name;
    const manifestPath = path.join(baseDir, folderName, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
      const result = validatePluginManifest({ folderName, manifestRaw, manifestPath });
      if (result.valid && result.manifest) {
        const runtimeHookWarning = source === 'CONTENT' && result.manifest.hooks
          ? 'Runtime plugin hooks from content/plugins are not loaded yet; metadata activation only.'
          : undefined;
        validPluginsData.push({
          manifest: result.manifest,
          warnings: runtimeHookWarning ? [...result.warnings, runtimeHookWarning] : result.warnings,
          source,
          folderName,
          canActivate: true,
        });
      } else {
        invalidPlugins.push({
          folderName,
          manifestId: readJsonId(manifestRaw),
          errors: result.errors,
          warnings: result.warnings,
          source,
        });
      }
    } catch (err: any) {
      invalidPlugins.push({ folderName, errors: [`Failed to read manifest: ${err.message}`], warnings: [], source });
    }
  }

  return { validPluginsData, invalidPlugins };
}

export function scanThemeDirectory(baseDir: string, source: PackageSource) {
  const validThemesData: RuntimeScanItem<ThemeManifest>[] = [];
  const invalidThemes: RuntimeInvalidItem[] = [];

  for (const folder of listFolders(baseDir)) {
    const folderName = folder.name;
    const manifestPath = path.join(baseDir, folderName, 'theme.json');
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const result = validateThemeManifest({ folderName, manifestRaw: raw, manifestPath });
      if (result.valid && result.manifest) {
        const themeDir = path.join(baseDir, folderName);
        const components = fs.readdirSync(themeDir)
          .filter((file) => file.endsWith('.tsx') || file.endsWith('.ts'))
          .map((file) => file.replace(/\.(tsx|ts)$/, ''));
        const rawManifest = JSON.parse(raw.replace(/^\uFEFF/, ''));
        const supportsStaticHtml = rawManifest.renderMode === 'static-html' || rawManifest.compiledThemeFallback;
        const canActivate = source === 'BUILT_IN' || supportsStaticHtml;
        validThemesData.push({
          manifest: result.manifest,
          warnings: source === 'CONTENT' && !canActivate
            ? [...result.warnings, 'Runtime TSX themes are installed but cannot be activated until runtime rendering/rebuild support is added.']
            : result.warnings,
          source,
          folderName,
          components,
          canActivate,
          activationBlockReason: canActivate ? undefined : 'Runtime TSX theme cannot be activated safely yet. Use a built-in theme or a runtime theme with renderMode/static fallback.',
        });
      } else {
        invalidThemes.push({
          folderName,
          manifestId: readJsonId(raw),
          errors: result.errors,
          warnings: result.warnings,
          source,
        });
      }
    } catch (err: any) {
      invalidThemes.push({ folderName, errors: [`Failed to parse theme.json for "${folderName}": ${err.message}`], warnings: [], source });
    }
  }

  return { validThemesData, invalidThemes };
}

export function scanAllPlugins() {
  const builtIn = scanPluginDirectory(path.join(process.cwd(), 'src', 'plugins'), 'BUILT_IN');
  const runtime = scanPluginDirectory(contentFolders.plugins(), 'CONTENT');
  const byId = new Map<string, RuntimeScanItem<PluginManifest>>();
  for (const item of [...builtIn.validPluginsData, ...runtime.validPluginsData]) byId.set(item.manifest.id, item);
  return { validPluginsData: [...byId.values()], invalidPlugins: [...builtIn.invalidPlugins, ...runtime.invalidPlugins] };
}

export function scanAllThemes() {
  const builtIn = scanThemeDirectory(path.join(process.cwd(), 'src', 'themes'), 'BUILT_IN');
  const runtime = scanThemeDirectory(contentFolders.themes(), 'CONTENT');
  const byId = new Map<string, RuntimeScanItem<ThemeManifest>>();
  for (const item of [...builtIn.validThemesData, ...runtime.validThemesData]) byId.set(item.manifest.id, item);
  return { validThemesData: [...byId.values()], invalidThemes: [...builtIn.invalidThemes, ...runtime.invalidThemes] };
}

export async function syncInstalledPackage(input: {
  type: 'PLUGIN' | 'THEME';
  slug: string;
  name: string;
  version: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'INSTALLED' | 'BROKEN';
  source: 'BUILT_IN' | 'CONTENT';
  manifest: unknown;
}) {
  return prisma.installedPackage.upsert({
    where: { type_slug: { type: input.type, slug: input.slug } },
    update: {
      name: input.name,
      version: input.version,
      source: input.source,
      status: input.status || 'INSTALLED',
      manifestJson: JSON.stringify(input.manifest, null, 2),
    },
    create: {
      type: input.type,
      slug: input.slug,
      name: input.name,
      version: input.version,
      source: input.source,
      status: input.status || 'INSTALLED',
      manifestJson: JSON.stringify(input.manifest, null, 2),
    },
  });
}
