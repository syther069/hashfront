// Browser-safe helpers (no node: imports): turn OKX approval data into what a user needs after a hijack.
import type { ApprovalItem, ApprovalPage } from "./types.ts";

export type ApprovalRisk = "trusted" | "flagged" | "eoa" | "unknown";

export interface Approval {
  token: string;
  symbol: string;
  spender: string;
  /** human amount as OKX reports it ("unlimited" when it is the max allowance) */
  amount: string;
  unlimited: boolean;
  approvedAt?: number;
  protocol?: string;
  risk: ApprovalRisk;
  reasons: string[];
}

const ADDR = /^0x[0-9a-fA-F]{40}$/;
const MAX_UINT = (1n << 256n) - 1n;

/**
 * Risk, most serious first:
 * - flagged: OKX marks the spender as vulnerable or risky
 * - eoa: the spender is a plain wallet, not a contract (the classic drainer pattern)
 * - unknown: a contract the protocol does not list
 * - trusted: one of the protocol's own contracts (ALLOWED_SPENDERS)
 */
export function classify(item: ApprovalItem, allowed: ReadonlySet<string>): Approval | undefined {
  const spender = item.approvalAddress ?? "";
  const token = item.tokenAddress ?? "";
  if (!ADDR.test(spender) || !ADDR.test(token)) return undefined;
  if (item.status !== undefined && item.status !== "1") return undefined; // revoked or used up
  const tags = (item.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  const raw = item.remainAmount ?? "0";
  let unlimited = false;
  try {
    unlimited = BigInt(raw) >= MAX_UINT / 2n;
  } catch {
    unlimited = false;
  }
  const reasons: string[] = [];
  let risk: ApprovalRisk;
  if (allowed.has(spender.toLowerCase())) {
    risk = "trusted";
    reasons.push("spender is one of this protocol's own addresses");
  } else if (item.vulnerabilityFlag) {
    risk = "flagged";
    reasons.push("OKX security flags this spender");
  } else if (tags.includes("isEoa")) {
    risk = "eoa";
    reasons.push("spender is a plain wallet, not a contract");
  } else {
    risk = "unknown";
    reasons.push("spender is not on this protocol's list");
  }
  if (unlimited && risk !== "trusted") reasons.push("unlimited amount");
  return {
    token: token.toLowerCase(),
    symbol: item.symbol ?? "?",
    spender: spender.toLowerCase(),
    amount: unlimited ? "unlimited" : (item.remainAmtPrecise ?? raw),
    unlimited,
    ...(item.blockTime ? { approvedAt: item.blockTime } : {}),
    ...(item.protocolName ? { protocol: item.protocolName } : {}),
    risk,
    reasons,
  };
}

const ORDER: Record<ApprovalRisk, number> = { flagged: 0, eoa: 1, unknown: 2, trusted: 3 };

export function classifyPages(pages: ApprovalPage[], allowed: ReadonlySet<string>): Approval[] {
  return pages
    .flatMap((p) => p.dataList ?? [])
    .map((i) => classify(i, allowed))
    .filter((a): a is Approval => a !== undefined)
    .sort((a, b) => ORDER[a.risk] - ORDER[b.risk] || Number(b.unlimited) - Number(a.unlimited));
}

export function parseAllowed(list: string | undefined): Set<string> {
  return new Set((list ?? "").split(",").map((s) => s.trim().toLowerCase()).filter((s) => ADDR.test(s)));
}
