#!/usr/bin/env bash
# Rehearses the real mainnet order (ProbeTapeKit, then DeployXLayer reusing its circuit) on a LOCAL anvil fork
# of X Layer mainnet, then sends one alert through the real TapeSend hub. Nothing is sent to X Layer.
# The deployer is impersonated, so no keystore password is needed and no key is used.
# Usage (from contracts/): bash script/rehearse-deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

ADDRS=../wallet-addresses.txt
[ -f "$ADDRS" ] || { echo "missing $ADDRS (run scripts/create-wallets.ps1 first)"; exit 1; }
addr() { awk -v n="$1" '$1 == n { print $2 }' "$ADDRS"; }
DEPLOYER=$(addr hashfront-deployer)
export MAINTAINERS="$(addr hashfront-m1),$(addr hashfront-m2),$(addr hashfront-m3)"
export UPLOADER=$DEPLOYER REPORTER=$DEPLOYER TIMELOCK=${TIMELOCK:-600}
export DEPLOYMENTS_FILE=deployments/rehearsal.json
RPC=http://127.0.0.1:8545

anvil --fork-url https://rpc.xlayer.tech --port 8545 --silent &
ANVIL=$!
trap 'kill $ANVIL 2>/dev/null || true' EXIT
for _ in $(seq 60); do cast chain-id --rpc-url $RPC >/dev/null 2>&1 && break; sleep 1; done
[ "$(cast chain-id --rpc-url $RPC)" = 196 ] || { echo "anvil fork did not start"; exit 1; }

cast rpc anvil_setBalance "$DEPLOYER" 0x16345785D8A0000 --rpc-url $RPC >/dev/null # 0.1 OKB, fork only
cast rpc anvil_impersonateAccount "$DEPLOYER" --rpc-url $RPC >/dev/null
run() { forge script "$1" --rpc-url $RPC --unlocked --sender "$DEPLOYER" --broadcast --slow 2>&1; }

echo "== step 3: ProbeTapeKit"
OUT=$(run script/ProbeTapeKit.s.sol) || { echo "$OUT" | tail -30; exit 1; }
POLICY_ID=$(echo "$OUT" | sed -n 's/.*POLICY_ID=\([0-9]*\).*/\1/p' | head -1)
echo "policy circuit #$POLICY_ID"
AFTER_PROBE=$(cast balance "$DEPLOYER" --rpc-url $RPC)

echo "== steps 4-5: DeployXLayer (POLICY_ID=$POLICY_ID)"
OUT=$(POLICY_ID=$POLICY_ID run script/DeployXLayer.s.sol) || { echo "$OUT" | tail -30; exit 1; }
echo "$OUT" | grep -E "^ +(GATE|POLICY_ID|CONTAINER|ENDPOINT|NAME|URL|WROTE)="
GATE=$(echo "$OUT" | sed -n 's/.*GATE=\(0x[0-9a-fA-F]*\).*/\1/p' | head -1)
ENDPOINT=$(echo "$OUT" | sed -n 's/.*ENDPOINT=\(0x[0-9a-fA-F]*\).*/\1/p' | head -1)
CONTAINER=$(echo "$OUT" | sed -n 's/.*CONTAINER=\(0x[0-9a-fA-F]*\).*/\1/p' | head -1)

echo "== checks"
SITES=0xd6EFb7adCc9c83dC4924Ad56f6a8E4e969b9ADB6
HUB=0xe61A9C7213a6Aa616C246a2B569e555B417b25ee
[ "$(cast call 0x39E44DbA62811E87fDe122CA4d6c082568a384D0 'ownerOf(uint256)(address)' "$POLICY_ID" --rpc-url $RPC)" = "$GATE" ] && echo "ok  gate holds circuit #$POLICY_ID"
INFO=$(cast call $SITES 'fileInfo(address,string)(uint32,string,bytes32,uint40,uint256)' "$CONTAINER" probe/wallet.html --rpc-url $RPC | head -1)
[ "$INFO" = 0 ] && echo "ok  probe files removed"
BEFORE=$(cast call $HUB 'inboxCount(bytes32)(uint256)' "$ENDPOINT" --rpc-url $RPC)
cast send "$GATE" 'alert(uint8,bytes32,bytes32[])' 1 0x$(printf 'ab%.0s' {1..32}) "[$ENDPOINT]" \
  --from "$DEPLOYER" --unlocked --rpc-url $RPC${ALERT_GAS:+ --gas-limit $ALERT_GAS} --json | grep -o '"\(status\|gasUsed\)":"[^"]*"' | tr '
' ' '; echo
AFTER=$(cast call $HUB 'inboxCount(bytes32)(uint256)' "$ENDPOINT" --rpc-url $RPC)
if [ "$AFTER" = $((BEFORE + 1)) ]; then echo "ok  alert delivered through the real TapeSend hub"; else echo "FAIL alert: inbox $BEFORE -> $AFTER"; exit 1; fi
END=$(cast balance "$DEPLOYER" --rpc-url $RPC)
awk -v a="$AFTER_PROBE" -v e="$END" 'BEGIN { printf "cost on fork: step 3 %.5f OKB, steps 4-5 plus one alert %.5f OKB%s", (1e17 - a) / 1e18, (a - e) / 1e18, ORS }'
