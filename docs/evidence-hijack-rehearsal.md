# Hijack rehearsal on X Layer mainnet (task N5, 2026-11-20)

The whole loop ran on mainnet. Only our own demo site was involved: `hashswap-demo.vercel.app` is a HashSwap demo that we control, and no real protocol was touched.

| | |
|---|---|
| Gate | `0xAF96CA14DB35420BF46b6Ab8feB513306B7D80F6` (policy circuit #4, release v1 live) |
| Normal site | https://hashswap-demo.vercel.app/ |
| Status page | https://hashfront-status.vercel.app/ |
| Verified copy | https://4-2-409.tapekit.org/ |
| Watcher | `scripts/run-watcher.ps1`, 30 s interval, signing as the reporter `0xeC8b…46de` from its keystore |

## Timeline (UTC)

| Time | What happened |
|---|---|
| 09:47:23 | Watcher starts and reports MATCH v1. It records the DNS, cert and OnchainOS baseline: NS `ns1-4.vercel-dns-3.com`, cert from Google Trust Services, scan clean. |
| 09:47:23–09:49:23 | 5 checks in a row are MATCH. Vercel's addresses rotate within the same networks, and that is not reported as a change. |
| 09:49:32 | **"Hijack":** the `build:hijack` copy is deployed to the same host. It looks the same, but the Swap approval goes to `0xBAd0…0Bad`. |
| 09:49:53 | **MISMATCH:** `index.html` changed and `assets/index-BNGgKh-G.js` is missing (404). That is 21 s after the deploy. |
| 09:50:23 | **Second MISMATCH, so the alert goes out (51 s after the hijack):** a Telegram message to @hashfront_bot's chat, and on-chain TapeSend `alert(1)` in tx [`0xc9d874f5…740b`](https://www.oklink.com/xlayer/tx/0xc9d874f5aa9fbf15640f2ff02987172fdc776782e5f9c3b3f6b326286296740b), block 76399196, 264,692 gas, delivered 1, failed 0. |
| ~09:50:40 | The status page shows "Open alert: website mismatch … Use the verified copy". The badge shows "Hashfront ALERT: site mismatch". |
| ~09:50:50 | The hijacked site shows router `0xBAd0…0Bad`. **The verified copy shows the real router `0xA1DA…5306`**, served from chain. |
| 09:50:53, 09:51:23 | Still MISMATCH, and **no repeat alert** (one alert per incident). |
| 09:51:30 | The real v1 bytes are deployed back to the normal host. |
| 09:51:53, 09:52:23 | MATCH. |
| 09:52:53 | **Third MATCH, so the all-clear goes out:** Telegram, plus TapeSend `alert(3)` in tx [`0xe40bbd20…9cb4`](https://www.oklink.com/xlayer/tx/0xe40bbd201b7757eee89080e30a53a670be6cbedb2d6e32c5bbfe086ad5939cb4), block 76399346, 194,828 gas, delivered 1. |

## Checked on chain afterwards

- Both alert transactions succeeded.
- `gate.lastAlert()` returns kind 3 (all clear) for release 1, with observed hash `0x82906274…31bf`, the served root page of v1.
- The site container's TapeSend inbox `inboxCount` = 2 (the alert and the all-clear).
- Cost: the reporter spent 0.0000092 OKB for both alerts. Telegram and Vercel cost nothing.

## Results

- **Detection:** 21 s after the hijack (first MISMATCH). The confirmed alert went out at 51 s, with a 30 s interval and confirmation after 2 checks.
- **One alert per incident**, plus one all-clear after 3 clean checks.
- **Alert text:** the same fixed text on Telegram and TapeSend (read from `alertPayload()` on chain), with no links.
- **Safe copy:** during the hijack, the verified DeWEB copy kept serving the approved v1.
