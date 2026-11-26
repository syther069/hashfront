import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { drainOkxMetrics, okxMetrics, OkxClient, OkxError, resetOkxMetrics } from "../src/client.ts";

const CREDS = { apiKey: "test-api-key-123", secretKey: "test-secret-xyz", passphrase: "test-pass-!@#" };
const ok = (data: unknown) => new Response(JSON.stringify({ code: "0", msg: "", data }), { status: 200 });
const client = (f: typeof fetch, attempts = 3) => new OkxClient(CREDS, { fetch: f, sleep: async () => {}, attempts });

beforeEach(() => resetOkxMetrics());

test("a successful call is recorded with its path (no query), duration and attempt count", async () => {
  const c = client((async () => ok([])) as unknown as typeof fetch);
  await c.get("/api/v6/test/endpoint", { address: "0xsecretquery", apiKeyLike: "abc" });
  const [call, ...rest] = okxMetrics();
  assert.equal(rest.length, 0);
  assert.equal(call?.path, "/api/v6/test/endpoint");
  assert.equal(call?.ok, true);
  assert.equal(call?.attempts, 1);
  assert.ok((call?.ms ?? -1) >= 0);
  assert.doesNotMatch(JSON.stringify(call), /secretquery|abc|test-api-key|test-secret/, "no query value or credential is kept");
});

test("retries count as one call with its attempts; a 5xx that never recovers is recorded as failed with the status", async () => {
  let n = 0;
  const c = client((async () => (++n < 3 ? new Response("{}", { status: 503 }) : ok([1]))) as unknown as typeof fetch);
  await c.get("/p");
  assert.deepEqual(okxMetrics().map((m) => [m.ok, m.attempts]), [[true, 3]]);

  resetOkxMetrics();
  const down = client((async () => new Response("{}", { status: 503 })) as unknown as typeof fetch, 2);
  await assert.rejects(down.get("/p"), OkxError);
  assert.deepEqual(okxMetrics().map((m) => [m.ok, m.status, m.attempts]), [[false, 503, 2]]);
});

test("an OKX error code is a failed call too, and drain returns each call once", async () => {
  const bad = client((async () => new Response(JSON.stringify({ code: "50011", msg: "rate" }), { status: 200 })) as unknown as typeof fetch);
  await assert.rejects(bad.get("/p"), OkxError);
  assert.equal(drainOkxMetrics().length, 1);
  assert.equal(drainOkxMetrics().length, 0, "already drained");
  assert.equal(okxMetrics().length, 1, "the ring keeps history");
});

test("the ring keeps only the most recent calls", async () => {
  const c = client((async () => ok([])) as unknown as typeof fetch);
  for (let i = 0; i < 520; i++) await c.get(`/p${i}`);
  const all = okxMetrics();
  assert.equal(all.length, 500);
  assert.equal(all[0]?.path, "/p20");
});
