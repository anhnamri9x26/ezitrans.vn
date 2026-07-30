import { HookManager } from './hooks/HookManager';
export * from './hooks/types';

// Singleton — import { hooks } from '@/lib/hooks'
export const hooks = new HookManager();

// ─── Predefined Hook Names (Constants) ──────────────────────────
// Giúp IDE autocomplete và tránh typo

export const HOOK_NAMES = {
  // Post hooks
  POST_BEFORE_SAVE: 'post.beforeSave',
  POST_AFTER_SAVE: 'post.afterSave',
  POST_AFTER_PUBLISH: 'post.afterPublish',
  POST_AFTER_DELETE: 'post.afterDelete',
  POST_CONTENT: 'post.content',

  // Comment hooks
  COMMENT_BEFORE_SAVE: 'comment.beforeSave',
  COMMENT_AFTER_APPROVE: 'comment.afterApprove',
  COMMENT_AFTER_DELETE: 'comment.afterDelete',

  // SEO hooks
  SEO_META_TITLE: 'seo.metaTitle',
  SEO_META_DESCRIPTION: 'seo.metaDescription',

  // Theme hooks
  THEME_HEADER_MENU: 'theme.headerMenu',
  THEME_FOOTER_MENU: 'theme.footerMenu',

  // Admin hooks
  ADMIN_SIDEBAR: 'admin.sidebar',

  // Page/Layout hooks
  PAGE_HEAD: 'page.head',

  // Media hooks
  UPLOAD_BEFORE_SAVE: 'upload.beforeSave',

  // Settings hooks
  SETTINGS_BEFORE_SAVE: 'settings.beforeSave',

  // System hooks
  CMS_INIT: 'cms.init',
  CMS_SHUTDOWN: 'cms.shutdown',
  PLUGIN_ACTIVATED: 'plugin.activated',
  PLUGIN_DEACTIVATED: 'plugin.deactivated',
} as const;
