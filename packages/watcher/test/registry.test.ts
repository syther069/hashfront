// Registry signal: RDAP (nameservers, locks, last changed) and DNSSEC (DoH DS), with recorded responses for example.org
// and a fake fetch that can change them between checks.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { DnsResolver, MakeResolver } from "../src/signals/dns.ts";
import type { CertInfo, TlsProbe } from "../src/signals/cert.ts";
import type { FetchLike } from "../src/signals/ct.ts";
import { parseDoh, parseRdap } from "../src/signals/registry.ts";
import { checkSignals, clearScanCache, type SignalConfig } from "../src/signals/index.ts";
import { exitCode } from "../src/exit.ts";
import { emptyState, KIND, step, type Observation } from "../src/alerts/incident.ts";
import { observationOf } from "../src/alerts/index.ts";
import type { CheckResult } from "../src/watch.ts";

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

let dir: string;
beforeEach(async () => {
  clearScanCache();
  if (dir) await rm(dir, { recursive: true, force: true });
  dir = await mkdtemp(path.join(tmpdir(), "hashfront-registry-"));
});

const fixture = async (name: string) => JSON.parse(await readFile(path.join(import.meta.dirname, "fixtures", name), "utf8")) as Record<string, unknown>;
const reply = (body: unknown): Awaited<ReturnType<FetchLike>> => ({ ok: true, status: 200, json: async () => body });

interface World {
  rdap: Record<string, unknown> | "down";
  doh: Record<string, unknown> | "down";
}

/** A fake rdap.org and Cloudflare DoH that read the current `world` on every request. */
const serve = (w: World): FetchLike => async (url) => {
  const body = new URL(url).hostname === "rdap.org" ? w.rdap : w.doh;
  return body === "down" ? { ok: false, status: 503, json: async () => ({}) } : reply(body);
};

const cfg = (w: World, extra: Partial<SignalConfig> = {}): SignalConfig => ({
  statePath: path.join(dir, "baseline.json"),
  dnsServers: ["r1"],
  scan: false,
  ct: false,
  registryIntervalMs: 0,
  deps: { resolver, tls, registryFetch: serve(w) },
  ...extra,
});

const saved = async () => (JSON.parse(await readFile(path.join(dir, "baseline.json"), "utf8")) as { registry?: { locks: string[]; delegationSigned: boolean; registryNs: string[]; lastChanged: string } }).registry;

async function world(): Promise<World> {
  const rdap = await fixture("rdap-example-org.json");
  return { rdap, doh: await fixture("doh-ds-example-org.json") };
}
/** a copy of the RDAP object with some fields replaced */
const rdapWith = (w: World, patch: Record<string, unknown>) => ({ ...(w.rdap as Record<string, unknown>), ...patch });
const noDs = { Status: 0, AD: false, Answer: [] };

test("the recorded example.org answers parse: locks, nameservers, DNSSEC and last-changed (not the database update time)", async () => {
  const w = await world();
  assert.deepEqual(parseRdap(w.rdap), {
    locks: ["server delete prohibited", "server transfer prohibited", "server update prohibited"],
    delegationSigned: true,
    registryNs: ["katelyn.ns.cloudflare.com", "mitch.ns.cloudflare.com"],
    lastChanged: "2026-10-14T04:00:57.481Z",
  });
  assert.deepEqual(parseDoh(w.doh), { ds: true, validated: true });
  assert.deepEqual(parseDoh(noDs), { ds: false, validated: false });
  assert.throws(() => parseRdap({ errorCode: 404 }), /domain object/);
  assert.throws(() => parseDoh({ Status: 2 }), /status 2/);
});

test("the first MATCH records the registry baseline; unchanged data is ok", async () => {
  const w = await world();
  const first = await checkSignals(SITE, true, cfg(w));
  assert.equal(first.baseline, "recorded");
  assert.equal((await saved())?.delegationSigned, true);
  assert.deepEqual((await saved())?.registryNs, ["katelyn.ns.cloudflare.com", "mitch.ns.cloudflare.com"]);
  const again = await checkSignals(SITE, true, cfg(w));
  assert.equal(again.registry?.level, "ok");
  assert.equal(again.level, "ok");
});

test("DNSSEC removed at the registry is an alert, exit 2, and the baseline is kept", async () => {
  const w = await world();
  await checkSignals(SITE, true, cfg(w));
  w.rdap = rdapWith(w, { secureDNS: { delegationSigned: false } });
  const r = await checkSignals(SITE, true, cfg(w));
  assert.equal(r.registry?.level, "alert");
  assert.equal(r.registry?.findings[0]?.field, "dnssec");
  assert.equal(exitCode("MATCH", r.level), 2);
  assert.equal((await saved())?.delegationSigned, true, "an alert never updates the baseline");
});

test("DNSSEC gone from the live DS lookup is an alert even while RDAP still lags behind", async () => {
  const w = await world();
  await checkSignals(SITE, true, cfg(w));
  w.doh = noDs;
  const r = await checkSignals(SITE, true, cfg(w));
  assert.equal(r.registry?.level, "alert");
});

test("a change of the registry's nameservers is an alert", async () => {
  const w = await world();
  await checkSignals(SITE, true, cfg(w));
  w.rdap = rdapWith(w, { nameservers: [{ objectClassName: "nameserver", ldhName: "NS1.ATTACKER-DNS.EXAMPLE" }] });
  const r = await checkSignals(SITE, true, cfg(w));
  assert.equal(r.registry?.level, "alert");
  assert.match(r.registry?.findings.find((f) => f.field === "nameservers")?.message ?? "", /katelyn.*-> ns1\.attacker-dns\.example/);
});

test("a removed transfer lock is a warning, reported once, then accepted as the new baseline", async () => {
  const w = await world();
  await checkSignals(SITE, true, cfg(w));
  w.rdap = rdapWith(w, { status: ["server delete prohibited", "server update prohibited"] });
  const r = await checkSignals(SITE, true, cfg(w));
  assert.equal(r.registry?.level, "warn");
  assert.match(r.registry?.findings[0]?.message ?? "", /removed: server transfer prohibited/);
  assert.equal(exitCode("MATCH", r.level), 1);
  assert.equal((await checkSignals(SITE, true, cfg(w))).registry?.level, "ok");
});

test("a later 'last changed' at the registry is a warning; the RDAP database timestamp is ignored", async () => {
  const w = await world();
  await checkSignals(SITE, true, cfg(w));
  const events = ((w.rdap as Record<string, unknown>).events as { eventAction: string; eventDate: string }[]).map((e) => (e.eventAction === "last update of RDAP database" ? { ...e, eventDate: "2030-01-01T00:00:00Z" } : e));
  w.rdap = rdapWith(w, { events });
  assert.equal((await checkSignals(SITE, true, cfg(w))).registry?.level, "ok");
  w.rdap = rdapWith(w, { events: events.map((e) => (e.eventAction === "last changed" ? { ...e, eventDate: "2026-11-25T10:00:00.000Z" } : e)) });
  assert.equal((await checkSignals(SITE, true, cfg(w))).registry?.level, "warn");
});

test("switching DNSSEC on or adding a lock is only info", async () => {
  const w = await world();
  w.rdap = rdapWith(w, { secureDNS: { delegationSigned: false }, status: ["server update prohibited"] });
  w.doh = noDs;
  await checkSignals(SITE, true, cfg(w));
  w.rdap = await fixture("rdap-example-org.json");
  w.doh = await fixture("doh-ds-example-org.json");
  const r = await checkSignals(SITE, true, cfg(w));
  assert.equal(r.registry?.level, "info");
  assert.equal(exitCode("MATCH", r.level), 0);
});

test("both sources down is reported but never blocks, raises the level or records a baseline", async () => {
  const r = await checkSignals(SITE, true, cfg({ rdap: "down", doh: "down" }));
  assert.equal(r.registry?.level, "info");
  assert.equal(r.registry?.errors.length, 2);
  assert.equal(exitCode("MATCH", r.level), 0);
  assert.equal(await saved(), undefined);
});

test("RDAP down but DNSSEC fine: no registry baseline from a half answer, and nothing is flagged", async () => {
  const w = await world();
  w.rdap = "down";
  const r = await checkSignals(SITE, true, cfg(w));
  assert.equal(r.registry?.level, "ok");
  assert.equal(await saved(), undefined);
  assert.match(r.registry?.errors[0] ?? "", /RDAP/);
});

test("no baseline is recorded while the content is not MATCH", async () => {
  const w = await world();
  await checkSignals(SITE, false, cfg(w));
  await assert.rejects(readFile(path.join(dir, "baseline.json")), { code: "ENOENT" });
});

test("with registry off neither source is queried", async () => {
  const never: FetchLike = async () => assert.fail("the registry must not be queried");
  const r = await checkSignals(SITE, true, { ...cfg(await world()), registry: false, deps: { resolver, tls, registryFetch: never } });
  assert.equal(r.registry, undefined);
});

// ---------------------------------------------------------------- how a registry alert becomes an incident
test("a registry alert opens the DNS incident and the team gets one notice with what changed", async () => {
  const w = await world();
  await checkSignals(SITE, true, cfg(w));
  w.rdap = rdapWith(w, { secureDNS: { delegationSigned: false } });
  const signals = await checkSignals(SITE, true, cfg(w));
  const result = { verdict: { status: "MATCH", observed: `0x${"1".repeat(64)}` }, checkedAt: new Date("2026-11-26T00:00:00Z"), signals } as unknown as CheckResult;
  const o: Observation = observationOf(result);
  assert.equal(o.registryAlert, true);
  assert.match(o.registryNotice ?? "", /DNSSEC was on and is now off/);

  const cfgI = { confirm: 2, clear: 3, channels: ["telegram" as const, "tapesend" as const], teamChat: true };
  let s = emptyState();
  const made: string[] = [];
  for (let i = 0; i < 3; i++) {
    const r = step(s, { ...o, at: new Date(Date.parse("2026-11-26T00:00:00Z") + i * 30_000) }, cfgI);
    s = r.state;
    made.push(...r.created.map((m) => `${m.audience}:${m.kind}`));
  }
  assert.deepEqual(made.filter((m) => m.startsWith("community")), [`community:${KIND.DNS_CHANGED}`]);
  assert.equal(made.filter((m) => m === "team:registry-change").length, 1);
});
