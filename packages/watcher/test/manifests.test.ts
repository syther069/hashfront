import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildManifest } from "@hashfront/cli/manifest";
import { loadManifests, manifestFor } from "../src/manifests.ts";

async function withBuild(fn: (dir: string, manifests: string) => Promise<void>) {
  const dir = await mkdtemp(path.join(tmpdir(), "hashfront-watch-"));
  try {
    await mkdir(path.join(dir, "dist", "assets"), { recursive: true });
    await writeFile(path.join(dir, "dist", "index.html"), "<!doctype html><script src=assets/a.js></script>");
    await writeFile(path.join(dir, "dist", "assets", "a.js"), "x".repeat(50_000)); // 3 chunks
    await mkdir(path.join(dir, "manifests"));
    await fn(dir, path.join(dir, "manifests"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("a manifest is accepted only for the onchain root it reproduces", async () => {
  await withBuild(async (dir, manifests) => {
    const m = await buildManifest(path.join(dir, "dist"));
    await writeFile(path.join(manifests, "v1.json"), JSON.stringify(m));
    const store = await loadManifests(manifests);
    assert.deepEqual(store.rejected, []);
    const files = manifestFor(store, m.root, m.totalChunks);
    assert.deepEqual(files?.map((f) => f.path).sort(), ["assets/a.js", "index.html"]);
    assert.equal(manifestFor(store, m.root, m.totalChunks + 1), undefined);
    assert.equal(manifestFor(store, `0x${"11".repeat(32)}`, m.totalChunks), undefined);
  });
});

test("a manifest whose file hash was edited is rejected, even with the original root", async () => {
  await withBuild(async (dir, manifests) => {
    const m = await buildManifest(path.join(dir, "dist"));
    const forged = structuredClone(m);
    const file = forged.files.find((f) => f.path === "assets/a.js");
    assert.ok(file);
    file.sha256 = `0x${"ab".repeat(32)}`; // claims different bytes are approved, keeps the real root
    await writeFile(path.join(manifests, "forged.json"), JSON.stringify(forged));
    const store = await loadManifests(manifests);
    assert.equal(store.byRoot.size, 0);
    assert.equal(store.rejected.length, 1);
  });
});
