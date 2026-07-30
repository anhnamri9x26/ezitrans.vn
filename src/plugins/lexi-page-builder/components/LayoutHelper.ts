import React from 'react';

export interface CommonLayoutProps {
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  widthMode?: 'default' | 'full' | 'inline' | 'custom';
  customWidth?: string;
  width?: string;
  height?: string;
  orderMode?: 'default' | 'first' | 'last' | 'custom';
  customOrder?: string;
  position?: 'default' | 'absolute' | 'fixed';
  zIndex?: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  horizontalAlign?: 'left' | 'right';
  verticalAlign?: 'top' | 'bottom';
  idCss?: string;
  classCss?: string;
  customCss?: string;
  className?: string;

  // Background properties for Advanced tab
  advancedBgType?: 'classic' | 'gradient';
  advancedBgColor?: string;
  advancedBgImage?: string;
  advancedBgGradient?: string;
  bgGradientColor1?: string;
  bgGradientPos1?: number;
  bgGradientColor2?: string;
  bgGradientPos2?: number;
  bgGradientType?: 'linear' | 'radial';
  bgGradientAngle?: number;
  
  // Animation properties for Advanced tab
  animationName?: string;
  animationDuration?: string;
  animationDelay?: string;
  animationTrigger?: 'onLoad' | 'onScroll' | 'onViewport' | 'onHover';
  sticky?: 'none' | 'top' | 'bottom';

  // Global Border properties
  borderType?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double' | 'hidden';
  borderWidth?: string;
  borderTopWidth?: string;
  borderRightWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderColor?: string;
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomRightRadius?: string;
  borderBottomLeftRadius?: string;
  boxShadow?: string;

  // Hover properties
  advancedBgTypeHover?: 'classic' | 'gradient';
  advancedBgColorHover?: string;
  advancedBgImageHover?: string;
  advancedBgGradientHover?: string;
  bgGradientColor1Hover?: string;
  bgGradientPos1Hover?: number;
  bgGradientColor2Hover?: string;
  bgGradientPos2Hover?: number;
  bgGradientTypeHover?: 'linear' | 'radial';
  bgGradientAngleHover?: number;
  borderColorHover?: string;
  borderRadiusHover?: string;
  borderTopLeftRadiusHover?: string;
  borderTopRightRadiusHover?: string;
  borderBottomRightRadiusHover?: string;
  borderBottomLeftRadiusHover?: string;
  boxShadowHover?: string;

  // Grid properties
  layoutType?: 'flex' | 'grid';
  gridColumns?: number;
  gridRows?: number | 'auto';
  gridColumnGap?: string;
  gridRowGap?: string;
  gridAutoFlow?: string;
  justifyItems?: string;
  alignItems?: string;
  showGridOutline?: boolean;
  gridColumnSpan?: string;
  gridRowSpan?: string;
}

export const defaultLayoutProps: Record<string, any> = {
  marginTop: '0px',
  marginBottom: '0px',
  marginLeft: '0px',
  marginRight: '0px',
  paddingTop: '0px',
  paddingBottom: '0px',
  paddingLeft: '0px',
  paddingRight: '0px',
  widthMode: 'default',
  customWidth: '',
  width: '100%',
  height: 'auto',
  orderMode: 'default',
  customOrder: '',
  position: 'default',
  zIndex: '',
  top: '',
  bottom: '',
  left: '',
  right: '',
  horizontalAlign: 'left',
  verticalAlign: 'top',
  idCss: '',
  classCss: '',
  customCss: '',
  className: '',
  advancedBgType: 'classic',
  advancedBgColor: '',
  advancedBgImage: '',
  advancedBgGradient: '',
  bgGradientColor1: '#000000',
  bgGradientPos1: 0,
  bgGradientColor2: '#ffffff',
  bgGradientPos2: 100,
  bgGradientType: 'linear',
  bgGradientAngle: 180,
  animationName: 'none',
  animationDuration: 'normal',
  animationDelay: '0s',
  animationTrigger: 'onLoad',
  sticky: 'none',
  borderType: 'none',
  borderWidth: '0px',
  borderColor: '#000000',
  borderRadius: '0px',
  boxShadow: 'none',
  layoutType: 'flex',
  gridColumns: 3,
  gridRows: 2,
  gridColumnGap: '20px',
  gridRowGap: '20px',
  gridAutoFlow: 'row',
  justifyItems: 'stretch',
  alignItems: 'stretch',
  showGridOutline: true,
  gridColumnSpan: 'auto',
  gridRowSpan: 'auto',
};



export const getFontFamilyFallback = (font?: string) => {
  if (!font) return 'var(--font-sans), sans-serif';
  const serifs = ['Merriweather', 'Playfair Display', 'Roboto Slab'];
  if (serifs.includes(font)) {
    return `${font}, serif`;
  }
  return `${font}, sans-serif`;
};

