# RX CLOUD Windows — local staging start only. No DNS, firewall, service, or production changes.
param([string]$ConfigPath = '.\\rxcloud.local.env')
$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$serverPath = Join-Path $repoRoot 'rx-cloud-server.cjs'
if (-not (Test-Path -LiteralPath $serverPath)) { throw 'RX CLOUD server not found' }
if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) { throw 'Local config not found. Create a private rxcloud.local.env with STAGING credentials; do not commit it.' }
$version = (& node --version).Trim()
if ($LASTEXITCODE -ne 0 -or $version -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22) { throw 'Node.js 22+ required' }
$vars = @{}
foreach ($line in [System.IO.File]::ReadAllLines((Resolve-Path -LiteralPath $ConfigPath).Path)) {
  $item = $line.Trim()
  if (-not $item -or $item.StartsWith('#')) { continue }
  if ($item -notmatch '^([A-Z][A-Z0-9_]*)=(.*)$') { throw 'Invalid local env entry' }
  $vars[$Matches[1]] = $Matches[2].Trim()
}
$allowed = @('SUPABASE_URL','SUPABASE_ANON_KEY')
foreach ($key in $vars.Keys) { if ($key -notin $allowed) { throw ('Unexpected config key: ' + $key) } }
if (-not $vars.ContainsKey('SUPABASE_URL') -or $vars['SUPABASE_URL'] -notmatch '^https://[a-z0-9-]+\.supabase\.co/?$') { throw 'Valid staging SUPABASE_URL required' }
if ($vars['SUPABASE_URL'] -match 'lfytoxcnutduahshbsko') { throw 'Production Supabase is forbidden in local staging start' }
if (-not $vars.ContainsKey('SUPABASE_ANON_KEY') -or -not $vars['SUPABASE_ANON_KEY']) { throw 'Staging anon key required' }
# Explicitly isolate the local staging process from inherited production credentials.
# The private learning endpoint must never inherit a production Queen token.
foreach ($key in @('RX_QUEEN_LOCAL_TOKEN','RX_CLOUD_BRAIN_MEMORY_URL','RX_BRAIN_MEMORY_FILE','RX_BIBI_MODEL_ENABLED','RX_BIBI_MODEL_PORT','RX_BIBI_CLIENT_MODEL_FIRST','RX_BIBI_TRAINING_FILE','RX_BIBI_HISTORY_FILE','RX_BIBI_HOLDOUT_FILE')) {
  Remove-Item -Path ('Env:' + $key) -ErrorAction SilentlyContinue
}
$env:SUPABASE_URL = $vars['SUPABASE_URL']
$env:SUPABASE_ANON_KEY = $vars['SUPABASE_ANON_KEY']
$env:HOST = '127.0.0.1'
$env:PORT = '8787'
$env:RX_AI_ENABLED = 'false'
$env:VIEW_COUNT_ENABLED = 'false'
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
Remove-Item Env:RX_GITHUB_DISPATCH_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:RX_ADMIN_USER_ID -ErrorAction SilentlyContinue
& node --check $serverPath
if ($LASTEXITCODE -ne 0) { throw 'RX CLOUD syntax failed' }
Write-Host 'Starting RX CLOUD staging on http://127.0.0.1:8787 (Ctrl+C to stop)'
Push-Location $repoRoot
try { & node $serverPath; if ($LASTEXITCODE -ne 0) { throw 'RX CLOUD process failed' } }
finally { Pop-Location }
