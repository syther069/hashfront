// The release policy, evaluated in the browser from the netlist the processor actually stores, so anyone can see
// every rule the gate enforces without trusting this page's description of it.
import { policySpec } from "@hashfront/circuits/policy";
import { evaluate } from "@hashfront/circuits/tap02";

/** Input names of the Hashfront policy v1 (circuits/src/policy.ts). Other circuits get raw bit names. */
export const POLICY_V1_INPUTS = ["M1", "M2", "M3", "timelock passed", "frozen"];
/** 2^8 rows is still readable; anything wider is not a release policy this page understands. */
export const MAX_INPUTS = 8;

export interface Row {
  bits: number;
  inputs: boolean[];
  allow: boolean;
}

/** True only if the circuit behaves exactly like Hashfront policy v1 on every input, whatever its gates look like. */
export function isPolicyV1(rows: Row[]): boolean {
  return rows.length === 1 << POLICY_V1_INPUTS.length && rows.every((r) => r.allow === policySpec(r.bits));
}

export function inputNames(nIn: number, v1: boolean): string[] {
  return v1 ? POLICY_V1_INPUTS : Array.from({ length: nIn }, (_, i) => `in${i}`);
}

export function truthTable(netlist: Uint8Array, nIn: number, nOut: number): Row[] {
  if (nIn < 1 || nIn > MAX_INPUTS) throw new Error(`the policy circuit has ${nIn} inputs; this page shows up to ${MAX_INPUTS}`);
  if (nOut < 1) throw new Error("the policy circuit has no output");
  const rows: Row[] = [];
  for (let bits = 0; bits < 1 << nIn; bits++) {
    const { outputs } = evaluate(netlist, nIn, nOut, Uint8Array.of(bits));
    rows.push({ bits, inputs: Array.from({ length: nIn }, (_, i) => Boolean(bits & (1 << i))), allow: Boolean((outputs[0] ?? 0) & 1) });
  }
  return rows;
}
