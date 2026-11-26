// The guardian pause on a LOCAL fork of X Layer (nothing is sent to X Layer): the real deploy script, a DemoVault
// whose guardian is a separate key, a local "normal host", and the real watcher CLI run with --once per check.
// One byte flips and stays flipped: exactly one alert and exactly one pause. Restored: one all-clear, and the vault
// STAYS paused until its owner unpauses. The mainnet is refused.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFile, spawnSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import { copyFile, cp, mkdir, readdir, readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, encodeDeployData, encodeFunctionData, http, parseAbi, type Hex } from "viem";
import { foundry } from "viem/chains";
import { ADDR, KEYS, startHarness, type Harness } from "../../../cli/test/e2e/harness.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.resolve(here, "../../../../apps/demo-dapp");
const contractsDir = path.resolve(here, "../../../../contracts");
const watchMain = path.resolve(here, "../../src/main.ts");
const XLAYER_RPC = process.env.XLAYER_RPC ?? "https://rpc.xlayer.tech";
const vaultAbi = parseAbi([
  "constructor(address owner_, address guardian_)",
  "function paused() view returns (bool)",
  "function unpause()",
  "event PausedByGuardian(address indexed guardian)",
  "error NotOwner()",
]);

let h: Harness;
let host: Server;
let site: URL;
let vault: `0x${string}`;
const files = new Map<string, Buffer>();

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
  const build = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], { cwd: demoDir, encoding: "utf8", shell: process.platform === "win32" });
  assert.equal(build.status, 0, build.stdout + build.stderr);
  const forge = spawnSync("forge", ["build"], { cwd: contractsDir, encoding: "utf8", shell: process.platform === "win32" });
  assert.equal(forge.status, 0, forge.stdout + forge.stderr);

  h = await startHarness({ port: 8556, timelock: 600, forkUrl: XLAYER_RPC, mainnetScript: true });
  const dist = path.join(h.workDir, "dist");
  await cp(path.join(demoDir, "dist"), dist, { recursive: true });
  h.ok(["manifest", "dist", "--out", "manifest.json"]);
  h.ok(["propose", "--manifest", "manifest.json"], KEYS.uploader);
  for (const key of [KEYS.m1, KEYS.m2, KEYS.m3]) h.ok(["approve", "--id", "1", "--manifest", "manifest.json"], key);
  h.ok(["upload", "--id", "1", "--manifest", "manifest.json", "dist"], KEYS.uploader);
  h.ok(["seal", "--id", "1", "--manifest", "manifest.json"], KEYS.uploader);
  h.ok(["activate", "--id", "1"], KEYS.uploader);
  await mkdir(path.join(h.workDir, "manifests"));
  await copyFile(path.join(h.workDir, "manifest.json"), path.join(h.workDir, "manifests", "v1.json"));
  for (const rel of await listFiles(dist)) files.set(rel, await readFile(path.join(dist, rel)));

  host = createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname).replace(/^\//, "") || "index.html";
    const body = files.get(p);
    if (!body) return void res.writeHead(404).end();
    res.writeHead(200, { "cache-control": "no-store" }).end(body);
  });
  await new Promise<void>((resolve) => host.listen(0, "127.0.0.1", resolve));
  site = new URL(`http://127.0.0.1:${(host.address() as AddressInfo).port}/`);

  // the protocol's vault: owner m1, guardian m3 (a key that is not the reporter and can only pause)
  const artifact = JSON.parse(await readFile(path.join(contractsDir, "out/DemoVault.sol/DemoVault.json"), "utf8")) as { bytecode: { object: Hex } };
  const data = encodeDeployData({ abi: vaultAbi, bytecode: artifact.bytecode.object, args: [ADDR.m1, ADDR.m3] });
  await h.rpcCall("anvil_impersonateAccount", [ADDR.m1]);
  const hash = (await h.rpcCall("eth_sendTransaction", [{ from: ADDR.m1, data }])) as Hex;
  const receipt = await client().waitForTransactionReceipt({ hash });
  assert.ok(receipt.contractAddress);
  vault = receipt.contractAddress;
});

after(async () => {
  host?.close();
  await h?.stop();
});

const client = () => createPublicClient({ chain: foundry, transport: http(h.rpc) });
const isPaused = () => client().readContract({ address: vault, abi: vaultAbi, functionName: "paused" });

interface Line {
  status: string;
  alerts?: { channel: string; kind: number | string; ok: boolean; detail?: string }[];
}

/** One `hashfront-watch --once`, alerts on, with the guardian configured. Exit codes 1-3 are verdicts, not failures. */
async function once(extra: string[] = [], env: Record<string, string> = {}): Promise<{ line?: Line; code: number; stderr: string }> {
  const args = [
    watchMain, "--once", "--site", site.href, "--gate", h.gate, "--manifests", path.join(h.workDir, "manifests"),
    "--network", "local", "--rpc", h.rpc, "--signals", "none",
    "--name", "HashSwap", "--alert-state", path.join(h.workDir, "alerts.json"), "--tapesend-to", "self",
    "--guardian-call", vault, ...extra,
  ];
  const e = { ...process.env, HASHFRONT_PRIVATE_KEY: KEYS.uploader, HASHFRONT_GUARDIAN_PRIVATE_KEY: KEYS.m3, ...env };
  return new Promise((resolve) =>
    execFile(process.execPath, args, { env: e, encoding: "utf8" }, (err, out, stderr) => {
      const code = typeof (err as { code?: unknown } | null)?.code === "number" ? ((err as { code: number }).code) : 0;
      const last = out.trim().split("\n").at(-1);
      resolve({ ...(last?.startsWith("{") ? { line: JSON.parse(last) as Line } : {}), code, stderr });
    }),
  );
}

test("a confirmed hijack pauses the vault once; the all-clear does not unpause it; only the owner can", async () => {
  const fromBlock = await client().getBlockNumber();
  const guardianNonce0 = await client().getTransactionCount({ address: ADDR.m3 });
  assert.equal((await once()).line?.status, "MATCH");
  assert.equal(await isPaused(), false);

  const js = [...files.keys()].find((p) => p.endsWith(".js"));
  assert.ok(js);
  const good = files.get(js) as Buffer;
  const bad = Buffer.from(good);
  bad.writeUInt8(bad.readUInt8(bad.length - 2) ^ 0x01, bad.length - 2);
  files.set(js, bad);

  const first = (await once()).line; // 1 of 2: not confirmed, nothing happens
  assert.equal(first?.status, "MISMATCH");
  assert.equal(first?.alerts, undefined);
  assert.equal(await isPaused(), false, "one bad check is not enough to pause a protocol");

  const second = (await once()).line; // confirmed: alert, and the pause
  assert.deepEqual(second?.alerts?.map((a) => [a.channel, a.ok]).sort(), [["guardian", true], ["tapesend", true]], JSON.stringify(second?.alerts));
  assert.equal(await isPaused(), true);

  for (let i = 0; i < 3; i++) assert.equal((await once()).line?.alerts, undefined, "no repeat while the incident lasts");
  const events = await client().getContractEvents({ address: vault, abi: vaultAbi, eventName: "PausedByGuardian", fromBlock });
  assert.equal(events.length, 1, "exactly one pause");
  assert.equal(events[0]?.args.guardian?.toLowerCase(), ADDR.m3.toLowerCase());
  assert.equal((await client().getTransactionCount({ address: ADDR.m3 })) - guardianNonce0, 1, "the guardian key sent one transaction in total");

  files.set(js, good);
  for (let i = 0; i < 2; i++) await once();
  const cleared = (await once()).line;
  assert.ok(cleared?.alerts?.some((a) => a.kind === 3), "the all-clear went out");
  assert.equal(await isPaused(), true, "the watcher never unpauses");

  // only the owner resumes
  await h.rpcCall("anvil_impersonateAccount", [ADDR.m3]);
  await assert.rejects(client().simulateContract({ address: vault, abi: vaultAbi, functionName: "unpause", account: ADDR.m3 }), /NotOwner/);
  const tx = (await h.rpcCall("eth_sendTransaction", [{ from: ADDR.m1, to: vault, data: encodeFunctionData({ abi: vaultAbi, functionName: "unpause" }) }])) as Hex;
  await client().waitForTransactionReceipt({ hash: tx });
  assert.equal(await isPaused(), false);
});

test("the guardian flags are refused on X Layer mainnet, and need their own key", async () => {
  const mainnet = await once(["--network", "xlayer"]);
  assert.equal(mainnet.code, 64);
  assert.match(mainnet.stderr, /not allowed on X Layer mainnet/);

  const noKey = await once([], { HASHFRONT_GUARDIAN_PRIVATE_KEY: "" });
  assert.equal(noKey.code, 64);
  assert.match(noKey.stderr, /guardian needs its own key/);
});
