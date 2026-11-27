// Pure helpers of the Hashfront Guard. Plain JS, no build step. It loads as a classic script in the extension
// (exposes globalThis.HashfrontGuard) and as a CommonJS module under `node --test`.
(function (root) {
  "use strict";

  /** lowercase hex sha256 with a 0x prefix, the same notation as the release manifest */
  async function sha256Hex(bytes) {
    const digest = await root.crypto.subtle.digest("SHA-256", bytes);
    return "0x" + Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * The verdict for one page load.
   * @param status the /api/status feed (or null when it could not be read)
   * @param origin location.origin of the page
   * @param localRootHash sha256 of the index.html this browser just fetched (or null when that failed)
   * @returns {{block: boolean, reason: string}} reason is "alert" | "hash" | "warn" | "ok" | "unknown" | "other-site".
   *   "warn" never blocks: an onchain alert is open but the server sees the approved release, so the page shows a
   *   banner only. A stale or false alert (a stolen reporter key) can warn users, never lock them out of the real site.
   */
  function decide(status, origin, localRootHash) {
    if (!status || typeof status !== "object" || typeof status.site !== "string") return { block: false, reason: "unknown" };
    if (status.site !== origin) return { block: false, reason: "other-site" };
    if (status.status === "alert") return { block: true, reason: "alert" };
    // Our own hash check only counts when the server saw a clean match (ok, or warn: an alert is open but the site
    // matches). While the host is merely behind a release or a CDN, the two legitimately differ and blocking would
    // be a false alarm.
    const matched = status.status === "ok" || status.status === "warn";
    if (matched && typeof status.rootHash === "string" && status.rootHash && localRootHash && localRootHash !== status.rootHash.toLowerCase()) {
      return { block: true, reason: "hash" };
    }
    if (status.status === "warn") return { block: false, reason: "warn" };
    return { block: false, reason: status.status === "ok" ? "ok" : "unknown" };
  }

  /** Addresses from the feed that are safe to show: only well-formed ones, so a bad feed cannot inject text. */
  function safeSuspects(status) {
    const list = status && Array.isArray(status.suspects) ? status.suspects : [];
    return list.filter((a) => typeof a === "string" && /^0x[0-9a-fA-F]{40}$/.test(a)).slice(0, 5);
  }

  const api = { sha256Hex, decide, safeSuspects };
  root.HashfrontGuard = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
