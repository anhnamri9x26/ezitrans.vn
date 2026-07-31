import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { fetchLatestRelease, manifestFingerprint, releaseCompatibility } from '@/lib/updates/releaseRegistry';
import { getCoreBuildInfo } from '@/lib/version';
export const dynamic='force-dynamic';
export async function GET(){try{const user=await getCurrentUser();if(!(await userCan(user,'update_core')))return NextResponse.json({success:false,error:'Bạn không có quyền xem cập nhật hệ thống'},{status:403});const build=getCoreBuildInfo();const release=await fetchLatestRelease(build.channel);if(!release)return NextResponse.json({success:true,configured:false,current:build,release:null,message:'LEXI_UPDATE_REGISTRY_URL chưa được cấu hình.'});return NextResponse.json({success:true,configured:true,current:build,release:{...release,signature:undefined,fingerprint:manifestFingerprint(release)},compatibility:releaseCompatibility(release,build.version)});}catch(error:any){return NextResponse.json({success:false,error:error.message||'Không thể kiểm tra bản cập nhật.'},{status:502});}}
