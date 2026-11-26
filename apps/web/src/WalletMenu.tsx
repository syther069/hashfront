// The wallet control in the header: connect when no wallet is connected, and the connected address with a disconnect
// button when one is. It is the same wagmi connection the approve page and "Am I affected?" use, so connecting or
// disconnecting here changes them too.
import { useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { short } from "./chain.ts";
import { LogOut, Wallet } from "./icons.tsx";

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
  const label = busy ? "Connecting…" : "Connect wallet";
  // one wallet: connect straight away; several (OKX Wallet, MetaMask, ...): let the visitor pick
  if (connectors.length === 1) {
    return (
      <>
        <button type="button" className="btn" disabled={busy} onClick={() => connect({ connector: connectors[0]! })} data-testid="wallet-connect">
          <Wallet /> {label}
        </button>
        {error && <span className="error small" role="alert">{error.message}</span>}
      </>
    );
  }
  return (
    <details className="wallet-menu" ref={menu}>
      <summary className="btn" data-testid="wallet-connect" aria-disabled={busy}>
        <Wallet /> {label}
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
              {c.name}
            </button>
          </li>
        ))}
      </ul>
      {error && <span className="error small" role="alert">{error.message}</span>}
    </details>
  );
}
