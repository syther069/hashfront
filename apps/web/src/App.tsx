import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { resolveTarget, linkFor, type Target } from "./config.ts";
import { wagmiConfigFor } from "./wallet.ts";
import { Status } from "./Status.tsx";
import { Approve } from "./Approve.tsx";

type Route = { page: "status" } | { page: "approve"; id: bigint };

function parseRoute(hash: string): Route {
  const m = /^#\/approve\/(\d{1,9})$/.exec(hash);
  return m ? { page: "approve", id: BigInt(m[1]!) } : { page: "status" };
}

export function App() {
  const result = useMemo(() => resolveTarget(window.location.search), []);
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  if (!result.ok) {
    return (
      <Shell>
        <p className="error">{result.error}</p>
      </Shell>
    );
  }
  return <WithWallet target={result.target} route={route} />;
}

function WithWallet({ target, route }: { target: Target; route: Route }) {
  const config = useMemo(() => wagmiConfigFor(target), [target]);
  const queryClient = useMemo(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }), []);
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Shell target={target}>{route.page === "approve" ? <Approve target={target} id={route.id} /> : <Status target={target} />}</Shell>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Shell({ target, children }: { target?: Target; children: React.ReactNode }) {
  return (
    <div className="page">
      <header className="top">
        <a className="brand" href={target ? linkFor(target, "#/") : "#/"}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1l6 2.5v4C14 11 11.4 14 8 15 4.6 14 2 11 2 7.5v-4z" />
          </svg>
          Hashfront
        </a>
        {target && (
          <span className="net">
            {target.chain.name} · gate <code>{target.gate}</code>
          </span>
        )}
      </header>
      <main>{children}</main>
      <footer>
        Every value on this page is read from {target?.chain.name ?? "the chain"} in your browser. The policy table is computed from the circuit's
        stored netlist.
      </footer>
    </div>
  );
}
