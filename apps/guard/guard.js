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
  if (status && (status.status === "ok" || status.status === "warn") && status.site === location.origin) {
    try {
      const res = await fetch(location.origin + "/", { cache: "no-store" });
      if (res.ok) local = await G.sha256Hex(await res.arrayBuffer());
    } catch {
      // cannot check: fall back to the feed alone
    }
  }

  const decision = G.decide(status, location.origin, local);
  if (decision.reason === "warn") showBanner(config, status.status === "warn");
  if (!decision.block) return allow();
  tell({ block: true });
  showOverlay(decision.reason, G.safeSuspects(status), config, allow);

  // A small bar at the top for an open alert on a page that matches its approved release. Signing is not blocked.
  function showBanner(cfg, matches) {
    const host = document.createElement("hashfront-guard-banner");
    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent =
      ":host{all:initial}" +
      ".bar{position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;padding:8px 16px;background:#2e2a1f;border-bottom:1px solid #e0a84f;color:#e8e2d3;font:14px/1.4 system-ui,-apple-system,'Segoe UI',sans-serif}" +
      "p{margin:0;flex:1 1 280px}" +
      "a{color:#f3d9a8}" +
      "button{min-height:32px;padding:0 12px;border-radius:6px;background:transparent;color:#e8e2d3;border:1px solid #8a7a55;font:inherit;cursor:pointer}";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.setAttribute("role", "status");
    bar.dataset.hfBanner = "warn";
    const p = document.createElement("p");
    p.textContent = matches
      ? "An alert is open for this site; the page currently matches its approved release. Check the status page. "
      : "An alert is open for this site, and it could not be verified right now. Check the status page before signing. ";
    if (typeof cfg.statusPageUrl === "string" && /^https:\/\//.test(cfg.statusPageUrl)) {
      const a = document.createElement("a");
      a.href = cfg.statusPageUrl;
      a.rel = "noopener noreferrer";
      a.textContent = "Status page";
      p.append(a);
    }
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Dismiss";
    close.addEventListener("click", () => host.remove());
    bar.append(p, close);
    root.append(style, bar);
    document.documentElement.append(host);
  }

  function showOverlay(reason, suspects, cfg, lift) {
    const host = document.createElement("hashfront-guard");
    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    // Same palette as the status page: #111114 base, #2E2E33 surface, #9A9AA3 accent, red only for the alert itself.
    style.textContent =
      ":host{all:initial}" +
      "*{box-sizing:border-box}" +
      ".box{position:fixed;inset:0;z-index:2147483647;background:#111114;color:#aeaeb3;font:16px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto}" +
      ".in{width:100%;max-width:560px;background:#1a1a1d;border:1px solid #ff6b5e;border-radius:16px;padding:32px}" +
      "svg{display:block;margin-bottom:16px;color:#ff6b5e}" +
      "h1{margin:0 0 8px;font-size:1.563rem;line-height:1.15;font-weight:600;color:#d3d3d8}" +
      "p{margin:0 0 16px}" +
      "ul{margin:0 0 16px;padding:0;list-style:none;font-family:ui-monospace,Consolas,monospace;font-size:.875rem;word-break:break-all;color:#d3d3d8}" +
      "li{padding:8px 0;border-bottom:1px solid #2e2e33}" +
      ".actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}" +
      "a,button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:8px;font:500 1rem/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;text-decoration:none;cursor:pointer}" +
      "a.primary{background:#9a9aa3;color:#111114;border:1px solid #9a9aa3}" +
      "a.secondary{background:#2e2e33;color:#d3d3d8;border:1px solid #6c6c75}" +
      "button{margin-top:16px;background:transparent;color:#aeaeb3;border:1px solid #6c6c75}" +
      "a:focus-visible,button:focus-visible{outline:2px solid #d3d3d8;outline-offset:2px}" +
      ".note{font-size:.8rem;color:#9a9aa3;margin:16px 0 0}";
    const box = document.createElement("div");
    box.className = "box";
    box.setAttribute("role", "alertdialog");
    box.setAttribute("aria-label", "This site does not match its approved release");
    const inner = document.createElement("div");
    inner.className = "in";
    // Iconoir "shield-alert" (MIT, https://iconoir.com)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    for (const [k, v] of [["width", "40"], ["height", "40"], ["viewBox", "0 0 24 24"], ["fill", "none"], ["stroke-width", "1.5"], ["aria-hidden", "true"]]) svg.setAttribute(k, v);
    for (const d of ["M12 7L12 12", "M12 16.01L12.01 15.9989", "M5 18L3.13036 4.91253C3.05646 4.39524 3.39389 3.91247 3.90398 3.79912L11.5661 2.09641C11.8519 2.03291 12.1481 2.03291 12.4339 2.09641L20.096 3.79912C20.6061 3.91247 20.9435 4.39524 20.8696 4.91252L19 18C18.9293 18.495 18.5 21.5 12 21.5C5.5 21.5 5.07071 18.495 5 18Z"]) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      for (const [k, v] of [["d", d], ["stroke", "currentColor"], ["stroke-linecap", "round"], ["stroke-linejoin", "round"]]) path.setAttribute(k, v);
      svg.append(path);
    }
    const h = document.createElement("h1");
    h.textContent = "This site does not match its approved release";
    const p = document.createElement("p");
    p.textContent =
      reason === "alert"
        ? "Hashfront reports an open alert for this site: it may have been hijacked. Signing and transactions are blocked here."
        : "The page your browser received is not the one the protocol's maintainers approved on chain. Signing and transactions are blocked here.";
    inner.append(svg, h, p);
    if (suspects.length) {
      const s = document.createElement("p");
      s.textContent = "Addresses found only in the changed site (best effort). Do not approve or send anything to them:";
      const ul = document.createElement("ul");
      for (const a of suspects) {
        const li = document.createElement("li");
        li.textContent = a;
        ul.append(li);
      }
      inner.append(s, ul);
    }
    const actions = document.createElement("div");
    actions.className = "actions";
    for (const [label, url, cls] of [["Open the verified copy", cfg.verifiedCopyUrl, "primary"], ["Status page", cfg.statusPageUrl, "secondary"]]) {
      if (typeof url !== "string" || !/^https:\/\//.test(url)) continue;
      const a = document.createElement("a");
      a.className = cls;
      a.href = url;
      a.rel = "noopener noreferrer";
      a.textContent = label;
      actions.append(a);
    }
    const ignore = document.createElement("button");
    ignore.type = "button";
    ignore.textContent = "I understand the risk, let me sign anyway";
    ignore.addEventListener("click", (e) => {
      if (!e.isTrusted) return; // only a real click, never a script
      lift();
      host.remove();
    });
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = "Hashfront Guard compared this page with the release approved on chain.";
    inner.append(actions, ignore, note);
    box.append(inner);
    root.append(style, box);
    document.documentElement.append(host);
  }
})();
