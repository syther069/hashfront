// Task B (plan step 6) on a LOCAL fork of X Layer mainnet; nothing is sent to X Layer.
// Deploys with the real mainnet script (DeployXLayer: TapeFun tape-out, container open, .tape bind, gate, NFT hand-over),
// then releases the real HashSwap demo build through the CLI on the 2-of-3 + timelock path, and reads every file
// back from the real SiteRegistry to compare it with the build on disk.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, http, type Address, type Hex } from "viem";
import { foundry } from "viem/chains";
import { siteRegistryAbi } from "../../src/abi.ts";
import { KEYS, startHarness, type Harness } from "./harness.ts";

const XLAYER_RPC = process.env.XLAYER_RPC ?? "https://rpc.xlayer.tech";
const REGISTRY: Address = "0xd6EFb7adCc9c83dC4924Ad56f6a8E4e969b9ADB6";
const TIMELOCK = 600;
const READ_STEP = 24_000;
const demoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../apps/demo-dapp");

let h: Harness;
let container: Address;

async function listFiles(dir: string, prefix = ""): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(path.join(dir, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await listFiles(dir, rel)));
    else out.push(rel);
  }
  return out.sort();
}

before(async () => {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const build = spawnSync(npm, ["run", "build"], { cwd: demoDir, encoding: "utf8", shell: process.platform === "win32" });
  assert.equal(build.status, 0, build.stdout + build.stderr);

  h = await startHarness({ port: 8551, timelock: TIMELOCK, forkUrl: XLAYER_RPC, mainnetScript: true });
  assert.ok(h.container, "DeployXLayer printed no CONTAINER");
  container = h.container;
  await cp(path.join(demoDir, "dist"), path.join(h.workDir, "dist"), { recursive: true });
});

after(async () => {
  await h?.stop();
});

test("the HashSwap build goes live through the policy circuit and reads back byte for byte", async () => {
  h.ok(["manifest", "dist", "--out", "manifest.json"]);
  assert.match(h.ok(["propose", "--manifest", "manifest.json"], KEYS.uploader), /release id 1:/);
  for (const key of [KEYS.m1, KEYS.m2]) h.ok(["approve", "--id", "1", "--manifest", "manifest.json"], key);
  h.ok(["upload", "--id", "1", "--manifest", "manifest.json", "dist"], KEYS.uploader);
  assert.match(h.ok(["verify", "--id", "1", "--manifest", "manifest.json"]), /byte for byte/);
  h.ok(["seal", "--id", "1", "--manifest", "manifest.json"], KEYS.uploader);

  // 2 of 3 approvals: the circuit must refuse until the timelock has passed
  const early = h.cli(["activate", "--id", "1"], KEYS.uploader);
  assert.notEqual(early.code, 0, `activation before the timelock must fail:\n${early.out}`);
  await h.rpcCall("evm_increaseTime", [TIMELOCK]);
  await h.rpcCall("evm_mine", []);
  h.ok(["activate", "--id", "1"], KEYS.uploader);

  const fork = createPublicClient({ chain: foundry, transport: http(h.rpc) });
  const read = async (file: string, size: number): Promise<Buffer> => {
    const parts: Buffer[] = [];
    for (let offset = 0; offset < size; offset += READ_STEP) {
      const hex: Hex = await fork.readContract({
        address: REGISTRY,
        abi: siteRegistryAbi,
        functionName: "readRange",
        args: [container, file, BigInt(offset), BigInt(READ_STEP)],
      });
      parts.push(Buffer.from(hex.slice(2), "hex"));
    }
    return Buffer.concat(parts);
  };

  const files = await listFiles(path.join(h.workDir, "dist"));
  assert.ok(files.includes("index.html"));
  let total = 0;
  for (const rel of files) {
    const local = await readFile(path.join(h.workDir, "dist", rel));
    total += local.length;
    const onChain = await read(`releases/v1/${rel}`, local.length);
    assert.ok(onChain.equals(local), `releases/v1/${rel} differs from the build`);
  }
  console.log(`  ${files.length} files, ${total} bytes served from the real SiteRegistry`);

  const fallback = await fork.readContract({ address: REGISTRY, abi: siteRegistryAbi, functionName: "fallbackPath", args: [container] });
  assert.equal(fallback, "index.html");
  const root = (await read("index.html", 4096)).toString("utf8");
  assert.match(root, /url=\/releases\/v1\/index\.html/);
  assert.match(h.ok(["status", "--id", "1"]), /live: v1\b/);
});
