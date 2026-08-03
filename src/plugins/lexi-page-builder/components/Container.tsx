"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNode, useEditor, Element } from '@craftjs/core';
import { Plus, Folder, Sparkles, GripVertical, X } from 'lucide-react';
import FloatingToolbar from './FloatingToolbar';
import { CommonLayoutProps, defaultLayoutProps } from './LayoutHelper';
import { getWrapperStyles, getContainerInnerStyles, createResponsiveProps, StyleMap } from '../utils/styleResolver';
import { AddSectionArea } from './AddSectionArea';
import { usePageSettings } from '../PageSettingsContext';
import { usePositionDrag } from './usePositionDrag';

export interface ContainerProps extends CommonLayoutProps {
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
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: string;
  gap?: string;
  columnGap?: string;
  rowGap?: string;
  contentWidth?: 'inherit' | 'boxed' | 'full' | 'custom';
  maxWidth?: string;
  minHeight?: string;
  shadow?: string;
  children?: React.ReactNode;
  className?: string;

  // Grid properties
  layoutType?: 'flex' | 'grid';
  gridColumns?: number;
  gridRows?: number | 'auto';
  gridColumnGap?: string;
  gridRowGap?: string;
  gridAutoFlow?: string;
  justifyItems?: string;
  showGridOutline?: boolean;
}

export const Container = (rawProps: ContainerProps) => {
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
    flexDirection = 'column',
    justifyContent = 'flex-start',
    alignItems = 'stretch',
    flexWrap = 'nowrap',
    gap = 'var(--site-layout-container-gap)',
    columnGap = 'var(--site-layout-container-gap)',
    rowGap = 'var(--site-layout-container-gap)',
    contentWidth = 'inherit',
    maxWidth = '1200px',
    minHeight = 'auto',
    shadow = 'none',
    children,
    className = '',

    // Grid defaults
    layoutType = 'flex',
    gridColumns = 3,
    gridRows = 2,
    gridColumnGap = '20px',
    gridRowGap = '20px',
    gridAutoFlow = 'row',
    justifyItems = 'stretch',
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

  const { enabled, actions: editorActions, query, resolver, parentChildren } = useEditor((state) => {
    const node = state.nodes[id];
    const parentId = node?.data.parent;
    const parentChildren = parentId ? state.nodes[parentId]?.data.nodes || [] : [];
    return {
      enabled: state.options.enabled,
      resolver: state.options.resolver,
      parentChildren,
    };
  });

  // Page settings for inherit mode
  const pageSettings = usePageSettings();

  // Resolve contentWidth for top-level containers (parent is ROOT)
  const isTopLevel = parentId === 'ROOT';
  const resolvedContentWidth = (() => {
    if (!isTopLevel) return 'full'; // nested containers always full
    if (contentWidth === 'inherit') {
      // Map page ContentWidth enum to container values
      if (pageSettings.contentWidth === 'FULL_WIDTH') return 'full';
      if (pageSettings.contentWidth === 'CUSTOM') return 'custom';
      return 'boxed'; // BOXED default
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
  const [resizingState, setResizingState] = useState<{
    isActive: boolean;
    widthA: number;
    widthB: number;
  }>({
    isActive: false,
    widthA: 0,
    widthB: 0,
  });
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

  // Check if current container is a column in a row
  const parentNode = parentId ? query.node(parentId).get() : null;
  const parentProps = parentNode?.data.props || {};
  const parentName = parentNode ? ((parentNode.data.type as unknown as { resolvedName?: string })?.resolvedName || parentNode.data.name) : '';
  const isColumn = parentId && 
    parentName === 'Container' && 
    parentProps.flexDirection === 'row';

  // Find next sibling column in the row
  const nextColId = useMemo(() => {
    if (!isColumn || !parentId || !parentChildren.length) return null;
    try {
      const colIndex = parentChildren.indexOf(id);
      if (colIndex === -1) return null;
      
      for (let i = colIndex + 1; i < parentChildren.length; i++) {
        const childId = parentChildren[i];
        const childNode = query.node(childId).get();
        const childName = (childNode.data.type as unknown as { resolvedName?: string })?.resolvedName || childNode.data.name;
        if (childName === 'Container') {
          return childId;
        }
      }
    } catch (err) {
      console.error('Error finding next column sibling:', err);
    }
    return null;
  }, [isColumn, parentId, id, parentChildren, query]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLocked || !nextColId) return;

    if (typeof document !== 'undefined') {
      document.body.classList.add('builder-resizing');
    }

    const startX = e.clientX;
    
    // Find the DOM elements
    const colEl = e.currentTarget.parentElement;
    if (!colEl) return;
    const parentEl = colEl.parentElement;
    if (!parentEl) return;

    const parentRect = parentEl.getBoundingClientRect();
    if (!parentRect.width) return;

    const nextColEl = colEl.nextElementSibling as HTMLElement | null;
    if (!nextColEl) return;

    const colRect = colEl.getBoundingClientRect();
    const nextColRect = nextColEl.getBoundingClientRect();

    // Width values are percentages of the parent container, not of the resized pair.
    const startWidthA = (colRect.width / parentRect.width) * 100;
    const startWidthB = (nextColRect.width / parentRect.width) * 100;
    const totalWidthPercent = startWidthA + startWidthB;

    setResizingState({
      isActive: true,
      widthA: startWidthA,
      widthB: startWidthB,
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Convert deltaX to percentage of parent row width
      const deltaPercent = (deltaX / parentRect.width) * 100;

      let newWidthA = startWidthA + deltaPercent;
      let newWidthB = startWidthB - deltaPercent;

      // Restrict boundaries (e.g. min 5%)
      const minPercent = 5;
      if (newWidthA < minPercent) {
        newWidthA = minPercent;
        newWidthB = totalWidthPercent - minPercent;
      } else if (newWidthB < minPercent) {
        newWidthB = minPercent;
        newWidthA = totalWidthPercent - minPercent;
      }

      // Round to 1 decimal place
      newWidthA = Math.round(newWidthA * 10) / 10;
      newWidthB = Math.round(newWidthB * 10) / 10;

      // Update local state for tooltip rendering
      setResizingState({
        isActive: true,
        widthA: newWidthA,
        widthB: newWidthB,
      });

      // Apply the props in Craft editor
      editorActions.setProp(id, (p: Record<string, unknown>) => {
        p.widthMode = 'custom';
        p.customWidth = `${newWidthA}%`;
        p.width = `${newWidthA}%`;
      });

      if (nextColId) {
        editorActions.setProp(nextColId, (p: Record<string, unknown>) => {
          p.widthMode = 'custom';
          p.customWidth = `${newWidthB}%`;
          p.width = `${newWidthB}%`;
        });
      }
    };

    const handleMouseUp = () => {
      setResizingState((prev) => ({ ...prev, isActive: false }));
      if (typeof document !== 'undefined') {
        document.body.classList.remove('builder-resizing');
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getHandleStyle = () => {
    const gapVal = parentProps.columnGap || parentProps.gap || '5px';
    
    let gapNum = 5;
    if (typeof gapVal === 'number') {
      gapNum = gapVal;
    } else if (typeof gapVal === 'string') {
      const parsed = parseFloat(gapVal);
      if (!isNaN(parsed)) {
        gapNum = parsed;
      }
    }

    const minGrabWidth = 12;
    const activeWidth = Math.max(gapNum, minGrabWidth);

    const formattedGap = /^\d+$/.test(String(gapVal)) ? `${gapVal}px` : gapVal;

    return {
      width: `${activeWidth}px`,
      left: `calc(100% + (${formattedGap} / 2))`,
      transform: 'translateX(-50%)',
    };
  };

  // Background mapping for Container specific props
  const mappedProps = {
    ...props,
    advancedBgColor: props.advancedBgColor || props.backgroundColor,
    advancedBgGradient: props.advancedBgGradient || props.backgroundGradient,
    advancedBgImage: props.advancedBgImage || props.backgroundImage,
    advancedBgType: props.advancedBgType || (props.backgroundGradient ? 'gradient' : (props.backgroundImage ? 'classic' : 'classic')),
    borderType: props.borderType || props.borderStyle || 'none',
  };

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'flex', id);

  // When this container is a column in a row-direction parent and no custom width is set,
  // use flex:1 so columns auto-distribute evenly (1=100%, 2=50/50, 3=33/33/33)
  const hasCustomWidth = props.widthMode === 'custom' || props.widthMode === 'full' || props.widthMode === 'inline';
  const useFlexGrow = isColumn && !hasCustomWidth;

  // Outer wrapper style (full width section styling)
  const outerStyle: React.CSSProperties = {
    ...wrapperStyle,
    width: useFlexGrow ? undefined : (wrapperStyle.width || props.width || '100%'),
    flex: useFlexGrow ? '1 1 0%' : undefined,
    minWidth: useFlexGrow ? 0 : undefined,
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
  
  const innerStyle = getContainerInnerStyles(props as any, {
    isRoot,
    isTopLevel,
    enabled,
    resolvedContentWidth,
    resolvedMaxWidth,
    boxedGutter: 'var(--site-layout-container-gap, 5px)'
  }) as React.CSSProperties;


  return (
    <div
      id={idCss}
      data-is-container="true"
      data-container-level={isTopLevel ? 'section' : 'inner'}
      data-drop-zone="true"
      style={outerStyle}
      className={`relative transition-all duration-200 flex flex-col ${isTopLevel ? 'lexi-section' : ''} ${shadowClasses[shadow] || ''} ${
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
      {enabled && isColumn && nextColId && (
        <div
          className="absolute top-0 bottom-0 cursor-col-resize z-50 group/resize flex items-center justify-center"
          style={getHandleStyle()}
          onMouseDown={handleResizeStart}
        >
          {/* Visual thin resizer line */}
          <div className={`w-[2px] h-10 rounded transition-all opacity-0 group-hover/resize:opacity-100 ${
            resizingState.isActive ? 'bg-brand-500 h-16 w-[3px] opacity-100' : 'bg-brand-500 group-hover/resize:h-12'
          }`} />

          {/* Width Tooltip Capsule */}
          {resizingState.isActive && (
            <div className="absolute -top-8 bg-slate-800 text-white text-[9px] font-black py-1 px-2 rounded-full shadow-lg pointer-events-none z-[100] whitespace-nowrap animate-fade-in uppercase tracking-wider font-sans border border-slate-700/50">
              {resizingState.widthA.toFixed(1)}%
            </div>
          )}
        </div>
      )}
      {enabled && (hovered || selected) && !isLocked && id !== 'ROOT' && (
        isTopLevel ? (
          /* Level 1 Section - Full Toolbar in Center */
          <div
            className="editor-hover-badge absolute z-[100] select-none animate-fade-in font-sans flex items-center top-0 left-1/2 -translate-x-1/2 shadow-md rounded-b-md overflow-hidden"
          >
            {/* Container type badge */}
            <div
              onClick={(e) => {
                console.log('[DEBUG] Container badge clicked, id:', id);
                e.stopPropagation();
                editorActions.selectNode(id);
                window.dispatchEvent(new CustomEvent('craft-switch-sidebar-tab', { detail: 'edit' }));
              }}
              className="h-5 inline-flex items-center justify-center cursor-pointer text-white px-2 gap-1 bg-indigo-500 hover:bg-indigo-600 rounded-bl-md"
              title="Section"
            >
              <span className="relative block h-2.5 w-3 rounded-[1px] border border-white/90 before:absolute before:left-[45%] before:top-0 before:h-full before:border-r before:border-white/60 after:absolute after:left-0 after:top-[45%] after:w-full after:border-b after:border-white/60" />
              <span className="text-[8px] font-black tracking-wider uppercase leading-none">SEC</span>
            </div>

            {/* Elementor-style action buttons */}
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
                title="Thêm Section ở trên"
              >
                <Plus size={11} strokeWidth={2.5} />
              </button>

              {/* Drag handle */}
              <div
                ref={(ref) => {
                  if (ref) {
                    drag(ref);
                    if (innerRef.current) connect(innerRef.current);
                  }
                }}
                className="h-5 w-5 flex items-center justify-center text-white/80 hover:text-white hover:bg-slate-600 transition-colors cursor-grab active:cursor-grabbing"
                title="Kéo để di chuyển"
              >
                <GripVertical size={11} />
              </div>

              {/* Delete */}
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
                title="Xóa"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ) : (
          /* Nested Container / Column - Only Gray Icon on top-left */
          <div
            ref={(ref) => {
              if (ref) {
                drag(ref);
                if (innerRef.current) connect(innerRef.current);
              }
            }}
            onClick={(e) => {
              console.log('[DEBUG] Column badge clicked, id:', id);
              e.stopPropagation();
              editorActions.selectNode(id);
              window.dispatchEvent(new CustomEvent('craft-switch-sidebar-tab', { detail: 'edit' }));
            }}
            className="editor-hover-badge absolute z-[100] select-none animate-fade-in font-sans flex items-center justify-center top-0 left-0 shadow-md rounded bg-slate-500 hover:bg-slate-600 text-white h-5 w-5 cursor-grab active:cursor-grabbing"
            title={displayName}
          >
            <span className="relative block h-2.5 w-3 rounded-[1px] border border-white/90 before:absolute before:left-[33%] before:top-0 before:h-full before:border-r before:border-white/70 after:absolute after:left-[66%] after:top-0 after:h-full after:border-r after:border-white/70" />
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
      {enabled && id === 'ROOT' ? (
        <div 
          ref={(ref) => {
            if (ref) {
              innerRef.current = ref;
              connect(ref);
            }
          }}
          style={innerStyle} 
          className="lexi-container w-full h-full flex-1 relative min-h-[400px]"
        >
          {React.Children.toArray(children).map((child, idx) => (
            <React.Fragment key={`child-${idx}`}>
              {addSectionIndex === idx && <AddSectionArea index={idx} />}
              {child}
            </React.Fragment>
          ))}
          <AddSectionArea isBottom />
        </div>
      ) : (React.Children.count(children) > 0 || (layoutType === 'grid' && enabled)) ? (
        <div 
          ref={(ref) => {
            if (ref) {
              innerRef.current = ref;
              connect(ref);
            }
          }}
          style={innerStyle} 
          className="lexi-container w-full h-full flex-1"
        >
          {children}
          {layoutType === 'grid' && enabled && showGridOutline && (() => {
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
                className="border border-dashed border-slate-300 hover:border-brand-400 bg-slate-50/20 hover:bg-brand-50/10 min-h-[100px] rounded flex items-center justify-center cursor-pointer transition-all group"
                onClick={(e) => {
                  e.stopPropagation();
                  editorActions.selectNode(id);
                  window.dispatchEvent(new CustomEvent('craft-switch-sidebar-tab', { detail: 'blocks' }));
                }}
              >
                <Plus size={16} className="text-slate-300 group-hover:text-brand-500 group-hover:scale-110 transition-all" />
              </div>
            ));
          })()}
        </div>
      ) : enabled ? (
        <div 
          ref={(ref) => {
            if (ref) {
              innerRef.current = ref;
              connect(ref);
            }
          }}
          style={innerStyle} 
          className="w-full h-full flex-1 flex flex-col"
        >
          <div
            data-empty-container-placeholder="true"
            className="p-3 w-full flex-1 flex items-center justify-center text-slate-400 bg-slate-50/30 border border-dashed border-slate-300 rounded transition-colors duration-200 hover:border-brand-300 relative group min-h-[100px]"
          >
            <button
              onClick={(e) => {
                if (isLocked) return;
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('craft-switch-sidebar-tab', { detail: 'blocks' }));
              }}
              className={`text-slate-300 hover:text-slate-500 transition-colors duration-150 p-2 bg-transparent border-0 outline-none flex items-center justify-center ${
                isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
              title="Thêm thành phần"
            >
              <Plus size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

Container.craft = {
  name: 'Container',
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
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
    gap: 'var(--site-layout-container-gap)',
    columnGap: 'var(--site-layout-container-gap)',
    rowGap: 'var(--site-layout-container-gap)',
    contentWidth: 'inherit',
    maxWidth: '1200px',
    minHeight: '80px',
    shadow: 'none',
    width: '100%',
    layoutType: 'flex',
    gridColumns: 3,
    gridRows: 2,
    gridColumnGap: '20px',
    gridRowGap: '20px',
    gridAutoFlow: 'row',
    justifyItems: 'stretch',
    showGridOutline: true,
  },
  displayName: 'Vùng chứa',
};



