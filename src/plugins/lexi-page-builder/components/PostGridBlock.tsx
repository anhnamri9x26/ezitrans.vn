"use client";

import { useResponsiveProps } from './useResponsiveProps';

import React, { useState, useEffect } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import FloatingToolbar from './FloatingToolbar';
import { Pencil } from 'lucide-react';
import { CommonLayoutProps, defaultLayoutProps } from './LayoutHelper';
import { usePositionDrag } from './usePositionDrag';
import { getWrapperStyles, createResponsiveProps } from '../utils/styleResolver';

export interface PostGridBlockProps extends CommonLayoutProps {
  [key: string]: any;
  colorPreset?: string;
  columns?: string;
  postsPerPage?: string;
  imagePosition?: string;
  masonry?: boolean;
  imageResolution?: string;
  imageRatio?: string;
  imageWidth?: string;
  showTitle?: boolean;
  titleHtmlTag?: string;
  showExcerpt?: boolean;
  excerptLength?: string;
  customExcerpt?: boolean;
  metaData?: string;
  separatorBetween?: string;
  showReadMore?: boolean;
  readMoreText?: string;
  querySource?: string;
  queryInclude?: string;
  queryExclude?: string;
  queryDate?: string;
  queryOrderBy?: string;
  queryOrder?: string;
  ignoreStickyPosts?: boolean;
  queryId?: string;
  paginationType?: string;
  columnsGap?: string;
  rowsGap?: string;
  alignment?: string;
  boxBorderTopWidth?: string;
  boxBorderRightWidth?: string;
  boxBorderBottomWidth?: string;
  boxBorderLeftWidth?: string;
  boxBorderTopLeftRadius?: string;
  boxBorderTopRightRadius?: string;
  boxBorderBottomRightRadius?: string;
  boxBorderBottomLeftRadius?: string;
  boxPaddingTop?: string;
  boxPaddingRight?: string;
  boxPaddingBottom?: string;
  boxPaddingLeft?: string;
  boxContentPaddingTop?: string;
  boxContentPaddingRight?: string;
  boxContentPaddingBottom?: string;
  boxContentPaddingLeft?: string;
  boxShadow?: string;
  boxBgColor?: string;
  boxBorderColor?: string;
  boxBgColorHover?: string;
  boxBorderColorHover?: string;
  limit?: string;
  showDate?: boolean;
  showAuthor?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const truncate = (value: string, max: number) => max > 0 && value.length > max ? `${value.slice(0, Math.max(0, max)).trim()}…` : value;
const stripHtml = (html: string) => (html || '').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const splitMeta = (value?: string) => (value || 'Date,Comments').split(',').map((item) => item.trim()).filter(Boolean);
const justifyFromAlignment = (alignment?: string) => alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start';

export const PostGridBlock = (rawProps: PostGridBlockProps) => {
  const props = useResponsiveProps(rawProps) as typeof rawProps;
  const {
    colorPreset = 'Classic', columns = '3', postsPerPage = '6', imagePosition = 'Top', imageRatio = '1.5', imageWidth = '100', showTitle = true,
    titleHtmlTag = 'H3', showExcerpt = true, excerptLength = '101', customExcerpt = false, metaData = 'Date,Comments', separatorBetween = '///',
    showReadMore = true, readMoreText = 'Read More', columnsGap = '30px', rowsGap = '35px', alignment = 'left', boxBorderTopWidth = '0px',
    boxBorderRightWidth = '0px', boxBorderBottomWidth = '0px', boxBorderLeftWidth = '0px', boxBorderTopLeftRadius = '0px', boxBorderTopRightRadius = '0px',
    boxBorderBottomRightRadius = '0px', boxBorderBottomLeftRadius = '0px', boxPaddingTop = '0px', boxPaddingRight = '0px', boxPaddingBottom = '0px',
    boxPaddingLeft = '0px', boxContentPaddingTop = '0px', boxContentPaddingRight = '0px', boxContentPaddingBottom = '0px', boxContentPaddingLeft = '0px',
    boxShadow = 'none', boxBgColor = 'transparent', boxBorderColor = 'transparent', boxBgColorHover = 'transparent', boxBorderColorHover = 'transparent',
  } = props;

  const { connectors: { connect, drag }, actions: { setProp }, selected, id, displayName, isLocked } = useNode((node) => ({
    selected: node.events.selected,
    id: node.id,
    displayName: node.data.displayName || node.data.name,
    isLocked: Boolean(node.data.custom?.locked),
  }));

  const { enabled, actions: editorActions } = useEditor((state) => ({ enabled: state.options.enabled }));
  const [hovered, setHovered] = useState(false);
  const [cardHovered, setCardHovered] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [realPosts, setRealPosts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/posts?type=POST')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.posts) {
          setRealPosts(data.posts);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleCloseContextMenus = (event: Event) => {
      const activeId = (event as CustomEvent<string>).detail;
      if (activeId !== id) setContextMenu(null);
    };
    window.addEventListener('craft-close-context-menus', handleCloseContextMenus);
    return () => window.removeEventListener('craft-close-context-menus', handleCloseContextMenus);
  }, [id]);

  const { wrapperStyle, idCss, classCss } = getWrapperStyles({ ...props, advancedBgType: props.advancedBgType || 'classic' }, 'block', id);
  const { handlePositionMouseDown } = usePositionDrag({ id, enabled, isLocked, props, setProp });
  const finalWrapperStyle = { ...wrapperStyle, width: props.widthMode === 'full' ? '100%' : (props.width || '100%') };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLocked) {
      editorActions.selectNode(id);
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const colCount = clamp(toNumber(columns, 3), 1, 6);
  const mockLimit = clamp(toNumber(postsPerPage || props.limit, 6), 1, 24);
  const excerptMax = clamp(toNumber(excerptLength, 101), 0, 500);
  const metaItems = splitMeta(metaData);
  const imagePos = imagePosition || 'Top';
  const showImage = imagePos !== 'None';
  const isHorizontal = imagePos === 'Left' || imagePos === 'Right';
  const TitleTag = (titleHtmlTag || 'H3').toLowerCase() as any;
  
  const imageWidthStr = String(props.imageWidth || '100');
  const actualImageWidth = (isHorizontal && imageWidthStr === '100') ? '40' : imageWidthStr;

  const presetStyle = colorPreset === 'Cards'
    ? { background: '#ffffff', border: '#f8fafc', radius: '20px', shadow: '0 12px 30px rgba(15, 23, 42, 0.08)', hoverShadow: '0 20px 40px rgba(15, 23, 42, 0.12)', hoverTranslate: '-4px' }
    : colorPreset === 'Full Content'
      ? { background: 'transparent', border: 'transparent', radius: '0px', shadow: 'none', hoverShadow: 'none', hoverTranslate: '0' }
      : { background: '#ffffff', border: '#f1f5f9', radius: '16px', shadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)', hoverShadow: '0 12px 20px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)', hoverTranslate: '-4px' };

  const getStyle = (val: string | undefined, defVal: string, presetVal: string) => {
    if (val === undefined || val === '') return presetVal;
    return val;
  };

  const cardStyle = (index: number): React.CSSProperties => ({
    backgroundColor: cardHovered === index 
      ? getStyle(boxBgColorHover, 'transparent', getStyle(boxBgColor, 'transparent', presetStyle.background))
      : getStyle(boxBgColor, 'transparent', presetStyle.background),
    borderStyle: 'solid',
    borderColor: cardHovered === index
      ? getStyle(boxBorderColorHover, 'transparent', getStyle(boxBorderColor, 'transparent', presetStyle.border))
      : getStyle(boxBorderColor, 'transparent', presetStyle.border),
    borderTopWidth: getStyle(boxBorderTopWidth, '0px', colorPreset === 'Full Content' ? '0px' : '1px'),
    borderRightWidth: getStyle(boxBorderRightWidth, '0px', colorPreset === 'Full Content' ? '0px' : '1px'),
    borderBottomWidth: getStyle(boxBorderBottomWidth, '0px', colorPreset === 'Full Content' ? '0px' : '1px'),
    borderLeftWidth: getStyle(boxBorderLeftWidth, '0px', colorPreset === 'Full Content' ? '0px' : '1px'),
    borderTopLeftRadius: getStyle(boxBorderTopLeftRadius, '0px', presetStyle.radius),
    borderTopRightRadius: getStyle(boxBorderTopRightRadius, '0px', presetStyle.radius),
    borderBottomRightRadius: getStyle(boxBorderBottomRightRadius, '0px', presetStyle.radius),
    borderBottomLeftRadius: getStyle(boxBorderBottomLeftRadius, '0px', presetStyle.radius),
    paddingTop: getStyle(boxPaddingTop, '0px', '0px'),
    paddingRight: getStyle(boxPaddingRight, '0px', '0px'),
    paddingBottom: getStyle(boxPaddingBottom, '0px', '0px'),
    paddingLeft: getStyle(boxPaddingLeft, '0px', '0px'),
    boxShadow: cardHovered === index && getStyle(boxShadow, 'none', 'none') === 'none' ? presetStyle.hoverShadow : getStyle(boxShadow, 'none', presetStyle.shadow),
    display: 'flex',
    flexDirection: isHorizontal ? (imagePos === 'Right' ? 'row-reverse' : 'row') : 'column',
    overflow: 'hidden',
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: cardHovered === index ? `translateY(${presetStyle.hoverTranslate})` : undefined,
    minWidth: 0,
  });

  const contentStyle: React.CSSProperties = {
    paddingTop: boxContentPaddingTop || (colorPreset === 'Full Content' ? '14px' : '20px'),
    paddingRight: boxContentPaddingRight || (colorPreset === 'Full Content' ? '0px' : '20px'),
    paddingBottom: boxContentPaddingBottom || (colorPreset === 'Full Content' ? '0px' : '20px'),
    paddingLeft: boxContentPaddingLeft || (colorPreset === 'Full Content' ? '0px' : '20px'),
    textAlign: alignment as any,
    flex: 1,
    minWidth: 0,
  };

  const displayPosts = realPosts.length > 0 ? realPosts.slice(0, mockLimit).map((p: any) => ({
    id: p.id,
    title: p.title,
    excerpt: truncate(p.excerpt ? p.excerpt : stripHtml(p.content || ''), excerptMax),
    date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('vi-VN') : '',
    author: p.author?.name || 'Admin',
    comments: `${p.comments?.length || 0} bình luận`,
    image: p.featuredImage?.url
  })) : Array.from({ length: mockLimit }).map((_, i) => ({
    id: `mock-${i}`,
    title: `Tiêu đề bài viết mẫu số ${i + 1}`,
    excerpt: customExcerpt ? `Custom excerpt mẫu cho bài viết ${i + 1}.` : `Đây là đoạn trích dẫn ngắn cho bài viết mẫu số ${i + 1}. Bạn có thể thay đổi số lượng bài viết, độ dài đoạn trích và các metadata.`,
    date: '15/05/2026',
    author: 'Lexi Admin',
    comments: `${i + 1} bình luận`,
    image: null
  }));

  return (
    <div ref={(ref) => { if (ref) { if (!isLocked && enabled) connect(drag(ref)); else connect(ref); } }}
      id={idCss}
      className={`relative craft-element transition-all duration-200 ${
        enabled && selected ? 'editor-element-selected z-30' : ''
      } ${
        enabled && hovered && !selected && !isLocked ? 'editor-element-hovered z-20' : ''
      } ${
        enabled && hovered && selected && !isLocked ? 'editor-element-hover-selected' : ''
      } ${isLocked ? 'cursor-default' : ''} ${props.className || ''} ${classCss || ''}`}
      style={finalWrapperStyle} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onContextMenu={handleContextMenu} onMouseDown={handlePositionMouseDown}>
      {enabled && contextMenu && <FloatingToolbar id={id} displayName={displayName} x={contextMenu.x} y={contextMenu.y} isOpen={Boolean(contextMenu)} onClose={() => setContextMenu(null)} />}
      <div style={{ display: props.masonry ? 'block' : 'grid', columns: props.masonry ? colCount : undefined, columnGap: columnsGap, rowGap: rowsGap, gridTemplateColumns: props.masonry ? undefined : `repeat(${colCount}, minmax(0, 1fr))`, width: '100%' }}>
        {displayPosts.map((post) => {
          const metaMap: Record<string, string> = { Date: post.date, Author: post.author, Comments: post.comments };
          const activeMeta = metaItems.map((item) => metaMap[item]).filter(Boolean);
          return (
            <article key={post.id} style={{ ...cardStyle(post.id as any), breakInside: 'avoid', marginBottom: props.masonry ? rowsGap : undefined }} onMouseEnter={() => setCardHovered(post.id as any)} onMouseLeave={() => setCardHovered(null)}>
              {showImage && <div style={{ width: isHorizontal ? `${actualImageWidth}%` : '100%', flex: isHorizontal ? `0 0 ${actualImageWidth}%` : undefined, aspectRatio: isHorizontal ? undefined : imageRatio, minHeight: isHorizontal ? 120 : undefined, background: '#f1f5f9', position: 'relative', overflow: 'hidden', borderTopLeftRadius: getStyle(props.imgBorderTopLeftRadius, '0px', '0px'), borderTopRightRadius: getStyle(props.imgBorderTopRightRadius, '0px', '0px'), borderBottomRightRadius: getStyle(props.imgBorderBottomRightRadius, '0px', '0px'), borderBottomLeftRadius: getStyle(props.imgBorderBottomLeftRadius, '0px', '0px') }}>{post.image ? <img src={post.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.5 }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>}</div>}
              <div style={contentStyle}>
                {activeMeta.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: justifyFromAlignment(alignment), marginBottom: getStyle(props.metaMarginBottom, '12px', '12px'), color: getStyle(props.metaColor, '#94a3b8', '#94a3b8'), fontSize: getStyle(props.metaFontSize, '10px', '10px'), fontWeight: getStyle(props.metaFontWeight, '700', '700'), fontFamily: props.metaFontFamily, fontStyle: props.metaFontStyle, lineHeight: props.metaLineHeight, letterSpacing: props.metaLetterSpacing, wordSpacing: props.metaWordSpacing, textTransform: 'uppercase' }}>{activeMeta.map((item, index) => <span key={`${item}-${index}`}>{item}{index < activeMeta.length - 1 ? ` ${separatorBetween} ` : ''}</span>)}</div>}
                {showTitle && <TitleTag style={{ margin: `0 0 ${getStyle(props.titleMarginBottom, '10px', '10px')}`, color: getStyle(props.titleColor, '#0f172a', '#0f172a'), fontSize: getStyle(props.titleFontSize, '16px', '16px'), fontWeight: getStyle(props.titleFontWeight, '800', '800'), fontFamily: props.titleFontFamily, fontStyle: props.titleFontStyle, lineHeight: getStyle(props.titleLineHeight, '1.35', '1.35'), letterSpacing: props.titleLetterSpacing, wordSpacing: props.titleWordSpacing, wordBreak: 'break-word', transition: 'color 0.2s', ...(cardHovered === post.id && props.titleColorHover ? { color: props.titleColorHover } : {}) }}>{post.title}</TitleTag>}
                {showExcerpt && <p style={{ margin: `0 0 ${getStyle(props.excerptMarginBottom, '14px', '14px')}`, color: getStyle(props.excerptColor, '#64748b', '#64748b'), fontSize: getStyle(props.excerptFontSize, '12px', '12px'), fontWeight: getStyle(props.excerptFontWeight, '400', '400'), fontFamily: props.excerptFontFamily, fontStyle: props.excerptFontStyle, lineHeight: getStyle(props.excerptLineHeight, '1.65', '1.65'), letterSpacing: props.excerptLetterSpacing, wordSpacing: props.excerptWordSpacing, wordBreak: 'break-word' }}>{truncate(post.excerpt, excerptMax)}</p>}
                {showReadMore && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: justifyFromAlignment(alignment), color: cardHovered === post.id && props.readMoreColorHover ? props.readMoreColorHover : getStyle(props.readMoreColor, '#4f46e5', '#4f46e5'), fontSize: getStyle(props.readMoreFontSize, '12px', '12px'), fontWeight: getStyle(props.readMoreFontWeight, '800', '800'), fontFamily: props.readMoreFontFamily, fontStyle: props.readMoreFontStyle, lineHeight: props.readMoreLineHeight, letterSpacing: props.readMoreLetterSpacing, wordSpacing: props.readMoreWordSpacing, transition: 'color 0.2s' }}>{readMoreText || 'Read More'} <span style={{ display: 'inline-block', transition: 'transform 0.3s', transform: cardHovered === post.id ? 'translateX(4px)' : 'translateX(0)' }}>→</span></span>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

PostGridBlock.craft = {
  displayName: 'Danh sách bài viết',
  props: {
    ...defaultLayoutProps,
    colorPreset: 'Classic',
    columns: '3',
    postsPerPage: '6',
    imagePosition: 'Top',
    masonry: false,
    imageResolution: 'Medium - 300 x 300',
    imageRatio: '1.5',
    imageWidth: '100',
    showTitle: true,
    titleHtmlTag: 'H3',
    showExcerpt: true,
    excerptLength: '101',
    customExcerpt: false,
    metaData: 'Date,Comments',
    separatorBetween: '///',
    showReadMore: true,
    readMoreText: 'Read More',
    querySource: 'Bài viết',
    queryInclude: '',
    queryExclude: '',
    queryDate: 'All',
    queryOrderBy: 'Date',
    queryOrder: 'DESC',
    ignoreStickyPosts: true,
    queryId: '',
    paginationType: 'None',
    columnsGap: '30px',
    rowsGap: '35px',
    alignment: 'left',
    limit: '6',
    showDate: true,
    showAuthor: true,
  },
  related: {}
};


