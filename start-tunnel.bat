@echo off
setlocal
title Ezitrans Public Cloudflare Tunnel
cd /d "%~dp0"

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-tunnel.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" (
  echo Khong the khoi dong tunnel. Hay chup lai loi phia tren.
) else (
  echo Tunnel dang chay an. Co the dong cua so nay.
  echo Muon tat tunnel: chay file stop-tunnel.bat
)
echo.
pause
exit /b %EXIT_CODE%
