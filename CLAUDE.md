# Hashfront: start here

1. **Plan:** the open tasks are in `docs/PLAN-fixes.md` (from the Nov 27 judge review). `docs/PLAN-10of10.md` still holds the codebase map and the rules. Read it first and follow its task order. It has the codebase map, so don't read the whole repo.
2. **Rules:** follow `RULES.md` and section 0 of the plan:
   - commits authored by `syther069` only, with no Claude attribution anywhere
   - no mainnet transaction without the user's "go"
   - never touch secrets
   - only our own domains
3. **Facts:** verified addresses and findings are in `MEMORY.md`. Open it only when a task points to it.
4. **Commands:** `AGENTS.md` lists them all. Run the baseline gate before every PR.
5. **Working style:**
   - reply to the user in Hinglish, short and step by step
   - one branch and one PR per task
   - keep the task statuses in the plan file up to date
