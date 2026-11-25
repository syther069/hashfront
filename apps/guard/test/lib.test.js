"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { isSigningRequest, decide, safeSuspects, sha256Hex } = require("../lib.js");

const SITE = "https://hashswap-demo.vercel.app";
const ROOT = "0x" + "ab".repeat(32);
const ok = { site: SITE, status: "ok", rootHash: ROOT, suspects: [] };

test("only requests that sign or send are filtered; reads and account requests pass", () => {
  for (const m of ["eth_sendTransaction", "personal_sign", "eth_signTypedData_v4", "wallet_sendCalls", "eth_sign"]) assert.equal(isSigningRequest(m), true, m);
  for (const m of ["eth_chainId", "eth_accounts", "eth_requestAccounts", "eth_call", "wallet_switchEthereumChain", "eth_getBalance", undefined, 5]) assert.equal(isSigningRequest(m), false, String(m));
});

test("an open alert blocks; an ok feed with the same hash does not", () => {
  assert.deepEqual(decide({ ...ok, status: "alert" }, SITE, ROOT), { block: true, reason: "alert" });
  assert.deepEqual(decide(ok, SITE, ROOT), { block: false, reason: "ok" });
});

test("the independent hash check blocks when this browser got a different page than the approved one", () => {
  assert.deepEqual(decide(ok, SITE, "0x" + "cd".repeat(32)), { block: true, reason: "hash" });
});

test("hash differences do not count while the feed is unknown (host behind, CDN), or when the page could not be hashed", () => {
  assert.equal(decide({ ...ok, status: "unknown" }, SITE, "0x" + "cd".repeat(32)).block, false);
  assert.equal(decide(ok, SITE, null).block, false);
});

test("a missing feed, a feed for another site, or garbage never blocks", () => {
  assert.equal(decide(null, SITE, ROOT).block, false);
  assert.equal(decide(ok, "https://other.example", ROOT).reason, "other-site");
  assert.equal(decide({ status: "alert" }, SITE, ROOT).block, false);
  assert.equal(decide("alert", SITE, ROOT).block, false);
});

test("sha256Hex matches the 0x-prefixed notation of the manifest", async () => {
  assert.equal(await sha256Hex(new TextEncoder().encode("abc")), "0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("suspects from the feed are shown only when they look like addresses, at most 5", () => {
  const a = "0xBAd0000000000000000000000000000000000Bad";
  assert.deepEqual(safeSuspects({ suspects: [a, "<img src=x>", "0x123", 7, a, a, a, a, a] }), [a, a, a, a, a]);
  assert.deepEqual(safeSuspects(null), []);
});
