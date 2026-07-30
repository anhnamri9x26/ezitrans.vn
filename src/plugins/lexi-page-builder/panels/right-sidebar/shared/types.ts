export interface RightSidebarProps {
  onOpenMedia: (onSelect: (url: string) => void) => void;
  onOpenIcon: (
    currentIcon: string, 
    onSelect: (iconName: string, iconStyle: 'outline' | 'solid' | 'brands' | 'custom') => void,
    currentStyle?: 'outline' | 'solid' | 'brands' | 'custom'
  ) => void;
  onBackToWidgets?: () => void;
  device?: 'desktop' | 'tablet' | 'mobile';
  setDevice?: (device: 'desktop' | 'tablet' | 'mobile') => void;
}

export interface DynamicInputProps {
  label: string;
  type: 'text' | 'textarea' | 'image' | 'link';
  value: string;
  onChange: (val: string) => void;
  dynamicConfig?: {
    enabled?: boolean;
    source?: string;
    field?: string;
    before?: string;
    after?: string;
    fallback?: string;
  };
  onDynamicChange: (config: {
    enabled?: boolean;
    source?: string;
    field?: string;
    before?: string;
    after?: string;
    fallback?: string;
  }) => void;
  linkSettings?: {
    openInNewWindow?: boolean;
    nofollow?: boolean;
    customAttributes?: string;
  };
  onLinkSettingsChange?: (settings: {
    openInNewWindow?: boolean;
    nofollow?: boolean;
    customAttributes?: string;
  }) => void;
  placeholder?: string;
  onOpenMedia?: (onSelect: (url: string) => void) => void;
}