// Decrypts a throwaway keystore that `cast` creates in a temp directory (never a real one) and checks the key against
// the address cast derives from the same file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { privateKeyToAccount } from "viem/accounts";
import { decryptKeystore, keystorePath } from "../src/keystore.ts";

const hasCast = spawnSync("cast", ["--version"], { encoding: "utf8" }).status === 0;

test("decrypts a Foundry keystore to the key cast uses; a wrong password fails the MAC", { skip: !hasCast && "Foundry not installed" }, async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "hashfront-ks-"));
  try {
    const made = spawnSync("cast", ["wallet", "new", dir, "throwaway", "--unsafe-password", "test-only"], { encoding: "utf8" });
    assert.equal(made.status, 0, made.stderr);
    const file = path.join(dir, (await readdir(dir))[0]!);
    const castAddr = spawnSync("cast", ["wallet", "address", "--keystore", file, "--password", "test-only"], { encoding: "utf8" })
      .stdout.split(/\s+/)
      .find((l) => /^0x[0-9a-fA-F]{40}$/.test(l));
    assert.ok(castAddr);
    const json = await readFile(file, "utf8");
    const key = await decryptKeystore(json, "test-only");
    assert.equal(privateKeyToAccount(key).address, castAddr);
    await assert.rejects(decryptKeystore(json, "wrong"), /wrong keystore password/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("bad keystores and names are rejected", async () => {
  await assert.rejects(decryptKeystore("{", "x"), /not valid JSON/);
  await assert.rejects(decryptKeystore('{"version":1}', "x"), /not a version 3 keystore/);
  assert.throws(() => keystorePath("../etc/passwd"), /not a keystore name/);
  assert.match(keystorePath("hashfront-deployer"), /keystores[\\/]hashfront-deployer$/);
});
