import type { Address, Hex } from "viem";
import { releaseGateAbi, siteRegistryAbi } from "./abi.ts";
import { UsageError } from "./chains.ts";
import type { Context } from "./context.ts";

export interface ReleaseState {
  id: bigint;
  root: Hex;
  proposedAt: bigint;
  sealedAt: bigint;
  totalChunks: number;
  uploadedChunks: number;
  /** approvals that count under the current maintainer epoch */
  approvals: number;
  approvalCount: number;
  cancelled: boolean;
  activated: boolean;
}

export interface FileState {
  size: number;
  sha256: Hex;
  chunkCount: number;
}

export interface GateInfo {
  registry: Address;
  container: Address;
  processor: Address;
  policyId: bigint;
  timelock: bigint;
  frozen: boolean;
  releaseCount: bigint;
  liveRelease: bigint;
  maintainers: [Address, Address, Address];
  uploader: Address;
  epoch: number;
  migrated: boolean;
}

export const stagedPath = (id: bigint, rel: string): string => `releases/v${id}/${rel}`;

export function approvalCount(mask: number): number {
  return (mask & 1) + ((mask >> 1) & 1) + ((mask >> 2) & 1);
}

export async function readGateInfo(ctx: Context): Promise<GateInfo> {
  const code = await ctx.publicClient.getCode({ address: ctx.gate });
  if (!code || code === "0x") throw new UsageError(`no contract at ${ctx.gate} on ${ctx.chain.name}`);

  const contract = { address: ctx.gate, abi: releaseGateAbi } as const;
  const pc = ctx.publicClient;
  const [registry, container, processor, policyId, timelock, frozen, releaseCount, liveRelease, uploader, m0, m1, m2, epoch, migrated] =
    await Promise.all([
      pc.readContract({ ...contract, functionName: "registry" }),
      pc.readContract({ ...contract, functionName: "container" }),
      pc.readContract({ ...contract, functionName: "processor" }),
      pc.readContract({ ...contract, functionName: "policyId" }),
      pc.readContract({ ...contract, functionName: "timelock" }),
      pc.readContract({ ...contract, functionName: "frozen" }),
      pc.readContract({ ...contract, functionName: "releaseCount" }),
      pc.readContract({ ...contract, functionName: "liveRelease" }),
      pc.readContract({ ...contract, functionName: "uploader" }),
      pc.readContract({ ...contract, functionName: "maintainers", args: [0n] }),
      pc.readContract({ ...contract, functionName: "maintainers", args: [1n] }),
      pc.readContract({ ...contract, functionName: "maintainers", args: [2n] }),
      pc.readContract({ ...contract, functionName: "epoch" }),
      pc.readContract({ ...contract, functionName: "migrated" }),
    ]);

  return {
    registry,
    container,
    processor,
    policyId,
    timelock,
    frozen,
    releaseCount,
    liveRelease,
    uploader,
    maintainers: [m0, m1, m2],
    epoch,
    migrated,
  };
}

export async function readRelease(ctx: Context, id: bigint): Promise<ReleaseState> {
  const contract = { address: ctx.gate, abi: releaseGateAbi } as const;
  const [release, epoch] = await Promise.all([
    ctx.publicClient.readContract({ ...contract, functionName: "releases", args: [id] }),
    ctx.publicClient.readContract({ ...contract, functionName: "epoch" }),
  ]);
  const [root, proposedAt, sealedAt, totalChunks, uploadedChunks, releaseEpoch, rawApprovals, cancelled, activated] = release;
  if (proposedAt === 0n) throw new UsageError(`release ${id} does not exist on gate ${ctx.gate}`);
  const approvals = releaseEpoch === epoch ? rawApprovals : 0; // rotation voids earlier approvals
  return {
    id,
    root,
    proposedAt,
    sealedAt,
    totalChunks,
    uploadedChunks,
    approvals,
    approvalCount: approvalCount(approvals),
    cancelled,
    activated,
  };
}

export async function readFile(ctx: Context, registry: Address, container: Address, fullPath: string): Promise<FileState> {
  const [size, , sha256, , chunkCount] = await ctx.publicClient.readContract({
    address: registry,
    abi: siteRegistryAbi,
    functionName: "fileInfo",
    args: [container, fullPath],
  });
  return { size, sha256, chunkCount: Number(chunkCount) };
}

export async function readPolicy(ctx: Context, id: bigint): Promise<{ bits: number; allow: boolean }> {
  const [bits, allow] = await Promise.all([
    ctx.publicClient.readContract({ address: ctx.gate, abi: releaseGateAbi, functionName: "policyBits", args: [id] }),
    ctx.publicClient.readContract({ address: ctx.gate, abi: releaseGateAbi, functionName: "wouldAllow", args: [id] }),
  ]);
  return { bits, allow };
}
