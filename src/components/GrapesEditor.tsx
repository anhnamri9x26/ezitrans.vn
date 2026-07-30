"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { LexiPageBuilder } from '@/plugins/lexi-page-builder';
import { fetchPluginActiveState, pluginRegistry, type PluginManifest } from '@/lib/pluginRegistry';

const LEXI_PAGE_BUILDER_PLUGIN_ID = 'lexi-page-builder';

const lexiPageBuilderManifest: PluginManifest = {
  id: LEXI_PAGE_BUILDER_PLUGIN_ID,
  name: 'Lexi Page Builder',
  nameEn: 'Lexi Page Builder',
  description: 'Trình thiết kế trang kéo thả trực quan hỗ trợ 20+ block, Form Builder, AI Copilot và Template System.',
  version: '1.0.0',
  author: 'Lexi Team',
  icon: 'layout',
  iconColor: '#6366f1',
  settingKey: 'plugin_lexi_page_builder_enabled',
  category: 'builder',
  requires: [],
  adminRoute: '/settings/page-builder',
  capabilities: ['drag-drop-editor', 'page-builder', 'form-builder', 'template-builder', 'html-renderer', 'ai-copilot', 'responsive-preview'],
  componentPath: '@/plugins/lexi-page-builder',
  updateChannels: ['zip', 'git'],
  repository: null,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-06-13',
      changes: ['Đăng ký Page Builder như một plugin chính thức'],
    },
  ],
};

pluginRegistry.registerBuilder(lexiPageBuilderManifest);

type CraftEditorProps = React.ComponentProps<typeof LexiPageBuilder>;

export default function GrapesEditor(props: CraftEditorProps) {
  const [isCheckingPlugin, setIsCheckingPlugin] = useState(true);
  const [isPluginActive, setIsPluginActive] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchPluginActiveState(LEXI_PAGE_BUILDER_PLUGIN_ID, true).then(active => {
      if (!isMounted) return;
      setIsPluginActive(active);
      setIsCheckingPlugin(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingPlugin) {
    return (
      <div className="min-h-[420px] flex items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 shadow-2xl backdrop-blur-xl">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-300" />
          <span className="text-sm font-semibold">Đang khởi tạo Lexi Page Builder...</span>
        </div>
      </div>
    );
  }

  if (!isPluginActive) {
    return (
      <div className="min-h-[420px] flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_#4f46e5_0,_#111827_45%,_#020617_100%)] p-8 text-white">
        <div className="max-w-xl rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/30">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Lexi Page Builder đang bị tắt</h2>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            Plugin thiết kế trang kéo thả đã được tắt trong Plugin Manager. Hãy bật lại plugin để chỉnh sửa nội dung bằng trình dựng trực quan.
          </p>
          <Link
            href="/admin/settings/plugins"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-indigo-50"
          >
            Mở Plugin Manager
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return <LexiPageBuilder {...props} />;
}
