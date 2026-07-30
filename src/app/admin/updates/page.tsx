"use client";

import React, { useEffect, useState } from 'react';
import CapabilityGuard from '@/components/CapabilityGuard';
import { RefreshCw, DownloadCloud, Database, PackageCheck, ShieldCheck, AlertTriangle, CheckCircle2, Clock3, Archive, Activity } from 'lucide-react';

interface UpdateJob {
  id: string;
  type: string;
  targetSlug: string;
  status: string;
  fromVersion?: string | null;
  toVersion?: string | null;
  log?: string | null;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

interface InstalledPackage {
  id: number;
  type: string;
  slug: string;
  name: string;
  version: string;
  latestVersion?: string | null;
  status: string;
  source: string;
}

interface PackageBackup {
  id: number;
  packageSlug: string;
  packageType: string;
  version: string;
  backupPath: string;
  createdAt: string;
  backupExists?: boolean;
  payloadExists?: boolean;
  canRestore?: boolean;
  restoreBlockReason?: string | null;
  installedPackage?: InstalledPackage | null;
}

export default function UpdatesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rollbackTag, setRollbackTag] = useState('');

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/updates/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Could not load update status.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Could not connect to update status API.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const runCoreUpdate = async () => {
    if (!confirm(isRealMode ? `Start REAL Docker core update to ${targetImage}? The app container may restart. A backup will be created first.` : 'Start simulated one-click core update? The system will enable maintenance mode and create a backup first.')) return;
    setIsUpdating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/updates/core', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Core update job completed with backup: ${data.jobId}` });
      } else {
        setMessage({ type: 'error', text: data.error || data.agentResult?.error || 'Core update failed.' });
      }
      await loadStatus();
    } catch {
      setMessage({ type: 'error', text: 'Could not start core update.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const runDatabaseUpdate = async () => {
    if (!confirm('Start database update? A pre-update backup will be required first.')) return;
    setIsUpdating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/updates/database', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Database update job completed with backup: ${data.jobId}` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Database update failed.' });
      }
      await loadStatus();
    } catch {
      setMessage({ type: 'error', text: 'Could not start database update.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const runBackupAction = async (backup: PackageBackup, action: 'dry-run' | 'restore') => {
    if (action === 'restore') {
      const ok = confirm(`Restore ${backup.packageType} ${backup.packageSlug} from backup v${backup.version}? Current folder will be snapshotted first.`);
      if (!ok) return;
    }

    setIsUpdating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/updates/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, backupId: backup.id }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || (action === 'dry-run' ? 'Dry-run restore passed.' : 'Restore completed.') });
      } else {
        setMessage({ type: 'error', text: data.error || 'Restore action failed.' });
      }
      await loadStatus();
    } catch {
      setMessage({ type: 'error', text: 'Could not run backup restore action.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const runCoreRollback = async () => {
    const tag = rollbackTag.trim();
    if (!tag) {
      setMessage({ type: 'error', text: 'Enter a rollback tag first.' });
      return;
    }
    if (!confirm(`Rollback core CMS to ${tag}? The app container may restart.`)) return;

    setIsUpdating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/updates/core/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollbackTag: tag }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Core rollback job completed: ${data.jobId}` });
      } else {
        setMessage({ type: 'error', text: data.error || data.agentResult?.error || 'Core rollback failed.' });
      }
      await loadStatus();
    } catch {
      setMessage({ type: 'error', text: 'Could not start core rollback.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const core = status?.core as InstalledPackage | undefined;
  const plugins = (status?.packages || []).filter((p: InstalledPackage) => p.type === 'PLUGIN');
  const themes = (status?.packages || []).filter((p: InstalledPackage) => p.type === 'THEME');
  const runtimePlugins = plugins.filter((p: InstalledPackage) => p.source === 'CONTENT');
  const runtimeThemes = themes.filter((p: InstalledPackage) => p.source === 'CONTENT');
  const recentJobs = (status?.recentJobs || []) as UpdateJob[];
  const backups = (status?.backups || []) as PackageBackup[];
  const maintenance = status?.maintenance;
  const agent = status?.updateAgent;
  const diagnostics = agent?.diagnostics;
  const isRealMode = agent?.simulateUpdates === false;
  const targetImage = `${agent?.coreImageRepository || 'ezitrans-cms'}:${core?.latestVersion || agent?.coreVersion || core?.version || 'local'}`;
  const dockerDf = diagnostics?.dockerSystemDf;
  const dockerDfText = dockerDf?.stdout || dockerDf?.stderr || dockerDf?.error || 'No Docker disk usage data yet.';
  const dockerVersionText = diagnostics?.dockerVersion?.stdout || diagnostics?.dockerVersion?.error || 'Unknown';
  const composeVersionText = diagnostics?.composeVersion?.stdout || diagnostics?.composeVersion?.error || 'Unknown';

  return (
    <CapabilityGuard capability="update_core">
      <div className="max-w-6xl mx-auto pb-12 text-xs">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-8 shadow-2xl shadow-indigo-950/20 mb-6 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,.35),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,.18),transparent_30%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100 ring-1 ring-white/15 mb-4">
                <ShieldCheck size={13} /> Docker-first Update Center
              </div>
              <h1 className="text-3xl font-black tracking-tight">One-Click Updates</h1>
              <p className="mt-2 max-w-2xl text-sm text-indigo-100/85">
                WordPress-like updates with maintenance mode, mandatory backups, update jobs, logs, and rollback-ready architecture.
              </p>
            </div>
            <button
              onClick={() => { setIsLoading(true); loadStatus(); }}
              className="rounded-2xl bg-white/10 px-4 py-2 font-bold text-white ring-1 ring-white/15 hover:bg-white/15 transition-all flex items-center gap-2"
            >
              <RefreshCw size={14} /> Check again
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-5 rounded-2xl border p-4 font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {message.text}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">Loading update status...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <section className="lg:col-span-2 space-y-5">
              <div className={`rounded-3xl border p-5 shadow-sm ${isRealMode ? 'border-red-200 bg-red-50 text-red-900' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
                <h2 className="text-lg font-black flex items-center gap-2"><ShieldCheck size={18} /> Update Execution Mode</h2>
                <p className="mt-2 font-bold">{isRealMode ? 'Real Docker mode' : 'Simulation mode'}</p>
                <p className="mt-1 text-xs">Target image: <strong>{targetImage}</strong></p>
                {isRealMode ? (
                  <p className="mt-2 rounded-2xl bg-white/60 p-3 text-xs font-bold">Real mode can pull images, recreate the app container, health-check, and attempt rollback.</p>
                ) : (
                  <p className="mt-2 rounded-2xl bg-white/60 p-3 text-xs font-bold">Safe dry-run: backups and jobs run, but update-agent skips Docker pull/restart.</p>
                )}
              </div>
              <div className={`rounded-3xl border p-5 shadow-sm ${maintenance?.enabled ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                <h2 className="text-lg font-black flex items-center gap-2"><Activity size={18} /> Maintenance Mode</h2>
                <p className="mt-2 font-bold">{maintenance?.enabled ? 'Enabled' : 'Disabled'}</p>
                {maintenance?.enabled && <p className="mt-1 text-xs">{maintenance.reason} · Job {maintenance.jobId}</p>}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><ShieldCheck className="text-orange-600" size={18} /> Docker Recovery</h2>
                    <p className="mt-2 text-slate-500">Update-agent: <strong>{agent?.configured ? (agent?.reachable ? 'Reachable' : 'Configured but unreachable') : 'Not configured'}</strong></p>
                    {agent?.lastError && <p className="mt-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-[11px] font-bold text-red-700">{agent.lastError}</p>}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black ${agent?.reachable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {agent?.reachable ? 'Diagnostics online' : 'Diagnostics limited'}
                  </span>
                </div>
                <div className="mt-4 grid md:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="font-black text-slate-700">Current image</p>
                    <p className="mt-1 break-all text-[10px] text-slate-500">{diagnostics?.currentImage || 'Unknown'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="font-black text-slate-700">Compose project</p>
                    <p className="mt-1 break-all text-[10px] text-slate-500">{diagnostics?.composeProjectDir || 'Unknown'}</p>
                  </div>
                </div>
                <details className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <summary className="cursor-pointer font-black text-slate-700">Docker diagnostics</summary>
                  <p className="mt-3 font-bold text-slate-500">Docker version</p>
                  <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-2 text-[10px] text-slate-500">{dockerVersionText}</pre>
                  <p className="mt-3 font-bold text-slate-500">Compose version</p>
                  <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-2 text-[10px] text-slate-500">{composeVersionText}</pre>
                  <p className="mt-3 font-bold text-slate-500">Docker system df</p>
                  <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-2 text-[10px] text-slate-500">{dockerDfText}</pre>
                </details>
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                  <strong>Docker Desktop metadata I/O errors:</strong> restart Docker Desktop, check disk space, run <code>docker system df</code>, and only prune/reset Docker data manually after review.
                </div>
                <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="font-black text-indigo-900">Manual Core Rollback</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={rollbackTag}
                      onChange={(event) => setRollbackTag(event.target.value)}
                      placeholder={`${agent?.coreImageRepository || 'ezitrans-cms'}:rollback-...`}
                      className="min-w-0 flex-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                    />
                    <button onClick={runCoreRollback} disabled={isUpdating} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 disabled:opacity-50">
                      Rollback Core Image
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><DownloadCloud className="text-indigo-600" size={20} /> Core CMS</h2>
                    <p className="mt-1 text-slate-500">Current version: <strong>{core?.version || 'unknown'}</strong></p>
                    <p className="mt-1 text-slate-400">Source: {core?.source || 'DOCKER_IMAGE'} · Status: {core?.status || 'ACTIVE'}</p>
                  </div>
                  <button
                    onClick={runCoreUpdate}
                    disabled={isUpdating}
                    className="rounded-2xl bg-indigo-600 px-5 py-3 text-white font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60 transition-all"
                  >
                    {isUpdating ? 'Updating...' : 'Update Now'}
                  </button>
                </div>
                <div className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 flex gap-3">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <div>
                    <strong>Milestone 3 safety flow:</strong> update actions now enable maintenance mode and require a pre-update backup before simulation/agent execution.
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><PackageCheck className="text-violet-600" size={18} /> Plugins</h2>
                  <p className="mt-2 text-slate-500">{plugins.length} tracked plugins · {runtimePlugins.length} runtime content packages.</p>
                  <p className="mt-2 rounded-2xl bg-violet-50 border border-violet-100 p-3 text-[11px] font-bold text-violet-700">ZIP uploads now install into content/plugins with backup and rollback-safe swaps.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><PackageCheck className="text-cyan-600" size={18} /> Themes</h2>
                  <p className="mt-2 text-slate-500">{themes.length} tracked themes · {runtimeThemes.length} runtime content packages.</p>
                  <p className="mt-2 rounded-2xl bg-cyan-50 border border-cyan-100 p-3 text-[11px] font-bold text-cyan-700">ZIP uploads now install into content/themes with backup and rollback-safe swaps.</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Database className="text-emerald-600" size={18} /> Database</h2>
                  <button onClick={runDatabaseUpdate} disabled={isUpdating} className="rounded-2xl bg-emerald-600 px-4 py-2 font-black text-white hover:bg-emerald-700 disabled:opacity-60">Update Database</button>
                </div>
                <p className="mt-2 text-slate-500">Runs database update jobs through the backup-protected update tracking foundation.</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Archive className="text-orange-600" size={18} /> Recent Backups</h2>
                <div className="mt-4 space-y-3">
                  {backups.length === 0 ? <p className="text-slate-400">No backups yet.</p> : backups.map((backup) => (
                    <div key={backup.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-slate-800">{backup.packageType} · {backup.packageSlug}</strong>
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-700">v{backup.version}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${backup.canRestore ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {backup.canRestore ? 'Restore ready' : 'Blocked'}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${backup.backupExists ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                          {backup.backupExists ? 'Path OK' : 'Path missing'}
                        </span>
                        {backup.installedPackage && (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-600">
                            Current {backup.installedPackage.version} · {backup.installedPackage.status}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">{new Date(backup.createdAt).toLocaleString()}</p>
                      {backup.restoreBlockReason && (
                        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-2 text-[10px] font-bold text-amber-700">{backup.restoreBlockReason}</p>
                      )}
                      <p className="mt-2 break-all rounded-xl bg-white p-2 text-[10px] text-slate-500 border border-slate-100">{backup.backupPath}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => runBackupAction(backup, 'dry-run')}
                          disabled={isUpdating || !backup.canRestore}
                          className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-black text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                        >
                          Dry Run
                        </button>
                        <button
                          onClick={() => runBackupAction(backup, 'restore')}
                          disabled={isUpdating || !backup.canRestore}
                          className="rounded-xl border border-orange-200 bg-orange-500 px-3 py-1.5 text-[10px] font-black text-white hover:bg-orange-600 disabled:opacity-50"
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><Clock3 size={18} className="text-slate-500" /> Recent Jobs</h2>
              <div className="mt-4 space-y-3">
                {recentJobs.length === 0 ? (
                  <p className="text-slate-400">No update jobs yet.</p>
                ) : recentJobs.map((job: UpdateJob) => (
                  <div key={job.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-slate-800">{job.type} · {job.targetSlug}</strong>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${job.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : job.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>{job.status}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">{new Date(job.createdAt).toLocaleString()}</p>
                    {job.error && <p className="mt-2 rounded-xl bg-red-50 p-2 text-[10px] text-red-600 border border-red-100">{job.error}</p>}
                    {job.log && <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-2 text-[10px] text-slate-500 border border-slate-100">{job.log}</pre>}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}
      </div>
    </CapabilityGuard>
  );
}
