# Release policy circuit: use it in your project

Hashfront's release rule is a TapeOut circuit. It is a 22-gate NAND netlist (TAP-02), stored on X Layer and evaluated by the TapeOut processor. Anyone can read it and run it.

| | |
|---|---|
| Processor | TapeOut processor #409, [`0x39E44DbA62811E87fDe122CA4d6c082568a384D0`](https://www.oklink.com/xlayer/address/0x39E44DbA62811E87fDe122CA4d6c082568a384D0) (X Layer, chain 196) |
| Circuit | #4, held by Hashfront's ReleaseGate [`0xAF96…80F6`](https://www.oklink.com/xlayer/address/0xAF96CA14DB35420BF46b6Ab8feB513306B7D80F6) |
| Netlist | [`out/policy.json`](out/policy.json) (`hashfront-release-policy-v1`), built by `npm run build -w circuits` from [`src/policy.ts`](src/policy.ts). The stored netlist is byte-identical to this file. |
| Shape | 5 inputs, 1 output, no state, 22 gates |

## Inputs and output

The inputs are packed into one byte, LSB first, the same order as `ReleaseGate.policyBits`:

| Bit | Name | Meaning |
|---|---|---|
| 0 | `a1` | maintainer 1 approved this exact build |
| 1 | `a2` | maintainer 2 approved |
| 2 | `a3` | maintainer 3 approved |
| 3 | `timelockPassed` | the release was sealed at least the timelock ago |
| 4 | `frozen` | a maintainer froze releases |

```text
allow = NOT frozen AND ((timelockPassed AND 2 of 3 approved) OR 3 of 3 approved)
```

Output bit 0 is `allow`. All 32 cases are in [`out/truth-table.md`](out/truth-table.md). Unanimous approval is the hotfix path and skips the timelock. A freeze always wins.

## Evaluate it yourself

From any address, with nothing deployed:

```powershell
cast call 0x39E44DbA62811E87fDe122CA4d6c082568a384D0 "eval(uint256,bytes)(bytes)" 4 0x0b --rpc-url https://rpc.xlayer.tech
```

`0x0b` is `a1 + a2 + timelockPassed`, so the answer is `0x01` (allow). `0x07` (all three, no timelock) also gives `0x01`, and `0x17` (all three, frozen) gives `0x00`. The status page runs all 32 rows in the browser against the stored netlist and cross-checks them with the gate.

`contracts/test/fork/PolicyReuse.t.sol` proves this on a fork of X Layer mainnet. An unrelated address reads `netlist(4)` and `circuitInfo(4)`, and evaluates all 32 inputs, which all match the spec.

## Reusing it in your project: what works today and what doesn't

| You want to | Today |
|---|---|
| **Use the same rule in your own contract** (evaluate it, not hold it) | Works. Call `eval(4, bits)` on the processor. It is a public view, so you need no fee and no permission. |
| **Protect your site with Hashfront** | Run `hashfront init` ([`docs/onboarding-15min.md`](../docs/onboarding-15min.md)). It tapes out **your own copy** of this netlist (byte-identical, checked on all 32 inputs before anything else is spent) and gives your gate its own site container. About 0.082 OKB in TapeOut fees. |
| **Reuse a circuit you already own** | `init --policy-id <n>` works only if that circuit is an unused copy of this policy. The deploy script refuses any other netlist. Your existing DeWEB site's circuit is a different program, so it can't be reused. |
| **Point a second gate at circuit #4** | Doesn't work. The deployed gate uses one circuit for three jobs: the policy it evaluates, the site container it writes, and its TapeSend identity. Only the holder (our gate) can do the last two. The fork test shows that a non-holder can't send as the container. |
| **Swap the policy of a live gate** | Doesn't work. `policyId` is immutable in the deployed gate, which is not redeployed (redeploying costs about 0.082 OKB). The only way out is a 3-of-3 `voteMigrate` to a new gate. |

**v2 design (not built):** split the two roles. The gate would hold its **site token** for the container and TapeSend, and keep a separate **policy circuit id** that only evaluates. That id would be changeable by a 3-of-3 maintainer vote behind the same timelock. Many gates could then share one audited policy circuit, such as #4 or a "3 of 3 for hotfixes only" variant, and a team could switch policy without moving its site.
