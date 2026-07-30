import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import {
  createUpdateJob,
  appendUpdateJobLog,
  markUpdateJobRunning,
  markUpdateJobSuccess,
  markUpdateJobFailed,
  ensureCorePackage,
} from '@/lib/updates/jobs';
import { createPreUpdateBackup } from '@/lib/updates/backup';
import { enableMaintenanceMode, disableMaintenanceMode } from '@/lib/updates/maintenance';

export async function POST() {
  let jobId: string | null = null;

  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'update_core');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền cập nhật database' }, { status: 403 });
    }

    const corePackage = await ensureCorePackage();
    const job = await createUpdateJob({ type: 'DATABASE', targetSlug: 'database', createdById: user?.id });
    jobId = job.id;

    await markUpdateJobRunning(job.id, 'Database update requested from Admin.');
    await enableMaintenanceMode(job.id, 'Database update is running');
    await appendUpdateJobLog(job.id, 'Maintenance mode enabled.');

    const backup = await createPreUpdateBackup({
      packageId: corePackage.id,
      packageSlug: corePackage.slug,
      packageType: 'CORE',
      version: corePackage.version,
      jobId: job.id,
    });
    await appendUpdateJobLog(job.id, `Pre-database-update backup created: ${backup.backupDir}`);

    await appendUpdateJobLog(job.id, 'Milestone 3 simulation: database migration completed after backup.');
    await markUpdateJobSuccess(job.id, 'Database update completed successfully.');

    return NextResponse.json({ success: true, jobId: job.id, simulated: true, backup: backup.record });
  } catch (error: any) {
    console.error('Error starting database update:', error);
    if (jobId) {
      await markUpdateJobFailed(jobId, error.message || 'Internal Server Error', 'Database update aborted.');
    }
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error', jobId }, { status: 500 });
  } finally {
    if (jobId) {
      await disableMaintenanceMode();
      await appendUpdateJobLog(jobId, 'Maintenance mode disabled.');
    }
  }
}
