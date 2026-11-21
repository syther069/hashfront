import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { credentialsFromEnv, OkxClient, OkxError, sign } from "../src/client.ts";
import * as okx from "../src/endpoints.ts";
import { classifyPages, parseAllowed } from "../src/risk.ts";
import type { ApprovalPage, GasPrice, TokenBalanceGroup, TokenPrice, TxScanResult } from "../src/types.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = async <T>(name: string) => JSON.parse(await readFile(path.join(here, "fixtures", `${name}.json`), "utf8")) as T;

const CREDS = { apiKey: "test-api-key-123", secretKey: "test-secret-xyz", passphrase: "test-pass-!@#" };
const NOW = new Date("2026-11-21T10:00:00.123Z");

interface Seen {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

/** A fake OKX server: records requests and answers with the given responses in order. */
function fakeFetch(responses: (Response | Error)[]) {
  const seen: Seen[] = [];
  const f = (async (url: string, init: RequestInit) => {
    seen.push({ url, method: init.method ?? "GET", headers: init.headers as Record<string, string>, ...(init.body ? { body: String(init.body) } : {}) });
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as typeof fetch;
  return { f, seen };
}
const ok = (data: unknown) => new Response(JSON.stringify({ code: "0", msg: "", data }), { status: 200 });
const client = (f: typeof fetch) => new OkxClient(CREDS, { fetch: f, now: () => NOW, sleep: async () => {} });

test("signature: Base64(HMAC-SHA256(secret, timestamp + METHOD + path?query + body)), as the OKX docs define", () => {
  const expected = createHmac("sha256", "s3cret").update("2026-11-21T10:00:00.123ZGET/api/v6/dex/pre-transaction/gas-price?chainIndex=196").digest("base64");
  assert.equal(sign("s3cret", "2026-11-21T10:00:00.123Z", "get", "/api/v6/dex/pre-transaction/gas-price?chainIndex=196"), expected);
});

test("GET signs the path with its query string and sends the four OK-ACCESS headers", async () => {
  const { f, seen } = fakeFetch([ok(await fixture("gas-price"))]);
  const data = await okx.gasPrice(client(f));
  assert.equal((data as GasPrice[])[0]?.normal, "22000001");
  const r = seen[0]!;
  assert.equal(r.url, "https://web3.okx.com/api/v6/dex/pre-transaction/gas-price?chainIndex=196");
  assert.equal(r.headers["OK-ACCESS-KEY"], CREDS.apiKey);
  assert.equal(r.headers["OK-ACCESS-PASSPHRASE"], CREDS.passphrase);
  assert.equal(r.headers["OK-ACCESS-TIMESTAMP"], NOW.toISOString());
  assert.equal(r.headers["OK-ACCESS-SIGN"], sign(CREDS.secretKey, NOW.toISOString(), "GET", "/api/v6/dex/pre-transaction/gas-price?chainIndex=196"));
});

test("POST signs the exact raw body and sends JSON", async () => {
  const { f, seen } = fakeFetch([ok(await fixture("dapp-scan"))]);
  assert.deepEqual(await okx.dappScan(client(f), "hashswap-demo.vercel.app"), { isMalicious: false });
  const r = seen[0]!;
  assert.equal(r.body, JSON.stringify({ source: "hashfront", url: "hashswap-demo.vercel.app" }));
  assert.equal(r.headers["Content-Type"], "application/json");
  assert.equal(r.headers["OK-ACCESS-SIGN"], sign(CREDS.secretKey, NOW.toISOString(), "POST", "/api/v6/security/dapp-scan", r.body));
});

test("request bodies match OKX's own CLI for every endpoint Hashfront uses", async () => {
  const tx = { from: "0x1", to: "0x2", data: "0xabcd" };
  const calls: [string, (c: OkxClient) => Promise<unknown>, unknown][] = [
    ["/api/v6/dex/pre-transaction/simulate", (c) => okx.simulate(c, tx), { chainIndex: "196", fromAddress: "0x1", toAddress: "0x2", txAmount: "0", extJson: { inputData: "0xabcd" } }],
    ["/api/v6/dex/pre-transaction/broadcast-transaction", (c) => okx.broadcast(c, "0xsigned", "0x1"), { signedTx: "0xsigned", chainIndex: "196", address: "0x1" }],
    ["/api/v6/dex/balance/token-balances-by-address", (c) => okx.tokenBalances(c, "0x1"), { address: "0x1", tokenContractAddresses: [{ chainIndex: "196", tokenContractAddress: "" }] }],
    ["/api/v6/security/approval-mng", (c) => okx.approvals(c, "0x1"), { nested: false, limit: 50, addressList: [{ chainIndex: "196", address: "0x1" }] }],
    ["/api/v6/security/transaction-scan/evm", (c) => okx.txScanEvm(c, { ...tx, value: "16" }), { source: "hashfront", from: "0x1", chainId: "196", to: "0x2", data: "0xabcd", value: "0x10" }],
    ["/api/v6/dex/market/price", (c) => okx.prices(c, ["0xABC"]), [{ chainIndex: "196", tokenContractAddress: "0xabc" }]],
  ];
  for (const [p, call, body] of calls) {
    const { f, seen } = fakeFetch([ok([])]);
    await call(client(f));
    assert.equal(new URL(seen[0]!.url).pathname, p);
    assert.deepEqual(JSON.parse(seen[0]!.body ?? "null"), body, p);
  }
});

test("retries 429, 5xx and network errors with backoff; then succeeds", async () => {
  const { f, seen } = fakeFetch([new Response("busy", { status: 429 }), new Error("ECONNRESET"), ok([{ gasLimit: "69647" }])]);
  const data = await okx.gasLimit(client(f), { from: "0x1", to: "0x2", data: "0x" });
  assert.deepEqual(data, [{ gasLimit: "69647" }]);
  assert.equal(seen.length, 3);
});

test("broadcast is never retried automatically", async () => {
  const { f, seen } = fakeFetch([new Response("busy", { status: 503 }), ok([])]);
  await assert.rejects(okx.broadcast(client(f), "0xsigned", "0x1"), OkxError);
  assert.equal(seen.length, 1);
});

test("an OKX error code throws OkxError with code and path, and never leaks a credential", async () => {
  const echo = new Response(JSON.stringify({ code: "50036", msg: `PARAM_EXCEPTION key=${CREDS.apiKey} secret=${CREDS.secretKey}`, data: [] }), { status: 200 });
  const { f } = fakeFetch([echo]);
  await assert.rejects(okx.dappScan(client(f), "x"), (e: OkxError) => {
    assert.equal(e.code, "50036");
    assert.equal(e.path, "/api/v6/security/dapp-scan");
    assert.ok(!e.message.includes(CREDS.apiKey) && !e.message.includes(CREDS.secretKey));
    assert.match(e.message, /<redacted>/);
    return true;
  });
});

test("read calls are cached for their TTL", async () => {
  const { f, seen } = fakeFetch([ok(await fixture("price"))]);
  const c = client(f);
  await okx.prices(c, [okx.NATIVE_PRICE_ADDRESS]);
  await okx.prices(c, [okx.NATIVE_PRICE_ADDRESS]);
  assert.equal(seen.length, 1);
});

test("credentials come from env only when all three are set", () => {
  assert.equal(credentialsFromEnv({ OKX_API_KEY: "a", OKX_SECRET_KEY: "b" }), undefined);
  assert.deepEqual(credentialsFromEnv({ OKX_API_KEY: " a ", OKX_SECRET_KEY: "b", OKX_API_PASSPHRASE: "c" }), { apiKey: "a", secretKey: "b", passphrase: "c" });
});

// ---------------------------------------------------------------- recorded X Layer responses (Nov 2026)
test("live fixtures: gas, balance, price and tx-scan have the fields Hashfront reads", async () => {
  const bal = await fixture<TokenBalanceGroup[]>("token-balances");
  const okb = bal[0]?.tokenAssets?.[0];
  assert.equal(okb?.symbol, "OKB");
  assert.match(okb?.rawBalance ?? "", /^\d+$/);
  const price = await fixture<TokenPrice[]>("price");
  assert.equal(price[0]?.tokenContractAddress, okx.NATIVE_PRICE_ADDRESS);
  assert.ok(Number(price[0]?.price) > 0);
  const scan = await fixture<TxScanResult>("tx-scan");
  assert.equal(scan.action, "");
  assert.deepEqual(scan.riskItemDetail, []);
});

test("approval risk: the protocol's router is trusted; the same approval to an unlisted EOA is flagged as eoa", async () => {
  const pages = await fixture<ApprovalPage[]>("approvals");
  const trusted = classifyPages(pages, parseAllowed("0xA1DA93A3fD135FC83E3B5f69dCb9d73babde5306"));
  assert.equal(trusted.length, 1);
  assert.equal(trusted[0]?.risk, "trusted");
  assert.equal(trusted[0]?.amount, "0.000001");
  const unlisted = classifyPages(pages, parseAllowed(""));
  assert.equal(unlisted[0]?.risk, "eoa");
  assert.match(unlisted[0]?.reasons.join() ?? "", /plain wallet/);
});

test("approval risk: OKX flags win, unlimited amounts are called out, revoked ones are dropped, bad rows ignored", () => {
  const base = { approvalAddress: "0x" + "b".repeat(40), tokenAddress: "0x" + "c".repeat(40), status: "1", remainAmount: "5", symbol: "T" };
  const rows = classifyPages(
    [
      {
        dataList: [
          { ...base, tags: "isEoa" },
          { ...base, vulnerabilityFlag: true, remainAmount: ((1n << 256n) - 1n).toString() },
          { ...base, status: "0" },
          { ...base, approvalAddress: "nope" },
        ],
      },
    ],
    new Set(),
  );
  assert.deepEqual(rows.map((r) => r.risk), ["flagged", "eoa"]);
  assert.equal(rows[0]?.amount, "unlimited");
  assert.match(rows[0]?.reasons.join() ?? "", /unlimited/);
});
