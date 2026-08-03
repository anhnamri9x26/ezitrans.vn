import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FloatingContactButtons from '@/components/FloatingContactButtons';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import { getMaintenanceState } from '@/lib/updates/maintenance';
import { loadHydratedSettings } from '@/lib/navigation/settings';

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let settings: { [key: string]: string } = {};
  const userCount = await prisma.user.count().catch(() => -1);

  if (userCount === 0) {
    redirect('/setup');
  }

  try {
    settings = await loadHydratedSettings();
  } catch (e) {
    console.error("Failed to load settings in FrontendLayout:", e);
  }

  const isContactEnabled = settings['plugin_contact_enabled'] !== 'false';
  const maintenanceState = await getMaintenanceState();

  if (maintenanceState.enabled) {
    return <MaintenanceScreen state={maintenanceState} />;
  }

  return (
    <>
      {children}
      {isContactEnabled && <FloatingContactButtons settings={settings} />}
    </>
  );
}
