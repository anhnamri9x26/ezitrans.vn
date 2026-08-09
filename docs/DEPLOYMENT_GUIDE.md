# Hướng Dẫn Triển Khai (Deployment Guide) & Di Chuyển Domain

Tài liệu này cung cấp các hướng dẫn tốt nhất để triển khai Lexi CMS hoặc chuyển dữ liệu sang một tên miền (domain) mới.

## 1. Production Docker/GHCR

Production Ezitrans chạy tại `/home/ezitrans.vn/next-cms` với:

- `app`: image bất biến `ghcr.io/anhnamri9x26/ezitrans-cms:<version>`.
- `db`: PostgreSQL 16 nội bộ, không public port.
- Nginx proxy tới `127.0.0.1:3011`.
- `content/`: media/plugin/theme persistent ngoài image.

Không sửa code trực tiếp trong container và không dùng `prisma db push` trên production.

### Cập nhật nội dung

Bài viết, menu, media, SEO và cấu hình được sửa trong Admin, không cần deploy.

### Cập nhật code

Sau khi commit và push code:

```powershell
npm run deploy
```

Lệnh chạy release validation rồi dispatch workflow **Deploy Ezitrans Production**.
Workflow build/push image Linux AMD64; VPS backup database, chạy migration, recreate riêng
app, health-check và rollback image nếu lỗi.

Xem trạng thái:

```powershell
npm run deploy:status
```

Kiểm tra trước mà không phát hành:

```powershell
npm run deploy:dry-run
```

GitHub Environment/secrets được mô tả trong `docs/production-secrets.md`.

### Rollback code

```bash
cd /home/ezitrans.vn/next-cms
ops/rollback-production.sh ghcr.io/anhnamri9x26/ezitrans-cms:<old-version>
```

Rollback mặc định chỉ đổi image, không tự restore database để tránh mất dữ liệu mới.

## 2. Chuyển Đổi Domain (Migrate Website)

Nếu bạn muốn copy nguyên site hiện tại sang domain mới, cần chuyển 4 phần chính:
- Source Code
- Database
- File Uploads (`public/uploads`, `public/media` hoặc S3)
- File cấu hình (`.env`)

### Quy Trình Di Chuyển:

1. **Export & Import Database**: Dùng `pg_dump` từ server cũ và `psql` vào server mới.
2. **Cập Nhật Tên Miền**:
   - Mở `.env` trên server mới và sửa `NEXT_PUBLIC_SITE_URL`.
   - Vào Admin > **Cài đặt Tổng quan** đổi Site URL thành domain mới.
3. **Cập Nhật OAuth & API**:
   - Nếu có đăng nhập Google/Facebook OAuth, nhớ đổi Callback URL trong Developer Console.
   - Các API / Analytics Tool (Google Analytics, SMTP Domain).
4. **Kiểm Tra SEO Checklist**:
   - Truy cập `/sitemap.xml`, `/robots.txt`, `/feed.xml` và đảm bảo URLs đã được đổi thành tên miền mới.
   - Thêm Redirect 301 từ server cũ (nếu có thể) sang server mới.

## 3. Kiến Trúc Setup Wizard (Trong Tương Lai)

Để việc cài đặt CMS dễ dàng hơn cho người không có kinh nghiệm, Lexi CMS trong tương lai sẽ có route `/install`. 
Wizard này sẽ bao gồm:
- Kiểm tra trạng thái Database.
- Khởi tạo tài khoản Quản trị (Admin) đầu tiên.
- Thiết lập Site URL, Tên Website.
- Thiết lập SMTP ban đầu.
- Khoá (`lock`) installer sau khi hoàn tất để đảm bảo bảo mật.
