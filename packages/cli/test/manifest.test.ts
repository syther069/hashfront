import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Hex } from "viem";
import { buildTree, hashPair, leafHash, verifyProof } from "../src/merkle.ts";
import { assertValidPath, buildManifest, CHUNK_SIZE, parseManifest, sha256Hex, splitChunks } from "../src/manifest.ts";

const ZERO = `0x${"00".repeat(32)}` as Hex;
const fakeLeaves = (n: number): Hex[] =>
  Array.from({ length: n }, (_, i) =>
    leafHash({ path: `f${i}.js`, contentType: "text/javascript", fileSha256: ZERO, index: 0, chunkSha256: sha256Hex(Uint8Array.of(i)) }),
  );

async function withDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), "hashfront-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("every proof verifies for trees of 1..33 leaves", () => {
  for (let n = 1; n <= 33; n++) {
    const leaves = fakeLeaves(n);
    const { root, proofs } = buildTree(leaves);
    leaves.forEach((leaf, i) => assert.ok(verifyProof(proofs[i] ?? [], root, leaf), `n=${n} i=${i}`));
  }
});

test("a proof does not verify a different leaf", () => {
  const leaves = fakeLeaves(5);
  const { root, proofs } = buildTree(leaves);
  assert.equal(verifyProof(proofs[0] ?? [], root, leaves[1] as Hex), false);
});

test("single-leaf tree: root is the leaf, proof is empty", () => {
  const [leaf] = fakeLeaves(1) as [Hex];
  const { root, proofs } = buildTree([leaf]);
  assert.equal(root, leaf);
  assert.deepEqual(proofs[0], []);
});

test("hashPair is order-independent", () => {
  const [a, b] = fakeLeaves(2) as [Hex, Hex];
  assert.equal(hashPair(a, b), hashPair(b, a));
});

test("leaf binds path, content type, file hash, index and chunk hash", () => {
  const base = { path: "a.js", contentType: "text/javascript", fileSha256: ZERO, index: 0, chunkSha256: ZERO };
  const ref = leafHash(base);
  for (const change of [
    { path: "b.js" },
    { contentType: "text/html" },
    { fileSha256: sha256Hex(Uint8Array.of(1)) },
    { index: 1 },
    { chunkSha256: sha256Hex(Uint8Array.of(1)) },
  ]) {
    assert.notEqual(leafHash({ ...base, ...change }), ref, JSON.stringify(change));
  }
});

test("path rules match ReleaseGate", () => {
  for (const ok of ["index.html", "assets/app.js", ".well-known/tapeapi.json", "a/b/c.css"]) assertValidPath(ok);
  for (const bad of ["", "/index.html", "../x", "a/../b", "a//b", "./a", "a/.", "a\\b", "a\u0001b"]) {
    assert.throws(() => assertValidPath(bad), Error, `expected "${bad}" to be rejected`);
  }
});

test("splitChunks", () => {
  assert.equal(splitChunks(new Uint8Array(0)).length, 1);
  assert.equal(splitChunks(new Uint8Array(CHUNK_SIZE)).length, 1);
  const parts = splitChunks(new Uint8Array(CHUNK_SIZE * 2 + 1));
  assert.deepEqual(parts.map((p) => p.length), [CHUNK_SIZE, CHUNK_SIZE, 1]);
});

test("buildManifest: deterministic, one proof per chunk", async () => {
  await withDir(async (dir) => {
    await mkdir(path.join(dir, "assets"));
    await writeFile(path.join(dir, "index.html"), "<h1>app</h1>");
    await writeFile(path.join(dir, "assets", "app.js"), "x");
    await writeFile(path.join(dir, "assets", "big.bin"), Buffer.alloc(CHUNK_SIZE * 2 + 5, 7));

    const a = await buildManifest(dir);
    const b = await buildManifest(dir);
    assert.equal(a.root, b.root);
    assert.deepEqual(a.files.map((f) => f.path), ["assets/app.js", "assets/big.bin", "index.html"]);
    assert.equal(a.totalChunks, 5);
    assert.equal(a.files.find((f) => f.path === "assets/big.bin")?.chunks.length, 3);
    assert.equal(a.files.find((f) => f.path === "index.html")?.contentType, "text/html; charset=utf-8");

    for (const f of a.files) {
      for (const c of f.chunks) {
        const leaf = leafHash({ path: f.path, contentType: f.contentType, fileSha256: f.sha256, index: c.index, chunkSha256: c.sha256 });
        assert.equal(c.leaf, leaf);
        assert.ok(verifyProof(c.proof, a.root, leaf), `${f.path}#${c.index}`);
      }
    }
    assert.deepEqual(parseManifest(JSON.stringify(a)), a);
  });
});

test("buildManifest requires a root index.html", async () => {
  await withDir(async (dir) => {
    await writeFile(path.join(dir, "app.js"), "x");
    await assert.rejects(buildManifest(dir), /no index\.html/);
  });
});

test("parseManifest rejects other versions", () => {
  assert.throws(() => parseManifest(JSON.stringify({ version: 1, root: ZERO, files: [] })), /unsupported manifest version/);
});
