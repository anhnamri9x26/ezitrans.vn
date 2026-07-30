export interface DynamicConfig {
  enabled?: boolean;
  source?: string;
  field?: string;
  before?: string;
  after?: string;
  fallback?: string;
}

export interface DynamicContext {
  post?: {
    id?: number;
    title?: string;
    content?: string;
    excerpt?: string;
    slug?: string;
    url?: string;
    status?: string;
    featuredImage?: string;
    publishedAt?: string;
    modifiedAt?: string;
    [key: string]: any;
  };
  author?: {
    name?: string;
    displayName?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    url?: string;
    [key: string]: any;
  };
  category?: {
    name?: string;
    description?: string;
    slug?: string;
    url?: string;
    [key: string]: any;
  };
  tag?: {
    name?: string;
    description?: string;
    url?: string;
    [key: string]: any;
  };
  site?: {
    title?: string;
    name?: string;
    tagline?: string;
    description?: string;
    logo?: string;
    url?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  };
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
    role?: string;
    id?: string | number;
    streak?: number;
    band?: string;
    targetBand?: string;
    xp?: number;
    level?: number;
    completedLessons?: number;
    completedTests?: number;
    studyTime?: string;
    [key: string]: any;
  };
  customFields?: Record<string, any>;
  dateTime?: {
    currentDate?: string;
    currentTime?: string;
    currentYear?: string;
    currentMonth?: string;
    [key: string]: any;
  };
  request?: {
    url?: string;
    path?: string;
    query?: string;
    referrer?: string;
    [key: string]: any;
  };
  seo?: {
    title?: string;
    description?: string;
    canonicalUrl?: string;
    ogImage?: string;
    [key: string]: any;
  };
}

export const defaultMockContext: DynamicContext = {
  post: {
    id: 108,
    title: "Lộ trình học IELTS từ 0 đến 7.0 nhanh nhất",
    content: "Đây là nội dung chi tiết bài viết...",
    excerpt: "Hướng dẫn chi tiết lộ trình tự học IELTS tại nhà đạt kết quả cao.",
    slug: "lo-trinh-hoc-ielts",
    url: "/blog/lo-trinh-hoc-ielts",
    status: "Published",
    featuredImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
    publishedAt: "2026-06-05T08:00:00Z",
    modifiedAt: "2026-06-05T12:00:00Z",
  },
  author: {
    name: "Thầy Thủy Anh",
    displayName: "Thủy Anh IELTS",
    email: "thuyanh.ielts@thuyanhenglish.edu.vn",
    bio: "Hơn 8 năm kinh nghiệm giảng dạy IELTS, cựu giám khảo chấm thi và tác giả của nhiều đầu sách luyện thi.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
    url: "/author/thuy-anh",
  },
  category: {
    name: "Kinh nghiệm luyện thi IELTS",
    description: "Các bài viết chia sẻ phương pháp học, mẹo làm bài thi IELTS hữu ích.",
    slug: "kinh-nghiem-ielts",
    url: "/category/kinh-nghiem-ielts",
  },
  tag: {
    name: "IELTS Academic",
    description: "Tài liệu học thuật cho bài thi viết và đọc IELTS Academic.",
    url: "/tag/ielts-academic",
  },
  site: {
    title: "Thủy Anh English",
    name: "Thủy Anh English",
    tagline: "Học IELTS Online Hiệu Quả",
    description: "Hệ thống tự học IELTS online toàn diện với lộ trình cá nhân hóa.",
    logo: "https://thuyanhenglish.edu.vn/logo.png",
    url: "https://thuyanhenglish.edu.vn",
    email: "contact@thuyanhenglish.edu.vn",
    phone: "0988.777.666",
  },
  user: {
    name: "Nguyễn Văn A",
    email: "nguyenvana@gmail.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
    role: "Premium Student",
    id: "USER-9988",
    streak: 12,
    band: "IELTS 6.5",
    targetBand: "IELTS 7.5+",
    xp: 2850,
    level: 18,
    completedLessons: 45,
    completedTests: 8,
    studyTime: "24 giờ 15 phút",
  },
  dateTime: {
    currentDate: "05/06/2026",
    currentTime: "22:54",
    currentYear: "2026",
    currentMonth: "Tháng 6",
  },
  request: {
    url: "https://thuyanhenglish.edu.vn/khoa-hoc/ielts-intensive",
    path: "/khoa-hoc/ielts-intensive",
    query: "?ref=facebook&coupon=WELCOME",
    referrer: "https://facebook.com/thuyanhenglish",
  },
  seo: {
    title: "Lộ Trình Học IELTS 7.0 - Thủy Anh English",
    description: "Đăng ký học ngay để nhận ưu đãi. Lộ trình cá nhân hóa cam kết đầu ra.",
    canonicalUrl: "https://thuyanhenglish.edu.vn/blog/lo-trinh-hoc-ielts",
    ogImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
  }
};

/**
 * Resolves a dynamic config into a text value using the provided context.
 * Returns null if dynamic content is disabled or invalid.
 */
export function resolveDynamicValue(
  config: DynamicConfig | undefined,
  context: DynamicContext = defaultMockContext
): string | null {
  if (!config || !config.enabled || !config.source || !config.field) {
    return null;
  }

  const { source, field, before = '', after = '', fallback = '' } = config;
  let rawValue: any = null;

  if (source === 'post') {
    if (field === 'url' && !context.post?.url) {
      rawValue = context.post?.slug ? `/blog/${context.post.slug}` : '';
    } else if (field === 'featuredImage' && context.post?.featuredImage && typeof context.post.featuredImage === 'object') {
      rawValue = (context.post.featuredImage as any).url || '';
    } else {
      rawValue = context.post?.[field];
    }
  } else if (source === 'author') {
    rawValue = context.author?.[field];
  } else if (source === 'category') {
    rawValue = context.category?.[field];
  } else if (source === 'tag') {
    rawValue = context.tag?.[field];
  } else if (source === 'site') {
    rawValue = context.site?.[field] ?? (field === 'name' ? context.site?.title : undefined);
  } else if (source === 'user') {
    // Handle specific fields and direct mappings
    if (field === 'target_band') {
      rawValue = context.user?.targetBand;
    } else {
      rawValue = context.user?.[field];
    }
  } else if (source === 'custom_field') {
    rawValue = context.post?.[field] ?? context.post?.metadata?.[field] ?? context.customFields?.[field];
    if (rawValue === undefined) {
      // Mock some standard custom fields if context is mock data
      const mockCustomFields: Record<string, string> = {
        course_price: "4.500.000đ",
        course_level: "IELTS 5.5 - 6.5",
        teacher_name: "Cô Thảo Vy",
        teacher_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
        duration: "36 buổi (3 tháng)",
      };
      rawValue = mockCustomFields[field];
    }
  } else if (source === 'dateTime') {
    rawValue = context.dateTime?.[field];
  } else if (source === 'request') {
    rawValue = context.request?.[field];
  } else if (source === 'seo') {
    rawValue = context.seo?.[field];
  }

  const valueStr = rawValue !== undefined && rawValue !== null ? String(rawValue) : '';
  const finalValue = valueStr.trim() !== '' ? valueStr : fallback;

  return `${before}${finalValue}${after}`;
}

/**
 * Scans an HTML string for dynamic placeholders like {{dynamic:{...}}}
 * and replaces them with resolved values using the provided context.
 */
export function resolveHtmlDynamicPlaceholders(
  html: string,
  context: DynamicContext = defaultMockContext
): string {
  if (!html) return '';
  const dynamicRegex = /\{\{dynamic:(\{.*?\})\}\}/g;
  return html.replace(dynamicRegex, (match, configStr) => {
    try {
      const config = JSON.parse(configStr);
      const resolved = resolveDynamicValue({ enabled: true, ...config }, context);
      return resolved !== null ? resolved : (config.fallback || '');
    } catch (e) {
      console.error("Failed to parse dynamic tag JSON", e);
      return '';
    }
  });
}
