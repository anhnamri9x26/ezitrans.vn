export type PluginCategory = 'seo' | 'security' | 'email' | 'analytics' | 'editor' | 'page-builder' | 'system' | 'other' | 'communication' | 'engagement' | 'builder' | 'ecommerce';

export const VALID_PLUGIN_CATEGORIES: PluginCategory[] = [
  'seo',
  'security',
  'email',
  'analytics',
  'editor',
  'page-builder',
  'system',
  'other',
  'communication',
  'engagement',
  'builder',
  'ecommerce'
];

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface PluginManifest {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  version: string;
  author: string;
  icon?: string;
  iconColor?: string;
  settingKey: string;
  category: PluginCategory;
  requires: string[];
  adminRoute: string | null;
  capabilities: string[];
  entry: string;
  componentPath?: string;
  updateChannels?: Array<'zip' | 'git'>;
  repository?: string | null;
  changelog: ChangelogEntry[];
  hooks?: string | null;
}
