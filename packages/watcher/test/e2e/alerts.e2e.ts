// Plan step 9 verify, on a LOCAL fork of X Layer mainnet (nothing is sent to X Layer or to Telegram):
// the real deploy script and the live TapeSend hub (forked), a local "normal host", and a local mock of the Telegram
// Bot API. The real CLI runs with --once per check, the way a cron job or the GitHub Action would run it.
// One byte flips and stays flipped: exactly one Telegram message and one onchain Alert. Restored: one all-clear each.
//
// Live Telegram variant: set E2E_TELEGRAM_CHAT=<test chat id> and TELEGRAM_BOT_TOKEN in your own shell. The two
// messages then go to that chat through the real Bot API (the chain part still runs only on the local fork).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFile, spawnSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import { copyFile, cp, mkdir, readdir, readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseAbi, type Hex } from "viem";
import { releaseGateAbi } from "@hashfront/cli/abi";
import { createContext } from "@hashfront/cli/context";
import { KEYS, startHarness, type Harness } from "../../../cli/test/e2e/harness.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.resolve(here, "../../../../apps/demo-dapp");
const watchMain = path.resolve(here, "../../src/main.ts");
const XLAYER_RPC = process.env.XLAYER_RPC ?? "https://rpc.xlayer.tech";
// a syntactically valid, fake token: the mock accepts only this one
const FAKE_TOKEN = `123456:${"A".repeat(35)}`;
const LIVE_CHAT = process.env.E2E_TELEGRAM_CHAT?.trim();
const hubAbi = parseAbi(["function endpointOf(address) view returns (bytes32)", "function inboxCount(bytes32) view returns (uint256)"]);

let h: Harness;
let host: Server;
let tg: Server;
let site: URL;
let tgApi: string;
const files = new Map<string, Buffer>();
const telegram: { chat: string; text: string }[] = [];

async function listFiles(dir: string, prefix = ""): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(path.join(dir, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await listFiles(dir, rel)));
    else out.push(rel);
  }
  return out;
}

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

before(async () => {
  const build = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], { cwd: demoDir, encoding: "utf8", shell: process.platform === "win32" });
  assert.equal(build.status, 0, build.stdout + build.stderr);

  h = await startHarness({ port: 8554, timelock: 600, forkUrl: XLAYER_RPC, mainnetScript: true });
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
  site = new URL(`${await listen(host)}/`);

  tg = createServer((req, res) => {
    let raw = "";
    req.on("data", (c: Buffer) => (raw += c));
    req.on("end", () => {
      if (req.method !== "POST" || req.url !== `/bot${FAKE_TOKEN}/sendMessage`) {
        return void res.writeHead(401, { "content-type": "application/json" }).end('{"ok":false,"description":"Unauthorized"}');
      }
      const b = JSON.parse(raw) as { chat_id: string; text: string };
      telegram.push({ chat: b.chat_id, text: b.text });
      res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true,"result":{}}');
    });
  });
  tgApi = await listen(tg);
});

after(async () => {
  host?.close();
  tg?.close();
  await h?.stop();
});

/** One `hashfront-watch --once` with alerts on; returns its JSON line. Exit codes 1–3 are verdicts, not failures. */
async function once(): Promise<{ status: string; alerts?: { channel: string; kind: number | string; ok: boolean; detail?: string }[] }> {
  const args = [
    watchMain, "--once", "--site", site.href, "--gate", h.gate, "--manifests", path.join(h.workDir, "manifests"),
    "--network", "local", "--rpc", h.rpc, "--signals", "none",
    "--name", "HashSwap", "--alert-state", path.join(h.workDir, "alerts.json"),
    ...(LIVE_CHAT ? [`--telegram-chat=${LIVE_CHAT}`] : ["--telegram-chat=-1001234567890", "--telegram-api", tgApi]),
    "--tapesend-to", "self",
  ];
  // uploader = reporter here; the live variant keeps the caller's own TELEGRAM_BOT_TOKEN
  const env = { ...process.env, HASHFRONT_PRIVATE_KEY: KEYS.uploader, ...(LIVE_CHAT ? {} : { TELEGRAM_BOT_TOKEN: FAKE_TOKEN }) };
  const { out, stderr } = await new Promise<{ out: string; stderr: string }>((resolve, reject) =>
    execFile(process.execPath, args, { env, encoding: "utf8" }, (err, out, stderr) => {
      const code = (err as { code?: unknown } | null)?.code;
      if (err && !(typeof code === "number" && code >= 1 && code <= 3)) reject(new Error(`${err.message}\n${stderr}`));
      else resolve({ out, stderr });
    }),
  );
  const line = out.trim().split("\n").at(-1);
  assert.ok(line, `no JSON line from hashfront-watch; stderr: ${stderr}`);
  return JSON.parse(line);
}

test("one alert per incident on Telegram and onchain TapeSend, then one all-clear", async () => {
  const ctx = createContext({ network: "local", gate: h.gate, rpcUrl: h.rpc, needsSigner: false });
  const [hub, container] = await Promise.all([
    ctx.publicClient.readContract({ address: ctx.gate, abi: releaseGateAbi, functionName: "hub" }),
    ctx.publicClient.readContract({ address: ctx.gate, abi: releaseGateAbi, functionName: "container" }),
  ]);
  const endpoint = (await ctx.publicClient.readContract({ address: hub, abi: hubAbi, functionName: "endpointOf", args: [container] })) as Hex;
  const inbox = () => ctx.publicClient.readContract({ address: hub, abi: hubAbi, functionName: "inboxCount", args: [endpoint] });
  const fromBlock = await ctx.publicClient.getBlockNumber();
  const inbox0 = await inbox();

  assert.equal((await once()).status, "MATCH");

  const js = [...files.keys()].find((p) => p.endsWith(".js"));
  assert.ok(js);
  const good = files.get(js) as Buffer;
  const bad = Buffer.from(good);
  bad.writeUInt8(bad.readUInt8(bad.length - 2) ^ 0x01, bad.length - 2);
  files.set(js, bad);

  const first = await once(); // 1 of 2: not confirmed yet
  assert.equal(first.status, "MISMATCH");
  assert.equal(first.alerts, undefined);
  const second = await once(); // confirmed: alert on both channels
  assert.deepEqual(second.alerts?.map((a) => [a.channel, a.kind, a.ok]), [["telegram", 1, true], ["tapesend", 1, true]], JSON.stringify(second.alerts));
  assert.match(second.alerts?.[1]?.detail ?? "", /delivered 1, failed 0/);
  for (let i = 0; i < 4; i++) assert.equal((await once()).alerts, undefined, "no repeat while the incident lasts");

  files.set(js, good);
  for (let i = 0; i < 2; i++) assert.equal((await once()).alerts, undefined);
  const cleared = await once();
  assert.deepEqual(cleared.alerts?.map((a) => [a.channel, a.kind, a.ok]), [["telegram", 3, true], ["tapesend", 3, true]]);

  if (LIVE_CHAT) console.log(`  live Telegram: 2 messages sent to chat ${LIVE_CHAT}; check them there`);
  else assertMockTelegram();

  const events = await ctx.publicClient.getContractEvents({ address: ctx.gate, abi: releaseGateAbi, eventName: "Alert", fromBlock });
  assert.deepEqual(events.map((e) => [e.args.kind, e.args.delivered, e.args.failed]), [[1, 1n, 0n], [3, 1n, 0n]]);
  assert.equal((await inbox()) - inbox0, 2n);
});

function assertMockTelegram() {
  assert.equal(telegram.length, 2);
  assert.match(telegram[0]!.text, /^HashSwap: Hashfront alert: website does not match the approved release/);
  assert.match(telegram[0]!.text, /approved release v1\. Do not connect your wallet/); // read from the gate's alertPayload
  assert.match(telegram[1]!.text, /all clear/);
  for (const m of telegram) {
    assert.equal(m.chat, "-1001234567890");
    assert.doesNotMatch(m.text, /https?|:\/\/|127\.0\.0\.1/);
  }
}
