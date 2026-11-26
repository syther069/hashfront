// Isolated world, document_start. Gets the verdict from the background script, checks the page on its own, tells
// guard-main.js (page world) to block or allow, and shows the warning overlay.
(async function () {
  "use strict";
  const G = globalThis.HashfrontGuard;
  const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");

  const tell = (data) => window.dispatchEvent(new CustomEvent("hf-verdict", { detail: JSON.stringify(data) }));
  // The page-world script may or may not be listening yet, whichever way the browser orders the two content scripts.
  // Send the secret now, and again when it says hello, until it has acknowledged. After the acknowledgement a hello
  // is ignored, so a page script cannot ask for the secret later.
  let acked = false;
  const sendInit = () => window.dispatchEvent(new CustomEvent("hf-init", { detail: secret }));
  window.addEventListener("hf-ack", () => (acked = true));
  window.addEventListener("hf-hello", () => {
    if (!acked) sendInit();
  });
  sendInit();
  const allow = () => tell({ block: false, secret });

  let reply;
  try {
    reply = await chrome.runtime.sendMessage({ type: "status" });
  } catch {
    return allow(); // extension was reloaded: fail open, the page is not made worse by us
  }
  const status = reply && reply.status;
  const config = (reply && reply.config) || {};

  // The independent check: hash the page this browser actually gets from the host and compare it with the
  // approved hash, so a watcher that was shown a clean page does not decide for us.
  let local = null;
  if (status && status.status === "ok" && status.site === location.origin) {
    try {
      const res = await fetch(location.origin + "/", { cache: "no-store" });
      if (res.ok) local = await G.sha256Hex(await res.arrayBuffer());
    } catch {
      // cannot check: fall back to the feed alone
    }
  }

  const decision = G.decide(status, location.origin, local);
  if (!decision.block) return allow();
  tell({ block: true });
  showOverlay(decision.reason, G.safeSuspects(status), config, allow);

  function showOverlay(reason, suspects, cfg, lift) {
    const host = document.createElement("hashfront-guard");
    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent =
      ":host{all:initial}.box{position:fixed;inset:0;z-index:2147483647;background:#7f0000;color:#fff;font:16px/1.5 system-ui,sans-serif;" +
      "display:flex;align-items:center;justify-content:center;padding:24px}.in{max-width:640px}h1{margin:0 0 12px;font-size:28px}" +
      "a{color:#ffd9d9}ul{font-family:monospace;word-break:break-all}button{margin-top:16px;padding:8px 14px;font:inherit;background:transparent;color:#fff;border:1px solid #fff;border-radius:6px;cursor:pointer}";
    const box = document.createElement("div");
    box.className = "box";
    const inner = document.createElement("div");
    inner.className = "in";
    const h = document.createElement("h1");
    h.textContent = "This site does not match its approved release";
    const p = document.createElement("p");
    p.textContent =
      reason === "alert"
        ? "Hashfront reports an open alert for this site: it may have been hijacked. Signing and transactions are blocked here."
        : "The page your browser received is not the one the protocol's maintainers approved on chain. Signing and transactions are blocked here.";
    inner.append(h, p);
    if (suspects.length) {
      const s = document.createElement("p");
      s.textContent = "Addresses found only in the changed site (best effort, do not approve or send anything to them):";
      const ul = document.createElement("ul");
      for (const a of suspects) {
        const li = document.createElement("li");
        li.textContent = a;
        ul.append(li);
      }
      inner.append(s, ul);
    }
    const links = document.createElement("p");
    for (const [label, url] of [["Open the verified copy", cfg.verifiedCopyUrl], ["Status page", cfg.statusPageUrl]]) {
      if (typeof url !== "string" || !/^https:\/\//.test(url)) continue;
      const a = document.createElement("a");
      a.href = url;
      a.rel = "noopener noreferrer";
      a.textContent = label;
      links.append(a, document.createTextNode("   "));
    }
    const ignore = document.createElement("button");
    ignore.type = "button";
    ignore.textContent = "I understand the risk, let me sign anyway";
    ignore.addEventListener("click", (e) => {
      if (!e.isTrusted) return; // only a real click, never a script
      lift();
      host.remove();
    });
    inner.append(links, ignore);
    box.append(inner);
    root.append(style, box);
    document.documentElement.append(host);
  }
})();
