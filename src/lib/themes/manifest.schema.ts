export interface ThemeManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  previewImage: string;
  supports: string[];
  templates: Record<string, string>;
  customizer?: any[];
}
