# OKX Wallet pass on X Layer mainnet (task P6, 2026-11-20)

Real wallets, real mainnet transactions, and the hosted pages a protocol team would use.

## 1. A maintainer approves release v2 from OKX Wallet on the approve page

| | |
|---|---|
| Release | v2 of HashSwap, root `0x352185e4…3d58`, 4 chunks (proposed with `scripts/mainnet-release.ps1 -Stage propose -Version 2`) |
| Page | https://hashfront-status.vercel.app/#/approve/2: the maintainer loaded `manifests/v2.json`, the page checked it against the onchain root, and the wallet connected as M1 |
| M1 approval (OKX Wallet) | [`0x1024923a…df1b`](https://www.oklink.com/xlayer/tx/0x1024923ab8854aa45dcc44e10a7c56c2a5b1de77f7c868bacf9e9b576179df1b), block 76416448 |
| Builder Code | the input ends with `…31356c6438356b363832356f64367972 10 00 80218021…`, which decodes to `codes: ["15ld85k6825od6yr"]`. This is the first mainnet transaction attributed to Hashfront's X Layer Builder Code |
| M2, M3 | approved with the CLI (keystores), 3 of 3, so no timelock |
| Activation | [`0x1bf33382…8e73`](https://www.oklink.com/xlayer/tx/0x1bf33382ae7e7cb2053ec3fee0047a726f01390eef2406e094ccc560be2f8e73); v2 live onchain |
| Normal host | v2 deployed to https://hashswap-demo.vercel.app only after activation; `hashfront-watch --once` reports MATCH v2 |

## 2. A user acts on the verified DeWEB copy with OKX Wallet

| | |
|---|---|
| Page | https://4-2-409.tapekit.org/, HashSwap "Release v2" served from chain |
| Wallet | a user account `0x51C7…488C` in OKX Wallet |
| Swap (approve 0.000001 USDT to the router) | [`0xf8bbeef5…7d97`](https://www.oklink.com/xlayer/tx/0xf8bbeef560e447e0806ebec63db293631078cb0862c930e80ef630f5da367d97), block 76426174, success |
| Check | `USDT.allowance(0x51C7…488C, 0xA1DA…5306)` = 1, exactly 0.000001 USDT and not unlimited |
| Wallet warning | OKX Wallet showed "Approval Risk: granting token approval to an externally owned account". That is correct: the demo router is a burner EOA we control, not a DEX contract. The prompt showed the spender `0xa1da…5306`, so the user could compare it with the release they trust |

## What this shows

- **The approve page works with a production wallet.** The maintainer reviews the files, signs the onchain root (never the manifest's own value), and the transaction carries the Builder Code.
- **The verified copy is a working app, not a static mirror.** A user connected OKX Wallet to the DeWEB copy and sent a transaction from it.
- **The protocol deploys after activation,** and the watcher confirms the host serves the newly approved bytes.
