# Runs the Hashfront watcher continuously for the deployment in hashfront.json (task N4).
# Secrets never touch disk or the command line: the reporter keystore password and the Telegram bot token are asked
# at hidden prompts and live only in this process. State (signals baseline, incidents) is kept in .watcher/.
#
#   pwsh scripts/run-watcher.ps1 -Site https://hashswap-demo.vercel.app/ -TelegramChat 6977270776
param(
    [Parameter(Mandatory = $true)][string]$Site,
    [string]$TelegramChat = '',
    [int]$Interval = 30,
    [string]$Reporter = 'hashfront-reporter'
)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$cfg = Get-Content hashfront.json -Raw | ConvertFrom-Json
# X Layer Builder Code (ERC-8021): appended to every alert transaction the watcher sends
if ($cfg.builderCode) { $env:HASHFRONT_BUILDER_CODE = $cfg.builderCode }
New-Item -ItemType Directory -Force -Path .watcher | Out-Null
if (-not (Test-Path manifests/v1.json)) { throw 'manifests/ has no release manifests; the watcher needs one per release' }

if ($TelegramChat) {
    $secure = Read-Host 'Telegram bot token (hidden)' -AsSecureString
    $env:TELEGRAM_BOT_TOKEN = [System.Net.NetworkCredential]::new('', $secure).Password.Trim()
}
try {
    $watchArgs = @(
        'packages/watcher/src/main.ts',
        '--site', $Site,
        '--gate', $cfg.gate,
        '--network', $cfg.network,
        '--manifests', 'manifests',
        '--state', '.watcher/signals.json',
        '--name', $cfg.name,
        '--alert-state', '.watcher/alerts.json',
        '--tapesend-to', 'self',
        '--alerts-mainnet',
        '--account', $Reporter,
        '--interval', "$Interval"
    )
    if ($TelegramChat) { $watchArgs += "--telegram-chat=$TelegramChat" }
    Write-Host "Watching $Site against gate $($cfg.gate) every $Interval s. Ctrl+C stops it." -ForegroundColor Cyan
    node @watchArgs
} finally {
    Remove-Item Env:TELEGRAM_BOT_TOKEN -ErrorAction SilentlyContinue
}
