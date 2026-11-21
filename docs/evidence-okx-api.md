# OKX Onchain OS integration on X Layer (Nov 20–21, 2026)

Hashfront uses the OKX Onchain OS API for security, delivery, balances and prices, all on X Layer (chainIndex 196). Every call is signed as the OKX docs define:

- `OK-ACCESS-KEY`, `OK-ACCESS-TIMESTAMP` (ISO UTC) and `OK-ACCESS-PASSPHRASE` headers
- `OK-ACCESS-SIGN = Base64(HMAC-SHA256(secret, timestamp + METHOD + path?query + body))`

The keys live only server side: in Vercel encrypted env vars, in GitHub secrets, or in the watcher process from a hidden prompt.

Request shapes come from OKX's own open-source CLI ([okx/onchainos-skills](https://github.com/okx/onchainos-skills), `cli/src/commands/*.rs`) and were then probed live with Hashfront's keys (`scripts/okx-probe.ts`). The recorded responses are the test fixtures in `packages/okx/test/fixtures/`.

## Endpoints used

| OKX product | Endpoint | Where Hashfront uses it |
|---|---|---|
| Security | `POST /api/v6/security/dapp-scan` | Watcher phishing signal over REST, so it works in CI without the onchainos CLI |
| Security | `POST /api/v6/security/approval-mng` | Status page **"Am I affected?"**: a user's X Layer approvals, ranked against the protocol's contracts, with revoke |
| Security | `POST /api/v6/security/transaction-scan/evm` | Approve page: a pre-execution scan of the maintainer's exact `approve` transaction |
| Onchain Gateway | `GET /api/v6/dex/pre-transaction/gas-price` | Alert pricing, reporter gas guard |
| Onchain Gateway | `POST /api/v6/dex/pre-transaction/simulate` | Every alert is simulated by OKX before broadcast |
| Onchain Gateway | `POST /api/v6/dex/pre-transaction/broadcast-transaction` | Alerts are broadcast through OKX **and** the RPC: same signed bytes, so no double alert |
| Onchain Gateway | `GET /api/v6/dex/post-transaction/orders` | OKX order tracking for alerts |
| Balance | `POST /api/v6/dex/balance/token-balances-by-address` | Reporter gas guard (native OKB = empty contract address) |
| Market | `POST /api/v6/dex/market/price` | OKB/USD for fees on the status page, the approve page and `hashfront init` (native = `0xeeee…eeee`) |

## Live checks

1. **`scripts/okx-probe.ts`:** all 9 endpoints answered on X Layer with the team's keys. The security scans returned `PARAM_EXCEPTION` until the `source` field OKX's CLI sends was added; that is now in `packages/okx/src/endpoints.ts`. Results:

   | Endpoint | Result |
   |---|---|
   | gas-price | normal 22,000,001 wei |
   | gas-limit | 69,647 for an alert |
   | simulate | 431,687 gas, no `failReason` |
   | balance | reporter 0.0000408 OKB at $75.65 |
   | dapp-scan | `isMalicious: false` |
   | approvals | the demo user's real 0.000001 USDT approval |
   | tx-scan | no risk |
   | price | OKB $75.92 |

2. **Deployed status page** (https://hashfront-status.vercel.app, Vercel Functions, keys stored as Vercel *sensitive* env vars):
   - `GET /api/price` → `{"okbUsd":78.07,…,"source":"OKX Onchain OS Market API"}`
   - `GET /api/approvals?address=0x51C7…488C` → USDT_Bridged to `0xa1da…5306`, 0.000001, **risk `trusted`** (HashSwap's router is in `ALLOWED_SPENDERS`)
   - `GET /api/approvals?address=0xd3A3…7a01` → no approvals
   - `GET /api/approvals?address=bad` → 400
   - `POST /api/tx-scan` with M1's `approve(2, root, 4)` to the gate → `safe: true`
   - The same calldata to another contract → 400 ("only transactions to this protocol's ReleaseGate are scanned")
   - In the browser, the "Check your token approvals" panel lists the approval as "this protocol", and the overview shows "OKB $78.07 (OKX Market API)".
3. **Browser bundle:** no OKX signing code or key in `apps/web/dist/assets` (checked on every build).

## Tests

- **`packages/okx`, 12 unit tests:**
  - signature vector
  - signed GET and POST headers
  - request bodies equal OKX's CLI for every endpoint
  - retry with backoff on 429, 5xx and network errors
  - no blind retry for broadcast
  - error codes
  - credentials never in error text
  - TTL cache
  - recorded live fixtures
  - approval risk ranking
- **Watcher:**
  - REST scan mapping
  - gas guard (OKX route, RPC fallback, one team notice)
  - `test/e2e/gateway.e2e.ts` on anvil against a local OKX stand-in that verifies every HMAC signature:
    - an alert goes simulate → gas-price → broadcast, with the OKX order id, the gateway's gas price and the Builder Code, as exactly one alert
    - a failed OKX simulation never broadcasts through the gateway
    - OKX down → RPC fallback
- **Web:**
  - handler tests on the recorded responses: risk tags; tx-scan refuses other targets, other functions and big bodies
  - Playwright:
    - the panels are hidden without `/api`
    - during an open alert, "Am I affected?" comes first and ranks a drainer approval above the protocol's
    - an OKX scan warning blocks Approve until acknowledged

## Fallbacks

Hashfront never depends on OKX being up:

- The phishing scan falls back to the onchain CLI.
- Gas and balance fall back to the RPC.
- Alerts fall back to the RPC. A broadcast that can't be confirmed either way is checked on chain before any fallback, so an incident never produces two alerts.
- The status page panels are hidden where `/api` is not deployed (the DeWEB copy).
