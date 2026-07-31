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
  const [releaseStatus, setReleaseStatus] = useState<any>(null);

  const loadStatus = async () => {
    try {
      const [statusRes, releaseRes] = await Promise.all([
        fetch('/api/updates/status'),
        fetch('/api/updates/check'),
      ]);
      const data = await statusRes.json();
      const releaseData = await releaseRes.json();
      if (data.success) {
        setStatus(data);
        setReleaseStatus(releaseData);
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
    const targetVersion = releaseStatus?.release?.version || 'phiên bản mới';
    const confirmation = isRealMode
      ? `Cập nhật Lexi CMS lên ${targetVersion}? Hệ thống sẽ tự động sao lưu và có thể khởi động lại trong ít phút.`
      : `Chạy mô phỏng cập nhật lên ${targetVersion}? Hệ thống sẽ tạo bản sao lưu nhưng không thay đổi Docker.`;
    if (!confirm(confirmation)) return;
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
  const recentJobs = (status?.recentJobs || []) as UpdateJob[];
  const backups = (status?.backups || []) as PackageBackup[];
  const maintenance = status?.maintenance;
  const agent = status?.updateAgent;
  const diagnostics = agent?.diagnostics;
  const isRealMode = agent?.simulateUpdates === false;
  const updateAvailable = Boolean(releaseStatus?.configured && releaseStatus?.compatibility?.updateAvailable);
  const currentVersion = releaseStatus?.current?.version || core?.version || 'Không xác định';
  const latestVersion = releaseStatus?.release?.version || currentVersion;
  const currentImage = String(diagnostics?.currentImage || '').split('\n').find((line: string) => line.includes('ghcr.io/'))?.trim() || 'Không xác định';

  return (
    <CapabilityGuard capability="update_core">
      <div className="mx-auto max-w-6xl pb-12 text-sm text-slate-700">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-black text-slate-900">Cập nhật hệ thống</h1><p className="mt-1 text-slate-500">Kiểm tra và cài đặt phiên bản Lexi CMS mới.</p></div>
          <button onClick={() => { setIsLoading(true); loadStatus(); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold hover:bg-slate-50"><RefreshCw size={15}/> Kiểm tra lại</button>
        </header>
        {message && <div className={`mb-5 flex items-center gap-2 rounded-xl border p-4 font-bold ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{message.type === 'success' ? <CheckCircle2 size={17}/> : <AlertTriangle size={17}/>} {message.text}</div>}
        {isLoading ? <div className="rounded-xl border bg-white p-10 text-center text-slate-500">Đang kiểm tra cập nhật...</div> : <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-4"><div className={`h-fit rounded-full p-3 ${updateAvailable ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{updateAvailable ? <DownloadCloud size={24}/> : <CheckCircle2 size={24}/>}</div><div><h2 className="text-xl font-black text-slate-900">{updateAvailable ? 'Có phiên bản mới' : 'Lexi CMS đã được cập nhật'}</h2><p className="mt-2">Phiên bản hiện tại: <strong>{currentVersion}</strong>{updateAvailable && <> <span className="mx-2 text-slate-300">→</span> Mới nhất: <strong className="text-blue-700">{latestVersion}</strong></>}</p><p className="mt-2 text-xs text-slate-500">Kênh: {releaseStatus?.current?.channel || 'stable'} · {isRealMode ? 'Cập nhật thật' : 'Chế độ mô phỏng'}</p></div></div>
              <button onClick={runCoreUpdate} disabled={isUpdating || !updateAvailable || !agent?.reachable} className="rounded-lg bg-blue-600 px-5 py-2.5 font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">{isUpdating ? 'Đang cập nhật...' : updateAvailable ? `Cập nhật lên ${latestVersion}` : 'Đã mới nhất'}</button>
            </div>
            {releaseStatus?.release?.changelog?.length > 0 && <div className="mt-5 border-t pt-4"><p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Nội dung phiên bản</p><ul className="list-disc space-y-1 pl-5 text-slate-600">{releaseStatus.release.changelog.map((item: string) => <li key={item}>{item}</li>)}</ul></div>}
          </section>
          <section className="grid gap-4 md:grid-cols-3"><StatusCard label="Trạng thái" value={maintenance?.enabled ? 'Đang bảo trì' : agent?.reachable ? 'Hệ thống sẵn sàng' : 'Cần kiểm tra'} ok={agent?.reachable}/><StatusCard label="Sao lưu trước cập nhật" value="Bắt buộc và tự động" ok/><StatusCard label="Chế độ bảo trì" value={maintenance?.enabled ? 'Đang bật' : 'Đang tắt'} ok={!maintenance?.enabled}/></section>
          <div className="grid gap-5 lg:grid-cols-3"><section className="space-y-5 lg:col-span-2">
            <SimplePanel title="Lịch sử cập nhật">{recentJobs.length === 0 ? <p className="text-slate-400">Chưa có lần cập nhật nào.</p> : <div className="space-y-3">{recentJobs.map(job => <div key={job.id} className="rounded-lg border bg-slate-50 p-3"><div className="flex justify-between gap-3"><strong>{job.fromVersion || '—'} → {job.toVersion || job.targetSlug}</strong><span className={`rounded-full px-2 py-1 text-[10px] font-black ${job.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : job.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{job.status}</span></div><p className="mt-1 text-xs text-slate-400">{new Date(job.createdAt).toLocaleString('vi-VN')}</p>{job.error && <p className="mt-2 text-xs font-bold text-red-600">{job.error}</p>}</div>)}</div>}</SimplePanel>
            <SimplePanel title="Bản sao lưu gần đây">{backups.length === 0 ? <p className="text-slate-400">Chưa có bản sao lưu.</p> : <div className="space-y-3">{backups.slice(0,5).map(backup => <div key={backup.id} className="flex flex-col gap-3 rounded-lg border bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"><div><strong>{backup.packageSlug} · v{backup.version}</strong><p className="mt-1 text-xs text-slate-400">{new Date(backup.createdAt).toLocaleString('vi-VN')}</p></div><div className="flex gap-2"><button onClick={() => runBackupAction(backup,'dry-run')} disabled={!backup.canRestore || isUpdating} className="rounded-lg border bg-white px-3 py-1.5 text-xs font-bold disabled:opacity-50">Kiểm tra</button><button onClick={() => runBackupAction(backup,'restore')} disabled={!backup.canRestore || isUpdating} className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 disabled:opacity-50">Khôi phục</button></div></div>)}</div>}</SimplePanel>
          </section><aside className="h-fit rounded-xl border bg-white p-5"><h2 className="font-black text-slate-900">Thông tin kỹ thuật</h2><dl className="mt-4 space-y-3 text-xs"><Info label="Update Agent" value={agent?.reachable ? 'Đang kết nối' : 'Không kết nối được'}/><Info label="Image đang chạy" value={currentImage}/><Info label="Compose project" value={diagnostics?.composeProjectDir || 'Không xác định'}/></dl><details className="mt-4 border-t pt-4"><summary className="cursor-pointer font-bold text-slate-600">Chẩn đoán Docker</summary><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-[10px]">{diagnostics?.dockerSystemDf?.stdout || 'Chưa có dữ liệu'}</pre></details><details className="mt-4 border-t pt-4"><summary className="cursor-pointer font-bold text-red-600">Khôi phục thủ công</summary><div className="mt-3 space-y-2"><input value={rollbackTag} onChange={e => setRollbackTag(e.target.value)} placeholder="Nhập rollback tag" className="w-full rounded-lg border px-3 py-2 text-xs"/><button onClick={runCoreRollback} disabled={!rollbackTag.trim() || isUpdating} className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">Khôi phục phiên bản cũ</button></div></details></aside></div>
        </div>}
      </div>
    </CapabilityGuard>
  );
}

function StatusCard({label,value,ok}:{label:string;value:string;ok?:boolean}) { return <div className="rounded-xl border bg-white p-4"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 flex items-center gap-2 font-black text-slate-900"><span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`}/>{value}</p></div>; }
function SimplePanel({title,children}:{title:string;children:React.ReactNode}) { return <div className="rounded-xl border bg-white p-5"><h2 className="mb-4 font-black text-slate-900">{title}</h2>{children}</div>; }
function Info({label,value}:{label:string;value:string}) { return <div><dt className="font-bold text-slate-400">{label}</dt><dd className="mt-1 break-all font-medium text-slate-700">{value}</dd></div>; }