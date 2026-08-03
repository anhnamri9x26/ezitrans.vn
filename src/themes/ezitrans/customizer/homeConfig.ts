import { DEFAULT_HOME_CONFIG, type HomeConfig } from './defaultHomeConfig';
const clone=()=>structuredClone(DEFAULT_HOME_CONFIG);
const text=(value:unknown,fallback:string,max=2000)=>typeof value==='string'?value.slice(0,max):fallback;
const isPartialConfig=(value:unknown):value is Partial<HomeConfig>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
export function parseHomeConfig(raw?:string):HomeConfig{if(!raw)return clone();try{const input:unknown=JSON.parse(raw);if(!isPartialConfig(input))return clone();const merged={...clone(),...input,version:1} as HomeConfig;merged.sectionOrder=Array.isArray(merged.sectionOrder)?merged.sectionOrder.filter(id=>['hero','why','buy','ship','export','process','testimonials','news'].includes(id)):DEFAULT_HOME_CONFIG.sectionOrder;return merged}catch{return clone()}}
export function resolveTemplate(value:string,settings:Record<string,string>){return text(value,'').replaceAll('{site_name}',settings.site_title||'Website').replaceAll('{phone}',settings.footer_phone||'').replaceAll('{email}',settings.footer_email||'').replaceAll('{page_url}',settings.site_url||'')}
