import fs from 'fs';
import path from 'path';
import { validatePluginManifest } from '../src/lib/plugins/validator';

function generateRegistry() {
  const pluginsDir = path.join(process.cwd(), 'src', 'plugins');
  const generatedDir = path.join(process.cwd(), 'src', 'lib', 'generated');
  const registryFile = path.join(generatedDir, 'hook-registry.ts');

  if (!fs.existsSync(pluginsDir)) {
    console.warn('[Generator] No plugins directory found.');
    writeRegistryFile(registryFile, []);
    return;
  }

  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  const folders = fs.readdirSync(pluginsDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  const activeHooks: { id: string, importPath: string, fileName: string }[] = [];

  for (const folder of folders) {
    const folderName = folder.name;
    const manifestPath = path.join(pluginsDir, folderName, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const result = validatePluginManifest({ folderName, manifestRaw: raw });

      if (result.valid && result.manifest) {
        if (result.manifest.hooks) {
          const hooksFileRelative = result.manifest.hooks;
          const hooksFilePath = path.join(pluginsDir, folderName, hooksFileRelative);
          
          if (fs.existsSync(hooksFilePath)) {
            const cleanFileName = hooksFileRelative.replace(/\.(ts|tsx)$/, '');
            activeHooks.push({
              id: result.manifest.id,
              importPath: `@/plugins/${folderName}/${cleanFileName}`,
              fileName: `hooks_${folderName.replace(/[^a-zA-Z0-9]/g, '_')}`
            });
          } else {
            console.warn(`[Generator] Hook file "${hooksFileRelative}" declared by plugin "${folderName}" not found. Skipping hook generation.`);
          }
        }
      } else {
        // Plugin is invalid
        try {
          // Attempt to parse manually just to check if it has 'hooks'
          const parsed = JSON.parse(raw);
          if (parsed.hooks) {
            console.warn(`[Generator] Plugin "${folderName}" has hooks but manifest is INVALID. Skipping hook generation. Errors: ${result.errors.join(', ')}`);
          }
        } catch {
          // Ignore parse errors here
        }
      }
    } catch (err) {
      console.error(`[Generator] Error parsing manifest for "${folderName}":`, err);
    }
  }

  writeRegistryFile(registryFile, activeHooks);
}

function writeRegistryFile(registryFile: string, hooks: { id: string, importPath: string, fileName: string }[]) {
  const imports = hooks.map(h => `import * as ${h.fileName} from '${h.importPath}';`).join('\n');
  const properties = hooks.map(h => `  '${h.id}': ${h.fileName},`).join('\n');

  const content = `// AUTO-GENERATED FILE. DO NOT EDIT.

${imports}

export const hookRegistry: Record<string, any> = {
${properties}
} as const;
`;

  fs.writeFileSync(registryFile, content, 'utf-8');
  console.log(`[Generator] Successfully generated hook registry with ${hooks.length} plugins.`);
}

generateRegistry();
