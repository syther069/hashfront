import { test } from "node:test";
import assert from "node:assert/strict";
import { OkxClient } from "@hashfront/okx/client";
import { dappScan, okxRestScan } from "../src/signals/onchainos.ts";

const creds = { apiKey: "k", secretKey: "s", passphrase: "p" };
const answering = (body: unknown, status = 200) =>
  new OkxClient(creds, { fetch: (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch, sleep: async () => {} });

test("OKX REST dapp-scan: clean, malicious and errors map exactly like the CLI", async () => {
  assert.deepEqual(await dappScan("x.example", okxRestScan(answering({ code: "0", msg: "", data: { isMalicious: false } }))), { status: "clean" });
  assert.deepEqual(await dappScan("x.example", okxRestScan(answering({ code: "0", msg: "", data: { isMalicious: true } }))), { status: "malicious" });
  const bad = await dappScan("x.example", okxRestScan(answering({ code: "50036", msg: "PARAM_EXCEPTION", data: [] })));
  assert.equal(bad.status, "unavailable");
  assert.match((bad as { reason: string }).reason, /^OKX API: OKX error 50036/);
  const down = await dappScan("x.example", okxRestScan(answering("oops", 503)));
  assert.equal(down.status, "unavailable");
});
