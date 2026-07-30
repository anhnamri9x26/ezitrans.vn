"use client";

import React, { useState } from 'react';
import { X, GitCompare, ChevronRight, FileText, LayoutList, Paintbrush } from 'lucide-react';
import { renderDiffHtml, renderLeftDiffHtml, renderRightDiffHtml, stripHtml } from '@/lib/diff';

interface Revision {
  id: string;
  version: number;
  revisionName: string | null;
  builderData: string;
  htmlContent: string;
  createdAt: string;
  commitMessage: string | null;
}

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisionA: Revision;
  revisionB: Revision; // usually newer
}

export default function CompareModal({
  isOpen,
  onClose,
  revisionA,
  revisionB,
}: CompareModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'structure' | 'style'>('text');

  if (!isOpen) return null;

  // 1. Text Diff calculation
  const oldText = stripHtml(revisionA.htmlContent);
  const newText = stripHtml(revisionB.htmlContent);
  const textDiffHtml = renderDiffHtml(oldText, newText);
  const leftDiffHtml = renderLeftDiffHtml(oldText, newText);
  const rightDiffHtml = renderRightDiffHtml(oldText, newText);

  // 2. Parse builder data for structure and style comparisons
  const structureDiffs: { type: 'add' | 'remove' | 'move'; message: string }[] = [];
  const styleDiffs: { component: string; property: string; oldVal: string; newVal: string }[] = [];

  try {
    const dataA = JSON.parse(revisionA.builderData);
    const dataB = JSON.parse(revisionB.builderData);

    const keysA = Object.keys(dataA);
    const keysB = Object.keys(dataB);

    // Added elements
    const addedKeys = keysB.filter(k => !keysA.includes(k));
    addedKeys.forEach(k => {
      const compName = dataB[k]?.displayName || dataB[k]?.type?.resolvedName || "Thành phần";
      structureDiffs.push({
        type: 'add',
        message: `Thêm mới ${compName} (${k.substring(0, 6)})`
      });
    });

    // Removed elements
    const removedKeys = keysA.filter(k => !keysB.includes(k));
    removedKeys.forEach(k => {
      const compName = dataA[k]?.displayName || dataA[k]?.type?.resolvedName || "Thành phần";
      structureDiffs.push({
        type: 'remove',
        message: `Xóa ${compName} (${k.substring(0, 6)})`
      });
    });

    // Moved or edited elements
    keysB.forEach(k => {
      if (keysA.includes(k)) {
        const nodeA = dataA[k];
        const nodeB = dataB[k];

        // Check moves (parent changed)
        if (nodeA.parent !== nodeB.parent) {
          const compName = nodeB.displayName || nodeB.type?.resolvedName || "Thành phần";
          structureDiffs.push({
            type: 'move',
            message: `Di chuyển ${compName} (${k.substring(0, 6)})`
          });
        }

        // Compare props for style differences
        const propsA = nodeA.props || {};
        const propsB = nodeB.props || {};
        
        const allPropKeys = Array.from(new Set([...Object.keys(propsA), ...Object.keys(propsB)]));
        allPropKeys.forEach(propKey => {
          // Skip text content or functions
          if (propKey === 'text' || typeof propsA[propKey] === 'object' || typeof propsB[propKey] === 'object') {
            return;
          }

          if (propsA[propKey] !== propsB[propKey]) {
            const oldVal = propsA[propKey] !== undefined ? String(propsA[propKey]) : '(Trống)';
            const newVal = propsB[propKey] !== undefined ? String(propsB[propKey]) : '(Trống)';
            const compName = nodeB.displayName || nodeB.type?.resolvedName || "Thành phần";

            // Format property name to human readable
            let propLabel = propKey;
            if (propKey === 'backgroundColor') propLabel = 'Màu nền';
            else if (propKey === 'textColor') propLabel = 'Màu chữ';
            else if (propKey === 'fontSize') propLabel = 'Cỡ chữ';
            else if (propKey === 'fontWeight') propLabel = 'Độ đậm';
            else if (propKey === 'marginTop') propLabel = 'Lề trên';
            else if (propKey === 'marginBottom') propLabel = 'Lề dưới';
            else if (propKey === 'paddingTop') propLabel = 'Khoảng đệm trên';
            else if (propKey === 'paddingBottom') propLabel = 'Khoảng đệm dưới';
            else if (propKey === 'textAlign') propLabel = 'Căn lề';

            styleDiffs.push({
              component: `${compName} (${k.substring(0, 6)})`,
              property: propLabel,
              oldVal,
              newVal,
            });
          }
        });
      }
    });

  } catch (err) {
    console.error("Error diffing revisions builderData:", err);
  }

  const nameA = revisionA.revisionName || `Bản lưu v${revisionA.version}`;
  const nameB = revisionB.revisionName || `Bản lưu v${revisionB.version}`;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="fixed inset-0 cursor-default" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full h-[80vh] flex flex-col z-10 mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 shrink-0 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-teal-200 flex items-center justify-center ring-1 ring-white/10 shadow-lg">
              <GitCompare size={19} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">So sánh phiên bản</h3>
              <p className="text-[10px] text-teal-100/70 font-bold uppercase tracking-wider mt-0.5">
                Xem khác biệt trước khi khôi phục
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Đóng cửa sổ so sánh"
            className="p-1.5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Versions Banner */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 shrink-0">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs">
            <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="inline-flex bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-black">Gốc · V{revisionA.version}</span>
              <p className="mt-1 truncate font-black text-slate-800" title={nameA}>{nameA}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <ChevronRight size={16} />
            </div>
            <div className="min-w-0 rounded-xl border border-teal-100 bg-teal-50/70 p-3">
              <span className="inline-flex bg-teal-500 text-white px-2 py-0.5 rounded-md text-[10px] font-black">Mới · V{revisionB.version}</span>
              <p className="mt-1 truncate font-black text-teal-800" title={nameB}>{nameB}</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 py-3 border-b border-slate-100 flex gap-2 shrink-0 bg-slate-50/70 overflow-x-auto">
          <button
            onClick={() => setActiveTab('text')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'text'
                ? 'bg-white text-teal-700 shadow-sm ring-1 ring-teal-100'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'
            }`}
          >
            <FileText size={14} />
            Nội dung ({textDiffHtml ? 'Có thay đổi' : 'Không đổi'})
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'structure'
                ? 'bg-white text-teal-700 shadow-sm ring-1 ring-teal-100'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'
            }`}
          >
            <LayoutList size={14} />
            Cấu trúc ({structureDiffs.length})
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'style'
                ? 'bg-white text-teal-700 shadow-sm ring-1 ring-teal-100'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'
            }`}
          >
            <Paintbrush size={14} />
            Thiết lập ({styleDiffs.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 min-h-0">
          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Đỏ = nội dung bị xóa</span>
                <span>Xanh = nội dung được thêm</span>
              </div>
              {textDiffHtml ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-rose-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-rose-50 border-b border-rose-100 text-[11px] font-black text-rose-700 uppercase tracking-wide">
                      Phiên bản gốc
                    </div>
                    <div
                      className="p-4 text-sm text-slate-700 leading-relaxed font-sans min-h-[180px] whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: leftDiffHtml || '<span class="text-slate-400">Không có nội dung.</span>' }}
                    />
                  </div>
                  <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-[11px] font-black text-emerald-700 uppercase tracking-wide">
                      Canvas hiện tại / mới
                    </div>
                    <div
                      className="p-4 text-sm text-slate-700 leading-relaxed font-sans min-h-[180px] whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: rightDiffHtml || '<span class="text-slate-400">Không có nội dung.</span>' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center text-slate-400 font-medium shadow-sm">
                  Không tìm thấy thay đổi nào về nội dung chữ.
                </div>
              )}
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-2">
              {structureDiffs.length > 0 ? (
                structureDiffs.map((diff, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-medium shadow-sm transition-all ${
                      diff.type === 'add'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : diff.type === 'remove'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : 'bg-amber-50 border-amber-100 text-amber-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      diff.type === 'add' ? 'bg-emerald-500' : diff.type === 'remove' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    <span>{diff.message}</span>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-slate-100 rounded-xl p-10 text-center text-slate-400 font-medium">
                  Không có thay đổi nào về cấu trúc layout.
                </div>
              )}
            </div>
          )}

          {activeTab === 'style' && (
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              {styleDiffs.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="p-4">Thành phần</th>
                      <th className="p-4">Thuộc tính</th>
                      <th className="p-4">Giá trị cũ</th>
                      <th className="p-4">Giá trị mới</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {styleDiffs.map((diff, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{diff.component}</td>
                        <td className="p-4">{diff.property}</td>
                        <td className="p-4 font-mono text-rose-600 bg-rose-50/30">{diff.oldVal}</td>
                        <td className="p-4 font-mono text-emerald-600 bg-emerald-50/30">{diff.newVal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-10 text-center text-slate-400 font-medium">
                  Không có thay đổi thiết lập định dạng (style/props).
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
