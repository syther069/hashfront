# One-shot live Telegram check for the Hashfront watcher (plan step 9).
# Asks for the bot token with hidden input, finds your chat id from the bot's updates, sends the test message, then
# runs the alerts e2e against the real Telegram API (the chain part stays on a local fork). The token lives only in
# this process; it is never printed or written to a file.
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$secure = Read-Host 'Paste the bot token from BotFather (input is hidden)' -AsSecureString
$token = [System.Net.NetworkCredential]::new('', $secure).Password.Trim()
if ($token -notmatch '^\d+:[A-Za-z0-9_-]{30,}$') { throw 'That does not look like a bot token (<digits>:<secret>). Copy it again from BotFather: /mybots -> your bot -> API Token.' }

$api = "https://api.telegram.org/bot$token"
try { $me = Invoke-RestMethod "$api/getMe" } catch { throw 'Telegram rejected the token (wrong, or revoked). Copy it again from BotFather.' }
Write-Host "Bot: @$($me.result.username)"

$chatId = $null
for ($i = 0; $i -lt 30 -and -not $chatId; $i++) {
    $updates = (Invoke-RestMethod "$api/getUpdates").result
    $chat = $updates | ForEach-Object { $_.message.chat } | Where-Object { $_.type -eq 'private' } | Select-Object -Last 1
    if ($chat) { $chatId = [string]$chat.id; break }
    if ($i -eq 0) { Write-Host "Send any message (for example: hi) to @$($me.result.username) in Telegram now. Waiting..." }
    Start-Sleep -Seconds 4
}
if (-not $chatId) { throw "No message reached the bot in 2 minutes. Send it a message in Telegram and run this script again." }
Write-Host "Chat id: $chatId"

$env:TELEGRAM_BOT_TOKEN = $token
$env:E2E_TELEGRAM_CHAT = $chatId
try {
    Write-Host "`n[1/2] Test message..."
    node packages/watcher/src/main.ts --telegram-test "--telegram-chat=$chatId"
    if ($LASTEXITCODE -ne 0) { throw 'The test message failed (see the error above).' }

    Write-Host "`n[2/2] Alert + all-clear through the real Telegram API (about 1.5 min)..."
    node --test packages/watcher/test/e2e/alerts.e2e.ts
    if ($LASTEXITCODE -ne 0) { throw 'The alerts e2e failed (see above).' }
    Write-Host "`nDone. Telegram should show 3 messages: the test message, a Hashfront alert, and an all-clear."
} finally {
    Remove-Item Env:TELEGRAM_BOT_TOKEN, Env:E2E_TELEGRAM_CHAT -ErrorAction SilentlyContinue
}
