import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { contentFolders } from '@/lib/content/paths';
import { validateExtractedPaths } from '@/lib/zipSecurity';
import { validatePluginManifest } from '@/lib/plugins/validator';
import { validateThemeManifest } from '@/lib/themes/validator';

type RestorableType = 'PLUGIN' | 'THEME';

type RestoreAction = 'dry-run' | 'restore';

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function pathExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function isRestorableType(type: string): type is RestorableType {
  return type === 'PLUGIN' || type === 'THEME';
}

function assertInside(parent: string, child: string) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function targetBaseFor(type: RestorableType) {
  return type === 'PLUGIN' ? contentFolders.plugins() : contentFolders.themes();
}

function manifestFileFor(type: RestorableType) {
  return type === 'PLUGIN' ? 'manifest.json' : 'theme.json';
}

async function copyDir(source: string, destination: string) {
  await fs.cp(source, destination, { recursive: true, force: true });
}

async function readBackupMeta(backupPath: string) {
  const metaPath = path.join(backupPath, 'manifest.json');
  if (!(await pathExists(metaPath))) return null;
  try {
    return JSON.parse(await fs.readFile(metaPath, 'utf8'));
  } catch {
    return null;
  }
}

async function readAndValidateManifest(type: RestorableType, payloadDir: string, folderName: string) {
  const manifestFile = manifestFileFor(type);
  const manifestPath = path.join(payloadDir, manifestFile);
  if (!(await pathExists(manifestPath))) {
    return { valid: false, errors: [`Backup payload missing ${manifestFile}`], warnings: [] as string[], manifest: null as any };
  }

  const manifestRaw = await fs.readFile(manifestPath, 'utf8');
  if (type === 'PLUGIN') return validatePluginManifest({ folderName, manifestRaw, manifestPath });
  return validateThemeManifest({ folderName, manifestRaw, manifestPath });
}

export async function describeBackup(backupId: number) {
  const backup = await prisma.packageBackup.findUnique({
    where: { id: backupId },
    include: { installedPackage: true },
  });
  if (!backup) throw new Error('Backup không tồn tại.');

  const reasons: string[] = [];
  const backupExists = await pathExists(backup.backupPath);
  const insideBackups = assertInside(contentFolders.backups(), backup.backupPath);
  const restorableType = isRestorableType(backup.packageType);
  const payloadPath = restorableType ? path.join(backup.backupPath, backup.packageSlug) : null;
  const payloadExists = payloadPath ? await pathExists(payloadPath) : false;

  if (!restorableType) reasons.push('Chỉ hỗ trợ restore PLUGIN/THEME package folders trong milestone này.');
  if (!backupExists) reasons.push('Đường dẫn backup không còn tồn tại.');
  if (!insideBackups) reasons.push('Backup path nằm ngoài content/backups, bị chặn vì an toàn.');
  if (restorableType && !payloadExists) reasons.push(`Backup thiếu thư mục payload ${backup.packageSlug}.`);

  return {
    ...backup,
    backupExists,
    payloadExists,
    canRestore: reasons.length === 0,
    restoreBlockReason: reasons[0] || null,
    backupMeta: backupExists ? await readBackupMeta(backup.backupPath) : null,
  };
}

export async function listRestorableBackups(take = 20) {
  const backups = await prisma.packageBackup.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    include: { installedPackage: true },
  });

  return Promise.all(backups.map((backup) => describeBackup(backup.id)));
}

export async function restorePackageBackup(input: { backupId: number; action: RestoreAction; createdById?: number | null }) {
  const described = await describeBackup(input.backupId);
  if (!described.canRestore) throw new Error(described.restoreBlockReason || 'Backup không thể restore.');
  if (!isRestorableType(described.packageType)) throw new Error('Package type không hỗ trợ restore.');

  const packageType = described.packageType;
  const packageSlug = described.packageSlug;
  const payloadDir = path.join(described.backupPath, packageSlug);
  const targetBase = targetBaseFor(packageType);
  const targetDir = path.join(targetBase, packageSlug);

  if (!assertInside(targetBase, targetDir)) throw new Error('Target restore path không an toàn.');

  const pathValidation = validateExtractedPaths(payloadDir);
  if (!pathValidation.valid) throw new Error(`Backup payload không an toàn: ${pathValidation.violations[0]}`);

  const validation = await readAndValidateManifest(packageType, payloadDir, packageSlug);
  if (!validation.valid || !validation.manifest) {
    throw new Error(validation.errors[0] || 'Manifest trong backup không hợp lệ.');
  }

  if (validation.manifest.id !== packageSlug) {
    throw new Error(`Manifest ID (${validation.manifest.id}) không khớp backup slug (${packageSlug}).`);
  }

  if (input.action === 'dry-run') {
    return {
      success: true,
      dryRun: true,
      backupId: input.backupId,
      packageType,
      packageSlug,
      version: validation.manifest.version,
      warnings: validation.warnings,
      message: `Dry-run OK: có thể restore ${packageType} ${packageSlug} từ backup v${described.version}.`,
    };
  }

  const job = await prisma.updateJob.create({
    data: {
      type: packageType,
      targetSlug: packageSlug,
      fromVersion: described.installedPackage?.version || null,
      toVersion: described.version,
      status: 'RUNNING',
      startedAt: new Date(),
      createdById: input.createdById || undefined,
      log: `Restore backup #${input.backupId} from ${described.backupPath}`,
    },
  });

  let rollbackDir: string | null = null;
  let preRestoreBackupPath: string | null = null;

  try {
    await fs.mkdir(targetBase, { recursive: true });

    const hadExistingTarget = await pathExists(targetDir);
    if (hadExistingTarget) {
      preRestoreBackupPath = path.join(contentFolders.backups(), `${packageType.toLowerCase()}-${packageSlug}-pre-restore-${timestamp()}`);
      await fs.mkdir(preRestoreBackupPath, { recursive: true });
      await copyDir(targetDir, path.join(preRestoreBackupPath, packageSlug));
      await fs.writeFile(path.join(preRestoreBackupPath, 'manifest.json'), JSON.stringify({
        packageType,
        packageSlug,
        version: described.installedPackage?.version || validation.manifest.version,
        createdAt: new Date().toISOString(),
        reason: `pre-restore snapshot before restoring backup #${input.backupId}`,
      }, null, 2));

      rollbackDir = `${targetDir}.restore-rollback-${Date.now()}`;
      await fs.rename(targetDir, rollbackDir);
    }

    await copyDir(payloadDir, targetDir);

    const installedPackage = await prisma.installedPackage.upsert({
      where: { type_slug: { type: packageType, slug: packageSlug } },
      update: {
        name: validation.manifest.name,
        version: validation.manifest.version,
        source: 'CONTENT',
        status: described.installedPackage?.status || 'INSTALLED',
        manifestJson: JSON.stringify(validation.manifest, null, 2),
      },
      create: {
        type: packageType,
        slug: packageSlug,
        name: validation.manifest.name,
        version: validation.manifest.version,
        source: 'CONTENT',
        status: 'INSTALLED',
        manifestJson: JSON.stringify(validation.manifest, null, 2),
      },
    });

    let preRestoreBackupRecord = null;
    if (preRestoreBackupPath) {
      preRestoreBackupRecord = await prisma.packageBackup.create({
        data: {
          packageId: installedPackage.id,
          packageSlug,
          packageType,
          version: described.installedPackage?.version || validation.manifest.version,
          backupPath: preRestoreBackupPath,
        },
      });
    }

    if (rollbackDir) await fs.rm(rollbackDir, { recursive: true, force: true });

    await prisma.updateJob.update({
      where: { id: job.id },
      data: {
        status: 'SUCCESS',
        completedAt: new Date(),
        log: `${job.log}\nRestore completed. Pre-restore backup: ${preRestoreBackupPath || 'none'}`,
      },
    });

    return {
      success: true,
      dryRun: false,
      jobId: job.id,
      backupId: input.backupId,
      packageType,
      packageSlug,
      version: validation.manifest.version,
      preRestoreBackup: preRestoreBackupRecord,
      warnings: validation.warnings,
      message: `Đã restore ${packageType} ${packageSlug} về backup v${described.version}.`,
    };
  } catch (error: any) {
    let rolledBack = false;
    try {
      await fs.rm(targetDir, { recursive: true, force: true }).catch(() => undefined);
      if (rollbackDir && await pathExists(rollbackDir)) {
        await fs.rename(rollbackDir, targetDir);
        rolledBack = true;
      }
    } catch {
      rolledBack = false;
    }

    await prisma.updateJob.update({
      where: { id: job.id },
      data: {
        status: rolledBack ? 'ROLLED_BACK' : 'FAILED',
        completedAt: new Date(),
        error: error.message || 'Restore failed.',
        log: `${job.log}\nRestore failed. Rolled back: ${rolledBack ? 'yes' : 'no'}`,
      },
    });

    throw error;
  }
}
