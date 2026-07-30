"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useState, useEffect, useRef } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Pencil } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps, getFontFamilyFallback } from './LayoutHelper';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';

export interface CounterBlockProps extends CommonLayoutProps {
  startNumber?: number;
  endNumber?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  useThousandSeparator?: boolean;
  title?: string;
  titleTag?: 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span';
  
  // Number typography properties
  numberColor?: string;
  numberFontSize?: string;
  numberFontWeight?: string;
  numberFontFamily?: string;
  numberFontStyle?: 'normal' | 'italic';
  numberTextDecoration?: 'none' | 'underline' | 'line-through';
  numberTextAlign?: 'left' | 'center' | 'right';
  numberTextShadowColor?: string;
  numberTextShadowBlur?: string;
  numberTextShadowHorizontal?: string;
  numberTextShadowVertical?: string;

  // Title typography properties
  titleColor?: string;
  titleFontSize?: string;
  titleFontWeight?: string;
  titleFontFamily?: string;
  titleFontStyle?: 'normal' | 'italic';
  titleTextDecoration?: 'none' | 'underline' | 'line-through';
  titleHAlign?: 'left' | 'center' | 'right';
  titleTextShadowColor?: string;
  titleTextShadowBlur?: string;
  titleTextShadowHorizontal?: string;
  titleTextShadowVertical?: string;

  // Layout properties
  titlePosition?: 'top' | 'bottom';
  titleSpacing?: string;
}

export const CounterBlock = (rawProps: CounterBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    startNumber = 0,
    endNumber = 100,
    prefix = '',
    suffix = '',
    duration = 2000,
    useThousandSeparator = true,
    title = 'Cool Number',
    titleTag = 'div',

    // Number typography defaults
    numberColor = 'var(--site-color-primary)',
    numberFontSize = '48px',
    numberFontWeight = '700',
    numberFontFamily = '',
    numberFontStyle = 'normal',
    numberTextDecoration = 'none',
    numberTextAlign = 'center',
    numberTextShadowColor = 'transparent',
    numberTextShadowBlur = '0px',
    numberTextShadowHorizontal = '0px',
    numberTextShadowVertical = '0px',

    // Title typography defaults
    titleColor = 'var(--site-color-text)',
    titleFontSize = '18px',
    titleFontWeight = '400',
    titleFontFamily = '',
    titleFontStyle = 'normal',
    titleTextDecoration = 'none',
    titleHAlign = 'center',
    titleTextShadowColor = 'transparent',
    titleTextShadowBlur = '0px',
    titleTextShadowHorizontal = '0px',
    titleTextShadowVertical = '0px',

    // Layout defaults
    titlePosition = 'bottom',
    titleSpacing = '10px',

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
  const [clickCount, setClickCount] = useState(0);
  const [currentVal, setCurrentVal] = useState(endNumber);

  // Counter count up animation
  useEffect(() => {
    if (enabled && !selected) {
      setCurrentVal(endNumber);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const val = Math.floor(progress * (endNumber - startNumber) + startNumber);
      setCurrentVal(val);
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrentVal(endNumber);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled, selected, startNumber, endNumber, duration, clickCount]);

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

  const { handlePositionMouseDown } = usePositionDrag({
    id,
    enabled,
    isLocked,
    props,
    setProp,
  });

  const formatNumber = (num: number, useSeparator: boolean) => {
    if (!useSeparator) return num.toString();
    // Use dot as separator for vi-VN locale style
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const numberFontFamilyResolved = numberFontFamily ? getFontFamilyFallback(numberFontFamily) : undefined;
  const titleFontFamilyResolved = titleFontFamily ? getFontFamilyFallback(titleFontFamily) : undefined;

  const numberStyle: React.CSSProperties = {
    color: numberColor,
    fontSize: numberFontSize,
    fontWeight: numberFontWeight,
    fontFamily: numberFontFamilyResolved,
    fontStyle: numberFontStyle,
    textDecoration: numberTextDecoration,
    textAlign: numberTextAlign,
    textShadow: numberTextShadowColor && numberTextShadowColor !== 'transparent'
      ? `${numberTextShadowHorizontal} ${numberTextShadowVertical} ${numberTextShadowBlur} ${numberTextShadowColor}`
      : undefined,
  };

  const titleStyle: React.CSSProperties = {
    color: titleColor,
    fontSize: titleFontSize,
    fontWeight: titleFontWeight,
    fontFamily: titleFontFamilyResolved,
    fontStyle: titleFontStyle,
    textDecoration: titleTextDecoration,
    textAlign: titleHAlign,
    textShadow: titleTextShadowColor && titleTextShadowColor !== 'transparent'
      ? `${titleTextShadowHorizontal} ${titleTextShadowVertical} ${titleTextShadowBlur} ${titleTextShadowColor}`
      : undefined,
  };

  const TitleTag = titleTag;

  const renderTitle = () => (
    <TitleTag
      style={{
        ...titleStyle,
        marginTop: titlePosition === 'bottom' ? titleSpacing : '0px',
        marginBottom: titlePosition === 'top' ? titleSpacing : '0px',
        display: 'block',
      }}
      className="craft-counter-title w-full break-words"
    >
      {title}
    </TitleTag>
  );

  const getJustifyContent = (align?: 'left' | 'center' | 'right') => {
    if (align === 'left') return 'flex-start';
    if (align === 'right') return 'flex-end';
    return 'center';
  };

  const renderNumber = () => (
    <div 
      style={{
        ...numberStyle,
        justifyContent: getJustifyContent(numberTextAlign),
      }}
      className="craft-counter-number w-full break-words flex items-center"
    >
      {prefix && <span className="craft-counter-prefix mr-1">{prefix}</span>}
      <span className="craft-counter-value">{formatNumber(currentVal, useThousandSeparator)}</span>
      {suffix && <span className="craft-counter-suffix ml-1">{suffix}</span>}
    </div>
  );

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      id={idCss}
      style={{
        ...wrapperStyle,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}
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
      onClick={(e) => {
        if (enabled && selected) {
          // Re-trigger counter animation in editor
          setClickCount((c) => c + 1);
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

      {titlePosition === 'top' && renderTitle()}
      {renderNumber()}
      {titlePosition === 'bottom' && renderTitle()}
    </div>
  );
};

CounterBlock.craft = {
  name: 'CounterBlock',
  props: {
    startNumber: 0,
    endNumber: 100,
    prefix: '',
    suffix: '',
    duration: 2000,
    useThousandSeparator: true,
    title: 'Cool Number',
    titleTag: 'div',

    // Number typography
    numberColor: 'var(--site-color-primary)',
    numberFontSize: '48px',
    numberFontWeight: '700',
    numberFontFamily: '',
    numberFontStyle: 'normal',
    numberTextDecoration: 'none',
    numberTextAlign: 'center',
    numberTextShadowColor: 'transparent',
    numberTextShadowBlur: '0px',
    numberTextShadowHorizontal: '0px',
    numberTextShadowVertical: '0px',

    // Title typography
    titleColor: 'var(--site-color-text)',
    titleFontSize: '18px',
    titleFontWeight: '400',
    titleFontFamily: '',
    titleFontStyle: 'normal',
    titleTextDecoration: 'none',
    titleHAlign: 'center',
    titleTextShadowColor: 'transparent',
    titleTextShadowBlur: '0px',
    titleTextShadowHorizontal: '0px',
    titleTextShadowVertical: '0px',

    // Layout
    titlePosition: 'bottom',
    titleSpacing: '10px',

    ...defaultLayoutProps,
  },
  displayName: 'Bộ đếm',
};
