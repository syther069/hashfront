# Changelog

Hashfront for X Layer TapeOut Accelerate. Dates are 2026. This is written for the v1.0.0 release notes; nothing here is claimed that is not in the repository and tested.

## Unreleased (Phase 9, Nov 25-26)

### Added
- **Suspected attacker addresses (B1).** After a content mismatch, the watcher and the status page list addresses that appear in the served files and in no file of the approved release (`packages/watcher/src/suspects.ts`, `triage.ts`; `/api/suspects`). Best-effort triage; obfuscated or runtime-fetched addresses are missed. The status page shows a card, "Am I affected?" ranks that spender first, and the team gets an `attacker-addresses` notice.
- **Hashfront Guard browser extension and `/api/status` (U1).** Manifest V3 extension that rejects wallet signatures (error 4001) on the protected site while the feed says `alert`, or when the page the browser received does not hash to the approved `index.html`. Tested in a real browser against the good and the hijack build. It protects only people who installed it. `npm run pack:guard` builds the zip.
- **Revoke all risky approvals (C1).** One wallet confirmation with EIP-5792 `wallet_sendCalls`, or one transaction per approval when the wallet cannot batch.
- **Certificate Transparency signal (A1).** CertSpotter with a crt.sh fallback; a certificate from an issuer the host never used is an alert and opens the DNS incident; renewals inside 30 days of expiry are info.
- **Registry and DNSSEC signal (A2).** RDAP nameservers, transfer and other locks, DNSSEC through Cloudflare DoH; DNSSEC turned off or changed nameservers is an alert.
- **Metrics (D1).** Per-call OKX latency ring, a `perf` field in every watcher JSON line, `scripts/metrics-report.ts` (uptime, p50/p95, incidents, time to alert, false alarms) and a watcher health card. The 24 hour run has not been done; `docs/metrics.md` says so.
- **Docs.** README for judges (verified incident sources, alternatives, limitations), `docs/business.md`, interview templates, demo script, E2 runbook, pull request and issue templates.

### Changed
- `--signals` now defaults to `dns,cert,scan,ct,registry`.
- `ApprovalRisk` has a new top level, `attacker`.

### Not done, on purpose
- No own domain, so CT, registry and DNSSEC signals cannot show a hijack on `*.vercel.app`; they are tested on fixtures and read-only `example.org` lookups.
- A second vantage point (A3) was cut after the review.
- The guardian pause (C2) is a fork-only experiment and is never deployed on mainnet.

## Before Phase 9

Release gate with the TapeOut policy circuit, DeWEB releases v1 and v2, watcher with Telegram and TapeSend alerts, status page, approve page, badge, CLI (`init`, `preflight`, release flow), OKX Onchain OS integration (approvals, transaction scan, gateway alerts, balance and price), mainnet hijack rehearsal on Nov 20 (alert 51 s after the hijack). See `docs/` for the evidence.
