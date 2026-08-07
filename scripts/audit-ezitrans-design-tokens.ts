import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'src', 'themes', 'ezitrans');

// Approved Ezitrans palette. Keep this explicit so newly introduced colors still fail the release gate.
const approvedPalette = new Set([
  '#000', '#fff',
  '#071b3f', '#071e3c', '#082b4d', '#087a56', '#0a2248', '#0a2859', '#0a52ab',
  '#0b3472', '#0c64d0', '#0d5dd7', '#0e4a9b', '#0e69dd', '#0f172a', '#102449', '#10b981',
  '#1264d6', '#1465d9', '#166534', '#172b4d', '#174c96', '#1e293b', '#233c61',
  '#2472df', '#24a0ed', '#334155', '#43516a', '#475569', '#536277', '#64748b',
  '#69778b', '#7a879d', '#94a3b8', '#991b1b', '#9babbd', '#aac4e9', '#b9c8df',
  '#b9d3ff', '#bae6fd', '#be123c', '#cad3df', '#cbd5e1', '#d98200', '#dbe7f8',
  '#dbeafe', '#dce3ed', '#dce4ef', '#dfe7f2', '#dcfce7', '#dc2626', '#e0e2fe',
  '#e0e6ef', '#e0f2fe', '#e2e8f0', '#e2e9f4', '#e5ebf5', '#e7ecf3', '#eaf3ff',
  '#ecfdf5', '#edf4ff', '#edf5ff', '#edf6ff', '#eef2f7', '#f0f7ff',
  '#f1f4f8', '#f1f5f9', '#f39200', '#f47a00', '#f58220', '#f59e0b', '#f5f8fd',
  '#f6f8fc', '#f8faff', '#f8fafc', '#f9fbfe', '#fbbf24', '#fee2e2', '#ff9d00',
  '#ff9e2f', '#fffbeb', '#fff1f2',
]);

function canonicalHex(value: string): string {
  const color = value.toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(color) && color[1] === color[2] && color[3] === color[4] && color[5] === color[6]) {
    return `#${color[1]}${color[3]}${color[5]}`;
  }
  if (/^#[0-9a-f]{8}$/.test(color) && color[1] === color[2] && color[3] === color[4] && color[5] === color[6] && color[7] === color[8]) {
    return `#${color[1]}${color[3]}${color[5]}${color[7]}`;
  }
  return color;
}

const files: string[] = [];
function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(css|tsx)$/.test(entry.name)) files.push(full);
  }
}

walk(root);
const violations: string[] = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const value = canonicalHex(match[0]);
    if (!approvedPalette.has(value)) violations.push(`${path.relative(root, file)}: ${value}`);
  }
}

if (violations.length) {
  console.error(`Design token violations (${violations.length}):\n${violations.slice(0, 50).join('\n')}`);
  process.exit(1);
}

console.log(`✅ Ezitrans design tokens clean — scanned ${files.length} files`);
