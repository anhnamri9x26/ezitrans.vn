@echo off
title Khởi động Ezitrans CMS (Next.js)
echo ========================================================
echo DANG KHOI DONG EZITRANS CMS BASE (PORT 3006)
echo ========================================================
echo.

:: Di chuyển đến đúng thư mục chứa file bat này
cd /d "%~dp0"

echo Dang kiem tra va giai phong port 3006...

:: Dùng PowerShell để đảm bảo giải phóng sạch sẽ (Mất khoảng 1-2s)
powershell -Command "Get-NetTCPConnection -LocalPort 3006 -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -ne 0) { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }" >nul 2>&1

echo Da giai phong port 3006 (neu co).
echo.

:: Chạy lệnh dev của Next.js
echo.
echo Kiem tra ket noi Database...
netstat -ano | findstr :5432 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [CANH BAO] Khong tim thay PostgreSQL hoac Docker Postgres dang chay tren port 5432!
    echo Vui long dam bao ban da bat Docker hoac PostgreSQL tren port 5432.
    echo neu PostgreSQL cua ban dung port khac, vui long cap nhat DATABASE_URL trong file .env
    echo.
)

echo Dang khoi dong Next.js dev server...
call npm run dev

:: Giữ cửa sổ terminal mở nếu có lỗi
if %ERRORLEVEL% neq 0 (
    echo.
    echo [LOI] Khong the khoi dong dev server. Vui long kiem tra node_modules hoac port 3006.
)
pause
