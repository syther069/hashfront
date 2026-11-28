#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { isIP } from "node:net";
import { parseArgs } from "node:util";
import { UsageError } from "@hashfront/cli/chains";
import { createContext } from "@hashfront/cli/context";
import type { AllowList } from "./compare.ts";
import { exitCode } from "./exit.ts";
import { checkSignals, scanVia, type SignalConfig, type SignalsReport } from "./signals/index.ts";
import { createDispatcher, validateName, type Delivery, type Dispatcher } from "./alerts/index.ts";
import { sendTelegram, type TelegramConfig } from "./alerts/telegram.ts";
import { resolveRecipients } from "./alerts/tapesend.ts";
import { keyFromAccount } from "@hashfront/cli/keystore";
import { credentialsFromEnv, drainOkxMetrics, OkxClient } from "@hashfront/okx/client";
import { formatEther, isAddress } from "viem";
import { assertGuardianAllowed } from "./alerts/guardian.ts";
import type { GasStatus } from "./alerts/gas.ts";
import { checkOnce, watchLoop, type CheckResult, type WatchConfig } from "./watch.ts";

const USAGE = `hashfront-watch --site <url> --gate <address> --manifests <dir> [options]
hashfront-watch --site <url> --signals-only [--state <file>] [options]
hashfront-watch --telegram-test --telegram-chat <id>

Compares the protocol's normal website with its live onchain Hashfront release, and watches the domain's DNS,
TLS certificate and OnchainOS phishing scan.

  --site <url>          the normal website, e.g. https://app.example.org/
  --gate <address>      ReleaseGate address (or HASHFRONT_GATE)
  --manifests <dir>     directory of release manifest.json files; each is accepted only if it reproduces an onchain root
  --allow <file>        optional JSON {"<path>": ["0x<sha256>", ...]} of served hashes the team accepts
  --network <name>      xlayer (default) | xlayer-testnet | local
  --rpc <url>           override RPC (or HASHFRONT_RPC_URL)
  --interval <seconds>  polling interval (default 30)
  --once                run one check and exit (codes below)

Signals (step 8):
  --signals <list>      dns,cert,scan,ct,registry (default) | any subset that includes dns | none (DNS is the essential one)
                        registry = RDAP (nameservers, transfer locks) and DNSSEC (DoH)
                        ct = Certificate Transparency: a new certificate for the domain, from CertSpotter (crt.sh as fallback)
  --state <file>        signals baseline. Recorded on the first check whose content is MATCH (or by --signals-only),
                        then only compared; it never updates itself
  --rebaseline          with --once or --signals-only: replace the baseline with the current records
                        (with --once, only while the content is MATCH)
  --dns-servers <list>  resolvers queried one by one (default 1.1.1.1,8.8.8.8)
  --signals-only        no chain or content check: print the signals once, recording the baseline if missing

Alerts (step 9). On when --telegram-chat or --tapesend-to is given; they never contain a link:
  --name <text>         protocol name shown in Telegram (required; not a domain, Telegram would link it)
  --alert-state <file>  incident state (required): one alert per incident, survives restarts, retries failed sends
  --telegram-chat <id>  community chat for alerts; the token is read from TELEGRAM_BOT_TOKEN only.
                        Group ids are negative: write --telegram-chat=-100123... (with "=")
  --telegram-team-chat <id>  optional team chat for notices that are not proof of a hijack
                        (CDN-modified page, host behind, unreachable, signal warnings, OnchainOS phishing flag)
  --tapesend-to <list>  bytes32 TapeSend endpoint ids (max 8), or "self"; sent with ReleaseGate.alert() signed by
                        the reporter: --account <foundry keystore> (password asked once at start), or
                        HASHFRONT_PRIVATE_KEY on a server
  --alerts-mainnet      required for TapeSend alerts on --network xlayer (each one is a mainnet transaction)
  --guardian-call <addr>      optional pause: call pause() on this protocol contract once when an incident is confirmed
  --guardian-account <name>   Foundry keystore of the guardian key (or HASHFRONT_GUARDIAN_PRIVATE_KEY in the env). A separate key
                              that can only pause. Refused on X Layer mainnet: forks and testnets only. Unpausing is the owner's job
  --confirm <n>         bad checks in a row before a community alert (default 2)
  --clear <n>           clean checks in a row before the all-clear (default 3)
  --telegram-test       send one test message to --telegram-chat and exit

Exit codes with --once and --signals-only:
  0  MATCH and no signal above info
  1  HOST_BEHIND / DEPLOYED_BEFORE_ACTIVATION / CDN_MODIFIED, or a signal warning (new address, new cert issuer)
  2  MISMATCH, or a signal alert (NS, zone or CNAME changed; OnchainOS flags the domain)
  3  UNVERIFIABLE / UNREACHABLE, a signal that could not be checked, or an error
`;

async function loadAllow(file: string): Promise<AllowList> {
  const raw = JSON.parse(await readFile(file, "utf8")) as unknown;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new UsageError(`${file}: expected an object of path -> [sha256]`);
  const out = new Map<string, Set<string>>();
  for (const [p, hashes] of Object.entries(raw)) {
    if (!Array.isArray(hashes) || !hashes.every((h) => typeof h === "string" && /^0x[0-9a-fA-F]{64}$/.test(h))) {
      throw new UsageError(`${file}: "${p}" must be a list of 0x-prefixed sha256 hashes`);
    }
    out.set(p, new Set(hashes.map((h: string) => h.toLowerCase())));
  }
  return out;
}

function parseSignals(list: string, opts: { state?: string | undefined; rebaseline: boolean; dnsServers?: string | undefined }): SignalConfig | undefined {
  const names = list
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (names.length === 1 && names[0] === "none") {
    if (opts.state || opts.rebaseline) throw new UsageError("--state and --rebaseline need signals (not --signals none)");
    return undefined;
  }
  for (const n of names) if (!["dns", "cert", "scan", "ct", "registry"].includes(n)) throw new UsageError(`--signals: unknown signal "${n}"`);
  if (!names.includes("dns")) throw new UsageError('--signals: dns is the essential signal; use "none" to turn all signals off');
  if (opts.rebaseline && !opts.state) throw new UsageError("--rebaseline needs --state");
  let dnsServers: string[] | undefined;
  if (opts.dnsServers !== undefined) {
    dnsServers = opts.dnsServers
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (!dnsServers.length || !dnsServers.every((x) => isIP(x))) throw new UsageError("--dns-servers must be a comma-separated list of IP addresses");
  }
  return {
    cert: names.includes("cert"),
    scan: names.includes("scan"),
    ct: names.includes("ct"),
    ...(process.env.CERTSPOTTER_API_KEY?.trim() ? { ctApiKey: process.env.CERTSPOTTER_API_KEY.trim() } : {}),
    registry: names.includes("registry"),
    rebaseline: opts.rebaseline,
    ...(opts.state ? { statePath: opts.state } : {}),
    ...(dnsServers ? { dnsServers } : {}),
  };
}

function signalsJson(s: SignalsReport) {
  const obs = s.dns?.observation;
  const dns = !s.dns
    ? undefined
    : obs?.ok
      ? {
          level: s.dns.level,
          observed: obs.observed,
          zone: obs.records.zone,
          ns: obs.records.ns,
          cname: obs.records.cname,
          a: obs.records.a,
          aaaa: obs.records.aaaa,
          ...(s.dns.changes.length ? { changes: s.dns.changes } : {}),
          ...(obs.disagreements.length ? { disagreements: obs.disagreements } : {}),
          ...(obs.failed.length ? { failed: obs.failed } : {}),
        }
      : { level: s.dns.level, failed: obs?.failed ?? [] };
  const cert = !s.cert
    ? undefined
    : s.cert.info
      ? {
          level: s.cert.level,
          issuer: s.cert.info.issuer,
          subject: s.cert.info.subject,
          validTo: s.cert.info.validTo,
          authorized: s.cert.info.authorized,
          fingerprint256: s.cert.info.fingerprint256,
          ...(s.cert.findings.length ? { findings: s.cert.findings.map((f) => `${f.severity}: ${f.message}`) } : {}),
        }
      : { level: s.cert.level, error: s.cert.error };
  return {
    level: s.level,
    baseline: s.baseline,
    ...(s.baselineNote ? { baselineNote: s.baselineNote } : {}),
    ...(s.skipped ? { skipped: s.skipped } : {}),
    ...(dns ? { dns } : {}),
    ...(cert ? { cert } : {}),
    ...(s.ct
      ? {
          ct: {
            level: s.ct.level,
            ...(s.ct.source ? { source: s.ct.source, seen: s.ct.seen } : {}),
            ...(s.ct.error ? { error: s.ct.error } : {}),
            ...(s.ct.findings.length ? { findings: s.ct.findings.map((f) => `${f.severity}: ${f.message} [${f.hosts.join(", ")}]`) } : {}),
          },
        }
      : {}),
    ...(s.registry
      ? {
          registry: {
            level: s.registry.level,
            ...(s.registry.dnssec ? { dnssec: s.registry.dnssec } : {}),
            ...(s.registry.errors.length ? { errors: s.registry.errors } : {}),
            ...(s.registry.findings.length ? { findings: s.registry.findings.map((f) => `${f.severity}: ${f.message}`) } : {}),
          },
        }
      : {}),
    ...(s.scan ? { scan: { level: s.scan.level, ...s.scan.result, via: scanVia(), at: s.scan.cachedAt } } : {}),
  };
}

/**
 * Timings of one check, for `scripts/metrics-report.ts`: the whole check, the chain reads, and every OKX call made
 * since the previous line (the slowest per endpoint, retries included).
 */
function perfOf(r: CheckResult) {
  const okxMs: Record<string, number> = {};
  for (const c of drainOkxMetrics()) okxMs[c.path] = Math.max(okxMs[c.path] ?? 0, c.ms);
  return { checkMs: r.durationMs, rpcMs: r.rpcMs, okxMs };
}

/** One JSON line per check, for logs and for the alert layer (step 9). */
function report(r: CheckResult, alerts: Delivery[] | { error: string } = [], gas?: GasStatus): string {
  const v = r.verdict;
  return JSON.stringify({
    at: r.checkedAt.toISOString(),
    status: v.status,
    live: `v${v.liveRelease}`,
    ...(v.matchedRelease !== undefined ? { matched: `v${v.matchedRelease}` } : {}),
    observed: v.observed,
    diffs: v.diffs.map((d) => `${d.path}: ${d.kind}${d.detail ? ` (${d.detail})` : ""}`),
    ...(v.allowed.length ? { allowed: v.allowed } : {}),
    ...(v.stripped.length ? { stripped: v.stripped.map((s) => s.tag) } : {}),
    ...(v.hints.length ? { hints: v.hints } : {}),
    ...(r.missingManifests.length ? { missingManifests: r.missingManifests.map((id) => `v${id}`) } : {}),
    ...(r.rejectedManifests.length ? { rejectedManifests: r.rejectedManifests } : {}),
    ...(r.signals ? { signals: signalsJson(r.signals) } : {}),
    ...(r.suspects ? { suspects: r.suspects } : {}),
    ...(r.suspectsError ? { suspectsError: r.suspectsError } : {}),
    ...(Array.isArray(alerts) ? (alerts.length ? { alerts } : {}) : { alertError: alerts.error }),
    ...(gas ? { reporterGas: { okb: formatEther(gas.balanceWei), low: gas.low, via: gas.via } } : {}),
    ms: r.durationMs,
    perf: perfOf(r),
  });
}

function positiveInt(v: string, flag: string): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 100) throw new UsageError(`${flag} must be an integer from 1 to 100`);
  return n;
}

function telegramConfig(chat: string | undefined, teamChat: string | undefined, api: string | undefined): TelegramConfig | undefined {
  if (!chat) {
    if (teamChat) throw new UsageError("--telegram-team-chat needs --telegram-chat");
    return undefined;
  }
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new UsageError("TELEGRAM_BOT_TOKEN is not set (the bot token is read from the environment only)");
  if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(token)) throw new UsageError("TELEGRAM_BOT_TOKEN does not look like a bot token (<digits>:<secret>)");
  const chatId = /^(-?\d+|@[A-Za-z0-9_]{5,})$/;
  for (const [flag, v] of [["--telegram-chat", chat], ["--telegram-team-chat", teamChat]] as const) {
    if (v !== undefined && !chatId.test(v)) throw new UsageError(`${flag} must be a numeric chat id or @channelname`);
  }
  if (api !== undefined && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(api)) throw new UsageError("--telegram-api is for local test servers only");
  return { token, chat, ...(teamChat ? { teamChat } : {}), ...(api ? { api } : {}) };
}

async function main(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      site: { type: "string" },
      gate: { type: "string" },
      manifests: { type: "string" },
      allow: { type: "string" },
      network: { type: "string", default: "xlayer" },
      rpc: { type: "string" },
      interval: { type: "string", default: "30" },
      once: { type: "boolean", default: false },
      signals: { type: "string", default: "dns,cert,scan,ct,registry" },
      state: { type: "string" },
      rebaseline: { type: "boolean", default: false },
      "dns-servers": { type: "string" },
      "signals-only": { type: "boolean", default: false },
      name: { type: "string" },
      "alert-state": { type: "string" },
      "guardian-call": { type: "string" },
      "guardian-account": { type: "string" },
      "telegram-chat": { type: "string" },
      "telegram-team-chat": { type: "string" },
      "telegram-api": { type: "string" },
      "telegram-test": { type: "boolean", default: false },
      "tapesend-to": { type: "string" },
      account: { type: "string" },
      "alerts-mainnet": { type: "boolean", default: false },
      confirm: { type: "string", default: "2" },
      clear: { type: "string", default: "3" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(USAGE);
    return 0;
  }
  const telegram = telegramConfig(values["telegram-chat"], values["telegram-team-chat"], values["telegram-api"]);
  if (values["telegram-test"]) {
    if (!telegram) throw new UsageError("--telegram-test needs --telegram-chat");
    await sendTelegram(telegram, telegram.chat, "Hashfront test message: alerts for this chat are set up. No action needed.");
    console.log(JSON.stringify({ telegramTest: "sent", chat: telegram.chat }));
    return 0;
  }
  if (!values.site) throw new UsageError("missing --site");
  let site: URL;
  try {
    site = new URL(values.site);
  } catch {
    throw new UsageError(`--site is not a URL: ${values.site}`);
  }
  if (site.protocol !== "https:" && site.protocol !== "http:") throw new UsageError("--site must be http(s)");
  const interval = Number(values.interval);
  if (!Number.isFinite(interval) || interval < 5) throw new UsageError("--interval must be at least 5 seconds");
  const signals = parseSignals(values.signals, { state: values.state, rebaseline: values.rebaseline, dnsServers: values["dns-servers"] });
  // In the loop the same config runs every tick, so --rebaseline would re-record (and accept) any change on the next
  // MATCH tick, including a cloaked NS hijack. It is a one-shot team action.
  if (values.rebaseline && !values.once && !values["signals-only"]) throw new UsageError("--rebaseline only works with --once or --signals-only");

  if (values["signals-only"]) {
    if (!signals) throw new UsageError("--signals-only needs signals (not --signals none)");
    const started = Date.now();
    // run by the team on purpose (setup), so a missing baseline may be recorded without a content check
    const s = await checkSignals(site, true, signals);
    console.log(JSON.stringify({ at: new Date(started).toISOString(), site: site.href, signals: signalsJson(s), ms: Date.now() - started }));
    return exitCode(undefined, s.level);
  }

  if (!values.manifests) throw new UsageError("missing --manifests");
  const ctx = createContext({
    network: values.network,
    gate: values.gate ?? process.env.HASHFRONT_GATE,
    rpcUrl: values.rpc ?? process.env.HASHFRONT_RPC_URL,
    needsSigner: false,
  });
  const cfg: WatchConfig = {
    site,
    manifestsDir: values.manifests,
    ...(values.allow ? { allow: await loadAllow(values.allow) } : {}),
    ...(signals ? { signals } : {}),
  };

  // OKX Onchain OS API (security scan, balance, gas price, gateway): on when OKX_API_KEY / OKX_SECRET_KEY /
  // OKX_API_PASSPHRASE are set; every use falls back to the RPC or the onchainos CLI.
  const okxCreds = credentialsFromEnv();
  const okxClient = okxCreds ? new OkxClient(okxCreds) : undefined;
  let dispatcher: Dispatcher | undefined;
  if (telegram || values["tapesend-to"]) {
    if (!values.name) throw new UsageError("alerts need --name (the protocol name shown in messages)");
    if (!values["alert-state"]) throw new UsageError("alerts need --alert-state <file>");
    let guardian: { ctx: typeof ctx; target: `0x${string}` } | undefined;
    if (values["guardian-call"] || values["guardian-account"]) {
      if (!values["guardian-call"] || !isAddress(values["guardian-call"], { strict: false })) throw new UsageError("--guardian-call must be the protocol contract address that has pause()");
      const envKey = process.env.HASHFRONT_GUARDIAN_PRIVATE_KEY?.trim();
      if (envKey && !/^0x[0-9a-fA-F]{64}$/.test(envKey)) throw new UsageError("HASHFRONT_GUARDIAN_PRIVATE_KEY must be a 0x-prefixed 32-byte hex key");
      const key = (envKey as `0x${string}` | undefined) ?? (values["guardian-account"] ? await keyFromAccount(values["guardian-account"]) : undefined);
      if (!key) throw new UsageError("the guardian needs its own key: --guardian-account <keystore> or HASHFRONT_GUARDIAN_PRIVATE_KEY (never the reporter's key)");
      const gctx = createContext({ network: values.network, gate: ctx.gate, rpcUrl: values.rpc ?? process.env.HASHFRONT_RPC_URL, needsSigner: true, privateKey: key });
      try {
        assertGuardianAllowed(gctx.chain.id);
      } catch (err) {
        throw new UsageError(err instanceof Error ? err.message : String(err));
      }
      guardian = { ctx: gctx, target: values["guardian-call"] as `0x${string}` };
    }
    let tapesend: { ctx: typeof ctx; to: `0x${string}`[] } | undefined;
    if (values["tapesend-to"]) {
      const signer = createContext({
        network: values.network,
        gate: ctx.gate,
        rpcUrl: values.rpc ?? process.env.HASHFRONT_RPC_URL,
        needsSigner: true,
        privateKey: values.account ? await keyFromAccount(values.account) : undefined,
      });
      if (signer.chain.id === 196 && !values["alerts-mainnet"]) {
        throw new UsageError("TapeSend alerts on X Layer mainnet are real transactions: add --alerts-mainnet to allow them");
      }
      tapesend = { ctx: signer, to: await resolveRecipients(ctx, values["tapesend-to"]) };
    }
    dispatcher = createDispatcher({
      statePath: values["alert-state"],
      name: validateName(values.name),
      confirm: positiveInt(values.confirm, "--confirm"),
      clear: positiveInt(values.clear, "--clear"),
      readCtx: ctx,
      ...(telegram ? { telegram } : {}),
      ...(tapesend ? { tapesend } : {}),
      ...(guardian ? { guardian } : {}),
      ...(okxClient ? { okx: okxClient } : {}),
    });
  }
  // An alert-layer failure (an unreadable state file, say) is reported next to the verdict, never instead of it.
  const alertsFor = async (r: CheckResult): Promise<Delivery[] | { error: string }> => {
    if (!dispatcher) return [];
    try {
      return await dispatcher.handle(r);
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  };

  if (values.once) {
    const r = await checkOnce(ctx, cfg);
    console.log(report(r, await alertsFor(r), dispatcher?.lastGas));
    return exitCode(r.verdict.status, r.signals?.level ?? "ok");
  }

  const stop = new AbortController();
  process.once("SIGINT", () => stop.abort());
  process.once("SIGTERM", () => stop.abort());
  await watchLoop(ctx, cfg, {
    intervalMs: interval * 1000,
    signal: stop.signal,
    onResult: async (r) => console.log(report(r, await alertsFor(r), dispatcher?.lastGas)),
    onError: (err) => console.error(JSON.stringify({ at: new Date().toISOString(), error: err instanceof Error ? err.message : String(err) })),
  });
  return 0;
}

// Set exitCode and let the process end on its own. On Windows, process.exit() while fetch keep-alive sockets are
// still closing trips a libuv assertion (UV_HANDLE_CLOSING, exit code 0xC0000409); reproduced in 3 of 12 runs.
main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (err: unknown) => {
    if (err instanceof UsageError) {
      console.error(`error: ${err.message}\n\n${USAGE}`);
      process.exitCode = 64;
      return;
    }
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 3;
  },
);
