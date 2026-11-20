// "Protected by Hashfront" badge for an iframe on the protocol's site. React-free and tiny: three reads from chain,
// then one line of text linking to the full status page. It refreshes every minute.
import { parseAbi } from "viem";
import { linkFor, publicClientFor, resolveTarget } from "./config.ts";
import "./badge.css";

// only what the badge reads, so the iframe stays a few KB instead of loading the full gate ABI
const releaseGateAbi = parseAbi([
  "function liveRelease() view returns (uint256)",
  "function frozen() view returns (bool)",
  "function lastAlert() view returns (uint8 kind, uint64 at, uint64 release, bytes32 observed)",
]);

const a = document.getElementById("badge") as HTMLAnchorElement;
const text = document.getElementById("text") as HTMLSpanElement;

function show(state: "ok" | "alert" | "error", label: string) {
  a.dataset.state = state;
  text.textContent = label;
}

const result = resolveTarget(window.location.search);
if (!result.ok) {
  show("error", "Hashfront: not configured");
} else {
  const t = result.target;
  const client = publicClientFor(t);
  a.href = linkFor(t, "index.html#/");
  const refresh = async () => {
    try {
      const gate = { address: t.gate, abi: releaseGateAbi } as const;
      const [live, frozen, last] = await Promise.all([
        client.readContract({ ...gate, functionName: "liveRelease" }),
        client.readContract({ ...gate, functionName: "frozen" }),
        client.readContract({ ...gate, functionName: "lastAlert" }),
      ]);
      const kind = last[0];
      if (kind === 1 || kind === 2) show("alert", `Hashfront ALERT: ${kind === 1 ? "site mismatch" : "DNS changed"}`);
      else if (frozen) show("alert", "Hashfront: releases frozen");
      else show("ok", live === 0n ? "Protected by Hashfront" : `Protected by Hashfront · v${live}`);
    } catch {
      show("error", "Hashfront: status unavailable");
    }
  };
  void refresh();
  setInterval(() => void refresh(), 60_000);
}
