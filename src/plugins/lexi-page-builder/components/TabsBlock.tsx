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

export interface TabItem {
  id: string;
  title: string;
  iconType?: 'none' | 'svg' | 'lucide';
  iconSvg?: string;
  iconLucide?: string;
  cssId?: string;
  contentType?: 'text' | 'builder';
  content?: string;
}

export interface TabsBlockProps extends Partial<CommonLayoutProps> {
  items?: TabItem[];
  direction?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end' | 'justify';
  titleAlign?: 'left' | 'center' | 'right';
  horizontalScroll?: 'on' | 'off';
  breakpoint?: 'none' | 'mobile' | 'tablet';

  // Style > Spacing
  tabSpacing?: string;
  contentSpacing?: string;

  // Style > Tab Wrapper
  tabBgType?: 'color' | 'image';
  tabBgColor?: string;
  tabBgColorHover?: string;
  tabBgColorActive?: string;
  tabBorderType?: string;
  tabBorderColor?: string;
  tabBorderWidth?: string;
  tabBorderRadius?: string;
  tabPadding?: string;
  tabBoxShadow?: string;

  // Style > Title
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
  iconPosition?: 'top' | 'right' | 'bottom' | 'left';
  iconSize?: string;
  iconSpacing?: string;
  iconColor?: string;
  iconColorHover?: string;
  iconColorActive?: string;

  // Style > Content
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

export const TabsBlock = (rawProps: TabsBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    items = [
      { id: '1', title: 'Tab #1', content: 'Nội dung hiển thị mẫu cho Tab số 1. Bạn có thể kéo thả bất kỳ thành phần nào vào đây hoặc đổi sang định dạng văn bản.', cssId: '', contentType: 'text' },
      { id: '2', title: 'Tab #2', content: 'Nội dung hiển thị mẫu cho Tab số 2. Chỉnh sửa dễ dàng với bảng thuộc tính bên phải.', cssId: '', contentType: 'text' },
      { id: '3', title: 'Tab số 3', content: 'Nội dung hiển thị mẫu cho Tab số 3. Tạo hiệu ứng tab đẹp mắt, chuyên nghiệp như Elementor.', cssId: '', contentType: 'text' }
    ],
    direction = 'top',
    align = 'start',
    titleAlign = 'left',
    horizontalScroll = 'off',
    breakpoint = 'mobile',

    tabSpacing = '8px',
    contentSpacing = '12px',

    tabBgType = 'color',
    tabBgColor = '#f8fafc',
    tabBgColorHover = '#cbd5e1',
    tabBgColorActive = '#3b82f6',
    tabBorderType = 'solid',
    tabBorderColor = '#e2e8f0',
    tabBorderWidth = '1px',
    tabBorderRadius = '6px',
    tabPadding = '8px 16px',
    tabBoxShadow = '',

    titleFontFamily = '',
    titleFontSize = '13px',
    titleFontWeight = '600',
    titleFontStyle = '',
    titleTextDecoration = '',
    titleLineHeight = '',
    titleLetterSpacing = '',
    titleWordSpacing = '',
    titleTextTransform = '',

    titleColor = '#475569',
    titleColorHover = '#0f172a',
    titleColorActive = '#ffffff',
    titleTextShadow = '',
    titleTextShadowHover = '',
    titleTextShadowActive = '',
    titleTextStroke = '',
    titleTextStrokeHover = '',
    titleTextStrokeActive = '',

    iconPosition = 'left',
    iconSize = '14px',
    iconSpacing = '6px',
    iconColor = '#64748b',
    iconColorHover = '#0f172a',
    iconColorActive = '#ffffff',

    contentBgType = 'color',
    contentBgColor = '#ffffff',
    contentBorderType = 'solid',
    contentBorderColor = '#e2e8f0',
    contentBorderWidth = '1px',
    contentBorderRadius = '8px',
    contentPadding = '16px',
    contentColor = '#334155',

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
  const [activeTabId, setActiveTabId] = useState<string>('');
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
    if (items.length > 0) {
      if (!activeTabId || !items.some(item => item.id === activeTabId)) {
        setActiveTabId(items[0].id);
      }
    } else {
      setActiveTabId('');
    }
  }, [items, activeTabId]);

  const mappedProps = {
    ...props,
    advancedBgType: props.advancedBgType || 'classic',
    borderType: props.borderType || 'none',
  };

  const { wrapperStyle, idCss: rawIdCss, classCss } = getWrapperStyles(mappedProps as any, 'block', id);
  const idCss = props.idCss || `tabs-${id}`;

  const mergedWrapperStyle: React.CSSProperties = {
    ...wrapperStyle,
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
      border: ${safeTabBorderWidth} ${tabBorderType || 'solid'} ${tabBorderColor || '#e2e8f0'};
      border-radius: ${safeTabBorderRadius};
      padding: ${safeTabPadding};
      color: ${titleColor || '#475569'};
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
      background-color: ${tabBgColorActive || '#3b82f6'};
      color: ${titleColorActive || '#ffffff'};
      ${titleTextShadowActive ? `text-shadow: ${titleTextShadowActive};` : ''}
      ${titleTextStrokeActive ? `-webkit-text-stroke: ${titleTextStrokeActive};` : ''}
    }

    #${idCss} .craft-tab-icon {
      font-size: ${safeIconSize};
      width: ${safeIconSize};
      height: ${safeIconSize};
      color: ${iconColor || 'inherit'};
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
      background-color: ${contentBgColor || '#ffffff'};
      border: ${safeContentBorderWidth} ${contentBorderType || 'solid'} ${contentBorderColor || '#e2e8f0'};
      border-radius: ${safeContentBorderRadius};
      padding: ${safeContentPadding};
      color: ${contentColor || '#334155'};
      flex-grow: 1;
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
  `;

  const renderIcon = (type?: string, svg?: string, lucide?: string, active?: boolean) => {
    if (!type || type === 'none') return null;
    if (type === 'svg' && svg) {
      return <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full h-full flex items-center justify-center" />;
    }
    if (type === 'lucide') {
      const IconComp = getLucideReactComponent(lucide || 'Folder');
      return IconComp ? <IconComp size="100%" /> : null;
    }
    return null;
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

      <div className="craft-tabs-wrapper font-sans">
        {/* Headers list */}
        <div className="craft-tabs-header">
          {items.map((item) => {
            const isActive = item.id === activeTabId;
            const iconElem = renderIcon(item.iconType, item.iconSvg, item.iconLucide, isActive);

            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveTabId(item.id);
                }}
                className={`craft-tab-btn select-none ${isActive ? 'active' : ''}`}
                style={titleTypoStyle}
              >
                {item.iconType && item.iconType !== 'none' && (
                  <div className="craft-tab-icon">
                    {iconElem}
                  </div>
                )}
                <span className="font-semibold">{item.title}</span>
              </div>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="craft-tabs-content-pane">
          {items.map((item) => {
            const isActive = item.id === activeTabId;

            return (
              <div
                key={item.id}
                id={item.cssId || undefined}
                className="craft-tab-content-inner"
                style={{ display: isActive ? 'block' : 'none' }}
              >
                {mounted && item.contentType === 'builder' ? (
                  <div className="w-full">
                    <Element
                      id={`tabs-content-${item.id}`}
                      is={ResolvedContainer}
                      width="100%"
                      minHeight="100px"
                      paddingTop="12px"
                      paddingBottom="12px"
                      paddingLeft="12px"
                      paddingRight="12px"
                      flexDirection="column"
                      canvas
                    />
                  </div>
                ) : (
                  <div style={contentTypoStyle} className="leading-relaxed whitespace-pre-line text-sm">
                    {item.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

TabsBlock.craft = {
  name: 'TabsBlock',
  props: {
    ...defaultLayoutProps,
    items: [
      { id: '1', title: 'Tab #1', content: 'Nội dung hiển thị mẫu cho Tab số 1. Bạn có thể kéo thả bất kỳ thành phần nào vào đây hoặc đổi sang định dạng văn bản.', cssId: '', contentType: 'text' },
      { id: '2', title: 'Tab #2', content: 'Nội dung hiển thị mẫu cho Tab số 2. Chỉnh sửa dễ dàng với bảng thuộc tính bên phải.', cssId: '', contentType: 'text' },
      { id: '3', title: 'Tab số 3', content: 'Nội dung hiển thị mẫu cho Tab số 3. Tạo hiệu ứng tab đẹp mắt, chuyên nghiệp như Elementor.', cssId: '', contentType: 'text' }
    ],
    direction: 'top',
    align: 'start',
    titleAlign: 'left',
    horizontalScroll: 'off',
    breakpoint: 'mobile',

    tabSpacing: '8px',
    contentSpacing: '12px',

    tabBgType: 'color',
    tabBgColor: '#f8fafc',
    tabBgColorHover: '#cbd5e1',
    tabBgColorActive: '#3b82f6',
    tabBorderType: 'solid',
    tabBorderColor: '#e2e8f0',
    tabBorderWidth: '1px',
    tabBorderRadius: '6px',
    tabPadding: '8px 16px',
    tabBoxShadow: 'none',

    titleColor: '#475569',
    titleColorHover: '#0f172a',
    titleColorActive: '#ffffff',
    titleFontWeight: '600',
    titleFontSize: '13px',

    iconPosition: 'left',
    iconSize: '14px',
    iconSpacing: '6px',
    iconColor: '#64748b',
    iconColorHover: '#0f172a',
    iconColorActive: '#ffffff',

    contentBgType: 'color',
    contentBgColor: '#ffffff',
    contentBorderType: 'solid',
    contentBorderColor: '#e2e8f0',
    contentBorderWidth: '1px',
    contentBorderRadius: '8px',
    contentPadding: '16px',
    contentColor: '#334155',

    width: '100%',
  },
  displayName: 'Tabs',
};



