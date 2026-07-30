import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { Calendar, User, MessageCircle, ArrowRight } from 'lucide-react';
import { generatePostUrl, formatDateWordPress } from '@/lib/permalink';

interface DynamicPostGridProps {
  [key: string]: any;
  colorPreset?: string;
  columns?: string | number;
  postsPerPage?: string | number;
  imagePosition?: string;
  masonry?: boolean | string;
  imageResolution?: string;
  imageRatio?: string;
  imageWidth?: string;
  showTitle?: boolean | string;
  titleHtmlTag?: string;
  showExcerpt?: boolean | string;
  excerptLength?: string | number;
  customExcerpt?: boolean | string;
  metaData?: string;
  separatorBetween?: string;
  showReadMore?: boolean | string;
  readMoreText?: string;
  querySource?: string;
  queryInclude?: string;
  queryExclude?: string;
  queryDate?: string;
  queryOrderBy?: string;
  queryOrder?: string;
  ignoreStickyPosts?: boolean | string;
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
  limit?: string | number;
  showDate?: boolean | string;
  showAuthor?: boolean | string;
}

const parseIntSafe = (value: unknown, fallback: number) => {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const parseBool = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value;
  if (String(value).toLowerCase() === 'true') return true;
  if (String(value).toLowerCase() === 'false') return false;
  return fallback;
};
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const splitList = (value?: string) => (value || '').split(',').map((item) => item.trim()).filter(Boolean);
const truncate = (value: string, max: number) => max > 0 && value.length > max ? `${value.slice(0, max).trim()}…` : value;
const stripHtml = (html: string) => (html || '').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const justify = (alignment?: string) => alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start';
const textAlign = (alignment?: string) => alignment === 'center' || alignment === 'right' ? alignment : 'left';
const cssEscape = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-');

export default async function DynamicPostGrid(props: DynamicPostGridProps) {
  const limit = clamp(parseIntSafe(props.postsPerPage ?? props.limit, 6), 1, 50);
  const columns = clamp(parseIntSafe(props.columns, 3), 1, 6);
  const colorPreset = props.colorPreset || 'Classic';
  const imagePosition = props.imagePosition || 'Top';
  const masonry = parseBool(props.masonry, false);
  const showTitle = parseBool(props.showTitle, true);
  const showExcerpt = parseBool(props.showExcerpt, true);
  const customExcerpt = parseBool(props.customExcerpt, false);
  const showReadMore = parseBool(props.showReadMore, true);
  const readMoreText = props.readMoreText || 'Read More';
  const excerptLength = clamp(parseIntSafe(props.excerptLength, 101), 0, 1000);
  const metaItems = splitList(props.metaData || [props.showDate === false ? '' : 'Date', props.showAuthor === false ? '' : 'Author'].filter(Boolean).join(','));
  const separator = props.separatorBetween || '///';
  const titleTag = (props.titleHtmlTag || 'H3').toLowerCase() as any;
  const gridClass = `dynamic-post-grid-${cssEscape(props.queryId || `${columns}-${limit}-${props.columnsGap || '30px'}-${props.rowsGap || '35px'}`)}`;

  const dbSettings = await prisma.setting.findMany({ where: { key: { in: ['permalink_structure', 'site_language', 'date_format', 'permalink_product_base'] } } });
  const settings = dbSettings.reduce((acc: Record<string, string>, cur) => {
    acc[cur.key] = cur.value;
    return acc;
  }, {});
  const permalinkStructure = settings.permalink_structure || '/%postname%.html';
  const siteLanguage = settings.site_language || 'vi';
  const dateFormat = settings.date_format || 'j F, Y';
  const productBaseSetting = settings['permalink_product_base'] || 'san-pham';
  const productStructureBase = productBaseSetting.startsWith('/') ? productBaseSetting : '/' + productBaseSetting;
  const productStructure = productStructureBase.endsWith('/') ? productStructureBase + '%postname%/' : productStructureBase + '/%postname%/';

  const now = new Date();
  const queryDateMap: Record<string, number> = {
    'Past Day': 1,
    'Past Week': 7,
    'Past Month': 31,
    'Past Quarter': 92,
    'Past Year': 365,
  };
  const minDate = queryDateMap[props.queryDate || 'All']
    ? new Date(now.getTime() - queryDateMap[props.queryDate || 'All'] * 24 * 60 * 60 * 1000)
    : undefined;
  const include = splitList(props.queryInclude);
  const exclude = splitList(props.queryExclude);
  const includeIds = include.map((item) => Number.parseInt(item, 10)).filter(Number.isFinite);
  const excludeIds = exclude.map((item) => Number.parseInt(item, 10)).filter(Number.isFinite);
  const includeSlugs = include.filter((item) => !Number.isFinite(Number.parseInt(item, 10)));
  const excludeSlugs = exclude.filter((item) => !Number.isFinite(Number.parseInt(item, 10)));
  const postType = props.querySource === 'Trang' ? 'PAGE' : 'POST';

  const where: any = {
    status: 'PUBLISHED',
    type: postType,
    publishedAt: { lte: now, ...(minDate ? { gte: minDate } : {}) },
    ...(includeIds.length || includeSlugs.length ? { OR: [{ id: { in: includeIds } }, { slug: { in: includeSlugs } }] } : {}),
    ...(excludeIds.length || excludeSlugs.length ? { NOT: [{ id: { in: excludeIds } }, { slug: { in: excludeSlugs } }] } : {}),
  };

  let orderBy: any = { createdAt: props.queryOrder === 'ASC' ? 'asc' : 'desc' };
  if (props.queryOrderBy === 'Title') orderBy = { title: props.queryOrder === 'ASC' ? 'asc' : 'desc' };
  if (props.queryOrderBy === 'Menu Order') orderBy = { id: props.queryOrder === 'ASC' ? 'asc' : 'desc' };

  let posts = await prisma.post.findMany({
    where,
    orderBy: props.queryOrderBy === 'Random' ? undefined : orderBy,
    take: props.queryOrderBy === 'Random' ? Math.max(limit * 3, limit) : limit,
    include: {
      author: { select: { name: true, username: true } },
      featuredImage: true,
      comments: { where: { status: 'APPROVED' }, select: { id: true } },
    },
  });
  if (props.queryOrderBy === 'Random') posts = posts.sort(() => Math.random() - 0.5).slice(0, limit);

  if (!posts.length) {
    return <div className="w-full rounded-xl border border-slate-200 bg-white py-12 text-center text-xs font-semibold text-slate-400">Chưa có nội dung phù hợp để hiển thị.</div>;
  }

  const preset = colorPreset === 'Cards'
    ? { bg: '#ffffff', radius: '20px', shadow: '0 12px 30px rgba(15, 23, 42, 0.08)', hoverShadow: '0 20px 40px rgba(15, 23, 42, 0.12)', border: '#f8fafc', hoverTranslate: '-4px' }
    : colorPreset === 'Full Content'
      ? { bg: 'transparent', radius: '0px', shadow: 'none', hoverShadow: 'none', border: 'transparent', hoverTranslate: '0' }
      : { bg: '#ffffff', radius: '16px', shadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)', hoverShadow: '0 12px 20px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)', border: '#f1f5f9', hoverTranslate: '-4px' };

  const getStyle = (val: string | undefined, defVal: string, presetVal: string) => {
    if (val === undefined || val === '') return presetVal;
    return val;
  };

  const articleStyle: React.CSSProperties = {
    backgroundColor: getStyle(props.boxBgColor, 'transparent', preset.bg),
    borderStyle: 'solid',
    borderColor: getStyle(props.boxBorderColor, 'transparent', preset.border),
    borderTopWidth: getStyle(props.boxBorderTopWidth, '0px', colorPreset === 'Full Content' ? '0px' : '1px'),
    borderRightWidth: getStyle(props.boxBorderRightWidth, '0px', colorPreset === 'Full Content' ? '0px' : '1px'),
    borderBottomWidth: getStyle(props.boxBorderBottomWidth, '0px', colorPreset === 'Full Content' ? '0px' : '1px'),
    borderLeftWidth: getStyle(props.boxBorderLeftWidth, '0px', colorPreset === 'Full Content' ? '0px' : '1px'),
    borderTopLeftRadius: getStyle(props.boxBorderTopLeftRadius, '0px', preset.radius),
    borderTopRightRadius: getStyle(props.boxBorderTopRightRadius, '0px', preset.radius),
    borderBottomRightRadius: getStyle(props.boxBorderBottomRightRadius, '0px', preset.radius),
    borderBottomLeftRadius: getStyle(props.boxBorderBottomLeftRadius, '0px', preset.radius),
    paddingTop: getStyle(props.boxPaddingTop, '0px', '0px'),
    paddingRight: getStyle(props.boxPaddingRight, '0px', '0px'),
    paddingBottom: getStyle(props.boxPaddingBottom, '0px', '0px'),
    paddingLeft: getStyle(props.boxPaddingLeft, '0px', '0px'),
    boxShadow: getStyle(props.boxShadow, 'none', preset.shadow),
    display: 'flex',
    flexDirection: imagePosition === 'Right' ? 'row-reverse' : imagePosition === 'Left' ? 'row' : 'column',
    overflow: 'hidden',
    breakInside: 'avoid',
    marginBottom: masonry ? (props.rowsGap || '35px') : undefined,
    minWidth: 0,
  };
  const contentStyle: React.CSSProperties = {
    paddingTop: props.boxContentPaddingTop || (colorPreset === 'Full Content' ? '14px' : '24px'),
    paddingRight: props.boxContentPaddingRight || (colorPreset === 'Full Content' ? '0px' : '24px'),
    paddingBottom: props.boxContentPaddingBottom || (colorPreset === 'Full Content' ? '0px' : '24px'),
    paddingLeft: props.boxContentPaddingLeft || (colorPreset === 'Full Content' ? '0px' : '24px'),
    textAlign: textAlign(props.alignment) as any,
    flex: 1,
    minWidth: 0,
  };
  const imageWidthStr = String(props.imageWidth || '100');
  const actualImageWidth = ((imagePosition === 'Left' || imagePosition === 'Right') && imageWidthStr === '100') ? '40' : imageWidthStr;

  const imageStyle: React.CSSProperties = {
    width: imagePosition === 'Left' || imagePosition === 'Right' ? `${actualImageWidth}%` : '100%',
    flex: imagePosition === 'Left' || imagePosition === 'Right' ? `0 0 ${actualImageWidth}%` : undefined,
    aspectRatio: imagePosition === 'Left' || imagePosition === 'Right' ? undefined : props.imageRatio || '1.5',
    minHeight: imagePosition === 'Left' || imagePosition === 'Right' ? 160 : undefined,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .${gridClass} { ${masonry ? `columns: ${columns}; column-gap: ${props.columnsGap || '30px'};` : `display: grid; grid-template-columns: repeat(${columns}, minmax(0, 1fr)); column-gap: ${props.columnsGap || '30px'}; row-gap: ${props.rowsGap || '35px'};`} width: 100%; }
        .${gridClass} .post-grid-article { transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1); }
        .${gridClass} .post-grid-article:hover { background-color: ${props.boxBgColorHover || props.boxBgColor || preset.bg} !important; border-color: ${props.boxBorderColorHover || props.boxBorderColor || preset.border} !important; transform: translateY(${preset.hoverTranslate}); box-shadow: ${props.boxShadow && props.boxShadow !== 'none' ? props.boxShadow : preset.hoverShadow} !important; }
        @media (max-width: 768px) { .${gridClass} { columns: 1 !important; grid-template-columns: repeat(1, minmax(0, 1fr)) !important; } .${gridClass} .post-grid-article { flex-direction: column !important; } .${gridClass} .post-grid-image { width: 100% !important; flex-basis: auto !important; aspect-ratio: ${props.imageRatio || '1.5'}; } }
        @media (min-width: 769px) and (max-width: 1024px) { .${gridClass} { columns: ${Math.min(2, columns)} !important; grid-template-columns: repeat(${Math.min(2, columns)}, minmax(0, 1fr)) !important; } }
      ` }} />
      <div className={gridClass}>
        {posts.map((post: any) => {
          const postLink = generatePostUrl(post, permalinkStructure, productStructure);
          const formattedDate = formatDateWordPress(post.createdAt, dateFormat, siteLanguage);
          const imageUrl = post.featuredImage?.url || null;
          const metaMap: Record<string, React.ReactNode> = {
            Date: <><Calendar size={12} /> {formattedDate}</>,
            Author: <><User size={12} /> {post.author?.name || post.author?.username || 'Admin'}</>,
            Comments: <><MessageCircle size={12} /> {post.comments?.length || 0}</>,
          };
          const activeMeta = metaItems.map((item) => ({ item, node: metaMap[item] })).filter((entry) => entry.node);
          const autoExcerpt = stripHtml(post.content || '');
          const finalExcerptSource = post.excerpt ? post.excerpt.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"') : autoExcerpt;
          const excerpt = truncate(finalExcerptSource || 'Không có đoạn trích dẫn bài viết nào.', excerptLength);
          const TitleTag = titleTag;
          return (
            <article key={post.id} className="post-grid-article" style={articleStyle}>
              {imagePosition !== 'None' && imageUrl && (
                <Link href={postLink} className="post-grid-image relative block overflow-hidden bg-slate-100" style={{ ...imageStyle, borderTopLeftRadius: getStyle(props.imgBorderTopLeftRadius, '0px', '0px'), borderTopRightRadius: getStyle(props.imgBorderTopRightRadius, '0px', '0px'), borderBottomRightRadius: getStyle(props.imgBorderBottomRightRadius, '0px', '0px'), borderBottomLeftRadius: getStyle(props.imgBorderBottomLeftRadius, '0px', '0px') }}>
                  <Image src={imageUrl} alt={post.title} fill className="object-cover transition-transform duration-300 hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                </Link>
              )}
              {imagePosition !== 'None' && !imageUrl && <div className="post-grid-image bg-gradient-to-br from-blue-100 via-violet-100 to-pink-100" style={{ ...imageStyle, borderTopLeftRadius: getStyle(props.imgBorderTopLeftRadius, '0px', '0px'), borderTopRightRadius: getStyle(props.imgBorderTopRightRadius, '0px', '0px'), borderBottomRightRadius: getStyle(props.imgBorderBottomRightRadius, '0px', '0px'), borderBottomLeftRadius: getStyle(props.imgBorderBottomLeftRadius, '0px', '0px') }} />}
              <div style={contentStyle}>
                {activeMeta.length > 0 && (
                  <div className="post-grid-meta flex flex-wrap gap-2 uppercase tracking-wider transition-colors" style={{ justifyContent: justify(props.alignment), marginBottom: getStyle(props.metaMarginBottom, '12px', '12px'), color: getStyle(props.metaColor, '#94a3b8', '#94a3b8'), fontSize: getStyle(props.metaFontSize, '10px', '10px'), fontWeight: getStyle(props.metaFontWeight, '700', '700'), fontFamily: props.metaFontFamily, fontStyle: props.metaFontStyle, lineHeight: props.metaLineHeight, letterSpacing: props.metaLetterSpacing, wordSpacing: props.metaWordSpacing }}>
                    {activeMeta.map(({ item, node }, idx) => <span key={`${item}-${idx}`} className="flex items-center gap-1">{node}{idx < activeMeta.length - 1 && <span className="mx-1">{separator}</span>}</span>)}
                  </div>
                )}
                {showTitle && <TitleTag className="post-grid-title transition-colors" style={{ margin: `0 0 ${getStyle(props.titleMarginBottom, '10px', '10px')}`, color: getStyle(props.titleColor, '#0f172a', '#0f172a'), fontSize: getStyle(props.titleFontSize, '16px', '16px'), fontWeight: getStyle(props.titleFontWeight, '800', '800'), fontFamily: props.titleFontFamily, fontStyle: props.titleFontStyle, lineHeight: getStyle(props.titleLineHeight, '1.35', '1.35'), letterSpacing: props.titleLetterSpacing, wordSpacing: props.titleWordSpacing, wordBreak: 'break-word', '--hover-color': props.titleColorHover } as React.CSSProperties}>{post.title}</TitleTag>}
                {showExcerpt && <p className="post-grid-excerpt transition-colors" style={{ margin: `0 0 ${getStyle(props.excerptMarginBottom, '14px', '14px')}`, color: getStyle(props.excerptColor, '#64748b', '#64748b'), fontSize: getStyle(props.excerptFontSize, '12px', '12px'), fontWeight: getStyle(props.excerptFontWeight, '400', '400'), fontFamily: props.excerptFontFamily, fontStyle: props.excerptFontStyle, lineHeight: getStyle(props.excerptLineHeight, '1.65', '1.65'), letterSpacing: props.excerptLetterSpacing, wordSpacing: props.excerptWordSpacing, wordBreak: 'break-word' }}>{excerpt}</p>}
                {showReadMore && <Link href={postLink} className="group inline-flex items-center gap-1 pt-2 transition-colors" style={{ justifyContent: justify(props.alignment), color: getStyle(props.readMoreColor, '#4f46e5', '#4f46e5'), fontSize: getStyle(props.readMoreFontSize, '12px', '12px'), fontWeight: getStyle(props.readMoreFontWeight, '800', '800'), fontFamily: props.readMoreFontFamily, fontStyle: props.readMoreFontStyle, lineHeight: props.readMoreLineHeight, letterSpacing: props.readMoreLetterSpacing, wordSpacing: props.readMoreWordSpacing, '--hover-color': props.readMoreColorHover } as React.CSSProperties}>{readMoreText} <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" /></Link>}
              </div>
            </article>
          );
        })}
      </div>
      {props.paginationType && props.paginationType !== 'None' && <div className="mt-8 flex justify-center"><div className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-500 shadow-sm">{props.paginationType === 'Load on Click' || props.paginationType === 'Infinite Scroll' ? 'Tải thêm' : '1 / 1'}</div></div>}
    </>
  );
}
