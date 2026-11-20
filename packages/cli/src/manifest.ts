import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Hex } from "viem";
import { buildTree, leafHash } from "./merkle.ts";
import { assertValidPath, CHUNK_SIZE, MANIFEST_VERSION, MAX_FILE_SIZE, type Manifest, type ManifestChunk, type ManifestFile } from "./release.ts";

export {
  assertValidPath,
  CHUNK_SIZE,
  diffManifests,
  MANIFEST_VERSION,
  matchesOnchain,
  MAX_CHUNKS,
  MAX_FILE_SIZE,
  parseManifest,
  recomputeRoot,
  type FileChange,
  type Manifest,
  type ManifestChunk,
  type ManifestFile,
} from "./release.ts";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wasm": "application/wasm",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
};

export function contentTypeFor(file: string): string {
  return CONTENT_TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
}

/** An empty file is stored as a single empty chunk. */
export function splitChunks(data: Uint8Array): Uint8Array[] {
  if (data.length === 0) return [data];
  const out: Uint8Array[] = [];
  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) out.push(data.subarray(offset, offset + CHUNK_SIZE));
  return out;
}

export function sha256Hex(data: Uint8Array): Hex {
  return `0x${createHash("sha256").update(data).digest("hex")}`;
}

/** Release-relative paths of every file under root (forward slashes); symlinks and special files are refused. */
export async function listFiles(root: string, dir = root): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(root, abs)));
    else if (entry.isFile()) out.push(path.relative(root, abs).split(path.sep).join("/"));
    else throw new Error(`unsupported entry (symlink or special file): ${abs}`);
  }
  return out;
}

/** Hashes every file in a build directory and returns the release manifest with one proof per chunk. */
export async function buildManifest(dir: string): Promise<Manifest> {
  const info = await stat(dir).catch(() => undefined);
  if (!info?.isDirectory()) throw new Error(`not a directory: ${dir}`);

  // byte-wise ordering keeps the root identical on every OS and locale
  const paths = (await listFiles(dir)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  if (paths.length === 0) throw new Error(`no files in ${dir}`);
  if (!paths.includes("index.html")) throw new Error(`${dir} has no index.html at its root`);

  const files: ManifestFile[] = [];
  const leaves: Hex[] = [];
  let totalBytes = 0;

  for (const rel of paths) {
    assertValidPath(rel);
    const data = await readFile(path.join(dir, rel));
    if (data.length > MAX_FILE_SIZE) {
      throw new Error(`${rel} is ${data.length} bytes; SiteRegistry stores at most ${MAX_FILE_SIZE} bytes per file`);
    }
    const fileSha256 = sha256Hex(data);
    const contentType = contentTypeFor(rel);
    const chunks = splitChunks(data).map((bytes, index): ManifestChunk => {
      const sha256 = sha256Hex(bytes);
      const leaf = leafHash({ path: rel, contentType, fileSha256, index, chunkSha256: sha256 });
      leaves.push(leaf);
      return { index, size: bytes.length, sha256, leaf, proof: [] };
    });
    files.push({ path: rel, size: data.length, sha256: fileSha256, contentType, chunks });
    totalBytes += data.length;
  }

  const tree = buildTree(leaves);
  let k = 0;
  for (const file of files) {
    for (const chunk of file.chunks) chunk.proof = tree.proofs[k++] ?? [];
  }
  return { version: MANIFEST_VERSION, root: tree.root, totalChunks: leaves.length, totalBytes, files };
}
