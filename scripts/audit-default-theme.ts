import fs from 'node:fs';
import path from 'node:path';
import { validateCustomizerSchema } from '../src/lib/themes/customizer';

const root=process.cwd();
const themePath=path.join(root,'src/themes/default/theme.json');
const raw=fs.readFileSync(themePath,'utf8').replace(/^\uFEFF/,'');
const theme=JSON.parse(raw);
const errors:string[]=[];
if(theme.id!=='default')errors.push('Theme ID must remain default');
if(theme.name!=='Lexi Starter')errors.push('Theme display name must be Lexi Starter');
if(!Array.isArray(theme.customizer)||theme.customizer.length<3)errors.push('Customizer panels are missing');
try{validateCustomizerSchema('default',theme.customizer||[])}catch(error){errors.push(error instanceof Error?error.message:String(error))}
const publicFiles = [
  'Homepage.tsx', 'Header.tsx', 'Footer.tsx', 'Page.tsx', 'PostPage.tsx',
  'CategoryPage.tsx', 'TagPage.tsx', 'SearchPage.tsx', 'AuthorPage.tsx',
  'ProductCategoryPage.tsx', 'ProductPage.tsx', 'theme.json', 'manifest.json',
];
const requiredTemplates = [
  'Header.tsx', 'Footer.tsx', 'Homepage.tsx', 'Page.tsx', 'PostPage.tsx',
  'CategoryPage.tsx', 'TagPage.tsx', 'SearchPage.tsx', 'AuthorPage.tsx',
  'ProductCategoryPage.tsx', 'ProductPage.tsx',
];
for (const file of requiredTemplates) {
  if (!fs.existsSync(path.join(root, 'src/themes/default', file))) {
    errors.push(`Missing required Starter template: ${file}`);
  }
}
const forbidden = [
  /FengYang/gi, /#2D3753/gi, /#E31B23/gi, /thép đặc chủng/gi, /mác thép/gi,
  /0969[.\s]?223[.\s]?501/g, /info@fengyang/gi, /ezitrans\.vn/gi, /0868[.\s]?375[.\s]?300/g,
];
for(const file of publicFiles){const content=fs.readFileSync(path.join(root,'src/themes/default',file),'utf8');for(const regex of forbidden){regex.lastIndex=0;if(regex.test(content))errors.push(`${file}: contains customer/demo value ${regex}`)}}
const setup=fs.readFileSync(path.join(root,'src/app/api/setup/route.ts'),'utf8');
if(!setup.includes("active_theme: 'default'"))errors.push('Setup does not activate default theme');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Lexi Starter audit passed: neutral identity, valid Customizer schema, default setup activation.');
