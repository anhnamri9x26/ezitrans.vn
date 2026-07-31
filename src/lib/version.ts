export type ReleaseChannel = 'internal' | 'canary' | 'stable';
export interface CoreBuildInfo { product: 'lexi-cms'; version: string; commit: string; builtAt: string; channel: ReleaseChannel; imageDigest: string | null; }
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
export function isSemanticVersion(value: string): boolean { return SEMVER_PATTERN.test(value.trim()); }
export function compareSemanticVersions(left: string, right: string): number {
 const a=left.match(SEMVER_PATTERN); const b=right.match(SEMVER_PATTERN); if(!a||!b) throw new Error(`Invalid semantic version comparison: ${left} / ${right}`);
 for(let i=1;i<=3;i++){const d=Number(a[i])-Number(b[i]);if(d!==0)return d>0?1:-1;}
 const ap=a[4];const bp=b[4];if(!ap&&!bp)return 0;if(!ap)return 1;if(!bp)return -1;return ap.localeCompare(bp,undefined,{numeric:true});
}
export function getCoreBuildInfo(): CoreBuildInfo {
 const value=process.env.LEXI_UPDATE_CHANNEL||'stable';
 const channel:ReleaseChannel=['internal','canary','stable'].includes(value)?value as ReleaseChannel:'stable';
 return {product:'lexi-cms',version:process.env.CORE_VERSION||process.env.npm_package_version||'0.1.0',commit:process.env.CORE_GIT_SHA||process.env.VERCEL_GIT_COMMIT_SHA||'development',builtAt:process.env.CORE_BUILD_TIME||'development',channel,imageDigest:process.env.CORE_IMAGE_DIGEST||null};
}
