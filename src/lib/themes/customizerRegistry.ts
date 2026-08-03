import { DEFAULT_HOME_CONFIG } from '@/themes/ezitrans/customizer/defaultHomeConfig';
import { parseHomeConfig } from '@/themes/ezitrans/customizer/homeConfig';
type JsonRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is JsonRecord => typeof value === 'object' && value !== null && !Array.isArray(value);
export function getThemeConfig(themeId:string,key:string,raw?:string):unknown{if(themeId==='ezitrans'&&key==='home_config')return parseHomeConfig(raw);if(!raw)return {};try{return JSON.parse(raw)}catch{return {}}}
export function defaultThemeConfig(themeId:string,key:string):unknown{if(themeId==='ezitrans'&&key==='home_config')return structuredClone(DEFAULT_HOME_CONFIG);return {}}
export function getConfigPath(source:unknown,path:string):unknown{return path.split('.').reduce<unknown>((value,part)=>isRecord(value)?value[part]:undefined,source)}
export function setConfigPath(source:unknown,path:string,value:unknown){const cloned=structuredClone(source);const root:JsonRecord=isRecord(cloned)?cloned:{};const parts=path.split('.');let cursor=root;parts.forEach((part,index)=>{if(index===parts.length-1){cursor[part]=value;return}const next=cursor[part];if(!isRecord(next)){cursor[part]={}}cursor=cursor[part] as JsonRecord});return root}
