// Incident state machine (plan step 9): turns a stream of checks into a few messages.
// Pure: no I/O, so every rule here is unit-tested. Delivery and persistence live in ./index.ts.
import type { Status } from "../compare.ts";
import type { Level } from "../signals/index.ts";

/** ReleaseGate alert kinds (contracts/src/ReleaseGate.sol). */
export const KIND = { MISMATCH: 1, DNS_CHANGED: 2, RESOLVED: 3 } as const;
export type AlertKind = (typeof KIND)[keyof typeof KIND];

/** Team-only notices: worth a look, but not proof of a hijack, so never sent to the community or on chain. */
export type TeamNotice =
  | "cdn-modified"
  | "deployed-before-activation"
  | "host-behind"
  | "unreachable"
  | "unverifiable"
  | "signal-warn"
  | "phishing-flag"
  | "attacker-addresses"
  | "new-certificate"
  | "registry-change"
  | "dns-unknown"
  | "reporter-gas-low";

export type Channel = "telegram" | "tapesend";
export type Hex = `0x${string}`;

export interface Observation {
  status: Status;
  /** sha256 of the served root page */
  contentObserved: Hex;
  signalLevel?: Level;
  /** an NS, zone or CNAME change against the baseline */
  dnsAlert: boolean;
  /** DNS resolved and was compared with the baseline, so "no change" is a real answer */
  dnsVerified: boolean;
  /** DNS signals are on but could not be checked (resolvers failed, or no usable baseline) */
  dnsUnknown: boolean;
  /** a certificate from an issuer the host never used (CT); opens the same incident as a DNS change */
  ctAlert: boolean;
  /** any new certificate that is not a routine renewal, with issuer and hosts for the team message */
  ctNotice?: string;
  /** sha256 of the CT findings, the evidence when CT alone opens the incident */
  ctObserved?: Hex;
  /** the registry's nameservers changed or DNSSEC went from on to off (RDAP, DoH); opens the same incident */
  registryAlert: boolean;
  /** any registry finding above info, for the team message */
  registryNotice?: string;
  registryObserved?: Hex;
  /** sha256 of the compared DNS fields, when DNS resolved */
  dnsObserved?: Hex;
  scanMalicious: boolean;
  /** addresses seen only in the hijacked site, checksummed (MISMATCH only) */
  suspects?: string[];
  /** the reporter can no longer pay for a few onchain alerts */
  reporterGasLow?: boolean;
  at: Date;
}

export interface Outgoing {
  id: string;
  audience: "community" | "team";
  kind: AlertKind | TeamNotice;
  observed: Hex;
  /** extra text for team notices: addresses or certificate names only, never links */
  detail?: string;
  createdAt: string;
  /** channels this message still has to reach; it leaves the outbox when empty */
  pending: Channel[];
  attempts: number;
}

type IncidentType = "mismatch" | "dns";

export interface AlertState {
  version: 1;
  runs: Record<IncidentType, number>;
  open: Partial<Record<IncidentType, { openedAt: string; observed: Hex }>>;
  /** consecutive clean checks while an incident is open */
  clearRun: number;
  team: Partial<Record<TeamNotice, { run: number; notified: boolean }>>;
  outbox: Outgoing[];
  seq: number;
}

export interface IncidentConfig {
  /** consecutive bad checks before a community alert (default 2: about 60 s at a 30 s interval) */
  confirm: number;
  /** consecutive clean checks before the all-clear (default 3) */
  clear: number;
  /** community channels (the team only gets Telegram) */
  channels: Channel[];
  /** whether a team chat exists; without one, team notices are dropped */
  teamChat: boolean;
}

/** Consecutive checks before each team notice; slow ones are normal for a while (deploys, flaky networks). */
export const TEAM_AFTER: Record<TeamNotice, number> = {
  "cdn-modified": 2,
  "deployed-before-activation": 2,
  "host-behind": 10,
  unreachable: 4,
  unverifiable: 4,
  "signal-warn": 2,
  "phishing-flag": 1,
  "attacker-addresses": 1,
  "new-certificate": 1,
  "registry-change": 1,
  "dns-unknown": 4,
  "reporter-gas-low": 1,
};

export const emptyState = (): AlertState => ({ version: 1, runs: { mismatch: 0, dns: 0 }, open: {}, clearRun: 0, team: {}, outbox: [], seq: 0 });

function teamConditions(o: Observation): Set<TeamNotice> {
  const on = new Set<TeamNotice>();
  if (o.status === "CDN_MODIFIED") on.add("cdn-modified");
  if (o.status === "DEPLOYED_BEFORE_ACTIVATION") on.add("deployed-before-activation");
  if (o.status === "HOST_BEHIND") on.add("host-behind");
  if (o.status === "UNREACHABLE") on.add("unreachable");
  if (o.status === "UNVERIFIABLE") on.add("unverifiable");
  if (o.signalLevel === "warn") on.add("signal-warn");
  // An OnchainOS blacklist hit on our own domain is urgent, but the onchain alert texts describe a file or DNS
  // change, not a blacklist entry, so it goes to the team, who can confirm and act.
  if (o.scanMalicious) on.add("phishing-flag");
  if (o.status === "MISMATCH" && o.suspects?.length) on.add("attacker-addresses");
  if (o.ctNotice) on.add("new-certificate");
  if (o.registryNotice) on.add("registry-change");
  if (o.dnsUnknown) on.add("dns-unknown");
  if (o.reporterGasLow) on.add("reporter-gas-low");
  return on;
}

/** Advances the state by one check and returns the messages it creates (also appended to state.outbox). */
export function step(prev: AlertState, o: Observation, cfg: IncidentConfig): { state: AlertState; created: Outgoing[] } {
  const s: AlertState = structuredClone(prev);
  const created: Outgoing[] = [];
  const at = o.at.toISOString();
  const push = (audience: Outgoing["audience"], kind: Outgoing["kind"], observed: Hex, detail?: string) => {
    const pending: Channel[] = audience === "community" ? [...cfg.channels] : cfg.teamChat ? ["telegram"] : [];
    if (!pending.length) return;
    const m: Outgoing = { id: `${++s.seq}`, audience, kind, observed, createdAt: at, pending, attempts: 0, ...(detail ? { detail } : {}) };
    s.outbox.push(m);
    created.push(m);
  };

  const bad: Record<IncidentType, boolean> = { mismatch: o.status === "MISMATCH", dns: o.dnsAlert || o.ctAlert || o.registryAlert };
  const evidence: Record<IncidentType, Hex> = { mismatch: o.contentObserved, dns: (o.dnsAlert ? o.dnsObserved : o.ctAlert ? o.ctObserved : o.registryAlert ? o.registryObserved : undefined) ?? o.dnsObserved ?? o.contentObserved };
  const wasOpen = Object.keys(s.open).length > 0;

  // A check that could not answer holds the count: alternating a bad page with a timeout (or failing DNS on purpose)
  // must not keep resetting it below --confirm.
  const unknown: Record<IncidentType, boolean> = {
    mismatch: o.status === "UNREACHABLE" || o.status === "UNVERIFIABLE",
    dns: !o.dnsVerified,
  };
  for (const t of ["mismatch", "dns"] as const) {
    if (bad[t]) s.runs[t]++;
    else if (!unknown[t]) s.runs[t] = 0;
    if (!s.open[t] && s.runs[t] >= cfg.confirm) {
      s.open[t] = { openedAt: at, observed: evidence[t] };
      push("community", t === "mismatch" ? KIND.MISMATCH : KIND.DNS_CHANGED, evidence[t]);
    }
  }

  // All clear: only when every open incident is over, the content matches and no signal is at alert level.
  if (wasOpen) {
    // An open DNS incident clears only on DNS that was actually re-checked: a hijacker controlling the nameservers
    // could otherwise make the queries fail and get an all-clear sent.
    const dnsClean = s.open.dns ? o.dnsVerified && !o.dnsAlert && !o.ctAlert && !o.registryAlert : !o.dnsAlert && !o.ctAlert && !o.registryAlert;
    const clean = o.status === "MATCH" && dnsClean && o.signalLevel !== "alert";
    s.clearRun = clean ? s.clearRun + 1 : 0;
    if (s.clearRun >= cfg.clear) {
      s.open = {};
      s.clearRun = 0;
      push("community", KIND.RESOLVED, o.contentObserved);
    }
  } else {
    s.clearRun = 0;
  }

  const on = teamConditions(o);
  for (const n of Object.keys(TEAM_AFTER) as TeamNotice[]) {
    if (!on.has(n)) {
      delete s.team[n];
      continue;
    }
    const t = (s.team[n] ??= { run: 0, notified: false });
    t.run++;
    if (!t.notified && t.run >= TEAM_AFTER[n]) {
      t.notified = true;
      push("team", n, o.contentObserved, n === "attacker-addresses" ? o.suspects?.slice(0, 5).join("\n") : n === "new-certificate" ? o.ctNotice : n === "registry-change" ? o.registryNotice : undefined);
    }
  }
  return { state: s, created };
}

/** Records one delivery attempt. Successful channels leave `pending`; a message is dropped after `maxAttempts`. */
export function settle(s: AlertState, id: string, results: { channel: Channel; ok: boolean }[], maxAttempts = 50): Outgoing | undefined {
  const m = s.outbox.find((x) => x.id === id);
  if (!m) return undefined;
  m.attempts++;
  m.pending = m.pending.filter((c) => !results.some((r) => r.channel === c && r.ok));
  if (!m.pending.length || m.attempts >= maxAttempts) s.outbox = s.outbox.filter((x) => x.id !== id);
  return m;
}
