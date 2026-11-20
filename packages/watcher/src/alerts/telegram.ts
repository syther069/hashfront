// Telegram Bot API sender. The token comes from the environment only and never appears in output or errors.
import { errorText } from "../signals/util.ts";

export const TELEGRAM_API = "https://api.telegram.org";

export interface TelegramConfig {
  token: string;
  /** community channel or group */
  chat: string;
  /** optional team-only chat */
  teamChat?: string;
  /** API base; overridden only by tests (a local mock) */
  api?: string;
  fetch?: typeof fetch;
}

/**
 * Alerts never carry a link: a hijacker's goal is to get people onto a page, and Telegram turns bare domains into
 * links. Reject anything that looks like one before it is sent.
 */
export function findLink(text: string): string | undefined {
  const m = /https?|:\/\/|\bwww\.|\b[a-z0-9-]+\.(?:[a-z]{2,24})\b/i.exec(text);
  return m?.[0];
}

export function assertNoLink(text: string): void {
  const hit = findLink(text);
  if (hit !== undefined) throw new Error(`refusing to send an alert that contains a link-like "${hit}"`);
}

export function redact(text: string, token: string): string {
  return token ? text.split(token).join("<redacted>") : text;
}

/** Sends one message; resolves on Telegram's ok:true, otherwise rejects with a redacted reason. */
export async function sendTelegram(cfg: TelegramConfig, chat: string, text: string): Promise<void> {
  assertNoLink(text);
  const f = cfg.fetch ?? fetch;
  try {
    const res = await f(`${cfg.api ?? TELEGRAM_API}/bot${cfg.token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!res.ok || body.ok !== true) throw new Error(`Telegram HTTP ${res.status}: ${body.description ?? "no description"}`);
  } catch (err) {
    throw new Error(redact(errorText(err), cfg.token));
  }
}
