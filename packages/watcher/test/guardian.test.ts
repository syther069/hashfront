// The guardian pause in the incident state machine: when it is queued, how often, and what it is never allowed to do.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Status } from "../src/compare.ts";
import { emptyState, step, type AlertState, type IncidentConfig, type Observation } from "../src/alerts/incident.ts";
import { assertGuardianAllowed } from "../src/alerts/guardian.ts";

const H = (n: number) => `0x${n.toString(16).padStart(64, "0")}` as const;
const CFG: IncidentConfig = { confirm: 2, clear: 3, channels: ["telegram", "tapesend"], teamChat: true, guardian: true };
let clock = Date.parse("2026-11-26T00:00:00Z");
const obs = (status: Status, extra: Partial<Observation> = {}): Observation => ({
  status,
  contentObserved: H(status === "MATCH" ? 1 : 2),
  dnsAlert: false,
  dnsVerified: true,
  dnsUnknown: false,
  ctAlert: false,
  registryAlert: false,
  scanMalicious: false,
  at: new Date((clock += 30_000)),
  ...extra,
});

function run(seq: Observation[], cfg: IncidentConfig = CFG, start: AlertState = emptyState()) {
  let s = start;
  const made: { audience: string; kind: string; pending: string[] }[] = [];
  for (const o of seq) {
    const r = step(s, o, cfg);
    s = r.state;
    made.push(...r.created.map((m) => ({ audience: m.audience, kind: String(m.kind), pending: [...m.pending] })));
  }
  return { s, made };
}
const pauses = (made: { kind: string; pending: string[] }[]) => made.filter((m) => m.kind === "guardian-pause");

test("one MISMATCH pauses nothing; the confirmed incident queues exactly one pause, with the community alert", () => {
  assert.deepEqual(pauses(run([obs("MISMATCH")]).made), []);
  const { made } = run([obs("MISMATCH"), obs("MISMATCH")]);
  assert.deepEqual(made.map((m) => `${m.audience}:${m.kind}`), ["community:1", "team:guardian-pause"]);
  assert.deepEqual(pauses(made)[0]?.pending, ["guardian"], "it never goes to Telegram or TapeSend as a message of its own");
});

test("a long incident pauses once, not once per check", () => {
  const { made } = run(Array.from({ length: 12 }, () => obs("MISMATCH")));
  assert.equal(pauses(made).length, 1);
});

test("without --guardian nothing is queued", () => {
  const { made } = run([obs("MISMATCH"), obs("MISMATCH")], { ...CFG, guardian: false });
  assert.deepEqual(pauses(made), []);
});

test("a DNS, certificate or registry incident pauses too, and a content incident that follows does not pause again", () => {
  const dns = (status: Status) => obs(status, { registryAlert: true, registryObserved: H(9) });
  const { made, s } = run([dns("MATCH"), dns("MATCH"), obs("MISMATCH", { registryAlert: true }), obs("MISMATCH", { registryAlert: true })]);
  assert.equal(pauses(made).length, 1);
  assert.equal(s.guardianSent, true);
});

test("after the all-clear a new incident may pause again; the all-clear itself never unpauses", () => {
  const bad = [obs("MISMATCH"), obs("MISMATCH")];
  const ok = [obs("MATCH"), obs("MATCH"), obs("MATCH")];
  const { made, s } = run([...bad, ...ok, ...bad]);
  assert.equal(pauses(made).length, 2);
  assert.deepEqual(made.map((m) => m.kind).filter((k) => k === "3").length, 1, "one all-clear in between");
  assert.equal(s.guardianSent, true);
  // no step produces anything that could unpause: the only guardian message kind is "guardian-pause"
  assert.deepEqual([...new Set(made.filter((m) => m.pending.includes("guardian")).map((m) => m.kind))], ["guardian-pause"]);
});

test("team-only notices (CDN, host behind, scan flag) never pause", () => {
  const { made } = run([obs("CDN_MODIFIED"), obs("CDN_MODIFIED"), obs("MATCH", { scanMalicious: true, signalLevel: "alert" })]);
  assert.deepEqual(pauses(made), []);
});

test("the guardian is refused on X Layer mainnet and allowed on a fork or testnet", () => {
  assert.throws(() => assertGuardianAllowed(196), /not allowed on X Layer mainnet/);
  assert.doesNotThrow(() => assertGuardianAllowed(31337));
  assert.doesNotThrow(() => assertGuardianAllowed(1952));
});
