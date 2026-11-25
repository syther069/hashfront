// Plan step 7 verify, on a LOCAL fork of X Layer mainnet (nothing is sent to X Layer):
// the real mainnet deploy script, a real HashSwap release through the CLI, a local "normal host" serving the build,
// then MATCH, and MISMATCH within one interval after a single byte changes.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import { createServer, type Server } from "node:http";
import { copyFile, cp, mkdir, readdir, readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createContext } from "@hashfront/cli/context";
import { KEYS, startHarness, type Harness } from "../../../cli/test/e2e/harness.ts";
import { checkOnce, watchLoop, type CheckResult } from "../../src/watch.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.resolve(here, "../../../../apps/demo-dapp");
const watchMain = path.resolve(here, "../../src/main.ts");
const XLAYER_RPC = process.env.XLAYER_RPC ?? "https://rpc.xlayer.tech";

let h: Harness;
let server: Server;
let site: URL;
const files = new Map<string, Buffer>(); // what the "normal host" serves, editable by the test

async function listFiles(dir: string, prefix = ""): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(path.join(dir, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await listFiles(dir, rel)));
    else out.push(rel);
  }
  return out;
}

before(async () => {
  const build = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
    cwd: demoDir,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  assert.equal(build.status, 0, build.stdout + build.stderr);

  h = await startHarness({ port: 8553, timelock: 600, forkUrl: XLAYER_RPC, mainnetScript: true });
  const dist = path.join(h.workDir, "dist");
  await cp(path.join(demoDir, "dist"), dist, { recursive: true });

  h.ok(["manifest", "dist", "--out", "manifest.json"]);
  h.ok(["propose", "--manifest", "manifest.json"], KEYS.uploader);
  for (const key of [KEYS.m1, KEYS.m2, KEYS.m3]) h.ok(["approve", "--id", "1", "--manifest", "manifest.json"], key);
  h.ok(["upload", "--id", "1", "--manifest", "manifest.json", "dist"], KEYS.uploader);
  h.ok(["seal", "--id", "1", "--manifest", "manifest.json"], KEYS.uploader);
  h.ok(["activate", "--id", "1"], KEYS.uploader); // 3 of 3: no timelock

  await mkdir(path.join(h.workDir, "manifests"));
  await copyFile(path.join(h.workDir, "manifest.json"), path.join(h.workDir, "manifests", "v1.json"));
  for (const rel of await listFiles(dist)) files.set(rel, await readFile(path.join(dist, rel)));

  server = createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname).replace(/^\//, "") || "index.html";
    const body = files.get(p);
    if (!body) return void res.writeHead(404).end();
    res.writeHead(200, { "cache-control": "no-store" }).end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  site = new URL(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`);
});

after(async () => {
  server?.close();
  await h?.stop();
});

const ctx = () => createContext({ network: "local", gate: h.gate, rpcUrl: h.rpc, needsSigner: false });
const cfg = () => ({ site, manifestsDir: path.join(h.workDir, "manifests") });

test("MATCH while the host serves the approved build", async () => {
  const r = await checkOnce(ctx(), cfg());
  assert.equal(r.verdict.status, "MATCH", JSON.stringify(r.verdict.diffs));
  assert.equal(r.verdict.liveRelease, 1n);

  // async on purpose: a synchronous spawn would block this process, which is also the HTTP host being watched
  const args = [watchMain, "--once", "--site", site.href, "--gate", h.gate, "--manifests", cfg().manifestsDir, "--network", "local", "--rpc", h.rpc];
  const { stdout } = await promisify(execFile)(process.execPath, args, { encoding: "utf8" });
  assert.match(stdout, /"status":"MATCH"/);
});

test("MISMATCH within one interval after one byte of the bundle changes", async () => {
  const js = [...files.keys()].find((p) => p.endsWith(".js"));
  assert.ok(js);
  const intervalMs = 2_000;
  const stop = new AbortController();
  const seen: CheckResult[] = [];
  let flippedAt = 0;

  const loop = watchLoop(ctx(), cfg(), {
    intervalMs,
    signal: stop.signal,
    onError: (err) => {
      stop.abort();
      throw err;
    },
    onResult: (r) => {
      seen.push(r);
      if (seen.length === 1) {
        assert.equal(r.verdict.status, "MATCH");
        const body = Buffer.from(files.get(js) as Buffer);
        const at = body.length - 2;
        body.writeUInt8(body.readUInt8(at) ^ 0x01, at);
        files.set(js, body);
        flippedAt = Date.now();
      } else if (r.verdict.status !== "MATCH") {
        stop.abort();
      }
    },
  });
  const timeout = setTimeout(() => stop.abort(), 30_000);
  await loop;
  clearTimeout(timeout);

  const last = seen.at(-1);
  assert.equal(last?.verdict.status, "MISMATCH");
  assert.deepEqual(
    last?.verdict.diffs.map((d) => [d.path, d.kind]),
    [[js, "changed"]],
  );
  const detectedAfter = (last?.checkedAt.getTime() ?? 0) + (last?.durationMs ?? 0) - flippedAt;
  console.log(`  detected ${detectedAfter} ms after the byte changed (interval ${intervalMs} ms)`);
  assert.ok(detectedAfter <= intervalMs + (last?.durationMs ?? 0) + 500, `took ${detectedAfter} ms`);
});

test("a hijacked build names the attacker address that is only in the served files", async () => {
  const build = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build:hijack"], { cwd: demoDir, encoding: "utf8", shell: process.platform === "win32" });
  assert.equal(build.status, 0, build.stdout + build.stderr);
  const hijackDir = path.join(demoDir, "dist-hijack");
  files.clear();
  for (const rel of await listFiles(hijackDir)) files.set(rel, await readFile(path.join(hijackDir, rel)));

  const r = await checkOnce(ctx(), cfg());
  assert.equal(r.verdict.status, "MISMATCH");
  // checksummed form of VITE_SPENDER in apps/demo-dapp/.env.hijack
  assert.deepEqual(r.suspects, ["0xBAd0000000000000000000000000000000000Bad"], r.suspectsError);
});
