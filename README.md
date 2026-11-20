# Hashfront

When your DeFi domain gets hijacked, your users already know where the real app is.

Hashfront gates every frontend release through an onchain **TapeOut** policy circuit on **X Layer**, publishes it to **DeWEB** (served by TapeKit), watches your normal domain around the clock, and alerts users over **TapeSend** and Telegram the moment the two differ.

Built for the X Layer TapeOut Accelerate hackathon (Build X Series).

## Repo layout
| Path | What | Status |
|---|---|---|
| `circuits/` | TAP-02 netlist builder, reference evaluator, release-policy circuit (22 NAND gates) | ✅ tests pass on all 32 inputs; evaluator matches 3 live mainnet circuits |
| `contracts/` | `ReleaseGate.sol`, TapeOut interfaces, mocks, unit/fuzz tests, X Layer fork tests | ✅ 33 unit/fuzz/compat tests + 3 X Layer fork tests pass |
| `packages/cli/` | `hashfront` CLI (viem + X Layer Builder Codes): manifest, propose, approve, cancel, upload, verify, seal, activate, status, wait-active | ✅ 10 unit tests, anvil end-to-end suite, real-registry fork end-to-end |
| `apps/watcher/` | domain hash, DNS and certificate watcher → TapeSend + Telegram | ⏳ days 8–10 |
| `apps/web/` | approve page and status page (Vite + React + wagmi), published to DeWEB | ⏳ days 11–12 |

## Tech stack (from the official docs)
| Layer | Choice | Source |
|---|---|---|
| Chain | X Layer mainnet `196` (testnet `1952`), OKB gas | X Layer docs → Network information |
| RPC | `https://rpc.xlayer.tech`, `https://xlayerrpc.okx.com` (+ `xlayer.drpc.org`, `196.rpc.thirdweb.com` from TapeKit's list) | X Layer docs, TapeKit `kernel/src/config.js` |
| Contracts | **Foundry** (forge/cast/anvil), Solidity 0.8.28 | X Layer docs → Deploy with Foundry; TapeKit's own contracts use Foundry |
| Verification | `forge verify-contract --verifier oklink` | X Layer docs → Verify with Foundry |
| Client / frontend | **viem ≥ 2.45** + **wagmi** + **ox** | X Layer docs → Builder Codes integration ("Viem recommended") |
| Attribution | **X Layer Builder Codes** (ERC-8021 `dataSuffix`, registry `0xd6c426f9c077358735622ae5a83468dc0510823b`) | X Layer docs → Builder Codes |
| DeWEB reads and verification | **`@tapekit/kernel`** (zero-dependency JS, Node ≥ 18) | TapeKit repo |
| Messaging | **TapeSend** through the DeWeb Hub, sent onchain by `ReleaseGate.alert()` (fixed text, no links), plus the **Telegram Bot API** | TAP-10 §6; TapeKit repo `send/module` (protocol reference) |
| Circuits | TAP-02 netlists; design and preview on the **TapeOut Canvas** (tapeout.net) | TAP-02, tapeout.net |
| Security and OnchainOS | **OnchainOS CLI and skills** v4.6.11 (`security dapp-scan` for phishing domains, `gateway simulate`, `tx-scan`). The watcher uses `dapp-scan` as a signal | OnchainOS docs → Skills/MCP; github.com/okx/onchainos-skills |
| Runtime | Node 22.18+ (native TypeScript), npm | TapeKit uses npm |

## TapeOut / X Layer addresses used (chain 196)
| Contract | Address | Checked on chain (Nov 18, 2026) |
|---|---|---|
| Processor factory (UUPS) | `0x1f09DAeFA827f02CBb40967cc91b259763760761` | 430 processors, not sealed, impl `0x336e…ae2a` ⚠️ differs from TapeKit's pinned `0xb41c…293d` |
| Container opener | `0x536adD8F30f03b69f6fbF29d425A816A0dC50106` | `accountOf` / `isOpened` work |
| SiteRegistry (UUPS) | `0xd6EFb7adCc9c83dC4924Ad56f6a8E4e969b9ADB6` | impl `0xa85c…a45f` = TapeKit pin ✅ |
| DomainBinding (UUPS) | `0x68809Fd2fb343aA57D0aeB7f33Defe477c9666f9` | impl `0x5ebf…47df` = pin ✅, `monthlyFee()` = 0 |
| DeWEB Hub (TapeSend) | `0xe61A9C7213a6Aa616C246a2B569e555B417b25ee` | code present |
| Example processor | `0x839bdD6fa7A66416A609A735e11DE5411B98574e` ("OnlyTestXLayer") | `TAPEOUT_FEE` = 0.0013 OKB; `eval` of circuit #1 = XOR ✅ |

## Run
```bash
npm install
npm run typecheck                              # strict TypeScript across the workspace
npm test                                       # circuits + CLI unit tests
npm run build -w circuits                      # writes circuits/out/policy.json + truth-table.md
cd contracts && forge test                     # unit, fuzz and CLI-manifest compatibility tests
forge test --match-path "test/fork/*" -vv      # read-only fork of X Layer mainnet
cd ../packages/cli && npm run test:e2e         # anvil + ReleaseGate + the real CLI binary
npm run test:fork                              # same CLI flow against the REAL X Layer SiteRegistry (local fork)
```

## CLI
Approve first, upload second. A release only goes live when the onchain policy circuit says yes.
```bash
export HASHFRONT_GATE=0x...                     # ReleaseGate address
export HASHFRONT_BUILDER_CODE=...               # optional X Layer Builder Code (ERC-8021)

hashfront manifest dist --out manifest.json                 # hash the build: one Merkle leaf per 24 KB chunk
hashfront propose  --manifest manifest.json                 # uploader key; prints the release id
hashfront approve  --id 3 --manifest manifest.json          # each maintainer, after reviewing the build
hashfront upload   --id 3 --manifest manifest.json dist     # resumable; one transaction per chunk
hashfront verify   --id 3 --manifest manifest.json          # re-reads and re-hashes the stored bytes
hashfront seal     --id 3 --manifest manifest.json          # verifies, then freezes (contract checks every chunk is in)
hashfront activate --id 3                                   # anyone, once the circuit allows it
hashfront wait-active --id 3 && deploy-to-your-host         # deploy the normal site only after activation
hashfront cancel   --id 3                                   # any maintainer: kill a bad release for good
```
Write commands read the signer from `HASHFRONT_PRIVATE_KEY`. In CI, that's the uploader key, stored as a secret. Maintainers approve from their own wallets.

## Release policy (5 inputs → 1 output)
`allow = NOT frozen AND ((timelockPassed AND twoOf(a1,a2,a3)) OR (a1 AND a2 AND a3))`
Full truth table: [`circuits/out/truth-table.md`](circuits/out/truth-table.md).

## Security model (MVP)
- **ReleaseGate holds the site's circuit NFT and is the only editor.** Verified on a fork of X Layer mainnet: a contract holder can write files and set the fallback on the real SiteRegistry, and the previous EOA loses edit rights (`test/fork/ContractHolder.t.sol`).
- **Every byte is approved.** The manifest has one Merkle leaf per 24 KB chunk, binding `(path, contentType, fileSha256, index, sha256(chunk))`. The gate recomputes `sha256(chunk)` on chain, so a leaked CI key can't upload a single byte, path or content type the maintainers didn't approve, or move a chunk to another index.
- **Approve first, upload second.** Uploads need 2 approvals of `(root, totalChunks)`. `seal` reverts until every chunk is on chain, and sealing freezes the release's files and starts the timelock.
- **Only newer releases go live,** so there's no rollback replay. A rollback is a new proposal.
- **The root `index.html` is generated on chain** with absolute paths, so nothing can be injected into it.
- **Incident controls.** Any maintainer can freeze activations instantly or permanently cancel a release that isn't live. Unfreezing needs all three.
- **Lost keys.** Two maintainers can replace the third. Rotation advances an epoch that voids earlier approvals and pending votes. Two maintainers can also replace the uploader key.
- **Escape hatch.** All three maintainers can migrate the site NFT to a new holder, such as a new gate version. The old gate then stops.
- **Verification.** `hashfront verify` re-reads stored bytes with `readRange` and re-hashes them, because the registry stores the declared SHA-256 without checking it.

### Known limits
- **Staged files are public before activation.** Files under `releases/vN/` can be opened by direct URL before the timelock ends. They are approved bytes, but not yet the live release.
- **Setup order.** The EOA holder must open the container and `bind` the `.tape` name (currently free on X Layer) **before** transferring the NFT to the gate. The gate has no pass-through for those calls.
- **The policy runs on a TapeOut processor.** Taping out needs the processor's transistors and fee; the transistor acquisition flow still has to be confirmed before mainnet.
- **Trust assumption:** TapeOut contracts are upgradeable (3/5 multisig), the factory has been upgraded since TapeKit's pin, and v2.0 isn't deployed yet.
