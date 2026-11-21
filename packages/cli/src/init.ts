// `hashfront init`: one-command onboarding (plan step 12). Collects the setup, pre-flights the build, runs the
// step 4 deployment (contracts/script/DeployXLayer.s.sol) and prints everything the team needs next.
//
// Mainnet safety:
//   - default is a simulation; nothing is sent without --broadcast
//   - an anvil fork of X Layer also reports chain id 196, so "is this real?" is decided by the RPC host: anything but
//     loopback is treated as mainnet and additionally needs an interactive, typed confirmation
//   - --unlocked (impersonation) is accepted only on loopback; real deploys sign with a Foundry keystore (--account),
//     whose password forge asks for itself. This command never takes a private key.
//   - a finished deployment file is never overwritten, so a re-run can't tape out and pay the fees twice
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { createPublicClient, formatEther, getAddress, http, isAddress, parseAbi, type Address, type PublicClient } from "viem";
import { processorAbi, releaseGateAbi } from "./abi.ts";
import { UsageError, xlayer } from "./chains.ts";
import { preflight } from "./preflight.ts";
import { okbUsd } from "./doctor.ts";
import { badgeSnippet, dewebUrl } from "./snippets.ts";

const PROCESSOR = "0x39E44DbA62811E87fDe122CA4d6c082568a384D0";
const OPENER = "0x536adD8F30f03b69f6fbF29d425A816A0dC50106";
const feesAbi = parseAbi([
  "function TAPEOUT_FEE() view returns (uint256)",
  "function FEE() view returns (uint256)",
  "function isOpened(address circuits, uint256 tokenId) view returns (bool)",
  "function transistors() view returns (address)",
  "function mintPrice() view returns (uint256)",
  "function protocolFee() view returns (uint256)",
]);
/** NAND gates in policy v1 (circuits/out/policy.json "gates"); checked against the file by the init unit test. */
export const POLICY_GATES = 22;

interface DeploymentRecord {
  gate: string;
  policyId: number | string;
  container: string;
  url: string;
}

/**
 * The deploy script writes its record during forge's local run, BEFORE any transaction is sent, so the file alone
 * proves nothing. A deployment counts only if the chain shows all three: gate code, the gate wired to that circuit,
 * and the gate holding the circuit (the last, irreversible step).
 */
export async function verifyDeployment(client: PublicClient, d: DeploymentRecord): Promise<string[]> {
  const problems: string[] = [];
  if (!isAddress(d.gate ?? "", { strict: false })) return ["the record has no valid gate address"];
  const gate = getAddress(d.gate);
  const code = await client.getCode({ address: gate });
  if (!code || code === "0x") return [`no contract at gate ${gate}`];
  const id = BigInt(d.policyId);
  const [wired, owner] = await Promise.all([
    client.readContract({ address: gate, abi: releaseGateAbi, functionName: "policyId" }).catch(() => undefined),
    client.readContract({ address: PROCESSOR, abi: processorAbi, functionName: "ownerOf", args: [id] }).catch(() => undefined),
  ]);
  if (wired !== id) problems.push(`gate ${gate} is wired to circuit #${wired ?? "?"}, not #${id}`);
  if (owner?.toLowerCase() !== gate.toLowerCase()) problems.push(`circuit #${id} is held by ${owner ?? "nobody"}, not the gate`);
  return problems;
}

function unfinished(file: string, d: DeploymentRecord, problems: string[]): UsageError {
  return new UsageError(
    [
      `${file} records an UNFINISHED deployment: ${problems.join("; ")}.`,
      "Nothing in it can be used. Check which steps landed on the explorer (your deployer's transactions), then:",
      `  - if circuit #${d.policyId} was taped out by your deployer, move the file aside and re-run with --policy-id ${d.policyId}`,
      "    (this reuses the circuit and its container instead of paying their fees again)",
      "  - otherwise move the file aside and re-run as before",
    ].join("\n"),
  );
}

export interface InitOptions {
  site?: string | undefined;
  name?: string | undefined;
  maintainers?: string | undefined;
  uploader?: string | undefined;
  reporter?: string | undefined;
  timelock?: string | undefined;
  telegramChat?: string | undefined;
  policy?: string | undefined;
  policyId?: string | undefined;
  build?: string | undefined;
  rpc?: string | undefined;
  account?: string | undefined;
  unlocked?: boolean | undefined;
  sender?: string | undefined;
  broadcast?: boolean | undefined;
  out?: string | undefined;
  contracts?: string | undefined;
}

export interface InitConfig {
  version: 1;
  network: "xlayer";
  site: string;
  name: string;
  gate: Address;
  policyId: string;
  container: Address;
  verifiedUrl: string;
  maintainers: Address[];
  uploader: Address;
  reporter: Address;
  timelockSeconds: number;
  telegramChat?: string;
  deployedAt: string;
}

export function isLoopback(rpc: string): boolean {
  try {
    const h = new URL(rpc).hostname;
    return h === "127.0.0.1" || h === "localhost" || h === "[::1]" || h === "::1";
  } catch {
    return false;
  }
}

/** "600", "45m", "24h", "2d" -> seconds; 1 s to 30 days, like the deploy script. */
export function parseDuration(v: string): number {
  const m = /^(\d+)\s*([smhd]?)$/i.exec(v.trim());
  if (!m) throw new UsageError(`--timelock: "${v}" is not a duration (e.g. 600, 45m, 24h, 2d)`);
  const n = Number(m[1]) * ({ "": 1, s: 1, m: 60, h: 3600, d: 86400 } as Record<string, number>)[m[2]!.toLowerCase()]!;
  if (n < 1 || n > 30 * 86400) throw new UsageError("--timelock must be between 1 second and 30 days");
  return n;
}

function address(v: string, what: string): Address {
  if (!isAddress(v.trim(), { strict: false })) throw new UsageError(`${what} is not an address: ${v}`);
  return getAddress(v.trim());
}

export function parseMaintainers(v: string): Address[] {
  const list = v.split(",").map((x) => address(x, "maintainer"));
  if (list.length !== 3) throw new UsageError("--maintainers needs exactly 3 addresses (2 of 3 approve a release)");
  if (new Set(list.map((a) => a.toLowerCase())).size !== 3) throw new UsageError("--maintainers must be 3 different addresses");
  return list;
}

/** Fills missing values interactively when stdin is a terminal; otherwise a missing value is a usage error. */
async function ask(value: string | undefined, flag: string, question: string, fallback?: string): Promise<string> {
  if (value !== undefined && value !== "") return value;
  if (!process.stdin.isTTY) {
    if (fallback !== undefined) return fallback;
    throw new UsageError(`missing ${flag}`);
  }
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const answer = (await rl.question(`${question}${fallback !== undefined ? ` [${fallback}]` : ""}: `)).trim();
    if (answer) return answer;
    if (fallback !== undefined) return fallback;
    throw new UsageError(`missing ${flag}`);
  } finally {
    rl.close();
  }
}

async function confirmTyped(word: string, prompt: string): Promise<void> {
  if (!process.stdin.isTTY) throw new UsageError("a mainnet deployment needs an interactive terminal to confirm; it is never run unattended");
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const answer = (await rl.question(`${prompt}\nType ${word} to continue: `)).trim();
    if (answer !== word) throw new UsageError("not confirmed; nothing was sent");
  } finally {
    rl.close();
  }
}

function runForge(contractsDir: string, args: string[], env: NodeJS.ProcessEnv): Promise<number> {
  return new Promise((resolve, reject) => {
    // inherited stdio: forge asks for the keystore password itself
    const child = spawn("forge", args, { cwd: contractsDir, env, stdio: "inherit", shell: false });
    child.once("error", (e) => reject(new Error(`could not run forge (is Foundry installed?): ${e.message}`)));
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

export async function cmdInit(o: InitOptions, log: (s: string) => void = (s) => console.log(s)): Promise<InitConfig | undefined> {
  // ---- inputs
  const site = new URL(await ask(o.site, "--site", "Your protocol's website (e.g. https://app.example.org)"));
  if (site.protocol !== "https:" && site.protocol !== "http:") throw new UsageError("--site must be an http(s) URL");
  const name = (await ask(o.name, "--name", "Protocol name for alerts (not a domain)", site.hostname.split(".")[0])).trim();
  if (!name || /[./:]/.test(name)) throw new UsageError("--name must be a plain name, not a domain or URL (Telegram would turn it into a link)");
  const maintainers = parseMaintainers(await ask(o.maintainers, "--maintainers", "3 maintainer addresses, comma-separated"));
  const uploader = address(await ask(o.uploader, "--uploader", "Uploader address (the CI key that proposes and uploads)"), "--uploader");
  const reporter = address(await ask(o.reporter, "--reporter", "Reporter address (the watcher's key that sends alerts)"), "--reporter");
  const timelock = parseDuration(await ask(o.timelock, "--timelock", "Timelock before a 2-of-3 release can go live", "24h"));
  const telegramChat = o.telegramChat?.trim() || undefined;
  if (telegramChat !== undefined && !/^(-?\d+|@[A-Za-z0-9_]{5,})$/.test(telegramChat)) throw new UsageError("--telegram-chat must be a numeric chat id or @channelname");
  if ((o.policy ?? "v1") !== "v1") throw new UsageError('--policy: only "v1" (2 of 3 + timelock, or 3 of 3; freeze wins) exists');
  if (o.policyId !== undefined && !/^\d+$/.test(o.policyId)) throw new UsageError("--policy-id must be a circuit id");

  const rpc = o.rpc ?? xlayer.rpcUrls.default.http[0]!;
  const loopback = isLoopback(rpc);
  if (o.unlocked && !loopback) throw new UsageError("--unlocked (impersonation) only works against a local fork on 127.0.0.1");
  if (o.unlocked && !o.sender) throw new UsageError("--unlocked needs --sender <address>");
  if (!o.unlocked && !o.account) throw new UsageError("--account <foundry keystore name> is required (create one with: cast wallet import <name> --interactive)");

  // ---- pre-flight
  if (o.build) {
    const pf = await preflight(o.build);
    for (const w of pf.warnings) log(`  warning: ${w}`);
    if (pf.errors.length) throw new UsageError(`pre-flight failed for ${o.build}:\n${pf.errors.map((e) => `  - ${e}`).join("\n")}`);
    log(`pre-flight: ${o.build} is a static build that works on DeWEB (${pf.files} files, ${pf.bytes.toLocaleString("en-US")} bytes)`);
  } else {
    log("pre-flight skipped (pass --build <dir> to check your build first)");
  }

  // ---- chain checks and cost
  const client = createPublicClient({ chain: xlayer, transport: http(rpc, { timeout: 20_000 }) }) as PublicClient;
  const chainId = await client.getChainId();
  if (chainId !== xlayer.id) throw new UsageError(`${rpc} is chain ${chainId}, not X Layer (196) or a fork of it`);
  const transistors = await client.readContract({ address: PROCESSOR, abi: feesAbi, functionName: "transistors" });
  const [tapeoutFee, openFee, alreadyOpen, mintPrice, protocolFee] = await Promise.all([
    client.readContract({ address: PROCESSOR, abi: feesAbi, functionName: "TAPEOUT_FEE" }),
    client.readContract({ address: OPENER, abi: feesAbi, functionName: "FEE" }),
    o.policyId ? client.readContract({ address: OPENER, abi: feesAbi, functionName: "isOpened", args: [PROCESSOR, BigInt(o.policyId)] }) : false,
    client.readContract({ address: transistors, abi: feesAbi, functionName: "mintPrice" }),
    client.readContract({ address: transistors, abi: feesAbi, functionName: "protocolFee" }),
  ]);
  // a new circuit first mints its NAND gates (DeployXLayer: gates * mintPrice + protocolFee), then pays the tape-out
  const mintFee = BigInt(POLICY_GATES) * mintPrice + protocolFee;
  const fees = o.policyId ? (alreadyOpen ? 0n : openFee) : mintFee + tapeoutFee + openFee;
  const what = !o.policyId
    ? "gate mint + policy circuit tape-out + site container"
    : alreadyOpen
      ? `reusing circuit #${o.policyId}, whose container is already open`
      : `reusing circuit #${o.policyId}; opening its container`;
  const usdPrice = await okbUsd();
  const inUsd = usdPrice ? ` (≈ $${(Number(formatEther(fees)) * usdPrice).toFixed(2)} at $${usdPrice.toFixed(2)}/OKB, OKX Market API)` : "";
  log(`cost: ${formatEther(fees)} OKB in TapeOut fees${inUsd} (${what}) plus gas (about 0.0001 OKB)`);

  // ---- deployment file: one per site; a finished one is never overwritten
  const contractsDir = path.resolve(o.contracts ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../contracts"));
  if (!existsSync(path.join(contractsDir, "script", "DeployXLayer.s.sol"))) throw new UsageError(`no Hashfront contracts at ${contractsDir} (use --contracts <dir>)`);
  const slug = site.hostname.replace(/[^a-z0-9.-]/gi, "_");
  const relFile = o.broadcast ? `deployments/init-${slug}${loopback ? ".fork" : ""}.json` : `deployments/init-${slug}.dryrun.json`;
  const absFile = path.join(contractsDir, relFile);
  if (o.broadcast && existsSync(absFile)) {
    const prev = JSON.parse(await readFile(absFile, "utf8")) as DeploymentRecord;
    const problems = await verifyDeployment(client, prev);
    if (problems.length) throw unfinished(absFile, prev, problems);
    throw new UsageError(`${absFile} records a finished deployment (gate ${getAddress(prev.gate)}, verified on chain). Refusing to deploy twice.`);
  }
  await mkdir(path.dirname(absFile), { recursive: true });

  if (o.broadcast && !loopback) {
    await confirmTyped(
      "DEPLOY",
      `About to deploy Hashfront for ${site.origin} on X Layer MAINNET via ${rpc}.\nThis spends ${formatEther(fees)} OKB in fees plus gas and hands the policy circuit to the new gate permanently.`,
    );
  }

  const args = ["script", "script/DeployXLayer.s.sol", "--rpc-url", rpc, "--slow"];
  if (o.unlocked) args.push("--unlocked", "--sender", address(o.sender!, "--sender"));
  else args.push("--account", o.account!);
  if (o.broadcast) args.push("--broadcast");
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    MAINTAINERS: maintainers.join(","),
    UPLOADER: uploader,
    REPORTER: reporter,
    TIMELOCK: String(timelock),
    DEPLOYMENTS_FILE: relFile,
  };
  if (o.policyId) env.POLICY_ID = o.policyId;
  else delete env.POLICY_ID;

  log(`${o.broadcast ? "deploying" : "simulating (no transaction is sent; add --broadcast to deploy)"}: forge ${args.join(" ")}`);
  const code = await runForge(contractsDir, args, env);
  if (!o.broadcast) {
    await rm(absFile, { force: true });
    if (code !== 0) throw new Error(`the simulation failed (forge exit ${code}); nothing was sent`);
    log("simulation passed. Re-run with --broadcast to deploy.");
    return undefined;
  }

  // forge may have sent some transactions before failing, and its record exists either way: trust only the chain
  if (!existsSync(absFile)) throw new Error(`forge script failed (exit ${code}) before any deployment record was written; nothing was deployed`);
  const d = JSON.parse(await readFile(absFile, "utf8")) as DeploymentRecord;
  const problems = await verifyDeployment(client, d);
  if (code !== 0 || problems.length) {
    const aside = absFile.replace(/\.json$/, `.incomplete-${Date.now()}.json`);
    await rename(absFile, aside);
    throw unfinished(aside, d, problems.length ? problems : [`forge exited with ${code}`]);
  }
  const cfg: InitConfig = {
    version: 1,
    network: "xlayer",
    site: site.origin + site.pathname,
    name,
    gate: getAddress(d.gate),
    policyId: String(d.policyId),
    container: getAddress(d.container),
    verifiedUrl: d.url || dewebUrl(BigInt(d.policyId)),
    maintainers,
    uploader,
    reporter,
    timelockSeconds: timelock,
    ...(telegramChat ? { telegramChat } : {}),
    deployedAt: new Date().toISOString(),
  };
  const out = o.out ?? "hashfront.json";
  await writeFile(out, `${JSON.stringify(cfg, null, 2)}\n`);
  for (const line of summary(cfg, out, absFile)) log(line);
  return cfg;
}

/** The watcher command for this deployment, as an argument list (also run by the e2e so it can't go stale). */
export function watcherArgs(cfg: InitConfig): string[] {
  return [
    "packages/watcher/src/main.ts",
    "--site", cfg.site,
    "--gate", cfg.gate,
    "--network", cfg.network,
    "--manifests", "./manifests",
    "--state", "signals.json",
    "--name", cfg.name,
    "--alert-state", "alerts.json",
    "--tapesend-to", "self",
    "--alerts-mainnet",
    ...(cfg.telegramChat ? [`--telegram-chat=${cfg.telegramChat}`] : []),
  ];
}

const quote = (a: string) => (/^[\w./:=@,+-]+$/.test(a) ? a : `"${a.replace(/"/g, '\\"')}"`);

function summary(cfg: InitConfig, out: string, deployments: string): string[] {
  return [
    "",
    "Hashfront is set up.",
    `  gate            ${cfg.gate}`,
    `  policy circuit  #${cfg.policyId} (2 of 3 + ${cfg.timelockSeconds} s timelock, or 3 of 3)`,
    `  verified link   ${cfg.verifiedUrl}   <- pin this in your Telegram and docs`,
    `  config          ${out} (deployment record: ${deployments})`,
    "",
    "Check it:",
    `  hashfront status --gate ${cfg.gate}`,
    "",
    "Status page and badge (host apps/web/dist on any static host):",
    `  VITE_GATE=${cfg.gate} VITE_NETWORK=xlayer npm run build -w apps/web`,
    `  ${badgeSnippet("https://<your status host>/badge.html")}`,
    "",
    "Watcher (needs HASHFRONT_PRIVATE_KEY = the reporter key; TELEGRAM_BOT_TOKEN if --telegram-chat is set):",
    `  node ${watcherArgs(cfg).map(quote).join(" ")}`,
    "",
    "GitHub Action: copy packages/cli/templates/hashfront-release.yml to .github/workflows/ and set",
    `  secrets HASHFRONT_PRIVATE_KEY (uploader ${cfg.uploader}) and variable HASHFRONT_GATE=${cfg.gate}`,
  ];
}
