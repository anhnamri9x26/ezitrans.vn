import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { hasMojibake, mojibakeScore, repairMojibake } from '../src/lib/text/repairMojibake';

const ROOT = process.cwd();
const TARGETS = ['src'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);
const write = process.argv.includes('--write');

async function collect(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const full = join(path, entry.name);
    if (entry.isDirectory()) return collect(full);
    return EXTENSIONS.has(extname(entry.name)) ? [full] : [];
  }));
  return nested.flat();
}

async function main(): Promise<void> {
  let affected = 0;
  let beforeScore = 0;
  let afterScore = 0;
  for (const target of TARGETS) {
    for (const file of await collect(join(ROOT, target))) {
      if (file.endsWith(join('src', 'lib', 'text', 'repairMojibake.ts'))) continue;
      const original = await readFile(file, 'utf8');
      if (!hasMojibake(original)) continue;
      const repaired = repairMojibake(original);
      const before = mojibakeScore(original);
      const after = mojibakeScore(repaired);
      if (repaired === original) {
        console.warn(`REVIEW ${relative(ROOT, file)} (score ${before})`);
        beforeScore += before;
        afterScore += after;
        continue;
      }
      affected += 1;
      beforeScore += before;
      afterScore += after;
      console.log(`${write ? 'FIXED' : 'WOULD FIX'} ${relative(ROOT, file)} (${before} -> ${after})`);
      if (write) await writeFile(file, repaired, 'utf8');
    }
  }
  console.log(`\n${write ? 'Changed' : 'Affected'} files: ${affected}; score: ${beforeScore} -> ${afterScore}`);
  if (!write && affected > 0) process.exitCode = 2;
  if (write && afterScore > 0) process.exitCode = 3;
}

void main();
