import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

async function getAdminUser() {
  const user = await getCurrentUser();
  if (user && user.role === 'ADMIN') {
    return user;
  }
  return null;
}

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Only administrators are allowed to view AI logs.' }, { status: 403 });
    }

    const logs = await prisma.aiUsageLog.findMany({
      include: {
        user: {
          select: {
            username: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Error fetching AI logs:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
