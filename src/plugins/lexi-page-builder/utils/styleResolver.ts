export type RenderMode = 'editor' | 'preview' | 'frontend';

export type TemplateType = 'HEADER' | 'FOOTER' | 'PAGE' | 'SINGLE_POST' | string;

export interface RenderContext {
  mode: RenderMode;
  templateType?: TemplateType;
  viewport?: 'desktop' | 'tablet' | 'mobile';
}

export type ResponsiveDevice = 'desktop' | 'tablet' | 'mobile';

export function getActiveDevice(): ResponsiveDevice {
  if (typeof document !== 'undefined') {
    const dev = document.body.getAttribute('data-device');
    if (dev === 'tablet' || dev === 'mobile') return dev;
  }
  return 'desktop';
}

export type StyleMap = Record<string, string | undefined>;

const NON_RESPONSIVE_PROPS = new Set([
  'text',
  'html',
  'iconName',
  'imageSrc',
  'imageUrl',
  'gallery',
  'idCss',
  'classCss',
  'className',
  'colorPreset',
  'link',
  'href',
  'url',
  'alt',
  'dynamicText',
  'dynamicLink',
]);

export function isResponsiveProp(prop: string) {
  if (!prop || prop.startsWith('query')) return false;
  if (NON_RESPONSIVE_PROPS.has(prop)) return false;
  if (prop.endsWith('_mobile') || prop.endsWith('_tablet') || prop.endsWith('Mobile') || prop.endsWith('Tablet')) return false;
  return true;
}

export function getResponsiveKey(key: string, device: ResponsiveDevice = 'desktop') {
  if (device === 'mobile') return `${key}_mobile`;
  if (device === 'tablet') return `${key}_tablet`;
  return key;
}

function isFilledResponsiveValue(value: unknown) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

export function hasResponsiveOverride(rawProps: any, key: string, device: ResponsiveDevice) {
  if (!rawProps || device === 'desktop') return isFilledResponsiveValue(rawProps?.[key]);
  return isFilledResponsiveValue(rawProps[getResponsiveKey(key, device)]);
}

export function getResponsiveValue(
  rawProps: any,
  key: string,
  device: ResponsiveDevice = getActiveDevice(),
  options: { inheritFromDesktop?: boolean } = {}
) {
  if (!rawProps) return undefined;
  const { inheritFromDesktop = true } = options;

  if (device === 'desktop' || !isResponsiveProp(key)) return rawProps[key];

  const deviceKey = getResponsiveKey(key, device);
  const legacyDeviceKey = device === 'mobile' ? `${key}Mobile` : `${key}Tablet`;
  if (isFilledResponsiveValue(rawProps[deviceKey])) return rawProps[deviceKey];
  if (isFilledResponsiveValue(rawProps[legacyDeviceKey])) return rawProps[legacyDeviceKey];

  if (inheritFromDesktop) return rawProps[key];
  return '';
}

export function setResponsiveValue(nodeProps: any, key: string, value: unknown, device: ResponsiveDevice = 'desktop') {
  const finalKey = isResponsiveProp(key) ? getResponsiveKey(key, device) : key;
  nodeProps[finalKey] = value;
  return finalKey;
}

export function createResponsiveProps(
  rawProps: any,
  device: ResponsiveDevice = getActiveDevice(),
  options: { inheritFromDesktop?: boolean } = {}
) {
  if (!rawProps) return {};

  const result: any = { ...rawProps };
  for (const prop of Object.keys(rawProps)) {
    if (isResponsiveProp(prop)) {
      result[prop] = getResponsiveValue(rawProps, prop, device, options);
    }
  }

  return result;
}

export interface CommonStyleProps {
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  idCss?: string;
  classCss?: string;
  className?: string;
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
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  textColor?: string;
  lineHeight?: string;
  letterSpacing?: string;
  wordSpacing?: string;
  textTransform?: string;
  textDecoration?: string;
  advancedBgType?: 'none' | 'classic' | 'gradient';
  advancedBgColor?: string;
  advancedBgImage?: string;
  advancedBgGradient?: string;
  bgGradientColor1?: string;
  bgGradientColor2?: string;
  bgGradientType?: 'linear' | 'radial';
  bgGradientAngle?: number | string;
  bgGradientPos1?: number | string;
  bgGradientPos2?: number | string;
  borderType?: string;
  borderWidth?: string;
  borderTopWidth?: string;
  borderRightWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderColor?: string;
  borderStyle?: string;
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomRightRadius?: string;
  borderBottomLeftRadius?: string;
  boxShadow?: string;
  animationName?: string;
  animationDuration?: string;
  animationDelay?: string;
  animationTrigger?: 'onLoad' | 'onScroll' | 'onViewport' | 'onHover';
  sticky?: 'none' | 'top' | 'bottom';

  // Hover properties
  advancedBgTypeHover?: 'classic' | 'gradient';
  advancedBgColorHover?: string;
  advancedBgImageHover?: string;
  advancedBgGradientHover?: string;
  bgGradientColor1Hover?: string;
  bgGradientPos1Hover?: number | string;
  bgGradientColor2Hover?: string;
  bgGradientPos2Hover?: number | string;
  bgGradientTypeHover?: 'linear' | 'radial';
  bgGradientAngleHover?: number | string;
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
  
  // Drop Cap properties
  dropCap?: boolean;
  dropCapView?: 'default' | 'framed' | 'boxed';
  dropCapPrimaryColor?: string;
  dropCapSecondaryColor?: string;
  dropCapBorderWidth?: string;
  dropCapBorderRadius?: string;
  dropCapSpace?: string;
  dropCapSize?: string;
  dropCapFontWeight?: string;
  dropCapFontFamily?: string;
  dropCapTextShadow?: string;

  // Columns properties
  columns?: string;
  columnGap?: string;
}

export function resolveWidth(props: CommonStyleProps): string | undefined {
  if (props.widthMode === 'full') return '100%';
  if (props.widthMode === 'inline') return 'auto';
  if (props.widthMode === 'custom') return props.customWidth || props.width || undefined;
  return undefined;
}

export function resolveOrder(props: CommonStyleProps): string | undefined {
  if (props.orderMode === 'first') return '-1';
  if (props.orderMode === 'last') return '99';
  if (props.orderMode === 'custom') return props.customOrder || undefined;
  return undefined;
}

export function resolveFontFamily(font?: string): string | undefined {
  if (!font) return undefined;
  const serifs = ['Merriweather', 'Playfair Display', 'Roboto Slab'];
  const mono = ['JetBrains Mono', 'Fira Code', 'Roboto Mono'];
  if (font.startsWith('var(')) return font;
  if (serifs.includes(font)) return `${font}, serif`;
  if (mono.includes(font)) return `${font}, monospace`;
  return `${font}, sans-serif`;
}

const isMeaningful = (value?: string) => value !== undefined && value !== null && value !== '' && value !== 'none';

export function resolveAdvancedStyles(props: CommonStyleProps): StyleMap {
  const bgType = props.advancedBgType || 'none';
  const styles: StyleMap = {};

  if (bgType === 'classic') {
    if (props.advancedBgColor) styles.backgroundColor = props.advancedBgColor;
    if (props.advancedBgImage) {
      styles.backgroundImage = `url(${props.advancedBgImage})`;
      styles.backgroundSize = 'cover';
      styles.backgroundPosition = 'center';
      styles.backgroundRepeat = 'no-repeat';
    }
  } else if (bgType === 'gradient') {
    if (props.bgGradientColor1 || props.bgGradientColor2 || props.bgGradientAngle || props.bgGradientType) {
      const color1 = props.bgGradientColor1 || 'transparent';
      const color2 = props.bgGradientColor2 || 'transparent';
      const pos1 = props.bgGradientPos1 ?? 0;
      const pos2 = props.bgGradientPos2 ?? 100;
      styles.backgroundImage = props.bgGradientType === 'radial'
        ? `radial-gradient(circle, ${color1} ${pos1}%, ${color2} ${pos2}%)`
        : `linear-gradient(${props.bgGradientAngle ?? 180}deg, ${color1} ${pos1}%, ${color2} ${pos2}%)`;
    } else if (props.advancedBgGradient) {
      styles.backgroundImage = props.advancedBgGradient;
    }
  }

  if (props.borderType && props.borderType !== 'none') {
    styles.borderStyle = props.borderStyle || props.borderType || 'solid';
    styles.borderColor = props.borderColor || '#000000';
    styles.borderWidth = props.borderWidth || '0px';
    styles.borderTopWidth = props.borderTopWidth || props.borderWidth;
    styles.borderRightWidth = props.borderRightWidth || props.borderWidth;
    styles.borderBottomWidth = props.borderBottomWidth || props.borderWidth;
    styles.borderLeftWidth = props.borderLeftWidth || props.borderWidth;
  }

  styles.borderRadius = props.borderRadius;
  styles.borderTopLeftRadius = props.borderTopLeftRadius;
  styles.borderTopRightRadius = props.borderTopRightRadius;
  styles.borderBottomRightRadius = props.borderBottomRightRadius;
  styles.borderBottomLeftRadius = props.borderBottomLeftRadius;
  styles.boxShadow = isMeaningful(props.boxShadow) ? props.boxShadow : undefined;

  if (props.animationName && props.animationName !== 'none' && props.animationTrigger !== 'onHover') {
    styles.animationName = props.animationName;
    styles.animationDuration = props.animationDuration === 'slow' ? '2s' : props.animationDuration === 'fast' ? '0.5s' : '1s';
    styles.animationDelay = /^\d+(\.\d+)?$/.test(String(props.animationDelay || '').trim()) ? `${props.animationDelay}ms` : props.animationDelay;
    styles.animationFillMode = 'both';
  }

  return styles;
}

export function resolveLayoutStyles(
  props: CommonStyleProps,
  context: RenderContext,
  options: { display?: string; forceContainerRelative?: boolean } = {}
): StyleMap {
  const isPositioned = props.position === 'absolute' || props.position === 'fixed';
  const widthMode = props.widthMode || 'default';
  const width = resolveWidth(props);

  return {
    order: resolveOrder(props),
    position: isPositioned ? props.position : options.forceContainerRelative ? 'relative' : undefined,
    zIndex: isPositioned ? props.zIndex : props.zIndex,
    top: isPositioned ? props.top : undefined,
    bottom: isPositioned ? props.bottom : undefined,
    left: isPositioned ? props.left : undefined,
    right: isPositioned ? props.right : undefined,
    marginTop: props.marginTop,
    marginBottom: props.marginBottom,
    marginLeft: props.marginLeft,
    marginRight: props.marginRight,
    gridColumn: props.gridColumnSpan && props.gridColumnSpan !== 'auto' ? props.gridColumnSpan : undefined,
    gridRow: props.gridRowSpan && props.gridRowSpan !== 'auto' ? props.gridRowSpan : undefined,
    width,
    height: props.height === 'auto' ? undefined : props.height,
    display: widthMode === 'inline' ? 'inline-block' : options.display,
    minWidth: widthMode === 'inline' ? undefined : '0',
    maxWidth: widthMode === 'inline' ? undefined : '100%',
    flexShrink: widthMode === 'inline' ? undefined : '1',
    alignSelf: widthMode === 'inline' ? 'flex-start' : undefined,
    boxSizing: 'border-box',
  };
}

export function resolveTypographyStyles(
  props: CommonStyleProps,
  options: { defaultFontFamily?: string } = {}
): StyleMap {
  return {
    fontFamily: resolveFontFamily(props.fontFamily || options.defaultFontFamily),
    fontSize: props.fontSize,
    fontWeight: props.fontWeight,
    fontStyle: props.fontStyle,
    textAlign: props.textAlign,
    color: props.textColor,
    lineHeight: props.lineHeight,
    letterSpacing: props.letterSpacing,
    wordSpacing: props.wordSpacing,
    textTransform: props.textTransform,
    textDecoration: props.textDecoration,
  };
}

export function resolveSpacingStyles(rawProps: CommonStyleProps): StyleMap {
  const props = createResponsiveProps(rawProps);
  
  return {
    paddingTop: props.paddingTop || undefined,
    paddingBottom: props.paddingBottom || undefined,
    paddingLeft: props.paddingLeft || undefined,
    paddingRight: props.paddingRight || undefined,
  };
}

export function resolveColumnsStyles(props: CommonStyleProps): StyleMap {
  if (props.columns && props.columns !== 'default') {
    return {
      '--column-count': props.columns,
      '--column-gap': props.columnGap || 'normal',
    };
  }
  return {};
}

export function resolveDropCapStyles(props: CommonStyleProps): StyleMap {
  if (!props.dropCap) return {};

  let dropCapColorVar = props.dropCapPrimaryColor || 'inherit';
  let dropCapBgVar = 'transparent';
  let dropCapBorderVar = 'none';
  let dropCapPaddingVar = '0';
  let dropCapRadiusVar = props.dropCapBorderRadius || '0';

  if (props.dropCapView === 'framed') {
    dropCapColorVar = props.dropCapPrimaryColor || 'var(--site-color-primary)';
    dropCapBgVar = props.dropCapSecondaryColor || 'transparent';
    dropCapBorderVar = `${props.dropCapBorderWidth || '3px'} solid ${props.dropCapPrimaryColor || 'var(--site-color-primary)'}`;
    dropCapPaddingVar = '8px';
  } else if (props.dropCapView === 'boxed') {
    dropCapColorVar = props.dropCapSecondaryColor || '#ffffff';
    dropCapBgVar = props.dropCapPrimaryColor || 'var(--site-color-primary)';
    dropCapPaddingVar = '12px 14px';
  }

  return {
    '--dropcap-color': dropCapColorVar,
    '--dropcap-bg': dropCapBgVar,
    '--dropcap-border': dropCapBorderVar,
    '--dropcap-padding': dropCapPaddingVar,
    '--dropcap-radius': dropCapRadiusVar,
    '--dropcap-space': props.dropCapSpace ? `${props.dropCapSpace}px` : '8px',
    '--dropcap-size': props.dropCapSize ? `${props.dropCapSize}px` : '3.2em',
    '--dropcap-weight': props.dropCapFontWeight || '800',
    '--dropcap-font': props.dropCapFontFamily ? `"${props.dropCapFontFamily}", sans-serif` : 'inherit',
    '--dropcap-shadow': props.dropCapTextShadow || 'none',
  };
}

export function getWrapperStyles(rawProps: any, elementDisplay = 'block', nodeId?: string) {
  const props = createResponsiveProps(rawProps);
  const optionSticky = props.sticky || 'none';
  const {
    marginTop = '0px',
    marginBottom = '0px',
    marginLeft = '0px',
    marginRight = '0px',
    widthMode = 'default',
    customWidth,
    width = '100%',
    height = 'auto',
    orderMode = 'default',
    customOrder,
    position = 'default',
    zIndex,
    top,
    bottom,
    left,
    right,
    idCss,
    classCss,
    advancedBgType = 'classic',
    advancedBgColor,
    advancedBgImage,
    advancedBgGradient,
    bgGradientColor1,
    bgGradientPos1,
    bgGradientColor2,
    bgGradientPos2,
    bgGradientType = 'linear',
    bgGradientAngle = 180,
    animationName = 'none',
    animationDuration = 'normal',
    animationDelay = '0s',
    animationTrigger = 'onLoad',
    sticky = 'none',
    borderType = 'none',
    borderWidth = '0px',
    borderTopWidth,
    borderRightWidth,
    borderBottomWidth,
    borderLeftWidth,
    borderColor = '#000000',
    borderRadius = '0px',
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomRightRadius,
    borderBottomLeftRadius,
    boxShadow = 'none',

    advancedBgTypeHover,
    advancedBgColorHover,
    advancedBgImageHover,
    advancedBgGradientHover,
    bgGradientColor1Hover,
    bgGradientPos1Hover,
    bgGradientColor2Hover,
    bgGradientPos2Hover,
    bgGradientTypeHover,
    bgGradientAngleHover,
    borderColorHover,
    borderRadiusHover,
    borderTopLeftRadiusHover,
    borderTopRightRadiusHover,
    borderBottomRightRadiusHover,
    borderBottomLeftRadiusHover,
    boxShadowHover,

    gridColumnSpan = 'auto',
    gridRowSpan = 'auto',
  } = props;

  const resolvedWidth = widthMode === 'full'
    ? '100%'
    : widthMode === 'inline'
      ? 'auto'
      : widthMode === 'custom'
        ? customWidth || width
        : undefined;

  const resolvedOrder = orderMode === 'first' ? '-1' : orderMode === 'last' ? '99' : orderMode === 'custom' ? customOrder : undefined;
  const resolvedPosition = (position === 'absolute' || position === 'fixed') ? position : undefined;
  const resolvedZIndex = zIndex ? zIndex : undefined;

  const wrapperStyle: StyleMap = {
    order: resolvedOrder,
    position: optionSticky !== 'none' ? 'sticky' : resolvedPosition,
    top: optionSticky === 'top' ? '0px' : (resolvedPosition ? top || undefined : undefined),
    bottom: optionSticky === 'bottom' ? '0px' : (resolvedPosition ? bottom || undefined : undefined),
    zIndex: optionSticky !== 'none' ? (resolvedZIndex || '10') : resolvedZIndex,
    left: resolvedPosition ? left || undefined : undefined,
    right: resolvedPosition ? right || undefined : undefined,
    marginTop: marginTop,
    marginBottom: marginBottom,
    marginLeft: marginLeft,
    marginRight: marginRight,
    gridColumn: gridColumnSpan && gridColumnSpan !== 'auto' ? gridColumnSpan : undefined,
    gridRow: gridRowSpan && gridRowSpan !== 'auto' ? gridRowSpan : undefined,
    width: resolvedWidth,
    height: height === 'auto' ? undefined : height,
    display: widthMode === 'inline' ? 'inline-block' : elementDisplay,
    minWidth: widthMode === 'inline' ? undefined : '0',
    maxWidth: widthMode === 'inline' ? undefined : '100%',
    flexShrink: widthMode === 'inline' ? undefined : '1',
    alignSelf: widthMode === 'inline' ? 'flex-start' : undefined,

    // Background from Advanced tab
    ...(advancedBgType === 'gradient'
        ? { backgroundImage: (bgGradientColor1 || bgGradientColor2 || bgGradientType || bgGradientAngle) ? (bgGradientType === 'radial' ? `radial-gradient(circle, ${bgGradientColor1 || '#000000'} ${bgGradientPos1 ?? 0}%, ${bgGradientColor2 || '#ffffff'} ${bgGradientPos2 ?? 100}%)` : `linear-gradient(${bgGradientAngle ?? 180}deg, ${bgGradientColor1 || '#000000'} ${bgGradientPos1 ?? 0}%, ${bgGradientColor2 || '#ffffff'} ${bgGradientPos2 ?? 100}%)`) : (advancedBgGradient || `linear-gradient(180deg, #000000 0%, #ffffff 100%)`) } 
        : { backgroundColor: advancedBgColor, backgroundImage: advancedBgImage ? `url(${advancedBgImage})` : undefined }),
    backgroundSize: advancedBgImage ? 'cover' : undefined,
    backgroundPosition: advancedBgImage ? 'center' : undefined,
    
    // Borders
    borderStyle: borderType && borderType !== 'none' ? borderType : undefined,
    borderWidth: borderType && borderType !== 'none' ? undefined : undefined, // Handled individually below
    borderTopWidth: borderType && borderType !== 'none' ? (borderTopWidth || borderWidth) : undefined,
    borderRightWidth: borderType && borderType !== 'none' ? (borderRightWidth || borderWidth) : undefined,
    borderBottomWidth: borderType && borderType !== 'none' ? (borderBottomWidth || borderWidth) : undefined,
    borderLeftWidth: borderType && borderType !== 'none' ? (borderLeftWidth || borderWidth) : undefined,
    borderColor: borderType && borderType !== 'none' ? (borderColor || '#000000') : undefined,
    borderTopLeftRadius: borderTopLeftRadius || borderRadius,
    borderTopRightRadius: borderTopRightRadius || borderRadius,
    borderBottomRightRadius: borderBottomRightRadius || borderRadius,
    borderBottomLeftRadius: borderBottomLeftRadius || borderRadius,
    boxShadow: boxShadow && boxShadow !== 'none' ? boxShadow : undefined,

    // --- Hover CSS Variables ---
    '--hover-bg-color': advancedBgTypeHover === 'gradient' ? 'transparent' : (advancedBgColorHover || (advancedBgType !== 'gradient' ? advancedBgColor : 'transparent') || 'transparent'),
    '--hover-bg-image': advancedBgTypeHover === 'gradient' 
      ? ((bgGradientColor1Hover || bgGradientColor2Hover || bgGradientTypeHover || bgGradientAngleHover) ? (bgGradientTypeHover === 'radial' ? `radial-gradient(circle, ${bgGradientColor1Hover || 'transparent'} ${bgGradientPos1Hover ?? 0}%, ${bgGradientColor2Hover || 'transparent'} ${bgGradientPos2Hover ?? 100}%)` : `linear-gradient(${bgGradientAngleHover ?? 180}deg, ${bgGradientColor1Hover || 'transparent'} ${bgGradientPos1Hover ?? 0}%, ${bgGradientColor2Hover || 'transparent'} ${bgGradientPos2Hover ?? 100}%)`) : (advancedBgGradientHover || 'none'))
      : (advancedBgImageHover ? `url(${advancedBgImageHover})` : (advancedBgType === 'gradient' ? ((bgGradientColor1 || bgGradientColor2 || bgGradientType || bgGradientAngle) ? (bgGradientType === 'radial' ? `radial-gradient(circle, ${bgGradientColor1 || 'transparent'} ${bgGradientPos1 ?? 0}%, ${bgGradientColor2 || 'transparent'} ${bgGradientPos2 ?? 100}%)` : `linear-gradient(${bgGradientAngle ?? 180}deg, ${bgGradientColor1 || 'transparent'} ${bgGradientPos1 ?? 0}%, ${bgGradientColor2 || 'transparent'} ${bgGradientPos2 ?? 100}%)`) : (advancedBgGradient || 'none')) : (advancedBgImage ? `url(${advancedBgImage})` : 'none'))),
    '--hover-border-color': borderColorHover || (borderType && borderType !== 'none' ? (borderColor || '#000000') : 'transparent') || 'transparent',
    '--hover-border-radius-tl': borderTopLeftRadiusHover || borderRadiusHover || borderTopLeftRadius || borderRadius || '0px',
    '--hover-border-radius-tr': borderTopRightRadiusHover || borderRadiusHover || borderTopRightRadius || borderRadius || '0px',
    '--hover-border-radius-br': borderBottomRightRadiusHover || borderRadiusHover || borderBottomRightRadius || borderRadius || '0px',
    '--hover-border-radius-bl': borderBottomLeftRadiusHover || borderRadiusHover || borderBottomLeftRadius || borderRadius || '0px',
    '--hover-box-shadow': (boxShadowHover && boxShadowHover !== 'none') ? boxShadowHover : ((boxShadow && boxShadow !== 'none') ? boxShadow : 'none'),

    // Animation properties
    animationName: animationName !== 'none' && animationTrigger !== 'onHover' ? animationName : undefined,
    animationDuration: animationName !== 'none' ? (animationDuration === 'slow' ? '2s' : animationDuration === 'fast' ? '0.5s' : '1s') : undefined,
    animationDelay: animationName !== 'none' ? (/^\d+(\.\d+)?$/.test(String(animationDelay || '').trim()) ? `${animationDelay}ms` : animationDelay) : undefined,
    animationFillMode: animationName !== 'none' ? 'both' : undefined,
  };

  const widgetType = String(rawProps?.type || rawProps?.widgetType || 'widget').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  const elementClasses = nodeId ? `lexi-element lexi-widget-${widgetType} lexi-element-${nodeId}` : '';
  const effectClasses = [
    elementClasses,
    classCss || '',
    'craft-hover-effect',
    animationName !== 'none' && animationTrigger === 'onHover' ? 'craft-animation-on-hover' : '',
  ].filter(Boolean).join(' ');

  return {
    wrapperStyle,
    idCss: idCss || undefined,
    classCss: effectClasses,
  };
}

export function getInnerStyles(rawProps: CommonStyleProps, options: { defaultFontFamily?: string } = {}): StyleMap {
  const props = createResponsiveProps(rawProps);
  return {
    ...resolveTypographyStyles(props, options),
    ...resolveSpacingStyles(props),
    ...resolveColumnsStyles(props),
    ...resolveDropCapStyles(props),
  };
}

export function getContainerInnerStyles(
  rawProps: CommonStyleProps & {
    gap?: string;
    flexDirection?: string;
    justifyContent?: string;
    alignItems?: string;
    flexWrap?: string;
  },
  options: {
    isRoot?: boolean;
    isTopLevel?: boolean;
    enabled?: boolean;
    resolvedContentWidth?: string;
    resolvedMaxWidth?: string;
    boxedGutter?: string;
  } = {}
): StyleMap {
  const { isRoot, isTopLevel, enabled, resolvedContentWidth, resolvedMaxWidth, boxedGutter } = options;
  const props = createResponsiveProps(rawProps);
  const isVal = (v: unknown) => v !== undefined && v !== null && v !== '';
  const resolvedColumnGap = isVal(props.columnGap) ? props.columnGap : props.gap;
  const resolvedRowGap = isVal(props.gridRowGap) ? props.gridRowGap : props.gap;

  const getPadding = (key: string, defaultVal?: string) => {
    const val = props[key];
    return String(val !== undefined && val !== null && String(val).trim() !== '' ? val : (defaultVal || ''));
  };

  const paddingLeft = getPadding('paddingLeft', isRoot ? '0px' : '10px');
  const paddingRight = getPadding('paddingRight', isRoot ? '0px' : '10px');
  const paddingTop = getPadding('paddingTop', isTopLevel ? 'var(--site-layout-section-spacing, 40px)' : (isRoot ? '0px' : '10px'));
  const paddingBottom = getPadding('paddingBottom', isTopLevel ? 'var(--site-layout-section-spacing, 40px)' : (isRoot ? '0px' : '10px'));

  const isGrid = props.layoutType === 'grid';

  if (isGrid) {
    return {
      paddingTop: paddingTop,
      paddingBottom: paddingBottom,
      paddingLeft: paddingLeft,
      paddingRight: paddingRight,
      maxWidth: resolvedContentWidth === 'full' ? 'none' : (resolvedMaxWidth === 'none' ? undefined : resolvedMaxWidth),
      marginLeft: 'auto',
      marginRight: 'auto',
      width: '100%',
      display: 'grid',
      gridTemplateColumns: `repeat(${props.gridColumns || 3}, minmax(0, 1fr))`,
      gridTemplateRows: props.gridRows === 'auto' ? 'auto' : `repeat(${props.gridRows || 2}, minmax(0, 1fr))`,
      gridAutoFlow: props.gridAutoFlow || 'row',
      gap: `${resolvedRowGap} ${resolvedColumnGap}`,
      justifyItems: props.justifyItems || 'stretch',
      alignItems: props.alignItems || 'stretch',
      boxSizing: 'border-box',
    };
  }

  return {
    paddingTop: paddingTop,
    paddingBottom: paddingBottom,
    paddingLeft: paddingLeft,
    paddingRight: paddingRight,
    flexDirection: props.flexDirection || 'column',
    justifyContent: props.justifyContent || 'flex-start',
    alignItems: props.alignItems || 'stretch',
    flexWrap: props.flexWrap || 'nowrap',
    gap: `${resolvedRowGap} ${resolvedColumnGap}`,
    maxWidth: resolvedContentWidth === 'full' ? 'none' : (resolvedMaxWidth === 'none' ? undefined : resolvedMaxWidth),
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
    display: 'flex',
    boxSizing: 'border-box',
  };
}
