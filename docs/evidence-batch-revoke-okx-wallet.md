# Evidence: "Revoke all risky" with a real OKX Wallet (Nov 26, 2026)

Task C1 was tested with a mock wallet on an anvil fork. This is the first test with the real thing.

| | |
|---|---|
| Page | https://hashfront-status.vercel.app ("Am I affected?") |
| Wallet | OKX Wallet (browser extension), a burner account; the address is shown on the screenshots as `0x51c7…488c` |
| Network | X Layer (chain 196) |
| Setup | two small `approve` calls on the bridged USDT token to two dummy addresses (`0x1111…1111`, `0x2222…2222`), made from OKLink "Write contract" |
| Transaction | hash to be added from OKLink (the burner's latest transaction) |

## What happened

1. The status page listed both approvals through the OKX Onchain OS approvals API, ranked "plain wallet" (red), next to the protocol's own approval to the router `0xA1DA…5306` ("this protocol", green). The page showed "Revoke all risky (2)".
2. A click on the button made the wallet show a first prompt: **"This DApp interaction requires OKX 7702"**. It says the 7702 protocol "can empower your account but also carries risks", and offers Cancel or "Apply and continue".
3. After "Apply and continue", one confirmation screen listed three transactions: `Transaction 1: 7702 Upgrade`, `Transaction 2: Revoke approval (USDT_Bridged)`, `Transaction 3: Revoke approval (USDT_Bridged)`. Network fee **0.000001 OKB** (under $0.01). One button: "Confirm all".
4. The page then showed **"Revoked 2 approvals in one confirmation."**

## What this shows, and what it does not

- Real OKX Wallet supports EIP-5792 `wallet_sendCalls`, and Hashfront's batch path works with it: one wallet confirmation revoked two approvals.
- The wallet batches through an **EIP-7702 account upgrade**, with its own risk warning. After it, the burner account is delegated. We did not test how to remove the delegation, and we do not claim to know how.
- That prompt may worry a user who is already under stress from a hijack. The page therefore says, under the button, that the upgrade may be requested and that the per-row Revoke button sends a plain `approve(spender, 0)` with no upgrade. That per-row path was not part of this test with the real wallet.
- Use a burner account for this. Do not do it with an account that holds real funds.
- One wallet, one account, one run. It is not a statement about other wallets.

## Not shown here

The transaction hash and the allowance read after the revoke are not in this file yet. Add them from OKLink: the transaction of the batch, and the two allowances reading 0.
