import { NextRequest } from 'next/server';
import { prisma } from '../prisma';

export type FirewallMode = 'monitor' | 'balanced' | 'strict';

export interface FirewallResult {
  action: 'allow' | 'block';
  reason?: string;
  ruleName?: string;
}

const FORBIDDEN_PATHS = [
  '/.env',
  '/.git',
  '/wp-admin',
  '/wp-login.php',
  '/wp-config.php',
  '/phpmyadmin',
  '/xmlrpc.php',
  '/.htaccess'
];

// Basic SQLi patterns
const SQLI_PATTERNS = [
  /union\s+select/i,
  /select\s+.*\s+from/i,
  /waitfor\s+delay/i,
  /or\s+1\s*=\s*1/i,
  /drop\s+table/i
];

// Basic XSS/Traversal patterns
const XSS_PATTERNS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/i,
  /javascript:/i,
  /onerror\s*=/i,
  /\.\.\//, // directory traversal
  /%2e%2e\//i // url encoded traversal
];

const SUSPICIOUS_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /curl/i,
  /python-requests/i,
  /postman/i, // block by default in strict mode, but often used for legit API tests
];

async function getFirewallMode(): Promise<FirewallMode> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'firewall_mode' }
    });
    return (setting?.value as FirewallMode) || 'monitor';
  } catch {
    return 'monitor';
  }
}

export async function inspectRequest(request: NextRequest): Promise<FirewallResult> {
  const mode = await getFirewallMode();
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || '';
  
  // Convert URL search params to string for inspection
  const queryStr = request.nextUrl.searchParams.toString();
  const decodedQuery = decodeURIComponent(queryStr);

  // 1. Check Path
  if (FORBIDDEN_PATHS.some(p => path.toLowerCase().startsWith(p))) {
    return { action: mode === 'monitor' ? 'allow' : 'block', reason: `Forbidden path requested: ${path}`, ruleName: 'forbidden_path' };
  }

  // 2. Check User Agent (Strict mode only)
  if (mode === 'strict' && SUSPICIOUS_USER_AGENTS.some(r => r.test(userAgent))) {
    return { action: 'block', reason: `Suspicious user agent: ${userAgent}`, ruleName: 'suspicious_ua' };
  }

  // 3. Check Query string for SQLi
  if (SQLI_PATTERNS.some(r => r.test(decodedQuery))) {
    return { action: mode === 'monitor' ? 'allow' : 'block', reason: `SQLi pattern detected in query`, ruleName: 'sqli_query' };
  }

  // 4. Check Query string for XSS/Traversal
  if (XSS_PATTERNS.some(r => r.test(decodedQuery))) {
    return { action: mode === 'monitor' ? 'allow' : 'block', reason: `XSS or Traversal pattern detected in query`, ruleName: 'xss_traversal_query' };
  }

  // 5. Check Body for POST/PUT/PATCH (only stringifiable parts to avoid performance hit on large uploads)
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      // Note: In Next.js middleware, reading request body consumes it.
      // Doing this here is complex and might break subsequent handlers.
      // For Milestone 1, we skip deep body inspection in middleware and rely on specific API guards.
    } catch {
      // ignore
    }
  }

  return { action: 'allow' };
}
