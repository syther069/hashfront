import { test } from "node:test";
import assert from "node:assert/strict";
import { CHAIN_STALE_MS, SITE_STALE_MS, ageText, statusOf, type ChainFacts, type StatusInputs } from "../src/statusModel.ts";

const NOW = Date.parse("2026-11-26T12:00:00Z");
const chainFacts = (o: Partial<ChainFacts> = {}): ChainFacts => ({ liveRelease: 2n, migrated: false, frozen: false, alertKind: 0, alertAgeS: undefined, alertRelease: 0n, ...o });
const good = (): StatusInputs => ({
  nowMs: NOW,
  chain: { facts: chainFacts(), error: undefined, fetchedAtMs: NOW - 5_000, refreshFailed: false },
  site: { pending: false, failed: false, facts: { status: "ok", liveRelease: 2, checkedAtMs: NOW - 10_000 } },
  hasVerifiedCopy: true,
});
const with_ = (f: (i: StatusInputs) => void): StatusInputs => {
  const i = good();
  f(i);
  return i;
};

test("everything present, fresh and agreeing: the one green state, with its scope stated", () => {
  const v = statusOf(good());
  assert.equal(v.kind, "matches");
  assert.equal(v.tone, "good");
  assert.equal(v.headline, "Site matches approved release v2");
  assert.match(v.detail, /status server/);
  assert.match(v.detail, /not a guarantee/);
  assert.deepEqual(v.reasons, []);
});

test("an open alert wins over everything, names its kind, and puts the verified copy first", () => {
  for (const [kind, text] of [[1, /does not match the approved release/], [2, /domain records changed/]] as const) {
    const v = statusOf(with_((i) => (i.chain.facts = chainFacts({ alertKind: kind, alertAgeS: 12, alertRelease: 2n }))));
    assert.equal(v.kind, "alert");
    assert.equal(v.tone, "bad");
    assert.match(v.headline, text);
    assert.match(v.detail, /Reported 12 s ago while v2 was live/);
    assert.equal(v.primary, "verified-copy");
    assert.equal(v.secondary, "check-approvals");
  }
});

test("with no verified copy configured, checking approvals is the primary action; no link is ever invented", () => {
  const v = statusOf(with_((i) => ((i.chain.facts = chainFacts({ alertKind: 1, alertAgeS: 3 })), (i.hasVerifiedCopy = false))));
  assert.equal(v.primary, "check-approvals");
  assert.equal(v.secondary, "none");
});

test("an alert stays open even when the status server currently sees a match, and says so", () => {
  const v = statusOf(with_((i) => (i.chain.facts = chainFacts({ alertKind: 1, alertAgeS: 30 }))));
  assert.equal(v.kind, "alert");
  assert.match(v.detail, /not been closed onchain/);
});

test("a mismatch seen by the status server before any onchain alert is a red state that says it is not onchain yet", () => {
  const v = statusOf(with_((i) => (i.site.facts = { status: "alert", liveRelease: 2, checkedAtMs: NOW - 4_000 })));
  assert.equal(v.kind, "site-differs");
  assert.equal(v.tone, "bad");
  assert.match(v.detail, /not reported onchain yet/);
  assert.match(v.detail, /11:59:56 UTC/);
});

test("the status server unavailable or still loading is neutral, never green, and asks to try again when it failed", () => {
  const failed = statusOf(with_((i) => ((i.site.failed = true), (i.site.facts = undefined))));
  assert.equal(failed.kind, "no-site-check");
  assert.equal(failed.tone, "neutral");
  assert.equal(failed.headline, "No alert reported onchain");
  assert.equal(failed.primary, "retry");
  const pending = statusOf(with_((i) => ((i.site.pending = true), (i.site.facts = undefined))));
  assert.equal(pending.kind, "no-site-check");
  assert.match(pending.detail, /Checking/);
});

test("unknown from the status server, a release disagreement and a stale check are each 'cannot confirm', with the reason", () => {
  const unknown = statusOf(with_((i) => (i.site.facts = { status: "unknown", liveRelease: 2, checkedAtMs: NOW - 1000 })));
  assert.equal(unknown.kind, "cannot-confirm");
  assert.match(unknown.reasons.join(" "), /CDN/);
  const disagree = statusOf(with_((i) => (i.site.facts = { status: "ok", liveRelease: 1, checkedAtMs: NOW - 1000 })));
  assert.equal(disagree.kind, "cannot-confirm");
  assert.match(disagree.reasons.join(" "), /v1.*v2/);
  const stale = statusOf(with_((i) => (i.site.facts = { status: "ok", liveRelease: 2, checkedAtMs: NOW - SITE_STALE_MS - 1000 })));
  assert.equal(stale.kind, "cannot-confirm");
  assert.match(stale.reasons.join(" "), /old/);
});

test("stale chain data, or a failed refresh, can never be green", () => {
  const old = statusOf(with_((i) => (i.chain.fetchedAtMs = NOW - CHAIN_STALE_MS - 1000)));
  assert.equal(old.kind, "cannot-confirm");
  assert.match(old.reasons.join(" "), /gate data on this page is 61 s old/);
  const failed = statusOf(with_((i) => (i.chain.refreshFailed = true)));
  assert.equal(failed.kind, "cannot-confirm");
  assert.match(failed.reasons.join(" "), /last refresh failed/);
});

test("no data yet: loading; a failed first read: unreadable, red, with retry", () => {
  const loading = statusOf({ ...good(), chain: { facts: undefined, error: undefined, fetchedAtMs: undefined, refreshFailed: false } });
  assert.equal(loading.kind, "loading");
  const bad = statusOf({ ...good(), chain: { facts: undefined, error: "rpc down", fetchedAtMs: undefined, refreshFailed: false } });
  assert.equal(bad.kind, "unreadable");
  assert.equal(bad.tone, "bad");
  assert.equal(bad.detail, "rpc down");
  assert.equal(bad.primary, "retry");
});

test("a migrated gate and a gate with no live release are never green; frozen is a notice, not a headline", () => {
  assert.equal(statusOf(with_((i) => (i.chain.facts = chainFacts({ migrated: true })))).kind, "migrated");
  assert.equal(statusOf(with_((i) => (i.chain.facts = chainFacts({ liveRelease: 0n })))).kind, "no-release");
  const frozen = statusOf(with_((i) => (i.chain.facts = chainFacts({ frozen: true }))));
  assert.equal(frozen.kind, "matches");
  assert.deepEqual(frozen.notices.map((n) => n.id), ["frozen"]);
  assert.match(frozen.notices[0]!.text, /does not say anything about the website/);
});

test("a closed alert shows as a note under a normal state", () => {
  const v = statusOf(with_((i) => (i.chain.facts = chainFacts({ alertKind: 3, alertAgeS: 3 * 3600 }))));
  assert.equal(v.kind, "matches");
  assert.match(v.notices[0]!.text, /closed 3 h ago/);
});

test("green is reachable only through the full set of conditions (exhaustive over the inputs that matter)", () => {
  const siteStates: StatusInputs["site"][] = [
    { pending: true, failed: false, facts: undefined },
    { pending: false, failed: true, facts: undefined },
    { pending: false, failed: false, facts: { status: "ok", liveRelease: 2, checkedAtMs: NOW - 1000 } },
    { pending: false, failed: false, facts: { status: "ok", liveRelease: 1, checkedAtMs: NOW - 1000 } },
    { pending: false, failed: false, facts: { status: "ok", liveRelease: 2, checkedAtMs: NOW - SITE_STALE_MS - 1 } },
    { pending: false, failed: false, facts: { status: "unknown", liveRelease: 2, checkedAtMs: NOW - 1000 } },
    { pending: false, failed: false, facts: { status: "alert", liveRelease: 2, checkedAtMs: NOW - 1000 } },
  ];
  let greens = 0;
  for (const site of siteStates)
    for (const alertKind of [0, 1, 2, 3])
      for (const fetchedAtMs of [NOW - 1000, NOW - CHAIN_STALE_MS - 1, undefined])
        for (const refreshFailed of [false, true])
          for (const migrated of [false, true])
            for (const liveRelease of [0n, 2n]) {
              const v = statusOf({ nowMs: NOW, hasVerifiedCopy: true, site, chain: { facts: chainFacts({ alertKind, alertAgeS: 5, migrated, liveRelease }), error: undefined, fetchedAtMs, refreshFailed } });
              if (v.kind !== "matches") continue;
              greens++;
              assert.equal(site.facts?.status, "ok");
              assert.equal(site.facts?.liveRelease, 2);
              assert.ok(NOW - site.facts!.checkedAtMs <= SITE_STALE_MS);
              assert.ok(fetchedAtMs !== undefined && NOW - fetchedAtMs <= CHAIN_STALE_MS && !refreshFailed);
              assert.ok(alertKind === 0 || alertKind === 3);
              assert.ok(!migrated && liveRelease === 2n);
            }
  assert.ok(greens > 0, "the green state is reachable");
});

test("age text is short and honest", () => {
  assert.equal(ageText(12), "12 s");
  assert.equal(ageText(90), "2 min");
  assert.equal(ageText(3 * 3600), "3 h");
});

test("a check time that is not a real date is no check at all: never green, never a crash", () => {
  const v = statusOf(with_((i) => (i.site.facts = { status: "ok", liveRelease: 2, checkedAtMs: Number.NaN })));
  assert.equal(v.kind, "no-site-check");
  assert.equal(v.primary, "retry");
  const alert = statusOf(with_((i) => (i.site.facts = { status: "alert", liveRelease: 2, checkedAtMs: Number.NaN })));
  assert.notEqual(alert.kind, "matches");
});

test("on a host with no status server there is no retry button and the text says why", () => {
  const v = statusOf(with_((i) => ((i.site.failed = true), (i.site.absent = true), (i.site.facts = undefined))));
  assert.equal(v.kind, "no-site-check");
  assert.equal(v.primary, "none");
  assert.match(v.detail, /no website check/);
  assert.equal(statusOf(with_((i) => ((i.site.failed = true), (i.site.facts = undefined)))).primary, "retry");
});
