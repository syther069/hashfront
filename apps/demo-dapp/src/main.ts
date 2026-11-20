import "./style.css";
import { decodeFunctionResult, encodeFunctionData, erc20Abi, formatUnits, getAddress, numberToHex, type Address, type EIP1193Provider, type Hex } from "viem";

// HashSwap demo router. The hijack rehearsal build (.env.hijack) swaps these two values; nothing else changes,
// which is exactly the attack Hashfront has to catch.
const USDT: Address = "0x1E4a5963aBFD975d8c9021ce480b42188849D41d"; // USDT on X Layer, 6 decimals
const SPENDER: Address = getAddress(import.meta.env.VITE_SPENDER ?? "0xA1DA93A3fD135FC83E3B5f69dCb9d73babde5306");
const AMOUNT = BigInt(import.meta.env.VITE_AMOUNT ?? "1"); // 0.000001 USDT
const RELEASE = import.meta.env.VITE_RELEASE ?? "v1";
const XLAYER_HEX = numberToHex(196);
const XLAYER_RPC = "https://rpc.xlayer.tech";
const EXPLORER = "https://www.oklink.com/xlayer";

declare global {
  interface Window {
    okxwallet?: EIP1193Provider;
    ethereum?: EIP1193Provider;
  }
}

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node as T;
};
const connectBtn = el<HTMLButtonElement>("connect");
const approveBtn = el<HTMLButtonElement>("approve");
const statusEl = el<HTMLParagraphElement>("status");
const balanceEl = el<HTMLSpanElement>("balance");
el<HTMLElement>("spender").textContent = SPENDER;
el<HTMLSpanElement>("release").textContent = RELEASE;

/** Read-only JSON-RPC to X Layer, independent of the wallet's own node. */
async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(XLAYER_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = (await res.json()) as { result?: T; error?: { message: string } };
  if (body.error || body.result === undefined) throw new Error(body.error?.message ?? `${method} failed`);
  return body.result;
}

async function waitForReceipt(hash: Hex): Promise<{ status: Hex }> {
  for (let i = 0; i < 120; i++) {
    const receipt = await rpc<{ status: Hex } | null>("eth_getTransactionReceipt", [hash]);
    if (receipt) return receipt;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("no receipt after 2 minutes; check the transaction on OKLink");
}

let account: Address | undefined;

function setStatus(text: string, tone: "" | "ok" | "bad" = "", link?: { href: string; label: string }) {
  statusEl.className = `status ${tone}`.trim();
  statusEl.textContent = text;
  if (link) {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.label;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    statusEl.append(" ", a);
  }
}

function provider(): EIP1193Provider | undefined {
  return window.okxwallet ?? window.ethereum;
}

async function ensureXLayer(p: EIP1193Provider) {
  const current = await p.request({ method: "eth_chainId" });
  if (current.toLowerCase() === XLAYER_HEX) return;
  try {
    await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: XLAYER_HEX }] });
  } catch {
    await p.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: XLAYER_HEX,
          chainName: "X Layer",
          nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
          rpcUrls: [XLAYER_RPC],
          blockExplorerUrls: [EXPLORER],
        },
      ],
    });
  }
}

async function refreshBalance() {
  if (!account) return;
  const data = encodeFunctionData({ abi: erc20Abi, functionName: "balanceOf", args: [account] });
  const result = await rpc<Hex>("eth_call", [{ to: USDT, data }, "latest"]);
  const raw = decodeFunctionResult({ abi: erc20Abi, functionName: "balanceOf", data: result });
  balanceEl.textContent = `${formatUnits(raw, 6)} USDT`;
}

async function connect() {
  const p = provider();
  if (!p) {
    setStatus("No wallet found. Install OKX Wallet, then reload.", "bad");
    return;
  }
  try {
    const [first] = await p.request({ method: "eth_requestAccounts" });
    if (!first) throw new Error("the wallet returned no account");
    await ensureXLayer(p);
    account = getAddress(first);
    connectBtn.textContent = `${account.slice(0, 6)}…${account.slice(-4)}`;
    approveBtn.disabled = false;
    approveBtn.textContent = "Swap";
    setStatus("");
    await refreshBalance();
  } catch (err) {
    setStatus(`Could not connect: ${message(err)}`, "bad");
  }
}

async function swap() {
  const p = provider();
  if (!p || !account) return;
  approveBtn.disabled = true;
  setStatus("Confirm the approval in your wallet…");
  try {
    await ensureXLayer(p);
    const data = encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [SPENDER, AMOUNT] });
    const hash = await p.request({ method: "eth_sendTransaction", params: [{ from: account, to: USDT, data }] });
    setStatus("Submitted. Waiting for X Layer…");
    const receipt = await waitForReceipt(hash);
    const link = { href: `${EXPLORER}/tx/${hash}`, label: "View on OKLink" };
    if (receipt.status === "0x1") setStatus("Swap approved.", "ok", link);
    else setStatus("The transaction reverted.", "bad", link);
  } catch (err) {
    setStatus(message(err), "bad");
  } finally {
    approveBtn.disabled = false;
  }
}

function message(err: unknown): string {
  if (err && typeof err === "object" && "shortMessage" in err && typeof err.shortMessage === "string") {
    return err.shortMessage;
  }
  return err instanceof Error ? err.message : String(err);
}

connectBtn.addEventListener("click", () => void connect());
approveBtn.addEventListener("click", () => void swap());
