// Certificate Transparency signal: issuers, renewals, failures and the baseline rules, with a fake CertSpotter
// (and recorded responses for the parsing tests), so nothing here touches the network.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { DnsResolver, MakeResolver } from "../src/signals/dns.ts";
import type { CertInfo, TlsProbe } from "../src/signals/cert.ts";
import { fetchIssuances, issuerName, type FetchLike } from "../src/signals/ct.ts";
import { checkSignals, clearScanCache, type SignalConfig } from "../src/signals/index.ts";
import { exitCode } from "../src/exit.ts";

const SITE = new URL("https://app.hashswap.test/");
const NS = ["ns1.registrar-dns.example", "ns2.registrar-dns.example"];
const ZONE: Record<string, { a?: string[]; ns?: string[] }> = {
  "app.hashswap.test": { a: ["203.0.113.10"] },
  "hashswap.test": { a: ["203.0.113.1"], ns: NS },
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
  dir = await mkdtemp(path.join(tmpdir(), "hashfront-ct-"));
});

const fixture = async (name: string) => JSON.parse(await readFile(path.join(import.meta.dirname, "fixtures", name), "utf8")) as unknown;
const reply = (body: unknown): Awaited<ReturnType<FetchLike>> => ({ ok: true, status: 200, json: async () => body });

/** A CertSpotter-shaped issuance. */
const entry = (id: number, org: string, notBefore: string, notAfter: string, names = ["app.hashswap.test"]) => ({
  id: String(id),
  dns_names: names,
  issuer: { name: `C=US, O=${org}, CN=Test CA`, friendly_name: org },
  not_before: notBefore,
  not_after: notAfter,
});

/** A fake CertSpotter that serves `log` in id order and honours the `after` cursor, like the real API. */
function logOf(log: ReturnType<typeof entry>[]): FetchLike {
  return async (url) => {
    const after = new URL(url).searchParams.get("after");
    return reply(log.filter((e) => after === null || BigInt(e.id) > BigInt(after)));
  };
}

const OLD = entry(100, "Let's Encrypt", "2026-09-01T00:00:00Z", "2026-12-01T00:00:00Z");
const cfg = (log: FetchLike, extra: Partial<SignalConfig> = {}): SignalConfig => ({
  statePath: path.join(dir, "baseline.json"),
  dnsServers: ["r1"],
  scan: false,
  ctIntervalMs: 0,
  registry: false,
  deps: { resolver, tls, ctFetch: log },
  ...extra,
});
const savedCt = async () => (JSON.parse(await readFile(path.join(dir, "baseline.json"), "utf8")) as { ct?: { lastId: string; knownIssuers: string[] } }).ct;

test("the first MATCH records issuers and the cursor; nothing new is ok", async () => {
  const first = await checkSignals(SITE, true, cfg(logOf([OLD])));
  assert.equal(first.baseline, "recorded");
  assert.deepEqual(await savedCt(), { source: "certspotter", lastId: "100", lastNotBefore: "2026-09-01T00:00:00Z", knownIssuers: ["Let's Encrypt"], latestNotAfter: "2026-12-01T00:00:00Z" });
  const again = await checkSignals(SITE, true, cfg(logOf([OLD])));
  assert.equal(again.ct?.level, "ok");
  assert.equal(again.level, "ok");
});

test("a certificate from a new issuer is an alert, exit 2, and the cursor stays put", async () => {
  await checkSignals(SITE, true, cfg(logOf([OLD])));
  const evil = entry(200, "Shady CA", "2026-11-25T10:00:00Z", "2027-02-25T10:00:00Z");
  const r = await checkSignals(SITE, true, cfg(logOf([OLD, evil])));
  assert.equal(r.ct?.level, "alert");
  assert.equal(r.ct?.findings[0]?.issuer, "Shady CA");
  assert.deepEqual(r.ct?.findings[0]?.hosts, ["app.hashswap.test"]);
  assert.equal(exitCode("MATCH", r.level), 2);
  assert.equal((await savedCt())?.lastId, "100", "an alert never moves the baseline");
  const still = await checkSignals(SITE, true, cfg(logOf([OLD, evil])));
  assert.equal(still.ct?.level, "alert", "it stays an alert until a human re-baselines");
});

test("a renewal from the known issuer inside the 30-day window is info and moves the cursor", async () => {
  await checkSignals(SITE, true, cfg(logOf([OLD])));
  const renewal = entry(150, "Let's Encrypt", "2026-11-20T00:00:00Z", "2027-02-18T00:00:00Z");
  const r = await checkSignals(SITE, true, cfg(logOf([OLD, renewal])));
  assert.equal(r.ct?.level, "info");
  assert.equal(exitCode("MATCH", r.level), 0);
  assert.equal((await savedCt())?.lastId, "150");
  assert.equal((await checkSignals(SITE, true, cfg(logOf([OLD, renewal])))).ct?.level, "ok");
});

test("a known issuer outside the renewal window is a warning", async () => {
  await checkSignals(SITE, true, cfg(logOf([OLD])));
  const early = entry(160, "Let's Encrypt", "2026-09-15T00:00:00Z", "2026-12-14T00:00:00Z");
  const r = await checkSignals(SITE, true, cfg(logOf([OLD, early])));
  assert.equal(r.ct?.level, "warn");
  assert.equal(exitCode("MATCH", r.level), 1);
});

test("certificates for other hosts of the domain are ignored; a wildcard that covers the host counts", async () => {
  await checkSignals(SITE, true, cfg(logOf([OLD])));
  const other = entry(300, "Shady CA", "2026-11-25T10:00:00Z", "2027-02-25T10:00:00Z", ["mail.hashswap.test"]);
  const wild = entry(301, "Shady CA", "2026-11-25T10:00:00Z", "2027-02-25T10:00:00Z", ["*.hashswap.test"]);
  const r = await checkSignals(SITE, true, cfg(logOf([OLD, other, wild])));
  assert.equal(r.ct?.findings.length, 1);
  assert.deepEqual(r.ct?.findings[0]?.hosts, ["*.hashswap.test"]);
});

test("both sources down is reported but never blocks, raises the level or records a baseline", async () => {
  const down: FetchLike = async () => ({ ok: false, status: 503, json: async () => ({}) });
  const r = await checkSignals(SITE, true, cfg(down));
  assert.match(r.ct?.error ?? "", /certificate transparency unavailable/);
  assert.equal(r.ct?.level, "info");
  assert.deepEqual(r.ct?.findings, []);
  assert.equal(exitCode("MATCH", r.level), 0);
  assert.equal(await savedCt(), undefined);
});

test("no baseline is recorded while the content is not MATCH", async () => {
  const r = await checkSignals(SITE, false, cfg(logOf([OLD])));
  assert.equal(r.baseline, "not-recorded");
  await assert.rejects(readFile(path.join(dir, "baseline.json")), { code: "ENOENT" });
});

test("an older baseline without CT gets its CT part on the next MATCH", async () => {
  await checkSignals(SITE, true, cfg(logOf([OLD]), { ct: false }));
  assert.equal(await savedCt(), undefined);
  await checkSignals(SITE, true, cfg(logOf([OLD])));
  assert.equal((await savedCt())?.lastId, "100");
});

test("with ct off the log is not queried at all", async () => {
  const never: FetchLike = async () => assert.fail("CT must not be queried");
  const r = await checkSignals(SITE, true, cfg(never, { ct: false }));
  assert.equal(r.ct, undefined);
});

test("the recorded CertSpotter response for example.org parses, with the issuer read from the DN organisation", async () => {
  const body = await fixture("certspotter-example-org.json");
  const f = await fetchIssuances("example.org", undefined, async () => reply(body));
  assert.equal(f.source, "certspotter");
  assert.ok(f.issuances.length > 0);
  assert.equal(f.issuances[0]?.issuer, "SSL Corporation");
  assert.ok(f.issuances[0]?.dnsNames.includes("example.org"));
});

test("crt.sh answers when CertSpotter fails, with the same issuer notation", async () => {
  const crt = await fixture("crtsh-example-org.json");
  const f = await fetchIssuances("example.org", undefined, async (url) => (url.includes("certspotter") ? { ok: false, status: 429, json: async () => ({}) } : reply(crt)));
  assert.equal(f.source, "crtsh");
  assert.deepEqual(f.issuances.map((i) => i.issuer), ["SSL Corporation", "Let's Encrypt"]);
  assert.deepEqual(f.issuances[0]?.dnsNames, ["*.example.org", "example.org"]);
  assert.equal(f.issuances[0]?.notBefore, "2026-11-24T22:44:33.000Z");
});

test("issuerName: organisation, else common name, else the text", () => {
  assert.equal(issuerName("C=US, O=Let's Encrypt, CN=R11"), "Let's Encrypt");
  assert.equal(issuerName("CN=Only A Name"), "Only A Name");
  assert.equal(issuerName("weird"), "weird");
});

const KEY = "sk_test_never_printed_123";

test("with an API key, CertSpotter gets it as a bearer token; crt.sh never sees it", async () => {
  const seen: { host: string; auth: string | undefined }[] = [];
  const crt = await fixture("crtsh-example-org.json");
  const f = await fetchIssuances("example.org", undefined, async (url, init) => {
    seen.push({ host: new URL(url).hostname, auth: init.headers.authorization });
    return url.includes("certspotter") ? { ok: false, status: 500, json: async () => ({}) } : reply(crt);
  }, { apiKey: ` ${KEY} ` });
  assert.equal(f.source, "crtsh");
  assert.deepEqual(seen, [
    { host: "api.certspotter.com", auth: `Bearer ${KEY}` },
    { host: "crt.sh", auth: undefined },
  ]);
  // without a key no authorization header is sent at all
  const anon: (string | undefined)[] = [];
  await fetchIssuances("example.org", undefined, async (_u, init) => (anon.push(init.headers.authorization), reply([])));
  assert.deepEqual(anon, [undefined]);
});

test("the key never appears in the error, the JSON report or the saved baseline", async () => {
  const echo: FetchLike = async (url) => {
    // a hostile or buggy API that echoes the key back in its error must not leak it either
    throw new Error(`refused ${url.includes("certspotter") ? KEY : "crt"}`);
  };
  const r = await checkSignals(SITE, true, cfg(echo, { ctApiKey: KEY }));
  assert.match(r.ct?.error ?? "", /certificate transparency unavailable/);
  assert.ok(!JSON.stringify(r).includes(KEY), "report must not contain the key");
  assert.ok(!(await readFile(path.join(dir, "baseline.json"), "utf8")).includes(KEY), "baseline must not contain the key");
});

test("CertSpotter 403: crt.sh answers now, and CertSpotter is skipped for 30 min, then asked again", async () => {
  let t = Date.parse("2026-11-28T00:00:00Z");
  const crt = await fixture("crtsh-example-org.json");
  const calls: string[] = [];
  const f: FetchLike = async (url) => {
    calls.push(new URL(url).hostname);
    return url.includes("certspotter") ? { ok: false, status: 403, json: async () => ({}) } : reply(crt);
  };
  const c = cfg(f, { deps: { resolver, tls, ctFetch: f, now: () => t } });
  await checkSignals(SITE, true, c);
  assert.deepEqual(calls, ["api.certspotter.com", "crt.sh"]);
  calls.length = 0;
  t += 29 * 60_000;
  await checkSignals(SITE, true, c);
  assert.deepEqual(calls, ["crt.sh"], "CertSpotter is paused");
  calls.length = 0;
  t += 2 * 60_000;
  await checkSignals(SITE, true, c);
  assert.deepEqual(calls[0], "api.certspotter.com", "asked again after 30 min");
});

test("CertSpotter 429 and crt.sh down: no CT lookup at all for 30 min (not the usual 5)", async () => {
  let t = Date.parse("2026-11-28T00:00:00Z");
  let calls = 0;
  const f: FetchLike = async (url) => (calls++, { ok: false, status: url.includes("certspotter") ? 429 : 502, json: async () => ({}) });
  const c = cfg(f, { deps: { resolver, tls, ctFetch: f, now: () => t } });
  const first = await checkSignals(SITE, true, c);
  assert.match(first.ct?.error ?? "", /HTTP 429/);
  assert.equal(calls, 2);
  t += 10 * 60_000;
  const second = await checkSignals(SITE, true, c);
  assert.equal(calls, 2, "nothing asked inside the pause");
  assert.equal(second.ct?.level, "info");
  t += 21 * 60_000;
  await checkSignals(SITE, true, c);
  assert.equal(calls, 4, "both asked again after 30 min");
});
