export const SPECIAL_CHARS =  [
  '©', '®', '™', '•', '§', '¶', '†', '‡', '—', '–',
  '¢', '£', '¤', '¥', '€', '₫', '±', '×', '÷', '≠',
  '≈', '≤', '≥', '∞', 'π', '°', 'µ', 'α', 'β', 'γ',
  '←', '↑', '→', '↓', '↔', '«', '»', '“', '”', '‘', '’'
];

export const DYNAMIC_TAGS =  [
  { tag: '{post_title}', label: 'Tiêu đề bài viết' },
  { tag: '{post_excerpt}', label: 'Mô tả ngắn' },
  { tag: '{post_date}', label: 'Ngày đăng' },
  { tag: '{site_name}', label: 'Tên trang web' },
  { tag: '{site_url}', label: 'Đường dẫn URL' },
  { tag: '{author_name}', label: 'Tên tác giả' }
];

export const GOOGLE_FONTS =  [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Oswald',
  'Merriweather',
  'Playfair Display',
  'Nunito',
  'Source Sans 3',
  'Noto Sans',
  'Be Vietnam Pro',
  'Roboto Slab',
  'Raleway',
] as const;

export const TYPOGRAPHY_UNITS =  ['px', 'em', 'rem'] as const;
export const SPACING_UNITS =  ['px', '%', 'em', 'rem', 'vw'] as const;
