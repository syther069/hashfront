# Runbook: deploying Hashfront (plan steps 4 and 5)

`contracts/script/DeployXLayer.s.sol` does the whole deployment in one run:
1. Reuses the policy circuit from step 3 (`POLICY_ID`), or tapes out a new one, and checks all 32 inputs live.
2. Opens the container if needed and binds `<id>.2.409.tape`.
3. Removes the step 3 probe files.
4. Deploys `ReleaseGate` (with the TapeSend hub and reporter), checks its wiring, then hands it the circuit NFT.
5. Writes the addresses to `DEPLOYMENTS_FILE`.

## 1. Rehearse on a local fork (free, any time)
Run this from `contracts/`. It needs `wallet-addresses.txt`, anvil and Git Bash.
```bash
bash script/rehearse-deploy.sh
```
- It forks X Layer mainnet locally, gives the deployer 0.1 test OKB **on the fork only**, and impersonates it. No key or password is used.
- It then runs `ProbeTapeKit` → `DeployXLayer` with `POLICY_ID`, which is the real mainnet order, and sends one alert through the real TapeSend hub.
- It must print three `ok` lines.
- Output goes to `deployments/rehearsal.json` (gitignored), never `deployments/xlayer.json`.
- Measured Nov 19: step 3 costs 0.08199 OKB; steps 4–5 plus one alert cost 0.00001 OKB.

## 2. Mainnet (task M, only after you say "go")
Before you start:
- Run `docs/RUNBOOK-step3.md` first.
- Decide the timelock.
- Choose a reporter address: the watcher's hot key. Use a separate burner, not the deployer.

Then run this from `contracts/`, in PowerShell:
```bash
$env:MAINTAINERS="<m1>,<m2>,<m3>"; $env:UPLOADER="<deployer>"; $env:REPORTER="<reporter>"; $env:TIMELOCK="<seconds>"; $env:POLICY_ID="<id from step 3>"; $env:DEPLOYMENTS_FILE="deployments/xlayer.json"
forge script script/DeployXLayer.s.sol --rpc-url xlayer --account hashfront-deployer
forge script script/DeployXLayer.s.sol --rpc-url xlayer --account hashfront-deployer --broadcast
```
- The first command is a simulation, and it must end without errors.
- The second sends the transactions. The NFT transfer at the end is **permanent**: only a 3-of-3 `voteMigrate` can move the site again.

## Alerts and gas
`alert()` reserves 400k gas for each TapeSend delivery and reverts with `AlertGas` if less is available.
- **Why:** without this, a gas estimate settles on a limit where the hub call fails inside `try/catch` and only the event lands. The fork rehearsal hit exactly that.
- **Size:** a real alert to one recipient uses about 264k gas (219k before `lastAlert` storage was added in task F).

## Status page deploy (Vercel)

```powershell
pwsh scripts/deploy-status.ps1 -NoDeploy   # build with the gate baked in, check it, copy; deploys nothing
pwsh scripts/deploy-status.ps1             # the same, then deploy to production and probe /api/status
```

The page must be built with `VITE_GATE` and `VITE_NETWORK`, or it silently becomes the generic page that takes the gate from the link; the script sets them from the config and refuses to deploy if the gate is not in the bundle. The destination folder (default `..\..\deploy\hashfront-status`, outside this repo) must already be a linked Vercel project (`vercel link` once). The config is `hashfront.json`, or the tracked `hashfront.example.json` (the public values of the live deployment) on a fresh clone.
