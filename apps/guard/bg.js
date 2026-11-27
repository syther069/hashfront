// Background service worker: reads the Hashfront status feed (cached 20 s) for the content scripts and the popup,
// and shows OK or ALERT on the toolbar icon. The pages never fetch the feed themselves.
importScripts("config.js");

const ttl = () => (typeof self.HF_CONFIG.cacheMs === "number" ? self.HF_CONFIG.cacheMs : 20_000);
let cache = null; // { at, status }

async function readStatus() {
  if (cache && Date.now() - cache.at < ttl()) return cache.status;
  let status = null;
  try {
    const res = await fetch(self.HF_CONFIG.statusUrl, { cache: "no-store" });
    if (res.ok) status = await res.json();
  } catch {
    // feed unreachable: callers treat null as "unknown" and never block on it
  }
  cache = { at: Date.now(), status };
  return status;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== "status") return false;
  readStatus().then((status) => {
    sendResponse({ status, config: self.HF_CONFIG });
    const s = status && (status.status !== "alert" && status.alertOpen === true ? "warn" : status.status);
    const tabId = sender.tab && sender.tab.id;
    if (tabId !== undefined) {
      chrome.action.setBadgeText({ tabId, text: status ? (s === "alert" ? "ALERT" : s === "warn" ? "WARN" : s === "ok" ? "OK" : "?") : "" });
      chrome.action.setBadgeBackgroundColor({ tabId, color: s === "alert" ? "#c62828" : s === "warn" ? "#b26a00" : "#2e7d32" });
    }
  });
  return true; // async response
});
