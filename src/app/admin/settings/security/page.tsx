"use client";

import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Activity, Search, Trash2, CheckCircle, Ban, Database, FileWarning, Radar, RefreshCw } from 'lucide-react';

export default function SecurityCenter() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [ipRules, setIpRules] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [baselineCount, setBaselineCount] = useState(0);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [pluginEnabled, setPluginEnabled] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchIpRules();
    fetchScannerData();
    fetchHealth();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/security/events');
      if (res.status === 403) {
        setPluginEnabled(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchIpRules = async () => {
    try {
      const res = await fetch('/api/security/ip-rules');
      if (res.status === 403) {
        setPluginEnabled(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setIpRules(data.rules || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchScannerData = async () => {
    try {
      const res = await fetch('/api/security/scanner/scan');
      if (res.status === 403) {
        setPluginEnabled(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setScans(data.scans || []);
        setFindings(data.findings || []);
        setBaselineCount(data.baselineCount || 0);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/security/health');
      if (res.status === 403) {
        setPluginEnabled(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTakeBaseline = async () => {
    if (!confirm('Chụp baseline mới sẽ cập nhật mã băm hiện tại của hệ thống. Chỉ thực hiện khi bạn tin mã nguồn đang sạch. Tiếp tục?')) return;
    setScannerLoading(true);
    try {
      const res = await fetch('/api/security/scanner/baseline', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Đã tạo baseline thành công');
        await fetchScannerData();
      } else {
        alert(data.error || 'Không thể tạo baseline');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối khi tạo baseline');
    }
    setScannerLoading(false);
  };

  const handleRunScan = async () => {
    setScannerLoading(true);
    try {
      const res = await fetch('/api/security/scanner/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Quét xong: ${data.summary?.findings || 0} cảnh báo được phát hiện.`);
        await fetchScannerData();
      } else {
        alert(data.error || 'Không thể chạy quét');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối khi chạy scanner');
    }
    setScannerLoading(false);
  };

  const renderDashboard = () => {
    const score = health?.score ?? 0;
    const grade = health?.grade || 'warning';
    const gradeClass = grade === 'good' ? 'from-emerald-500 to-teal-600' : grade === 'danger' ? 'from-red-500 to-rose-700' : 'from-amber-400 to-orange-600';
    const loginEvents = events.filter((e: any) => ['login_success', 'login_failed', 'login_locked', 'two_factor_failed', 'new_ip_login'].includes(e.type));

    return (
      <div className="space-y-6">
        <div className={`rounded-2xl bg-gradient-to-br ${gradeClass} text-white p-8 shadow-xl overflow-hidden relative`}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-white/80">Security Health Score</p>
              <h2 className="text-5xl font-black mt-2">{score}/100</h2>
              <p className="mt-3 text-white/90 max-w-2xl">
                {grade === 'good' ? 'Website đang ở trạng thái bảo mật tốt.' : grade === 'danger' ? 'Website có rủi ro cần xử lý sớm.' : 'Website ổn nhưng vẫn còn một số điểm nên cải thiện.'}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur px-5 py-4 rounded-xl border border-white/20">
              <p className="text-xs text-white/80">24h gần đây</p>
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div><b>{health?.metrics?.failedLogins || 0}</b><br/>Login fail</div>
                <div><b>{health?.metrics?.newIpLogins || 0}</b><br/>IP mới</div>
                <div><b>{health?.metrics?.blockedIps || 0}</b><br/>IP chặn</div>
                <div><b>{health?.metrics?.highRiskFindings || 0}</b><br/>High risk</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-900">Hardening Checklist</h3>
              <p className="text-sm text-gray-500">Các việc quan trọng giúp website an toàn hơn.</p>
            </div>
            <div className="divide-y divide-gray-100">
              {(health?.checklist || []).map((item: any) => (
                <div key={item.id} className="p-4 flex gap-4 items-start hover:bg-gray-50">
                  <span className={`mt-0.5 inline-flex w-7 h-7 items-center justify-center rounded-full ${item.status === 'safe' ? 'bg-green-100 text-green-700' : item.status === 'danger' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {item.status === 'safe' ? '✓' : item.status === 'danger' ? '!' : '⚠'}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-semibold text-gray-900">{item.label}</h4>
                      <span className="text-xs font-bold text-gray-400">+{item.points} điểm</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    {item.status !== 'safe' && <p className="text-xs text-blue-600 mt-2 font-medium">Gợi ý: {item.action}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-lg text-gray-900">Recommended Actions</h3>
              <div className="mt-4 space-y-3">
                {(health?.recommendations || []).length > 0 ? health.recommendations.map((action: string, i: number) => (
                  <div key={i} className="text-sm p-3 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">{action}</div>
                )) : <div className="text-sm p-3 rounded-lg bg-green-50 text-green-700">Không có hành động khẩn cấp.</div>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-lg text-gray-900">Tổng quan nhanh</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span>Admin bật 2FA</span><b>{health?.metrics?.adminsWith2fa || 0}/{health?.metrics?.adminsTotal || 0}</b></div>
                <div className="flex justify-between"><span>Baseline files</span><b>{health?.metrics?.baselineCount || 0}</b></div>
                <div className="flex justify-between"><span>Security events</span><b>{health?.metrics?.recentEvents || 0}</b></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg text-gray-800">Login Activity gần đây</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-gray-50 text-gray-600 text-sm"><th className="p-4 border-b font-medium">Thời gian</th><th className="p-4 border-b font-medium">Loại</th><th className="p-4 border-b font-medium">IP</th><th className="p-4 border-b font-medium">Chi tiết</th></tr></thead>
            <tbody>
              {loginEvents.slice(0, 10).map((event: any) => (
                <tr key={event.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="p-4 text-sm text-gray-500">{new Date(event.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="p-4"><span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${event.severity === 'critical' ? 'bg-red-100 text-red-700' : event.severity === 'warning' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{event.type}</span></td>
                  <td className="p-4 text-sm font-mono text-gray-600">{event.ipAddress || 'N/A'}</td>
                  <td className="p-4 text-sm text-gray-800">{event.message}</td>
                </tr>
              ))}
              {loginEvents.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">Chưa có login activity.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const [newIp, setNewIp] = useState('');
  const [newType, setNewType] = useState('block');
  const [newReason, setNewReason] = useState('');

  const handleAddIpRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/security/ip-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: newIp, type: newType, reason: newReason })
      });
      if (res.ok) {
        setNewIp('');
        setNewReason('');
        fetchIpRules();
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleRemoveRule = async (id: number) => {
    if (!confirm('Xóa quy tắc này?')) return;
    try {
      const res = await fetch(`/api/security/ip-rules?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchIpRules();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderBlocking = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-lg text-gray-800 mb-4">Thêm quy tắc IP</h3>
        <form onSubmit={handleAddIpRule} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ IP</label>
            <input 
              type="text" 
              required
              placeholder="Ví dụ: 192.168.1.1" 
              value={newIp}
              onChange={e => setNewIp(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hành động</label>
            <select 
              value={newType}
              onChange={e => setNewType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="block">Chặn (Block)</option>
              <option value="allow">Cho phép (Allowlist)</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do (Tùy chọn)</label>
            <input 
              type="text" 
              placeholder="Tại sao chặn/cho phép?" 
              value={newReason}
              onChange={e => setNewReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Thêm
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-lg text-gray-800">Danh sách IP Rules</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm">
              <th className="p-4 border-b font-medium">IP</th>
              <th className="p-4 border-b font-medium">Hành động</th>
              <th className="p-4 border-b font-medium">Lý do</th>
              <th className="p-4 border-b font-medium">Ngày tạo</th>
              <th className="p-4 border-b font-medium w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {ipRules.map(rule => (
              <tr key={rule.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                <td className="p-4 font-mono text-sm">{rule.ip}</td>
                <td className="p-4">
                  {rule.type === 'block' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                      <Ban size={12} /> Bị chặn
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      <CheckCircle size={12} /> Cho phép
                    </span>
                  )}
                </td>
                <td className="p-4 text-sm text-gray-600">{rule.reason || '-'}</td>
                <td className="p-4 text-sm text-gray-500">
                  {new Date(rule.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="p-4 text-sm">
                  <button 
                    onClick={() => handleRemoveRule(rule.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {ipRules.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Chưa có quy tắc nào được tạo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderScanner = () => {
    const latestScan = scans[0];
    const criticalCount = findings.filter(f => f.severity === 'critical' || f.severity === 'high').length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100 font-medium">Baseline Snapshot</p>
                <h3 className="text-2xl font-black mt-1">{baselineCount}</h3>
                <p className="text-xs text-blue-100 mt-1">file đang được theo dõi</p>
              </div>
              <Database size={30} className="text-blue-100" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Cảnh báo hiện tại</p>
                <h3 className={`text-2xl font-black mt-1 ${criticalCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {findings.length}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{criticalCount} mức nguy hiểm cao</p>
              </div>
              <FileWarning size={30} className={criticalCount > 0 ? 'text-red-500' : 'text-green-500'} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Lần quét gần nhất</p>
                <h3 className="text-base font-bold mt-1 text-gray-900">
                  {latestScan ? new Date(latestScan.startedAt).toLocaleString('vi-VN') : 'Chưa có'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{latestScan?.status || 'idle'}</p>
              </div>
              <Radar size={30} className="text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900">File Integrity & Malware Scanner</h3>
              <p className="text-sm text-gray-500 mt-1">
                Theo dõi sự thay đổi của file mã nguồn và cảnh báo dấu hiệu mã độc.
              </p>
              {latestScan?.summaryData?.ignoredMediaChanges > 0 && (
                <p className="text-xs text-blue-600 mt-2 bg-blue-50 inline-block px-2 py-1 rounded">
                  Đã tự động ẩn {latestScan.summaryData.ignoredMediaChanges} file media mới/thay đổi để giảm nhiễu.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleTakeBaseline}
                disabled={scannerLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 disabled:opacity-60 transition"
              >
                <Database size={16} /> Tạo Baseline
              </button>
              <button
                onClick={handleRunScan}
                disabled={scannerLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {scannerLoading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                Quét ngay
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-lg text-gray-800">Cảnh báo Scanner</h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{findings.length} findings</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="p-4 border-b font-medium">Mức độ</th>
                  <th className="p-4 border-b font-medium">Loại</th>
                  <th className="p-4 border-b font-medium">File</th>
                  <th className="p-4 border-b font-medium">Chi tiết</th>
                  <th className="p-4 border-b font-medium">Gợi ý</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((finding: any) => (
                  <tr key={finding.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                        finding.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        finding.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {finding.severity}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-semibold text-gray-700">
                      {finding.type === 'new_file' ? 'File mới' :
                       finding.type === 'modified_file' ? 'File bị sửa' :
                       finding.type === 'missing_file' ? 'Mất file' :
                       finding.type === 'malware_signature' ? 'Mã độc' :
                       finding.type === 'suspicious_media' ? 'Media lạ' :
                       finding.type === 'suspicious_upload' ? 'Upload lạ' : finding.type}
                    </td>
                    <td className="p-4 text-sm font-mono text-gray-600 max-w-xs truncate" title={finding.filePath || ''}>{finding.filePath || '-'}</td>
                    <td className="p-4 text-sm text-gray-800">{finding.message}</td>
                    <td className="p-4 text-xs text-gray-500">
                      {finding.type.includes('file') ? 'Kiểm tra code. Tạo Baseline mới nếu hợp lệ.' : 'Cần xóa/kiểm tra ngay.'}
                    </td>
                  </tr>
                ))}
                {findings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Chưa có cảnh báo nào cho lần quét gần nhất.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (!pluginEnabled) {
    return (
      <div className="max-w-3xl mx-auto py-16">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-5">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Lexi Shield Security đang tắt</h1>
          <p className="text-gray-500 mt-3">
            Plugin bảo mật đã bị vô hiệu hóa trong Plugin Manager. Hãy bật lại plugin để sử dụng Security Center, IP Blocking và Scanner.
          </p>
          <a href="/admin/settings/plugins" className="inline-flex mt-6 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition">
            Mở Plugin Manager
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="text-blue-600" size={32} />
          Lexi Shield
        </h1>
        <p className="text-gray-500 mt-2">Trung tâm bảo mật và Firewall bảo vệ website của bạn.</p>
      </div>

      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Dashboard
          {activeTab === 'dashboard' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('blocking')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'blocking' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          IP Blocking
          {activeTab === 'blocking' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'scanner' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          File & Malware Scanner
          {activeTab === 'scanner' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'blocking' && renderBlocking()}
      {activeTab === 'scanner' && renderScanner()}

    </div>
  );
}
