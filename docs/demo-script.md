# Demo video script (about 3 minutes)

Record at 1080p, with the browser zoom at 110 % so small text stays readable. Open these tabs before you start:

1. https://hashswap-demo.vercel.app (the protocol's normal site)
2. https://hashfront-status.vercel.app (the status page)
3. https://4-2-409.tapekit.org (the verified copy; load it once beforehand, the first load installs a service worker)
4. Telegram with the @hashfront_bot chat
5. A terminal with the watcher running (`scripts/run-watcher.ps1`), font size large
6. OKLink, open on the gate: https://www.oklink.com/xlayer/address/0xAF96CA14DB35420BF46b6Ab8feB513306B7D80F6

Speak slowly. Every claim on screen should be something the viewer can see.

| Time | On screen | Voice-over |
|---|---|---|
| 0:00–0:20 | HashSwap site (tab 1) | "This is HashSwap, a DeFi frontend. Its contracts are safe, but its website is not. In the Oct 31 Name.com hijacks, 12 sites were taken over through their registrar. Users saw the same page, clicked Swap, and signed an approval to the attacker." |
| 0:20–0:45 | Status page (tab 2), scrolled slowly: live v1, policy, the 32-row table | "Hashfront fixes this. Every release goes through a TapeOut policy circuit on X Layer: two of three maintainers and a timelock, or all three at once. The page reads this from chain in your browser, including every row of the circuit." |
| 0:45–1:00 | Verified copy (tab 3) next to tab 1 | "The approved release is stored byte for byte on DeWEB under the protocol's own name. This verified link is what users pin." |
| 1:00–1:15 | Terminal: MATCH lines | "Our watcher compares every file the website serves with the onchain release, every 30 seconds. It also watches DNS, the TLS certificate and the OnchainOS phishing scan." |
| 1:15–1:35 | Terminal: run the Vercel deploy of `deploy/hashswap-hijack` (or cut to the rehearsal recording) | "Now let's hijack our own demo site. The copy looks identical, but the Swap approval goes to an attacker address." |
| 1:35–1:55 | Tab 1 refreshed: router `0xBAd0…0Bad`; terminal: MISMATCH | "Twenty seconds later the watcher sees it: the page changed and the approved bundle is gone." |
| 1:55–2:15 | Telegram alert arrives; terminal shows the TapeSend tx; OKLink shows the `alert` tx | "On the second check it alerts once: on Telegram and on chain through TapeSend, from the protocol's own identity. The text is fixed in the contract and has no links, so a stolen alert key can't phish anyone." |
| 2:15–2:30 | Tab 2 refreshed: red "Open alert: website mismatch"; the badge shows ALERT | "The status page and the badge on the protocol's other sites turn red." |
| 2:30–2:45 | Tab 3 (verified copy): router `0xA1DA…` is the real one | "And users still have a safe way in. The verified copy comes from chain, and the attacker can't touch it." |
| 2:45–3:00 | Deploy the real build back; terminal MATCH ×3 and the all-clear; Telegram "all clear" | "When the site is fixed, Hashfront sends one all-clear. Setup is one command, `hashfront init`, and a GitHub Action handles releases. Hashfront: your users always know where the real app is." |

## If you record the hijack live

Run these from the repo root; both deploys go to our own `hashswap-demo` project only:

```powershell
cd ..\deploy\hashswap-hijack; vercel deploy --prod --yes; cd ..\..\hashfront   # hijack
cd ..\deploy\hashswap-demo;   vercel deploy --prod --yes; cd ..\..\hashfront   # restore
```

Each live run sends 2 onchain alerts, about 0.00001 OKB from the reporter wallet, which holds about 0.00004 OKB. That is enough for about 4 runs.

## If you'd rather not run it live

Use the screen recordings of the Nov 20 rehearsal. Every step has a timestamp and an OKLink link in [`evidence-hijack-rehearsal.md`](evidence-hijack-rehearsal.md).
