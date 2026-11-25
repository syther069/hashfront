import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeFunctionData, parseAbi } from "viem";
import { OkxClient } from "@hashfront/okx/client";
import { getApprovals, getPrice, getSuspects, postTxScan, type Deps } from "../api/_handlers.ts";
import { suspectsLoaderFromEnv } from "../api/_site.ts";

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

test("approvals: a spender that the site diff names is ranked 'attacker', first, even above OKX flags", async () => {
  const live = await fixture("approvals");
  const spender = (live as { dataList: { approvalAddress: string }[] }[])[0]!.dataList[0]!.approvalAddress;
  const d = { ...deps(live).d, suspects: async () => ({ status: "mismatch" as const, liveRelease: 2, suspects: [spender.toUpperCase().replace("0X", "0x")], checkedAt: "2026-11-26T00:00:00.000Z" }) };
  const body = await (await getApprovals(new Request(`https://s/api/approvals?address=${USER}`), d)).json();
  assert.equal(body.approvals[0].risk, "attacker");
  assert.match(body.approvals[0].reasons.join(" "), /hijacked site/);
});

test("approvals: a failing suspects lookup never hides the approvals", async () => {
  const live = await fixture("approvals");
  const d = { ...deps(live).d, suspects: async () => { throw new Error("rpc down"); } };
  const res = await getApprovals(new Request(`https://s/api/approvals?address=${USER}`), d);
  assert.equal(res.status, 200);
  assert.ok((await res.json()).approvals.length > 0);
});

test("suspects: 503 when the site is not configured, JSON with a short cache when it is, a generic 503 on failure", async () => {
  assert.equal((await getSuspects(new Request("https://s/api/suspects"), undefined)).status, 503);
  const report = { status: "mismatch" as const, liveRelease: 2, suspects: ["0xBAd0000000000000000000000000000000000Bad"], checkedAt: "2026-11-26T00:00:00.000Z" };
  const ok = await getSuspects(new Request("https://s/api/suspects"), async () => report);
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get("cache-control") ?? "", /s-maxage=30/);
  assert.deepEqual((await ok.json()).suspects, report.suspects);
  const bad = await getSuspects(new Request("https://s/api/suspects"), async () => { throw new Error("secret rpc url https://x"); });
  assert.equal(bad.status, 503);
  assert.doesNotMatch(await bad.text(), /secret|https/);
});

test("suspects loader: only an https site and a real gate address from env are accepted", () => {
  const ok = { HASHFRONT_SITE: "https://hashswap-demo.vercel.app/", HASHFRONT_GATE: GATE };
  assert.equal(typeof suspectsLoaderFromEnv(ok, []), "function");
  assert.equal(suspectsLoaderFromEnv({ ...ok, HASHFRONT_SITE: "http://hashswap-demo.vercel.app/" }, []), undefined);
  assert.equal(suspectsLoaderFromEnv({ ...ok, HASHFRONT_SITE: "not a url" }, []), undefined);
  assert.equal(suspectsLoaderFromEnv({ ...ok, HASHFRONT_GATE: "0x123" }, []), undefined);
  assert.equal(suspectsLoaderFromEnv({ HASHFRONT_GATE: GATE }, []), undefined);
});
