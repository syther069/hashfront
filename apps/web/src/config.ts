// Which gate this page shows, on which chain.
//
// A protocol's hosted status page has its gate baked in at build time (VITE_GATE), and then ignores the query
// string: a shared link must not be able to point the page at an attacker's lookalike gate or RPC. Without a baked
// gate (the generic page, local testing) the gate comes from ?gate=0x...&network=..., and a custom RPC is accepted
// only for the local test network.
import { createPublicClient, fallback, getAddress, http, isAddress, type Address, type Chain, type PublicClient } from "viem";
import { NETWORKS, type NetworkName } from "@hashfront/cli/chains";
import { dewebUrl as deweb } from "@hashfront/cli/snippets";

export interface Target {
  chain: Chain;
  network: NetworkName;
  gate: Address;
  rpcUrls: string[];
  /** true when the gate came from the build, not from the link */
  baked: boolean;
}

export type TargetResult = { ok: true; target: Target } | { ok: false; error: string };

const LOCAL_RPC = /^http:\/\/(127\.0\.0\.1|localhost):\d{1,5}\/?$/;

export function resolveTarget(search: string, env: Record<string, string | undefined> = import.meta.env): TargetResult {
  const q = new URLSearchParams(search);
  const baked = Boolean(env.VITE_GATE);
  const network = (baked ? env.VITE_NETWORK : (q.get("network") ?? env.VITE_NETWORK)) ?? "xlayer";
  if (!Object.hasOwn(NETWORKS, network)) return { ok: false, error: `Unknown network "${network}".` };
  const chain = NETWORKS[network as NetworkName];

  const gateRaw = baked ? env.VITE_GATE : q.get("gate");
  if (!gateRaw) return { ok: false, error: "No gate address. Open this page with ?gate=0x… (the protocol's ReleaseGate)." };
  if (!isAddress(gateRaw, { strict: false })) return { ok: false, error: `Not an address: ${gateRaw}` };

  let rpcUrls: string[] = [...chain.rpcUrls.default.http];
  const rpc = baked ? env.VITE_RPC_URL : (q.get("rpc") ?? env.VITE_RPC_URL);
  if (rpc) {
    if (network !== "local" && !baked) return { ok: false, error: "A custom RPC in the link is only accepted for the local test network." };
    if (network === "local" && !LOCAL_RPC.test(rpc)) return { ok: false, error: "The local network RPC must be http://127.0.0.1:<port>." };
    rpcUrls = [rpc];
  }
  return { ok: true, target: { chain, network: network as NetworkName, gate: getAddress(gateRaw), rpcUrls, baked } };
}

export function publicClientFor(t: Target): PublicClient {
  return createPublicClient({
    chain: t.chain,
    transport: fallback(t.rpcUrls.map((url) => http(url, { retryCount: 2, timeout: 20_000 }))),
  }) as PublicClient;
}

/** The verified DeWEB copy: https://<policy circuit id>-2-409.tapekit.org/ (X Layer mainnet only). */
export function dewebUrl(t: Target, policyId: bigint): string | undefined {
  return t.chain.id === 196 ? deweb(policyId) : undefined;
}

/** Same page with the same target, for links and the badge snippet. */
export function linkFor(t: Target, path: string, origin = window.location.origin + window.location.pathname.replace(/[^/]*$/, "")): string {
  if (t.baked) return `${origin}${path}`;
  const q = new URLSearchParams({ gate: t.gate, network: t.network });
  if (t.network === "local" && t.rpcUrls[0]) q.set("rpc", t.rpcUrls[0]);
  const [file, hash] = path.split("#");
  return `${origin}${file ?? ""}?${q.toString()}${hash !== undefined ? `#${hash}` : ""}`;
}
