"use client";

import { usePageSettings } from '../PageSettingsContext';
import { createResponsiveProps } from '../utils/styleResolver';

export function useResponsiveProps<T extends Record<string, any>>(rawProps: T): T {
  const { device = 'desktop' } = usePageSettings();
  return createResponsiveProps(rawProps, device) as T;
}
