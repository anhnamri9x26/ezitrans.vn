"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { PlayCircle, Pencil, X } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps } from './LayoutHelper';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';
import { getLucideReactComponent } from '../utils/iconRegistry';

export interface VideoBlockProps extends CommonLayoutProps {
  url?: string;
  ratio?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;

  // New Elementor parity properties
  source?: 'youtube' | 'self_hosted';
  startTime?: string | number;
  endTime?: string | number;
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  controls?: boolean;
  captions?: boolean;
  privacy?: boolean;
  lazyLoad?: boolean;
  suggestedVideos?: 'current' | 'any';
  
  // Image Overlay
  showOverlay?: boolean;
  overlayImage?: string;
  overlayImageResolution?: 'full' | 'large' | 'medium' | 'thumbnail';
  showPlayIcon?: boolean;
  playIconType?: 'default' | 'svg' | 'lucide';
  playIconSvg?: string;
  playIconLucide?: string;
  lightbox?: boolean;

  // Styling properties
  playIconColor?: string;
  playIconSize?: string;
  playIconShadowColor?: string;
  playIconShadowHorizontal?: string;
  playIconShadowVertical?: string;
  playIconShadowBlur?: string;
  playIconShadowSpread?: string;
  cssFilters?: string;
}

const toBool = (val: any, defaultVal = false): boolean => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (val === true || val === 'true' || val === '1' || val === 1) return true;
  return false;
};

const toBoolDefaultTrue = (val: any): boolean => {
  if (val === undefined || val === null || val === '') return true;
  if (val === false || val === 'false' || val === '0' || val === 0) return false;
  return true;
};

export const VideoBlock = (rawProps: VideoBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    url = '',
    ratio = '16/9',
    align = 'center',
    className = '',
    height = 'auto',
    widthMode = 'full',
    width = '100%',
    customWidth = '',

    // Parity Defaults
    source = 'youtube',
    startTime = '',
    endTime = '',
    suggestedVideos = 'current',
    overlayImage = '',
    overlayImageResolution = 'full',
    playIconType = 'default',
    playIconSvg = '',
    playIconLucide = 'Play',
    playIconColor = '#ffffff',
    playIconSize = '60',
    playIconShadowColor = 'rgba(0, 0, 0, 0.3)',
    playIconShadowHorizontal = '0',
    playIconShadowVertical = '10',
    playIconShadowBlur = '25',
    playIconShadowSpread = '0',
    cssFilters = '',
  } = props;

  const autoplay = toBool(props.autoplay, false);
  const mute = toBool(props.mute, false);
  const loop = toBool(props.loop, false);
  const controls = toBoolDefaultTrue(props.controls);
  const captions = toBool(props.captions, false);
  const privacy = toBool(props.privacy, false);
  const lazyLoad = toBool(props.lazyLoad, false);
  const showOverlay = toBool(props.showOverlay, false);
  const showPlayIcon = toBoolDefaultTrue(props.showPlayIcon);
  const lightbox = toBool(props.lightbox, false);

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
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const handleCloseContextMenus = (event: Event) => {
      const activeId = (event as CustomEvent<string>).detail;
      if (activeId !== id) setContextMenu(null);
    };

    window.addEventListener('craft-close-context-menus', handleCloseContextMenus);
    return () => window.removeEventListener('craft-close-context-menus', handleCloseContextMenus);
  }, [id]);

  const getVideoEmbedUrl = () => {
    if (!url) return '';

    if (source === 'self_hosted') return url;

    // Standard YouTube URL parsing
    if (source === 'youtube') {
      let videoId = '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
      } else if (url.length === 11) {
        videoId = url;
      }

      if (!videoId) return url;

      const domain = privacy ? 'https://www.youtube-nocookie.com' : 'https://www.youtube';
      const params = new URLSearchParams();
      const shouldAutoplay = autoplay || overlayDismissed;
      params.set('autoplay', shouldAutoplay ? '1' : '0');
      params.set('mute', mute ? '1' : '0');
      params.set('playsinline', '1');
      if (!controls) params.set('controls', '0');
      if (captions) params.set('cc_load_policy', '1');
      if (privacy) params.set('modestbranding', '1');
      if (suggestedVideos === 'current') params.set('rel', '0');
      if (loop) {
        params.set('loop', '1');
        params.set('playlist', videoId);
      }
      if (startTime) params.set('start', String(startTime));
      if (endTime) params.set('end', String(endTime));

      return `${domain}.com/embed/${videoId}?${params.toString()}`;
    }


    return url;
  };

  const embedUrl = getVideoEmbedUrl();

  useEffect(() => {
    setOverlayDismissed(false);
    setLightboxOpen(false);
  }, [url, overlayImage, showOverlay, source]);

  const lightboxEmbedUrl = lightboxOpen && source === 'youtube'
    ? embedUrl.replace(/([?&])autoplay=0(?=&|$)/, '$1autoplay=1')
    : embedUrl;

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
  };

  const { wrapperStyle, idCss, classCss } = getWrapperStyles(mappedProps as any, 'flex', id);

  const resolvedWidth = widthMode === 'full'
    ? '100%'
    : widthMode === 'inline'
      ? 'auto'
      : widthMode === 'custom'
        ? customWidth || width
        : width;

  const mergedWrapperStyle: React.CSSProperties = {
    ...wrapperStyle,
    display: 'flex',
    width: wrapperStyle.position ? wrapperStyle.width : '100%',
    justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
    height: wrapperStyle.position ? (height === 'auto' ? undefined : height) : undefined,
  };

  const videoWidth = resolvedWidth;
  const videoHeight = height === 'auto' ? undefined : height;

  const borderStyles: React.CSSProperties = {};
  if (props.borderType && props.borderType !== 'none') {
    borderStyles.borderStyle = (props.borderType || 'solid') as any;
    borderStyles.borderColor = props.borderColor || '#000000';
    borderStyles.borderTopWidth = props.borderTopWidth || props.borderWidth || '0px';
    borderStyles.borderRightWidth = props.borderRightWidth || props.borderWidth || '0px';
    borderStyles.borderBottomWidth = props.borderBottomWidth || props.borderWidth || '0px';
    borderStyles.borderLeftWidth = props.borderLeftWidth || props.borderWidth || '0px';
  } else {
    borderStyles.border = enabled ? '1px solid #e2e8f0' : 'none';
  }

  const hasCustomRadius = props.borderRadius || props.borderTopLeftRadius || props.borderTopRightRadius || props.borderBottomRightRadius || props.borderBottomLeftRadius;
  if (hasCustomRadius) {
    borderStyles.borderTopLeftRadius = props.borderTopLeftRadius || props.borderRadius;
    borderStyles.borderTopRightRadius = props.borderTopRightRadius || props.borderRadius;
    borderStyles.borderBottomRightRadius = props.borderBottomRightRadius || props.borderRadius;
    borderStyles.borderBottomLeftRadius = props.borderBottomLeftRadius || props.borderRadius;
  } else {
    borderStyles.borderRadius = '8px';
  }

  const getAspectRatio = () => {
    const safeRatio = (ratio || '16/9').replace(':', '/');
    return safeRatio;
  };

  const { handlePositionMouseDown } = usePositionDrag({
    id,
    enabled,
    isLocked,
    props,
    setProp,
  });

  const resolvedPlayIconColor = playIconColor || '#ffffff';
  const resolvedPlayIconSize = parseInt(playIconSize) || 60;

  const playIconShadow = playIconShadowColor 
    ? `${playIconShadowHorizontal || '0'}px ${playIconShadowVertical || '10'}px ${playIconShadowBlur || '25'}px ${playIconShadowSpread || '0'}px ${playIconShadowColor}`
    : 'none';

  const playIconWrapperStyle: React.CSSProperties = {
    color: resolvedPlayIconColor,
    width: `${resolvedPlayIconSize}px`,
    height: `${resolvedPlayIconSize}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: playIconShadow && playIconShadow !== 'none' ? playIconShadow : undefined,
    borderRadius: playIconType === 'default' ? '50%' : undefined,
  };

  const getResolvedOverlayImage = () => {
    if (!overlayImage || overlayImageResolution === 'full') return overlayImage;

    const sizeMap: Record<string, string> = {
      thumbnail: '150x150',
      medium: '300x300',
      large: '1024x1024',
    };
    const size = sizeMap[overlayImageResolution];
    if (!size) return overlayImage;

    try {
      const urlObj = new URL(overlayImage, window.location.origin);
      const path = urlObj.pathname;
      const extensionMatch = path.match(/\.(jpe?g|png|webp|gif)$/i);
      if (!extensionMatch) return overlayImage;
      urlObj.pathname = path.replace(/\.(jpe?g|png|webp|gif)$/i, `-${size}.$1`);
      return urlObj.toString();
    } catch {
      return overlayImage.replace(/\.(jpe?g|png|webp|gif)(\?.*)?$/i, `-${size}.$1$2`);
    }
  };

  const resolvedOverlayImage = getResolvedOverlayImage();

  const renderPlayIcon = () => {
    if (!showPlayIcon) return null;

    let iconContent = null;
    if (playIconType === 'lucide') {
      const IconComponent = getLucideReactComponent(playIconLucide || 'Play');
      if (IconComponent) {
        iconContent = <IconComponent size={resolvedPlayIconSize} style={{ filter: playIconShadow && playIconShadow !== 'none' ? `drop-shadow(${playIconShadow.replace(/inset/g, '')})` : undefined }} />;
      }
    } else if (playIconType === 'svg' && playIconSvg) {
      iconContent = (
        <div 
          dangerouslySetInnerHTML={{ __html: playIconSvg }} 
          style={{ width: resolvedPlayIconSize, height: resolvedPlayIconSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
        />
      );
    } else {
      // Default circular overlay button
      const PlayIcon = getLucideReactComponent('Play');
      if (PlayIcon) {
        iconContent = (
          <div 
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '50%',
              width: `${resolvedPlayIconSize}px`,
              height: `${resolvedPlayIconSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: `${resolvedPlayIconSize * 0.05}px`,
              boxShadow: playIconShadow && playIconShadow !== 'none' ? playIconShadow : '0px 10px 25px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
            }}
            className="hover:scale-110 hover:bg-black/80 flex items-center justify-center pointer-events-none"
          >
            <PlayIcon size={resolvedPlayIconSize * 0.4} color={resolvedPlayIconColor} fill={resolvedPlayIconColor} />
          </div>
        );
      }
    }

    if (playIconType !== 'default') {
      return (
        <div 
          style={playIconWrapperStyle} 
          className="hover:scale-110 active:scale-95 duration-200 pointer-events-none"
        >
          {iconContent}
        </div>
      );
    }

    return iconContent;
  };

  const showActiveOverlay = showOverlay && resolvedOverlayImage && !overlayDismissed;

  const lightboxModal = lightboxOpen && lightboxEmbedUrl && typeof document !== 'undefined'
    ? createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
            background: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(8px)',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Video lightbox"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              width: 'min(92vw, 960px)',
              maxHeight: '86vh',
              aspectRatio: getAspectRatio(),
              background: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.55)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Đóng lightbox"
              onClick={() => setLightboxOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 2,
                width: '34px',
                height: '34px',
                borderRadius: '999px',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.72)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
            {source === 'self_hosted' ? (
              <video
                key={`lightbox-${lightboxEmbedUrl}`}
                src={lightboxEmbedUrl}
                controls={controls}
                autoPlay
                muted={mute}
                loop={loop}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <iframe
                key={`lightbox-${lightboxEmbedUrl}`}
                src={lightboxEmbedUrl}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      id={idCss}
      style={mergedWrapperStyle}
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
      <div
        style={{ width: videoWidth, height: videoHeight, ...borderStyles, filter: cssFilters || undefined, aspectRatio: height === 'auto' ? getAspectRatio() : undefined }}
        className="overflow-hidden bg-slate-900 flex items-center justify-center relative"
      >
        {showActiveOverlay ? (
          <div 
            style={{
              backgroundImage: `url(${resolvedOverlayImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            className="w-full h-full absolute inset-0 transition-transform duration-300 hover:scale-102"
            role="button"
            tabIndex={0}
            aria-label="Phát video"
            onClick={(e) => {
              e.stopPropagation();
              if (lightbox) {
                setLightboxOpen(true);
                return;
              }
              setOverlayDismissed(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (lightbox) {
                  setLightboxOpen(true);
                  return;
                }
                setOverlayDismissed(true);
              }
            }}
          >
            {renderPlayIcon()}
          </div>
        ) : embedUrl ? (
          source === 'self_hosted' ? (
            <video
              key={embedUrl}
              src={embedUrl}
              controls={controls}
              autoPlay={autoplay || overlayDismissed}
              muted={mute}
              loop={loop}
              className="w-full h-full object-contain"
            />
          ) : (
            <iframe
              key={embedUrl}
              src={embedUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full absolute inset-0"
            />
          )
        ) : (
          <div className="text-center text-slate-400 p-8 flex flex-col items-center justify-center">
            <PlayCircle className="w-10 h-10 mb-2 opacity-50 text-red-500 animate-pulse" strokeWidth={1.5} />
            <span className="text-xs font-bold">Chưa nhập đường dẫn video (YouTube hoặc Tự lưu trữ)</span>
          </div>
        )}
      </div>
      {lightboxModal}
    </div>
  );
};

VideoBlock.craft = {
  name: 'VideoBlock',
  props: {
    source: 'youtube',
    url: '',
    ratio: '16/9',
    align: 'center',
    startTime: '',
    endTime: '',
    autoplay: false,
    mute: false,
    loop: false,
    controls: true,
    captions: false,
    privacy: false,
    lazyLoad: false,
    suggestedVideos: 'current',
    showOverlay: false,
    overlayImage: '',
    overlayImageResolution: 'full',
    showPlayIcon: true,
    playIconType: 'default',
    playIconSvg: '',
    playIconLucide: 'Play',
    lightbox: false,
    playIconColor: '#ffffff',
    playIconSize: '60',
    playIconShadowColor: 'rgba(0, 0, 0, 0.3)',
    playIconShadowHorizontal: '0',
    playIconShadowVertical: '10',
    playIconShadowBlur: '25',
    playIconShadowSpread: '0',
    cssFilters: '',
    ...defaultLayoutProps,
    width: '100%',
  },
  displayName: 'Video',
};



