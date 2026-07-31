import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import {
  ensureCorePackage,
  createUpdateJob,
  appendUpdateJobLog,
  markUpdateJobRunning,
  markUpdateJobSuccess,
  markUpdateJobFailed,
} from '@/lib/updates/jobs';
import { createPreUpdateBackup } from '@/lib/updates/backup';
import { enableMaintenanceMode, disableMaintenanceMode } from '@/lib/updates/maintenance';
import { callUpdateAgent } from '@/lib/updates/agentClient';
import { fetchLatestRelease, manifestFingerprint, releaseCompatibility } from '@/lib/updates/releaseRegistry';
import { getCoreBuildInfo } from '@/lib/version';

async function resolveCoreTarget(corePackage: { latestVersion?: string | null; version: string }) {
  const build = getCoreBuildInfo();
  const release = await fetchLatestRelease(build.channel);
  if (release) {
    const compatibility = releaseCompatibility(release, corePackage.version);
    if (!compatibility.currentSupported) {
      throw new Error(`Phiên bản hiện tại ${corePackage.version} thấp hơn mức tối thiểu ${release.minimumVersion}. Cần nâng cấp theo lộ trình trung gian.`);
    }
    return { repository: release.image.split('@')[0], targetVersion: release.version, targetImage: release.image, releaseFingerprint: manifestFingerprint(release) };
  }
  if (process.env.SIMULATE_UPDATES === 'false') {
    throw new Error('Real update requires a configured signed LEXI_UPDATE_REGISTRY_URL.');
  }
  const repository = process.env.CORE_IMAGE_REPOSITORY || 'ghcr.io/lexi-cms/core';
  const targetVersion = corePackage.latestVersion || build.version;
  return { repository, targetVersion, targetImage: `${repository}@sha256:${'0'.repeat(64)}`, releaseFingerprint: null };
}

export async function POST() {
  let jobId: string | null = null;

  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'update_core');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền cập nhật hệ thống' }, { status: 403 });
    }

    const corePackage = await ensureCorePackage();
    const coreTarget = await resolveCoreTarget(corePackage);
    const job = await createUpdateJob({
      type: 'CORE',
      targetSlug: 'lexi-cms',
      fromVersion: corePackage.version,
      toVersion: coreTarget.targetVersion,
      createdById: user?.id,
    });
    jobId = job.id;

    await markUpdateJobRunning(job.id, 'One-click core update started from Admin.');
    await enableMaintenanceMode(job.id, 'Core CMS update is running');
    await appendUpdateJobLog(job.id, 'Maintenance mode enabled.');

    const backup = await createPreUpdateBackup({
      packageId: corePackage.id,
      packageSlug: corePackage.slug,
      packageType: 'CORE',
      version: corePackage.version,
      jobId: job.id,
    });
    await appendUpdateJobLog(job.id, `Pre-update backup created: ${backup.backupDir}`);

    const agentResult = await callUpdateAgent('/core/update', {
      jobId: job.id,
      targetVersion: coreTarget.targetVersion,
      targetImage: coreTarget.targetImage,
      currentVersion: corePackage.version,
      releaseFingerprint: coreTarget.releaseFingerprint,
    });
    await appendUpdateJobLog(job.id, `Target Docker image: ${coreTarget.targetImage}`);
    await appendUpdateJobLog(job.id, agentResult.message || 'Update agent finished.');
    if (typeof agentResult.simulated === 'boolean') {
      await appendUpdateJobLog(job.id, `Update execution mode: ${agentResult.simulated ? 'simulation' : 'real Docker'}.`);
    }
    if (agentResult.rollback) {
      await appendUpdateJobLog(job.id, `Rollback result: ${JSON.stringify(agentResult.rollback)}`);
    }

    if (agentResult.success) {
      await markUpdateJobSuccess(job.id, 'Core update completed successfully.');
    } else {
      await markUpdateJobFailed(job.id, agentResult.error || 'Update agent failed', 'Core update failed.');
    }

    return NextResponse.json({ success: agentResult.success, jobId: job.id, agentResult, backup: backup.record });
  } catch (error: any) {
    console.error('Error starting core update:', error);
    if (jobId) {
      await markUpdateJobFailed(jobId, error.message || 'Internal Server Error', 'Core update aborted.');
    }
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error', jobId }, { status: 500 });
  } finally {
    if (jobId) {
      await disableMaintenanceMode();
      await appendUpdateJobLog(jobId, 'Maintenance mode disabled.');
    }
  }
}
