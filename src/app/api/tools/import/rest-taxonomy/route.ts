import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { userCan } from '@/lib/capabilities';
import { previewWordPressTaxonomy, syncWordPressTaxonomy } from '@/lib/wordpress-rest-taxonomy';

async function authorize(){const user=await getCurrentUser();return userCan(user,'manage_tools')}
export async function GET(req:NextRequest){try{if(!await authorize())return NextResponse.json({success:false,error:'Bạn không có quyền sử dụng công cụ'},{status:403});const baseUrl=new URL(req.url).searchParams.get('baseUrl')||'https://ezitrans.vn';return NextResponse.json({success:true,preview:await previewWordPressTaxonomy(baseUrl)})}catch(error:any){return NextResponse.json({success:false,error:error.message},{status:400})}}
export async function POST(req:NextRequest){try{if(!await authorize())return NextResponse.json({success:false,error:'Bạn không có quyền sử dụng công cụ'},{status:403});const body=await req.json();return NextResponse.json({success:true,result:await syncWordPressTaxonomy(body.baseUrl||'https://ezitrans.vn',body.dryRun===true)})}catch(error:any){return NextResponse.json({success:false,error:error.message},{status:400})}}
