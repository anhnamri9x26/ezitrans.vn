import fs from 'fs';
import path from 'path';
import { validatePluginManifest } from '../src/lib/plugins/validator';
import { validateThemeManifest } from '../src/lib/themes/validator';

const args = process.argv.slice(2);
const checkPlugins = args.includes('--plugins') || args.length === 0;
const checkThemes = args.includes('--themes') || args.length === 0;

let hasErrors = false;

function printResult(type: 'Plugin' | 'Theme', name: string, result: any, folderName: string) {
  if (result.valid && result.warnings.length === 0) {
    console.log(`\x1b[32m✅ ${type}: ${folderName}\x1b[0m`);
    return;
  }
  
  if (result.valid && result.warnings.length > 0) {
    console.log(`\x1b[33m⚠️ ${type}: ${folderName}\x1b[0m`);
    result.warnings.forEach((w: string) => console.log(`   - \x1b[33m${w}\x1b[0m`));
    return;
  }
  
  console.log(`\x1b[31m❌ ${type}: ${folderName}\x1b[0m`);
  result.errors.forEach((e: string) => console.log(`   - \x1b[31m${e}\x1b[0m`));
  result.warnings.forEach((w: string) => console.log(`   - \x1b[33m${w}\x1b[0m`));
}

function scanExtensions(type: 'Plugin' | 'Theme', dirName: string, validator: Function) {
  const baseDir = path.join(process.cwd(), 'src', dirName);
  
  if (!fs.existsSync(baseDir)) {
    console.log(`\x1b[34mℹ️ Không tìm thấy thư mục ${dirName}, bỏ qua.\x1b[0m`);
    return;
  }

  const folders = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  console.log(`\n\x1b[1m--- Đang quét ${folders.length} ${dirName} ---\x1b[0m`);

  for (const folder of folders) {
    const folderName = folder.name;
    const manifestPath = path.join(baseDir, folderName, 'manifest.json');
    const readmePath = path.join(baseDir, folderName, 'README.md');

    if (!fs.existsSync(manifestPath)) {
      console.log(`\x1b[31m❌ ${type}: ${folderName}\x1b[0m`);
      console.log(`   - \x1b[31mKhông tìm thấy manifest.json\x1b[0m`);
      hasErrors = true;
      continue;
    }

    const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
    const result = validator({ folderName, manifestRaw, manifestPath });
    
    if (!fs.existsSync(readmePath)) {
      result.warnings.push('Thiếu README.md');
    }

    if (!result.valid) {
      hasErrors = true;
    }

    printResult(type, folderName, result, folderName);
  }
}

if (checkPlugins) {
  scanExtensions('Plugin', 'plugins', validatePluginManifest);
}

if (checkThemes) {
  scanExtensions('Theme', 'themes', validateThemeManifest);
}

console.log('\n');
if (hasErrors) {
  console.log('\x1b[31m❌ Quá trình kiểm tra thất bại do có lỗi.\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32m✅ Tất cả extension đều hợp lệ!\x1b[0m');
  process.exit(0);
}
