import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { contentFolders } from '@/lib/content/paths';
import { scanExtractedFiles, validateExtractedPaths } from '@/lib/zipSecurity';
import { extractZip } from '@/lib/updates/zip';

type RuntimePackageType = 'PLUGIN' | 'THEME';

type InstallRuntimePackageInput = {
  file: File;
  type: RuntimePackageType;
  maxSizeBytes: number;
  manifestFile: 'manifest.json' | 'theme.json';
  requiredFields: string[];
  requiredFiles?: string[];
};

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function safeId(id: unknown) {
  return typeof id === 'string' && /^[a-z0-9-]+$/.test(id);
}

async function pathExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(source: string, destination: string) {
  await fs.cp(source, destination, { recursive: true, force: true });
}

async function findManifestRoot(extractDir: string, manifestFile: string) {
  const rootManifest = path.join(extractDir, manifestFile);
  if (await pathExists(rootManifest)) return { manifestPath: rootManifest, packageRoot: extractDir };

  const entries = await fs.readdir(extractDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const packageRoot = path.join(extractDir, entry.name);
    const manifestPath = path.join(packageRoot, manifestFile);
    if (await pathExists(manifestPath)) return { manifestPath, packageRoot };
  }

  return null;
}

function getTargetBase(type: RuntimePackageType) {
  return type === 'PLUGIN' ? contentFolders.plugins() : contentFolders.themes();
}

function validateDependencies(manifest: any) {
  const errors: string[] = [];
  for (const key of ['requiresPlugins', 'requiresThemes']) {
    if (manifest[key] && !Array.isArray(manifest[key])) {
      errors.push(`${key} phải là array nếu được khai báo.`);
    }
  }
  if (manifest.requiresCore && typeof manifest.requiresCore !== 'string') {
    errors.push('requiresCore phải là string nếu được khai báo.');
  }
  return errors;
}

export async function installRuntimePackage(input: InstallRuntimePackageInput) {
  if (!input.file.name.endsWith('.zip')) throw new Error('Chỉ hỗ trợ file .zip!');
  if (input.file.size > input.maxSizeBytes) throw new Error(`File quá lớn! Giới hạn ${Math.round(input.maxSizeBytes / 1024 / 1024)}MB.`);

  const jobKey = `${input.type.toLowerCase()}-${Date.now()}`;
  const workDir = path.join(contentFolders.upgradeTemp(), jobKey);
  const extractDir = path.join(workDir, 'extract');
  const stagedRoot = path.join(workDir, 'staged');
  const uploadPath = path.join(workDir, 'upload.zip');
  let backupDir: string | null = null;
  let targetDir: string | null = null;
  let rollbackDir: string | null = null;

  await fs.mkdir(extractDir, { recursive: true });
  await fs.mkdir(stagedRoot, { recursive: true });

  try {
    const buffer = Buffer.from(await input.file.arrayBuffer());
    await fs.writeFile(uploadPath, buffer);
    await extractZip(uploadPath, extractDir, input.type === 'THEME' ? 60000 : 30000);

    const pathValidation = validateExtractedPaths(extractDir);
    if (!pathValidation.valid) throw new Error(`Phát hiện vấn đề bảo mật: ${pathValidation.violations[0]}`);

    const scanResult = scanExtractedFiles(extractDir);
    if (!scanResult.safe) throw new Error(`Phát hiện vấn đề bảo mật: ${scanResult.errors[0]}`);

    const found = await findManifestRoot(extractDir, input.manifestFile);
    if (!found) throw new Error(`File ZIP không chứa ${input.manifestFile}!`);

    let manifest: any;
    try {
      manifest = JSON.parse(await fs.readFile(found.manifestPath, 'utf8'));
    } catch {
      throw new Error(`${input.manifestFile} không hợp lệ!`);
    }

    const missing = input.requiredFields.filter((field) => !manifest[field]);
    if (missing.length) throw new Error(`${input.manifestFile} thiếu trường bắt buộc: ${missing.join(', ')}`);
    if (!safeId(manifest.id)) throw new Error('Package ID chỉ được chứa chữ thường, số và dấu gạch ngang (a-z, 0-9, -).');

    const dependencyErrors = validateDependencies(manifest);
    if (dependencyErrors.length) throw new Error(dependencyErrors[0]);

    for (const requiredFile of input.requiredFiles || []) {
      if (!fsSync.existsSync(path.join(found.packageRoot, requiredFile))) {
        throw new Error(`${input.type === 'THEME' ? 'Theme' : 'Plugin'} cần có file ${requiredFile}!`);
      }
    }

    const targetBase = getTargetBase(input.type);
    await fs.mkdir(targetBase, { recursive: true });
    targetDir = path.join(targetBase, manifest.id);
    const stagedPackageDir = path.join(stagedRoot, manifest.id);
    await copyDir(found.packageRoot, stagedPackageDir);

    const existingPackage = await prisma.installedPackage.findUnique({
      where: { type_slug: { type: input.type, slug: manifest.id } },
    });

    if (await pathExists(targetDir)) {
      backupDir = path.join(contentFolders.backups(), `${input.type.toLowerCase()}-${manifest.id}-${timestamp()}`);
      await fs.mkdir(backupDir, { recursive: true });
      await copyDir(targetDir, path.join(backupDir, manifest.id));
      await fs.writeFile(path.join(backupDir, 'manifest.json'), JSON.stringify({ packageType: input.type, packageSlug: manifest.id, version: existingPackage?.version || manifest.version, createdAt: new Date().toISOString() }, null, 2));
      rollbackDir = `${targetDir}.rollback-${Date.now()}`;
      await fs.rename(targetDir, rollbackDir);
    }

    await fs.rename(stagedPackageDir, targetDir);

    const installedPackage = await prisma.installedPackage.upsert({
      where: { type_slug: { type: input.type, slug: manifest.id } },
      update: {
        name: manifest.name,
        version: manifest.version,
        status: 'INSTALLED',
        source: 'CONTENT',
        manifestJson: JSON.stringify(manifest, null, 2),
      },
      create: {
        type: input.type,
        slug: manifest.id,
        name: manifest.name,
        version: manifest.version,
        status: 'INSTALLED',
        source: 'CONTENT',
        manifestJson: JSON.stringify(manifest, null, 2),
      },
    });

    let backupRecord = null;
    if (backupDir) {
      backupRecord = await prisma.packageBackup.create({
        data: {
          packageId: installedPackage.id,
          packageSlug: manifest.id,
          packageType: input.type,
          version: existingPackage?.version || manifest.version,
          backupPath: backupDir,
        },
      });
    }

    if (rollbackDir) await fs.rm(rollbackDir, { recursive: true, force: true });

    return {
      manifest,
      installedPackage,
      installedPath: targetDir,
      backupPath: backupDir,
      backupRecord,
      securityWarnings: scanResult.warnings,
    };
  } catch (error) {
    if (targetDir) await fs.rm(targetDir, { recursive: true, force: true }).catch(() => undefined);
    if (rollbackDir && await pathExists(rollbackDir)) await fs.rename(rollbackDir, targetDir!).catch(() => undefined);
    throw error;
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
