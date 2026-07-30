"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useEffect, useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Pencil, Code } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps } from './LayoutHelper';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';

export interface HtmlBlockProps extends CommonLayoutProps {
  html?: string;
  className?: string;
}

export const HtmlBlock = (rawProps: HtmlBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    html = '<div style="padding: 24px; text-align: center; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; font-family: sans-serif; color: #64748b;"><div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">MÃ£ HTML TÃ¹y Chá»‰nh</div><div style="font-size: 11px;">Nháº¥p Ä‘Ãºp chuá»™t hoáº·c má»Ÿ báº£ng cÃ i Ä‘áº·t bÃªn pháº£i Ä‘á»ƒ chÃ¨n Iframe, Form liÃªn há»‡, hoáº·c Code nhÃºng tÃ¹y chá»‰nh cá»§a báº¡n.</div></div>',
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

  return (
    <div
      ref={(ref) => {
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

      {enabled && (
        <div className="absolute top-2 left-2 pointer-events-none select-none px-2 py-0.5 rounded bg-slate-800/80 text-white text-[8px] font-bold font-sans flex items-center gap-1 z-10 backdrop-blur-sm border border-slate-700/50">
          <Code size={10} /> MÃ£ HTML
        </div>
      )}

      {/* Render raw HTML */}
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        className={enabled ? "pointer-events-none select-none" : ""}
      />
    </div>
  );
};

HtmlBlock.craft = {
  name: 'HtmlBlock',
  props: {
    html: '<div style="padding: 24px; text-align: center; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; font-family: sans-serif; color: #64748b;"><div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">MÃ£ HTML TÃ¹y Chá»‰nh</div><div style="font-size: 11px;">Nháº¥p Ä‘Ãºp chuá»™t hoáº·c má»Ÿ báº£ng cÃ i Ä‘áº·t bÃªn pháº£i Ä‘á»ƒ chÃ¨n Iframe, Form liÃªn há»‡, hoáº·c Code nhÃºng tÃ¹y chá»‰nh cá»§a báº¡n.</div></div>',
    ...defaultLayoutProps,
    width: '100%',
  },
  displayName: 'Mã HTML',
};



