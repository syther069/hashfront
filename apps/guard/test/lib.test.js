"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { decide, safeSuspects, sha256Hex } = require("../lib.js");

const SITE = "https://hashswap-demo.vercel.app";
const ROOT = "0x" + "ab".repeat(32);
const ok = { site: SITE, status: "ok", rootHash: ROOT, suspects: [] };

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

test("warn (an open alert on a site that matches) never blocks; a different page under warn still does", () => {
  assert.deepEqual(decide({ ...ok, status: "warn" }, SITE, ROOT), { block: false, reason: "warn" });
  assert.deepEqual(decide({ ...ok, status: "warn" }, SITE, null), { block: false, reason: "warn" });
  assert.deepEqual(decide({ ...ok, status: "warn" }, SITE, "0x" + "cd".repeat(32)), { block: true, reason: "hash" });
});

test("an open alert on a site the server could not verify (unknown) still shows the banner, and the hash check stays off", () => {
  assert.deepEqual(decide({ ...ok, status: "unknown", alertOpen: true }, SITE, null), { block: false, reason: "warn" });
  assert.deepEqual(decide({ ...ok, status: "unknown", alertOpen: true }, SITE, "0x" + "cd".repeat(32)), { block: false, reason: "warn" });
  assert.deepEqual(decide({ ...ok, status: "unknown", alertOpen: false }, SITE, null), { block: false, reason: "unknown" });
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
