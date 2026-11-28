# Runs the Hashfront watcher continuously for the deployment in hashfront.json (task N4).
# Secrets never touch disk or the command line: the reporter keystore password and the Telegram bot token are asked
# at hidden prompts and live only in this process. State (signals baseline, incidents) is kept in .watcher/.
#
#   pwsh scripts/run-watcher.ps1 -Site https://hashswap-demo.vercel.app/ -TelegramChat 6977270776
#   add -Log .watcher/watch.jsonl to keep one JSON line per check, for scripts/metrics-report.ts (the lines hold no secrets)
#   add -TapeSendTo self,0x<endpoint id> to also deliver each onchain alert to subscribed TapeSend inboxes (8 at most;
#   the status page computes a project's endpoint id from its container address; about 100k extra gas per inbox)
param(
    [Parameter(Mandatory = $true)][string]$Site,
    [string]$TelegramChat = '',
    [int]$Interval = 30,
    [string]$Reporter = 'hashfront-reporter',
    [string]$Log = '',
    [string]$TapeSendTo = 'self'
)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

# hashfront.json is written by `hashfront init` and is git-ignored; a fresh clone uses the tracked public copy of the live deployment
$cfgPath = if (Test-Path hashfront.json) { 'hashfront.json' } else { 'hashfront.example.json' }
$cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json
# X Layer Builder Code (ERC-8021): appended to every alert transaction the watcher sends
if ($cfg.builderCode) { $env:HASHFRONT_BUILDER_CODE = $cfg.builderCode }
New-Item -ItemType Directory -Force -Path .watcher | Out-Null
if (-not (Test-Path manifests/v1.json)) { throw 'manifests/ has no release manifests; the watcher needs one per release' }

if ($TelegramChat) {
    $secure = Read-Host 'Telegram bot token (hidden)' -AsSecureString
    $env:TELEGRAM_BOT_TOKEN = [System.Net.NetworkCredential]::new('', $secure).Password.Trim()
}
# Certificate Transparency: CertSpotter rate limits anonymous use (HTTP 403 in our 8 h run), so a free API key makes the
# CT signal usable. Optional; Enter skips it. Like the bot token it lives only in this process's environment.
$setCtKey = $false
if (-not $env:CERTSPOTTER_API_KEY) {
    $ctSecure = Read-Host 'CertSpotter API key (hidden, Enter to skip)' -AsSecureString
    $ctKey = [System.Net.NetworkCredential]::new('', $ctSecure).Password.Trim()
    if ($ctKey) { $env:CERTSPOTTER_API_KEY = $ctKey; $setCtKey = $true }
    Remove-Variable ctKey, ctSecure
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
        '--tapesend-to', $TapeSendTo,
        '--alerts-mainnet',
        '--account', $Reporter,
        '--interval', "$Interval"
    )
    if ($TelegramChat) { $watchArgs += "--telegram-chat=$TelegramChat" }
    Write-Host "Watching $Site against gate $($cfg.gate) every $Interval s. Ctrl+C stops it." -ForegroundColor Cyan
    if ($Log) {
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent (Join-Path (Get-Location) $Log)) | Out-Null
        node @watchArgs | Tee-Object -FilePath $Log -Append
    } else {
        node @watchArgs
    }
} finally {
    Remove-Item Env:TELEGRAM_BOT_TOKEN -ErrorAction SilentlyContinue
    if ($setCtKey) { Remove-Item Env:CERTSPOTTER_API_KEY -ErrorAction SilentlyContinue }
}
