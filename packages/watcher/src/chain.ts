// Onchain side: which release is live, which others exist, and the approved bytes of the live index.html.
import { concatHex, hexToBytes, type Hex } from "viem";
import { siteRegistryAbi } from "@hashfront/cli/abi";
import type { Context } from "@hashfront/cli/context";
import { readFile, readGateInfo, readRelease, stagedPath, type GateInfo, type ReleaseState as ChainRelease } from "@hashfront/cli/gate";
import { CHUNK_SIZE } from "@hashfront/cli/manifest";
import type { ReleaseState, ReleaseView } from "./compare.ts";
import { manifestFor, type ManifestStore } from "./manifests.ts";

/** How many releases below the live one count as "previous" (host behind) rather than unknown. */
export const PREVIOUS_WINDOW = 3n;
/** How many releases above the live one are checked for "deployed before activation". */
export const AHEAD_WINDOW = 3n;

export interface ChainSnapshot {
  info: GateInfo;
  live: ReleaseView;
  others: ReleaseView[];
  /** releases we could not compare because no manifest reproduces their root */
  missingManifests: bigint[];
}

export class NoLiveRelease extends Error {
  override name = "NoLiveRelease";
}

export class NoManifest extends Error {
  override name = "NoManifest";
}

function stateOf(r: ChainRelease, live: bigint): ReleaseState {
  if (r.id === live) return "live";
  if (r.cancelled) return "cancelled";
  if (r.activated) return "previous";
  return r.sealedAt !== 0n ? "sealed" : "staged";
}

export async function readSnapshot(ctx: Context, store: ManifestStore): Promise<ChainSnapshot> {
  const info = await readGateInfo(ctx);
  if (info.liveRelease === 0n) throw new NoLiveRelease("the gate has no live release yet");

  const lo = info.liveRelease > PREVIOUS_WINDOW ? info.liveRelease - PREVIOUS_WINDOW : 1n;
  const hi = info.liveRelease + AHEAD_WINDOW < info.releaseCount ? info.liveRelease + AHEAD_WINDOW : info.releaseCount;
  const ids: bigint[] = [];
  for (let id = lo; id <= hi; id++) ids.push(id);
  const releases = await Promise.all(ids.map((id) => readRelease(ctx, id)));

  let live: ReleaseView | undefined;
  const others: ReleaseView[] = [];
  const missingManifests: bigint[] = [];
  for (const r of releases) {
    const files = manifestFor(store, r.root, r.totalChunks);
    if (!files) {
      missingManifests.push(r.id);
      continue;
    }
    const view: ReleaseView = { id: r.id, state: stateOf(r, info.liveRelease), files };
    if (view.state === "live") live = view;
    else others.push(view);
  }
  if (!live) {
    throw new NoManifest(`no manifest reproduces the root of live release v${info.liveRelease}; add its manifest.json to the manifests directory`);
  }
  others.sort((a, b) => Number(b.id - a.id)); // newest first
  return { info, live, others, missingManifests };
}

/** Approved bytes of a release file, read back from SiteRegistry in 24 KB ranges. */
export async function readReleaseFile(ctx: Context, info: GateInfo, id: bigint, rel: string): Promise<Uint8Array> {
  const full = stagedPath(id, rel);
  const meta = await readFile(ctx, info.registry, info.container, full);
  const parts: Hex[] = [];
  for (let offset = 0; offset < meta.size; offset += CHUNK_SIZE) {
    parts.push(
      await ctx.publicClient.readContract({
        address: info.registry,
        abi: siteRegistryAbi,
        functionName: "readRange",
        args: [info.container, full, BigInt(offset), BigInt(CHUNK_SIZE)],
      }),
    );
  }
  return parts.length === 0 ? new Uint8Array() : hexToBytes(concatHex(parts));
}
