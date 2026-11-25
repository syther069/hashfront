import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Status } from "../src/compare.ts";
import { emptyState, KIND, settle, step, type AlertState, type IncidentConfig, type Observation } from "../src/alerts/incident.ts";
import { assertNoLink, findLink, redact, sendTelegram } from "../src/alerts/telegram.ts";
import { createDispatcher, validateName } from "../src/alerts/index.ts";
import type { CheckResult } from "../src/watch.ts";
import type { Context } from "@hashfront/cli/context";

const H = (n: number) => `0x${n.toString(16).padStart(64, "0")}` as const;
const CFG: IncidentConfig = { confirm: 2, clear: 3, channels: ["telegram", "tapesend"], teamChat: true };
let clock = Date.parse("2026-11-19T00:00:00Z");
const obs = (status: Status, extra: Partial<Observation> = {}): Observation => ({
  status,
  contentObserved: H(status === "MATCH" ? 1 : 2),
  dnsAlert: false,
  dnsVerified: true,
  dnsUnknown: false,
  scanMalicious: false,
  at: new Date((clock += 30_000)),
  ...extra,
});

function run(seq: Observation[], cfg = CFG, start: AlertState = emptyState()) {
  let s = start;
  const kinds: (string | number)[] = [];
  for (const o of seq) {
    const r = step(s, o, cfg);
    s = r.state;
    kinds.push(...r.created.map((m) => `${m.audience}:${m.kind}`));
  }
  return { s, kinds };
}

test("one MISMATCH is not an alert; two in a row are, once, however long it lasts", () => {
  assert.deepEqual(run([obs("MATCH"), obs("MISMATCH"), obs("MATCH")]).kinds, []);
  const { kinds } = run([obs("MISMATCH"), ...Array.from({ length: 10 }, () => obs("MISMATCH"))]);
  assert.deepEqual(kinds, [`community:${KIND.MISMATCH}`]);
});

test("the all-clear needs 3 clean checks in a row and is sent once", () => {
  const bad = [obs("MISMATCH"), obs("MISMATCH")];
  assert.deepEqual(run([...bad, obs("MATCH"), obs("MATCH")]).kinds, [`community:1`]);
  assert.deepEqual(run([...bad, obs("MATCH"), obs("MATCH"), obs("MISMATCH"), obs("MATCH"), obs("MATCH")]).kinds, [`community:1`]);
  const { kinds, s } = run([...bad, obs("MATCH"), obs("MATCH"), obs("MATCH"), obs("MATCH"), obs("MATCH")]);
  assert.deepEqual(kinds, [`community:1`, `community:3`]);
  assert.deepEqual(s.open, {});
});

test("a new incident after the all-clear alerts again", () => {
  const bad = [obs("MISMATCH"), obs("MISMATCH")];
  const ok = [obs("MATCH"), obs("MATCH"), obs("MATCH")];
  assert.deepEqual(run([...bad, ...ok, ...bad]).kinds, ["community:1", "community:3", "community:1"]);
});

test("a DNS incident is separate from a content incident, and the all-clear waits for both", () => {
  const dns = (status: Status) => obs(status, { dnsAlert: true, dnsObserved: H(9), signalLevel: "alert" });
  const { kinds } = run([dns("MATCH"), dns("MATCH"), dns("MISMATCH"), dns("MISMATCH"), obs("MATCH"), obs("MATCH"), obs("MATCH")]);
  assert.deepEqual(kinds, ["community:2", "community:1", "community:3"]);
  // the DNS alert carries the DNS evidence hash
  const first = step(step(emptyState(), dns("MATCH"), CFG).state, dns("MATCH"), CFG).created[0];
  assert.equal(first?.observed, H(9));
});

test("a DNS change that persists never gives an all-clear (until the team re-baselines)", () => {
  const dns = obs("MATCH", { dnsAlert: true, signalLevel: "alert" });
  const { kinds } = run(Array.from({ length: 8 }, () => ({ ...dns, at: new Date((clock += 30_000)) })));
  assert.deepEqual(kinds, ["community:2"]);
});

test("unknown checks hold the count: MISMATCH, UNREACHABLE, MISMATCH still alerts", () => {
  assert.deepEqual(run([obs("MISMATCH"), obs("UNREACHABLE"), obs("MISMATCH")]).kinds, ["community:1"]);
  const dnsBad = () => obs("MATCH", { dnsAlert: true, signalLevel: "alert" });
  const dnsDown = () => obs("MATCH", { dnsVerified: false, dnsUnknown: true, signalLevel: "unknown" });
  assert.deepEqual(run([dnsBad(), dnsDown(), dnsBad()]).kinds, ["community:2"]);
});

test("no all-clear for a DNS incident while DNS cannot be re-checked", () => {
  const dnsBad = () => obs("MATCH", { dnsAlert: true, signalLevel: "alert" });
  const dnsDown = () => obs("MATCH", { dnsVerified: false, dnsUnknown: true, signalLevel: "unknown" });
  const open = [dnsBad(), dnsBad()];
  const blind = run([...open, dnsDown(), dnsDown(), dnsDown(), dnsDown(), dnsDown()]);
  assert.deepEqual(blind.kinds, ["community:2", "team:dns-unknown"]);
  assert.ok(blind.s.open.dns);
  assert.deepEqual(run([...open, obs("MATCH"), obs("MATCH"), obs("MATCH")]).kinds, ["community:2", "community:3"]);
});

test("not-proof states go to the team only, after their own delay, once per stretch", () => {
  assert.deepEqual(run([obs("CDN_MODIFIED"), obs("CDN_MODIFIED"), obs("CDN_MODIFIED")]).kinds, ["team:cdn-modified"]);
  assert.deepEqual(run(Array.from({ length: 3 }, () => obs("UNREACHABLE"))).kinds, []);
  assert.deepEqual(run(Array.from({ length: 6 }, () => obs("UNREACHABLE"))).kinds, ["team:unreachable"]);
  assert.deepEqual(run(Array.from({ length: 9 }, () => obs("HOST_BEHIND"))).kinds, []);
  assert.deepEqual(run([obs("MATCH", { scanMalicious: true, signalLevel: "alert" })]).kinds, ["team:phishing-flag"]);
  // stretch ends and starts again: notified again
  const cdn = [obs("CDN_MODIFIED"), obs("CDN_MODIFIED")];
  assert.deepEqual(run([...cdn, obs("MATCH"), ...cdn]).kinds, ["team:cdn-modified", "team:cdn-modified"]);
  // no team chat: dropped, community untouched
  assert.deepEqual(run(cdn, { ...CFG, teamChat: false }).kinds, []);
});

test("settle: a delivered channel leaves pending, a failed one stays for the next check", () => {
  const { s } = run([obs("MISMATCH"), obs("MISMATCH")]);
  const id = s.outbox[0]!.id;
  settle(s, id, [
    { channel: "telegram", ok: true },
    { channel: "tapesend", ok: false },
  ]);
  assert.deepEqual(s.outbox[0]?.pending, ["tapesend"]);
  settle(s, id, [{ channel: "tapesend", ok: true }]);
  assert.equal(s.outbox.length, 0);
  // gives up after maxAttempts
  const again = run([obs("MISMATCH"), obs("MISMATCH")]).s;
  for (let i = 0; i < 3; i++) settle(again, again.outbox[0]!.id, [{ channel: "telegram", ok: false }], 3);
  assert.equal(again.outbox.length, 0);
});

test("links are refused: URLs, www and bare domains (Telegram auto-links them)", () => {
  for (const bad of ["see https://x", "go to app.example.org", "www.x", "ftp://x", "visit hashswap.xyz now"]) {
    assert.notEqual(findLink(bad), undefined, bad);
  }
  assert.throws(() => assertNoLink("use app.example.org"));
  assertNoLink("HashSwap: Hashfront alert: website does not match the approved release\n\nrelease v12. Do not connect. Observed hash: 0xabc");
  assert.throws(() => validateName("hashswap.org"));
  assert.equal(validateName(" HashSwap "), "HashSwap");
});

test("the bot token never appears in an error", async () => {
  const token = "123456:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  assert.equal(redact(`fetch https://api/bot${token}/sendMessage failed`, token), "fetch https://api/bot<redacted>/sendMessage failed");
  const failing = (async (url: string) => {
    throw new Error(`connect ECONNREFUSED for ${url}`);
  }) as unknown as typeof fetch;
  await assert.rejects(sendTelegram({ token, chat: "1", fetch: failing }, "1", "hello"), (e: Error) => !e.message.includes(token) && e.message.includes("<redacted>"));
  const denied = (async () => new Response(JSON.stringify({ ok: false, description: "Unauthorized" }), { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(sendTelegram({ token, chat: "1", fetch: denied }, "1", "hello"), /HTTP 401: Unauthorized/);
});

// ---------------------------------------------------------------- dispatcher, with a stub Telegram and no chain
function check(status: Status): CheckResult {
  return {
    verdict: { status, liveRelease: 1n, observed: H(status === "MATCH" ? 1 : 2), diffs: [], allowed: [], stripped: [], hints: [] } as unknown as CheckResult["verdict"],
    checkedAt: new Date((clock += 30_000)),
    durationMs: 5,
    missingManifests: [],
    rejectedManifests: [],
  };
}

test("dispatcher: one Telegram message per incident, failed sends retried, state survives a restart", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "hashfront-alerts-"));
  try {
    const sent: { chat: string; text: string }[] = [];
    let up = false;
    const fakeFetch = (async (_url: string, init: RequestInit) => {
      if (!up) throw new Error("network down");
      const b = JSON.parse(String(init.body)) as { chat_id: string; text: string; disable_web_page_preview: boolean };
      assert.equal(b.disable_web_page_preview, true);
      sent.push({ chat: b.chat_id, text: b.text });
      return new Response('{"ok":true}');
    }) as unknown as typeof fetch;
    // readCtx whose RPC always fails, so the local copy of the text is used
    const readCtx = { gate: H(0), publicClient: { readContract: () => Promise.reject(new Error("rpc down")) } } as unknown as Context;
    const make = () =>
      createDispatcher({ statePath: path.join(dir, "alerts.json"), name: "HashSwap", readCtx, telegram: { token: "1:x", chat: "-100", fetch: fakeFetch } });

    let d = make();
    await d.handle(check("MISMATCH"));
    const failed = await d.handle(check("MISMATCH")); // incident opens, Telegram is down
    assert.deepEqual(failed.map((x) => [x.channel, x.ok]), [["telegram", false]]);
    assert.equal(sent.length, 0);

    d = make(); // restart: the undelivered alert is still pending, the incident is still open
    up = true;
    const retried = await d.handle(check("MISMATCH"));
    assert.deepEqual(retried.map((x) => [x.channel, x.kind, x.ok]), [["telegram", 1, true]]);
    for (let i = 0; i < 5; i++) assert.deepEqual(await d.handle(check("MISMATCH")), []);
    assert.equal(sent.length, 1);
    assert.match(sent[0]!.text, /^HashSwap: Hashfront alert: website does not match the approved release/);
    assertNoLink(sent[0]!.text);

    for (let i = 0; i < 3; i++) await d.handle(check("MATCH"));
    assert.equal(sent.length, 2);
    assert.match(sent[1]!.text, /all clear/);
    const saved = JSON.parse(await readFile(path.join(dir, "alerts.json"), "utf8")) as AlertState;
    assert.deepEqual(saved.open, {});
    assert.equal(saved.outbox.length, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("attacker addresses go to the team once per incident, as plain addresses, never to the community", () => {
  const A = ["0xBAd0000000000000000000000000000000000Bad", "0x1111111111111111111111111111111111111111"];
  const s0 = emptyState();
  let s = s0;
  const team: { kind: string; detail?: string }[] = [];
  for (const o of [obs("MISMATCH", { suspects: A }), obs("MISMATCH", { suspects: A }), obs("MISMATCH", { suspects: A })]) {
    const r = step(s, o, CFG);
    s = r.state;
    team.push(...r.created.filter((m) => m.audience === "team").map((m) => ({ kind: String(m.kind), ...(m.detail ? { detail: m.detail } : {}) })));
  }
  assert.deepEqual(team, [{ kind: "attacker-addresses", detail: A.join("\n") }]);
  // no suspects (extraction found nothing), or content that matches: no notice
  assert.deepEqual(run([obs("MISMATCH"), obs("MISMATCH")]).kinds, ["community:1"]);
  assert.deepEqual(run([obs("MATCH", { suspects: A })]).kinds, []);
});

test("at most 5 addresses are listed", () => {
  const many = Array.from({ length: 8 }, (_, i) => `0x${String(i + 1).repeat(40)}`);
  const r = step(emptyState(), obs("MISMATCH", { suspects: many }), CFG);
  assert.equal(r.created.find((m) => m.kind === "attacker-addresses")?.detail?.split("\n").length, 5);
});
