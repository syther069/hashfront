// Registry signal: what the domain's registry says (RDAP) and whether DNSSEC still validates (DoH). Registrar hijacks
// change this data at the registry first: nameservers are swapped, transfer locks are lifted, DNSSEC is stripped (the
// Aerodrome/Velodrome attackers removed it before pointing the domain elsewhere). Both sources are public and are
// asked only for the domain we already watch.
import type { Severity } from "./dns.ts";
import { errorText } from "./util.ts";
import type { FetchLike } from "./ct.ts";

export interface RegistryBaseline {
  /** every "... prohibited" status (client or server transfer, update, delete locks), sorted */
  locks: string[];
  delegationSigned: boolean;
  /** nameservers as the registry lists them, lowercase, sorted */
  registryNs: string[];
  /** RDAP "last changed" event */
  lastChanged: string;
}

export interface RegistryObservation {
  /** present when RDAP answered */
  rdap?: RegistryBaseline;
  /** present when the DoH DS query answered: is there a DS record, and did the resolver validate it (AD flag) */
  dnssec?: { ds: boolean; validated: boolean };
  errors: string[];
}

export interface RegistryFinding {
  severity: Severity;
  field: "nameservers" | "dnssec" | "lock" | "changed";
  message: string;
}

const TIMEOUT_MS = 10_000;

async function getJson(fetchFn: FetchLike, url: string, accept: string): Promise<unknown> {
  const res = await fetchFn(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept, "user-agent": "hashfront-watcher/0.1" } });
  if (!res.ok) throw new Error(`${new URL(url).hostname} answered HTTP ${res.status}`);
  return res.json();
}

const sorted = (list: string[]) => [...new Set(list)].sort();

/** Pure: the parts of an RDAP domain object that matter. Throws when the answer is not a domain object. */
export function parseRdap(raw: unknown): RegistryBaseline {
  const o = raw as { objectClassName?: unknown; status?: unknown; nameservers?: unknown; secureDNS?: { delegationSigned?: unknown }; events?: unknown } | null;
  if (!o || typeof o !== "object" || o.objectClassName !== "domain") throw new Error("RDAP answered with something other than a domain object");
  const status = Array.isArray(o.status) ? o.status.filter((s): s is string => typeof s === "string") : [];
  const ns = Array.isArray(o.nameservers) ? o.nameservers.map((n) => String((n as { ldhName?: unknown }).ldhName ?? "").toLowerCase()).filter(Boolean) : [];
  const events = Array.isArray(o.events) ? (o.events as { eventAction?: unknown; eventDate?: unknown }[]) : [];
  // "last update of RDAP database" moves on every query and is not a change of the domain
  const changed = events.find((e) => e.eventAction === "last changed");
  return {
    locks: sorted(status.map((s) => s.toLowerCase()).filter((s) => s.includes("prohibited"))),
    delegationSigned: o.secureDNS?.delegationSigned === true,
    registryNs: sorted(ns),
    lastChanged: typeof changed?.eventDate === "string" ? changed.eventDate : "",
  };
}

/** Pure: the DS answer of a DoH JSON response. */
export function parseDoh(raw: unknown): { ds: boolean; validated: boolean } {
  const o = raw as { Status?: unknown; AD?: unknown; Answer?: unknown } | null;
  if (!o || typeof o !== "object" || typeof o.Status !== "number") throw new Error("the DoH resolver answered with something other than DNS JSON");
  if (o.Status !== 0) throw new Error(`the DoH resolver answered DNS status ${o.Status}`);
  const answers = Array.isArray(o.Answer) ? (o.Answer as { type?: unknown }[]) : [];
  return { ds: answers.some((a) => a.type === 43), validated: o.AD === true };
}

export async function observeRegistry(domain: string, fetchFn: FetchLike = fetch as FetchLike): Promise<RegistryObservation> {
  const errors: string[] = [];
  const [rdap, dnssec] = await Promise.all([
    getJson(fetchFn, `https://rdap.org/domain/${encodeURIComponent(domain)}`, "application/rdap+json").then(parseRdap, (e: unknown) => (errors.push(`RDAP: ${errorText(e)}`), undefined)),
    getJson(fetchFn, `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=DS`, "application/dns-json").then(parseDoh, (e: unknown) => (errors.push(`DNSSEC: ${errorText(e)}`), undefined)),
  ]);
  return { ...(rdap ? { rdap } : {}), ...(dnssec ? { dnssec } : {}), errors };
}

/** DNSSEC counts as off when either source says so; as on only when the registry lists a signed delegation. */
export function dnssecOff(o: RegistryObservation): boolean {
  return (o.rdap !== undefined && !o.rdap.delegationSigned) || (o.dnssec !== undefined && !o.dnssec.ds);
}

/**
 * alert: DNSSEC was on and is off now, or the registry's nameservers changed.
 * warn: a lock was removed, or the registry's "last changed" moved (something at the registry was edited).
 * info: DNSSEC or a lock was added.
 */
export function judgeRegistry(o: RegistryObservation, base: RegistryBaseline): RegistryFinding[] {
  const out: RegistryFinding[] = [];
  if (base.delegationSigned && dnssecOff(o)) out.push({ severity: "alert", field: "dnssec", message: "DNSSEC was on and is now off" });
  if (!base.delegationSigned && o.rdap?.delegationSigned) out.push({ severity: "info", field: "dnssec", message: "DNSSEC is now on" });
  const now = o.rdap;
  if (!now) return out;
  if (now.registryNs.join(",") !== base.registryNs.join(",")) {
    out.push({ severity: "alert", field: "nameservers", message: `registry nameservers changed: ${base.registryNs.join(", ") || "none"} -> ${now.registryNs.join(", ") || "none"}` });
  }
  for (const l of base.locks) if (!now.locks.includes(l)) out.push({ severity: "warn", field: "lock", message: `registry status removed: ${l}` });
  for (const l of now.locks) if (!base.locks.includes(l)) out.push({ severity: "info", field: "lock", message: `registry status added: ${l}` });
  if (now.lastChanged && base.lastChanged && now.lastChanged > base.lastChanged) {
    out.push({ severity: "warn", field: "changed", message: `the registry recorded a change on ${now.lastChanged} (last known: ${base.lastChanged})` });
  }
  return out;
}

/** A baseline needs the RDAP answer; DNSSEC from RDAP, with DoH only able to turn it off. */
export function registryBaselineFrom(o: RegistryObservation): RegistryBaseline | undefined {
  if (!o.rdap) return undefined;
  return { ...o.rdap, delegationSigned: o.rdap.delegationSigned && !(o.dnssec && !o.dnssec.ds) };
}
