import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { badgeSnippet } from "@hashfront/cli/snippets";
import { usePublicClient } from "wagmi";
import type { PublicClient } from "viem";
import { dewebUrl, linkFor, publicClientFor, type Target } from "./config.ts";
import { ago, ALERT_KIND, approvers, contextFor, readSnapshot, short, type ReleaseRow, type Snapshot } from "./chain.ts";
import { inputNames, isPolicyV1, truthTable, type Row } from "./truthTable.ts";

type Table = { ok: true; rows: Row[]; v1: boolean } | { ok: false; error: string };

function tableOf(s: Snapshot): Table {
  try {
    const rows = truthTable(s.circuit.netlist, s.circuit.nIn, s.circuit.nOut);
    return { ok: true, rows, v1: isPolicyV1(rows) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function useSnapshot(target: Target) {
  const wagmiClient = usePublicClient();
  const client = useMemo(() => (wagmiClient as PublicClient | undefined) ?? publicClientFor(target), [wagmiClient, target]);
  return useQuery({
    queryKey: ["snapshot", target.chain.id, target.gate],
    queryFn: () => readSnapshot(contextFor(target, client)),
    refetchInterval: 15_000,
  });
}

export function Status({ target }: { target: Target }) {
  const q = useSnapshot(target);
  if (q.isPending) return <p className="muted">Reading the gate…</p>;
  if (q.isError) return <p className="error">Could not read the gate: {q.error.message}</p>;
  const s = q.data;
  const table = tableOf(s);
  return (
    <>
      <AlertBanner s={s} />
      <Overview s={s} target={target} v1={table.ok && table.v1} />
      <Releases s={s} target={target} />
      <Policy s={s} table={table} />
      <Badge target={target} />
    </>
  );
}

function AlertBanner({ s }: { s: Snapshot }) {
  const a = s.lastAlert;
  const open = a.kind === 1 || a.kind === 2;
  if (open) {
    return (
      <section className="banner danger" data-testid="alert-state">
        <strong>Open alert: {ALERT_KIND[a.kind]}</strong>, reported {ago(s.now - a.at)} ago while v{a.release.toString()} was live. Do not connect your wallet
        on the usual website until the team confirms. Use the verified copy below.
      </section>
    );
  }
  return (
    <section className="banner calm" data-testid="alert-state">
      <strong>No open alert.</strong>{" "}
      {a.kind === 3 ? `The watcher reported all clear ${ago(s.now - a.at)} ago.` : "The watcher has not reported a problem."} This is not a live check of the
      website: a stopped watcher looks the same.
    </section>
  );
}

function Overview({ s, target, v1 }: { s: Snapshot; target: Target; v1: boolean }) {
  const { info } = s;
  const copy = dewebUrl(target, info.policyId);
  const live = s.releases.find((r) => r.status === "live");
  return (
    <section className="card grid">
      <div>
        <h2>Live release</h2>
        <p className="big" data-testid="live-release">
          {info.liveRelease === 0n ? "none yet" : `v${info.liveRelease}`}
        </p>
        {live && (
          <p className="mono small">
            root {short(live.root)} · {live.totalChunks} chunks
          </p>
        )}
        {copy && (
          <p>
            Verified copy:{" "}
            <a href={copy} target="_blank" rel="noopener noreferrer">
              {copy}
            </a>
          </p>
        )}
      </div>
      <div>
        <h2>Release policy</h2>
        <p>
          {v1
            ? `2 of 3 maintainers + ${ago(info.timelock)} timelock, or 3 of 3 at once.`
            : `Custom policy circuit (see the table below); timelock ${ago(info.timelock)}.`}{" "}
          {info.frozen ? <strong className="bad">FROZEN: no release can go live.</strong> : "Not frozen."}
        </p>
        <ol className="maintainers">
          {info.maintainers.map((m, i) => (
            <li key={m}>
              M{i + 1} <code>{m}</code>
            </li>
          ))}
        </ol>
        {info.migrated && <p className="bad">This gate was migrated and no longer accepts releases.</p>}
      </div>
    </section>
  );
}

function Releases({ s, target }: { s: Snapshot; target: Target }) {
  if (!s.releases.length) return null;
  return (
    <section className="card">
      <h2>Releases</h2>
      <table data-testid="releases">
        <thead>
          <tr>
            <th>Release</th>
            <th>State</th>
            <th>Approvals</th>
            <th>Timelock</th>
            <th>Can go live now</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {s.releases.map((r) => (
            <tr key={r.id.toString()} data-testid={`release-${r.id}`}>
              <td>v{r.id.toString()}</td>
              <td>
                <span className={`pill ${r.status}`}>{stateLabel(r)}</span>
              </td>
              <td data-testid={`approvals-${r.id}`}>
                {r.approvalCount}/3 {r.approvalCount > 0 && <span className="muted">({approvers(r.approvals).map((i) => `M${i + 1}`).join(", ")})</span>}
              </td>
              <td>{timelockText(r, s)}</td>
              <td>{r.status === "pending" ? (r.wouldAllow ? <span className="good">yes</span> : "no") : "–"}</td>
              <td>{r.status === "pending" && <a href={linkFor(target, `#/approve/${r.id}`)}>review</a>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function stateLabel(r: ReleaseRow): string {
  if (r.status !== "pending") return r.status;
  if (r.sealedAt === 0n) return `uploading ${r.uploadedChunks}/${r.totalChunks}`;
  return "sealed";
}

function timelockText(r: ReleaseRow, s: Snapshot): string {
  if (r.status !== "pending") return "–";
  if (r.sealedAt === 0n) return "starts at seal";
  const end = r.sealedAt + s.info.timelock;
  return s.now >= end ? "passed" : `${ago(end - s.now)} left`;
}

function Policy({ s, table }: { s: Snapshot; table: Table }) {
  const { circuit } = s;
  if (!table.ok) {
    return (
      <section className="card">
        <h2>Policy circuit</h2>
        <p className="error">{table.error}</p>
      </section>
    );
  }
  const { rows } = table;
  const names = inputNames(circuit.nIn, table.v1);
  // Cross-check: for every release the gate would evaluate now, the browser's evaluation must agree with wouldAllow().
  const checkable = s.releases.filter((r) => r.status === "pending" && r.sealedAt !== 0n && r.bits !== undefined && !s.info.migrated);
  const disagree = checkable.filter((r) => rows[r.bits!]?.allow !== r.wouldAllow);
  const at = new Map<number, string[]>();
  for (const r of s.releases) if (r.status === "pending" && r.bits !== undefined) at.set(r.bits, [...(at.get(r.bits) ?? []), `v${r.id}`]);
  return (
    <section className="card">
      <h2>Policy circuit #{s.info.policyId.toString()}</h2>
      <p className="muted">
        All {rows.length} input combinations, evaluated in your browser from the {circuit.netlist.length}-byte netlist stored by the TapeOut processor.
        {checkable.length > 0 && !disagree.length && ` Matches the gate's own verdict for ${checkable.map((r) => `v${r.id}`).join(", ")}.`}
      </p>
      {disagree.length > 0 && (
        <p className="error" data-testid="policy-mismatch">
          The browser's evaluation disagrees with the gate for {disagree.map((r) => `v${r.id}`).join(", ")}. Do not trust this page's table.
        </p>
      )}
      <div className="scroll">
        <table className="truth" data-testid="truth-table">
          <thead>
            <tr>
              {names.map((n) => (
                <th key={n}>{n}</th>
              ))}
              <th>allow</th>
              <th>releases here now</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.bits} className={at.has(row.bits) ? "here" : undefined}>
                {row.inputs.map((v, i) => (
                  <td key={i} className={v ? "on" : "off"}>
                    {v ? "1" : "0"}
                  </td>
                ))}
                <td className={row.allow ? "good" : "muted"}>{row.allow ? "yes" : "no"}</td>
                <td>{at.get(row.bits)?.join(", ") ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Badge({ target }: { target: Target }) {
  const src = linkFor(target, "badge.html");
  const snippet = badgeSnippet(src);
  const [copied, setCopied] = useState(false);
  return (
    <section className="card">
      <h2>"Protected by Hashfront" badge</h2>
      <p className="muted">
        Shows the live release and any open alert, read from chain. Put it on your site, and pin the status link (not the badge) in Telegram. During a hijack
        the attacker controls your site and can remove or fake the badge, so the pinned link and the verified copy are what users should rely on.
      </p>
      <iframe src={src} title="Hashfront badge preview" width={240} height={32} className="badge-preview" />
      <pre className="snippet">{snippet}</pre>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(snippet).then(() => setCopied(true));
        }}
      >
        {copied ? "Copied" : "Copy snippet"}
      </button>
    </section>
  );
}
