import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = [
  'src/app/api/setup/route.ts',
  'src/app/api/settings/route.ts',
  'src/app/setup/page.tsx',
  'src/components/Breadcrumbs.tsx',
  'src/plugins/seo-analyzer/lib/technicalSeo.ts',
  'src/plugins/seo-analyzer/api/llms-txt.ts',
  'src/plugins/email-smtp/admin/EmailSettingsPage.tsx',
  'src/plugins/lexi-page-builder/components/FormBlock.tsx',
  'src/themes/default/Header.tsx',
  'src/themes/default/Footer.tsx',
  'src/themes/ezitrans/Header.tsx',
  'src/themes/ezitrans/Footer.tsx',
  'src/themes/ezitrans/ContactPage.tsx',
];
const forbidden = [
  /https?:\/\/(?:www\.)?ezitrans\.vn/gi,
  /https?:\/\/(?:www\.)?lexi\.vn/gi,
  /admin@lexi\.vn/gi,
  /email@lexi\.vn/gi,
  /noreply@lexi\.vn/gi,
  /0868[.\s]?375[.\s]?300/g,
  /0969[.\s]?223[.\s]?501/g,
];
const findings: string[] = [];
for (const relative of targets) {
  const content = fs.readFileSync(path.join(root, relative), 'utf8');
  content.split(/\r?\n/).forEach((line, index) => {
    for (const pattern of forbidden) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) findings.push(`${relative}:${index + 1}: ${line.trim()}`);
    }
  });
}
if (findings.length) {
  console.error('Public/customer defaults found:\n' + findings.join('\n'));
  process.exit(1);
}
console.log(`Branding audit passed (${targets.length} core/public files). Lexi CMS technical identifiers are allowed.`);
