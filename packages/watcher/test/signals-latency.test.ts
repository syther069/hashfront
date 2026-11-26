// A slow or dead public API (CertSpotter, rdap.org, DoH) must not slow every check or be hammered every 30 s.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import type { DnsResolver, MakeResolver } from "../src/signals/dns.ts";
import type { CertInfo, TlsProbe } from "../src/signals/cert.ts";
import type { FetchLike } from "../src/signals/ct.ts";
import { checkSignals, clearScanCache, type SignalConfig } from "../src/signals/index.ts";

const SITE = new URL("https://app.hashswap.test/");
const ZONE: Record<string, { a?: string[]; ns?: string[] }> = {
  "app.hashswap.test": { a: ["203.0.113.10"] },
  "hashswap.test": { a: ["203.0.113.1"], ns: ["ns1.registrar-dns.example"] },
};
const resolver: MakeResolver = () => {
  const look = (field: "a" | "ns") => async (host: string) => {
    const v = ZONE[host]?.[field];
    if (!v) throw Object.assign(new Error("ENODATA"), { code: "ENODATA" });
    return v;
  };
  const r: DnsResolver = { resolve4: look("a"), resolve6: look("a"), resolveCname: look("a"), resolveNs: look("ns") };
  return r;
};
const CERT: CertInfo = { fingerprint256: "AA", issuer: "Let's Encrypt", subject: "app.hashswap.test", validFrom: "2026-09-01T00:00:00.000Z", validTo: "2026-12-01T00:00:00.000Z", authorized: true };
const tls: TlsProbe = async () => CERT;

beforeEach(() => clearScanCache());

/** A public API that never answers in time: fails after `ms`, and counts how often it was asked. */
function slowDown(ms: number) {
  const calls = { n: 0 };
  const f: FetchLike = async () => {
    calls.n++;
    await new Promise((r) => setTimeout(r, ms));
    return { ok: false, status: 503, json: async () => ({}) };
  };
  return { f, calls };
}

const cfg = (ct: FetchLike, registry: FetchLike, now?: () => number): SignalConfig => ({
  dnsServers: ["r1"],
  scan: false,
  deps: { resolver, tls, ctFetch: ct, registryFetch: registry, ...(now ? { now } : {}) },
});

test("CT and the registry wait together, not one after the other", async () => {
  // CT tries CertSpotter and then crt.sh (2 x 150 ms); the registry asks RDAP and DoH at once (150 ms)
  const ct = slowDown(150);
  const registry = slowDown(150);
  const started = Date.now();
  const r = await checkSignals(SITE, true, cfg(ct.f, registry.f));
  const took = Date.now() - started;
  assert.ok(took < 420, `took ${took} ms; one after the other would be about 450 ms`);
  assert.equal(r.ct?.level, "info");
  assert.equal(r.registry?.level, "info");
  assert.equal(r.level, "info", "failed lookups never raise the level");
});

test("after a failure the dead APIs are left alone for the cooldown, then asked again", async () => {
  const ct = slowDown(1);
  const registry = slowDown(1);
  let t = 1_000_000;
  const c = cfg(ct.f, registry.f, () => t);
  await checkSignals(SITE, true, c);
  const firstCt = ct.calls.n;
  const firstRegistry = registry.calls.n;
  assert.ok(firstCt >= 1 && firstRegistry >= 1);

  for (let i = 0; i < 5; i++) {
    t += 30_000; // five more checks, 30 s apart: still inside the 5 minute cooldown
    const r = await checkSignals(SITE, true, c);
    assert.match(r.ct?.error ?? "", /certificate transparency unavailable/, "the error is still reported");
    assert.ok(r.registry?.errors.length);
  }
  assert.equal(ct.calls.n, firstCt, "CT was not asked again");
  assert.equal(registry.calls.n, firstRegistry, "the registry was not asked again");

  t += 300_000; // the cooldown is over
  await checkSignals(SITE, true, c);
  assert.ok(ct.calls.n > firstCt && registry.calls.n > firstRegistry, "asked again after the cooldown");
});
