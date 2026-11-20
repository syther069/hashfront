import { test } from "node:test";
import assert from "node:assert/strict";
import { compare, sha256, type CompareInput, type Fetched, type ReleaseView } from "../src/compare.ts";
import { stripCloudflare } from "../src/cdn.ts";

const ORIGIN = "https://app.example.org";
const enc = (s: string) => new TextEncoder().encode(s);

// Approved release v2 (live) and v1 (previous), as a Vite build would produce them.
const INDEX_V2 = `<!doctype html><html><head><script type="module" crossorigin src="./assets/app-2.js"></script></head><body><div id="app"></div></body></html>`;
const APP_V2 = `console.log("swap v2");`;
const CSS = `body{margin:0}`;
const INDEX_V1 = INDEX_V2.replace("app-2", "app-1");
const APP_V1 = `console.log("swap v1");`;
const INDEX_V3 = INDEX_V2.replace("app-2", "app-3");
const APP_V3 = `console.log("swap v3");`;

function release(id: bigint, state: ReleaseView["state"], files: Record<string, string>): ReleaseView {
  return { id, state, files: Object.entries(files).map(([path, body]) => ({ path, size: enc(body).length, sha256: sha256(enc(body)) })) };
}
const V1 = release(1n, "previous", { "index.html": INDEX_V1, "assets/app-1.js": APP_V1, "assets/app.css": CSS });
const V2 = release(2n, "live", { "index.html": INDEX_V2, "assets/app-2.js": APP_V2, "assets/app.css": CSS });
const V3 = release(3n, "sealed", { "index.html": INDEX_V3, "assets/app-3.js": APP_V3, "assets/app.css": CSS });

function served(files: Record<string, string | Fetched>): Map<string, Fetched> {
  return new Map(
    Object.entries(files).map(([p, v]) => [
      p,
      typeof v === "string" ? { ok: true, bytes: enc(v), finalUrl: p === "index.html" ? `${ORIGIN}/` : `${ORIGIN}/${p}` } : v,
    ]),
  );
}
const missing: Fetched = { ok: false, missing: true, error: "HTTP 404" };
const down: Fetched = { ok: false, missing: false, error: "fetch failed" };

const ALL = {
  "index.html": INDEX_V2,
  "assets/app-2.js": APP_V2,
  "assets/app.css": CSS,
  "assets/app-1.js": APP_V1,
  "assets/app-3.js": APP_V3,
};

function input(files: Record<string, string | Fetched>, extra: Partial<CompareInput> = {}): CompareInput {
  return { siteOrigin: ORIGIN, live: V2, others: [V3, V1], served: served(files), liveIndex: enc(INDEX_V2), ...extra };
}

test("MATCH when every live file is served byte for byte", () => {
  const v = compare(input(ALL));
  assert.equal(v.status, "MATCH");
  assert.equal(v.observed, sha256(enc(INDEX_V2)));
});

test("MISMATCH when a bundle is swapped (the approve() spender attack)", () => {
  const v = compare(input({ ...ALL, "assets/app-2.js": APP_V2.replace("swap", "drain") }));
  assert.equal(v.status, "MISMATCH");
  assert.deepEqual(
    v.diffs.map((d) => [d.path, d.kind]),
    [["assets/app-2.js", "changed"]],
  );
});

test("MISMATCH when a script is injected into the root page", () => {
  const evil = INDEX_V2.replace("</head>", `<script src="https://evil.example/x.js"></script></head>`);
  const v = compare(input({ ...ALL, "index.html": evil }));
  assert.equal(v.status, "MISMATCH");
  assert.equal(v.observed, sha256(enc(evil)));
});

test("MISMATCH when an approved file is gone (404)", () => {
  assert.equal(compare(input({ ...ALL, "assets/app.css": missing })).status, "MISMATCH");
});

test("MISMATCH when the root page redirects to another origin", () => {
  const files = served(ALL);
  files.set("index.html", { ok: true, bytes: enc(INDEX_V2), finalUrl: "https://app-example.org.evil.example/" });
  const v = compare({ ...input(ALL), served: files });
  assert.equal(v.status, "MISMATCH");
  assert.equal(v.diffs[0]?.kind, "off-origin");
});

test("HOST_BEHIND when the host still serves the previous live release", () => {
  const v = compare(input({ ...ALL, "index.html": INDEX_V1 }));
  assert.equal(v.status, "HOST_BEHIND");
  assert.equal(v.matchedRelease, 1n);
});

test("DEPLOYED_BEFORE_ACTIVATION when the host serves a sealed release that is not live yet", () => {
  const v = compare(input({ ...ALL, "index.html": INDEX_V3 }));
  assert.equal(v.status, "DEPLOYED_BEFORE_ACTIVATION");
  assert.equal(v.matchedRelease, 3n);
});

test("a cancelled release is never a legitimate match", () => {
  const cancelled = { ...V3, state: "cancelled" as const };
  const v = compare(input({ ...ALL, "index.html": INDEX_V3 }, { others: [cancelled, V1] }));
  assert.equal(v.status, "MISMATCH");
  assert.match(v.hints.join(" "), /cancelled release v3/);
});

test("UNREACHABLE when the root page cannot be fetched", () => {
  const v = compare(input({ ...ALL, "index.html": down }));
  assert.equal(v.status, "UNREACHABLE");
});

test("UNVERIFIABLE, never MATCH, when a file failed to load and nothing else differs", () => {
  assert.equal(compare(input({ ...ALL, "assets/app-2.js": down })).status, "UNVERIFIABLE");
});

test("allow-listed served hashes are accepted and reported", () => {
  const tweaked = `${INDEX_V2}<!-- host footer -->`;
  const allow = new Map([["index.html", new Set([sha256(enc(tweaked))])]]);
  const v = compare(input({ ...ALL, "index.html": tweaked }, { allow }));
  assert.equal(v.status, "MATCH");
  assert.deepEqual(v.allowed, ["index.html"]);
});

// ---------------------------------------------------------------- Cloudflare
const RL_TOKEN = "b47c1c4a5e4c5a1a3cd7c5ad";
const ROCKET = `<script src="/cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="${RL_TOKEN}-|49" defer></script>`;
const BEACON = `<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "0123456789abcdef0123456789abcdef"}'></script>`;
const rocketLoaded = INDEX_V2.replace(' type="module"', ` type="${RL_TOKEN}-module"`).replace("</body>", `${ROCKET}${BEACON}</body>`);

test("CDN_MODIFIED (not MATCH) when only Rocket Loader and the analytics beacon changed the page", () => {
  const v = compare(input({ ...ALL, "index.html": rocketLoaded }));
  assert.equal(v.status, "CDN_MODIFIED");
  assert.deepEqual(
    v.stripped.map((s) => s.feature),
    ["rocket-loader", "web-analytics"],
  );
  assert.match(v.hints.join(" "), /Rocket Loader/);
});

test("adversarial: a Cloudflare-looking tag plus an extra script stays MISMATCH", () => {
  const attack = rocketLoaded.replace("</head>", `<script src="/cdn-cgi/scripts/7d0fa10a/cloudflare-static/x.js"></script></head>`);
  assert.equal(compare(input({ ...ALL, "index.html": attack })).status, "MISMATCH");
});

test("adversarial: a rocket-loader tag with a different shape is not stripped", () => {
  const odd = ROCKET.replace(" defer>", " defer onload=\"steal()\">");
  const page = INDEX_V2.replace("</body>", `${odd}</body>`);
  assert.equal(stripCloudflare(page).stripped.length, 0);
  assert.equal(compare(input({ ...ALL, "index.html": page })).status, "MISMATCH");
});

test("adversarial: the type rewrite is only undone for the token Rocket Loader announced", () => {
  const page = INDEX_V2.replace(' type="module"', ` type="ffffffffffffffffffffffff-module"`).replace("</body>", `${ROCKET}</body>`);
  assert.equal(compare(input({ ...ALL, "index.html": page })).status, "MISMATCH");
});

test("CDN tags on top of a swapped bundle stay MISMATCH", () => {
  const v = compare(input({ ...ALL, "index.html": rocketLoaded, "assets/app-2.js": "evil()" }));
  assert.equal(v.status, "MISMATCH");
});

test("email obfuscation cannot be undone: MISMATCH with a fix hint", () => {
  const page = INDEX_V2.replace(
    "</body>",
    `<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="aa">[email&#160;protected]</a></body>`,
  );
  const v = compare(input({ ...ALL, "index.html": page }));
  assert.equal(v.status, "MISMATCH");
  assert.match(v.hints.join(" "), /Email Address Obfuscation/);
});
