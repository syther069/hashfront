# Runbook: step 3 (TapeKit probe on X Layer mainnet)

This step tapes out the **real** Hashfront policy circuit on the TapeFun processor (path B), opens its container and uploads probe pages. It costs about **0.082 OKB**, as measured in the fork dry run on Nov 19, 2026. Step 5 reuses the same circuit and container.

## 1. Create the burner deployer wallet (once, in your own terminal)
Run this in **PowerShell**. It creates an encrypted keystore. You choose the password, and the private key never appears on screen.
```bash
cast wallet new "$env:USERPROFILE\.foundry\keystores" hashfront-deployer
```
It prints the new address. Then check it's listed:
```bash
cast wallet list
```
Never paste the key or the password into chat, files or `.env`.

## 2. Fund it
From your main wallet, send **0.095 OKB on X Layer** to the address printed above. That's about 0.082 for this step (0.08 of it is TapeOut's one-time container fee) plus about 0.013 for gas in steps 3b–6. Gas is about 0.02 gwei, so a contract deploy or a 24 KB upload costs roughly 0.0001 OKB. Check the balance:
```bash
cast balance <deployer-address> --ether --rpc-url https://rpc.xlayer.tech
```

## 3. Dry run against a fork (free)
Run this from the `contracts/` folder:
```bash
forge script script/ProbeTapeKit.s.sol --fork-url https://rpc.xlayer.tech --account hashfront-deployer
```
It must end without errors and print `POLICY_ID`, `CONTAINER`, `NAME` and `URL`.

## 4. Send for real (only after you say "go")
```bash
forge script script/ProbeTapeKit.s.sol --rpc-url https://rpc.xlayer.tech --account hashfront-deployer --broadcast
```
If it fails halfway, re-run it with the circuit id it printed. This skips the tape-out, so you don't pay twice:
```bash
$env:POLICY_ID="<id>"; forge script script/ProbeTapeKit.s.sol --rpc-url https://rpc.xlayer.tech --account hashfront-deployer --broadcast
```

## 5. Checks in a browser with OKX Wallet
Open the printed `https://<id>-2-409.tapekit.org/` and check:
| Page | Expected | Records |
|---|---|---|
| `/` | redirects to `/releases/v0/index.html`, and that page shows its path | root redirect plus fallback work |
| `/probe/wallet.html` | "Connect" connects OKX Wallet on X Layer, and "Send" sends a 0-OKB transaction to yourself | wallets work on DeWEB (check #7) |
| `/probe/badhash.html` | `good.js: RAN · bad.js: not run (refused)` | TapeKit refuses bytes that don't match the declared hash (check #9) |

Write the results into `MEMORY.md`. If `bad.js` **runs**, TapeKit doesn't verify hashes, and the watcher's own re-hash becomes the only integrity check. That must then be stated in the pitch.
