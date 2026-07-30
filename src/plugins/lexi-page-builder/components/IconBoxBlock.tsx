"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useEffect, useState, useRef } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Pencil } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps } from './LayoutHelper';
import { EditableText } from './EditableText';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';
import { getLucideReactComponent } from '../utils/iconRegistry';
import { resolveDynamicValue } from '../utils/dynamicResolver';

export interface IconBoxBlockProps extends CommonLayoutProps {
  // Content
  iconName?: string;
  iconStyle?: 'outline' | 'solid' | 'brands' | 'custom';
  iconView?: 'default' | 'stacked' | 'framed';
  iconShape?: 'circle' | 'square' | 'rounded';
  title?: string;
  description?: string;
  link?: string;
  titleTag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'span' | 'p';
  dynamicTitle?: any;
  dynamicDescription?: any;
  dynamicLink?: any;
  linkSettings?: any;

  // Box Styles
  iconPosition?: 'top' | 'left' | 'right';
  align?: 'left' | 'center' | 'right' | 'justify';
  iconSpacing?: string;
  contentSpacing?: string;

  // Icon Styles
  iconColor?: string;
  iconColorHover?: string;
  iconSize?: string;
  iconRotate?: string;
  paddingProp?: string;
  borderRadiusProp?: string;
  badgeBorderTopWidth?: string;
  badgeBorderRightWidth?: string;
  badgeBorderBottomWidth?: string;
  badgeBorderLeftWidth?: string;
  badgeBorderTopLeftRadius?: string;
  badgeBorderTopRightRadius?: string;
  badgeBorderBottomRightRadius?: string;
  badgeBorderBottomLeftRadius?: string;

  // Title Styles
  titleColor?: string;
  titleFontFamily?: string;
  titleFontSize?: string;
  titleFontWeight?: string;
  titleFontStyle?: 'normal' | 'italic';
  titleLineHeight?: string;
  titleLetterSpacing?: string;
  titleWordSpacing?: string;
  titleTextShadowColor?: string;
  titleTextShadowBlur?: string;
  titleTextShadowHorizontal?: string;
  titleTextShadowVertical?: string;
  titleTextStrokeColor?: string;
  titleTextStrokeWidth?: string;

  // Description Styles
  descColor?: string;
  descFontFamily?: string;
  descFontSize?: string;
  descFontWeight?: string;
  descFontStyle?: 'normal' | 'italic';
  descLineHeight?: string;
  descLetterSpacing?: string;
  descWordSpacing?: string;
  descTextShadowColor?: string;
  descTextShadowBlur?: string;
  descTextShadowHorizontal?: string;
  descTextShadowVertical?: string;

  className?: string;
}

export const IconBoxBlock = (rawProps: IconBoxBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    iconName = 'Star',
    iconStyle = 'solid',
    iconView = 'default',
    iconShape = 'circle',
    title = 'ÄÃ¢y lÃ  tiÃªu Ä‘á»',
    description = 'ThÃªm má»™t Ä‘oáº¡n vÄƒn báº£n á»Ÿ Ä‘Ã¢y. Nháº¥p vÃ o Ã´ vÄƒn báº£n Ä‘á»ƒ tÃ¹y chá»‰nh ná»™i dung, phong cÃ¡ch phÃ´ng chá»¯ vÃ  mÃ u sáº¯c cá»§a Ä‘oáº¡n vÄƒn cá»§a báº¡n.',
    link = '',
    titleTag = 'h3',
    dynamicTitle,
    dynamicDescription,
    dynamicLink,
    linkSettings,

    // Box settings
    iconPosition = 'top',
    align = 'center',
    iconSpacing = '15px',
    contentSpacing = '10px',

    // Icon style defaults
    iconColor = '#3b82f6',
    iconColorHover = '#2563eb',
    iconSize = '30px',
    iconRotate = '0',
    paddingProp = '10px',
    borderRadiusProp = '10px',
    badgeBorderTopWidth = '2px',
    badgeBorderRightWidth = '2px',
    badgeBorderBottomWidth = '2px',
    badgeBorderLeftWidth = '2px',
    badgeBorderTopLeftRadius = '10px',
    badgeBorderTopRightRadius = '10px',
    badgeBorderBottomRightRadius = '10px',
    badgeBorderBottomLeftRadius = '10px',

    // Title style defaults
    titleColor = '#1e293b',
    titleFontFamily = '',
    titleFontSize = '20px',
    titleFontWeight = '600',
    titleFontStyle = 'normal',
    titleLineHeight = '',
    titleLetterSpacing = '',
    titleWordSpacing = '',
    titleTextShadowColor = 'transparent',
    titleTextShadowBlur = '0px',
    titleTextShadowHorizontal = '0px',
    titleTextShadowVertical = '0px',
    titleTextStrokeColor = 'transparent',
    titleTextStrokeWidth = '0px',

    // Description style defaults
    descColor = '#475569',
    descFontFamily = '',
    descFontSize = '14px',
    descFontWeight = '400',
    descFontStyle = 'normal',
    descLineHeight = '',
    descLetterSpacing = '',
    descWordSpacing = '',
    descTextShadowColor = 'transparent',
    descTextShadowBlur = '0px',
    descTextShadowHorizontal = '0px',
    descTextShadowVertical = '0px',

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
  const [titleEditable, setTitleEditable] = useState(false);
  const [descEditable, setDescEditable] = useState(false);

  const titleRef = useRef<HTMLElement | null>(null);
  const descRef = useRef<HTMLElement | null>(null);

  // Dynamic values resolving
  const displayTitle = (dynamicTitle?.enabled ? resolveDynamicValue(dynamicTitle) : title) || '';
  const displayDesc = (dynamicDescription?.enabled ? resolveDynamicValue(dynamicDescription) : description) || '';
  const displayLink = (dynamicLink?.enabled ? resolveDynamicValue(dynamicLink) : link) || '';

  const [titleHtml, setTitleHtml] = useState<string>(displayTitle);
  const [descHtml, setDescHtml] = useState<string>(displayDesc);

  useEffect(() => {
    if (!titleEditable) setTitleHtml(displayTitle);
  }, [displayTitle, titleEditable]);

  useEffect(() => {
    if (!descEditable) setDescHtml(displayDesc);
  }, [displayDesc, descEditable]);

  useEffect(() => {
    const handleCloseContextMenus = (event: Event) => {
      const activeId = (event as CustomEvent<string>).detail;
      if (activeId !== id) setContextMenu(null);
    };

    window.addEventListener('craft-close-context-menus', handleCloseContextMenus);
    return () => window.removeEventListener('craft-close-context-menus', handleCloseContextMenus);
  }, [id]);

  const handleTitleBlur = () => {
    setTitleEditable(false);
    if (titleRef.current) {
      const newText = titleRef.current.innerHTML;
      setProp((props: IconBoxBlockProps) => (props.title = newText), 500);
    }
  };

  const handleDescBlur = () => {
    setDescEditable(false);
    if (descRef.current) {
      const newText = descRef.current.innerHTML;
      setProp((props: IconBoxBlockProps) => (props.description = newText), 500);
    }
  };

  const mappedProps = {
    ...props,
    advancedBgType: props.advancedBgType || 'classic',
    borderType: 'none',
  };

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'block', id);

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

  const finalIconColor = iconColor || '#3b82f6';
  const finalIconColorHover = iconColorHover || '#2563eb';
  const effIconColor = hovered ? finalIconColorHover : finalIconColor;
  const effIconBg = iconView === 'default' ? 'transparent' : (iconView === 'stacked' ? effIconColor : 'transparent');
  const effIconStroke = iconView === 'default' ? (iconStyle === 'solid' ? effIconColor : 'none') : (iconView === 'stacked' ? 'none' : effIconColor);
  const effectiveIconColor = iconView === 'default' 
    ? effIconColor 
    : (iconView === 'stacked' ? '#ffffff' : effIconColor);

  const finalIconRotate = iconRotate || '0';
  const rotateVal = String(finalIconRotate).endsWith('deg') ? finalIconRotate : `${finalIconRotate}deg`;
  const rotateStyle = rotateVal && rotateVal !== '0deg' ? { transform: `rotate(${rotateVal})` } : {};

  const renderIcon = () => {
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

  const renderIconWrapper = () => {
    if (iconView === 'default' || !iconView) {
      return <div className="inline-flex items-center justify-center shrink-0">{renderIcon()}</div>;
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
      shrink: 0,
    } as any;

    if (iconView === 'stacked') {
      badgeStyle.backgroundColor = effIconBg;
    } else if (iconView === 'framed') {
      badgeStyle.borderStyle = 'solid';
      badgeStyle.borderTopWidth = badgeBorderTopWidth || '2px';
      badgeStyle.borderRightWidth = badgeBorderRightWidth || '2px';
      badgeStyle.borderBottomWidth = badgeBorderBottomWidth || '2px';
      badgeStyle.borderLeftWidth = badgeBorderLeftWidth || '2px';
      badgeStyle.borderColor = effIconStroke;
      badgeStyle.backgroundColor = 'transparent';
    }

    return (
      <div style={badgeStyle} className="transition-transform duration-200 shrink-0">
        {renderIcon()}
      </div>
    );
  };

  // Box flex layout classes based on iconPosition
  const isHorizontal = iconPosition === 'left' || iconPosition === 'right';
  const flexDir = iconPosition === 'top' ? 'flex-col' : (iconPosition === 'right' ? 'flex-row-reverse' : 'flex-row');

  // Text Alignment
  const textAlignmentClass = align === 'left' ? 'text-left' : (align === 'right' ? 'text-right' : (align === 'justify' ? 'text-justify' : 'text-center'));
  const itemsAlignmentClass = align === 'left' ? 'items-start' : (align === 'right' ? 'items-end' : 'items-center');

  // Title Style
  const titleStyle: React.CSSProperties = {
    color: titleColor || '#1e293b',
    fontFamily: titleFontFamily || undefined,
    fontSize: titleFontSize || '20px',
    fontWeight: titleFontWeight || '600',
    fontStyle: titleFontStyle || undefined,
    lineHeight: titleLineHeight || undefined,
    letterSpacing: titleLetterSpacing || undefined,
    wordSpacing: titleWordSpacing || undefined,
    textShadow: titleTextShadowColor && titleTextShadowColor !== 'transparent'
      ? `${titleTextShadowHorizontal || '0px'} ${titleTextShadowVertical || '0px'} ${titleTextShadowBlur || '0px'} ${titleTextShadowColor}`
      : undefined,
    WebkitTextStroke: titleTextStrokeWidth && titleTextStrokeWidth !== '0px' && titleTextStrokeColor !== 'transparent'
      ? `${titleTextStrokeWidth} ${titleTextStrokeColor}`
      : undefined,
    marginBottom: displayDesc ? (contentSpacing || '10px') : '0px',
    outline: 'none',
  };

  // Description Style
  const descStyle: React.CSSProperties = {
    color: descColor || '#475569',
    fontFamily: descFontFamily || undefined,
    fontSize: descFontSize || '14px',
    fontWeight: descFontWeight || '400',
    fontStyle: descFontStyle || undefined,
    lineHeight: descLineHeight || undefined,
    letterSpacing: descLetterSpacing || undefined,
    wordSpacing: descWordSpacing || undefined,
    textShadow: descTextShadowColor && descTextShadowColor !== 'transparent'
      ? `${descTextShadowHorizontal || '0px'} ${descTextShadowVertical || '0px'} ${descTextShadowBlur || '0px'} ${descTextShadowColor}`
      : undefined,
    outline: 'none',
  };

  // Spacing for Icon Box
  const finalIconSpacing = iconSpacing || '15px';
  const iconWrapperStyle: React.CSSProperties = {
    marginBottom: iconPosition === 'top' ? finalIconSpacing : '0px',
    marginRight: iconPosition === 'left' ? finalIconSpacing : '0px',
    marginLeft: iconPosition === 'right' ? finalIconSpacing : '0px',
  };

  const renderContent = () => {
    return (
      <div 
        className={`flex ${flexDir} ${isHorizontal ? 'items-start' : itemsAlignmentClass} w-full`}
      >
        <div style={iconWrapperStyle} className="shrink-0 flex items-center justify-center">
          {renderIconWrapper()}
        </div>
        <div className={`flex-1 flex flex-col ${textAlignmentClass} ${isHorizontal ? (align === 'left' ? 'items-start' : (align === 'right' ? 'items-end' : 'items-center')) : 'w-full'}`}>
          <EditableText
            tagName={titleTag}
            html={titleHtml}
            onChange={(newHtml) => setTitleHtml(newHtml)}
            editable={titleEditable && enabled && !isLocked && !dynamicTitle?.enabled}
            onBlur={handleTitleBlur}
            style={titleStyle}
            className="w-full break-words font-sans font-bold leading-snug"
            innerRef={titleRef}
            onClick={(e) => {
              if (enabled && selected && !isLocked && !titleEditable && !dynamicTitle?.enabled) {
                e.stopPropagation();
                setTitleEditable(true);
                setTimeout(() => titleRef.current?.focus(), 50);
              }
            }}
          />
          {displayDesc && (
            <EditableText
              tagName="p"
              html={descHtml}
              onChange={(newHtml) => setDescHtml(newHtml)}
              editable={descEditable && enabled && !isLocked && !dynamicDescription?.enabled}
              onBlur={handleDescBlur}
              style={descStyle}
              className="w-full break-words font-sans leading-relaxed"
              innerRef={descRef}
              onClick={(e) => {
                if (enabled && selected && !isLocked && !descEditable && !dynamicDescription?.enabled) {
                  e.stopPropagation();
                  setDescEditable(true);
                  setTimeout(() => descRef.current?.focus(), 50);
                }
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      id={idCss}
      style={wrapperStyle}
      className={`relative transition-all duration-200 my-2 ${
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
      {enabled && (hovered || selected) && !isLocked && !titleEditable && !descEditable && !dynamicTitle?.enabled && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            editorActions.selectNode(id);
            setTitleEditable(true);
            setTimeout(() => titleRef.current?.focus(), 50);
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

      {displayLink ? (
        <a href={displayLink} onClick={(e) => e.preventDefault()} className="block text-inherit no-underline w-full pointer-events-none">
          {renderContent()}
        </a>
      ) : (
        renderContent()
      )}
    </div>
  );
};

IconBoxBlock.craft = {
  name: 'IconBoxBlock',
  props: {
    iconName: 'Star',
    iconStyle: 'solid',
    iconView: 'default',
    iconShape: 'circle',
    title: 'ÄÃ¢y lÃ  tiÃªu Ä‘á»',
    description: 'ThÃªm má»™t Ä‘oáº¡n vÄƒn báº£n á»Ÿ Ä‘Ã¢y. Nháº¥p vÃ o Ã´ vÄƒn báº£n Ä‘á»ƒ tÃ¹y chá»‰nh ná»™i dung, phong cÃ¡ch phÃ´ng chá»¯ vÃ  mÃ u sáº¯c cá»§a Ä‘oáº¡n vÄƒn cá»§a báº¡n.',
    link: '',
    titleTag: 'h3',

    iconPosition: 'top',
    align: 'center',
    iconSpacing: '15px',
    contentSpacing: '10px',

    iconColor: '#3b82f6',
    iconColorHover: '#2563eb',
    iconSize: '30px',
    iconRotate: '',
    paddingProp: '10px',
    borderRadiusProp: '10px',
    badgeBorderTopWidth: '2px',
    badgeBorderRightWidth: '2px',
    badgeBorderBottomWidth: '2px',
    badgeBorderLeftWidth: '2px',
    badgeBorderTopLeftRadius: '10px',
    badgeBorderTopRightRadius: '10px',
    badgeBorderBottomRightRadius: '10px',
    badgeBorderBottomLeftRadius: '10px',

    titleColor: '',
    titleFontFamily: '',
    titleFontSize: '',
    titleFontWeight: '',
    titleFontStyle: 'normal',
    titleLineHeight: '',
    titleLetterSpacing: '',
    titleWordSpacing: '',
    titleTextShadowColor: 'transparent',
    titleTextShadowBlur: '',
    titleTextShadowHorizontal: '',
    titleTextShadowVertical: '',
    titleTextStrokeColor: 'transparent',
    titleTextStrokeWidth: '',

    descColor: '',
    descFontFamily: '',
    descFontSize: '',
    descFontWeight: '',
    descFontStyle: 'normal',
    descLineHeight: '',
    descLetterSpacing: '',
    descWordSpacing: '',
    descTextShadowColor: 'transparent',
    descTextShadowBlur: '',
    descTextShadowHorizontal: '',
    descTextShadowVertical: '',

    ...defaultLayoutProps,
    width: '100%',
  },
  displayName: 'Hộp Icon',
};



