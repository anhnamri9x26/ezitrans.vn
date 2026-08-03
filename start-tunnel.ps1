param(
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$Host.UI.RawUI.WindowTitle = 'Ezitrans Public Cloudflare Tunnel'

function Write-Step([string]$Message) {
  Write-Host "`n>>> $Message" -ForegroundColor Cyan
}

$TunnelContainerName = 'ezitrans-dev-cloudflared'

function Get-TunnelUrl {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $logs = (& docker logs --tail 120 $TunnelContainerName 2>&1) -join "`n"
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  $matches = [regex]::Matches($logs, 'https://[a-z0-9-]+\.trycloudflare\.com')
  if ($matches.Count -eq 0) { return $null }
  return $matches[$matches.Count - 1].Value
}

try {
  Write-Step 'Kiem tra Next.js dev server tai cong 3006'
  try {
    $devResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:3006' -UseBasicParsing -TimeoutSec 15
    if ($devResponse.StatusCode -ne 200) { throw "HTTP $($devResponse.StatusCode)" }
  }
  catch {
    throw 'Next.js dev server chua chay tai cong 3006. Hay chay start.bat truoc.'
  }

  Write-Step 'Khoi dong Cloudflare Tunnel toi giao dien dev moi nhat'
  & docker compose stop cloudflared | Out-Host
  $existingContainer = @(& docker ps -aq --filter "name=^/$TunnelContainerName$") -join ''
  if ($existingContainer.Trim()) {
    & docker rm -f $TunnelContainerName | Out-Null
  }
  & docker run -d --name $TunnelContainerName --restart unless-stopped `
    --add-host host.docker.internal:host-gateway `
    cloudflare/cloudflared:2026.7.3 `
    tunnel --no-autoupdate --protocol http2 --url http://host.docker.internal:3006 | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw 'Docker khong khoi dong duoc Cloudflare Tunnel. Hay mo Docker Desktop roi thu lai.'
  }

  Write-Step 'Dang cho website va tunnel san sang'
  $publicUrl = $null
  $deadline = (Get-Date).AddMinutes(3)
  do {
    Start-Sleep -Seconds 2
    $publicUrl = Get-TunnelUrl
  } until ($publicUrl -or (Get-Date) -ge $deadline)

  if (-not $publicUrl) {
    throw "Khong tim thay URL Cloudflare sau 3 phut. Chay: docker logs $TunnelContainerName"
  }

  Write-Host "Da nhan URL: $publicUrl" -ForegroundColor DarkGray
  Write-Host 'Dang kiem tra URL cong khai...' -ForegroundColor Yellow
  $isPublicReady = $false
  $deadline = (Get-Date).AddMinutes(2)
  do {
    Start-Sleep -Seconds 2
    try {
      $response = Invoke-WebRequest -Uri $publicUrl -UseBasicParsing -TimeoutSec 20
      $isPublicReady = $response.StatusCode -eq 200
    }
    catch {
      $isPublicReady = $false
    }
  } until ($isPublicReady -or (Get-Date) -ge $deadline)

  if (-not $isPublicReady) {
    throw 'Cloudflare da tao URL nhung URL chua truy cap duoc. Hay chay lai start-tunnel.bat.'
  }

  $urlFile = Join-Path $PSScriptRoot 'PUBLIC_URL.txt'
  @(
    $publicUrl
    "Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    'Target: Next.js development server at http://host.docker.internal:3006'
    "Managed by Docker container: $TunnelContainerName"
  ) | Set-Content -LiteralPath $urlFile -Encoding utf8

  try { Set-Clipboard -Value $publicUrl } catch { }

  Write-Host "`n========================================================" -ForegroundColor Green
  Write-Host '  LINK CONG KHAI DA SAN SANG' -ForegroundColor Green
  Write-Host '========================================================' -ForegroundColor Green
  Write-Host "`n$publicUrl`n" -ForegroundColor Yellow
  Write-Host 'Tunnel dang tro vao Next.js dev port 3006 va tu khoi dong lai.' -ForegroundColor Green
  Write-Host "Link duoc luu tai: $urlFile" -ForegroundColor Green

  if (-not $NoBrowser) {
    Add-Type -AssemblyName PresentationFramework -ErrorAction SilentlyContinue
    [System.Windows.MessageBox]::Show(
      "Link cong khai da san sang:`n`n$publicUrl`n`nLink da duoc luu trong PUBLIC_URL.txt.",
      'Ezitrans - Cloudflare Tunnel',
      'OK',
      'Information'
    ) | Out-Null
    Start-Process notepad.exe -ArgumentList $urlFile
    Start-Process $publicUrl
  }
}
catch {
  Write-Host "`n[LOI] $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
