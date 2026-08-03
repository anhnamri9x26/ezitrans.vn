"use client";

import {
  RenderMode,
  RenderContext,
  resolveLayoutStyles,
  resolveAdvancedStyles,
  resolveTypographyStyles,
  resolveSpacingStyles,
  resolveColumnsStyles,
  resolveDropCapStyles,
  resolveWidth,
  resolveFontFamily,
  getWrapperStyles,
  getContainerInnerStyles,
  getInnerStyles,
  createResponsiveProps,
  ResponsiveDevice
} from './styleResolver';
import { getLucideSvgString } from './iconRegistry';
import { getFontFamilyFallback } from '../components/LayoutHelper';
import { getSocialIcon } from './socialIconsData';
import { formatCssClasses, generatePageCss, validateElementId } from './customCssEngine';

const toBool = (val: any, defaultVal = false): boolean => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (val === true || val === 'true' || val === '1' || val === 1) return true;
  return false;
};

const toBoolDefaultTrue = (val: any): boolean => {
  if (val === undefined || val === null || val === '') return true;
  if (val === false || val === 'false' || val === '0' || val === 0) return false;
  return true;
};

const formatUnit = (value: string | number | undefined, defaultValue: string): string => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const valStr = String(value).trim();
  if (!isNaN(Number(valStr))) {
    return `${valStr}px`;
  }
  return valStr;
};

interface CraftNode {
  type: {
    resolvedName: string;
  };
  isCanvas: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  parent: string | null;
  children: string[];
  nodes: string[];
  linkedNodes?: Record<string, string>;
}

type CraftState = Record<string, CraftNode>;

export interface RenderOptions {
  templateType?: string;
  mode?: RenderContext['mode'];
  viewport?: RenderContext['viewport'];
  pageId?: string | number;
}

export function renderCraftToHtml(jsonState: string, options?: RenderOptions): string {
  if (!jsonState) return '';

  try {
    const state: CraftState = JSON.parse(jsonState);
    
    // ROOT node in Craft.js is always named "ROOT"
    const rootNode = state["ROOT"];
    if (!rootNode) return '';

    const context: RenderContext & { responsiveRules: string[] } = {
      mode: options?.mode || 'frontend',
      templateType: options?.templateType,
      viewport: options?.viewport || 'desktop',
      responsiveRules: [],
    };

    const renderedHtml = renderNode(state, "ROOT", context);
    const pageId = options?.pageId || 'page';
    const customCssWidgets = Object.entries(state)
      .map(([id, node]) => ({ id, customCss: node?.props?.customCss }))
      .filter((widget) => widget.customCss && String(widget.customCss).trim());
    const generatedPageCss = generatePageCss(customCssWidgets, pageId);

    const styleBlocks: string[] = [];
    if (context.responsiveRules && context.responsiveRules.length > 0) {
      const styles = context.responsiveRules.join('\n');
      styleBlocks.push(`<style id="craft-responsive-styles">\n${styles}\n</style>`);
    }
    if (generatedPageCss) {
      styleBlocks.push(`<style id="lexi-page-css-${pageId}">\n${generatedPageCss}\n</style>`);
    }

    return styleBlocks.length > 0 ? `${renderedHtml}\n${styleBlocks.join('\n')}` : renderedHtml;
  } catch (error) {
    console.error("Error parsing Craft state for rendering:", error);
    return '';
  }
}

function compileDynamicPlaceholder(config?: { enabled?: boolean; source?: string; field?: string; before?: string; after?: string; fallback?: string }): string | null {
  if (config && config.enabled && config.source && config.field) {
    const payload = {
      source: config.source,
      field: config.field,
      before: config.before || '',
      after: config.after || '',
      fallback: config.fallback || '',
    };
    return `{{dynamic:${JSON.stringify(payload)}}}`;
  }
  return null;
}

function getResolutionUrl(url: string, resolution: string): string {
  if (!url || resolution === 'full') return url;
  if (!url.startsWith('/uploads/')) return url;
  if (url.endsWith('.svg')) return url;
  
  const extIndex = url.lastIndexOf('.');
  if (extIndex === -1) return url;
  
  const base = url.substring(0, extIndex);
  const ext = url.substring(extIndex);
  
  if (resolution === 'thumbnail') return `${base}-150x150${ext}`;
  if (resolution === 'medium') return `${base}-300x300${ext}`;
  if (resolution === 'large') return `${base}-1024x1024${ext}`;
  
  return url;
}

function resolveLinkAttributes(props: any): string {
  const dynamicLinkStr = compileDynamicPlaceholder(props.dynamicLink);
  const href = dynamicLinkStr || props.link || '#';

  const settings = props.linkSettings || {};
  let targetAttr = settings.openInNewWindow ? ' target="_blank"' : '';
  let relAttr = settings.nofollow ? ' rel="nofollow"' : '';
  let customAttrStr = '';

  if (settings.customAttributes) {
    const lines = settings.customAttributes.split('\n');
    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('|').trim();
        if (key) {
          customAttrStr += ` ${key}="${val}"`;
        }
      }
    }
  }

  return ` href="${href}"${targetAttr}${relAttr}${customAttrStr}`;
}

function resolveListItemLinkAttributes(item: any): string {
  const dynamicLinkStr = compileDynamicPlaceholder(item.dynamicLink);
  const href = dynamicLinkStr || item.link || '#';

  const settings = item.linkSettings || {};
  let targetAttr = settings.openInNewWindow ? ' target="_blank"' : '';
  let relAttr = settings.nofollow ? ' rel="nofollow"' : '';
  let customAttrStr = '';

  if (settings.customAttributes) {
    const lines = settings.customAttributes.split('\n');
    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('|').trim();
        if (key) {
          customAttrStr += ` ${key}="${val}"`;
        }
      }
    }
  }

  return ` href="${href}"${targetAttr}${relAttr}${customAttrStr}`;
}

function diffStyles(base: Record<string, any>, override: Record<string, any>) {
  const diff: Record<string, any> = {};
  for (const key in override) {
    if (override[key] !== base[key] && override[key] !== undefined && override[key] !== null && String(override[key]).trim() !== '') {
      diff[key] = override[key];
    }
  }
  return diff;
}

function cssStringify(styles: Record<string, any>) {
  return Object.entries(styles)
    .map(([key, val]) => {
      const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      const finalKey = key.startsWith('--') ? key : kebab;
      return `    ${finalKey}: ${val} !important;`;
    })
    .join('\n');
}

const TYPOGRAPHY_STYLE_KEYS = new Set([
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'textAlign',
  'color',
  'lineHeight',
  'letterSpacing',
  'wordSpacing',
  'textTransform',
  'textDecoration',
]);

function omitTypographyStyles(styles: Record<string, any>) {
  const filtered: Record<string, any> = {};
  for (const [key, value] of Object.entries(styles)) {
    if (!TYPOGRAPHY_STYLE_KEYS.has(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

export function generateDeviceStyles(
  nodeId: string,
  rawProps: any,
  resolvedName: string,
  device: ResponsiveDevice,
  options: { includeTypography?: boolean } = {}
) {
  const { includeTypography = true } = options;
  const mappedProps = {
    ...rawProps,
    advancedBgColor: rawProps.backgroundColor,
    advancedBgGradient: rawProps.backgroundGradient,
    advancedBgImage: rawProps.backgroundImage,
    advancedBgType: rawProps.backgroundGradient ? 'gradient' : (rawProps.backgroundImage ? 'classic' : 'classic'),
    borderType: rawProps.borderType || rawProps.borderStyle || 'none',
    layoutType: resolvedName === 'GridContainer' ? 'grid' : (rawProps.layoutType || 'flex'),
  };

  const deviceProps = createResponsiveProps(mappedProps, device);
  const desktopMappedProps = createResponsiveProps(mappedProps, 'desktop');

  let cssRules = '';

  const deviceWrapper = getWrapperStyles(deviceProps, resolvedName === 'GridContainer' ? 'grid' : 'flex').wrapperStyle || {};
  const desktopWrapper = getWrapperStyles(desktopMappedProps, resolvedName === 'GridContainer' ? 'grid' : 'flex').wrapperStyle || {};
  
  const wrapperDiff = diffStyles(desktopWrapper, deviceWrapper);
  if (Object.keys(wrapperDiff).length > 0) {
    cssRules += `  [data-node-id="${nodeId}"] {\n${cssStringify(wrapperDiff)}\n  }\n`;
  }

  if (resolvedName === 'Container' || resolvedName === 'GridContainer') {
    const deviceInner = getContainerInnerStyles(deviceProps) || {};
    const desktopInner = getContainerInnerStyles(desktopMappedProps) || {};
    const innerDiff = diffStyles(desktopInner, deviceInner);
    if (Object.keys(innerDiff).length > 0) {
      cssRules += `  [data-node-id="${nodeId}"] > .lexi-container {\n${cssStringify(innerDiff)}\n  }\n`;
    }
  } else {
    const deviceInner = getInnerStyles(deviceProps) || {};
    const desktopInner = getInnerStyles(desktopMappedProps) || {};
    const rawInnerDiff = diffStyles(desktopInner, deviceInner);
    const innerDiff = includeTypography ? rawInnerDiff : omitTypographyStyles(rawInnerDiff);
    if (Object.keys(innerDiff).length > 0) {
      let selector = `[data-node-id="${nodeId}"] > *`;
      if (resolvedName === 'Button' || resolvedName === 'ButtonBlock') selector = `[data-node-id="${nodeId}"] .lexi-button`;
      if (resolvedName === 'Image' || resolvedName === 'ImageBlock') selector = `[data-node-id="${nodeId}"] img`;
      if (resolvedName === 'Heading' || resolvedName === 'HeadingBlock') selector = `[data-node-id="${nodeId}"] > *:first-child`;
      if (resolvedName === 'Divider' || resolvedName === 'DividerBlock') selector = `[data-node-id="${nodeId}"] .lexi-divider`;

      cssRules += `  ${selector} {\n${cssStringify(innerDiff)}\n  }\n`;
    }
  }

  return cssRules;
}

function buildResponsiveStyles(nodeId: string, props: any, resolvedName: string): string {
  const hasResponsiveOverrides = Object.keys(props).some(k => k.endsWith('_tablet') || k.endsWith('_mobile') || k.endsWith('Tablet') || k.endsWith('Mobile'));
  
  if (!hasResponsiveOverrides) return '';

  const tabletStyles = generateDeviceStyles(nodeId, props, resolvedName, 'tablet');
  const mobileStyles = generateDeviceStyles(nodeId, props, resolvedName, 'mobile');

  let rules = '';
  if (tabletStyles) {
    rules += `@media (max-width: 1024px) {\n${tabletStyles}}\n`;
  }
  if (mobileStyles) {
    rules += `@media (max-width: 768px) {\n${mobileStyles}}\n`;
  }

  return rules;
}

function injectNodeAttributes(html: string, nodeId: string, props: any = {}, resolvedName = ''): string {
  const match = html.match(/<(div|a|section|p|h[1-6]|img|span)\b([^>]*)>/i);
  if (!match || match.index === undefined) return html;

  const tagStart = match[0];
  const tagName = match[1];
  let attrs = match[2] || '';

  if (!/\sdata-node-id\s*=/.test(attrs)) {
    attrs += ` data-node-id="${nodeId}"`;
  }

  const widgetType = String(resolvedName || 'widget').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  const elementClasses = [
    'lexi-element',
    `lexi-widget-${widgetType}`,
    `lexi-element-${nodeId}`,
    formatCssClasses(props.classCss || ''),
  ].filter(Boolean).join(' ');

  if (/\sclass\s*=/.test(attrs)) {
    attrs = attrs.replace(/\sclass=(['"])(.*?)\1/i, (_full, quote, existing) => ` class=${quote}${existing} ${elementClasses}${quote}`);
  } else {
    attrs += ` class="${elementClasses}"`;
  }

  const requestedId = String(props.idCss || '').trim();
  if (requestedId && validateElementId(requestedId).valid && !/\sid\s*=/.test(attrs)) {
    attrs += ` id="${requestedId}"`;
  }

  const replacement = `<${tagName}${attrs}>`;
  return html.slice(0, match.index) + replacement + html.slice(match.index + tagStart.length);
}

function renderNode(state: CraftState, nodeId: string, context: RenderContext): string {
  const node = state[nodeId];
  if (!node) return '';

  const { resolvedName } = node.type || {};
  const props = node.props || {};

  // Collect responsive styles if any
  const responsiveCSS = buildResponsiveStyles(nodeId, props, resolvedName || '');
  if (responsiveCSS && (context as any).responsiveRules) {
    (context as any).responsiveRules.push(responsiveCSS);
  }

  const rawHtml = renderNodeInternal(state, nodeId, context);
  return injectNodeAttributes(rawHtml, nodeId, props, resolvedName || '');
}

function renderNodeInternal(state: CraftState, nodeId: string, context: RenderContext): string {
  const node = state[nodeId];
  if (!node) return '';

  const { resolvedName } = node.type || {};
  const props = node.props || {};

  // Get inline style attributes
  const getStyleAttr = (styleObj: Record<string, string | undefined>): string => {
    const styles = Object.entries(styleObj)
      .filter((entry) => entry[1] !== undefined && entry[1] !== null && entry[1] !== '')
      .map(([key, val]) => {
        // Convert camelCase to kebab-case
        const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${kebabKey}:${val}`;
      })
      .join(';');
    return styles ? ` style="${styles}"` : '';
  };

  const getBackgroundStyle = () => {
    const styleObj: Record<string, string | undefined> = {};
    if (props.backgroundImage) {
      styleObj.backgroundImage = `url(${props.backgroundImage})`;
      styleObj.backgroundSize = 'cover';
      styleObj.backgroundPosition = 'center';
      styleObj.backgroundRepeat = 'no-repeat';
    } else if (props.backgroundGradient) {
      styleObj.background = props.backgroundGradient;
    } else if (props.backgroundColor && props.backgroundColor !== 'transparent') {
      styleObj.backgroundColor = props.backgroundColor;
    }
    return styleObj;
  };

  const renderChildren = (): string => {
    const childIds = node.nodes || node.children || [];
    return childIds.map(id => renderNode(state, id, context)).join('');
  };

  switch (resolvedName) {
    case 'GridContainer':
    case 'Container': {
      const isRoot = nodeId === 'ROOT';
      const isThemePart = context.templateType === 'HEADER' || context.templateType === 'FOOTER';
      const isDirectChildOfRoot = node.parent === 'ROOT';
      
      // Resolve contentWidth exactly like editor Container.tsx
      const rawContentWidth = props.contentWidth || 'inherit';
      const resolvedContentWidth = (() => {
        if (!isDirectChildOfRoot) return 'full'; // nested containers always full
        if (rawContentWidth === 'inherit') return 'boxed'; // default page layout
        return rawContentWidth;
      })();
      const isBoxed = resolvedContentWidth === 'boxed';

      // Detect if this container is a column in a row-direction parent
      const parentNode = node.parent ? state[node.parent] : null;
      const parentProps = parentNode?.props || {};
      const parentIsRowContainer = parentNode && 
        (parentNode.type?.resolvedName === 'Container' || parentNode.type?.resolvedName === 'GridContainer') && 
        (parentProps.flexDirection === 'row' || parentProps.flexDirection === 'row-reverse');
      const hasCustomWidth = props.widthMode === 'custom' || props.widthMode === 'full' || props.widthMode === 'inline';
      const useFlexGrow = parentIsRowContainer && !hasCustomWidth;

      const mappedProps = {
        ...props,
        advancedBgColor: props.advancedBgColor || props.backgroundColor,
        advancedBgGradient: props.advancedBgGradient || props.backgroundGradient,
        advancedBgImage: props.advancedBgImage || props.backgroundImage,
        advancedBgType: props.advancedBgType || (props.backgroundGradient ? 'gradient' : (props.backgroundImage ? 'classic' : 'classic')),
        borderType: props.borderType || props.borderStyle || 'none',
        layoutType: resolvedName === 'GridContainer' ? 'grid' : (props.layoutType || 'flex'),
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, resolvedName === 'GridContainer' ? 'grid' : 'flex');

      const outerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
        marginTop: isRoot ? '0px' : props.marginTop,
        marginBottom: isRoot ? '0px' : props.marginBottom,
        marginLeft: isRoot ? '0px' : props.marginLeft,
        marginRight: isRoot ? '0px' : props.marginRight,
        width: useFlexGrow ? undefined : (wrapperStyle.width || props.width || '100%'),
        flex: useFlexGrow ? '1 1 0%' : undefined,
        minWidth: useFlexGrow ? '0' : undefined,
        minHeight: props.minHeight || 'auto',
        position: (wrapperStyle.position as any) || 'relative',
      };

      const resolvedMaxWidth = (() => {
        if (resolvedContentWidth === 'full') return 'none';
        if (props.maxWidth && props.maxWidth !== 'none') return props.maxWidth;
        return 'var(--site-layout-content-width, 1200px)';
      })();

      const innerStyles = getContainerInnerStyles(props as any, {
        isRoot,
        isTopLevel: isDirectChildOfRoot,
        enabled: false,
        resolvedContentWidth,
        resolvedMaxWidth,
        boxedGutter: isBoxed ? 'var(--site-layout-container-gap, 20px)' : undefined,
      }) as Record<string, string | undefined>;

      const shadowClasses: Record<string, string> = {
        none: '',
        sm: 'box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);',
        md: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
        lg: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);',
        xl: 'box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);',
        '2xl': 'box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);'
      };

      const shadowStyle = shadowClasses[props.shadow] || '';
      const outerStyleString = getStyleAttr(outerStyles);
      const finalOuterStyle = shadowStyle 
        ? outerStyleString.slice(0, -1) + ';' + shadowStyle + '"'
        : outerStyleString;

      const finalInnerStyle = getStyleAttr(innerStyles);

      // Section spacing only applies to direct children of ROOT on page templates (not header/footer)
      const shouldHaveSectionSpacing = isDirectChildOfRoot && !isThemePart;
      
      const outerClass = shouldHaveSectionSpacing ? 'lexi-section' : '';
      const innerClass = 'lexi-container';
      
      const classAttr = outerClass ? ` class="${outerClass}"` : '';
      
      return `<div${finalOuterStyle}${classAttr}><div${finalInnerStyle} class="${innerClass}">${renderChildren()}</div></div>`;
    }

    case 'TextBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: props.borderType || 'none',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, props.widthMode === 'inline' ? 'inline-block' : 'block');
      
      const mergedWrapperStyle = {
        ...wrapperStyle,
        maxWidth: props.widthMode === 'default' && props.maxWidth !== 'none' ? props.maxWidth : undefined,
      };

      const baseInnerStyles = getInnerStyles(mappedProps as any, { defaultFontFamily: 'var(--site-font-family-body)' });

      const inlineStyles: Record<string, string | undefined> = {
        ...baseInnerStyles,
        color: props.textColor || 'var(--site-color-text)',
        '--text-color': props.textColor || 'var(--site-color-text)',
        '--text-color-hover': props.textColorHover || props.textColor || 'var(--site-color-text)',
        '--link-color': props.linkColor || props.textColor || 'var(--site-color-text)',
        '--link-color-hover': props.linkColorHover || props.linkColor || props.textColor || 'var(--site-color-text)',
        '--paragraph-spacing': props.paragraphSpacing || '16px',
        textShadow: props.textShadowColor && props.textShadowColor !== 'transparent'
          ? `${props.textShadowHorizontal || '0px'} ${props.textShadowVertical || '0px'} ${props.textShadowBlur || '0px'} ${props.textShadowColor}`
          : undefined,
        mixBlendMode: props.mixBlendMode || 'normal',
        wordBreak: 'break-word',
      };

      const dynamicTextStr = compileDynamicPlaceholder(props.dynamicText);
      const textContent = dynamicTextStr !== null ? dynamicTextStr : (props.text || '');

      let classAttr = 'editor-text-block';
      if (props.dropCap) classAttr += ' editor-drop-cap';

      return `<div${getStyleAttr(mergedWrapperStyle as any)}><div${getStyleAttr(inlineStyles)} class="${classAttr}">${textContent}</div></div>`;
    }

    case 'HeadingBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: props.borderType || 'none',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');

      const baseInnerStyles = getInnerStyles(mappedProps as any, { defaultFontFamily: 'var(--site-font-family-heading)' });

      const inlineStyles: Record<string, string | undefined> = {
        ...baseInnerStyles,
        color: props.textColor || 'var(--site-color-text)',
        '--text-color': props.textColor || 'var(--site-color-text)',
        '--text-color-hover': props.textColorHover || props.textColor || 'var(--site-color-text)',
        '--link-color': props.linkColor || props.textColor || 'var(--site-color-text)',
        '--link-color-hover': props.linkColorHover || props.linkColor || props.textColor || 'var(--site-color-text)',
        textShadow: props.textShadowColor && props.textShadowColor !== 'transparent'
          ? `${props.textShadowHorizontal || '0px'} ${props.textShadowVertical || '0px'} ${props.textShadowBlur || '0px'} ${props.textShadowColor}`
          : undefined,
        mixBlendMode: props.mixBlendMode || 'normal',
        wordBreak: 'break-word',
      };

      const dynamicTextStr = compileDynamicPlaceholder(props.dynamicText);
      const textContent = dynamicTextStr !== null ? dynamicTextStr : (props.text || '');
      const tag = props.level || 'h2';
      
      const headingHtml = `<div${getStyleAttr(wrapperStyle as any)}><${tag}${getStyleAttr(inlineStyles)} class="editor-heading-block">${textContent}</${tag}></div>`;
      
      const hasLink = props.dynamicLink?.enabled || props.link;
      if (hasLink) {
        const linkAttrs = resolveLinkAttributes(props);
        return `<a${linkAttrs} style="text-decoration:none;color:inherit;display:block;">${headingHtml}</a>`;
      }

      return headingHtml;
    }

    case 'ImageBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: 'none',
        borderWidth: undefined,
        borderTopWidth: undefined,
        borderRightWidth: undefined,
        borderBottomWidth: undefined,
        borderLeftWidth: undefined,
        borderColor: undefined,
        borderRadius: undefined,
        borderTopLeftRadius: undefined,
        borderTopRightRadius: undefined,
        borderBottomRightRadius: undefined,
        borderBottomLeftRadius: undefined,
        boxShadow: undefined,
        boxShadowHover: undefined,
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'flex');

      const resolvedImageHeight = props.imageHeight !== undefined ? props.imageHeight : (props.height || 'auto');

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
        display: wrapperStyle.position ? 'inline-flex' : 'flex',
        flexDirection: 'column',
        alignItems: props.align === 'left' ? 'flex-start' : props.align === 'right' ? 'flex-end' : 'center',
        justifyContent: 'center',
        height: wrapperStyle.position ? (resolvedImageHeight === 'auto' ? undefined : resolvedImageHeight) : undefined,
      };

      const imageStyles: Record<string, string | undefined> = {
        width: props.imageWidth || resolveWidth(props) || props.width || '100%',
        maxWidth: props.imageMaxWidth || '100%',
        height: resolvedImageHeight,
        objectFit: props.objectFit || 'cover',
        display: props.widthMode === 'inline' ? 'inline-block' : 'block'
      };

      if (props.borderType && props.borderType !== 'none') {
        imageStyles.borderStyle = props.borderStyle || props.borderType || 'solid';
        imageStyles.borderColor = props.borderColor || '#000000';
        imageStyles.borderTopWidth = props.borderTopWidth || props.borderWidth || '0px';
        imageStyles.borderRightWidth = props.borderRightWidth || props.borderWidth || '0px';
        imageStyles.borderBottomWidth = props.borderBottomWidth || props.borderWidth || '0px';
        imageStyles.borderLeftWidth = props.borderLeftWidth || props.borderWidth || '0px';
      }

      imageStyles.borderTopLeftRadius = props.borderTopLeftRadius || props.borderRadius || '8px';
      imageStyles.borderTopRightRadius = props.borderTopRightRadius || props.borderRadius || '8px';
      imageStyles.borderBottomRightRadius = props.borderBottomRightRadius || props.borderRadius || '8px';
      imageStyles.borderBottomLeftRadius = props.borderBottomLeftRadius || props.borderRadius || '8px';

      const dynamicUrlStr = compileDynamicPlaceholder(props.dynamicUrl);
      const originalImgSrc = dynamicUrlStr !== null ? dynamicUrlStr : (props.url || '');
      const imgSrc = getResolutionUrl(originalImgSrc, props.imageResolution || 'large');

      if (!imgSrc) return '';

      const imageElementId = `img-${nodeId}`;
      const opacityVal = props.opacity !== undefined ? props.opacity : '1';
      const opacityHoverVal = props.opacityHover !== undefined ? props.opacityHover : opacityVal;
      const filterVal = props.cssFilters || 'none';
      const filterHoverVal = props.cssFiltersHover || filterVal;
      const shadowVal = props.boxShadow || 'none';
      const shadowHoverVal = props.boxShadowHover || shadowVal;

      const styleTag = `
        <style>
          #${imageElementId} {
            transition: all 0.2s ease-in-out;
            opacity: ${opacityVal} !important;
            filter: ${filterVal} !important;
            box-shadow: ${shadowVal} !important;
          }
          #${imageElementId}:hover {
            opacity: ${opacityHoverVal} !important;
            filter: ${filterHoverVal} !important;
            box-shadow: ${shadowHoverVal} !important;
          }
        </style>
      `;

      let linkHref = '';
      if (props.linkType === 'media') {
        linkHref = originalImgSrc;
      } else if (props.linkType === 'custom') {
        const dynamicLinkStr = compileDynamicPlaceholder(props.dynamicLink);
        linkHref = dynamicLinkStr || props.link || '#';
      }

      const imgHtml = `<img id="${imageElementId}" src="${imgSrc}" alt="${props.alt || ''}"${getStyleAttr(imageStyles)} />`;
      
      let mainContent = imgHtml;
      if (linkHref) {
        const linkAttrs = props.linkType === 'custom' ? resolveLinkAttributes(props) : ` href="${linkHref}"`;
        const linkStyles: Record<string, string | undefined> = {
          display: props.widthMode === 'inline' ? 'inline-block' : 'block',
          width: props.imageWidth || resolveWidth(props) || props.width || '100%',
          maxWidth: props.imageMaxWidth || '100%',
        };
        mainContent = `<a${linkAttrs}${getStyleAttr(linkStyles)}>${imgHtml}</a>`;
      }

      let captionText = '';
      if (props.captionType === 'attachment') {
        captionText = props.alt || '';
      } else if (props.captionType === 'custom') {
        captionText = props.customCaption || '';
      }

      const captionHtml = captionText
        ? `<div style="text-align:center;font-size:12px;color:#64748b;margin-top:8px;font-style:italic;font-weight:500;">${captionText}</div>`
        : '';

      return `${styleTag}<div${getStyleAttr(containerStyles)}>${mainContent}${captionHtml}</div>`;
    }

    case 'ButtonBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'flex');

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
        display: 'flex',
        width: wrapperStyle.position ? wrapperStyle.width : '100%',
        justifyContent: props.align === 'left' ? 'flex-start' : props.align === 'right' ? 'flex-end' : 'center',
        height: wrapperStyle.position ? (props.height === 'auto' ? undefined : props.height) : undefined,
      };

      const preset = props.buttonPreset || 'custom';

      const buttonStyles: Record<string, string | undefined> = {
        ...resolveTypographyStyles(props),
        backgroundColor: preset === 'primary'
          ? 'var(--site-btn-primary-bg)'
          : preset === 'secondary'
            ? 'var(--site-btn-secondary-bg)'
            : props.backgroundColor,
        color: preset === 'primary'
          ? 'var(--site-btn-primary-color)'
          : preset === 'secondary'
            ? 'var(--site-btn-secondary-color)'
            : props.textColor,
        paddingTop: preset === 'primary'
          ? 'var(--site-btn-primary-padding-y)'
          : preset === 'secondary'
            ? 'var(--site-btn-secondary-padding-y)'
            : props.paddingTop,
        paddingBottom: preset === 'primary'
          ? 'var(--site-btn-primary-padding-y)'
          : preset === 'secondary'
            ? 'var(--site-btn-secondary-padding-y)'
            : props.paddingBottom,
        paddingLeft: preset === 'primary'
          ? 'var(--site-btn-primary-padding-x)'
          : preset === 'secondary'
            ? 'var(--site-btn-secondary-padding-x)'
            : props.paddingLeft,
        paddingRight: preset === 'primary'
          ? 'var(--site-btn-primary-padding-x)'
          : preset === 'secondary'
            ? 'var(--site-btn-secondary-padding-x)'
            : props.paddingRight,
        width: props.widthMode === 'full' || props.width === 'full' ? '100%' : (props.widthMode === 'custom' ? props.customWidth : 'auto'),
        height: props.height === 'auto' ? undefined : props.height,
        textAlign: 'center',
        display: props.widthMode === 'full' || props.width === 'full' ? 'block' : 'inline-block',
        mixBlendMode: props.mixBlendMode || 'normal',
      };

      const btnBorderStyle = props.btnBorderStyle || props.borderStyle || 'none';
      if (btnBorderStyle && btnBorderStyle !== 'none') {
        buttonStyles.borderStyle = btnBorderStyle;
        buttonStyles.borderTopWidth = props.btnBorderTopWidth || props.btnBorderWidth || props.borderTopWidth || props.borderWidth || '0px';
        buttonStyles.borderRightWidth = props.btnBorderRightWidth || props.btnBorderWidth || props.borderRightWidth || props.borderWidth || '0px';
        buttonStyles.borderBottomWidth = props.btnBorderBottomWidth || props.btnBorderWidth || props.borderBottomWidth || props.borderWidth || '0px';
        buttonStyles.borderLeftWidth = props.btnBorderLeftWidth || props.btnBorderWidth || props.borderLeftWidth || props.borderWidth || '0px';
        buttonStyles.borderColor = props.btnBorderColor || props.borderColor || 'transparent';
      } else {
        buttonStyles.borderStyle = 'none';
      }

      const btnBorderTopLeftRadius = props.btnBorderTopLeftRadius || props.btnBorderRadius || props.borderTopLeftRadius || props.borderRadius;
      const btnBorderTopRightRadius = props.btnBorderTopRightRadius || props.btnBorderRadius || props.borderTopRightRadius || props.borderRadius;
      const btnBorderBottomRightRadius = props.btnBorderBottomRightRadius || props.btnBorderRadius || props.borderBottomRightRadius || props.borderRadius;
      const btnBorderBottomLeftRadius = props.btnBorderBottomLeftRadius || props.btnBorderRadius || props.borderBottomLeftRadius || props.borderRadius;

      const hasCustomRadius = btnBorderTopLeftRadius || btnBorderTopRightRadius || btnBorderBottomRightRadius || btnBorderBottomLeftRadius;
      if (preset === 'primary') {
        buttonStyles.borderRadius = 'var(--site-btn-primary-radius)';
      } else if (preset === 'secondary') {
        buttonStyles.borderRadius = 'var(--site-btn-secondary-radius)';
      } else {
        if (hasCustomRadius) {
          buttonStyles.borderTopLeftRadius = btnBorderTopLeftRadius;
          buttonStyles.borderTopRightRadius = btnBorderTopRightRadius;
          buttonStyles.borderBottomRightRadius = btnBorderBottomRightRadius;
          buttonStyles.borderBottomLeftRadius = btnBorderBottomLeftRadius;
        } else {
          buttonStyles.borderRadius = props.btnBorderRadius || props.borderRadius;
        }
      }
      buttonStyles.textDecoration = props.textDecoration || 'none';
      buttonStyles.cursor = 'pointer';

      const dynamicTextStr = compileDynamicPlaceholder(props.dynamicText);
      const buttonText = dynamicTextStr !== null ? dynamicTextStr : (props.text || 'Button');
      const presetClass = preset === 'primary' ? ' btn-preset-primary' : preset === 'secondary' ? ' btn-preset-secondary' : '';
      const linkAttrs = resolveLinkAttributes(props);

      let innerHtml = buttonText;
      if (props.iconName) {
        const isCustomSvg = props.iconName.startsWith('/') || props.iconName.startsWith('http');
        const iconHtml = isCustomSvg 
          ? `<img src="${props.iconName}" alt="Icon" style="width:1em;height:1em;object-fit:contain;" />`
          : getLucideSvgString(props.iconName, 18, buttonStyles.color || 'currentColor');
        
        const iconSpan = `<span style="display:flex;align-items:center;justify-content:center;">${iconHtml}</span>`;
        const textSpan = `<span style="outline:none;display:inline-block;min-width:10px;">${buttonText}</span>`;
        
        const innerContent = props.iconPosition === 'right' 
          ? `${textSpan}${iconSpan}` 
          : `${iconSpan}${textSpan}`;

        innerHtml = `<div style="display:flex;align-items:center;justify-content:center;gap:${props.iconSpacing || '8px'};">${innerContent}</div>`;
      }

      return `<div${getStyleAttr(containerStyles)}><a${linkAttrs}${getStyleAttr(buttonStyles)} class="${presetClass.trim()}">${innerHtml}</a></div>`;
    }

    case 'DividerBlock': {
      const color = props.color || '#cbd5e1';
      const thickness = props.thickness || '1px';
      const style = props.style || 'solid';
      const align = props.align || 'center';
      const gap = props.gap || '15px';
      const dividerWidth = props.dividerWidth || '100%';
      const elementType = props.elementType || 'none';
      const text = props.text || 'Đường phân cách';
      const iconName = props.iconName || 'Star';
      const elementPosition = props.elementPosition || 'center';
      const elementSpacing = props.elementSpacing || '15px';
      const textColor = props.textColor || '#334155';
      const fontFamily = props.fontFamily || 'Inter';
      const fontSize = props.fontSize || '14px';
      const fontWeight = props.fontWeight || '500';
      const textTransform = props.textTransform || 'none';
      const fontStyle = props.fontStyle || 'normal';
      const textDecoration = props.textDecoration || 'none';
      const lineHeight = props.lineHeight || 'normal';
      const letterSpacing = props.letterSpacing || '0px';
      const wordSpacing = props.wordSpacing || '0px';
      const iconSize = props.iconSize || '24';
      const iconColor = props.iconColor || '#334155';
      const iconRotate = props.iconRotate || '0';

      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: props.borderType || 'none',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'flex');

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
        display: 'flex',
        justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        paddingTop: gap,
        paddingBottom: gap,
      };

      if (elementType === 'none') {
        const hrStyles: Record<string, string | undefined> = {
          border: 'none',
          borderTopWidth: thickness,
          borderTopColor: color,
          borderTopStyle: style,
          width: dividerWidth,
          margin: '0'
        };
        return `<div${getStyleAttr(containerStyles)}><hr${getStyleAttr(hrStyles)} /></div>`;
      }

      const hrStyles: Record<string, string | undefined> = {
        border: 'none',
        borderTopWidth: thickness,
        borderTopColor: color,
        borderTopStyle: style,
        margin: '0',
        flex: '1'
      };

      const sideHr = `<div${getStyleAttr(hrStyles)}></div>`;

      // Build element content HTML
      let elementHtml = '';
      if (elementType === 'text') {
        const spanStyles: Record<string, string | undefined> = {
          color: textColor,
          fontFamily: resolveFontFamily(fontFamily),
          fontSize: parseInt(fontSize) ? `${parseInt(fontSize)}px` : fontSize,
          fontWeight: fontWeight,
          textTransform: textTransform,
          fontStyle: fontStyle,
          textDecoration: textDecoration,
          lineHeight: lineHeight,
          letterSpacing: letterSpacing,
          wordSpacing: wordSpacing,
          padding: '0 10px',
          display: 'inline-block'
        };
        elementHtml = `<span${getStyleAttr(spanStyles)}>${text}</span>`;
      } else if (elementType === 'icon') {
        if (iconName && (iconName.startsWith('/') || iconName.startsWith('http'))) {
          elementHtml = `<img src="${iconName}" alt="Icon" style="width:${iconSize}px;height:${iconSize}px;object-fit:contain;" />`;
        } else {
          elementHtml = getLucideSvgString(iconName, iconSize, iconColor);
        }
      }

      // Element wrapper padding & display
      const elementWrapperStyles: Record<string, string | undefined> = {
        paddingLeft: elementPosition === 'left' ? '0' : elementSpacing,
        paddingRight: elementPosition === 'right' ? '0' : elementSpacing,
        color: elementType === 'text' ? textColor : iconColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };
      if (elementType === 'icon' && iconRotate && iconRotate !== '0') {
        elementWrapperStyles.transform = `rotate(${iconRotate}deg)`;
      }

      const contentHtml = `
        <div style="display:flex;align-items:center;width:${dividerWidth};">
          ${elementPosition !== 'left' ? sideHr : ''}
          <div${getStyleAttr(elementWrapperStyles)}>${elementHtml}</div>
          ${elementPosition !== 'right' ? sideHr : ''}
        </div>
      `.trim();

      return `<div${getStyleAttr(containerStyles)}>${contentHtml}</div>`;
    }

    case 'VideoBlock': {
      const source = props.source || 'youtube';
      const url = props.url || '';
      const ratio = props.ratio || '16/9';
      const align = props.align || 'center';
      const startTime = props.startTime || '';
      const endTime = props.endTime || '';
      const autoplay = toBool(props.autoplay, false);
      const mute = toBool(props.mute, false);
      const loop = toBool(props.loop, false);
      const controls = toBoolDefaultTrue(props.controls);
      const captions = toBool(props.captions, false);
      const privacy = toBool(props.privacy, false);
      const lazyLoad = toBool(props.lazyLoad, false);
      const suggestedVideos = props.suggestedVideos || 'current';
      const showOverlay = toBool(props.showOverlay, false);
      const overlayImage = props.overlayImage || '';
      const overlayImageResolution = props.overlayImageResolution || 'full';
      const showPlayIcon = toBoolDefaultTrue(props.showPlayIcon);
      const playIconType = props.playIconType || 'default';
      const playIconSvg = props.playIconSvg || '';
      const playIconLucide = props.playIconLucide || 'Play';
      const lightbox = toBool(props.lightbox, false);
      const playIconColor = props.playIconColor || '#ffffff';
      const playIconSize = props.playIconSize || '60';
      const playIconShadowColor = props.playIconShadowColor || 'rgba(0,0,0,0.3)';
      const playIconShadowHorizontal = props.playIconShadowHorizontal || '0';
      const playIconShadowVertical = props.playIconShadowVertical || '10';
      const playIconShadowBlur = props.playIconShadowBlur || '25';
      const playIconShadowSpread = props.playIconShadowSpread || '0';
      const cssFilters = props.cssFilters || '';

      const getResolvedOverlayImage = () => {
        if (!overlayImage || overlayImageResolution === 'full') return overlayImage;
        const sizeMap: Record<string, string> = {
          thumbnail: '150x150',
          medium: '300x300',
          large: '1024x1024',
        };
        const size = sizeMap[overlayImageResolution];
        if (!size) return overlayImage;
        return overlayImage.replace(/\.(jpe?g|png|webp|gif)(\?.*)?$/i, `-${size}.$1$2`);
      };

      const resolvedOverlayImage = getResolvedOverlayImage();

      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: 'none',
        borderWidth: undefined,
        borderTopWidth: undefined,
        borderRightWidth: undefined,
        borderBottomWidth: undefined,
        borderLeftWidth: undefined,
        borderColor: undefined,
        borderRadius: undefined,
        borderTopLeftRadius: undefined,
        borderTopRightRadius: undefined,
        borderBottomRightRadius: undefined,
        borderBottomLeftRadius: undefined,
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'flex');
      const height = props.height || 'auto';

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
        display: 'flex',
        width: wrapperStyle.position ? wrapperStyle.width : '100%',
        justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        height: wrapperStyle.position ? (height === 'auto' ? undefined : height) : undefined,
      };

      // Construct Video Embed URL
      const getVideoEmbedUrl = () => {
        if (!url) return '';

        if (source === 'youtube') {
          let videoId = '';
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          const match = url.match(regExp);
          if (match && match[2].length === 11) {
            videoId = match[2];
          } else {
            if (url.length === 11) videoId = url;
          }

          if (!videoId) return url;

          const domain = privacy ? 'https://www.youtube-nocookie.com' : 'https://www.youtube';
          const params = new URLSearchParams();
          
          const isAutoplay = autoplay || (showOverlay && lightbox) || (showOverlay && !lightbox);
          // Explicitly set autoplay and mute to ensure embed respects our settings
          params.set('autoplay', isAutoplay ? '1' : '0');
          params.set('mute', mute ? '1' : '0');
          params.set('playsinline', '1');
          if (!controls) params.set('controls', '0');
          if (captions) params.set('cc_load_policy', '1');
          if (privacy) params.set('modestbranding', '1');
          if (suggestedVideos === 'current') params.set('rel', '0');
          
          if (loop) {
            params.set('loop', '1');
            params.set('playlist', videoId);
          }
          
          if (startTime) params.set('start', String(startTime));
          if (endTime) params.set('end', String(endTime));

          const paramStr = params.toString();
          return `${domain}.com/embed/${videoId}?${paramStr}`;
        }


        return url;
      };

      const embedUrl = getVideoEmbedUrl();
      const safeRatio = ratio.replace(':', '/');

      // Border styles
      let borderStyleStr = '';
      if (props.borderType && props.borderType !== 'none') {
        const borderStyle = props.borderStyle || props.borderType || 'solid';
        const borderColor = props.borderColor || '#000000';
        const topWidth = props.borderTopWidth || props.borderWidth || '0px';
        const rightWidth = props.borderRightWidth || props.borderWidth || '0px';
        const bottomWidth = props.borderBottomWidth || props.borderWidth || '0px';
        const leftWidth = props.borderLeftWidth || props.borderWidth || '0px';
        borderStyleStr += `border-style:${borderStyle};border-color:${borderColor};border-top-width:${topWidth};border-right-width:${rightWidth};border-bottom-width:${bottomWidth};border-left-width:${leftWidth};`;
      } else {
        borderStyleStr += 'border:none;';
      }

      const tl = props.borderTopLeftRadius || props.borderRadius || '8px';
      const tr = props.borderTopRightRadius || props.borderRadius || '8px';
      const br = props.borderBottomRightRadius || props.borderRadius || '8px';
      const bl = props.borderBottomLeftRadius || props.borderRadius || '8px';
      borderStyleStr += `border-top-left-radius:${tl};border-top-right-radius:${tr};border-bottom-right-radius:${br};border-bottom-left-radius:${bl};`;

      const videoElementId = `video-${nodeId}`;
      const lazyAttr = lazyLoad ? ' loading="lazy"' : '';

      // Build play icon HTML
      let playIconHtml = '';
      if (showPlayIcon) {
        const sizeVal = parseInt(playIconSize) || 60;
        const shadowStyle = playIconShadowColor 
          ? `box-shadow:${playIconShadowHorizontal}px ${playIconShadowVertical}px ${playIconShadowBlur}px ${playIconShadowSpread}px ${playIconShadowColor};`
          : '';

        if (playIconType === 'lucide') {
          const svgContent = getLucideSvgString(playIconLucide || 'Play', sizeVal, playIconColor);
          const dropShadow = playIconShadowColor 
            ? `filter:drop-shadow(${playIconShadowHorizontal}px ${playIconShadowVertical}px ${playIconShadowBlur}px ${playIconShadowColor});`
            : '';
          playIconHtml = `<div style="color:${playIconColor};width:${sizeVal}px;height:${sizeVal}px;display:flex;align-items:center;justify-content:center;${dropShadow}" class="play-icon-hover">${svgContent}</div>`;
        } else if (playIconType === 'svg' && playIconSvg) {
          playIconHtml = `<div style="width:${sizeVal}px;height:${sizeVal}px;display:flex;align-items:center;justify-content:center;" class="play-icon-hover">${playIconSvg}</div>`;
        } else {
          // Default circular button
          const svgArrow = getLucideSvgString('Play', sizeVal * 0.4, playIconColor, true);
          playIconHtml = `
            <div 
              style="background-color:rgba(0,0,0,0.6);border-radius:50%;width:${sizeVal}px;height:${sizeVal}px;display:flex;align-items:center;justify-content:center;padding-left:${sizeVal * 0.05}px;${shadowStyle}"
              class="play-icon-hover"
            >
              ${svgArrow}
            </div>
          `.trim();
        }
      }

      // Stylesheet for hover effects
      const styleTag = `
        <style>
          #${videoElementId} .play-icon-hover {
            transition: all 0.3s ease;
          }
          #${videoElementId} .play-icon-hover:hover {
            transform: scale(1.1);
            ${playIconType === 'default' ? 'background-color: rgba(0, 0, 0, 0.8) !important;' : ''}
          }
        </style>
      `.trim();

      const showActiveOverlay = showOverlay && overlayImage;

      let playerContentHtml = '';
      if (showActiveOverlay) {
        if (lightbox) {
          // Click opens dynamic lightbox modal
          const modalId = `lightbox-modal-${nodeId}`;
          const isSelfHosted = source === 'self_hosted';
          const innerVideoHtml = isSelfHosted 
            ? `<video src="${embedUrl}" ${controls ? 'controls' : ''} autoplay ${mute ? 'muted' : ''} ${loop ? 'loop' : ''} style="width:100%;height:100%;object-fit:contain;"></video>`
            : `<iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;height:100%;"></iframe>`;

          const clickJs = `
            (function(){
              const mId = '${modalId}';
              const old = document.getElementById(mId);
              if (old) old.remove();

              const modal = document.createElement('div');
              modal.id = mId;
              modal.setAttribute('role', 'dialog');
              modal.setAttribute('aria-modal', 'true');
              modal.style.position = 'fixed';
              modal.style.inset = '0';
              modal.style.zIndex = '2147483647';
              modal.style.background = 'rgba(0,0,0,0.88)';
              modal.style.display = 'flex';
              modal.style.alignItems = 'center';
              modal.style.justifyContent = 'center';
              modal.style.padding = '24px';
              modal.style.opacity = '0';
              modal.style.transition = 'opacity 0.2s ease';
              modal.style.backdropFilter = 'blur(8px)';

              const box = document.createElement('div');
              box.style.position = 'relative';
              box.style.width = 'min(92vw, 960px)';
              box.style.maxHeight = '86vh';
              box.style.aspectRatio = '${safeRatio}';
              box.style.background = '#000';
              box.style.borderRadius = '12px';
              box.style.overflow = 'hidden';
              box.style.boxShadow = '0 24px 80px rgba(0,0,0,0.55)';

              const close = document.createElement('button');
              close.type = 'button';
              close.innerHTML = '&times;';
              close.setAttribute('aria-label', 'Đóng lightbox');
              close.style.position = 'absolute';
              close.style.top = '12px';
              close.style.right = '12px';
              close.style.zIndex = '2';
              close.style.width = '34px';
              close.style.height = '34px';
              close.style.borderRadius = '999px';
              close.style.border = '0';
              close.style.background = 'rgba(0,0,0,0.72)';
              close.style.color = '#fff';
              close.style.fontSize = '24px';
              close.style.lineHeight = '1';
              close.style.cursor = 'pointer';

              const player = document.createElement('div');
              player.style.position = 'absolute';
              player.style.inset = '0';
              player.innerHTML = \`${innerVideoHtml.replace(/`/g, '\\`')}\`;

              const removeModal = function(){
                modal.style.opacity = '0';
                setTimeout(function(){ modal.remove(); }, 200);
              };

              close.addEventListener('click', function(e){
                e.preventDefault();
                e.stopPropagation();
                removeModal();
              });
              modal.addEventListener('click', function(e){
                if (e.target === modal) removeModal();
              });
              box.addEventListener('click', function(e){ e.stopPropagation(); });

              box.appendChild(player);
              box.appendChild(close);
              modal.appendChild(box);
              document.body.appendChild(modal);
              requestAnimationFrame(function(){ modal.style.opacity = '1'; });
            })()
          `.replace(/"/g, '&quot;').trim();

          playerContentHtml = `
            <div 
              style="position:absolute;top:0;left:0;width:100%;height:100%;cursor:pointer;background-image:url(${resolvedOverlayImage});background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;z-index:10;"
              onclick="${clickJs}"
            >
              ${playIconHtml}
            </div>
          `.trim();
        } else {
          // Direct Swap
          const innerVideoHtml = source === 'self_hosted'
            ? `<video src="" data-src="${embedUrl}" ${controls ? 'controls' : ''} autoplay ${mute ? 'muted' : ''} ${loop ? 'loop' : ''} style="width:100%;height:100%;object-fit:contain;"></video>`
            : `<iframe src="" data-src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen${lazyAttr} style="width:100%;height:100%;"></iframe>`;

          const clickJs = `
            (function(el){
              el.style.display = 'none';
              const wrap = el.nextElementSibling;
              wrap.style.display = 'block';
              const frame = wrap.querySelector('iframe, video');
              if (frame) {
                const src = frame.getAttribute('data-src');
                if (src) {
                  frame.setAttribute('src', src);
                  if (frame.tagName === 'VIDEO') frame.play();
                }
              }
            })(this)
          `.replace(/"/g, '&quot;').trim();

          playerContentHtml = `
            <div 
              style="position:absolute;top:0;left:0;width:100%;height:100%;cursor:pointer;background-image:url(${resolvedOverlayImage});background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;z-index:10;"
              onclick="${clickJs}"
            >
              ${playIconHtml}
            </div>
            <div style="display:none;position:absolute;top:0;left:0;width:100%;height:100%;">
              ${innerVideoHtml}
            </div>
          `.trim();
        }
      } else {
        // Standard Direct iframe / video
        if (embedUrl) {
          const allowAttr = autoplay 
            ? 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"'
            : 'allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"';
          playerContentHtml = source === 'self_hosted' 
            ? `<video src="${embedUrl}" ${controls ? 'controls' : ''} ${autoplay ? 'autoplay' : ''} ${mute ? 'muted' : ''} ${loop ? 'loop' : ''} style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;"></video>`
            : `<iframe src="${embedUrl}" frameborder="0" ${allowAttr} allowfullscreen${lazyAttr} style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>`;
        } else {
          playerContentHtml = `
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#94a3b8;padding:32px;text-align:center;background:#0f172a;">
              ${getLucideSvgString('PlayCircle', 40, '#ef4444')}
              <div style="font-size:11px;font-weight:bold;margin-top:8px;">Chưa nhập đường dẫn video (YouTube hoặc Tự lưu trữ)</div>
            </div>
          `.trim();
        }
      }

      const videoHeightStr = height === 'auto' ? '' : `height:${height};`;
      const aspectRatioStr = height === 'auto' ? `aspect-ratio:${safeRatio};` : '';
      const outerWidth = resolveWidth(props) || props.width || '100%';

      return `
        <div id="${videoElementId}"${getStyleAttr(containerStyles)}>
          ${styleTag}
          <div style="width:${outerWidth};${videoHeightStr}${aspectRatioStr}position:relative;overflow:hidden;${borderStyleStr}${cssFilters ? `filter:${cssFilters};` : ''}display:flex;align-items:center;justify-content:center;background:#0f172a;">
            ${playerContentHtml}
          </div>
        </div>
      `.trim();
    }

    case 'SpacerBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: props.borderType || 'none',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
        height: props.heightProp || '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };
      return `<div${getStyleAttr(containerStyles as any)}></div>`;
    }

    case 'IconBoxBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: 'none',
        borderWidth: undefined,
        borderTopWidth: undefined,
        borderRightWidth: undefined,
        borderBottomWidth: undefined,
        borderLeftWidth: undefined,
        borderColor: undefined,
        borderRadius: undefined,
        borderTopLeftRadius: undefined,
        borderTopRightRadius: undefined,
        borderBottomRightRadius: undefined,
        borderBottomLeftRadius: undefined,
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
        display: 'block',
      };

      const iconName = props.iconName || 'Star';
      const iconStyle = props.iconStyle || 'solid';
      const view = props.iconView || 'default';
      const shape = props.iconShape || 'circle';
      const title = props.title || 'Đây là tiêu đề';
      const description = props.description || '';
      const titleTag = props.titleTag || 'h3';
      const iconPosition = props.iconPosition || 'top';
      const align = props.align || 'center';
      const iconSpacing = props.iconSpacing || '15px';
      const contentSpacing = props.contentSpacing || '10px';

      const primaryColor = props.iconColor || '#3b82f6';
      const primaryColorHover = props.iconColorHover || '#2563eb';
      const size = parseInt(props.iconSize) || 30;
      const iconRotate = props.iconRotate || '0';
      const paddingVal = props.paddingProp || '10px';

      // Setup CSS custom properties for hover behavior on the container
      if (view === 'default') {
        containerStyles['--icon-color'] = primaryColor;
        containerStyles['--icon-color-hover'] = primaryColorHover;
      } else if (view === 'stacked') {
        containerStyles['--badge-bg'] = primaryColor;
        containerStyles['--badge-bg-hover'] = primaryColorHover;
        containerStyles['--icon-color'] = '#ffffff';
        containerStyles['--icon-color-hover'] = '#ffffff';
      } else if (view === 'framed') {
        containerStyles['--badge-border-color'] = primaryColor;
        containerStyles['--badge-border-color-hover'] = primaryColorHover;
        containerStyles['--badge-bg'] = 'transparent';
        containerStyles['--badge-bg-hover'] = 'transparent';
        containerStyles['--icon-color'] = primaryColor;
        containerStyles['--icon-color-hover'] = primaryColorHover;
      }

      const isCustomSvg = iconStyle === 'custom' || (iconName && (iconName.startsWith('/') || iconName.startsWith('http')));

      // Lucide SVG color is styled using currentColor
      const rotateVal = String(iconRotate).endsWith('deg') ? iconRotate : `${iconRotate || 0}deg`;
      const rotateStyle = rotateVal && rotateVal !== '0deg' ? `transform:rotate(${rotateVal});` : '';
      const svgStr = !isCustomSvg ? getLucideSvgString(iconName, size, 'currentColor', iconStyle === 'solid') : '';
      const iconHtml = isCustomSvg 
        ? `<img src="${iconName}" style="width:${size}px;height:${size}px;object-fit:contain;${rotateStyle}transition:transform 0.2s;" />`
        : svgStr.replace('<svg', `<svg style="transition:transform 0.2s, stroke 0.2s, fill 0.2s;${rotateStyle}"`);

      let viewHtml = '';
      if (view === 'default') {
        viewHtml = iconHtml;
      } else {
        // Calculate badge border radius
        let badgeBorderRadius = '0px';
        if (shape === 'circle') {
          badgeBorderRadius = '50%';
        } else if (shape === 'square') {
          badgeBorderRadius = '0px';
        } else {
          const finalBorderRadiusProp = props.borderRadiusProp || '10px';
          const tl = props.badgeBorderTopLeftRadius || finalBorderRadiusProp;
          const tr = props.badgeBorderTopRightRadius || finalBorderRadiusProp;
          const br = props.badgeBorderBottomRightRadius || finalBorderRadiusProp;
          const bl = props.badgeBorderBottomLeftRadius || finalBorderRadiusProp;
          badgeBorderRadius = `${tl} ${tr} ${br} ${bl}`;
        }

        const badgeStyles: Record<string, string | undefined> = {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: paddingVal,
          borderRadius: badgeBorderRadius,
        };

        if (view === 'stacked') {
          badgeStyles.backgroundColor = 'var(--badge-bg)';
        } else if (view === 'framed') {
          const topW = props.badgeBorderTopWidth || '2px';
          const rightW = props.badgeBorderRightWidth || '2px';
          const bottomW = props.badgeBorderBottomWidth || '2px';
          const leftW = props.badgeBorderLeftWidth || '2px';
          badgeStyles.borderStyle = 'solid';
          badgeStyles.borderTopWidth = topW;
          badgeStyles.borderRightWidth = rightW;
          badgeStyles.borderBottomWidth = bottomW;
          badgeStyles.borderLeftWidth = leftW;
          badgeStyles.borderColor = 'var(--badge-border-color)';
          badgeStyles.backgroundColor = 'var(--badge-bg)';
        }

        viewHtml = `<div class="icon-badge"${getStyleAttr(badgeStyles)}>${iconHtml}</div>`;
      }

      // Box flex layout
      const isHorizontal = iconPosition === 'left' || iconPosition === 'right';
      const flexDir = iconPosition === 'top' ? 'column' : (iconPosition === 'right' ? 'row-reverse' : 'row');

      const contentFlexStyles: Record<string, string | undefined> = {
        display: 'flex',
        flexDirection: flexDir,
        alignItems: isHorizontal ? 'flex-start' : (align === 'left' ? 'flex-start' : (align === 'right' ? 'flex-end' : 'center')),
        width: '100%',
      };

      const iconWrapperStyle: Record<string, string | undefined> = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: '0',
        marginBottom: iconPosition === 'top' ? iconSpacing : '0px',
        marginRight: iconPosition === 'left' ? iconSpacing : '0px',
        marginLeft: iconPosition === 'right' ? iconSpacing : '0px',
      };

      const textWrapperStyle: Record<string, string | undefined> = {
        flex: '1 1 0%',
        display: 'flex',
        flexDirection: 'column',
        textAlign: align === 'left' ? 'left' : (align === 'right' ? 'right' : (align === 'justify' ? 'justify' : 'center')),
        alignItems: align === 'left' ? 'flex-start' : (align === 'right' ? 'flex-end' : (align === 'justify' ? 'stretch' : 'center')),
        width: '100%',
        minWidth: '0px',
      };

      // Resolve text/description values
      const displayTitle = compileDynamicPlaceholder(props.dynamicTitle) || title;
      const displayDesc = compileDynamicPlaceholder(props.dynamicDescription) || description;

      const titleStyleObj: Record<string, string | undefined> = {
        color: props.titleColor || '#1e293b',
        fontFamily: props.titleFontFamily ? resolveFontFamily(props.titleFontFamily) : undefined,
        fontSize: props.titleFontSize || '20px',
        fontWeight: props.titleFontWeight || '600',
        fontStyle: props.titleFontStyle || 'normal',
        lineHeight: props.titleLineHeight || undefined,
        letterSpacing: props.titleLetterSpacing || undefined,
        wordSpacing: props.wordSpacing || undefined,
        textShadow: props.titleTextShadowColor && props.titleTextShadowColor !== 'transparent'
          ? `${props.titleTextShadowHorizontal || '0px'} ${props.titleTextShadowVertical || '0px'} ${props.titleTextShadowBlur || '0px'} ${props.titleTextShadowColor}`
          : undefined,
        WebkitTextStroke: props.titleTextStrokeWidth && props.titleTextStrokeWidth !== '0px' && props.titleTextStrokeColor !== 'transparent'
          ? `${props.titleTextStrokeWidth} ${props.titleTextStrokeColor}`
          : undefined,
        marginBottom: displayDesc ? contentSpacing : '0px',
        outline: 'none',
        wordBreak: 'break-word',
        width: '100%',
        margin: '0',
      };

      const descStyleObj: Record<string, string | undefined> = {
        color: props.descColor || '#475569',
        fontFamily: props.descFontFamily ? resolveFontFamily(props.descFontFamily) : undefined,
        fontSize: props.descFontSize || '14px',
        fontWeight: props.descFontWeight || '400',
        fontStyle: props.descFontStyle || 'normal',
        lineHeight: props.descLineHeight || undefined,
        letterSpacing: props.descLetterSpacing || undefined,
        wordSpacing: props.descWordSpacing || undefined,
        textShadow: props.descTextShadowColor && props.descTextShadowColor !== 'transparent'
          ? `${props.descTextShadowHorizontal || '0px'} ${props.descTextShadowVertical || '0px'} ${props.descTextShadowBlur || '0px'} ${props.descTextShadowColor}`
          : undefined,
        outline: 'none',
        wordBreak: 'break-word',
        width: '100%',
        margin: '0',
      };

      const boxElementId = `icon-box-${nodeId}`;
      let styleTag = '';

      if (view === 'default') {
        styleTag = `
          <style>
            #${boxElementId} svg {
              color: var(--icon-color) !important;
              stroke: var(--icon-color) !important;
              fill: ${iconStyle === 'solid' ? 'var(--icon-color)' : 'none'} !important;
            }
            #${boxElementId}:hover svg {
              color: var(--icon-color-hover) !important;
              stroke: var(--icon-color-hover) !important;
              fill: ${iconStyle === 'solid' ? 'var(--icon-color-hover)' : 'none'} !important;
            }
          </style>
        `;
      } else if (view === 'stacked') {
        styleTag = `
          <style>
            #${boxElementId} .icon-badge {
              background-color: var(--badge-bg) !important;
              transition: all 0.2s;
            }
            #${boxElementId}:hover .icon-badge {
              background-color: var(--badge-bg-hover) !important;
            }
            #${boxElementId} svg {
              color: var(--icon-color) !important;
              stroke: var(--icon-color) !important;
              fill: ${iconStyle === 'solid' ? 'var(--icon-color)' : 'none'} !important;
            }
            #${boxElementId}:hover svg {
              color: var(--icon-color-hover) !important;
              stroke: var(--icon-color-hover) !important;
              fill: ${iconStyle === 'solid' ? 'var(--icon-color-hover)' : 'none'} !important;
            }
          </style>
        `;
      } else if (view === 'framed') {
        styleTag = `
          <style>
            #${boxElementId} .icon-badge {
              border-color: var(--badge-border-color) !important;
              background-color: var(--badge-bg) !important;
              transition: all 0.2s;
            }
            #${boxElementId}:hover .icon-badge {
              border-color: var(--badge-border-color-hover) !important;
              background-color: var(--badge-bg-hover) !important;
            }
            #${boxElementId} svg {
              color: var(--icon-color) !important;
              stroke: var(--icon-color) !important;
              fill: ${iconStyle === 'solid' ? 'var(--icon-color)' : 'none'} !important;
            }
            #${boxElementId}:hover svg {
              color: var(--icon-color-hover) !important;
              stroke: var(--icon-color-hover) !important;
              fill: ${iconStyle === 'solid' ? 'var(--icon-color-hover)' : 'none'} !important;
            }
          </style>
        `;
      }

      const descHtml = displayDesc 
        ? `<p${getStyleAttr(descStyleObj)} class="editor-icon-box-desc font-sans">${displayDesc}</p>` 
        : '';

      const contentHtml = `
        <div${getStyleAttr(contentFlexStyles)}>
          <div${getStyleAttr(iconWrapperStyle)}>
            ${viewHtml}
          </div>
          <div${getStyleAttr(textWrapperStyle)}>
            <${titleTag}${getStyleAttr(titleStyleObj)} class="editor-icon-box-title font-sans font-bold">${displayTitle}</${titleTag}>
            ${descHtml}
          </div>
        </div>
      `.trim();

      const hasLink = props.dynamicLink?.enabled || props.link;
      const linkAttrs = hasLink ? resolveLinkAttributes(props) : '';
      const wrappedContent = hasLink 
        ? `<a${linkAttrs} style="display:block;text-decoration:none;color:inherit;width:100%;">${contentHtml}</a>`
        : contentHtml;

      return `<div id="${boxElementId}"${getStyleAttr(containerStyles)}>${styleTag}${wrappedContent}</div>`;
    }

    case 'SocialIconsBlock': {
      const { wrapperStyle } = getWrapperStyles(props as any, 'flex');
      
      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: props.align === 'left' ? 'flex-start' : props.align === 'right' ? 'flex-end' : 'center',
      };

      const items = props.items || [];
      const shape = props.shape || 'rounded';
      const iconView = props.iconView || 'default';
      const columns = props.columns || 'auto';
      const align = props.align || 'center';
      const iconSize = props.iconSize || '20px';
      const iconPadding = props.iconPadding || '8px';
      const iconSpacing = props.iconSpacing || '10px';
      const iconRowGap = props.iconRowGap || '10px';
      const hoverAnimation = props.hoverAnimation || 'none';
      const hoverColorMode = props.hoverColorMode || 'none';
      const hoverCustomColor = props.hoverCustomColor || '#3b82f6';
      const hoverCustomSecondaryColor = props.hoverCustomSecondaryColor || '#ffffff';
      const customBorderRadius = props.customBorderRadius || '8px';
      const itemColorMode = props.itemColorMode || 'official';
      const itemCustomColor = props.itemCustomColor || '#3b82f6';
      const itemCustomSecondaryColor = props.itemCustomSecondaryColor || '#ffffff';

      const elementId = `social-${nodeId}`;

      // Resolve columns styling
      let colStyles = '';
      if (columns === 'auto') {
        colStyles = `display:flex;flex-wrap:wrap;justify-content:${align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'};gap:${iconSpacing};row-gap:${iconRowGap};width:100%;`;
      } else {
        colStyles = `display:grid;grid-template-columns:repeat(${columns}, minmax(0, max-content));justify-content:${align === 'left' ? 'start' : align === 'right' ? 'end' : 'center'};gap:${iconSpacing};row-gap:${iconRowGap};width:100%;`;
      }

      // Generate dynamic CSS rules for animations & custom hovers
      let hoverCss = '';

      if (hoverAnimation !== 'none') {
        const duration = hoverAnimation === 'bounce-in' ? '0.5s' : '0.3s';
        const timing = hoverAnimation === 'bounce-in' ? 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'ease';
        
        hoverCss += `
          #${elementId} .social-icon-item {
            transition: all ${duration} ${timing};
          }
        `;

        switch (hoverAnimation) {
          case 'grow':
            hoverCss += `#${elementId} .social-icon-item:hover { transform: scale(1.15); }`;
            break;
          case 'shrink':
            hoverCss += `#${elementId} .social-icon-item:hover { transform: scale(0.85); }`;
            break;
          case 'pulse':
            hoverCss += `
              @keyframes pulse-${elementId} {
                25% { transform: scale(1.1); }
                75% { transform: scale(0.9); }
              }
              #${elementId} .social-icon-item:hover { animation: pulse-${elementId} 1s linear infinite; }
            `;
            break;
          case 'pulse-grow':
            hoverCss += `
              @keyframes pulse-grow-${elementId} {
                to { transform: scale(1.1); }
              }
              #${elementId} .social-icon-item:hover { animation: pulse-grow-${elementId} 0.3s linear alternate infinite; }
            `;
            break;
          case 'pulse-shrink':
            hoverCss += `
              @keyframes pulse-shrink-${elementId} {
                to { transform: scale(0.9); }
              }
              #${elementId} .social-icon-item:hover { animation: pulse-shrink-${elementId} 0.3s linear alternate infinite; }
            `;
            break;
          case 'push':
            hoverCss += `#${elementId} .social-icon-item:hover { transform: scale(0.85); }`;
            break;
          case 'pop':
            hoverCss += `#${elementId} .social-icon-item:hover { transform: scale(1.15); }`;
            break;
          case 'bounce-in':
            hoverCss += `#${elementId} .social-icon-item:hover { transform: scale(1.15); }`;
            break;
        }
      }

      // Hover color modes
      items.forEach((item: any, index: number) => {
        const platformData = getSocialIcon(item.platform);
        const officialColor = platformData ? platformData.brandColor : '#3b82f6';
        let hColor = '';
        let hBgColor = '';
        let hBorderColor = '';

        if (hoverColorMode === 'official') {
          hColor = iconView === 'stacked' ? hoverCustomSecondaryColor : officialColor;
          hBgColor = iconView === 'stacked' ? officialColor : 'transparent';
          hBorderColor = iconView === 'framed' ? officialColor : 'transparent';
        } else if (hoverColorMode === 'custom') {
          hColor = iconView === 'stacked' ? hoverCustomSecondaryColor : hoverCustomColor;
          hBgColor = iconView === 'stacked' ? hoverCustomColor : 'transparent';
          hBorderColor = iconView === 'framed' ? hoverCustomColor : 'transparent';
        }

        if (hColor) {
          hoverCss += `#${elementId} .social-item-${index}:hover svg { fill: ${hColor} !important; stroke: ${hColor} !important; }`;
        }
        if (hBgColor && iconView === 'stacked') {
          hoverCss += `#${elementId} .social-item-${index}:hover { background-color: ${hBgColor} !important; }`;
        }
        if (hBorderColor && iconView === 'framed') {
          hoverCss += `#${elementId} .social-item-${index}:hover { border-color: ${hBorderColor} !important; }`;
        }
      });

      const styleTag = hoverCss ? `<style>${hoverCss.replace(/\s+/g, ' ')}</style>` : '';

      // Compile icons
      const iconsHtml = items.map((item: any, index: number) => {
        if (!item.platform) return '';

        const platformData = getSocialIcon(item.platform);
        const isCustomSvg = item.platform.startsWith('/') || item.platform.startsWith('http');

        const officialColor = platformData ? platformData.brandColor : '#3b82f6';
        const isCustom = itemColorMode === 'custom' || item.colorMode === 'custom';
        const primaryColor = isCustom ? (item.customColor || itemCustomColor) : officialColor;
        const secondaryColor = isCustom ? (item.customSecondaryColor || itemCustomSecondaryColor) : '#ffffff';

        const borderRadius = shape === 'circle' ? '50%' : (shape === 'square' ? '0px' : customBorderRadius);

        let itemStyles = `display:inline-flex;align-items:center;justify-content:center;padding:${iconPadding};border-radius:${borderRadius};text-decoration:none;transition:all 0.2s;`;
        let svgFill = 'currentColor';

        if (iconView === 'default') {
          itemStyles += `background-color:transparent;color:${primaryColor};`;
          svgFill = primaryColor;
        } else if (iconView === 'stacked') {
          itemStyles += `background-color:${primaryColor};color:${secondaryColor};`;
          svgFill = secondaryColor;
        } else if (iconView === 'framed') {
          itemStyles += `background-color:transparent;border:2px solid ${primaryColor};color:${primaryColor};`;
          svgFill = primaryColor;
        }

        const sizeStyle = `width:${iconSize};height:${iconSize};`;

        let iconGraphicHtml = '';
        if (isCustomSvg) {
          iconGraphicHtml = `<img src="${item.platform}" alt="" style="${sizeStyle}object-fit:contain;" />`;
        } else if (platformData) {
          iconGraphicHtml = `
            <svg viewBox="0 0 24 24" style="${sizeStyle}transition:fill 0.2s;" fill="${svgFill}">
              <path d="${platformData.path}" />
            </svg>
          `;
        } else {
          const sizeInt = parseInt(iconSize) || 20;
          const svgStr = getLucideSvgString(item.platform, sizeInt, svgFill);
          iconGraphicHtml = svgStr.replace('<svg', `<svg style="${sizeStyle}transition:fill 0.2s, stroke 0.2s;"`);
        }

        return `
          <a ${resolveListItemLinkAttributes(item)} class="social-icon-item social-item-${index}" style="${itemStyles}">
            ${iconGraphicHtml}
          </a>
        `;
      }).join('');

      return `<div id="${elementId}"${getStyleAttr(containerStyles)}>${styleTag}<div style="${colStyles}">${iconsHtml}</div></div>`;
    }

    case 'IconBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: 'none',
        borderWidth: undefined,
        borderTopWidth: undefined,
        borderRightWidth: undefined,
        borderBottomWidth: undefined,
        borderLeftWidth: undefined,
        borderColor: undefined,
        borderRadius: undefined,
        borderTopLeftRadius: undefined,
        borderTopRightRadius: undefined,
        borderBottomRightRadius: undefined,
        borderBottomLeftRadius: undefined,
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'flex');

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
        display: wrapperStyle.position ? 'inline-flex' : 'flex',
        justifyContent: props.align === 'left' ? 'flex-start' : props.align === 'right' ? 'flex-end' : 'center',
      };

      const size = parseInt(props.iconSize) || 30;
      const view = props.iconView || 'default';
      const shape = props.iconShape || 'circle';
      const primaryColor = props.primaryColor || props.iconColor || '#3b82f6';
      const secondaryColor = props.secondaryColor || '#ffffff';
      const primaryColorHover = props.primaryColorHover || primaryColor;
      const secondaryColorHover = props.secondaryColorHover || secondaryColor;
      const paddingVal = props.paddingProp || '10px';
      const iconRotate = props.iconRotate || '0';

      // Setup CSS custom properties for hover behavior on the container
      if (view === 'default') {
        containerStyles['--icon-color'] = primaryColor;
        containerStyles['--icon-color-hover'] = primaryColorHover;
      } else if (view === 'stacked') {
        containerStyles['--badge-bg'] = primaryColor;
        containerStyles['--badge-bg-hover'] = primaryColorHover;
        containerStyles['--icon-color'] = secondaryColor;
        containerStyles['--icon-color-hover'] = secondaryColorHover;
      } else if (view === 'framed') {
        containerStyles['--badge-border-color'] = primaryColor;
        containerStyles['--badge-border-color-hover'] = primaryColorHover;
        containerStyles['--badge-bg'] = secondaryColor;
        containerStyles['--badge-bg-hover'] = secondaryColorHover;
        containerStyles['--icon-color'] = primaryColor;
        containerStyles['--icon-color-hover'] = primaryColorHover;
      }

      const isCustomSvg = props.iconStyle === 'custom' || (props.iconName && (props.iconName.startsWith('/') || props.iconName.startsWith('http')));

      // Lucide SVG color is styled using currentColor
      const rotateVal = String(iconRotate).endsWith('deg') ? iconRotate : `${iconRotate || 0}deg`;
      const rotateStyle = rotateVal && rotateVal !== '0deg' ? `transform:rotate(${rotateVal});` : '';
      const svgStr = !isCustomSvg ? getLucideSvgString(props.iconName, size, 'currentColor', props.iconStyle === 'solid') : '';
      const iconHtml = isCustomSvg 
        ? `<img src="${props.iconName}" style="width:${size}px;height:${size}px;object-fit:contain;${rotateStyle}transition:transform 0.2s;" />`
        : svgStr.replace('<svg', `<svg style="transition:transform 0.2s, stroke 0.2s, fill 0.2s;${rotateStyle}"`);

      let viewHtml = '';
      if (view === 'default') {
        viewHtml = iconHtml;
      } else {
        // Calculate badge border radius
        let badgeBorderRadius = '0px';
        if (shape === 'circle') {
          badgeBorderRadius = '50%';
        } else if (shape === 'square') {
          badgeBorderRadius = '0px';
        } else {
          const finalBorderRadiusProp = props.borderRadiusProp || '10px';
          const tl = props.badgeBorderTopLeftRadius || finalBorderRadiusProp;
          const tr = props.badgeBorderTopRightRadius || finalBorderRadiusProp;
          const br = props.badgeBorderBottomRightRadius || finalBorderRadiusProp;
          const bl = props.badgeBorderBottomLeftRadius || finalBorderRadiusProp;
          badgeBorderRadius = `${tl} ${tr} ${br} ${bl}`;
        }

        const badgeStyles: Record<string, string | undefined> = {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: paddingVal,
          borderRadius: badgeBorderRadius,
        };

        if (view === 'stacked') {
          badgeStyles.backgroundColor = 'var(--badge-bg)';
        } else if (view === 'framed') {
          const topW = props.badgeBorderTopWidth || '2px';
          const rightW = props.badgeBorderRightWidth || '2px';
          const bottomW = props.badgeBorderBottomWidth || '2px';
          const leftW = props.badgeBorderLeftWidth || '2px';
          badgeStyles.borderStyle = 'solid';
          badgeStyles.borderTopWidth = topW;
          badgeStyles.borderRightWidth = rightW;
          badgeStyles.borderBottomWidth = bottomW;
          badgeStyles.borderLeftWidth = leftW;
          badgeStyles.borderColor = 'var(--badge-border-color)';
          badgeStyles.backgroundColor = 'var(--badge-bg)';
        }

        viewHtml = `<div class="icon-badge"${getStyleAttr(badgeStyles)}>${iconHtml}</div>`;
      }

      let borderStyleStr = '';
      if (props.borderType && props.borderType !== 'none') {
        const borderStyle = props.borderStyle || props.borderType || 'solid';
        const borderColor = props.borderColor || '#000000';
        const topWidth = props.borderTopWidth || props.borderWidth || '0px';
        const rightWidth = props.borderRightWidth || props.borderWidth || '0px';
        const bottomWidth = props.borderBottomWidth || props.borderWidth || '0px';
        const leftWidth = props.borderLeftWidth || props.borderWidth || '0px';
        borderStyleStr += `border-style:${borderStyle};border-color:${borderColor};border-top-width:${topWidth};border-right-width:${rightWidth};border-bottom-width:${bottomWidth};border-left-width:${leftWidth};`;
        
        const tl = props.borderTopLeftRadius || props.borderRadius || '0px';
        const tr = props.borderTopRightRadius || props.borderRadius || '0px';
        const br = props.borderBottomRightRadius || props.borderRadius || '0px';
        const bl = props.borderBottomLeftRadius || props.borderRadius || '0px';
        borderStyleStr += `border-top-left-radius:${tl};border-top-right-radius:${tr};border-bottom-right-radius:${br};border-bottom-left-radius:${bl};`;
      }

      let finalIconHtml = viewHtml;
      if (borderStyleStr) {
        finalIconHtml = `<div style="display:inline-flex;align-items:center;justify-content:center;${borderStyleStr}">${viewHtml}</div>`;
      }

      const iconElementId = `icon-${nodeId}`;
      let styleTag = '';

      if (view === 'default') {
        styleTag = `
          <style>
            #${iconElementId} svg {
              color: var(--icon-color) !important;
              stroke: var(--icon-color) !important;
              fill: ${props.iconStyle === 'solid' ? 'var(--icon-color)' : 'none'} !important;
            }
            #${iconElementId}:hover svg {
              color: var(--icon-color-hover) !important;
              stroke: var(--icon-color-hover) !important;
              fill: ${props.iconStyle === 'solid' ? 'var(--icon-color-hover)' : 'none'} !important;
            }
          </style>
        `;
      } else if (view === 'stacked') {
        styleTag = `
          <style>
            #${iconElementId} .icon-badge {
              background-color: var(--badge-bg) !important;
              transition: all 0.2s;
            }
            #${iconElementId}:hover .icon-badge {
              background-color: var(--badge-bg-hover) !important;
            }
            #${iconElementId} svg {
              color: var(--icon-color) !important;
              stroke: var(--icon-color) !important;
              fill: ${props.iconStyle === 'solid' ? 'var(--icon-color)' : 'none'} !important;
            }
            #${iconElementId}:hover svg {
              color: var(--icon-color-hover) !important;
              stroke: var(--icon-color-hover) !important;
              fill: ${props.iconStyle === 'solid' ? 'var(--icon-color-hover)' : 'none'} !important;
            }
          </style>
        `;
      } else if (view === 'framed') {
        styleTag = `
          <style>
            #${iconElementId} .icon-badge {
              border-color: var(--badge-border-color) !important;
              background-color: var(--badge-bg) !important;
              transition: all 0.2s;
            }
            #${iconElementId}:hover .icon-badge {
              border-color: var(--badge-border-color-hover) !important;
              background-color: var(--badge-bg-hover) !important;
            }
            #${iconElementId} svg {
              color: var(--icon-color) !important;
              stroke: var(--icon-color) !important;
              fill: ${props.iconStyle === 'solid' ? 'var(--icon-color)' : 'none'} !important;
            }
            #${iconElementId}:hover svg {
              color: var(--icon-color-hover) !important;
              stroke: var(--icon-color-hover) !important;
              fill: ${props.iconStyle === 'solid' ? 'var(--icon-color-hover)' : 'none'} !important;
            }
          </style>
        `;
      }

      if (props.link) {
        return `<div id="${iconElementId}"${getStyleAttr(containerStyles)}>${styleTag}<a href="${props.link}" style="display:inline-block;line-height:0;text-decoration:none;">${finalIconHtml}</a></div>`;
      }
      return `<div id="${iconElementId}"${getStyleAttr(containerStyles)}>${styleTag}${finalIconHtml}</div>`;
    }

    case 'IconListBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: props.borderType || 'none',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');

      const listLayout = props.listLayout || 'vertical';
      const align = props.align || 'left';
      const gap = props.gap || '10px';
      const hasDivider = props.hasDivider || false;
      const dividerStyle = props.dividerStyle || 'solid';
      const dividerWeight = props.dividerWeight || '1px';
      const dividerColor = props.dividerColor || '#cbd5e1';

      const iconColor = props.iconColor || '#3b82f6';
      const iconColorHover = props.iconColorHover || iconColor;
      const iconSize = props.iconSize || '14px';
      const iconGap = props.iconGap || '8px';
      const iconVerticalAlign = props.iconVerticalAlign || 'middle';
      const iconOffsetY = props.iconOffsetY || '0px';

      const textColor = props.textColor || '#334155';
      const textColorHover = props.textColorHover || textColor;
      const fontSize = props.fontSize || '14px';
      const fontWeight = props.fontWeight || '400';
      const fontFamily = props.fontFamily || 'var(--site-font-family-body)';
      const fontStyle = props.fontStyle || 'normal';
      const lineHeight = props.lineHeight || '1.5';
      const letterSpacing = props.letterSpacing || '0px';
      const wordSpacing = props.wordSpacing || '0px';
      const textTransform = props.textTransform || 'none';
      const textDecoration = props.textDecoration || 'none';

      const textShadowColor = props.textShadowColor || 'transparent';
      const textShadowBlur = props.textShadowBlur || '0px';
      const textShadowHorizontal = props.textShadowHorizontal || '0px';
      const textShadowVertical = props.textShadowVertical || '0px';

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
        display: 'flex',
        flexDirection: listLayout === 'horizontal' ? 'row' : 'column',
        flexWrap: 'wrap',
        justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        gap: listLayout === 'horizontal' && !hasDivider ? gap : '0px',
        '--icon-color': iconColor,
        '--icon-color-hover': iconColorHover,
        '--text-color': textColor,
        '--text-color-hover': textColorHover,
      };

      const parsedIconSize = parseInt(iconSize) || 14;
      const items = props.items || [];

      const textShadowStr = textShadowColor && textShadowColor !== 'transparent'
        ? `${textShadowHorizontal} ${textShadowVertical} ${textShadowBlur} ${textShadowColor}`
        : '';

      const textStyle = `color:var(--text-color);font-size:${fontSize};font-weight:${fontWeight};font-family:${getFontFamilyFallback(fontFamily)},sans-serif;font-style:${fontStyle};line-height:${lineHeight};letter-spacing:${letterSpacing};word-spacing:${wordSpacing};text-transform:${textTransform};text-decoration:${textDecoration};${textShadowStr ? `text-shadow:${textShadowStr};` : ''}`;

      const itemsHtml = items.map((item: any, idx: number) => {
        const isCustomSvg = item.iconName && (item.iconName.startsWith('/') || item.iconName.startsWith('http'));
        
        let itemIconHtml = '';
        if (isCustomSvg) {
          itemIconHtml = `<img src="${item.iconName}" style="width:${parsedIconSize}px;height:${parsedIconSize}px;object-fit:contain;" />`;
        } else if (item.iconName) {
          itemIconHtml = getLucideSvgString(item.iconName, parsedIconSize, 'currentColor');
        }

        const alignVal = iconVerticalAlign === 'top' ? 'flex-start' : iconVerticalAlign === 'bottom' ? 'flex-end' : 'center';
        
        let itemWrapperStyles = `display:flex;align-items:center;box-sizing:border-box;width:${listLayout === 'horizontal' ? 'auto' : '100%'};justify-content:${listLayout === 'horizontal' ? 'flex-start' : (align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center')};`;

        if (idx < items.length - 1) {
          if (listLayout === 'horizontal') {
            if (hasDivider) {
              itemWrapperStyles += `padding-right:calc(${gap} / 2);margin-right:calc(${gap} / 2);border-right:${dividerWeight} ${dividerStyle} ${dividerColor};`;
            } else {
              itemWrapperStyles += `margin-right:${gap};`;
            }
          } else {
            if (hasDivider) {
              itemWrapperStyles += `padding-bottom:calc(${gap} / 2);margin-bottom:calc(${gap} / 2);border-bottom:${dividerWeight} ${dividerStyle} ${dividerColor};`;
            } else {
              itemWrapperStyles += `margin-bottom:${gap};`;
            }
          }
        }

        const iconTransform = iconOffsetY && iconOffsetY !== '0px' ? `transform:translateY(${iconOffsetY});` : '';
        const iconStyles = `flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;color:var(--icon-color);width:${parsedIconSize}px;height:${parsedIconSize}px;margin-right:${iconGap};align-self:${alignVal};${iconTransform}`;

        const dynamicTextStr = compileDynamicPlaceholder(item.dynamicText);
        const textContent = dynamicTextStr !== null ? dynamicTextStr : (item.text || '');

        const hasLink = item.link || (item.dynamicLink && item.dynamicLink.enabled);
        const linkAttrs = hasLink ? resolveListItemLinkAttributes(item) : '';

        const content = hasLink 
          ? `<a${linkAttrs} class="icon-list-text" style="text-decoration:none;color:inherit;display:inline-block;${textStyle}">${textContent}</a>` 
          : `<span class="icon-list-text" style="${textStyle}">${textContent}</span>`;

        return `
          <div class="icon-list-item" style="${itemWrapperStyles}">
            <span class="icon-list-icon" style="${iconStyles}">
              ${itemIconHtml}
            </span>
            ${content}
          </div>
        `;
      }).join('');

      const listId = `icon-list-${nodeId}`;
      const styleTag = `
        <style>
          #${listId} .icon-list-item {
            transition: all 0.2s;
          }
          #${listId} .icon-list-item:hover .icon-list-text {
            color: var(--text-color-hover) !important;
          }
          #${listId} .icon-list-item:hover .icon-list-icon {
            color: var(--icon-color-hover) !important;
          }
        </style>
      `;

      return `${styleTag}<div id="${listId}"${getStyleAttr(containerStyles)}>${itemsHtml}</div>`;
    }

    case 'AccordionBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: props.borderType || 'none',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
      };

      const items = props.items || [];
      const itemAlign = props.itemAlign || 'left';
      const iconPosition = props.iconPosition || 'right';
      const activeIconType = props.activeIconType || 'default';
      const activeIconSvg = props.activeIconSvg || '';
      const activeIconLucide = props.activeIconLucide || 'Minus';
      const inactiveIconType = props.inactiveIconType || 'default';
      const inactiveIconSvg = props.inactiveIconSvg || '';
      const inactiveIconLucide = props.inactiveIconLucide || 'Plus';
      const titleHtmlTag = props.titleHtmlTag || 'div';
      const faqSchema = props.faqSchema || false;
      const defaultState = props.defaultState || 'first';
      const maxExpanded = props.maxExpanded || 'one';
      const animationDuration = props.animationDuration || '400';

      const itemSpacing = props.itemSpacing || '12px';
      const contentSpacing = props.contentSpacing || '0px';
      const itemBgType = props.itemBgType || 'color';
      const itemBgColor = props.itemBgColor || 'transparent';
      const itemBgColorHover = props.itemBgColorHover || '';
      const itemBgColorActive = props.itemBgColorActive || '';
      const itemBorderType = props.itemBorderType || 'solid';
      const itemBorderColor = props.itemBorderColor || '#e2e8f0';
      const itemBorderWidth = props.itemBorderWidth || '1px';
      const itemBorderRadius = props.itemBorderRadius || '6px';
      const itemPadding = props.itemPadding || '0px';

      const titleFontFamily = props.titleFontFamily || '';
      const titleFontSize = props.titleFontSize || '14px';
      const titleFontWeight = props.titleFontWeight || '700';
      const titleFontStyle = props.titleFontStyle || '';
      const titleTextDecoration = props.titleTextDecoration || '';
      const titleLineHeight = props.titleLineHeight || '';
      const titleLetterSpacing = props.titleLetterSpacing || '';
      const titleWordSpacing = props.titleWordSpacing || '';
      const titleTextTransform = props.titleTextTransform || '';

      const titleColor = props.titleColor || '#1e293b';
      const titleColorHover = props.titleColorHover || '#2563eb';
      const titleColorActive = props.titleColorActive || '#2563eb';
      const titleTextShadow = props.titleTextShadow || '';
      const titleTextShadowHover = props.titleTextShadowHover || '';
      const titleTextShadowActive = props.titleTextShadowActive || '';
      const titleTextStroke = props.titleTextStroke || '';
      const titleTextStrokeHover = props.titleTextStrokeHover || '';
      const titleTextStrokeActive = props.titleTextStrokeActive || '';

      const iconSize = props.iconSize || '15px';
      const iconSpacing = props.iconSpacing || '8px';
      const iconColor = props.iconColor || '#1e293b';
      const iconColorHover = props.iconColorHover || '#2563eb';
      const iconColorActive = props.iconColorActive || '#2563eb';

      const contentBgType = props.contentBgType || 'color';
      const contentBgColor = props.contentBgColor || '#ffffff';
      const contentBorderType = props.contentBorderType || 'solid';
      const contentBorderColor = props.contentBorderColor || '#e2e8f0';
      const contentBorderWidth = props.contentBorderWidth || '1px 0 0 0';
      const contentBorderRadius = props.contentBorderRadius || '0px';
      const contentPadding = props.contentPadding || '12px 16px';
      const contentColor = props.contentColor || '#475569';

      const contentFontFamily = props.contentFontFamily || '';
      const contentFontSize = props.contentFontSize || '13px';
      const contentFontWeight = props.contentFontWeight || '400';
      const contentFontStyle = props.contentFontStyle || '';
      const contentTextDecoration = props.contentTextDecoration || '';
      const contentLineHeight = props.contentLineHeight || '';
      const contentLetterSpacing = props.contentLetterSpacing || '';
      const contentWordSpacing = props.contentWordSpacing || '';
      const contentTextTransform = props.contentTextTransform || '';

      const idCss = props.idCss || `acc-${nodeId}`;

      const getTypographyStyleStr = (family: string, size: string, weight: string, style: string, deco: string, lh: string, ls: string, ws: string, tt: string) => {
        let str = '';
        if (family) str += `font-family:${family};`;
        if (size) str += `font-size:${size};`;
        if (weight) str += `font-weight:${weight};`;
        if (style) str += `font-style:${style};`;
        if (deco) str += `text-decoration:${deco};`;
        if (lh) str += `line-height:${lh};`;
        if (ls) str += `letter-spacing:${ls};`;
        if (ws) str += `word-spacing:${ws};`;
        if (tt) str += `text-transform:${tt};`;
        return str;
      };

      const titleTypoStr = getTypographyStyleStr(titleFontFamily, titleFontSize, titleFontWeight, titleFontStyle, titleTextDecoration, titleLineHeight, titleLetterSpacing, titleWordSpacing, titleTextTransform);
      const contentTypoStr = getTypographyStyleStr(contentFontFamily, contentFontSize, contentFontWeight, contentFontStyle, contentTextDecoration, contentLineHeight, contentLetterSpacing, contentWordSpacing, contentTextTransform);

      const ensureUnit = (val: string | number | undefined | null, defaultVal: string) => {
        if (val === undefined || val === null || val === '') return defaultVal;
        const str = String(val).trim();
        if (str === '0') return '0px';
        if (!isNaN(Number(str))) return `${str}px`;
        return str;
      };

      const safeItemBorderWidth = ensureUnit(itemBorderWidth, '1px');
      const safeItemBorderRadius = ensureUnit(itemBorderRadius, '6px');
      const safeItemPadding = ensureUnit(itemPadding, '0px');
      const safeItemSpacing = ensureUnit(itemSpacing, '12px');
      const safeContentSpacing = ensureUnit(contentSpacing, '0px');
      const safeIconSize = ensureUnit(iconSize, '15px');
      const safeIconSpacing = ensureUnit(iconSpacing, '8px');
      const safeContentBorderWidth = ensureUnit(contentBorderWidth, '1px 0 0 0');
      const safeContentBorderRadius = ensureUnit(contentBorderRadius, '0px');
      const safeContentPadding = ensureUnit(contentPadding, '12px 16px');
      const safeAnimationDuration = /^\d+$/.test(String(animationDuration)) ? `${animationDuration}ms` : animationDuration;

      const scopedCss = `
        #${idCss} .craft-accordion-item {
          background-color: ${itemBgColor || 'transparent'};
          border: ${safeItemBorderWidth} ${itemBorderType} ${itemBorderColor};
          border-radius: ${safeItemBorderRadius};
          padding: ${safeItemPadding};
          margin-bottom: ${safeItemSpacing};
          transition: all ${safeAnimationDuration} ease;
        }
        #${idCss} .craft-accordion-item:last-child {
          margin-bottom: 0;
        }
        #${idCss} .craft-accordion-item:hover {
          ${itemBgColorHover ? `background-color: ${itemBgColorHover};` : ''}
        }
        #${idCss} .craft-accordion-item.active {
          ${itemBgColorActive ? `background-color: ${itemBgColorActive};` : ''}
        }
        
        #${idCss} .craft-accordion-title-wrapper {
          color: ${titleColor};
          ${titleTextShadow ? `text-shadow: ${titleTextShadow};` : ''}
          ${titleTextStroke ? `-webkit-text-stroke: ${titleTextStroke};` : ''}
          display: flex;
          align-items: center;
          justify-content: ${itemAlign === 'left' ? 'flex-start' : itemAlign === 'right' ? 'flex-end' : itemAlign === 'center' ? 'center' : 'space-between'};
          cursor: pointer;
          padding: 12px 16px;
          transition: color 0.2s ease;
        }
        #${idCss} .craft-accordion-item:hover .craft-accordion-title-wrapper {
          ${titleColorHover ? `color: ${titleColorHover};` : ''}
          ${titleTextShadowHover ? `text-shadow: ${titleTextShadowHover};` : ''}
          ${titleTextStrokeHover ? `-webkit-text-stroke: ${titleTextStrokeHover};` : ''}
        }
        #${idCss} .craft-accordion-item.active .craft-accordion-title-wrapper {
          ${titleColorActive ? `color: ${titleColorActive};` : ''}
          ${titleTextShadowActive ? `text-shadow: ${titleTextShadowActive};` : ''}
          ${titleTextStrokeActive ? `-webkit-text-stroke: ${titleTextStrokeActive};` : ''}
        }

        #${idCss} .craft-accordion-icon {
          color: ${iconColor};
          font-size: ${safeIconSize};
          width: ${safeIconSize};
          height: ${safeIconSize};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease, transform ${safeAnimationDuration} ease;
          ${iconPosition === 'left' ? `margin-right: ${safeIconSpacing};` : `margin-left: ${safeIconSpacing};`}
          flex-shrink: 0;
        }
        #${idCss} .craft-accordion-item:hover .craft-accordion-icon {
          ${iconColorHover ? `color: ${iconColorHover};` : ''}
        }
        #${idCss} .craft-accordion-item.active .craft-accordion-icon {
          ${iconColorActive ? `color: ${iconColorActive};` : ''}
        }

        #${idCss} .craft-accordion-content-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows ${safeAnimationDuration} ease;
        }
        #${idCss} .craft-accordion-item.active .craft-accordion-content-wrapper {
          grid-template-rows: 1fr;
        }
        
        #${idCss} .craft-accordion-content-inner {
          overflow: hidden;
        }

        #${idCss} .craft-accordion-content {
          background-color: ${contentBgColor};
          border: ${safeContentBorderWidth} ${contentBorderType} ${contentBorderColor};
          border-radius: ${safeContentBorderRadius};
          padding: ${safeContentPadding};
          color: ${contentColor};
          margin-top: ${safeContentSpacing};
          line-height: 1.5;
          white-space: pre-line;
        }
      `.trim();

      const renderIconHtml = (type: string, svg: string, lucide: string, defaultIconName: string, isOpen: boolean) => {
        if (type === 'none') return '';
        if (type === 'svg' && svg) {
          return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">${svg}</div>`;
        }
        const name = (type === 'lucide' ? lucide : defaultIconName) || defaultIconName;
        return getLucideSvgString(name, '100%', 'currentColor');
      };

      const itemsHtml = items.map((item: any, idx: number) => {
        const isOpen = defaultState === 'all' || (defaultState === 'first' && idx === 0);
        
        const activeIconHtml = renderIconHtml(activeIconType, activeIconSvg, activeIconLucide, 'Minus', true);
        const inactiveIconHtml = renderIconHtml(inactiveIconType, inactiveIconSvg, inactiveIconLucide, 'Plus', false);
        
        const schemaPropsItem = faqSchema ? ' itemscope itemprop="mainEntity" itemtype="https://schema.org/Question"' : '';
        const schemaPropsName = faqSchema ? ' itemprop="name"' : '';
        const schemaPropsAns = faqSchema ? ' itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"' : '';
        const schemaPropsText = faqSchema ? ' itemprop="text"' : '';

        return `
          <div id="${item.cssId || `acc-item-${nodeId}-${idx}`}" class="craft-accordion-item ${isOpen ? 'active' : ''}"${schemaPropsItem}>
            <div class="craft-accordion-title-wrapper">
              ${iconPosition === 'left' ? `<div class="craft-accordion-icon" data-active="${encodeURIComponent(activeIconHtml)}" data-inactive="${encodeURIComponent(inactiveIconHtml)}">${isOpen ? activeIconHtml : inactiveIconHtml}</div>` : ''}
              
              <${titleHtmlTag} style="${titleTypoStr}margin:0;padding:0;flex:1;display:flex;"${schemaPropsName}>
                ${item.title}
              </${titleHtmlTag}>

              ${iconPosition === 'right' ? `<div class="craft-accordion-icon" data-active="${encodeURIComponent(activeIconHtml)}" data-inactive="${encodeURIComponent(inactiveIconHtml)}">${isOpen ? activeIconHtml : inactiveIconHtml}</div>` : ''}
            </div>
            
            <div class="craft-accordion-content-wrapper">
              <div class="craft-accordion-content-inner">
                <div class="craft-accordion-content" style="${contentTypoStr}"${schemaPropsAns}>
                  <div${schemaPropsText} class="${item.contentType === 'builder' ? 'w-full' : ''}">
                    ${item.contentType === 'builder' && node.linkedNodes && node.linkedNodes[`acc-content-${item.id}`]
                      ? renderNode(state, node.linkedNodes[`acc-content-${item.id}`], context)
                      : item.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      const scriptJs = `
        (function(){
          const container = document.getElementById('${idCss}');
          if(!container) return;
          const maxOne = '${maxExpanded}' === 'one';
          const items = container.querySelectorAll('.craft-accordion-item');
          
          items.forEach(function(item){
            const titleWrap = item.querySelector('.craft-accordion-title-wrapper');
            if(!titleWrap) return;
            
            titleWrap.addEventListener('click', function(e) {
              e.preventDefault();
              const isCurrentlyActive = item.classList.contains('active');
              
              if(maxOne) {
                items.forEach(function(other){
                  other.classList.remove('active');
                  const iconWrap = other.querySelector('.craft-accordion-icon');
                  if(iconWrap) {
                    iconWrap.innerHTML = decodeURIComponent(iconWrap.getAttribute('data-inactive') || '');
                    if(!isCurrentlyActive && other === item) {
                      // wait icon wrapper update
                    } else {
                      const svg = iconWrap.querySelector('svg');
                      if(svg) svg.classList.remove('rotate-180');
                    }
                  }
                });
              }

              if(isCurrentlyActive) {
                item.classList.remove('active');
                const iconWrap = item.querySelector('.craft-accordion-icon');
                if(iconWrap) {
                  iconWrap.innerHTML = decodeURIComponent(iconWrap.getAttribute('data-inactive') || '');
                  const svg = iconWrap.querySelector('svg');
                  if(svg) svg.classList.remove('rotate-180');
                }
              } else {
                item.classList.add('active');
                const iconWrap = item.querySelector('.craft-accordion-icon');
                if(iconWrap) {
                  iconWrap.innerHTML = decodeURIComponent(iconWrap.getAttribute('data-active') || '');
                  // For default icons, we used to add rotate-180, but now the SVG itself changes.
                  // If active icon is same as inactive, maybe rotate? No, Elementor swaps the SVG entirely.
                }
              }
            });
            
            // Fix initial rotate class for default chevron icon if active
            const isCurrentlyActive = item.classList.contains('active');
            const iconWrap = item.querySelector('.craft-accordion-icon');
            if(iconWrap && isCurrentlyActive) {
               const activeHtml = decodeURIComponent(iconWrap.getAttribute('data-active') || '');
               if(activeHtml.includes('lucide-chevron-down')) {
                 const svg = iconWrap.querySelector('svg');
                 if(svg) svg.classList.add('rotate-180');
               }
            }
          });
        })();
      `.trim();

      const schemaJs = faqSchema ? `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              ${items.map((item: any) => `{
                "@type": "Question",
                "name": ${JSON.stringify(item.title)},
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": ${JSON.stringify(item.content)}
                }
              }`).join(',')}
            ]
          }
        </script>
      ` : '';

      return `
        <div id="${idCss}" class="craft-accordion-container" data-max-expanded="${maxExpanded}"${getStyleAttr(containerStyles)}>
          <style>${scopedCss}</style>
          ${itemsHtml}
          ${schemaJs}
        </div>
      `;
    }

    case 'TabsBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: props.borderType || 'none',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
      };

      const items = props.items || [];
      const direction = props.direction || 'top';
      const align = props.align || 'start';
      const titleAlign = props.titleAlign || 'left';
      const horizontalScroll = props.horizontalScroll || 'off';
      const breakpoint = props.breakpoint || 'mobile';

      const tabSpacing = props.tabSpacing || '8px';
      const contentSpacing = props.contentSpacing || '12px';

      const tabBgColor = props.tabBgColor || '#f8fafc';
      const tabBgColorHover = props.tabBgColorHover || '';
      const tabBgColorActive = props.tabBgColorActive || '#3b82f6';
      const tabBorderType = props.tabBorderType || 'solid';
      const tabBorderColor = props.tabBorderColor || '#e2e8f0';
      const tabBorderWidth = props.tabBorderWidth || '1px';
      const tabBorderRadius = props.tabBorderRadius || '6px';
      const tabPadding = props.tabPadding || '8px 16px';
      const tabBoxShadow = props.tabBoxShadow || '';

      const titleFontFamily = props.titleFontFamily || '';
      const titleFontSize = props.titleFontSize || '13px';
      const titleFontWeight = props.titleFontWeight || '600';
      const titleFontStyle = props.titleFontStyle || '';
      const titleTextDecoration = props.titleTextDecoration || '';
      const titleLineHeight = props.titleLineHeight || '';
      const titleLetterSpacing = props.titleLetterSpacing || '';
      const titleWordSpacing = props.titleWordSpacing || '';
      const titleTextTransform = props.titleTextTransform || '';

      const titleColor = props.titleColor || '#475569';
      const titleColorHover = props.titleColorHover || '#0f172a';
      const titleColorActive = props.titleColorActive || '#ffffff';
      const titleTextShadowHover = props.titleTextShadowHover || '';
      const titleTextShadowActive = props.titleTextShadowActive || '';
      const titleTextStrokeHover = props.titleTextStrokeHover || '';
      const titleTextStrokeActive = props.titleTextStrokeActive || '';

      const iconPosition = props.iconPosition || 'left';
      const iconSize = props.iconSize || '14px';
      const iconSpacing = props.iconSpacing || '6px';
      const iconColor = props.iconColor || '#64748b';
      const iconColorHover = props.iconColorHover || '#0f172a';
      const iconColorActive = props.iconColorActive || '#ffffff';

      const contentBgColor = props.contentBgColor || '#ffffff';
      const contentBorderType = props.contentBorderType || 'solid';
      const contentBorderColor = props.contentBorderColor || '#e2e8f0';
      const contentBorderWidth = props.contentBorderWidth || '1px';
      const contentBorderRadius = props.contentBorderRadius || '8px';
      const contentPadding = props.contentPadding || '16px';
      const contentColor = props.contentColor || '#334155';

      const contentFontFamily = props.contentFontFamily || '';
      const contentFontSize = props.contentFontSize || '13px';
      const contentFontWeight = props.contentFontWeight || '400';
      const contentFontStyle = props.contentFontStyle || '';
      const contentTextDecoration = props.contentTextDecoration || '';
      const contentLineHeight = props.contentLineHeight || '';
      const contentLetterSpacing = props.contentLetterSpacing || '';
      const contentWordSpacing = props.contentWordSpacing || '';
      const contentTextTransform = props.contentTextTransform || '';

      const idCss = props.idCss || `tabs-${nodeId}`;

      const getTypographyStyleStr = (family: string, size: string, weight: string, style: string, deco: string, lh: string, ls: string, ws: string, tt: string) => {
        let str = '';
        if (family) str += `font-family:${family};`;
        if (size) str += `font-size:${size};`;
        if (weight) str += `font-weight:${weight};`;
        if (style) str += `font-style:${style};`;
        if (deco) str += `text-decoration:${deco};`;
        if (lh) str += `line-height:${lh};`;
        if (ls) str += `letter-spacing:${ls};`;
        if (ws) str += `word-spacing:${ws};`;
        if (tt) str += `text-transform:${tt};`;
        return str;
      };

      const titleTypoStr = getTypographyStyleStr(titleFontFamily, titleFontSize, titleFontWeight, titleFontStyle, titleTextDecoration, titleLineHeight, titleLetterSpacing, titleWordSpacing, titleTextTransform);
      const contentTypoStr = getTypographyStyleStr(contentFontFamily, contentFontSize, contentFontWeight, contentFontStyle, contentTextDecoration, contentLineHeight, contentLetterSpacing, contentWordSpacing, contentTextTransform);

      const ensureUnit = (val: string | number | undefined | null, defaultVal: string) => {
        if (val === undefined || val === null || val === '') return defaultVal;
        const str = String(val).trim();
        if (str === '0') return '0px';
        if (!isNaN(Number(str))) return `${str}px`;
        return str;
      };

      const safeTabSpacing = ensureUnit(tabSpacing, '8px');
      const safeContentSpacing = ensureUnit(contentSpacing, '12px');
      const safeTabBorderWidth = ensureUnit(tabBorderWidth, '1px');
      const safeTabBorderRadius = ensureUnit(tabBorderRadius, '6px');
      const safeTabPadding = ensureUnit(tabPadding, '8px 16px');
      const safeIconSize = ensureUnit(iconSize, '14px');
      const safeIconSpacing = ensureUnit(iconSpacing, '6px');
      const safeContentBorderWidth = ensureUnit(contentBorderWidth, '1px');
      const safeContentBorderRadius = ensureUnit(contentBorderRadius, '8px');
      const safeContentPadding = ensureUnit(contentPadding, '16px');

      const getFlexDirection = () => {
        if (direction === 'top') return 'column';
        if (direction === 'bottom') return 'column-reverse';
        if (direction === 'left') return 'row';
        return 'row-reverse';
      };

      const getHeaderDirection = () => {
        if (direction === 'left' || direction === 'right') return 'column';
        return 'row';
      };

      const getHeaderAlign = () => {
        if (align === 'start') return 'flex-start';
        if (align === 'end') return 'flex-end';
        if (align === 'center') return 'center';
        return 'stretch';
      };

      const getIconDirection = () => {
        if (iconPosition === 'top') return 'column';
        if (iconPosition === 'bottom') return 'column-reverse';
        if (iconPosition === 'left') return 'row';
        return 'row-reverse';
      };

      const getIconMargin = () => {
        if (iconPosition === 'top') return `0 0 ${safeIconSpacing} 0`;
        if (iconPosition === 'bottom') return `${safeIconSpacing} 0 0 0`;
        if (iconPosition === 'left') return `0 ${safeIconSpacing} 0 0`;
        return `0 0 0 ${safeIconSpacing}`;
      };

      const scopedCss = `
        #${idCss} .craft-tabs-wrapper {
          display: flex;
          flex-direction: ${getFlexDirection()};
          gap: ${safeContentSpacing};
          width: 100%;
        }
        
        #${idCss} .craft-tabs-header {
          display: flex;
          flex-direction: ${getHeaderDirection()};
          justify-content: ${getHeaderAlign()};
          align-items: stretch;
          gap: ${safeTabSpacing};
          ${horizontalScroll === 'on' && (direction === 'top' || direction === 'bottom') ? 'overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none;' : 'flex-wrap: wrap;'}
        }
        
        #${idCss} .craft-tabs-header::-webkit-scrollbar {
          display: none;
        }
        
        #${idCss} .craft-tab-btn {
          display: flex;
          align-items: center;
          flex-direction: ${getIconDirection()};
          justify-content: ${titleAlign === 'left' ? 'flex-start' : titleAlign === 'right' ? 'flex-end' : 'center'};
          cursor: pointer;
          background-color: ${tabBgColor || 'transparent'};
          border: ${safeTabBorderWidth} ${tabBorderType} ${tabBorderColor};
          border-radius: ${safeTabBorderRadius};
          padding: ${safeTabPadding};
          color: ${titleColor};
          transition: all 0.2s ease;
          ${tabBoxShadow ? `box-shadow: ${tabBoxShadow};` : ''}
          ${align === 'justify' && (direction === 'top' || direction === 'bottom') ? 'flex: 1 1 0%;' : ''}
        }
        
        #${idCss} .craft-tab-btn:hover {
          ${tabBgColorHover ? `background-color: ${tabBgColorHover};` : ''}
          ${titleColorHover ? `color: ${titleColorHover};` : ''}
          ${titleTextShadowHover ? `text-shadow: ${titleTextShadowHover};` : ''}
          ${titleTextStrokeHover ? `-webkit-text-stroke: ${titleTextStrokeHover};` : ''}
        }
        
        #${idCss} .craft-tab-btn.active {
          background-color: ${tabBgColorActive};
          color: ${titleColorActive};
          ${titleTextShadowActive ? `text-shadow: ${titleTextShadowActive};` : ''}
          ${titleTextStrokeActive ? `-webkit-text-stroke: ${titleTextStrokeActive};` : ''}
        }

        #${idCss} .craft-tab-icon {
          font-size: ${safeIconSize};
          width: ${safeIconSize};
          height: ${safeIconSize};
          color: ${iconColor};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          margin: ${getIconMargin()};
          flex-shrink: 0;
        }
        #${idCss} .craft-tab-btn:hover .craft-tab-icon {
          ${iconColorHover ? `color: ${iconColorHover};` : ''}
        }
        #${idCss} .craft-tab-btn.active .craft-tab-icon {
          ${iconColorActive ? `color: ${iconColorActive};` : ''}
        }

        #${idCss} .craft-tabs-content-pane {
          background-color: ${contentBgColor};
          border: ${safeContentBorderWidth} ${contentBorderType} ${contentBorderColor};
          border-radius: ${safeContentBorderRadius};
          padding: ${safeContentPadding};
          color: ${contentColor};
          flex-grow: 1;
        }

        #${idCss} .craft-tab-pane {
          display: none;
        }
        #${idCss} .craft-tab-pane.active {
          display: block;
        }

        /* Responsive Breakpoints */
        ${breakpoint === 'mobile' ? `
          @media (max-width: 767px) {
            #${idCss} .craft-tabs-wrapper {
              flex-direction: column !important;
            }
            #${idCss} .craft-tabs-header {
              flex-direction: column !important;
              overflow-x: visible !important;
              flex-wrap: wrap !important;
            }
            #${idCss} .craft-tab-btn {
              flex: none !important;
              width: 100% !important;
            }
          }
        ` : ''}

        ${breakpoint === 'tablet' ? `
          @media (max-width: 1023px) {
            #${idCss} .craft-tabs-wrapper {
              flex-direction: column !important;
            }
            #${idCss} .craft-tabs-header {
              flex-direction: column !important;
              overflow-x: visible !important;
              flex-wrap: wrap !important;
            }
            #${idCss} .craft-tab-btn {
              flex: none !important;
              width: 100% !important;
            }
          }
        ` : ''}
      `.trim();

      const renderIconHtml = (type: string, svg: string, lucide: string) => {
        if (!type || type === 'none') return '';
        if (type === 'svg' && svg) {
          return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">${svg}</div>`;
        }
        if (type === 'lucide') {
          return getLucideSvgString(lucide || 'Folder', '100%', 'currentColor');
        }
        return '';
      };

      const headersHtml = items.map((item: any, idx: number) => {
        const isActive = idx === 0;
        const iconHtml = renderIconHtml(item.iconType, item.iconSvg, item.iconLucide);
        const iconContainer = iconHtml ? `<span class="craft-tab-icon">${iconHtml}</span>` : '';

        return `
          <div 
            class="craft-tab-btn select-none ${isActive ? 'active' : ''}" 
            data-tab-id="${item.id}"
            style="${titleTypoStr}"
          >
            ${iconContainer}
            <span class="font-semibold">${item.title}</span>
          </div>
        `;
      }).join('');

      const panesHtml = items.map((item: any, idx: number) => {
        const isActive = idx === 0;
        
        let paneContentHtml = '';
        if (item.contentType === 'builder' && node.linkedNodes && node.linkedNodes[`tabs-content-${item.id}`]) {
          paneContentHtml = renderNode(state, node.linkedNodes[`tabs-content-${item.id}`], context);
        } else {
          paneContentHtml = `<div style="${contentTypoStr}line-height:1.5;">${item.content || ''}</div>`;
        }

        return `
          <div 
            class="craft-tab-pane ${isActive ? 'active' : ''}" 
            data-pane-id="${item.id}"
          >
            ${paneContentHtml}
          </div>
        `;
      }).join('');

      const scriptJs = `
        (function(){
          const container = document.getElementById('${idCss}');
          if(!container) return;
          const buttons = container.querySelectorAll('.craft-tab-btn');
          const panes = container.querySelectorAll('.craft-tab-pane');
          
          buttons.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              const tabId = btn.getAttribute('data-tab-id');
              
              buttons.forEach(function(b) {
                b.classList.remove('active');
              });
              panes.forEach(function(p) {
                p.classList.remove('active');
              });
              
              btn.classList.add('active');
              const activePane = container.querySelector('.craft-tab-pane[data-pane-id="' + tabId + '"]');
              if(activePane) activePane.classList.add('active');
            });
          });
        })();
      `.trim();

      return `
        <div id="${idCss}" class="craft-tabs-container"${getStyleAttr(containerStyles)}>
          <style>${scopedCss}</style>
          <div class="craft-tabs-wrapper">
            <div class="craft-tabs-header">
              ${headersHtml}
            </div>
            <div class="craft-tabs-content-pane">
              ${panesHtml}
            </div>
          </div>
          <script>${scriptJs}</script>
        </div>
      `;
    }

    case 'MenuBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: props.borderType || 'none',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
      };

      const idCss = props.idCss || `menu-${nodeId}`;

      const menuSource = props.menuSource || 'header';
      if (menuSource === 'managed' && props.menuId) {
        const managedConfig = {
          menuId: Number(props.menuId),
          menuLayout: props.menuLayout || 'horizontal',
          align: props.align || 'left',
          itemGap: props.itemGap || '20px',
          fontSize: props.fontSize || '14px',
          fontWeight: props.fontWeight || '600',
          textColor: props.textColor || '#334155',
          textColorHover: props.textColorHover || '#3b82f6',
          itemBgColor: props.itemBgColor || 'transparent',
          itemBgColorHover: props.itemBgColorHover || 'transparent',
          itemPaddingTop: props.itemPaddingTop || '8px',
          itemPaddingRight: props.itemPaddingRight || '12px',
          itemPaddingBottom: props.itemPaddingBottom || '8px',
          itemPaddingLeft: props.itemPaddingLeft || '12px',
          itemBorderRadius: props.itemBorderRadius || '0px',
          dropdownBgColor: props.dropdownItemBgColor || '#ffffff',
          dropdownTextColor: props.dropdownTextColor || '#334155',
        };
        return `{{managed_menu:${encodeURIComponent(JSON.stringify(managedConfig))}}}`;
      }
      const menuItems = props.resolvedItems || props.customItems || [];
      const menuLayout = props.menuLayout || 'horizontal';
      const align = props.align || 'left';
      const mobileBreakpoint = props.mobileBreakpoint || 'mobile';

      // Item styles
      const itemGap = props.itemGap || '20px';
      const distanceFromContent = props.distanceFromContent || '0px';
      const fontSize = props.fontSize || '14px';
      const fontWeight = props.fontWeight || '600';
      const fontFamily = props.fontFamily || 'var(--site-font-family-body)';
      const fontStyle = props.fontStyle || 'normal';
      const lineHeight = props.lineHeight || '1.5';
      const letterSpacing = props.letterSpacing || '0px';
      const textTransform = props.textTransform || 'none';
      const textDecoration = props.textDecoration || 'none';
      const textColor = props.textColor || '#334155';
      const itemBgColor = props.itemBgColor || 'transparent';
      const textColorHover = props.textColorHover || '#3b82f6';
      const itemBgColorHover = props.itemBgColorHover || 'transparent';
      const textColorActive = props.textColorActive || '#3b82f6';
      const itemBgColorActive = props.itemBgColorActive || 'transparent';

      const itemBorderType = props.itemBorderType || 'none';
      const itemBorderWidth = props.itemBorderWidth || '1px';
      const itemBorderColor = props.itemBorderColor || '#e2e8f0';
      const itemBoxShadow = props.itemBoxShadow || '';

      const showDivider = props.showDivider || false;
      const dividerColor = props.dividerColor || '#cbd5e1';
      const dividerWidth = props.dividerWidth || '1px';
      const dividerHeight = props.dividerHeight || '16px';

      const itemBorderRadius = props.itemBorderRadius || '0px';
      const itemBorderTopLeftRadius = props.itemBorderTopLeftRadius || '';
      const itemBorderTopRightRadius = props.itemBorderTopRightRadius || '';
      const itemBorderBottomRightRadius = props.itemBorderBottomRightRadius || '';
      const itemBorderBottomLeftRadius = props.itemBorderBottomLeftRadius || '';

      const itemPaddingTop = props.itemPaddingTop || '8px';
      const itemPaddingRight = props.itemPaddingRight || '12px';
      const itemPaddingBottom = props.itemPaddingBottom || '8px';
      const itemPaddingLeft = props.itemPaddingLeft || '12px';

      // Icon
      const iconPosition = props.iconPosition || 'left';
      const iconSize = props.iconSize || '14px';
      const iconSpacing = props.iconSpacing || '6px';
      const iconColor = props.iconColor || '#64748b';
      const iconColorHover = props.iconColorHover || '#3b82f6';
      const iconColorActive = props.iconColorActive || '#3b82f6';

      // Dropdown indicator
      const indicatorSize = props.indicatorSize || '12px';
      const indicatorRotate = props.indicatorRotate || '180';
      const indicatorSpace = props.indicatorSpace || '4px';
      const indicatorColor = props.indicatorColor || '#64748b';
      const indicatorColorHover = props.indicatorColorHover || '#3b82f6';
      const indicatorColorActive = props.indicatorColorActive || '#3b82f6';

      // Mobile Hamburger Toggle
      const toggleIcon = props.toggleIcon || 'Menu';
      const toggleSize = props.toggleSize || '20px';
      const toggleColor = props.toggleColor || '#334155';
      const toggleBgColor = props.toggleBgColor || 'transparent';
      const toggleColorHover = props.toggleColorHover || '#3b82f6';
      const toggleBgColorHover = props.toggleBgColorHover || 'transparent';
      const toggleBorderType = props.toggleBorderType || 'none';
      const toggleBorderWidth = props.toggleBorderWidth || '1px';
      const toggleBorderColor = props.toggleBorderColor || '#e2e8f0';
      const toggleBoxShadow = props.toggleBoxShadow || '';
      const toggleBorderRadius = props.toggleBorderRadius || '4px';
      const togglePaddingTop = props.togglePaddingTop || '8px';
      const togglePaddingRight = props.togglePaddingRight || '8px';
      const togglePaddingBottom = props.togglePaddingBottom || '8px';
      const togglePaddingLeft = props.togglePaddingLeft || '8px';
      const toggleDistanceFromDropdown = props.toggleDistanceFromDropdown || '0px';

      // Content container wrapper
      const contentBgColor = props.contentBgColor || 'transparent';
      const contentBorderType = props.contentBorderType || 'none';
      const contentBorderWidth = props.contentBorderWidth || '1px';
      const contentBorderColor = props.contentBorderColor || '#e2e8f0';
      const contentBorderRadius = props.contentBorderRadius || '0px';
      const contentBoxShadow = props.contentBoxShadow || '';
      const contentPaddingTop = props.contentPaddingTop || '0px';
      const contentPaddingRight = props.contentPaddingRight || '0px';
      const contentPaddingBottom = props.contentPaddingBottom || '0px';
      const contentPaddingLeft = props.contentPaddingLeft || '0px';

      // Dropdown box and items
      const dropdownTextColor = props.dropdownTextColor || '#334155';
      const dropdownTextColorActive = props.dropdownTextColorActive || '#3b82f6';
      const dropdownItemBgColor = props.dropdownItemBgColor || '#ffffff';
      const dropdownItemBgColorActive = props.dropdownItemBgColorActive || '#f8fafc';
      const dropdownItemBoxShadow = props.dropdownItemBoxShadow || '';
      const dropdownBorderType = props.dropdownBorderType || 'solid';
      const dropdownBorderWidth = props.dropdownBorderWidth || '1px';
      const dropdownBorderColor = props.dropdownBorderColor || '#cbd5e1';
      const dropdownBorderRadius = props.dropdownBorderRadius || '6px';
      const dropdownBoxShadow = props.dropdownBoxShadow || '0 10px 15px -3px rgba(0, 0, 0, 0.1)';

      // Build tree
      const tree: any[] = [];
      let currentL0: any = null;
      let currentL1: any = null;

      menuItems.forEach((item: any) => {
        const indent = item.indent || 0;
        if (indent === 0) {
          const node = { ...item, children: [] };
          tree.push(node);
          currentL0 = node;
          currentL1 = null;
        } else if (indent === 1) {
          const node = { ...item, children: [] };
          if (currentL0) {
            currentL0.children.push(node);
          } else {
            const rootFallback = { id: 'fallback', label: '', url: '#', children: [node] };
            tree.push(rootFallback);
            currentL0 = rootFallback;
          }
          currentL1 = node;
        } else if (indent === 2) {
          const node = { ...item };
          if (currentL1) {
            currentL1.children.push(node);
          } else if (currentL0) {
            const columnFallback = { id: 'col_fallback', label: '', url: '#', children: [node] };
            currentL0.children.push(columnFallback);
            currentL1 = columnFallback;
          } else {
            const rootFallback = { 
              id: 'fallback_root', 
              label: '', 
              url: '#', 
              children: [{ id: 'col_fallback', label: '', url: '#', children: [node] }] 
            };
            tree.push(rootFallback);
            currentL0 = rootFallback;
            currentL1 = rootFallback.children[0];
          }
        }
      });

      const getBorderRadiusCSS = () => {
        if (itemBorderRadius && itemBorderRadius !== '0px') {
          return `border-radius: ${formatUnit(itemBorderRadius, '0px')};`;
        }
        return `
          border-top-left-radius: ${formatUnit(itemBorderTopLeftRadius, '0px')};
          border-top-right-radius: ${formatUnit(itemBorderTopRightRadius, '0px')};
          border-bottom-right-radius: ${formatUnit(itemBorderBottomRightRadius, '0px')};
          border-bottom-left-radius: ${formatUnit(itemBorderBottomLeftRadius, '0px')};
        `;
      };

      const getPaddingCSS = () => {
        return `
          padding-top: ${formatUnit(itemPaddingTop, '8px')};
          padding-right: ${formatUnit(itemPaddingRight, '12px')};
          padding-bottom: ${formatUnit(itemPaddingBottom, '8px')};
          padding-left: ${formatUnit(itemPaddingLeft, '12px')};
        `;
      };

      const getTypographyCSS = () => {
        let str = '';
        if (fontFamily) str += `font-family:${fontFamily};`;
        if (fontSize) str += `font-size:${formatUnit(fontSize, '14px')};`;
        if (fontWeight) str += `font-weight:${fontWeight};`;
        if (fontStyle) str += `font-style:${fontStyle};`;
        if (lineHeight) str += `line-height:${lineHeight};`;
        if (letterSpacing) str += `letter-spacing:${formatUnit(letterSpacing, '0px')};`;
        if (textTransform) str += `text-transform:${textTransform};`;
        if (textDecoration) str += `text-decoration:${textDecoration};`;
        return str;
      };

      const scopedCss = `
        #${idCss} .craft-menu-container {
          background-color: ${contentBgColor};
          border-style: ${contentBorderType};
          border-width: ${formatUnit(contentBorderWidth, '1px')};
          border-color: ${contentBorderColor};
          border-radius: ${formatUnit(contentBorderRadius, '0px')};
          box-shadow: ${contentBoxShadow || 'none'};
          padding-top: ${formatUnit(contentPaddingTop, '0px')};
          padding-right: ${formatUnit(contentPaddingRight, '0px')};
          padding-bottom: ${formatUnit(contentPaddingBottom, '0px')};
          padding-left: ${formatUnit(contentPaddingLeft, '0px')};
        }
        #${idCss} .craft-menu-item {
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
          color: ${textColor};
          background-color: ${itemBgColor};
          border-style: ${itemBorderType};
          border-width: ${formatUnit(itemBorderWidth, '1px')};
          border-color: ${itemBorderColor};
          box-shadow: ${itemBoxShadow || 'none'};
          ${getTypographyCSS()}
          ${getBorderRadiusCSS()}
          ${getPaddingCSS()}
        }
        #${idCss} .craft-menu-item:hover {
          color: ${textColorHover} !important;
          background-color: ${itemBgColorHover} !important;
        }
        #${idCss} .craft-menu-item.active {
          color: ${textColorActive} !important;
          background-color: ${itemBgColorActive} !important;
        }
        #${idCss} .craft-dropdown-item {
          display: flex;
          align-items: center;
          color: ${dropdownTextColor};
          transition: all 0.15s ease;
        }
        #${idCss} .craft-dropdown-item:hover {
          color: ${dropdownTextColorActive} !important;
          background-color: ${dropdownItemBgColorActive} !important;
        }
        #${idCss} .craft-menu-toggle {
          color: ${toggleColor};
          background-color: ${toggleBgColor};
          border-style: ${toggleBorderType};
          border-width: ${formatUnit(toggleBorderWidth, '1px')};
          border-color: ${toggleBorderColor};
          border-radius: ${formatUnit(toggleBorderRadius, '4px')};
          box-shadow: ${toggleBoxShadow || 'none'};
          padding-top: ${formatUnit(togglePaddingTop, '8px')};
          padding-right: ${formatUnit(togglePaddingRight, '8px')};
          padding-bottom: ${formatUnit(togglePaddingBottom, '8px')};
          padding-left: ${formatUnit(togglePaddingLeft, '8px')};
        }
        #${idCss} .craft-menu-toggle:hover {
          color: ${toggleColorHover} !important;
          background-color: ${toggleBgColorHover} !important;
        }
        /* Dropdown box styles */
        #${idCss} .craft-dropdown-box {
          background-color: ${dropdownItemBgColor};
          border-style: ${dropdownBorderType};
          border-width: ${formatUnit(dropdownBorderWidth, '1px')};
          border-color: ${dropdownBorderColor};
          border-radius: ${formatUnit(dropdownBorderRadius, '6px')};
          box-shadow: ${dropdownBoxShadow || 'none'};
        }
        /* Horizontal dropdown show on hover */
        #${idCss} .group:hover > .craft-dropdown-box {
          opacity: 1 !important;
          visibility: visible !important;
          transform: translateY(0) !important;
          pointer-events: auto !important;
        }
        /* Nested level 3 dropdown show on hover */
        #${idCss} .group\\/sub:hover > .craft-dropdown-box {
          display: block !important;
        }
      `.trim();

      const renderIconSvg = (iconName?: string, stateColor?: string) => {
        if (!iconName) return '';
        const color = stateColor || iconColor;
        return `<span style="display:inline-flex;color:${color};margin-right:${formatUnit(iconSpacing, '6px')}">${getLucideSvgString(iconName, iconSize, color)}</span>`;
      };

      const renderChevronSvg = (stateColor?: string) => {
        const color = stateColor || indicatorColor;
        return `<span class="craft-menu-indicator transition-transform duration-200" style="display:inline-flex;margin-left:${formatUnit(indicatorSpace, '4px')};color:${color};">${getLucideSvgString('ChevronDown', indicatorSize, color)}</span>`;
      };

      const renderHorizontalHtml = () => {
        const itemsHtml = tree.map((item: any, idx: number) => {
          const hasChildren = item.children && item.children.length > 0;
          
          let subHtml = '';
          if (hasChildren) {
            const childrenHtml = item.children.map((child: any, cIdx: number) => {
              const hasL2 = child.children && child.children.length > 0;
              let l2Html = '';
              if (hasL2) {
                const subChildrenHtml = child.children.map((subChild: any) => `
                  <li class="px-1 py-0.5">
                    <a href="${subChild.url || '#'}" class="craft-dropdown-item flex items-center px-3 py-2 text-sm rounded-md">
                      ${child.icon ? renderIconSvg(child.icon, dropdownTextColor) : ''}
                      <span>${subChild.label}</span>
                    </a>
                  </li>
                `).join('');
                l2Html = `
                  <div class="absolute left-full top-0 ml-1 z-50 w-52 craft-dropdown-box py-1 hidden">
                    <ul class="py-1">${subChildrenHtml}</ul>
                  </div>
                `;
              }
              
              return `
                <li class="relative group/sub px-1 py-0.5">
                  <a href="${child.url || '#'}" class="craft-dropdown-item flex items-center justify-between px-3 py-2 text-sm rounded-md">
                    <span class="flex items-center">
                      ${child.icon ? renderIconSvg(child.icon, dropdownTextColor) : ''}
                      <span>${child.label}</span>
                    </span>
                    ${hasL2 ? getLucideSvgString('ChevronRight', 14, dropdownTextColor) : ''}
                  </a>
                  ${l2Html}
                </li>
              `;
            }).join('');

            subHtml = `
              <div class="absolute left-0 z-50 w-56 craft-dropdown-box py-1 opacity-0 invisible -translate-y-2 pointer-events-none transition-all duration-200" style="top:calc(100% + ${formatUnit(distanceFromContent, '0px')})">
                <ul class="py-1">${childrenHtml}</ul>
              </div>
            `;
          }

          return `
            <li class="relative group craft-menu-item-container">
              <a href="${item.url || '#'}" class="craft-menu-item">
                ${iconPosition === 'left' && item.icon ? renderIconSvg(item.icon, textColor) : ''}
                <span>${item.label}</span>
                ${iconPosition === 'right' && item.icon ? renderIconSvg(item.icon, textColor) : ''}
                ${hasChildren ? renderChevronSvg() : ''}
              </a>
              ${subHtml}
            </li>
          `;
        }).join('');

        return `<ul class="flex flex-wrap items-center w-full" style="gap:${formatUnit(itemGap, '20px')}">${itemsHtml}</ul>`;
      };

      const renderVerticalHtml = () => {
        const itemsHtml = tree.map((item: any, idx: number) => {
          const hasChildren = item.children && item.children.length > 0;
          
          let subHtml = '';
          if (hasChildren) {
            const childrenHtml = item.children.map((child: any, cIdx: number) => {
              const hasL2 = child.children && child.children.length > 0;
              let l2Html = '';
              if (hasL2) {
                const subChildrenHtml = child.children.map((subChild: any) => `
                  <li>
                    <a href="${subChild.url || '#'}" class="craft-dropdown-item flex items-center px-3 py-1 text-xs rounded-md">
                      <span>${subChild.label}</span>
                    </a>
                  </li>
                `).join('');
                l2Html = `<ul class="pl-4 mt-0.5 space-y-0.5">${subChildrenHtml}</ul>`;
              }
              return `
                <li>
                  <a href="${child.url || '#'}" class="craft-dropdown-item flex items-center px-3 py-1.5 text-sm rounded-md">
                    <span>${child.label}</span>
                  </a>
                  ${l2Html}
                </li>
              `;
            }).join('');
            subHtml = `<ul class="pl-4 mt-1 space-y-1">${childrenHtml}</ul>`;
          }

          return `
            <li class="w-full">
              <a href="${item.url || '#'}" class="craft-menu-item flex items-center justify-between">
                <span class="flex items-center">
                  ${item.icon ? renderIconSvg(item.icon, textColor) : ''}
                  <span>${item.label}</span>
                </span>
                ${hasChildren ? renderChevronSvg() : ''}
              </a>
              ${subHtml}
            </li>
          `;
        }).join('');

        return `<ul class="flex flex-col w-full" style="gap:${formatUnit(itemGap, '20px')}">${itemsHtml}</ul>`;
      };

      const renderMobileHtml = () => {
        const itemsHtml = tree.map((item: any, idx: number) => {
          const hasChildren = item.children && item.children.length > 0;
          
          let subHtml = '';
          if (hasChildren) {
            const childrenHtml = item.children.map((child: any) => `
              <li>
                <a href="${child.url || '#'}" class="craft-dropdown-item flex items-center px-3 py-1.5 text-xs rounded-md">
                  <span>${child.label}</span>
                </a>
              </li>
            `).join('');
            subHtml = `<ul class="pl-4 mt-0.5 space-y-0.5 border-l border-slate-100 ml-3 hidden">${childrenHtml}</ul>`;
          }

          return `
            <li class="px-1">
              <div class="flex items-center justify-between">
                <a href="${item.url || '#'}" class="craft-dropdown-item flex-grow flex items-center px-3 py-2 text-sm rounded-md">
                  <span>${item.label}</span>
                </a>
                ${hasChildren ? `
                  <button type="button" class="p-2 text-slate-400 hover:text-slate-600 craft-mobile-submenu-toggle">
                    ${getLucideSvgString('ChevronDown', 16, '#64748b')}
                  </button>
                ` : ''}
              </div>
              ${subHtml}
            </li>
          `;
        }).join('');

        return `
          <div class="md:hidden w-full flex flex-col items-stretch relative">
            <div class="flex ${
              align === 'left' ? 'justify-start' :
              align === 'center' ? 'justify-center' :
              align === 'right' ? 'justify-end' : 'justify-between'
            }">
              <button type="button" class="craft-menu-toggle flex items-center justify-center">
                ${getLucideSvgString(toggleIcon, toggleSize, toggleColor)}
              </button>
            </div>
            <div class="w-full mt-2 craft-dropdown-box craft-mobile-dropdown py-1 hidden" style="margin-top:${formatUnit(toggleDistanceFromDropdown, '0px')}">
              <ul class="py-1 flex flex-col space-y-1">${itemsHtml}</ul>
            </div>
          </div>
        `;
      };

      const desktopHtml = menuLayout === 'horizontal' ? renderHorizontalHtml() : renderVerticalHtml();
      const mobileHtml = renderMobileHtml();

      const scriptJs = `
        (function(){
          var container = document.getElementById('${idCss}');
          if(!container) return;
          
          var toggle = container.querySelector('.craft-menu-toggle');
          var mobileDropdown = container.querySelector('.craft-mobile-dropdown');
          if(toggle && mobileDropdown) {
            toggle.addEventListener('click', function(e){
              e.preventDefault();
              var isHidden = mobileDropdown.classList.contains('hidden');
              if(isHidden) {
                mobileDropdown.classList.remove('hidden');
                mobileDropdown.style.display = 'block';
              } else {
                mobileDropdown.classList.add('hidden');
                mobileDropdown.style.display = 'none';
              }
            });
          }
          
          var subToggles = container.querySelectorAll('.craft-mobile-submenu-toggle');
          subToggles.forEach(function(btn){
            btn.addEventListener('click', function(e){
              e.preventDefault();
              var parentLi = btn.closest('li');
              var subMenu = parentLi.querySelector('ul');
              if(subMenu) {
                var isHidden = subMenu.classList.contains('hidden');
                if(isHidden) {
                  subMenu.classList.remove('hidden');
                  subMenu.style.display = 'block';
                  btn.querySelector('svg').style.transform = 'rotate(180deg)';
                } else {
                  subMenu.classList.add('hidden');
                  subMenu.style.display = 'none';
                  btn.querySelector('svg').style.transform = 'rotate(0deg)';
                }
              }
            });
          });
        })();
      `.trim();

      const alignClass = align === 'left' ? 'justify-start' :
                         align === 'center' ? 'justify-center' :
                         align === 'right' ? 'justify-end' : 'justify-between';

      return `
        <div id="${idCss}" class="craft-menu-container"${getStyleAttr(containerStyles)}>
          <style>${scopedCss}</style>
          <nav class="w-full flex ${alignClass}">
            <div class="hidden md:block w-full">
              ${desktopHtml}
            </div>
            ${mobileHtml}
          </nav>
          <script>${scriptJs}</script>
        </div>
      `.trim();
    }

    case 'CarouselBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: props.borderType || 'none',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');

      const carouselName = props.carouselName || 'Băng chuyền hình ảnh';
      const images: any[] = props.images || [];
      const imageResolution = props.imageResolution || 'large';
      const slidesToShow = props.slidesToShow || 'default';
      const slidesToScroll = props.slidesToScroll || 'default';
      const imageStretch = props.imageStretch || 'no';
      const navigation = props.navigation || 'arrows_dots';
      const iconLeft = props.iconLeft || 'ChevronLeft';
      const iconRight = props.iconRight || 'ChevronRight';
      const linkType = props.linkType || 'none';
      const link = props.link || '';
      const captionType = props.captionType || 'none';

      const autoplay = props.autoplay || 'yes';
      const pauseOnHover = props.pauseOnHover || 'yes';
      const autoplaySpeed = props.autoplaySpeed || 5000;
      const infiniteLoop = props.infiniteLoop || 'yes';
      const animationSpeed = props.animationSpeed || 500;

      const arrowsPosition = props.arrowsPosition || 'inside';
      const arrowsSize = props.arrowsSize || '24px';
      const arrowsColor = props.arrowsColor || '#000000';

      const dotsPosition = props.dotsPosition || 'outside';
      const dotsSpacing = props.dotsSpacing || '8px';
      const dotsSize = props.dotsSize || '8px';
      const dotsColor = props.dotsColor || '#cccccc';
      const dotsActiveColor = props.dotsActiveColor || '#000000';

      const imageAlign = props.imageAlign || 'center';
      const imageSpacing = props.imageSpacing || '10px';
      const borderType = props.borderType || 'none';
      const borderColor = props.borderColor || '#000000';

      const idCss = props.idCss || `carousel-${nodeId}`;

      const ensureUnit = (val: string | number | undefined | null, defaultVal: string) => {
        if (val === undefined || val === null || val === '') return defaultVal;
        const str = String(val).trim();
        if (str === '0') return '0px';
        if (!isNaN(Number(str))) return `${str}px`;
        return str;
      };

      const safeImageSpacing = ensureUnit(imageSpacing, '10px');
      const safeArrowsSize = ensureUnit(arrowsSize, '24px');
      const safeDotsSpacing = ensureUnit(dotsSpacing, '8px');
      const safeDotsSize = ensureUnit(dotsSize, '8px');

      const parsedSlidesToShow = slidesToShow === 'default' ? 3 : parseInt(slidesToShow);

      const totalSlides = images.length;
      const dotCount = Math.max(1, totalSlides - parsedSlidesToShow + 1);

      // Border radius styles
      let borderRadiusStyles = '';
      if (props.borderRadius || props.borderTopLeftRadius || props.borderTopRightRadius || props.borderBottomRightRadius || props.borderBottomLeftRadius) {
        borderRadiusStyles += `border-top-left-radius: ${props.borderTopLeftRadius || props.borderRadius || '0px'};`;
        borderRadiusStyles += `border-top-right-radius: ${props.borderTopRightRadius || props.borderRadius || '0px'};`;
        borderRadiusStyles += `border-bottom-right-radius: ${props.borderBottomRightRadius || props.borderRadius || '0px'};`;
        borderRadiusStyles += `border-bottom-left-radius: ${props.borderBottomLeftRadius || props.borderRadius || '0px'};`;
      } else {
        borderRadiusStyles += `border-radius: 8px;`;
      }

      // Border styles
      let borderStyles = '';
      if (borderType && borderType !== 'none') {
        borderStyles += `border-style: ${borderType};`;
        borderStyles += `border-color: ${borderColor};`;
        borderStyles += `border-top-width: ${props.borderTopWidth || props.borderWidth || '0px'};`;
        borderStyles += `border-right-width: ${props.borderRightWidth || props.borderWidth || '0px'};`;
        borderStyles += `border-bottom-width: ${props.borderBottomWidth || props.borderWidth || '0px'};`;
        borderStyles += `border-left-width: ${props.borderLeftWidth || props.borderWidth || '0px'};`;
      }

      const getVerticalAlign = () => {
        if (imageAlign === 'start') return 'flex-start';
        if (imageAlign === 'end') return 'flex-end';
        return 'center';
      };

      const scopedCss = `
        #${idCss} .craft-carousel-wrapper {
          position: relative;
          width: 100%;
          ${arrowsPosition === 'outside' && (navigation === 'arrows_dots' || navigation === 'arrows') ? 'padding: 0 40px;' : ''}
        }
        #${idCss} .craft-carousel-viewport {
          position: relative;
          overflow: hidden;
          width: 100%;
        }
        #${idCss} .craft-carousel-slides-inner {
          display: flex;
          flex-direction: row;
          transition: transform ${animationSpeed}ms ease-in-out;
          gap: ${safeImageSpacing};
          width: 100%;
        }
        #${idCss} .craft-carousel-slide {
          flex-shrink: 0;
          width: calc((100% - ${safeImageSpacing} * ${parsedSlidesToShow - 1}) / ${parsedSlidesToShow});
          display: flex;
          flex-direction: column;
          justify-content: ${getVerticalAlign()};
          box-sizing: border-box;
        }
        #${idCss} .craft-carousel-slide img {
          width: 100%;
          height: ${imageStretch === 'yes' ? '100%' : 'auto'};
          object-fit: ${imageStretch === 'yes' ? 'cover' : 'contain'};
          display: block;
          ${borderRadiusStyles}
          ${borderStyles}
        }
        #${idCss} .craft-carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background-color: rgba(255,255,255,0.7);
          border: none;
          border-radius: 50%;
          width: calc(${safeArrowsSize} + 12px);
          height: calc(${safeArrowsSize} + 12px);
          padding: 6px;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${arrowsColor};
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: background-color 0.2s;
        }
        #${idCss} .craft-carousel-arrow:hover {
          background-color: rgba(255,255,255,0.9);
        }
        #${idCss} .craft-carousel-arrow.prev {
          left: ${arrowsPosition === 'inside' ? '12px' : '0px'};
        }
        #${idCss} .craft-carousel-arrow.next {
          right: ${arrowsPosition === 'inside' ? '12px' : '0px'};
        }
        #${idCss} .craft-carousel-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: ${safeDotsSpacing};
          margin-top: 12px;
          ${dotsPosition === 'inside' ? 'position: absolute; bottom: 8px; left: 0; right: 0; z-index: 10; margin-top: 0;' : ''}
        }
        #${idCss} .craft-carousel-dot {
          display: inline-block;
          width: ${safeDotsSize};
          height: ${safeDotsSize};
          border-radius: 50%;
          background-color: ${dotsColor};
          cursor: pointer;
          transition: background-color 0.2s;
        }
        #${idCss} .craft-carousel-dot.active {
          background-color: ${dotsActiveColor};
        }
        @media (max-width: 1023px) {
          #${idCss} .craft-carousel-slide {
            width: calc((100% - ${safeImageSpacing} * ${Math.max(1, Math.min(2, parsedSlidesToShow) - 1)}) / ${Math.max(1, Math.min(2, parsedSlidesToShow))}) !important;
          }
        }
        @media (max-width: 767px) {
          #${idCss} .craft-carousel-slide {
            width: 100% !important;
          }
        }
      `.trim();

      const showArrows = navigation === 'arrows_dots' || navigation === 'arrows';
      const showDots = navigation === 'arrows_dots' || navigation === 'dots';

      const arrowLeftSvg = showArrows ? getLucideSvgString(iconLeft || 'ChevronLeft', '100%', 'currentColor') : '';
      const arrowRightSvg = showArrows ? getLucideSvgString(iconRight || 'ChevronRight', '100%', 'currentColor') : '';

      const slidesHtml = images.map((img: any, idx: number) => {
        const resolvedUrl = getResolutionUrl(img.url, imageResolution);
        
        const getCaptionText = () => {
          if (captionType === 'title') return img.title || '';
          if (captionType === 'caption') return img.alt || '';
          if (captionType === 'description') return img.description || '';
          return '';
        };

        const captionText = getCaptionText();
        const captionHtml = captionText ? `<div class="craft-carousel-caption" style="text-align:center;font-size:11px;color:#64748b;margin-top:6px;font-style:italic;font-family:inherit;">${captionText}</div>` : '';

        const resolvedLinkUrl = linkType === 'media'
          ? img.url
          : linkType === 'custom'
            ? (link || '#')
            : '';

        const imgTag = `<img src="${resolvedUrl || img.url}" alt="${img.alt || ''}" />`;
        const slideContent = resolvedLinkUrl 
          ? `<a href="${resolvedLinkUrl}" style="display:block;text-decoration:none;color:inherit;">${imgTag}</a>`
          : imgTag;

        return `
          <div class="craft-carousel-slide">
            ${slideContent}
            ${captionHtml}
          </div>
        `;
      }).join('');

      const arrowsHtml = (showArrows && totalSlides > parsedSlidesToShow) ? `
        <button class="craft-carousel-arrow prev" aria-label="Previous slide">${arrowLeftSvg}</button>
        <button class="craft-carousel-arrow next" aria-label="Next slide">${arrowRightSvg}</button>
      ` : '';

      const dotsHtml = (showDots && dotCount > 1) ? `
        <div class="craft-carousel-dots">
          ${Array.from({ length: dotCount }).map((_, idx) => `
            <span class="craft-carousel-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
          `).join('')}
        </div>
      ` : '';

      const scriptJs = `
        (function(){
          const container = document.getElementById('${idCss}');
          if(!container) return;
          const inner = container.querySelector('.craft-carousel-slides-inner');
          const dots = container.querySelectorAll('.craft-carousel-dot');
          const prevBtn = container.querySelector('.craft-carousel-arrow.prev');
          const nextBtn = container.querySelector('.craft-carousel-arrow.next');
          
          let currentIndex = 0;
          const totalSlides = ${totalSlides};
          const autoplay = ${autoplay === 'yes' ? 'true' : 'false'};
          const autoplaySpeed = ${autoplaySpeed || 5000};
          const infiniteLoop = ${infiniteLoop === 'yes' ? 'true' : 'false'};
          const pauseOnHover = ${pauseOnHover === 'yes' ? 'true' : 'false'};
          const imageSpacing = '${safeImageSpacing}';
          
          let slidesToShow = ${parsedSlidesToShow};
          function updateSlidesToShow() {
            const w = window.innerWidth;
            if (w < 768) slidesToShow = 1;
            else if (w < 1024) slidesToShow = Math.min(2, ${parsedSlidesToShow});
            else slidesToShow = ${parsedSlidesToShow};
          }
          updateSlidesToShow();
          window.addEventListener('resize', function(){
            updateSlidesToShow();
            goToSlide(currentIndex);
          });

          function goToSlide(index) {
            const maxIndex = Math.max(0, totalSlides - slidesToShow);
            if (infiniteLoop) {
              if (index < 0) index = maxIndex;
              else if (index > maxIndex) index = 0;
            } else {
              index = Math.max(0, Math.min(index, maxIndex));
            }
            currentIndex = index;
            if (inner) {
              inner.style.transform = 'translateX(-calc(' + currentIndex + ' * (100% + ' + imageSpacing + ') / ' + slidesToShow + '))';
            }
            dots.forEach(function(dot, idx) {
              if (idx === currentIndex) dot.classList.add('active');
              else dot.classList.remove('active');
            });
          }

          if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
              e.preventDefault();
              goToSlide(currentIndex - 1);
            });
          }
          if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
              e.preventDefault();
              goToSlide(currentIndex + 1);
            });
          }
          dots.forEach(function(dot) {
            dot.addEventListener('click', function(e) {
              e.preventDefault();
              const idx = parseInt(dot.getAttribute('data-index') || '0');
              goToSlide(idx);
            });
          });

          let intervalId = null;
          function startAutoplay() {
            if (autoplay && !intervalId) {
              intervalId = setInterval(function() {
                goToSlide(currentIndex + 1);
              }, autoplaySpeed);
            }
          }
          function stopAutoplay() {
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
          }
          
          if (autoplay) {
            startAutoplay();
            if (pauseOnHover) {
              container.addEventListener('mouseenter', stopAutoplay);
              container.addEventListener('mouseleave', startAutoplay);
            }
          }
        })();
      `.trim();

      return `
        <div id="${idCss}" class="craft-carousel-container"${getStyleAttr(wrapperStyle)}>
          <style>${scopedCss}</style>
          <div class="craft-carousel-wrapper">
            <div class="craft-carousel-viewport">
              <div class="craft-carousel-slides-inner">
                ${slidesHtml}
              </div>
            </div>
            ${arrowsHtml}
            ${dotsHtml}
          </div>
          <script>${scriptJs}</script>
        </div>
      `;
    }

    case 'CounterBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: props.borderType || 'none',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');

      const startNum = props.startNumber !== undefined ? props.startNumber : 0;
      const endNum = props.endNumber !== undefined ? props.endNumber : 100;
      const dur = props.duration !== undefined ? props.duration : 2000;
      const useSeparator = props.useThousandSeparator !== false;
      const prefix = props.prefix || '';
      const suffix = props.suffix || '';
      const title = props.title || 'Cool Number';
      const titleTag = props.titleTag || 'div';
      const titlePosition = props.titlePosition || 'bottom';
      const titleSpacing = props.titleSpacing || '10px';

      // Number Styles
      const numberColor = props.numberColor || 'var(--site-color-primary)';
      const numberFontSize = props.numberFontSize || '48px';
      const numberFontWeight = props.numberFontWeight || '700';
      const numberFontFamily = props.numberFontFamily ? getFontFamilyFallback(props.numberFontFamily) : 'inherit';
      const numberFontStyle = props.numberFontStyle || 'normal';
      const numberTextDecoration = props.numberTextDecoration || 'none';
      const numberTextAlign = props.numberTextAlign || 'center';
      
      const numberTextShadow = props.numberTextShadowColor && props.numberTextShadowColor !== 'transparent'
        ? `${props.numberTextShadowHorizontal || '0px'} ${props.numberTextShadowVertical || '0px'} ${props.numberTextShadowBlur || '0px'} ${props.numberTextShadowColor}`
        : undefined;

      const numberStyle = `color:${numberColor};font-size:${numberFontSize};font-weight:${numberFontWeight};font-family:${numberFontFamily};font-style:${numberFontStyle};text-decoration:${numberTextDecoration};text-align:${numberTextAlign};${numberTextShadow ? `text-shadow:${numberTextShadow};` : ''}`;

      // Title Styles
      const titleColor = props.titleColor || 'var(--site-color-text)';
      const titleFontSize = props.titleFontSize || '18px';
      const titleFontWeight = props.titleFontWeight || '400';
      const titleFontFamily = props.titleFontFamily ? getFontFamilyFallback(props.titleFontFamily) : 'inherit';
      const titleFontStyle = props.titleFontStyle || 'normal';
      const titleTextDecoration = props.titleTextDecoration || 'none';
      const titleHAlign = props.titleHAlign || 'center';

      const titleTextShadow = props.titleTextShadowColor && props.titleTextShadowColor !== 'transparent'
        ? `${props.titleTextShadowHorizontal || '0px'} ${props.titleTextShadowVertical || '0px'} ${props.titleTextShadowBlur || '0px'} ${props.titleTextShadowColor}`
        : undefined;

      const titleMargin = titlePosition === 'bottom'
        ? `margin-top:${titleSpacing};margin-bottom:0px;`
        : `margin-bottom:${titleSpacing};margin-top:0px;`;

      const titleStyle = `color:${titleColor};font-size:${titleFontSize};font-weight:${titleFontWeight};font-family:${titleFontFamily};font-style:${titleFontStyle};text-decoration:${titleTextDecoration};text-align:${titleHAlign};${titleMargin}${titleTextShadow ? `;text-shadow:${titleTextShadow}` : ''}`;

      const idCss = props.idCss || `counter-${nodeId}`;

      const titleHtml = `<${titleTag} class="craft-counter-title" style="${titleStyle}">${title}</${titleTag}>`;

      const numberHtml = `
        <div class="craft-counter-number" style="${numberStyle}; display:flex; align-items:center; justify-content:${numberTextAlign === 'left' ? 'flex-start' : numberTextAlign === 'right' ? 'flex-end' : 'center'}">
          ${prefix ? `<span class="craft-counter-prefix" style="margin-right:4px;">${prefix}</span>` : ''}
          <span class="craft-counter-value" data-start="${startNum}" data-end="${endNum}" data-duration="${dur}" data-separator="${useSeparator}">
            ${endNum}
          </span>
          ${suffix ? `<span class="craft-counter-suffix" style="margin-left:4px;">${suffix}</span>` : ''}
        </div>
      `.trim();

      const innerContent = titlePosition === 'top'
        ? `${titleHtml}${numberHtml}`
        : `${numberHtml}${titleHtml}`;

      const scriptJs = `
        (function() {
          const el = document.getElementById('${idCss}');
          if (!el) return;
          const valEl = el.querySelector('.craft-counter-value');
          if (!valEl) return;
          
          const start = parseInt(valEl.getAttribute('data-start')) || 0;
          const end = parseInt(valEl.getAttribute('data-end')) || 0;
          const duration = parseInt(valEl.getAttribute('data-duration')) || 2000;
          const useSeparator = valEl.getAttribute('data-separator') === 'true';
          
          function formatNum(num) {
            return num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
          }
          
          valEl.textContent = useSeparator ? formatNum(start) : start;

          let animated = false;
          function startAnim() {
            if (animated) return;
            animated = true;
            let startTime = null;
            function step(timestamp) {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / duration, 1);
              const currentVal = Math.floor(progress * (end - start) + start);
              valEl.textContent = useSeparator ? formatNum(currentVal) : currentVal;
              if (progress < 1) {
                requestAnimationFrame(step);
              } else {
                valEl.textContent = useSeparator ? formatNum(end) : end;
              }
            }
            requestAnimationFrame(step);
          }

          if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(function(entries) {
              entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                  startAnim();
                  observer.unobserve(el);
                }
              });
            }, { threshold: 0.1 });
            observer.observe(el);
          } else {
            startAnim();
          }
        })();
      `.trim();

      const mergedWrapperStyle = {
        ...wrapperStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      };

      return `
        <div id="${idCss}"${getStyleAttr(mergedWrapperStyle as any)} class="craft-counter-container">
          ${innerContent}
          <script>${scriptJs}</script>
        </div>
      `.trim();
    }

    case 'ProgressBarBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: props.borderType || 'none',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');

      const title = props.title || 'My Skill';
      const percentage = props.percentage !== undefined ? props.percentage : 50;
      const displayPercentage = props.displayPercentage !== false;
      const barType = props.barType || 'default';
      const duration = props.duration !== undefined ? props.duration : 1500;

      // Bar styles
      const barColor = props.barColor || 'var(--site-color-primary)';
      const barBgColor = props.barBgColor || '#e5e7eb';
      const barHeight = props.barHeight || '20px';
      const barBorderRadius = props.barBorderRadius || '10px';

      // Spacing and colors
      const innerTextColor = props.innerTextColor || '#ffffff';
      const titleSpacing = props.titleSpacing || '8px';

      const isTitleColorDefault = !props.titleColor || props.titleColor === 'var(--site-color-text)';
      const isPercentColorDefault = !props.percentColor || props.percentColor === 'var(--site-color-text)';

      // Title Styles
      const titleColor = barType === 'inner' && isTitleColorDefault ? innerTextColor : (props.titleColor || 'var(--site-color-text)');
      const titleFontSize = props.titleFontSize || '14px';
      const titleFontWeight = props.titleFontWeight || '600';
      const titleFontFamily = props.titleFontFamily ? getFontFamilyFallback(props.titleFontFamily) : 'inherit';
      const titleFontStyle = props.titleFontStyle || 'normal';
      const titleTextDecoration = props.titleTextDecoration || 'none';
      const titleStyle = `color:${titleColor};font-size:${titleFontSize};font-weight:${titleFontWeight};font-family:${titleFontFamily};font-style:${titleFontStyle};text-decoration:${titleTextDecoration};`;

      // Percent Styles
      const percentColor = barType === 'inner' && isPercentColorDefault ? innerTextColor : (props.percentColor || 'var(--site-color-text)');
      const percentFontSize = props.percentFontSize || '14px';
      const percentFontWeight = props.percentFontWeight || '600';
      const percentFontFamily = props.percentFontFamily ? getFontFamilyFallback(props.percentFontFamily) : 'inherit';
      const percentFontStyle = props.percentFontStyle || 'normal';
      const percentTextDecoration = props.percentTextDecoration || 'none';
      const percentStyle = `color:${percentColor};font-size:${percentFontSize};font-weight:${percentFontWeight};font-family:${percentFontFamily};font-style:${percentFontStyle};text-decoration:${percentTextDecoration};`;

      const barGradientEnabled = props.barGradientEnabled === true;
      const barGradientColor = props.barGradientColor || '';
      const stripeEnabled = props.stripeEnabled === true;
      const stripeAnimated = props.stripeAnimated === true;

      const safeGradientColor = barGradientColor || barColor;
      const fillBackground = barGradientEnabled
        ? `linear-gradient(90deg, ${barColor} 0%, ${safeGradientColor} 100%)`
        : barColor;

      const idCss = props.idCss || `progress-${nodeId}`;

      // Build stripe style sheet injection if stripes are enabled
      let stripeStyleRule = '';
      if (stripeEnabled) {
        stripeStyleRule = `
          #${idCss} .craft-progress-fill::after {
            content: "";
            position: absolute;
            inset: 0;
            background-image: linear-gradient(
              45deg,
              rgba(255, 255, 255, 0.15) 25%,
              transparent 25%,
              transparent 50%,
              rgba(255, 255, 255, 0.15) 50%,
              rgba(255, 255, 255, 0.15) 75%,
              transparent 75%,
              transparent
            );
            background-size: 40px 40px;
            border-radius: inherit;
            pointer-events: none;
          }
        `.trim();
      }

      let animationClass = '';
      let animationStyle = '';
      if (stripeEnabled && stripeAnimated) {
        animationStyle = `
          #${idCss} .craft-progress-fill-anim::after {
            animation: progress-stripe-anim-${idCss} 1s linear infinite !important;
          }
          @keyframes progress-stripe-anim-${idCss} {
            from { background-position: 40px 0; }
            to { background-position: 0 0; }
          }
        `.trim();
        animationClass = ' craft-progress-fill-anim';
      }

      const combinedStyles = [stripeStyleRule, animationStyle].filter(Boolean).join('\n');
      const styleBlock = combinedStyles ? `<style>${combinedStyles}</style>` : '';

      let innerContent = '';

      if (barType === 'default') {
        innerContent = `
          ${styleBlock}
          <div class="craft-progress-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:${titleSpacing}; width:100%;">
            <span class="craft-progress-title" style="${titleStyle}">${title}</span>
            ${displayPercentage ? `<span class="craft-progress-percent" style="${percentStyle}">0%</span>` : ''}
          </div>
          <div class="craft-progress-track" style="background:${barBgColor}; height:${barHeight}; border-radius:${barBorderRadius}; overflow:hidden; position:relative; width:100%;">
            <div class="craft-progress-fill${animationClass}" data-percentage="${percentage}" data-duration="${duration}" style="width:0%; height:100%; background:${fillBackground}; border-radius:${barBorderRadius}; transition:none;"></div>
          </div>
        `.trim();
      } else {
        // inner mode using overlay to prevent text squishing
        innerContent = `
          ${styleBlock}
          <div class="craft-progress-track" style="background:${barBgColor}; height:${barHeight}; border-radius:${barBorderRadius}; overflow:hidden; position:relative; min-height:24px; width:100%;">
            <div class="craft-progress-fill${animationClass}" data-percentage="${percentage}" data-duration="${duration}" style="width:0%; height:100%; background:${fillBackground}; border-radius:${barBorderRadius}; transition:none;"></div>
            <div class="craft-progress-inner-content" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:space-between; padding:0 12px; pointer-events:none;">
              <span class="craft-progress-title" style="${titleStyle} select-none:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${title}</span>
              ${displayPercentage ? `<span class="craft-progress-percent" style="${percentStyle} select-none:none; margin-left:8px;">0%</span>` : ''}
            </div>
          </div>
        `.trim();
      }

      const scriptJs = `
        (function() {
          const el = document.getElementById('${idCss}');
          if (!el) return;
          const fillEl = el.querySelector('.craft-progress-fill');
          if (!fillEl) return;
          const percentEl = el.querySelector('.craft-progress-percent');
          
          const targetPercent = parseFloat(fillEl.getAttribute('data-percentage')) || 0;
          const duration = parseInt(fillEl.getAttribute('data-duration')) || 1500;
          
          let animated = false;
          function startAnim() {
            if (animated) return;
            animated = true;
            let startTime = null;
            function step(timestamp) {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / duration, 1);
              
              // easeOutQuad
              const easeProgress = progress * (2 - progress);
              const currentPercent = easeProgress * targetPercent;
              
              fillEl.style.width = currentPercent + '%';
              if (percentEl) {
                percentEl.textContent = Math.round(currentPercent) + '%';
              }
              
              if (progress < 1) {
                requestAnimationFrame(step);
              } else {
                fillEl.style.width = targetPercent + '%';
                if (percentEl) {
                  percentEl.textContent = Math.round(targetPercent) + '%';
                }
              }
            }
            requestAnimationFrame(step);
          }

          if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(function(entries) {
              entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                  startAnim();
                  observer.unobserve(el);
                }
              });
            }, { threshold: 0.1 });
            observer.observe(el);
          } else {
            startAnim();
          }
        })();
      `.trim();

      const mergedWrapperStyle = {
        ...wrapperStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      };

      return `
        <div id="${idCss}"${getStyleAttr(mergedWrapperStyle as any)} class="craft-progress-container">
          ${innerContent}
          <script>${scriptJs}</script>
        </div>
      `.trim();
    }

    case 'FormBlock': {
      const { wrapperStyle } = getWrapperStyles(props as any, 'block');
      
      const formId = props.customFormId || `form_${nodeId.replace(/-/g, '')}`;
      const formName = props.formName || 'New Form';
      const fields = props.fields || [];
      const isMultiStep = fields.some((f: any) => f.type === 'step');
      
      // Group fields into pages if multi-step
      const pages: any[][] = [];
      if (isMultiStep) {
        let currentPage: any[] = [];
        fields.forEach((field: any) => {
          if (field.type === 'step') {
            if (currentPage.length > 0) pages.push(currentPage);
            currentPage = [field];
          } else {
            currentPage.push(field);
          }
        });
        if (currentPage.length > 0) pages.push(currentPage);
      } else {
        pages.push(fields);
      }

      // Action Configuration stringified for JS to parse
      const actionsConfig = {
        actions: props.actionsAfterSubmit || ['collect', 'email'],
        collectMetadata: props.collectMetaData !== false,
        email: {
          to: props.emailTo || '[admin-email]',
          subject: props.emailSubject || `Phản hồi mới từ ${formName}`,
          message: props.emailMessage || '[all-fields]',
          from: props.emailFrom || '[admin-email]',
          fromName: props.emailFromName || '[site-title]',
          replyTo: props.emailReplyTo || ''
        },
        redirectUrl: props.redirectUrl || '',
        webhookUrl: props.webhookUrl || '',
        messages: props.customMessagesEnabled ? {
          success: props.successMessage || 'Gửi form thành công!',
          error: props.errorMessage || 'Có lỗi xảy ra khi gửi form.',
          required: props.requiredMessage || 'Trường này là bắt buộc.',
          invalid: props.invalidMessage || 'Dữ liệu không hợp lệ.'
        } : null
      };

      // Form Layout Styles
      const columnGap = formatUnit(props.formColumnGap || props.columnsGap, '20px');
      const rowGap = formatUnit(props.formRowGap || props.rowsGap, '20px');
      
      const labelStyle = `color:${props.labelColor || '#475569'};font-size:${formatUnit(props.labelFontSize, '12px')};font-weight:${props.labelFontWeight || 600};font-family:${props.labelFontFamily || 'inherit'};margin-bottom:${formatUnit(props.labelSpacing, '6px')};display:block;`;
      
      const fieldBorderRadius = formatUnit(props.fieldBorderRadius, '6px');
      const fieldBorderWidth = formatUnit(props.fieldBorderWidth, '1px');
      
      const fieldFontSize = props.fieldFontSize ? formatUnit(props.fieldFontSize, '13px') : (props.inputSize === 'xs' ? '11px' : props.inputSize === 'md' ? '15px' : props.inputSize === 'lg' ? '17px' : props.inputSize === 'xl' ? '19px' : '13px');
      const inputPadding = props.inputSize === 'xs' ? '4px 8px' : props.inputSize === 'md' ? '10px 16px' : props.inputSize === 'lg' ? '12px 20px' : props.inputSize === 'xl' ? '14px 24px' : '8px 12px';

      const fieldColor = props.fieldColor || '#334155';
      const fieldBgColor = props.fieldBgColor || '#fff';
      const fieldBorderColor = props.fieldBorderColor || '#cbd5e1';

      const fieldStyle = `width:100%;color:${fieldColor};background-color:${fieldBgColor};border:${fieldBorderWidth} solid ${fieldBorderColor};border-radius:${fieldBorderRadius};padding:${inputPadding};font-size:${fieldFontSize};font-family:${props.fieldFontFamily || 'inherit'};font-weight:${props.fieldFontWeight || 400};outline:none;transition:all 0.2s;box-sizing:border-box;`;

      const btnFontSize = props.formButtonFontSize ? formatUnit(props.formButtonFontSize, '14px') : (props.buttonSize === 'xs' ? '11px' : props.buttonSize === 'md' ? '15px' : props.buttonSize === 'lg' ? '17px' : props.buttonSize === 'xl' ? '19px' : '13px');
      const btnRadius = formatUnit(props.formButtonRadius || props.btnBorderRadius, '6px');
      const btnPadding = props.buttonSize === 'xs' ? '4px 8px' : props.buttonSize === 'md' ? '10px 20px' : props.buttonSize === 'lg' ? '12px 24px' : props.buttonSize === 'xl' ? '14px 28px' : '8px 16px';
      const activeBtnColumnWidth = props.buttonColumnWidth || (props.buttonWidth === '100' ? '100%' : props.buttonWidth === 'auto' ? 'auto' : props.buttonWidth ? `${props.buttonWidth}%` : '100%');

      const submitBtnBg = props.submitBtnBg || props.btnNormalBgColor || '#3b82f6';
      const submitBtnText = props.submitBtnText || props.btnNormalTextColor || '#ffffff';
      const prevBtnBg = props.prevBtnBg || props.btnPrevBgColor || '#e2e8f0';
      const prevBtnText = props.prevBtnText || props.btnPrevTextColor || '#475569';

      const alignMap: Record<string, string> = { 'left': 'flex-start', 'center': 'center', 'right': 'flex-end', 'justify': 'stretch' };
      const btnJustify = alignMap[props.formButtonAlign || 'left'];

      // Steps indicator
      let stepsHtml = '';
      let stepsStyleBlock = '';
      if (isMultiStep && props.stepType !== 'none') {
        const stepShape = props.stepShape || 'circle';
        const stepSpacing = formatUnit(props.stepSpacing, '16px');
        const stepDividerWidth = formatUnit(props.stepDividerWidth, '1px');
        const stepDividerGap = formatUnit(props.stepDividerGap, '10px');
        const stepPadding = formatUnit(props.stepPadding, '30px');
        const stepBorderWidth = formatUnit(props.stepBorderWidth, '2px');
        
        const activePrimaryColor = props.stepActivePrimaryColor || props.stepActivePrimary || '#3b82f6';
        const activeSecondaryColor = props.stepActiveSecondaryColor || props.stepActiveSecondary || '#ffffff';
        const inactivePrimaryColor = props.stepInactivePrimaryColor || props.stepInactivePrimary || '#cbd5e1';
        const inactiveSecondaryColor = props.stepInactiveSecondaryColor || props.stepInactiveSecondary || '#64748b';
        const completedPrimaryColor = props.stepCompletedPrimaryColor || props.stepCompletedPrimary || '#10b981';
        const completedSecondaryColor = props.stepCompletedSecondaryColor || props.stepCompletedSecondary || '#ffffff';

        // Scoped style for steps activation/states, input focus and button hover
        stepsStyleBlock = `
          <style>
            [data-form-id="${formId}"] .craft-form-step-indicator .craft-form-step-icon {
              background-color: ${inactivePrimaryColor} !important;
              color: ${inactiveSecondaryColor} !important;
              border: ${stepBorderWidth} solid ${inactivePrimaryColor} !important;
            }
            [data-form-id="${formId}"] .craft-form-step-indicator .craft-form-step-label {
              color: ${inactiveSecondaryColor} !important;
            }
            [data-form-id="${formId}"] .craft-form-step-indicator.active .craft-form-step-icon {
              background-color: ${activePrimaryColor} !important;
              color: ${activeSecondaryColor} !important;
              border: ${stepBorderWidth} solid ${activePrimaryColor} !important;
            }
            [data-form-id="${formId}"] .craft-form-step-indicator.active .craft-form-step-label {
              color: ${activePrimaryColor} !important;
            }
            [data-form-id="${formId}"] .craft-form-step-indicator.completed .craft-form-step-icon {
              background-color: ${completedPrimaryColor} !important;
              color: ${completedSecondaryColor} !important;
              border: ${stepBorderWidth} solid ${completedPrimaryColor} !important;
            }
            [data-form-id="${formId}"] .craft-form-step-indicator.completed .craft-form-step-label {
              color: ${completedPrimaryColor} !important;
            }
            [data-form-id="${formId}"] .craft-form-input:focus {
              border-color: ${props.fieldBorderColorFocus || '#3b82f6'} !important;
              background-color: ${props.fieldBgColorFocus || '#ffffff'} !important;
            }
            [data-form-id="${formId}"] .craft-form-submit-btn:hover {
              background-color: ${props.submitBtnBgHover || '#2563eb'} !important;
              color: ${props.submitBtnTextHover || '#ffffff'} !important;
            }
            [data-form-id="${formId}"] .craft-form-prev-btn:hover {
              background-color: ${props.prevBtnBgHover || '#cbd5e1'} !important;
              color: ${props.prevBtnTextHover || '#334155'} !important;
            }
          </style>
        `.trim();

        stepsHtml += `<div class="craft-form-steps" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:30px;gap:${stepSpacing};overflow-x:auto;padding-bottom:8px;font-family:${props.stepFontFamily || 'inherit'};font-size:${formatUnit(props.stepFontSize, '12px')};font-weight:${props.stepFontWeight || 600};">`;

        pages.forEach((page, idx) => {
          const isFirst = idx === 0;
          const stepField = page.find((f: any) => f.type === 'step');
          const stepLabel = stepField?.label || `Step ${idx + 1}`;
          
          let shapeStyle = '';
          if (stepShape === 'circle') shapeStyle = 'border-radius:50%;';
          else if (stepShape === 'square') shapeStyle = 'border-radius:0px;';
          else if (stepShape === 'rounded') shapeStyle = 'border-radius:8px;';
          
          const stepIconSize = stepPadding ? `calc(${parseFloat(stepPadding) || 30}px * 1.2)` : '32px';
          const stepIconStyle = `${shapeStyle}width:${stepIconSize};height:${stepIconSize};display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;transition:all 0.3s;box-sizing:border-box;`;
          
          stepsHtml += `
            <div class="craft-form-step-indicator ${isFirst ? 'active' : ''}" data-step-index="${idx}" style="flex:1;display:flex;align-items:center;gap:12px;min-width:max-content;">
              ${stepShape !== 'none' ? `<div class="craft-form-step-icon" style="${stepIconStyle}">${idx + 1}</div>` : ''}
              ${['number_text', 'text'].includes(props.stepType) ? `<div class="craft-form-step-label" style="transition:all 0.3s;">${stepLabel}</div>` : ''}
              ${idx < pages.length - 1 ? `<div class="craft-form-step-divider" style="flex-grow:1;flex-shrink:1;flex-basis:0%;height:${stepDividerWidth};background-color:${inactivePrimaryColor};margin-left:${stepDividerGap};margin-right:${stepDividerGap};min-width:10px;"></div>` : ''}
            </div>
          `;
        });
        stepsHtml += `</div>`;
      } else {
        stepsStyleBlock = `
          <style>
            [data-form-id="${formId}"] .craft-form-input:focus {
              border-color: ${props.fieldBorderColorFocus || '#3b82f6'} !important;
              background-color: ${props.fieldBgColorFocus || '#ffffff'} !important;
            }
            [data-form-id="${formId}"] .craft-form-submit-btn:hover {
              background-color: ${props.submitBtnBgHover || '#2563eb'} !important;
              color: ${props.submitBtnTextHover || '#ffffff'} !important;
            }
            [data-form-id="${formId}"] .craft-form-prev-btn:hover {
              background-color: ${props.prevBtnBgHover || '#cbd5e1'} !important;
              color: ${props.prevBtnTextHover || '#334155'} !important;
            }
          </style>
        `.trim();
      }

      // Pages & Fields
      let formContentHtml = '<div class="craft-form-pages-container">';
      
      pages.forEach((page, pageIdx) => {
        formContentHtml += `<div class="craft-form-page" data-page-index="${pageIdx}" style="${pageIdx !== 0 ? 'display:none;' : ''}">`;
        formContentHtml += `<div class="craft-form-fields" style="display:flex;flex-wrap:wrap;margin:0 -${parseFloat(columnGap)/2}px;">`;

        page.forEach((field: any) => {
          if (field.type === 'step') return;

          const widthPercentage = field.width ? `${field.width}%` : '100%';
          const widthStyle = `width:${widthPercentage};padding:0 ${parseFloat(columnGap)/2}px;margin-bottom:${rowGap};`;

          formContentHtml += `<div class="craft-form-field-wrapper" style="${widthStyle}">`;

          if (field.type === 'html') {
            formContentHtml += field.html || '';
          } else if (field.type === 'hidden') {
            formContentHtml += `<input type="hidden" name="${field.id}" value="${field.value || ''}" />`;
          } else {
            if (props.showLabel !== false) {
              formContentHtml += `<label style="${labelStyle}" for="${field.id}_${nodeId}">${field.label || ''} ${field.required && props.showRequiredMark !== false ? '<span style="color:#ef4444">*</span>' : ''}</label>`;
            }

            const placeholderAttr = field.placeholder ? `placeholder="${field.placeholder}"` : '';
            const requiredAttr = field.required ? 'required' : '';
            const fieldIdAttr = `id="${field.id}_${nodeId}" name="${field.id}"`;

            if (field.type === 'textarea') {
              formContentHtml += `<textarea ${fieldIdAttr} ${placeholderAttr} ${requiredAttr} style="${fieldStyle}min-height:100px;resize:vertical;" class="craft-form-input"></textarea>`;
            } else if (field.type === 'select') {
              const options = (field.options || '').split('\n').filter(Boolean);
              formContentHtml += `<select ${fieldIdAttr} ${requiredAttr} style="${fieldStyle}" class="craft-form-input">`;
              formContentHtml += `<option value="">${field.placeholder || '---'}</option>`;
              options.forEach((opt: string) => {
                formContentHtml += `<option value="${opt.trim()}">${opt.trim()}</option>`;
              });
              formContentHtml += `</select>`;
            } else if (field.type === 'radio' || field.type === 'checkbox') {
              const options = (field.options || '').split('\n').filter(Boolean);
              formContentHtml += `<div style="display:flex;flex-direction:column;gap:8px;">`;
              options.forEach((opt: string, i: number) => {
                const type = field.type === 'checkbox' ? 'checkbox' : 'radio';
                const inputName = field.type === 'checkbox' ? `${field.id}[]` : field.id;
                formContentHtml += `
                  <label style="display:flex;align-items:center;gap:8px;font-size:${fieldFontSize};color:${props.fieldColor || '#334155'};cursor:pointer;">
                    <input type="${type}" name="${inputName}" value="${opt.trim()}" class="craft-form-input" ${field.required && i === 0 ? 'required' : ''} />
                    <span>${opt.trim()}</span>
                  </label>
                `;
              });
              formContentHtml += `</div>`;
            } else if (field.type === 'acceptance') {
              formContentHtml += `
                <label style="display:flex;align-items:flex-start;gap:8px;font-size:${fieldFontSize};color:${props.fieldColor || '#334155'};cursor:pointer;">
                  <input type="checkbox" name="${field.id}" value="yes" class="craft-form-input" required style="margin-top:4px;" />
                  <span>${field.placeholder || field.label}</span>
                </label>
              `;
            } else {
              const inputType = field.type || 'text';
              let patternAttr = '';
              if (inputType === 'tel') {
                patternAttr = 'pattern="^[0-9+() -]{9,15}$" title="Vui lòng nhập số điện thoại hợp lệ"';
              } else if (inputType === 'url') {
                patternAttr = 'pattern="https?://.+" title="Vui lòng nhập đường dẫn hợp lệ bắt đầu bằng http:// hoặc https://"';
              }
              formContentHtml += `<input type="${inputType}" ${fieldIdAttr} ${placeholderAttr} ${requiredAttr} ${patternAttr} style="${fieldStyle}" class="craft-form-input" />`;
            }
          }
          formContentHtml += `<div class="craft-form-error-msg" style="color:${props.inlineMessageColor || '#ef4444'};font-size:11px;margin-top:4px;display:none;"></div>`;
          formContentHtml += `</div>`; // close wrapper
        });
        
        formContentHtml += `</div>`; // close fields grid

        // Buttons for this page
        const showTwoButtons = isMultiStep && pageIdx > 0;
        const currentSubmitBtnWidth = showTwoButtons && activeBtnColumnWidth === '100%' ? 'calc(50% - 6px)' : activeBtnColumnWidth;
        const currentPrevBtnWidth = showTwoButtons && activeBtnColumnWidth === '100%' ? 'calc(50% - 6px)' : 'auto';

        const submitBtnStyle = `width:${currentSubmitBtnWidth};background-color:${submitBtnBg};color:${submitBtnText};border-radius:${btnRadius};padding:${btnPadding};font-size:${btnFontSize};font-family:${props.btnFontFamily || 'inherit'};font-weight:${props.btnFontWeight || 600};border:none;cursor:pointer;transition:all 0.2s;`;
        const prevBtnStyle = `width:${currentPrevBtnWidth};background-color:${prevBtnBg};color:${prevBtnText};border-radius:${btnRadius};padding:${btnPadding};font-size:${btnFontSize};font-family:${props.btnFontFamily || 'inherit'};font-weight:${props.btnFontWeight || 600};border:none;cursor:pointer;transition:all 0.2s;`;

        formContentHtml += `<div class="craft-form-buttons" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:${btnJustify};margin-top:10px;width:100%;">`;
        
        if (pageIdx > 0) {
          formContentHtml += `<button type="button" class="craft-form-prev-btn" style="${prevBtnStyle}">${props.prevButtonText || 'Quay lại'}</button>`;
        }

        if (pageIdx < pages.length - 1) {
          formContentHtml += `<button type="button" class="craft-form-next-btn" style="${submitBtnStyle}">${props.nextButtonText || 'Tiếp tục'}</button>`;
        } else {
          formContentHtml += `<button type="submit" class="craft-form-submit-btn" id="${props.buttonId || ''}" style="${submitBtnStyle}">${props.buttonText || 'Gửi ngay'}</button>`;
        }

        formContentHtml += `</div>`; // close buttons
        formContentHtml += `</div>`; // close page
      });
      
      formContentHtml += '</div>'; // close pages-container

      // Form Status Message Container
      formContentHtml += `
        <div class="craft-form-status-msg" style="display:none;margin-top:16px;padding:12px 16px;border-radius:6px;font-size:${formatUnit(props.messageFontSize || props.msgFontSize, '14px')};font-family:${props.msgFontFamily || 'inherit'};font-weight:${props.msgFontWeight || 500};"></div>
      `;

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
      };

      const encodedConfig = Buffer.from(JSON.stringify(actionsConfig)).toString('base64');

      return `
        <div${getStyleAttr(containerStyles)}>
          ${stepsStyleBlock}
          <form class="craft-form-element" data-craft-form="true" data-form-id="${formId}" data-form-name="${encodeURIComponent(formName)}" data-config="${encodedConfig}" novalidate>
            ${stepsHtml}
            ${formContentHtml}
          </form>
        </div>
      `;
    }

    case 'HtmlBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
        borderType: props.borderType || 'none',
      };

      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');

      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
      };
      return `<div${getStyleAttr(containerStyles)}>${props.html || ''}</div>`;
    }
    case 'PostGridBlock': {
      const mappedProps = {
        ...props,
        advancedBgType: props.advancedBgType || 'classic',
      };
      const { wrapperStyle } = getWrapperStyles(mappedProps as any, 'block');
      
      const containerStyles: Record<string, string | undefined> = {
        ...wrapperStyle,
      };
      
      // We pass the whole `props` object as base64 config
      // to avoid any parsing issues with colons or special chars in CSS fields.
      const encodedConfig = Buffer.from(JSON.stringify(props)).toString('base64');
      return `<div${getStyleAttr(containerStyles)}>{{post_grid_config:${encodedConfig}}}</div>`;
    }

    default:
      // Fallback for canvas or unknown resolved name: just render children inside
      if (node.isCanvas) {
        return `<div class="lexi-canvas">${renderChildren()}</div>`;
      }
      return renderChildren();
  }
}


