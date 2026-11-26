// Maintainer approve page. The approval signs the onchain root and chunk count of the release, never values from the
// loaded manifest; the manifest is only there so a human can see what that root contains, and it is shown only once
// it recomputes to exactly that root.
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useConnect, useDisconnect, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { BaseError, ContractFunctionRevertedError, encodeFunctionData, formatEther, type Hex, type PublicClient } from "viem";
import { releaseGateAbi } from "@hashfront/cli/abi";
import { readGateInfo, readRelease } from "@hashfront/cli/gate";
import { diffManifests, matchesOnchain, parseManifest, type Manifest } from "@hashfront/cli/release";
import { linkFor, publicClientFor, type Target } from "./config.ts";
import { approvers, contextFor, short, slotOf } from "./chain.ts";
import { dataSuffix } from "./wallet.ts";
import { useOkbPrice, usd, useTxScan } from "./okx.ts";
import { ErrorPanel, Loading } from "./ui.tsx";
import { ArrowLeft, Check, Wallet } from "./icons.tsx";

type Loaded = { ok: true; manifest: Manifest; name: string } | { ok: false; error: string; name: string };

async function loadFile(file: File): Promise<Loaded> {
  if (file.size > 20_000_000) return { ok: false, error: "file too large for a manifest", name: file.name };
  try {
    return { ok: true, manifest: parseManifest(await file.text()), name: file.name };
  } catch (e) {
    return { ok: false, error: `invalid manifest: ${(e as Error).message}`, name: file.name };
  }
}

function errorText(e: unknown): string {
  if (e instanceof BaseError) {
    const revert = e.walk((x) => x instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) return `the gate refused: ${revert.data?.errorName ?? revert.shortMessage}`;
    return e.shortMessage;
  }
  return e instanceof Error ? e.message : String(e);
}

export function Approve({ target, id }: { target: Target; id: bigint }) {
  // A maintainer action must never run inside someone else's page (clickjacking).
  if (window.top !== window.self) return <ErrorPanel title="This page cannot be used inside a frame" detail="A maintainer action must run on its own page. Open this page directly in a browser tab." />;
  return <ApproveInner target={target} id={id} />;
}

function ApproveInner({ target, id }: { target: Target; id: bigint }) {
  const wagmiClient = usePublicClient();
  const client = useMemo(() => (wagmiClient as PublicClient | undefined) ?? publicClientFor(target), [wagmiClient, target]);
  const ctx = useMemo(() => contextFor(target, client), [target, client]);
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["approve", target.chain.id, target.gate, id.toString()],
    queryFn: async () => {
      const info = await readGateInfo(ctx);
      const release = await readRelease(ctx, id);
      const live = info.liveRelease > 0n ? await readRelease(ctx, info.liveRelease) : undefined;
      return { info, release, live };
    },
    refetchInterval: 15_000,
  });

  const [proposed, setProposed] = useState<Loaded>();
  const [previous, setPrevious] = useState<Loaded>();
  const [busy, setBusy] = useState<string>();
  const [result, setResult] = useState<{ ok: boolean; text: string }>();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [scanBlock, setScanBlock] = useState<string>();

  // the wallet's own chain, which can be one this page's config does not know (useChainId would not show that)
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { connectors, connect, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  if (q.isPending) return <Loading what={`Reading release v${id.toString()} from the chain`} />;
  if (q.isError) return <ErrorPanel title={`Could not read release v${id.toString()}`} detail={q.error.message} onRetry={() => void q.refetch()} />;
  const { info, release, live } = q.data;

  const verified = proposed?.ok === true && matchesOnchain(proposed.manifest, release.root, release.totalChunks);
  const prevVerified = previous?.ok === true && live !== undefined && matchesOnchain(previous.manifest, live.root, live.totalChunks);
  const diff = verified && proposed?.ok ? diffManifests(prevVerified && previous?.ok ? previous.manifest : undefined, proposed.manifest) : [];

  const slot = slotOf(info, address);
  const alreadyApproved = slot !== undefined && (release.approvals & (1 << slot)) !== 0;
  const wrongChain = isConnected && walletChainId !== target.chain.id;
  const closed = release.cancelled || release.activated || info.migrated;

  const blockers: string[] = [];
  if (closed) blockers.push(release.cancelled ? "this release was cancelled" : release.activated ? "this release is already live" : "this gate was migrated");
  if (!verified) blockers.push("load the release's manifest.json and let it verify against the onchain root");
  if (!isConnected) blockers.push("connect a maintainer wallet");
  else if (slot === undefined) blockers.push(`the connected wallet ${short(address ?? "")} is not a maintainer of this gate`);
  else if (alreadyApproved) blockers.push(`M${slot + 1} already approved this release`);
  if (scanBlock) blockers.push(scanBlock);
  if (wrongChain) blockers.push(`switch the wallet to ${target.chain.name}`);
  else if (isConnected && !walletClient) blockers.push("waiting for the wallet");

  async function send(functionName: "approve" | "cancel") {
    if (!walletClient || !address) return;
    setBusy(functionName);
    setResult(undefined);
    try {
      // Simulate first: a revert shows the gate's own error before the wallet asks for a signature.
      // Approve always signs the onchain root and chunk count, never values from the manifest.
      const gate = { address: target.gate, abi: releaseGateAbi, account: address, ...(dataSuffix ? { dataSuffix } : {}) } as const;
      let hash: Hex;
      if (functionName === "approve") {
        const { request } = await client.simulateContract({ ...gate, functionName: "approve", args: [id, release.root, release.totalChunks] });
        hash = await walletClient.writeContract(request);
      } else {
        const { request } = await client.simulateContract({ ...gate, functionName: "cancel", args: [id] });
        hash = await walletClient.writeContract(request);
      }
      const receipt = await client.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error(`transaction ${hash} reverted`);
      setResult({ ok: true, text: `${functionName === "approve" ? "Approved" : "Cancelled"} in ${hash}` });
      await queryClient.invalidateQueries();
    } catch (e) {
      setResult({ ok: false, text: errorText(e) });
    } finally {
      setBusy(undefined);
      setConfirmCancel(false);
    }
  }

  return (
    <>
      <p>
        <a href={linkFor(target, "#/")}>
          <ArrowLeft size={18} style={{ verticalAlign: "-4px", marginRight: 4 }} />
          Back to status
        </a>
      </p>
      <section className="card">
        <h2>Review release v{id.toString()}</h2>
        <dl className="facts">
          <dt>Onchain root</dt>
          <dd className="mono" data-testid="onchain-root">
            {release.root}
          </dd>
          <dt>Chunks</dt>
          <dd>
            {release.totalChunks} ({release.uploadedChunks} uploaded{release.sealedAt !== 0n ? ", sealed" : ""})
          </dd>
          <dt>Approvals</dt>
          <dd data-testid="approve-count">
            {release.approvalCount}/3 {release.approvalCount > 0 && `(${approvers(release.approvals).map((i) => `M${i + 1}`).join(", ")})`}
          </dd>
          <dt>Live now</dt>
          <dd>{info.liveRelease === 0n ? "none" : `v${info.liveRelease}`}</dd>
        </dl>
      </section>

      <section className="card">
        <h2>1. Check what this root contains</h2>
        <p className="muted">
          Load the <code>manifest.json</code> your CI built for this release. It is accepted only if every file and chunk hash recomputes to the onchain root
          above, so a manifest from anywhere is safe to load.
        </p>
        <label className="file">
          Release v{id.toString()} manifest{" "}
          <input type="file" accept=".json,application/json" data-testid="manifest-input" onChange={async (e) => e.target.files?.[0] && setProposed(await loadFile(e.target.files[0]))} />
        </label>
        {proposed && <Verdict loaded={proposed} verified={verified} what={`v${id}`} />}
        {live && (
          <label className="file">
            Optional: live release v{live.id.toString()} manifest, to see what changes{" "}
            <input type="file" accept=".json,application/json" onChange={async (e) => e.target.files?.[0] && setPrevious(await loadFile(e.target.files[0]))} />
          </label>
        )}
        {previous && <Verdict loaded={previous} verified={prevVerified} what={`v${live?.id ?? ""}`} />}
        {verified && <DiffTable rows={diff} compared={prevVerified} />}
      </section>

      <section className="card">
        <h2>2. Approve as a maintainer</h2>
        {!isConnected ? (
          <div className="row">
            {/* connect on whatever chain the wallet is on; a wrong chain then shows a switch button instead of a stuck connect */}
            {connectors.map((c) => (
              <button key={c.uid} type="button" className="primary" onClick={() => connect({ connector: c })} data-testid="connect">
                <Wallet /> Connect {c.name}
              </button>
            ))}
            {connectError && <span className="error">{connectError.message}</span>}
          </div>
        ) : (
          <p>
            Connected <code>{address}</code>
            {slot !== undefined ? ` (maintainer M${slot + 1})` : ""}.{" "}
            <button type="button" className="link" onClick={() => disconnect()}>
              disconnect
            </button>
            {wrongChain && (
              <button type="button" onClick={() => switchChain({ chainId: target.chain.id })}>
                Switch to {target.chain.name}
              </button>
            )}
          </p>
        )}
        {address && slot !== undefined && verified && !closed && !wrongChain && (
          <OkxScan
            client={client}
            tx={{ from: address, to: target.gate, data: encodeFunctionData({ abi: releaseGateAbi, functionName: "approve", args: [id, release.root, release.totalChunks] }) }}
            onBlock={setScanBlock}
          />
        )}
        {blockers.length > 0 && (
          <ul className="blockers" data-testid="blockers">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        <div className="row">
          <button type="button" className="primary" disabled={blockers.length > 0 || busy !== undefined} onClick={() => void send("approve")} data-testid="approve">
            {busy === "approve" ? "Approving…" : (
              <>
                <Check /> {`Approve v${id} (root ${short(release.root)})`}
              </>
            )}
          </button>
          {!closed && slot !== undefined && !wrongChain && (
            <>
              {!confirmCancel ? (
                <button type="button" className="danger" disabled={busy !== undefined} onClick={() => setConfirmCancel(true)}>
                  Cancel release…
                </button>
              ) : (
                <>
                  <span>Cancel v{id.toString()} for good? It can never go live afterwards.</span>
                  <button type="button" className="danger" onClick={() => void send("cancel")}>
                    {busy === "cancel" ? "Cancelling…" : "Yes, cancel it"}
                  </button>
                  <button type="button" onClick={() => setConfirmCancel(false)}>
                    Keep it
                  </button>
                </>
              )}
            </>
          )}
        </div>
        {result && (
          <p className={result.ok ? "good" : "error"} data-testid="tx-result">
            {result.text}
          </p>
        )}
      </section>
    </>
  );
}

function Verdict({ loaded, verified, what }: { loaded: Loaded; verified: boolean; what: string }) {
  if (!loaded.ok) return <p className="error">{loaded.name}: {loaded.error}</p>;
  return verified ? (
    <p className="good" data-testid="manifest-verdict">
      {loaded.name} matches the onchain root of {what}: {loaded.manifest.files.length} files,{" "}
      {loaded.manifest.files.reduce((n, f) => n + f.size, 0).toLocaleString()} bytes.
    </p>
  ) : (
    <p className="error" data-testid="manifest-verdict">
      {loaded.name} does NOT match the onchain root of {what}. It describes different files; do not approve based on it.
    </p>
  );
}

function DiffTable({ rows, compared }: { rows: ReturnType<typeof diffManifests>; compared: boolean }) {
  return (
    <div className="scroll">
      <table data-testid="manifest-files">
        <thead>
          <tr>
            <th>File</th>
            <th>{compared ? "Change" : "Status"}</th>
            <th>Size</th>
            <th>sha256</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.path} className={r.change}>
              <td className="mono">{r.path}</td>
              <td>{compared ? r.change : "new"}</td>
              <td>{(r.after ?? r.before)?.size.toLocaleString()}</td>
              <td className="mono small">{(r.after ?? r.before)?.sha256}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Gas a maintainer approve uses on mainnet (M1's OKX Wallet approval: 43,131), with headroom. */
const APPROVE_GAS = 50_000n;

/**
 * OKX Onchain OS pre-execution scan of the exact approve transaction, before the wallet asks for a signature.
 * A warning needs an explicit acknowledgement; an unavailable scan never blocks (the gate's own checks still apply).
 */
function OkxScan({ client, tx, onBlock }: { client: PublicClient; tx: { from: string; to: string; data: string }; onBlock: (b: string | undefined) => void }) {
  const scan = useTxScan(tx);
  const price = useOkbPrice();
  const gasPrice = useQuery({ queryKey: ["gas-price"], queryFn: () => client.getGasPrice(), staleTime: 15_000 });
  const [ack, setAck] = useState(false);
  const risky = scan.data !== undefined && !scan.data.safe;
  useEffect(() => {
    onBlock(risky && !ack ? "acknowledge the OKX security warning" : undefined);
    return () => onBlock(undefined);
  }, [risky, ack, onBlock]);
  if (scan.isError && /not available/.test(scan.error.message)) return null; // no /api on this host
  const feeOkb = gasPrice.data ? Number(formatEther(APPROVE_GAS * gasPrice.data)) : undefined;
  return (
    <div className={`scan ${risky ? "danger" : ""}`} data-testid="okx-scan">
      <strong>OKX security scan</strong>{" "}
      {scan.isPending && <span className="muted">checking this transaction…</span>}
      {scan.isError && <span className="muted">unavailable right now ({scan.error.message}); the gate's own checks still apply.</span>}
      {scan.data?.safe && <span className="good" data-testid="okx-scan-safe">no risk found in this approve transaction.</span>}
      {risky && (
        <>
          <span className="error">OKX flags this transaction{scan.data?.action ? ` (${scan.data.action})` : ""}.</span>
          <pre className="snippet">{JSON.stringify({ risks: scan.data?.risks, warnings: scan.data?.warnings }, null, 2)}</pre>
          <label>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> I reviewed the warning and still want to approve
          </label>
        </>
      )}
      {feeOkb !== undefined && (
        <div className="muted small">
          Network fee ≈ {feeOkb.toPrecision(2)} OKB {usd(feeOkb, price.data)}
        </div>
      )}
    </div>
  );
}
