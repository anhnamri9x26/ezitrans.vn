import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src', 'public'];
const IGNORE_PARTS = ['.next', 'node_modules', '.git', 'coverage', '.system_generated'];
const TEXT_EXTENSIONS = new Set(['.js','.jsx','.ts','.tsx','.json','.css','.scss','.html','.md','.txt','.xml','.yml','.yaml','.env','.php','.phtml','.svg','.sql']);
const MEDIA_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.ico', '.avif', '.mp4', '.pdf', '.woff', '.woff2']);

const MALWARE_SIGNATURES = [
  { severity: 'critical', label: 'PHP eval/base64 backdoor', pattern: /eval\s*\(\s*base64_decode\s*\(/i },
  { severity: 'critical', label: 'PHP shell execution', pattern: /\b(shell_exec|passthru|system|exec|popen|proc_open)\s*\(/i },
  { severity: 'high', label: 'Suspicious PHP request shell', pattern: /\$_(GET|POST|REQUEST|COOKIE)\s*\[[^\]]+\][\s\S]{0,120}(eval|assert|system|exec)/i },
  { severity: 'high', label: 'Node child_process execution', pattern: /child_process\.(exec|execSync|spawn|spawnSync)\s*\(/i },
  { severity: 'high', label: 'Obfuscated JavaScript eval', pattern: /eval\s*\(\s*(atob|unescape|String\.fromCharCode)/i },
  { severity: 'medium', label: 'Long base64-like payload', pattern: /[A-Za-z0-9+/]{800,}={0,2}/ },
  { severity: 'medium', label: 'Suspicious iframe injection', pattern: /<iframe[^>]+src=["']https?:\/\/[^"']+["'][^>]*style=["'][^"']*display\s*:\s*none/i },
  { severity: 'medium', label: 'Encoded script document.write', pattern: /document\.write\s*\(\s*(unescape|atob)/i },
];

export type ScanSummary = {
  filesScanned: number;
  mediaFilesScanned: number;
  baselineFiles: number;
  findings: number;
  changedFiles: number;
  missingFiles: number;
  newFiles: number;
  malwareFindings: number;
  ignoredMediaChanges: number;
};

function toRelative(filePath: string) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function shouldIgnore(filePath: string) {
  const normalized = filePath.replace(/\\/g, '/');
  return IGNORE_PARTS.some(part => normalized.includes(`/${part}/`) || normalized.endsWith(`/${part}`));
}

function isMediaFile(ext: string) {
  return MEDIA_EXTENSIONS.has(ext.toLowerCase());
}

async function walkDir(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (shouldIgnore(fullPath)) continue;
      if (entry.isDirectory()) files.push(...await walkDir(fullPath));
      else if (entry.isFile()) files.push(fullPath);
    }
  } catch {}
  return files;
}

async function getScannableFiles() {
  const all: string[] = [];
  for (const dir of SCAN_DIRS) all.push(...await walkDir(path.join(ROOT, dir)));
  return all;
}

async function hashFile(filePath: string) {
  const buffer = await fs.readFile(filePath);
  return { hash: crypto.createHash('sha256').update(buffer).digest('hex'), size: buffer.length };
}

async function readTextFileSafe(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) return null;
  const stat = await fs.stat(filePath);
  if (stat.size > 1024 * 1024 * 2) return null;
  return fs.readFile(filePath, 'utf8');
}

export async function takeBaselineSnapshot() {
  const files = await getScannableFiles();
  let saved = 0;
  for (const filePath of files) {
    const { hash, size } = await hashFile(filePath);
    const relativePath = toRelative(filePath);
    await prisma.fileIntegritySnapshot.upsert({
      where: { filePath: relativePath },
      update: { hash, size },
      create: { filePath: relativePath, hash, size },
    });
    saved += 1;
  }
  return { success: true, files: saved };
}

export async function scanFileForMalware(filePath: string) {
  const findings: Array<{ severity: string; type: string; message: string; details: string }> = [];
  const relativePath = toRelative(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  if (relativePath.startsWith('public/') && ['.php', '.phtml', '.phar', '.sh', '.exe', '.bat'].includes(ext)) {
    findings.push({ severity: 'high', type: 'suspicious_upload', message: 'Executable file found in public directory', details: 'Executable files should not exist in public uploads.' });
  }

  const nameL = path.basename(filePath).toLowerCase();
  if (isMediaFile(ext) && (nameL.includes('shell') || nameL.includes('eval') || nameL.includes('.php.'))) {
    findings.push({ severity: 'medium', type: 'suspicious_media', message: 'Media file with suspicious name', details: 'A media file was found with a name commonly used to hide malware.' });
  }

  const content = await readTextFileSafe(filePath);
  if (content) {
    for (const signature of MALWARE_SIGNATURES) {
      if (signature.pattern.test(content)) {
        findings.push({ severity: signature.severity, type: 'malware_signature', message: signature.label, details: `Matched malware signature: ${signature.label}` });
      }
    }
    
    if (ext === '.svg' && (/<script/i.test(content) || /javascript:/i.test(content) || /onload=/i.test(content))) {
      findings.push({ severity: 'medium', type: 'malware_signature', message: 'SVG contains script', details: 'SVG files with scripts can be used for XSS attacks.' });
    }
  }

  return findings;
}

export async function runSecurityScan(): Promise<{ scanId: number; summary: ScanSummary }> {
  const scan = await prisma.securityScan.create({ data: { status: 'running' } });
  const summary: ScanSummary = { filesScanned: 0, mediaFilesScanned: 0, baselineFiles: 0, findings: 0, changedFiles: 0, missingFiles: 0, newFiles: 0, malwareFindings: 0, ignoredMediaChanges: 0 };
  try {
    const files = await getScannableFiles();
    const currentPaths = new Set(files.map(toRelative));
    const baseline = await prisma.fileIntegritySnapshot.findMany();
    summary.baselineFiles = baseline.length;
    const baselineMap = new Map(baseline.map(item => [item.filePath, item]));

    for (const filePath of files) {
      const relativePath = toRelative(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      if (isMediaFile(ext)) {
        summary.mediaFilesScanned += 1;
      } else {
        summary.filesScanned += 1;
      }

      const { hash, size } = await hashFile(filePath);
      const snapshot = baselineMap.get(relativePath);
      
      if (!snapshot) {
        if (isMediaFile(ext)) {
          summary.ignoredMediaChanges += 1;
        } else {
          summary.newFiles += 1; summary.findings += 1;
          await prisma.securityFinding.create({ data: { scanId: scan.id, severity: 'medium', type: 'new_file', filePath: relativePath, message: 'File mới chưa có trong baseline', details: `Hash: ${hash}; Size: ${size}` } });
        }
      } else if (snapshot.hash !== hash || snapshot.size !== size) {
        if (isMediaFile(ext)) {
          summary.ignoredMediaChanges += 1;
        } else {
          summary.changedFiles += 1; summary.findings += 1;
          await prisma.securityFinding.create({ data: { scanId: scan.id, severity: 'high', type: 'modified_file', filePath: relativePath, message: 'File code/config đã bị thay đổi', details: `Old hash: ${snapshot.hash}; New hash: ${hash}` } });
        }
      }
      
      for (const finding of await scanFileForMalware(filePath)) {
        summary.malwareFindings += 1; summary.findings += 1;
        await prisma.securityFinding.create({ data: { scanId: scan.id, severity: finding.severity, type: finding.type, filePath: relativePath, message: finding.message, details: finding.details } });
      }
    }

    for (const item of baseline) {
      if (!currentPaths.has(item.filePath)) {
        const ext = path.extname(item.filePath).toLowerCase();
        if (isMediaFile(ext)) {
          summary.ignoredMediaChanges += 1;
        } else {
          summary.missingFiles += 1; summary.findings += 1;
          await prisma.securityFinding.create({ data: { scanId: scan.id, severity: 'medium', type: 'missing_file', filePath: item.filePath, message: 'File trong baseline đã bị xóa', details: `Baseline hash: ${item.hash}; Baseline size: ${item.size}` } });
        }
      }
    }

    await prisma.securityScan.update({ where: { id: scan.id }, data: { status: 'completed', completedAt: new Date(), summary: JSON.stringify(summary) } });
    return { scanId: scan.id, summary };
  } catch (error: any) {
    await prisma.securityScan.update({ where: { id: scan.id }, data: { status: 'failed', completedAt: new Date(), summary: error?.message || 'Unknown scanner error' } });
    throw error;
  }
}
