"use client";

import React from 'react';
import { LayoutDashboard, Users, FileText, Database } from 'lucide-react';
import Link from 'next/link';
import CapabilityGuard from '@/components/CapabilityGuard';
import { Puzzle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/AdminI18nProvider';

export interface DashboardCardItem {
  title: string;
  value: string | number;
  description?: string;
  href?: string;
  pluginId: string;
}

interface AdminDashboardClientProps {
  extraCards?: DashboardCardItem[];
}

export default function AdminDashboardClient({ extraCards = [] }: AdminDashboardClientProps) {
  const { t } = useTranslation();

  return (
    <CapabilityGuard capability="view_dashboard">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('dashboard.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.welcome')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Tổng Bài Viết')}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Thành Viên')}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">1</p>
              </div>
            </div>
          </div>

          {extraCards.map((card, idx) => (
            <div key={`${card.pluginId}-${idx}`} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                  <Puzzle size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{card.value}</p>
                  {card.description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{card.description}</p>}
                  {card.href && (
                    <Link href={card.href} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block">
                      {t('Xem chi tiết')}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
            <Database size={20} /> {t('Chưa có dữ liệu')}
          </h2>
          <p className="text-indigo-700 dark:text-indigo-400 mb-4">
            {t('Hệ thống hiện tại chưa có dữ liệu bài viết nào. Bạn có muốn bắt đầu bằng cách import dữ liệu từ WordPress cũ không?')}
          </p>
          <Link href="/admin/tools/import" className="inline-block bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors">
            {t('Đi tới công cụ Import')}
          </Link>
        </div>
      </div>
    </CapabilityGuard>
  );
}

