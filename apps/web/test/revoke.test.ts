import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeFunctionData, erc20Abi, type Address } from "viem";
import { isRejection, PartialRevoke, revokeAll, revokeData, type RevokeCall } from "../src/revoke.ts";

const T = "0x1e4a5963abfd975d8c9021ce480b42188849d41d" as Address;
const S = (n: number) => `0x${String(n).repeat(40)}` as Address;
const calls: RevokeCall[] = [1, 2, 3].map((n) => ({ token: T, spender: S(n) }));
const reject = () => Object.assign(new Error("User rejected the request."), { code: 4001 });

test("calldata is approve(spender, 0) and carries the builder-code suffix", () => {
  const suffix = "0xdeadbeef" as const;
  const data = revokeData(S(1), suffix);
  assert.ok(data.endsWith("deadbeef"));
  const decoded = decodeFunctionData({ abi: erc20Abi, data: data.slice(0, 2 + 8 + 128) as `0x${string}` });
  assert.deepEqual([decoded.functionName, decoded.args], ["approve", [S(1), 0n]]);
});

test("a wallet that batches gets one request with one call per approval, and nothing is sent one by one", async () => {
  let sent: { to: Address; data: string }[] = [];
  const single: RevokeCall[] = [];
  const r = await revokeAll(calls, { batch: async (c) => void (sent = c), one: async (c) => void single.push(c) });
  assert.deepEqual(r, { mode: "batch", done: 3 });
  assert.equal(sent.length, 3);
  assert.deepEqual(single, []);
});

test("a wallet without wallet_sendCalls falls back to one approval at a time, with progress", async () => {
  const seen: string[] = [];
  const progress: string[] = [];
  const r = await revokeAll(calls, {
    batch: async () => {
      throw Object.assign(new Error("The method wallet_sendCalls does not exist"), { code: -32601 });
    },
    one: async (c) => void seen.push(c.spender),
    progress: (d, t) => progress.push(`${d}/${t}`),
  });
  assert.deepEqual(r, { mode: "sequential", done: 3 });
  assert.deepEqual(seen, calls.map((c) => c.spender));
  assert.deepEqual(progress.slice(-1), ["3/3"]);
});

test("no batch support at all goes straight to sequential", async () => {
  const seen: string[] = [];
  const r = await revokeAll(calls, { one: async (c) => void seen.push(c.spender) });
  assert.equal(r.mode, "sequential");
  assert.equal(seen.length, 3);
});

test("rejecting the batch in the wallet stops: it does not ask again one by one", async () => {
  let ones = 0;
  await assert.rejects(
    revokeAll(calls, { batch: async () => { throw reject(); }, one: async () => void ones++ }),
    (e: unknown) => e instanceof PartialRevoke && e.done === 0 && e.mode === "batch",
  );
  assert.equal(ones, 0);
});

test("a failure in the middle of the sequence says how many were revoked", async () => {
  let n = 0;
  await assert.rejects(
    revokeAll(calls, { one: async () => { if (++n === 2) throw reject(); } }),
    (e: unknown) => e instanceof PartialRevoke && e.done === 1 && e.total === 3 && /1 of 3 revoked/.test(e.message),
  );
});

test("rejection is recognised through wrapped errors", () => {
  assert.equal(isRejection(reject()), true);
  assert.equal(isRejection(Object.assign(new Error("wrapped"), { cause: reject() })), true);
  assert.equal(isRejection(Object.assign(new Error("x"), { code: -32601 })), false);
});

test("nothing to revoke does nothing", async () => {
  assert.deepEqual(await revokeAll([], { one: async () => assert.fail("no call expected") }), { mode: "sequential", done: 0 });
});
