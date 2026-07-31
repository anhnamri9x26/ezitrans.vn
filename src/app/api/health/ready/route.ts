import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCoreBuildInfo } from '@/lib/version';
export const dynamic = 'force-dynamic';
function tokenMatches(request:Request){const expected=process.env.INTERNAL_HEALTH_TOKEN;if(!expected)return process.env.NODE_ENV!=='production';const auth=request.headers.get('authorization')||'';const supplied=auth.startsWith('Bearer ')?auth.slice(7):request.headers.get('x-health-token')||'';const a=Buffer.from(expected);const b=Buffer.from(supplied);return a.length===b.length&&timingSafeEqual(a,b);}
export async function GET(request:Request){
 if(!tokenMatches(request))return NextResponse.json({status:'unauthorized'},{status:401,headers:{'Cache-Control':'no-store'}});
 const build=getCoreBuildInfo();
 try{await prisma.$queryRaw`SELECT 1`;const core=await prisma.installedPackage.findUnique({where:{type_slug:{type:'CORE',slug:'ezitrans-cms'}}});return NextResponse.json({status:'ready',version:build.version,commit:build.commit,channel:build.channel,database:'ok',recordedVersion:core?.version||null,timestamp:new Date().toISOString()},{headers:{'Cache-Control':'no-store, max-age=0'}});}catch(error:any){return NextResponse.json({status:'not-ready',version:build.version,database:'error',error:error.message||'Database readiness check failed'},{status:503,headers:{'Cache-Control':'no-store, max-age=0'}});}
}
