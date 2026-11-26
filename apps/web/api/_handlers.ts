// Server-side handlers behind the status page (Vercel Functions). They hold the OKX Onchain OS API key, so the
// browser never sees it, and they accept only narrow, validated requests: X Layer only, our gate only.
import { getAddress, isAddress, toFunctionSelector, type Hex } from "viem";
import { credentialsFromEnv, OkxClient, OkxError } from "@hashfront/okx/client";
import { approvals, NATIVE_PRICE_ADDRESS, prices, txScanEvm } from "@hashfront/okx/endpoints";
import { classifyPages, parseAllowed } from "@hashfront/okx/risk";
import type { StatusReport, SuspectsReport } from "./_site.ts";

export interface Deps {
  okx: OkxClient | undefined;
  env: Record<string, string | undefined>;
  /** attacker addresses from the live site diff; absent when the site is not configured */
  suspects?: (() => Promise<SuspectsReport>) | undefined;
  /** how long approvals wait for the suspects lookup (default 3 s); a test knob */
  suspectsWaitMs?: number;
}

export function depsFromEnv(env: Record<string, string | undefined> = process.env): Deps {
  const creds = credentialsFromEnv(env as NodeJS.ProcessEnv);
  return { okx: creds ? new OkxClient(creds) : undefined, env };
}

const json = (status: number, body: unknown, cache?: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache ?? "no-store", "x-content-type-options": "nosniff" },
  });

const unavailable = (err?: unknown) =>
  json(503, { error: "OKX API unavailable", ...(err instanceof OkxError && err.code ? { okxCode: err.code } : {}) });

const SUSPECTS_WAIT_MS = 3_000;

/** Resolves with the promise's value, or rejects after `ms`. An undefined promise resolves to undefined. */
export function withTimeout<T>(p: Promise<T> | undefined, ms: number): Promise<T | undefined> {
  if (!p) return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), ms);
    p.then(
      (v) => (clearTimeout(timer), resolve(v)),
      (e: unknown) => (clearTimeout(timer), reject(e instanceof Error ? e : new Error(String(e)))),
    );
  });
}

/** GET /api/approvals?address=0x…: the address's token approvals on X Layer, worst first. */
export async function getApprovals(req: Request, deps: Deps): Promise<Response> {
  const address = new URL(req.url).searchParams.get("address") ?? "";
  if (!isAddress(address, { strict: false })) return json(400, { error: "address must be a 0x-prefixed 20-byte address" });
  if (!deps.okx) return unavailable();
  try {
    const pages = await approvals(deps.okx, getAddress(address));
    // A failed or slow suspects lookup must never hide the user's approvals: they are ranked without it. The lookup
    // fetches the site and reads the chain, so it gets a short time limit of its own.
    const found = await withTimeout(deps.suspects?.().then((r) => r.suspects), deps.suspectsWaitMs ?? SUSPECTS_WAIT_MS).catch(() => []);
    const list = classifyPages(pages, parseAllowed(deps.env.ALLOWED_SPENDERS), new Set((found ?? []).map((a) => a.toLowerCase())));
    return json(200, { address: getAddress(address), chain: "X Layer", source: "OKX Onchain OS security API", approvals: list }, "public, s-maxage=30, stale-while-revalidate=60");
  } catch (err) {
    return unavailable(err);
  }
}

/** GET /api/suspects: addresses found only in the served site, while it differs from the live release. */
export async function getSuspects(_req: Request, load: (() => Promise<SuspectsReport>) | undefined): Promise<Response> {
  if (!load) return json(503, { error: "site monitoring is not configured on this host" });
  try {
    const r = await load();
    return json(200, { ...r, source: "approved release on X Layer vs the live site" }, "public, s-maxage=30, stale-while-revalidate=60");
  } catch {
    return json(503, { error: "could not compare the site with the live release right now" });
  }
}

/** GET /api/status: the signed-in-chain verdict on the protected site, for the Guard extension. CORS is open: it is public, read-only data. */
export async function getStatus(_req: Request, load: (() => Promise<StatusReport>) | undefined): Promise<Response> {
  const open = { "access-control-allow-origin": "*" };
  if (!load) return withHeaders(json(503, { error: "site monitoring is not configured on this host" }), open);
  try {
    return withHeaders(json(200, await load(), "public, s-maxage=20, stale-while-revalidate=40"), open);
  } catch {
    return withHeaders(json(503, { error: "could not read the live release right now" }), open);
  }
}

function withHeaders(res: Response, extra: Record<string, string>): Response {
  for (const [k, v] of Object.entries(extra)) res.headers.set(k, v);
  return res;
}

const ALLOWED_SELECTORS = new Set(["approve(uint256,bytes32,uint32)", "cancel(uint256)", "freeze()"].map((s) => toFunctionSelector(`function ${s}`)));

/** POST /api/tx-scan {from, to, data}: OKX pre-execution scan of a maintainer transaction to OUR gate only. */
export async function postTxScan(req: Request, deps: Deps): Promise<Response> {
  const gate = deps.env.HASHFRONT_GATE;
  if (!gate || !isAddress(gate, { strict: false })) return unavailable();
  let body: { from?: unknown; to?: unknown; data?: unknown };
  try {
    const text = await req.text();
    if (text.length > 4_096) return json(413, { error: "request too large" });
    body = JSON.parse(text) as typeof body;
  } catch {
    return json(400, { error: "body must be JSON" });
  }
  const { from, to, data } = body;
  if (typeof from !== "string" || !isAddress(from, { strict: false })) return json(400, { error: "from must be an address" });
  if (typeof to !== "string" || to.toLowerCase() !== gate.toLowerCase()) return json(400, { error: "only transactions to this protocol's ReleaseGate are scanned" });
  if (typeof data !== "string" || !/^0x[0-9a-fA-F]{8,}$/.test(data) || !ALLOWED_SELECTORS.has(data.slice(0, 10).toLowerCase() as Hex)) {
    return json(400, { error: "only approve, cancel and freeze calls are scanned" });
  }
  if (!deps.okx) return unavailable();
  try {
    const r = await txScanEvm(deps.okx, { from: getAddress(from), to: getAddress(to), data });
    const risks = Array.isArray(r.riskItemDetail) ? r.riskItemDetail : [];
    const warnings = Array.isArray(r.warnings) ? r.warnings : [];
    return json(200, {
      source: "OKX Onchain OS transaction scan",
      action: r.action ?? "",
      safe: !r.action && risks.length === 0,
      risks,
      warnings,
      revertReason: r.simulator?.revertReason || undefined,
    });
  } catch (err) {
    return unavailable(err);
  }
}

/** GET /api/price: OKB in USD from the OKX Market API (cached at the edge for a minute). */
export async function getPrice(_req: Request, deps: Deps): Promise<Response> {
  if (!deps.okx) return unavailable();
  try {
    const [p] = await prices(deps.okx, [NATIVE_PRICE_ADDRESS]);
    const usd = Number(p?.price);
    if (!Number.isFinite(usd) || usd <= 0) return unavailable();
    return json(200, { okbUsd: usd, time: Number(p?.time) || Date.now(), source: "OKX Onchain OS Market API" }, "public, s-maxage=60, stale-while-revalidate=300");
  } catch (err) {
    return unavailable(err);
  }
}
