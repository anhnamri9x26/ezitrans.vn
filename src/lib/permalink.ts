/**
 * Permalink Utility library for lexi.vn
 */

export interface PostInfo {
  id: number;
  slug: string;
  createdAt: Date | string;
  legacyId?: number | null;
  type?: string;
}

// Generate dynamic URL based on permalink structure and post info
export function generatePostUrl(post: PostInfo, structure: string, productStructure?: string): string {
  if (post.type === 'PAGE') {
    return `/${post.slug}`;
  }

  let url = structure;
  if (post.type === 'PRODUCT' && productStructure) {
    if (productStructure.includes('%postname%')) {
      url = productStructure;
    } else {
      url = productStructure.endsWith('/') ? productStructure + '%postname%/' : productStructure + '/%postname%/';
    }
  }
  const date = new Date(post.createdAt);
  
  const pad = (num: number) => String(num).padStart(2, '0');
  
  url = url.replace('%year%', String(date.getFullYear()));
  url = url.replace('%monthnum%', pad(date.getMonth() + 1));
  url = url.replace('%day%', pad(date.getDate()));
  url = url.replace('%hour%', pad(date.getHours()));
  url = url.replace('%minute%', pad(date.getMinutes()));
  url = url.replace('%second%', pad(date.getSeconds()));
  url = url.replace('%post_id%', String(post.legacyId || post.id));
  url = url.replace('%postname%', post.slug);
  url = url.replace('%category%', 'news'); // fallback category prefix
  url = url.replace('%author%', 'admin');  // fallback author

  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  return url;
}

// Convert a WordPress permalink structure to an exact URL matcher.
export function parsePermalinkStructure(urlPath: string, structure: string): { slug: string | null; id: number | null } {
  try {
    const normalizedPath = urlPath === '/' ? '/' : `/${urlPath.replace(/^\/+|\/+$/g, '')}`;
    const normalizedStructure = structure === '/' ? '/' : `/${structure.replace(/^\/+|\/+$/g, '')}`;
    const tokenPattern = /%(year|monthnum|day|hour|minute|second|post_id|postname|category|author)%/g;
    let cursor = 0;
    let regexSource = '^';
    const captures: Array<'slug' | 'id'> = [];
    let tokenMatch: RegExpExecArray | null;

    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    while ((tokenMatch = tokenPattern.exec(normalizedStructure)) !== null) {
      regexSource += escapeRegex(normalizedStructure.slice(cursor, tokenMatch.index));
      const token = tokenMatch[1];

      if (token === 'postname') {
        regexSource += '([^/.]+)';
        captures.push('slug');
      } else if (token === 'post_id') {
        regexSource += '(\\d+)';
        captures.push('id');
      } else if (token === 'year') {
        regexSource += '\\d{4}';
      } else if (['monthnum', 'day', 'hour', 'minute', 'second'].includes(token)) {
        regexSource += '\\d{2}';
      } else {
        regexSource += '[^/]+';
      }

      cursor = tokenPattern.lastIndex;
    }

    regexSource += escapeRegex(normalizedStructure.slice(cursor));
    regexSource += '/?$';
    const match = normalizedPath.match(new RegExp(regexSource));
    if (!match) return { slug: null, id: null };

    let slug: string | null = null;
    let id: number | null = null;
    captures.forEach((capture, index) => {
      const value = match[index + 1];
      if (capture === 'slug') slug = value;
      if (capture === 'id') id = Number(value);
    });

    return { slug, id };
  } catch (error) {
    console.error('Error parsing permalink structure:', error);
    return { slug: null, id: null };
  }
}

// WordPress-style date and time formatting parser for JS
export function formatDateWordPress(dateVal: Date | string | null, formatStr: string, lang = 'vi'): string {
  if (!dateVal || !formatStr) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  let ampmLower = 'am';
  let ampmUpper = 'AM';
  
  if (lang === 'vi') {
    ampmLower = hours >= 12 ? 'chiều' : 'sáng';
    ampmUpper = hours >= 12 ? 'chiều' : 'sáng';
  } else {
    ampmLower = hours >= 12 ? 'pm' : 'am';
    ampmUpper = hours >= 12 ? 'PM' : 'AM';
  }

  const monthsFullVi = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const monthsFullEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsShortVi = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
  const monthsShortEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let result = '';
  for (let i = 0; i < formatStr.length; i++) {
    const char = formatStr[i];
    if (char === '\\' && i + 1 < formatStr.length) {
      result += formatStr[i + 1];
      i++;
      continue;
    }
    
    switch (char) {
      case 'Y': result += date.getFullYear(); break;
      case 'y': result += String(date.getFullYear()).slice(-2); break;
      case 'm': result += pad(date.getMonth() + 1); break;
      case 'n': result += String(date.getMonth() + 1); break;
      case 'F': result += lang === 'vi' ? monthsFullVi[date.getMonth()] : monthsFullEn[date.getMonth()]; break;
      case 'M': result += lang === 'vi' ? monthsShortVi[date.getMonth()] : monthsShortEn[date.getMonth()]; break;
      case 'd': result += pad(date.getDate()); break;
      case 'j': result += String(date.getDate()); break;
      case 'g': result += String(hours % 12 || 12); break;
      case 'G': result += String(hours); break;
      case 'h': result += pad(hours % 12 || 12); break;
      case 'H': result += pad(hours); break;
      case 'i': result += pad(minutes); break;
      case 's': result += pad(seconds); break;
      case 'a': result += ampmLower; break;
      case 'A': result += ampmUpper; break;
      default: result += char;
    }
  }
  return result;
}

export async function resolvePostFromUrl(
  urlPath: string,
  structure: string,
  productStructure: string,
  prisma: any
) {
  const include = { author: true, categories: true, featuredImage: true, tags: true };

  const findByParsed = async (
    parsed: { slug: string | null; id: number | null },
    expectedType: 'PRODUCT' | 'CONTENT'
  ) => {
    let post = null;
    if (parsed.id) {
      post = await prisma.post.findFirst({
        where: { OR: [{ id: parsed.id }, { legacyId: parsed.id }] },
        include
      });
    } else if (parsed.slug) {
      post = await prisma.post.findUnique({ where: { slug: parsed.slug }, include });
    }

    if (!post) return null;
    if (expectedType === 'PRODUCT') return post.type === 'PRODUCT' ? post : null;
    return post.type !== 'PRODUCT' ? post : null;
  };

  // Static pages intentionally use a clean, single-segment URL regardless of
  // the post permalink structure. Query it explicitly without treating every
  // unknown single-segment path as a generic legacy post URL.
  const cleanSegments = urlPath.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (cleanSegments.length === 1 && !cleanSegments[0].includes('.')) {
    const page = await prisma.post.findUnique({
      where: { slug: cleanSegments[0] },
      include
    });
    if (page?.type === 'PAGE') return page;
  }

  // Current structures are authoritative. A normal content URL must not be
  // interpreted as a product URL merely because both structures contain a slug.
  const parsedContent = parsePermalinkStructure(urlPath, structure);
  const contentPost = await findByParsed(parsedContent, 'CONTENT');
  if (contentPost) return contentPost;

  const parsedProduct = parsePermalinkStructure(urlPath, productStructure);
  const productPost = await findByParsed(parsedProduct, 'PRODUCT');
  if (productPost) return productPost;

  // Keep only explicit, historically supported structures. Do not use a bare
  // /%postname% fallback because it makes arbitrary one-segment URLs look valid.
  const legacyStructures = [
    '/posts/%postname%',
    '/pages/%postname%',
    '/%year%/%monthnum%/%day%/%postname%/',
    '/%year%/%monthnum%/%postname%/',
    '/archives/%post_id%'
  ].filter((legacy) => legacy !== structure && legacy !== productStructure);

  for (const legacyStructure of legacyStructures) {
    const legacyPost = await findByParsed(parsePermalinkStructure(urlPath, legacyStructure), 'CONTENT');
    if (legacyPost) return legacyPost;
  }

  return null;
}
