"use strict";
// guard-main.js is the code that really stops a signature, so it is tested as it ships: this file runs it against a
// fake window and a fake wallet. The list of methods that must be stopped is stated here, in the test.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");

const SOURCE = readFileSync(path.join(__dirname, "../guard-main.js"), "utf8");
const MUST_BLOCK = ["eth_sendTransaction", "eth_sendRawTransaction", "eth_sign", "personal_sign", "eth_signTypedData", "eth_signTypedData_v3", "eth_signTypedData_v4", "wallet_sendCalls", "wallet_sendTransaction"];
const MUST_PASS = ["eth_chainId", "eth_accounts", "eth_requestAccounts", "eth_call", "eth_getBalance", "wallet_switchEthereumChain"];

/** Runs guard-main.js in a fake page with a wallet at window.ethereum; returns helpers to drive it. */
function page() {
  const window = new EventTarget();
  const calls = [];
  window.ethereum = { request: async (a) => (calls.push(a.method), "ok") };
  const intervals = [];
  const fakeSetInterval = (fn) => (intervals.push(fn), 1);
  new Function("window", "CustomEvent", "setTimeout", "setInterval", "clearInterval", "globalThis", SOURCE)(window, CustomEvent, setTimeout, fakeSetInterval, () => {}, window);
  const send = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
  return { window, calls, send, intervals };
}

const SECRET = "s".repeat(64);
const verdict = (send, data) => send("hf-verdict", JSON.stringify(data));
const outcome = async (p, method) => {
  try {
    await p.window.ethereum.request({ method });
    return "sent";
  } catch (e) {
    return `rejected:${e.code}`;
  }
};

test("once blocked, every signing method is rejected with 4001 and never reaches the wallet; reads pass", async () => {
  const p = page();
  p.send("hf-init", SECRET);
  verdict(p.send, { block: true });
  for (const m of MUST_BLOCK) assert.equal(await outcome(p, m), "rejected:4001", m);
  for (const m of MUST_PASS) assert.equal(await outcome(p, m), "sent", m);
  assert.deepEqual(p.calls, MUST_PASS, "only the reads reached the wallet");
});

test("a verdict with the wrong secret, or none, never lifts a block", async () => {
  const p = page();
  p.send("hf-init", SECRET);
  verdict(p.send, { block: true });
  verdict(p.send, { block: false });
  verdict(p.send, { block: false, secret: "x".repeat(64) });
  assert.equal(await outcome(p, "eth_sendTransaction"), "rejected:4001");
  verdict(p.send, { block: false, secret: SECRET });
  assert.equal(await outcome(p, "eth_sendTransaction"), "sent", "the right secret lifts it");
});

test("only the first init counts: a page script cannot replace the secret", async () => {
  const p = page();
  p.send("hf-init", SECRET);
  p.send("hf-init", "y".repeat(64));
  verdict(p.send, { block: true });
  verdict(p.send, { block: false, secret: "y".repeat(64) });
  assert.equal(await outcome(p, "eth_sendTransaction"), "rejected:4001");
});

test("the page-world script says hello at start and acknowledges the secret, so either start order works", () => {
  const events = [];
  const window = new EventTarget();
  for (const n of ["hf-hello", "hf-ack"]) window.addEventListener(n, () => events.push(n));
  window.ethereum = { request: async () => "ok" };
  new Function("window", "CustomEvent", "setTimeout", "setInterval", "clearInterval", "globalThis", SOURCE)(window, CustomEvent, setTimeout, () => 1, () => {}, window);
  assert.deepEqual(events, ["hf-hello"]);
  window.dispatchEvent(new CustomEvent("hf-init", { detail: SECRET }));
  assert.deepEqual(events, ["hf-hello", "hf-ack"]);
  window.dispatchEvent(new CustomEvent("hf-init", { detail: "z".repeat(64) }));
  assert.deepEqual(events, ["hf-hello", "hf-ack"], "a second init is ignored and not acknowledged");
});

test("a wallet that appears after the script ran is wrapped too", async () => {
  const p = page();
  const late = { request: async () => "ok" };
  p.window.okxwallet = late; // set later: the script polls and also traps assignment on real pages
  p.intervals.forEach((fn) => fn());
  p.send("hf-init", SECRET);
  verdict(p.send, { block: true });
  assert.equal(await outcome({ window: { ethereum: p.window.okxwallet } }, "eth_sendTransaction"), "rejected:4001");
});
