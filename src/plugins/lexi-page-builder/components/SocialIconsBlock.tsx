"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useEffect, useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import * as Lucide from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps } from './LayoutHelper';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';
import { SOCIAL_ICONS_DATA, getSocialIcon } from '../utils/socialIconsData';

export interface SocialIconItem {
  platform: string; // e.g. 'facebook'
  link: string;
  colorMode: 'official' | 'custom';
  customColor?: string;
  customSecondaryColor?: string;
}

export interface SocialIconsBlockProps extends CommonLayoutProps {
  items?: SocialIconItem[];
  shape?: 'circle' | 'square' | 'rounded';
  iconView?: 'default' | 'stacked' | 'framed';
  columns?: 'auto' | number;
  align?: 'left' | 'center' | 'right';
  iconSize?: string;
  iconPadding?: string;
  iconSpacing?: string;
  iconRowGap?: string;
  
  // Hover effect configuration
  hoverAnimation?: 'none' | 'grow' | 'shrink' | 'pulse' | 'pulse-grow' | 'pulse-shrink' | 'push' | 'pop' | 'bounce-in';
  hoverColorMode?: 'official' | 'custom' | 'none';
  hoverCustomColor?: string;
  hoverCustomSecondaryColor?: string;
  
  // Custom border radius when shape === 'rounded'
  customBorderRadius?: string;

  // Custom colors for all icons at block level (if overrides)
  itemColorMode?: 'official' | 'custom';
  itemCustomColor?: string;
  itemCustomSecondaryColor?: string;
}

export const SocialIconsBlock = (rawProps: SocialIconsBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    items = [
      { platform: 'facebook', link: 'https://facebook.com', colorMode: 'official' },
      { platform: 'twitter', link: 'https://twitter.com', colorMode: 'official' },
      { platform: 'youtube', link: 'https://youtube.com', colorMode: 'official' },
    ],
    shape = 'rounded',
    iconView = 'default',
    columns = 'auto',
    align = 'center',
    iconSize = '20px',
    iconPadding = '8px',
    iconSpacing = '10px',
    iconRowGap = '10px',
    hoverAnimation = 'none',
    hoverColorMode = 'none',
    hoverCustomColor = '#3b82f6',
    hoverCustomSecondaryColor = '#ffffff',
    customBorderRadius = '8px',
    itemColorMode = 'official',
    itemCustomColor = '#3b82f6',
    itemCustomSecondaryColor = '#ffffff',
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

  const { handlePositionMouseDown } = usePositionDrag({
    id,
    enabled,
    isLocked,
    props,
    setProp,
  });

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(props as any, 'flex', id);

  // Parse layout structures
  const parsedSize = parseInt(iconSize) || 20;
  
  // Resolve item styles
  const getBorderRadius = () => {
    if (shape === 'circle') return '50%';
    if (shape === 'square') return '0px';
    return customBorderRadius || '8px';
  };

  const getColStyles = (): React.CSSProperties => {
    if (columns === 'auto') {
      return {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        gap: iconSpacing,
        rowGap: iconRowGap,
        width: '100%',
      };
    }
    
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, minmax(0, max-content))`,
      justifyContent: align === 'left' ? 'start' : align === 'right' ? 'end' : 'center',
      gap: iconSpacing,
      rowGap: iconRowGap,
      width: '100%',
    };
  };

  // Generate dynamic CSS rules for animations & custom hovers
  const renderAnimationStyles = () => {
    let animationCSS = '';
    
    // Core animation styles
    if (hoverAnimation !== 'none') {
      const duration = hoverAnimation === 'bounce-in' ? '0.5s' : '0.3s';
      const timing = hoverAnimation === 'bounce-in' ? 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'ease';
      
      animationCSS += `
        #social-block-${id} .social-icon-item {
          transition: all ${duration} ${timing};
        }
      `;

      switch (hoverAnimation) {
        case 'grow':
          animationCSS += `
            #social-block-${id} .social-icon-item:hover {
              transform: scale(1.15);
            }
          `;
          break;
        case 'shrink':
          animationCSS += `
            #social-block-${id} .social-icon-item:hover {
              transform: scale(0.85);
            }
          `;
          break;
        case 'pulse':
          animationCSS += `
            @keyframes pulse-${id} {
              25% { transform: scale(1.1); }
              75% { transform: scale(0.9); }
            }
            #social-block-${id} .social-icon-item:hover {
              animation: pulse-${id} 1s linear infinite;
            }
          `;
          break;
        case 'pulse-grow':
          animationCSS += `
            @keyframes pulse-grow-${id} {
              to { transform: scale(1.1); }
            }
            #social-block-${id} .social-icon-item:hover {
              animation: pulse-grow-${id} 0.3s linear alternate infinite;
            }
          `;
          break;
        case 'pulse-shrink':
          animationCSS += `
            @keyframes pulse-shrink-${id} {
              to { transform: scale(0.9); }
            }
            #social-block-${id} .social-icon-item:hover {
              animation: pulse-shrink-${id} 0.3s linear alternate infinite;
            }
          `;
          break;
        case 'push':
          animationCSS += `
            #social-block-${id} .social-icon-item:hover {
              transform: scale(0.85);
            }
          `;
          break;
        case 'pop':
          animationCSS += `
            #social-block-${id} .social-icon-item:hover {
              transform: scale(1.15);
            }
          `;
          break;
        case 'bounce-in':
          animationCSS += `
            #social-block-${id} .social-icon-item:hover {
              transform: scale(1.15);
            }
          `;
          break;
      }
    }

    // Dynamic Hover Colors
    items.forEach((item, index) => {
      const platformData = getSocialIcon(item.platform);
      const officialColor = platformData ? platformData.brandColor : '#3b82f6';
      
      // Hover text/SVG color & Hover bg/border color
      let hColor = '';
      let hBgColor = '';
      let hBorderColor = '';

      if (hoverColorMode === 'official') {
        hColor = iconView === 'stacked' ? (hoverCustomSecondaryColor || '#ffffff') : officialColor;
        hBgColor = iconView === 'stacked' ? officialColor : 'transparent';
        hBorderColor = iconView === 'framed' ? officialColor : 'transparent';
      } else if (hoverColorMode === 'custom') {
        hColor = iconView === 'stacked' ? (hoverCustomSecondaryColor || '#ffffff') : (hoverCustomColor || '#3b82f6');
        hBgColor = iconView === 'stacked' ? (hoverCustomColor || '#3b82f6') : 'transparent';
        hBorderColor = iconView === 'framed' ? (hoverCustomColor || '#3b82f6') : 'transparent';
      }

      if (hColor) {
        animationCSS += `
          #social-block-${id} .social-item-${index}:hover svg {
            fill: ${hColor} !important;
            stroke: ${hColor} !important;
          }
        `;
      }
      if (hBgColor && iconView === 'stacked') {
        animationCSS += `
          #social-block-${id} .social-item-${index}:hover {
            background-color: ${hBgColor} !important;
          }
        `;
      }
      if (hBorderColor && iconView === 'framed') {
        animationCSS += `
          #social-block-${id} .social-item-${index}:hover {
            border-color: ${hBorderColor} !important;
          }
        `;
      }
    });

    return <style dangerouslySetInnerHTML={{ __html: animationCSS }} />;
  };

  const renderIconItem = (item: SocialIconItem, index: number) => {
    if (!item.platform) return null;

    const platformData = getSocialIcon(item.platform);
    const isCustomSvg = item.platform.startsWith('/') || item.platform.startsWith('http');

    const officialColor = platformData ? platformData.brandColor : '#3b82f6';
    
    // Resolve normal colors
    const isCustom = itemColorMode === 'custom' || item.colorMode === 'custom';
    const primaryColor = isCustom 
      ? (item.customColor || itemCustomColor || '#3b82f6') 
      : officialColor;
    const secondaryColor = isCustom 
      ? (item.customSecondaryColor || itemCustomSecondaryColor || '#ffffff') 
      : '#ffffff';

    const itemStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: iconPadding,
      borderRadius: getBorderRadius(),
      cursor: 'pointer',
      textDecoration: 'none',
    };

    let svgFill = 'currentColor';

    if (iconView === 'default') {
      itemStyle.backgroundColor = 'transparent';
      itemStyle.color = primaryColor;
      svgFill = primaryColor;
    } else if (iconView === 'stacked') {
      itemStyle.backgroundColor = primaryColor;
      itemStyle.color = secondaryColor;
      svgFill = secondaryColor;
    } else if (iconView === 'framed') {
      itemStyle.backgroundColor = 'transparent';
      itemStyle.border = `2px solid ${primaryColor}`;
      itemStyle.color = primaryColor;
      svgFill = primaryColor;
    }

    const renderIconGraphic = () => {
      if (isCustomSvg) {
        return (
          <img 
            src={item.platform} 
            alt="" 
            style={{ width: parsedSize, height: parsedSize, objectFit: 'contain' }} 
          />
        );
      }
      if (platformData) {
        return (
          <svg
            viewBox="0 0 24 24"
            width={parsedSize}
            height={parsedSize}
            fill={svgFill}
            style={{ transition: 'fill 0.2s' }}
          >
            <path d={platformData.path} />
          </svg>
        );
      }
      // Lucide icon
      return React.createElement((Lucide as any)[item.platform] || Lucide.HelpCircle, {
        size: parsedSize,
        color: svgFill === 'currentColor' ? undefined : svgFill,
        style: { transition: 'fill 0.2s, stroke 0.2s' }
      });
    };

    return (
      <a
        key={index}
        href={item.link || '#'}
        target="_blank"
        rel="noopener noreferrer"
        style={itemStyle}
        className={`social-icon-item social-item-${index} pointer-events-none-in-editor`}
        onClick={(e) => {
          if (enabled) {
            e.preventDefault();
          }
        }}
      >
        {renderIconGraphic()}
      </a>
    );
  };

  const mergedWrapperStyle: React.CSSProperties = {
    ...wrapperStyle,
    display: 'flex',
    flexDirection: 'column',
    alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
  };

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      id={idCss}
      style={mergedWrapperStyle}
      className={`relative transition-all duration-200 py-1 ${
        enabled && selected ? 'editor-element-selected z-30' : ''
      } ${
        enabled && hovered && !selected && !isLocked ? 'editor-element-hovered z-20' : ''
      } ${
        enabled && hovered && selected && !isLocked ? 'editor-element-hover-selected' : ''
      } ${isLocked ? 'cursor-default' : ''} ${classCss}`}
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
      {enabled && (hovered || selected) && !isLocked && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            editorActions.selectNode(id);
          }}
          className="editor-hover-badge absolute top-0 right-0 bg-purple-500 hover:bg-purple-600 text-white h-5 w-5 z-40 rounded-bl-sm shadow-md select-none animate-fade-in flex items-center justify-center cursor-pointer"
          title={`Sửa ${displayName.toLowerCase()}`}
        >
          <Lucide.Pencil size={10} strokeWidth={2.5} />
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

      {renderAnimationStyles()}

      <div id={`social-block-${id}`} style={getColStyles()}>
        {items.map((item, index) => renderIconItem(item, index))}
      </div>
    </div>
  );
};

SocialIconsBlock.craft = {
  name: 'SocialIconsBlock',
  props: {
    items: [
      { platform: 'facebook', link: 'https://facebook.com', colorMode: 'official' },
      { platform: 'twitter', link: 'https://twitter.com', colorMode: 'official' },
      { platform: 'youtube', link: 'https://youtube.com', colorMode: 'official' },
    ],
    shape: 'rounded',
    iconView: 'default',
    columns: 'auto',
    align: 'center',
    iconSize: '20px',
    iconPadding: '8px',
    iconSpacing: '10px',
    iconRowGap: '10px',
    hoverAnimation: 'none',
    hoverColorMode: 'none',
    hoverCustomColor: '#3b82f6',
    hoverCustomSecondaryColor: '#ffffff',
    customBorderRadius: '8px',
    itemColorMode: 'official',
    itemCustomColor: '#3b82f6',
    itemCustomSecondaryColor: '#ffffff',
    ...defaultLayoutProps,
    width: '100%',
  },
  displayName: 'Icon Mạng Xã Hội',
};



