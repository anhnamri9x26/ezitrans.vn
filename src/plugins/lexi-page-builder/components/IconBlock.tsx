"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useEffect, useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Pencil } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps } from './LayoutHelper';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';
import { getLucideReactComponent } from '../utils/iconRegistry';

export interface IconBlockProps extends CommonLayoutProps {
  iconName?: string;
  iconSize?: string;
  iconColor?: string; // backward compatibility
  iconStyle?: 'outline' | 'solid' | 'brands' | 'custom';
  primaryColor?: string;
  secondaryColor?: string;
  primaryColorHover?: string;
  secondaryColorHover?: string;
  iconView?: 'default' | 'stacked' | 'framed';
  iconShape?: 'circle' | 'square' | 'rounded';
  paddingProp?: string;
  borderRadiusProp?: string;
  iconRotate?: string;
  align?: 'left' | 'center' | 'right';
  link?: string;
  className?: string;

  badgeBorderTopWidth?: string;
  badgeBorderRightWidth?: string;
  badgeBorderBottomWidth?: string;
  badgeBorderLeftWidth?: string;
  badgeBorderTopLeftRadius?: string;
  badgeBorderTopRightRadius?: string;
  badgeBorderBottomRightRadius?: string;
  badgeBorderBottomLeftRadius?: string;
}

export const IconBlock = (rawProps: IconBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    iconName = 'Star',
    iconSize = '30px',
    iconColor = '#3b82f6',
    iconStyle = 'outline',
    primaryColor = '#3b82f6',
    secondaryColor = '#ffffff',
    primaryColorHover = '#3b82f6',
    secondaryColorHover = '#ffffff',
    iconView = 'default',
    iconShape = 'circle',
    paddingProp = '10px',
    borderRadiusProp = '10px',
    iconRotate = '0',
    align = 'center',
    link = '',
    className = '',
    badgeBorderTopWidth = '2px',
    badgeBorderRightWidth = '2px',
    badgeBorderBottomWidth = '2px',
    badgeBorderLeftWidth = '2px',
    badgeBorderTopLeftRadius = '10px',
    badgeBorderTopRightRadius = '10px',
    badgeBorderBottomRightRadius = '10px',
    badgeBorderBottomLeftRadius = '10px',
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

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'flex', id);

  const mergedWrapperStyle: React.CSSProperties = {
    ...wrapperStyle,
    display: 'flex',
    justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
  };

  const borderStyles: React.CSSProperties = {};
  if (props.borderType && props.borderType !== 'none') {
    borderStyles.borderStyle = (props.borderType || 'solid') as any;
    borderStyles.borderColor = props.borderColor || '#000000';
    borderStyles.borderTopWidth = props.borderTopWidth || props.borderWidth || '0px';
    borderStyles.borderRightWidth = props.borderRightWidth || props.borderWidth || '0px';
    borderStyles.borderBottomWidth = props.borderBottomWidth || props.borderWidth || '0px';
    borderStyles.borderLeftWidth = props.borderLeftWidth || props.borderWidth || '0px';
    
    borderStyles.borderTopLeftRadius = props.borderTopLeftRadius || props.borderRadius;
    borderStyles.borderTopRightRadius = props.borderTopRightRadius || props.borderRadius;
    borderStyles.borderBottomRightRadius = props.borderBottomRightRadius || props.borderRadius;
    borderStyles.borderBottomLeftRadius = props.borderBottomLeftRadius || props.borderRadius;
  }

  const parsedSize = parseInt(iconSize) || 30;
  const isCustomSvg = iconStyle === 'custom' || (iconName && (iconName.startsWith('/') || iconName.startsWith('http')));
  const LucideIcon = !isCustomSvg ? getLucideReactComponent(iconName) : null;

  const { handlePositionMouseDown } = usePositionDrag({
    id,
    enabled,
    isLocked,
    props,
    setProp,
  });

  // Resolve color depending on view mode and hover state
  const effPrimaryColor = (hovered ? (primaryColorHover || primaryColor) : primaryColor) || '#3b82f6';
  const effSecondaryColor = (hovered ? (secondaryColorHover || secondaryColor) : secondaryColor) || '#ffffff';

  const effectiveIconColor = iconView === 'default' 
    ? (effPrimaryColor || iconColor || '#3b82f6') 
    : (iconView === 'stacked' ? effSecondaryColor : effPrimaryColor);

  const renderIcon = () => {
    const rotateVal = String(iconRotate).endsWith('deg') ? iconRotate : `${iconRotate || 0}deg`;
    const rotateStyle = rotateVal && rotateVal !== '0deg' ? { transform: `rotate(${rotateVal})` } : {};

    if (isCustomSvg) {
      return (
        <img 
          src={iconName} 
          alt="" 
          style={{ width: parsedSize, height: parsedSize, objectFit: 'contain', ...rotateStyle }} 
          className="transition-transform duration-200" 
        />
      );
    }
    const isSolid = iconStyle === 'solid';
    return LucideIcon ? (
      <LucideIcon 
        size={parsedSize} 
        color={effectiveIconColor} 
        fill={isSolid ? effectiveIconColor : 'none'} 
        style={rotateStyle}
        className="transition-transform duration-200" 
      />
    ) : null;
  };

  // Render wrapper badge if stacked/framed
  const renderViewContent = () => {
    if (iconView === 'default' || !iconView) {
      return renderIcon();
    }

    let badgeBorderRadius = '0px';
    const finalBorderRadiusProp = borderRadiusProp || '10px';
    if (iconShape === 'circle') {
      badgeBorderRadius = '50%';
    } else if (iconShape === 'square') {
      badgeBorderRadius = '0px';
    } else {
      const tl = badgeBorderTopLeftRadius || finalBorderRadiusProp;
      const tr = badgeBorderTopRightRadius || finalBorderRadiusProp;
      const br = badgeBorderBottomRightRadius || finalBorderRadiusProp;
      const bl = badgeBorderBottomLeftRadius || finalBorderRadiusProp;
      badgeBorderRadius = `${tl} ${tr} ${br} ${bl}`;
    }

    const finalPaddingProp = paddingProp || '10px';
    const badgeStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: finalPaddingProp,
      borderRadius: badgeBorderRadius,
      transition: 'all 0.2s',
    };

    if (iconView === 'stacked') {
      badgeStyle.backgroundColor = effPrimaryColor;
    } else if (iconView === 'framed') {
      badgeStyle.borderStyle = 'solid';
      badgeStyle.borderTopWidth = badgeBorderTopWidth || '2px';
      badgeStyle.borderRightWidth = badgeBorderRightWidth || '2px';
      badgeStyle.borderBottomWidth = badgeBorderBottomWidth || '2px';
      badgeStyle.borderLeftWidth = badgeBorderLeftWidth || '2px';
      badgeStyle.borderColor = effPrimaryColor;
      badgeStyle.backgroundColor = effSecondaryColor || 'transparent';
    }

    return (
      <div style={badgeStyle} className="transition-transform duration-200">
        {renderIcon()}
      </div>
    );
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
      
      {props.borderType && props.borderType !== 'none' ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...borderStyles }}>
          {link ? (
            <a href={link} className="inline-block pointer-events-none" onClick={(e) => e.preventDefault()}>
              {renderViewContent()}
            </a>
          ) : (
            renderViewContent()
          )}
        </div>
      ) : link ? (
        <a href={link} className="inline-block pointer-events-none" onClick={(e) => e.preventDefault()}>
          {renderViewContent()}
        </a>
      ) : (
        renderViewContent()
      )}
    </div>
  );
};

IconBlock.craft = {
  name: 'IconBlock',
  props: {
    iconName: 'Star',
    iconSize: '30px',
    iconColor: '#3b82f6',
    iconStyle: 'outline',
    primaryColor: '#3b82f6',
    secondaryColor: '#ffffff',
    primaryColorHover: '#3b82f6',
    secondaryColorHover: '#ffffff',
    iconView: 'default',
    iconShape: 'circle',
    paddingProp: '10px',
    borderRadiusProp: '10px',
    iconRotate: '',
    align: 'center',
    link: '',
    badgeBorderTopWidth: '2px',
    badgeBorderRightWidth: '2px',
    badgeBorderBottomWidth: '2px',
    badgeBorderLeftWidth: '2px',
    badgeBorderTopLeftRadius: '10px',
    badgeBorderTopRightRadius: '10px',
    badgeBorderBottomRightRadius: '10px',
    badgeBorderBottomLeftRadius: '10px',
    ...defaultLayoutProps,
    width: 'auto',
  },
  displayName: 'Biểu tượng',
};



