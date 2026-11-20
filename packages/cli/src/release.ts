// Browser-safe release manifest model: types, limits, parsing and root recomputation. viem only, no node: imports,
// so the web app (apps/web) and the watcher share exactly the code the CLI uses.
import type { Hex } from "viem";
import { buildTree, leafHash } from "./merkle.ts";

/** SiteRegistry limits (TAP-10 Appendix B.5). */
export const CHUNK_SIZE = 24_000;
export const MAX_CHUNKS = 350;
export const MAX_FILE_SIZE = CHUNK_SIZE * MAX_CHUNKS; // 8,400,000 bytes

export const MANIFEST_VERSION = 2;

export interface ManifestChunk {
  index: number;
  size: number;
  sha256: Hex;
  leaf: Hex;
  proof: Hex[];
}

export interface ManifestFile {
  path: string;
  size: number;
  sha256: Hex;
  contentType: string;
  chunks: ManifestChunk[];
}

export interface Manifest {
  version: typeof MANIFEST_VERSION;
  root: Hex;
  totalChunks: number;
  totalBytes: number;
  files: ManifestFile[];
}

/**
 * Validates a release-relative path against the rules ReleaseGate and SiteRegistry enforce:
 * forward slashes, no leading slash, no empty, "." or ".." segments, no control characters.
 */
export function assertValidPath(rel: string): void {
  if (rel.length === 0) throw new Error("empty path");
  if (rel.startsWith("/")) throw new Error(`path must be relative: ${rel}`);
  if (rel.includes("\\")) throw new Error(`path must use forward slashes: ${rel}`);
  for (const segment of rel.split("/")) {
    if (segment === "" || segment === "." || segment === "..") throw new Error(`invalid path segment in: ${rel}`);
  }
  for (let i = 0; i < rel.length; i++) {
    const code = rel.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) throw new Error(`control character in path: ${JSON.stringify(rel)}`);
  }
}

const isHash = (v: unknown): v is Hex => typeof v === "string" && /^0x[0-9a-fA-F]{64}$/.test(v);
const isCount = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;

/**
 * Parses and shape-checks a manifest. Manifests come from CI artifacts, repos or a maintainer's upload, so every
 * field is treated as untrusted; trust comes only from recomputeRoot() matching the onchain root.
 */
export function parseManifest(json: string): Manifest {
  const m = JSON.parse(json) as Partial<Manifest>;
  if (m.version !== MANIFEST_VERSION) {
    throw new Error(`unsupported manifest version ${String(m.version)} (expected ${MANIFEST_VERSION}); rebuild it`);
  }
  if (!isHash(m.root) || !isCount(m.totalChunks) || !Array.isArray(m.files) || m.files.length === 0) {
    throw new Error("malformed manifest");
  }
  for (const f of m.files as unknown[]) {
    const file = f as Partial<ManifestFile>;
    if (typeof file?.path !== "string" || !isCount(file.size) || !isHash(file.sha256) || typeof file.contentType !== "string" || !Array.isArray(file.chunks)) {
      throw new Error("malformed manifest: bad file entry");
    }
    assertValidPath(file.path);
    for (const c of file.chunks as unknown[]) {
      const chunk = c as Partial<ManifestChunk>;
      if (!isCount(chunk?.index) || !isCount(chunk.size) || !isHash(chunk.sha256)) throw new Error(`malformed manifest: bad chunk in ${file.path}`);
    }
  }
  return m as Manifest;
}

/** Recomputes the Merkle root from the manifest's file and chunk fields; ignores its stored leaves, proofs and root. */
export function recomputeRoot(m: Manifest): { root: Hex; totalChunks: number } {
  const leaves: Hex[] = [];
  for (const file of m.files) {
    const expectedChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
    if (file.chunks.length !== expectedChunks) throw new Error(`${file.path}: ${file.chunks.length} chunks for ${file.size} bytes`);
    file.chunks.forEach((chunk, i) => {
      if (chunk.index !== i) throw new Error(`${file.path}: chunk ${i} has index ${chunk.index}`);
      leaves.push(leafHash({ path: file.path, contentType: file.contentType, fileSha256: file.sha256, index: i, chunkSha256: chunk.sha256 }));
    });
  }
  return { root: buildTree(leaves).root, totalChunks: leaves.length };
}

/** True only if the manifest reproduces exactly this onchain root and chunk count. */
export function matchesOnchain(m: Manifest, root: Hex, totalChunks: number): boolean {
  try {
    const r = recomputeRoot(m);
    return r.root.toLowerCase() === root.toLowerCase() && r.totalChunks === totalChunks;
  } catch {
    return false;
  }
}

export interface FileChange {
  path: string;
  change: "added" | "removed" | "changed" | "unchanged";
  before?: { size: number; sha256: Hex };
  after?: { size: number; sha256: Hex };
}

/** File-level diff of two releases, sorted by path. */
export function diffManifests(before: Manifest | undefined, after: Manifest): FileChange[] {
  const prev = new Map((before?.files ?? []).map((f) => [f.path, f]));
  const next = new Map(after.files.map((f) => [f.path, f]));
  const paths = [...new Set([...prev.keys(), ...next.keys()])].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return paths.map((path) => {
    const b = prev.get(path);
    const a = next.get(path);
    const pick = (f: ManifestFile) => ({ size: f.size, sha256: f.sha256 });
    if (!b) return { path, change: "added", after: pick(a!) };
    if (!a) return { path, change: "removed", before: pick(b) };
    return { path, change: b.sha256.toLowerCase() === a.sha256.toLowerCase() ? "unchanged" : "changed", before: pick(b), after: pick(a) };
  });
}
