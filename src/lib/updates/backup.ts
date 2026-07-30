import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { prisma } from '@/lib/prisma';
import { contentFolders, getContentPath } from '@/lib/content/paths';

interface BackupInput {
  packageId?: number | null;
  packageSlug: string;
  packageType: 'CORE' | 'PLUGIN' | 'THEME';
  version: string;
  jobId?: string;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function copyIfExists(source: string, destination: string) {
  try {
    await fs.access(source);
    await fs.cp(source, destination, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

function runPgDump(outputFile: string) {
  return new Promise<void>((resolve, reject) => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      reject(new Error('DATABASE_URL is not configured; cannot create database backup.'));
      return;
    }

    const child = spawn('pg_dump', [databaseUrl, '--file', outputFile, '--format', 'plain', '--no-owner'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`pg_dump failed to start: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pg_dump exited with code ${code}: ${stderr || 'no stderr output'}`));
      }
    });
  });
}

export async function createPreUpdateBackup(input: BackupInput) {
  await fs.mkdir(contentFolders.backups(), { recursive: true });

  const backupName = `${input.packageType.toLowerCase()}-${input.packageSlug}-${timestamp()}`;
  const backupDir = path.join(contentFolders.backups(), backupName);
  await fs.mkdir(backupDir, { recursive: true });

  const databaseDumpPath = path.join(backupDir, 'database.sql');
  await runPgDump(databaseDumpPath);

  const contentBackupDir = path.join(backupDir, 'content');
  await fs.mkdir(contentBackupDir, { recursive: true });

  const copied = {
    uploads: await copyIfExists(contentFolders.uploads(), path.join(contentBackupDir, 'uploads')),
    plugins: await copyIfExists(contentFolders.plugins(), path.join(contentBackupDir, 'plugins')),
    themes: await copyIfExists(contentFolders.themes(), path.join(contentBackupDir, 'themes')),
  };

  const manifest = {
    packageSlug: input.packageSlug,
    packageType: input.packageType,
    version: input.version,
    jobId: input.jobId || null,
    createdAt: new Date().toISOString(),
    databaseDump: databaseDumpPath,
    copied,
    contentDir: getContentPath(),
  };

  await fs.writeFile(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  const record = await prisma.packageBackup.create({
    data: {
      packageId: input.packageId || null,
      packageSlug: input.packageSlug,
      packageType: input.packageType,
      version: input.version,
      backupPath: backupDir,
    },
  });

  return { record, backupDir, manifest };
}
