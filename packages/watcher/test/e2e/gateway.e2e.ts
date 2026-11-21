// Alerts through the OKX Onchain Gateway, end to end on a LOCAL anvil chain (nothing leaves this machine):
// the real ReleaseGate, the real watcher alert sender, and a local stand-in for the OKX API that checks every
// request's HMAC signature exactly as OKX documents it, then relays the signed transaction to anvil.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { decodeEventLog, type Hex } from "viem";
import { Attribution } from "ox/erc8021";
import { releaseGateAbi } from "@hashfront/cli/abi";
import { createContext } from "@hashfront/cli/context";
import { OkxClient, sign } from "@hashfront/okx/client";
import { KEYS, startHarness, type Harness } from "../../../cli/test/e2e/harness.ts";
import { sendTapeSend } from "../../src/alerts/tapesend.ts";

const CREDS = { apiKey: "e2e-key", secretKey: "e2e-secret", passphrase: "e2e-pass" };
const OBSERVED = `0x${"42".repeat(32)}` as Hex;

let h: Harness;
let okxServer: Server;
let okxUrl: string;
const calls: string[] = [];
let mode: "ok" | "sim-fails" | "down" = "ok";

before(async () => {
  h = await startHarness({ port: 8561, timelock: 600 });
  okxServer = createServer((req, res) => {
    let body = "";
    req.on("data", (c: Buffer) => (body += c));
    req.on("end", async () => {
      const path = req.url ?? "/";
      const ts = String(req.headers["ok-access-timestamp"]);
      const expected = sign(CREDS.secretKey, ts, req.method ?? "GET", path, body);
      const reply = (status: number, data: unknown, code = "0") => res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify({ code, msg: "", data }));
      if (req.headers["ok-access-key"] !== CREDS.apiKey || req.headers["ok-access-passphrase"] !== CREDS.passphrase || req.headers["ok-access-sign"] !== expected) {
        return reply(401, [], "50113");
      }
      const p = path.split("?")[0]!;
      calls.push(p);
      if (mode === "down") return reply(503, []);
      if (p.endsWith("/simulate")) return reply(200, [{ gasUsed: "200000", failReason: mode === "sim-fails" ? "execution reverted" : "", risks: [] }]);
      if (p.endsWith("/gas-price")) return reply(200, [{ normal: "2000000000", min: "1000000000", max: "3000000000", supportEip1559: false }]);
      if (p.endsWith("/broadcast-transaction")) {
        const { signedTx } = JSON.parse(body) as { signedTx: Hex };
        // the same bytes also go out over the RPC, so the node may already know them: that is a success too
        await h.rpcCall("eth_sendRawTransaction", [signedTx]).catch((e: Error) => {
          if (!/nonce too low|already known/i.test(e.message)) throw e;
        });
        return reply(200, [{ orderId: "okx-order-1" }]);
      }
      return reply(404, [], "404");
    });
  });
  await new Promise<void>((r) => okxServer.listen(0, "127.0.0.1", r));
  okxUrl = `http://127.0.0.1:${(okxServer.address() as AddressInfo).port}`;
});

after(async () => {
  okxServer?.close();
  await h?.stop();
});

const reporterCtx = () => {
  process.env.HASHFRONT_BUILDER_CODE = "15ld85k6825od6yr";
  return createContext({ network: "local", gate: h.gate, rpcUrl: h.rpc, needsSigner: true, privateKey: KEYS.uploader }); // uploader = reporter here
};
const okx = () => new OkxClient(CREDS, { baseUrl: okxUrl, sleep: async () => {} });

async function alertEvents(): Promise<number> {
  const ctx = reporterCtx();
  const logs = await ctx.publicClient.getLogs({ address: h.gate, fromBlock: 0n });
  return logs.filter((l) => {
    try {
      return decodeEventLog({ abi: releaseGateAbi, data: l.data, topics: l.topics }).eventName === "Alert";
    } catch {
      return false;
    }
  }).length;
}

test("an alert goes out through the OKX gateway: simulated, priced, signed locally, broadcast, with the Builder Code", async () => {
  mode = "ok";
  calls.length = 0;
  const ctx = reporterCtx();
  const r = await sendTapeSend(ctx, 1, OBSERVED, [], okx());
  assert.equal(r.route, "okx-gateway+rpc");
  assert.equal(r.orderId, "okx-order-1");
  assert.deepEqual(calls, ["/api/v6/dex/pre-transaction/simulate", "/api/v6/dex/pre-transaction/gas-price", "/api/v6/dex/pre-transaction/broadcast-transaction"]);
  const tx = await ctx.publicClient.getTransaction({ hash: r.tx });
  assert.equal(tx.gasPrice, 2_000_000_000n, "priced by the gateway");
  assert.deepEqual(Attribution.fromData(tx.input)?.codes, ["15ld85k6825od6yr"]);
  assert.equal(await alertEvents(), 1, "one alert, even though OKX and the RPC both broadcast it");
});

test("a failed OKX simulation never broadcasts through the gateway; the RPC path decides", async () => {
  mode = "sim-fails";
  calls.length = 0;
  const r = await sendTapeSend(reporterCtx(), 3, OBSERVED, [], okx());
  assert.equal(r.route, "rpc");
  assert.ok(!calls.includes("/api/v6/dex/pre-transaction/broadcast-transaction"));
  assert.equal(await alertEvents(), 2);
});

test("OKX down: the alert still goes out over the RPC", async () => {
  mode = "down";
  const r = await sendTapeSend(reporterCtx(), 1, OBSERVED, [], okx());
  assert.equal(r.route, "rpc");
  assert.equal(await alertEvents(), 3);
});
