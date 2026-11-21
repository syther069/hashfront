// OKX Onchain OS endpoints Hashfront uses, all on X Layer (chainIndex 196). Request shapes follow OKX's own
// onchainos CLI (github.com/okx/onchainos-skills, cli/src/commands/{security,gateway,portfolio,market}.rs) and the
// docs at web3.okx.com/onchainos/dev-docs. Responses stay close to the wire; ./types.ts parses them.
import { XLAYER, type OkxClient } from "./client.ts";
import type { ApprovalPage, BroadcastResult, DappScanResult, GasPrice, OrderStatus, TokenBalanceGroup, TokenPrice, TxScanResult } from "./types.ts";

/** The security scans require a `source` (PARAM_EXCEPTION without it; checked live on X Layer, Nov 2026). */
export const SOURCE = "hashfront";
/** OKB, X Layer's native token: an empty contract address in balance calls. */
export const NATIVE = "";
/** OKX's market API names a chain's native token with this placeholder. */
export const NATIVE_PRICE_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export interface TxRequest {
  from: string;
  to: string;
  data: string;
  /** wei, decimal string */
  value?: string;
}

const extJson = (tx: TxRequest) => ({
  chainIndex: XLAYER,
  fromAddress: tx.from,
  toAddress: tx.to,
  txAmount: tx.value ?? "0",
  extJson: { inputData: tx.data },
});

// ---------------------------------------------------------------- Onchain Gateway
export function gasPrice(c: OkxClient): Promise<GasPrice[]> {
  return c.get("/api/v6/dex/pre-transaction/gas-price", { chainIndex: XLAYER }, { cacheMs: 5_000 });
}

export function gasLimit(c: OkxClient, tx: TxRequest): Promise<{ gasLimit: string }[]> {
  return c.post("/api/v6/dex/pre-transaction/gas-limit", extJson(tx));
}

export function simulate(c: OkxClient, tx: TxRequest): Promise<unknown[]> {
  return c.post("/api/v6/dex/pre-transaction/simulate", extJson(tx));
}

/** Sent once per call; the caller decides about resending (the same signed bytes are harmless to resend). */
export function broadcast(c: OkxClient, signedTx: string, address: string): Promise<BroadcastResult[]> {
  return c.post("/api/v6/dex/pre-transaction/broadcast-transaction", { signedTx, chainIndex: XLAYER, address }, { retry: false });
}

export function orders(c: OkxClient, address: string, orderId?: string): Promise<OrderStatus[]> {
  return c.get("/api/v6/dex/post-transaction/orders", { address, chainIndex: XLAYER, orderId });
}

// ---------------------------------------------------------------- Balance
export function tokenBalances(c: OkxClient, address: string, tokens: string[] = [NATIVE]): Promise<TokenBalanceGroup[]> {
  return c.post(
    "/api/v6/dex/balance/token-balances-by-address",
    { address, tokenContractAddresses: tokens.map((t) => ({ chainIndex: XLAYER, tokenContractAddress: t })) },
    { cacheMs: 15_000 },
  );
}

// ---------------------------------------------------------------- Security
export function dappScan(c: OkxClient, url: string): Promise<DappScanResult> {
  return c.post("/api/v6/security/dapp-scan", { source: SOURCE, url }, { cacheMs: 60_000 });
}

export function approvals(c: OkxClient, address: string, opts: { limit?: number; cursor?: number } = {}): Promise<ApprovalPage[]> {
  return c.post(
    "/api/v6/security/approval-mng",
    { nested: false, limit: opts.limit ?? 50, addressList: [{ chainIndex: XLAYER, address }], ...(opts.cursor !== undefined ? { cursor: opts.cursor } : {}) },
    { cacheMs: 20_000 },
  );
}

export function txScanEvm(c: OkxClient, tx: TxRequest): Promise<TxScanResult> {
  return c.post("/api/v6/security/transaction-scan/evm", {
    source: SOURCE,
    from: tx.from,
    chainId: XLAYER,
    to: tx.to,
    data: tx.data,
    ...(tx.value && tx.value !== "0" ? { value: `0x${BigInt(tx.value).toString(16)}` } : {}),
  });
}

// ---------------------------------------------------------------- Market
export function prices(c: OkxClient, tokens: string[]): Promise<TokenPrice[]> {
  return c.post(
    "/api/v6/dex/market/price",
    tokens.map((t) => ({ chainIndex: XLAYER, tokenContractAddress: t.toLowerCase() })),
    { cacheMs: 60_000 },
  );
}
