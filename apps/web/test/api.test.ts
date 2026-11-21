import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeFunctionData, parseAbi } from "viem";
import { OkxClient } from "@hashfront/okx/client";
import { getApprovals, getPrice, postTxScan, type Deps } from "../api/_handlers.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = async (name: string) => JSON.parse(await readFile(path.join(here, "../../../packages/okx/test/fixtures", `${name}.json`), "utf8")) as unknown;

const GATE = "0xAF96CA14DB35420BF46b6Ab8feB513306B7D80F6";
const ROUTER = "0xA1DA93A3fD135FC83E3B5f69dCb9d73babde5306";
const USER = "0x51C71Ad9D6c7871bB9eDC214D4cd0472640B488C";

/** Deps whose OKX client answers every call with `data` (recorded live on X Layer), and records request bodies. */
function deps(data: unknown, env: Record<string, string> = {}) {
  const bodies: unknown[] = [];
  const f = (async (_url: string, init: RequestInit) => {
    if (init.body) bodies.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify({ code: "0", msg: "", data }));
  }) as unknown as typeof fetch;
  const d: Deps = { okx: new OkxClient({ apiKey: "k", secretKey: "s", passphrase: "p" }, { fetch: f, sleep: async () => {} }), env };
  return { d, bodies };
}

test("approvals: the live X Layer approval to HashSwap's router is 'trusted'; unlisted it is an 'eoa' risk", async () => {
  const live = await fixture("approvals");
  const trusted = await (await getApprovals(new Request(`https://s/api/approvals?address=${USER}`), deps(live, { ALLOWED_SPENDERS: ROUTER }).d)).json();
  assert.equal(trusted.chain, "X Layer");
  assert.equal(trusted.approvals[0].risk, "trusted");
  assert.equal(trusted.approvals[0].amount, "0.000001");
  const res = await getApprovals(new Request(`https://s/api/approvals?address=${USER}`), deps(live).d);
  assert.match(res.headers.get("cache-control") ?? "", /s-maxage=30/);
  assert.equal((await res.json()).approvals[0].risk, "eoa");
});

test("approvals: bad input is a 400, missing keys a 503, and only X Layer is ever asked", async () => {
  assert.equal((await getApprovals(new Request("https://s/api/approvals?address=0x123"), deps([]).d)).status, 400);
  assert.equal((await getApprovals(new Request(`https://s/api/approvals?address=${USER}`), { okx: undefined, env: {} })).status, 503);
  const { d, bodies } = deps([]);
  await getApprovals(new Request(`https://s/api/approvals?address=${USER}`), d);
  assert.deepEqual((bodies[0] as { addressList: unknown }).addressList, [{ chainIndex: "196", address: USER }]);
});

const gateAbi = parseAbi(["function approve(uint256 id, bytes32 root, uint32 totalChunks)", "function transferOwnership(address)"]);
const approveData = encodeFunctionData({ abi: gateAbi, functionName: "approve", args: [2n, `0x${"35".repeat(32)}`, 4] });
const post = (body: unknown) => new Request("https://s/api/tx-scan", { method: "POST", body: JSON.stringify(body) });

test("tx-scan: scans a maintainer approve to our gate, with OKX's live 'no risk' answer", async () => {
  const { d, bodies } = deps(await fixture("tx-scan"), { HASHFRONT_GATE: GATE });
  const r = await (await postTxScan(post({ from: USER, to: GATE, data: approveData }), d)).json();
  assert.equal(r.safe, true);
  assert.deepEqual(r.risks, []);
  assert.equal((bodies[0] as { source: string }).source, "hashfront");
});

test("tx-scan is not an open proxy: other targets, other functions and big bodies are refused", async () => {
  const { d } = deps({}, { HASHFRONT_GATE: GATE });
  assert.equal((await postTxScan(post({ from: USER, to: ROUTER, data: approveData }), d)).status, 400);
  const other = encodeFunctionData({ abi: gateAbi, functionName: "transferOwnership", args: [USER] });
  assert.equal((await postTxScan(post({ from: USER, to: GATE, data: other }), d)).status, 400);
  assert.equal((await postTxScan(new Request("https://s/api/tx-scan", { method: "POST", body: "x".repeat(5000) }), d)).status, 413);
  assert.equal((await postTxScan(post({ from: USER, to: GATE, data: approveData }), deps({}).d)).status, 503, "no gate configured");
});

test("price: OKB in USD from the live Market API answer, cached at the edge", async () => {
  const res = await getPrice(new Request("https://s/api/price"), deps(await fixture("price")).d);
  const body = await res.json();
  assert.ok(body.okbUsd > 0);
  assert.match(res.headers.get("cache-control") ?? "", /s-maxage=60/);
});
