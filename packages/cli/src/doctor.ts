// `hashfront doctor`: checks that a Hashfront setup on X Layer is healthy, including the OKX Onchain OS API keys.
// Read-only: nothing is signed or sent on chain.
import { createPublicClient, formatEther, http, isAddress, type Address } from "viem";
import { credentialsFromEnv, OKX_BASE_URL, OkxClient } from "@hashfront/okx/client";
import { approvals, dappScan, gasPrice, NATIVE_PRICE_ADDRESS, prices, tokenBalances } from "@hashfront/okx/endpoints";
import { releaseGateAbi } from "./abi.ts";
import { xlayer } from "./chains.ts";

export interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

/** OKX rejects a request whose timestamp is more than 30 s off its own clock. */
export const MAX_SKEW_MS = 30_000;

async function check(name: string, fn: () => Promise<string>): Promise<Check> {
  try {
    return { name, ok: true, detail: await fn() };
  } catch (err) {
    return { name, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function doctor(opts: { rpc?: string | undefined; gate?: string | undefined; site?: string | undefined; reporter?: string | undefined }): Promise<Check[]> {
  const client = createPublicClient({ chain: xlayer, transport: http(opts.rpc ?? xlayer.rpcUrls.default.http[0], { timeout: 15_000 }) });
  const checks: Check[] = [];
  checks.push(
    await check("X Layer RPC", async () => {
      const id = await client.getChainId();
      if (id !== 196) throw new Error(`chain ${id}, expected 196`);
      return `chain 196, block ${await client.getBlockNumber()}`;
    }),
  );
  if (opts.gate && isAddress(opts.gate, { strict: false })) {
    const gate = opts.gate as Address;
    checks.push(
      await check("ReleaseGate", async () => {
        const [live, frozen] = await Promise.all([
          client.readContract({ address: gate, abi: releaseGateAbi, functionName: "liveRelease" }),
          client.readContract({ address: gate, abi: releaseGateAbi, functionName: "frozen" }),
        ]);
        return `live v${live}${frozen ? ", FROZEN" : ""}`;
      }),
    );
  }

  const creds = credentialsFromEnv();
  if (!creds) {
    checks.push({ name: "OKX API keys", ok: false, detail: "set OKX_API_KEY, OKX_SECRET_KEY and OKX_API_PASSPHRASE (from the OKX developer portal)" });
    return checks;
  }
  checks.push(
    await check("clock vs OKX", async () => {
      const res = await fetch(OKX_BASE_URL, { method: "HEAD", signal: AbortSignal.timeout(10_000) });
      const server = Date.parse(res.headers.get("date") ?? "");
      if (Number.isNaN(server)) return "no Date header to compare (skipped)";
      const skew = Date.now() - server;
      if (Math.abs(skew) > MAX_SKEW_MS - 5_000) throw new Error(`local clock is ${Math.round(skew / 1000)} s off; OKX allows 30 s. Sync the system clock.`);
      return `${Math.round(skew / 1000)} s skew (OKX allows 30 s)`;
    }),
  );
  const okx = new OkxClient(creds);
  checks.push(await check("OKX Gateway: gas price", async () => `${(await gasPrice(okx))[0]?.normal ?? "?"} wei on X Layer`));
  checks.push(await check("OKX Market: OKB price", async () => `$${Number((await prices(okx, [NATIVE_PRICE_ADDRESS]))[0]?.price).toFixed(2)}`));
  if (opts.site) checks.push(await check("OKX Security: dapp-scan", async () => ((await dappScan(okx, new URL(opts.site!).host)).isMalicious ? "FLAGGED AS MALICIOUS" : "not flagged")));
  if (opts.reporter && isAddress(opts.reporter, { strict: false })) {
    const r = opts.reporter;
    checks.push(
      await check("OKX Balance: reporter OKB", async () => {
        const raw = (await tokenBalances(okx, r))[0]?.tokenAssets?.[0]?.rawBalance ?? "0";
        return `${formatEther(BigInt(raw))} OKB`;
      }),
    );
    checks.push(await check("OKX Security: approvals", async () => `${(await approvals(okx, r))[0]?.total ?? 0} approvals for the reporter`));
  }
  return checks;
}

/** OKB/USD for cost lines, when OKX keys are set; undefined otherwise or on any error. */
export async function okbUsd(): Promise<number | undefined> {
  const creds = credentialsFromEnv();
  if (!creds) return undefined;
  try {
    const p = Number((await prices(new OkxClient(creds), [NATIVE_PRICE_ADDRESS]))[0]?.price);
    return Number.isFinite(p) && p > 0 ? p : undefined;
  } catch {
    return undefined;
  }
}
