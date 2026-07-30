"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Pencil } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps, getFontFamilyFallback } from './LayoutHelper';
import { getWrapperStyles, getInnerStyles, createResponsiveProps } from '../utils/styleResolver';
import { usePageSettings } from '../PageSettingsContext';
import { EditableText } from './EditableText';
import { usePositionDrag } from './usePositionDrag';
import { resolveDynamicValue, DynamicConfig } from '../utils/dynamicResolver';

export interface TextBlockProps extends CommonLayoutProps {
  text: string;
  dynamicText?: DynamicConfig;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textColor?: string;
  lineHeight?: string;
  letterSpacing?: string;
  wordSpacing?: string;
  maxWidth?: string;
  dropCap?: boolean;
  dropCapView?: 'default' | 'framed' | 'boxed';
  dropCapPrimaryColor?: string;
  dropCapSecondaryColor?: string;
  dropCapSize?: string;
  dropCapSpace?: string;
  dropCapBorderRadius?: string;
  dropCapBorderWidth?: string;
  dropCapFontFamily?: string;
  dropCapFontWeight?: string;
  dropCapTextShadow?: string;
  columns?: string;
  columnGap?: string;
  mixBlendMode?: string;
  textColorHover?: string;
  linkColor?: string;
  linkColorHover?: string;
  paragraphSpacing?: string;
  textShadowColor?: string;
  textShadowBlur?: string;
  textShadowHorizontal?: string;
  textShadowVertical?: string;
}

export const TextBlock = (rawProps: TextBlockProps) => {
  const { device = 'desktop' } = usePageSettings();
  const props = createResponsiveProps(rawProps, device) as typeof rawProps;
  const {
    text = 'Nh?p d�p chu?t v�o d�y d? s?a do?n van. B?n c� th? s? d?ng c�ng c? b�n ph?i d? thay d?i ph�ng ch?, k�ch thu?c, m�u s?c v� nhi?u t�y ch?nh kh�c. C�ng c? d?ng trang gi�p b?n d? d�ng t?o ra nh?ng do?n van b?n d?p m?t v� chuy�n nghi?p ch? b?ng v�i thao t�c don gi?n.',
    fontSize = '16px',
    fontWeight = '400',
    fontFamily = 'var(--site-font-family-body)',
    fontStyle = 'normal',
    textAlign = 'left',
    textColor = 'var(--site-color-text)', // slate-700
    lineHeight = '1.5',
    letterSpacing = '0px',
    wordSpacing = '0px',
    paddingTop = '0px',
    paddingBottom = '0px',
    paddingLeft = '0px',
    paddingRight = '0px',
    maxWidth = 'none',
    widthMode = 'default',
    className = '',
    dropCap = false,
    dropCapView = 'default',
    dropCapPrimaryColor = '',
    dropCapSecondaryColor = '',
    dropCapSize = '',
    dropCapSpace = '',
    dropCapBorderRadius = '',
    dropCapBorderWidth = '',
    dropCapFontFamily = '',
    dropCapFontWeight = '',
    dropCapTextShadow = '',
    columns = 'default',
    columnGap = '24px',
    mixBlendMode = 'normal',
    textColorHover = '',
    linkColor = '',
    linkColorHover = '',
    paragraphSpacing = '16px',
    textShadowColor = 'transparent',
    textShadowBlur = '0px',
    textShadowHorizontal = '0px',
    textShadowVertical = '0px',
    dynamicText,
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
  const [editable, setEditable] = useState(false);

  const dynamicValue = dynamicText?.enabled ? resolveDynamicValue(dynamicText) : null;
  const displayText = dynamicValue !== null ? dynamicValue : text;

  const [prevText, setPrevText] = useState(displayText);
  const [html, setHtml] = useState(displayText);

  useEffect(() => {
    if (!editable) {
      setHtml(displayText);
    }
  }, [displayText, editable]);

  if (displayText !== prevText) {
    setPrevText(displayText);
    if (!editable) {
      setHtml(displayText);
    }
  }
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCloseContextMenus = (event: Event) => {
      const activeId = (event as CustomEvent<string>).detail;
      if (activeId !== id) setContextMenu(null);
    };

    window.addEventListener('craft-close-context-menus', handleCloseContextMenus);
    return () => window.removeEventListener('craft-close-context-menus', handleCloseContextMenus);
  }, [id]);

  const handleBlur = () => {
    setEditable(false);
    if (textRef.current) {
      const newText = textRef.current.innerHTML;
      setProp((props: TextBlockProps) => (props.text = newText), 500);
    }
  };

  const handleDoubleClick = () => {
    if (!enabled || isLocked || dynamicText?.enabled) return;
    setEditable(true);
    setTimeout(() => {
      if (textRef.current) {
        textRef.current.focus();
        const range = document.createRange();
        range.selectNodeContents(textRef.current);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }, 50);
  };

  const mappedProps = {
    ...props,
    advancedBgType: props.advancedBgType || 'classic',
    borderType: props.borderType || 'none',
  };

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, widthMode === 'inline' ? 'inline-block' : 'block', id);

  const mergedWrapperStyle: React.CSSProperties = {
    ...wrapperStyle,
    maxWidth: widthMode === 'default' && maxWidth !== 'none' ? maxWidth : undefined,
  };

  const baseInnerStyles = getInnerStyles(mappedProps as any, { defaultFontFamily: 'var(--site-font-family-body)' });

  const inlineStyles = {
    ...baseInnerStyles,
    '--text-color': textColor,
    '--text-color-hover': textColorHover || textColor,
    '--link-color': linkColor || textColor,
    '--link-color-hover': linkColorHover || linkColor || textColor,
    '--paragraph-spacing': paragraphSpacing,
    textShadow: textShadowColor && textShadowColor !== 'transparent'
      ? `${textShadowHorizontal} ${textShadowVertical} ${textShadowBlur} ${textShadowColor}`
      : undefined,
    mixBlendMode: mixBlendMode as React.CSSProperties['mixBlendMode'],
    outline: 'none',
  } as React.CSSProperties;

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
      onDoubleClick={handleDoubleClick}
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
      {enabled && (hovered || selected) && !isLocked && !dynamicText?.enabled && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            editorActions.selectNode(id);
            setEditable(true);
            setTimeout(() => {
              if (textRef.current) {
                textRef.current.focus();
                const range = document.createRange();
                range.selectNodeContents(textRef.current);
                const selection = window.getSelection();
                if (selection) {
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
              }
            }, 50);
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
      <EditableText
        tagName="div"
        html={html}
        onChange={(newHtml) => {
          setHtml(newHtml);
        }}
        editable={editable && enabled && !isLocked && !dynamicText?.enabled}
        onBlur={handleBlur}
        style={inlineStyles}
        className={`w-full break-words editor-text-block ${dropCap ? 'editor-drop-cap' : ''}`}
        innerRef={textRef}
        onClick={(e) => {
          if (enabled && selected && !isLocked && !editable && !dynamicText?.enabled) {
            e.stopPropagation();
            setEditable(true);
            setTimeout(() => {
              if (textRef.current) {
                textRef.current.focus();
              }
            }, 50);
          }
        }}
      />
    </div>
  );
};

TextBlock.craft = {
  name: 'TextBlock',
  props: {
    text: 'Nh?p d�p chu?t v�o d�y d? s?a do?n van. B?n c� th? s? d?ng c�ng c? b�n ph?i d? thay d?i ph�ng ch?, k�ch thu?c, m�u s?c v� nhi?u t�y ch?nh kh�c. C�ng c? d?ng trang gi�p b?n d? d�ng t?o ra nh?ng do?n van b?n d?p m?t v� chuy�n nghi?p ch? b?ng v�i thao t�c don gi?n.',
    fontSize: '16px',
    fontWeight: '400',
    fontFamily: 'var(--site-font-family-body)',
    fontStyle: 'normal',
    textAlign: 'left',
    textColor: 'var(--site-color-text)',
    lineHeight: '1.5',
    letterSpacing: '0px',
    wordSpacing: '0px',
    maxWidth: 'none',
    dropCap: false,
    columns: 'default',
    columnGap: '24px',
    mixBlendMode: 'normal',
    textColorHover: '',
    linkColor: '',
    linkColorHover: '',
    paragraphSpacing: '16px',
    textShadowColor: 'transparent',
    textShadowBlur: '0px',
    textShadowHorizontal: '0px',
    textShadowVertical: '0px',
    ...defaultLayoutProps,
  },
  displayName: 'Văn bản',
};
