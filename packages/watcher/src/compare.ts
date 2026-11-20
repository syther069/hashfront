// Pure verdict logic: what the normal website serves versus what the gate approved. No I/O here.
import { createHash } from "node:crypto";
import type { Hex } from "viem";
import { stripCloudflare, CDN_HINTS, type StrippedTag } from "./cdn.ts";
import type { ReleaseFile } from "./manifests.ts";

export type Status =
  /** every file the live release lists is served byte for byte */
  | "MATCH"
  /** the host serves an older release that was live before (normal for a few minutes after each activation) */
  | "HOST_BEHIND"
  /** the host serves a release that is staged or sealed but not yet active (a process mistake, not a hijack) */
  | "DEPLOYED_BEFORE_ACTIVATION"
  /** only known Cloudflare tags differ; unverified, never green, because a hijacker can fake them */
  | "CDN_MODIFIED"
  /** the host serves something no approved release contains: treat as a hijack */
  | "MISMATCH"
  /** some files could not be fetched, and nothing that was fetched differs; no verdict */
  | "UNVERIFIABLE"
  /** the site's root page could not be fetched at all */
  | "UNREACHABLE";

export type Fetched =
  | { ok: true; bytes: Uint8Array; finalUrl: string }
  | { ok: false; missing: boolean; error: string };

/** Served files keyed by release path; "index.html" is the site root "/". */
export type Served = ReadonlyMap<string, Fetched>;

export type ReleaseState = "live" | "previous" | "staged" | "sealed" | "cancelled";

export interface ReleaseView {
  id: bigint;
  state: ReleaseState;
  files: readonly ReleaseFile[];
}

export interface FileDiff {
  path: string;
  kind: "changed" | "missing" | "fetch-failed" | "off-origin";
  served?: Hex;
  expected: Hex;
  detail?: string;
}

export interface Verdict {
  status: Status;
  liveRelease: bigint;
  /** release the host matches, when it isn't the live one */
  matchedRelease?: bigint;
  /** sha256 of the served root page: the evidence passed to ReleaseGate.alert() */
  observed: Hex;
  diffs: FileDiff[];
  /** files accepted only because their served hash is on the operator's allow-list */
  allowed: string[];
  stripped: StrippedTag[];
  hints: string[];
}

/** path -> accepted sha256 values (lowercase, 0x-prefixed) */
export type AllowList = ReadonlyMap<string, ReadonlySet<string>>;

export interface CompareInput {
  siteOrigin: string;
  live: ReleaseView;
  /** other releases the host might legitimately or mistakenly be serving */
  others: readonly ReleaseView[];
  served: Served;
  /** approved bytes of the live release's index.html, needed only for the CDN check */
  liveIndex?: Uint8Array;
  allow?: AllowList;
}

export const ZERO_HASH: Hex = `0x${"0".repeat(64)}`;

export function sha256(bytes: Uint8Array): Hex {
  return `0x${createHash("sha256").update(bytes).digest("hex")}`;
}

function sameOrigin(url: string, origin: string): boolean {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

/** Diffs one release against what is served. An empty list means every listed file matches. */
export function diffRelease(release: ReleaseView, input: CompareInput): { diffs: FileDiff[]; allowed: string[] } {
  const diffs: FileDiff[] = [];
  const allowed: string[] = [];
  for (const file of release.files) {
    const got = input.served.get(file.path);
    if (!got) {
      diffs.push({ path: file.path, kind: "fetch-failed", expected: file.sha256, detail: "not fetched" });
      continue;
    }
    if (!got.ok) {
      diffs.push({ path: file.path, kind: got.missing ? "missing" : "fetch-failed", expected: file.sha256, detail: got.error });
      continue;
    }
    if (!sameOrigin(got.finalUrl, input.siteOrigin)) {
      diffs.push({ path: file.path, kind: "off-origin", expected: file.sha256, detail: `redirected to ${got.finalUrl}` });
      continue;
    }
    const served = sha256(got.bytes);
    if (served === file.sha256) continue;
    if (input.allow?.get(file.path)?.has(served)) {
      allowed.push(file.path);
      continue;
    }
    diffs.push({ path: file.path, kind: "changed", served, expected: file.sha256 });
  }
  return { diffs, allowed };
}

const decoder = new TextDecoder("utf-8", { fatal: false });

export function compare(input: CompareInput): Verdict {
  const root = input.served.get("index.html");
  const base = {
    liveRelease: input.live.id,
    observed: root?.ok ? sha256(root.bytes) : ZERO_HASH,
    stripped: [] as StrippedTag[],
    hints: [] as string[],
  };

  if (!root || (!root.ok && !root.missing)) {
    const detail = root && !root.ok ? root.error : "not fetched";
    return { ...base, status: "UNREACHABLE", diffs: [], allowed: [], hints: [`root page: ${detail}`] };
  }

  const live = diffRelease(input.live, input);
  const hard = live.diffs.filter((d) => d.kind !== "fetch-failed");
  if (live.diffs.length === 0) return { ...base, status: "MATCH", diffs: [], allowed: live.allowed };

  // Another approved release, served in full? (host behind, or deployed before activation)
  if (hard.length > 0) {
    for (const other of input.others) {
      if (diffRelease(other, input).diffs.length > 0) continue;
      if (other.state === "previous") return { ...base, status: "HOST_BEHIND", matchedRelease: other.id, diffs: live.diffs, allowed: [] };
      if (other.state === "staged" || other.state === "sealed") {
        return {
          ...base,
          status: "DEPLOYED_BEFORE_ACTIVATION",
          matchedRelease: other.id,
          diffs: live.diffs,
          allowed: [],
          hints: [`release v${other.id} is ${other.state} but not active yet: deploy to the host only after \`hashfront wait-active\``],
        };
      }
      // a cancelled release must never be served; fall through to MISMATCH with a pointer
      base.hints.push(`the host serves cancelled release v${other.id}`);
    }
  }

  // Known Cloudflare rewrites of the root page, and nothing else different?
  if (root.ok) {
    const cdn = stripCloudflare(decoder.decode(root.bytes));
    base.hints.push(...cdn.irreversible);
    const onlyIndex = hard.length === 1 && hard[0]?.path === "index.html" && hard[0].kind === "changed";
    const otherFailures = live.diffs.some((d) => d.kind === "fetch-failed");
    if (onlyIndex && !otherFailures && cdn.stripped.length > 0 && input.liveIndex) {
      const approved = decoder.decode(input.liveIndex);
      if (cdn.html === approved) {
        const features = [...new Set(cdn.stripped.map((s) => s.feature))];
        return {
          ...base,
          status: "CDN_MODIFIED",
          diffs: live.diffs,
          allowed: live.allowed,
          stripped: cdn.stripped,
          hints: [...base.hints, ...features.map((f) => CDN_HINTS[f])],
        };
      }
    }
  }

  if (hard.length === 0) return { ...base, status: "UNVERIFIABLE", diffs: live.diffs, allowed: live.allowed };
  return { ...base, status: "MISMATCH", diffs: live.diffs, allowed: live.allowed };
}
