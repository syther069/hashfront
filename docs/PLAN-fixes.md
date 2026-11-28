# Hashfront: fix plan after the judge review (Nov 27, 2026)

**Read this first.** It replaces the remaining open tasks of `docs/PLAN-10of10.md`; that file stays the codebase map (section 1) and the rules (section 0). Read only the files each task names.

**Deadline:** submit by **Dec 6**; Dec 7, 23:59 UTC is buffer only.

---

## Revision, Nov 28: the path to 9/10. This section wins over the rest of the file.

**Why the plan changed:**
- **The OKX Gateway alert was never proven live.** F1 found that the Nov 27 alert went over the plain RPC, because the watcher ran without the OKX keys.
- **16 tasks won't fit in 8 days.** Some must be cut.
- **The biggest gaps aren't code.** They are users, the demo video, and how central TapeOut is.

The official criteria and the FAQ say that judges score "the potential to expand TapeOut into new use cases", "Ecosystem Integration", and "explain which features use TapeOut". They also say "only work completed during the event will be judged".

**What wins web3 hackathons,** from judge and organiser write-ups:
- a demo the judges understand in one go, recorded so it can't fail live
- fit with the sponsor's own goals (here: TapeOut usage and X Layer activity)
- a working end-to-end product, not a show piece
- proof that real people want it

### New tasks (do these first)

**N1: prove the OKX Gateway alert live** (1 h, ⛓ needs a "go", about 0.00001 OKB)
- **Run:** `pwsh scripts/with-okx.ps1 pwsh scripts/run-watcher.ps1 -Site https://hashswap-demo.vercel.app/ -TelegramChat 6977270776 -Log .watcher/watch.jsonl`, then the hijack and restore steps in `docs/RUNBOOK-hijack-e2.md`.
- **Done when:** the log line says `via okx-gateway+rpc (OKX order …)`.
- **Record it:** the tx and order id go into `docs/evidence-okx-gateway-alert.md` and the README OKX table. Remove the "not yet proven" wording.
- **Needs F2 first:** the reporter top-up.

**N2: other TapeOut teams as the first users** (the user-value fix; user 3 h, Claude 2 h)
- **Why:** cold DMs to big protocols rarely answer in 8 days. The hackathon's own Telegram (https://t.me/+-7ouB60aYig2MmM1) is full of teams that ship a DeWEB site *and* a normal domain. They are the exact target user, reachable this week. Every one we protect is also TapeOut ecosystem growth, which judges score.
- **Claude:**
  - write `docs/onboarding-15min.md`: `hashfront init` on their site, the watcher and the badge
  - add `hashfront init --dry-run` output to it, so a team can see the cost first
  - draft a short Telegram post for the user to send
  - **Status (Nov 28):** Claude part done on `docs/n2-onboarding`: `docs/onboarding-15min.md` (cost from an `init` simulation on a local fork: 0.08196 OKB fees + about 0.0002 OKB gas; `init` already simulates by default, so no `--dry-run` flag was added) and the post in `docs/interviews.md`. Open point for the user: offer to pay a team's 0.082 OKB fees or not. The Guard protects only our demo site until F10.
- **User:**
  - posts in the hackathon Telegram: "free hijack watch for your DeWEB project; 15 min setup"
  - helps 1–3 teams set it up
  - **with their permission**, lists them in the README as "Protected projects" with their status badge
- **Done when:**
  - at least one team other than us is watched live, or
  - the README honestly says how many were asked and how many said yes

**N3: TapeOut at the centre, not on the side** (4 h; replaces F13)
- **A reusable circuit:** turn the release policy into a **public, reusable "release policy" circuit**, so another TapeOut project can point its own gate at it. Document the circuit's processor, ID, inputs and truth table in `circuits/README.md` as "use this circuit in your project".
  - First read `contracts/src/ReleaseGate.sol` (constructor: `processor_`, `policyId_`) and `circuits/`.
  - If a new gate can reuse circuit #4 without deploying a new one, say so and show it in a fork test. If it can't, explain why, and how a team would tape out their own copy.
- **Policy as data:** if the gate supports changing the policy circuit, demo one policy swap. If not, write it as a known limit with the design for v2. Don't redeploy the gate.
- **TapeSend alerts users can subscribe to:**
  - First check whether a user's own TapeSend endpoint can be added to `--tapesend-to` (`resolveRecipients` in `packages/watcher/src/alerts/tapesend.ts`; TAP-10 endpoint ids).
  - If it can, add a "Get alerts on TapeSend" box on the status page that shows the endpoint format, and send the next alert to one real user inbox as well as `self`.
  - This turns the onchain alert from a log entry into a channel that reaches people.
- **README, one table "Where TapeOut is used":** each feature, the contract or ID, and what breaks without it. The FAQ asks for exactly this.

**N4: the demo video, earlier and as the backbone** (move F14 to Dec 3; a re-record is allowed on Dec 5)
- **Structure:** problem (15 s) → who and who pays (15 s) → live hijack on our domain (60 s) → Guard blocks the signature (20 s) → OKX Gateway alert + TapeSend + Telegram (25 s) → revoke + verified copy (25 s) → "where TapeOut is used" + the adopters from N2 (20 s).
- **Recording:** record a clean take as the backup; a live demo on Demo Day only if shortlisted.

### Keep, in this order

1. **F2** reporter top-up (user, today)
2. **N1** Gateway live proof
3. **F9** domain: **decide today**. The demo pitch depends on it. Without it, everything says "frontend integrity", not "DNS hijack".
4. **F5** alert can't lock users out (small, prevents an embarrassing failure)
5. **N2** TapeOut teams onboarding (start today, runs all week)
6. **N3** TapeOut at the centre
7. **F6** CT key or honest wording
8. **F4, but smaller** (2 h): only the DOM script and stylesheet list check against `status.assets`, without the asset re-fetch. Judges won't test cloaking; it just must not be false in the README.
9. **F10, but smaller** (1 h): the site list comes from config, no store submission
10. **N4 / F14** video on Dec 3, re-record allowed on Dec 5
11. **F16** final pass, submission form Dec 6

### Cut or defer, and why

| Task | Decision | Why |
|---|---|---|
| F7 | merged into N2 | cold outreach to big protocols is a long shot this week; send the DMs anyway, but don't plan on replies |
| F8 | optional | only if two friends are available on short notice; otherwise state it in the README |
| F11 | optional | rate limit: a Vercel Firewall rule, 15 min, only if the user wants it |
| F12 | → simple | keep the PC watcher running Dec 3–10 and state that; no hosted move |
| F13 | merged into N3 | |
| F15 | do it | remove the guardian (ask first): 30 min, and less to explain |

### Honest score outlook

| Criterion | Now | With this plan | What decides it |
|---|---|---|---|
| User value and commercial | 5 | 7–8 | N2 adopters; real replies |
| Innovation | 7 | 8 | N3 reusable circuit + TapeSend subscriptions |
| Ecosystem integration | 8 | 9 | N1 + N3 + the "where TapeOut is used" table |
| Product readiness and UX | 7 | 8 | domain demo, F5, Guard |
| Demo video | 3 | 9 | N4, rehearsed |
| **Overall** | **about 6** | **8.5–9** | |

**9/10 needs N2 to land:** at least one other team protected live. Without it, expect about 8.

**What is not in our control:** how many teams enter, and what the judges weigh most.

**Rules (unchanged):**
- **Commits** are authored by `syther069` only, with no Claude or Co-Authored-By lines.
- **Branches and PRs:** one branch and one PR per task, and CI must be green before merging.
- **Mainnet:** no mainnet transaction without the user's "go".
- **Secrets:** never touch them.
- **Domains:** only our own.
- **Dependencies:** ask before adding one.
- **Talking to the user:** reply in Hinglish, step by step.

**Score today:** about 6.5/10 against the official criteria: user value 5, innovation 7, ecosystem 8.5, readiness 7, demo 3. The goal is to raise the two weakest, user value and demo, without breaking what works.

---

## Phase 1: today, about 2 h. Quick wins, no risk

**F1: make the README match the evidence** (1 h) · `docs/f1-readme-truth`
- **Gateway proof:** in the "Built on OKX Onchain OS" table and the Mermaid alert node, replace "mock-tested; live proof pending" with the live result.
  - Alert time: 44 s from the hijack going live.
  - Tx `0xba9c1079…` with an OKX orderId (take it from the watcher log if it is recorded there).
  - Link [`docs/evidence-okx-gateway-alert.md`](evidence-okx-gateway-alert.md).
- **Success-metric box:**
  - "8 h, 960 checks, 100 % schedule uptime, one declared drill, 0 alerts outside it".
  - Remove "24 h run is pending".
  - Keep "one run is too little to claim a false-alarm rate".
- **Signal claims:**
  - Under "Know", mark CT as best effort. In our run it was unavailable in 72 % of checks; update this line after F6.
  - Remove "even if the attacker shows the watcher the real page" until F4 lands.
- **Test counts:** re-run the suites and copy the real numbers.
- **Done when:** every number in the README is backed by a file in `docs/`, and `grep -n "pending" README.md` shows only true items.

**F2: top up the reporter** (user: 5 min) · no branch
- **Ask the user to send about 0.002 OKB** to the reporter `0xeC8b730F7E9F69e53FE257473c4809Ef93dc46de`. The user sends it themselves; Claude never moves funds.
- **Verify** with `cast balance` (read-only), then note the new balance in `MEMORY.md`.

**F3: repo hygiene** (15 min) · `chore/f3-hygiene`
- **Delete** `scratch-c2docs.py` (check first: `git grep scratch-c2docs` finds nothing).
- **Tell the user** that the PR merge commits show their GitHub profile name ("TANUJ CHANDA"). Either:
  - change the GitHub profile name to syther069, or
  - merge PRs from the CLI as syther069 (`git merge --no-ff` locally, then push).

  Don't rewrite published history without an explicit "go".

---

## Phase 2: Nov 28–29, about 8 h. Guard safety (real behaviour changes, each with tests)

**F4: Guard checks what the page actually runs** (3 h) · `fix/f4-guard-dom-check`
- **Problem:** `apps/guard/guard.js` hashes a second `fetch(location.origin + "/")`. An attacker can tell that request apart from the real page load (the `Sec-Fetch-Dest` header, cookies) and serve it a clean page.
- **Change:**
  - In `apps/guard/lib.js`, add a pure `checkDom(scriptSrcs, styleHrefs, origin, assets)`. It returns `{ ok, unknown: string[] }`: every same-origin `<script src>` and `<link rel=stylesheet href>` path must be a key in `status.assets`, the approved file list `/api/status` already returns.
  - Any unknown path, and any inline `<script>` with code (the approved build has none), means `block: hash`.
  - In `guard.js`:
    - on `DOMContentLoaded`, collect `document.scripts` and the stylesheets, and run `checkDom`
    - keep a `MutationObserver` running until `load`, so scripts added later are caught too
    - keep the fetch hash as a second signal only
  - Then fetch each referenced asset and compare its sha256 with `assets[path]`. Assets have content-hashed names, so this catches a same-name swap.
- **Tests:**
  - unit tests in `apps/guard/test/lib.test.js` for:
    - all approved → ok
    - an extra script → block
    - an inline script → block
    - a cross-origin script → block
  - Guard e2e (`guard.e2e.mjs`) on a **cloaking host**: a local server answers `Sec-Fetch-Dest: empty` with the good `index.html` and a navigation with the hijack build. Expect the overlay.
- **Docs:** update `apps/guard/README.md` limits, and only then restore the anti-cloaking line in the README.

**F5: a stale or false alert can't lock users out** (3 h) · `fix/f5-alert-not-lockout`
- **Problem:** `loadStatus` in `apps/web/api/_site.ts` returns `alert` whenever `lastAlert.kind` is 1 or 2, even when the site matches. Guard then blocks all signing. A leaked reporter key, or a watcher that stops before the all-clear, locks every Guard user out of the real site with no end.
- **Change:**
  - `StatusReport` gets a field `alertOpen: boolean` (an onchain alert is open, with `lastAlert.at`). `status` is:
    - `alert` only when the server-side verdict is MISMATCH
    - `warn` when an alert is open but the content matches
    - `ok` / `unknown` as before
  - In `apps/guard/lib.js`, `decide` treats `warn` as a non-blocking banner: a small top bar, "An alert is open for this site; the page currently matches its approved release. Check the status page." Only `alert` or a failed DOM or hash check blocks.
  - The status page shows "Alert open, site currently matches" for `warn`.
- **Tests:**
  - handler unit tests: open alert + MATCH → `warn`; MISMATCH → `alert`; no alert + MATCH → `ok`
  - Guard unit tests for `warn` (no block)
  - a Guard e2e: open alert on anvil + good build → banner, and the signature passes
- **Docs:** README security model: "a stolen reporter key can raise a warning banner, never block signing on a matching site".

**F6: make the CT signal work, or say it doesn't** (2 h) · `fix/f6-ct-key`
- **Problem:** CertSpotter returned 403 on every call, because anonymous use is limited.
- **Ask the user first:** a free CertSpotter account is needed for an API key (account creation needs their "go").
- **With a key:** `packages/watcher/src/signals/ct.ts` reads `CERTSPOTTER_API_KEY` from env and sends `Authorization: Bearer <key>`. Add it to the `with-okx.ps1`-style hidden prompt or to the GitHub secrets. Never print it.
- **Back off** on 403/429: the next CT lookup waits 30 min instead of 10.
- **Tests:** a fixture where 403 is followed by backoff; the key is sent when set and never logged.
- **Without a key:** keep the code, and change the README to "CT is best effort; in our 8 h run it was unavailable 72 % of the time".
- **Re-run:** run the watcher for 2 h or more with the key, then regenerate `docs/metrics.md` (`scripts/metrics-report.ts`) and quote the CT availability figure.

---

## Phase 3: Nov 28 → Dec 3, user-led and run in parallel. The biggest score gap (user value)

**F7: real users and one adopter** (user: 4–6 h spread over days; Claude: 2 h)
- **Day 1:**
  - The user sends 8–10 DMs using the templates in `docs/interviews.md`: X Layer DeFi teams on DefiLlama's X Layer list, Name.com victims, and the Build X Telegram.
  - Claude makes the message shorter if the user asks, and never sends anything.
- **Each reply:** the user pastes it, and Claude logs it word for word in the table, including "no" and "no reply".
- **One adopter (the goal that matters most):** offer one small X Layer protocol a free 15-minute setup, a self-hosted watcher on their domain plus the badge. With their permission:
  - add them to the README as "first user"
  - add their status line to the status page, or a second watcher config
  - Claude writes `docs/onboarding-15min.md`: the exact steps for `hashfront init`, the watcher and Telegram.
- **Go-to-market paragraph** in the README ("How we reach users"):
  - X Layer ecosystem channels and Build X Demo Day
  - teams that had a Name.com or DNS incident
  - a free tier for X Layer protocols
  - wallets reading the feed (OKX Wallet) as the route to scale
- **Business:** `docs/business.md` uses only what replies said. The price stays labelled a hypothesis until a reply supports it.
- **If nobody replies by Dec 3:** write that plainly, with the count of messages sent.

**F8: real second and third maintainers** (user: 1 h) · `docs/f8-maintainers`
- **Problem:** the 2-of-3 approval is three burner wallets held by one person.
- **Ask the user** whether two trusted people can each hold a fresh wallet.
- **If yes:**
  - make their keys maintainers with `voteReplaceMaintainer` (two existing maintainers vote per slot; ⛓ needs a "go", about 0.000002 OKB per vote)
  - they approve one small release (v3, for example a text change) from their own OKX Wallet
  - record it in `docs/evidence-real-maintainers.md`
- **If no:** the README states that maintainers are held by one person in the demo.

**F9: decide the domain** (decide by **Nov 30**)
- **Ask once:** buy a cheap domain with DNSSEC and a registrar lock (about $2–10)? The user buys it; Claude never spends money.
- **If yes:**
  - add it to the `hashswap-demo` Vercel project, then point the watcher, `HASHFRONT_SITE`, the Guard manifest and the status config at it
  - write `docs/RUNBOOK-domain-hijack.md`: move the DNS to the hijack project with DNSSEC off, then restore
  - run it once live ⛓ and record CT, RDAP and the mismatch firing
- **If no:** rename the pitch everywhere (README hero, demo script, business) to "frontend integrity: a hijacked host or domain serving a changed app", and keep the hosting-compromise disclaimer.

---

## Phase 4: Dec 1–3, about 6 h. Product hardening

**F10: Guard protects any listed site** (3 h) · `feat/f10-guard-sites`
- **Problem:** `apps/guard/manifest.json` hard-codes `hashswap-demo.vercel.app`, so no other protocol can use the Guard.
- **Change:**
  - `config.js` holds a list of `{ origin, statusUrl }`, the demo plus the F7 adopter if there is one
  - the manifest's `matches` / `host_permissions` come from that list, generated by `scripts/pack-guard.ts`, which already exists
  - `bg.js` picks the feed by the tab's origin
- **Optional:** use `optional_host_permissions` plus a popup button "Protect this site", so users can add a site that has a Hashfront feed.
- **Tests:** unit tests for picking the feed per origin; the e2e for the existing site stays green.
- **Store:** ask the user before submitting to the Edge Add-ons or Chrome Web Store (accounts, fee). Otherwise attach the zip to the GitHub Release, and say in the README that it is "load unpacked for now".

**F11: rate limit the public OKX-backed API** (1 h) · `fix/f11-rate-limit`
- **Problem:** `/api/approvals` calls OKX for every new address. A script can burn the quota during an incident.
- **Preferred:** a Vercel Firewall rate-limit rule on `/api/approvals` and `/api/tx-scan` (for example 30 requests per minute per IP). Claude prepares the rule; the user approves it in the dashboard or via the CLI, because it changes project settings.
- **Fallback in code:** a small per-IP bucket in `_handlers.ts` using `x-forwarded-for`, which returns 429 with `retry-after`. It is per instance, so document that.
- **Test:** the handler unit test returns 429 after N calls.

**F12: an always-on watcher for judging** (2 h) · `ops/f12-hosted-watcher`
- **Ask the user to choose** between:
  - **(a) keep the PC on**, Dec 4–10, with `run-watcher.ps1` and a log
  - **(b) the GitHub Actions template**, `packages/watcher/templates/hashfront-watch.yml`, which runs every 5 min with secrets. That is slower than the 30 s claim, so say so in the README.
- **Either way:** the status page's "Watcher health" line already shows the last check. Make sure it shows "watcher offline" after 5 min with no check, if it doesn't already: read `Status.tsx` first.
- **Metrics:** regenerate `docs/metrics.md` from the longest run before Dec 5.

**F13: answer "why a circuit?" convincingly** (1–2 h) · `docs/f13-circuit`
- **README section:** "Why a circuit" focuses on the policy being **inspectable and replaceable data**:
  - the netlist is on chain
  - the status page evaluates all 32 rows in the browser
  - TapeOut circuits are reusable by other gates
- **Check whether the gate can point at a new policy circuit.** If it can, show a second policy, for example "3 of 3 for hotfixes only". If it can't, say so as a known limit and as the next step.
- **Never claim** the circuit does something Solidity couldn't.

---

## Phase 5: Dec 4–6. Demo, polish, submit

**F14: the 3-minute demo video** (user + Claude: 4 h, Dec 4)
- **Update `docs/demo-script.md`** for F4, F5, F7 and F9. The new script must show:
  - the problem with one number
  - who uses it, who pays and how we reach them (official criterion)
  - the TapeOut and DeWEB pieces by name
  - a live hijack, the onchain alert with the OKX order id, and Telegram
    - **Note (F1, Nov 27):** the E2 run's alert went via RPC, not the Gateway (no OKX keys loaded). An order id needs a live run started as `pwsh scripts/with-okx.ps1 pwsh scripts/run-watcher.ps1 ...` ⛓ (needs a "go"); check the log line says `via okx-gateway+rpc (OKX order …)`.
  - **the Guard overlay blocking a real signing attempt** (missing in the first live run)
  - the suspect address, "Am I affected?" and revoke
  - the verified copy and the all-clear
- **Rehearse twice**, then record (⛓ about 0.00001 OKB per live run).
- **Publish** on YouTube (unlisted) or as a GitHub Release asset, and link it at the top of the README.

**F15: lean** (30 min) · `chore/f15-lean`
- **Remove the guardian:** `packages/watcher/src/alerts/guardian.ts`, `contracts/src/DemoVault.sol`, their flags and tests. Grep for `guardian` and `DemoVault` first.
  - It is fork-only, never deployed and refused on mainnet, so it is extra code to explain.
  - Keep one README line: "a guardian pause was prototyped and removed because a false positive pausing a protocol is a liability".
  - Ask the user before deleting. If they want to keep it, leave it marked as an experiment.
- **Add a daily CI job:** `scripts/okx-probe.ts` read-only, with keys as secrets, so a changed OKX path is noticed before judging. It only runs if the user adds the secrets.

**F16: final pass and submission** (3 h, Dec 5–6)
- **Baseline gate:** typecheck, unit tests, `forge test`, the watcher, web and Guard e2e, and the build.
- **Security re-check:**
  - no secrets in `dist/assets`
  - Vercel functions take no user-chosen URLs
  - the F11 limits are on
- **Docs:** update `MEMORY.md`, `AGENTS.md` and the status table at the top of this file. Tag `v1.0.0` with release notes. The repo stays public.
- **Submission form fields** (the user submits, and Claude drafts the text):
  - **Product, users and how to reach them, revenue model, why they pay and keep paying** (from README and business)
  - **Processor address** `0x39E44DbA62811E87fDe122CA4d6c082568a384D0`
  - **Circuit ID** #4
  - **Access links:** the status page, the verified copy and the demo site
  - **TapeOut features used:** circuit, DeWEB / TapeKit SiteRegistry, TapeSend, Builder Code, plus OKX Onchain OS APIs
  - **The video link**
  - **What was built during the event:** the whole repo, first commit Nov 20

---

## Status

| ID | Task | Owner | Status |
|---|---|---|---|
| F1 | README matches evidence | Claude | done (PR `docs/f1-readme-truth`); found the E2 alert went via RPC, not the Gateway |
| F2 | Reporter top-up | user | todo (Nov 28: reporter still 0.000033 OKB) |
| F3 | Hygiene, merge author name | Claude + user | scratch file removed (PR `chore/f3-hygiene`); merge-author name: user to choose |
| F4 | Guard DOM check (anti-cloaking) | Claude | todo |
| F5 | Alert can't lock out users | Claude | done (`fix/f5-alert-not-lockout`): feed `warn` + `alertOpen`, Guard banner, status page amber; Guard e2e uses a mocked feed, the server rule is unit-tested |
| F6 | CT key or honest wording | Claude + user | todo |
| F7 | Users, one adopter, go-to-market | user + Claude | todo |
| F8 | Real maintainers ⛓ | user + Claude | todo |
| F9 | Domain decision ⛓ | user | decide by Nov 30 |
| F10 | Guard for any listed site | Claude | todo |
| F11 | Rate limit API | Claude + user | todo |
| F12 | Always-on watcher | user choice | todo |
| F13 | Why a circuit | Claude | todo |
| F14 | Demo video ⛓ | user + Claude | Dec 4 |
| F15 | Lean (guardian removal, OKX probe) | Claude, ask first | todo |
| F16 | Final pass and submit | Claude + user | Dec 5–6 |

**Time:** about 30 h of Claude work plus the user's outreach. It fits by Dec 6 at about 4–5 h a day.

**Expected score if done:**

| Criterion | Score |
|---|---|
| User value | 7 (8 with an adopter) |
| Innovation | 7.5 |
| Ecosystem | 8.5 |
| Readiness | 8 |
| Demo | 8 |
| **Overall** | **about 8/10** |

**Still out of reach:** a 10/10 needs paying or real users, which a hackathon timeline rarely gives. Be honest about that.
