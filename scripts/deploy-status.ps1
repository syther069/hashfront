# Builds the status page for the deployment in hashfront.json and deploys it to the hashfront-status Vercel project.
#
# The page must be built with VITE_GATE and VITE_NETWORK: without them it becomes the generic page that reads the gate
# from the link, with no error. This script sets them from the config, builds, checks that the gate really is in the
# bundle, copies the build into the Vercel project folder (keeping its .vercel link), deploys, and probes the live API.
#
#   pwsh scripts/deploy-status.ps1                       # build, check and copy only (production deploys from GitHub on every push to main)
#   pwsh scripts/deploy-status.ps1 -Deploy               # also deploy to production from this machine: it replaces what GitHub deployed
#   pwsh scripts/deploy-status.ps1 -Dest ..\deploy\hashfront-status
param(
    [string]$Dest = (Join-Path $PSScriptRoot '..\..\deploy\hashfront-status'),
    [switch]$Deploy
)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$cfgPath = if (Test-Path hashfront.json) { 'hashfront.json' } else { 'hashfront.example.json' }
$cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json
if (-not $cfg.gate -or -not $cfg.network) { throw "$cfgPath has no gate or network" }
if (-not (Test-Path (Join-Path $Dest '.vercel'))) { throw "$Dest is not a linked Vercel project folder (it has no .vercel). Link it once with: cd $Dest; vercel link" }

$env:VITE_GATE = $cfg.gate
$env:VITE_NETWORK = $cfg.network
try {
    npm run build -w apps/web
    if ($LASTEXITCODE -ne 0) { throw 'the web build failed' }
} finally {
    Remove-Item Env:VITE_GATE, Env:VITE_NETWORK -ErrorAction SilentlyContinue
}

# the gate has to be baked into the bundle, or the page would silently take it from the link
$baked = Get-ChildItem apps/web/dist/assets -Filter 'config-*.js' | Select-String -SimpleMatch $cfg.gate.Substring(2) -List
if (-not $baked) { throw "the gate $($cfg.gate) is not in the built bundle; refusing to deploy a generic page" }
Write-Host "Gate $($cfg.gate) is baked into the build." -ForegroundColor Green

Get-ChildItem $Dest -Force | Where-Object { $_.Name -ne '.vercel' } | Remove-Item -Recurse -Force
Copy-Item (Join-Path apps/web/dist '*') $Dest -Recurse
Write-Host "Copied the build to $Dest"

if (-not $Deploy) { Write-Host 'Built and checked. Not deployed: production deploys from GitHub on push to main (use -Deploy to deploy from here).'; exit 0 }

Push-Location $Dest
try { vercel deploy --prod --yes } finally { Pop-Location }

$page = $cfg.statusPage.TrimEnd('/')
Start-Sleep -Seconds 25
foreach ($path in '/', '/api/status', '/api/price') {
    $code = try { (Invoke-WebRequest "$page$path" -UseBasicParsing -TimeoutSec 30).StatusCode } catch { $_.Exception.Response.StatusCode.value__ }
    Write-Host ("{0,-14} HTTP {1}" -f $path, $code)
}
