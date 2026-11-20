import { defineChain, type Chain } from "viem";
import { foundry } from "viem/chains";

// Network details from the X Layer docs (Build on X Layer → Network information, Builder Codes integration).
export const xlayer = defineChain({
  id: 196,
  name: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.xlayer.tech", "https://xlayerrpc.okx.com"] } },
  blockExplorers: { default: { name: "OKLink", url: "https://www.oklink.com/xlayer" } },
});

export const xlayerTestnet = defineChain({
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: { default: { http: ["https://testrpc.xlayer.tech/terigon", "https://xlayertestrpc.okx.com/terigon"] } },
  blockExplorers: { default: { name: "OKLink", url: "https://www.oklink.com/x-layer-testnet" } },
  testnet: true,
});

export const NETWORKS = {
  xlayer,
  "xlayer-testnet": xlayerTestnet,
  local: foundry,
} as const satisfies Record<string, Chain>;

export type NetworkName = keyof typeof NETWORKS;

export function resolveNetwork(name: string): Chain {
  if (!Object.hasOwn(NETWORKS, name)) {
    throw new UsageError(`unknown network "${name}" (expected one of: ${Object.keys(NETWORKS).join(", ")})`);
  }
  return NETWORKS[name as NetworkName];
}

export function txUrl(chain: Chain, hash: string): string | undefined {
  const base = chain.blockExplorers?.default.url;
  return base ? `${base}/tx/${hash}` : undefined;
}

/** Errors caused by bad input; printed without a stack trace. */
export class UsageError extends Error {
  override name = "UsageError";
}
