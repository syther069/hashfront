// Turns a watcher JSON-lines log into the numbers the README states: uptime, check and OKX latency, incidents, time
// to alert and false alarms. Pure (strings in, text out), so every definition here is tested.

export interface Line {
  at: string;
  status?: string;
  ms?: number;
  perf?: { checkMs?: number; rpcMs?: number; okxMs?: Record<string, number> };
  alerts?: { channel?: string; audience?: string; kind?: number | string; ok?: boolean }[];
  error?: string;
}

/** Parses JSONL; blank and non-JSON lines (a banner, a partial write at Ctrl+C) are counted, not fatal. */
export function parseLog(text: string): { lines: Line[]; skipped: number } {
  const lines: Line[] = [];
  let skipped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const t = raw.trim();
    if (!t) continue;
    try {
      const o = JSON.parse(t) as Line;
      if (o && typeof o.at === "string" && Number.isFinite(Date.parse(o.at))) lines.push(o);
      else skipped++;
    } catch {
      skipped++;
    }
  }
  lines.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return { lines, skipped };
}

/** Nearest-rank percentile of a non-empty list. */
export function percentile(values: number[], p: number): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)] ?? 0;
}

export interface Drill {
  from: number;
  to: number;
}

export interface Incident {
  startedAt: string;
  /** first check that was not MATCH */
  endedAt: string | undefined;
  /** seconds from the first bad check to the first delivered community alert, if one was delivered */
  timeToAlertS: number | undefined;
  /** inside a rehearsal window the team declared */
  drill: boolean;
  statuses: string[];
}

export interface Report {
  checks: number;
  errors: number;
  skipped: number;
  from: string;
  to: string;
  intervalS: number;
  /** checks that ran, over checks that should have run at the usual interval between the first and the last */
  uptimePct: number;
  gaps: { from: string; to: string; seconds: number }[];
  statusCounts: Record<string, number>;
  checkMs: { p50: number; p95: number; max: number };
  rpcMs: { p50: number; p95: number } | undefined;
  okx: { endpoint: string; n: number; p50: number; p95: number }[];
  incidents: Incident[];
  communityAlerts: number;
  /** community alerts (mismatch or DNS) that were not inside a declared drill window */
  falseAlarms: number;
  days: number;
}

const isCommunityAlert = (a: NonNullable<Line["alerts"]>[number]) => a.audience === "community" && a.ok === true && (Number(a.kind) === 1 || Number(a.kind) === 2);

export function analyse(lines: Line[], opts: { drills?: Drill[]; skipped?: number } = {}): Report {
  const drills = opts.drills ?? [];
  const checks = lines.filter((l) => l.status !== undefined);
  const errors = lines.filter((l) => l.error !== undefined).length;
  const times = checks.map((c) => Date.parse(c.at));
  const gapsMs = times.slice(1).map((t, i) => t - times[i]!);
  const interval = gapsMs.length ? percentile(gapsMs, 50) : 0;

  // a gap is a stretch with no check for more than 3 usual intervals (the PC slept, the process died)
  const gaps = gapsMs.flatMap((g, i) => (interval > 0 && g > 3 * interval ? [{ from: checks[i]!.at, to: checks[i + 1]!.at, seconds: Math.round(g / 1000) }] : []));
  const span = times.length > 1 ? times[times.length - 1]! - times[0]! : 0;
  const expected = interval > 0 ? Math.floor(span / interval) + 1 : checks.length;
  const uptimePct = expected > 0 ? Math.min(100, (checks.length / expected) * 100) : 0;

  const statusCounts: Record<string, number> = {};
  for (const c of checks) statusCounts[c.status!] = (statusCounts[c.status!] ?? 0) + 1;

  const checkMs = checks.map((c) => c.perf?.checkMs ?? c.ms).filter((v): v is number => typeof v === "number");
  const rpcMs = checks.map((c) => c.perf?.rpcMs).filter((v): v is number => typeof v === "number");
  const byEndpoint = new Map<string, number[]>();
  for (const c of checks) for (const [path, ms] of Object.entries(c.perf?.okxMs ?? {})) byEndpoint.set(path, [...(byEndpoint.get(path) ?? []), ms]);

  const incidents: Incident[] = [];
  let open: { start: Line; statuses: Set<string>; alertAt?: number } | undefined;
  let communityAlerts = 0;
  let falseAlarms = 0;
  for (const c of lines) {
    const bad = c.status !== undefined && c.status !== "MATCH";
    const inDrill = (t: number) => drills.some((d) => t >= d.from && t <= d.to);
    if (bad && !open) open = { start: c, statuses: new Set() };
    if (open && c.status !== undefined) open.statuses.add(c.status);
    for (const a of c.alerts ?? []) {
      if (!isCommunityAlert(a)) continue;
      communityAlerts++;
      const t = Date.parse(c.at);
      if (!inDrill(t) && !(open && inDrill(Date.parse(open.start.at)))) falseAlarms++;
      if (open && open.alertAt === undefined) open.alertAt = t;
    }
    if (open && c.status === "MATCH") {
      incidents.push(close(open, c.at, drills));
      open = undefined;
    }
  }
  if (open) incidents.push(close(open, undefined, drills));

  const days = span / 86_400_000;
  return {
    checks: checks.length,
    errors,
    skipped: opts.skipped ?? 0,
    from: checks[0]?.at ?? "",
    to: checks[checks.length - 1]?.at ?? "",
    intervalS: Math.round(interval / 1000),
    uptimePct,
    gaps,
    statusCounts,
    checkMs: checkMs.length ? { p50: percentile(checkMs, 50), p95: percentile(checkMs, 95), max: Math.max(...checkMs) } : { p50: 0, p95: 0, max: 0 },
    rpcMs: rpcMs.length ? { p50: percentile(rpcMs, 50), p95: percentile(rpcMs, 95) } : undefined,
    okx: [...byEndpoint].map(([endpoint, v]) => ({ endpoint, n: v.length, p50: percentile(v, 50), p95: percentile(v, 95) })).sort((a, b) => a.endpoint.localeCompare(b.endpoint)),
    incidents,
    communityAlerts,
    falseAlarms,
    days,
  };
}

function close(o: { start: Line; statuses: Set<string>; alertAt?: number }, end: string | undefined, drills: Drill[]): Incident {
  const start = Date.parse(o.start.at);
  return {
    startedAt: o.start.at,
    endedAt: end,
    timeToAlertS: o.alertAt === undefined ? undefined : Math.round((o.alertAt - start) / 1000),
    drill: drills.some((d) => start >= d.from && start <= d.to),
    statuses: [...o.statuses].filter((s) => s !== "MATCH"),
  };
}

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

export function toMarkdown(r: Report, generated: string): string {
  const out: string[] = [];
  out.push("# Watcher metrics", "", `Generated ${generated} from \`.watcher/watch.jsonl\` by \`scripts/metrics-report.ts\`. Numbers are measured, not estimated.`, "");
  if (r.checks === 0) return `${out.join("\n")}No checks in the log yet.\n`;
  out.push("## Coverage", "");
  out.push(`- Window: ${r.from} to ${r.to} (${f1(r.days)} days)`);
  out.push(`- Checks: ${r.checks} at about ${r.intervalS} s; error lines: ${r.errors}; unreadable lines skipped: ${r.skipped}`);
  out.push(`- Uptime: **${f1(r.uptimePct)} %** (checks that ran over checks expected at the usual interval)`);
  out.push(`- Gaps longer than 3 intervals: ${r.gaps.length}${r.gaps.length ? ` (${r.gaps.map((g) => `${g.from} to ${g.to}, ${g.seconds} s`).join("; ")})` : ""}`);
  out.push(`- Statuses: ${Object.entries(r.statusCounts).map(([k, v]) => `${k} ${v}`).join(", ")}`, "");
  out.push("## Latency (ms)", "", "| | p50 | p95 | max |", "|---|---|---|---|");
  out.push(`| whole check | ${r.checkMs.p50} | ${r.checkMs.p95} | ${r.checkMs.max} |`);
  if (r.rpcMs) out.push(`| chain reads (RPC) | ${r.rpcMs.p50} | ${r.rpcMs.p95} | |`);
  for (const e of r.okx) out.push(`| OKX \`${e.endpoint}\` (${e.n} checks) | ${e.p50} | ${e.p95} | |`);
  if (!r.okx.length) out.push("| OKX API | no OKX call in this log | | |");
  out.push("", "## Incidents", "");
  if (!r.incidents.length) out.push("None: every check matched the approved release.");
  else {
    out.push("| Started (UTC) | Ended | Statuses | Time to alert | Drill |", "|---|---|---|---|---|");
    for (const i of r.incidents) out.push(`| ${i.startedAt} | ${i.endedAt ?? "open"} | ${i.statuses.join(", ")} | ${i.timeToAlertS === undefined ? "no alert" : `${i.timeToAlertS} s`} | ${i.drill ? "yes" : "no"} |`);
  }
  out.push("", `Community alerts delivered: ${r.communityAlerts}. **False alarms: ${r.falseAlarms}** (alerts outside a declared rehearsal window${r.days >= 1 ? `, ${f1(r.falseAlarms / r.days)} per day` : ""}).`, "");
  return `${out.join("\n")}\n`;
}
