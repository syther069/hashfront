// Everything the status page reads from chain, in one snapshot. Reuses the CLI's readers so the page and the CLI can
// never disagree about what a release's state is.
import { hexToBytes, type Address, type Hex, type PublicClient } from "viem";
import { processorAbi, releaseGateAbi } from "@hashfront/cli/abi";
import type { Context } from "@hashfront/cli/context";
import { readGateInfo, readPolicy, readRelease, type GateInfo, type ReleaseState } from "@hashfront/cli/gate";
import type { Target } from "./config.ts";

export const ALERT_KIND = { 1: "website mismatch", 2: "domain records changed", 3: "all clear" } as Record<number, string>;

export interface LastAlert {
  kind: number;
  at: bigint;
  release: bigint;
  observed: Hex;
}

export interface ReleaseRow extends ReleaseState {
  status: "live" | "previous" | "pending" | "cancelled";
  /** policy input bits as the gate computes them right now, and its verdict */
  bits?: number;
  wouldAllow?: boolean;
}

export interface Circuit {
  nIn: number;
  nOut: number;
  netlist: Uint8Array;
}

export interface Snapshot {
  info: GateInfo;
  releases: ReleaseRow[];
  lastAlert: LastAlert;
  circuit: Circuit;
  /** chain time of the snapshot, for timelock countdowns */
  now: bigint;
}

export function contextFor(t: Target, publicClient: PublicClient): Context {
  return { chain: t.chain, publicClient, walletClient: undefined, account: undefined, gate: t.gate, log: () => {} };
}

/** How many releases back from the newest the page shows. */
export const RECENT = 8;

export async function readSnapshot(ctx: Context): Promise<Snapshot> {
  const pc = ctx.publicClient;
  const info = await readGateInfo(ctx);
  const ids: bigint[] = [];
  for (let id = info.releaseCount; id >= 1n && ids.length < RECENT; id--) ids.push(id);

  const [releases, lastRaw, circuitInfo, netlist, block] = await Promise.all([
    Promise.all(ids.map((id) => readRow(ctx, id, info))),
    pc.readContract({ address: ctx.gate, abi: releaseGateAbi, functionName: "lastAlert" }),
    pc.readContract({ address: info.processor, abi: processorAbi, functionName: "circuitInfo", args: [info.policyId] }),
    pc.readContract({ address: info.processor, abi: processorAbi, functionName: "netlist", args: [info.policyId] }),
    pc.getBlock(),
  ]);
  const [kind, at, release, observed] = lastRaw;
  return {
    info,
    releases,
    lastAlert: { kind, at, release, observed },
    circuit: { nIn: Number(circuitInfo[0]), nOut: Number(circuitInfo[1]), netlist: hexToBytes(netlist) },
    now: block.timestamp,
  };
}

async function readRow(ctx: Context, id: bigint, info: GateInfo): Promise<ReleaseRow> {
  const r = await readRelease(ctx, id);
  const status: ReleaseRow["status"] = r.cancelled ? "cancelled" : r.activated ? (id === info.liveRelease ? "live" : "previous") : "pending";
  if (status !== "pending") return { ...r, status };
  const policy = await readPolicy(ctx, id);
  return { ...r, status, bits: policy.bits, wouldAllow: policy.allow };
}

/** Which maintainer slots have approved, as indexes 0..2. */
export function approvers(mask: number): number[] {
  return [0, 1, 2].filter((i) => mask & (1 << i));
}

export function slotOf(info: GateInfo, who: Address | undefined): number | undefined {
  if (!who) return undefined;
  const i = info.maintainers.findIndex((m) => m.toLowerCase() === who.toLowerCase());
  return i < 0 ? undefined : i;
}

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function ago(seconds: bigint): string {
  const s = Number(seconds);
  if (s < 90) return `${s}s`;
  if (s < 5400) return `${Math.round(s / 60)} min`;
  if (s < 172800) return `${Math.round(s / 3600)} h`;
  return `${Math.round(s / 86400)} days`;
}
