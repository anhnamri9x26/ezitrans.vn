# Lexi CMS — Tiêu chuẩn phát triển Plugin & Theme

> Tài liệu kỹ thuật dành cho Developer muốn xây dựng Plugin hoặc Theme tương thích với Lexi CMS.
> Phiên bản spec: **1.0.0** · Cập nhật: 2026-06-01

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Tiêu chuẩn Theme](#2-tiêu-chuẩn-theme)
3. [Tiêu chuẩn Plugin](#3-tiêu-chuẩn-plugin)
4. [Đóng gói & Phân phối](#4-đóng-gói--phân-phối)
5. [Quy tắc chung](#5-quy-tắc-chung)

---

## 1. Tổng quan kiến trúc

### Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript / React 19 |
| Styling | TailwindCSS 4 |
| Database | PostgreSQL via Prisma ORM |
| Icons | lucide-react |

### Cơ chế hoạt động

```
CMS Core                         Theme / Plugin
────────────                      ──────────────
src/app/(frontend)/ ──── dynamic import() ────→ src/themes/{id}/Homepage.tsx
src/app/(frontend)/[...slug]/ ── dynamic import() ──→ src/themes/{id}/PostPage.tsx
                                                       src/themes/{id}/Page.tsx
                                                       src/themes/{id}/Page-{slug}.tsx
src/app/(frontend)/category/ ── dynamic import() ──→ src/themes/{id}/CategoryPage.tsx
src/app/(frontend)/tag/      ── dynamic import() ──→ src/themes/{id}/TagPage.tsx

API /api/plugins ── fs.scan ────→ src/plugins/{id}/manifest.json
API /api/themes  ── fs.scan ────→ src/themes/{id}/theme.json
DB Setting table ── toggle ────→ plugin_{id}_enabled = 'true' | 'false'
```

> **Quan trọng**: CMS sử dụng `dynamic import()` tại server-side để load component theo tên theme. Theme phải nằm trong `src/themes/` và sẽ được biên dịch cùng project khi `npm run build`.

---

## 2. Tiêu chuẩn Theme

### 2.1 Cấu trúc thư mục

```
src/themes/{theme-id}/
├── theme.json                ← BẮT BUỘC: Metadata
├── Homepage.tsx              ← BẮT BUỘC: Trang chủ
├── Header.tsx                ← Khuyến nghị: Header/Navigation
├── Footer.tsx                ← Khuyến nghị: Footer
├── PostPage.tsx              ← Khuyến nghị: Bài viết đơn (POST + SERVICE)
├── Page.tsx                  ← Khuyến nghị: Trang tĩnh (PAGE)
├── Page-{slug}.tsx           ← Tùy chọn: Template trang theo slug cụ thể
├── CategoryPage.tsx          ← Khuyến nghị: Trang danh mục
├── TagPage.tsx               ← Khuyến nghị: Trang thẻ tag
└── ... (các file phụ trợ)
```

### 2.2 theme.json — Schema bắt buộc

```jsonc
{
  // BẮT BUỘC
  "id": "my-theme",                          // Unique ID, khớp tên folder, lowercase + dấu gạch ngang
  "name": "My Amazing Theme",                // Tên hiển thị (tiếng Anh)
  "version": "1.0.0",                        // Semantic versioning
  
  // KHUYẾN NGHỊ
  "nameVi": "Giao diện tuyệt vời",           // Tên tiếng Việt (hiển thị ưu tiên trong admin)
  "description": "Mô tả chi tiết theme...",  // Mô tả ngắn
  "author": "Tên tác giả / team",            // Tác giả
  "tags": ["dark-mode", "minimal"],           // Tags phân loại
  "supports": [                               // Các loại trang mà theme hỗ trợ
    "header", "footer", "homepage", 
    "post", "page", "category", "tag"
  ],
  "changelog": [                              // Lịch sử phiên bản
    {
      "version": "1.0.0",
      "date": "2026-06-01",
      "changes": ["Phiên bản đầu tiên"]
    }
  ]
}
```

### 2.3 Component Contracts — Props interface

Mỗi component theme nhận props chuẩn từ CMS core. **Bạn PHẢI tuân theo đúng signature này**:

#### Homepage.tsx

```tsx
// CMS gọi: await import(`@/themes/${activeTheme}/Homepage`)
export default function Homepage({
  posts,      // any[] — Danh sách bài viết PUBLISHED, type POST, sắp xếp theo createdAt desc
  settings,   // Record<string, string> — Toàn bộ settings từ DB (xem bảng Settings Keys)
}: {
  posts: any[];
  settings: any;
}) {
  // Render trang chủ
  // Nên import Header và Footer từ cùng theme folder
}
```

#### PostPage.tsx

```tsx
// CMS gọi: await import(`@/themes/${activeTheme}/PostPage`)
// Dùng cho: POST và SERVICE type
export default function PostPage({
  post,                  // any — Bài viết đầy đủ (include: author, categories, featuredImage)
  settings,              // Record<string, string> — Settings
  isAuthorizedUser,      // boolean — true nếu user đang login là ADMIN/EDITOR
  formattedDate,         // string — Ngày tạo, đã format theo settings
  formattedUpdateDate,   // string — Ngày cập nhật, đã format theo settings
}: {
  post: any;
  settings: any;
  isAuthorizedUser: boolean;
  formattedDate: string;
  formattedUpdateDate: string;
}) {
  // Render bài viết đơn
}
```

#### Page.tsx

```tsx
// CMS gọi: await import(`@/themes/${activeTheme}/Page`)
// Signature GIỐNG PostPage
export default function Page({
  post,
  settings,
  isAuthorizedUser,
  formattedDate,
  formattedUpdateDate,
}: {
  post: any;
  settings: any;
  isAuthorizedUser: boolean;
  formattedDate: string;
  formattedUpdateDate: string;
}) {
  // Render trang tĩnh
}
```

#### Page-{slug}.tsx (Template Hierarchy)

```tsx
// CMS sẽ tìm file Page-{slug}.tsx trước khi dùng Page.tsx chung
// Ví dụ: Page-mua-ho.tsx, Page-ship-ho.tsx
// Signature GIỐNG Page.tsx
export default function CustomPage({
  post, settings, isAuthorizedUser, formattedDate, formattedUpdateDate,
}: { ... }) {
  // Render trang tĩnh với thiết kế riêng
}
```

#### CategoryPage.tsx

```tsx
// CMS gọi: await import(`@/themes/${activeTheme}/CategoryPage`)
export default function CategoryPage({
  category,   // any — { id, name, slug, description }
  posts,      // any[] — Bài viết trong danh mục (include: author)
  settings,   // Record<string, string>
}: {
  category: any;
  posts: any[];
  settings: any;
}) {
  // Render trang danh mục
}
```

#### TagPage.tsx

```tsx
// CMS gọi: await import(`@/themes/${activeTheme}/TagPage`)
export default function TagPage({
  tag,        // any — { id, name, slug }
  posts,      // any[] — Bài viết gắn tag
  settings,   // Record<string, string>
}: {
  tag: any;
  posts: any[];
  settings: any;
}) {
  // Render trang tag
}
```

#### Header.tsx & Footer.tsx

```tsx
// Không được CMS core gọi trực tiếp
// Được import nội bộ bởi các component khác trong cùng theme
export default function Header({ settings }: { settings: any }) { ... }
export default function Footer({ settings }: { settings: any }) { ... }
```

### 2.4 Settings Keys — Dữ liệu có sẵn trong `settings`

Theme có quyền truy cập toàn bộ settings từ DB. Các key quan trọng:

| Key | Mô tả | Ví dụ |
|-----|--------|-------|
| `site_title` | Tên website | `'Lexi'` |
| `site_tagline` | Slogan | `'Vận chuyển quốc tế'` |
| `site_logo` | URL logo | `'/uploads/logo.png'` |
| `site_language` | Ngôn ngữ | `'vi'`, `'en'`, `'zh'`, `'ja'` |
| `permalink_structure` | Cấu trúc URL | `'/%postname%.html'` |
| `date_format` | Định dạng ngày | `'j F, Y'` |
| `theme_menu_header` | JSON menu header | `'[{"label":"Home","url":"/"}]'` |
| `theme_menu_footer` | JSON menu footer | `'[{"label":"Privacy","url":"/privacy"}]'` |
| `footer_copyright` | Bản quyền | `'© 2026 Lexi'` |
| `footer_about_text` | Giới thiệu footer | `'...'` |
| `footer_phone` | Điện thoại | `'0968.xxx.xxx'` |
| `footer_email` | Email | `'contact@...'` |
| `footer_address` | Địa chỉ | `'...'` |
| `seo_breadcrumbs_enabled` | Bật breadcrumbs | `'true'` / `'false'` |
| `seo_breadcrumbs_separator` | Ký tự phân cách | `'»'` |
| `seo_breadcrumbs_home` | Nhãn trang chủ | `'Trang chủ'` |

### 2.5 Thư viện có sẵn (có thể import)

Theme có quyền sử dụng:

```tsx
// Next.js built-in
import Link from 'next/link';
import Image from 'next/image';

// Icons
import { Calendar, User, ArrowRight, ... } from 'lucide-react';

// CMS Utilities
import { generatePostUrl, formatDateWordPress } from '@/lib/permalink';
import Breadcrumbs from '@/components/Breadcrumbs';
import PublicCommentsSection from '@/components/PublicCommentsSection';

// TailwindCSS — Sử dụng utility classes trực tiếp
```

### 2.6 Post Object — Cấu trúc dữ liệu bài viết

```typescript
interface Post {
  id: number;
  title: string;
  slug: string;
  content: string | null;       // HTML content
  excerpt: string | null;       // Plain text excerpt
  status: 'PUBLISHED' | 'DRAFT' | 'TRASH';
  type: 'POST' | 'PAGE' | 'SERVICE';
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date;
  visibility: string;           // 'PUBLIC'
  grapesjsData: string | null;  // GrapesJS editor data
  
  // Relations (khi include)
  author?: { name: string | null; username: string };
  categories?: { id: number; name: string; slug: string }[];
  tags?: { id: number; name: string; slug: string }[];
  featuredImage?: { url: string; filename: string } | null;
}
```

---

## 3. Tiêu chuẩn Plugin

### 3.1 Cấu trúc thư mục

```
src/plugins/{plugin-id}/
├── manifest.json             ← BẮT BUỘC: Metadata
└── ... (các file cấu hình, tài nguyên)
```

> **Lưu ý**: Plugin hiện tại là **config-driven** — chúng khai báo capabilities và setting keys, CMS core đã có sẵn logic xử lý. Plugin KHÔNG chứa runtime code riêng (không có component React được load động).

### 3.2 manifest.json — Schema bắt buộc

```jsonc
{
  // BẮT BUỘC
  "id": "my-plugin",                    // Unique ID, khớp tên folder
  "name": "Tên plugin",                 // Tên hiển thị
  "version": "1.0.0",                   // Semantic versioning
  "settingKey": "plugin_my_plugin_enabled", // DB setting key để toggle on/off
  
  // KHUYẾN NGHỊ
  "nameEn": "Plugin Name in English",   // Tên tiếng Anh
  "description": "Mô tả chi tiết...",   // Mô tả
  "author": "Tên tác giả",              // Tác giả
  "icon": "sparkles",                   // Tên icon từ lucide-react
  "iconColor": "#10b981",               // Màu HEX cho icon
  "category": "seo",                    // Phân loại: seo | communication | engagement | builder
  "requires": [],                       // Plugin IDs phụ thuộc
  "adminRoute": "/settings/seo",        // Đường dẫn admin để cấu hình (null nếu không có)
  "capabilities": [                     // Danh sách tính năng
    "meta-fields", "sitemap"
  ],
  "changelog": [                        // Lịch sử phiên bản
    {
      "version": "1.0.0",
      "date": "2026-06-01",
      "changes": ["Phiên bản đầu tiên"]
    }
  ]
}
```

### 3.3 Naming Convention cho settingKey

```
plugin_{plugin-id-with-underscores}_enabled
```

Ví dụ:
- Plugin ID `seo-analyzer` → `plugin_seo_enabled` (đặc biệt cho các plugin core)
- Plugin ID `my-custom-tool` → `plugin_my_custom_tool_enabled`

### 3.4 Category và Icon

**Categories hợp lệ:**

| Category | Mô tả |
|----------|--------|
| `seo` | SEO, sitemap, meta tags |
| `communication` | Email, SMTP, notifications |
| `engagement` | Chat, contact, social |
| `builder` | Visual editor, drag-drop |
| `analytics` | Tracking, statistics |
| `security` | Bảo mật, firewall |
| `media` | Hình ảnh, video, gallery |
| `performance` | Cache, CDN, optimization |

**Icons**: Sử dụng tên icon từ [lucide-react](https://lucide.dev/icons). Ví dụ: `sparkles`, `mail`, `message-circle`, `layout`, `shield`, `zap`, `image`, `gauge`

---

## 4. Đóng gói & Phân phối

### 4.1 Cách đóng gói Theme (.zip)

```
my-theme.zip
└── my-theme/                 ← Folder con (hoặc trực tiếp ở root)
    ├── theme.json            ← BẮT BUỘC
    ├── Homepage.tsx           ← BẮT BUỘC
    ├── Header.tsx
    ├── Footer.tsx
    ├── PostPage.tsx
    ├── Page.tsx
    ├── CategoryPage.tsx
    ├── TagPage.tsx
    └── ...
```

**Validation khi upload:**
1. ✅ File phải là `.zip`
2. ✅ Kích thước ≤ 100MB
3. ✅ Phải chứa `theme.json` (ở root hoặc subfolder đầu tiên)
4. ✅ `theme.json` phải có: `id`, `name`, `version`
5. ✅ Phải chứa `Homepage.tsx`
6. ⚠️ Nếu theme cùng `id` đã tồn tại → backup cũ → ghi đè

### 4.2 Cách đóng gói Plugin (.zip)

```
my-plugin.zip
└── my-plugin/
    ├── manifest.json         ← BẮT BUỘC
    └── ... (config files)
```

**Validation khi upload:**
1. ✅ File phải là `.zip`
2. ✅ Kích thước ≤ 50MB
3. ✅ Phải chứa `manifest.json`
4. ✅ `manifest.json` phải có: `id`, `name`, `version`, `settingKey`
5. ⚠️ Nếu plugin cùng `id` đã tồn tại → backup cũ → ghi đè

### 4.3 Sau khi cài đặt

- **Theme**: Cài xong ở trạng thái "Sẵn sàng kích hoạt". Admin phải bấm "Kích hoạt" để áp dụng.
- **Plugin**: Cài xong ở trạng thái "Chưa kích hoạt". Admin phải bật toggle.
- **Build lại**: Vì Next.js cần biên dịch TSX, sau khi upload theme/plugin mới cần restart dev server hoặc rebuild production.

---

## 5. Quy tắc chung

### ✅ NÊN

- Sử dụng TailwindCSS utility classes cho styling
- Import từ `@/lib/permalink` cho URL generation
- Import `Breadcrumbs` và `PublicCommentsSection` từ `@/components/`
- Sử dụng `lucide-react` cho icons
- Hỗ trợ responsive (mobile-first)
- Xử lý trường hợp `posts` rỗng
- Đọc `settings.site_language` để đa ngôn ngữ
- Render nội dung bài viết bằng `dangerouslySetInnerHTML` (nội dung đã sanitized từ editor)
- Sử dụng semantic versioning cho version

### ❌ KHÔNG NÊN

- Không import trực tiếp từ `@/lib/prisma` trong theme (dữ liệu được truyền qua props)
- Không tự gọi API `fetch()` trong theme Server Component (data đã có sẵn qua props)
- Không hard-code URL, sử dụng `generatePostUrl()` và `Link` component
- Không sử dụng `"use client"` ở top-level theme components (chúng là Server Components)
- Không tạo file có tên trùng với components CMS core: `layout.tsx`, `page.tsx`
- Không modify files ngoài folder theme/plugin của mình

### ⚠️ Lưu ý quan trọng

1. **Server Components**: Tất cả theme components mặc định là React Server Components. Nếu cần interactivity (hover, click, state), tạo sub-component riêng với `"use client"` và import vào.

2. **Template Hierarchy**: CMS tìm template theo thứ tự ưu tiên:
   ```
   Page-{slug}.tsx → Page.tsx → PostPage.tsx (fallback)
   ```

3. **Settings là string**: Tất cả giá trị trong `settings` đều là `string`. Parse JSON khi cần (ví dụ `theme_menu_header`).

4. **Preview Mode**: CMS hỗ trợ `?preview_theme={id}` để xem trước theme chưa kích hoạt.

---

*Tài liệu này là living document và sẽ được cập nhật khi CMS phát triển thêm tính năng mới.*
