## What
<!-- What changed, in one or two sentences. -->

## Why
<!-- Link the plan ID from docs/PLAN-10of10.md (for example A1) and say Closes #N if an issue exists. -->

## Verified
<!-- Commands you ran and what they printed. Tick only what you actually ran. -->
- [ ] `npm run typecheck && npm test`
- [ ] `cd contracts && forge test --no-match-path "test/fork/*"` (if contracts changed)
- [ ] `npm run build -w apps/web` (if web or API changed)
- [ ] `npm run test:e2e -w packages/watcher` / `npm run test:e2e -w apps/web` (if touched)

## Dependencies
<!-- "None", or: name, exact pinned version, release date (at least 2 weeks old), and the reason. -->
