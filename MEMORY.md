# Project memory

Durable facts and decisions for Hashfront. Update this file whenever something is learned or decided. Keep each entry short and dated.

## What we're building
- **Product:** Hashfront, for the X Layer TapeOut Accelerate hackathon (deadline Dec 7, 2026, 23:59 UTC, marked provisional).
- **One-liner:** when a DeFi domain is hijacked, users already know where the real app is.
- **Core user:** small and mid-size DeFi teams without a security engineer. Their frontend is a static build behind Cloudflare/Vercel, and their community lives on Telegram.
- **Specs:** the spec is `../HASHFRONT_PLAN.md`; the build order is `IMPLEMENTATION_PLAN.md`.

## Key decisions (with reasons)
| Date | Decision | Why |
|---|---|---|
| 2026-11-19 | Renamed the product from Lifeboat to **Hashfront** (folder, packages `@hashfront/*`, CLI `hashfront`, env `HASHFRONT_*`, keystores `hashfront-*`, on-chain root title) | user preferred it; a web search found no crypto project by that name; renamed before any mainnet deploy so nothing on chain carries the old name |
| 2026-11-19 | Judge review: keep Hashfront with six fixes (interviews now, DNS/NS essential, demo opens with the hijack, "why not multisig" answer, scope tiers, early probes incl. new step 3b TapeSend) | user chose to continue after comparing an agent-spending-circuit alternative; details in `../HASHFRONT_PLAN.md` §9b |
| 2026-11-19 | **Fork first, one mainnet run (task M) as soon as funded.** Build order is by task, not by date. Wallets stay unfunded; ask the organizers for a gas grant (`docs/grant-request.md`); plan B after task G if still short (circuit + gate without a container, ≈ 0.007 OKB) | the user's budget is ≈ $4.5 ≈ 0.051 OKB (OKB $87.75); one container costs 0.08 OKB; X Layer testnet has no TapeOut contracts |
| 2026-11-18 | Reposition from "verified frontends" to "hijack detection + verified fallback" | buidl (TapeOut), VibeFi, Autark, DappFence and Blockaid cover parts of the old idea |
| 2026-11-18 | Release policy is a TapeOut circuit: `allow = !frozen && ((timelock && 2of3) \|\| 3of3)` | Public and immutable, exhaustively checkable (32 inputs), ownable |
| 2026-11-19 | Approve first, upload second; **one Merkle leaf per 24 KB chunk**, binding path, content type, file hash, index and chunk hash | A leaked CI key must not be able to write any unapproved byte |
| 2026-11-19 | `writeChunk(id, Chunk)` struct API instead of separate putFile/appendChunk | Avoids stack-too-deep without `via_ir`; simpler for the CLI |
| 2026-11-19 | Governance: freeze or cancel by 1; unfreeze and migrate need 3/3; rotate maintainer or uploader with 2/3 (an epoch voids stale votes and approvals) | A lost key mustn't brick the gate |
| 2026-11-19 | Stack: Foundry, viem 2.57.16, ox 1.8.13, Node ≥ 22.18 native TypeScript, npm workspaces | X Layer docs recommend Foundry and viem; TapeKit uses Foundry and npm |
| 2026-11-19 | Burner wallets only: separate deployer EOA, 3 test maintainer accounts, OnchainOS agent wallet | Agents and scripts sign; the repo will be public |

## Verified facts (X Layer mainnet, chain 196)
- **RPC:** `https://rpc.xlayer.tech`, `https://xlayerrpc.okx.com`. Testnet is `1952`. Gas is about 0.02 gwei and not EIP-1559.
- **TapeOut processor factory** `0x1f09DAeFA827f02CBb40967cc91b259763760761`:
  - 430 processors; not sealed.
  - Implementation is `0x336e…ae2a`, which **differs** from TapeKit's pinned `0xb41c…`.
- **Container opener** `0x536adD8F30f03b69f6fbF29d425A816A0dC50106`: `open(circuits, id)` is payable with `FEE()` = **0.08 OKB**. `accountOf` and `isOpened` work (fork-tested, step 2).
- **SiteRegistry** `0xd6EFb7adCc9c83dC4924Ad56f6a8E4e969b9ADB6`:
  - Implementation matches TapeKit's pin.
  - `readRange(container, path, offset, len)` works.
  - **Does not verify the declared SHA-256** (TapeKit SPEC).
- **DomainBinding** `0x68809Fd2fb343aA57D0aeB7f33Defe477c9666f9`: `monthlyFee()` = 0. `bind` accepts **only the canonical numeric name** `<#ID>.2.<processor number>.tape` (e.g. `4.2.409.tape`). Vanity names revert with `BadDomain()`.
- **DeWEB Hub (TapeSend):** `0xe61A9C7213a6Aa616C246a2B569e555B417b25ee`.
  - **Messages are addressed, not broadcast:** `send(circuits, tokenId, to, ref, payload)` writes to `inbox[to]`, where `to` is an endpoint id `uint32(0)|uint64(chainId)|container`. The caller must be the circuit's `ownerOf`, and the container must be opened.
  - **Contract holders can send:** a contract holder (our gate) is accepted by `send`, but `publishKey` refuses contract holders, so the gate can only send **public** payloads (`"TS" 0x02 0x00` + TAP-10 JSON). Fork-tested Nov 19 (`test/fork/TapeSendHolder.t.sol`).
  - **Who can read it:** the TapeSend client shows the inbox of containers the connected wallet holds. Readers therefore need their own container (0.08 OKB), or the status page reads the gate's events and the hub inbox directly. **Pitch:** "on-chain alert record + delivery to subscribed TapeSend identities", not "every user gets a TapeSend push".
- **Builder Code registry:** `0xd6c426f9c077358735622ae5a83468dc0510823b`. Attribution is an ERC-8021 `dataSuffix` set through `ox/erc8021`.
- **Processor "OnlyTestXLayer"** `0x839bdD6fa7A66416A609A735e11DE5411B98574e`: `TAPEOUT_FEE` = 0.0013 OKB, and circuit #1 is an XOR (4 gates).
- **Lingxi site:** processor #419 `0xf70d324Da8C1C4Cb0dE3FF147E53E7E9db543c4e`, circuit #1, container `0x31B025aD4cBD4142007f59684D51cD1F2ccc5098`. It holds 416 files, `fallbackPath = index.html`, and is served at `1-2-419.tapekit.org`.
- **TapeKit pages:** they run top-level through a service worker, not in a sandboxed iframe, have no restrictive content policy, and `fetch` to the X Layer RPC works.
- **Contract as site holder:** a contract holding the circuit NFT can `putFile`/`setFallback` on the real registry, and the previous EOA loses edit rights (fork test).
- **TapeKit has no open-source publish CLI.** Our `hashfront` CLI fills that gap.

### Tape-out on X Layer (steps 1 and 2, fork-verified Nov 19, 2026)
- **Factory changes:** the upgraded factory (`0x336e…`) made `createCPU(string,string,string,uint256,uint256)` **nonpayable**. The deploy fee is now `deployFee()` = 1e7 = **0.1 BEM**, pulled with `transferFrom` from BEM `0x60e62Efa9405d6873C5deaBD4E6CC91c25363952` (8 decimals). Approve the factory first.
- **Transistor fees:**
  - each processor has `transistors()`, an ERC-1155 token (id 0 = NAND, id 1 = LATCH)
  - one mint call costs `amount × mintPrice + protocolFee`
  - **older processors** charge in OKB (`msg.value`); **processors created after the upgrade** charge in BEM (nonpayable `mint`; approve the transistor contract)
- **The tape-out fee is always OKB:** `TAPEOUT_FEE()` = 0.0013 OKB, sent as `msg.value`, and tape-out burns one NAND per gate.
- **Sold-out processors:** "OnlyTestXLayer" is sold out (100k/100k), so we can't tape out there.
- **Path B (no BEM):** "TapeFun" `0x39E44DbA62811E87fDe122CA4d6c082568a384D0` (factory index 409) has mintPrice 0, about 99.8k NAND left and an OKB protocol fee of 0.00066. **Tape-out costs about 0.00196 OKB in total.**
- **Path A (own processor):** costs 0.1 BEM (create) + 0.01 BEM (mint) + 0.0013 OKB (tape-out). It's branded "Hashfront" and needs BEM bought or bridged by the user.
- **Live check:** the policy netlist was taped out on both paths and the live `eval` matched the spec on all 32 inputs (`contracts/test/fork/Tapeout.t.sol`).
- **Full mainnet cost of path B:** tape-out (0.002) + open (0.08) + bind (0) + gate deploy (gas) ≈ **0.085 OKB**.

### Upload cost on the real SiteRegistry (fork e2e, Nov 19, 2026)
- **Gas per full 24 KB chunk through `ReleaseGate.writeChunk`:** about 5.5M (5,563,761 and 5,439,055 measured). A partial 12 KB chunk is about 2.8M.
- **In OKB:** at about 0.02 gwei, that's ≈ 0.00011 OKB per chunk, so a 2 MB frontend (≈ 85 chunks) costs ≈ 0.01 OKB to publish.
- **Full CLI flow verified against the real registry:** propose → approve ×3 → upload → verify → seal → activate. The root `index.html` redirects to `/releases/v1/` and the fallback is set (`packages/cli/test/e2e/fork.e2e.ts`).

### Deployment rehearsal (step 4, local anvil fork, Nov 19, 2026)
- `script/rehearse-deploy.sh` runs ProbeTapeKit → DeployXLayer(POLICY_ID) → one alert, with the deployer impersonated. All checks pass.
- **Measured cost:** step 3 is 0.08199 OKB; steps 4–5 plus one alert are 0.00001 OKB.
- **Gas trap found:** an `eth_estimateGas` limit let the hub call fail inside `try/catch` while the transaction succeeded. Fixed with `ALERT_SEND_GAS` = 400k, checked before each send (revert `AlertGas`). A real alert to one recipient uses about 219k gas.

### Demo dApp on the fork (task B, Nov 19, 2026)
- **Release:** HashSwap v1 (3 files, 39,415 bytes, 4 chunks) went live through the real-script gate on the 2-of-3 + timelock path. It reads back byte for byte from the real SiteRegistry.
- **Anvil gotcha:** anvil's account 0 (`0xf39F…2266`) carries an **EIP-7702 delegation on X Layer mainnet**, because its key is public. ERC-1155 transistor mints to it revert with `ERC1155InvalidReceiver`. The e2e harness clears its code on the fork. Our real deployer has no code (checked).
- **Vite build:** importing viem's clients pulled in 297 KB. Using only `encodeFunctionData`/`decodeFunctionResult` plus raw EIP-1193 and JSON-RPC brought it to 36 KB.

### Watcher (task C, Nov 19, 2026)
- **`eth_getLogs` cap:** `rpc.xlayer.tech` caps it at **100 blocks** per request (`block range greater than 100 max`), so events can't list a release's files. The watcher takes manifests and trusts one only if it reproduces the onchain root.
- **Windows crash `0xC0000409`:** the earlier unexplained crash is a libuv assertion, `!(handle->flags & UV_HANDLE_CLOSING)` in `src/win/async.c`. It happens when the process exits while fetch keep-alive sockets close.
  - **Repro:** `process.exit()` after 8 fetches crashed 3 of 12 runs; setting `process.exitCode` crashed 0 of 12.
  - **Fix in the watcher:** it never calls `process.exit`.
  - **CLI:** it already uses `exitCode`, but crashed once at exit after `activate` in an e2e run. The transaction had been sent, so treat a `0xC0000409` exit as "check the chain", not as "failed".
- **Test gotcha:** a test that hosts an HTTP server must not use `spawnSync` for the client, because the sync call blocks the server's event loop.

### Signals (task D, Nov 19, 2026)
- **System DNS on this machine** is `127.0.0.1`, a local stub that refuses c-ares queries (`ECONNREFUSED`). `dns.lookup` works; `Resolver` needs explicit servers. The watcher defaults to `1.1.1.1` and `8.8.8.8`, queried one by one.
- **Anycast rotation:** Cloudflare returned a different AAAA record for `example.org` 6 s later. Exact-address comparison false-alarms, so addresses are compared by network (IPv4 /24, IPv6 /32).
- **`onchainos security dapp-scan --domain <host>`** works without a login (v4.6.11).
  - Clean answer: `{"ok":true,"data":{"isMalicious":false}}`, exit 0.
  - A bad input returns `{"ok":false,"error":"API error (code=50036): PARAM_EXCEPTION"}` with exit 1.

### Alerts (task E, Nov 19, 2026)
- **`@tapekit/send` dropped:** `ReleaseGate.alert()` builds the TapeSend payload on chain, and Telegram is a plain `fetch`. Task E added no dependency.
- **Negative Telegram chat ids:** Node `parseArgs` treats `--telegram-chat -100…` as an ambiguous option, so write `--telegram-chat=-100…`.
- **Alert secrets:** `TELEGRAM_BOT_TOKEN` (env only, redacted in errors) and `HASHFRONT_PRIVATE_KEY` (the reporter burner). The watcher refuses TapeSend on mainnet without `--alerts-mainnet`.

### Web app (task F, Nov 20, 2026)
- **`ReleaseGate.lastAlert`** was added so pages can show an open alert without `getLogs`. An alert now costs about 264k gas (was 219k).
- **`rpc.xlayer.tech` CORS:** it allows browser calls (`Access-Control-Allow-Origin: *`, POST, `content-type`), checked with a preflight on Nov 20.
- **Sandboxed iframes:** a sandboxed iframe without `allow-same-origin` has origin `null`, so Vite's `crossorigin` module script fails CORS on a plain static host. The badge snippet needs `allow-scripts allow-same-origin`, which is safe because the badge host is never the embedding site.
- **Playwright** runs on installed Edge (`channel: "msedge"`), so no browser download is needed. The mock wallet is an EIP-1193 object forwarding to anvil, whose dev accounts (the harness keys) are unlocked.
- **Approve before upload:** a release needs 2 approvals before `upload`. In tests, approve first, then upload and seal.

### Onboarding (task G, Nov 20, 2026)
- **No git repository:** the project folder is not a git repo, so "fresh clone" and an Action test repo can't be done until you create one. `.gitattributes` (LF) is ready for it.
- **Line endings:** Python `open(p, "w")` on Windows writes CRLF. Always pass `newline="\n"` when editing files with Python. 26 files were normalized back to LF on Nov 20.
- **TypeScript in `node_modules`:** Node refuses to strip types under `node_modules`, so CI clones the CLI rather than npm-installing it.
- **Init timing on a fork, from a clean copy:** 81 s (`npm ci` 41 s, `forge build` 9 s, `init` 22 s).
- **Deploy cost:** `DeployXLayer` on a new circuit pays `TAPEOUT_FEE` plus the opener's `FEE` (about 0.082 OKB in total). The old plan figure of "0.01 OKB per protocol" was wrong.

### MAINNET deployment (task M step 1, Nov 20, 2026), all verified on chain
- **Gate:** `ReleaseGate` `0xAF96CA14DB35420BF46b6Ab8feB513306B7D80F6`, deployed by `hashfront init --account hashfront-deployer --broadcast`; the deployer nonce went from 0 to 6.
- **Policy circuit:** #4 on processor #409, owned by the gate. The site container is `0x5D96417d287f6F10979b63b80504926DE4CE92bA`, the name is `4.2.409.tape`, and the verified link is **https://4-2-409.tapekit.org/**.
- **Roles:**
  - maintainers: m1 `0xA451…C59A`, m2 `0xf8B3…8348`, m3 `0x7006…12d8`
  - uploader: the deployer `0xA1DA…5306`
  - reporter: `0xeC8b730F7E9F69e53FE257473c4809Ef93dc46de`
  - timelock: 600 s
- **Cost:** 0.08196 OKB in fees, plus 3,983,110 gas at 0.02 gwei = 0.00008 OKB. The deployer had 0.00251 OKB left afterwards.
- **Records:** `contracts/deployments/init-hashswap.test.json` and `hashfront.json`. The site value is a placeholder until task H.
- **Release v1 is LIVE (Nov 20):** the HashSwap demo, root `0x041b0ec5…bd0e`, 4 chunks and 3 files, approved 3 of 3 by M1, M2 and M3, sealed and activated by `scripts/mainnet-release-v1.ps1`.
  - **Gas:** the upload used 9.95M gas (about 0.0002 OKB). The maintainers got 0.00002 OKB each and the reporter 0.00005; the deployer had about 0.00219 OKB left.
  - **On chain:** `hashfront verify` says all 3 files match byte for byte.
  - **In a browser:** https://4-2-409.tapekit.org/ redirects to `releases/v1/index.html` and HashSwap renders ("Release v1").
- **Hosting (N2/N3, Nov 20), on Vercel account syther069 (Hobby), deployed with the Vercel CLI from `C:\OKX hackathon\deploy\<project>` (outside the repo):**
  - **Normal site:** https://hashswap-demo.vercel.app/ serves exactly the v1 bytes. A watcher `--once` against mainnet says MATCH.
  - **Status page:** https://hashfront-status.vercel.app/ is built with `VITE_GATE=0xAF96…80F6 VITE_NETWORK=xlayer`. It reads v1, 3/3 approvals and the 32-row table of circuit #4 from mainnet. The badge says "Protected by Hashfront · v1" and ignores a `?gate=` override.
- **Hijack rehearsal N5 (Nov 20), passed on mainnet:**
  - The first MISMATCH came 21 s after the hijack deploy, and the alert went out at 51 s: Telegram plus TapeSend tx `0xc9d874f5…`.
  - There was no repeat during the incident. The all-clear came after 3 MATCH checks: Telegram plus tx `0xe40bbd20…`.
  - Both alerts together cost the reporter 0.0000092 OKB.
  - Full timeline: `docs/evidence-hijack-rehearsal.md`.
- **X Layer Builder Code (P5, Nov 20): `15ld85k6825od6yr`.**
  - **Registration:** registered by syther069 through the OKX developer portal (https://web3.okx.com/onchainos/dev-portal: connect, verify the address, Builder Code page). The payout address `0xd3A3…7a01` holds 2 code NFTs on registry `0xd6c4…510823b`, because 2 codes were generated by mistake; only this one is used.
  - **Where it is set:** in `hashfront.json` (`builderCode`). The scripts export `HASHFRONT_BUILDER_CODE`, and the status page is built with `VITE_BUILDER_CODE`.
  - **viem behaviour:** viem appends the client's `dataSuffix` in `sendTransaction` (so also `writeContract`), but NOT in `prepareTransactionRequest`. Checked on anvil: the input ends with `…15ld85k6825od6yr…8021` and decodes back to the code.
  - **How to verify a transaction:** OKLink shows the code next to the Txn hash, or use https://builder-code.vercel.app/checker.
- **The DeWEB gateway can't be checked with plain HTTP:** tapekit.org returns the same 2,817-byte Service Worker bootstrap page for every path, and the Service Worker reads the files from chain. Check with `hashfront verify` or a real browser.

## Open unknowns (tracked in IMPLEMENTATION_PLAN.md)
1. Path A or path B for mainnet (user decision; path A needs BEM).
2. Whether TapeKit refuses bytes that don't match the declared hash, and real OKX Wallet signing on a DeWEB page (step 3).

## Environment notes (this Windows machine)
- **Paths:** the repo is at `C:\OKX hackathon\hashfront`. Git needs `-c core.longpaths=true` for deep clones.
- **OnchainOS installer:** fails under Windows PowerShell 5.1 (UTF-8 script without a BOM). Run `lib/install.ps1` with `pwsh` (PowerShell 7) instead.
- **OnchainOS login:**
  - The CLI is at `~\.local\bin\onchainos.exe`.
  - The session is stored in `~\.onchainos\keyring.enc`, because the keyring is unavailable. Never commit or share that file.
  - Log in from your own terminal: `wallet login`, then `--phase poll --session-id <id>`.
- **Burner wallets:** Foundry keystores `hashfront-deployer`, `hashfront-m1`, `-m2`, `-m3` (created Nov 19). Their public addresses are in `wallet-addresses.txt` (gitignored); all balances were 0 on Nov 19.
- **X Layer testnet (1952):** has no TapeOut opener, SiteRegistry or TapeFun deployed (checked Nov 19), so fork mainnet instead.
- **Foundry 1.7.1:** `forge-std` is vendored in `contracts/lib/forge-std`, without git metadata.
