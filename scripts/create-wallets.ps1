# Creates the Hashfront burner wallets as encrypted Foundry keystores.
# You type a password for each at a hidden prompt; private keys are never printed.
# Safe to re-run: existing keystores are kept and only their addresses are shown.

$ErrorActionPreference = 'Stop'
$keystores = Join-Path $env:USERPROFILE '.foundry\keystores'
New-Item -ItemType Directory -Force -Path $keystores | Out-Null

$wallets = [ordered]@{
    'hashfront-deployer' = 'deploys contracts and uploads releases   -> fund 0.095 OKB'
    'hashfront-m1'       = 'maintainer 1 (approves releases)          -> fund 0.0005 OKB'
    'hashfront-m2'       = 'maintainer 2 (approves releases)          -> fund 0.0005 OKB'
    'hashfront-m3'       = 'maintainer 3 (approves releases)          -> fund 0.0005 OKB'
    'hashfront-reporter' = 'watcher reporter (sends onchain alerts)   -> fund 0.0001 OKB'
}

foreach ($name in $wallets.Keys) {
    $file = Join-Path $keystores $name
    if (Test-Path $file) {
        Write-Host "$name already exists, keeping it."
        continue
    }
    Write-Host ""
    Write-Host "Creating $name. Choose a password and store it in your password manager." -ForegroundColor Cyan
    cast wallet new $keystores $name | Out-Null
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $file)) { throw "creating $name failed" }
}

# Foundry keystores don't store the address in clear text, so each NEW one is unlocked once
# (password prompt) to derive it. Addresses already in wallet-addresses.txt are kept without a prompt.
$addressFile = Join-Path $PSScriptRoot '..\wallet-addresses.txt'
$known = @{}
if (Test-Path $addressFile) {
    foreach ($l in Get-Content $addressFile) {
        if ($l -match '^(\S+)\s+(0x[0-9a-fA-F]{40})') { $known[$Matches[1]] = $Matches[2] }
    }
}
$lines = @()
foreach ($name in $wallets.Keys) {
    if ($known.ContainsKey($name)) {
        $lines += ("{0,-19} {1}  {2}" -f $name, $known[$name], $wallets[$name])
        continue
    }
    Write-Host ""
    Write-Host "Unlock $name to read its address (same password you chose for it)." -ForegroundColor Cyan
    # cast can print more than one line; keep exactly the one that is an address.
    $found = @(cast wallet address --account $name | ForEach-Object { "$_".Trim() } | Where-Object { $_ -match '^0x[0-9a-fA-F]{40}$' })
    if ($LASTEXITCODE -ne 0 -or $found.Count -ne 1) { throw "reading the address of $name failed" }
    $address = $found[0]
    $lines += ("{0,-19} {1}  {2}" -f $name, $address, $wallets[$name])
}
Set-Content -Path $addressFile -Value $lines -Encoding utf8

Write-Host ""
Write-Host "Hashfront wallets (X Layer, chain 196). Send OKB on X Layer to these addresses:" -ForegroundColor Green
$lines | ForEach-Object { Write-Host "  $_" }
Write-Host ""
Write-Host "Saved to wallet-addresses.txt. Never share the keystore files or passwords; addresses are safe to share."
