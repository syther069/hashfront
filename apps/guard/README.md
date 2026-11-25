# Hashfront Guard

A Manifest V3 browser extension (Chrome, Edge, Brave) that stops a wallet signature on a protected site while Hashfront says the site is hijacked. It exists because users do not check status pages: the warning has to appear on the hijacked page, before they sign.

## What it does

- Reads `GET /api/status` of the protected protocol (cached 20 s). The feed says `ok`, `alert` or `unknown`, plus the approved hash of `index.html`.
- On `alert`, it shows a full-page warning with the verified-copy link and the suspected attacker addresses, and rejects `eth_sendTransaction`, `eth_signTypedData*`, `personal_sign`, `eth_sign` and `wallet_sendCalls` with error 4001 (user rejected). Reads such as `eth_chainId` still work.
- It also hashes the page this browser actually receives and compares it with the approved hash, so a watcher that was shown a clean page does not decide for the user.
- "I understand the risk" lifts the block for that page, with a real click only.

## Limits (read these)

- It protects only people who installed it. The real scale path is wallets reading the same `/api/status` feed; this extension is the reference for that.
- It defends against generic drainers. An attacker who builds a page to beat the Guard (for example by unwrapping the provider, or using a wallet that bypasses `window.ethereum`, `window.okxwallet` and EIP-6963) is not stopped.
- If the feed is down or unclear, it never blocks (fail open). A feed that says `unknown` (host behind, CDN changes) disables the hash check to avoid false alarms.
- Legacy `send` and `sendAsync` provider methods are not wrapped.

## Install (unpacked)

1. `npm run pack:guard`, or use `dist/hashfront-guard.zip` from the GitHub Release; unzip it.
2. Open `chrome://extensions` (or `edge://extensions`), turn on Developer mode, choose "Load unpacked" and pick the folder.

It is not on the Chrome Web Store. The watched site and the feed are set in `manifest.json` (`matches`, `host_permissions`) and `config.js`; change them to protect another protocol.

## Tests

```bash
npm test -w apps/guard          # request filter, verdict logic, hash
npm run test:e2e -w apps/guard  # loads the real extension in Edge/Chrome against local good and hijack builds
```
