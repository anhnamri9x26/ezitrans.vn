export type ContactChannelType = 'hotline' | 'zalo' | 'messenger' | 'whatsapp' | 'telegram' | 'viber' | 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'map' | 'email' | 'custom';
export type ContactDisplayMode = 'hub' | 'stack';
export type ContactWidgetPosition = 'left' | 'right';

export interface ContactChannel {
  id: string;
  type: ContactChannelType;
  enabled: boolean;
  label: string;
  value: string;
  color: string;
  desktopEnabled: boolean;
  mobileEnabled: boolean;
  newTab: boolean;
  prefilledMessage?: string;
}

export interface ContactWidgetConfig {
  version: 2;
  enabled: boolean;
  mode: ContactDisplayMode;
  position: ContactWidgetPosition;
  hubLabel: string;
  panelTitle: string;
  panelSubtitle: string;
  primaryColor: string;
  showMobileBar: boolean;
  mobileBarChannelIds: string[];
  desktopOffset: number;
  mobileOffset: number;
  channels: ContactChannel[];
}
