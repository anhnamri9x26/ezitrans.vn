import { GOOGLE_FONTS } from './constants';

export const parseCssFilters = (filterString?: string) => {
  const defaults = {
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    hueRotate: 0,
  };
  if (!filterString || filterString === 'none') return defaults;
  
  const blurMatch = filterString.match(/blur\((\d+)px\)/);
  const brightnessMatch = filterString.match(/brightness\((\d+)%\)/);
  const contrastMatch = filterString.match(/contrast\((\d+)%\)/);
  const saturateMatch = filterString.match(/saturate\((\d+)%\)/);
  const hueRotateMatch = filterString.match(/hue-rotate\((\d+)deg\)/);
  
  return {
    blur: blurMatch ? parseInt(blurMatch[1]) : defaults.blur,
    brightness: brightnessMatch ? parseInt(brightnessMatch[1]) : defaults.brightness,
    contrast: contrastMatch ? parseInt(contrastMatch[1]) : defaults.contrast,
    saturate: saturateMatch ? parseInt(saturateMatch[1]) : defaults.saturate,
    hueRotate: hueRotateMatch ? parseInt(hueRotateMatch[1]) : defaults.hueRotate,
  };
};

export const serializeCssFilters = (filters: { blur: number; brightness: number; contrast: number; saturate: number; hueRotate: number }) => {
  const parts = [];
  if (filters.blur !== 0) parts.push(`blur(${filters.blur}px)`);
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturate !== 100) parts.push(`saturate(${filters.saturate}%)`);
  if (filters.hueRotate !== 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  
  return parts.length > 0 ? parts.join(' ') : 'none';
};

export const parseBoxShadow = (shadowStr?: string) => {
  const defaults = {
    horizontal: 0,
    vertical: 4,
    blur: 10,
    spread: 0,
    color: 'rgba(0,0,0,0.1)',
    inset: false,
  };
  if (!shadowStr || shadowStr === 'none') {
    return { ...defaults, active: false };
  }
  
  let str = shadowStr.trim();
  const inset = str.includes('inset');
  if (inset) {
    str = str.replace('inset', '').trim();
  }
  
  const colorMatch = str.match(/(rgba?\(.*?\)|hsla?\(.*?\)|#[a-fA-F0-9]{3,8}|\b(?!px\b|em\b|rem\b|inset\b)[a-zA-Z]+\b)/);
  let color = defaults.color;
  if (colorMatch) {
    color = colorMatch[0];
    str = str.replace(color, '').trim();
  }
  
  const parts = str.split(/\s+/).filter(Boolean);
  const horizontal = parts[0] ? parseInt(parts[0]) : defaults.horizontal;
  const vertical = parts[1] ? parseInt(parts[1]) : defaults.vertical;
  const blur = parts[2] ? parseInt(parts[2]) : defaults.blur;
  const spread = parts[3] ? parseInt(parts[3]) : defaults.spread;
  
  return {
    horizontal,
    vertical,
    blur,
    spread,
    color,
    inset,
    active: true,
  };
};

export const serializeBoxShadow = (shadow: { horizontal: number; vertical: number; blur: number; spread: number; color: string; inset: boolean }) => {
  const parts = [
    `${shadow.horizontal}px`,
    `${shadow.vertical}px`,
    `${shadow.blur}px`,
    `${shadow.spread}px`,
    shadow.color,
  ];
  if (shadow.inset) parts.push('inset');
  return parts.join(' ');
};

export function getDynamicFieldLabel(source: string, field: string): string {
  const map: Record<string, Record<string, string>> = {
    post: {
      title: 'Tiêu đề bài viết',
      content: 'Nội dung bài viết',
      excerpt: 'Mô tả ngắn',
      slug: 'Slug bài viết',
      url: 'URL bài viết',
      id: 'ID bài viết',
      status: 'Trạng thái bài viết',
      publishedAt: 'Ngày đăng',
      modifiedAt: 'Ngày chỉnh sửa',
      featuredImage: 'Ảnh đại diện bài viết',
    },
    author: {
      name: 'Tên tác giả',
      displayName: 'Tên hiển thị tác giả',
      email: 'Email tác giả',
      bio: 'Giới thiệu tác giả',
      avatar: 'Avatar tác giả',
      url: 'URL tác giả',
    },
    category: {
      name: 'Tên chuyên mục',
      description: 'Mô tả chuyên mục',
      slug: 'Slug chuyên mục',
      url: 'URL chuyên mục',
    },
    tag: {
      name: 'Tên thẻ',
      description: 'Mô tả thẻ',
      url: 'URL thẻ',
    },
    site: {
      title: 'Tên trang web',
      name: 'Tên trang web',
      tagline: 'Mô tả trang web',
      description: 'Mô tả trang web',
      logo: 'Logo trang web',
      url: 'URL trang web',
      email: 'Email liên hệ',
      phone: 'Số điện thoại',
    },
    user: {
      name: 'Tên thành viên',
      email: 'Email thành viên',
      avatar: 'Ảnh đại diện',
      role: 'Vai trò',
      id: 'ID thành viên',
      streak: 'Chuỗi ngày học',
      band: 'Band hiện tại',
      targetBand: 'Band mục tiêu',
      target_band: 'Band mục tiêu',
      xp: 'Điểm tích lũy (XP)',
      level: 'Cấp độ học viên',
      completedLessons: 'Bài học đã làm',
      completedTests: 'Bài thi đã làm',
      studyTime: 'Thời gian học',
    },
    dateTime: {
      currentDate: 'Ngày hiện tại',
      currentTime: 'Giờ hiện tại',
      currentYear: 'Năm hiện tại',
      currentMonth: 'Tháng hiện tại',
    },
    request: {
      url: 'URL hiện tại',
      path: 'Path hiện tại',
      query: 'Query string hiện tại',
      referrer: 'URL giới thiệu (Referrer)',
    },
    seo: {
      title: 'Tiêu đề SEO',
      description: 'Mô tả SEO',
      canonicalUrl: 'Đường dẫn Canonical',
      ogImage: 'Ảnh chia sẻ (Open Graph)',
    }
  };
  return map[source]?.[field] || `${source === 'custom_field' ? 'Custom:' : source} ${field}`;
}

export const getFontCssName = (font: string) => font.replace(/ /g, '+');

export const buildGoogleFontsHref = () => {
  const families = GOOGLE_FONTS.map((font) => `family=${getFontCssName(font)}:wght@300;400;500;600;700;800`).join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
};

export const splitSizeValue = (value: string | undefined | null, fallbackUnit: string = 'px') => {
  const raw = value || '';
  const match = raw.match(/^(-?\d*\.?\d+)(px|%|em|rem|vw|vh|ms|s)?$/i);
  if (!match) return { amount: raw.replace(/(px|%|em|rem|vw|vh|ms|s)$/i, ''), unit: fallbackUnit };
  return { amount: match[1], unit: match[2] || fallbackUnit };
};

export const parseSpacing = (value: string | undefined | null): number => {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export const parseTextShadow = (shadowStr: string) => {
  let h = '0px';
  let v = '0px';
  let blur = '0px';
  let color = 'transparent';

  if (!shadowStr || shadowStr === 'none') {
    return { h, v, blur, color };
  }

  let temp = shadowStr.trim();
  
  const colorMatch = temp.match(/(rgba\([^)]+\)|rgb\([^)]+\)|var\([^)]+\)|#[a-fA-F0-9]{3,8}|[a-zA-Z]+)$/);
  if (colorMatch) {
    color = colorMatch[0];
    temp = temp.replace(color, '').trim();
  } else {
    const startColorMatch = temp.match(/^(rgba\([^)]+\)|rgb\([^)]+\)|var\([^)]+\)|#[a-fA-F0-9]{3,8}|[a-zA-Z]+)/);
    if (startColorMatch) {
      color = startColorMatch[0];
      temp = temp.replace(color, '').trim();
    }
  }

  const parts = temp.split(/\s+/).filter(Boolean);
  if (parts.length >= 1) h = parts[0];
  if (parts.length >= 2) v = parts[1];
  if (parts.length >= 3) blur = parts[2];

  return { h, v, blur, color };
};

export const parseTextStroke = (strokeStr: string) => {
  let width = '0px';
  let color = 'transparent';

  if (!strokeStr || strokeStr === 'none') {
    return { width, color };
  }

  let temp = strokeStr.trim();
  
  const colorMatch = temp.match(/(rgba\([^)]+\)|rgb\([^)]+\)|var\([^)]+\)|#[a-fA-F0-9]{3,8}|[a-zA-Z]+)$/);
  if (colorMatch) {
    color = colorMatch[0];
    temp = temp.replace(color, '').trim();
  } else {
    const startColorMatch = temp.match(/^(rgba\([^)]+\)|rgb\([^)]+\)|var\([^)]+\)|#[a-fA-F0-9]{3,8}|[a-zA-Z]+)/);
    if (startColorMatch) {
      color = startColorMatch[0];
      temp = temp.replace(color, '').trim();
    }
  }

  const parts = temp.split(/\s+/).filter(Boolean);
  if (parts.length >= 1) width = parts[0];

  return { width, color };
};