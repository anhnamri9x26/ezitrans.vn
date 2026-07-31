import { prisma } from '@/lib/prisma';
import { getCoreBuildInfo } from '@/lib/version';

export async function ensureCorePackage() {
  const build = getCoreBuildInfo();
  return prisma.installedPackage.upsert({
    where: { type_slug: { type: 'CORE', slug: 'lexi-cms' } },
    update: {
      name: 'Lexi CMS',
      version: build.version,
      status: 'ACTIVE',
      source: 'DOCKER_IMAGE',
    },
    create: {
      type: 'CORE',
      slug: 'lexi-cms',
      name: 'Lexi CMS',
      version: build.version,
      status: 'ACTIVE',
      source: 'DOCKER_IMAGE',
    },
  });
}

export async function createUpdateJob(input: {
  type: 'CORE' | 'PLUGIN' | 'THEME' | 'DATABASE';
  targetSlug: string;
  fromVersion?: string | null;
  toVersion?: string | null;
  createdById?: number | null;
}) {
  return prisma.updateJob.create({
    data: {
      type: input.type,
      targetSlug: input.targetSlug,
      fromVersion: input.fromVersion || null,
      toVersion: input.toVersion || null,
      createdById: input.createdById || null,
      status: 'PENDING',
    },
  });
}

export async function appendUpdateJobLog(jobId: string, message: string) {
  const timestamped = `[${new Date().toISOString()}] ${message}`;
  const existing = await prisma.updateJob.findUnique({ where: { id: jobId } });
  return prisma.updateJob.update({
    where: { id: jobId },
    data: {
      log: existing?.log ? `${existing.log}\n${timestamped}` : timestamped,
    },
  });
}

export async function markUpdateJobRunning(jobId: string, message?: string) {
  await prisma.updateJob.update({ where: { id: jobId }, data: { status: 'RUNNING', startedAt: new Date(), error: null } });
  if (message) {
    await appendUpdateJobLog(jobId, message);
  }
}

export async function markUpdateJobSuccess(jobId: string, message?: string) {
  if (message) {
    await appendUpdateJobLog(jobId, message);
  }
  return prisma.updateJob.update({ where: { id: jobId }, data: { status: 'SUCCESS', completedAt: new Date(), error: null } });
}

export async function markUpdateJobFailed(jobId: string, error: string, message?: string) {
  if (message) {
    await appendUpdateJobLog(jobId, message);
  }
  return prisma.updateJob.update({
    where: { id: jobId },
    data: { status: 'FAILED', completedAt: new Date(), error },
  });
}

