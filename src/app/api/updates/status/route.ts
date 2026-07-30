import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { ensureCorePackage } from '@/lib/updates/jobs';
import { getMaintenanceState } from '@/lib/updates/maintenance';
import { listRestorableBackups } from '@/lib/updates/packageRestore';
import { getUpdateAgentDiagnostics } from '@/lib/updates/agentClient';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const hasCap = await userCan(user, 'update_core');
    if (!hasCap) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền xem cập nhật hệ thống' }, { status: 403 });
    }

    const corePackage = await ensureCorePackage();
    const packages = await prisma.installedPackage.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] });
    const recentJobs = await prisma.updateJob.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    const backups = await listRestorableBackups(10);
    const maintenance = await getMaintenanceState();
    const agentDiagnostics = await getUpdateAgentDiagnostics();

    return NextResponse.json({
      success: true,
      core: corePackage,
      packages,
      recentJobs,
      backups,
      maintenance,
      updateAgent: {
        configured: agentDiagnostics.configured || Boolean(process.env.UPDATE_AGENT_URL),
        reachable: agentDiagnostics.reachable,
        diagnostics: agentDiagnostics.diagnostics,
        lastError: agentDiagnostics.lastError,
        simulateUpdates: process.env.SIMULATE_UPDATES !== 'false',
        coreImageRepository: process.env.CORE_IMAGE_REPOSITORY || 'ezitrans-cms',
        coreVersion: process.env.CORE_VERSION || corePackage.version,
      },
    });
  } catch (error: any) {
    console.error('Error loading update status:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
