import { test } from "node:test";
import assert from "node:assert/strict";
import type { PublicClient } from "viem";
import { OkxClient } from "@hashfront/okx/client";
import { checkReporterGas } from "../src/alerts/gas.ts";
import { emptyState, step, type Observation } from "../src/alerts/incident.ts";

const REPORTER = "0xeC8b730F7E9F69e53FE257473c4809Ef93dc46de";
const rpc = (balance: bigint, gasPrice: bigint) => ({ getBalance: async () => balance, getGasPrice: async () => gasPrice }) as unknown as PublicClient;

/** OKX answers balance and gas price with the shapes recorded live on X Layer. */
function okxAnswering(rawBalance: string, normal: string) {
  const f = (async (url: string) => {
    const data = url.includes("token-balances")
      ? [{ tokenAssets: [{ chainIndex: "196", symbol: "OKB", rawBalance, tokenContractAddress: "" }] }]
      : [{ normal, min: normal, max: normal, supportEip1559: false }];
    return new Response(JSON.stringify({ code: "0", msg: "", data }));
  }) as unknown as typeof fetch;
  return new OkxClient({ apiKey: "k", secretKey: "s", passphrase: "p" }, { fetch: f, sleep: async () => {} });
}

test("gas guard via OKX: the reporter's live balance (0.0000408 OKB) covers 3 alerts at 0.022 gwei", async () => {
  const g = await checkReporterGas(rpc(0n, 0n), REPORTER, okxAnswering("40809599540480", "22000001"));
  assert.equal(g.via, "okx-api");
  assert.equal(g.reserveWei, 3n * 300_000n * 22000001n);
  assert.equal(g.low, false);
});

test("gas guard: low when fewer than 3 alerts are left", async () => {
  const g = await checkReporterGas(rpc(0n, 0n), REPORTER, okxAnswering("1000000000000", "22000001"));
  assert.equal(g.low, true);
});

test("gas guard falls back to the RPC when OKX fails or has no keys", async () => {
  const broken = new OkxClient({ apiKey: "k", secretKey: "s", passphrase: "p" }, {
    fetch: (async () => new Response("down", { status: 503 })) as unknown as typeof fetch,
    sleep: async () => {},
  });
  const viaRpc = await checkReporterGas(rpc(10n ** 15n, 20_000_000n), REPORTER, broken);
  assert.equal(viaRpc.via, "rpc");
  assert.equal(viaRpc.low, false);
  assert.equal((await checkReporterGas(rpc(1n, 20_000_000n), REPORTER)).low, true);
});

test("a low reporter raises one team notice, never a community alert", () => {
  const cfg = { confirm: 2, clear: 3, channels: ["telegram" as const, "tapesend" as const], teamChat: true };
  const o = (low: boolean): Observation => ({
    status: "MATCH",
    contentObserved: `0x${"1".repeat(64)}`,
    dnsAlert: false,
    dnsVerified: true,
    dnsUnknown: false,
    ctAlert: false,
    scanMalicious: false,
    reporterGasLow: low,
    at: new Date(),
  });
  let s = emptyState();
  const created: string[] = [];
  for (const low of [true, true, true, false, true]) {
    const r = step(s, o(low), cfg);
    s = r.state;
    created.push(...r.created.map((m) => `${m.audience}:${m.kind}`));
  }
  assert.deepEqual(created, ["team:reporter-gas-low", "team:reporter-gas-low"]);
});
