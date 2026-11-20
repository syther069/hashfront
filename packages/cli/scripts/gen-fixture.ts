// Writes contracts/test/fixtures/manifest.json so the Solidity tests verify
// proofs produced by this package (cross-language Merkle compatibility).
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildManifest, CHUNK_SIZE, splitChunks } from "../src/manifest.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../../../contracts/test/fixtures/manifest.json");

const sources: Record<string, Uint8Array> = {
  "index.html": Buffer.from('<!doctype html><title>demo</title><script src="assets/app.js"></script>'),
  "assets/app.js": Buffer.alloc(CHUNK_SIZE * 2 + 17, 0x61), // 3 chunks, last one partial
  "assets/app.css": Buffer.from("body{margin:0}"),
  "assets/empty.txt": new Uint8Array(0), // empty file = one empty chunk
  ".well-known/tapeapi.json": Buffer.from("{}"),
};

const dir = await mkdtemp(path.join(tmpdir(), "hashfront-fixture-"));
try {
  for (const [rel, body] of Object.entries(sources)) {
    await mkdir(path.dirname(path.join(dir, rel)), { recursive: true });
    await writeFile(path.join(dir, rel), body);
  }
  const manifest = await buildManifest(dir);

  // Flat list of chunks in upload order; forge's JSON decoder needs keys in alphabetical order.
  const chunks = manifest.files.flatMap((f) => {
    const parts = splitChunks(sources[f.path] ?? new Uint8Array(0));
    return f.chunks.map((c) => ({
      contentType: f.contentType,
      data: `0x${Buffer.from(parts[c.index] ?? new Uint8Array(0)).toString("hex")}`,
      fileSha256: f.sha256,
      index: c.index,
      leaf: c.leaf,
      path: f.path,
      proof: c.proof,
    }));
  });

  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify({ chunks, root: manifest.root, totalChunks: manifest.totalChunks }, null, 2)}\n`);
  console.log(`wrote ${path.relative(process.cwd(), out)} (${manifest.files.length} files, ${manifest.totalChunks} chunks)`);
} finally {
  await rm(dir, { recursive: true, force: true });
}
