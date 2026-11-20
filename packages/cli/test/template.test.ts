// Guards the GitHub Action template against drift: every `$HASHFRONT <command> --flag` it runs must exist in the CLI,
// untrusted dispatch inputs must never be interpolated into a shell line, and permissions stay minimal.
// (There is no YAML linter or `act` in this repo; the commands themselves are exercised end to end in init.e2e.ts.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const template = path.resolve(here, "../templates/hashfront-release.yml");
const usage = spawnSync(process.execPath, [path.resolve(here, "../src/main.ts"), "--help"], { encoding: "utf8" }).stdout;

test("every CLI command and flag the template uses exists", async () => {
  const yml = await readFile(template, "utf8");
  const calls = [...yml.matchAll(/\$HASHFRONT ([a-z-]+)([^\n]*)/g)];
  assert.ok(calls.length >= 9, `found only ${calls.length} CLI calls`);
  for (const [, command, rest] of calls) {
    assert.match(usage, new RegExp(`^  ${command}\\s`, "m"), `unknown command "${command}"`);
    for (const flag of rest!.match(/--[a-z-]+/g) ?? []) {
      if (flag === "--network") continue; // global option
      assert.ok(usage.includes(flag), `"${command}" uses ${flag}, which the CLI does not document`);
    }
  }
});

test("dispatch inputs only reach shell lines through env, and are validated", async () => {
  const yml = await readFile(template, "utf8");
  for (const line of yml.split("\n")) {
    if (/\$\{\{\s*inputs\./.test(line)) {
      assert.match(line.trim(), /^(RUN_ID:|run-id:|if:)/, `inputs used outside env/with/if: ${line.trim()}`);
    }
  }
  assert.equal((yml.match(/=~ \^\[0-9\]\+\$/g) ?? []).length, 4, "run id and release id checks in publish and go-live");
});

test("minimal permissions and the deployed bytes come from the propose run", async () => {
  const yml = await readFile(template, "utf8");
  assert.match(yml, /^permissions:\n {2}contents: read\n {2}actions: read/m);
  assert.doesNotMatch(yml, /write-all|contents: write|id-token: write/);
  assert.equal((yml.match(/run-id: \$\{\{ inputs\.propose_run_id \}\}/g) ?? []).length, 2);
  assert.match(yml, /wait-active --id "\$ID" --timeout 600 --exact/);
});
