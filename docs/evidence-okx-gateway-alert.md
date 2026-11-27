# Evidence: a live hijack, detected and announced through the OKX Gateway (E2)

A real hijack of the demo site, run on 2026-11-27 against the live X Layer deployment (gate `0xAF96…80F6`, release v2), with the watcher
running on a local machine and the screen recorded. Times are UTC, taken from the watcher log (`.watcher/watch.jsonl`) and the deploy commands.

| Time | What happened |
|---|---|
| 07:04:17 | The attacker version of the HashSwap demo (`deploy/hashswap-hijack`, router address changed to `0x0Ad…ad`) went live at https://hashswap-demo.vercel.app/ |
| 07:04:31 | First watcher check: `MISMATCH` (`index.html` changed, a bundle missing). Suspect address found: `0xBAd0000000000000000000000000000000000Bad` |
| 07:04:59 | The status server's own check (`/api/status`) shows `alert` and lists the suspect |
| 07:05:01 | Second check in a row: `MISMATCH`. Alert sent: Telegram ok, and TapeSend through the OKX Gateway, tx `0xba9c1079a9a0513a7a96eb4b49db8c2cdf41325d30962daa441a29211bf2bc6a` ("delivered 1, failed 0") |
| ~07:05:15 | The status page shows "Open alert: website does not match the approved release", the verified copy link and the suspect with an OKLink link |
| 07:05:44 | The real demo site was deployed again |
| 07:06:01 | Watcher back to `MATCH` |
| 07:07:01 | All clear sent: Telegram ok, TapeSend tx `0xf27133a0b3c6bc46ea552293c8df3727d721e7b798c4711c556da1fcaabd668c` |

**Time from the hijack going live to the alert:** 44 s (the watcher checks every 30 s and alerts after two checks in a row, by design).

## What this does and does not show

- It shows one complete detect, alert and recover cycle on the live deployment, with the alert and the all-clear delivered on chain through the OKX Gateway.
- It is one run, so it says nothing about false alarms or uptime; the measured numbers are in `docs/metrics.md`.
- The Guard browser extension was loaded in the browser, but no Guard overlay was captured in this run (the demo page's own "Connect wallet" failed in that browser before a signing request). Guard's behaviour is covered by its own tests.
- The Telegram message was sent by the watcher; its delivery is the watcher's `ok: true`, not a screenshot.
- The screen recording is kept locally (`docs/evidence/e2-live-hijack.mp4`, 200 s, 14 MB) and is not committed.
