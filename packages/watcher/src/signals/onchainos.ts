// OnchainOS phishing scan (optional): `onchainos security dapp-scan --domain <host>`.
// Blacklists lag a fresh hijack, so "clean" never softens another signal; it can only add an alert.
import { execFile } from "node:child_process";
import { credentialsFromEnv, OkxClient } from "@hashfront/okx/client";
import { dappScan as okxDappScan } from "@hashfront/okx/endpoints";
import { errorText } from "./util.ts";

export type ScanResult = { status: "clean" } | { status: "malicious" } | { status: "unavailable"; reason: string };

/** Runs the scan and returns its stdout. Rejections may carry `stdout` (the CLI exits 1 with a JSON error). */
export type RunScan = (host: string) => Promise<string>;

export const runOnchainos: RunScan = (host) =>
  new Promise((resolve, reject) => {
    // no shell, argument array, hostname only
    execFile("onchainos", ["security", "dapp-scan", "--domain", host], { timeout: 10_000, windowsHide: true, encoding: "utf8" }, (err, stdout) => {
      if (err) reject(Object.assign(err, { stdout }));
      else resolve(stdout);
    });
  });

/**
 * The same scan over the OKX Onchain OS REST API (POST /api/v6/security/dapp-scan), signed with the team's API key.
 * Works anywhere Node runs (GitHub Actions included) without installing or logging in to the onchainos CLI.
 * Answers in the CLI's envelope so one parser handles both.
 */
export function okxRestScan(client: OkxClient): RunScan {
  return async (host) => {
    try {
      return JSON.stringify({ ok: true, data: await okxDappScan(client, host) });
    } catch (err) {
      return JSON.stringify({ ok: false, error: `OKX API: ${errorText(err)}` });
    }
  };
}

/** REST when OKX keys are configured, otherwise the onchainos CLI. */
export function defaultScanner(): { run: RunScan; via: "okx-api" | "onchainos-cli" } {
  const creds = credentialsFromEnv();
  return creds ? { run: okxRestScan(new OkxClient(creds)), via: "okx-api" } : { run: runOnchainos, via: "onchainos-cli" };
}

export function parseScan(stdout: string): ScanResult {
  let out: unknown;
  try {
    out = JSON.parse(stdout.trim());
  } catch {
    return { status: "unavailable", reason: "onchainos printed something other than JSON" };
  }
  const o = out as { ok?: unknown; error?: unknown; data?: { isMalicious?: unknown } };
  if (o.ok !== true) return { status: "unavailable", reason: typeof o.error === "string" ? o.error : "onchainos returned ok:false" };
  if (o.data?.isMalicious === true) return { status: "malicious" };
  if (o.data?.isMalicious === false) return { status: "clean" };
  return { status: "unavailable", reason: "onchainos answer has no isMalicious field" };
}

export async function dappScan(host: string, run: RunScan = runOnchainos): Promise<ScanResult> {
  try {
    return parseScan(await run(host));
  } catch (err) {
    const stdout = (err as { stdout?: unknown }).stdout;
    if (typeof stdout === "string" && stdout.trim()) {
      const parsed = parseScan(stdout);
      if (parsed.status === "unavailable") return parsed;
    }
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { status: "unavailable", reason: "onchainos CLI not installed" };
    return { status: "unavailable", reason: errorText(err) };
  }
}
