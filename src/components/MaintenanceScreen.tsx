"use client";

import React from 'react';
import type { MaintenanceState } from '@/lib/updates/maintenance';

export default function MaintenanceScreen({ state }: { state: MaintenanceState }) {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,.35),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,.22),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-16">
        <section className="w-full rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl shadow-indigo-950/30 backdrop-blur-xl md:p-12">
          <div className="mb-6 inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
            Maintenance mode
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Website đang được cập nhật</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
            Hệ thống đang bật chế độ bảo trì để cập nhật an toàn và tạo bản sao lưu trước khi thay đổi.
            Vui lòng quay lại sau ít phút.
          </p>
          <div className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-200 md:grid-cols-2">
            <div>
              <div className="text-slate-400">Lý do</div>
              <strong>{state.reason || 'Đang bảo trì hệ thống'}</strong>
            </div>
            <div>
              <div className="text-slate-400">Bắt đầu</div>
              <strong>{state.startedAt ? new Date(state.startedAt).toLocaleString('vi-VN') : 'Vừa xong'}</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-8 rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-xl shadow-white/10 transition hover:-translate-y-0.5 hover:bg-cyan-50"
          >
            Kiểm tra lại
          </button>
        </section>
      </div>
    </main>
  );
}
