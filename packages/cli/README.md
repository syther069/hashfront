# hashfront CLI

Release a static frontend through Hashfront: every release is approved by maintainers, stored on TapeOut DeWEB, and goes live only when the policy circuit on X Layer allows it. Run it from a clone of this repository (Node ≥ 22.18 and Foundry are needed):

```bash
npm install
alias hashfront="node $PWD/packages/cli/src/main.ts"
```

## 1. Set up (about 15 minutes)

1. **Check your build.** Hashfront serves it from your normal host at `/` and from DeWEB under `/releases/v<n>/`. It must use relative paths (Vite: `base: "./"`), have an `index.html` at the root, and contain no server code.

   ```bash
   hashfront preflight dist
   ```

2. **Prepare the keys.**
   - **Maintainers:** three wallets, any 2 of which approve a release.
   - **Uploader:** the CI key that proposes and uploads. It can never approve.
   - **Reporter:** the watcher key that sends alerts.
   - **Deployer:** a Foundry keystore funded with about 0.09 OKB. Create it with:

   ```bash
   cast wallet import hashfront-deployer --interactive
   ```

3. **Deploy.** Without `--broadcast` this only simulates. With it, mainnet asks you to type `DEPLOY`, and forge asks for the keystore password.

   ```bash
   hashfront init --site https://app.example.org --name Example \
     --maintainers 0xM1,0xM2,0xM3 --uploader 0xCI --reporter 0xWATCHER \
     --timelock 24h --build dist --account hashfront-deployer --broadcast
   ```

   It writes `hashfront.json` and prints:
   - the gate address
   - the **verified link** to pin (`https://<id>-2-409.tapekit.org/`)
   - the badge snippet and the status page build command (`VITE_GATE=… npm run build -w apps/web`)
   - the watcher command and the CI settings

   The cost is the live TapeOut fees (about 0.082 OKB for a new policy circuit and its container, printed before anything is sent) plus gas. A finished deployment is never repeated for the same site.

## 2. Release

| Who | Command |
|---|---|
| CI (uploader) | `hashfront manifest dist` → `hashfront propose --manifest manifest.json --id-file release-id.txt` |
| 2 maintainers | review on the status page (`#/approve/<id>`), or run `hashfront approve --id <n> --manifest manifest.json` |
| CI (uploader) | `hashfront upload --id <n> --manifest manifest.json dist` → `hashfront seal …` (starts the timelock) |
| anyone | `hashfront activate --id <n>` once the policy allows it (2 of 3 after the timelock, or 3 of 3 at once) |
| CI | `hashfront wait-active --id <n> --exact`, then deploy **the same bytes** to the normal host |

Any maintainer can `cancel` a release or `freeze` the channel; `status` shows everything.

## 3. GitHub Action

Copy [`templates/hashfront-release.yml`](templates/hashfront-release.yml) to `.github/workflows/`. Then:

- Set `HASHFRONT_REPO`/`HASHFRONT_REF` to a reviewed commit of this repository.
- Set `BUILD_COMMAND`, `BUILD_DIR` and `DEPLOY_COMMAND` for your project.
- Add the secret `HASHFRONT_PRIVATE_KEY` (the uploader key) and the variable `HASHFRONT_GATE`.

It runs in three stages:

1. **propose:** runs on a version tag.
2. **publish:** run it manually after 2 approvals.
3. **go-live:** run it manually after the timelock.

Each later stage reuses the exact build from the propose run, so your host serves the bytes the maintainers approved.

## Environment

| Variable | Meaning |
|---|---|
| `HASHFRONT_PRIVATE_KEY` | signer for write commands (never pass keys as flags) |
| `HASHFRONT_GATE` | default gate address |
| `HASHFRONT_RPC_URL` | RPC override |
| `HASHFRONT_BUILDER_CODE` | X Layer Builder Code, appended to every transaction (ERC-8021) |
