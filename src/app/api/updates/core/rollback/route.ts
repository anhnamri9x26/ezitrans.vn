import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { createUpdateJob, appendUpdateJobLog, markUpdateJobRunning, markUpdateJobSuccess, markUpdateJobFailed } from '@/lib/updates/jobs';
import { enableMaintenanceMode, disableMaintenanceMode } from '@/lib/updates/maintenance';
import { requestCoreRollback } from '@/lib/updates/agentClient';

export async function POST(req: Request) {
  let jobId: string | null = null;

  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'update_core');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền rollback core' }, { status: 403 });
    }

    const body = await req.json();
    const rollbackTag = String(body?.rollbackTag || '').trim();
    if (!rollbackTag) {
      return NextResponse.json({ success: false, error: 'rollbackTag là bắt buộc.' }, { status: 400 });
    }

    const job = await createUpdateJob({
      type: 'CORE',
      targetSlug: 'ezitrans-cms',
      fromVersion: null,
      toVersion: rollbackTag,
      createdById: user?.id,
    });
    jobId = job.id;

    await markUpdateJobRunning(job.id, `Manual core rollback requested: ${rollbackTag}`);
    await enableMaintenanceMode(job.id, 'Core CMS rollback is running');
    await appendUpdateJobLog(job.id, 'Maintenance mode enabled for core rollback.');

    const agentResult = await requestCoreRollback({ rollbackTag, jobId: job.id });
    await appendUpdateJobLog(job.id, agentResult.message || agentResult.error || 'Rollback agent finished.');

    if (agentResult.success) {
      await markUpdateJobSuccess(job.id, 'Core rollback completed successfully.');
    } else {
      await markUpdateJobFailed(job.id, agentResult.error || 'Core rollback failed.', 'Core rollback failed.');
    }

    return NextResponse.json({ success: agentResult.success, jobId: job.id, agentResult });
  } catch (error: any) {
    console.error('Error rolling back core:', error);
    if (jobId) {
      await markUpdateJobFailed(jobId, error.message || 'Internal Server Error', 'Core rollback aborted.');
    }
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error', jobId }, { status: 500 });
  } finally {
    if (jobId) {
      await disableMaintenanceMode();
      await appendUpdateJobLog(jobId, 'Maintenance mode disabled.');
    }
  }
}
