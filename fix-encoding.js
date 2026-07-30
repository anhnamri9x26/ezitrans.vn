// Fix mojibake encoding in all component files
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/plugins/lexi-page-builder/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Fix "Sá»­a" -> "Sửa"  (mojibake for Sửa)
  content = content.replace(/Sá»­a/g, 'Sửa');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    console.log(`Fixed: ${file}`);
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
