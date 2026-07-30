/**
 * Lexi CMS — ZIP Security Utilities
 * 
 * Bảo mật cho quá trình upload và giải nén ZIP:
 * - Path Traversal Protection
 * - Dangerous File Scanning
 * - Size & Structure Limits
 * - Symlink Detection
 */

import fs from 'fs';
import path from 'path';

// ─── Constants ──────────────────────────────────────────────────

// File extensions bị chặn
export const BLOCKED_EXTENSIONS = [
  '.exe', '.dll', '.so', '.dylib',           // Executables
  '.sh', '.bash', '.zsh',                     // Shell scripts
  '.bat', '.cmd', '.ps1', '.vbs', '.wsf',    // Windows scripts
  '.msi', '.scr', '.com', '.pif',             // Windows executables
  '.php', '.phtml', '.php3', '.php4', '.php5', // PHP
  '.py', '.rb', '.pl', '.cgi',                // Server scripts
  '.class', '.jar', '.war',                    // Java
  '.env', '.htaccess', '.htpasswd',           // Config files nguy hiểm
];

// Patterns nguy hiểm trong source code
export const DANGEROUS_PATTERNS = [
  /eval\s*\(/,
  /Function\s*\(/,
  /child_process/,
  /require\s*\(\s*['"]child_process['"]\)/,
  /require\s*\(\s*['"]fs['"]\)/,
  /import\s+.*from\s+['"]fs['"]/,
  /import\s+.*from\s+['"]child_process['"]/,
  /execSync\s*\(/,
  /spawnSync\s*\(/,
  /process\.env/,
  /__dirname/,
  /__filename/,
  /\.\.\//g,                          // Path traversal in strings
];

// Limits
export const MAX_FILES = 500;
export const MAX_DEPTH = 5;
export const MAX_SINGLE_FILE_SIZE = 5 * 1024 * 1024;    // 5MB per file
export const MAX_TOTAL_EXTRACTED_SIZE = 100 * 1024 * 1024; // 100MB total

// ─── Interfaces ─────────────────────────────────────────────────

export interface ScanResult {
  safe: boolean;
  errors: string[];                 // Blocking issues
  warnings: string[];               // Non-blocking warnings
  stats: {
    totalFiles: number;
    totalSize: number;
    maxDepth: number;
    blockedFiles: string[];
    dangerousPatterns: { file: string; pattern: string; line: number }[];
  };
}

// ─── Path Traversal Protection ──────────────────────────────────

/**
 * Kiểm tra đường dẫn có chứa path traversal không
 * Chặn: ../, absolute paths, symlinks
 */
export function isPathTraversal(filePath: string, baseDir: string): boolean {
  // Normalize path
  const normalizedPath = path.resolve(baseDir, filePath);
  const normalizedBase = path.resolve(baseDir);

  // Kiểm tra file nằm trong baseDir
  if (!normalizedPath.startsWith(normalizedBase)) {
    return true;
  }

  // Kiểm tra path chứa ..
  if (filePath.includes('..')) {
    return true;
  }

  // Kiểm tra absolute path
  if (path.isAbsolute(filePath)) {
    return true;
  }

  return false;
}

/**
 * Validate tất cả entries trong thư mục đã giải nén
 */
export function validateExtractedPaths(extractDir: string): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  function walkDir(dir: string, depth: number = 0) {
    if (depth > MAX_DEPTH) {
      violations.push(`Cấu trúc thư mục quá sâu (>${MAX_DEPTH} cấp): ${dir}`);
      return;
    }

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(extractDir, fullPath);

      // Kiểm tra symlink
      if (entry.isSymbolicLink()) {
        violations.push(`Phát hiện symlink (không được phép): ${relativePath}`);
        continue;
      }

      // Kiểm tra path traversal
      if (isPathTraversal(relativePath, extractDir)) {
        violations.push(`Path traversal detected: ${relativePath}`);
        continue;
      }

      if (entry.isDirectory()) {
        walkDir(fullPath, depth + 1);
      }
    }
  }

  walkDir(extractDir);
  return { valid: violations.length === 0, violations };
}

// ─── File Scanning ──────────────────────────────────────────────

/**
 * Scan toàn bộ thư mục đã giải nén
 */
export function scanExtractedFiles(extractDir: string): ScanResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const blockedFiles: string[] = [];
  const dangerousPatterns: { file: string; pattern: string; line: number }[] = [];
  let totalFiles = 0;
  let totalSize = 0;
  let maxDepth = 0;

  function walkDir(dir: string, depth: number = 0) {
    if (depth > maxDepth) maxDepth = depth;

    if (depth > MAX_DEPTH) {
      errors.push(`Cấu trúc thư mục quá sâu (>${MAX_DEPTH} cấp)`);
      return;
    }

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(extractDir, fullPath);

      if (entry.isSymbolicLink()) {
        errors.push(`Symlink không được phép: ${relativePath}`);
        continue;
      }

      if (entry.isDirectory()) {
        walkDir(fullPath, depth + 1);
        continue;
      }

      if (!entry.isFile()) continue;

      totalFiles++;

      // Check file count limit
      if (totalFiles > MAX_FILES) {
        errors.push(`Quá nhiều files (>${MAX_FILES})`);
        return;
      }

      // Check file size
      let stats: fs.Stats;
      try {
        stats = fs.statSync(fullPath);
      } catch {
        continue;
      }

      totalSize += stats.size;
      if (stats.size > MAX_SINGLE_FILE_SIZE) {
        errors.push(`File quá lớn (${(stats.size / 1024 / 1024).toFixed(1)}MB): ${relativePath}`);
      }

      // Check total size
      if (totalSize > MAX_TOTAL_EXTRACTED_SIZE) {
        errors.push(`Tổng dung lượng vượt giới hạn (${(MAX_TOTAL_EXTRACTED_SIZE / 1024 / 1024)}MB)`);
        return;
      }

      // Check blocked extensions
      const ext = path.extname(entry.name).toLowerCase();
      if (BLOCKED_EXTENSIONS.includes(ext)) {
        blockedFiles.push(relativePath);
        errors.push(`File bị chặn (${ext}): ${relativePath}`);
      }

      // Check hidden files (starts with .)
      if (entry.name.startsWith('.') && entry.name !== '.gitignore') {
        warnings.push(`Hidden file: ${relativePath}`);
      }

      // Scan source code for dangerous patterns
      const scanExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
      if (scanExtensions.includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            for (const pattern of DANGEROUS_PATTERNS) {
              if (pattern.test(lines[i])) {
                dangerousPatterns.push({
                  file: relativePath,
                  pattern: pattern.source,
                  line: i + 1,
                });
              }
            }
          }
        } catch {
          // Không đọc được file — skip
        }
      }
    }
  }

  walkDir(extractDir);

  // Dangerous patterns chỉ là warning, không phải error
  if (dangerousPatterns.length > 0) {
    warnings.push(
      `Phát hiện ${dangerousPatterns.length} pattern nguy hiểm trong source code. Kiểm tra trước khi kích hoạt.`
    );
  }

  return {
    safe: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalFiles,
      totalSize,
      maxDepth,
      blockedFiles,
      dangerousPatterns,
    },
  };
}

// ─── Auth Helper ────────────────────────────────────────────────

import { prisma } from './prisma';

/**
 * Kiểm tra user là ADMIN từ request cookies
 */
export async function requireAdminFromCookies(cookieHeader: string | null): Promise<{
  authorized: boolean;
  userId?: number;
}> {
  if (!cookieHeader) return { authorized: false };

  // Parse cookies
  const cookies = cookieHeader.split(';').reduce((acc, c) => {
    const [key, val] = c.trim().split('=');
    if (key && val) acc[key] = val;
    return acc;
  }, {} as Record<string, string>);

  const sessionToken = cookies['lexi_session_token'];
  if (!sessionToken) return { authorized: false };

  try {
    const session = await prisma.userSession.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });
    
    if (session && session.expiresAt > new Date() && session.user.role === 'ADMIN') {
      return { authorized: true, userId: session.user.id };
    }
  } catch { /* noop */ }

  return { authorized: false };
}
