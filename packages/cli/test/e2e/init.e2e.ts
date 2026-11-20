// Plan step 12 verify, on a LOCAL anvil fork of X Layer mainnet (nothing is sent to X Layer):
//   - `hashfront init` simulates by default and leaves nothing behind
//   - `hashfront init --broadcast` deploys (real TapeOut contracts, forked), writes hashfront.json, and is timed
//   - a second `init --broadcast` for the same site is refused (no double tape-out fees)
//   - the commands the GitHub Action template runs take a release live (propose --id-file, upload, seal,
//     wait-active --exact, activate)
//   - the watcher command `init` prints runs as printed and reports MATCH for the deployed build
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFile, spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, http, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { watcherArgs, type InitConfig } from "../../src/init.ts";
import { ADDR, KEYS } from "./harness.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../..");
const cliMain = path.join(root, "packages/cli/src/main.ts");
const demoDir = path.join(root, "apps/demo-dapp");
const deploymentFile = path.join(root, "contracts/deployments/init-app.hashswap.test.fork.json");
const XLAYER_RPC = process.env.XLAYER_RPC ?? "https://rpc.xlayer.tech";
const PORT = 8556;
const RPC = `http://127.0.0.1:${PORT}`;

let anvil: ChildProcess;
let work: string;
let server: Server;
const deployer = privateKeyToAccount(generatePrivateKey()).address; // fresh: no code, no 7702 delegation on mainnet

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const body = (await res.json()) as { result?: unknown; error?: { message: string } };
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result;
}

function cli(args: string[], key?: Hex) {
  const { HASHFRONT_PRIVATE_KEY: _drop, ...env } = process.env;
  const r = spawnSync(process.execPath, [cliMain, ...args], { cwd: work, encoding: "utf8", env: { ...env, ...(key ? { HASHFRONT_PRIVATE_KEY: key } : {}) } });
  return { code: r.status ?? -1, out: `${r.stdout}${r.stderr}` };
}
function ok(args: string[], key?: Hex): string {
  const r = cli(args, key);
  assert.equal(r.code, 0, `hashfront ${args.join(" ")} failed (exit ${r.code}):\n${r.out}`);
  return r.out;
}

const INIT = [
  "init",
  "--site", "https://app.hashswap.test/",
  "--name", "HashSwap",
  "--maintainers", `${ADDR.m1},${ADDR.m2},${ADDR.m3}`,
  "--uploader", ADDR.uploader,
  "--reporter", ADDR.uploader,
  "--timelock", "10m",
  "--rpc", RPC,
  "--unlocked", "--sender", deployer,
];

before(async () => {
  if (existsSync(deploymentFile)) throw new Error(`${deploymentFile} exists from an earlier run; remove it first`);
  const build = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], { cwd: demoDir, encoding: "utf8", shell: process.platform === "win32" });
  assert.equal(build.status, 0, build.stdout + build.stderr);

  work = await mkdtemp(path.join(tmpdir(), "hashfront-init-"));
  await cp(path.join(demoDir, "dist"), path.join(work, "dist"), { recursive: true });

  anvil = spawn("anvil", ["--fork-url", XLAYER_RPC, "--port", String(PORT), "--silent"], { stdio: "ignore" });
  for (let i = 0; i < 120; i++) {
    try {
      if ((await rpc("eth_chainId", [])) === "0xc4") break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  await rpc("anvil_setBalance", [deployer, "0x2c68af0bb140000"]); // 0.2 OKB, fork only
  await rpc("anvil_impersonateAccount", [deployer]);
  await rpc("anvil_setCode", [ADDR.uploader, "0x"]); // anvil account 0 has an EIP-7702 delegation on X Layer
});

after(async () => {
  server?.close();
  anvil?.kill();
  await rm(deploymentFile, { force: true });
  if (work) await rm(work, { recursive: true, force: true });
});

test("init simulates, deploys once, and what it prints works", async () => {
  // 0. a deployment record whose transactions never landed is reported as unfinished, never as "already deployed"
  await writeFile(deploymentFile, JSON.stringify({ gate: privateKeyToAccount(generatePrivateKey()).address, policyId: 999, container: deployer, url: "" }));
  const stale = cli([...INIT, "--broadcast"]);
  assert.notEqual(stale.code, 0);
  assert.match(stale.out, /records an UNFINISHED deployment: no contract at gate/);
  assert.match(stale.out, /re-run with --policy-id 999/);
  await rm(deploymentFile);

  // 1. default is a simulation: nothing deployed, no deployment record left behind
  const dry = ok([...INIT, "--build", "dist"]);
  assert.match(dry, /pre-flight: dist is a static build that works on DeWEB/);
  assert.match(dry, /simulation passed\. Re-run with --broadcast to deploy\./);
  assert.equal(existsSync(deploymentFile), false);
  assert.equal((await readdir(path.join(root, "contracts/deployments"))).some((f) => f.includes(".dryrun.")), false);

  // 2. the real (forked) deployment, timed
  const started = Date.now();
  const out = ok([...INIT, "--build", "dist", "--broadcast"]);
  const seconds = (Date.now() - started) / 1000;
  console.log(`  init --broadcast took ${seconds.toFixed(1)} s`);
  assert.ok(seconds < 15 * 60);
  const cfg = JSON.parse(await readFile(path.join(work, "hashfront.json"), "utf8")) as InitConfig;
  assert.match(cfg.gate, /^0x[0-9a-fA-F]{40}$/);
  assert.equal(cfg.verifiedUrl, `https://${cfg.policyId}-2-409.tapekit.org/`);
  assert.equal(cfg.timelockSeconds, 600);
  for (const want of [cfg.gate, cfg.verifiedUrl, `VITE_GATE=${cfg.gate}`, 'sandbox="allow-scripts allow-same-origin', "--tapesend-to self"]) assert.ok(out.includes(want), `init output lacks ${want}`);

  // 3. never twice
  const again = cli([...INIT, "--broadcast"]);
  assert.notEqual(again.code, 0);
  assert.match(again.out, /records a finished deployment \(gate 0x[0-9a-fA-F]{40}, verified on chain\)\. Refusing to deploy twice/);

  // 4. status reads the new gate
  const net = ["--network", "xlayer", "--rpc", RPC, "--gate", cfg.gate];
  assert.match(ok(["status", ...net]), /live: none|no release/i);

  // 5. the Action's commands, in the template's order (3 of 3 approvals: no timelock wait in the test)
  ok(["preflight", "dist"]);
  ok(["manifest", "dist", "--out", "manifest.json"]);
  ok(["propose", "--manifest", "manifest.json", "--id-file", "release-id.txt", ...net], KEYS.uploader);
  const id = (await readFile(path.join(work, "release-id.txt"), "utf8")).trim();
  assert.equal(id, "1");
  for (const key of [KEYS.m1, KEYS.m2, KEYS.m3]) ok(["approve", "--id", id, "--manifest", "manifest.json", ...net], key);
  ok(["upload", "--id", id, "--manifest", "manifest.json", "dist", ...net], KEYS.uploader);
  ok(["seal", "--id", id, "--manifest", "manifest.json", ...net], KEYS.uploader);
  assert.notEqual(cli(["wait-active", "--id", id, "--timeout", "1", "--interval", "1", "--exact", ...net]).code, 0, "not live yet");
  ok(["activate", "--id", id, ...net], KEYS.uploader);
  ok(["wait-active", "--id", id, "--timeout", "30", "--exact", ...net]);

  // 6. the printed watcher command, against a local host serving the same build
  const files = new Map<string, Buffer>();
  const walk = async (dir: string, prefix = ""): Promise<void> => {
    for (const e of await readdir(path.join(dir, prefix), { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) await walk(dir, rel);
      else files.set(rel, await readFile(path.join(dir, rel)));
    }
  };
  await walk(path.join(work, "dist"));
  server = createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname).replace(/^\//, "") || "index.html";
    const body = files.get(p);
    if (!body) return void res.writeHead(404).end();
    res.writeHead(200).end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const site = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
  await mkdir(path.join(work, "manifests"));
  await writeFile(path.join(work, "manifests", "v1.json"), await readFile(path.join(work, "manifest.json")));

  const printed = watcherArgs(cfg);
  const args = printed.map((a, i) => (printed[i - 1] === "--site" ? site : a));
  args[0] = path.join(root, args[0]!);
  const stdout = await new Promise<string>((resolve, reject) =>
    execFile(process.execPath, [...args, "--rpc", RPC, "--once"], { cwd: work, encoding: "utf8", env: { ...process.env, HASHFRONT_PRIVATE_KEY: KEYS.uploader } }, (err, so, se) =>
      err ? reject(new Error(`${err.message}\n${so}\n${se}`)) : resolve(so),
    ),
  );
  assert.match(stdout, /"status":"MATCH"/);
  assert.match(stdout, /"live":"v1"/);

  const client = createPublicClient({ chain: foundry, transport: http(RPC) });
  assert.ok((await client.getCode({ address: cfg.gate }))?.length);
});
