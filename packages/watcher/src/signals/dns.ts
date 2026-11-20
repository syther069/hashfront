// DNS signal (plan step 8, essential): a registrar or DNS-account hijack can serve the approved bytes to the
// watcher's IP and a drainer to everyone else, but it cannot hide the record change itself.
import { promises as dns } from "node:dns";
import { canonicalHash } from "./util.ts";

/** Public resolvers queried directly, one at a time. The system resolver may be a local stub (it refused queries on
 * the dev machine) and would also hide a poisoned cache behind its own. */
export const DEFAULT_DNS_SERVERS = ["1.1.1.1", "8.8.8.8"];

export interface DnsResolver {
  resolve4(host: string): Promise<string[]>;
  resolve6(host: string): Promise<string[]>;
  resolveCname(host: string): Promise<string[]>;
  resolveNs(host: string): Promise<string[]>;
}
export type MakeResolver = (server: string) => DnsResolver;

export const systemResolver: MakeResolver = (server) => {
  const r = new dns.Resolver({ timeout: 3_000, tries: 2 });
  r.setServers([server]);
  return r;
};

export interface DnsRecords {
  host: string;
  /** the zone apex that answered NS, found by walking up the labels */
  zone: string;
  a: string[];
  aaaa: string[];
  cname: string[];
  ns: string[];
}

export type DnsObservation =
  | {
      ok: true;
      /** merged view: zone/NS/CNAME from the first resolver that answered, addresses unioned across all */
      records: DnsRecords;
      /** each resolver's own answer, so a change seen by any one of them is reported */
      answers: { server: string; records: DnsRecords }[];
      observed: `0x${string}`;
      servers: string[];
      failed: { server: string; error: string }[];
      disagreements: string[];
    }
  | { ok: false; failed: { server: string; error: string }[] };

/** Answers that mean "this name has no such record", as opposed to "the resolver did not answer". */
const EMPTY_ANSWER = new Set(["ENODATA", "ENOTFOUND"]);

class ResolverFailed extends Error {}

async function query(fn: () => Promise<string[]>): Promise<string[]> {
  try {
    return await fn();
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code ?? "";
    if (EMPTY_ANSWER.has(code)) return [];
    throw new ResolverFailed(code || (err instanceof Error ? err.message : String(err)));
  }
}

const norm = (xs: string[]) => [...new Set(xs.map((x) => x.toLowerCase().replace(/\.$/, "")))].sort();

async function readOne(r: DnsResolver, host: string): Promise<DnsRecords> {
  const [a, aaaa, cname] = await Promise.all([query(() => r.resolve4(host)), query(() => r.resolve6(host)), query(() => r.resolveCname(host))]);
  // NS lives at the zone apex. A name with a CNAME cannot be an apex, so start at its parent.
  const labels = host.split(".");
  let zone = "";
  let ns: string[] = [];
  for (let i = cname.length ? 1 : 0; labels.length - i >= 2; i++) {
    const name = labels.slice(i).join(".");
    const found = await query(() => r.resolveNs(name));
    if (found.length) {
      zone = name;
      ns = found;
      break;
    }
  }
  return { host, zone, a: norm(a), aaaa: norm(aaaa), cname: norm(cname), ns: norm(ns) };
}

/** Queries every server separately and merges the answers. Address sets are unioned (anycast and geo answers differ
 * per resolver); NS, zone and CNAME disagreements are reported, because those should be the same everywhere. */
export async function observeDns(host: string, servers = DEFAULT_DNS_SERVERS, make: MakeResolver = systemResolver): Promise<DnsObservation> {
  const answers: { server: string; records: DnsRecords }[] = [];
  const failed: { server: string; error: string }[] = [];
  await Promise.all(
    servers.map(async (server) => {
      try {
        answers.push({ server, records: await readOne(make(server), host) });
      } catch (err) {
        failed.push({ server, error: err instanceof Error ? err.message : String(err) });
      }
    }),
  );
  if (!answers.length) return { ok: false, failed };
  answers.sort((x, y) => servers.indexOf(x.server) - servers.indexOf(y.server));

  const first = answers[0]!.records;
  const disagreements: string[] = [];
  for (const { server, records } of answers.slice(1)) {
    for (const field of ["zone", "ns", "cname"] as const) {
      if (String(records[field]) !== String(first[field])) {
        disagreements.push(`${field}: ${answers[0]!.server} says ${String(first[field]) || "(none)"}, ${server} says ${String(records[field]) || "(none)"}`);
      }
    }
  }
  const union = (field: "a" | "aaaa") => norm(answers.flatMap((x) => x.records[field]));
  const records: DnsRecords = { ...first, a: union("a"), aaaa: union("aaaa") };
  return { ok: true, records, answers, observed: observedHash(records), servers: answers.map((x) => x.server), failed, disagreements };
}

/**
 * Addresses are compared by network, not one by one: anycast CDNs rotate individual addresses between queries
 * (Cloudflare changed an AAAA record within 6 s in the live test). IPv4 /24, IPv6 /32.
 */
export function networkOf(addr: string): string {
  if (!addr.includes(":")) return `${addr.split(".").slice(0, 3).join(".")}.0/24`;
  const [head = "", tail = ""] = addr.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const groups = addr.includes("::") ? [...h, ...Array<string>(8 - h.length - t.length).fill("0"), ...t] : h;
  const g = (i: number) => (groups[i] ?? "0").replace(/^0+(?=.)/, "");
  return `${g(0)}:${g(1)}::/32`;
}

const networks = (xs: string[]) => [...new Set(xs.map(networkOf))].sort();

/** Hash of what the signal compares (networks, not single addresses), so it only changes when a change is reported. */
function observedHash(r: DnsRecords): `0x${string}` {
  return canonicalHash({ zone: r.zone, ns: r.ns, cname: r.cname, a: networks(r.a), aaaa: networks(r.aaaa) });
}

export type Severity = "info" | "warn" | "alert";

export interface DnsChange {
  field: "zone" | "ns" | "cname" | "a" | "aaaa";
  added: string[];
  removed: string[];
  severity: Severity;
}

/**
 * Changes against the team's baseline.
 * - alert: NS, zone or CNAME changed (who answers for the domain, or where it points)
 * - warn: an address network the baseline never had (a new host, or the CDN using a new range)
 * - info: address networks only disappeared
 * Rotation inside a known network is not reported.
 */
export function diffDns(baseline: DnsRecords, now: DnsRecords): DnsChange[] {
  const out: DnsChange[] = [];
  const setDiff = (field: DnsChange["field"], beforeRaw: string[], afterRaw: string[]) => {
    const isAddr = field === "a" || field === "aaaa";
    const before = isAddr ? networks(beforeRaw) : beforeRaw;
    const after = isAddr ? networks(afterRaw) : afterRaw;
    const added = after.filter((x) => !before.includes(x));
    const removed = before.filter((x) => !after.includes(x));
    if (!added.length && !removed.length) return;
    const severity: Severity = isAddr ? (added.length ? "warn" : "info") : "alert";
    out.push({ field, added, removed, severity });
  };
  setDiff("zone", baseline.zone ? [baseline.zone] : [], now.zone ? [now.zone] : []);
  setDiff("ns", baseline.ns, now.ns);
  setDiff("cname", baseline.cname, now.cname);
  setDiff("a", baseline.a, now.a);
  setDiff("aaaa", baseline.aaaa, now.aaaa);
  return out;
}

/**
 * Diffs the baseline against every resolver's own answer for zone, NS and CNAME (a resolver still caching the old
 * NS must not hide one that already sees the new NS), and against the merged address sets.
 */
export function diffObservation(baseline: DnsRecords, obs: Extract<DnsObservation, { ok: true }>): DnsChange[] {
  const isAddr = (c: DnsChange) => c.field === "a" || c.field === "aaaa";
  const out = diffDns(baseline, obs.records).filter(isAddr);
  const seen = new Set<string>();
  for (const { records } of obs.answers) {
    for (const c of diffDns(baseline, records).filter((c) => !isAddr(c))) {
      const key = JSON.stringify(c);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(c);
      }
    }
  }
  return out;
}
