"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useState, useEffect, useRef } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Pencil } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps, getFontFamilyFallback } from './LayoutHelper';
import { EditableText } from './EditableText';
import { usePositionDrag } from './usePositionDrag';
import { getLucideReactComponent } from '../utils/iconRegistry';
import { resolveDynamicValue, DynamicConfig } from '../utils/dynamicResolver';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';

export interface ButtonBlockProps extends CommonLayoutProps {
  text: string;
  link?: string;
  dynamicText?: DynamicConfig;
  dynamicLink?: DynamicConfig;
  linkSettings?: {
    openInNewWindow?: boolean;
    nofollow?: boolean;
    customAttributes?: string;
  };
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  lineHeight?: string;
  letterSpacing?: string;
  wordSpacing?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: string;
  btnBorderTopWidth?: string;
  btnBorderRightWidth?: string;
  btnBorderBottomWidth?: string;
  btnBorderLeftWidth?: string;
  btnBorderWidth?: string;
  btnBorderColor?: string;
  btnBorderStyle?: string;
  btnBorderRadius?: string;
  btnBorderTopLeftRadius?: string;
  btnBorderTopRightRadius?: string;
  btnBorderBottomRightRadius?: string;
  btnBorderBottomLeftRadius?: string;
  align?: 'left' | 'center' | 'right';
  width?: 'auto' | 'full';
  mixBlendMode?: string;
  buttonPreset?: 'primary' | 'secondary' | 'custom';
  iconName?: string;
  iconPosition?: 'left' | 'right';
  iconSpacing?: string;
  buttonId?: string;
}

export const ButtonBlock = (rawProps: ButtonBlockProps) => {
  const props = useResponsiveProps(rawProps) as ButtonBlockProps;
  const {
    text = 'Nhấp đúp chuột để sửa nút',
    link = '',
    fontSize = '14px',
    fontWeight = '600',
    fontFamily = 'var(--site-font-family-button)',
    fontStyle = 'normal',
    lineHeight = '1.2',
    letterSpacing = '0px',
    wordSpacing = '0px',
    backgroundColor = '#3b82f6', // blue-500 (lexi brand blue)
    textColor = '#ffffff',
    borderRadius = '8px',
    borderWidth = '0px',
    borderColor = 'transparent',
    paddingTop = '10px',
    paddingBottom = '10px',
    paddingLeft = '20px',
    paddingRight = '20px',
    align = 'center',
    width = 'auto',
    widthMode,
    customWidth = '',
    height = 'auto',
    className = '',
    mixBlendMode = 'normal',
    buttonPreset = 'primary',
    dynamicText,
    dynamicLink,
    linkSettings,
    iconName = '',
    iconPosition = 'left',
    iconSpacing = '8px',
    buttonId = '',
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

  const dynamicLinkValue = dynamicLink?.enabled ? resolveDynamicValue(dynamicLink) : null;
  const displayLink = dynamicLinkValue !== null ? dynamicLinkValue : link;

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
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    if (buttonRef.current) {
      const newText = buttonRef.current.innerHTML;
      setProp((props: ButtonBlockProps) => (props.text = newText), 500);
    }
  };

  const handleDoubleClick = () => {
    if (!enabled || isLocked || dynamicText?.enabled) return;
    setEditable(true);
    setTimeout(() => {
      if (buttonRef.current) {
        buttonRef.current.focus();
        const range = document.createRange();
        range.selectNodeContents(buttonRef.current);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }, 50);
  };

  const resolvedWidthMode = widthMode || (width === 'full' ? 'full' : 'inline');
  const resolvedWidth = resolvedWidthMode === 'full'
    ? '100%'
    : resolvedWidthMode === 'inline'
      ? 'auto'
      : resolvedWidthMode === 'custom'
        ? customWidth || undefined
        : undefined;

  const mappedProps = {
    ...props,
    advancedBgType: props.advancedBgType || 'classic',
  };

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'flex', id);
  const finalId = buttonId || idCss;

  const containerStyle: React.CSSProperties = {
    ...wrapperStyle,
    // The Craft node wrapper must remain a stable full-width block in vertical
    // containers. If it becomes inline/inline-flex, Craft's hover/drop hit-test
    // around centered buttons is too small and the insertion indicator vanishes.
    display: 'flex',
    width: wrapperStyle.position ? wrapperStyle.width : '100%',
    justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
    height: wrapperStyle.position ? (height === 'auto' ? undefined : height) : undefined,
  };

  const borderStyles: React.CSSProperties = {};
  const btnBorderStyle = props.btnBorderStyle || props.borderStyle || 'none';
  if (btnBorderStyle && btnBorderStyle !== 'none') {
    borderStyles.borderStyle = btnBorderStyle as any;
    borderStyles.borderTopWidth = props.btnBorderTopWidth || props.btnBorderWidth || props.borderTopWidth || props.borderWidth || '0px';
    borderStyles.borderRightWidth = props.btnBorderRightWidth || props.btnBorderWidth || props.borderRightWidth || props.borderWidth || '0px';
    borderStyles.borderBottomWidth = props.btnBorderBottomWidth || props.btnBorderWidth || props.borderBottomWidth || props.borderWidth || '0px';
    borderStyles.borderLeftWidth = props.btnBorderLeftWidth || props.btnBorderWidth || props.borderLeftWidth || props.borderWidth || '0px';
    borderStyles.borderColor = props.btnBorderColor || props.borderColor || 'transparent';
  } else {
    borderStyles.borderStyle = 'none';
  }

  const btnBorderTopLeftRadius = props.btnBorderTopLeftRadius || props.btnBorderRadius || props.borderTopLeftRadius || props.borderRadius;
  const btnBorderTopRightRadius = props.btnBorderTopRightRadius || props.btnBorderRadius || props.borderTopRightRadius || props.borderRadius;
  const btnBorderBottomRightRadius = props.btnBorderBottomRightRadius || props.btnBorderRadius || props.borderBottomRightRadius || props.borderRadius;
  const btnBorderBottomLeftRadius = props.btnBorderBottomLeftRadius || props.btnBorderRadius || props.borderBottomLeftRadius || props.borderRadius;

  const hasCustomRadius = btnBorderTopLeftRadius || btnBorderTopRightRadius || btnBorderBottomRightRadius || btnBorderBottomLeftRadius;
  if (buttonPreset === 'primary') {
    borderStyles.borderRadius = 'var(--site-btn-primary-radius)';
  } else if (buttonPreset === 'secondary') {
    borderStyles.borderRadius = 'var(--site-btn-secondary-radius)';
  } else {
    if (hasCustomRadius) {
      borderStyles.borderTopLeftRadius = btnBorderTopLeftRadius;
      borderStyles.borderTopRightRadius = btnBorderTopRightRadius;
      borderStyles.borderBottomRightRadius = btnBorderBottomRightRadius;
      borderStyles.borderBottomLeftRadius = btnBorderBottomLeftRadius;
    } else {
      borderStyles.borderRadius = props.btnBorderRadius || props.borderRadius || borderRadius;
    }
  }

  const buttonStyle: React.CSSProperties = {
    fontSize,
    fontWeight,
    fontFamily: getFontFamilyFallback(fontFamily),
    fontStyle,
    lineHeight,
    letterSpacing,
    wordSpacing,
    backgroundColor: buttonPreset === 'primary'
      ? 'var(--site-btn-primary-bg)'
      : buttonPreset === 'secondary'
        ? 'var(--site-btn-secondary-bg)'
        : backgroundColor,
    color: buttonPreset === 'primary'
      ? 'var(--site-btn-primary-color)'
      : buttonPreset === 'secondary'
        ? 'var(--site-btn-secondary-color)'
        : textColor,
    ...borderStyles,
    paddingTop: buttonPreset === 'primary'
      ? 'var(--site-btn-primary-padding-y)'
      : buttonPreset === 'secondary'
        ? 'var(--site-btn-secondary-padding-y)'
        : paddingTop,
    paddingBottom: buttonPreset === 'primary'
      ? 'var(--site-btn-primary-padding-y)'
      : buttonPreset === 'secondary'
        ? 'var(--site-btn-secondary-padding-y)'
        : paddingBottom,
    paddingLeft: buttonPreset === 'primary'
      ? 'var(--site-btn-primary-padding-x)'
      : buttonPreset === 'secondary'
        ? 'var(--site-btn-secondary-padding-x)'
        : paddingLeft,
    paddingRight: buttonPreset === 'primary'
      ? 'var(--site-btn-primary-padding-x)'
      : buttonPreset === 'secondary'
        ? 'var(--site-btn-secondary-padding-x)'
        : paddingRight,
    width: resolvedWidth,
    height: height === 'auto' ? undefined : height,
    textAlign: 'center',
    cursor: 'pointer',
    outline: 'none',
    display: resolvedWidthMode === 'full' ? 'block' : 'inline-block',
    mixBlendMode: mixBlendMode as React.CSSProperties['mixBlendMode'],
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
      id={finalId}
      style={containerStyle}
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
              if (buttonRef.current) {
                buttonRef.current.focus();
                const range = document.createRange();
                range.selectNodeContents(buttonRef.current);
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
      <button
        style={buttonStyle}
        className={`lexi-button font-sans transition-all hover:opacity-90 active:scale-[0.98] ${
          buttonPreset === 'primary' ? 'btn-preset-primary' : buttonPreset === 'secondary' ? 'btn-preset-secondary' : ''
        }`}
        onClick={(e) => {
          if (editable && !isLocked) {
            e.stopPropagation();
          } else {
            e.preventDefault();
            if (enabled && selected && !isLocked && !editable && !dynamicText?.enabled) {
              e.stopPropagation();
              setEditable(true);
              setTimeout(() => {
                if (buttonRef.current) {
                  buttonRef.current.focus();
                }
              }, 50);
            }
          }
        }}
      >
        <div className="flex items-center justify-center" style={{ gap: iconSpacing }}>
          {iconName && iconPosition === 'left' && (() => {
            const isCustomSvg = iconName.startsWith('/') || iconName.startsWith('http');
            if (isCustomSvg) {
              return (
                <span className="flex items-center justify-center">
                  <img src={iconName} alt="Icon" style={{ width: '1em', height: '1em', objectFit: 'contain' }} />
                </span>
              );
            }
            const IconComponent = getLucideReactComponent(iconName);
            if (!IconComponent) return null;
            return (
              <span className="flex items-center justify-center">
                <IconComponent size="1.2em" />
              </span>
            );
          })()}
          <EditableText
            tagName="span"
            html={html}
            onChange={(newHtml) => {
              setHtml(newHtml);
            }}
            editable={editable && enabled && !isLocked && !dynamicText?.enabled}
            onBlur={handleBlur}
            style={{ outline: 'none', display: 'inline-block', minWidth: '10px' }}
            innerRef={buttonRef}
          />
          {iconName && iconPosition === 'right' && (() => {
            const isCustomSvg = iconName.startsWith('/') || iconName.startsWith('http');
            if (isCustomSvg) {
              return (
                <span className="flex items-center justify-center">
                  <img src={iconName} alt="Icon" style={{ width: '1em', height: '1em', objectFit: 'contain' }} />
                </span>
              );
            }
            const IconComponent = getLucideReactComponent(iconName);
            if (!IconComponent) return null;
            return (
              <span className="flex items-center justify-center">
                <IconComponent size="1.2em" />
              </span>
            );
          })()}
        </div>
      </button>
    </div>
  );
};

ButtonBlock.craft = {
  name: 'ButtonBlock',
  props: {
    ...defaultLayoutProps,
    text: 'Nút bấm',
    link: '',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'var(--site-font-family-button)',
    fontStyle: 'normal',
    lineHeight: '1.2',
    letterSpacing: '0px',
    wordSpacing: '0px',
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    borderRadius: '8px',
    borderWidth: '0px',
    borderColor: 'transparent',
    borderStyle: 'none',
    btnBorderTopWidth: '0px',
    btnBorderRightWidth: '0px',
    btnBorderBottomWidth: '0px',
    btnBorderLeftWidth: '0px',
    btnBorderColor: 'transparent',
    btnBorderStyle: 'none',
    btnBorderRadius: '8px',
    btnBorderTopLeftRadius: '8px',
    btnBorderTopRightRadius: '8px',
    btnBorderBottomRightRadius: '8px',
    btnBorderBottomLeftRadius: '8px',
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '20px',
    paddingRight: '20px',
    align: 'center',
    width: 'auto',
    mixBlendMode: 'normal',
    buttonPreset: 'primary',
    iconName: '',
    iconPosition: 'left',
    iconSpacing: '8px',
    buttonId: '',
  },
  displayName: 'Nút bấm',
};



