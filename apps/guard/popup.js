chrome.runtime.sendMessage({ type: "status" }).then((reply) => {
  const status = reply && reply.status;
  const state = document.getElementById("state");
  if (!status) {
    state.textContent = "Status unavailable. Nothing is blocked.";
  } else if (status.status === "alert") {
    state.textContent = "ALERT: " + status.site + " does not match its approved release.";
    state.className = "alert";
  } else if (status.status === "warn" || status.alertOpen === true) {
    state.textContent =
      status.status === "warn"
        ? "WARNING: an alert is open for " + status.site + ", but it currently matches release v" + status.liveRelease + ". Nothing is blocked; check the status page."
        : "WARNING: an alert is open for " + status.site + " and the site could not be verified right now. Check the status page before signing.";
    state.className = "warn";
  } else if (status.status === "ok") {
    state.textContent = "OK: " + status.site + " matches release v" + status.liveRelease + ".";
    state.className = "ok";
  } else {
    state.textContent = "Unknown: the site could not be verified right now. Nothing is blocked.";
  }
  if (status && status.liveRelease) document.getElementById("release").textContent = "Checked " + status.checkedAt;
  const url = reply && reply.config && reply.config.statusPageUrl;
  if (typeof url === "string" && /^https:\/\//.test(url)) document.getElementById("page").href = url;
}, () => undefined);
