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

export interface MenuItem {
  id?: string;
  label: string;
  url: string;
  indent?: number;
  isMega?: boolean;
  description?: string;
  icon?: string;
}

export interface Level2Item extends MenuItem {}

export interface Level1Item extends MenuItem {
  children: Level2Item[];
}

export interface Level0Item extends MenuItem {
  children: Level1Item[];
}

export interface MenuBlockProps extends CommonLayoutProps {
  // === TAB NỘI DUNG ===
  menuSource?: 'managed' | 'header' | 'footer' | 'custom';
  menuId?: number;
  customItems?: MenuItem[];
  resolvedItems?: MenuItem[];
  menuLayout?: 'horizontal' | 'vertical' | 'dropdown';
  align?: 'left' | 'center' | 'right' | 'space-between';
  mobileBreakpoint?: 'tablet' | 'mobile' | 'none';
  contentWidth?: 'full' | 'boxed';
  indicatorIcon?: string;
  indicatorActiveIcon?: string;
  dropdownEffect?: 'none' | 'fade' | 'slide' | 'zoom';

  // === STYLE: Menu Items ===
  itemGap?: string;
  distanceFromContent?: string;
  // Typography
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: 'normal' | 'italic';
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
  textDecoration?: string;
  // States (Normal/Hover/Active)
  textColor?: string;
  textShadow?: string;
  itemBgColor?: string;
  textColorHover?: string;
  textShadowHover?: string;
  itemBgColorHover?: string;
  textColorActive?: string;
  textShadowActive?: string;
  itemBgColorActive?: string;
  // Border, Shadow
  itemBorderType?: string;
  itemBorderWidth?: string;
  itemBorderColor?: string;
  itemBoxShadow?: string;
  // Divider
  showDivider?: boolean;
  dividerColor?: string;
  dividerWidth?: string;
  dividerHeight?: string;
  // Border Radius (4 corners)
  itemBorderRadius?: string;
  itemBorderTopLeftRadius?: string;
  itemBorderTopRightRadius?: string;
  itemBorderBottomRightRadius?: string;
  itemBorderBottomLeftRadius?: string;
  // Padding (4 sides)
  itemPaddingTop?: string;
  itemPaddingRight?: string;
  itemPaddingBottom?: string;
  itemPaddingLeft?: string;

  // === STYLE: Icon ===
  iconPosition?: 'left' | 'right' | 'top' | 'bottom' | 'hidden';
  iconSize?: string;
  iconSpacing?: string;
  iconColor?: string;
  iconColorHover?: string;
  iconColorActive?: string;

  // === STYLE: Dropdown Indicator ===
  indicatorSize?: string;
  indicatorRotate?: string;
  indicatorSpace?: string;
  indicatorColor?: string;
  indicatorColorHover?: string;
  indicatorColorActive?: string;

  // === STYLE: Menu Toggle (Hamburger) ===
  toggleIcon?: string;
  toggleSize?: string;
  toggleColor?: string;
  toggleBgColor?: string;
  toggleColorHover?: string;
  toggleBgColorHover?: string;
  toggleBorderType?: string;
  toggleBorderWidth?: string;
  toggleBorderColor?: string;
  toggleBoxShadow?: string;
  toggleBorderRadius?: string;
  togglePaddingTop?: string;
  togglePaddingRight?: string;
  togglePaddingBottom?: string;
  togglePaddingLeft?: string;
  toggleDistanceFromDropdown?: string;

  // === STYLE: Content (Nav wrapper) ===
  contentBgColor?: string;
  contentBorderType?: string;
  contentBorderWidth?: string;
  contentBorderColor?: string;
  contentBorderRadius?: string;
  contentBoxShadow?: string;
  contentPaddingTop?: string;
  contentPaddingRight?: string;
  contentPaddingBottom?: string;
  contentPaddingLeft?: string;

  // === STYLE: Dropdown Menu ===
  dropdownTextColor?: string;
  dropdownTextColorActive?: string;
  dropdownItemBgColor?: string;
  dropdownItemBgColorActive?: string;
  dropdownItemBoxShadow?: string;
  dropdownBorderType?: string;
  dropdownBorderWidth?: string;
  dropdownBorderColor?: string;
  dropdownBorderRadius?: string;
  dropdownBoxShadow?: string;
}

export const buildMenuTree = (flatList: MenuItem[]): Level0Item[] => {
  const tree: Level0Item[] = [];
  let currentL0: Level0Item | null = null;
  let currentL1: Level1Item | null = null;

  flatList.forEach((item) => {
    const indent = item.indent || 0;
    
    if (indent === 0) {
      const node: Level0Item = { ...item, children: [] };
      tree.push(node);
      currentL0 = node;
      currentL1 = null;
    } else if (indent === 1) {
      const node: Level1Item = { ...item, children: [] };
      if (currentL0) {
        currentL0.children.push(node);
      } else {
        const rootFallback: Level0Item = { id: 'fallback', label: '', url: '#', children: [node] };
        tree.push(rootFallback);
        currentL0 = rootFallback;
      }
      currentL1 = node;
    } else if (indent === 2) {
      const node: Level2Item = { ...item };
      if (currentL1) {
        currentL1.children.push(node);
      } else if (currentL0) {
        const columnFallback: Level1Item = { id: 'col_fallback', label: '', url: '#', children: [node] };
        currentL0.children.push(columnFallback);
        currentL1 = columnFallback;
      } else {
        const rootFallback: Level0Item = { 
          id: 'fallback_root', 
          label: '', 
          url: '#', 
          children: [{ id: 'col_fallback', label: '', url: '#', children: [node] }] 
        };
        tree.push(rootFallback);
        currentL0 = rootFallback;
        currentL1 = rootFallback.children[0];
      }
    }
  });
  return tree;
};

export const MenuBlock = (rawProps: MenuBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    menuSource = 'header',
    menuId,
    customItems = [
      { id: '1', label: 'Trang chá»§', url: '/', indent: 0 },
      { id: '2', label: 'Dá»‹ch vá»¥', url: '#', indent: 0 },
      { id: '3', label: 'Dá»‹ch vá»¥ 1', url: '/dich-vu-1', indent: 1 },
      { id: '4', label: 'Dá»‹ch vá»¥ 2', url: '/dich-vu-2', indent: 1 },
      { id: '5', label: 'LiÃªn há»‡', url: '/lien-he', indent: 0 }
    ],
    resolvedItems = [],
    menuLayout = 'horizontal',
    align = 'left',
    mobileBreakpoint = 'mobile',
    contentWidth = 'full',
    indicatorIcon = 'chevron',
    indicatorActiveIcon = 'chevron',
    dropdownEffect = 'fade',

    // Item styles
    itemGap = '20px',
    distanceFromContent = '0px',
    fontSize = '14px',
    fontWeight = '600',
    fontFamily = 'var(--site-font-family-body)',
    fontStyle = 'normal',
    lineHeight = '1.5',
    letterSpacing = '0px',
    textTransform = 'none',
    textDecoration = 'none',
    textColor = '#334155',
    textShadow = '',
    itemBgColor = 'transparent',
    textColorHover = '#3b82f6',
    textShadowHover = '',
    itemBgColorHover = 'transparent',
    textColorActive = '#3b82f6',
    textShadowActive = '',
    itemBgColorActive = 'transparent',

    itemBorderType = 'none',
    itemBorderWidth = '1px',
    itemBorderColor = '#e2e8f0',
    itemBoxShadow = '',

    showDivider = false,
    dividerColor = '#cbd5e1',
    dividerWidth = '1px',
    dividerHeight = '16px',

    itemBorderRadius = '0px',
    itemBorderTopLeftRadius = '',
    itemBorderTopRightRadius = '',
    itemBorderBottomRightRadius = '',
    itemBorderBottomLeftRadius = '',

    itemPaddingTop = '8px',
    itemPaddingRight = '12px',
    itemPaddingBottom = '8px',
    itemPaddingLeft = '12px',

    // Icon
    iconPosition = 'left',
    iconSize = '14px',
    iconSpacing = '6px',
    iconColor = '#64748b',
    iconColorHover = '#3b82f6',
    iconColorActive = '#3b82f6',

    // Dropdown indicator
    indicatorSize = '12px',
    indicatorRotate = '180',
    indicatorSpace = '4px',
    indicatorColor = '#64748b',
    indicatorColorHover = '#3b82f6',
    indicatorColorActive = '#3b82f6',

    // Mobile Hamburger Toggle
    toggleIcon = 'Menu',
    toggleSize = '20px',
    toggleColor = '#334155',
    toggleBgColor = 'transparent',
    toggleColorHover = '#3b82f6',
    toggleBgColorHover = 'transparent',
    toggleBorderType = 'none',
    toggleBorderWidth = '1px',
    toggleBorderColor = '#e2e8f0',
    toggleBoxShadow = '',
    toggleBorderRadius = '4px',
    togglePaddingTop = '8px',
    togglePaddingRight = '8px',
    togglePaddingBottom = '8px',
    togglePaddingLeft = '8px',
    toggleDistanceFromDropdown = '0px',

    // Content container wrapper
    contentBgColor = 'transparent',
    contentBorderType = 'none',
    contentBorderWidth = '1px',
    contentBorderColor = '#e2e8f0',
    contentBorderRadius = '0px',
    contentBoxShadow = '',
    contentPaddingTop = '0px',
    contentPaddingRight = '0px',
    contentPaddingBottom = '0px',
    contentPaddingLeft = '0px',

    // Dropdown box and items
    dropdownTextColor = '#334155',
    dropdownTextColorActive = '#3b82f6',
    dropdownItemBgColor = '#ffffff',
    dropdownItemBgColorActive = '#f8fafc',
    dropdownItemBoxShadow = '',
    dropdownBorderType = 'solid',
    dropdownBorderWidth = '1px',
    dropdownBorderColor = '#cbd5e1',
    dropdownBorderRadius = '6px',
    dropdownBoxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)',

    className = '',
  } = props;

  // 1. useNode()
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

  // 2. useEditor()
  const { enabled, actions: editorActions } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  // 3. States
  const [hovered, setHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // 4. Fetch menu data
  useEffect(() => {
    if (menuSource === 'custom') {
      setMenuItems(customItems || []);
      if (enabled && JSON.stringify(resolvedItems) !== JSON.stringify(customItems)) {
        setProp((p: any) => { p.resolvedItems = customItems; }, 500);
      }
      return;
    }

    if (menuSource === 'managed' && menuId) {
      fetch(`/api/navigation/menus/${menuId}`)
        .then((res) => res.json())
        .then((data) => setMenuItems(data?.success ? data.menu.items || [] : []))
        .catch(() => setMenuItems([]));
      return;
    }

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!data?.settings) return setMenuItems([]);
        const key = menuSource === 'header' ? 'theme_menu_header' : 'theme_menu_footer';
        try {
          const parsed = JSON.parse(data.settings[key] || '[]');
          setMenuItems(parsed);
          if (enabled && JSON.stringify(resolvedItems) !== JSON.stringify(parsed)) {
            setProp((p: any) => { p.resolvedItems = parsed; }, 500);
          }
        } catch {
          setMenuItems([]);
        }
      })
      .catch(() => setMenuItems([]));
  }, [menuSource, menuId, customItems, enabled]);

  // 5. Build tree
  const menuTree = buildMenuTree(menuItems);

  // 6. Context menu listener
  useEffect(() => {
    const handleCloseContextMenus = (event: Event) => {
      const activeId = (event as CustomEvent<string>).detail;
      if (activeId !== id) setContextMenu(null);
    };
    window.addEventListener('craft-close-context-menus', handleCloseContextMenus);
    return () => window.removeEventListener('craft-close-context-menus', handleCloseContextMenus);
  }, [id]);

  // 7. Wrapper styles
  const mappedProps = {
    ...props,
    advancedBgType: props.advancedBgType || 'classic',
    borderType: props.borderType || 'none',
  };
  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'block', id);

  // 8. Position drag
  const { handlePositionMouseDown } = usePositionDrag({
    id, enabled, isLocked, props, setProp,
  });

  const getStyleVal = (val: string | undefined, fallback: string = '') => {
    if (val === undefined || val === '') return fallback;
    return val;
  };

  const getBorderRadiusStyles = () => {
    if (itemBorderRadius && itemBorderRadius !== '0px') {
      return { borderRadius: itemBorderRadius };
    }
    return {
      borderTopLeftRadius: getStyleVal(itemBorderTopLeftRadius, '0px'),
      borderTopRightRadius: getStyleVal(itemBorderTopRightRadius, '0px'),
      borderBottomRightRadius: getStyleVal(itemBorderBottomRightRadius, '0px'),
      borderBottomLeftRadius: getStyleVal(itemBorderBottomLeftRadius, '0px'),
    };
  };

  const getPaddingStyles = () => {
    return {
      paddingTop: getStyleVal(itemPaddingTop, '8px'),
      paddingRight: getStyleVal(itemPaddingRight, '12px'),
      paddingBottom: getStyleVal(itemPaddingBottom, '8px'),
      paddingLeft: getStyleVal(itemPaddingLeft, '12px'),
    };
  };

  // Icon component helper
  const renderIconComponent = (iconName?: string, state: 'normal' | 'hover' | 'active' = 'normal') => {
    if (!iconName) return null;
    const IconComp = getLucideReactComponent(iconName);
    if (!IconComp) return null;
    
    let color = iconColor;
    if (state === 'hover') color = iconColorHover || iconColor;
    if (state === 'active') color = iconColorActive || iconColor;

    return <IconComp size={parseFloat(iconSize) || 14} style={{ color }} />;
  };

  // Dropdown Indicator Helper
  const renderDropdownIndicator = (state: 'normal' | 'hover' | 'active' = 'normal') => {
    const selectedIcon = state === 'active' ? indicatorActiveIcon : indicatorIcon;
    if (selectedIcon === 'none') return null;

    const iconMap: Record<string, string> = {
      chevron: state === 'active' ? 'ChevronUp' : 'ChevronDown',
      Chevron: state === 'active' ? 'ChevronUp' : 'ChevronDown',
      ChevronDown: state === 'active' ? 'ChevronUp' : 'ChevronDown',
      caret: state === 'active' ? 'CaretUp' : 'CaretDown',
      Caret: state === 'active' ? 'CaretUp' : 'CaretDown',
      CaretDown: state === 'active' ? 'CaretUp' : 'CaretDown',
      plus: 'Plus',
      Plus: 'Plus',
      minus: 'Minus',
      Minus: 'Minus',
    };
    const IconComp = getLucideReactComponent(iconMap[selectedIcon || 'chevron'] || selectedIcon || 'ChevronDown');
    if (!IconComp) return null;

    let color = indicatorColor;
    if (state === 'hover') color = indicatorColorHover || indicatorColor;
    if (state === 'active') color = indicatorColorActive || indicatorColor;

    return (
      <span
        className="craft-menu-indicator transition-transform duration-200"
        style={{
          display: 'inline-flex',
          marginLeft: indicatorSpace,
          color,
          fontSize: indicatorSize,
        }}
      >
        <IconComp size={parseFloat(indicatorSize) || 12} />
      </span>
    );
  };

  const getDropdownEffectClass = () => {
    switch (dropdownEffect) {
      case 'none': return 'translate-y-0';
      case 'slide': return '-translate-y-3';
      case 'zoom': return 'scale-95';
      case 'fade':
      default: return 'translate-y-0';
    }
  };

  const currentId = idCss || id;

  // Render horizontal menu tree
  const renderHorizontalTree = () => {
    return (
      <ul className={`flex flex-wrap items-center ${
        align === 'left' ? 'justify-start' :
        align === 'center' ? 'justify-center' :
        align === 'right' ? 'justify-end' : 'justify-between'
      } w-full`} style={{ gap: align === 'space-between' ? undefined : itemGap }}>
        {menuTree.map((item, idx) => {
          const hasChildren = item.children && item.children.length > 0;
          return (
            <li
              key={item.id || idx}
              className="relative group craft-menu-item-container"
              onMouseEnter={() => !enabled && setActiveDropdownId(item.id || String(idx))}
              onMouseLeave={() => !enabled && setActiveDropdownId(null)}
            >
              <a
                href={enabled ? undefined : item.url}
                className="craft-menu-item flex items-center transition-all duration-200"
                style={{
                  fontFamily,
                  fontSize,
                  fontWeight,
                  fontStyle,
                  lineHeight,
                  letterSpacing,
                  textTransform,
                  textDecoration,
                  color: textColor,
                  backgroundColor: itemBgColor,
                  borderStyle: itemBorderType as any,
                  borderWidth: itemBorderWidth,
                  borderColor: itemBorderColor,
                  boxShadow: itemBoxShadow,
                  ...getBorderRadiusStyles(),
                  ...getPaddingStyles(),
                }}
              >
                {iconPosition === 'left' && renderIconComponent(item.icon)}
                {iconPosition === 'top' && (
                  <div className="flex flex-col items-center">
                    {renderIconComponent(item.icon)}
                    <span style={{ marginTop: iconSpacing }}>{item.label}</span>
                  </div>
                )}
                {iconPosition !== 'top' && iconPosition !== 'bottom' && (
                  <span style={{ marginLeft: iconPosition === 'left' && item.icon ? iconSpacing : '0px', marginRight: iconPosition === 'right' && item.icon ? iconSpacing : '0px' }}>
                    {item.label}
                  </span>
                )}
                {iconPosition === 'bottom' && (
                  <div className="flex flex-col items-center">
                    <span>{item.label}</span>
                    {renderIconComponent(item.icon)}
                  </div>
                )}
                {iconPosition === 'right' && renderIconComponent(item.icon)}
                {hasChildren && renderDropdownIndicator()}
              </a>

              {/* Submenu dropdown */}
              {hasChildren && (
                <div
                  className={`absolute left-0 mt-[var(--dist-content)] z-50 w-56 transition-all duration-200 rounded-md shadow-lg bg-white border border-slate-200 py-1 origin-top-left
                    ${enabled ? 'hidden group-hover:block' : (activeDropdownId === (item.id || String(idx)) ? 'opacity-100 visible translate-y-0 scale-100' : `opacity-0 invisible ${getDropdownEffectClass()} pointer-events-none`)}
                  `}
                  style={{
                    backgroundColor: dropdownItemBgColor,
                    borderColor: dropdownBorderColor,
                    borderStyle: dropdownBorderType as any,
                    borderWidth: dropdownBorderWidth,
                    borderRadius: dropdownBorderRadius,
                    boxShadow: dropdownBoxShadow,
                    top: `calc(100% + ${distanceFromContent})`,
                  }}
                >
                  <ul className="py-1">
                    {item.children.map((child, cIdx) => {
                      const hasL2 = child.children && child.children.length > 0;
                      return (
                        <li key={child.id || cIdx} className="relative group/sub px-1 py-0.5">
                          <a
                            href={enabled ? undefined : child.url}
                            className="craft-dropdown-item flex items-center justify-between px-3 py-2 text-sm transition-colors duration-150 rounded-md"
                            style={{
                              color: dropdownTextColor,
                            }}
                          >
                            <span className="flex items-center">
                              {renderIconComponent(child.icon)}
                              <span style={{ marginLeft: child.icon ? '6px' : '0px' }}>{child.label}</span>
                            </span>
                            {hasL2 && (
                              <IconsChevronRight className="w-4 h-4 ml-1" />
                            )}
                          </a>
                          
                          {/* Third level nested dropdown */}
                          {hasL2 && (
                            <div
                              className="absolute left-full top-0 ml-1 z-50 w-52 bg-white border border-slate-200 rounded-md shadow-lg py-1 hidden group-hover/sub:block"
                              style={{
                                backgroundColor: dropdownItemBgColor,
                                borderColor: dropdownBorderColor,
                                borderStyle: dropdownBorderType as any,
                                borderWidth: dropdownBorderWidth,
                                borderRadius: dropdownBorderRadius,
                                boxShadow: dropdownBoxShadow,
                              }}
                            >
                              <ul className="py-1">
                                {child.children.map((subChild, scIdx) => (
                                  <li key={subChild.id || scIdx} className="px-1 py-0.5">
                                    <a
                                      href={enabled ? undefined : subChild.url}
                                      className="craft-dropdown-item flex items-center px-3 py-2 text-sm transition-colors duration-150 rounded-md"
                                      style={{
                                        color: dropdownTextColor,
                                      }}
                                    >
                                      {renderIconComponent(subChild.icon)}
                                      <span style={{ marginLeft: subChild.icon ? '6px' : '0px' }}>{subChild.label}</span>
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const IconsChevronRight = ({ className }: { className?: string }) => {
    const IconComp = getLucideReactComponent('ChevronRight');
    if (!IconComp) return null;
    return <IconComp className={className} size={14} />;
  };

  const HamburgerIcon = getLucideReactComponent(toggleIcon || 'Menu') || getLucideReactComponent('Menu');
  const ChevronDownIcon = getLucideReactComponent('ChevronDown') || getLucideReactComponent('ChevronDown');

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      id={currentId}
      style={{
        ...wrapperStyle,
        backgroundColor: contentBgColor,
        borderStyle: contentBorderType as any,
        borderWidth: contentBorderWidth,
        borderColor: contentBorderColor,
        borderRadius: contentBorderRadius,
        boxShadow: contentBoxShadow,
        paddingTop: getStyleVal(contentPaddingTop, '0px'),
        paddingRight: getStyleVal(contentPaddingRight, '0px'),
        paddingBottom: getStyleVal(contentPaddingBottom, '0px'),
        paddingLeft: getStyleVal(contentPaddingLeft, '0px'),
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
          e.preventDefault(); e.stopPropagation();
          if (parentId && parentId !== 'ROOT') editorActions.selectNode(parentId);
        }
      }}
      onMouseEnter={() => { if (enabled && !isLocked) setHovered(true); }}
      onMouseLeave={() => { if (enabled && !isLocked) setHovered(false); }}
      onContextMenu={(e) => {
        if (!enabled) return;
        e.preventDefault(); e.stopPropagation();
        window.dispatchEvent(new CustomEvent('craft-close-context-menus', { detail: id }));
        editorActions.selectNode(id);
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        #${currentId} .craft-menu-item:hover {
          color: ${textColorHover || textColor} !important;
          background-color: ${itemBgColorHover || itemBgColor} !important;
        }
        #${currentId} .craft-menu-item:hover .craft-menu-indicator {
          color: ${indicatorColorHover || indicatorColor} !important;
        }
        #${currentId} .craft-menu-item.active {
          color: ${textColorActive || textColor} !important;
          background-color: ${itemBgColorActive || itemBgColor} !important;
        }
        #${currentId} .craft-dropdown-item:hover {
          color: ${dropdownTextColorActive || dropdownTextColor} !important;
          background-color: ${dropdownItemBgColorActive || dropdownItemBgColor} !important;
        }
        #${currentId} .craft-menu-toggle:hover {
          color: ${toggleColorHover || toggleColor} !important;
          background-color: ${toggleBgColorHover || toggleBgColor} !important;
        }
      `}} />

      {/* Editor hover badge */}
      {enabled && (hovered || selected) && !isLocked && (
        <div
          onClick={(e) => { e.stopPropagation(); editorActions.selectNode(id); }}
          className="editor-hover-badge absolute top-0 right-0 bg-purple-500 hover:bg-purple-600 text-white h-5 w-5 z-40 rounded-bl-sm shadow-md select-none animate-fade-in flex items-center justify-center cursor-pointer"
          title={`Sửa ${displayName.toLowerCase()}`}
        >
          <Pencil size={10} strokeWidth={2.5} />
        </div>
      )}

      {/* Context menu (FloatingToolbar) */}
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

      <nav
        className={`w-full flex ${
          align === 'left' ? 'justify-start' :
          align === 'center' ? 'justify-center' :
          align === 'right' ? 'justify-end' : 'justify-between'
        }`}
      >
        <div className={contentWidth === 'boxed' ? 'w-full max-w-screen-xl mx-auto' : 'w-full'}>
        {/* Desktop View (Horizontal / Vertical) */}
        <div className={`${menuLayout === 'dropdown' ? 'hidden' : 'hidden md:block'} w-full`}>
          {menuLayout === 'horizontal' ? (
            renderHorizontalTree()
          ) : (
            // Vertical menu layout
            <ul className="flex flex-col w-full" style={{ gap: itemGap }}>
              {menuTree.map((item, idx) => {
                const hasChildren = item.children && item.children.length > 0;
                return (
                  <li key={item.id || idx} className="w-full">
                    <a
                      href={enabled ? undefined : item.url}
                      className="craft-menu-item flex items-center justify-between transition-all duration-200"
                      style={{
                        fontFamily,
                        fontSize,
                        fontWeight,
                        fontStyle,
                        lineHeight,
                        letterSpacing,
                        textTransform,
                        textDecoration,
                        color: textColor,
                        backgroundColor: itemBgColor,
                        borderStyle: itemBorderType as any,
                        borderWidth: itemBorderWidth,
                        borderColor: itemBorderColor,
                        boxShadow: itemBoxShadow,
                        ...getBorderRadiusStyles(),
                        ...getPaddingStyles(),
                      }}
                    >
                      <span className="flex items-center">
                        {renderIconComponent(item.icon)}
                        <span style={{ marginLeft: item.icon ? iconSpacing : '0px' }}>{item.label}</span>
                      </span>
                      {hasChildren && renderDropdownIndicator()}
                    </a>

                    {/* Submenu for vertical */}
                    {hasChildren && (
                      <ul className="pl-4 mt-1 space-y-1">
                        {item.children.map((child, cIdx) => (
                          <li key={child.id || cIdx}>
                            <a
                              href={enabled ? undefined : child.url}
                              className="craft-dropdown-item flex items-center px-3 py-1.5 text-sm transition-colors duration-150 rounded-md"
                              style={{
                                color: dropdownTextColor,
                              }}
                            >
                              {renderIconComponent(child.icon)}
                              <span style={{ marginLeft: child.icon ? '6px' : '0px' }}>{child.label}</span>
                            </a>
                            {child.children && child.children.length > 0 && (
                              <ul className="pl-4 mt-0.5 space-y-0.5">
                                {child.children.map((subChild, scIdx) => (
                                  <li key={subChild.id || scIdx}>
                                    <a
                                      href={enabled ? undefined : subChild.url}
                                      className="craft-dropdown-item flex items-center px-3 py-1 text-xs transition-colors duration-150 rounded-md"
                                      style={{
                                        color: dropdownTextColor,
                                      }}
                                    >
                                      {renderIconComponent(subChild.icon)}
                                      <span style={{ marginLeft: subChild.icon ? '6px' : '0px' }}>{subChild.label}</span>
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Mobile Hamburger toggle / Dropdown Mode */}
        <div className={`${menuLayout === 'dropdown' ? 'flex' : 'md:hidden flex'} w-full flex-col items-stretch relative`}>
          <div className={`flex ${
            align === 'left' ? 'justify-start' :
            align === 'center' ? 'justify-center' :
            align === 'right' ? 'justify-end' : 'justify-between'
          }`}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="craft-menu-toggle transition-all duration-200 flex items-center justify-center"
              style={{
                color: toggleColor,
                backgroundColor: toggleBgColor,
                borderStyle: toggleBorderType as any,
                borderWidth: toggleBorderWidth,
                borderColor: toggleBorderColor,
                borderRadius: toggleBorderRadius,
                boxShadow: toggleBoxShadow,
                paddingTop: getStyleVal(togglePaddingTop, '8px'),
                paddingRight: getStyleVal(togglePaddingRight, '8px'),
                paddingBottom: getStyleVal(togglePaddingBottom, '8px'),
                paddingLeft: getStyleVal(togglePaddingLeft, '8px'),
              }}
            >
              {HamburgerIcon && <HamburgerIcon size={parseFloat(toggleSize) || 20} />}
            </button>
          </div>

          {/* Mobile menu dropdown */}
          <div
            className={`w-full mt-2 rounded-md shadow-lg border border-slate-200 py-1 transition-all duration-200 bg-white
              ${enabled ? 'hidden group-hover:block' : (mobileMenuOpen ? 'block' : 'hidden')}
            `}
            style={{
              backgroundColor: dropdownItemBgColor,
              borderColor: dropdownBorderColor,
              borderStyle: dropdownBorderType as any,
              borderWidth: dropdownBorderWidth,
              borderRadius: dropdownBorderRadius,
              boxShadow: dropdownBoxShadow,
              marginTop: toggleDistanceFromDropdown,
            }}
          >
            <ul className="py-1 flex flex-col space-y-1">
              {menuTree.map((item, idx) => {
                const hasChildren = item.children && item.children.length > 0;
                return (
                  <li key={item.id || idx} className="px-1">
                    <div className="flex items-center justify-between">
                      <a
                        href={enabled ? undefined : item.url}
                        className="craft-dropdown-item flex-grow flex items-center px-3 py-2 text-sm rounded-md"
                        style={{
                          color: dropdownTextColor,
                        }}
                      >
                        {renderIconComponent(item.icon)}
                        <span style={{ marginLeft: item.icon ? '6px' : '0px' }}>{item.label}</span>
                      </a>
                      {hasChildren && (
                        <button
                          type="button"
                          onClick={() => setActiveDropdownId(activeDropdownId === item.id ? null : (item.id || String(idx)))}
                          className="p-2 text-slate-400 hover:text-slate-600"
                        >
                          {ChevronDownIcon && (
                            <ChevronDownIcon
                              size={16}
                              className={`transition-transform duration-200 ${
                                activeDropdownId === (item.id || String(idx)) ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Mobile Level 1 nested */}
                    {hasChildren && activeDropdownId === (item.id || String(idx)) && (
                      <ul className="pl-4 mt-0.5 space-y-0.5 border-l border-slate-100 ml-3">
                        {item.children.map((child, cIdx) => (
                          <li key={child.id || cIdx}>
                            <a
                              href={enabled ? undefined : child.url}
                              className="craft-dropdown-item flex items-center px-3 py-1.5 text-xs rounded-md"
                              style={{
                                color: dropdownTextColor,
                              }}
                            >
                              {renderIconComponent(child.icon)}
                              <span style={{ marginLeft: child.icon ? '6px' : '0px' }}>{child.label}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        </div>
      </nav>
    </div>
  );
};

MenuBlock.craft = {
  name: 'MenuBlock',
  props: {
    menuSource: 'header',
    menuId: undefined,
    customItems: [
      { id: '1', label: 'Trang chá»§', url: '/', indent: 0 },
      { id: '2', label: 'Dá»‹ch vá»¥', url: '#', indent: 0 },
      { id: '3', label: 'Dá»‹ch vá»¥ 1', url: '/dich-vu-1', indent: 1 },
      { id: '4', label: 'Dá»‹ch vá»¥ 2', url: '/dich-vu-2', indent: 1 },
      { id: '5', label: 'LiÃªn há»‡', url: '/lien-he', indent: 0 }
    ],
    menuLayout: 'horizontal',
    resolvedItems: [],
    align: 'left',
    mobileBreakpoint: 'mobile',
    contentWidth: 'full',
    indicatorIcon: 'chevron',
    indicatorActiveIcon: 'chevron',
    dropdownEffect: 'fade',

    // Item styles default values
    itemGap: '20px',
    distanceFromContent: '0px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'var(--site-font-family-body)',
    fontStyle: 'normal',
    lineHeight: '1.5',
    letterSpacing: '0px',
    textTransform: 'none',
    textDecoration: 'none',
    textColor: '#334155',
    textShadow: '',
    itemBgColor: 'transparent',
    textColorHover: '#3b82f6',
    textShadowHover: '',
    itemBgColorHover: 'transparent',
    textColorActive: '#3b82f6',
    textShadowActive: '',
    itemBgColorActive: 'transparent',

    itemBorderType: 'none',
    itemBorderWidth: '1px',
    itemBorderColor: '#e2e8f0',
    itemBoxShadow: '',

    showDivider: false,
    dividerColor: '#cbd5e1',
    dividerWidth: '1px',
    dividerHeight: '16px',

    itemBorderRadius: '0px',
    itemBorderTopLeftRadius: '',
    itemBorderTopRightRadius: '',
    itemBorderBottomRightRadius: '',
    itemBorderBottomLeftRadius: '',

    itemPaddingTop: '8px',
    itemPaddingRight: '12px',
    itemPaddingBottom: '8px',
    itemPaddingLeft: '12px',

    // Icon defaults
    iconPosition: 'left',
    iconSize: '14px',
    iconSpacing: '6px',
    iconColor: '#64748b',
    iconColorHover: '#3b82f6',
    iconColorActive: '#3b82f6',

    // Dropdown indicator defaults
    indicatorSize: '12px',
    indicatorRotate: '180',
    indicatorSpace: '4px',
    indicatorColor: '#64748b',
    indicatorColorHover: '#3b82f6',
    indicatorColorActive: '#3b82f6',

    // Mobile menu toggle defaults
    toggleIcon: 'Menu',
    toggleSize: '20px',
    toggleColor: '#334155',
    toggleBgColor: 'transparent',
    toggleColorHover: '#3b82f6',
    toggleBgColorHover: 'transparent',
    toggleBorderType: 'none',
    toggleBorderWidth: '1px',
    toggleBorderColor: '#e2e8f0',
    toggleBoxShadow: '',
    toggleBorderRadius: '4px',
    togglePaddingTop: '8px',
    togglePaddingRight: '8px',
    togglePaddingBottom: '8px',
    togglePaddingLeft: '8px',
    toggleDistanceFromDropdown: '0px',

    // Content container wrapper defaults
    contentBgColor: 'transparent',
    contentBorderType: 'none',
    contentBorderWidth: '1px',
    contentBorderColor: '#e2e8f0',
    contentBorderRadius: '0px',
    contentBoxShadow: '',
    contentPaddingTop: '0px',
    contentPaddingRight: '0px',
    contentPaddingBottom: '0px',
    contentPaddingLeft: '0px',

    // Dropdown box and items defaults
    dropdownTextColor: '#334155',
    dropdownTextColorActive: '#3b82f6',
    dropdownItemBgColor: '#ffffff',
    dropdownItemBgColorActive: '#f8fafc',
    dropdownItemBoxShadow: '',
    dropdownBorderType: 'solid',
    dropdownBorderWidth: '1px',
    dropdownBorderColor: '#cbd5e1',
    dropdownBorderRadius: '6px',
    dropdownBoxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',

    ...defaultLayoutProps,
    width: '100%',
  },
  displayName: 'Menu',
};



