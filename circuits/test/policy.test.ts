import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPolicy, policySpec, N_IN, N_OUT } from "../src/policy.ts";
import { evaluate, Netlist } from "../src/tap02.ts";

test("policy circuit matches the spec on all 32 inputs", () => {
  const n = buildPolicy();
  const bytes = n.bytes();
  for (let bits = 0; bits < 1 << N_IN; bits++) {
    const { outputs, newState } = evaluate(bytes, N_IN, N_OUT, Uint8Array.of(bits));
    assert.equal(outputs.length, 1);
    assert.equal(newState.length, 0, "policy must be combinational (eval, not step)");
    assert.equal((outputs[0] ?? 0) & 1, policySpec(bits) ? 1 : 0, `bits=${bits.toString(2).padStart(5, "0")}`);
  }
});

test("policy is small enough to be cheap", () => {
  const n = buildPolicy();
  assert.ok(n.gateCount <= 40, `gateCount=${n.gateCount}`);
});

test("evaluator matches the live XOR circuit #1 on processor OnlyTestXLayer", () => {
  // Observed on X Layer mainnet (block ~76.25M): circuitInfo(1) = (2 in, 1 out, 0 state, 4 gates)
  // and eval gives 0,1,1,0 for inputs 0..3. A 4-NAND XOR reproduces it.
  const n = new Netlist(2);
  const a = n.input(0), b = n.input(1);
  const m = n.nand(a, b);
  n.nandRaw(n.nand(a, m), n.nand(b, m));
  assert.equal(n.gateCount, 4);
  const got = [0, 1, 2, 3].map((x) => evaluate(n.bytes(), 2, 1, Uint8Array.of(x)).outputs[0]);
  assert.deepEqual(got, [0, 1, 1, 0]);
});

test("latch delays by one beat", () => {
  const n = new Netlist(1);
  // LATCH d = input0  → output is last beat's input
  const bytes = Uint8Array.of(0x01, 0, 0, 2);
  const beat1 = evaluate(bytes, 1, 1, Uint8Array.of(1), Uint8Array.of(0));
  assert.equal(beat1.outputs[0], 0);
  assert.equal(beat1.newState[0], 1);
  const beat2 = evaluate(bytes, 1, 1, Uint8Array.of(0), beat1.newState);
  assert.equal(beat2.outputs[0], 1);
  void n;
});
