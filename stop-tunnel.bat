@echo off
title Stop Ezitrans Cloudflare Tunnel
cd /d "%~dp0"
docker rm -f ezitrans-dev-cloudflared >nul 2>&1
docker compose stop cloudflared >nul 2>&1
if errorlevel 1 (
  echo Khong the tat tunnel. Kiem tra Docker Desktop.
) else (
  echo Da tat Cloudflare Tunnel cua Ezitrans.
)
pause
