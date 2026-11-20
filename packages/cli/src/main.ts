#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { UsageError } from "./chains.ts";
import {
  cmdActivate,
  cmdApprove,
  cmdCancel,
  cmdManifest,
  cmdPropose,
  cmdSeal,
  cmdStatus,
  cmdUpload,
  cmdVerify,
  cmdWaitActive,
} from "./commands.ts";
import { createContext } from "./context.ts";
import { cmdInit } from "./init.ts";
import { keyFromAccount } from "./keystore.ts";
import { preflight } from "./preflight.ts";
import { describeError } from "./errors.ts";

const USAGE = `hashfront <command> [options]

Setup:
  init       --site <url> --maintainers <a,b,c> --uploader <addr> --reporter <addr> (--account <keystore> | --unlocked --sender <addr>)
             [--name <protocol>] [--timelock 24h] [--telegram-chat <id>] [--policy-id <n>] [--build <dir>] [--broadcast]
             deploy the gate on X Layer (simulates unless --broadcast; mainnet asks you to type DEPLOY) and print the
             verified link, badge snippet, watcher command and CI settings. Missing values are asked for in a terminal.
  preflight  <dir>                                  check a static build works on DeWEB (exit 2 on errors)

Release flow (approve first, upload second):
  manifest   <dir> [--out manifest.json]           hash a build directory, write the Merkle manifest
  propose    --manifest <file> [--id-file <path>]  uploader: register the manifest root, prints the release id
  approve    --id <n> --manifest <file>            maintainer: approve the exact build you reviewed
  cancel     --id <n>                              maintainer: permanently kill a release that is not live
  upload     --id <n> --manifest <file> <dir>      uploader: stage files under releases/v<n>/ (resumable)
  verify     --id <n> --manifest <file>            compare on-chain files with the manifest
  seal       --id <n> --manifest <file>            uploader: verify, then freeze the release (starts the timelock)
  activate   --id <n>                              anyone: go live if the policy circuit allows it
  status     [--id <n>]                            show gate, release and policy state
  wait-active --id <n> [--timeout 3600] [--exact]  block until the release is live (use before deploying to your host);
                                                   --exact fails if a newer release is already live

Options:
  --gate <address>      ReleaseGate address (or HASHFRONT_GATE)
  --network <name>      xlayer (default) | xlayer-testnet | local
  --rpc <url>           override RPC (or HASHFRONT_RPC_URL)
  --account <name>      sign with the Foundry keystore ~/.foundry/keystores/<name> (hidden password prompt)

Environment:
  HASHFRONT_PRIVATE_KEY   signer for write commands in CI; people pass --account <foundry keystore name> instead,
                          which asks for its password at a hidden prompt and never exposes the key
  HASHFRONT_BUILDER_CODE  X Layer Builder Code for ERC-8021 attribution (optional)
`;

function requireId(value: string | undefined): bigint {
  if (value === undefined) throw new UsageError("missing --id");
  if (!/^\d+$/.test(value) || value === "0") throw new UsageError(`--id must be a positive integer, got "${value}"`);
  return BigInt(value);
}

function requireValue(value: string | undefined, flag: string): string {
  if (!value) throw new UsageError(`missing ${flag}`);
  return value;
}

function positiveNumber(value: string, flag: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new UsageError(`${flag} must be a positive number`);
  return n;
}

async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      gate: { type: "string" },
      network: { type: "string", default: "xlayer" },
      rpc: { type: "string" },
      id: { type: "string" },
      manifest: { type: "string" },
      out: { type: "string", default: "manifest.json" },
      timeout: { type: "string", default: "3600" },
      interval: { type: "string", default: "5" },
      "id-file": { type: "string" },
      exact: { type: "boolean", default: false },
      site: { type: "string" },
      name: { type: "string" },
      maintainers: { type: "string" },
      uploader: { type: "string" },
      reporter: { type: "string" },
      timelock: { type: "string" },
      "telegram-chat": { type: "string" },
      policy: { type: "string" },
      "policy-id": { type: "string" },
      build: { type: "string" },
      account: { type: "string" },
      unlocked: { type: "boolean", default: false },
      sender: { type: "string" },
      broadcast: { type: "boolean", default: false },
      config: { type: "string" },
      contracts: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });

  const [command, ...rest] = positionals;
  if (values.help || command === "help") {
    console.log(USAGE);
    return 0;
  }
  if (!command) {
    console.error(USAGE);
    return 1;
  }

  if (command === "preflight") {
    const dir = requireValue(rest[0], "<dir>");
    const r = await preflight(dir);
    for (const w of r.warnings) console.log(`warning: ${w}`);
    for (const e of r.errors) console.error(`error: ${e}`);
    if (r.errors.length) return 2;
    console.log(`ok: ${dir} is a static build that works on DeWEB (${r.files} files, ${r.bytes.toLocaleString("en-US")} bytes)`);
    return 0;
  }

  if (command === "init") {
    if (values.network !== "xlayer") throw new UsageError("init deploys on X Layer; for a rehearsal point --rpc at a local anvil fork of it");
    await cmdInit({
      site: values.site,
      name: values.name,
      maintainers: values.maintainers,
      uploader: values.uploader,
      reporter: values.reporter,
      timelock: values.timelock,
      telegramChat: values["telegram-chat"],
      policy: values.policy,
      policyId: values["policy-id"],
      build: values.build,
      rpc: values.rpc ?? process.env.HASHFRONT_RPC_URL,
      account: values.account,
      unlocked: values.unlocked,
      sender: values.sender,
      broadcast: values.broadcast,
      out: values.config,
      contracts: values.contracts,
    });
    return 0;
  }

  if (command === "manifest") {
    await cmdManifest(requireValue(rest[0], "<dir>"), values.out);
    return 0;
  }

  const writes = new Set(["propose", "approve", "cancel", "upload", "seal", "activate"]);
  const ctx = createContext({
    network: values.network,
    gate: values.gate ?? process.env.HASHFRONT_GATE,
    rpcUrl: values.rpc ?? process.env.HASHFRONT_RPC_URL,
    needsSigner: writes.has(command),
    privateKey: writes.has(command) && values.account ? await keyFromAccount(values.account) : undefined,
  });
  const manifest = () => requireValue(values.manifest, "--manifest");

  switch (command) {
    case "propose": {
      const id = await cmdPropose(ctx, manifest());
      // machine-readable for CI: the id alone, so nothing has to scrape the log line
      if (values["id-file"]) await writeFile(values["id-file"], `${id}\n`);
      return 0;
    }
    case "approve":
      await cmdApprove(ctx, requireId(values.id), manifest());
      return 0;
    case "cancel":
      await cmdCancel(ctx, requireId(values.id));
      return 0;
    case "upload":
      await cmdUpload(ctx, requireId(values.id), manifest(), requireValue(rest[0], "<dir>"));
      return 0;
    case "verify":
      return (await cmdVerify(ctx, requireId(values.id), manifest())) ? 0 : 2;
    case "seal":
      await cmdSeal(ctx, requireId(values.id), manifest());
      return 0;
    case "activate":
      await cmdActivate(ctx, requireId(values.id));
      return 0;
    case "status":
      await cmdStatus(ctx, values.id === undefined ? undefined : requireId(values.id));
      return 0;
    case "wait-active":
      await cmdWaitActive(
        ctx,
        requireId(values.id),
        positiveNumber(values.timeout, "--timeout"),
        positiveNumber(values.interval, "--interval"),
        values.exact,
      );
      return 0;
    default:
      throw new UsageError(`unknown command "${command}"\n\n${USAGE}`);
  }
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (err: unknown) => {
    console.error(`error: ${describeError(err)}`);
    if (process.env.HASHFRONT_DEBUG && err instanceof Error) console.error(err.stack);
    process.exitCode = 1;
  },
);
