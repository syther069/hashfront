import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { badgeSnippet, tapesendEndpoint } from "@hashfront/cli/snippets";
import { usePublicClient } from "wagmi";
import type { PublicClient } from "viem";
import { dewebUrl, linkFor, publicClientFor, type Target } from "./config.ts";
import { ago, ALERT_KIND, approvers, contextFor, readSnapshot, short, type ReleaseRow, type Snapshot } from "./chain.ts";
import { inputNames, isPolicyV1, truthTable, type Row } from "./truthTable.ts";
import { Affected } from "./Affected.tsx";
import { NoApiError, useOkbPrice, useSiteStatus, type SiteStatus } from "./okx.ts";
import { ageText, statusOf, type Action, type StatusView } from "./statusModel.ts";
import { OpenNewWindow, Refresh, ShieldAlert, ShieldCheck, WarningTriangle } from "./icons.tsx";
import { CopyField, Fold, Loading, Tip } from "./ui.tsx";

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

/** The page's own clock, ticking every 5 s, so staleness is re-judged without a new request. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const utc = (ms: number) => `${new Date(ms).toISOString().slice(11, 19)} UTC`;

export function Status({ target }: { target: Target }) {
  const q = useSnapshot(target);
  const site = useSiteStatus();
  const now = useNow();
  const s = q.data;
  const copyUrl = s ? dewebUrl(target, s.info.policyId) : undefined;
  const siteData = site.data;

  const view = statusOf({
    nowMs: now,
    chain: {
      facts: s && {
        liveRelease: s.info.liveRelease,
        migrated: s.info.migrated,
        frozen: s.info.frozen,
        alertKind: s.lastAlert.kind,
        alertAgeS: s.lastAlert.kind === 0 ? undefined : Number(s.now - s.lastAlert.at),
        alertRelease: s.lastAlert.release,
      },
      error: q.isError && !s ? q.error.message : undefined,
      fetchedAtMs: q.dataUpdatedAt || undefined,
      refreshFailed: q.isRefetchError && Boolean(s),
    },
    site: {
      pending: site.isPending,
      failed: site.isError,
      absent: site.error instanceof NoApiError,
      facts: siteData && { status: siteData.status, liveRelease: siteData.liveRelease, checkedAtMs: Date.parse(siteData.checkedAt) },
    },
    hasVerifiedCopy: Boolean(copyUrl),
  });

  if (q.isPending) return <Loading what="Reading the gate from the chain" />;
  const retry = () => {
    void q.refetch();
    void site.refetch();
  };
  const table = s ? tableOf(s) : undefined;
  const urgent = view.kind === "alert" || view.kind === "site-differs";
  const suspects = siteData?.status === "alert" ? siteData.suspects : [];
  const pending = s ? s.releases.filter((r) => r.status === "pending") : [];

  return (
    <>
      <StatusHero view={view} copyUrl={copyUrl} onRetry={retry} chainFetchedAt={q.dataUpdatedAt || undefined} siteCheckedAt={siteData ? Date.parse(siteData.checkedAt) : undefined} now={now} />
      {s && <Evidence s={s} site={site} siteData={siteData} now={now} onRetry={() => void site.refetch()} />}

      {s && (
        <section className="zone" data-testid="visitors" aria-labelledby="visitors-h">
          <h2 id="visitors-h" className="zone-title">
            What to do now
          </h2>
          <p className="muted zone-sub">For anyone who uses this protocol.</p>
          {copyUrl && <VerifiedCopy url={copyUrl} urgent={urgent} />}
          {suspects.length > 0 && <Suspects target={target} list={suspects} />}
          <Affected target={target} alertOpen={urgent} />
        </section>
      )}

      {s && (
        <section className="zone maintainers-zone" data-testid="maintainers" aria-labelledby="maint-h">
          <h2 id="maint-h" className="zone-title">
            Release management
          </h2>
          <p className="muted zone-sub">For the protocol's maintainers. Approving needs a maintainer wallet.</p>
          <Fold title="Releases and approvals" {...(s.releases.length ? {} : { hint: "no release yet" })} {...(pending.length ? { badge: `${pending.length} pending` } : {})} openOnWide testId="releases-fold">
            <Releases s={s} target={target} />
          </Fold>
        </section>
      )}

      {s && table && (
        <section className="zone" aria-label="Technical details">
          <Fold title="Technical details" hint={`${target.chain.name} · gate ${short(target.gate)} · policy circuit #${s.info.policyId.toString()}`} testId="technical">
            <Technical s={s} target={target} table={table} />
          </Fold>
          <Fold title="Reporting and metrics" hint="what the chain can and cannot say about the watcher" testId="reporting">
            <WatcherHealth s={s} />
          </Fold>
        </section>
      )}
    </>
  );
}

const TONE_ICON = { good: ShieldCheck, bad: ShieldAlert, warn: WarningTriangle, neutral: ShieldCheck } as const;

/** The first thing on the page: what is true right now, why, and the one safe thing to do next. */
function StatusHero({ view, copyUrl, onRetry, chainFetchedAt, siteCheckedAt, now }: { view: StatusView; copyUrl: string | undefined; onRetry: () => void; chainFetchedAt: number | undefined; siteCheckedAt: number | undefined; now: number }) {
  const Icon = TONE_ICON[view.tone];
  const action = (a: Action, primary: boolean) => {
    const cls = primary ? "btn primary" : "btn";
    if (a === "verified-copy" && copyUrl)
      return (
        <a className={cls} href={copyUrl} target="_blank" rel="noopener noreferrer">
          Open the verified copy <OpenNewWindow size={18} />
        </a>
      );
    if (a === "check-approvals")
      return (
        <a className={cls} href="#affected">
          Check my approvals
        </a>
      );
    if (a === "retry")
      return (
        <button type="button" className={cls} onClick={onRetry}>
          <Refresh /> Try again
        </button>
      );
    return null;
  };
  return (
    <section className="hero" data-state={view.tone === "bad" ? "alert" : view.tone === "good" ? "ok" : view.tone} data-kind={view.kind} data-testid="alert-state">
      <div className="hero-head" aria-live="polite">
        <Icon size={32} />
        <div>
          <h1>{view.headline}</h1>
          {view.detail && <p>{view.detail}</p>}
        </div>
      </div>
      {view.reasons.length > 0 && (
        <div className="hero-why" data-testid="why-not-green">
          <strong>Why this is not a green check</strong>
          <ul>
            {view.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {view.notices.map((n) => (
        <p className="notice" key={n.id}>
          {n.text}
        </p>
      ))}
      <div className="hero-actions">
        {action(view.primary, true)}
        {view.secondary !== view.primary && action(view.secondary, false)}
      </div>
      <p className="hero-fresh small muted" data-testid="freshness">
        {chainFetchedAt ? `Gate data refreshed ${ageText((now - chainFetchedAt) / 1000)} ago` : "Gate data not loaded"}
        {" · "}
        {siteCheckedAt ? `website check ${utc(siteCheckedAt)}` : "no website check"}
      </p>
    </section>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const OBSERVED: Record<number, string> = { 1: "sha256 of the page the watcher fetched", 2: "hash of the domain evidence the watcher compared", 3: "sha256 of the page the watcher fetched" };

/** Evidence next to the status: the live release, the latest onchain alert, and the website check. Each says where it comes from. */
function Evidence({ s, site, siteData, now, onRetry }: { s: Snapshot; site: ReturnType<typeof useSiteStatus>; siteData: SiteStatus | undefined; now: number; onRetry: () => void }) {
  const live = s.releases.find((r) => r.status === "live");
  const a = s.lastAlert;
  const checked = siteData ? Date.parse(siteData.checkedAt) : undefined;
  return (
    <section className="evidence" aria-label="Evidence">
      <div className="ev-block">
        <h2>
          Live release
          <Tip term="the live release">The version of the website files the maintainers approved on the blockchain. The real website should match it.</Tip>
        </h2>
        <p className="big" data-testid="live-release">
          {s.info.liveRelease === 0n ? "none yet" : `v${s.info.liveRelease}`}
        </p>
        {live && (
          <dl className="facts">
            <dt>
              Root
              <Tip term="the root">A fingerprint of every file in the release. Maintainers sign this value when they approve.</Tip>
            </dt>
            <dd>
              <CopyField value={live.root} shown={short(live.root)} label="release root" />
            </dd>
            <dt>
              Chunks
              <Tip term="chunks">The release is stored on the chain in pieces of up to 24 KB. This is how many pieces it has.</Tip>
            </dt>
            <dd>{live.totalChunks}</dd>
            <dt>
              Approvals
              <Tip term="approvals">How many of the 3 maintainers signed off on this release, and which ones.</Tip>
            </dt>
            <dd>
              {live.approvalCount}/3 ({approvers(live.approvals).map((i) => `M${i + 1}`).join(", ")})
            </dd>
          </dl>
        )}
        <p className="small muted">Source: the gate contract, read in your browser.</p>
      </div>

      <div className="ev-block">
        <h2>
          Latest alert
          <Tip term="the latest alert">The newest report the watcher wrote to the chain. "All clear" means the problem it reported earlier has ended.</Tip>
        </h2>
        {a.kind === 0 ? (
          <p>None reported onchain yet.</p>
        ) : (
          <>
            <p className="ev-value">{cap(ALERT_KIND[a.kind] ?? "alert")}</p>
            <p className="small muted">
              {ago(s.now - a.at)} ago · while release v{a.release.toString()} was live
            </p>
            <dl className="facts">
              <dt>
                Observed
                <Tip term="the observed hash">A fingerprint of what the watcher saw when it raised this alert.</Tip>
              </dt>
              <dd>
                <CopyField value={a.observed} shown={short(a.observed)} label="observed hash" />
              </dd>
            </dl>
            <p className="small muted">The observed hash is the {OBSERVED[a.kind] ?? "evidence hash"}.</p>
          </>
        )}
        <p className="small muted">The chain keeps only the latest alert. Source: ReleaseGate.lastAlert.</p>
      </div>

      <div className="ev-block" data-testid="live-check">
        <h2>
          Website check
          <Tip term="the website check">A fresh comparison of the live website with the approved release, done by the status server. It is one network's view.</Tip>
        </h2>
        {site.isPending && <p className="muted">Checking now…</p>}
        {site.error instanceof NoApiError && (
          <>
            <p className="ev-value">Not on this copy</p>
            <p className="small muted">This host has no status server, so there is no website check here.</p>
          </>
        )}
        {site.isError && !(site.error instanceof NoApiError) && (
          <>
            <p className="ev-value">Unavailable</p>
            <p className="small muted">{site.error.message}</p>
            <button type="button" onClick={onRetry}>
              <Refresh /> Try again
            </button>
          </>
        )}
        {siteData && checked !== undefined && (
          <>
            <p className="ev-value">{siteData.status === "ok" ? `Matches release v${siteData.liveRelease}` : siteData.status === "warn" ? `Matches release v${siteData.liveRelease} (an alert is open)` : siteData.status === "alert" ? "Differs from the approved release" : "Could not be confirmed"}</p>
            <p className="small muted">
              {utc(checked)} ({ageText((now - checked) / 1000)} ago)
            </p>
          </>
        )}
        <p className="small muted">Source: the status server, one network's view. The watcher and the Guard check separately.</p>
      </div>
    </section>
  );
}

function VerifiedCopy({ url, urgent }: { url: string; urgent: boolean }) {
  return (
    <section className="card" data-testid="verified-copy">
      <h2>Verified copy</h2>
      <p>The files the maintainers approved, served from the chain by DeWEB. No server can change them. Pin this link{urgent ? " and use it instead of the usual website" : ""}.</p>
      <p>
        <a className={`btn${urgent ? " primary" : ""}`} href={url} target="_blank" rel="noopener noreferrer">
          Open the verified copy <OpenNewWindow size={18} />
        </a>
      </p>
      <p className="mono small">{url}</p>
    </section>
  );
}

/** Addresses that appear only in the changed website. Triage, not proof: the card says so. */
function Suspects({ target, list }: { target: Target; list: string[] }) {
  const explorer = target.chain.blockExplorers?.default.url;
  return (
    <section className="card suspects" data-testid="suspects">
      <h2>
        <ShieldAlert className="icon" style={{ verticalAlign: "-4px", marginRight: 8 }} />
        Suspected attacker addresses
      </h2>
      <p className="muted">
        Found in the files the website serves now, and in none of the approved release's files. This is a best-effort comparison, so an address the attacker
        hid or loads at runtime is not listed. Never approve or send anything to these.
      </p>
      <ul className="plain">
        {list.map((a) => (
          <li key={a} data-testid="suspect">
            <CopyField value={a} label="address" />
            {explorer && (
              <a href={`${explorer}/address/${a}`} target="_blank" rel="noopener noreferrer">
                OKLink <OpenNewWindow size={16} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

const METRICS_URL = "https://github.com/syther069/hashfront/blob/main/docs/metrics.md";

/** What the chain can say about the watcher, and where the measured numbers live. It is not a live heartbeat. */
function WatcherHealth({ s }: { s: Snapshot }) {
  const a = s.lastAlert;
  const last = a.kind === 0 ? "The watcher has not reported anything on chain yet." : `Last onchain report: ${ALERT_KIND[a.kind] ?? "alert"}, ${ago(s.now - a.at)} ago.`;
  return (
    <div data-testid="watcher-health">
      <p className="muted">
        {last} The chain only shows reports, not whether the watcher is running right now. Measured uptime, check and OKX API latency, time to alert and
        false alarms from real runs are in the{" "}
        <a href={METRICS_URL} target="_blank" rel="noopener noreferrer">metrics report</a>.
      </p>
    </div>
  );
}

function Technical({ s, target, table }: { s: Snapshot; target: Target; table: Table }) {
  const { info } = s;
  const explorer = target.chain.blockExplorers?.default.url;
  return (
    <>
      <dl className="facts">
        <dt>Network</dt>
        <dd>{target.chain.name}</dd>
        <dt>Gate</dt>
        <dd>
          <CopyField value={target.gate} label="gate address" />{" "}
          {explorer && (
            <a href={`${explorer}/address/${target.gate}`} target="_blank" rel="noopener noreferrer">
              Explorer <OpenNewWindow size={16} />
            </a>
          )}
        </dd>
        <dt>Release policy</dt>
        <dd>
          {table.ok && table.v1 ? `2 of 3 maintainers + ${ago(info.timelock)} timelock, or 3 of 3 at once.` : `Custom policy circuit (see the table below); timelock ${ago(info.timelock)}.`}{" "}
          {info.frozen ? <strong className="bad">FROZEN: no release can go live.</strong> : "Not frozen."}
          <OkbPrice />
        </dd>
        <dt>Maintainers</dt>
        <dd>
          <ol className="maintainers">
            {info.maintainers.map((m, i) => (
              <li key={m}>
                M{i + 1} <code>{m}</code>
              </li>
            ))}
          </ol>
        </dd>
      </dl>
      {info.migrated && <p className="bad">This gate was migrated and no longer accepts releases.</p>}
      <Policy s={s} table={table} />
      <Badge target={target} />
      <TapeSendInbox container={info.container} chainId={target.chain.id} />
    </>
  );
}

/** How a TapeOut project with its own DeWEB container gets this site's alerts in its TapeSend inbox. */
function TapeSendInbox({ container, chainId }: { container: string; chainId: number }) {
  const [addr, setAddr] = useState("");
  const own = tapesendEndpoint(container, chainId);
  const theirs = addr.trim() ? tapesendEndpoint(addr, chainId) : undefined;
  return (
    <section className="subsection" data-testid="tapesend-inbox">
      <h3>Get alerts on TapeSend</h3>
      <p className="muted">
        Every alert is sent on chain from this site's own DeWEB container, as fixed text with no links. It lands in this site's inbox
        {own ? (
          <>
            {" "}
            (<CopyField value={own} shown={`${own.slice(0, 10)}…${own.slice(-6)}`} label="this site's endpoint id" />)
          </>
        ) : null}{" "}
        and in up to 7 more inboxes the team adds to its watcher. To read TapeSend you need your own opened DeWEB container, which a TapeOut project with a DeWEB site
        already has.
      </p>
      <label className="field-label" htmlFor="tapesend-container">
        Your container address
      </label>
      <input id="tapesend-container" className="addr" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="0x… your DeWEB container" spellCheck={false} autoComplete="off" data-testid="tapesend-container" />
      {addr.trim() && !theirs && <p className="error small">That is not a 0x address of 40 hex characters.</p>}
      {theirs && (
        <p className="small">
          Your endpoint id: <CopyField value={theirs} label="your endpoint id" />. Send it to this site's team. They add it to the watcher
          (<code>--tapesend-to self,{theirs.slice(0, 10)}…</code>), which costs them about 100k extra gas per alert.
        </p>
      )}
    </section>
  );
}

/** Release cards: which release, which root an approval signs, who approved, and where the timelock stands. */
function Releases({ s, target }: { s: Snapshot; target: Target }) {
  if (!s.releases.length) return <p className="muted">No release has been proposed yet. A maintainer proposes one with the Hashfront CLI.</p>;
  return (
    <div className="releases" data-testid="releases">
      {s.releases.map((r) => (
        <article className="release" key={r.id.toString()} data-testid={`release-${r.id}`}>
          <header>
            <h3>v{r.id.toString()}</h3>
            <span className={`pill ${r.status}`}>{stateLabel(r)}</span>
          </header>
          <dl className="facts">
            <dt>Approval signs</dt>
            <dd>
              release v{r.id.toString()} · root <code title={r.root}>{short(r.root)}</code> · {r.totalChunks} chunks
            </dd>
            <dt>Approvals</dt>
            <dd data-testid={`approvals-${r.id}`}>
              {r.approvalCount}/3 {r.approvalCount > 0 && <span className="muted">({approvers(r.approvals).map((i) => `M${i + 1}`).join(", ")})</span>}
            </dd>
            <dt>Who</dt>
            <dd>
              <ul className="slots">
                {s.info.maintainers.map((m, i) => {
                  const yes = approvers(r.approvals).includes(i);
                  return (
                    <li key={m} className={yes ? "yes" : "no"}>
                      <span>M{i + 1}</span> <code title={m}>{short(m)}</code> <span className="slot-state">{yes ? "approved" : "not yet"}</span>
                    </li>
                  );
                })}
              </ul>
            </dd>
            <dt>
              Timelock
              <Tip term="the timelock">A waiting period after a release is sealed, so everyone can look at it before it can go live.</Tip>
            </dt>
            <dd>{timelockText(r, s)}</dd>
            <dt>
              Can go live now
              <Tip term="can go live now">The gate's own answer: do the approvals so far, and the timelock, allow this release to be activated?</Tip>
            </dt>
            <dd>{r.status === "pending" ? (r.wouldAllow ? <span className="good">yes</span> : "no") : "–"}</dd>
          </dl>
          {r.status === "pending" && (
            <p className="release-action">
              <a className="btn" href={linkFor(target, `#/approve/${r.id}`)}>
                Review and approve v{r.id.toString()}
              </a>
              <span className="small muted">The root is read from the chain. Load manifest.json on the review page to see which files it contains.</span>
            </p>
          )}
        </article>
      ))}
    </div>
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
      <section className="subsection">
        <h3>Policy circuit</h3>
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
    <section className="subsection">
      <h3>Policy circuit #{s.info.policyId.toString()}</h3>
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
    <section className="subsection">
      <h3>"Protected by Hashfront" badge</h3>
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

function OkbPrice() {
  const p = useOkbPrice();
  if (!p.data) return null;
  return (
    <span className="muted small" data-testid="okb-price">
      {" "}
      OKB ${p.data.okbUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })} (OKX Market API).
    </span>
  );
}
