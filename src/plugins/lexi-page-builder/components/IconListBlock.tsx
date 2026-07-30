"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useEffect, useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Pencil } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps, getFontFamilyFallback } from './LayoutHelper';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';
import { getLucideReactComponent } from '../utils/iconRegistry';
import { resolveDynamicValue, DynamicConfig } from '../utils/dynamicResolver';

export interface IconListItem {
  id: string;
  text: string;
  iconName: string;
  color?: string;
  link?: string;
  dynamicText?: DynamicConfig;
  dynamicLink?: DynamicConfig;
  linkSettings?: {
    openInNewWindow?: boolean;
    nofollow?: boolean;
    customAttributes?: string;
  };
}

export interface IconListBlockProps extends CommonLayoutProps {
  items?: IconListItem[];
  listLayout?: 'vertical' | 'horizontal';
  align?: 'left' | 'center' | 'right';
  gap?: string;
  hasDivider?: boolean;
  dividerStyle?: 'solid' | 'dashed' | 'dotted';
  dividerWeight?: string;
  dividerColor?: string;
  
  // Icon styling
  iconColor?: string;
  iconColorHover?: string;
  iconSize?: string;
  iconGap?: string;
  iconVerticalAlign?: 'top' | 'middle' | 'bottom';
  iconOffsetY?: string;
  
  // Text styling
  textColor?: string;
  textColorHover?: string;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  lineHeight?: string;
  letterSpacing?: string;
  wordSpacing?: string;
  textTransform?: string;
  textDecoration?: string;
  textShadowColor?: string;
  textShadowBlur?: string;
  textShadowHorizontal?: string;
  textShadowVertical?: string;
}

export const IconListBlock = (rawProps: IconListBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    items = [
      { id: '1', text: 'Má»¥c danh sÃ¡ch #1', iconName: 'Check' },
      { id: '2', text: 'Má»¥c danh sÃ¡ch #2', iconName: 'X' },
      { id: '3', text: 'Má»¥c danh sÃ¡ch #3', iconName: 'CircleDot' }
    ],
    listLayout = 'vertical',
    align = 'left',
    gap = '10px',
    hasDivider = false,
    dividerStyle = 'solid',
    dividerWeight = '1px',
    dividerColor = '#cbd5e1',
    iconColor = '#3b82f6',
    iconColorHover = '',
    iconSize = '14px',
    iconGap = '8px',
    iconVerticalAlign = 'middle',
    iconOffsetY = '0px',
    textColor = '#334155',
    textColorHover = '',
    fontSize = '14px',
    fontWeight = '400',
    fontFamily = 'var(--site-font-family-body)',
    fontStyle = 'normal',
    lineHeight = '1.5',
    letterSpacing = '0px',
    wordSpacing = '0px',
    textTransform = 'none',
    textDecoration = 'none',
    textShadowColor = 'transparent',
    textShadowBlur = '0px',
    textShadowHorizontal = '0px',
    textShadowVertical = '0px',
    className = '',
  } = props;

  const {
    connectors: { connect, drag },
    actions: { setProp },
    selected,
    id,
    displayName,
    isLocked,
    parentId,
  } = useNode((node) => ({
    selected: node.events.selected,
    id: node.id,
    displayName: node.data.displayName || node.data.name,
    isLocked: Boolean(node.data.custom?.locked),
    parentId: node.data.parent,
  }));

  const { enabled, actions: editorActions } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const [hovered, setHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleCloseContextMenus = (event: Event) => {
      const activeId = (event as CustomEvent<string>).detail;
      if (activeId !== id) setContextMenu(null);
    };

    window.addEventListener('craft-close-context-menus', handleCloseContextMenus);
    return () => window.removeEventListener('craft-close-context-menus', handleCloseContextMenus);
  }, [id]);

  const mappedProps = {
    ...props,
    advancedBgType: props.advancedBgType || 'classic',
    borderType: props.borderType || 'none',
  };

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'block', id);

  const containerStyle: React.CSSProperties = {
    ...wrapperStyle,
    display: 'flex',
    flexDirection: listLayout === 'horizontal' ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
    gap: listLayout === 'horizontal' && !hasDivider ? gap : '0px',
  };

  const listVariables = {
    '--icon-color': iconColor,
    '--icon-color-hover': iconColorHover || iconColor,
    '--text-color': textColor,
    '--text-color-hover': textColorHover || textColor,
  } as React.CSSProperties;

  const itemStyle: React.CSSProperties = {
    color: 'var(--text-color)',
    fontSize: fontSize,
    fontWeight,
    fontFamily: getFontFamilyFallback(fontFamily),
    fontStyle,
    lineHeight,
    letterSpacing,
    wordSpacing,
    textTransform: textTransform as any,
    textDecoration,
    textShadow: textShadowColor && textShadowColor !== 'transparent'
      ? `${textShadowHorizontal} ${textShadowVertical} ${textShadowBlur} ${textShadowColor}`
      : undefined,
  };

  const { handlePositionMouseDown } = usePositionDrag({
    id,
    enabled,
    isLocked,
    props,
    setProp,
  });

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      id={idCss || id}
      style={{ ...containerStyle, ...listVariables }}
      className={`relative transition-all duration-200 py-1 ${
        enabled && selected ? 'editor-element-selected z-30' : ''
      } ${
        enabled && hovered && !selected && !isLocked ? 'editor-element-hovered z-20' : ''
      } ${
        enabled && hovered && selected && !isLocked ? 'editor-element-hover-selected' : ''
      } ${isLocked ? 'cursor-default' : ''} ${className} ${classCss}`}
      onMouseDown={(e) => {
        if (handlePositionMouseDown(e)) return;
        if (!enabled) return;
        if (e.altKey) {
          e.preventDefault();
          e.stopPropagation();
          if (parentId && parentId !== 'ROOT') {
            editorActions.selectNode(parentId);
          }
        }
      }}
      onMouseEnter={() => {
        if (enabled && !isLocked) {
          setHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (enabled && !isLocked) {
          setHovered(false);
        }
      }}
      onContextMenu={(e) => {
        if (!enabled) return;
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('craft-close-context-menus', { detail: id }));
        editorActions.selectNode(id);
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        #${idCss || id} .icon-list-item {
          transition: all 0.2s;
        }
        #${idCss || id} .icon-list-item:hover .icon-list-text {
          color: var(--text-color-hover) !important;
        }
        #${idCss || id} .icon-list-item:hover .icon-list-icon {
          color: var(--icon-color-hover) !important;
        }
      `}} />

      {enabled && (hovered || selected) && !isLocked && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            editorActions.selectNode(id);
          }}
          className="editor-hover-badge absolute top-0 right-0 bg-purple-500 hover:bg-purple-600 text-white h-5 w-5 z-40 rounded-bl-sm shadow-md select-none animate-fade-in flex items-center justify-center cursor-pointer"
          title={`Sửa ${displayName.toLowerCase()}`}
        >
          <Pencil size={10} strokeWidth={2.5} />
        </div>
      )}
      {enabled && contextMenu && (
        <FloatingToolbar
          id={id}
          displayName={displayName}
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={Boolean(contextMenu)}
          onClose={() => setContextMenu(null)}
        />
      )}
      
      {items.map((item, idx) => {
        const isCustomSvg = item.iconName && (item.iconName.startsWith('/') || item.iconName.startsWith('http'));
        const ItemIcon = !isCustomSvg ? getLucideReactComponent(item.iconName) : null;
        const parsedIconSize = parseInt(iconSize) || 14;
        
        const itemWrapperStyle: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          width: listLayout === 'horizontal' ? 'auto' : '100%',
          justifyContent: listLayout === 'horizontal' ? 'flex-start' : (align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'),
          boxSizing: 'border-box',
        };

        if (idx < items.length - 1) {
          if (listLayout === 'horizontal') {
            if (hasDivider) {
              itemWrapperStyle.paddingRight = `calc(${gap} / 2)`;
              itemWrapperStyle.marginRight = `calc(${gap} / 2)`;
              itemWrapperStyle.borderRight = `${dividerWeight} ${dividerStyle} ${dividerColor}`;
            } else {
              itemWrapperStyle.marginRight = gap;
            }
          } else {
            if (hasDivider) {
              itemWrapperStyle.paddingBottom = `calc(${gap} / 2)`;
              itemWrapperStyle.marginBottom = `calc(${gap} / 2)`;
              itemWrapperStyle.borderBottom = `${dividerWeight} ${dividerStyle} ${dividerColor}`;
            } else {
              itemWrapperStyle.marginBottom = gap;
            }
          }
        }

        return (
          <div key={item.id} className="icon-list-item font-sans" style={itemWrapperStyle}>
            <span 
              className="icon-list-icon flex-shrink-0 flex items-center justify-center transition-all duration-200" 
              style={{ 
                color: 'var(--icon-color)',
                width: `${parsedIconSize}px`, 
                height: `${parsedIconSize}px`,
                marginRight: iconGap,
                alignSelf: iconVerticalAlign === 'top' ? 'flex-start' : iconVerticalAlign === 'bottom' ? 'flex-end' : 'center',
                transform: iconOffsetY && iconOffsetY !== '0px' ? `translateY(${iconOffsetY})` : undefined,
              } as any}
            >
              {isCustomSvg ? (
                <img src={item.iconName} alt="" style={{ width: parsedIconSize, height: parsedIconSize, objectFit: 'contain' }} />
              ) : (
                ItemIcon && <ItemIcon size={parsedIconSize} />
              )}
            </span>
            {(() => {
              const resolvedText = item.dynamicText?.enabled ? (resolveDynamicValue(item.dynamicText) || item.text) : item.text;
              const resolvedLink = item.dynamicLink?.enabled ? (resolveDynamicValue(item.dynamicLink) || item.link) : item.link;

              if (resolvedLink) {
                const settings = item.linkSettings || {};
                const linkProps: any = {
                  href: resolvedLink,
                };
                if (settings.openInNewWindow) {
                  linkProps.target = '_blank';
                }
                if (settings.nofollow) {
                  linkProps.rel = 'nofollow';
                }
                if (settings.customAttributes) {
                  const lines = settings.customAttributes.split('\n');
                  for (const line of lines) {
                    const parts = line.split('|');
                    if (parts.length >= 2) {
                      const key = parts[0].trim();
                      const val = parts.slice(1).join('|').trim();
                      if (key) {
                        linkProps[key] = val;
                      }
                    }
                  }
                }

                return (
                  <a 
                    {...linkProps}
                    className="icon-list-text hover:underline pointer-events-none transition-all duration-200" 
                    style={itemStyle}
                    onClick={(e) => e.preventDefault()}
                  >
                    {resolvedText}
                  </a>
                );
              }

              return (
                <span className="icon-list-text transition-all duration-200" style={itemStyle}>
                  {resolvedText}
                </span>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
};

IconListBlock.craft = {
  name: 'IconListBlock',
  props: {
    items: [
      { id: '1', text: 'Má»¥c danh sÃ¡ch #1', iconName: 'Check' },
      { id: '2', text: 'Má»¥c danh sÃ¡ch #2', iconName: 'X' },
      { id: '3', text: 'Má»¥c danh sÃ¡ch #3', iconName: 'CircleDot' }
    ],
    listLayout: 'vertical',
    align: 'left',
    gap: '10px',
    hasDivider: false,
    dividerStyle: 'solid',
    dividerWeight: '1px',
    dividerColor: '#cbd5e1',
    iconColor: '#3b82f6',
    iconColorHover: '',
    iconSize: '14px',
    iconGap: '8px',
    iconVerticalAlign: 'middle',
    iconOffsetY: '0px',
    textColor: '#334155',
    textColorHover: '',
    fontSize: '14px',
    fontWeight: '400',
    fontFamily: 'var(--site-font-family-body)',
    fontStyle: 'normal',
    lineHeight: '1.5',
    letterSpacing: '0px',
    wordSpacing: '0px',
    textTransform: 'none',
    textDecoration: 'none',
    textShadowColor: 'transparent',
    textShadowBlur: '0px',
    textShadowHorizontal: '0px',
    textShadowVertical: '0px',
    ...defaultLayoutProps,
    width: '100%',
  },
  displayName: 'Danh sách',
};



