// Sending a signed transaction through the OKX Onchain Gateway, shared by the onchain alert and the guardian pause.
import { concatHex, keccak256, type Address, type Hex } from "viem";
import { builderDataSuffix, type Context } from "@hashfront/cli/context";
import type { OkxClient } from "@hashfront/okx/client";
import { broadcast as okxBroadcast, gasPrice as okxGasPrice, simulate as okxSimulate } from "@hashfront/okx/endpoints";

export interface GatewaySent {
  tx: Hex;
  route: "okx-gateway+rpc";
  /** OKX Onchain Gateway order id, when the gateway accepted the broadcast */
  orderId?: string;
}

/**
 * Sends `call` (calldata, without the builder-code suffix) to `to` with the signer in `ctx`:
 * OKX simulates it first, the gateway prices it, and the locally signed bytes are broadcast through OKX and the RPC
 * at the same time. Same bytes, same hash: whichever path is faster wins, the other is a harmless duplicate.
 *
 * Returns undefined (so the caller uses its own RPC path) for anything that fails BEFORE the transaction is
 * broadcast. After broadcast it only waits: the transaction is out, so falling back would send it twice.
 * Throws if the mined transaction reverted.
 */
export async function sendViaGateway(ctx: Context, okx: OkxClient, to: Address, call: Hex): Promise<GatewaySent | undefined> {
  const account = ctx.account;
  if (!account || !("signTransaction" in account) || typeof account.signTransaction !== "function") return undefined;
  const suffix = builderDataSuffix();
  const data = suffix ? concatHex([call, suffix]) : call;
  let signed: Hex;
  try {
    // 1. OKX simulation: never broadcast a transaction that would revert
    const sim = (await okxSimulate(okx, { from: account.address, to, data }))[0] as { failReason?: string } | undefined;
    if (sim?.failReason) throw new Error(`OKX simulation: ${sim.failReason}`);
    // 2. price with the gateway; gas and nonce from the chain
    const gp = (await okxGasPrice(okx))[0]?.normal;
    const gasPrice = gp && /^\d+$/.test(gp) ? BigInt(gp) : await ctx.publicClient.getGasPrice();
    const [gas, nonce] = await Promise.all([
      ctx.publicClient.estimateGas({ account: account.address, to, data }),
      ctx.publicClient.getTransactionCount({ address: account.address, blockTag: "pending" }),
    ]);
    signed = await account.signTransaction({ to, data, gas: (gas * 12n) / 10n, gasPrice, nonce, chainId: ctx.chain.id, type: "legacy" });
  } catch {
    return undefined;
  }
  // 3. the same signed bytes through OKX and the RPC; either one is enough
  const tx = keccak256(signed);
  const [viaOkx, viaRpc] = await Promise.allSettled([okxBroadcast(okx, signed, account.address), ctx.publicClient.sendRawTransaction({ serializedTransaction: signed })]);
  if (viaOkx.status === "rejected" && viaRpc.status === "rejected") {
    // Both said no, but a timeout can hide a broadcast that went through. Only fall back once the chain has not
    // seen these exact bytes; otherwise the fallback would take the next nonce and send a second transaction.
    if (!(await seen(ctx, tx))) return undefined;
  }
  const receipt = await ctx.publicClient.waitForTransactionReceipt({ hash: tx, timeout: 120_000 });
  if (receipt.status !== "success") throw new Error(`transaction ${tx} reverted`);
  const orderId = viaOkx.status === "fulfilled" ? viaOkx.value[0]?.orderId : undefined;
  return { tx, route: "okx-gateway+rpc", ...(orderId ? { orderId } : {}) };
}

/** True if the node knows the transaction (mempool or mined), checked a few times over ~6 s. */
async function seen(ctx: Context, hash: Hex): Promise<boolean> {
  for (let i = 0; i < 3; i++) {
    try {
      await ctx.publicClient.getTransaction({ hash });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 2_000));
    }
  }
  return false;
}
