// Runs in the PAGE's JavaScript world at document_start, before any page script. It wraps wallet providers so that,
// while Hashfront says the site is hijacked, signing requests are rejected with EIP-1193 error 4001 (user rejected).
//
// Page scripts can read everything in this world, so the way back to "allowed" is guarded by a secret that guard.js
// (the isolated world) hands over in a single event before any page script has run. A hijacked page can ask for a
// block (harmless) but cannot lift one. It can still unwrap or avoid the wrap if it knows about the Guard and targets
// it; the Guard defends against generic drainers, not against an attacker built to beat it.
(function () {
  "use strict";
  const SIGNING = new Set([
    "eth_sendTransaction", "eth_sendRawTransaction", "eth_sign", "personal_sign", "eth_signTypedData",
    "eth_signTypedData_v3", "eth_signTypedData_v4", "wallet_sendCalls", "wallet_sendTransaction",
  ]);
  const HOLD_MS = 4000; // how long a signing request waits for the verdict before it is let through

  let secret = null;
  let verdict = "pending"; // "pending" | "block" | "allow"
  let release = () => {};
  const decided = new Promise((resolve) => (release = resolve));

  window.addEventListener("hf-init", (e) => {
    if (secret === null && typeof e.detail === "string" && e.detail.length >= 32) secret = e.detail;
  });
  window.addEventListener("hf-verdict", (e) => {
    let d;
    try {
      d = JSON.parse(e.detail);
    } catch {
      return;
    }
    if (d && d.block === true) verdict = "block";
    else if (d && d.block === false && secret !== null && d.secret === secret) verdict = "allow";
    else return;
    release(verdict);
  });

  async function currentVerdict() {
    if (verdict !== "pending") return verdict;
    const timeout = new Promise((resolve) => setTimeout(() => resolve("timeout"), HOLD_MS));
    const v = await Promise.race([decided, timeout]);
    return v === "timeout" ? verdict : v;
  }

  function wrap(provider) {
    if (!provider || typeof provider.request !== "function" || provider.__hashfrontGuard) return;
    const original = provider.request.bind(provider);
    const guarded = async function request(args) {
      if (args && SIGNING.has(args.method) && (await currentVerdict()) === "block") {
        const err = new Error("Hashfront Guard: this site does not match its approved release. Signing is blocked.");
        err.code = 4001;
        throw err;
      }
      return original(args);
    };
    try {
      Object.defineProperty(provider, "request", { value: guarded, configurable: true, writable: true });
      Object.defineProperty(provider, "__hashfrontGuard", { value: true });
    } catch {
      // a frozen provider cannot be wrapped; the Guard then cannot protect that wallet
    }
  }

  // window.ethereum and window.okxwallet (the demo dapp prefers the latter): wrap what is there, what is assigned later,
  // and what appears by other means (polled briefly)
  for (const name of ["ethereum", "okxwallet"]) {
    let current = window[name];
    wrap(current);
    try {
      Object.defineProperty(window, name, {
        configurable: true,
        get: () => current,
        set: (v) => {
          current = v;
          wrap(v);
        },
      });
    } catch {
      // the property is locked by something that ran before us
    }
  }
  let polls = 0;
  const poll = setInterval(() => {
    for (const name of ["ethereum", "okxwallet"]) {
      wrap(window[name]);
      if (Array.isArray(window[name] && window[name].providers)) window[name].providers.forEach(wrap);
    }
    if (++polls > 40) clearInterval(poll);
  }, 250);

  // EIP-6963: our listener is registered first, so the provider object is wrapped before the dapp sees the event
  window.addEventListener("eip6963:announceProvider", (e) => wrap(e.detail && e.detail.provider));
})();
