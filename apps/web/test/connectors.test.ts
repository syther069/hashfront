import { test } from "node:test";
import assert from "node:assert/strict";
import { connectorLabel, visibleConnectors } from "../src/connectors.ts";

const generic = { id: "injected", type: "injected", name: "Injected" };
const okx = { id: "com.okex.wallet", type: "injected", name: "OKX Wallet" };
const meta = { id: "io.metamask", type: "injected", name: "MetaMask" };
const qr = { id: "okxConnect", type: "okxConnect", name: "OKX Wallet app (QR code)" };

test("with no named wallet announced, the generic browser wallet is kept", () => {
  assert.deepEqual(visibleConnectors([generic, qr]), [generic, qr]);
});

test("once named wallets exist the generic one is dropped, so there is no duplicate OKX Wallet and no mislabelled MetaMask", () => {
  assert.deepEqual(visibleConnectors([generic, okx, meta, qr]), [okx, meta, qr]);
});

test("the OKX Connect (QR) connector is never dropped", () => {
  assert.ok(visibleConnectors([generic, okx, qr]).includes(qr));
});

test("labels: the generic connector is a browser wallet, named ones keep their name", () => {
  assert.equal(connectorLabel(generic), "Browser wallet");
  assert.equal(connectorLabel(okx), "OKX Wallet");
});
