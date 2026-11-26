// On-chain TapeSend alert through ReleaseGate.alert(): the gate owns the site container, so the message is sent
// from the protocol's own TapeSend identity, with fixed text decided on chain.
import { decodeEventLog, encodeFunctionData, hexToString, isHex, parseAbi, type Hex } from "viem";
import { releaseGateAbi } from "@hashfront/cli/abi";
import { sendGateTx, type Context } from "@hashfront/cli/context";
import { sendViaGateway } from "./gateway.ts";
import type { OkxClient } from "@hashfront/okx/client";
import type { AlertKind } from "./incident.ts";

export const MAX_ALERT_RECIPIENTS = 8;
const hubAbi = parseAbi(["function endpointOf(address container) view returns (bytes32)"]);

/** Parses --tapesend-to: comma-separated bytes32 endpoint ids, or "self" for the site container's own inbox. */
export async function resolveRecipients(ctx: Context, list: string): Promise<Hex[]> {
  const out: Hex[] = [];
  for (const raw of list.split(",").map((x) => x.trim()).filter(Boolean)) {
    if (raw === "self") {
      const [hub, container] = await Promise.all([
        ctx.publicClient.readContract({ address: ctx.gate, abi: releaseGateAbi, functionName: "hub" }),
        ctx.publicClient.readContract({ address: ctx.gate, abi: releaseGateAbi, functionName: "container" }),
      ]);
      out.push(await ctx.publicClient.readContract({ address: hub, abi: hubAbi, functionName: "endpointOf", args: [container] }));
    } else if (isHex(raw) && raw.length === 66) {
      out.push(raw.toLowerCase() as Hex);
    } else {
      throw new Error(`--tapesend-to: "${raw}" is not a bytes32 endpoint id or "self"`);
    }
  }
  if (!out.length || out.length > MAX_ALERT_RECIPIENTS) throw new Error(`--tapesend-to: 1 to ${MAX_ALERT_RECIPIENTS} recipients`);
  return [...new Set(out)];
}

/** The exact text the gate will publish, decoded from alertPayload(): "TS" 0x02 0x00 + JSON {subject, body}. */
export async function readAlertText(ctx: Context, kind: AlertKind, observed: Hex): Promise<{ subject: string; body: string }> {
  const payload = await ctx.publicClient.readContract({ address: ctx.gate, abi: releaseGateAbi, functionName: "alertPayload", args: [kind, observed] });
  if (!payload.startsWith("0x54530200")) throw new Error("alertPayload: unexpected TapeSend header");
  const json = JSON.parse(hexToString(`0x${payload.slice(10)}`)) as { subject?: unknown; body?: unknown };
  if (typeof json.subject !== "string" || typeof json.body !== "string") throw new Error("alertPayload: missing subject or body");
  return { subject: json.subject, body: json.body };
}

export interface TapeSendResult {
  tx: Hex;
  /** undefined when the transaction is mined but its Alert event could not be read */
  delivered?: bigint;
  failed?: bigint;
  /** how the signed transaction reached the chain */
  route: "okx-gateway+rpc" | "rpc";
  /** OKX Onchain Gateway order id, when the gateway accepted the broadcast */
  orderId?: string;
}

/**
 * Sends alert(kind, observed, to) with the reporter key; resolves once the Alert event is on chain.
 *
 * With an OKX client the alert goes through the OKX Onchain Gateway: OKX simulates it first, prices it, and the
 * locally signed bytes are broadcast through OKX and the RPC at the same time. Same bytes, same hash: whichever
 * path is faster wins, the other is a harmless duplicate, so an incident's alert gets out even when the public RPC
 * is overloaded. Without OKX, or if the gateway errors before broadcast, it falls back to the plain RPC path.
 */
export async function sendTapeSend(ctx: Context, kind: AlertKind, observed: Hex, to: Hex[], okx?: OkxClient): Promise<TapeSendResult> {
  let sent: { tx: Hex; route: TapeSendResult["route"]; orderId?: string } | undefined;
  if (okx) sent = await sendViaGateway(ctx, okx, ctx.gate, encodeFunctionData({ abi: releaseGateAbi, functionName: "alert", args: [kind, observed, to] }));
  if (!sent) {
    const quiet: Context = { ...ctx, log: () => {} }; // keep stdout one JSON line per check
    sent = { tx: await sendGateTx(quiet, "alert", [kind, observed, to], "alert"), route: "rpc" };
  }
  const { tx } = sent;
  const base = { tx, route: sent.route, ...(sent.orderId ? { orderId: sent.orderId } : {}) };
  // From here on the alert is sent: never throw, or the next check would send a second onchain alert.
  try {
    const receipt = await ctx.publicClient.getTransactionReceipt({ hash: tx });
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== ctx.gate.toLowerCase()) continue;
      try {
        const ev = decodeEventLog({ abi: releaseGateAbi, data: log.data, topics: log.topics });
        if (ev.eventName === "Alert") return { ...base, delivered: ev.args.delivered, failed: ev.args.failed };
      } catch {
        // another gate event
      }
    }
  } catch {
    // counts unavailable
  }
  return base;
}
