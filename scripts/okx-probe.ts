// Read-only probe of every OKX Onchain OS endpoint Hashfront uses, on X Layer mainnet, with your API keys.
// Keys are typed at hidden prompts (or taken from OKX_API_KEY / OKX_SECRET_KEY / OKX_API_PASSPHRASE) and live only in
// this process. Responses (data only, no headers) are saved as test fixtures. Nothing is signed or sent on chain.
//
//   node scripts/okx-probe.ts
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encodeFunctionData, parseAbi } from "viem";
import { promptHidden } from "../packages/cli/src/keystore.ts";
import { credentialsFromEnv, OkxClient, OkxError } from "../packages/okx/src/client.ts";
import * as okx from "../packages/okx/src/endpoints.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(root, "packages/okx/test/fixtures");

const GATE = "0xAF96CA14DB35420BF46b6Ab8feB513306B7D80F6";
const REPORTER = "0xeC8b730F7E9F69e53FE257473c4809Ef93dc46de";
const M1 = "0xA45100B86A94de8Ff90B25e45FF80a75Cf7Cc59A";
const DEMO_USER = "0x51C71Ad9D6c7871bB9eDC214D4cd0472640B488C";
const USDT = "0x1E4a5963aBFD975d8c9021ce480b42188849D41d";

const gateAbi = parseAbi([
  "function alert(uint8 kind, bytes32 observed, bytes32[] to)",
  "function approve(uint256 id, bytes32 root, uint32 totalChunks)",
]);

async function creds() {
  const env = credentialsFromEnv();
  if (env) return env;
  return {
    apiKey: (await promptHidden("OKX API key (hidden): ")).trim(),
    secretKey: (await promptHidden("OKX secret key (hidden): ")).trim(),
    passphrase: (await promptHidden("OKX passphrase (hidden): ")).trim(),
  };
}

const c = new OkxClient(await creds());
await mkdir(fixtures, { recursive: true });

const alertTx = { from: REPORTER, to: GATE, data: encodeFunctionData({ abi: gateAbi, functionName: "alert", args: [3, `0x${"11".repeat(32)}`, []] }) };
const approveTx = {
  from: M1,
  to: GATE,
  data: encodeFunctionData({ abi: gateAbi, functionName: "approve", args: [2n, "0x352185e470f5e23d9e536807e175e7128130e1a174b60cb8d457b68c16c73d58", 4] }),
};

const probes: [string, () => Promise<unknown>][] = [
  ["gas-price", () => okx.gasPrice(c)],
  ["gas-limit", () => okx.gasLimit(c, alertTx)],
  ["simulate", () => okx.simulate(c, alertTx)],
  ["orders", () => okx.orders(c, REPORTER)],
  ["token-balances", () => okx.tokenBalances(c, REPORTER)],
  ["dapp-scan", () => okx.dappScan(c, "https://hashswap-demo.vercel.app")],
  ["approvals", () => okx.approvals(c, DEMO_USER)],
  ["tx-scan", () => okx.txScanEvm(c, approveTx)],
  ["price", () => okx.prices(c, [okx.NATIVE_PRICE_ADDRESS, USDT])],
];

// --scan-variants: find the body shape the security scans accept (OKX's CLI adds a `source` field and resolves
// chainId itself); prints which variant answered. No fixture is written for a failed variant.
if (process.argv.includes("--scan-variants")) {
  const variants: [string, string, unknown][] = [
    ["dapp-scan", "source=hashfront, full url", { source: "hashfront", url: "https://hashswap-demo.vercel.app" }],
    ["dapp-scan", "source=hashfront, host only", { source: "hashfront", url: "hashswap-demo.vercel.app" }],
    ["dapp-scan", "source=onchain_os_cli, host only", { source: "onchain_os_cli", url: "hashswap-demo.vercel.app" }],
    ["tx-scan", "source=hashfront, chainId string", { source: "hashfront", from: approveTx.from, chainId: "196", to: approveTx.to, data: approveTx.data }],
    ["tx-scan", "source=hashfront, chainId number", { source: "hashfront", from: approveTx.from, chainId: 196, to: approveTx.to, data: approveTx.data }],
    ["tx-scan", "source=onchain_os_cli, chainId string, value 0x0", { source: "onchain_os_cli", from: approveTx.from, chainId: "196", to: approveTx.to, data: approveTx.data, value: "0x0" }],
  ];
  const paths: Record<string, string> = { "dapp-scan": "/api/v6/security/dapp-scan", "tx-scan": "/api/v6/security/transaction-scan/evm" };
  for (const [name, label, body] of variants) {
    try {
      const data = await c.post(paths[name]!, body);
      await writeFile(path.join(fixtures, `${name}.json`), `${JSON.stringify(data, null, 2)}\n`);
      console.log(`ok    ${name} [${label}] ${JSON.stringify(data).slice(0, 200)}`);
    } catch (err) {
      console.log(`FAIL  ${name} [${label}] ${(err as Error).message}`);
    }
  }
  process.exit(0);
}

let failed = 0;
for (const [name, call] of probes) {
  try {
    const data = await call();
    await writeFile(path.join(fixtures, `${name}.json`), `${JSON.stringify(data, null, 2)}\n`);
    console.log(`ok    ${name.padEnd(15)} ${JSON.stringify(data).slice(0, 160)}`);
  } catch (err) {
    failed++;
    const e = err as OkxError;
    console.log(`FAIL  ${name.padEnd(15)} ${e.message}${e.code ? ` (code ${e.code})` : ""}`);
  }
}
console.log(failed ? `\n${failed} of ${probes.length} failed` : `\nall ${probes.length} endpoints answered; fixtures in packages/okx/test/fixtures`);
process.exitCode = failed ? 1 : 0;
