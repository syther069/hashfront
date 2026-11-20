import { readFile as readFs, writeFile } from "node:fs/promises";
import path from "node:path";
import { concatHex, decodeEventLog, formatEther, type Hex } from "viem";
import { releaseGateAbi, siteRegistryAbi } from "./abi.ts";
import { UsageError } from "./chains.ts";
import { sendGateTx, type Context } from "./context.ts";
import { approvalCount, readFile, readGateInfo, readPolicy, readRelease, stagedPath } from "./gate.ts";
import { buildManifest, CHUNK_SIZE, parseManifest, sha256Hex, splitChunks, type Manifest } from "./manifest.ts";

export async function loadManifest(file: string): Promise<Manifest> {
  let text: string;
  try {
    text = await readFs(file, "utf8");
  } catch (err) {
    throw new UsageError(`cannot read manifest ${file}: ${err instanceof Error ? err.message : String(err)}`);
  }
  try {
    return parseManifest(text);
  } catch (err) {
    throw new UsageError(`${file}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function sameRoot(a: Hex, b: Hex): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

// ----------------------------------------------------------------------------- manifest (offline)

export async function cmdManifest(dir: string, out: string): Promise<void> {
  const m = await buildManifest(dir);
  await writeFile(out, `${JSON.stringify(m, null, 2)}\n`);
  console.log(`manifest root ${m.root}`);
  console.log(`  ${m.files.length} files, ${m.totalBytes} bytes, ${m.totalChunks} chunks -> ${out}`);
}

// ----------------------------------------------------------------------------- propose (uploader)

export async function cmdPropose(ctx: Context, manifestFile: string): Promise<bigint> {
  const m = await loadManifest(manifestFile);
  ctx.log(`proposing manifest ${m.root} (${m.totalChunks} chunks)`);
  const hash = await sendGateTx(ctx, "propose", [m.root, m.totalChunks], "propose");

  const receipt = await ctx.publicClient.getTransactionReceipt({ hash });
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== ctx.gate.toLowerCase()) continue;
    const ev = decodeEventLog({ abi: releaseGateAbi, data: log.data, topics: log.topics, strict: false });
    if (ev.eventName === "Proposed" && ev.args.id !== undefined) {
      ctx.log(`release id ${ev.args.id}: needs 2 maintainer approvals before upload`);
      return ev.args.id;
    }
  }
  throw new Error(`no Proposed event in transaction ${hash}`);
}

// ----------------------------------------------------------------------------- approve / cancel (maintainer)

export async function cmdApprove(ctx: Context, id: bigint, manifestFile: string): Promise<void> {
  const m = await loadManifest(manifestFile);
  const release = await readRelease(ctx, id);
  if (!sameRoot(release.root, m.root) || release.totalChunks !== m.totalChunks) {
    throw new UsageError(
      `release ${id} on chain is ${release.root} (${release.totalChunks} chunks), but ${manifestFile} is ${m.root} (${m.totalChunks} chunks). Refusing to approve a build you did not review.`,
    );
  }
  if (release.cancelled) throw new UsageError(`release ${id} was cancelled`);
  await sendGateTx(ctx, "approve", [id, m.root, m.totalChunks], `approve release ${id}`);
}

export async function cmdCancel(ctx: Context, id: bigint): Promise<void> {
  await sendGateTx(ctx, "cancel", [id], `cancel release ${id}`);
}

// ----------------------------------------------------------------------------- upload (uploader)

export async function cmdUpload(ctx: Context, id: bigint, manifestFile: string, dir: string): Promise<void> {
  const m = await loadManifest(manifestFile);
  const release = await readRelease(ctx, id);

  if (!sameRoot(release.root, m.root)) throw new UsageError(`manifest root ${m.root} does not match release ${id} (${release.root})`);
  if (release.cancelled) throw new UsageError(`release ${id} was cancelled`);
  if (release.sealedAt !== 0n) throw new UsageError(`release ${id} is already sealed`);
  if (release.approvalCount < 2) {
    throw new UsageError(`release ${id} has ${release.approvalCount} of the 2 approvals needed before upload`);
  }

  ctx.log(`uploading ${m.totalChunks} chunks (${m.files.length} files) to releases/v${id}/`);
  let sent = 0;
  for (const file of m.files) {
    const data = await readFs(path.join(dir, file.path));
    if (sha256Hex(data) !== file.sha256) {
      throw new UsageError(`${file.path} changed since the manifest was built; rebuild the manifest`);
    }
    const parts = splitChunks(data);
    for (const chunk of file.chunks) {
      const written = await ctx.publicClient.readContract({
        address: ctx.gate,
        abi: releaseGateAbi,
        functionName: "chunkWritten",
        args: [id, chunk.leaf],
      });
      if (written) continue; // resumable: the gate records every accepted chunk

      const bytes = parts[chunk.index];
      if (bytes === undefined || sha256Hex(bytes) !== chunk.sha256) {
        throw new UsageError(`${file.path} chunk ${chunk.index} does not match the manifest`);
      }
      await sendGateTx(
        ctx,
        "writeChunk",
        [
          id,
          {
            path: file.path,
            contentType: file.contentType,
            fileSha256: file.sha256,
            index: BigInt(chunk.index),
            data: toHex(bytes),
            proof: chunk.proof,
          },
        ],
        `${file.path} [${chunk.index + 1}/${file.chunks.length}]`,
      );
      sent++;
    }
  }
  ctx.log(`upload complete (${sent} transactions)`);
}

function toHex(bytes: Uint8Array): Hex {
  return `0x${Buffer.from(bytes).toString("hex")}`;
}

// ----------------------------------------------------------------------------- verify (anyone)

/**
 * Re-reads every staged file from the site registry and re-hashes the bytes.
 * The registry stores the declared sha256 without checking it, so this is the real integrity check.
 */
export async function cmdVerify(ctx: Context, id: bigint, manifestFile: string): Promise<boolean> {
  const m = await loadManifest(manifestFile);
  const info = await readGateInfo(ctx);
  let ok = true;
  for (const file of m.files) {
    const full = stagedPath(id, file.path);
    const meta = await readFile(ctx, info.registry, info.container, full);
    const parts: Hex[] = [];
    for (let offset = 0; offset < meta.size; offset += CHUNK_SIZE) {
      parts.push(
        await ctx.publicClient.readContract({
          address: info.registry,
          abi: siteRegistryAbi,
          functionName: "readRange",
          args: [info.container, full, BigInt(offset), BigInt(CHUNK_SIZE)],
        }),
      );
    }
    const stored = Buffer.from(concatHex(parts.length > 0 ? parts : ["0x"]).slice(2), "hex");
    const problems: string[] = [];
    if (meta.chunkCount !== file.chunks.length) problems.push(`chunks ${meta.chunkCount}/${file.chunks.length}`);
    if (meta.size !== file.size) problems.push(`size ${meta.size}/${file.size}`);
    if (!sameRoot(meta.sha256, file.sha256)) problems.push("declared sha256 differs");
    if (sha256Hex(stored) !== file.sha256) problems.push("stored bytes do not hash to the manifest sha256");
    if (problems.length > 0) {
      ok = false;
      ctx.log(`  MISMATCH ${file.path}: ${problems.join(", ")}`);
    }
  }
  ctx.log(ok ? `release ${id}: all ${m.files.length} files match the manifest byte for byte` : `release ${id}: files do not match the manifest`);
  return ok;
}

// ----------------------------------------------------------------------------- seal / activate

export async function cmdSeal(ctx: Context, id: bigint, manifestFile: string): Promise<void> {
  if (!(await cmdVerify(ctx, id, manifestFile))) {
    throw new UsageError(`refusing to seal release ${id}: stored files differ from the manifest`);
  }
  await sendGateTx(ctx, "seal", [id], `seal release ${id}`);
}

export async function cmdActivate(ctx: Context, id: bigint): Promise<void> {
  const [release, policy, live] = await Promise.all([
    readRelease(ctx, id),
    readPolicy(ctx, id),
    ctx.publicClient.readContract({ address: ctx.gate, abi: releaseGateAbi, functionName: "liveRelease" }),
  ]);
  if (release.cancelled) throw new UsageError(`release ${id} was cancelled`);
  if (release.sealedAt === 0n) throw new UsageError(`release ${id} is not sealed yet`);
  if (id <= live) throw new UsageError(`release ${id} is not newer than the live release v${live}`);
  if (!policy.allow) throw new UsageError(`policy circuit rejects release ${id} right now (${describeBits(policy.bits)})`);
  await sendGateTx(ctx, "activate", [id], `activate release ${id}`);
}

// ----------------------------------------------------------------------------- status / wait

export function describeBits(bits: number): string {
  return [
    `${approvalCount(bits)}/3 approvals`,
    bits & 8 ? "timelock passed" : "timelock running",
    bits & 16 ? "FROZEN" : "not frozen",
  ].join(", ");
}

export async function cmdStatus(ctx: Context, id?: bigint): Promise<void> {
  const info = await readGateInfo(ctx);
  ctx.log(`gate        ${ctx.gate} (${ctx.chain.name})${info.migrated ? "  MIGRATED" : ""}`);
  ctx.log(`policy      circuit #${info.policyId} on ${info.processor}`);
  ctx.log(`site        container ${info.container}, registry ${info.registry}`);
  ctx.log(`maintainers ${info.maintainers.join(", ")} (epoch ${info.epoch})`);
  ctx.log(`uploader    ${info.uploader}`);
  ctx.log(`timelock    ${info.timelock}s, ${info.frozen ? "FROZEN" : "not frozen"}`);
  ctx.log(`releases    ${info.releaseCount} proposed, live: ${info.liveRelease === 0n ? "none" : `v${info.liveRelease}`}`);
  if (ctx.account) {
    const balance = await ctx.publicClient.getBalance({ address: ctx.account.address });
    ctx.log(`signer      ${ctx.account.address} (${formatEther(balance)} ${ctx.chain.nativeCurrency.symbol})`);
  }

  const target = id ?? (info.releaseCount > 0n ? info.releaseCount : undefined);
  if (target === undefined) return;
  const r = await readRelease(ctx, target);
  const state = r.cancelled ? "CANCELLED" : info.liveRelease === target ? "LIVE" : r.sealedAt !== 0n ? "sealed" : "staging";
  ctx.log(`\nrelease v${target} (${state})`);
  ctx.log(`  root      ${r.root}`);
  ctx.log(`  chunks    ${r.uploadedChunks}/${r.totalChunks} uploaded`);
  ctx.log(`  sealed    ${r.sealedAt === 0n ? "no" : new Date(Number(r.sealedAt) * 1000).toISOString()}`);
  ctx.log(`  approvals ${["M1", "M2", "M3"].filter((_, i) => r.approvals & (1 << i)).join(", ") || "none"}`);
  // a live or older release is no longer evaluated (the gate only activates newer ones), so its verdict says nothing
  if (r.sealedAt !== 0n && !r.cancelled && target > info.liveRelease) {
    const p = await readPolicy(ctx, target);
    ctx.log(`  policy    ${describeBits(p.bits)} -> ${p.allow ? "can activate" : "blocked"}`);
  }
}

/**
 * @param exact fail if a newer release is already live: before deploying release `id`'s bytes to the normal host,
 *              "something at least as new is live" is not enough, since those bytes would then be stale.
 */
export async function cmdWaitActive(ctx: Context, id: bigint, timeoutSec: number, intervalSec: number, exact = false): Promise<void> {
  const deadline = Date.now() + timeoutSec * 1000;
  for (;;) {
    const live = await ctx.publicClient.readContract({ address: ctx.gate, abi: releaseGateAbi, functionName: "liveRelease" });
    if (exact && live > id) throw new UsageError(`release v${live} is already live, newer than v${id}; refusing to treat v${id} as the live build`);
    if (live >= id) {
      ctx.log(`release v${live} is live`);
      return;
    }
    const release = await readRelease(ctx, id);
    if (release.cancelled) throw new UsageError(`release ${id} was cancelled; it will never go live`);
    if (Date.now() >= deadline) throw new Error(`timed out after ${timeoutSec}s waiting for release ${id} (live: v${live})`);
    await new Promise((resolve) => setTimeout(resolve, intervalSec * 1000));
  }
}
