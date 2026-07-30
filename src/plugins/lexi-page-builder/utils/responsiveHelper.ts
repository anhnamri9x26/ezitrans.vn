export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export function getResponsiveValue(props: Record<string, any>, key: string, device: DeviceType): any {
  if (device === 'mobile') {
    if (props[`${key}_mobile`] !== undefined) return props[`${key}_mobile`];
    if (props[`${key}_tablet`] !== undefined) return props[`${key}_tablet`];
    return props[key];
  }
  
  if (device === 'tablet') {
    if (props[`${key}_tablet`] !== undefined) return props[`${key}_tablet`];
    return props[key];
  }
  
  return props[key];
}

export function getResponsiveKey(key: string, device: DeviceType): string {
  if (device === 'mobile') return `${key}_mobile`;
  if (device === 'tablet') return `${key}_tablet`;
  return key;
}
