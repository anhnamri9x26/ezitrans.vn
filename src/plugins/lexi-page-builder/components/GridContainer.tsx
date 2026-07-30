"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNode, useEditor, Element } from '@craftjs/core';
import { Plus, GripVertical, X, Grid3x3 } from 'lucide-react';
import FloatingToolbar from './FloatingToolbar';
import { CommonLayoutProps, defaultLayoutProps } from './LayoutHelper';
import { AddSectionArea } from './AddSectionArea';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';
import { usePageSettings } from '../PageSettingsContext';
import { usePositionDrag } from './usePositionDrag';

export interface GridContainerProps extends CommonLayoutProps {
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderTopWidth?: string;
  borderRightWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderColor?: string;
  borderStyle?: string;
  contentWidth?: 'inherit' | 'boxed' | 'full' | 'custom';
  maxWidth?: string;
  minHeight?: string;
  shadow?: string;
  children?: React.ReactNode;
  className?: string;

  // Grid properties
  gridColumns?: number;
  gridRows?: number | 'auto';
  gridColumnGap?: string;
  gridRowGap?: string;
  gridAutoFlow?: string;
  justifyItems?: string;
  alignItems?: string;
  showGridOutline?: boolean;
}

export const GridContainer = (rawProps: GridContainerProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    paddingTop = '10px',
    paddingBottom = '10px',
    paddingLeft = '10px',
    paddingRight = '10px',
    backgroundColor = 'transparent',
    backgroundGradient = '',
    backgroundImage = '',
    borderRadius = '0px',
    borderWidth = '0px',
    borderTopWidth,
    borderRightWidth,
    borderBottomWidth,
    borderLeftWidth,
    borderColor = 'transparent',
    borderStyle = 'solid',
    contentWidth = 'inherit',
    maxWidth = '1200px',
    minHeight = 'auto',
    shadow = 'none',
    children,
    className = '',

    // Grid defaults
    gridColumns = 3,
    gridRows = 2,
    gridColumnGap = '20px',
    gridRowGap = '20px',
    gridAutoFlow = 'row',
    justifyItems = 'stretch',
    alignItems = 'stretch',
    showGridOutline = true,
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

  const { enabled, actions: editorActions, query } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  const pageSettings = usePageSettings();

  const isTopLevel = parentId === 'ROOT';
  const resolvedContentWidth = (() => {
    if (!isTopLevel) return 'full';
    if (contentWidth === 'inherit') {
      if (pageSettings.contentWidth === 'FULL_WIDTH') return 'full';
      if (pageSettings.contentWidth === 'CUSTOM') return 'custom';
      return 'boxed';
    }
    return contentWidth;
  })();
  const resolvedMaxWidth = (() => {
    if (!isTopLevel) return 'none';
    const siteContentWidth = pageSettings.websiteSettings?.layout?.contentWidth || '1200px';
    if (contentWidth === 'inherit') return pageSettings.contentMaxWidth || siteContentWidth;
    if (resolvedContentWidth === 'boxed') return maxWidth || siteContentWidth;
    if (resolvedContentWidth === 'custom') return maxWidth || siteContentWidth;
    return 'none';
  })();

  const [hovered, setHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [addSectionIndex, setAddSectionIndex] = useState<number | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (id === 'ROOT') {
      const handleShow = (e: any) => {
        setAddSectionIndex(e.detail);
      };
      window.addEventListener('craft-show-add-section', handleShow);
      return () => window.removeEventListener('craft-show-add-section', handleShow);
    }
  }, [id]);

  useEffect(() => {
    const handleCloseContextMenus = (event: Event) => {
      const activeId = (event as CustomEvent<string>).detail;
      if (activeId !== id) setContextMenu(null);
    };

    window.addEventListener('craft-close-context-menus', handleCloseContextMenus);
    return () => window.removeEventListener('craft-close-context-menus', handleCloseContextMenus);
  }, [id]);

  const shadowClasses: Record<string, string> = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
    inner: 'shadow-inner',
  };

  const getBackgroundStyle = () => {
    if (backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    if (backgroundGradient) {
      return { background: backgroundGradient };
    }
    return { backgroundColor };
  };

  const mappedProps = {
    ...props,
    advancedBgColor: props.advancedBgColor || props.backgroundColor,
    advancedBgGradient: props.advancedBgGradient || props.backgroundGradient,
    advancedBgImage: props.advancedBgImage || props.backgroundImage,
    advancedBgType: props.advancedBgType || (props.backgroundGradient ? 'gradient' : (props.backgroundImage ? 'classic' : 'classic')),
    borderType: props.borderType || props.borderStyle || 'none',
  };

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'grid', id);

  const outerStyle: React.CSSProperties = {
    ...wrapperStyle,
    width: wrapperStyle.width || props.width || '100%',
    minHeight,
    position: (wrapperStyle.position as any) || 'relative',
  };

  const { handlePositionMouseDown } = usePositionDrag({
    id,
    enabled,
    isLocked,
    props,
    setProp,
  });

  const isRoot = id === 'ROOT';
  const innerStyle: React.CSSProperties = {
    paddingTop: isRoot ? (enabled ? '24px' : '0px') : paddingTop,
    paddingBottom: isRoot ? '0px' : paddingBottom,
    paddingLeft: isRoot ? '0px' : paddingLeft,
    paddingRight: isRoot ? '0px' : paddingRight,
    maxWidth: resolvedContentWidth === 'full' ? 'none' : (resolvedMaxWidth === 'none' ? undefined : resolvedMaxWidth),
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
    gridTemplateRows: gridRows === 'auto' ? 'auto' : `repeat(${gridRows}, minmax(0, 1fr))`,
    gridAutoFlow: gridAutoFlow as React.CSSProperties['gridAutoFlow'],
    gap: `${gridRowGap} ${gridColumnGap}`,
    justifyItems: justifyItems as React.CSSProperties['justifyItems'],
    alignItems: alignItems as React.CSSProperties['alignItems'],
  };

  return (
    <div
      id={idCss}
      data-is-container="true"
      data-container-level={isTopLevel ? 'section' : 'inner'}
      data-drop-zone="true"
      style={outerStyle}
      className={`relative transition-all duration-200 flex flex-col ${shadowClasses[shadow] || ''} ${
        enabled && selected && id !== 'ROOT' 
          ? isTopLevel 
            ? 'editor-section-selected z-30' 
            : 'editor-inner-selected z-30'
          : ''
      } ${
        enabled && hovered && !selected && !isLocked && id !== 'ROOT' 
          ? isTopLevel
            ? 'editor-section-hovered z-20'
            : 'editor-inner-hovered z-20'
          : ''
      } ${
        enabled && hovered && selected && !isLocked && id !== 'ROOT' ? 'editor-element-hover-selected' : ''
      } ${isLocked ? 'cursor-default' : ''} ${className} ${classCss} ${
        id === 'ROOT' && React.Children.count(children) === 0 ? 'flex flex-col items-center justify-center min-h-[400px]' : ''
      }`}
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
        if (enabled && !isLocked && id !== 'ROOT') {
          setHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (enabled && !isLocked && id !== 'ROOT') {
          setHovered(false);
        }
      }}
      onContextMenu={(e) => {
        if (!enabled || id === 'ROOT') return;
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('craft-close-context-menus', { detail: id }));
        editorActions.selectNode(id);
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {enabled && (hovered || selected) && !isLocked && id !== 'ROOT' && (
        isTopLevel ? (
          <div
            className="editor-hover-badge absolute z-[100] select-none animate-fade-in font-sans flex items-center top-0 left-1/2 -translate-x-1/2 shadow-md rounded-b-md overflow-hidden"
          >
            {/* Grid Container badge */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                editorActions.selectNode(id);
                window.dispatchEvent(new CustomEvent('craft-switch-sidebar-tab', { detail: 'edit' }));
              }}
              className="h-5 inline-flex items-center justify-center cursor-pointer text-white px-2 gap-1 bg-fuchsia-500 hover:bg-fuchsia-600 rounded-bl-md"
              title="Grid"
            >
              <Grid3x3 size={10} strokeWidth={2.5} />
              <span className="text-[8px] font-black tracking-wider uppercase leading-none">GRID</span>
            </div>

            <div className="h-5 inline-flex items-center bg-slate-700 rounded-r-md overflow-hidden">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const myIndex = query.node('ROOT').get()?.data.nodes.indexOf(id);
                  if (myIndex !== undefined && myIndex !== -1) {
                    window.dispatchEvent(new CustomEvent('craft-show-add-section', { detail: myIndex }));
                  } else {
                    window.dispatchEvent(new CustomEvent('craft-switch-sidebar-tab', { detail: 'blocks' }));
                  }
                }}
                className="h-5 w-5 flex items-center justify-center text-white/80 hover:text-white hover:bg-slate-600 transition-colors cursor-pointer"
                title="ThÃªm Section á»Ÿ trÃªn"
              >
                <Plus size={11} strokeWidth={2.5} />
              </button>

              <div
                ref={(ref) => {
                  if (ref) {
                    drag(ref);
                    if (innerRef.current) connect(innerRef.current);
                  }
                }}
                className="h-5 w-5 flex items-center justify-center text-white/80 hover:text-white hover:bg-slate-600 transition-colors cursor-grab active:cursor-grabbing"
                title="KÃ©o Ä‘á»ƒ di chuyá»ƒn"
              >
                <GripVertical size={11} />
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  editorActions.selectNode(undefined);
                  setTimeout(() => {
                    try { editorActions.delete(id); } catch {}
                  }, 0);
                }}
                className="h-5 w-5 flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-slate-600 transition-colors cursor-pointer"
                title="XÃ³a"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={(ref) => {
              if (ref) {
                drag(ref);
                if (innerRef.current) connect(innerRef.current);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              editorActions.selectNode(id);
              window.dispatchEvent(new CustomEvent('craft-switch-sidebar-tab', { detail: 'edit' }));
            }}
            className="editor-hover-badge absolute z-[100] select-none animate-fade-in font-sans flex items-center justify-center top-0 left-0 shadow-md rounded bg-fuchsia-500 hover:bg-fuchsia-600 text-white h-5 w-5 cursor-grab active:cursor-grabbing"
            title={displayName}
          >
            <span className="text-[10px] font-black">G</span>
          </div>
        )
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

      {/* Grid rendering logic */}
      <div 
        ref={(ref) => {
          if (ref) {
            innerRef.current = ref;
            connect(ref);
          }
        }}
        style={innerStyle} 
        className={`w-full h-full flex-1 ${id === 'ROOT' ? 'relative min-h-[400px]' : ''}`}
      >
        {id === 'ROOT' && enabled ? (
          <>
            {React.Children.toArray(children).map((child, idx) => (
              <React.Fragment key={`child-${idx}`}>
                {addSectionIndex === idx && (
                  <div style={{ gridColumn: '1 / -1' }}><AddSectionArea index={idx} /></div>
                )}
                {child}
              </React.Fragment>
            ))}
            <div style={{ gridColumn: '1 / -1' }}><AddSectionArea isBottom /></div>
          </>
        ) : children}
        {enabled && showGridOutline && (() => {
          const numCols = parseInt(gridColumns as any) || 3;
          let totalCells = 0;
          if (gridRows && gridRows !== 'auto') {
            totalCells = numCols * (parseInt(gridRows as any) || 2);
          } else {
            const childCount = React.Children.count(children);
            if (childCount === 0) {
              totalCells = numCols;
            } else {
              const remainder = childCount % numCols;
              totalCells = childCount + (remainder === 0 ? 0 : numCols - remainder);
            }
          }
          const childCount = React.Children.count(children);
          const emptyCellsCount = Math.max(0, totalCells - childCount);
          
          return Array.from({ length: emptyCellsCount }).map((_, idx) => (
            <div
              key={`empty-cell-${idx}`}
              className="border border-dashed border-fuchsia-300 hover:border-fuchsia-500 bg-fuchsia-50/10 hover:bg-fuchsia-50/30 min-h-[80px] rounded flex items-center justify-center cursor-pointer transition-all group"
              onClick={(e) => {
                e.stopPropagation();
                editorActions.selectNode(id);
                window.dispatchEvent(new CustomEvent('craft-switch-sidebar-tab', { detail: 'blocks' }));
              }}
            >
              <Plus size={16} className="text-fuchsia-300 group-hover:text-fuchsia-500 group-hover:scale-110 transition-all" />
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

GridContainer.craft = {
  name: 'GridContainer',
  rules: {
    canMoveIn: () => true,
    canDrag: () => true,
  },
  props: {
    ...defaultLayoutProps,
    paddingTop: '',
    paddingBottom: '',
    paddingLeft: '',
    paddingRight: '',
    backgroundColor: 'transparent',
    borderRadius: '0px',
    borderWidth: '0px',
    borderTopWidth: '0px',
    borderRightWidth: '0px',
    borderBottomWidth: '0px',
    borderLeftWidth: '0px',
    borderColor: 'transparent',
    contentWidth: 'inherit',
    maxWidth: '1200px',
    minHeight: '80px',
    shadow: 'none',
    width: '100%',
    gridColumns: 3,
    gridRows: 2,
    gridColumnGap: '20px',
    gridRowGap: '20px',
    gridAutoFlow: 'row',
    justifyItems: 'stretch',
    alignItems: 'stretch',
    showGridOutline: true,
  },
  displayName: 'Lưới',
};



