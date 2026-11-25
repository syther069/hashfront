// "Revoke all risky": one wallet confirmation when the wallet can batch (EIP-5792 wallet_sendCalls), else one
// confirmation per approval. The decision logic is kept free of React and wagmi so it can be tested with fakes.
import { concatHex, encodeFunctionData, erc20Abi, type Address, type Hex } from "viem";

export interface RevokeCall {
  token: Address;
  spender: Address;
}

export interface RevokeDeps {
  /** all calls in one wallet request; absent when the wallet or page cannot batch */
  batch?: (calls: { to: Address; data: Hex }[]) => Promise<void>;
  /** one approval, simulated first, then sent and awaited */
  one: (call: RevokeCall) => Promise<void>;
  progress?: (done: number, total: number) => void;
  /** ERC-8021 builder-code suffix appended to each call's data */
  dataSuffix?: Hex | undefined;
}

export type RevokeMode = "batch" | "sequential";

/** Some of the approvals were revoked before something failed; says how many, so nothing is silently skipped. */
export class PartialRevoke extends Error {
  override name = "PartialRevoke";
  done: number;
  total: number;
  mode: RevokeMode;
  constructor(done: number, total: number, mode: RevokeMode, cause: unknown) {
    super(`${done} of ${total} revoked: ${messageOf(cause)}`, { cause });
    this.done = done;
    this.total = total;
    this.mode = mode;
  }
}

export const messageOf = (e: unknown): string => (e instanceof Error ? (e.message.split("\n")[0] ?? e.message) : String(e));

/** The user said no in the wallet (EIP-1193 4001, or a wrapped error saying so). Falling back would ask again. */
export function isRejection(err: unknown): boolean {
  for (let e: unknown = err, depth = 0; e && depth < 5; depth++) {
    const o = e as { code?: unknown; name?: unknown; cause?: unknown };
    if (o.code === 4001 || o.name === "UserRejectedRequestError") return true;
    e = o.cause;
  }
  return false;
}

/** approve(spender, 0) calldata, with the builder-code suffix. ABI decoding ignores the trailing bytes. */
export function revokeData(spender: Address, suffix?: Hex): Hex {
  const data = encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [spender, 0n] });
  return suffix ? concatHex([data, suffix]) : data;
}

export async function revokeAll(calls: readonly RevokeCall[], deps: RevokeDeps): Promise<{ mode: RevokeMode; done: number }> {
  const total = calls.length;
  if (total === 0) return { mode: "sequential", done: 0 };
  if (deps.batch) {
    try {
      deps.progress?.(0, total);
      await deps.batch(calls.map((c) => ({ to: c.token, data: revokeData(c.spender, deps.dataSuffix) })));
      deps.progress?.(total, total);
      return { mode: "batch", done: total };
    } catch (err) {
      if (isRejection(err)) throw new PartialRevoke(0, total, "batch", err);
      // the wallet does not support wallet_sendCalls (or refused to batch these): fall back to one by one
    }
  }
  let done = 0;
  for (const c of calls) {
    deps.progress?.(done, total);
    try {
      await deps.one(c);
    } catch (err) {
      throw new PartialRevoke(done, total, "sequential", err);
    }
    done++;
  }
  deps.progress?.(total, total);
  return { mode: "sequential", done };
}
