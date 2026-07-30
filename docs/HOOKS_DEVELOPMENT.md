# Hướng dẫn phát triển Hook cho Lexi CMS

Hook System là một hệ thống mạnh mẽ cho phép các plugin tương tác, thay đổi dữ liệu hoặc thêm chức năng mới vào Lexi CMS mà không cần chỉnh sửa trực tiếp mã nguồn lõi (core codebase).

## 1. Cơ chế hoạt động

Lexi CMS sử dụng 2 loại hook chính, học theo triết lý của WordPress:
- **Action (Hành động)**: Chạy một đoạn mã tại một thời điểm cụ thể (ví dụ: ngay sau khi đăng bài viết). Không cần trả về dữ liệu.
- **Filter (Bộ lọc)**: Nhận vào một dữ liệu, cho phép plugin thay đổi (mutate) và bắt buộc phải `return` dữ liệu đó ra để hệ thống dùng tiếp.

## 2. Khai báo Hook trong Plugin

Mọi plugin muốn sử dụng hook phải khai báo file hook trong `manifest.json`:

```json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "hooks": "hooks.ts"
}
```

Và trong file `hooks.ts`, bạn **bắt buộc** phải export một hàm có tên `registerHooks`:

```typescript
import { HookManager } from '@/lib/hooks/HookManager';
import { CORE_HOOKS } from '@/lib/hooks/coreHooks';

export function registerHooks(hooks: HookManager) {
  // Thêm filter
  hooks.addFilter(CORE_HOOKS.SEO_META, (metaObject: any) => {
    metaObject.title.default = `[My Plugin] ${metaObject.title.default}`;
    return metaObject;
  }, 10, 'my-awesome-plugin');

  // Thêm action
  hooks.addAction(CORE_HOOKS.CONTENT_AFTER_PUBLISH, (post: any) => {
    console.log(`Đã xuất bản bài viết: ${post.title}`);
  }, 10, 'my-awesome-plugin');
}
```

## 3. Danh sách Core Hooks

Lexi CMS cung cấp các hook chuẩn thông qua object `CORE_HOOKS`:

### SEO & UI
- **`seo.meta`** (Filter): Chỉnh sửa thẻ Meta SEO. Input: `metaObject`. Output: `metaObject`.
- **`admin.sidebar.items`** (Filter): Thêm menu vào sidebar Admin.
- **`admin.dashboard.cards`** (Filter): Thêm thẻ thống kê vào bảng điều khiển.
- **`settings.panels`** (Filter): Thêm giao diện cài đặt plugin vào trang Cài đặt chung.

### Media Hooks
- **`media.validateFile`** (Filter): Kiểm duyệt file. Trả về `{ allowed: false, reason: "..." }` để chặn tải lên.
- **`media.beforeUpload`** (Filter): Cho phép đổi tên hoặc format nội dung file trước khi ghi đĩa.
- **`media.afterUpload`** (Action): Thông báo sau khi file tải lên và lưu DB thành công.
- **`media.transformUrl`** (Filter): Biến đổi URL trước khi trả về Frontend (Ví dụ: map CDN URL).
- **`media.library.actions`** (Filter): Bổ sung các nút bấm hành động riêng lẻ vào thư viện Media.

### Content / Post Hooks
- **`content.validate`** (Filter): Quét và kiểm tra bài viết. Trả về `{ valid: false, errors: [] }` để chặn lưu.
- **`content.transformSlug`** (Filter): Tự động tạo slug chuẩn cho SEO.
- **`content.transformExcerpt`** (Filter): Tự động cắt/trích xuất mô tả ngắn.
- **`content.beforeSave`** (Filter): Mutate các tham số như Title, Slug, Excerpt, SEO một lần cuối.
- **`content.afterSave`** (Action): Thông báo sau khi lưu nháp hoặc cập nhật DB thành công.
- **`content.beforePublish`** (Filter): Chặn thao tác xuất bản bằng các luật tùy chỉnh.
- **`content.afterPublish`** (Action): Hành động sau khi bài viết được công khai (ví dụ: ping Sitemap, gửi Email).

## 4. Best Practices (Lưu ý quan trọng)

1. **Không import Client Component vào server hook**: File `hooks.ts` chạy hoàn toàn ở môi trường Node.js Server. Tuyệt đối không import các component chứa `"use client"`.
2. **Không dùng Dynamic Import runtime**: Lexi CMS sử dụng Turbopack. Các hook file được biên dịch thông qua một Static Registry (Chạy `npm run generate`).
3. **Filter bắt buộc phải return**: Nếu bạn quên `return` trong một Filter, hệ thống sẽ nhận giá trị `undefined` và gây crash dữ liệu liền sau đó.
4. **Action không làm crash Core**: Hệ thống đã bọc `try/catch` các action, tuy nhiên bạn nên tự chủ động handle lỗi của riêng plugin để tránh tốn tài nguyên.
5. **Ưu tiên Async/Await**: Hầu hết các hook đều hỗ trợ Promise, hãy dùng Async/Await nếu cần gọi API hay truy vấn DB nội bộ.
