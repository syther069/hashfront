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
    const alert = status && status.status === "alert";
    const tabId = sender.tab && sender.tab.id;
    if (tabId !== undefined) {
      chrome.action.setBadgeText({ tabId, text: status ? (alert ? "ALERT" : "OK") : "" });
      chrome.action.setBadgeBackgroundColor({ tabId, color: alert ? "#c62828" : "#2e7d32" });
    }
  });
  return true; // async response
});
