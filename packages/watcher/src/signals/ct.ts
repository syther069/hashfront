// Certificate Transparency signal. A hijacker needs a TLS certificate for the stolen domain before the drainer can be
// served over https, and CT logs show that certificate within minutes, often before the site itself changes.
// Source: CertSpotter (no key needed at low volume), with crt.sh as the fallback. Both are public; nothing is sent
// except the domain we already watch.
import type { Severity } from "./dns.ts";
import { errorText } from "./util.ts";

export interface Issuance {
  id: string;
  /** issuer organisation (same notion as the TLS probe's issuer), else common name */
  issuer: string;
  dnsNames: string[];
  notBefore: string;
  notAfter: string;
}

export type CtSource = "certspotter" | "crtsh";

export interface CtFetch {
  source: CtSource;
  issuances: Issuance[];
  /** the page limit was hit: the history is incomplete, so it cannot be recorded as a baseline */
  truncated: boolean;
}

export type FetchLike = (url: string, init: { signal: AbortSignal; headers: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface CtBaseline {
  source: CtSource;
  /** newest issuance id seen; only comparable within the same source */
  lastId: string;
  /** newest notBefore seen; used to compare across sources */
  lastNotBefore: string;
  knownIssuers: string[];
  /** latest expiry among the known certificates for the host: a renewal is expected shortly before it */
  latestNotAfter: string;
}

export interface CtFinding {
  severity: Severity;
  message: string;
  issuer: string;
  hosts: string[];
}

const TIMEOUT_MS = 10_000;
const MAX_PAGES = 5;
const RENEWAL_WINDOW_MS = 30 * 24 * 3600 * 1000;

/** "C=US, O=Let's Encrypt, CN=R11" -> "Let's Encrypt" (organisation, else common name, else the text as is). */
export function issuerName(dn: string): string {
  const part = (key: string) => new RegExp(`(?:^|,\\s*)${key}=([^,]+)`).exec(dn)?.[1]?.trim();
  return part("O") ?? part("CN") ?? dn.trim();
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");

function fromCertSpotter(raw: unknown): Issuance[] {
  if (!Array.isArray(raw)) throw new Error("CertSpotter answered with something other than a list");
  return raw.map((r: unknown) => {
    const o = r as { id?: unknown; dns_names?: unknown; issuer?: { friendly_name?: unknown; name?: unknown }; not_before?: unknown; not_after?: unknown };
    const id = str(o.id);
    if (!id) throw new Error("CertSpotter issuance without an id");
    return {
      id,
      // the DN organisation, like the TLS probe and crt.sh give, so the issuer reads the same whichever source answered
      issuer: str(o.issuer?.name) ? issuerName(str(o.issuer?.name)) : str(o.issuer?.friendly_name),
      dnsNames: Array.isArray(o.dns_names) ? o.dns_names.map(str).filter(Boolean) : [],
      notBefore: str(o.not_before),
      notAfter: str(o.not_after),
    };
  });
}

function fromCrtSh(raw: unknown): Issuance[] {
  if (!Array.isArray(raw)) throw new Error("crt.sh answered with something other than a list");
  return raw.map((r: unknown) => {
    const o = r as { id?: unknown; issuer_name?: unknown; name_value?: unknown; not_before?: unknown; not_after?: unknown };
    const id = String(o.id ?? "");
    if (!id) throw new Error("crt.sh entry without an id");
    // crt.sh gives timestamps without a zone ("2026-11-24T22:43:08"); they are UTC
    const iso = (v: unknown) => (str(v) ? new Date(`${str(v)}Z`).toISOString() : "");
    return { id, issuer: issuerName(str(o.issuer_name)), dnsNames: str(o.name_value).split("\n").filter(Boolean), notBefore: iso(o.not_before), notAfter: iso(o.not_after) };
  });
}

async function getJson(fetchFn: FetchLike, url: string): Promise<unknown> {
  const res = await fetchFn(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${new URL(url).hostname} answered HTTP ${res.status}`);
  return res.json();
}

/**
 * Issuances for `domain` (a registrable domain; subdomains are included), newer than `after` when given.
 * CertSpotter pages are ascending by id, so an `after` cursor returns only what is new.
 * Throws when both sources fail; the caller treats that as "unknown", never as a finding.
 */
export async function fetchIssuances(domain: string, after: { source: CtSource; id: string } | undefined, fetchFn: FetchLike = fetch as FetchLike): Promise<CtFetch> {
  try {
    const out: Issuance[] = [];
    let cursor = after?.source === "certspotter" ? after.id : undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const url = new URL("https://api.certspotter.com/v1/issuances");
      url.searchParams.set("domain", domain);
      url.searchParams.set("include_subdomains", "true");
      url.searchParams.append("expand", "dns_names");
      url.searchParams.append("expand", "issuer");
      if (cursor) url.searchParams.set("after", cursor);
      const batch = fromCertSpotter(await getJson(fetchFn, url.href));
      out.push(...batch);
      if (!batch.length) return { source: "certspotter", issuances: out, truncated: false };
      cursor = batch[batch.length - 1]!.id;
    }
    return { source: "certspotter", issuances: out, truncated: true };
  } catch (primary) {
    try {
      const url = new URL("https://crt.sh/");
      url.searchParams.set("q", domain);
      url.searchParams.set("output", "json");
      return { source: "crtsh", issuances: fromCrtSh(await getJson(fetchFn, url.href)), truncated: false };
    } catch (fallback) {
      throw new Error(`certificate transparency unavailable: CertSpotter: ${errorText(primary)}; crt.sh: ${errorText(fallback)}`);
    }
  }
}

/** Does a certificate name cover the watched host? ("*.example.org" covers "app.example.org", not "a.b.example.org".) */
export function covers(name: string, host: string): boolean {
  const n = name.toLowerCase();
  const h = host.toLowerCase();
  if (n === h) return true;
  return n.startsWith("*.") && h.endsWith(n.slice(1)) && !h.slice(0, h.length - n.length + 1).includes(".");
}

const forHost = (list: Issuance[], host: string) => list.filter((i) => i.dnsNames.some((n) => covers(n, host)));

/** Baseline from a full history (only called when the content is MATCH). */
export function baselineFrom(f: CtFetch, host: string): CtBaseline | undefined {
  const all = f.issuances;
  const mine = forHost(all, host);
  if (f.truncated || !all.length || !mine.length) return undefined;
  const newest = all.reduce((a, b) => (b.notBefore > a.notBefore ? b : a));
  return {
    source: f.source,
    lastId: f.source === "certspotter" ? all[all.length - 1]!.id : newest.id,
    lastNotBefore: newest.notBefore,
    knownIssuers: [...new Set(mine.map((i) => i.issuer))].sort(),
    latestNotAfter: mine.reduce((a, i) => (i.notAfter > a ? i.notAfter : a), ""),
  };
}

/** Issuances that appeared since the baseline and cover the host. */
export function newIssuances(f: CtFetch, baseline: CtBaseline, host: string): Issuance[] {
  const fresh =
    f.source === baseline.source && f.source === "certspotter"
      ? f.issuances.filter((i) => BigInt(i.id) > BigInt(baseline.lastId))
      : f.issuances.filter((i) => i.notBefore > baseline.lastNotBefore);
  return forHost(fresh, host);
}

/**
 * alert: a certificate from an issuer the host never used. warn: a certificate from a known issuer, which is a
 * renewal when it arrives within 30 days of the old one's expiry (then only info).
 */
export function judgeCt(fresh: Issuance[], baseline: CtBaseline): CtFinding[] {
  const known = new Set(baseline.knownIssuers);
  const renewalFrom = new Date(baseline.latestNotAfter).getTime() - RENEWAL_WINDOW_MS;
  return fresh.map((i) => {
    const hosts = [...new Set(i.dnsNames)].slice(0, 5);
    if (!known.has(i.issuer)) return { severity: "alert", message: `new certificate from an unknown issuer (${i.issuer})`, issuer: i.issuer, hosts };
    const renewal = Number.isFinite(renewalFrom) && new Date(i.notBefore).getTime() >= renewalFrom;
    return { severity: renewal ? "info" : "warn", message: `new certificate from ${i.issuer}${renewal ? " (renewal window)" : ""}`, issuer: i.issuer, hosts };
  });
}

/** Baseline after a clean MATCH check: moves the cursor past what was seen, but never past an alert. */
export function advance(baseline: CtBaseline, f: CtFetch, host: string): CtBaseline {
  const all = f.issuances;
  if (!all.length) return baseline;
  const fresh = newIssuances(f, baseline, host);
  const newest = all.reduce((a, b) => (b.notBefore > a.notBefore ? b : a));
  return {
    source: baseline.source,
    lastId: f.source === baseline.source && f.source === "certspotter" ? all[all.length - 1]!.id : baseline.lastId,
    lastNotBefore: newest.notBefore > baseline.lastNotBefore ? newest.notBefore : baseline.lastNotBefore,
    knownIssuers: baseline.knownIssuers,
    latestNotAfter: fresh.reduce((a, i) => (i.notAfter > a ? i.notAfter : a), baseline.latestNotAfter),
  };
}
