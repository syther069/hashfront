// findSuspects against a fake SiteRegistry: reading the approved files back, the hash check on them, and the diff.
import { test } from "node:test";
import assert from "node:assert/strict";
import { bytesToHex, hexToBytes, type Hex } from "viem";
import type { Context } from "@hashfront/cli/context";
import type { GateInfo } from "@hashfront/cli/gate";
import { CHUNK_SIZE } from "@hashfront/cli/manifest";
import { READ_CONCURRENCY, readReleaseFile } from "../src/chain.ts";
import { sha256, type Fetched, type ReleaseView } from "../src/compare.ts";
import { findSuspects } from "../src/triage.ts";

const enc = (s: string) => new TextEncoder().encode(s);
const ROUTER = "0xA1DA93A3fD135FC83E3B5f69dCb9d73babde5306";
const ATTACKER = "0xBAd0000000000000000000000000000000000Bad";
const REGISTRY = "0x1111111111111111111111111111111111111111";
const CONTAINER = "0x2222222222222222222222222222222222222222";

/** A SiteRegistry that serves `files` (keyed by the staged path) in readRange slices, with an optional delay. */
function fakeContext(gate: string, files: Map<string, Uint8Array>, delayMs = 0) {
  const stats = { inFlight: 0, maxInFlight: 0, reads: 0 };
  const readContract = async (call: { functionName: string; args: readonly unknown[] }) => {
    const path = call.args[1] as string;
    const bytes = files.get(path);
    if (!bytes) throw new Error(`no such file ${path}`);
    if (call.functionName === "fileInfo") return [BigInt(bytes.length), "text/plain", sha256(bytes), 0n, BigInt(Math.ceil(bytes.length / CHUNK_SIZE))];
    stats.reads++;
    stats.maxInFlight = Math.max(stats.maxInFlight, ++stats.inFlight);
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    stats.inFlight--;
    const offset = Number(call.args[2]);
    const len = Number(call.args[3]);
    return bytesToHex(bytes.slice(offset, offset + len));
  };
  const ctx = { gate, publicClient: { readContract } } as unknown as Context;
  const info = { registry: REGISTRY, container: CONTAINER } as unknown as GateInfo;
  return { ctx, info, stats };
}

const staged = (id: number, rel: string) => `releases/v${id}/${rel}`;

test("a large approved file is read back in order, with several ranges in flight at once", async () => {
  const big = enc(Array.from({ length: 20 * CHUNK_SIZE }, (_, i) => String.fromCharCode(97 + (i % 26))).join(""));
  const files = new Map([[staged(2, "assets/app.js"), big]]);
  const { ctx, info, stats } = fakeContext("0x00000000000000000000000000000000000000a1", files, 20);
  const started = Date.now();
  const got = await readReleaseFile(ctx, info, 2n, "assets/app.js");
  const took = Date.now() - started;
  assert.equal(sha256(got), sha256(big), "bytes come back in the right order");
  assert.equal(stats.reads, 20);
  assert.ok(stats.maxInFlight > 1 && stats.maxInFlight <= READ_CONCURRENCY, `in flight: ${stats.maxInFlight}`);
  assert.ok(took < 300, `took ${took} ms; one after the other would be about 400 ms`);
});

function scenario(gate: string, approvedApp: Uint8Array) {
  const index = enc('<script type="module" src="./assets/app.js"></script>');
  const app = enc(`const router = "${ROUTER}";`);
  const live: ReleaseView = {
    id: 2n,
    state: "live",
    files: [
      { path: "index.html", size: index.length, sha256: sha256(index) },
      { path: "assets/app.js", size: app.length, sha256: sha256(app) },
      { path: "logo.png", size: 4, sha256: sha256(enc("png!")) },
    ],
  };
  const files = new Map([
    [staged(2, "index.html"), index],
    [staged(2, "assets/app.js"), approvedApp],
  ]);
  return { live, ...fakeContext(gate, files) };
}

test("the attacker's address is found in a bundle the approved release does not list", async () => {
  const { live, ctx, info } = scenario("0x00000000000000000000000000000000000000b1", enc(`const router = "${ROUTER}";`));
  const hijackJs = enc(`const router = "${ROUTER}"; const spender = "${ATTACKER}";`);
  const served = new Map<string, Fetched>([["index.html", { ok: true, bytes: enc('<script type="module" src="./assets/hijack-xyz.js"></script>'), finalUrl: "https://x/" }]]);
  const fetchImpl = (async (url: string) => (url.endsWith("/assets/hijack-xyz.js") ? new Response(hijackJs) : new Response("no", { status: 404 }))) as unknown as typeof fetch;
  const found = await findSuspects({ ctx, info, live, served, diffs: [{ path: "index.html", kind: "changed", expected: sha256(enc("x")) }], site: new URL("https://hashswap.example/"), fetch: { fetchImpl } });
  assert.deepEqual(found, [ATTACKER]);
});

test("approved bytes that do not hash to the approved value are refused, never used as evidence", async () => {
  // the registry hands back a bundle that was changed after approval: its hash no longer matches the manifest's
  const tampered = enc(`const router = "${ROUTER}"; const spender = "${ATTACKER}";`);
  const { live, ctx, info } = scenario("0x00000000000000000000000000000000000000c1", tampered);
  const served = new Map<string, Fetched>([["index.html", { ok: true, bytes: enc("<html></html>"), finalUrl: "https://x/" }]]);
  await assert.rejects(
    findSuspects({ ctx, info, live, served, diffs: [], site: new URL("https://hashswap.example/") }),
    /assets\/app\.js read from the registry does not match the approved hash/,
  );
});

test("hex helpers round-trip (guards the fake itself)", () => {
  const b = enc("hello");
  assert.deepEqual(hexToBytes(bytesToHex(b) as Hex), b);
});
