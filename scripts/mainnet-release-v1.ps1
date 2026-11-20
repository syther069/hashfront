# Task M, steps 2-3 on X Layer MAINNET (run only after an explicit "go"):
#   1. the deployer sends a little gas to the 3 maintainers and the reporter (skipped for a wallet that already has it)
#   2. HashSwap release v1: propose, 3 of 3 approvals (no timelock), upload, seal, activate, wait until live
# Every transaction is signed from a Foundry keystore; you type each wallet's password at a hidden prompt.
# Re-running is safe for step 1 and for propose (the release id is kept in manifests/v1.id).
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$rpc = 'https://rpc.xlayer.tech'
$gate = (Get-Content hashfront.json -Raw | ConvertFrom-Json).gate
# X Layer Builder Code (ERC-8021): the CLI appends it to every transaction it sends
$builderCode = (Get-Content hashfront.json -Raw | ConvertFrom-Json).builderCode
if ($builderCode) { $env:HASHFRONT_BUILDER_CODE = $builderCode }
$addr = @{}
foreach ($l in Get-Content wallet-addresses.txt) { if ($l -match '^(\S+)\s+(0x[0-9a-fA-F]{40})') { $addr[$Matches[1]] = $Matches[2] } }

function Invoke-Checked([string]$what, [scriptblock]$cmd) {
    Write-Host "`n== $what" -ForegroundColor Cyan
    & $cmd
    if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE). Nothing after it was sent; fix the cause and re-run (funding and propose are skipped when already done)." }
}

# ---- 1. gas for maintainers and reporter (wei): 0.00002 OKB covers ~25 approvals, 0.00005 OKB ~9 alerts
$targets = [ordered]@{
    'hashfront-m1'       = 20000000000000
    'hashfront-m2'       = 20000000000000
    'hashfront-m3'       = 20000000000000
    'hashfront-reporter' = 50000000000000
}
foreach ($name in $targets.Keys) {
    $to = $addr[$name]
    $have = [decimal](cast balance $to --rpc-url $rpc)
    if ($have -ge $targets[$name]) { Write-Host "$name already has gas, skipping."; continue }
    Invoke-Checked "send $($targets[$name] / 1e18) OKB gas to $name ($to) - deployer password" {
        cast send $to --value $targets[$name] --account hashfront-deployer --rpc-url $rpc
    }
}

# ---- 2. release v1 of the demo build
$cli = 'packages/cli/src/main.ts'
$net = @('--network', 'xlayer', '--gate', $gate)
New-Item -ItemType Directory -Force -Path manifests | Out-Null
Invoke-Checked 'pre-flight and manifest of apps/demo-dapp/dist' {
    node $cli preflight apps/demo-dapp/dist
    if ($LASTEXITCODE -eq 0) { node $cli manifest apps/demo-dapp/dist --out manifests/v1.json }
}
if (-not (Test-Path manifests/v1.id)) {
    Invoke-Checked 'propose v1 (deployer password)' { node $cli propose --manifest manifests/v1.json --id-file manifests/v1.id @net --account hashfront-deployer }
}
$id = (Get-Content manifests/v1.id -Raw).Trim()
if ($id -notmatch '^\d+$') { throw "bad release id in manifests/v1.id" }
foreach ($m in 'hashfront-m1', 'hashfront-m2', 'hashfront-m3') {
    Invoke-Checked "approve release $id as $m ($m password)" { node $cli approve --id $id --manifest manifests/v1.json @net --account $m }
}
Invoke-Checked "upload release $id (deployer password)" { node $cli upload --id $id --manifest manifests/v1.json apps/demo-dapp/dist @net --account hashfront-deployer }
Invoke-Checked "seal release $id (deployer password)" { node $cli seal --id $id --manifest manifests/v1.json @net --account hashfront-deployer }
Invoke-Checked "activate release $id (deployer password)" { node $cli activate --id $id @net --account hashfront-deployer }
Invoke-Checked 'wait until live' { node $cli wait-active --id $id --timeout 120 --exact @net }
node $cli status @net
Write-Host "`nRelease v$id is live. Verified copy: $((Get-Content hashfront.json -Raw | ConvertFrom-Json).verifiedUrl)" -ForegroundColor Green
