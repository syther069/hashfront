// "Am I affected?": after a hijack, the question users actually have is whether they signed something. The OKX
// Onchain OS security API lists every token approval an address has on X Layer; we rank them against this
// protocol's own contracts and let the user revoke the dangerous ones from their wallet.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, useConfig, useConnect, usePublicClient, useSendCalls, useSwitchChain, useWalletClient } from "wagmi";
import { waitForCallsStatus } from "wagmi/actions";
import { erc20Abi, isAddress, type Address, type PublicClient, type WalletClient } from "viem";
import type { Approval } from "@hashfront/okx/risk";
import type { Target } from "./config.ts";
import { short } from "./chain.ts";
import { useApprovals, useOkbPrice } from "./okx.ts";
import { dataSuffix } from "./wallet.ts";
import { messageOf, PartialRevoke, revokeAll, type RevokeCall } from "./revoke.ts";

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
  // the outcome of "revoke all" outlives the table: once every approval is gone the table is replaced by "none"
  const [note, setNote] = useState<{ done?: string; error?: string }>({});
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
      {note.done && <p className="good small" data-testid="revoke-all-done">{note.done}</p>}
      {note.error && <p className="error small" data-testid="revoke-all-error">{note.error}</p>}
      {address && q.isPending && <p className="muted">Asking OKX for approvals of {short(address)}…</p>}
      {q.isError && <p className="error">Could not check approvals right now: {q.error.message}</p>}
      {q.data && (
        q.data.approvals.length === 0 ? (
          <p className="good" data-testid="affected-none">No token approvals on X Layer for {short(address ?? "")}.</p>
        ) : (
          <ApprovalTable rows={q.data.approvals} target={target} owner={address as Address} wrongChain={chainId !== undefined && chainId !== target.chain.id} canRevoke={connected?.toLowerCase() === address?.toLowerCase()} onNote={setNote} />
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

function ApprovalTable({ rows, target, owner, wrongChain, canRevoke, onNote }: { rows: Approval[]; target: Target; owner: Address; wrongChain: boolean; canRevoke: boolean; onNote: (n: { done?: string; error?: string }) => void }) {
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
      {canRevoke && !wrongChain && <RevokeAll rows={rows} owner={owner} onNote={onNote} />}
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

/** approve(spender, 0), simulated first, with the X Layer Builder Code like every Hashfront tx. */
async function revokeOne(client: PublicClient, wallet: WalletClient, owner: Address, c: RevokeCall): Promise<`0x${string}`> {
  const { request } = await client.simulateContract({
    address: c.token,
    abi: erc20Abi,
    functionName: "approve",
    args: [c.spender, 0n],
    account: owner,
    ...(dataSuffix ? { dataSuffix } : {}),
  });
  const hash = await wallet.writeContract(request);
  await client.waitForTransactionReceipt({ hash });
  return hash;
}

/** One click for every approval that is not this protocol's own: one wallet prompt when the wallet can batch (EIP-5792). */
function RevokeAll({ rows, owner, onNote }: { rows: Approval[]; owner: Address; onNote: (n: { done?: string; error?: string }) => void }) {
  const client = usePublicClient() as PublicClient | undefined;
  const { data: wallet } = useWalletClient();
  const config = useConfig();
  const { sendCallsAsync } = useSendCalls();
  const queryClient = useQueryClient();
  const risky = rows.filter((r) => r.risk !== "trusted");
  const [busy, setBusy] = useState<string | undefined>();
  if (risky.length === 0) return null;

  async function run() {
    if (!wallet || !client) return;
    onNote({});
    setBusy(`Revoking 0 of ${risky.length}…`);
    try {
      const r = await revokeAll(
        risky.map((a) => ({ token: a.token as Address, spender: a.spender as Address })),
        {
          dataSuffix,
          batch: async (calls) => {
            const { id } = await sendCallsAsync({ calls, account: owner });
            const result = await waitForCallsStatus(config, { id });
            if (result.status !== "success") throw new Error("the wallet reported that the batch did not succeed");
          },
          one: async (c) => void (await revokeOne(client, wallet, owner, c)),
          progress: (d, t) => setBusy(`Revoking ${Math.min(d + 1, t)} of ${t}…`),
        },
      );
      onNote({ done: r.mode === "batch" ? `Revoked ${r.done} approvals in one confirmation.` : `Revoked ${r.done} approvals, one confirmation each (this wallet cannot batch).` });
      await queryClient.invalidateQueries({ queryKey: ["okx-approvals"] });
    } catch (e) {
      onNote({ error: messageOf(e) });
      await queryClient.invalidateQueries({ queryKey: ["okx-approvals"] });
    } finally {
      setBusy(undefined);
    }
  }
  return (
    <>
      <p>
        <button type="button" className="danger" disabled={Boolean(busy)} onClick={() => void run()} data-testid="revoke-all">
          {busy ?? `Revoke all risky (${risky.length})`}
        </button>
      </p>
      <p className="muted small" data-testid="revoke-all-note">
        To batch, some wallets (OKX Wallet) first ask to upgrade the account with EIP-7702 and show a risk warning. If you would rather not, skip this
        button and use the Revoke button on each row: that sends a plain approval of 0, one confirmation each.
      </p>
    </>
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
      const hash = await revokeOne(client, wallet, owner, { token: approval.token as Address, spender: approval.spender as Address });
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
