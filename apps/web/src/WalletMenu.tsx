// The wallet control in the header: connect when no wallet is connected, and the connected address with a disconnect
// button when one is. It is the same wagmi connection the approve page and "Am I affected?" use, so connecting or
// disconnecting here changes them too.
import { useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { short } from "./chain.ts";
import { LogOut, Wallet } from "./icons.tsx";

/** OKX's documented check for the browser extension: `typeof window.okxwallet !== 'undefined'`. */
const hasOkxWallet = () => typeof (window as unknown as { okxwallet?: unknown }).okxwallet !== "undefined";
const OKX_DOWNLOAD = "https://web3.okx.com/download";

/** The generic injected connector is named "Injected"; say what it is. */
const label = (c: { id: string; name: string }, okx: boolean) => (c.id === "injected" ? (okx ? "OKX Wallet (browser extension)" : "Browser wallet") : c.name);

export function WalletMenu() {
  const { address, isConnected, isReconnecting, connector } = useAccount();
  const { connectors, connect, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const menu = useRef<HTMLDetailsElement>(null);

  if (isConnected && address) {
    return (
      <span className="wallet-chip" data-testid="wallet-chip">
        <Wallet size={18} />
        <code title={address} data-testid="wallet-address">
          {short(address)}
        </code>
        <button type="button" className="icon-only" onClick={() => disconnect()} aria-label={`Disconnect ${connector?.name ?? "wallet"}`} title="Disconnect wallet" data-testid="wallet-disconnect">
          <LogOut />
        </button>
      </span>
    );
  }

  if (connectors.length === 0) {
    return (
      <span className="net" data-testid="wallet-none">
        No browser wallet found
      </span>
    );
  }

  const busy = isPending || isReconnecting;
  const okx = hasOkxWallet();
  const buttonText = busy ? "Connecting…" : "Connect wallet";
  // one wallet: connect straight away; several (OKX Wallet, MetaMask, ...): let the visitor pick
  if (connectors.length === 1) {
    return (
      <>
        <button type="button" className="btn" disabled={busy} onClick={() => connect({ connector: connectors[0]! })} data-testid="wallet-connect">
          <Wallet /> {buttonText}
        </button>
        {error && <span className="error small" role="alert">{error.message}</span>}
      </>
    );
  }
  return (
    <details className="wallet-menu" ref={menu}>
      <summary className="btn" data-testid="wallet-connect" aria-disabled={busy}>
        <Wallet /> {buttonText}
      </summary>
      <ul className="wallet-list">
        {connectors.map((c) => (
          <li key={c.uid}>
            <button
              type="button"
              onClick={() => {
                if (menu.current) menu.current.open = false;
                connect({ connector: c });
              }}
            >
              {label(c, okx)}
            </button>
          </li>
        ))}
        {!okx && (
          <li className="wallet-hint small muted">
            No OKX Wallet extension found.{" "}
            <a href={OKX_DOWNLOAD} target="_blank" rel="noopener noreferrer">
              Get OKX Wallet
            </a>
          </li>
        )}
      </ul>
      {error && <span className="error small" role="alert">{error.message}</span>}
    </details>
  );
}
