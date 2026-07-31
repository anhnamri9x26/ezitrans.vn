import { NextResponse } from 'next/server';
import { getCoreBuildInfo } from '@/lib/version';
export const dynamic = 'force-dynamic';
export async function GET() {
 const build=getCoreBuildInfo();
 return NextResponse.json({status:'alive',product:build.product,version:build.version,commit:build.commit,timestamp:new Date().toISOString()},{headers:{'Cache-Control':'no-store, max-age=0'}});
}
