"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useState, useEffect, useRef } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Pencil } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps, getFontFamilyFallback } from './LayoutHelper';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';

export interface ProgressBarBlockProps extends CommonLayoutProps {
  title?: string;
  percentage?: number;
  displayPercentage?: boolean;
  barType?: 'default' | 'inner';
  duration?: number;
  
  // Bar styles
  barColor?: string;
  barBgColor?: string;
  barHeight?: string;
  barBorderRadius?: string;
  
  // Title typography
  titleColor?: string;
  titleFontSize?: string;
  titleFontWeight?: string;
  titleFontFamily?: string;
  titleFontStyle?: 'normal' | 'italic';
  titleTextDecoration?: 'none' | 'underline' | 'line-through';
  
  // Percent typography
  percentColor?: string;
  percentFontSize?: string;
  percentFontWeight?: string;
  percentFontFamily?: string;
  percentFontStyle?: 'normal' | 'italic';
  percentTextDecoration?: 'none' | 'underline' | 'line-through';
  
  // Inner styles
  innerTextColor?: string;
  
  // Layout spacing
  titleSpacing?: string;
  
  // Gradient & stripes
  barGradientEnabled?: boolean;
  barGradientColor?: string;
  stripeEnabled?: boolean;
  stripeAnimated?: boolean;
}

export const ProgressBarBlock = (rawProps: ProgressBarBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    title = 'My Skill',
    percentage = 50,
    displayPercentage = true,
    barType = 'default',
    duration = 1500,
    
    // Bar defaults
    barColor = 'var(--site-color-primary)',
    barBgColor = '#e5e7eb',
    barHeight = '20px',
    barBorderRadius = '10px',
    
    // Title defaults
    titleColor = 'var(--site-color-text)',
    titleFontSize = '14px',
    titleFontWeight = '600',
    titleFontFamily = '',
    titleFontStyle = 'normal',
    titleTextDecoration = 'none',
    
    // Percent defaults
    percentColor = 'var(--site-color-text)',
    percentFontSize = '14px',
    percentFontWeight = '600',
    percentFontFamily = '',
    percentFontStyle = 'normal',
    percentTextDecoration = 'none',
    
    innerTextColor = '#ffffff',
    titleSpacing = '8px',
    
    barGradientEnabled = false,
    barGradientColor = '',
    stripeEnabled = false,
    stripeAnimated = false,
    
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
  const [currentPercent, setCurrentPercent] = useState(0);
  const barRef = useRef<HTMLDivElement | null>(null);

  // Progress Bar fill animation
  useEffect(() => {
    if (enabled && !selected) {
      setCurrentPercent(percentage);
      return;
    }

    const animate = () => {
      let startTimestamp: number | null = null;
      let animationFrameId: number;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing out quad
        const easeProgress = progress * (2 - progress);
        const val = easeProgress * percentage;
        setCurrentPercent(val);
        
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setCurrentPercent(percentage);
        }
      };

      animationFrameId = requestAnimationFrame(step);
      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    };

    if (enabled && selected) {
      return animate();
    }

    if (!enabled) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animate();
            if (barRef.current) observer.unobserve(barRef.current);
          }
        },
        { threshold: 0.1 }
      );
      if (barRef.current) observer.observe(barRef.current);
      return () => observer.disconnect();
    }
  }, [enabled, selected, percentage, duration, clickCount]);

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

  const titleFontFamilyResolved = titleFontFamily ? getFontFamilyFallback(titleFontFamily) : undefined;
  const percentFontFamilyResolved = percentFontFamily ? getFontFamilyFallback(percentFontFamily) : undefined;

  const isTitleColorDefault = !props.titleColor || props.titleColor === 'var(--site-color-text)';
  const isPercentColorDefault = !props.percentColor || props.percentColor === 'var(--site-color-text)';

  const finalTitleColor = props.barType === 'inner' && isTitleColorDefault ? props.innerTextColor || '#ffffff' : titleColor;
  const finalPercentColor = props.barType === 'inner' && isPercentColorDefault ? props.innerTextColor || '#ffffff' : percentColor;

  const titleStyle: React.CSSProperties = {
    color: finalTitleColor,
    fontSize: titleFontSize,
    fontWeight: titleFontWeight,
    fontFamily: titleFontFamilyResolved,
    fontStyle: titleFontStyle,
    textDecoration: titleTextDecoration,
  };

  const percentStyle: React.CSSProperties = {
    color: finalPercentColor,
    fontSize: percentFontSize,
    fontWeight: percentFontWeight,
    fontFamily: percentFontFamilyResolved,
    fontStyle: percentFontStyle,
    textDecoration: percentTextDecoration,
  };

  const fillBackground = barGradientEnabled && barGradientColor
    ? `linear-gradient(90deg, ${barColor} 0%, ${barGradientColor} 100%)`
    : barColor;

  return (
    <div
      ref={(ref) => {
        barRef.current = ref;
        if (ref) connect(drag(ref));
      }}
      id={idCss}
      style={wrapperStyle}
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
          // Re-trigger animation in editor
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
      {/* Stripe Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .stripe-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.15) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.15) 75%,
            transparent 75%,
            transparent
          );
          background-size: 40px 40px;
          border-radius: inherit;
          pointer-events: none;
        }
        .stripe-animated::after {
          animation: craft-progress-stripe-anim 1s linear infinite;
        }
        @keyframes craft-progress-stripe-anim {
          from { background-position: 40px 0; }
          to { background-position: 0 0; }
        }
      ` }} />

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

      {barType === 'default' ? (
        <div className="w-full flex flex-col">
          <div className="w-full flex justify-between items-center" style={{ marginBottom: titleSpacing }}>
            <span style={titleStyle} className="break-words font-sans">{title}</span>
            {displayPercentage && (
              <span style={percentStyle} className="break-words font-sans">{Math.round(currentPercent)}%</span>
            )}
          </div>
          <div
            style={{
              backgroundColor: barBgColor,
              height: barHeight,
              borderRadius: barBorderRadius,
            }}
            className="w-full overflow-hidden relative"
          >
            <div
              style={{
                width: `${currentPercent}%`,
                background: fillBackground,
                borderRadius: barBorderRadius,
                height: '100%',
              }}
              className={`transition-all duration-75 relative flex items-center ${
                stripeEnabled ? 'stripe-bg' : ''
              } ${stripeEnabled && stripeAnimated ? 'stripe-animated' : ''}`}
            />
          </div>
        </div>
      ) : (
        <div className="w-full">
          <div
            style={{
              backgroundColor: barBgColor,
              height: barHeight,
              borderRadius: barBorderRadius,
              minHeight: '24px',
            }}
            className="w-full overflow-hidden relative"
          >
            <div
              style={{
                width: `${currentPercent}%`,
                background: fillBackground,
                borderRadius: barBorderRadius,
                height: '100%',
              }}
              className={`transition-all duration-75 ${
                stripeEnabled ? 'stripe-bg' : ''
              } ${stripeEnabled && stripeAnimated ? 'stripe-animated' : ''}`}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
              <span
                style={{
                  ...titleStyle,
                }}
                className="font-sans text-xs font-semibold select-none truncate"
              >
                {title}
              </span>
              {displayPercentage && (
                <span
                  style={{
                    ...percentStyle,
                  }}
                  className="font-sans text-xs font-semibold select-none ml-2 whitespace-nowrap"
                >
                  {Math.round(currentPercent)}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ProgressBarBlock.craft = {
  name: 'ProgressBarBlock',
  props: {
    title: 'My Skill',
    percentage: 50,
    displayPercentage: true,
    barType: 'default',
    duration: 1500,
    
    // Bar defaults
    barColor: 'var(--site-color-primary)',
    barBgColor: '#e5e7eb',
    barHeight: '20px',
    barBorderRadius: '10px',
    
    // Title defaults
    titleColor: 'var(--site-color-text)',
    titleFontSize: '14px',
    titleFontWeight: '600',
    titleFontFamily: '',
    titleFontStyle: 'normal',
    titleTextDecoration: 'none',
    
    // Percent defaults
    percentColor: 'var(--site-color-text)',
    percentFontSize: '14px',
    percentFontWeight: '600',
    percentFontFamily: '',
    percentFontStyle: 'normal',
    percentTextDecoration: 'none',
    
    innerTextColor: '#ffffff',
    titleSpacing: '8px',
    
    barGradientEnabled: false,
    barGradientColor: '',
    stripeEnabled: false,
    stripeAnimated: false,

    ...defaultLayoutProps,
  },
  displayName: 'Thanh tiến trình',
};



