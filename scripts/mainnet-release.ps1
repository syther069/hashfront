# Mainnet release of the HashSwap demo in two stages, with a maintainer approving from a real wallet in between (P6).
#
#   1. propose: build vN, pre-flight, hash, propose onchain (deployer keystore)
#        pwsh scripts/mainnet-release.ps1 -Stage propose -Version 2
#   -> a maintainer approves on the status page: https://hashfront-status.vercel.app/#/approve/<id>
#   2. finish: the remaining maintainers approve from their keystores, then upload, seal, activate, wait until live
#        pwsh scripts/mainnet-release.ps1 -Stage finish -Version 2 -Approvers hashfront-m2,hashfront-m3
#
# Every transaction carries the X Layer Builder Code from hashfront.json. Passwords are typed at hidden prompts.
param(
    [Parameter(Mandatory = $true)][ValidateSet('propose', 'finish')][string]$Stage,
    [Parameter(Mandatory = $true)][ValidateRange(2, 999)][int]$Version,
    [string[]]$Approvers = @()
)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$cfg = Get-Content hashfront.json -Raw | ConvertFrom-Json
if ($cfg.builderCode) { $env:HASHFRONT_BUILDER_CODE = $cfg.builderCode }
$cli = 'packages/cli/src/main.ts'
$net = @('--network', 'xlayer', '--gate', $cfg.gate)
$dir = "apps/demo-dapp/dist-v$Version"
$manifest = "manifests/v$Version.json"
$idFile = "manifests/v$Version.id"

function Invoke-Checked([string]$what, [scriptblock]$cmd) {
    Write-Host "`n== $what" -ForegroundColor Cyan
    & $cmd
    if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE). Nothing after it was sent." }
}

if ($Stage -eq 'propose') {
    if (Test-Path $idFile) { throw "$idFile exists: v$Version was already proposed as release $((Get-Content $idFile -Raw).Trim())" }
    Invoke-Checked "build HashSwap v$Version" {
        $env:VITE_RELEASE = "v$Version"
        try { npm run build -w apps/demo-dapp -- --outDir "dist-v$Version" --emptyOutDir } finally { Remove-Item Env:VITE_RELEASE }
    }
    Invoke-Checked 'pre-flight and manifest' {
        node $cli preflight $dir
        if ($LASTEXITCODE -eq 0) { node $cli manifest $dir --out $manifest }
    }
    Invoke-Checked "propose v$Version (deployer password)" { node $cli propose --manifest $manifest --id-file $idFile @net --account hashfront-deployer }
    $id = (Get-Content $idFile -Raw).Trim()
    Write-Host "`nRelease $id proposed. Approve it in your wallet at:" -ForegroundColor Green
    Write-Host "  $($cfg.statusPage)#/approve/$id"
    Write-Host "Load $manifest on that page to check the files. Then run the finish stage."
    exit 0
}

# ---- finish
if (-not (Test-Path $idFile)) { throw "no $idFile; run the propose stage first" }
$id = (Get-Content $idFile -Raw).Trim()
if ($id -notmatch '^\d+$') { throw "bad release id in $idFile" }
foreach ($m in $Approvers) {
    Invoke-Checked "approve release $id as $m ($m password)" { node $cli approve --id $id --manifest $manifest @net --account $m }
}
Invoke-Checked "upload release $id (deployer password)" { node $cli upload --id $id --manifest $manifest $dir @net --account hashfront-deployer }
Invoke-Checked "seal release $id (deployer password)" { node $cli seal --id $id --manifest $manifest @net --account hashfront-deployer }
Write-Host "`nWith 3 of 3 approvals it can go live now; with 2 of 3 activation waits for the $($cfg.timelockSeconds) s timelock." -ForegroundColor Yellow
Invoke-Checked "activate release $id (deployer password)" { node $cli activate --id $id @net --account hashfront-deployer }
Invoke-Checked 'wait until live' { node $cli wait-active --id $id --timeout 120 --exact @net }
node $cli status @net
Write-Host "`nRelease v$id is live onchain. Deploy $dir to the normal host next (the watcher reports HOST_BEHIND until then)." -ForegroundColor Green
