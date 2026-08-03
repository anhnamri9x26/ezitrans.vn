export type CustomizerFieldType = 'text'|'textarea'|'url'|'number'|'color'|'toggle'|'select'|'image'|'shortcut'|'repeater';
export interface CustomizerOption { label:string; value:string }
export interface CustomizerRepeaterField { id:string; label:string; type:Exclude<CustomizerFieldType,'repeater'|'shortcut'>; default?:string }
export interface ThemeCustomizerField { id:string; label:string; type:CustomizerFieldType; scope?:'global'|'theme'; settingKey?:string; configPath?:string; default?:string; description?:string; options?:CustomizerOption[]; min?:number; max?:number; maxLength?:number; shortcutUrl?:string; itemFields?:CustomizerRepeaterField[]; maxItems?:number }
export interface ThemeCustomizerSection { id:string; title:string; description?:string; previewPath?:string; previewAnchor?:string; fields:ThemeCustomizerField[] }
export interface ThemeCustomizerPanel { id:string; title:string; description?:string; sections:ThemeCustomizerSection[] }
export interface ThemeCustomizerSchema { version:1; panels:ThemeCustomizerPanel[] }
export interface ThemeManifest {
  id:string; name:string; nameVi?:string; version:string; author:string; description:string; previewImage:string; supports:string[]; templates:Record<string,string>; customizer?:ThemeCustomizerPanel[]; menuLocations?:import('@/lib/navigation/types').MenuLocationDefinition[];
}
