"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useEffect, useState, useRef } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Image as ImageIcon, Loader2, Pencil } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps, getFontFamilyFallback } from './LayoutHelper';
import { EditableText } from './EditableText';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';
import { resolveDynamicValue, DynamicConfig } from '../utils/dynamicResolver';
import { getResolutionUrl } from './ImageBlock';

export interface ImageBoxBlockProps extends CommonLayoutProps {
  // Content
  url?: string;
  alt?: string;
  imageResolution?: 'thumbnail' | 'medium' | 'large' | 'full';
  title?: string;
  description?: string;
  link?: string;
  titleTag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'span' | 'p';
  dynamicTitle?: any;
  dynamicDescription?: any;
  dynamicLink?: any;
  dynamicUrl?: any;
  linkSettings?: any;

  // Box Styles
  imagePosition?: 'top' | 'left' | 'right';
  align?: 'left' | 'center' | 'right' | 'justify';
  imageSpacing?: string;
  contentSpacing?: string;

  // Image Styles
  imageWidth?: string;
  imageHeight?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  borderRadius?: string;
  borderType?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double' | 'hidden';
  borderWidth?: string;
  borderTopWidth?: string;
  borderRightWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderColor?: string;
  borderStyle?: string;
  opacity?: number | string;
  opacityHover?: number | string;
  cssFilters?: string;
  cssFiltersHover?: string;
  boxShadow?: string;
  boxShadowHover?: string;

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

export const ImageBoxBlock = (rawProps: ImageBoxBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    url = '',
    alt = 'Hình ảnh thiết kế',
    imageResolution = 'large',
    title = 'Đây là tiêu đề',
    description = 'Thêm một đoạn văn bản ở đây. Nhấp vào ô văn bản để tùy chỉnh nội dung, phong cách phông chữ và màu sắc của đoạn văn của bạn.',
    link = '',
    titleTag = 'h3',
    dynamicTitle,
    dynamicDescription,
    dynamicLink,
    dynamicUrl,
    linkSettings,

    // Box settings
    imagePosition = 'top',
    align = 'center',
    imageSpacing = '15px',
    contentSpacing = '10px',

    // Image styles defaults
    imageWidth = '30%',
    imageHeight = 'auto',
    objectFit = 'cover',
    borderRadius = '',
    borderType = 'none',
    borderWidth = '',
    borderTopWidth,
    borderRightWidth,
    borderBottomWidth,
    borderLeftWidth,
    borderColor = 'transparent',
    borderStyle = 'solid',
    opacity = 1,
    opacityHover = 1,
    cssFilters = 'none',
    cssFiltersHover = 'none',
    boxShadow = 'none',
    boxShadowHover = 'none',

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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const titleRef = useRef<HTMLElement | null>(null);
  const descRef = useRef<HTMLElement | null>(null);

  // Dynamic values resolving
  const displayTitle = (dynamicTitle?.enabled ? resolveDynamicValue(dynamicTitle) : title) || '';
  const displayDesc = (dynamicDescription?.enabled ? resolveDynamicValue(dynamicDescription) : description) || '';
  const displayLink = (dynamicLink?.enabled ? resolveDynamicValue(dynamicLink) : link) || '';
  const displayUrl = (dynamicUrl?.enabled ? resolveDynamicValue(dynamicUrl) : url) || '';

  const resolvedUrlWithResolution = getResolutionUrl(displayUrl, imageResolution);

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
      setProp((props: ImageBoxBlockProps) => (props.title = newText), 500);
    }
  };

  const handleDescBlur = () => {
    setDescEditable(false);
    if (descRef.current) {
      const newText = descRef.current.innerHTML;
      setProp((props: ImageBoxBlockProps) => (props.description = newText), 500);
    }
  };

  const mappedProps = {
    ...props,
    advancedBgType: props.advancedBgType || 'classic',
    borderType: 'none',
  };

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'block', id);

  const { handlePositionMouseDown } = usePositionDrag({
    id,
    enabled,
    isLocked,
    props,
    setProp,
  });

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
          setProp((props: ImageBoxBlockProps) => {
            props.url = data.media.url;
          }, 500);
        } else {
          alert('Tải lên thất bại: ' + (data.error || 'Lỗi không xác định'));
        }
      } catch (error) {
        alert('Lỗi kết nối máy chủ khi tải ảnh lên!');
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    } else {
      alert('Vui lòng kéo thả tệp hình ảnh!');
    }
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
  } else if (borderRadius) {
    borderStyles.borderRadius = borderRadius;
  }

  const currentOpacity = hovered && opacityHover !== undefined ? parseFloat(opacityHover as string) : (opacity !== undefined ? parseFloat(opacity as string) : 1);
  const currentCssFilter = hovered && cssFiltersHover !== undefined && cssFiltersHover !== 'none' ? cssFiltersHover : (cssFilters || 'none');
  const currentBoxShadow = hovered && boxShadowHover !== undefined && boxShadowHover !== 'none' ? boxShadowHover : (boxShadow || 'none');

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: imageHeight,
    objectFit,
    opacity: currentOpacity,
    filter: currentCssFilter === 'none' ? undefined : currentCssFilter,
    boxShadow: currentBoxShadow === 'none' ? undefined : currentBoxShadow,
    ...borderStyles,
    transition: 'all 0.2s ease-in-out',
  };

  const renderImage = () => {
    if (displayUrl) {
      return (
        <img 
          src={resolvedUrlWithResolution} 
          alt={alt} 
          style={imageStyle} 
          className="max-w-full" 
        />
      );
    }
    return (
      <div
        style={{
          width: '100%',
          height: imageHeight === 'auto' ? '120px' : imageHeight,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          ...borderStyles,
        }}
        className={`bg-slate-100 hover:bg-slate-200/80 text-slate-400 p-4 transition-colors cursor-pointer select-none ${
          props.borderType && props.borderType !== 'none' ? '' : 'border border-dashed border-slate-300'
        }`}
      >
        <ImageIcon className="w-8 h-8 mb-2 opacity-50 text-slate-400" strokeWidth={1.5} />
        <span className="text-[10px] font-bold">Chưa chọn hình ảnh</span>
      </div>
    );
  };

  // Box flex layout classes based on imagePosition
  const isHorizontal = imagePosition === 'left' || imagePosition === 'right';
  const flexDir = imagePosition === 'top' ? 'flex-col' : (imagePosition === 'right' ? 'flex-row-reverse' : 'flex-row');

  // Text Alignment
  const textAlignmentClass = align === 'left' ? 'text-left' : (align === 'right' ? 'text-right' : (align === 'justify' ? 'text-justify' : 'text-center'));
  const itemsAlignmentClass = align === 'left' ? 'items-start' : (align === 'right' ? 'items-end' : 'items-center');

  // Title Style
  const titleStyle: React.CSSProperties = {
    color: titleColor || '#1e293b',
    fontFamily: titleFontFamily ? getFontFamilyFallback(titleFontFamily) : undefined,
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
    fontFamily: descFontFamily ? getFontFamilyFallback(descFontFamily) : undefined,
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

  // Spacing for Image Box
  const finalImageSpacing = imageSpacing || '15px';
  const imageWrapperStyle: React.CSSProperties = {
    width: isHorizontal ? (imageWidth || '30%') : '100%',
    marginBottom: imagePosition === 'top' ? finalImageSpacing : '0px',
    marginRight: imagePosition === 'left' ? finalImageSpacing : '0px',
    marginLeft: imagePosition === 'right' ? finalImageSpacing : '0px',
  };

  const renderContent = () => {
    return (
      <div 
        className={`flex ${flexDir} ${isHorizontal ? 'items-start' : itemsAlignmentClass} w-full`}
      >
        <div style={imageWrapperStyle} className="shrink-0 flex items-center justify-center relative">
          {renderImage()}
          {enabled && isDragging && !isLocked && (
            <div className="absolute inset-0 bg-brand-500/10 border-2 border-brand-500 border-dashed rounded flex flex-col items-center justify-center text-brand-600 font-bold z-40 backdrop-blur-[1px] animate-pulse">
              <span className="text-[8px] uppercase tracking-wider bg-white px-1.5 py-1 rounded shadow border border-brand-100 font-sans">
                Thả ảnh 🚀
              </span>
            </div>
          )}
          {enabled && isUploading && (
            <div className="absolute inset-0 bg-slate-900/60 rounded flex flex-col items-center justify-center text-white font-bold z-40 backdrop-blur-[2px]">
              <Loader2 className="animate-spin h-4 w-4 text-white mb-1" />
              <span className="text-[8px] tracking-wide font-sans">Tải lên...</span>
            </div>
          )}
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

ImageBoxBlock.craft = {
  name: 'ImageBoxBlock',
  props: {
    url: '',
    alt: 'Hình ảnh thiết kế',
    imageResolution: 'large',
    title: 'Đây là tiêu đề',
    description: 'Thêm một đoạn văn bản ở đây. Nhấp vào ô văn bản để tùy chỉnh nội dung, phong cách phông chữ và màu sắc của đoạn văn của bạn.',
    link: '',
    titleTag: 'h3',

    imagePosition: 'top',
    align: 'center',
    imageSpacing: '15px',
    contentSpacing: '10px',

    imageWidth: '30%',
    imageHeight: 'auto',
    objectFit: 'cover',
    borderRadius: '',
    borderType: 'none',
    borderWidth: '',
    borderTopWidth: '',
    borderRightWidth: '',
    borderBottomWidth: '',
    borderLeftWidth: '',
    borderColor: 'transparent',
    borderStyle: 'solid',
    opacity: 1,
    opacityHover: 1,
    cssFilters: 'none',
    cssFiltersHover: 'none',
    boxShadow: 'none',
    boxShadowHover: 'none',

    titleColor: '#1e293b',
    titleFontFamily: '',
    titleFontSize: '20px',
    titleFontWeight: '600',
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

    descColor: '#475569',
    descFontFamily: '',
    descFontSize: '14px',
    descFontWeight: '400',
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
  displayName: 'Hộp hình ảnh',
};



