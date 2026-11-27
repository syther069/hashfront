# Evidence: a live hijack, detected and announced on chain (E2)

> **Correction (Nov 27):** an earlier version of this file said the alerts went through the OKX Onchain Gateway. The watcher log says otherwise: both TapeSend lines end in `via rpc`, there is no OKX order id, and no OKX call was made in the whole run (`okxMs` is empty, the scan went through the `onchainos` CLI). The watcher was started without the OKX keys (`scripts/run-watcher.ps1` alone, not wrapped in `scripts/with-okx.ps1`), so `sendTapeSend` used its plain RPC path. A live broadcast through the gateway is still to be proven.

A real hijack of the demo site, run on 2026-11-27 against the live X Layer deployment (gate `0xAF96…80F6`, release v2), with the watcher
running on a local machine and the screen recorded. Times are UTC, taken from the watcher log (`.watcher/watch.jsonl`) and the deploy commands.

| Time | What happened |
|---|---|
| 07:04:17 | The attacker version of the HashSwap demo (`deploy/hashswap-hijack`, router address changed to `0x0Ad…ad`) went live at https://hashswap-demo.vercel.app/ |
| 07:04:31 | First watcher check: `MISMATCH` (`index.html` changed, a bundle missing). Suspect address found: `0xBAd0000000000000000000000000000000000Bad` |
| 07:04:59 | The status server's own check (`/api/status`) shows `alert` and lists the suspect |
| 07:05:01 | Second check in a row: `MISMATCH`. Alert sent: Telegram ok, and TapeSend over the RPC path, tx `0xba9c1079a9a0513a7a96eb4b49db8c2cdf41325d30962daa441a29211bf2bc6a` (log: "delivered 1, failed 0 via rpc") |
| ~07:05:15 | The status page shows "Open alert: website does not match the approved release", the verified copy link and the suspect with an OKLink link |
| 07:05:44 | The real demo site was deployed again |
| 07:06:01 | Watcher back to `MATCH` |
| 07:07:01 | All clear sent: Telegram ok, TapeSend tx `0xf27133a0b3c6bc46ea552293c8df3727d721e7b798c4711c556da1fcaabd668c` (log: "via rpc") |

**Time from the hijack going live to the alert:** 44 s (the watcher checks every 30 s and alerts after two checks in a row, by design).

## What this does and does not show

- It shows one complete detect, alert and recover cycle on the live deployment, with the alert and the all-clear delivered on chain over the RPC path. It does not show the OKX Gateway path: that needs a new live run with the OKX keys loaded (`pwsh scripts/with-okx.ps1 pwsh scripts/run-watcher.ps1 ...`), whose log line should then say `via okx-gateway+rpc (OKX order ...)`.
- It is one run, so it says nothing about false alarms or uptime; the measured numbers are in `docs/metrics.md`.
- The Guard browser extension was loaded in the browser, but no Guard overlay was captured in this run (the demo page's own "Connect wallet" failed in that browser before a signing request). Guard's behaviour is covered by its own tests.
- The Telegram message was sent by the watcher; its delivery is the watcher's `ok: true`, not a screenshot.
- The screen recording is kept locally (`docs/evidence/e2-live-hijack.mp4`, 200 s, 14 MB) and is not committed.
