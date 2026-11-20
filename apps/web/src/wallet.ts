// wagmi setup: injected wallets only (OKX Wallet, or any EIP-6963 browser wallet). No WalletConnect, no remote
// connector code. Every transaction carries the X Layer Builder Code when VITE_BUILDER_CODE is set.
import { Attribution } from "ox/erc8021";
import { createConfig, fallback, http } from "wagmi";
import { injected } from "wagmi/connectors/injected";
import type { Hex } from "viem";
import type { Target } from "./config.ts";

export function wagmiConfigFor(t: Target) {
  return createConfig({
    chains: [t.chain],
    connectors: [injected()],
    transports: { [t.chain.id]: fallback(t.rpcUrls.map((url) => http(url))) },
    multiInjectedProviderDiscovery: true,
  });
}

const code = (import.meta.env.VITE_BUILDER_CODE as string | undefined)?.trim();
/** ERC-8021 attribution suffix appended to calldata, as the CLI does. */
export const dataSuffix: Hex | undefined = code ? Attribution.toDataSuffix({ codes: [code] }) : undefined;
