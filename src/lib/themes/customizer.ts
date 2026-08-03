import type { ThemeCustomizerPanel, ThemeCustomizerField } from './manifest.schema';

export const GLOBAL_CUSTOMIZER_KEYS = new Set(['site_title','site_tagline','site_url','site_logo','site_logo_id','site_favicon','site_favicon_id','site_email','site_phone','site_address','site_legal_name','footer_about_text','footer_phone','footer_email','footer_address','footer_copyright']);
export function fieldStorageKey(themeId:string, field:ThemeCustomizerField){ if(field.scope==='global') return field.settingKey||field.id; return `theme_${themeId}_${field.settingKey||field.id}`; }
export function flattenCustomizer(panels:ThemeCustomizerPanel[]){ return panels.flatMap(panel=>panel.sections.flatMap(section=>section.fields.map(field=>({panel,section,field})))); }
export function normalizeCustomizerValue(field:ThemeCustomizerField,value:unknown):string{
 const raw=typeof value==='string'?value:String(value??'');
 if(field.type==='toggle') return raw==='true'?'true':'false';
 if(field.type==='color') return /^#[0-9a-f]{6}$/i.test(raw)?raw:String(field.default||'#0c64d0');
 if(field.type==='number'){const n=Number(raw);const safe=Number.isFinite(n)?Math.min(field.max??9999,Math.max(field.min??0,n)):Number(field.default||0);return String(safe)}
 if(field.type==='select'&&!field.options?.some(option=>option.value===raw)) return String(field.default||field.options?.[0]?.value||'');
 if(field.type==='repeater'){try{const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw 0;return JSON.stringify(parsed.slice(0,field.maxItems||20).map(item=>{const source=item&&typeof item==='object'?item:{};return Object.fromEntries((field.itemFields||[]).map(child=>[child.id,String(source[child.id]??child.default??'').slice(0,500)]))}))}catch{return String(field.default||'[]')}}
 return raw.trim().slice(0,field.maxLength||2000);
}
export function validateCustomizerSchema(themeId:string,panels:ThemeCustomizerPanel[]){const ids=new Set<string>();for(const {field} of flattenCustomizer(panels)){if(ids.has(field.id))throw new Error(`Trùng Customizer field: ${field.id}`);ids.add(field.id);if(field.scope==='global'&&!GLOBAL_CUSTOMIZER_KEYS.has(field.settingKey||field.id))throw new Error(`Global setting không được phép: ${field.settingKey||field.id}`);fieldStorageKey(themeId,field);}return panels;}
