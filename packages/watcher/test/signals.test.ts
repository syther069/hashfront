import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { diffDns, networkOf, observeDns, type DnsResolver, type MakeResolver } from "../src/signals/dns.ts";
import { judgeCert, type CertInfo, type TlsProbe } from "../src/signals/cert.ts";
import { dappScan, parseScan } from "../src/signals/onchainos.ts";
import { checkSignals, clearScanCache, isLocalHost, type SignalConfig } from "../src/signals/index.ts";
import { exitCode } from "../src/exit.ts";

// ---------------------------------------------------------------- stub DNS
type Zone = Record<string, { a?: string[]; aaaa?: string[]; cname?: string[]; ns?: string[] }>;
const err = (code: string) => Object.assign(new Error(code), { code });

function stubResolver(zones: Record<string, Zone | "down">): MakeResolver {
  return (server) => {
    const z = zones[server];
    const look = (field: "a" | "aaaa" | "cname" | "ns") => async (host: string) => {
      if (z === undefined || z === "down") throw err("ETIMEOUT");
      const rec = z[host];
      if (!rec) throw err("ENOTFOUND");
      const v = rec[field];
      if (!v?.length) throw err("ENODATA");
      return v;
    };
    const r: DnsResolver = { resolve4: look("a"), resolve6: look("aaaa"), resolveCname: look("cname"), resolveNs: look("ns") };
    return r;
  };
}

const NS = ["ns1.registrar-dns.example", "ns2.registrar-dns.example"];
const GOOD: Zone = {
  "app.hashswap.test": { a: ["203.0.113.10", "203.0.113.11"] },
  "hashswap.test": { a: ["203.0.113.1"], ns: NS },
};
const HIJACKED_NS: Zone = {
  "app.hashswap.test": { a: ["203.0.113.10", "203.0.113.11"] }, // cloaked: same addresses as seen from the watcher
  "hashswap.test": { a: ["203.0.113.1"], ns: ["ns1.attacker-dns.example", "ns2.attacker-dns.example"] },
};

test("NS is found at the zone apex by walking up from the subdomain", async () => {
  const o = await observeDns("app.hashswap.test", ["r1"], stubResolver({ r1: GOOD }));
  assert.ok(o.ok);
  assert.equal(o.records.zone, "hashswap.test");
  assert.deepEqual(o.records.ns, NS);
  assert.deepEqual(o.records.a, ["203.0.113.10", "203.0.113.11"]);
});

test("a CNAME'd host starts the NS walk at its parent", async () => {
  const zone: Zone = { "app.hashswap.test": { cname: ["cname.host.example."], a: ["198.51.100.7"], ns: ["wrong.example"] }, "hashswap.test": { ns: NS } };
  const o = await observeDns("app.hashswap.test", ["r1"], stubResolver({ r1: zone }));
  assert.ok(o.ok);
  assert.equal(o.records.zone, "hashswap.test");
  assert.deepEqual(o.records.cname, ["cname.host.example"]);
});

test("addresses are unioned across resolvers; one resolver down is tolerated and reported", async () => {
  const other: Zone = { ...GOOD, "app.hashswap.test": { a: ["203.0.113.12"] } };
  const o = await observeDns("app.hashswap.test", ["r1", "r2", "r3"], stubResolver({ r1: GOOD, r2: other, r3: "down" }));
  assert.ok(o.ok);
  assert.deepEqual(o.records.a, ["203.0.113.10", "203.0.113.11", "203.0.113.12"]);
  assert.deepEqual(o.failed, [{ server: "r3", error: "ETIMEOUT" }]);
  assert.deepEqual(o.disagreements, []);
});

test("resolvers disagreeing on NS is reported", async () => {
  const o = await observeDns("app.hashswap.test", ["r1", "r2"], stubResolver({ r1: GOOD, r2: HIJACKED_NS }));
  assert.ok(o.ok);
  assert.equal(o.disagreements.length, 1);
  assert.match(o.disagreements[0]!, /^ns:/);
});

test("every resolver failing is unknown, never 'unchanged'", async () => {
  const o = await observeDns("app.hashswap.test", ["r1", "r2"], stubResolver({ r1: "down", r2: "down" }));
  assert.equal(o.ok, false);
});

test("diffDns severities: NS/CNAME alert, a new address warn, a dropped address info", () => {
  const base = { host: "h", zone: "z", a: ["1.1.1.1", "2.2.2.2"], aaaa: [], cname: [], ns: ["a", "b"] };
  assert.deepEqual(diffDns(base, base), []);
  assert.deepEqual(
    diffDns(base, { ...base, ns: ["evil"] }).map((c) => [c.field, c.severity]),
    [["ns", "alert"]],
  );
  assert.deepEqual(
    diffDns(base, { ...base, cname: ["x.example"] }).map((c) => [c.field, c.severity]),
    [["cname", "alert"]],
  );
  assert.deepEqual(
    diffDns(base, { ...base, a: ["1.1.1.1", "9.9.9.9"] }).map((c) => [c.field, c.severity, c.added]),
    [["a", "warn", ["9.9.9.0/24"]]],
  );
  assert.deepEqual(
    diffDns(base, { ...base, a: ["1.1.1.1"] }).map((c) => [c.field, c.severity]),
    [["a", "info"]],
  );
});

test("anycast rotation inside a known network is not a change (seen live on Cloudflare)", () => {
  const base = { host: "h", zone: "z", a: ["104.20.26.136"], aaaa: ["2606:4700:90c6:6c5e:b143:0:525:2b85"], cname: [], ns: ["a"] };
  const rotated = { ...base, a: ["104.20.26.7"], aaaa: ["2606:4700:90d6:6c5e:b142:0:525:2b85"] };
  assert.deepEqual(diffDns(base, rotated), []);
  assert.deepEqual(
    diffDns(base, { ...base, aaaa: ["2a06:98c1::1"] }).map((c) => [c.field, c.severity, c.added]),
    [["aaaa", "warn", ["2a06:98c1::/32"]]],
  );
});

test("networkOf expands compressed IPv6", () => {
  assert.equal(networkOf("::1"), "0:0::/32");
  assert.equal(networkOf("2606:4700::6810:1a88"), "2606:4700::/32");
  assert.equal(networkOf("2001:db8:0:0::1"), "2001:db8::/32");
  assert.equal(networkOf("203.0.113.9"), "203.0.113.0/24");
});

// ---------------------------------------------------------------- cert and scan
const CERT: CertInfo = {
  fingerprint256: "AA:BB",
  issuer: "Let's Encrypt",
  subject: "app.hashswap.test",
  validFrom: "2026-11-01T00:00:00.000Z",
  validTo: "2027-01-30T00:00:00.000Z",
  authorized: true,
};

test("cert: renewal from the same issuer is info, a new issuer or an invalid chain is a warning", () => {
  const base = { fingerprint256: "AA:BB", issuer: "Let's Encrypt" };
  assert.deepEqual(judgeCert(CERT, base), []);
  assert.deepEqual(judgeCert({ ...CERT, fingerprint256: "CC:DD" }, base).map((f) => f.severity), ["info"]);
  assert.deepEqual(judgeCert({ ...CERT, issuer: "Some Other CA" }, base).map((f) => f.severity), ["warn"]);
  assert.deepEqual(judgeCert({ ...CERT, authorized: false, authError: "SELF_SIGNED_CERT_IN_CHAIN" }).map((f) => f.severity), ["warn"]);
});

test("onchainos output parsing: only an explicit answer counts", async () => {
  assert.deepEqual(parseScan('{"ok":true,"data":{"isMalicious":false}}'), { status: "clean" });
  assert.deepEqual(parseScan('{"ok":true,"data":{"isMalicious":true}}'), { status: "malicious" });
  assert.equal(parseScan('{"ok":false,"error":"API error (code=50036): PARAM_EXCEPTION"}').status, "unavailable");
  assert.equal(parseScan("Please log in").status, "unavailable");
  assert.equal(parseScan('{"ok":true,"data":{}}').status, "unavailable");
  // the CLI exits 1 with the JSON error on stdout
  const exit1 = await dappScan("x", () => Promise.reject(Object.assign(new Error("exit 1"), { stdout: '{"ok":false,"error":"not logged in"}' })));
  assert.deepEqual(exit1, { status: "unavailable", reason: "not logged in" });
  const missing = await dappScan("x", () => Promise.reject(err("ENOENT")));
  assert.deepEqual(missing, { status: "unavailable", reason: "onchainos CLI not installed" });
});

// ---------------------------------------------------------------- checkSignals with a baseline file
let dir: string;
beforeEach(async () => {
  clearScanCache();
  if (dir) await rm(dir, { recursive: true, force: true });
  dir = await mkdtemp(path.join(tmpdir(), "hashfront-signals-"));
});

const SITE = new URL("https://app.hashswap.test/");
function cfg(zone: Zone | "down", extra: Partial<SignalConfig> = {}, scan = '{"ok":true,"data":{"isMalicious":false}}', cert: CertInfo = CERT): SignalConfig {
  const tls: TlsProbe = async () => cert;
  return {
    statePath: path.join(dir, "baseline.json"),
    dnsServers: ["r1"],
    // CT is on by default; an empty log keeps these tests off the network. The registry has its own tests.
    registry: false,
    deps: { resolver: stubResolver({ r1: zone }), tls, runScan: async () => scan, ctFetch: async () => ({ ok: true, status: 200, json: async () => [] }) },
    ...extra,
  };
}

test("first MATCH records the baseline; the same records then compare clean", async () => {
  const first = await checkSignals(SITE, true, cfg(GOOD));
  assert.equal(first.baseline, "recorded");
  assert.equal(first.level, "ok");
  const saved = JSON.parse(await readFile(path.join(dir, "baseline.json"), "utf8"));
  assert.deepEqual(saved.dns.ns, NS);
  assert.equal(saved.cert.issuer, "Let's Encrypt");

  const again = await checkSignals(SITE, true, cfg(GOOD));
  assert.equal(again.baseline, "compared");
  assert.equal(again.level, "ok");
  assert.equal(exitCode("MATCH", again.level), 0);
});

test("cloaked registrar hijack: content MATCH but NS changed -> alert, exit 2, baseline kept", async () => {
  await checkSignals(SITE, true, cfg(GOOD));
  const r = await checkSignals(SITE, true, cfg(HIJACKED_NS));
  assert.equal(r.level, "alert");
  assert.deepEqual(r.dns?.changes.map((c) => c.field), ["ns"]);
  assert.equal(exitCode("MATCH", r.level), 2);
  const saved = JSON.parse(await readFile(path.join(dir, "baseline.json"), "utf8"));
  assert.deepEqual(saved.dns.ns, NS, "a change never updates the baseline");
});

test("no baseline is recorded while the content is not MATCH", async () => {
  const r = await checkSignals(SITE, false, cfg(HIJACKED_NS));
  assert.equal(r.baseline, "not-recorded");
  assert.equal(r.level, "unknown");
  await assert.rejects(readFile(path.join(dir, "baseline.json")), { code: "ENOENT" });
});

test("--rebaseline replaces the baseline only while recording is allowed", async () => {
  await checkSignals(SITE, true, cfg(GOOD));
  const moved: Zone = { ...GOOD, "hashswap.test": { ns: ["ns1.new-provider.example"] } };
  const refused = await checkSignals(SITE, false, cfg(moved, { rebaseline: true }));
  assert.equal(refused.baseline, "not-recorded");
  const ok = await checkSignals(SITE, true, cfg(moved, { rebaseline: true }));
  assert.equal(ok.baseline, "recorded");
  assert.equal((await checkSignals(SITE, true, cfg(moved))).level, "ok");
});

test("DNS down is unknown (exit 3), not a pass", async () => {
  await checkSignals(SITE, true, cfg(GOOD));
  const r = await checkSignals(SITE, true, cfg("down"));
  assert.equal(r.dns?.level, "unknown");
  assert.equal(exitCode("MATCH", r.level), 3);
  // a real content mismatch still wins
  assert.equal(exitCode("MISMATCH", r.level), 2);
});

test("OnchainOS flagging the domain is an alert; a clean scan never softens a DNS alert", async () => {
  await checkSignals(SITE, true, cfg(GOOD));
  clearScanCache();
  const flagged = await checkSignals(SITE, true, cfg(GOOD, {}, '{"ok":true,"data":{"isMalicious":true}}'));
  assert.equal(flagged.level, "alert");
  clearScanCache();
  const clean = await checkSignals(SITE, true, cfg(HIJACKED_NS));
  assert.equal(clean.scan?.result.status, "clean");
  assert.equal(clean.level, "alert");
});

test("the OnchainOS scan is cached for the scan interval", async () => {
  let calls = 0;
  const c = cfg(GOOD);
  c.deps = { ...c.deps, runScan: async () => (calls++, '{"ok":true,"data":{"isMalicious":false}}') };
  await checkSignals(SITE, true, c);
  await checkSignals(SITE, true, c);
  assert.equal(calls, 1);
});

test("a baseline for another host is refused", async () => {
  await writeFile(path.join(dir, "baseline.json"), JSON.stringify({ version: 1, host: "other.test", recordedAt: "", dns: { ns: [] } }));
  const r = await checkSignals(SITE, true, cfg(GOOD));
  assert.equal(r.baseline, "not-recorded");
  assert.match(r.baselineNote ?? "", /other\.test/);
  assert.equal(r.level, "unknown");
});

test("IP literals and local hosts are skipped (the e2e watches http://127.0.0.1)", async () => {
  for (const h of ["127.0.0.1", "[::1]", "localhost", "app.localhost", "intranet"]) assert.ok(isLocalHost(h), h);
  assert.ok(!isLocalHost("app.hashswap.test"));
  const r = await checkSignals(new URL("http://127.0.0.1:8080/"), true, cfg(GOOD));
  assert.ok(r.skipped);
  assert.equal(exitCode("MATCH", r.level), 0);
});

test("NS change seen by only the second resolver is still an alert (the first still caches the old NS)", async () => {
  await checkSignals(SITE, true, cfg(GOOD));
  for (const order of [
    ["r1", "r2"],
    ["r2", "r1"],
  ]) {
    const c = cfg(GOOD, { dnsServers: order });
    c.deps = { ...c.deps, resolver: stubResolver({ r1: GOOD, r2: HIJACKED_NS }) };
    const r = await checkSignals(SITE, true, c);
    assert.equal(r.level, "alert", order.join(","));
    assert.deepEqual(r.dns?.changes.map((x) => x.field), ["ns"]);
  }
});

test("no baseline is recorded while resolvers disagree on NS", async () => {
  const c = cfg(GOOD, { dnsServers: ["r1", "r2"] });
  c.deps = { ...c.deps, resolver: stubResolver({ r1: GOOD, r2: HIJACKED_NS }) };
  const r = await checkSignals(SITE, true, c);
  assert.equal(r.baseline, "not-recorded");
  assert.match(r.baselineNote ?? "", /disagree/);
});

test("optional signals failing (no onchainos CLI, TLS error) keep MATCH at exit 0", async () => {
  await checkSignals(SITE, true, cfg(GOOD));
  clearScanCache();
  const c = cfg(GOOD);
  c.deps = {
    ...c.deps,
    runScan: () => Promise.reject(err("ENOENT")),
    tls: () => Promise.reject(new Error("TLS handshake timed out")),
  };
  const r = await checkSignals(SITE, true, c);
  assert.equal(r.scan?.result.status, "unavailable");
  assert.ok(r.cert?.error);
  assert.equal(exitCode("MATCH", r.level), 0);
});

test("exit codes combine content and signals", () => {
  assert.equal(exitCode("MATCH", "ok"), 0);
  assert.equal(exitCode("MATCH", "info"), 0);
  assert.equal(exitCode("MATCH", "warn"), 1);
  assert.equal(exitCode("HOST_BEHIND", "ok"), 1);
  assert.equal(exitCode("UNREACHABLE", "alert"), 2);
  assert.equal(exitCode("UNREACHABLE", "ok"), 3);
  assert.equal(exitCode(undefined, "alert"), 2);
});
