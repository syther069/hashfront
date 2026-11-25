// Server-side view of the protected website: what the live release lists, what the host serves right now, and, when
// they differ, the addresses only the served files contain. Used by /api/suspects and /api/approvals (and by the
// status endpoint later). The site and gate come from env, never from the request, so none of this is an open proxy.
import { createPublicClient, http, type Address, type PublicClient } from "viem";
import { releaseGateAbi } from "@hashfront/cli/abi";
import { NETWORKS } from "@hashfront/cli/chains";
import type { Context } from "@hashfront/cli/context";
import { readGateInfo, readRelease, type GateInfo } from "@hashfront/cli/gate";
import { parseManifest, recomputeRoot } from "@hashfront/cli/release";
import { compare, type ReleaseView, type Served, type Verdict } from "@hashfront/watcher/compare";
import { fetchServed } from "@hashfront/watcher/fetchSite";
import { findSuspects } from "@hashfront/watcher/triage";

export interface SiteDeps {
  site: URL;
  gate: Address;
  rpcUrl?: string;
  /** raw manifest.json texts; one of them must reproduce the live release's onchain root */
  manifests: readonly string[];
  fetchImpl?: typeof fetch;
  client?: PublicClient;
}

export interface SiteRead {
  ctx: Context;
  info: GateInfo;
  live: ReleaseView;
  served: Served;
  verdict: Verdict;
}

export async function readSite(d: SiteDeps): Promise<SiteRead> {
  const chain = NETWORKS.xlayer;
  const publicClient = d.client ?? (createPublicClient({ chain, transport: http(d.rpcUrl) }) as PublicClient);
  const ctx: Context = { chain, publicClient, walletClient: undefined, account: undefined, gate: d.gate, log: () => {} };
  const info = await readGateInfo(ctx);
  if (info.liveRelease === 0n) throw new Error("the gate has no live release yet");
  const rel = await readRelease(ctx, info.liveRelease);

  let files: ReleaseView["files"] | undefined;
  for (const text of d.manifests) {
    try {
      const m = parseManifest(text);
      const r = recomputeRoot(m);
      if (r.root.toLowerCase() === rel.root.toLowerCase() && r.totalChunks === rel.totalChunks && m.root.toLowerCase() === r.root.toLowerCase()) {
        files = m.files.map((f) => ({ path: f.path, size: f.size, sha256: f.sha256.toLowerCase() as `0x${string}` }));
        break;
      }
    } catch {
      // a manifest that does not parse or reproduce a root is simply not this release's
    }
  }
  if (!files) throw new Error(`no bundled manifest reproduces the root of live release v${info.liveRelease}`);

  const live: ReleaseView = { id: info.liveRelease, state: "live", files };
  const served = await fetchServed(d.site, files.map((f) => f.path), d.fetchImpl ? { fetchImpl: d.fetchImpl } : {});
  const verdict = compare({ siteOrigin: d.site.origin, live, others: [], served });
  return { ctx, info, live, served, verdict };
}

export interface SuspectsReport {
  status: "match" | "mismatch" | "other";
  liveRelease: number;
  suspects: string[];
  checkedAt: string;
}

/** Suspects only while the content is a MISMATCH: a host that is merely behind or unreachable names no one. */
export async function loadSuspects(d: SiteDeps, now: () => Date = () => new Date()): Promise<SuspectsReport> {
  const r = await readSite(d);
  const status = r.verdict.status === "MATCH" ? "match" : r.verdict.status === "MISMATCH" ? "mismatch" : "other";
  const suspects =
    status === "mismatch"
      ? await findSuspects({ ctx: r.ctx, info: r.info, live: r.live, served: r.served, diffs: r.verdict.diffs, site: d.site, ...(d.fetchImpl ? { fetch: { fetchImpl: d.fetchImpl } } : {}) })
      : [];
  return { status, liveRelease: Number(r.live.id), suspects, checkedAt: now().toISOString() };
}

export interface StatusReport {
  site: string;
  /** alert: an onchain alert is open or the host serves a mismatch; unknown: nothing safe can be said (host behind, CDN) */
  status: "ok" | "alert" | "unknown";
  liveRelease: number;
  /** approved sha256 of index.html, so a client can check the page it received on its own */
  rootHash: string;
  assets: Record<string, string>;
  suspects: string[];
  checkedAt: string;
}

/** The feed the Guard extension (and any wallet that wants it) reads. */
export async function loadStatus(d: SiteDeps, now: () => Date = () => new Date()): Promise<StatusReport> {
  const r = await readSite(d);
  const [kind] = await r.ctx.publicClient.readContract({ address: d.gate, abi: releaseGateAbi, functionName: "lastAlert" });
  const alertOpen = kind === 1 || kind === 2;
  const v = r.verdict.status;
  const status = alertOpen || v === "MISMATCH" ? "alert" : v === "MATCH" ? "ok" : "unknown";
  const suspects =
    v === "MISMATCH"
      ? await findSuspects({ ctx: r.ctx, info: r.info, live: r.live, served: r.served, diffs: r.verdict.diffs, site: d.site, ...(d.fetchImpl ? { fetch: { fetchImpl: d.fetchImpl } } : {}) }).catch(() => [])
      : [];
  const assets = Object.fromEntries(r.live.files.map((f) => [f.path, f.sha256]));
  return { site: d.site.origin, status, liveRelease: Number(r.live.id), rootHash: assets["index.html"] ?? "", assets, suspects, checkedAt: now().toISOString() };
}

/** Builds a cached loader from env, or undefined when the site is not configured. */
export function siteLoaderFromEnv<T>(
  env: Record<string, string | undefined>,
  manifests: readonly string[],
  load: (d: SiteDeps) => Promise<T>,
  ttlMs = 20_000,
  now: () => number = Date.now,
): (() => Promise<T>) | undefined {
  const { HASHFRONT_SITE: site, HASHFRONT_GATE: gate, HASHFRONT_RPC: rpc } = env;
  if (!site || !gate || !/^0x[0-9a-fA-F]{40}$/.test(gate)) return undefined;
  let url: URL;
  try {
    url = new URL(site);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:") return undefined;
  const deps: SiteDeps = { site: url, gate: gate as Address, manifests, ...(rpc ? { rpcUrl: rpc } : {}) };
  let hit: { at: number; value: Promise<T> } | undefined;
  return () => {
    if (hit && now() - hit.at < ttlMs) return hit.value;
    const value = load(deps);
    hit = { at: now(), value };
    value.catch(() => {
      if (hit?.value === value) hit = undefined; // a failure is not cached
    });
    return value;
  };
}

export function suspectsLoaderFromEnv(env: Record<string, string | undefined>, manifests: readonly string[], ttlMs = 30_000, now: () => number = Date.now): (() => Promise<SuspectsReport>) | undefined {
  return siteLoaderFromEnv(env, manifests, (d) => loadSuspects(d), ttlMs, now);
}

export function statusLoaderFromEnv(env: Record<string, string | undefined>, manifests: readonly string[], ttlMs = 20_000, now: () => number = Date.now): (() => Promise<StatusReport>) | undefined {
  return siteLoaderFromEnv(env, manifests, (d) => loadStatus(d), ttlMs, now);
}
