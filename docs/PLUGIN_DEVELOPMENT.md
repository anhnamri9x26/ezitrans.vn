# Hướng Dẫn Phát Triển Plugin Cho Lexi CMS

Tài liệu này định nghĩa các tiêu chuẩn kỹ thuật bắt buộc khi phát triển Plugin mở rộng (Extensions) cho hệ thống Lexi CMS.

## 1. Cấu Trúc Bắt Buộc

Mỗi plugin phải được đặt trong một thư mục tại `src/plugins/`. Cấu trúc của plugin cần tuân theo:

```text
src/plugins/plugin-id/
├── manifest.json       (Bắt buộc: Khai báo plugin)
├── index.ts            (Bắt buộc: Export metadata/feature constants)
├── README.md           (Bắt buộc: Tài liệu hướng dẫn sử dụng)
├── admin/              (Các component cho giao diện admin)
├── components/         (Các component dùng chung)
├── lib/                (Logic/helper nội bộ)
├── api/                (Logic API nếu có)
└── migrations/         (Các file prisma schema hoặc SQL query nếu cần Database)
```

## 2. Tiêu Chuẩn Cho `manifest.json`

File `manifest.json` là trái tim của plugin. Bạn **phải** đảm bảo các quy tắc sau:

1. **Format File**: UTF-8 **không có BOM**.
2. **`id`**: Phải **trùng khớp hoàn toàn** với tên thư mục. Format chuẩn: `lowercase-kebab-case`. Ví dụ: `lexi-shield-security`.
3. **`settingKey`**: Phải bắt đầu bằng `plugin_` và kết thúc bằng `_enabled`. Ví dụ: `plugin_seo_enabled`.
4. **`entry`**: Trỏ tới file chính (ví dụ: `index.ts`). **Tuyệt đối không** dùng URL (như `http://...`).
5. **`componentPath`**: Phải là path nội bộ, bắt đầu bằng `@/plugins/` hoặc là relative path hợp lệ.
6. **`capabilities`**: Danh sách quyền (không được trùng lặp).

### Mẫu `manifest.json`

```json
{
  "id": "lexi-shield-security",
  "name": "Lexi Shield Security",
  "description": "Plugin bảo mật cho Lexi CMS.",
  "version": "1.0.0",
  "author": "Author Name",
  "icon": "shield",
  "iconColor": "#2563eb",
  "settingKey": "plugin_lexi_shield_enabled",
  "category": "security",
  "requires": [],
  "adminRoute": "/settings/security",
  "entry": "index.ts",
  "componentPath": "@/plugins/lexi-shield-security",
  "capabilities": [
    "security-health-score",
    "ip-blocking",
    "file-integrity-scanner"
  ],
  "changelog": [
    {
      "version": "1.0.0",
      "date": "2026-06-29",
      "changes": ["Initial release"]
    }
  ]
}
```

## 3. Quy Tắc Bật / Tắt Plugin

Mọi tính năng, giao diện hoặc API route của plugin **bắt buộc** phải tôn trọng `settingKey`.

- Nếu user tắt plugin trong Manager, hệ thống sẽ lưu `plugin_xxx_enabled = "false"`.
- Các Route API của bạn nên gọi plugin guard hoặc check setting này trước khi xử lý logic.
- Không tự động đăng ký hoặc chạy logic ngầm nếu plugin đang tắt.

## 4. Can Thiệp Vào Core

- **Tuyệt đối hạn chế sửa mã nguồn Core (`src/app/`, `src/lib/`, `prisma/schema.prisma`) trực tiếp.**
- Hiện tại CMS sử dụng hệ thống Hook cho một vài thành phần, việc tích hợp phải tuân thủ hướng dẫn để không phá vỡ Next.js file-system routing.

## 5. Quy Trình Kiểm Tra (Validation)

Trước khi submit plugin, hãy chạy script kiểm tra:

```bash
npm run validate:plugins
```

Và đảm bảo Next.js build thành công:

```bash
npm run build
```
