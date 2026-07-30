"use client";

import React, { useEffect, useState } from 'react';
import { Database, Search, Download, Trash2, Eye, X } from 'lucide-react';
import Link from 'next/link';
import CapabilityGuard from '@/components/CapabilityGuard';

interface Submission {
  id: number;
  formId: string;
  formName: string;
  pageUrl: string;
  ipAddress: string;
  userAgent: string;
  data: string;
  createdAt: string;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPluginActive, setIsPluginActive] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      // Check plugin status first
      const pluginsRes = await fetch('/api/plugins');
      const pluginsData = await pluginsRes.json();
      if (pluginsData.success && pluginsData.plugins) {
        const plugin = pluginsData.plugins.find((p: any) => p.id === 'lexi-page-builder');
        setIsPluginActive(plugin ? plugin.isActive !== false : true);
      }

      const res = await fetch('/api/forms/submissions');
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubmission = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) return;
    try {
      const res = await fetch(`/api/forms/submissions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubmissions(submissions.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const exportCsv = () => {
    if (submissions.length === 0) return;
    
    // Extract all unique headers from all submissions
    const headersSet = new Set<string>(['ID', 'Form Name', 'Page URL', 'Date', 'IP']);
    const parsedData = submissions.map(sub => {
      let fields: any = {};
      try {
        fields = JSON.parse(sub.data);
      } catch (e) {}
      
      const row: any = {
        'ID': sub.id,
        'Form Name': sub.formName,
        'Page URL': sub.pageUrl,
        'Date': new Date(sub.createdAt).toLocaleString('vi-VN'),
        'IP': sub.ipAddress,
      };

      for (const [key, value] of Object.entries(fields)) {
        if (key !== '_metadata') {
          headersSet.add(key);
          row[key] = Array.isArray(value) ? value.join(', ') : value;
        }
      }
      return row;
    });

    const headers = Array.from(headersSet);
    const csvContent = [
      headers.join(','),
      ...parsedData.map(row => 
        headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
      )
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `submissions_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = submissions.filter(s => {
    const term = search.toLowerCase();
    return s.formName.toLowerCase().includes(term) || s.data.toLowerCase().includes(term);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-medium animate-pulse">Đang tải dữ liệu phản hồi...</div>
      </div>
    );
  }

  if (!isPluginActive) {
    return (
      <div className="max-w-2xl mx-auto font-sans pt-12 pb-24 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-6 shrink-0 shadow-sm border border-indigo-100">
            <Database size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Lexi Page Builder Chưa Kích Hoạt</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
            Trình dựng trang kéo thả và các tính năng biểu mẫu đi kèm hiện đang bị tắt. Vui lòng kích hoạt lại plugin trong Plugin Manager để xem danh sách phản hồi Form.
          </p>
          <Link 
            href="/admin/settings/plugins" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-98"
          >
            Kích hoạt Plugin ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CapabilityGuard capability="view_form_submissions">
      <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Phản hồi Form</h1>
            <p className="text-sm text-slate-500">Quản lý dữ liệu người dùng gửi từ website</p>
          </div>
        </div>
        
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Download size={16} />
          <span>Xuất CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Tên Form</th>
                <th className="px-6 py-4">Nội dung chính</th>
                <th className="px-6 py-4">Trang gửi</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Không có phản hồi nào.</td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  let fields: any = {};
                  try {
                    fields = JSON.parse(sub.data);
                  } catch(e) {}
                  
                  // Extract first few fields to show as preview
                  const previewEntries = Object.entries(fields).filter(([k]) => k !== '_metadata').slice(0, 2);
                  const previewText = previewEntries.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">#{sub.id}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                          {sub.formName}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={previewText}>
                        {previewText || 'Không có dữ liệu'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-[150px]" title={sub.pageUrl}>
                        {sub.pageUrl || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(sub.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors inline-flex"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => deleteSubmission(sub.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors inline-flex"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Chi tiết phản hồi #{selectedSub.id}</h3>
                <p className="text-sm text-slate-500 mt-1">Form: {selectedSub.formName}</p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded-lg text-sm">
                <div>
                  <div className="text-slate-400 mb-1 text-xs uppercase font-semibold">Thời gian</div>
                  <div className="font-medium text-slate-700">{new Date(selectedSub.createdAt).toLocaleString('vi-VN')}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1 text-xs uppercase font-semibold">Địa chỉ IP</div>
                  <div className="font-medium text-slate-700">{selectedSub.ipAddress}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-400 mb-1 text-xs uppercase font-semibold">Trang gửi</div>
                  <a href={selectedSub.pageUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline break-all">
                    {selectedSub.pageUrl || '-'}
                  </a>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Nội dung chi tiết</h4>
              <div className="space-y-4">
                {(() => {
                  let fields: any = {};
                  try { fields = JSON.parse(selectedSub.data); } catch(e) {}
                  return Object.entries(fields).filter(([k]) => k !== '_metadata').map(([key, val]) => (
                    <div key={key} className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                      <div className="text-xs font-bold text-slate-400 mb-1 uppercase">{key}</div>
                      <div className="text-slate-800 whitespace-pre-wrap text-sm">
                        {Array.isArray(val) ? val.join(', ') : String(val)}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </CapabilityGuard>
  );
}
