// After a MISMATCH: which addresses does the hijacked site contain that the approved release never mentions?
// Shared by the watcher and the status page backend, so both name the same suspects.
import type { Context } from "@hashfront/cli/context";
import type { GateInfo } from "@hashfront/cli/gate";
import { readReleaseFile } from "./chain.ts";
import { sha256, type FileDiff, type ReleaseView, type Served } from "./compare.ts";
import { fetchServed, type FetchOptions } from "./fetchSite.ts";
import { isTextPath, referencedAssets, suspects } from "./suspects.ts";

/** Verified approved bytes per gate, release id and path; a live release never changes. */
const approvedCache = new Map<string, Uint8Array>();

export interface TriageInput {
  ctx: Context;
  info: GateInfo;
  live: ReleaseView;
  served: Served;
  diffs: readonly FileDiff[];
  site: URL;
  fetch?: FetchOptions;
}

/**
 * Compares the addresses of what the host serves with every text file of the live release. The served side is the
 * changed files plus the scripts the served index.html loads: a hijack usually ships a differently named bundle.
 */
export async function findSuspects(i: TriageInput): Promise<string[]> {
  const changed: Uint8Array[] = [];
  for (const d of i.diffs) {
    const f = d.kind === "changed" ? i.served.get(d.path) : undefined;
    if (f?.ok) changed.push(f.bytes);
  }
  const root = i.served.get("index.html");
  if (root?.ok) {
    const extra = referencedAssets(root.bytes).filter((p) => !i.served.has(p));
    for (const f of (await fetchServed(i.site, extra, i.fetch)).values()) if (f.ok) changed.push(f.bytes);
  }

  const approved: Uint8Array[] = [];
  for (const file of i.live.files) {
    if (!isTextPath(file.path)) continue;
    const key = `${i.ctx.gate}:${i.live.id}:${file.path}`;
    let bytes = approvedCache.get(key);
    if (!bytes) {
      bytes = await readReleaseFile(i.ctx, i.info, i.live.id, file.path);
      // Bytes that do not hash to the approved value are not approved evidence; trusting them could hide an attacker address.
      if (sha256(bytes) !== file.sha256) throw new Error(`${file.path} read from the registry does not match the approved hash`);
      approvedCache.set(key, bytes);
    }
    approved.push(bytes);
  }
  return suspects(changed, approved);
}
