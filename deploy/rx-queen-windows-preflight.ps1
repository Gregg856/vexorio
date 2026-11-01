# RX #613 — read-only Queen readiness on Windows. No install, no secrets.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$probe = Join-Path $PSScriptRoot 'rx-queen-live-probe.cjs'
if (-not (Test-Path -LiteralPath $probe -PathType Leaf)) { throw 'Queen probe missing' }
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { Write-Host '[NOT READY] Node.js 22+ missing'; exit 2 }
$version = (& node --version).Trim()
if ($version -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22) {
  Write-Host '[NOT READY] Node.js 22+ required'; exit 2
}
Write-Host 'RX Queen local runtime readiness (read-only, localhost only)'
Push-Location $root
try {
  & node $probe
  $result = $LASTEXITCODE
} finally { Pop-Location }
if ($result -ne 0) { Write-Host '[NOT READY] Model or Queen gateway is not running locally'; exit 1 }
Write-Host '[OK] Local Queen runtime and gateway responded; admin panel not verified'
exit 0
