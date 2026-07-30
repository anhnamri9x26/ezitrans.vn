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

export interface DividerBlockProps extends CommonLayoutProps {
  color?: string;
  thickness?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  align?: 'left' | 'center' | 'right';
  gap?: string;
  dividerWidth?: string;
  elementType?: 'none' | 'text' | 'icon';
  text?: string;
  iconName?: string;
  elementPosition?: 'left' | 'center' | 'right';
  elementSpacing?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  textTransform?: string;
  fontStyle?: string;
  textDecoration?: string;
  lineHeight?: string;
  letterSpacing?: string;
  wordSpacing?: string;
  iconSize?: string;
  iconColor?: string;
  iconRotate?: string;
  className?: string;
}

export const DividerBlock = (rawProps: DividerBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    color = '#cbd5e1', // slate-300
    thickness = '1px',
    style = 'solid',
    align = 'center',
    gap = '15px',
    dividerWidth = '100%',
    elementType = 'none',
    text = 'ÄÆ°á»ng phÃ¢n cÃ¡ch',
    iconName = 'Star',
    elementPosition = 'center',
    elementSpacing = '15px',
    textColor = '#334155',
    fontFamily = 'Inter',
    fontSize = '14px',
    fontWeight = '500',
    textTransform = 'none',
    fontStyle = 'normal',
    textDecoration = 'none',
    lineHeight = 'normal',
    letterSpacing = '0px',
    wordSpacing = '0px',
    iconSize = '24',
    iconColor = '#334155',
    iconRotate = '0',
    className = '',
    widthMode = 'full',
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

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'flex', id);
  const isPositioned = props.position === 'absolute' || props.position === 'fixed';

  const mergedWrapperStyle: React.CSSProperties = {
    ...wrapperStyle,
    display: 'flex',
    justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
    paddingTop: gap,
    paddingBottom: gap,
  };

  const hrStyle: React.CSSProperties = {
    border: 'none',
    borderTopWidth: thickness,
    borderTopColor: color,
    borderTopStyle: style,
    margin: 0,
    width: '100%',
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
      id={idCss}
      style={mergedWrapperStyle}
      className={`relative transition-all duration-200 ${
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
      
      {elementType === 'none' ? (
        <hr style={{ ...hrStyle, width: dividerWidth }} />
      ) : (
        <div className="flex items-center" style={{ width: dividerWidth }}>
          {elementPosition !== 'left' && (
            <div style={{ ...hrStyle, flex: 1 }} />
          )}
          <div style={{ 
            paddingLeft: elementPosition === 'left' ? 0 : elementSpacing, 
            paddingRight: elementPosition === 'right' ? 0 : elementSpacing,
            color: elementType === 'text' ? textColor : iconColor,
            fontSize: elementType === 'text' ? fontSize : undefined,
            fontWeight: elementType === 'text' ? fontWeight : undefined,
            transform: elementType === 'icon' && iconRotate ? `rotate(${iconRotate}deg)` : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {elementType === 'text' ? (
              <span
                style={{
                  color: textColor,
                  fontFamily,
                  fontSize: parseInt(fontSize) ? `${parseInt(fontSize)}px` : fontSize,
                  fontWeight,
                  textTransform: textTransform as any,
                  fontStyle: fontStyle,
                  textDecoration: textDecoration,
                  lineHeight: lineHeight,
                  letterSpacing: letterSpacing,
                  wordSpacing: wordSpacing,
                  padding: '0 10px',
                  display: 'inline-block'
                }}
                suppressContentEditableWarning={true}
                contentEditable={enabled && !isLocked}
                onBlur={(e) => {
                  if (e.target.innerText !== text) {
                    setProp((props: DividerBlockProps) => props.text = e.target.innerText);
                  }
                }}
              >
                {text}
              </span>
            ) : (
              iconName && iconName.startsWith('/') || iconName?.startsWith('http') ? (
                <img src={iconName} alt="Icon" style={{ width: `${iconSize}px`, height: `${iconSize}px`, objectFit: 'contain' }} />
              ) : (() => {
                const IconComponent = getLucideReactComponent(iconName || 'Star');
                if (!IconComponent) return null;
                return (
                  <IconComponent size={parseInt(iconSize || '24')} color={iconColor || '#334155'} />
                );
              })()
            )}
          </div>
          {elementPosition !== 'right' && (
            <div style={{ ...hrStyle, flex: 1 }} />
          )}
        </div>
      )}
    </div>
  );
};

DividerBlock.craft = {
  name: 'DividerBlock',
  props: {
    color: '#cbd5e1',
    thickness: '1px',
    style: 'solid',
    align: 'center',
    gap: '15px',
    dividerWidth: '100%',
    elementType: 'none',
    text: 'ÄÆ°á»ng phÃ¢n cÃ¡ch',
    iconName: 'Star',
    elementPosition: 'center',
    elementSpacing: '15px',
    textColor: '#334155',
    fontSize: '14px',
    fontWeight: '500',
    iconSize: '24',
    iconColor: '#334155',
    iconRotate: '0',
    ...defaultLayoutProps,
    width: '100%',
  },
  displayName: 'Đường phân cách',
};
