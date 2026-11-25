import { test } from "node:test";
import assert from "node:assert/strict";
import { extractAddresses, referencedAssets, suspects } from "../src/suspects.ts";

const enc = (s: string) => new TextEncoder().encode(s);
const ROUTER = "0xA1DA93A3fD135FC83E3B5f69dCb9d73babde5306";
const HIJACK = "0xBAd0000000000000000000000000000000000Bad"; // checksummed form of VITE_SPENDER in apps/demo-dapp/.env.hijack

test("extracts checksummed addresses, in any case, and skips zero and the native placeholder", () => {
  const a = extractAddresses(enc(`router="${ROUTER.toLowerCase()}" native=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE zero=0x${"0".repeat(40)} x=${HIJACK.toLowerCase()}`));
  assert.deepEqual([...a].sort(), [ROUTER, HIJACK].sort());
});

test("a 32-byte hash is not read as an address", () => {
  assert.equal(extractAddresses(enc(`0x${"ab".repeat(32)}`)).size, 0);
});

test("suspects are only addresses missing from every approved file", () => {
  const approved = [enc(`const router = "${ROUTER}"`), enc("// other file")];
  const changed = [enc(`const router = "${ROUTER}"; const spender = "${HIJACK}"`)];
  assert.deepEqual(suspects(changed, approved), [HIJACK]);
});

test("a hijack that changes nothing about addresses names no one", () => {
  assert.deepEqual(suspects([enc(ROUTER)], [enc(ROUTER)]), []);
});

test("referencedAssets: same-origin scripts and styles only, no path escapes", () => {
  const html = `<script type="module" src="./assets/index-ab.js"></script><link href="assets/index.css" rel="stylesheet">
    <script src="https://cdn.example.com/x.js"></script><script src="//evil.example/y.js"></script>
    <img src="logo.png"><script src="../up.js"></script><script src="/assets/root.js?v=1"></script>`;
  assert.deepEqual(referencedAssets(enc(html)), ["assets/index-ab.js", "assets/index.css", "assets/root.js"]);
});
