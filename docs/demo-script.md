# Demo video script (about 3 minutes)

Record at 1080p, with the browser zoom at 110 % so small text stays readable. Open these tabs before you start:

1. https://hashswap-demo.vercel.app (the protocol's normal site)
2. https://hashfront-status.vercel.app (the status page)
3. https://4-2-409.tapekit.org (the verified copy; load it once beforehand, the first load installs a service worker)
4. Telegram with the @hashfront_bot chat
5. A terminal with the watcher running (`scripts/run-watcher.ps1`), font size large
6. OKLink, open on the gate: https://www.oklink.com/xlayer/address/0xAF96CA14DB35420BF46b6Ab8feB513306B7D80F6

Speak slowly. Every claim on screen should be something the viewer can see.

**Draft v3 (Nov 26).** We have no domain of our own, so the live hijack is a *hosting compromise* of `hashswap-demo.vercel.app` (someone deploys a bad build to the protocol's host). Say so in the voice-over; do not call it a DNS hijack. CT, RDAP and DNSSEC are shown only from recorded fixtures, with a caption saying so. Everything in the table is built and on `main`; the live run and its checklist are in [`RUNBOOK-hijack-e2.md`](RUNBOOK-hijack-e2.md). Rehearse twice before recording.

| Time | On screen | Voice-over |
|---|---|---|
| 0:00-0:10 | Headlines: Name.com hijack, about $138K | "Frontend hijacks drain DeFi users without touching a contract. Users see the same page and sign an approval to the attacker." |
| 0:10-0:25 | Terminal: `hashfront init` simulation, fee in OKB and USD | "Setup is one command. The team picks three maintainers and a timelock." |
| 0:25-0:50 | Approve page in OKX Wallet with the OKX transaction scan | "A release needs two of three maintainers. The approval shows OKX's scan of the exact transaction before it is signed." |
| 0:50-1:05 | Terminal: watcher MATCH lines; status page: live release and the 32-row policy | "The watcher compares every file the site serves with the approved bytes on chain, every 30 seconds." |
| 1:05-1:25 | Deploy `deploy/hashswap-hijack`; reload the site: router `0xBAd0...0Bad` | "Now someone deploys a bad build to the protocol's host. It looks the same, but the Swap approval goes to an attacker." |
| 1:25-1:55 | Terminal: MISMATCH, then the alert through the OKX Gateway with an order id; Telegram; OKLink tx | "The watcher sees it in 21 seconds and alerts on the second check, on Telegram and on chain, with fixed text and no links." |
| 1:55-2:20 | Status page: Open alert and the suspected attacker address; the Guard overlay on the hijacked tab, then Swap and Connect: the signature is rejected | "It names the address that appears only in the hijacked build, and the browser guard stops the signature before it is made." |
| 2:20-2:40 | "Am I affected?" with a wallet, then "Revoke all risky" | "A user pastes their address, sees the risky approvals and revokes them in one step." |
| 2:40-2:50 | Verified copy on tapekit.org: real router `0xA1DA...` | "The verified copy comes from chain. The attacker cannot touch it." |
| 2:50-3:00 | Restore, all-clear on Telegram; limits slide (what it does not catch: see the README's limitations) | "One all-clear when it is fixed. It protects the content of the site; a hijack of a domain we do not control is not shown live." |

On screen, for one second each, with a caption that says "recorded fixtures": the CT and registry signals (`node packages/watcher/src/main.ts --site https://example.org --signals-only --signals dns,ct,registry`, read-only on `example.org`). Do not suggest they fired on `hashswap-demo.vercel.app`.

## If you record the hijack live

Run these from the repo root; both deploys go to our own `hashswap-demo` project only:

```powershell
cd ..\deploy\hashswap-hijack; vercel deploy --prod --yes; cd ..\..\hashfront   # hijack
cd ..\deploy\hashswap-demo;   vercel deploy --prod --yes; cd ..\..\hashfront   # restore
```

Each live run sends 2 onchain alerts, about 0.00001 OKB from the reporter wallet, which holds about 0.00004 OKB. That is enough for about 4 runs.

## If you'd rather not run it live

Use the screen recordings of the Nov 20 rehearsal. Every step has a timestamp and an OKLink link in [`evidence-hijack-rehearsal.md`](evidence-hijack-rehearsal.md).
