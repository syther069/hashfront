// One check, and the polling loop around it.
import type { Context } from "@hashfront/cli/context";
import { readReleaseFile, readSnapshot } from "./chain.ts";
import { compare, sha256, type AllowList, type Verdict } from "./compare.ts";
import { fetchServed, type FetchOptions } from "./fetchSite.ts";
import { isTextPath, referencedAssets, suspects as findAddresses } from "./suspects.ts";
import { loadManifests } from "./manifests.ts";
import { checkSignals, type SignalConfig, type SignalsReport } from "./signals/index.ts";
import { errorText } from "./signals/util.ts";

export interface WatchConfig {
  site: URL;
  manifestsDir: string;
  allow?: AllowList;
  fetch?: FetchOptions;
  /** DNS, certificate and OnchainOS signals (step 8); omitted means off */
  signals?: SignalConfig;
}

export interface CheckResult {
  verdict: Verdict;
  checkedAt: Date;
  durationMs: number;
  /** releases near the live one that have no manifest, so "host behind" and similar can't be recognised */
  missingManifests: bigint[];
  rejectedManifests: { file: string; reason: string }[];
  signals?: SignalsReport;
  /** addresses in the served files that no approved file contains (only on MISMATCH; best-effort triage) */
  suspects?: string[];
  suspectsError?: string;
}

/** Approved index.html bytes per live release id; releases never change once live. */
const indexCache = new Map<string, Uint8Array>();
/** Verified approved bytes per release id and path, for the suspects diff. */
const approvedCache = new Map<string, Uint8Array>();

export async function checkOnce(ctx: Context, cfg: WatchConfig): Promise<CheckResult> {
  const started = Date.now();
  const store = await loadManifests(cfg.manifestsDir);
  const snap = await readSnapshot(ctx, store);

  // Fetch everything any candidate lists in one pass, so one check is one consistent view of the host.
  const paths = [snap.live, ...snap.others].flatMap((r) => r.files.map((f) => f.path));
  const served = await fetchServed(cfg.site, paths, cfg.fetch);

  let liveIndex: Uint8Array | undefined;
  const indexFile = snap.live.files.find((f) => f.path === "index.html");
  const servedRoot = served.get("index.html");
  if (indexFile && servedRoot?.ok && sha256(servedRoot.bytes) !== indexFile.sha256) {
    const key = `${ctx.gate}:${snap.live.id}`;
    liveIndex = indexCache.get(key);
    if (!liveIndex) {
      const bytes = await readReleaseFile(ctx, snap.info, snap.live.id, "index.html");
      // the registry does not check declared hashes, so only use bytes that hash to the approved value
      if (sha256(bytes) === indexFile.sha256) {
        liveIndex = bytes;
        indexCache.set(key, bytes);
      }
    }
  }

  const verdict = compare({
    siteOrigin: cfg.site.origin,
    live: snap.live,
    others: snap.others,
    served,
    ...(liveIndex ? { liveIndex } : {}),
    ...(cfg.allow ? { allow: cfg.allow } : {}),
  });
  // A signal failure must never discard the content verdict.
  let signals: SignalsReport | undefined;
  if (cfg.signals) {
    signals = await checkSignals(cfg.site, verdict.status === "MATCH", cfg.signals).catch(
      (err: unknown): SignalsReport => ({ level: "unknown", baseline: "not-recorded", baselineNote: `signals failed: ${errorText(err)}` }),
    );
  }
  let suspects: string[] | undefined;
  let suspectsError: string | undefined;
  if (verdict.status === "MISMATCH") {
    try {
      suspects = await suspectsOf(ctx, cfg, snap, served, verdict);
    } catch (err) {
      suspectsError = errorText(err);
    }
  }
  return {
    verdict,
    checkedAt: new Date(started),
    durationMs: Date.now() - started,
    missingManifests: snap.missingManifests,
    rejectedManifests: store.rejected,
    ...(signals ? { signals } : {}),
    ...(suspects ? { suspects } : {}),
    ...(suspectsError ? { suspectsError } : {}),
  };
}

/**
 * Diffs the addresses of what the host serves against every text file of the live release. The served side is the
 * changed files plus the scripts the served index.html loads (a hijack usually ships a differently named bundle).
 */
async function suspectsOf(ctx: Context, cfg: WatchConfig, snap: Awaited<ReturnType<typeof readSnapshot>>, served: Awaited<ReturnType<typeof fetchServed>>, verdict: Verdict): Promise<string[]> {
  const changed: Uint8Array[] = [];
  for (const d of verdict.diffs) {
    const f = d.kind === "changed" ? served.get(d.path) : undefined;
    if (f?.ok) changed.push(f.bytes);
  }
  const root = served.get("index.html");
  if (root?.ok) {
    const extra = referencedAssets(root.bytes).filter((p) => !served.has(p));
    for (const f of (await fetchServed(cfg.site, extra, cfg.fetch)).values()) if (f.ok) changed.push(f.bytes);
  }

  const approved: Uint8Array[] = [];
  for (const file of snap.live.files) {
    if (!isTextPath(file.path)) continue;
    const key = `${ctx.gate}:${snap.live.id}:${file.path}`;
    let bytes = approvedCache.get(key);
    if (!bytes) {
      bytes = await readReleaseFile(ctx, snap.info, snap.live.id, file.path);
      // Same rule as the index check: bytes that do not hash to the approved value are not "approved" evidence,
      // and treating them as such could hide an attacker address.
      if (sha256(bytes) !== file.sha256) throw new Error(`${file.path} read from the registry does not match the approved hash`);
      approvedCache.set(key, bytes);
    }
    approved.push(bytes);
  }
  return findAddresses(changed, approved);
}

export interface LoopOptions {
  intervalMs: number;
  onResult: (r: CheckResult) => void | Promise<void>;
  /** chain or manifest problems; the loop keeps running */
  onError: (err: unknown) => void | Promise<void>;
  signal?: AbortSignal;
}

/** Runs checkOnce every interval until the signal aborts. Checks never overlap. */
export async function watchLoop(ctx: Context, cfg: WatchConfig, opts: LoopOptions): Promise<void> {
  while (!opts.signal?.aborted) {
    const started = Date.now();
    try {
      await opts.onResult(await checkOnce(ctx, cfg));
    } catch (err) {
      await opts.onError(err);
    }
    const wait = Math.max(0, opts.intervalMs - (Date.now() - started));
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, wait);
      opts.signal?.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
    });
  }
}
