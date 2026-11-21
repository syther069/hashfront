import { Attribution } from "ox/erc8021";
import {
  createPublicClient,
  createWalletClient,
  fallback,
  getAddress,
  http,
  isAddress,
  isHex,
  type Abi,
  type Account,
  type Address,
  type Chain,
  type ContractFunctionArgs,
  type ContractFunctionName,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { releaseGateAbi } from "./abi.ts";
import { resolveNetwork, txUrl, UsageError } from "./chains.ts";

export interface ContextOptions {
  network: string;
  gate?: string | undefined;
  rpcUrl?: string | undefined;
  /** read-only commands don't need a key */
  needsSigner: boolean;
  /** signer key already decrypted from a keystore (--account); otherwise HASHFRONT_PRIVATE_KEY is used */
  privateKey?: Hex | undefined;
}

export interface Context {
  chain: Chain;
  publicClient: PublicClient;
  walletClient: WalletClient | undefined;
  account: Account | undefined;
  gate: Address;
  log: (msg: string) => void;
}

export function parseAddress(value: string | undefined, what: string): Address {
  if (!value) throw new UsageError(`missing ${what}`);
  if (!isAddress(value, { strict: false })) throw new UsageError(`${what} is not a valid address: ${value}`);
  return getAddress(value);
}

/**
 * Builds viem clients for the chosen network.
 *   HASHFRONT_RPC_URL       overrides the network's RPC list
 *   HASHFRONT_PRIVATE_KEY   signer for write commands in CI (people use --account <foundry keystore> instead)
 *   HASHFRONT_BUILDER_CODE  X Layer Builder Code, appended to calldata as an ERC-8021 suffix
 */
/** ERC-8021 suffix for the X Layer Builder Code in HASHFRONT_BUILDER_CODE, for transactions signed outside viem's
 * sendTransaction (which adds the client's dataSuffix itself). */
export function builderDataSuffix(): Hex | undefined {
  const code = process.env.HASHFRONT_BUILDER_CODE?.trim();
  return code ? Attribution.toDataSuffix({ codes: [code] }) : undefined;
}

export function createContext(opts: ContextOptions): Context {
  const chain = resolveNetwork(opts.network);
  const urls = opts.rpcUrl ? [opts.rpcUrl] : chain.rpcUrls.default.http;
  const transport = fallback(urls.map((url) => http(url, { retryCount: 2, timeout: 30_000 })));
  const publicClient = createPublicClient({ chain, transport }) as PublicClient;
  const gate = parseAddress(opts.gate, "gate address (--gate or HASHFRONT_GATE)");

  let account: Account | undefined;
  let walletClient: WalletClient | undefined;
  if (opts.needsSigner) {
    const key = opts.privateKey ?? process.env.HASHFRONT_PRIVATE_KEY;
    if (!key) throw new UsageError("this command signs a transaction: pass --account <foundry keystore name>, or set HASHFRONT_PRIVATE_KEY (CI)");
    if (!isHex(key) || key.length !== 66) throw new UsageError("HASHFRONT_PRIVATE_KEY must be a 0x-prefixed 32-byte hex key");
    account = privateKeyToAccount(key as Hex);

    const dataSuffix = builderDataSuffix();
    walletClient = createWalletClient({ account, chain, transport, ...(dataSuffix ? { dataSuffix } : {}) });
  }

  return { chain, publicClient, walletClient, account, gate, log: (msg) => console.log(msg) };
}

type WriteName = ContractFunctionName<typeof releaseGateAbi, "nonpayable" | "payable">;

/**
 * Simulates, sends and waits for a ReleaseGate transaction.
 * Simulation first means a revert surfaces as a decoded custom error before any gas is spent.
 */
export async function sendGateTx<F extends WriteName>(
  ctx: Context,
  functionName: F,
  args: ContractFunctionArgs<typeof releaseGateAbi, "nonpayable" | "payable", F>,
  label: string,
): Promise<Hex> {
  if (!ctx.walletClient || !ctx.account) throw new UsageError("this command needs a signer: --account <keystore> or HASHFRONT_PRIVATE_KEY");
  const { request } = await ctx.publicClient.simulateContract({
    address: ctx.gate,
    abi: releaseGateAbi as Abi,
    functionName,
    args: args as readonly unknown[],
    account: ctx.account,
  });
  const hash = await ctx.walletClient.writeContract(request);
  const receipt = await ctx.publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`${label}: transaction ${hash} reverted`);
  const link = txUrl(ctx.chain, hash);
  ctx.log(`  ${label}: ${link ?? hash} (gas ${receipt.gasUsed})`);
  return hash;
}
