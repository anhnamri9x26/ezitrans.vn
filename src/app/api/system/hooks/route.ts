import { NextResponse } from 'next/server';
import { hooks } from '@/lib/hooks';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const isAdmin = user && await userCan(user, 'manage_settings');
    
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await hooks.ensureInitialized();
    const detailedHooks = hooks.getAllHooksDetails();
    const errors = hooks.getErrorLog(50);
    const enabled = hooks.enabled;

    return NextResponse.json({
      success: true,
      hooks: detailedHooks,
      errors,
      enabled
    });
  } catch (error: any) {
    console.error('Error fetching hooks dashboard data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
