# RX CLOUD Windows — local preflight only (read-only, no installs, no secrets)
$ErrorActionPreference = 'Stop'
function Check-Command([string]$Name) {
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) { Write-Host "[MISSING] $Name"; return $false }
  Write-Host "[OK] $Name : $($command.Source)"
  return $true
}
Write-Host 'RX CLOUD Windows local preflight (no installation, no deployment)'
Write-Host ('OS: ' + [System.Environment]::OSVersion.VersionString)
$nodeFound = Check-Command 'node'
$gitFound = Check-Command 'git'
if ($nodeFound) {
  $versionText = (& node --version).Trim()
  Write-Host "Node version: $versionText"
  if ($versionText -match '^v(\d+)\.' -and [int]$Matches[1] -ge 22) { Write-Host '[OK] Node 22+' }
  else { Write-Host '[ACTION] Node.js 22+ required for RX CLOUD'; $nodeFound = $false }
}
if ($gitFound) { & git --version }
if ((Test-Path 'rx-cloud-server.cjs') -and $nodeFound) {
  & node --check 'rx-cloud-server.cjs'
  if ($LASTEXITCODE -ne 0) { throw 'RX CLOUD server syntax check failed' }
  Write-Host '[OK] RX CLOUD syntax'
} elseif (-not (Test-Path 'rx-cloud-server.cjs')) {
  Write-Host '[INFO] Run from VEXORIO repository to check server syntax'
}
Write-Host 'No files, firewall rules, services, DNS, or secrets changed.'
if (-not $nodeFound -or -not $gitFound) { exit 2 }
