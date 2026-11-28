# Protect your frontend with Hashfront in about 15 minutes

For a team that already ships a static frontend (for example a TapeOut / DeWEB project with a normal domain too). At the end you have:

- a **release gate** on X Layer: a new frontend release goes live only when your maintainers approve it through the TapeOut policy circuit
- a **verified copy** of your approved release on DeWEB, which nobody can change
- a **watcher** that compares your normal domain with that release every 30 s, and alerts on Telegram and on chain (TapeSend) when they differ
- a **status badge** for your site

The 15 minutes assume the wallets and the OKB below are ready. Everything runs from a clone of this repo.

## What it costs (read this first)

Measured with the `init` simulation on a local fork of X Layer mainnet (Nov 28, 2026, nothing sent):

```text
pre-flight: apps/demo-dapp/dist is a static build that works on DeWEB (3 files, 39,415 bytes)
cost: 0.08196 OKB in TapeOut fees (gate mint + policy circuit tape-out + site container) plus gas (about 0.0001 OKB)
simulating (no transaction is sent; add --broadcast to deploy): forge script script/DeployXLayer.s.sol ...
Script ran successfully.
  GATE=0xaA4B…DF1A   POLICY_ID=12   CONTAINER=0xEF50…17DC   URL=https://12-2-409.tapekit.org/
Estimated total gas used for script: 5246106
Estimated amount required: 0.000209844245246106 ETH
simulation passed. Re-run with --broadcast to deploy.
```

| Item | OKB | When |
|---|---|---|
| TapeOut fees: gate mint, policy circuit tape-out, site container | about 0.082 | once |
| Gas for the deployment | about 0.0002 | once |
| Uploading one release (about 40 KB) | about 0.0002 | per release |
| One onchain alert | about 0.000005 | per incident |

Fees are read live from the chain when you run `init`, so run the simulation yourself first (step 2). It shows your exact number.

**Your existing DeWEB site is not reused.** `init` creates a new circuit and a new site container (`<id>-2-409.tapekit.org`) that only the release gate can write to. Your current DeWEB site stays as it is.

## What you need

| | Why |
|---|---|
| Node 24, Foundry (`forge`, `cast`, `anvil`), git | the CLI is plain TypeScript, the deploy is a Foundry script |
| A static build of your frontend (`dist/`) | it is hashed and stored byte for byte; `hashfront preflight dist` checks it |
| 3 maintainer addresses | they approve releases (2 of 3 + timelock, or 3 of 3 at once) |
| 1 uploader address | proposes and uploads releases (your CI, or you) |
| 1 reporter address with a little OKB | the watcher's key; it can only send the fixed-text alerts |
| A deployer Foundry keystore with about 0.083 OKB | pays the fees above (`cast wallet import deployer --interactive`) |
| Optional: a Telegram bot token and chat id | for alerts in your group |

Keep keys in Foundry keystores. The CLI never takes a private key on the command line.

## Steps

**1. Clone and check (2 min)**

```powershell
git clone https://github.com/syther069/hashfront.git
cd hashfront
npm ci
node packages/cli/src/main.ts preflight <path-to-your-dist>
```

**2. Simulate the setup and read the cost (2 min).** Nothing is sent without `--broadcast`:

```powershell
node packages/cli/src/main.ts init --site https://app.yourprotocol.xyz/ --name YourProtocol --maintainers 0xM1,0xM2,0xM3 --uploader 0xUP --reporter 0xREP --timelock 24h --build <path-to-your-dist> --account deployer
```

**3. Deploy (3 min).** The same command with `--broadcast`. On mainnet it shows the fees again and asks you to type `DEPLOY`. It writes `hashfront.json` and prints your gate, your verified link, the badge snippet and the watcher command. It refuses to deploy twice for the same site.

**4. Release your current build (5 min).** As the uploader, then each maintainer:

```powershell
node packages/cli/src/main.ts manifest <path-to-your-dist> --out manifests/v1.json
node packages/cli/src/main.ts propose --manifest manifests/v1.json --gate <gate> --account uploader
node packages/cli/src/main.ts approve --id 1 --manifest manifests/v1.json --gate <gate> --account m1   # m2, m3 too
node packages/cli/src/main.ts upload --id 1 --manifest manifests/v1.json <path-to-your-dist> --gate <gate> --account uploader
node packages/cli/src/main.ts seal --id 1 --manifest manifests/v1.json --gate <gate> --account uploader
node packages/cli/src/main.ts activate --id 1 --gate <gate> --account uploader
```

With 3 of 3 approvals the release can go live right away. With 2 of 3 it waits for the timelock. Maintainers can also approve from a browser with OKX Wallet on the approve page.

**5. Start the watcher (2 min).** Run the command `init` printed, with the reporter key in the environment:

```powershell
node packages/watcher/src/main.ts --site https://app.yourprotocol.xyz/ --gate <gate> --network xlayer --manifests ./manifests --state signals.json --name YourProtocol --alert-state alerts.json --tapesend-to self --alerts-mainnet --telegram-chat=<chat id>
```

It prints one JSON line per check. `MATCH` means your domain serves the approved release. Without a server, use `packages/watcher/templates/hashfront-watch.yml` (GitHub Actions, one check every 5 min).

**6. Add the badge (1 min).** Build the status page with your gate (`VITE_GATE=<gate> VITE_NETWORK=xlayer npm run build -w apps/web`), host `apps/web/dist` on any static host, and paste the `<iframe>` snippet `init` printed into your site.

## Limits to know before you start

- The watcher checks from one network. It catches a changed site, not a hijacker who serves the real page to that one network only.
- Certificate Transparency is best effort: in our 8 h run the public CT APIs were unavailable in 72 % of checks.
- The Hashfront Guard browser extension currently protects only the Hashfront demo site. A list of protected sites is planned (F10).
- The contracts are not audited.

## Get help

Open an issue at https://github.com/syther069/hashfront/issues, or ask in the TapeOut hackathon Telegram. With your permission we list you under "Protected projects" in the README, with your status badge.
