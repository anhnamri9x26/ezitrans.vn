"use client";

import React, { createContext, useContext } from 'react';
import { WebsiteSettings, defaultWebsiteSettings } from './utils/websiteSettingsHelper';

export type PageLayoutType = 'THEME_DEFAULT' | 'FULL_WIDTH' | 'CANVAS';
export type ContentWidthType = 'BOXED' | 'FULL_WIDTH' | 'CUSTOM';

export interface PageSettings {
  pageLayout: PageLayoutType;
  contentWidth: ContentWidthType;
  contentMaxWidth: string;
  websiteSettings?: WebsiteSettings;
  device?: 'desktop' | 'tablet' | 'mobile';
}

export const defaultPageSettings: PageSettings = {
  pageLayout: 'THEME_DEFAULT',
  contentWidth: 'BOXED',
  contentMaxWidth: '1200px',
  websiteSettings: defaultWebsiteSettings,
  device: 'desktop',
};

interface PageSettingsContextType extends PageSettings {
  setPageLayout: (layout: PageLayoutType) => void;
  setContentWidth: (width: ContentWidthType) => void;
  setContentMaxWidth: (maxWidth: string) => void;
  websiteSettings: WebsiteSettings;
  setWebsiteSettings: (settings: WebsiteSettings) => void;
  setDevice?: (device: 'desktop' | 'tablet' | 'mobile') => void;
}

const PageSettingsContext = createContext<PageSettingsContextType>({
  ...defaultPageSettings,
  websiteSettings: defaultWebsiteSettings,
  setPageLayout: () => {},
  setContentWidth: () => {},
  setContentMaxWidth: () => {},
  setWebsiteSettings: () => {},
  setDevice: () => {},
});

export const PageSettingsProvider = PageSettingsContext.Provider;

export function usePageSettings() {
  return useContext(PageSettingsContext);
}

export default PageSettingsContext;

