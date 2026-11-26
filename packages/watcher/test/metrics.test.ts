import { test } from "node:test";
import assert from "node:assert/strict";
import { analyse, parseLog, percentile, toMarkdown, type Line } from "../src/metrics.ts";

const T0 = Date.parse("2026-12-03T00:00:00Z");
const at = (s: number) => new Date(T0 + s * 1000).toISOString();
const check = (s: number, extra: Partial<Line> = {}): Line => ({ at: at(s), status: "MATCH", ms: 400, perf: { checkMs: 400, rpcMs: 120, okxMs: { "/api/v6/dapp/scan": 300 } }, ...extra });
const community = (kind: number) => [{ channel: "tapesend", audience: "community", kind, ok: true }];

test("percentile is nearest-rank", () => {
  assert.equal(percentile([10, 20, 30, 40, 50], 50), 30);
  assert.equal(percentile([10, 20, 30, 40, 50], 95), 50);
  assert.equal(percentile([7], 95), 7);
});

test("parseLog sorts, and counts non-JSON and lines without a time instead of failing", () => {
  const text = [JSON.stringify(check(30)), "Watching https://x every 30 s", "", "{broken", JSON.stringify({ status: "MATCH" }), JSON.stringify(check(0))].join("\n");
  const { lines, skipped } = parseLog(text);
  assert.deepEqual(lines.map((l) => l.at), [at(0), at(30)]);
  assert.equal(skipped, 3);
});

test("a clean run: uptime 100 %, no incidents, no false alarms, latency percentiles", () => {
  const lines = Array.from({ length: 10 }, (_, i) => check(i * 30, { perf: { checkMs: 100 * (i + 1), rpcMs: 50, okxMs: { "/scan": 10 * (i + 1) } } }));
  const r = analyse(lines);
  assert.equal(r.checks, 10);
  assert.equal(r.intervalS, 30);
  assert.equal(r.uptimePct, 100);
  assert.deepEqual(r.incidents, []);
  assert.equal(r.falseAlarms, 0);
  assert.deepEqual(r.checkMs, { p50: 500, p95: 1000, max: 1000 });
  assert.deepEqual(r.okx, [{ endpoint: "/scan", n: 10, p50: 50, p95: 100 }]);
});

test("a gap (the PC slept) lowers uptime and is listed", () => {
  const lines = [0, 30, 60, 90, 120, 600, 630, 660].map((s) => check(s));
  const r = analyse(lines);
  assert.equal(r.gaps.length, 1);
  assert.equal(r.gaps[0]?.seconds, 480);
  assert.ok(r.uptimePct < 50 && r.uptimePct > 30, String(r.uptimePct));
});

test("a rehearsal: time to alert counts from the first bad check, and a declared drill is not a false alarm", () => {
  const lines = [
    check(0),
    check(30),
    check(60, { status: "MISMATCH" }),
    check(90, { status: "MISMATCH", alerts: community(1) }),
    check(120, { status: "MISMATCH" }),
    check(150),
    check(180),
    check(210, { alerts: community(3) }),
  ];
  const drill = { from: T0 + 50_000, to: T0 + 300_000 };
  const r = analyse(lines, { drills: [drill] });
  assert.equal(r.incidents.length, 1);
  assert.equal(r.incidents[0]?.timeToAlertS, 30);
  assert.equal(r.incidents[0]?.drill, true);
  assert.equal(r.incidents[0]?.endedAt, at(150));
  assert.equal(r.communityAlerts, 1, "the all-clear (kind 3) is not an alert");
  assert.equal(r.falseAlarms, 0);
});

test("the same alert outside any drill window is a false alarm", () => {
  const lines = [check(0), check(30, { status: "MISMATCH", alerts: community(1) }), check(60)];
  const r = analyse(lines);
  assert.equal(r.falseAlarms, 1);
  assert.equal(r.incidents[0]?.drill, false);
});

test("failed deliveries and team notices are not community alerts", () => {
  const lines = [
    check(0, { status: "MISMATCH", alerts: [{ channel: "telegram", audience: "community", kind: 1, ok: false }, { channel: "telegram", audience: "team", kind: "signal-warn", ok: true }] }),
    check(30),
  ];
  const r = analyse(lines);
  assert.equal(r.communityAlerts, 0);
  assert.equal(r.incidents[0]?.timeToAlertS, undefined);
});

test("an incident still open at the end of the log is reported as open", () => {
  const r = analyse([check(0), check(30, { status: "MISMATCH" })]);
  assert.equal(r.incidents[0]?.endedAt, undefined);
  assert.match(toMarkdown(r, "now"), /\| open \|/);
});

test("the markdown states the measured numbers, and an empty log says so", () => {
  const md = toMarkdown(analyse(Array.from({ length: 4 }, (_, i) => check(i * 30))), "2026-12-04T00:00:00Z");
  assert.match(md, /Uptime: \*\*100 %\*\*/);
  assert.match(md, /\*\*False alarms: 0\*\*/);
  assert.match(md, /OKX `\/api\/v6\/dapp\/scan` \(4 checks\) \| 300 \| 300/);
  assert.match(toMarkdown(analyse([]), "now"), /No checks in the log yet/);
});
