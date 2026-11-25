// Runs the DNS, certificate and OnchainOS signals and compares them with the team's recorded baseline.
// These are kept apart from the content verdict on purpose: a cloaked hijack shows MATCH to the watcher while its DNS
// records have changed, so a signal can raise the alarm on its own, and a failed signal never hides the content verdict.
import { isIP } from "node:net";
import { readFile, rename, writeFile } from "node:fs/promises";
import { diffObservation, observeDns, DEFAULT_DNS_SERVERS, type DnsChange, type DnsObservation, type DnsRecords, type MakeResolver, type Severity } from "./dns.ts";
import { judgeCert, tlsProbe, type CertBaseline, type CertFinding, type CertInfo, type TlsProbe } from "./cert.ts";
import { dappScan, defaultScanner, type RunScan, type ScanResult } from "./onchainos.ts";
import { advance, baselineFrom, fetchIssuances, judgeCt, newIssuances, type CtBaseline, type CtFetch, type CtFinding, type FetchLike } from "./ct.ts";
import { dnssecOff, judgeRegistry, observeRegistry, registryBaselineFrom, type RegistryBaseline, type RegistryFinding, type RegistryObservation } from "./registry.ts";
import { errorText } from "./util.ts";

export type Level = "ok" | Severity | "unknown";
const RANK: Record<Level, number> = { ok: 0, info: 1, unknown: 2, warn: 3, alert: 4 };
export const worst = (levels: Level[]): Level => levels.reduce<Level>((a, b) => (RANK[b] > RANK[a] ? b : a), "ok");

export interface Baseline {
  version: 1;
  host: string;
  recordedAt: string;
  dns: DnsRecords;
  cert?: CertBaseline;
  ct?: CtBaseline;
  registry?: RegistryBaseline;
}

export interface SignalConfig {
  /** baseline file; without it the signals are observed and printed but never compared */
  statePath?: string;
  dnsServers?: string[];
  cert?: boolean;
  scan?: boolean;
  /** Certificate Transparency (default on): a certificate issued for the domain before the site changes */
  ct?: boolean;
  /** CT is a public API; ask at most this often (default 10 min) */
  ctIntervalMs?: number;
  /** registry data (RDAP) and DNSSEC (DoH), default on; asked at most this often (default 10 min) */
  registry?: boolean;
  registryIntervalMs?: number;
  /** the OnchainOS scan is an API call; run it at most this often (default 10 min) */
  scanIntervalMs?: number;
  /** overwrite an existing baseline (still only when recording is allowed) */
  rebaseline?: boolean;
  deps?: { resolver?: MakeResolver; tls?: TlsProbe; runScan?: RunScan; ctFetch?: FetchLike; registryFetch?: FetchLike; now?: () => number };
}

export interface SignalsReport {
  level: Level;
  /** set when the host is an IP literal or local name: there is nothing to resolve */
  skipped?: string;
  baseline: "none" | "recorded" | "compared" | "not-recorded";
  baselineNote?: string;
  dns?: { observation: DnsObservation; changes: DnsChange[]; level: Level };
  cert?: { info?: CertInfo; error?: string; findings: CertFinding[]; level: Level };
  scan?: { result: ScanResult; cachedAt: string; level: Level };
  /** a failed lookup is reported as `error` and never raises the level: CT is an early warning, not a gate */
  ct?: { source?: string; seen?: number; error?: string; findings: CtFinding[]; level: Level };
  /** like CT, a failed lookup is reported as `errors` and never raises the level */
  registry?: { errors: string[]; findings: RegistryFinding[]; dnssec?: { ds: boolean; validated: boolean }; level: Level };
}

interface CtOutcome {
  fetch?: CtFetch;
  error?: string;
}

const scanCache = new Map<string, { at: number; result: ScanResult }>();
const registryCache = new Map<string, { at: number; obs: RegistryObservation }>();
const ctCache = new Map<string, { at: number; fetch: CtFetch }>();

export function isLocalHost(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  return isIP(h) !== 0 || h === "localhost" || h.endsWith(".localhost") || !h.includes(".");
}

async function loadBaseline(path: string): Promise<Baseline | undefined> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw err;
  }
  const b = JSON.parse(raw) as Baseline;
  if (b?.version !== 1 || typeof b.host !== "string" || !b.dns || !Array.isArray(b.dns.ns)) throw new Error(`${path}: not a Hashfront signals baseline`);
  return b;
}

async function saveBaseline(path: string, b: Baseline): Promise<void> {
  const tmp = `${path}.tmp`;
  await writeFile(tmp, `${JSON.stringify(b, null, 2)}\n`);
  await rename(tmp, path);
}

/**
 * @param mayRecord true only when the content verdict is MATCH (or the team runs signals on their own to set up):
 *   a baseline taken during a hijack would make the attacker's records the "normal" ones.
 */
export async function checkSignals(site: URL, mayRecord: boolean, cfg: SignalConfig = {}): Promise<SignalsReport> {
  const host = site.hostname.toLowerCase();
  if (isLocalHost(host)) return { level: "ok", skipped: "IP or local host: no DNS, certificate or scan signal", baseline: "none" };
  const deps = cfg.deps ?? {};
  const now = deps.now ?? Date.now;

  let baseline: Baseline | undefined;
  let baselineError: string | undefined;
  if (cfg.statePath) {
    try {
      baseline = await loadBaseline(cfg.statePath);
      if (baseline && baseline.host !== host) throw new Error(`${cfg.statePath} is the baseline for ${baseline.host}, not ${host}`);
    } catch (err) {
      baseline = undefined;
      baselineError = errorText(err);
    }
  }

  const wantCert = cfg.cert !== false && site.protocol === "https:";
  const wantScan = cfg.scan !== false;
  const [dnsObs, cert, scan] = await Promise.all([
    observeDns(host, cfg.dnsServers ?? DEFAULT_DNS_SERVERS, deps.resolver).catch(
      (err): DnsObservation => ({ ok: false, failed: [{ server: "*", error: errorText(err) }] }),
    ),
    wantCert
      ? (deps.tls ?? tlsProbe)(host, Number(site.port) || 443, 10_000).then(
          (info): { info?: CertInfo; error?: string } => ({ info }),
          (err: unknown): { info?: CertInfo; error?: string } => ({ error: errorText(err) }),
        )
      : undefined,
    wantScan ? cachedScan(host, cfg, deps.runScan ?? scanner().run, now) : undefined,
  ]);

  const wantCt = cfg.ct !== false && site.protocol === "https:";
  const ctDomain = dnsObs.ok && dnsObs.records.zone ? dnsObs.records.zone : host.split(".").slice(-2).join(".");
  const ct = wantCt ? await cachedCt(ctDomain, baseline?.ct, cfg, deps.ctFetch, now).then((fetch): CtOutcome => ({ fetch }), (err: unknown): CtOutcome => ({ error: errorText(err) })) : undefined;

  const wantRegistry = cfg.registry !== false && site.protocol === "https:";
  const registry = wantRegistry ? await cachedRegistry(ctDomain, cfg, deps.registryFetch, now) : undefined;

  const report: SignalsReport = { level: "ok", baseline: "none" };

  const changes = dnsObs.ok && baseline ? diffObservation(baseline.dns, dnsObs) : [];
  const dnsLevel: Level = !dnsObs.ok ? "unknown" : worst([...changes.map((c) => c.severity), ...(dnsObs.disagreements.length ? (["warn"] as const) : [])]);
  report.dns = { observation: dnsObs, changes, level: dnsLevel };

  if (cert) {
    const findings = cert.info ? judgeCert(cert.info, baseline?.cert) : [];
    // optional signal: a failed probe is reported (info) but does not make the whole check "unknown"
    report.cert = { ...cert, findings, level: cert.info ? worst(findings.map((f) => f.severity)) : "info" };
  }
  if (ct) {
    const findings = ct.fetch && baseline?.ct ? judgeCt(newIssuances(ct.fetch, baseline.ct, host), baseline.ct) : [];
    report.ct = {
      ...(ct.fetch ? { source: ct.fetch.source, seen: ct.fetch.issuances.length } : {}),
      ...(ct.error ? { error: ct.error } : {}),
      findings,
      level: ct.error ? "info" : worst(findings.map((f) => f.severity)),
    };
  }
  if (registry) {
    const findings = baseline?.registry ? judgeRegistry(registry, baseline.registry) : [];
    report.registry = {
      errors: registry.errors,
      findings,
      ...(registry.dnssec ? { dnssec: registry.dnssec } : {}),
      level: !registry.rdap && !registry.dnssec ? "info" : worst(findings.map((f) => f.severity)),
    };
  }
  if (scan) {
    report.scan = { result: scan.result, cachedAt: new Date(scan.at).toISOString(), level: scan.result.status === "malicious" ? "alert" : scan.result.status === "clean" ? "ok" : "info" };
  }

  // Baseline bookkeeping
  if (baselineError) {
    report.baseline = "not-recorded";
    report.baselineNote = baselineError;
  } else if (cfg.statePath && (!baseline || cfg.rebaseline)) {
    if (!mayRecord) {
      report.baseline = "not-recorded";
      report.baselineNote = "the content check is not MATCH, so these records are not trusted as the baseline";
    } else if (!dnsObs.ok) {
      report.baseline = "not-recorded";
      report.baselineNote = "DNS could not be resolved";
    } else if (dnsObs.disagreements.length) {
      report.baseline = "not-recorded";
      report.baselineNote = "resolvers disagree on zone, NS or CNAME; record the baseline once they agree";
    } else {
      await saveBaseline(cfg.statePath, {
        version: 1,
        host,
        recordedAt: new Date(now()).toISOString(),
        dns: dnsObs.records,
        ...(cert?.info ? { cert: { fingerprint256: cert.info.fingerprint256, issuer: cert.info.issuer } } : {}),
        ...ctBaselineOf(ct?.fetch, host),
        ...registryBaselineOf(registry),
      });
      report.baseline = "recorded";
      report.dns.changes = [];
      report.dns.level = "ok";
      if (report.ct && !report.ct.error) report.ct = { ...report.ct, findings: [], level: "ok" };
      if (report.registry && registry?.rdap) report.registry = { ...report.registry, findings: [], level: "ok" };
      if (report.cert?.info) {
        report.cert.findings = judgeCert(report.cert.info);
        report.cert.level = worst(report.cert.findings.map((f) => f.severity));
      }
    }
  } else if (baseline) {
    report.baseline = "compared";
    // Only a MATCH moves the CT cursor, and never past an alert: an unknown issuer stays flagged until a human
    // re-baselines. A baseline written before CT existed gets its CT part the first time it can be recorded.
    if (mayRecord) {
      const patch: Partial<Baseline> = {};
      if (ct?.fetch && !report.ct?.findings.some((f) => f.severity === "alert")) {
        const next = baseline.ct ? advance(baseline.ct, ct.fetch, host) : baselineFrom(ct.fetch, host);
        if (next && JSON.stringify(next) !== JSON.stringify(baseline.ct)) patch.ct = next;
      }
      // the same rule for the registry: a warning is reported once and then accepted, an alert is never accepted
      if (registry?.rdap && !report.registry?.findings.some((f) => f.severity === "alert")) {
        const next = registryBaselineFrom(registry);
        if (next && JSON.stringify(next) !== JSON.stringify(baseline.registry)) patch.registry = next;
      }
      if (Object.keys(patch).length) await saveBaseline(cfg.statePath!, { ...baseline, ...patch });
    }
  }

  // No baseline to compare against is "unknown" for DNS only when one was asked for.
  const levels: Level[] = [report.dns.level, report.cert?.level ?? "ok", report.scan?.level ?? "ok", report.ct?.level ?? "ok", report.registry?.level ?? "ok"];
  if (cfg.statePath && report.baseline === "not-recorded") levels.push("unknown");
  report.level = worst(levels);
  return report;
}

let defaultScan: ReturnType<typeof defaultScanner> | undefined;
/** Chosen once per process: OKX REST with keys, else the onchainos CLI. */
function scanner() {
  return (defaultScan ??= defaultScanner());
}
/** How the phishing scan is reached, for the JSON line. */
export function scanVia(): "okx-api" | "onchainos-cli" {
  return scanner().via;
}

async function cachedScan(host: string, cfg: SignalConfig, run: RunScan, now: () => number) {
  const hit = scanCache.get(host);
  if (hit && now() - hit.at < (cfg.scanIntervalMs ?? 600_000)) return hit;
  const entry = { at: now(), result: await dappScan(host, run) };
  scanCache.set(host, entry);
  return entry;
}

function registryBaselineOf(o: RegistryObservation | undefined): { registry: RegistryBaseline } | Record<string, never> {
  const b = o && registryBaselineFrom(o);
  return b ? { registry: b } : {};
}

async function cachedRegistry(domain: string, cfg: SignalConfig, fetchFn: FetchLike | undefined, now: () => number): Promise<RegistryObservation> {
  const hit = registryCache.get(domain);
  if (hit && now() - hit.at < (cfg.registryIntervalMs ?? 600_000)) return hit.obs;
  const obs = await observeRegistry(domain, fetchFn);
  // only a complete answer is kept: a failed lookup must be retried at the next check
  if (!obs.errors.length) registryCache.set(domain, { at: now(), obs });
  return obs;
}

function ctBaselineOf(f: CtFetch | undefined, host: string): { ct: CtBaseline } | Record<string, never> {
  const b = f && baselineFrom(f, host);
  return b ? { ct: b } : {};
}

async function cachedCt(domain: string, base: CtBaseline | undefined, cfg: SignalConfig, fetchFn: FetchLike | undefined, now: () => number): Promise<CtFetch> {
  const key = `${domain}|${base?.source ?? ""}:${base?.lastId ?? ""}`;
  const hit = ctCache.get(key);
  if (hit && now() - hit.at < (cfg.ctIntervalMs ?? 600_000)) return hit.fetch;
  const fetch = await fetchIssuances(domain, base && { source: base.source, id: base.lastId }, fetchFn);
  ctCache.set(key, { at: now(), fetch });
  return fetch;
}

/** Test helper: forget cached scan and CT results. */
export function clearScanCache(): void {
  scanCache.clear();
  ctCache.clear();
  registryCache.clear();
}
