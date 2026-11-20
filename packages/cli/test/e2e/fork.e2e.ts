// End-to-end against the REAL X Layer SiteRegistry on a local fork of mainnet (nothing is sent to X Layer).
// The gate takes over a live circuit's container (Lingxi, processor #419 circuit #1) by impersonating its holder,
// then the real CLI stages, seals and activates a release, and we read the result back from the real registry.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createPublicClient, encodeFunctionData, http, type Address } from "viem";
import { foundry } from "viem/chains";
import { siteRegistryAbi } from "../../src/abi.ts";
import { KEYS, startHarness, writeDemoBuild, type Harness } from "./harness.ts";

const XLAYER_RPC = process.env.XLAYER_RPC ?? "https://rpc.xlayer.tech";
const REGISTRY: Address = "0xd6EFb7adCc9c83dC4924Ad56f6a8E4e969b9ADB6";
const OPENER: Address = "0x536adD8F30f03b69f6fbF29d425A816A0dC50106";
const SITE_PROCESSOR: Address = "0xf70d324Da8C1C4Cb0dE3FF147E53E7E9db543c4e";
const SITE_ID = 1n;

const erc721Abi = [
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }] },
  {
    type: "function",
    name: "safeTransferFrom",
    stateMutability: "nonpayable",
    inputs: [{ type: "address" }, { type: "address" }, { type: "uint256" }],
    outputs: [],
  },
] as const;
const openerAbi = [
  {
    type: "function",
    name: "accountOf",
    stateMutability: "view",
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [{ type: "address" }],
  },
] as const;

let h: Harness;
let container: Address;

before(async () => {
  const mainnet = createPublicClient({ chain: foundry, transport: http(XLAYER_RPC) });
  container = await mainnet.readContract({ address: OPENER, abi: openerAbi, functionName: "accountOf", args: [SITE_PROCESSOR, SITE_ID] });

  h = await startHarness({ port: 8549, timelock: 60, forkUrl: XLAYER_RPC, registry: REGISTRY, container });
  await writeDemoBuild(path.join(h.workDir, "dist"));

  // hand the live site's circuit NFT to the gate, as its owner would in production
  const fork = createPublicClient({ chain: foundry, transport: http(h.rpc) });
  const holder = await fork.readContract({ address: SITE_PROCESSOR, abi: erc721Abi, functionName: "ownerOf", args: [SITE_ID] });
  await h.rpcCall("anvil_impersonateAccount", [holder]);
  await h.rpcCall("anvil_setBalance", [holder, "0xDE0B6B3A7640000"]);
  const data = encodeFunctionData({ abi: erc721Abi, functionName: "safeTransferFrom", args: [holder, h.gate, SITE_ID] });
  const txHash = (await h.rpcCall("eth_sendTransaction", [{ from: holder, to: SITE_PROCESSOR, data }])) as `0x${string}`;
  const receipt = await fork.waitForTransactionReceipt({ hash: txHash });
  assert.equal(receipt.status, "success");
  assert.equal(await fork.readContract({ address: SITE_PROCESSOR, abi: erc721Abi, functionName: "ownerOf", args: [SITE_ID] }), h.gate);
});

after(async () => {
  await h?.stop();
});

test("release flow writes to the real X Layer SiteRegistry", async () => {
  h.ok(["manifest", "dist", "--out", "manifest.json"]);
  h.ok(["propose", "--manifest", "manifest.json"], KEYS.uploader);
  for (const key of [KEYS.m1, KEYS.m2, KEYS.m3]) h.ok(["approve", "--id", "1", "--manifest", "manifest.json"], key);

  const upload = h.ok(["upload", "--id", "1", "--manifest", "manifest.json", "dist"], KEYS.uploader);
  const gasPerChunk = [...upload.matchAll(/assets\/app\.js \[\d\/3\]: \S+ \(gas (\d+)\)/g)].map((m) => Number(m[1]));
  assert.equal(gasPerChunk.length, 3);
  console.log(`  real registry gas per app.js chunk: ${gasPerChunk.join(", ")}`);

  assert.match(h.ok(["verify", "--id", "1", "--manifest", "manifest.json"]), /byte for byte/);
  h.ok(["seal", "--id", "1", "--manifest", "manifest.json"], KEYS.uploader);
  h.ok(["activate", "--id", "1"], KEYS.uploader);

  const fork = createPublicClient({ chain: foundry, transport: http(h.rpc) });
  const fallback = await fork.readContract({ address: REGISTRY, abi: siteRegistryAbi, functionName: "fallbackPath", args: [container] });
  assert.equal(fallback, "index.html");
  const root = await fork.readContract({
    address: REGISTRY,
    abi: siteRegistryAbi,
    functionName: "readRange",
    args: [container, "index.html", 0n, 4096n],
  });
  assert.match(Buffer.from(root.slice(2), "hex").toString("utf8"), /url=\/releases\/v1\/index\.html/);
});
