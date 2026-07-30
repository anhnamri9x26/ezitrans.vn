export const LEXI_SHIELD_PLUGIN_ID = 'lexi-shield-security';
export const LEXI_SHIELD_SETTING_KEY = 'plugin_lexi_shield_enabled';

export const lexiShieldSecurityPlugin = {
  id: LEXI_SHIELD_PLUGIN_ID,
  settingKey: LEXI_SHIELD_SETTING_KEY,
  adminRoute: '/admin/settings/security',
  apiBase: '/api/security',
  features: [
    'security-health-score',
    'hardening-checklist',
    'login-activity-monitor',
    'ip-blocking',
    'two-factor-authentication',
    'static-waf',
    'file-integrity-scanner',
  ],
};
