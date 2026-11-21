# Runs one command with the OKX Onchain OS API keys in its environment, typed at hidden prompts.
# The keys live only in this PowerShell process and are removed when the command ends.
#
#   pwsh scripts/with-okx.ps1 node packages/cli/src/main.ts doctor --gate 0x... --site https://... --reporter 0x...
#   pwsh scripts/with-okx.ps1 pwsh scripts/run-watcher.ps1 -Site https://... -TelegramChat 123
$ErrorActionPreference = 'Stop'
if ($args.Count -eq 0) { throw 'usage: with-okx.ps1 <command> [args...]' }
function Read-Secret([string]$prompt) {
    $s = Read-Host $prompt -AsSecureString
    [System.Net.NetworkCredential]::new('', $s).Password.Trim()
}
$env:OKX_API_KEY = Read-Secret 'OKX API key (hidden)'
$env:OKX_SECRET_KEY = Read-Secret 'OKX secret key (hidden)'
$env:OKX_API_PASSPHRASE = Read-Secret 'OKX passphrase (hidden)'
try {
    $cmd = $args[0]
    $rest = @($args | Select-Object -Skip 1)
    & $cmd @rest
    exit $LASTEXITCODE
} finally {
    Remove-Item Env:OKX_API_KEY, Env:OKX_SECRET_KEY, Env:OKX_API_PASSPHRASE -ErrorAction SilentlyContinue
}
