import { prisma } from '../prisma';
import { NextRequest } from 'next/server';

export type EventSeverity = 'info' | 'warning' | 'critical';

export interface SecurityEventParams {
  type: string;
  message: string;
  severity?: EventSeverity;
  ipAddress?: string | null;
  userAgent?: string | null;
  method?: string | null;
  path?: string | null;
  userId?: number | null;
  metadata?: Record<string, any>;
}

export async function logSecurityEvent(params: SecurityEventParams) {
  try {
    await prisma.securityEvent.create({
      data: {
        type: params.type,
        message: params.message,
        severity: params.severity || 'info',
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        method: params.method || null,
        path: params.path || null,
        userId: params.userId || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

export async function extractRequestInfo(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  return {
    ipAddress: ipAddress.split(',')[0].trim(),
    userAgent,
    method: request.method,
    path: request.nextUrl.pathname,
  };
}
