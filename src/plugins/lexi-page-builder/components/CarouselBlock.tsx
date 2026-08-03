"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useEffect, useState } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Pencil, Images, ChevronLeft, ChevronRight } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps } from './LayoutHelper';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';
import { getLucideReactComponent } from '../utils/iconRegistry';
import { getResolutionUrl } from './ImageBlock';

export interface CarouselImage {
  id: string;
  url: string;
  alt?: string;
  title?: string;
  description?: string;
}

export interface CarouselBlockProps extends CommonLayoutProps {
  carouselName?: string;
  images?: CarouselImage[];
  imageResolution?: 'thumbnail' | 'medium' | 'large' | 'full';
  slidesToShow?: 'default' | '1' | '2' | '3' | '4' | '5' | '6';
  slidesToScroll?: 'default' | '1' | '2' | '3' | '4' | '5' | '6';
  imageStretch?: 'yes' | 'no';
  navigation?: 'arrows_dots' | 'arrows' | 'dots' | 'none';
  iconLeft?: string;
  iconRight?: string;
  linkType?: 'none' | 'media' | 'custom';
  link?: string;
  captionType?: 'none' | 'title' | 'caption' | 'description';
  
  // Tùy chọn bổ sung (Additional Options)
  lazyLoad?: 'yes' | 'no';
  autoplay?: 'yes' | 'no';
  pauseOnHover?: 'yes' | 'no';
  pauseOnInteraction?: 'yes' | 'no';
  autoplaySpeed?: number | string;
  infiniteLoop?: 'yes' | 'no';
  animationSpeed?: number | string;
  direction?: 'ltr' | 'rtl';

  // STYLING PROPS
  // Arrows
  arrowsPosition?: 'inside' | 'outside';
  arrowsSize?: string;
  arrowsColor?: string;
  
  // Dots
  dotsPosition?: 'inside' | 'outside';
  dotsSpacing?: string;
  dotsSize?: string;
  dotsColor?: string;
  dotsActiveColor?: string;
  
  // Image
  imageAlign?: 'start' | 'center' | 'end';
  imageSpacing?: string;
  borderType?: 'none' | 'solid' | 'double' | 'dotted' | 'dashed' | 'hidden';
  borderColor?: string;
  borderWidth?: string;
  borderTopWidth?: string;
  borderRightWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomRightRadius?: string;
  borderBottomLeftRadius?: string;
}

export const CarouselBlock = (rawProps: CarouselBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    carouselName = 'Băng chuyền hình ảnh',
    images = [],
    imageResolution = 'large',
    slidesToShow = 'default',
    slidesToScroll = 'default',
    imageStretch = 'no',
    navigation = 'arrows_dots',
    iconLeft = 'ChevronLeft',
    iconRight = 'ChevronRight',
    linkType = 'none',
    link = '',
    captionType = 'none',
    
    lazyLoad = 'no',
    autoplay = 'yes',
    pauseOnHover = 'yes',
    pauseOnInteraction = 'yes',
    autoplaySpeed = 5000,
    infiniteLoop = 'yes',
    animationSpeed = 500,
    direction = 'ltr',

    arrowsPosition = 'inside',
    arrowsSize = '24px',
    arrowsColor = '#000000',

    dotsPosition = 'outside',
    dotsSpacing = '8px',
    dotsSize = '8px',
    dotsColor = '#cccccc',
    dotsActiveColor = '#000000',

    imageAlign = 'center',
    imageSpacing = '10px',
    borderType = 'none',
    borderColor = '#000000',
    borderWidth = '0px',
    borderRadius = '8px',

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
  const [currentIndex, setCurrentIndex] = useState(0);

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
    borderType: 'none', // border is applied inside slide images, not container wrapper
  };

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'block', id);

  const { handlePositionMouseDown } = usePositionDrag({
    id,
    enabled,
    isLocked,
    props,
    setProp,
  });

  const parsedSlidesToShow = slidesToShow === 'default' ? 3 : parseInt(slidesToShow);
  const parsedSlidesToScroll = slidesToScroll === 'default' ? 1 : parseInt(slidesToScroll);

  const totalSlides = images.length;
  const maxIndex = Math.max(0, totalSlides - parsedSlidesToShow);

  const nextSlide = () => {
    if (totalSlides <= parsedSlidesToShow) return;
    if (currentIndex >= maxIndex) {
      if (infiniteLoop === 'yes') {
        setCurrentIndex(0);
      }
    } else {
      setCurrentIndex(prev => Math.min(maxIndex, prev + parsedSlidesToScroll));
    }
  };

  const prevSlide = () => {
    if (totalSlides <= parsedSlidesToShow) return;
    if (currentIndex <= 0) {
      if (infiniteLoop === 'yes') {
        setCurrentIndex(maxIndex);
      }
    } else {
      setCurrentIndex(prev => Math.max(0, prev - parsedSlidesToScroll));
    }
  };

  // Image spacing styling helper
  const parsedImageSpacing = imageSpacing && !isNaN(Number(imageSpacing)) ? `${imageSpacing}px` : imageSpacing || '10px';

  // Resolved Arrow icons
  const LeftArrowComp = getLucideReactComponent(iconLeft || 'ChevronLeft') || ChevronLeft;
  const RightArrowComp = getLucideReactComponent(iconRight || 'ChevronRight') || ChevronRight;

  // Render slides
  const renderSlides = () => {
    return (
      <div 
        className="flex transition-transform duration-300 ease-in-out" 
        style={{
          transform: `translateX(-${currentIndex * (100 / parsedSlidesToShow)}%)`,
          gap: parsedImageSpacing,
        }}
      >
        {images.map((img, idx) => {
          const resolvedUrl = getResolutionUrl(img.url, imageResolution);
          
          const imageStyles: React.CSSProperties = {
            width: `calc((100% - ${parsedImageSpacing} * ${parsedSlidesToShow - 1}) / ${parsedSlidesToShow})`,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: imageAlign === 'start' ? 'flex-start' : imageAlign === 'end' ? 'flex-end' : 'center',
          };

          const imgElStyle: React.CSSProperties = {
            width: '100%',
            height: imageStretch === 'yes' ? '100%' : 'auto',
            objectFit: imageStretch === 'yes' ? 'cover' : 'contain',
            borderRadius: props.borderRadius || '8px',
            borderTopLeftRadius: props.borderTopLeftRadius || props.borderRadius,
            borderTopRightRadius: props.borderTopRightRadius || props.borderRadius,
            borderBottomRightRadius: props.borderBottomRightRadius || props.borderRadius,
            borderBottomLeftRadius: props.borderBottomLeftRadius || props.borderRadius,
            borderStyle: (borderType !== 'none' ? borderType : undefined) as any,
            borderColor: borderType !== 'none' ? borderColor : undefined,
            borderTopWidth: props.borderTopWidth || props.borderWidth || '0px',
            borderRightWidth: props.borderRightWidth || props.borderWidth || '0px',
            borderBottomWidth: props.borderBottomWidth || props.borderWidth || '0px',
            borderLeftWidth: props.borderLeftWidth || props.borderWidth || '0px',
          };

          const getCaptionText = () => {
            if (captionType === 'title') return img.title || '';
            if (captionType === 'caption') return img.alt || '';
            if (captionType === 'description') return img.description || '';
            return '';
          };

          const captionText = getCaptionText();

          return (
            <div key={img.id || idx} style={imageStyles} className="relative group/slide select-none">
              <img 
                src={resolvedUrl || img.url} 
                alt={img.alt || 'Carousel image'} 
                style={imgElStyle} 
                className="max-w-full"
                draggable={false}
              />
              {captionText && (
                <div className="text-center text-[11px] text-slate-500 font-medium italic mt-1.5 px-1 truncate">
                  {captionText}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const showArrows = navigation === 'arrows_dots' || navigation === 'arrows';
  const showDots = navigation === 'arrows_dots' || navigation === 'dots';

  const dotCount = Math.max(1, totalSlides - parsedSlidesToShow + 1);

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      id={idCss}
      style={wrapperStyle}
      className={`relative group transition-all duration-200 py-2 font-sans ${
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

      {images.length === 0 ? (
        <div className="bg-slate-100 hover:bg-slate-200/80 border border-dashed border-slate-300 rounded-lg py-8 px-4 flex flex-col items-center justify-center text-slate-400 text-center transition-colors cursor-pointer">
          <Images className="w-10 h-10 mb-2 opacity-50 text-slate-400" strokeWidth={1.5} />
          <span className="text-xs font-bold text-slate-600">{carouselName}</span>
          <span className="text-[10px] text-slate-400 mt-1">Chưa chọn hình ảnh. Vui lòng thêm ảnh từ bảng cài đặt bên phải.</span>
        </div>
      ) : (
        <div className={`relative w-full ${arrowsPosition === 'outside' && showArrows ? 'px-10' : ''}`}>
          <div className="overflow-hidden w-full">
            {renderSlides()}
          </div>

          {/* Left Arrow */}
          {showArrows && totalSlides > parsedSlidesToShow && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevSlide();
              }}
              style={{
                color: arrowsColor,
                fontSize: arrowsSize,
              }}
              className={`absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center bg-white/70 hover:bg-white p-1.5 rounded-full shadow-md transition-colors ${
                arrowsPosition === 'inside' ? 'left-3' : 'left-0'
              }`}
            >
              <LeftArrowComp style={{ width: arrowsSize, height: arrowsSize }} />
            </button>
          )}

          {/* Right Arrow */}
          {showArrows && totalSlides > parsedSlidesToShow && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextSlide();
              }}
              style={{
                color: arrowsColor,
                fontSize: arrowsSize,
              }}
              className={`absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center bg-white/70 hover:bg-white p-1.5 rounded-full shadow-md transition-colors ${
                arrowsPosition === 'inside' ? 'right-3' : 'right-0'
              }`}
            >
              <RightArrowComp style={{ width: arrowsSize, height: arrowsSize }} />
            </button>
          )}

          {/* Dots */}
          {showDots && dotCount > 1 && (
            <div 
              style={{
                gap: dotsSpacing,
              }}
              className={`flex justify-center items-center mt-3 ${
                dotsPosition === 'inside' ? 'absolute bottom-2 left-0 right-0 z-10 mt-0' : ''
              }`}
            >
              {Array.from({ length: dotCount }).map((_, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <span
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    style={{
                      width: dotsSize,
                      height: dotsSize,
                      backgroundColor: isActive ? dotsActiveColor : dotsColor,
                    }}
                    className="rounded-full cursor-pointer transition-colors"
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

CarouselBlock.craft = {
  name: 'CarouselBlock',
  props: {
    ...defaultLayoutProps,
    carouselName: 'Băng chuyền hình ảnh',
    images: [],
    imageResolution: 'large',
    slidesToShow: 'default',
    slidesToScroll: 'default',
    imageStretch: 'no',
    navigation: 'arrows_dots',
    iconLeft: 'ChevronLeft',
    iconRight: 'ChevronRight',
    linkType: 'none',
    link: '',
    captionType: 'none',

    lazyLoad: 'no',
    autoplay: 'yes',
    pauseOnHover: 'yes',
    pauseOnInteraction: 'yes',
    autoplaySpeed: 5000,
    infiniteLoop: 'yes',
    animationSpeed: 500,
    direction: 'ltr',

    arrowsPosition: 'inside',
    arrowsSize: '24px',
    arrowsColor: '#000000',

    dotsPosition: 'outside',
    dotsSpacing: '8px',
    dotsSize: '8px',
    dotsColor: '#cccccc',
    dotsActiveColor: '#000000',

    imageAlign: 'center',
    imageSpacing: '10px',
    borderType: 'none',
    borderColor: '#000000',
    borderWidth: '0px',
    borderRadius: '8px',

    width: '100%',
  },
  displayName: 'Băng chuyền hình ảnh',
};
