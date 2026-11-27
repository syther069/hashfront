> **History, not the current plan.** The current plan is `docs/PLAN-10of10.md`. This file records how the first build went; read it only when a task points to it.

# Hashfront Implementation Plan

**Source spec:** `../HASHFRONT_PLAN.md` (approved).
**Goal:** a working end-to-end product on X Layer mainnet:
1. A real protocol frontend gets released through the policy circuit.
2. It's served from DeWEB through TapeKit.
3. A hijack of the normal domain is detected and users are alerted.

**Deadline:** Dec 7, 2026, 23:59 UTC (marked provisional).

## Who we build for (from the repositioned spec)
**Positioning:** Hashfront is **hijack detection plus a verified fallback**, not "verified frontends". buidl, VibeFi, Autark, DappFence and Blockaid already cover parts of that older idea.

**Core user:** a small or mid-size DeFi team with 2–10 people, no security engineer, a static frontend behind Cloudflare or Vercel, and a Telegram-first community. Every product step below must meet these promises to that user:
1. **Setup in about 15 minutes:** one command (`hashfront init`) plus one CI step, and no new hosting.
2. **Approvals from the wallet they already use** (OKX Wallet), on a phone.
3. **Alerts where their users are:** the protocol's own Telegram channel, plus TapeSend onchain.
4. **A verified link and badge to pin,** and alerts that **never contain links**.
5. **No false alarms from their CDN** (Cloudflare auto-minify, Rocket Loader, injected scripts).

**Paying customers:** teams with $1M+ TVL on any chain; the protocol doesn't have to live on X Layer, only Hashfront's contracts do. The best-evidenced group is teams like the 12 sites hit in the Oct 31 Name.com hijacks. Small X Layer protocols use the free tier.

## Track B: customer discovery (runs alongside the build; no code)
| When | Action | Done when |
|---|---|---|
| Now (alongside task A) | Message 5–8 teams (X Layer teams such as DyorSwap and LFGSwap, plus Name.com hijack victims) for 15-minute interviews. Drafts in `docs/interviews.md`; **you send them**. Ask about: host and CDN, registrar, who deploys, alert channel, willingness to pay. | Persona assumptions in `MEMORY.md` confirmed or corrected |
| By the end of task C | **Stop condition:** at least 3 conversations held. If nobody is interested, change the persona (wallets, aggregators), not the product. | Decision written in `MEMORY.md` |
| After task H | Go back with the working demo and ask for a letter of intent or a pilot | At least one quote for the pitch, **only if real** |

## Scope tiers (judge review, Nov 19)
Build every **essential** item end to end before any optional one. Spec: `../HASHFRONT_PLAN.md` §2 and §9b.
| Essential (the journey) | Strengthening | Optional (only after a full end-to-end run) |
|---|---|---|
| Steps 3–7, DNS/NS part of step 8, Telegram part of step 9, status page in step 10, step 13 | TapeSend alert (step 9), approve page (step 10), step 11 dogfood | Certificate + OnchainOS signals (step 8), badge (step 10), step 12 `init` + GitHub Action |

## Funding strategy: fork first, one mainnet run at the end (decided Nov 19)
**Why:** the user's whole budget is about $4.5 (≈ 0.051 OKB at $87.75). One DeWEB container alone costs 0.08 OKB (≈ $7), and X Layer testnet has no TapeOut contracts (checked Nov 19: no code at the opener, SiteRegistry or TapeFun).
- **Until the mainnet run:** every step is built and verified on a local anvil fork of X Layer mainnet. The fork has the real TapeOut contracts, and OKB is free there (`anvil_setBalance`). Wallets stay unfunded; nothing is sent.
- **Gas grant:** ask the organizers for builder credits now. The message to send is in `docs/grant-request.md`, and you send it yourself.
- **Mainnet run (task M, needs about 0.09 OKB):** steps 3 → 3b → 5 → 6 back to back, then 13, as soon as the OKB is there. The `alert()` change from step 9 is built and fork-tested in task A, so it ships in the same deploy whatever 3b shows.
- **Decision point (after task G):** if there is still not enough OKB, switch to **plan B**: tape out the circuit and deploy the gate on mainnet without a container (≈ 0.007 OKB, ≈ $0.6), and serve the verified fallback from a static host. This weakens the DeWEB story and needs a contract change, so we only do it if we have to.
- **Not verifiable before the mainnet run:** real OKX Wallet signing on a DeWEB page, TapeKit's hash check, and whether TapeSend shows in its client (steps 3 and 3b). They are the first thing done once funds arrive.

## How to use this plan
- Run **one step at a time**. After each step the repo builds and every existing test still passes.
- Every step lists the files it touches, what changes, and the **verify** commands that must pass before you say "go".
- **Flags:**
  - 🧩 = new dependency
  - 💸 = sends a real X Layer mainnet transaction, costs OKB and needs your approval
  - 🗄️ = changes onchain state that can't be undone (stands in for a "migration")
- **Sizes:** S ≈ under 2 h, M ≈ half a day, L ≈ 1–2 days.
- **Order:** the riskiest unknowns come first.

**Baseline gate (must stay green after every step).** From the repo root, run:
```bash
npm run typecheck && npm test
```
Then, in `contracts/`:
```bash
forge test
```

---

## Phase 0: done (for reference)
| # | Step | Status |
|---|---|---|
| 0.1 | TAP-02 netlist builder, evaluator, policy circuit (22 NAND) and truth table | ✅ 4 tests; matches 3 live mainnet circuits |
| 0.2 | `ReleaseGate.sol`: per-chunk Merkle leaves, approve-first, seal completeness, cancel, freeze, rotation, migrate | ✅ 33 unit/fuzz/compat tests |
| 0.3 | Fork tests: live `eval`, live site reads, contract holder edits the real SiteRegistry | ✅ 3 fork tests |
| 0.4 | `hashfront` CLI (viem, Builder Codes): manifest, propose, approve, cancel, upload, verify, seal, activate, status, wait-active | ✅ 10 unit tests, anvil e2e, real-registry fork e2e |
| 0.5 | OnchainOS CLI v4.6.11 and skills installed; agent wallet logged in | ✅ `dapp-scan` and gas work |

---

## Phase 1: kill the riskiest unknowns (no new features)

### Step 1: How to tape out on X Layer (transistors and fee) [S] ✅ done Nov 19
**Risk retired:** we don't yet know how to get the 22 NAND transistors that `tapeout` burns. Without that, there's no policy circuit on mainnet.
- **Files:**
  - `contracts/src/interfaces/ITapeOut.sol` (add the processor mint/transistor functions once found)
  - `contracts/test/fork/Tapeout.t.sol` (new)
  - `MEMORY.md`
- **Changes:**
  - Read the verified circuit implementation (`0x977f…29b2`, same as BscScan) and the factory implementation to find the transistor mint and price functions.
  - On a **local fork**, buy or mint 22 NAND on a free or cheap processor, or create our own processor through the factory.
  - Call `tapeout(policyNetlist, 5, 1)`, then `eval` all 32 inputs against the spec.
- **Verify:**
  ```bash
  forge test --match-path test/fork/Tapeout.t.sol -vv
  ```
  The real processor must return the truth table for all 32 inputs.
- **Flags:** none (fork only).

### Step 2: Opening a container and binding a `.tape` name [S] ✅ done Nov 19
**Risk retired:** the opener's `open` function and its fee are undocumented. Open and bind must happen **before** the NFT moves to the gate.
- **Files:**
  - `contracts/src/interfaces/ITapeOut.sol` (`open`, fee getter, `bind`)
  - `contracts/test/fork/OpenBind.t.sol` (new)
  - `MEMORY.md`
- **Changes:** on a fork, take a freshly taped-out circuit (from step 1) and run open, then `bind(name, container, months)`, then `isOpened == true`.
- **Verify:**
  ```bash
  forge test --match-path test/fork/OpenBind.t.sol -vv
  ```
- **Flags:** none (fork only).

### Step 3: TapeKit behaviour on the real policy site [S] 💸 (prepared and fork-dry-run Nov 19; waiting for "go")
> **Changed (Nov 19):** instead of a throwaway circuit, step 3 tapes out the **real** policy circuit on TapeFun (path B), opens **its** container and uploads probe files under `probe/`. Step 5 removes them and hands the NFT to the gate. That saves one 0.08 OKB container fee.
> **Script:** `contracts/script/ProbeTapeKit.s.sol`. **Runbook:** `docs/RUNBOOK-step3.md`. **Fork dry run:** 0.082 OKB, and the resume path costs gas only.
**Risk retired:**
- (a) Does TapeKit refuse bytes that don't match the declared SHA-256?
- (b) Can a DeWEB page connect OKX Wallet and send a transaction?
- (c) Do files at `releases/vN/` serve correctly with the root redirect?
- **Files:**
  - `scripts/probe-tapekit.md` (runbook)
  - `MEMORY.md` (results)
- **Changes:** on mainnet, tape out one 1-gate throwaway circuit, open its container, and upload:
  - a page that connects the wallet
  - one file deliberately declared with a wrong hash

  Then open both in a browser.
- **Verify, manually in a browser with OKX Wallet:**
  - the wallet connects and signs a 0-value transaction
  - the bad-hash file is refused
  - `/releases/v1/index.html` loads
- **Flags:** 💸 about 0.082 OKB (0.08 container fee, 0.002 tape-out, gas). 🗄️ creates the policy circuit NFT and its container, which step 5 reuses.

### Step 3b: TapeSend probe [S] 💸 (added Nov 19, judge review fix 6)
**Risk retired:** check #5. Can a container send a public TapeSend message, and does it show in the TapeSend client? This decides whether the demo shows one alert channel or two.
- **Files:** `contracts/script/ProbeTapeSend.s.sol` or a small TS script (whichever the TapeKit `packages/send` SPEC makes simpler), `MEMORY.md`
- **Changes:** while the deployer still holds the policy circuit from step 3 (before step 5 hands it to the gate), send one public message from its container.
- **Verify:** the message is visible in the TapeSend client; record cost and latency.
- **Flags:** 💸 gas only. If it fails, Telegram becomes the only alert channel and the pitch says so.

---

## Phase 2: mainnet core

### Step 4: Mainnet deployment script with a fork rehearsal [M] 🗄️ ✅ done Nov 19 (task A)
> **Built:** `script/DeployXLayer.s.sol` (shared steps in `script/XLayerBase.s.sol`), `script/rehearse-deploy.sh`, `docs/RUNBOOK-deploy.md`. ReleaseGate gained `reporter`, `hub`, `alert()`, `alertPayload()` and `voteSetReporter` (the step 9 contract part). Output goes to `deployments/rehearsal.json` unless `DEPLOYMENTS_FILE` is set, so a fork run never touches the real file.
- **Files:**
  - `contracts/script/DeployXLayer.s.sol` (new)
  - `contracts/deployments/xlayer.json` (new, generated)
  - `README.md`
- **Changes:** one script that:
  1. tapes out the policy circuit (using the flow from step 1)
  2. checks all 32 inputs with `eval`
  3. opens the container and binds the name (step 2)
  4. deploys `ReleaseGate`
  5. transfers the circuit NFT to the gate
  6. writes the addresses to `deployments/xlayer.json`

  It aborts if any check fails. Keys come from the Foundry encrypted keystore (`--account hashfront-deployer`), never from `.env`.
- **Verify:**
  - First, on an anvil fork of X Layer:
    ```bash
    forge script script/DeployXLayer.s.sol --fork-url $XLAYER --account hashfront-deployer
    ```
  - Then confirm `hashfront status` shows the gate, the policy and the container.
  - The deployer is unfunded until the mainnet run, so the rehearsal runs against a local `anvil --fork-url https://rpc.xlayer.tech` that first gives the deployer 0.1 OKB with `anvil_setBalance`. The same script then broadcasts to that anvil, never to mainnet.
- **Flags:** 🗄️ (the next step makes it real).

### Step 5: Deploy to X Layer mainnet and verify on OKLink [S] 💸🗄️
- **Files:**
  - `contracts/deployments/xlayer.json`
  - `MEMORY.md`
  - `README.md` (addresses)
- **Changes:** run step 4's script with `--broadcast`, then run `forge verify-contract --verifier oklink`.
- **Verify:**
  - OKLink shows ReleaseGate as verified
  - `hashfront status --network xlayer` reads live state
  - `cast call <processor> "eval(uint256,bytes)" <id> 0x0f` returns `0x01`
- **Flags:** 💸 about 0.01 OKB. 🗄️ The NFT transfer to the gate is permanent; only a 3-of-3 migrate can undo it.

### Step 6: First real release of a demo dApp [M] 💸 (fork part ✅ done Nov 19, task B; mainnet release waits for task M)
> **Built:** `apps/demo-dapp` ("HashSwap"): Vite 8.3.6 + TypeScript + viem helpers, with no React or wagmi (that keeps the build at 39 KB, 3 files and 4 chunks, so it is cheap to upload). It uses OKX Wallet or any EIP-1193 wallet; "Swap" approves 0.000001 USDT to the demo router (the deployer burner).
> - `npm run build:hijack` builds the step 13 attack copy: the same UI, but with an unlimited approval to `0xbAd0…0bad`.
> - **Verified by** `npm run test:demo -w packages/cli`, on a fork. It deploys with the real `DeployXLayer`, then releases the build via the CLI on the 2-of-3 + timelock path (early activation refused). Every file reads back byte for byte from the real SiteRegistry, and the root redirects to `/releases/v1/`.
- **Files:**
  - `apps/demo-dapp/` (new: a minimal Vite swap-style UI, a static build with relative paths)
  - `package.json` (workspace)
- **Changes:** build the demo, then run `manifest → propose → approve ×3 → upload → seal → activate` with the CLI on mainnet.
- **Verify:**
  - `https://<id>-2-<proc>.tapekit.org` loads the demo
  - `hashfront verify` passes byte for byte
  - the root redirects to `/releases/v1/`
- **Flags:** 🧩 vite, react, react-dom, wagmi, @tanstack/react-query (versions pinned, at least 2 weeks old). 💸 about 0.005 OKB.

---

## Phase 3: detection and alerts

### Step 7: Watcher core, comparing the normal domain with the onchain release [M] ✅ done Nov 19 (task C), except the Cloudflare byte-match check, which needs the test domain
> **Built:** `packages/watcher` (`hashfront-watch`): `manifests.ts`, `chain.ts`, `fetchSite.ts`, `cdn.ts`, `compare.ts`, `watch.ts` and `main.ts`.
> - **Changed from the plan:** the public X Layer RPC caps `eth_getLogs` at **100 blocks**, so the file list doesn't come from `ChunkWritten` logs. It comes from the release's `manifest.json`, which is accepted only if the leaves and root recomputed from its own fields equal the onchain `releases(id).root` and `totalChunks`. Every listed path is fetched from the normal host; the root page is fetched at `/`.
> - **Verdicts:**
>   - `MATCH`
>   - `HOST_BEHIND`: the host still serves the previous live release, which is normal for a few minutes after every activation.
>   - `DEPLOYED_BEFORE_ACTIVATION`
>   - `CDN_MODIFIED`: only exactly-shaped Rocket Loader and Web Analytics tags differ. It is never shown as green, because a hijacker can fake those tags too.
>   - `MISMATCH`: also covers a cancelled release, an off-origin redirect, a 404, Cloudflare email obfuscation and bot detection.
>   - `UNVERIFIABLE`: never shown as MATCH when any fetch failed.
>   - `UNREACHABLE`
> - **Allow-list:** a per-path list of accepted served hashes. `observed` is the sha256 of the served root page, and step 9 passes it to `alert()`.
> - **Verified by:**
>   - 19 unit tests, including adversarial Cloudflare fixtures and a forged manifest.
>   - `npm run test:e2e -w packages/watcher`: a real-script gate and a real HashSwap release on a fork, served by a local host. It shows MATCH, then MISMATCH 2.0 s after one byte changed, with a 2 s interval.
- **Files:** `packages/watcher/` (new)
  - `src/fetchSite.ts` (fetch `index.html`, resolve the JS/CSS/assets it references, then hash them)
  - `src/chainRelease.ts` (read the live release's files and SHA-256 from SiteRegistry)
  - `src/compare.ts`
  - `src/main.ts`
  - tests
- **Changes:**
  - a pure comparison function with fixtures (match, swapped JS, injected script, missing file)
  - a polling loop with a configurable interval
  - **CDN-aware comparison** for the core user's Cloudflare setups:
    - detect the known Cloudflare injections (`/cdn-cgi/` scripts, Rocket Loader `type` rewrites, email-obfuscation snippets)
    - report them as **"CDN modification"**, separately from a hijack, with a fix hint (turn off auto-minify and Rocket Loader)
    - an explicit allow-list per protocol
  - **Deploy-order guard:** if the normal host serves a release that is **sealed but not yet active**, report "deployed before activation" (a process mistake), not a hijack.
- **Verify:**
  ```bash
  npm test -w packages/watcher
  ```
  The fixtures cover all 4 cases plus a Cloudflare-injected page, which must report "CDN modification" rather than a hijack, and a staged-not-active page, which must report "deployed before activation". Then point it at a local static server serving the demo build: status MATCH. Modify one byte: status MISMATCH within one interval.
  - **As soon as the test domain exists (check #8):** serve the demo build through Cloudflare with default settings and record whether the bytes match. Do this before step 13, not during it.
- **Flags:** 🧩 none (Node `fetch`, viem).

### Step 8: Extra signals: DNS, certificate and OnchainOS phishing scan [S]
> **Changed Nov 19 (judge review fix 2):** the **DNS A/NS** signal is **essential**. Registrar hijacks (like Name.com, Oct 31) can cloak content from the watcher's IP but cannot hide a record change. The certificate and OnchainOS signals stay optional.
- **Files:**
  - `packages/watcher/src/signals/dns.ts`, `cert.ts`, `onchainos.ts`
  - tests
- **Changes:**
  - record the A/NS records and the TLS certificate fingerprint as a baseline, and flag changes
  - call `onchainos security dapp-scan --domain`, which degrades gracefully when not logged in
- **Verify:**
  - unit tests with stubbed resolvers
  - a manual run prints all 3 signals for the demo domain
- **Flags:** 🧩 none (`node:dns`, `node:tls`, the onchainos CLI already installed).

> ✅ **Built (task D, Nov 19).** Files: `packages/watcher/src/signals/{dns,cert,onchainos,index,util}.ts`, `src/exit.ts` and `test/signals.test.ts` (23 tests).
> - **DNS (essential):**
>   - Queries each resolver separately (default `1.1.1.1`, `8.8.8.8`). The dev machine's system resolver is a local stub that refused queries.
>   - Finds NS by walking up to the zone apex, with no public-suffix dependency.
  - Diffs NS, zone and CNAME against **each** resolver's own answer, so one resolver still caching the old NS can't hide the change.
>   - Severities:
>     - **alert:** NS, zone or CNAME changed.
>     - **warn:** an address network that isn't in the baseline (IPv4 /24, IPv6 /32), or resolvers disagreeing on NS.
>     - **info:** only removals.
>   - Comparing by network is needed because Cloudflare rotated an AAAA record within 6 s in the live run, which raised a false warning when exact addresses were compared.
>   - If every resolver fails, the DNS signal is `unknown` and never "unchanged".
>   - `observed` = sha256 of the canonical compared fields, for `alert(ALERT_DNS_CHANGED, …)` in step 9.
> - **Certificate:** issuer and fingerprint. A renewal from the same issuer is info. A new issuer, or a certificate that doesn't validate, is a warning.
> - **OnchainOS:** `dapp-scan` works without a login. Only an explicit `isMalicious` counts; `ok:false`, text that isn't JSON, a missing CLI or a timeout all mean `unavailable`. A clean scan never softens another signal. Results are cached for 10 min, with a 10 s timeout.
> - **Optional signals failing** (no onchainos CLI, a TLS error) are reported at `info` and keep MATCH at exit 0, so a CI runner without onchainos still works. Only DNS `unknown`, or a requested baseline that couldn't be recorded, gives exit 3.
> - **Baseline (`--state`):**
>   - Trust on first use, recorded only while the content check is MATCH or with `--signals-only`.
>   - It never updates itself; it changes only with `--rebaseline`, which also requires MATCH and works only with `--once` or `--signals-only`. In the loop it would re-record every tick and accept a cloaked NS change.
  - It isn't recorded while resolvers disagree on NS, zone or CNAME.
>   - A baseline recorded for another host is refused.
> - **CLI:**
>   - `--signals dns,cert,scan|…|none`, `--dns-servers`, `--signals-only`.
>   - An alert signal makes `--once` exit 2 even when the content is MATCH, which covers the cloaked registrar hijack.
>   - IP and local hosts are skipped, so the step 7 e2e is unchanged (re-run: 2/2).
> - **Verified:** a live `--signals-only` on `example.org` (a reserved domain) printed all 3 signals, recorded the baseline, then 4 compares came back `ok`, exit 0, with a stable `observed` hash through AAAA rotation. **Pending:** the same run on the demo domain once it exists (check #8).
> - **Known limit:** recursive resolvers cache NS, so detection can trail a registrar change by up to the NS TTL (often 1–2 days at the TLD, though resolvers that re-query sooner see it sooner).

### Step 9: Alerts over Telegram and TapeSend [M] 💸
- **Files:**
  - `packages/watcher/src/alerts/telegram.ts`, `tapesend.ts`
  - `contracts/script/` (open the alert container)
- **Changes:**
  - Telegram Bot API message to the protocol channel
  - a public TapeSend message from the site container, sent by `ReleaseGate.alert()` (originally planned through `@tapekit/send`)
  - alerts **never contain a URL**; they only say "use your pinned Hashfront link"
  - debounce, so there's one alert per incident
- **Verify:**
  - a forced mismatch sends one Telegram message and one TapeSend message, visible in the TapeSend client
  - no duplicate alerts within the debounce window
- **No second container (budget, Nov 19):** a separate alert container would cost another 0.08 OKB. `ReleaseGate.alert()` (reporter or maintainer) sends the TapeSend message from the **site** container the gate already owns. ✅ Built and fork-tested in task A against the live hub. The text is fixed on chain and has no links. What's left for step 9 is the watcher side: call `alert()` and send Telegram. Step 3b on mainnet still checks that the message shows in the TapeSend client.
- **Flags:** 💸 gas only (about 264k gas per alert to one recipient, including the `lastAlert` record added in task F). You need to supply a Telegram bot token (read from `TELEGRAM_BOT_TOKEN` only, never committed). `@tapekit/send` turned out not to be needed: `alert()` builds the TapeSend payload on chain.

> ✅ **Built (task E, Nov 19).** Files: `packages/watcher/src/alerts/{incident,telegram,tapesend,index}.ts`, `test/alerts.test.ts` (12 tests) and `test/e2e/alerts.e2e.ts`.
> - **Incidents (pure state machine):**
>   - A community alert goes out after 2 MISMATCH checks in a row (`--confirm`), or after 2 checks with an NS, zone or CNAME change. These are separate incidents.
>   - Exactly one message per incident.
>   - One all-clear (`ALERT_RESOLVED`) after 3 clean checks (`--clear`), only once every open incident is over. A DNS change that persists never clears until the team re-baselines.
> - **Team-only notices:** sent to `--telegram-team-chat`, never to the community or on chain, each after its own delay and once per stretch.
>   - Which ones: CDN_MODIFIED, DEPLOYED_BEFORE_ACTIVATION, HOST_BEHIND (10 checks), UNREACHABLE and UNVERIFIABLE (4), signal warnings, and an OnchainOS phishing flag.
>   - The phishing flag goes to the team because the 3 onchain texts describe file or DNS changes, not blacklist entries.
> - **Unknown never helps an attacker:** UNREACHABLE/UNVERIFIABLE, and DNS that couldn't be checked, hold the counters instead of resetting them, so a bad page alternating with a timeout still alerts. An open DNS incident clears only on DNS that was actually re-checked against the baseline. DNS that stays unchecked for 4 checks raises a team notice.
> - **State (`--alert-state`):** written atomically after every check. Each message records which channels it still has to reach, so a failed send is retried on the next check without resending the delivered channels, and a restart doesn't repeat alerts.
> - **Telegram:**
>   - The text is read from the gate's `alertPayload()`, so Telegram and TapeSend say the same words, with a fixed local copy if the RPC is down.
>   - It is prefixed with `--name`. No domain and no link: `assertNoLink` refuses URLs, `www.` and bare `word.tld`, because Telegram auto-links them.
>   - The token comes from the env only and is redacted from every error.
>   - `--telegram-test` checks a setup.
>   - Negative group ids need `--telegram-chat=-100…`; Node `parseArgs` otherwise reads them as a flag.
> - **TapeSend:**
>   - `alert(kind, observed, to)`, signed with the reporter key (`HASHFRONT_PRIVATE_KEY`).
>   - `--tapesend-to self` resolves `hub.endpointOf(container)`. Delivered and failed counts come from the `Alert` event.
>   - On `--network xlayer` it refuses to start without `--alerts-mainnet`.
> - **Verified:**
>   - Unit tests: 54 in the watcher.
>   - Fork e2e: the real CLI `--once` per check, the real gate, the live TapeSend hub forked, and a mock Telegram. One byte flipped for 6 checks gave exactly 1 Telegram message and 1 `Alert(kind 1)`; restored, it gave 1 all-clear (`kind 3`) each. `inboxCount` went up by exactly 2.
> - **Live Telegram ✅ (Nov 19):** `scripts/telegram-check.ps1` (hidden token prompt) found the chat id, sent the test message, then the alerts e2e through the real Bot API: 1 alert and 1 all-clear reached @hashfront_bot's DM, passed.
> - **Pending:** the TapeSend client view on mainnet (task M, step 3b).

---

## Phase 4: product surface

### Step 10: Status and approve web app [L] 🧩
- **Files:** `apps/web/` (new): Vite, React, wagmi, viem, ox (Builder Codes on every transaction)
- **Changes:**
  - **Status page:** live release, policy state, the full truth table read from `netlist()` and evaluated in the browser, and a "matches vN / MISMATCH" badge.
  - **Embeddable "Protected by Hashfront" badge:** a small SVG endpoint plus a copy-paste snippet the protocol can put on its site and pin in Telegram.
  - **Approve page:** a maintainer connects OKX Wallet, sees the manifest diff (file list and hashes), then approves or cancels.
- **Verify:**
  - `npm run build -w apps/web` succeeds
  - Playwright smoke test against anvil: connect, approve, and the status updates
  - a manual pass with OKX Wallet on mainnet

> ✅ **Built (task F, Nov 20).** `apps/web/`: Vite 8, React 19.3.1, wagmi 3.7.11 (+ its required peer `@tanstack/react-query` 5.106.0), viem, ox; dev: `@vitejs/plugin-react` 6.2.1, `@types/react(-dom)` 19.3.0, `@playwright/test` 1.64.1. All pinned and at least 2 weeks old.
> - **Contract change (outside step 10's file list):**
>   - `ReleaseGate.alert()` now stores `lastAlert` (kind, time, live release, observed hash), written before the send loop.
>   - **Why:** a browser can't fetch the protocol's site cross-origin, and the public RPC caps `getLogs` at 100 blocks, so the page had no other way to know about an open alert.
>   - **The page says** "Open alert: …" or "No open alert". It never says "matches", because there is no watcher heartbeat.
>   - **Cost:** an alert now costs about 264k gas (was 219k).
>   - **Re-verified:** forge 48, ABI regenerated, watcher e2e 3/3, CLI e2e 5/5, `rehearse-deploy.sh` OK.
> - **Shared code:** the manifest model moved to the browser-safe `@hashfront/cli/release` (types, `parseManifest` with full shape checks, `recomputeRoot`, `matchesOnchain`, `diffManifests`). `manifest.ts` re-exports it. `@hashfront/circuits` now exports `tap02` and `policy`.
> - **Status page (`#/`):**
>   - open-alert banner
>   - live release and the verified DeWEB copy (`https://<policyId>-2-409.tapekit.org/`)
>   - maintainers, timelock and frozen state
>   - the last 8 releases with approvals, timelock left and "can go live now"
>   - **Truth table:** all 32 rows, evaluated in the browser from the processor's stored `netlist()`, cross-checked against the gate's own `wouldAllow()`. A disagreement shows an error.
> - **Approve page (`#/approve/<id>`):**
>   - **Manifest check:** the maintainer loads `manifest.json`. It is accepted only if it recomputes to the onchain root and chunk count. An optional live manifest gives a file diff.
>   - **What gets signed:** the transaction always uses the onchain `root` and `totalChunks`, simulated first.
>   - **Approve is disabled for:** a non-maintainer, an existing approval, a cancelled, live or migrated release, the wrong chain, or an unverified manifest.
>   - **Cancel** needs a confirm step.
>   - **Frames:** the page refuses to run inside a frame.
>   - **Builder Codes:** `dataSuffix` is added when `VITE_BUILDER_CODE` is set.
> - **Badge (`badge.html`):** React-free, about 1 KB of its own JS plus the shared viem chunk. It shows "Protected by Hashfront · vN", an ALERT, or frozen.
>   - Embedded with an `<iframe>` snippet that includes `sandbox="allow-scripts allow-same-origin …"`. Without `allow-same-origin` the frame's origin is `null` and its module script is blocked by CORS; the e2e caught this.
>   - The copy says plainly that a badge on a hijacked site proves nothing; users should pin the status link.
> - **Link safety:** a build with `VITE_GATE` ignores `?gate/network/rpc`. Without one, a link may choose the gate, but a custom RPC is accepted only for `local` on `127.0.0.1`. Unit tests cover this.
> - **Verified:**
>   - `npm run build -w apps/web`.
>   - `npm test -w apps/web`: 4 unit tests (link rules, and the truth table equal to `policySpec` on all 32 rows).
>   - `npm run test:e2e -w apps/web`: Playwright on installed Edge against local anvil, with an injected EIP-1193 wallet forwarding to anvil. It covers:
>     - the status page and the 32-row table, with no mismatch
>     - the badge, inside its preview iframe and as the copied snippet on another origin
>     - a tampered manifest keeping Approve disabled
>     - a real manifest enabling it
>     - an approval by M2 landing on chain (approval mask `0b011`), after which the CLI can upload and seal and the status shows "2/3 (M1, M2)", sealed, with minutes left on the timelock
>     - a badge that flips to ALERT after `alert(1)`
> - **After review:**
>   - **Wrong chain:** the check uses the wallet's own chain (`useAccount().chainId`), and connect no longer forces a chain switch. A wallet on another chain connects, sees "switch the wallet to …" with a Switch button, and Approve stays disabled. The e2e covers this.
>   - **Policy label:** "2 of 3 + timelock, or 3 of 3" and the M1/M2/M3 names are shown only when every row equals `policySpec`; otherwise the page says "Custom policy circuit".
>   - **Byte count:** it is summed from file sizes, so the unhashed `totalBytes` field can't break the page.
>   - **Tests:** 5 web unit tests and 3 web e2e tests.
> - **Known limits:**
>   - The banner reflects only alerts sent on chain. A watcher running Telegram-only (no `--tapesend-to`) never sets `lastAlert`, so the page stays on "No open alert" during that incident.
>   - The reporter key (or a maintainer) can post an all-clear and clear the banner. The contract header now says so.
> - **Pending:** the manual pass with OKX Wallet on mainnet (task M), and hosting (step 11 or a free static host). **The hosted build must set `VITE_GATE`** (and `VITE_NETWORK=xlayer`). Unbaked, a link with `?gate=<attacker gate>` would show a clean status and an attacker's "verified copy" from our own host.
- **Flags:** 🧩 same front-end dependencies as step 6, plus Playwright (dev only).

### Step 11: Publish the web app through Hashfront itself [S] 💸
> **Hosting rule (task F):** build with `VITE_GATE=<the protocol's gate> VITE_NETWORK=xlayer` (and `VITE_BUILDER_CODE`). Never host an unbaked build as a protocol's status page.
> **Budget (Nov 19):** a separate gate for the web app needs a second container (0.08 OKB). Do this only if the grant covers it; otherwise host the status page on a free static host (Vercel or Cloudflare Pages) and skip this step.
- **Changes:** release `apps/web/dist` through its own gate (dogfooding), and bind a `.tape` name.
- **Verify:** the status page loads from tapekit.org and reads live chain state.
- **Flags:** 💸 about 0.005 OKB.

### Step 12: One-command onboarding with `hashfront init` and the GitHub Action [M]
**Why:** this is the core user's "setup in about 15 minutes" promise. Without it, only we can operate Hashfront.
- **Files:**
  - `packages/cli/src/init.ts`
  - `packages/cli/templates/hashfront-release.yml`
  - `packages/cli/README.md`
- **Changes:**
  - **`hashfront init`** asks for the domain, 3 maintainer addresses, the timelock (default 24 h), the Telegram chat ID and the policy (default v1). It then runs the step 4 deployment, so the whole setup is one command that prints:
    - the gate address
    - the verified tapekit.org link to pin
    - the badge snippet
    - the watcher config
  - **Pre-flight checks** on the build directory:
    - relative asset paths
    - an `index.html` at the root
    - a hash router or fallback route
    - no server-side rendering (Next.js needs `next export`)
  - **The GitHub Action template:**
    - on a tag: build, then `manifest` and `propose`, and post the manifest artifact for reviewers
    - after approvals: `upload`, `seal`, `wait-active`, then deploy to the normal host
- **Verify:**
  - On an anvil fork, `hashfront init` with a timer finishes in under 15 minutes from a fresh clone, and `hashfront status` shows the new gate.
  - The pre-flight check rejects a build with absolute asset paths and accepts the demo build.
  - The Action runs against the fork with `act` or a test repo. Secrets used: `HASHFRONT_PRIVATE_KEY`, `HASHFRONT_GATE`.
- **Flags:** none (fork). On mainnet, a new protocol pays the live TapeOut fees (tape-out plus container, about 0.082 OKB measured on the fork; `init` prints the live amount first) plus gas. Reusing an already-opened circuit with `--policy-id` costs gas only.

> ✅ **Built (task G, Nov 20).** Files:
> - `packages/cli/src/init.ts`, `preflight.ts`, `snippets.ts` (the badge snippet and DeWEB link, shared with `apps/web`)
> - `packages/cli/templates/hashfront-release.yml`, `packages/cli/README.md`
> - tests: `test/preflight.test.ts`, `test/template.test.ts`, `test/e2e/init.e2e.ts` (`npm run test:init -w packages/cli`)
> - **`hashfront init`:**
>   - **Inputs:** flags, or prompts when run in a terminal (in CI a missing value is a usage error, never a hang). It also asks for the uploader and reporter, which the deploy script needs, and never takes a private key.
>   - **Deploy:** runs `DeployXLayer.s.sol` with inherited stdio, so forge asks for the keystore password itself, and reads the result from the deployment file instead of scraping output.
>   - **Mainnet safety:** it simulates by default. `--broadcast` on any non-loopback RPC also needs a terminal and a typed `DEPLOY`, because a fork reports chain 196 too. `--unlocked` works only on loopback.
>   - **Cost:** the live TapeOut fees are printed before anything is sent.
>   - **No double fees:** a finished `deployments/init-<host>.json` is never overwritten. Fork runs write `*.fork.json` (gitignored), and the dry run leaves nothing behind.
>   - **Output:** writes `hashfront.json` and prints the gate, the verified link, the status page build command (`VITE_GATE`), the badge snippet, the watcher command (with `--tapesend-to self --alerts-mainnet`, so the status banner sees alerts) and the CI settings.
> - **`hashfront preflight <dir>`:**
>   - **Errors:** no root `index.html`; a root-absolute `src`, `<link href>` or CSS `url()`; server output (`.next/`, `.nuxt/`, `.svelte-kit/`, Vercel functions, `_worker.js`, `functions/`, `server/`); an invalid path; a file over 8.4 MB.
>   - **Warnings:** history routing without a hash router, `/assets/…` in JS, root links, scripts from other origins.
> - **CLI additions:** `propose --id-file` (the id alone, for CI) and `wait-active --exact` (fails if a newer release is already live, so CI never deploys stale bytes).
> - **Action template, in 3 stages** (a hosted job stops after 6 h, the timelock is 24 h):
>   1. **propose** on a tag. The build is kept as an artifact.
>   2. **publish** by manual dispatch with the propose run id: upload and seal.
>   3. **go-live** by manual dispatch: activate, `wait-active --exact`, then `DEPLOY_COMMAND` on the same artifact bytes.
>   - **Hardening:** minimal permissions (`contents: read`, `actions: read`); dispatch inputs reach shell lines only through `env` and are checked as digits.
>   - **Install:** the CLI is cloned at a pinned commit rather than npm-installed, because Node won't strip TypeScript types under `node_modules`.
> - **Verified:**
>   - **Unit tests:** 7 preflight/init and 3 template-guard (every `$HASHFRONT` command and flag exists, inputs only via env, permissions minimal).
>   - **Fork e2e (`test:init`):**
>     - The dry run leaves nothing behind.
>     - `init --broadcast` took 8.9 s, and a second run is refused.
>     - `status` reads the new gate.
>     - The template's command sequence takes v1 live.
>     - The **printed** watcher command, run as printed (plus `--rpc` and `--once`), reports MATCH.
>   - **From a clean copy** (no `node_modules` or contracts build, on a fork): `npm ci` 41 s, `forge build` 9 s, `init` 22 s, **81 s total**, and then `hashfront status` shows the gate.
>   - Full gate: CLI e2e 5/5, web e2e 3/3, typecheck, all unit tests.
> - **After review:**
>   - **Unconfirmed record:** the deploy script writes its record during forge's local run, before any transaction is sent, so `init` trusts only the chain. The gate must have code, `gate.policyId()` must match, and the gate must hold the circuit.
>   - **Partial deploy:** a failed or partial broadcast moves the record aside as `.incomplete-<time>.json` and prints the exact re-run (`--policy-id <n>`, so fees aren't paid twice). The e2e seeds a codeless record and checks this message.
>   - **Preflight:** it rejects `<base href="/">` (Angular's default).
>   - **Cost line:** it shows 0 when a reused circuit's container is already open.
>   - **Gaps:**
>     - **Prompts:** the interactive prompt path has not been executed; every test passes flags. Its default `--name` for `app.example.org` is "app".
>     - **Circuit id race:** without `--policy-id`, a tape-out by someone else between simulation and broadcast could shift the circuit id. The on-chain check would catch it; task M avoids it by probing first.
> - **Pending (can't be done here):**
>   - **Actions test:** running the Action itself (`act` or a test repository); there is no git repository yet and `act` isn't installed.
>   - **YAML lint:** not run, since no YAML parser or linter is installed.
>   - **Mainnet:** running `init` on mainnet belongs to task M.

---

## Phase 6: the end-to-end product, live (added Nov 20, after task M)

**Where we are:** every part is built and tested, the gate and release v1 are live on mainnet, but the full loop has never run in the real world. These tasks make it run, in this order. Every mainnet transaction still needs an explicit "go".

| Task | What | Done when | Needs from you |
|---|---|---|---|
| **N1 ✅** (github.com/syther069/hashfront, Nov 20; author syther069 only) | Git repository: first commit of everything (secrets and records ignored), then a GitHub repo | `git log` shows the import; later the repo is on GitHub | Create the GitHub repo and push (your account) |
| **N2 ✅** https://hashswap-demo.vercel.app (MATCH v1) | Normal host for HashSwap: deploy `apps/demo-dapp/dist` (the exact v1 bytes) to a free static host | The watcher run once against it says MATCH for v1 | A Vercel (or Cloudflare Pages) login, or your own domain |
| **N3 ✅** https://hashfront-status.vercel.app | Status page: build `apps/web` with `VITE_GATE=0xAF96…80F6 VITE_NETWORK=xlayer` and host it | The page shows v1 live and the 32-row policy table from mainnet; the badge works | Same host as N2 |
| **N4** | Run the watcher continuously: `scripts/run-watcher.ps1` (reporter keystore, Telegram token at hidden prompts), and a GitHub Actions cron variant (`--once` every 5 min) | One JSON line per check, MATCH, for an hour | Telegram chat id (have it) |
| **N5 ✅** (mainnet, Nov 20: detected in 21 s, alert at 51 s, all-clear; see docs/evidence-hijack-rehearsal.md) | Hijack rehearsal on **our own** host (step 13): deploy the `build:hijack` copy, so the watcher says MISMATCH, then 1 Telegram + 1 onchain TapeSend alert, and the status page and badge show ALERT; open the verified link and see the real v1; restore, then all-clear | Recorded end to end, with OKLink links for the alert transactions | "go" for the alert transactions (about 0.00001 OKB) |
| **N6** | Manual OKX Wallet pass: the approve page with a maintainer wallet (for a v2 release), and the HashSwap "swap" (0.000001 USDT approve) on the DeWEB copy | Screenshots and transaction links | Your OKX Wallet with the m-keys imported, or approvals by CLI |
| **N7** | TapeSend client view (3b): the site container belongs to the gate, so the client can't show its inbox to us. Option: send the alert to an endpoint of a container you hold, or show the hub's `inboxCount` and the payload on OKLink | One alert visible to a person | Decide which |
| **N8** | Step 14: README, demo video (the N5 flow), submission; Track B interview notes | Submitted before Dec 7, 23:59 UTC | Interview status, recording, submission account |

**Budget:** the deployer has about 0.00219 OKB. A v2 release costs about 0.0002 and an alert about 0.000005, so N5 and N6 fit.

## Phase 7: judge-ready (added Nov 20, after the N5 rehearsal passed)

**Goal:** a judge who opens the repo, the video or a link understands the product in 2 minutes and can check every claim. Ordered by impact. A task marked 💸 needs a "go" for mainnet transactions.

| Task | What | Done when | Owner |
|---|---|---|---|
| **P1 ✅** | **README rewrite:** what it is, the problem (Oct 31 Name.com hijacks), live links, mainnet addresses, how TapeOut/DeWEB/TapeSend/X Layer/OnchainOS are used, an architecture diagram, the rehearsal evidence with OKLink links, "run it yourself", tests, security model and known limits | A stranger can follow it to verify v1 and the rehearsal on chain | Claude |
| **P2 ✅ script** | **Demo video (3 min):** script with exact steps and timings (problem → setup → release → hijack → alert → safe copy → all-clear) | Script in `docs/demo-script.md`; video recorded | Script: Claude; recording: you |
| **P3 ✅** (first run green) | **GitHub CI:** typecheck, all unit tests, `forge test` (without fork tests), and the demo and web builds on every push, with a badge in the README | Green run on `main` | Claude |
| **P4 ✅** | **LICENSE:** MIT, © syther069 | File in the repo root | Claude (you can pick another license) |
| **P5 ✅** (code `15ld85k6825od6yr`; first attributed mainnet tx `0x1024923a…`, M1's wallet approval) | **X Layer Builder Code:** register one; set `HASHFRONT_BUILDER_CODE` / `VITE_BUILDER_CODE`; future transactions carry ERC-8021 attribution | One mainnet transaction with the suffix, visible on OKLink | Register: you; wiring: Claude |
| **P6 ✅** (docs/evidence-wallet-pass.md) | **OKX Wallet pass (N6)** 💸: v2 release approved from the approve page with a real wallet, plus the HashSwap swap on the DeWEB copy | Transaction links and screenshots in `docs/` | You (wallet) + Claude |
| **P7** | **User research (Track B):** interview notes or replies | `docs/interviews.md` log filled; a README section | You |
| **P8** | **24/7 watcher:** turn on the cron template in a private repo with the reporter key as a secret, or keep the PC watcher for the demo | A decision; if cron, green runs every 5 min | Decision: you |
| **P9** | **TapeSend client view (N7):** show an alert in a client the judges can open, or document the on-chain read (`inboxCount` and payload) | One verifiable view, documented | Claude (after P1–P4) |

## Phase 8: OKX Onchain OS API keys (added Nov 20; ✅ built Nov 21, see docs/evidence-okx-api.md; only a live gateway alert on mainnet is still open)

**Scope:** the user has API keys from the OKX developer portal. This is what the docs show (read Nov 20) and how each product could make Hashfront stronger. Auth is `OK-ACCESS-KEY` / `-SIGN` / `-PASSPHRASE` / `-TIMESTAMP` headers, so a secret is involved.

**Key rule:** keys live only where Hashfront already keeps secrets: the watcher and CLI process, read from env or a hidden prompt, or a GitHub secret in CI. Never in `apps/web` or the demo bundle (anything built with Vite is public), never in a file in the repo, never pasted in chat.

| # | OKX API (X Layer 196) | Use in Hashfront | Value | Verified in docs |
|---|---|---|---|---|
| **A1** | **Wallet / Balance API** | The watcher checks the reporter and deployer balances and sends a team notice ("reporter gas low") before alerts could fail | High: an alert must never fail silently for lack of gas | Product ✓, endpoint path to confirm |
| **A2** | **Onchain Gateway** (simulate + broadcast, multi-broadcast) | Alert transactions are simulated and broadcast through OKX's gateway as well as the public RPC, so alerts get through when `rpc.xlayer.tech` is slow or rate-limited during an incident | High: alert delivery under load | Product ✓, X Layer support and paths to confirm |
| **A3** | **Market API** `POST /api/v6/dex/market/price` | `hashfront init` and `status` show costs in USD (fees, gas); the README cost table gets live prices | Medium: clearer for teams | ✓ endpoint and auth |
| **A4** | **Security scan** (behind `onchainos security dapp-scan`) | Call the scan over REST with the key, so the phishing signal also works in GitHub Actions without the onchainos CLI or a login | Medium | ❌ no REST page found yet; ask OKX or read the CLI |
| **A5** | **DEX Swap API** (`/quote`, `/approve-transaction`, `/swap`) | Make HashSwap a real swap (quotes from the aggregator) for a more convincing demo. It needs a small server or Vercel function so the key stays off the client | Low for the core product, nice for the video | Flow ✓, paths to confirm |
| **A6** | **Developer portal analytics** | Show Builder Code attribution (transactions and activity from `15ld85k6825od6yr`) in the submission | Medium, no code | Portal ✓ |

**Order if we do it:**
1. A1 (balance warning)
2. A2 (gateway broadcast fallback)
3. A3 (USD prices)
4. A4 once the REST endpoint is confirmed
5. A5 only if there is time after the video

**Prerequisite:** for each item, read its API reference page for the exact path, method and signing (HMAC over `timestamp + method + path + body` is the usual OKX scheme; confirm it in the docs). Then add one unit test with a recorded response, and one live call with the key from env.

## Phase 5: end-to-end rehearsal and submission

### Step 13: Hijack rehearsal on our own domain [M] 💸
**Needs from you:** a Vercel or Cloudflare Pages project. Their free `*.vercel.app` / `*.pages.dev` hosts are enough to demo a content hijack. A cheap own domain is only needed to show the DNS/NS signal live; without one, step 8's DNS signal is shown through its tests.
- **Changes:**
  1. Deploy the demo to the test domain.
  2. The watcher shows a MATCH.
  3. Deploy a "malicious" build that swaps the `approve()` spender.
  4. Expect, within about 60 s: the TapeSend and Telegram alerts fire, and the status page turns red.
  5. A user opens the pinned tapekit.org link and completes a swap.
  6. Restore the real build: the status returns to green.
- **Verify:** the timings are recorded in `MEMORY.md`, and a screen recording is captured.
- **Flags:** 💸 small. Never touch real protocols' domains.

### Step 14: Demo video, README and submission [M]
- **Changes:**
  - a demo video of 3 minutes or less, following the script in `HASHFRONT_PLAN.md` §7 (**opens with the hijack**, then shows how the verified copy got there)
  - a recorded fallback of every live step, for the offline Demo Day
  - final README with addresses
  - Google Form fields: processor address, circuit IDs, gate, container, links
- **Verify:** the submission checklist in `HASHFRONT_PLAN.md` §10 is all ticked.

---

## Dependency, risk and schedule summary
**Build order (no target dates):** work through the tasks in this order, as fast as each one passes its verify. The only date that matters is the submission deadline. Track B runs in parallel. Every mainnet transaction is grouped into the single mainnet run (task M).
| Order | Task | Where | New dependency | Permanent onchain | Size |
|---|---|---|---|---|---|
| ✅ | 1 Tape-out flow, 2 Open and bind | fork | – | – | S |
| A ✅ | 4 Deploy script (+ `alert()` from step 9) | fork | – | – | M |
| B ✅ | 6 Demo dApp v1, released on the fork | fork | 🧩 vite/react/wagmi | – | M |
| C ✅ | 7 Watcher core | local | – | – | M |
| D ✅ | 8 DNS, cert, OnchainOS | local | – | – | S |
| E ✅ | 9 Alerts (Telegram live, TapeSend on fork) | fork | – (`@tapekit/send` not needed) | – | M |
| F ✅ | 10 Web app | local | 🧩 front-end, Playwright | – | L |
| G ✅ | 12 `hashfront init` and Action | fork | – | – | M |
| **M** (✅ gate `0xAF96…80F6` and release v1 live on mainnet, Nov 20; 3b TapeSend client view open) | **Mainnet run:** 3 → 3b → 5 → 6, as soon as about 0.09 OKB is there (any time after A). If it's still short once G is done, decide on plan B | 💸 mainnet | – | 🗄️ NFT to gate, release v1 | M |
| H | 13 Hijack rehearsal | 💸 mainnet | – | – | M |
| I | 11 Dogfood publish (only if funded) | 💸 mainnet | – | – | S |
| J | 14 Video and submission | – | – | – | M |

**Budget (lowered Nov 19):** about **0.1 OKB total**: deployer 0.095, each maintainer 0.0005. **Not funded yet** (the user has ≈ 0.051 OKB); see "Funding strategy" above.
- The one fixed cost is TapeOut's container fee, 0.08 OKB (checked live). Only **one** container is used; alerts go through the site container (step 9).
- Everything else is gas at about 0.02 gwei: tape-out ≈ 0.002, gate deploy and a whole release of a small demo dApp ≈ 0.001–0.005.
- Keep the demo dApp build small (under ~200 KB ≈ 9 chunks). If a step fails and needs a retry, top up then rather than pre-funding.
