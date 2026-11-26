// The optional guardian pause: on a confirmed incident the watcher calls pause() on the protocol's own contract
// (see contracts/src/DemoVault.sol), once per incident, with a separate low-privilege key.
//
// What it can never do: unpause (only the contract's owner can), or move funds. It is refused on X Layer mainnet:
// one false positive pausing a live protocol is a liability, so this stays a fork and testnet feature.
import { encodeFunctionData, parseAbi, type Address, type Hex } from "viem";
import type { Context } from "@hashfront/cli/context";
import type { OkxClient } from "@hashfront/okx/client";
import { sendViaGateway } from "./gateway.ts";

export const guardianAbi = parseAbi([
  "function pause()",
  "function paused() view returns (bool)",
  "error AlreadyPaused()",
  "error NotGuardian()",
]);

export interface GuardianResult {
  tx?: Hex;
  route?: "okx-gateway+rpc" | "rpc";
  orderId?: string;
  /** the contract was already paused (by someone else, or by an earlier try): nothing to send */
  alreadyPaused?: boolean;
}

export const MAINNET_CHAIN_ID = 196;

/** Throws a message that says what to do when the guardian may not run here. */
export function assertGuardianAllowed(chainId: number): void {
  if (chainId === MAINNET_CHAIN_ID) {
    throw new Error("the guardian pause is for forks and testnets only and is not allowed on X Layer mainnet; remove --guardian-call and --guardian-account");
  }
}

/** Simulates pause(), then sends it: through the OKX Gateway when a client is given, else straight to the RPC. */
export async function pauseViaGuardian(ctx: Context, target: Address, okx?: OkxClient): Promise<GuardianResult> {
  assertGuardianAllowed(ctx.chain.id);
  if (!ctx.walletClient || !ctx.account) throw new Error("the guardian needs its own signer: --guardian-account <keystore> or HASHFRONT_GUARDIAN_PRIVATE_KEY");
  if (await ctx.publicClient.readContract({ address: target, abi: guardianAbi, functionName: "paused" })) return { alreadyPaused: true };

  // simulate first: a revert (not the guardian, wrong address) surfaces here, before any gas is spent
  const { request } = await ctx.publicClient.simulateContract({ address: target, abi: guardianAbi, functionName: "pause", account: ctx.account });

  if (okx) {
    const sent = await sendViaGateway(ctx, okx, target, encodeFunctionData({ abi: guardianAbi, functionName: "pause" }));
    if (sent) return sent;
  }
  // the RPC path: the wallet client appends the builder code itself
  const hash = await ctx.walletClient.writeContract(request);
  const receipt = await ctx.publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`pause() ${hash} reverted`);
  return { tx: hash, route: "rpc" };
}
