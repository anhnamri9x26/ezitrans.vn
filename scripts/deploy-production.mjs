import { execFileSync } from 'node:child_process';
const args = new Set(process.argv.slice(2));
const run = (cmd, argv, options = {}) => execFileSync(cmd, argv, { stdio: 'inherit', ...options });
const capture = (cmd, argv) => execFileSync(cmd, argv, { encoding: 'utf8' }).trim();
if (args.has('--status')) { run('gh', ['run','list','--workflow','deploy-ezitrans.yml','--limit','5']); process.exit(0); }
run('gh', ['auth','status']);
const branch = capture('git', ['branch','--show-current']);
const dirty = capture('git', ['status','--porcelain']);
if (dirty && !args.has('--allow-dirty') && !args.has('--dry-run')) {
  throw new Error('Working tree has uncommitted changes. Commit them before production deploy.');
}
if (dirty && args.has('--dry-run')) console.warn('DRY RUN NOTICE: working tree has uncommitted changes.');
if (!args.has('--skip-validation')) {
  if (process.platform === 'win32') {
    run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm run release:validate']);
  } else {
    run('npm', ['run', 'release:validate']);
  }
}
const date = new Date().toISOString().slice(0,10).replaceAll('-','.');
const sha = capture('git',['rev-parse','--short=8','HEAD']);
const versionArg = process.argv.find(v=>v.startsWith('--version='));
const version = versionArg?.split('=')[1] || `${date}-${sha}`;
if (args.has('--dry-run')) { console.log(`DRY RUN: branch=${branch} version=${version}`); process.exit(0); }
run('gh',['workflow','run','deploy-ezitrans.yml','--ref',branch,'-f',`version=${version}`,'-f',`revision=${capture('git',['rev-parse','HEAD'])}`]);
console.log('Deployment dispatched. Follow it with: npm run deploy:status');