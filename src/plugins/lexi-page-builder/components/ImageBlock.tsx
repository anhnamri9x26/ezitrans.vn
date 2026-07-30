"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useEffect, useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Image as ImageIcon, Loader2, Pencil } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps } from './LayoutHelper';
import { usePositionDrag } from './usePositionDrag';
import { resolveDynamicValue, DynamicConfig } from '../utils/dynamicResolver';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';

export const getResolutionUrl = (url: string, resolution: string) => {
  if (!url || resolution === 'full') return url;
  if (!url.startsWith('/uploads/')) return url;
  if (url.endsWith('.svg')) return url;
  
  const extIndex = url.lastIndexOf('.');
  if (extIndex === -1) return url;
  
  const base = url.substring(0, extIndex);
  const ext = url.substring(extIndex);
  
  if (resolution === 'thumbnail') return `${base}-150x150${ext}`;
  if (resolution === 'medium') return `${base}-300x300${ext}`;
  if (resolution === 'large') return `${base}-1024x1024${ext}`;
  
  return url;
};

export interface ImageBlockProps extends CommonLayoutProps {
  url?: string;
  alt?: string;
  borderRadius?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  align?: 'left' | 'center' | 'right';
  link?: string;
  dynamicUrl?: DynamicConfig;
  dynamicLink?: DynamicConfig;
  linkSettings?: {
    openInNewWindow?: boolean;
    nofollow?: boolean;
    customAttributes?: string;
  };
  imageResolution?: 'thumbnail' | 'medium' | 'large' | 'full';
  captionType?: 'none' | 'attachment' | 'custom';
  customCaption?: string;
  linkType?: 'none' | 'media' | 'custom';
  imageWidth?: string;
  imageMaxWidth?: string;
  imageHeight?: string;
  opacity?: number | string;
  opacityHover?: number | string;
  cssFilters?: string;
  cssFiltersHover?: string;
  boxShadow?: string;
  boxShadowHover?: string;
}

const MountainPlaceholder = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <rect width="300" height="150" fill="#9ca3af" />
    <circle cx="80" cy="70" r="12" fill="#cbd5e1" opacity="0.8" />
    <path d="M0 150 C 60 120, 120 80, 180 110 C 220 125, 260 140, 300 150 Z" fill="#bdc7d2" opacity="0.6" />
    <path d="M40 150 C 100 100, 180 60, 260 115 C 280 125, 290 135, 300 150 Z" fill="#cbd5e1" opacity="0.9" />
  </svg>
);

export const ImageBlock = (rawProps: ImageBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    url = '',
    alt = 'HÃ¬nh áº£nh thiáº¿t káº¿',
    width = '100%',
    widthMode = 'full',
    customWidth = '',
    height = 'auto',
    borderRadius = '8px',
    objectFit = 'cover',
    align = 'center',
    link = '',
    className = '',
    dynamicUrl,
    dynamicLink,
    linkSettings,
    imageResolution = 'large',
    captionType = 'none',
    customCaption = '',
    linkType = 'none',
    imageWidth = '100%',
    imageMaxWidth = '100%',
    imageHeight = 'auto',
    opacity = 1,
    opacityHover = 1,
    cssFilters = 'none',
    cssFiltersHover = 'none',
    boxShadow = 'none',
    boxShadowHover = 'none',
  } = props;

  const dynamicUrlValue = dynamicUrl?.enabled ? resolveDynamicValue(dynamicUrl) : null;
  const displayUrl = dynamicUrlValue !== null ? dynamicUrlValue : url;
  const resolvedUrlWithResolution = getResolutionUrl(displayUrl, imageResolution);

  const dynamicLinkValue = dynamicLink?.enabled ? resolveDynamicValue(dynamicLink) : null;
  const displayLink = dynamicLinkValue !== null ? dynamicLinkValue : link;

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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const handleCloseContextMenus = (event: Event) => {
      const activeId = (event as CustomEvent<string>).detail;
      if (activeId !== id) setContextMenu(null);
    };

    window.addEventListener('craft-close-context-menus', handleCloseContextMenus);
    return () => window.removeEventListener('craft-close-context-menus', handleCloseContextMenus);
  }, [id]);

  const resolvedWidth = widthMode === 'full'
    ? '100%'
    : widthMode === 'inline'
      ? 'auto'
      : widthMode === 'custom'
        ? customWidth || width
        : width;

  const resolvedImageWidth = props.imageWidth !== undefined ? props.imageWidth : resolvedWidth;
  const resolvedImageMaxWidth = props.imageMaxWidth !== undefined ? props.imageMaxWidth : '100%';
  const resolvedImageHeight = props.imageHeight !== undefined ? props.imageHeight : height;

  const mappedProps = {
    ...props,
    advancedBgType: props.advancedBgType || 'classic',
    borderType: 'none',
    borderWidth: undefined,
    borderTopWidth: undefined,
    borderRightWidth: undefined,
    borderBottomWidth: undefined,
    borderLeftWidth: undefined,
    borderColor: undefined,
    borderRadius: undefined,
    borderTopLeftRadius: undefined,
    borderTopRightRadius: undefined,
    borderBottomRightRadius: undefined,
    borderBottomLeftRadius: undefined,
    boxShadow: undefined,
    boxShadowHover: undefined,
  };

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'flex', id);

  const containerStyle: React.CSSProperties = {
    ...wrapperStyle,
    display: wrapperStyle.position ? 'inline-flex' : 'flex',
    flexDirection: 'column',
    alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
    justifyContent: 'center',
    height: wrapperStyle.position ? (resolvedImageHeight === 'auto' ? undefined : resolvedImageHeight) : undefined,
  };

  const borderStyles: React.CSSProperties = {};
  if (props.borderType && props.borderType !== 'none') {
    borderStyles.borderStyle = (props.borderType || 'solid') as any;
    borderStyles.borderColor = props.borderColor || '#000000';
    borderStyles.borderTopWidth = props.borderTopWidth || props.borderWidth || '0px';
    borderStyles.borderRightWidth = props.borderRightWidth || props.borderWidth || '0px';
    borderStyles.borderBottomWidth = props.borderBottomWidth || props.borderWidth || '0px';
    borderStyles.borderLeftWidth = props.borderLeftWidth || props.borderWidth || '0px';
  }

  const hasCustomRadius = props.borderRadius || props.borderTopLeftRadius || props.borderTopRightRadius || props.borderBottomRightRadius || props.borderBottomLeftRadius;
  if (hasCustomRadius) {
    borderStyles.borderTopLeftRadius = props.borderTopLeftRadius || props.borderRadius;
    borderStyles.borderTopRightRadius = props.borderTopRightRadius || props.borderRadius;
    borderStyles.borderBottomRightRadius = props.borderBottomRightRadius || props.borderRadius;
    borderStyles.borderBottomLeftRadius = props.borderBottomLeftRadius || props.borderRadius;
  } else {
    borderStyles.borderRadius = '8px'; // default placeholder radius
  }

  const currentOpacity = hovered && opacityHover !== undefined ? parseFloat(opacityHover as string) : (opacity !== undefined ? parseFloat(opacity as string) : 1);
  const currentCssFilter = hovered && cssFiltersHover !== undefined && cssFiltersHover !== 'none' ? cssFiltersHover : (cssFilters || 'none');
  const currentBoxShadow = hovered && boxShadowHover !== undefined && boxShadowHover !== 'none' ? boxShadowHover : (boxShadow || 'none');

  const imageStyle: React.CSSProperties = {
    width: resolvedImageWidth,
    maxWidth: resolvedImageMaxWidth,
    height: resolvedImageHeight,
    objectFit,
    display: widthMode === 'inline' ? 'inline-block' : 'block',
    opacity: currentOpacity,
    filter: currentCssFilter === 'none' ? undefined : currentCssFilter,
    boxShadow: currentBoxShadow === 'none' ? undefined : currentBoxShadow,
    ...borderStyles,
    transition: 'all 0.2s ease-in-out',
  };

  const handlePositionMouseDown = usePositionDrag({
    id,
    enabled,
    isLocked,
    props,
    setProp,
  }).handlePositionMouseDown;

  const handleDragOver = (e: React.DragEvent) => {
    if (!enabled || isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!enabled || isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (!enabled || isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (data.success && data.media) {
          setProp((props: ImageBlockProps) => {
            props.url = data.media.url;
          }, 500);
        } else {
          alert('Táº£i lÃªn tháº¥t báº¡i: ' + (data.error || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh'));
        }
      } catch (error) {
        alert('Lá»—i káº¿t ná»‘i mÃ¡y chá»§ khi táº£i áº£nh lÃªn!');
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    } else {
      alert('Vui lÃ²ng kÃ©o tháº£ tá»‡p hÃ¬nh áº£nh!');
    }
  };

  const imgElement = displayUrl ? (
    <img src={resolvedUrlWithResolution} alt={alt} style={imageStyle} className="max-w-full" />
  ) : (
    <div
      style={{
        width: resolvedImageWidth === '100%' ? '100%' : resolvedImageWidth,
        maxWidth: resolvedImageMaxWidth,
        height: resolvedImageHeight === 'auto' ? '150px' : resolvedImageHeight,
        display: widthMode === 'inline' ? 'inline-flex' : 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...borderStyles,
      }}
      className={`bg-slate-100 hover:bg-slate-200/80 flex flex-col items-center justify-center text-slate-400 p-4 transition-colors cursor-pointer select-none ${
        props.borderType && props.borderType !== 'none' ? '' : 'border border-dashed border-slate-300'
      }`}
    >
      <ImageIcon className="w-8 h-8 mb-2 opacity-50 text-slate-400" strokeWidth={1.5} />
      <span className="text-[11px] font-bold">ChÆ°a chá»n hÃ¬nh áº£nh</span>
    </div>
  );

  const resolvedLinkUrl = linkType === 'media'
    ? displayUrl
    : linkType === 'custom'
      ? (displayLink || '#')
      : '';

  const captionText = captionType === 'attachment'
    ? (alt || '')
    : captionType === 'custom'
      ? (customCaption || '')
      : '';

  const renderCaption = () => {
    if (!captionText) return null;
    return (
      <div className="text-center text-xs text-slate-500 mt-2 font-medium italic">
        {captionText}
      </div>
    );
  };

  const linkStyle: React.CSSProperties = {
    display: widthMode === 'inline' ? 'inline-block' : 'block',
    width: resolvedImageWidth,
    maxWidth: resolvedImageMaxWidth,
  };

  const content = resolvedLinkUrl ? (
    <a href={resolvedLinkUrl} style={linkStyle} onClick={(e) => e.preventDefault()}>
      {imgElement}
    </a>
  ) : (
    imgElement
  );

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      id={idCss}
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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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

      {enabled && isDragging && !isLocked && (
        <div className="absolute inset-0 bg-brand-500/10 border-2 border-brand-500 border-dashed rounded-lg flex flex-col items-center justify-center text-brand-600 font-bold z-40 backdrop-blur-[1px] animate-pulse">
          <span className="text-[11px] uppercase tracking-wider bg-white px-2.5 py-1.5 rounded-lg shadow-lg border border-brand-100 font-sans">
            Tháº£ file áº£nh Ä‘á»ƒ táº£i lÃªn ðŸš€
          </span>
        </div>
      )}

      {enabled && isUploading && (
        <div className="absolute inset-0 bg-slate-900/60 rounded-lg flex flex-col items-center justify-center text-white font-bold z-40 backdrop-blur-[2px]">
          <Loader2 className="animate-spin h-5 w-5 text-white mb-1.5" />
          <span className="text-[10px] tracking-wide font-sans">Äang táº£i lÃªn...</span>
        </div>
      )}

      {content}
      {renderCaption()}
    </div>
  );
};

ImageBlock.craft = {
  name: 'ImageBlock',
  props: {
    ...defaultLayoutProps,
    url: '',
    alt: 'HÃ¬nh áº£nh thiáº¿t káº¿',
    width: '100%',
    widthMode: 'full',
    customWidth: '',
    height: 'auto',
    borderRadius: '8px',
    objectFit: 'cover',
    align: 'center',
    link: '',
    imageResolution: 'large',
    captionType: 'none',
    customCaption: '',
    linkType: 'none',
    imageWidth: '100%',
    imageMaxWidth: '100%',
    imageHeight: 'auto',
    opacity: 1,
    opacityHover: 1,
    cssFilters: 'none',
    cssFiltersHover: 'none',
    boxShadow: 'none',
    boxShadowHover: 'none',
  },
  displayName: 'Hình ảnh',
};



