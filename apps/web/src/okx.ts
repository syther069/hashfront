// Browser side of the OKX Onchain OS features. The browser only talks to our own /api functions, which hold the
// key. On a host without them (the DeWEB copy, a local preview) the calls fail and the panels stay hidden.
import { useQuery } from "@tanstack/react-query";
import type { Approval } from "@hashfront/okx/risk";

export interface PriceInfo {
  okbUsd: number;
  time: number;
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!(res.headers.get("content-type") ?? "").includes("application/json")) throw new Error("not available on this host");
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

export interface SuspectsInfo {
  status: "match" | "mismatch" | "other";
  liveRelease: number;
  suspects: string[];
  checkedAt: string;
}

/** Addresses seen only in the hijacked site; polled only while an alert is open, and absent where /api is not deployed. */
export function useSuspects(enabled: boolean) {
  return useQuery({ queryKey: ["suspects"], queryFn: () => getJson<SuspectsInfo>("/api/suspects"), enabled, retry: false, refetchInterval: 30_000 });
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
