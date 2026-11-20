# Engineering rules

These apply to every change, human or AI. If a rule blocks you, say so in the PR. Don't quietly break it.

## 1. Correctness first
- Every step leaves the repo building with all tests green (see the baseline gate in `IMPLEMENTATION_PLAN.md`).
- **No step is done until it has been verified by running it,** not by reading it.
- Cross-language code must have a compatibility test, with the same bytes on both sides. Examples:
  - the Merkle leaves in TypeScript and Solidity
  - the netlist evaluator against the live chain
- Fix root causes. Don't weaken a test, add `as any`/`as never`, or disable a lint rule to get green. If a lint rule really is a false positive, disable it on that one line with a comment saying why.

## 2. Smart contracts
- **Solidity and compiler:** Solidity 0.8.28 with the Foundry optimizer at 200 runs. No `via_ir` unless measured and justified.
- **Validation:** check every external input. Custom errors with clear names; no revert strings in `src/`.
- **Each new path needs a test:**
  - a unit test for the happy path
  - a test for every revert
  - fuzz tests for anything bit- or arithmetic-heavy
- **Real chain behaviour:** any assumption about TapeOut contracts needs a **fork test against X Layer mainnet** before we depend on it.
- **External calls:** state changes happen before external calls where possible. The gate only calls TapeOut contracts whose addresses are fixed at construction.
- **No upgradeability or admin keys in our contracts.** Governance is the maintainer votes in `ReleaseGate`.

## 3. TypeScript
- **Strict mode,** including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. `npm run typecheck` must pass.
- Native Node type stripping: erasable syntax only (no enums, namespaces or parameter properties).
- **Typed ABIs** are generated from Foundry artifacts (`npm run abi`). Never hand-edit `abi.ts`.
- **Errors:**
  - user mistakes throw `UsageError` with a message that says what to do
  - contract reverts are decoded to the custom error name plus a hint
- **Simulate before sending.** Every transaction is simulated first, so reverts surface before gas is spent.
- **Dependencies:** pin exact versions, at least 2 weeks old. Each new dependency needs a reason in the PR and an entry in `IMPLEMENTATION_PLAN.md`.

## 4. Security and keys
- **Burner wallets only.** Never the user's main wallet.
- **No secrets in the repo, logs, CLI output or chat.** Keys come from the Foundry keystore or environment variables; `.env*` files are gitignored.
- **Mainnet transactions need the user's explicit approval for that step.**
- **Alerts never contain links.** Users rely on the link they pinned at onboarding.

## 5. Style
- Code reads like a careful engineer wrote it:
  - small functions and descriptive names
  - comments explain *why*, not *what*
  - no filler, no emojis in code or CLI output
- CLI output is short, consistent and greppable. Exit codes: 0 means ok, 1 an error, 2 a verification mismatch.
- Keep docs short and current. Update `MEMORY.md` when you learn a fact or make a decision.

## 6. Process
- One step of `IMPLEMENTATION_PLAN.md` at a time. Wait for the user's "go" between steps.
- Riskiest unknowns first. When a step reveals new risk, add it to `MEMORY.md` → Open unknowns, and to the plan.
- Commit per step, with a message that names the step number. Never commit generated `out/`, `cache/`, `broadcast/` or `node_modules/`.
