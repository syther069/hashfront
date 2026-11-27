# Watcher metrics

Generated 2026-11-27T15:10:49.688Z from `.watcher/watch.jsonl` by `scripts/metrics-report.ts`. Numbers are measured, not estimated.

## Coverage

- Window: 2026-11-27T07:02:01.479Z to 2026-11-27T15:01:38.766Z (0.3 days)
- Checks: 960 at about 30 s; error lines: 0; unreadable lines skipped: 0
- Uptime: **100 %** (checks that ran over checks expected at the usual interval)
- Gaps longer than 3 intervals: 0
- Statuses: MATCH 957, MISMATCH 3

## Latency (ms)

| | p50 | p95 | max |
|---|---|---|---|
| whole check | 4550 | 10545 | 17257 |
| chain reads (RPC) | 1083 | 2058 | |
| OKX API | no OKX call in this log | | |

## Incidents

| Started (UTC) | Ended | Statuses | Time to alert | Drill |
|---|---|---|---|---|
| 2026-11-27T07:04:31.514Z | 2026-11-27T07:06:01.522Z | MISMATCH | 30 s | yes |

Community alerts delivered: 2. **False alarms: 0** (alerts outside a declared rehearsal window).


## Notes added by hand (not generated)

- **Which log:** the numbers come from the first 8 hours of one continuous watcher run (`.watcher/watch.jsonl`, lines from 07:02:01 to 15:01:38 UTC on 2026-11-27; 960 checks). The same file also holds an earlier 4 h 31 min stretch from 2026-11-26 and a 13 h 55 min gap while the watcher was stopped; those are left out, so the uptime figure is for the 8 h run only. "0.3 days" above is that 8 h (the header text names the whole log file).
- **Watched site:** the demo site `https://hashswap-demo.vercel.app/`, checked from one home network. Uptime means "the watcher ran its check on schedule", not that the site was up.
- **The one incident is a rehearsal:** a live hijack of the demo site, declared with `--drill 2026-11-27T07:04:00Z,2026-11-27T07:08:00Z`. The hijack went live at 07:04:17, the first MISMATCH check was 07:04:31, the alert went out at 07:05:01 (44 s after the hijack went live; the table's 30 s counts from the first MISMATCH check). The alert went by Telegram and by TapeSend over the plain RPC path (the log says `via rpc`; the watcher ran without OKX keys). Evidence: `docs/evidence-okx-gateway-alert.md`.
- **False alarms: 0** means no community alert outside that window in this run. One run and one drill are too little to claim a false-alarm rate.
- **Signals:** in 693 of 960 checks (72 %) the Certificate Transparency lookup was unavailable (in every one of those checks CertSpotter answered HTTP 403, and crt.sh timed out 462 times, answered HTTP 502 198 times and HTTP 404 33 times). That is reported as `info`, not as an alert, so the CT signal was not a working protection in this run. In one check (11:02:05 UTC) the DNS lookup answered `unknown`; the next check was `ok` and no alert was sent.
- **"OKX API: no OKX call":** the OnchainOS scan in this run went through the `onchainos` command line, which does not report per-call latency, so there is no OKX API latency figure. No OKX client was configured in this run, so the two alerts did not use the OKX Gateway either.
