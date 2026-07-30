# Lexi Shield Security

Lexi Shield Security là plugin bảo mật chính thức cho Lexi CMS.

## Tính năng

- Security Health Score
- Hardening Checklist
- Recommended Actions
- Login Activity Monitor
- IP Blocking / Allowlist
- 2FA cho tài khoản quản trị
- Static WAF ở middleware
- File Integrity & Malware Scanner

## Routes đang sử dụng

Do Next.js dùng file-system routing, các route vẫn nằm ở vị trí chuẩn của app:

- `/admin/settings/security`
- `/api/security/events`
- `/api/security/health`
- `/api/security/ip-rules`
- `/api/security/scanner/baseline`
- `/api/security/scanner/scan`

Plugin được quản lý qua manifest này và setting:

```txt
plugin_lexi_shield_enabled
```

## Ghi chú kiến trúc

Static WAF trong `src/middleware.ts` chạy trước database layer. Vì vậy WAF cơ bản vẫn ở chế độ an toàn để chặn request độc hại sớm. Các API/UI bảo mật còn lại tôn trọng trạng thái bật/tắt plugin.
