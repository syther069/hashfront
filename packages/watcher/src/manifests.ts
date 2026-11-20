// Release manifests, trusted only through the onchain root.
//
// SiteRegistry has no file listing and the public X Layer RPC caps eth_getLogs at 100 blocks, so the list of files
// in a release comes from the CLI's manifest.json. It can come from anywhere (CI artifact, repo, a copy on disk)
// because we recompute every leaf and the Merkle root from the manifest's own fields and accept it only for the
// release whose onchain `root` and `totalChunks` it reproduces.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Hex } from "viem";
import { parseManifest, recomputeRoot, type Manifest } from "@hashfront/cli/release";

export { recomputeRoot };

export interface ReleaseFile {
  path: string;
  size: number;
  /** sha256 of the whole file, 0x-prefixed lowercase */
  sha256: Hex;
}

export interface ManifestStore {
  /** manifests whose recomputed root is self-consistent, keyed by lowercase root */
  byRoot: Map<string, Manifest>;
  /** files that could not be used, with the reason */
  rejected: { file: string; reason: string }[];
}

export async function loadManifests(dir: string): Promise<ManifestStore> {
  const byRoot = new Map<string, Manifest>();
  const rejected: ManifestStore["rejected"] = [];
  for (const name of (await readdir(dir)).filter((n) => n.endsWith(".json")).sort()) {
    const file = path.join(dir, name);
    try {
      const m = parseManifest(await readFile(file, "utf8"));
      const { root, totalChunks } = recomputeRoot(m);
      if (root.toLowerCase() !== m.root.toLowerCase() || totalChunks !== m.totalChunks) {
        throw new Error("stored root or chunk count does not match the files it lists");
      }
      byRoot.set(root.toLowerCase(), m);
    } catch (err) {
      rejected.push({ file: name, reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return { byRoot, rejected };
}

/** The manifest for an onchain release, or undefined if none reproduces its root and chunk count. */
export function manifestFor(store: ManifestStore, root: Hex, totalChunks: number): ReleaseFile[] | undefined {
  const m = store.byRoot.get(root.toLowerCase());
  if (!m || m.totalChunks !== totalChunks) return undefined;
  return m.files.map((f) => ({ path: f.path, size: f.size, sha256: f.sha256.toLowerCase() as Hex }));
}
