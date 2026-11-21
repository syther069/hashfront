// Alert dispatcher: one check in, the incident state machine, then delivery with per-channel retry.
// State is saved after every check, so a restart neither repeats an alert nor forgets an undelivered one.
import { readFile, rename, writeFile } from "node:fs/promises";
import type { Context } from "@hashfront/cli/context";
import { errorText } from "../signals/util.ts";
import type { CheckResult } from "../watch.ts";
import { emptyState, KIND, settle, step, type AlertState, type Channel, type Hex, type IncidentConfig, type Observation, type Outgoing, type TeamNotice } from "./incident.ts";
import { assertNoLink, sendTelegram, type TelegramConfig } from "./telegram.ts";
import { readAlertText, sendTapeSend } from "./tapesend.ts";
import { checkReporterGas, type GasStatus } from "./gas.ts";
import type { OkxClient } from "@hashfront/okx/client";

export interface AlertConfig {
  statePath: string;
  /** protocol name shown in Telegram messages; never a domain (Telegram would turn it into a link) */
  name: string;
  confirm?: number;
  clear?: number;
  telegram?: TelegramConfig;
  /** signer context (reporter key) and recipients for ReleaseGate.alert() */
  tapesend?: { ctx: Context; to: Hex[] };
  /** OKX Onchain OS client: balance + gas price for the gas guard, and the gateway for alert delivery */
  okx?: OkxClient;
  /** read-only context for alertPayload() */
  readCtx: Context;
}

export interface Delivery {
  channel: Channel;
  audience: Outgoing["audience"];
  kind: Outgoing["kind"];
  ok: boolean;
  detail?: string;
}

const TEAM_TEXT: Record<TeamNotice, string> = {
  "cdn-modified":
    "The website differs from the approved release only by CDN-injected tags (Rocket Loader or Web Analytics). This is not shown as safe: a hijacker can add the same tags. Turn those CDN features off, or confirm and allow-list the served hashes.",
  "deployed-before-activation": "The website serves a release that is sealed but not active onchain yet. Activate it, or roll the host back.",
  "host-behind": "The website still serves the previous release several minutes after activation. Deploy the live release to the host.",
  unreachable: "The website could not be fetched for several checks in a row. No community alert is sent for this.",
  unverifiable: "Some approved files could not be fetched for several checks in a row, so the website could not be verified.",
  "signal-warn": "A domain signal needs a look: a new address network, a new certificate issuer, an invalid certificate, or resolvers disagreeing.",
  "phishing-flag": "OnchainOS security dapp-scan flags the website as malicious. Check the domain now and send a community warning if it is confirmed.",
  "dns-unknown": "The domain's DNS records could not be checked for several checks in a row (resolvers failing, or no usable baseline). DNS changes are not being detected.",
  "reporter-gas-low": "The reporter wallet is low on OKB: fewer than 3 onchain alerts left at the current gas price. Top it up so a hijack alert can't fail for lack of gas.",
};

/** Same wording as the onchain message, so Telegram and TapeSend never disagree. */
const FALLBACK: Record<1 | 2 | 3, { subject: string; body: string }> = {
  1: {
    subject: "Hashfront alert: website does not match the approved release",
    body: "The usual website of this protocol is serving files that differ from the approved release. Do not connect your wallet or sign anything there. Use the Hashfront link you pinned earlier.",
  },
  2: {
    subject: "Hashfront alert: domain records changed",
    body: "The DNS records of this protocol's usual website changed unexpectedly. Do not connect your wallet or sign anything there until the team confirms. Use the Hashfront link you pinned earlier.",
  },
  3: { subject: "Hashfront: all clear", body: "The usual website of this protocol matches the approved release again." },
};

export function observationOf(r: CheckResult, extra: { reporterGasLow?: boolean } = {}): Observation {
  const s = r.signals;
  const dnsObs = s?.dns?.observation;
  return {
    status: r.verdict.status,
    contentObserved: r.verdict.observed as Hex,
    ...(s ? { signalLevel: s.level } : {}),
    dnsAlert: s?.dns?.changes.some((c) => c.severity === "alert") ?? false,
    dnsVerified: Boolean(dnsObs?.ok && s?.baseline === "compared"),
    dnsUnknown: Boolean(s && !s.skipped && (s.dns?.level === "unknown" || s.baseline === "not-recorded")),
    ...(dnsObs?.ok ? { dnsObserved: dnsObs.observed } : {}),
    scanMalicious: s?.scan?.result.status === "malicious",
    ...(extra.reporterGasLow !== undefined ? { reporterGasLow: extra.reporterGasLow } : {}),
    at: r.checkedAt,
  };
}

async function loadState(path: string): Promise<AlertState> {
  try {
    const s = JSON.parse(await readFile(path, "utf8")) as AlertState;
    if (s?.version !== 1 || !Array.isArray(s.outbox)) throw new Error(`${path}: not a Hashfront alert state file`);
    return s;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return emptyState();
    throw err;
  }
}

async function saveState(path: string, s: AlertState): Promise<void> {
  await writeFile(`${path}.tmp`, `${JSON.stringify(s, null, 2)}\n`);
  await rename(`${path}.tmp`, path);
}

export function validateName(name: string): string {
  const n = name.trim();
  if (!n || n.length > 40) throw new Error("--name must be 1 to 40 characters");
  assertNoLink(n);
  return n;
}

export function createDispatcher(cfg: AlertConfig) {
  const channels: Channel[] = [...(cfg.telegram ? (["telegram"] as const) : []), ...(cfg.tapesend ? (["tapesend"] as const) : [])];
  if (!channels.length) throw new Error("alerts need at least one channel (Telegram or TapeSend)");
  const incident: IncidentConfig = { confirm: cfg.confirm ?? 2, clear: cfg.clear ?? 3, channels, teamChat: Boolean(cfg.telegram?.teamChat) };
  let state: AlertState | undefined;

  async function communityText(kind: 1 | 2 | 3, observed: Hex): Promise<string> {
    let t = FALLBACK[kind];
    try {
      t = await readAlertText(cfg.readCtx, kind, observed);
    } catch {
      // chain unreachable: the fixed local copy of the same text
    }
    return `${cfg.name}: ${t.subject}\n\n${t.body}`;
  }

  async function deliver(m: Outgoing): Promise<Delivery[]> {
    const out: Delivery[] = [];
    for (const channel of m.pending) {
      try {
        if (channel === "telegram") {
          const tg = cfg.telegram!;
          if (m.audience === "team") {
            await sendTelegram(tg, tg.teamChat!, `${cfg.name} (team notice): ${TEAM_TEXT[m.kind as TeamNotice]}\n\nObserved hash: ${m.observed}`);
          } else {
            await sendTelegram(tg, tg.chat, await communityText(m.kind as 1 | 2 | 3, m.observed));
          }
          out.push({ channel, audience: m.audience, kind: m.kind, ok: true });
        } else {
          const tp = cfg.tapesend!;
          const r = await sendTapeSend(tp.ctx, m.kind as 1 | 2 | 3, m.observed, tp.to);
          // Sent once the Alert event is on chain, even if some deliveries failed: resending would duplicate the record.
          out.push({ channel, audience: m.audience, kind: m.kind, ok: true, detail: r.delivered === undefined ? `${r.tx} (delivery counts unavailable)` : `${r.tx} delivered ${r.delivered}, failed ${r.failed}` });
        }
      } catch (err) {
        out.push({ channel, audience: m.audience, kind: m.kind, ok: false, detail: errorText(err) });
      }
    }
    return out;
  }

  return {
    channels,
    /** Feeds one check through the state machine and delivers everything pending. Never throws for a failed send. */
    /** the reporter's gas at the last check (only when TapeSend alerts are on) */
    lastGas: undefined as GasStatus | undefined,
    async handle(r: CheckResult): Promise<Delivery[]> {
      state ??= await loadState(cfg.statePath);
      let reporterGasLow: boolean | undefined;
      if (cfg.tapesend?.ctx.account) {
        try {
          this.lastGas = await checkReporterGas(cfg.tapesend.ctx.publicClient, cfg.tapesend.ctx.account.address, cfg.okx);
          reporterGasLow = this.lastGas.low;
        } catch {
          this.lastGas = undefined; // unknown balance: no notice either way
        }
      }
      state = step(state, observationOf(r, reporterGasLow === undefined ? {} : { reporterGasLow }), incident).state;
      // saved before and after every send, so a crash mid-send neither loses an incident nor repeats a delivery
      await saveState(cfg.statePath, state);
      const deliveries: Delivery[] = [];
      for (const m of [...state.outbox]) {
        const results = await deliver(m);
        settle(state, m.id, results);
        await saveState(cfg.statePath, state);
        deliveries.push(...results);
      }
      return deliveries;
    },
  };
}

export type Dispatcher = ReturnType<typeof createDispatcher>;
export { KIND };
