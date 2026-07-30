import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/security/apiGuard';
import { requireLexiShieldEnabled } from '@/lib/security/pluginGuard';
import { runSecurityScan } from '@/lib/security/scanner';

export async function GET() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;
    const pluginError = await requireLexiShieldEnabled();
    if (pluginError) return pluginError;

    const scans = await prisma.securityScan.findMany({ orderBy: { startedAt: 'desc' }, take: 20 });
    const latestScanId = scans.length > 0 ? scans[0].id : null;
    
    // Only return findings for the latest scan to reduce noise, unless a specific scope is needed later
    const findings = latestScanId 
      ? await prisma.securityFinding.findMany({ where: { scanId: latestScanId }, orderBy: { createdAt: 'desc' }, take: 500 })
      : [];
      
    const baselineCount = await prisma.fileIntegritySnapshot.count();

    const parsedScans = scans.map(s => ({
      ...s,
      summaryData: s.summary ? JSON.parse(s.summary) : null
    }));

    return NextResponse.json({ success: true, scans: parsedScans, findings, baselineCount, latestScanId });
  } catch (error: any) {
    console.error('Error fetching scanner data:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;
    const pluginError = await requireLexiShieldEnabled();
    if (pluginError) return pluginError;

    const result = await runSecurityScan();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error running security scan:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
