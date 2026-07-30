import fs from 'fs/promises';
import { constants } from 'fs';
import { getContentPath } from '@/lib/content/paths';

export interface MaintenanceState {
  enabled: boolean;
  jobId?: string;
  reason?: string;
  startedAt?: string;
}

export function getMaintenanceFilePath() {
  return getContentPath('.maintenance');
}

export async function isMaintenanceModeEnabled(): Promise<boolean> {
  try {
    await fs.access(getMaintenanceFilePath(), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function getMaintenanceState(): Promise<MaintenanceState> {
  try {
    const raw = await fs.readFile(getMaintenanceFilePath(), 'utf8');
    const parsed = JSON.parse(raw) as Omit<MaintenanceState, 'enabled'>;
    return { enabled: true, ...parsed };
  } catch {
    return { enabled: false };
  }
}

export async function enableMaintenanceMode(jobId: string, reason: string) {
  await fs.mkdir(getContentPath(), { recursive: true });
  const state: MaintenanceState = {
    enabled: true,
    jobId,
    reason,
    startedAt: new Date().toISOString(),
  };
  await fs.writeFile(getMaintenanceFilePath(), JSON.stringify(state, null, 2), 'utf8');
  return state;
}

export async function disableMaintenanceMode() {
  try {
    await fs.unlink(getMaintenanceFilePath());
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}
