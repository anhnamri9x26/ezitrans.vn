import type { ContactChannel, ContactChannelType, ContactWidgetConfig } from './contactWidgetTypes';

const CHANNEL_DEFAULTS: Record<ContactChannelType, { label: string; color: string; newTab: boolean }> = {
  hotline: { label: 'Gọi tư vấn', color: '#ef4444', newTab: false },
  zalo: { label: 'Chat Zalo', color: '#0068ff', newTab: true },
  messenger: { label: 'Messenger', color: '#7c3aed', newTab: true },
  whatsapp: { label: 'WhatsApp', color: '#25d366', newTab: true },
  telegram: { label: 'Telegram', color: '#0088cc', newTab: true },
  viber: { label: 'Viber', color: '#7360f2', newTab: true },
  facebook: { label: 'Facebook', color: '#1877f2', newTab: true },
  instagram: { label: 'Instagram', color: '#e1306c', newTab: true },
  tiktok: { label: 'TikTok', color: '#111827', newTab: true },
  youtube: { label: 'YouTube', color: '#ff0000', newTab: true },
  map: { label: 'Bản đồ', color: '#10b981', newTab: true },
  email: { label: 'Gửi email', color: '#0c64d0', newTab: false },
  custom: { label: 'Liên hệ', color: '#3b82f6', newTab: false },
};

const safeColor = (value: unknown, fallback: string) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
const safeText = (value: unknown, fallback = '', max = 240) => typeof value === 'string' ? value.trim().slice(0, max) : fallback;
const safeBoolean = (value: unknown, fallback: boolean) => typeof value === 'boolean' ? value : fallback;
const safeOffset = (value: unknown, fallback: number) => Number.isFinite(Number(value)) ? Math.min(160, Math.max(8, Number(value))) : fallback;

export function createChannel(type: ContactChannelType, value = '', index = 0, color?: string): ContactChannel {
  const defaults = CHANNEL_DEFAULTS[type];
  return {
    id: `${type}-${Date.now()}-${index}`,
    type,
    enabled: true,
    label: defaults.label,
    value,
    color: safeColor(color, defaults.color),
    desktopEnabled: true,
    mobileEnabled: true,
    newTab: defaults.newTab,
    prefilledMessage: '',
  };
}

export const DEFAULT_CONTACT_WIDGET_CONFIG: ContactWidgetConfig = {
  version: 2,
  enabled: true,
  mode: 'hub',
  position: 'right',
  hubLabel: 'Liên hệ',
  panelTitle: 'Ezitrans hỗ trợ bạn',
  panelSubtitle: 'Chọn kênh liên hệ thuận tiện nhất',
  primaryColor: '#0c64d0',
  showMobileBar: false,
  mobileBarChannelIds: [],
  desktopOffset: 24,
  mobileOffset: 16,
  channels: [],
};

export function migrateLegacyContactSettings(settings: Record<string, string>): ContactWidgetConfig {
  const channels: ContactChannel[] = [];
  const add = (type: ContactChannelType, value: string, color?: string, label?: string) => {
    if (!value?.trim()) return;
    const channel = createChannel(type, value.trim(), channels.length, color);
    if (label) channel.label = label;
    channels.push(channel);
  };
  add('hotline', settings.contact_hotline_1, settings.contact_hotline_1_color, 'Hotline tư vấn');
  add('hotline', settings.contact_hotline_2, settings.contact_hotline_2_color, 'Hotline 2');
  add('hotline', settings.contact_hotline_3, settings.contact_hotline_3_color, 'Hotline 3');
  add('zalo', settings.contact_zalo);
  add('messenger', settings.contact_messenger);
  add('whatsapp', settings.contact_whatsapp);
  add('telegram', settings.contact_telegram);
  add('viber', settings.contact_viber);
  add('facebook', settings.contact_facebook);
  add('instagram', settings.contact_instagram);
  add('tiktok', settings.contact_tiktok);
  add('youtube', settings.contact_youtube);
  add('map', settings.contact_map, settings.contact_map_color);
  add('custom', settings.contact_link, settings.contact_link_color);
  const primaryIds = channels.filter(channel => ['hotline', 'zalo', 'messenger'].includes(channel.type)).slice(0, 3).map(channel => channel.id);
  return { ...DEFAULT_CONTACT_WIDGET_CONFIG, enabled: settings.plugin_contact_enabled !== 'false', showMobileBar: settings.contact_hotline_bar === 'true', mobileBarChannelIds: primaryIds, channels };
}

export function normalizeContactWidgetConfig(input: unknown, legacy: Record<string, string> = {}): ContactWidgetConfig {
  if (!input || typeof input !== 'object') return migrateLegacyContactSettings(legacy);
  const source = input as Partial<ContactWidgetConfig>;
  const channels = Array.isArray(source.channels) ? source.channels.slice(0, 20).flatMap((raw, index) => {
    if (!raw || typeof raw !== 'object') return [];
    const candidate = raw as Partial<ContactChannel>;
    if (!candidate.type || !(candidate.type in CHANNEL_DEFAULTS)) return [];
    const defaults = CHANNEL_DEFAULTS[candidate.type];
    return [{
      id: safeText(candidate.id, `${candidate.type}-${index}`, 80).replace(/[^a-z0-9_-]/gi, '-') || `${candidate.type}-${index}`,
      type: candidate.type,
      enabled: safeBoolean(candidate.enabled, true),
      label: safeText(candidate.label, defaults.label, 80),
      value: safeText(candidate.value, '', 500),
      color: safeColor(candidate.color, defaults.color),
      desktopEnabled: safeBoolean(candidate.desktopEnabled, true),
      mobileEnabled: safeBoolean(candidate.mobileEnabled, true),
      newTab: safeBoolean(candidate.newTab, defaults.newTab),
      prefilledMessage: safeText(candidate.prefilledMessage, '', 500),
    } satisfies ContactChannel];
  }) : [];
  const channelIds = new Set(channels.map(channel => channel.id));
  return {
    version: 2,
    enabled: safeBoolean(source.enabled, true),
    mode: source.mode === 'stack' ? 'stack' : 'hub',
    position: source.position === 'left' ? 'left' : 'right',
    hubLabel: safeText(source.hubLabel, 'Liên hệ', 40),
    panelTitle: safeText(source.panelTitle, 'Ezitrans hỗ trợ bạn', 80),
    panelSubtitle: safeText(source.panelSubtitle, 'Chọn kênh liên hệ thuận tiện nhất', 140),
    primaryColor: safeColor(source.primaryColor, '#0c64d0'),
    showMobileBar: safeBoolean(source.showMobileBar, false),
    mobileBarChannelIds: Array.isArray(source.mobileBarChannelIds) ? source.mobileBarChannelIds.filter(id => typeof id === 'string' && channelIds.has(id)).slice(0, 3) : [],
    desktopOffset: safeOffset(source.desktopOffset, 24),
    mobileOffset: safeOffset(source.mobileOffset, 16),
    channels,
  };
}

export function parseContactWidgetConfig(settings: Record<string, string>): ContactWidgetConfig {
  const raw = settings.contact_widget_config_v2;
  if (!raw) return migrateLegacyContactSettings(settings);
  try { return normalizeContactWidgetConfig(JSON.parse(raw), settings); } catch { return migrateLegacyContactSettings(settings); }
}

export function buildChannelHref(channel: ContactChannel, context?: { title?: string; url?: string }): string {
  const value = channel.value.trim();
  const phone = value.replace(/[^0-9+]/g, '');
  const digits = value.replace(/\D/g, '');
  const message = (channel.prefilledMessage || '').replaceAll('{page_title}', context?.title || '').replaceAll('{page_url}', context?.url || '');
  switch (channel.type) {
    case 'hotline': return `tel:${phone}`;
    case 'email': return `mailto:${value}${message ? `?subject=${encodeURIComponent(message)}` : ''}`;
    case 'zalo': return /^https?:\/\//i.test(value) ? value : `https://zalo.me/${digits}`;
    case 'messenger': return /^https?:\/\//i.test(value) ? value : `https://m.me/${value.replace(/^m\.me\//i, '')}`;
    case 'whatsapp': return /^https?:\/\//i.test(value) ? value : `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
    case 'telegram': return /^https?:\/\//i.test(value) ? value : `https://t.me/${value.replace(/^@/, '')}`;
    case 'viber': return /^viber:|^https?:/i.test(value) ? value : `viber://chat?number=%2B${digits.replace(/^0/, '84')}`;
    default: return value.startsWith('/') || /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }
}
