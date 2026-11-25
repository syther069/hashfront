# Watcher metrics

No long run has been measured yet. This file is replaced by the output of `scripts/metrics-report.ts` after the 24 hour run (plan task D1), and it will only ever contain measured numbers.

How to produce it:

```powershell
# 1. run the watcher with a log (OKX keys are typed at hidden prompts by scripts/with-okx.ps1)
pwsh scripts/with-okx.ps1 pwsh scripts/run-watcher.ps1 -Site https://hashswap-demo.vercel.app/ -Log .watcher/watch.jsonl

# 2. after 24 hours or more, build the report; mark rehearsal windows so their alerts are not counted as false alarms
node scripts/metrics-report.ts --log .watcher/watch.jsonl --out docs/metrics.md --drill 2026-12-03T10:00:00Z,2026-12-03T10:30:00Z
```

What the report states: checks and uptime (checks that ran over checks expected, with gaps listed), p50 and p95 of the whole check, the chain reads and each OKX endpoint, incidents with the time from the first bad check to the first delivered community alert, and false alarms (community alerts outside a declared rehearsal window).

The one measurement we have so far is from the mainnet rehearsal on Nov 20, 2026: hijacked build live at 09:49:32 UTC, mismatch seen after 21 s, community alert on chain at 09:50:23 UTC, 51 s after the hijack ([`evidence-hijack-rehearsal.md`](evidence-hijack-rehearsal.md)).
