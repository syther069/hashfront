# Stores the OKX Onchain OS API keys as encrypted, sensitive Vercel environment variables of the status page project,
# piped from hidden prompts (never shown, never written to a file). Run from the linked Vercel project folder.
#
#   cd ..\deploy\hashfront-status; pwsh ..\..\hashfront\scripts\vercel-okx-env.ps1
$ErrorActionPreference = 'Stop'
if (-not (Test-Path .vercel/project.json)) { throw 'run this inside the linked Vercel project folder (deploy\hashfront-status)' }
foreach ($name in 'OKX_API_KEY', 'OKX_SECRET_KEY', 'OKX_API_PASSPHRASE') {
    $s = Read-Host "$name (hidden)" -AsSecureString
    $value = [System.Net.NetworkCredential]::new('', $s).Password.Trim()
    if (-not $value) { throw "$name is empty" }
    vercel env rm $name production --yes 2>$null | Out-Null
    $value | vercel env add $name production --sensitive | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "vercel env add $name failed" }
    Remove-Variable value
    Write-Host "$name stored (sensitive, production)." -ForegroundColor Green
}
