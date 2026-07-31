import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const port = Number(process.env.UPDATE_AGENT_PORT || 4577);
const token = process.env.UPDATE_AGENT_TOKEN || '';
const simulate = process.env.SIMULATE_UPDATES !== 'false';
const workspace = process.env.COMPOSE_PROJECT_DIR || '/workspace';
const composeFile = process.env.COMPOSE_FILE_PATH || path.join(workspace, 'docker-compose.yml');
const composeEnvFile = process.env.COMPOSE_ENV_FILE || path.join(workspace, '.env');
const projectName = process.env.COMPOSE_PROJECT_NAME || '';
const service = process.env.APP_SERVICE_NAME || 'app';
const repository = process.env.CORE_IMAGE_REPOSITORY || 'ghcr.io/anhnamri9x26/lexi-cms-core';
const readyUrl = process.env.APP_READY_URL || 'http://app:3000/api/health/ready';
const healthToken = process.env.INTERNAL_HEALTH_TOKEN || '';
const lockFile = process.env.UPDATE_LOCK_FILE || '/agent/content/.update.lock';
const logDir = process.env.UPDATE_LOG_DIR || '/agent/content/logs';

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function authorized(req) {
  if (!token) return false;
  const supplied = (req.headers.authorization || '').replace(/^Bearer /, '');
  const expectedBuffer = Buffer.from(token);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function command(cmd, args, timeout = 600000, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: workspace,
      env: { ...process.env, ...env },
      shell: process.platform === 'win32',
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), timeout);
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ success: false, code: -1, stdout, stderr, error: error.message });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ success: code === 0, code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

function composeArgs(args) {
  const options = ['compose'];
  if (fs.existsSync(composeEnvFile)) options.push('--env-file', composeEnvFile);
  options.push('-f', composeFile, ...args);
  return options;
}

function compose(args, timeout = 600000, env = {}) {
  return command('docker', composeArgs(args), timeout, env);
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100000) throw new Error('Payload too large.');
  }
  return raw ? JSON.parse(raw) : {};
}

function allowedImage(image) {
  return typeof image === 'string'
    && image.startsWith(`${repository}@sha256:`)
    && /^.+@sha256:[a-f0-9]{64}$/.test(image);
}

function allowedRollbackTag(image) {
  return typeof image === 'string' && image.startsWith(`${repository}:rollback-`);
}

async function persistCoreImage(image) {
  if (!allowedImage(image) && !allowedRollbackTag(image)) {
    throw new Error('Refusing to persist an unapproved Core image reference.');
  }
  await fsp.mkdir(path.dirname(composeEnvFile), { recursive: true });
  let source = '';
  try { source = await fsp.readFile(composeEnvFile, 'utf8'); } catch {}
  const lines = source.split(/\r?\n/).filter((line) => line.length > 0);
  const nextLine = `CORE_IMAGE=${image}`;
  const index = lines.findIndex((line) => /^CORE_IMAGE=/.test(line));
  if (index >= 0) lines[index] = nextLine;
  else lines.push(nextLine);
  const temporary = `${composeEnvFile}.tmp-${process.pid}`;
  await fsp.writeFile(temporary, `${lines.join('\n')}\n`, { mode: 0o600 });
  await fsp.rename(temporary, composeEnvFile);
}

async function acquire(jobId) {
  await fsp.mkdir(path.dirname(lockFile), { recursive: true });
  try {
    const handle = await fsp.open(lockFile, 'wx');
    await handle.writeFile(JSON.stringify({ jobId, createdAt: new Date().toISOString() }));
    await handle.close();
    return true;
  } catch {
    return false;
  }
}

async function release() {
  await fsp.rm(lockFile, { force: true });
}

async function log(jobId, event, data = {}) {
  await fsp.mkdir(logDir, { recursive: true });
  await fsp.appendFile(
    path.join(logDir, `${jobId}.jsonl`),
    `${JSON.stringify({ time: new Date().toISOString(), event, ...data })}\n`,
  );
}

async function ready() {
  const response = await fetch(readyUrl, {
    headers: healthToken ? { Authorization: `Bearer ${healthToken}` } : {},
    signal: AbortSignal.timeout(10000),
  });
  return { success: response.ok, status: response.status, payload: await response.json().catch(() => null) };
}

async function waitForReadiness() {
  let health = null;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      health = await ready();
      if (health.success) break;
    } catch (error) {
      health = { success: false, error: error.message };
    }
  }
  return health;
}

async function preflight(image) {
  const checks = {
    imageAllowed: allowedImage(image),
    composeFile,
    composeEnvFile,
    docker: await command('docker', ['version', '--format', '{{.Server.Version}}'], 15000),
    compose: await command('docker', ['compose', 'version'], 15000),
    disk: await command('docker', ['system', 'df'], 30000),
  };
  return { success: checks.imageAllowed && checks.docker.success && checks.compose.success, checks };
}

async function recreate(image) {
  await persistCoreImage(image);
  return compose(['up', '-d', '--no-build', '--no-deps', '--force-recreate', service], 600000, { CORE_IMAGE: image });
}

async function rollbackTo(jobId, rollbackTag) {
  const restart = await recreate(rollbackTag);
  const health = restart.success ? await waitForReadiness() : null;
  await log(jobId, 'automatic-rollback', { rollbackTag, restart, health });
  return { success: restart.success && Boolean(health?.success), rollbackTag, restart, health };
}

async function update(body) {
  const { jobId, targetImage, currentVersion, targetVersion } = body;
  if (!jobId || !allowedImage(targetImage)) {
    return { success: false, error: 'Invalid job ID or target image. Image digest/repository is not allowed.' };
  }
  if (!(await acquire(jobId))) return { success: false, error: 'Another update is already running.', locked: true };
  try {
    await log(jobId, 'started', { targetImage, currentVersion, targetVersion, simulate });
    const checks = await preflight(targetImage);
    await log(jobId, 'preflight', { checks });
    if (!checks.success) return { success: false, error: 'Preflight failed.', checks };
    if (simulate) {
      await log(jobId, 'completed', { simulated: true });
      return { success: true, simulated: true, message: 'Simulation completed. No Docker changes were made.', checks };
    }

    const inspect = await compose(['images', '-q', service], 30000);
    const previousImageId = inspect.stdout.split(/\s+/)[0] || '';
    const rollbackTag = `${repository}:rollback-${jobId}`;
    if (previousImageId) {
      const tagged = await command('docker', ['tag', previousImageId, rollbackTag], 30000);
      if (!tagged.success) return { success: false, error: 'Could not create rollback image tag.', tagged };
    }

    const pull = await command('docker', ['pull', targetImage], 900000);
    await log(jobId, 'pull', { pull });
    if (!pull.success) return { success: false, error: 'Image pull failed.', pull };

    const network = process.env.UPDATE_NETWORK || (projectName ? `${projectName}_default` : 'bridge');
    const migrate = await command('docker', [
      'run', '--rm', '--network', network,
      '-e', `DATABASE_URL=${process.env.DATABASE_URL || ''}`,
      targetImage, 'npx', 'prisma', 'migrate', 'deploy',
    ], 600000);
    await log(jobId, 'migrate', { migrate });
    if (!migrate.success) return { success: false, error: 'Database migration failed.', migrate, rollbackTag };

    const restart = await recreate(targetImage);
    await log(jobId, 'restart', { restart });
    if (!restart.success) {
      const rollback = previousImageId ? await rollbackTo(jobId, rollbackTag) : null;
      return { success: false, error: 'App restart failed.', restart, rollback, rollbackTag };
    }

    const health = await waitForReadiness();
    await log(jobId, 'health', { health });
    if (!health?.success) {
      const rollback = previousImageId ? await rollbackTo(jobId, rollbackTag) : null;
      return { success: false, error: 'Readiness check failed after update.', health, rollback, rollbackTag };
    }

    await log(jobId, 'completed', { simulated: false });
    return {
      success: true,
      simulated: false,
      message: 'Core update completed and readiness check passed.',
      rollbackTag,
      health,
    };
  } finally {
    await release();
  }
}

async function rollback(body) {
  const tag = body.rollbackTag;
  const jobId = body.jobId || 'rollback';
  if (!allowedRollbackTag(tag)) return { success: false, error: 'Rollback tag is not allowed.' };
  if (!(await acquire(jobId))) return { success: false, error: 'Another update is running.' };
  try {
    if (simulate) return { success: true, simulated: true, message: 'Rollback simulation completed.' };
    const restart = await recreate(tag);
    const health = restart.success ? await waitForReadiness() : null;
    return {
      success: restart.success && Boolean(health?.success),
      simulated: false,
      restart,
      health,
      message: restart.success && health?.success ? 'Rollback completed and readiness passed.' : 'Rollback failed.',
    };
  } finally {
    await release();
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/health' && req.method === 'GET') return json(res, 200, { success: true, status: 'alive', simulate });
    if (!authorized(req)) return json(res, 401, { success: false, error: 'Unauthorized' });
    if (req.url === '/diagnostics' && req.method === 'GET') {
      const current = await compose(['images', service], 30000);
      return json(res, 200, {
        success: true,
        simulateUpdates: simulate,
        composeProjectDir: workspace,
        composeFile,
        composeEnvFile,
        currentImage: current.stdout,
        dockerVersion: await command('docker', ['version'], 30000),
        composeVersion: await command('docker', ['compose', 'version'], 30000),
        dockerSystemDf: await command('docker', ['system', 'df'], 30000),
        locked: fs.existsSync(lockFile),
      });
    }
    const body = await readBody(req);
    if (req.url === '/core/preflight' && req.method === 'POST') return json(res, 200, await preflight(body.targetImage));
    if (req.url === '/core/update' && req.method === 'POST') {
      const result = await update(body);
      return json(res, result.success ? 200 : 409, result);
    }
    if (req.url === '/core/rollback' && req.method === 'POST') {
      const result = await rollback(body);
      return json(res, result.success ? 200 : 409, result);
    }
    return json(res, 404, { success: false, error: 'Not found' });
  } catch (error) {
    return json(res, 500, { success: false, error: error.message || 'Agent error' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Lexi Update Agent listening on ${port}; simulation=${simulate}`);
});
