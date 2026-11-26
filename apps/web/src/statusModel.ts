// What the status page may claim. A pure function from what the page actually knows (the gate on chain, and the status
// server's own check of the website) to one headline, so the rule "never show green unless everything supporting it is
// present, fresh and agrees" lives in one tested place and not scattered through components.

export type Tone = "bad" | "warn" | "neutral" | "good";
export type StatusKind = "loading" | "unreadable" | "migrated" | "no-release" | "alert" | "site-differs" | "cannot-confirm" | "no-site-check" | "matches";
export type Action = "verified-copy" | "check-approvals" | "retry" | "none";

/** How old chain data and a site check may be before the page stops treating them as current. Product choices, not guarantees. */
export const CHAIN_STALE_MS = 60_000;
export const SITE_STALE_MS = 120_000;

export interface ChainFacts {
  liveRelease: bigint;
  migrated: boolean;
  frozen: boolean;
  /** ReleaseGate.lastAlert: 0 none, 1 website mismatch, 2 domain records changed, 3 all clear */
  alertKind: number;
  /** seconds since the latest alert, by chain time; undefined when there was none */
  alertAgeS: number | undefined;
  alertRelease: bigint;
}

export interface SiteFacts {
  status: "ok" | "alert" | "unknown";
  liveRelease: number;
  /** when the status server did the check (its own clock, from the response) */
  checkedAtMs: number;
}

export interface StatusInputs {
  nowMs: number;
  chain: { facts: ChainFacts | undefined; error: string | undefined; fetchedAtMs: number | undefined; refreshFailed: boolean };
  site: { pending: boolean; failed: boolean; facts: SiteFacts | undefined };
  hasVerifiedCopy: boolean;
}

export interface Notice {
  id: "frozen" | "closed-alert";
  text: string;
}

export interface StatusView {
  kind: StatusKind;
  tone: Tone;
  headline: string;
  detail: string;
  /** why this is not the green state, when it is not */
  reasons: string[];
  notices: Notice[];
  primary: Action;
  secondary: Action;
}

export function ageText(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 90) return `${s} s`;
  const m = Math.round(s / 60);
  return m < 90 ? `${m} min` : `${Math.round(m / 60)} h`;
}

const utc = (ms: number) => `${new Date(ms).toISOString().slice(11, 19)} UTC`;

const ALERT_HEADLINE: Record<number, string> = {
  1: "Open alert: website does not match the approved release",
  2: "Open alert: domain records changed",
};

export function statusOf(i: StatusInputs): StatusView {
  const base = { reasons: [] as string[], notices: [] as Notice[], secondary: "none" as Action };
  const c = i.chain.facts;

  if (!c) {
    return i.chain.error
      ? { ...base, kind: "unreadable", tone: "bad", headline: "Cannot read the gate", detail: i.chain.error, primary: "retry", secondary: i.hasVerifiedCopy ? "verified-copy" : "none" }
      : { ...base, kind: "loading", tone: "neutral", headline: "Reading the gate from the chain", detail: "", primary: "none" };
  }

  const notices: Notice[] = [];
  if (c.frozen) notices.push({ id: "frozen", text: "Releases are frozen: no release can go live until the maintainers unfreeze. This does not say anything about the website." });
  if (c.alertKind === 3 && c.alertAgeS !== undefined) notices.push({ id: "closed-alert", text: `An earlier alert was closed ${ageText(c.alertAgeS)} ago: the watcher reported all clear.` });

  const chainAgeMs = i.chain.fetchedAtMs === undefined ? Infinity : i.nowMs - i.chain.fetchedAtMs;
  const chainStale = i.chain.refreshFailed || chainAgeMs > CHAIN_STALE_MS;
  const chainNote = chainStale ? `The gate data on this page is ${Number.isFinite(chainAgeMs) ? ageText(chainAgeMs / 1000) : "of unknown age"} old${i.chain.refreshFailed ? " (the last refresh failed)" : ""}.` : undefined;
  const verified = i.hasVerifiedCopy ? "verified-copy" : "check-approvals";

  if (c.migrated) {
    return { ...base, notices, kind: "migrated", tone: "warn", headline: "This gate was replaced", detail: "Its maintainers moved the site to a new gate and this one no longer accepts releases. Look for the new status link from the protocol's team.", primary: "none" };
  }
  if (c.alertKind === 1 || c.alertKind === 2) {
    const when = c.alertAgeS === undefined ? "" : ` Reported ${ageText(c.alertAgeS)} ago while v${c.alertRelease} was live.`;
    const siteOk = i.site.facts?.status === "ok" ? " The status server's own check currently sees a matching site, but the alert has not been closed onchain." : "";
    return {
      ...base,
      notices,
      kind: "alert",
      tone: "bad",
      headline: ALERT_HEADLINE[c.alertKind]!,
      detail: `Do not connect your wallet or sign anything on the usual website until the team confirms.${when}${siteOk}`,
      reasons: chainNote ? [chainNote] : [],
      primary: verified,
      secondary: i.hasVerifiedCopy ? "check-approvals" : "none",
    };
  }

  if (c.liveRelease === 0n) {
    return { ...base, notices, kind: "no-release", tone: "neutral", headline: "No release is live yet", detail: "Nothing has been approved and activated, so there is nothing to compare the website with.", primary: "none" };
  }

  const s = i.site.facts;
  if (!i.site.pending && !i.site.failed && s?.status === "alert") {
    return {
      ...base,
      notices,
      kind: "site-differs",
      tone: "bad",
      headline: "The website differs from the approved release",
      detail: `The status server saw it at ${utc(s.checkedAtMs)}. This is not reported onchain yet: the watcher alerts after two checks in a row. Do not connect your wallet or sign anything there until the team confirms.`,
      reasons: chainNote ? [chainNote] : [],
      primary: verified,
      secondary: i.hasVerifiedCopy ? "check-approvals" : "none",
    };
  }

  const reasons: string[] = [];
  if (chainNote) reasons.push(chainNote);

  if (i.site.pending || i.site.failed || !s) {
    return {
      ...base,
      notices,
      kind: "no-site-check",
      tone: "neutral",
      headline: "No alert reported onchain",
      detail: i.site.pending ? "Checking the live website now." : "The live website check is unavailable right now, so this page cannot say the site matches. An open alert would show here.",
      reasons,
      primary: i.site.pending ? "none" : "retry",
      secondary: i.hasVerifiedCopy ? "verified-copy" : "none",
    };
  }

  const siteAgeMs = i.nowMs - s.checkedAtMs;
  if (s.status === "unknown") reasons.push("The status server could not match the website to the live release. That can mean the host is behind a release, sits behind a CDN that changes files, or could not be reached.");
  if (s.liveRelease !== Number(c.liveRelease)) reasons.push(`The status server compared against v${s.liveRelease}, but the gate says v${c.liveRelease} is live.`);
  if (siteAgeMs > SITE_STALE_MS) reasons.push(`The last website check is ${ageText(siteAgeMs / 1000)} old (${utc(s.checkedAtMs)}).`);

  if (reasons.length) {
    return { ...base, notices, kind: "cannot-confirm", tone: "warn", headline: "Cannot confirm the website right now", detail: "No alert is open onchain, but the page cannot say the site matches the approved release. If in doubt, use the verified copy.", reasons, primary: i.hasVerifiedCopy ? "verified-copy" : "retry", secondary: "none" };
  }

  return {
    ...base,
    notices,
    kind: "matches",
    tone: "good",
    headline: `Site matches approved release v${c.liveRelease}`,
    detail: `Checked at ${utc(s.checkedAtMs)} from the status server's network. The watcher and the Guard check separately. This is not a guarantee about what any one visitor is served.`,
    primary: "none",
    secondary: i.hasVerifiedCopy ? "verified-copy" : "none",
  };
}
