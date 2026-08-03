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
import { Element } from '@craftjs/core';
import { Container } from './Container';

export interface AccordionItem {
  id: string;
  title: string;
  content: string;
  cssId?: string;
  contentType?: 'text' | 'builder';
}

export interface AccordionBlockProps extends Partial<CommonLayoutProps> {
  items?: AccordionItem[];
  
  // Content > Layout
  itemAlign?: 'left' | 'center' | 'right' | 'justify';
  iconPosition?: 'left' | 'right';
  activeIconType?: 'default' | 'svg' | 'lucide' | 'none';
  activeIconSvg?: string;
  activeIconLucide?: string;
  inactiveIconType?: 'default' | 'svg' | 'lucide' | 'none';
  inactiveIconSvg?: string;
  inactiveIconLucide?: string;
  titleHtmlTag?: string; // div, h1-h6
  faqSchema?: boolean;

  // Content > Interaction
  defaultState?: 'first' | 'all' | 'none';
  maxExpanded?: 'one' | 'unlimited';
  animationDuration?: string;

  // Style > Item Wrapper (Nội dung thu gọn)
  itemSpacing?: string;
  contentSpacing?: string;
  itemBgType?: 'color' | 'image';
  itemBgColor?: string;
  itemBgColorHover?: string;
  itemBgColorActive?: string;
  itemBorderType?: string;
  itemBorderColor?: string;
  itemBorderWidth?: string;
  itemBorderRadius?: string;
  itemPadding?: string;

  // Style > Title (Đầu trang)
  titleFontFamily?: string;
  titleFontSize?: string;
  titleFontWeight?: string;
  titleFontStyle?: string;
  titleTextDecoration?: string;
  titleLineHeight?: string;
  titleLetterSpacing?: string;
  titleWordSpacing?: string;
  titleTextTransform?: string;

  titleColor?: string;
  titleColorHover?: string;
  titleColorActive?: string;
  titleTextShadow?: string;
  titleTextShadowHover?: string;
  titleTextShadowActive?: string;
  titleTextStroke?: string;
  titleTextStrokeHover?: string;
  titleTextStrokeActive?: string;

  // Style > Icon
  iconSize?: string;
  iconSpacing?: string;
  iconColor?: string;
  iconColorHover?: string;
  iconColorActive?: string;

  // Style > Content (Nội dung)
  contentBgType?: 'color' | 'image';
  contentBgColor?: string;
  contentBorderType?: string;
  contentBorderColor?: string;
  contentBorderWidth?: string;
  contentBorderRadius?: string;
  contentPadding?: string;
  contentColor?: string;

  contentFontFamily?: string;
  contentFontSize?: string;
  contentFontWeight?: string;
  contentFontStyle?: string;
  contentTextDecoration?: string;
  contentLineHeight?: string;
  contentLetterSpacing?: string;
  contentWordSpacing?: string;
  contentTextTransform?: string;

  className?: string;
}

export const AccordionBlock = (rawProps: AccordionBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    items = [
      { id: '1', title: 'Mục danh sách #1', content: 'Đây là nội dung trả lời mẫu cho mục số 1. Bạn có thể dễ dàng thay đổi văn bản này trong phần cài đặt bên phải.', cssId: '' },
      { id: '2', title: 'Mục danh sách #2', content: 'Đây là nội dung trả lời mẫu cho mục số 2. Kéo thả để thay đổi vị trí các mục theo ý muốn.', cssId: '' },
      { id: '3', title: 'Mục danh sách #3', content: 'Bạn có thể tùy chỉnh màu sắc, biểu tượng và hiệu ứng của Sập mở (FAQ) trong phần cài đặt Tương tác và Giao diện.', cssId: '' }
    ],
    itemAlign = 'left',
    iconPosition = 'right',
    activeIconType = 'default',
    activeIconSvg = '',
    activeIconLucide = 'Minus',
    inactiveIconType = 'default',
    inactiveIconSvg = '',
    inactiveIconLucide = 'Plus',
    titleHtmlTag = 'div',
    faqSchema = false,
    
    defaultState = 'first',
    maxExpanded = 'one',
    animationDuration = '400',

    itemSpacing = '12px',
    contentSpacing = '0px',
    itemBgType = 'color',
    itemBgColor = 'transparent',
    itemBgColorHover = '',
    itemBgColorActive = '',
    itemBorderType = 'solid',
    itemBorderColor = '#e2e8f0',
    itemBorderWidth = '1px',
    itemBorderRadius = '6px',
    itemPadding = '0px',

    titleFontFamily = '',
    titleFontSize = '14px',
    titleFontWeight = '700',
    titleFontStyle = '',
    titleTextDecoration = '',
    titleLineHeight = '',
    titleLetterSpacing = '',
    titleWordSpacing = '',
    titleTextTransform = '',

    titleColor = '#1e293b',
    titleColorHover = '#2563eb',
    titleColorActive = '#2563eb',
    titleTextShadow = '',
    titleTextShadowHover = '',
    titleTextShadowActive = '',
    titleTextStroke = '',
    titleTextStrokeHover = '',
    titleTextStrokeActive = '',

    iconSize = '15px',
    iconSpacing = '8px',
    iconColor = '#1e293b',
    iconColorHover = '#2563eb',
    iconColorActive = '#2563eb',

    contentBgType = 'color',
    contentBgColor = '#ffffff',
    contentBorderType = 'solid',
    contentBorderColor = '#e2e8f0',
    contentBorderWidth = '1px 0 0 0',
    contentBorderRadius = '0px',
    contentPadding = '12px 16px',
    contentColor = '#475569',
    
    contentFontFamily = '',
    contentFontSize = '13px',
    contentFontWeight = '400',
    contentFontStyle = '',
    contentTextDecoration = '',
    contentLineHeight = '',
    contentLetterSpacing = '',
    contentWordSpacing = '',
    contentTextTransform = '',

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

  const { enabled, actions: editorActions, resolver } = useEditor((state) => ({
    enabled: state.options.enabled,
    resolver: state.options.resolver,
  }));
  const ResolvedContainer = resolver.Container || resolver['Container'] || Container;

  const [hovered, setHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleCloseContextMenus = (event: Event) => {
      const activeId = (event as CustomEvent<string>).detail;
      if (activeId !== id) setContextMenu(null);
    };

    window.addEventListener('craft-close-context-menus', handleCloseContextMenus);
    return () => window.removeEventListener('craft-close-context-menus', handleCloseContextMenus);
  }, [id]);

  useEffect(() => {
    if (enabled) {
      const initial: Record<string, boolean> = {};
      if (defaultState === 'first' && items.length > 0) {
        initial[items[0].id] = true;
      } else if (defaultState === 'all') {
        items.forEach(item => initial[item.id] = true);
      }
      setOpenItems(initial);
    }
  }, [items, defaultState, enabled]);

  const mappedProps = {
    ...props,
    advancedBgType: props.advancedBgType || 'classic',
    borderType: props.borderType || 'none',
  };

  const { wrapperStyle, idCss: rawIdCss, classCss } = getWrapperStyles(mappedProps as any, 'block', id);
  const idCss = props.idCss || `acc-${id}`;

  const mergedWrapperStyle: React.CSSProperties = {
    ...wrapperStyle,
  };

  const toggleItem = (itemId: string, e: React.MouseEvent) => {
    if (enabled) {
      e.preventDefault();
      e.stopPropagation();
      setOpenItems(prev => {
        if (maxExpanded === 'one') {
          const isCurrentlyOpen = prev[itemId];
          return isCurrentlyOpen ? {} : { [itemId]: true };
        } else {
          return { ...prev, [itemId]: !prev[itemId] };
        }
      });
    }
  };

  const { handlePositionMouseDown } = usePositionDrag({
    id,
    enabled,
    isLocked,
    props,
    setProp,
  });

  const titleTypoStyle = {
    fontFamily: titleFontFamily,
    fontSize: titleFontSize,
    fontWeight: titleFontWeight,
    fontStyle: titleFontStyle,
    textDecoration: titleTextDecoration,
    lineHeight: titleLineHeight,
    letterSpacing: titleLetterSpacing,
    wordSpacing: titleWordSpacing,
    textTransform: titleTextTransform,
  };
  const contentTypoStyle = {
    fontFamily: contentFontFamily,
    fontSize: contentFontSize,
    fontWeight: contentFontWeight,
    fontStyle: contentFontStyle,
    textDecoration: contentTextDecoration,
    lineHeight: contentLineHeight,
    letterSpacing: contentLetterSpacing,
    wordSpacing: contentWordSpacing,
    textTransform: contentTextTransform,
  };

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

  const safeAnimationDuration = /^\d+$/.test(String(animationDuration || '400')) ? `${animationDuration || '400'}ms` : (animationDuration || '400ms');

  const scopedCss = `
    #${idCss} .craft-accordion-item {
      background-color: ${itemBgColor || 'transparent'};
      border: ${safeItemBorderWidth} ${itemBorderType || 'solid'} ${itemBorderColor || '#e2e8f0'};
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
      color: ${titleColor || '#1e293b'};
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
      color: ${iconColor || '#1e293b'};
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
      background-color: ${contentBgColor || '#ffffff'};
      border: ${safeContentBorderWidth} ${contentBorderType || 'solid'} ${contentBorderColor || '#e2e8f0'};
      border-radius: ${safeContentBorderRadius};
      padding: ${safeContentPadding};
      color: ${contentColor || '#475569'};
      margin-top: ${safeContentSpacing};
    }
  `;

  const renderIcon = (type: string, svg: string, lucide: string, defaultIconName: string, isOpen: boolean) => {
    if (type === 'none') return null;
    if (type === 'svg' && svg) {
      return <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full h-full flex items-center justify-center" />;
    }
    if (type === 'lucide') {
      const IconComp = getLucideReactComponent(lucide || defaultIconName);
      return IconComp ? <IconComp size="100%" /> : null;
    }
    const IconComp = getLucideReactComponent(defaultIconName);
    return IconComp ? <IconComp size="100%" className={isOpen ? 'rotate-180' : ''} /> : null;
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

      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />

      {items.map((item) => {
        const isOpen = enabled ? !!openItems[item.id] : undefined;
        
        const activeIcon = renderIcon(activeIconType!, activeIconSvg!, activeIconLucide!, 'Minus', isOpen!);
        const inactiveIcon = renderIcon(inactiveIconType!, inactiveIconSvg!, inactiveIconLucide!, 'Plus', isOpen!);
        
        const TitleTag = (titleHtmlTag || 'div') as any;

        return (
          <div
            key={item.id}
            id={item.cssId || undefined}
            className={`craft-accordion-item ${isOpen ? 'active' : ''}`}
            itemScope={faqSchema ? true : undefined}
            itemProp={faqSchema ? "mainEntity" : undefined}
            itemType={faqSchema ? "https://schema.org/Question" : undefined}
          >
            <div
              onClick={(e) => toggleItem(item.id, e)}
              className="craft-accordion-title-wrapper select-none"
            >
              {iconPosition === 'left' && (
                <div className="craft-accordion-icon">
                  {isOpen ? activeIcon : inactiveIcon}
                </div>
              )}
              
              <TitleTag 
                style={titleTypoStyle} 
                className="font-bold font-sans m-0 p-0 flex-1 flex"
                itemProp={faqSchema ? "name" : undefined}
              >
                {item.title}
              </TitleTag>

              {iconPosition === 'right' && (
                <div className="craft-accordion-icon">
                  {isOpen ? activeIcon : inactiveIcon}
                </div>
              )}
            </div>
            
            <div className="craft-accordion-content-wrapper">
              <div className="craft-accordion-content-inner">
                <div
                  className="craft-accordion-content font-sans leading-relaxed whitespace-pre-line"
                  itemScope={faqSchema ? true : undefined}
                  itemProp={faqSchema ? "acceptedAnswer" : undefined}
                  itemType={faqSchema ? "https://schema.org/Answer" : undefined}
                  style={{ display: (!enabled || isOpen) ? 'block' : 'none' }}
                >
                  <div itemProp={faqSchema ? "text" : undefined} className={item.contentType === 'builder' ? 'w-full' : ''}>
                    {mounted && item.contentType === 'builder' ? (
                      <Element
                        id={`acc-content-${item.id}`}
                        is={ResolvedContainer}
                        width="100%"
                        minHeight="50px"
                        paddingTop="10px"
                        paddingBottom="10px"
                        paddingLeft="10px"
                        paddingRight="10px"
                        flexDirection="column"
                        canvas
                      />
                    ) : (
                      item.content
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

AccordionBlock.craft = {
  name: 'AccordionBlock',
  props: {
    ...defaultLayoutProps,
    items: [
      { id: '1', title: 'Mục danh sách #1', content: 'Đây là nội dung trả lời mẫu cho mục số 1. Bạn có thể dễ dàng thay đổi văn bản này trong phần cài đặt bên phải.', cssId: '', contentType: 'text' },
      { id: '2', title: 'Mục danh sách #2', content: 'Đây là nội dung trả lời mẫu cho mục số 2. Kéo thả để thay đổi vị trí các mục theo ý muốn.', cssId: '', contentType: 'text' },
      { id: '3', title: 'Mục danh sách #3', content: 'Bạn có thể tùy chỉnh màu sắc, biểu tượng và hiệu ứng của Sập mở (FAQ) trong phần cài đặt Tương tác và Giao diện.', cssId: '', contentType: 'text' }
    ],
    
    itemAlign: 'left',
    iconPosition: 'right',
    activeIconType: 'default',
    inactiveIconType: 'default',
    titleHtmlTag: 'div',
    faqSchema: false,
    defaultState: 'first',
    maxExpanded: 'one',
    animationDuration: '400',

    itemSpacing: '12px',
    contentSpacing: '0px',
    itemBgType: 'color',
    itemBgColor: 'transparent',
    itemBorderType: 'solid',
    itemBorderColor: '#e2e8f0',
    itemBorderWidth: '1px',
    itemBorderRadius: '6px',
    itemPadding: '0px',

    titleColor: '#1e293b',
    titleColorHover: '#2563eb',
    titleColorActive: '#2563eb',
    iconSize: '15px',
    iconSpacing: '8px',
    iconColor: '#1e293b',
    iconColorHover: '#2563eb',
    iconColorActive: '#2563eb',

    contentBgType: 'color',
    contentBgColor: '#ffffff',
    contentBorderType: 'solid',
    contentBorderColor: '#e2e8f0',
    contentBorderWidth: '1px 0 0 0',
    contentBorderRadius: '0px',
    contentPadding: '12px 16px',
    contentColor: '#475569',
    
    width: '100%',
  },
  displayName: 'Xếp mở (FAQ)',
};



