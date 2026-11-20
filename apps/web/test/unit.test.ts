import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPolicy, N_IN, N_OUT, policySpec } from "@hashfront/circuits/policy";
import { resolveTarget } from "../src/config.ts";
import { isPolicyV1, truthTable } from "../src/truthTable.ts";

const GATE = "0x1111111111111111111111111111111111111111";
const EVIL = "0x2222222222222222222222222222222222222222";

test("a baked gate ignores the link's gate, network and rpc", () => {
  const r = resolveTarget(`?gate=${EVIL}&network=local&rpc=http://127.0.0.1:1`, { VITE_GATE: GATE, VITE_NETWORK: "xlayer" });
  assert.ok(r.ok);
  assert.equal(r.target.gate, GATE);
  assert.equal(r.target.chain.id, 196);
  assert.deepEqual(r.target.rpcUrls, ["https://rpc.xlayer.tech", "https://xlayerrpc.okx.com"]);
});

test("without a baked gate, a link may pick the gate but not a mainnet RPC", () => {
  const ok = resolveTarget(`?gate=${GATE}`, {});
  assert.ok(ok.ok);
  assert.equal(ok.target.chain.id, 196);
  const evilRpc = resolveTarget(`?gate=${GATE}&network=xlayer&rpc=https://evil.example`, {});
  assert.equal(evilRpc.ok, false);
  const remoteLocal = resolveTarget(`?gate=${GATE}&network=local&rpc=https://evil.example`, {});
  assert.equal(remoteLocal.ok, false);
  const local = resolveTarget(`?gate=${GATE}&network=local&rpc=http://127.0.0.1:8545`, {});
  assert.ok(local.ok);
  assert.deepEqual(local.target.rpcUrls, ["http://127.0.0.1:8545"]);
});

test("bad input is an error message, not a crash", () => {
  assert.equal(resolveTarget("", {}).ok, false);
  assert.equal(resolveTarget("?gate=0x123", {}).ok, false);
  assert.equal(resolveTarget(`?gate=${GATE}&network=mainnet`, {}).ok, false);
});

test("the browser truth table of the policy netlist equals the policy spec on every row", () => {
  const rows = truthTable(buildPolicy().bytes(), N_IN, N_OUT);
  assert.equal(rows.length, 32);
  for (const r of rows) assert.equal(r.allow, policySpec(r.bits), `bits ${r.bits}`);
  assert.throws(() => truthTable(new Uint8Array(), 9, 1), /up to 8/);
});

test("the v1 policy label is earned by behaviour: one differing row makes it a custom policy", () => {
  const rows = truthTable(buildPolicy().bytes(), N_IN, N_OUT);
  assert.equal(isPolicyV1(rows), true);
  const weaker = rows.map((r) => (r.bits === 0b00001 ? { ...r, allow: true } : r)); // one maintainer would suffice
  assert.equal(isPolicyV1(weaker), false);
});
