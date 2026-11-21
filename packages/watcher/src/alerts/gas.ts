// Reporter gas guard: an onchain alert that fails for lack of OKB is the worst way to find out the wallet ran dry.
// Balance and gas price come from the OKX Onchain OS API (Balance + Gateway) when keys are set, else from the RPC.
import type { PublicClient } from "viem";
import type { OkxClient } from "@hashfront/okx/client";
import { gasPrice as okxGasPrice, tokenBalances } from "@hashfront/okx/endpoints";

/** Gas one alert uses with one recipient, with headroom (measured on mainnet: 264,692 and 194,828). */
export const ALERT_GAS = 300_000n;
/** Warn the team while there is still enough for this many alerts. */
export const ALERTS_RESERVE = 3n;

export interface GasStatus {
  balanceWei: bigint;
  gasPriceWei: bigint;
  /** wei needed for ALERTS_RESERVE alerts at the current gas price */
  reserveWei: bigint;
  low: boolean;
  via: "okx-api" | "rpc";
}

export async function checkReporterGas(client: PublicClient, reporter: `0x${string}`, okx?: OkxClient): Promise<GasStatus> {
  let balanceWei: bigint | undefined;
  let gasPriceWei: bigint | undefined;
  let via: GasStatus["via"] = "rpc";
  if (okx) {
    try {
      const [bal, gp] = await Promise.all([tokenBalances(okx, reporter), okxGasPrice(okx)]);
      const raw = bal[0]?.tokenAssets?.find((t) => !t.tokenContractAddress)?.rawBalance ?? bal[0]?.tokenAssets?.[0]?.rawBalance;
      const normal = gp[0]?.normal;
      if (raw !== undefined && /^\d+$/.test(raw) && normal && /^\d+$/.test(normal)) {
        balanceWei = BigInt(raw);
        gasPriceWei = BigInt(normal);
        via = "okx-api";
      }
    } catch {
      // fall through to the RPC
    }
  }
  if (balanceWei === undefined || gasPriceWei === undefined) {
    [balanceWei, gasPriceWei] = await Promise.all([client.getBalance({ address: reporter }), client.getGasPrice()]);
    via = "rpc";
  }
  const reserveWei = ALERTS_RESERVE * ALERT_GAS * gasPriceWei;
  return { balanceWei, gasPriceWei, reserveWei, low: balanceWei < reserveWei, via };
}
