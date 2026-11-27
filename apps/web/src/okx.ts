// Browser side of the OKX Onchain OS features. The browser only talks to our own /api functions, which hold the
// key. On a host without them (the DeWEB copy, a local preview) the calls fail and the panels stay hidden.
import { useQuery } from "@tanstack/react-query";
import type { Approval } from "@hashfront/okx/risk";

export interface PriceInfo {
  okbUsd: number;
  time: number;
}

/** Thrown when the host has no /api at all (the DeWEB copy, a plain static host): retrying cannot help. */
export class NoApiError extends Error {
  constructor() {
    super("not available on this host");
  }
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!(res.headers.get("content-type") ?? "").includes("application/json")) throw new NoApiError();
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

/** OKB/USD from the OKX Market API; undefined where /api is not deployed. */
export function useOkbPrice() {
  return useQuery({ queryKey: ["okx-price"], queryFn: () => getJson<PriceInfo>("/api/price"), staleTime: 60_000, retry: false });
}

export function useApprovals(address: string | undefined) {
  return useQuery({
    queryKey: ["okx-approvals", address],
    queryFn: () => getJson<{ approvals: Approval[]; source: string }>(`/api/approvals?address=${address}`),
    enabled: Boolean(address),
    retry: false,
  });
}

/** The status server's own check of the protected website against the live release (GET /api/status). */
export interface SiteStatus {
  site: string;
  /** warn: an onchain alert is open but the site serves the approved release (never a reason to block) */
  status: "ok" | "warn" | "alert" | "unknown";
  alertOpen: boolean;
  liveRelease: number;
  rootHash: string;
  suspects: string[];
  checkedAt: string;
}

/** Polled every 20 s (the server caches for the same time). Absent on hosts without /api, which the page treats as "unavailable". */
export function useSiteStatus() {
  return useQuery({ queryKey: ["site-status"], queryFn: () => getJson<SiteStatus>("/api/status"), refetchInterval: 20_000, retry: false });
}

export interface ScanResult {
  safe: boolean;
  action: string;
  risks: unknown[];
  warnings: unknown[];
  revertReason?: string;
}

export function useTxScan(tx: { from: string; to: string; data: string } | undefined) {
  return useQuery({
    queryKey: ["okx-tx-scan", tx?.from, tx?.to, tx?.data],
    queryFn: () => getJson<ScanResult>("/api/tx-scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(tx) }),
    enabled: Boolean(tx),
    retry: false,
    staleTime: 30_000,
  });
}

export const usd = (okb: number, price: PriceInfo | undefined) =>
  price ? `≈ $${(okb * price.okbUsd).toLocaleString("en-US", { maximumSignificantDigits: 2 })}` : "";
