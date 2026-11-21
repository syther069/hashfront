// Wire types for the OKX Onchain OS responses Hashfront reads. Field names follow the live X Layer responses recorded
// in ../test/fixtures (Nov 2026). Everything is optional where OKX may omit it; parsers below never trust shapes.

export interface GasPrice {
  normal?: string;
  min?: string;
  max?: string;
  supportEip1559?: boolean;
}

export interface BroadcastResult {
  orderId?: string;
  txHash?: string;
}

export interface OrderStatus {
  orderId?: string;
  txHash?: string;
  /** OKX order state, e.g. "1" pending, "2" success, "3" failed (see the gateway docs) */
  txStatus?: string;
  failReason?: string;
}

export interface TokenBalance {
  chainIndex?: string;
  tokenContractAddress?: string;
  symbol?: string;
  balance?: string;
  rawBalance?: string;
  tokenPrice?: string;
}

export interface TokenBalanceGroup {
  tokenAssets?: TokenBalance[];
}

export interface DappScanResult {
  isMalicious?: boolean;
}

export interface ApprovalItem {
  address?: string;
  approvalAddress?: string;
  approvalType?: string;
  blockTime?: number;
  chainIndex?: number | string;
  network?: string;
  protocolName?: string | null;
  remainAmount?: string;
  remainAmtPrecise?: string;
  status?: string;
  symbol?: string;
  tags?: string;
  tokenAddress?: string;
  vulnerabilityFlag?: boolean;
}

export interface ApprovalPage {
  cursor?: number;
  dataList?: ApprovalItem[];
  total?: number;
}

export interface TxScanResult {
  /** "" when there is nothing to do; otherwise OKX's recommended action (e.g. warn / block) */
  action?: string;
  riskItemDetail?: unknown[];
  simulator?: { gasLimit?: string | null; gasUsed?: string | null; revertReason?: string };
  warnings?: unknown[] | null;
}

export interface TokenPrice {
  chainIndex?: string;
  tokenContractAddress?: string;
  time?: string;
  price?: string;
}
