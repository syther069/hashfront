# Runbook: E2, the live hijack through the OKX Gateway (mainnet)

This is the one mainnet step of the final demo. **Nothing here runs without the user's explicit "go".** It touches only our own demo site, `hashswap-demo.vercel.app`, and sends about 2 onchain alerts (about 0.00001 OKB from the reporter wallet, which holds about 0.00004 OKB).

We have no domain of our own, so this is a **hosting compromise** (a bad build deployed to the protocol's host), not a DNS hijack. Say that in the video. CT, registry and DNSSEC signals stay quiet on `*.vercel.app` and are shown from recorded fixtures only.

## Before you start (once)

1. `git pull` on `main`, then `npm install`.
2. The reporter has enough OKB: the watcher's gas guard prints `reporterGas` in every JSON line. Below about 0.000015 OKB, top it up first.
3. The hijack build is staged: `deploy/hashswap-hijack` holds the v2 hijack build (the real v2 UI with the Swap approval pointed at `0xBAd0…0Bad`), next to its `.vercel` link to the `hashswap-demo` project. To rebuild it: `VITE_RELEASE=v2 npm run build:hijack -w apps/demo-dapp`, then copy `apps/demo-dapp/dist-hijack/*` into `deploy/hashswap-hijack` and keep `.vercel/`.
4. The real build to restore is in `deploy/hashswap-demo` (v2). Do not edit it.
5. Browser: the Guard extension loaded unpacked from `apps/guard` (or `dist/hashfront-guard.zip`, unzipped), Telegram open on the bot chat, OKLink open on the gate.

## 1. Start the watcher with a log (terminal A)

```powershell
pwsh scripts/with-okx.ps1 pwsh scripts/run-watcher.ps1 -Site https://hashswap-demo.vercel.app/ -TelegramChat 6977270776 -Log .watcher/watch.jsonl
```

Hidden prompts: OKX key, OKX secret, OKX passphrase, Telegram bot token, reporter password. Wait for 3 lines with `"status":"MATCH"`.

Note the UTC time you start the hijack; you need it for `--drill` in the metrics report.

## 2. Hijack (terminal B)

```powershell
cd ..\deploy\hashswap-hijack
vercel deploy --prod --yes
```

## 3. What you should see (and the proof to capture)

| Within | Where | Expected |
|---|---|---|
| about 20 s | terminal A | `"status":"MISMATCH"`, `diffs` with `index.html: changed`, and `"suspects":["0xBAd0000000000000000000000000000000000Bad"]` |
| about 50 s | terminal A | the second MISMATCH sends the alert: `alerts` with `channel: tapesend`, a tx hash, `via okx-gateway+rpc` and `OKX order <id>`; and a Telegram message. Copy the tx hash and the order id |
| about 60 s | Telegram | the community alert (fixed text, no links) and, in the team chat, the `attacker-addresses` notice |
| about 1 min | status page | red "Open alert", the "Suspected attacker addresses" card with `0xBAd0…0Bad`, "Am I affected?" first |
| about 1 min | hijacked site tab | the Guard overlay "This site does not match its approved release"; click Swap, then Connect: the signature is rejected with 4001 |
| any time | verified copy | https://4-2-409.tapekit.org/ still shows the real router `0xA1DA…5306` |
| optional | status page, wallet connected | "Revoke all risky (N)": revokes the attacker approval in one confirmation (OKX Wallet) |

Capture: the alert tx hash (open it on OKLink, note the Builder Code `15ld85k6825od6yr` at the end of the calldata), the OKX order id, the three screenshots (overlay, suspects card, verified copy), and the terminal lines.

## 4. Restore

```powershell
cd ..\deploy\hashswap-demo
vercel deploy --prod --yes
```

Watcher: three MATCH lines, then the all-clear (Telegram plus an onchain `alert(3)`).

## 5. Record the evidence

1. Stop the watcher (Ctrl+C).
2. `node scripts/metrics-report.ts --log .watcher/watch.jsonl --out docs/metrics.md --drill <hijack start UTC>,<all-clear UTC>`
3. Write `docs/evidence-okx-gateway-alert.md`: the timeline, the OKLink links of the alert and all-clear transactions, the OKX order ids, the decoded Builder Code, the three screenshots.
4. Commit both. Do not commit `.watcher/` (it is git-ignored) or any key.

## If something fails

- **No MISMATCH after 90 s:** Vercel may still be building. Open the site in a private window and look for the router address.
- **Alert did not go on chain:** read `alertError` in the JSON line. The usual causes are a reporter without OKB (top it up) or the OKX Gateway being down; the watcher then falls back to the RPC and says so in `via`.
- **A false alarm or anything unexpected:** restore at once (step 4), then tell Claude what the terminal printed.
