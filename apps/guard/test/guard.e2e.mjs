// Loads the real extension into Edge/Chrome (persistent context) and drives it against local copies of the demo site:
// the good build and the hijack build, with a status feed served from the same local server. Nothing leaves this machine.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const guardDir = path.resolve(here, "..");
const demo = path.resolve(here, "../../demo-dapp");
/**
 * Extensions only load in Chromium-family builds that still honour --load-extension: Edge does, and so does Playwright's
 * own Chromium (PW_CHANNEL=chromium, what CI uses). Branded Chrome from version 137 ignores the flag, so it is not the default.
 */
const browserChoice = () => (process.env.PW_CHANNEL === "chromium" ? {} : { channel: process.env.PW_CHANNEL ?? (process.platform === "win32" ? "msedge" : "chromium") });

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

let server, base, tmp, userData, context, extDir;
let serving = "dist"; // which demo build the "normal host" serves right now
let feed = { mode: "ok" }; // what /api/status answers
let goodRoot;

const sha = (b) => `0x${createHash("sha256").update(b).digest("hex")}`;

async function statusBody() {
  const root = goodRoot;
  const common = { site: base.replace(/\/$/, ""), liveRelease: 2, rootHash: root, assets: {}, suspects: ["0xBAd0000000000000000000000000000000000Bad"], checkedAt: new Date().toISOString() };
  return feed.mode === "alert" ? { ...common, status: "alert" } : { ...common, status: "ok", suspects: [] };
}

before(async () => {
  goodRoot = sha(await readFile(path.join(demo, "dist/index.html")));
  server = createServer(async (req, res) => {
    const p = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    if (p === "/api/status") {
      if (feed.mode === "down") return void res.writeHead(503).end("down");
      return void res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }).end(JSON.stringify(await statusBody()));
    }
    try {
      const file = path.join(demo, serving, p === "/" ? "index.html" : p);
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-store" }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}/`;

  // a temporary copy of the extension that watches this local host and reads this local feed
  tmp = await mkdtemp(path.join(tmpdir(), "hf-guard-"));
  const ext = path.join(tmp, "ext");
  extDir = ext;
  await cp(guardDir, ext, { recursive: true, filter: (s) => !/[\\/](test|node_modules)([\\/]|$)/.test(s) });
  const manifest = JSON.parse(await readFile(path.join(ext, "manifest.json"), "utf8"));
  manifest.host_permissions = ["http://127.0.0.1/*"];
  for (const cs of manifest.content_scripts) cs.matches = ["http://127.0.0.1/*"];
  await writeFile(path.join(ext, "manifest.json"), JSON.stringify(manifest));
  await writeFile(
    path.join(ext, "config.js"),
    `self.HF_CONFIG = ${JSON.stringify({ statusUrl: `${base}api/status`, verifiedCopyUrl: "https://4-2-409.tapekit.org/", statusPageUrl: "https://hashfront-status.vercel.app/", cacheMs: 0 })};\n`,
  );

  userData = path.join(tmp, "profile");
  context = await chromium.launchPersistentContext(userData, {
    ...browserChoice(),
    headless: false,
    args: ["--headless=new", `--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  // a stand-in wallet that records what the page asks it to do
  await context.addInitScript(() => {
    window.__calls = [];
    window.ethereum = { request: async (a) => (window.__calls.push(a.method), a.method === "eth_chainId" ? "0xc4" : "0xhash") };
  });
});

after(async () => {
  await context?.close();
  server?.close();
  if (tmp) await rm(tmp, { recursive: true, force: true });
});

async function open(ctx = context) {
  const page = await ctx.newPage();
  if (process.env.GUARD_DEBUG) page.on("console", (m) => console.log("PAGE", m.type(), m.text().slice(0, 200))), page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
  await page.goto(base);
  await page.waitForLoadState("load");
  await page.waitForTimeout(1500); // the verdict needs the feed and the page hash
  return page;
}

const sign = (page) =>
  page.evaluate(async () => {
    try {
      await window.ethereum.request({ method: "eth_sendTransaction", params: [{ to: "0x" + "11".repeat(20), data: "0x" }] });
      return "sent";
    } catch (e) {
      return `rejected:${e.code}`;
    }
  });

test("good build, clean feed: no overlay and the wallet is reached", async () => {
  serving = "dist";
  feed = { mode: "ok" };
  const page = await open();
  assert.equal(await page.locator("hashfront-guard").count(), 0);
  assert.equal(await sign(page), "sent");
  await page.close();
});

test("open alert: overlay, and eth_sendTransaction is rejected with 4001 while reads still work", async () => {
  serving = "dist-hijack";
  feed = { mode: "alert" };
  const page = await open();
  assert.equal(await page.locator("hashfront-guard").count(), 1);
  assert.equal(await sign(page), "rejected:4001");
  assert.equal(await page.evaluate(() => window.ethereum.request({ method: "eth_chainId" })), "0xc4");
  assert.deepEqual(await page.evaluate(() => window.__calls), ["eth_chainId"], "the signing request never reached the wallet");
  await page.close();
});

test("the independent hash check blocks a hijacked page even when the feed says ok (a watcher that was cloaked)", async () => {
  serving = "dist-hijack";
  feed = { mode: "ok" };
  const page = await open();
  assert.equal(await page.locator("hashfront-guard").count(), 1);
  assert.equal(await sign(page), "rejected:4001");
  await page.close();
});

test("a page script cannot lift the block by forging the verdict event", async () => {
  serving = "dist-hijack";
  feed = { mode: "alert" };
  const page = await open();
  await page.evaluate(() => {
    for (const secret of ["", "x".repeat(64), "0".repeat(64)]) window.dispatchEvent(new CustomEvent("hf-verdict", { detail: JSON.stringify({ block: false, secret }) }));
    window.dispatchEvent(new CustomEvent("hf-init", { detail: "y".repeat(64) }));
    window.dispatchEvent(new CustomEvent("hf-verdict", { detail: JSON.stringify({ block: false, secret: "y".repeat(64) }) }));
  });
  assert.equal(await sign(page), "rejected:4001");
  await page.close();
});

test("'I understand the risk' (a real click) lifts the block for this page", async () => {
  serving = "dist-hijack";
  feed = { mode: "alert" };
  const page = await open();
  // the overlay lives in a closed shadow root, so reach its button with the keyboard: two links, then the button
  for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  assert.equal(await page.locator("hashfront-guard").count(), 0);
  assert.equal(await sign(page), "sent");
  await page.close();
});

test("feed down: nothing is blocked and no overlay is shown", async () => {
  serving = "dist-hijack";
  feed = { mode: "down" };
  const page = await open();
  assert.equal(await page.locator("hashfront-guard").count(), 0);
  assert.equal(await sign(page), "sent");
  await page.close();
});

test("the handshake works whichever content script runs first (the isolated one first, here)", async () => {
  // the same extension with its two content scripts listed in the other order
  const flipped = path.join(tmp, "ext-flipped");
  await cp(extDir, flipped, { recursive: true });
  const manifest = JSON.parse(await readFile(path.join(flipped, "manifest.json"), "utf8"));
  manifest.content_scripts.reverse();
  await writeFile(path.join(flipped, "manifest.json"), JSON.stringify(manifest));
  const ctx2 = await chromium.launchPersistentContext(path.join(tmp, "profile-flipped"), {
    ...browserChoice(),
    headless: false,
    args: ["--headless=new", `--disable-extensions-except=${flipped}`, `--load-extension=${flipped}`],
  });
  try {
    await ctx2.addInitScript(() => {
      window.__calls = [];
      window.ethereum = { request: async (a) => (window.__calls.push(a.method), a.method === "eth_chainId" ? "0xc4" : "0xhash") };
    });
    // a clean site: the wallet must be reached at once, not after the 4 s hold of an unanswered handshake
    serving = "dist";
    feed = { mode: "ok" };
    let page = await open(ctx2);
    const t0 = Date.now();
    assert.equal(await sign(page), "sent");
    assert.ok(Date.now() - t0 < 1500, `the signing request waited ${Date.now() - t0} ms`);
    await page.close();

    // a hijacked site: blocked, and the real click still lifts the block
    serving = "dist-hijack";
    feed = { mode: "alert" };
    page = await open(ctx2);
    assert.equal(await sign(page), "rejected:4001");
    for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    assert.equal(await sign(page), "sent", "the override works too");
    await page.close();
  } finally {
    await ctx2.close();
  }
});
