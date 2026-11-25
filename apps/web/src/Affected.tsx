// "Am I affected?": after a hijack, the question users actually have is whether they signed something. The OKX
// Onchain OS security API lists every token approval an address has on X Layer; we rank them against this
// protocol's own contracts and let the user revoke the dangerous ones from their wallet.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, useConnect, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { erc20Abi, isAddress, type Address, type PublicClient } from "viem";
import type { Approval } from "@hashfront/okx/risk";
import type { Target } from "./config.ts";
import { short } from "./chain.ts";
import { useApprovals, useOkbPrice } from "./okx.ts";
import { dataSuffix } from "./wallet.ts";

const RISK_LABEL: Record<Approval["risk"], string> = {
  attacker: "attacker address",
  flagged: "flagged by OKX",
  eoa: "plain wallet",
  unknown: "unknown contract",
  trusted: "this protocol",
};

export function Affected({ target, alertOpen }: { target: Target; alertOpen: boolean }) {
  const { address: connected, chainId } = useAccount();
  const [typed, setTyped] = useState("");
  const address = isAddress(typed, { strict: false }) ? typed : connected;
  const q = useApprovals(address);
  // shown only where the OKX functions answer (the Vercel status host); hidden on the DeWEB copy and plain hosts
  const api = useOkbPrice();
  if (!api.isSuccess) return null;

  return (
    <section className={`card ${alertOpen ? "affected urgent" : "affected"}`} data-testid="affected">
      <h2>{alertOpen ? "Did you use the site during the alert? Check your approvals" : "Check your token approvals"}</h2>
      <p className="muted">
        A hijacked site usually asks for a token approval to the attacker. This lists every approval your address has on X Layer, from the OKX Onchain OS
        security API, and marks the ones that are not this protocol's contracts. It shows approvals, not losses.
      </p>
      <div className="row">
        <input
          className="addr"
          placeholder={connected ?? "0x… your wallet address"}
          value={typed}
          onChange={(e) => setTyped(e.target.value.trim())}
          aria-label="wallet address"
          data-testid="affected-address"
        />
        {!connected && <ConnectButton />}
      </div>
      {address && q.isPending && <p className="muted">Asking OKX for approvals of {short(address)}…</p>}
      {q.isError && <p className="error">Could not check approvals right now: {q.error.message}</p>}
      {q.data && (
        q.data.approvals.length === 0 ? (
          <p className="good" data-testid="affected-none">No token approvals on X Layer for {short(address ?? "")}.</p>
        ) : (
          <ApprovalTable rows={q.data.approvals} target={target} owner={address as Address} wrongChain={chainId !== undefined && chainId !== target.chain.id} canRevoke={connected?.toLowerCase() === address?.toLowerCase()} />
        )
      )}
    </section>
  );
}

function ConnectButton() {
  const { connectors, connect } = useConnect();
  const c = connectors[0];
  return c ? (
    <button type="button" onClick={() => connect({ connector: c })}>
      Connect wallet
    </button>
  ) : null;
}

function ApprovalTable({ rows, target, owner, wrongChain, canRevoke }: { rows: Approval[]; target: Target; owner: Address; wrongChain: boolean; canRevoke: boolean }) {
  const explorer = target.chain.blockExplorers?.default.url;
  return (
    <div className="scroll">
      <table data-testid="affected-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Spender</th>
            <th>Amount</th>
            <th>Risk</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={`${a.token}-${a.spender}`} className={`risk-${a.risk}`} data-testid={`approval-${a.risk}`}>
              <td>{a.symbol}</td>
              <td className="mono">{explorer ? <a href={`${explorer}/address/${a.spender}`} target="_blank" rel="noopener noreferrer">{short(a.spender)}</a> : short(a.spender)}</td>
              <td>{a.amount}</td>
              <td>
                <span className={`pill risk ${a.risk}`}>{RISK_LABEL[a.risk]}</span>
                <div className="muted small">{a.reasons.join("; ")}</div>
              </td>
              <td>{a.risk !== "trusted" && <RevokeButton approval={a} owner={owner} disabled={!canRevoke || wrongChain} target={target} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!canRevoke && <p className="muted small">Connect this address's wallet to revoke.</p>}
      {canRevoke && wrongChain && <SwitchHint target={target} />}
    </div>
  );
}

function SwitchHint({ target }: { target: Target }) {
  const { switchChain } = useSwitchChain();
  return (
    <p className="small">
      <button type="button" onClick={() => switchChain({ chainId: target.chain.id })}>
        Switch to {target.chain.name} to revoke
      </button>
    </p>
  );
}

function RevokeButton({ approval, owner, disabled, target }: { approval: Approval; owner: Address; disabled: boolean; target: Target }) {
  const client = usePublicClient() as PublicClient | undefined;
  const { data: wallet } = useWalletClient();
  const queryClient = useQueryClient();
  const [state, setState] = useState<{ busy?: boolean; done?: string; error?: string }>({});
  async function revoke() {
    if (!wallet || !client) return;
    setState({ busy: true });
    try {
      // approve(spender, 0) on the token, simulated first, with the X Layer Builder Code like every Hashfront tx
      const { request } = await client.simulateContract({
        address: approval.token as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [approval.spender as Address, 0n],
        account: owner,
        ...(dataSuffix ? { dataSuffix } : {}),
      });
      const hash = await wallet.writeContract(request);
      await client.waitForTransactionReceipt({ hash });
      setState({ done: hash });
      await queryClient.invalidateQueries({ queryKey: ["okx-approvals"] });
    } catch (e) {
      setState({ error: e instanceof Error ? (e.message.split("\n")[0] ?? e.message) : String(e) });
    }
  }
  if (state.done) {
    const url = target.chain.blockExplorers?.default.url;
    return <span className="good small">Revoked {url ? <a href={`${url}/tx/${state.done}`} target="_blank" rel="noopener noreferrer">tx</a> : null}</span>;
  }
  return (
    <>
      <button type="button" className="danger" disabled={disabled || state.busy} onClick={() => void revoke()} data-testid="revoke">
        {state.busy ? "Revoking…" : "Revoke"}
      </button>
      {state.error && <div className="error small">{state.error}</div>}
    </>
  );
}
