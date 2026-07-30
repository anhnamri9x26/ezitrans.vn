import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

export async function requireCapability(cap: string) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  
  const hasCap = await userCan(user, cap);
  if (!hasCap) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  
  return null; // indicates success
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
