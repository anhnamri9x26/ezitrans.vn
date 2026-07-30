# Hướng Dẫn Phát Triển Theme Cho Lexi CMS

Lexi CMS cho phép bạn tùy chỉnh giao diện người dùng thông qua hệ thống Theme độc lập.

## 1. Cấu Trúc Bắt Buộc Của Một Theme

Themes được đặt tại `src/themes/`. Cấu trúc thư mục của một theme cần có:

```text
src/themes/theme-id/
├── manifest.json       (Bắt buộc)
├── README.md           (Bắt buộc)
├── preview.png         (Bắt buộc: Ảnh đại diện cho theme, 1200x800 px)
├── templates/          (Chứa các Page Template)
├── components/         (UI Components: header, footer, cards...)
├── styles/             (CSS, Tailwind Config...)
└── assets/             (Fonts, Hình ảnh nội bộ theme)
```

## 2. Tiêu Chuẩn `manifest.json`

Theme sử dụng `manifest.json` để khai báo các template hỗ trợ:

1. **Format File**: UTF-8 **không có BOM**.
2. **`id`**: Chuẩn `lowercase-kebab-case`, phải **trùng khớp** tên thư mục.
3. **`previewImage`**: Là đường dẫn tương đối (ví dụ `preview.png`), **không** sử dụng URL ngoài (`http://`).
4. **`templates`**: Các đường dẫn template không được dùng đường dẫn ngoài. **Bắt buộc** phải khai báo một `fallback` template.
5. **`supports`**: Danh sách tính năng theme hỗ trợ (không được trùng lặp).

### Mẫu `manifest.json`

```json
{
  "id": "modern-academy",
  "name": "Modern Academy",
  "version": "1.0.0",
  "author": "Author Name",
  "description": "Theme cho trung tâm giáo dục.",
  "previewImage": "preview.png",
  "supports": [
    "header",
    "footer",
    "single-post",
    "page",
    "archive",
    "seo",
    "page-builder"
  ],
  "templates": {
    "home": "templates/Home.tsx",
    "page": "templates/Page.tsx",
    "post": "templates/Post.tsx",
    "archive": "templates/Archive.tsx",
    "fallback": "templates/Page.tsx"
  }
}
```

## 3. Tiêu Chuẩn Thiết Kế Template

1. **Không Hardcode Domain / URLs**: Sử dụng cấu hình của CMS (Site URL, Media URL). Không hardcode tài sản (assets).
2. **Không Query DB Trực Tiếp**: Hãy dùng các API Service / Server Actions được cung cấp bởi Core. Themes chỉ làm nhiệm vụ hiển thị (View layer).
3. **SEO Friendly**: Không làm hỏng hoặc override tuỳ tiện các Metadata SEO mà hệ thống đã generate.
4. **Responsive**: Đảm bảo hiển thị tốt trên mọi thiết bị di động, máy tính bảng và màn hình lớn.
5. **Fallback Template**: Khi hệ thống không tìm thấy template phù hợp, nó sẽ sử dụng `templates.fallback`. Bắt buộc phải có template này.

## 4. Kiểm Tra Theme

Hãy chạy script để quét lỗi cấu trúc trước khi submit:

```bash
npm run validate:themes
```
