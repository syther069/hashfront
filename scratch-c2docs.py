def edit(p, pairs):
    s = open(p, encoding="utf8", newline="").read()
    for a, b in pairs:
        assert a in s, (p, a[:70])
        s = s.replace(a, b, 1)
    open(p, "w", encoding="utf8", newline="\n").write(s)

edit("README.md", [
    ("- **Pricing is a hypothesis.**", "- **The guardian pause is an experiment, and fork-only.** `contracts/src/DemoVault.sol` and `--guardian-call` show a protocol letting one narrow key pause its own contract when an incident is confirmed (once per incident; only the owner unpauses). The watcher refuses it on X Layer mainnet, because one false positive pausing a live protocol is a liability. It is not deployed anywhere.\n- **Pricing is a hypothesis.**"),
    ("| `forge test` | 48 (41 without the fork tests) |", "| `forge test` | 57 (50 without the fork tests) |"),
    ("| end-to-end | CLI suites, watcher 7, web 12, Guard 6 |", "| end-to-end | CLI suites, watcher 9, web 12, Guard 6 |"),
    ("| unit (`npm test`) | 179 |", "| unit (`npm test`) | 186 |"),
])
edit("CHANGELOG.md", [
    ("### Changed\n", "- **Guardian pause, fork only (C2).** `DemoVault` (guardian can only pause, only the owner unpauses, both deposit and withdraw stop while paused) and `--guardian-call` / `--guardian-account` in the watcher: one pause per incident, sent through the OKX Gateway path when OKX is configured. Refused on X Layer mainnet. Tested in Foundry (9 tests including a re-entrancy attempt and a fuzz test) and end to end on an anvil fork.\n\n### Changed\n"),
    ("- The guardian pause (C2) is a fork-only experiment and is never deployed on mainnet.\n", "- The guardian pause (C2) is a fork-only experiment: it is not deployed anywhere and the watcher refuses it on mainnet.\n"),
])
edit("AGENTS.md", [
    ("npm run pack:guard  ", "npm run test:e2e -w packages/watcher  # includes guardian.e2e.ts: DemoVault paused once per incident on a fork; the guardian flags are refused on mainnet\nnpm run pack:guard  "),
])
