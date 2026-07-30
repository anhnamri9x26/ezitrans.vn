# Hướng Dẫn Triển Khai (Deployment Guide) & Di Chuyển Domain

Tài liệu này cung cấp các hướng dẫn tốt nhất để triển khai Lexi CMS hoặc chuyển dữ liệu sang một tên miền (domain) mới.

## 1. Cài Mới (Fresh Install) Trên Server/Domain Mới

Khuyến nghị cấu hình server:
- Ubuntu VPS (hoặc Vercel)
- Node.js 20+
- PostgreSQL
- Nginx & PM2
- SSL (Let's Encrypt)

### Các Bước Thực Hiện:

1. **Clone Source Code**
   ```bash
   git clone <repo_url> <project_name>
   cd <project_name>
   npm install
   ```

2. **Cấu Hình `.env`**
   Tạo file `.env` dựa trên `.env.example`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/lexicms_db"
   NEXT_PUBLIC_SITE_URL="https://yournewdomain.com"
   ```

3. **Cài Đặt Database**
   ```bash
   npx prisma generate
   npx prisma db push
   # Tuỳ chọn seed dữ liệu mặc định:
   npm run db:seed-header
   ```

4. **Build & Start Production**
   ```bash
   npm run build
   pm2 start npm --name "lexicms-app" -- start
   ```

5. **Cấu Hình Nginx**
   Sử dụng Nginx như một Reverse Proxy cho port 3000 và cấp chứng chỉ SSL bằng Certbot.

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
