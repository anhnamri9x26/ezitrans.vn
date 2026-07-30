"use client";

import { SeoSettingsPage } from '@/plugins/seo-analyzer';
import CapabilityGuard from '@/components/CapabilityGuard';

export default function YoastSeoSettingsPagePage() {
  return (
    <CapabilityGuard capability="manage_seo">
      <SeoSettingsPage />
    </CapabilityGuard>
  );
}

