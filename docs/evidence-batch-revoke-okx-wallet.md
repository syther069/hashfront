# Evidence: "Revoke all risky" with a real OKX Wallet (Nov 26, 2026)

Task C1 was tested with a mock wallet on an anvil fork. This is the first test with the real thing.

| | |
|---|---|
| Page | https://hashfront-status.vercel.app ("Am I affected?") |
| Wallet | OKX Wallet (browser extension), a burner account; the address is shown on the screenshots as `0x51c7…488c` |
| Network | X Layer (chain 196) |
| Setup | two small `approve` calls on the bridged USDT token to two dummy addresses (`0x1111…1111`, `0x2222…2222`), made from OKLink "Write contract" |
| Batch transaction | [`0xbe050e2c…41d4ce5`](https://www.oklink.com/xlayer/tx/0xbe050e2cc6399b59360823ed2e2df71e0728a803b08176afcd0e6037b41d4ce5), block 76923967, 2026-11-26 11:36:43 UTC |

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

## Checked on chain afterwards (read-only RPC, Nov 26)

| | |
|---|---|
| Batch transaction | `0xbe050e2cc6399b59360823ed2e2df71e0728a803b08176afcd0e6037b41d4ce5`: status success, **type 0x4 (EIP-7702)**, sent by the burner to itself, gas 62,324, fee about 0.00000125 OKB |
| What it did | two `Approval` events on the token, for spender `0x1111…1111` and `0x2222…2222`, each with value **0** |
| Delegation | the transaction carries an authorization list for chain 196 pointing at `0xe40ccb2d94975c51bff0c004efdfd9b3a5796fa4`; the burner's code is now `0xef0100` followed by that address, so **the delegation is still active** |
| Allowances now | `allowance(burner, 0x1111…1111) = 0` and `allowance(burner, 0x2222…2222) = 0` |
| Earlier approvals | two plain `approve` transactions to `0x2222…2222` for 1,000,000,000,000 raw units: [`0x91798d42…5ca0dd`](https://www.oklink.com/xlayer/tx/0x91798d42285df0a2ec03e7e6bb39996b3850342900eb35ac3facdbf25a5ca0dd) (block 76923259) and [`0xbce64b15…252a41`](https://www.oklink.com/xlayer/tx/0xbce64b15e4811f1df6e656e1e66b6a56f6561feca2e571b62c7beed8ee252a41) (block 76923268). The approval to `0x1111…1111` was made before block 76923259 and its hash is not recorded here |

The two hashes handed over for this file were the plain `approve` transactions, not the batch. The batch transaction above was found on chain from the burner's `Approval` events.
