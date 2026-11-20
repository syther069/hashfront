// Hashfront release-policy circuit v1.
//
// Input bits (LSB-first, packed in one byte):
//   bit0 a1      maintainer 1 approved this manifest
//   bit1 a2      maintainer 2 approved
//   bit2 a3      maintainer 3 approved
//   bit3 t       timelock has passed
//   bit4 f       release channel is frozen
// Output bit0: allow
//
//   allow = NOT f AND ( (t AND twoOf(a1,a2,a3)) OR (a1 AND a2 AND a3) )
//
// The 3-of-3 branch is the hotfix path: unanimous approval skips the timelock.
// Freeze always wins.

import { Netlist } from "./tap02.ts";

export const POLICY_INPUTS = ["a1", "a2", "a3", "timelockPassed", "frozen"] as const;
export const N_IN = POLICY_INPUTS.length;
export const N_OUT = 1;

export function buildPolicy(): Netlist {
  const n = new Netlist(N_IN);
  const a1 = n.input(0);
  const a2 = n.input(1);
  const a3 = n.input(2);
  const t = n.input(3);
  const f = n.input(4);

  const a12 = n.and(a1, a2);
  const a13 = n.and(a1, a3);
  const a23 = n.and(a2, a3);
  const two = n.or(n.or(a12, a13), a23);
  const all = n.and(a12, a3);
  const normal = n.and(t, two);
  const ok = n.or(normal, all);
  n.andAsOutput(ok, n.not(f)); // final record = the single output
  return n;
}

/** Plain-JS specification used to check the circuit on every input. */
export function policySpec(bits: number): boolean {
  const a1 = !!(bits & 1), a2 = !!(bits & 2), a3 = !!(bits & 4);
  const t = !!(bits & 8), f = !!(bits & 16);
  const approvals = +a1 + +a2 + +a3;
  return !f && ((t && approvals >= 2) || approvals === 3);
}

/** Human-readable row for the public truth table. */
export function describe(bits: number): string {
  const who = [1, 2, 3].filter((_, i) => bits & (1 << i)).map((i) => `M${i}`);
  const parts = [
    who.length ? `approved by ${who.join(", ")}` : "no approvals",
    bits & 8 ? "timelock passed" : "timelock not passed",
    bits & 16 ? "FROZEN" : "not frozen",
  ];
  return parts.join(" · ");
}
