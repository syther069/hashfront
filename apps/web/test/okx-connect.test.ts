import { test } from "node:test";
import assert from "node:assert/strict";
import { okxConnect } from "../src/okxConnect.ts";

const ADDR = "0xa45100b86a94de8ff90b25e45ff80a75cf7cc59a";
const CHECKSUM = "0xA45100B86A94de8Ff90B25e45FF80a75Cf7Cc59A";

interface Connector {
  getProvider(): Promise<unknown>;
  isAuthorized(): Promise<boolean>;
  connect(p: { chainId: number }): Promise<unknown>;
}

function setup(accounts: string[] = [`eip155:196:${ADDR}`]) {
  const calls: { args: unknown; chain: unknown }[] = [];
  const listeners: (() => void)[] = [];
  let loads = 0;
  let connected = true;
  const ui = {
    connected: () => connected,
    requestAccountsWithNamespace: () => accounts,
    request: async (args: unknown, chain: unknown) => (calls.push({ args, chain }), "0xhash"),
    on: (_e: string, fn: () => void) => void listeners.push(fn),
    openModal: async () => undefined,
    disconnect: async () => void (connected = false),
  };
  const emitted: string[] = [];
  const config = { chains: [{ id: 196, rpcUrls: { default: { http: ["https://rpc.example"] } } }], emitter: { emit: (e: string) => void emitted.push(e) } };
  const make = okxConnect as unknown as (l: () => Promise<unknown>) => (c: unknown) => Connector;
  const connector = make(async () => (loads++, ui))(config);
  return { connector, calls, listeners, emitted, loads: () => loads };
}
const provider = async (c: ReturnType<typeof setup>["connector"]) => (await c.getProvider()) as { request: (a: { method: string; params?: unknown }) => Promise<unknown> };

test("accounts: a CAIP-10 or plain address from the SDK comes back as one checksummed address", async () => {
  for (const raw of [`eip155:196:${ADDR}`, ADDR]) {
    const { connector } = setup([raw]);
    assert.deepEqual(await (await provider(connector)).request({ method: "eth_accounts" }), [CHECKSUM]);
  }
});

test("only wallet methods go to the phone: anything else is refused with 4200 and never reaches the SDK", async () => {
  const { connector, calls } = setup();
  const p = await provider(connector);
  await assert.rejects(p.request({ method: "eth_call", params: [] }), { code: 4200 });
  assert.equal(calls.length, 0);
  await p.request({ method: "eth_sendTransaction", params: [{ to: ADDR }] });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.chain, "eip155:196");
});

test("on page load the SDK is not loaded unless this connector was connected before", async () => {
  const { connector, loads } = setup();
  assert.equal(await connector.isAuthorized(), false);
  assert.equal(loads(), 0, "no SDK load, so no request to OKX's relay for visitors who never asked for it");
});

test("connecting twice adds one disconnect listener, so one disconnect is announced once", async () => {
  const { connector, listeners, emitted } = setup();
  await connector.connect({ chainId: 196 });
  await connector.connect({ chainId: 196 });
  assert.equal(listeners.length, 1);
  listeners[0]!();
  assert.deepEqual(emitted, ["disconnect"]);
});
