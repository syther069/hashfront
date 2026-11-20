import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { preflight } from "../src/preflight.ts";
import { isLoopback, parseDuration, parseMaintainers, POLICY_GATES } from "../src/init.ts";
import { readFile } from "node:fs/promises";

async function withBuild(files: Record<string, string>, fn: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(path.join(tmpdir(), "hashfront-preflight-"));
  try {
    for (const [rel, body] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(dir, rel)), { recursive: true });
      await writeFile(path.join(dir, rel), body);
    }
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const GOOD_INDEX = '<!doctype html><script type="module" crossorigin src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css">';

test("a relative static build passes", async () => {
  await withBuild({ "index.html": GOOD_INDEX, "assets/app.js": "createHashRouter([])", "assets/app.css": "body{background:url(./bg.png)}" }, async (dir) => {
    const r = await preflight(dir);
    assert.deepEqual(r.errors, []);
    assert.deepEqual(r.warnings, []);
    assert.equal(r.files, 3);
  });
});

test("root-absolute asset paths are rejected (Vite's default base)", async () => {
  const index = '<!doctype html><script type="module" crossorigin src="/assets/app.js"></script>';
  await withBuild({ "index.html": index, "assets/app.js": "" }, async (dir) => {
    const r = await preflight(dir);
    assert.equal(r.errors.length, 1);
    assert.match(r.errors[0]!, /^index\.html: root-absolute asset path \/assets\/app\.js breaks.*base: "\.\/"/);
  });
  await withBuild({ "index.html": GOOD_INDEX.replace('href="./assets', 'href="/assets'), "assets/app.js": "", "assets/app.css": "" }, async (dir) => {
    assert.equal((await preflight(dir)).errors.length, 1);
  });
  await withBuild({ "index.html": GOOD_INDEX, "assets/app.js": "", "assets/app.css": "@font-face{src:url('/fonts/a.woff2')}" }, async (dir) => {
    assert.match((await preflight(dir)).errors.join(), /assets\/app\.css: root-absolute url\(\/fonts\/a\.woff2\)/);
  });
});

test('a root <base href="/"> is rejected even when every path looks relative (Angular default)', async () => {
  await withBuild({ "index.html": `<!doctype html><base href="/">${GOOD_INDEX}`, "assets/app.js": "", "assets/app.css": "" }, async (dir) => {
    assert.match((await preflight(dir)).errors.join(), /<base href="\/"> makes every relative path root-absolute/);
  });
  await withBuild({ "index.html": `<!doctype html><base href="./">${GOOD_INDEX}`, "assets/app.js": "", "assets/app.css": "" }, async (dir) => {
    assert.deepEqual((await preflight(dir)).errors, []);
  });
});

test("protocol-relative and remote references are not mistaken for root-absolute ones", async () => {
  const index = '<!doctype html><script src="https://cdn.example/x.js"></script><img src="//cdn.example/a.png">';
  await withBuild({ "index.html": index }, async (dir) => {
    const r = await preflight(dir);
    assert.deepEqual(r.errors, []);
    assert.match(r.warnings.join(), /loads a script from another origin \(cdn\.example\)/);
  });
});

test("missing index.html and server builds are rejected", async () => {
  await withBuild({ "app.html": "<!doctype html>" }, async (dir) => {
    assert.match((await preflight(dir)).errors.join(), /no index\.html/);
  });
  await withBuild({ "index.html": GOOD_INDEX, ".next/server/app.js": "", "assets/app.js": "", "assets/app.css": "" }, async (dir) => {
    assert.match((await preflight(dir)).errors.join(), /Next\.js server build/);
  });
  await withBuild({ "index.html": GOOD_INDEX, "_worker.js": "", "assets/app.js": "", "assets/app.css": "" }, async (dir) => {
    assert.match((await preflight(dir)).errors.join(), /Cloudflare Pages worker/);
  });
  assert.match((await preflight(path.join(tmpdir(), "does-not-exist-hashfront"))).errors.join(), /not a directory/);
});

test("history routing and absolute chunk paths are warnings, not errors", async () => {
  await withBuild({ "index.html": GOOD_INDEX, "assets/app.js": 'createBrowserRouter([]);import("/assets/lazy.js")', "assets/app.css": "" }, async (dir) => {
    const r = await preflight(dir);
    assert.deepEqual(r.errors, []);
    assert.equal(r.warnings.length, 2);
    assert.match(r.warnings[0]!, /hash router/);
  });
});

test("init's fee estimate uses the policy circuit's real gate count", async () => {
  const policy = JSON.parse(await readFile(path.resolve(import.meta.dirname, "../../../circuits/out/policy.json"), "utf8")) as { gates: number };
  assert.equal(POLICY_GATES, policy.gates);
});

test("init input parsing", () => {
  assert.equal(parseDuration("600"), 600);
  assert.equal(parseDuration("45m"), 2700);
  assert.equal(parseDuration("24h"), 86400);
  assert.equal(parseDuration("2d"), 172800);
  assert.throws(() => parseDuration("31d"), /30 days/);
  assert.throws(() => parseDuration("soon"), /not a duration/);
  const a = "0x1111111111111111111111111111111111111111";
  const b = "0x2222222222222222222222222222222222222222";
  const c = "0x3333333333333333333333333333333333333333";
  assert.equal(parseMaintainers(`${a},${b},${c}`).length, 3);
  assert.throws(() => parseMaintainers(`${a},${b}`), /exactly 3/);
  assert.throws(() => parseMaintainers(`${a},${a},${c}`), /different/);
  // a fork of X Layer reports chain 196 too, so only the RPC host decides what counts as mainnet
  assert.equal(isLoopback("http://127.0.0.1:8545"), true);
  assert.equal(isLoopback("http://localhost:8545"), true);
  assert.equal(isLoopback("https://rpc.xlayer.tech"), false);
  assert.equal(isLoopback("http://127.0.0.1.evil.example:8545"), false);
});
