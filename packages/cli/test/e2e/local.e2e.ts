// End-to-end on a plain anvil chain: ReleaseGate (real policy netlist) + mock registry + the real CLI binary.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { KEYS, startHarness, writeDemoBuild, type Harness } from "./harness.ts";

const TIMELOCK = 3600;
let h: Harness;

before(async () => {
  h = await startHarness({ port: 8547, timelock: TIMELOCK });
  await writeDemoBuild(path.join(h.workDir, "dist"));
});

after(async () => {
  await h?.stop();
});

test("help exits 0", () => {
  const r = h.cli(["--help"]);
  assert.equal(r.code, 0);
  assert.match(r.out, /Release flow/);
});

test("full release flow", async () => {
  h.ok(["manifest", "dist", "--out", "manifest.json"]);
  assert.match(h.ok(["propose", "--manifest", "manifest.json"], KEYS.uploader), /release id 1/);

  const early = h.cli(["upload", "--id", "1", "--manifest", "manifest.json", "dist"], KEYS.uploader);
  assert.notEqual(early.code, 0);
  assert.match(early.out, /0 of the 2 approvals/);

  const outsider = h.cli(["approve", "--id", "1", "--manifest", "manifest.json"], KEYS.uploader);
  assert.notEqual(outsider.code, 0);
  assert.match(outsider.out, /NotMaintainer/);

  h.ok(["approve", "--id", "1", "--manifest", "manifest.json"], KEYS.m1);
  h.ok(["approve", "--id", "1", "--manifest", "manifest.json"], KEYS.m2);

  const upload = h.ok(["upload", "--id", "1", "--manifest", "manifest.json", "dist"], KEYS.uploader);
  assert.match(upload, /assets\/app\.js \[3\/3\]/);
  assert.match(upload, /upload complete \(5 transactions\)/);
  assert.match(h.ok(["upload", "--id", "1", "--manifest", "manifest.json", "dist"], KEYS.uploader), /\(0 transactions\)/);
  assert.match(h.ok(["verify", "--id", "1", "--manifest", "manifest.json"]), /all 3 files match the manifest byte for byte/);

  h.ok(["seal", "--id", "1", "--manifest", "manifest.json"], KEYS.uploader);

  const blocked = h.cli(["activate", "--id", "1"], KEYS.uploader);
  assert.notEqual(blocked.code, 0);
  assert.match(blocked.out, /2\/3 approvals, timelock running/);

  await h.rpcCall("evm_increaseTime", [TIMELOCK]);
  await h.rpcCall("evm_mine", []);
  h.ok(["activate", "--id", "1"], KEYS.uploader);
  assert.match(h.ok(["wait-active", "--id", "1", "--timeout", "10"]), /release v1 is live/);
  assert.match(h.ok(["status"]), /live: v1/);
});

test("hotfix: 3 of 3 approvals go live without waiting; old release cannot be replayed", async () => {
  await writeFile(path.join(h.workDir, "dist", "assets", "app.css"), "body{margin:0;color:red}");
  h.ok(["manifest", "dist", "--out", "hotfix.json"]);
  assert.match(h.ok(["propose", "--manifest", "hotfix.json"], KEYS.uploader), /release id 2/);
  for (const key of [KEYS.m1, KEYS.m2, KEYS.m3]) h.ok(["approve", "--id", "2", "--manifest", "hotfix.json"], key);
  h.ok(["upload", "--id", "2", "--manifest", "hotfix.json", "dist"], KEYS.uploader);
  h.ok(["seal", "--id", "2", "--manifest", "hotfix.json"], KEYS.uploader);
  h.ok(["activate", "--id", "2"], KEYS.uploader);
  assert.match(h.ok(["status", "--id", "2"]), /release v2 \(LIVE\)/);

  const replay = h.cli(["activate", "--id", "1"], KEYS.uploader);
  assert.notEqual(replay.code, 0);
  assert.match(replay.out, /not newer than the live release/);
});

test("a maintainer cannot approve a build that differs from the proposal", async () => {
  await writeFile(path.join(h.workDir, "dist", "index.html"), "<!doctype html><p>tampered</p>");
  h.ok(["manifest", "dist", "--out", "tampered.json"]);
  const r = h.cli(["approve", "--id", "2", "--manifest", "tampered.json"], KEYS.m1);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /Refusing to approve a build you did not review/);
});

test("a cancelled release can never go live", () => {
  assert.match(h.ok(["propose", "--manifest", "tampered.json"], KEYS.uploader), /release id 3/);
  for (const key of [KEYS.m1, KEYS.m2, KEYS.m3]) h.ok(["approve", "--id", "3", "--manifest", "tampered.json"], key);
  h.ok(["upload", "--id", "3", "--manifest", "tampered.json", "dist"], KEYS.uploader);
  h.ok(["seal", "--id", "3", "--manifest", "tampered.json"], KEYS.uploader);
  h.ok(["cancel", "--id", "3"], KEYS.m2);

  const r = h.cli(["activate", "--id", "3"], KEYS.uploader);
  assert.notEqual(r.code, 0);
  assert.match(r.out, /cancelled/);
  assert.match(h.ok(["status", "--id", "3"]), /CANCELLED/);
});
