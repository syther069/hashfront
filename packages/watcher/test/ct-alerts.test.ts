// How a Certificate Transparency finding reaches the team and the community: through the incident state machine.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Status } from "../src/compare.ts";
import { emptyState, KIND, step, type AlertState, type IncidentConfig, type Observation } from "../src/alerts/incident.ts";
import { observationOf } from "../src/alerts/index.ts";
import type { CheckResult } from "../src/watch.ts";
import type { SignalsReport } from "../src/signals/index.ts";

const H = (n: number) => `0x${n.toString(16).padStart(64, "0")}` as const;
const CFG: IncidentConfig = { confirm: 2, clear: 3, channels: ["telegram", "tapesend"], teamChat: true };
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

function run(seq: Observation[], start: AlertState = emptyState()) {
  let s = start;
  const out: { kind: string; audience: string; detail?: string; observed: string }[] = [];
  for (const o of seq) {
    const r = step(s, o, CFG);
    s = r.state;
    out.push(...r.created.map((m) => ({ kind: String(m.kind), audience: m.audience, observed: m.observed, ...(m.detail ? { detail: m.detail } : {}) })));
  }
  return { s, out };
}

const ct = { ctAlert: true, ctNotice: "alert: new certificate from an unknown issuer (Shady CA); names: app.hashswap.test", ctObserved: H(7), signalLevel: "alert" as const };

test("an alert-level certificate opens the DNS incident after two checks, even while the content matches", () => {
  const { out } = run([obs("MATCH", ct), obs("MATCH", ct), obs("MATCH", ct)]);
  const community = out.filter((m) => m.audience === "community");
  assert.deepEqual(community.map((m) => m.kind), [String(KIND.DNS_CHANGED)], "once per incident");
  assert.equal(community[0]?.observed, H(7), "the evidence is the CT findings, not the page hash");
});

test("the team hears about the new certificate once, with issuer and names", () => {
  const { out } = run([obs("MATCH", ct), obs("MATCH", ct), obs("MATCH", ct)]);
  const team = out.filter((m) => m.audience === "team");
  assert.deepEqual(team.map((m) => m.kind), ["new-certificate"]);
  assert.match(team[0]?.detail ?? "", /Shady CA.*app\.hashswap\.test/);
});

test("a warning-level certificate notifies the team but never the community", () => {
  const warn = { ctNotice: "warn: new certificate from Let's Encrypt; names: app.hashswap.test", signalLevel: "warn" as const };
  const { out } = run([obs("MATCH", warn), obs("MATCH", warn)]);
  assert.deepEqual(out.filter((m) => m.audience === "community"), []);
  assert.ok(out.some((m) => m.audience === "team" && m.kind === "new-certificate"));
});

test("a certificate incident is cleared only after three checks without the alert", () => {
  const open = run([obs("MATCH", ct), obs("MATCH", ct)]);
  const still = run([obs("MATCH", ct), obs("MATCH"), obs("MATCH")], open.s);
  assert.deepEqual(still.out.filter((m) => m.audience === "community"), [], "two clean checks are not enough");
  const clear = run([obs("MATCH"), obs("MATCH"), obs("MATCH")], open.s);
  assert.deepEqual(clear.out.filter((m) => m.audience === "community").map((m) => m.kind), [String(KIND.RESOLVED)]);
});

test("observationOf reads CT findings into the observation and cleans the names for the team text", () => {
  const signals: SignalsReport = {
    level: "alert",
    baseline: "compared",
    ct: {
      level: "alert",
      findings: [{ severity: "alert", message: "new certificate from an unknown issuer (Shady CA)", issuer: "Shady CA", hosts: ["app.hashswap.test", "evil.example <b>http://x</b>"] }],
    },
  };
  const r = { verdict: { status: "MATCH", observed: H(1) }, checkedAt: new Date(), signals } as unknown as CheckResult;
  const o = observationOf(r);
  assert.equal(o.ctAlert, true);
  assert.match(o.ctNotice ?? "", /Shady CA/);
  assert.doesNotMatch(o.ctNotice ?? "", /[<>:/]b|http:\/\//, "markup and links from the log are stripped");
  assert.match(o.ctObserved ?? "", /^0x[0-9a-f]{64}$/);
});

test("an info-level certificate (a routine renewal) makes no notice and no incident", () => {
  const signals: SignalsReport = { level: "info", baseline: "compared", ct: { level: "info", findings: [{ severity: "info", message: "new certificate from Let's Encrypt (renewal window)", issuer: "Let's Encrypt", hosts: ["app.hashswap.test"] }] } };
  const r = { verdict: { status: "MATCH", observed: H(1) }, checkedAt: new Date(), signals } as unknown as CheckResult;
  const o = observationOf(r);
  assert.equal(o.ctAlert, false);
  assert.equal(o.ctNotice, undefined);
});
