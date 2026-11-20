// Shared harness for CLI end-to-end tests: starts anvil, deploys ReleaseGate, runs the real CLI binary.
import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

const here = path.dirname(fileURLToPath(import.meta.url));
const cliMain = path.resolve(here, "../../src/main.ts");
const contractsDir = path.resolve(here, "../../../../contracts");

// Anvil's publicly known development accounts (mnemonic "test test ... junk", indexes 0-3). Local chains only.
export const KEYS = {
  uploader: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  m1: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  m2: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  m3: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
} as const satisfies Record<string, Hex>;

const addressOf = (key: Hex): Address => privateKeyToAccount(key).address;
export const ADDR = {
  uploader: addressOf(KEYS.uploader),
  m1: addressOf(KEYS.m1),
  m2: addressOf(KEYS.m2),
  m3: addressOf(KEYS.m3),
};

export interface Harness {
  rpc: string;
  gate: Address;
  /** the site container the gate writes to (fork modes only) */
  container: Address | undefined;
  workDir: string;
  cli(args: string[], key?: Hex): { code: number; out: string };
  ok(args: string[], key?: Hex): string;
  rpcCall(method: string, params: unknown[]): Promise<unknown>;
  stop(): Promise<void>;
}

export interface HarnessOptions {
  port: number;
  timelock: number;
  forkUrl?: string;
  /** use a real SiteRegistry + container (fork mode) */
  registry?: Address;
  container?: Address;
  /** fork mode: deploy with the real mainnet script (DeployXLayer: tape-out, open, bind, gate, NFT transfer) */
  mainnetScript?: boolean;
}

async function waitForRpc(rpc: string): Promise<void> {
  const client = createPublicClient({ chain: foundry, transport: http(rpc) });
  for (let i = 0; i < 100; i++) {
    try {
      await client.getBlockNumber();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error(`anvil did not start on ${rpc}`);
}

export async function startHarness(opts: HarnessOptions): Promise<Harness> {
  const rpc = `http://127.0.0.1:${opts.port}`;
  const anvilArgs = ["--port", String(opts.port), "--silent"];
  if (opts.forkUrl) anvilArgs.push("--fork-url", opts.forkUrl);
  const anvil: ChildProcess = spawn("anvil", anvilArgs, { stdio: "ignore" });
  try {
    return await deployAndBuild(rpc, opts, anvil);
  } catch (err) {
    anvil.kill(); // never leave a node behind when setup fails, or the test runner hangs
    throw err;
  }
}

async function deployAndBuild(rpc: string, opts: HarnessOptions, anvil: ChildProcess): Promise<Harness> {
  await waitForRpc(rpc);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    MAINTAINERS: `${ADDR.m1},${ADDR.m2},${ADDR.m3}`,
    UPLOADER: ADDR.uploader,
    REPORTER: ADDR.uploader,
    TIMELOCK: String(opts.timelock),
    ...(opts.registry && opts.container ? { REGISTRY: opts.registry, CONTAINER: opts.container } : {}),
    ...(opts.mainnetScript ? { DEPLOYMENTS_FILE: "deployments/rehearsal.json" } : {}),
  };
  if (opts.mainnetScript) {
    delete env.POLICY_ID; // always tape out a fresh circuit on the fork
    // Anvil's account 0 has a public key, and on X Layer mainnet someone has set an EIP-7702 delegation on it,
    // so ERC-1155 transistor mints to it revert (ERC1155InvalidReceiver). Clear it on this local fork only;
    // the real deployer is a fresh burner without code.
    await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "anvil_setCode", params: [ADDR.uploader, "0x"] }),
    });
  }
  const script = opts.mainnetScript ? "script/DeployXLayer.s.sol" : "script/DeployLocal.s.sol";
  const deploy = spawnSync("forge", ["script", script, "--rpc-url", rpc, "--broadcast", "--private-key", KEYS.uploader], {
    cwd: contractsDir,
    encoding: "utf8",
    env,
  });
  assert.equal(deploy.status, 0, deploy.stdout + deploy.stderr);
  const gate = /GATE=(0x[0-9a-fA-F]{40})/.exec(deploy.stdout)?.[1] as Address | undefined;
  assert.ok(gate, `gate address not found in:\n${deploy.stdout}`);
  const container = (/CONTAINER=(0x[0-9a-fA-F]{40})/.exec(deploy.stdout)?.[1] as Address | undefined) ?? opts.container;

  const workDir = await mkdtemp(path.join(tmpdir(), "hashfront-e2e-"));

  const cli = (args: string[], key?: Hex) => {
    const { HASHFRONT_PRIVATE_KEY: _ignored, ...inherited } = process.env;
    const childEnv: NodeJS.ProcessEnv = {
      ...inherited,
      HASHFRONT_RPC_URL: rpc,
      HASHFRONT_GATE: gate,
      ...(key ? { HASHFRONT_PRIVATE_KEY: key } : {}),
    };
    const r = spawnSync(process.execPath, [cliMain, ...args, "--network", "local"], { cwd: workDir, env: childEnv, encoding: "utf8" });
    return { code: r.status ?? -1, out: `${r.stdout}${r.stderr}` };
  };

  const rpcCall = async (method: string, params: unknown[]) => {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const body = (await res.json()) as { result?: unknown; error?: { message: string } };
    if (body.error) throw new Error(`${method}: ${body.error.message}`);
    return body.result;
  };

  return {
    rpc,
    gate,
    container,
    workDir,
    cli,
    ok(args, key) {
      const r = cli(args, key);
      assert.equal(r.code, 0, `hashfront ${args.join(" ")} failed (exit ${r.code}):\n${r.out}`);
      return r.out;
    },
    rpcCall,
    async stop() {
      anvil.kill();
      await rm(workDir, { recursive: true, force: true });
    },
  };
}

/** Writes a small static build: index.html, a 3-chunk bundle and a stylesheet. */
export async function writeDemoBuild(dir: string): Promise<void> {
  await mkdir(path.join(dir, "assets"), { recursive: true });
  await writeFile(path.join(dir, "index.html"), '<!doctype html><script src="assets/app.js"></script>');
  await writeFile(path.join(dir, "assets", "app.js"), `/* bundle */${"x".repeat(60_000)}`);
  await writeFile(path.join(dir, "assets", "app.css"), "body{margin:0}");
}
