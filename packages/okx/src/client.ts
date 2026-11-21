// Signed client for the OKX Onchain OS REST API (https://web3.okx.com/onchainos/dev-docs/home/api-access-and-usage).
//
//   sign = Base64(HMAC-SHA256(secretKey, timestamp + METHOD + requestPath[?query] + rawBody))
//   headers OK-ACCESS-KEY, OK-ACCESS-SIGN, OK-ACCESS-TIMESTAMP (ISO UTC), OK-ACCESS-PASSPHRASE
//
// Server-side only: the secret must never reach a browser bundle, a log line or an error message. Keys are read
// from OKX_API_KEY / OKX_SECRET_KEY / OKX_API_PASSPHRASE, or passed in by the caller.
import { createHmac } from "node:crypto";

export const OKX_BASE_URL = "https://web3.okx.com";
/** X Layer mainnet in OKX's chainIndex numbering. */
export const XLAYER = "196";

export interface OkxCredentials {
  apiKey: string;
  secretKey: string;
  passphrase: string;
}

export interface OkxClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  /** attempts for retryable failures (429, 5xx, network); default 3 */
  attempts?: number;
  now?: () => Date;
  /** waits between retries; injectable so tests run instantly */
  sleep?: (ms: number) => Promise<void>;
}

export class OkxError extends Error {
  override name = "OkxError";
  readonly path: string;
  readonly code: string | undefined;
  readonly status: number | undefined;
  constructor(message: string, path: string, code?: string, status?: number) {
    super(message);
    this.path = path;
    this.code = code;
    this.status = status;
  }
}

export function sign(secretKey: string, timestamp: string, method: string, requestPath: string, body = ""): string {
  return createHmac("sha256", secretKey).update(timestamp + method.toUpperCase() + requestPath + body).digest("base64");
}

/** Credentials from the environment, or undefined when any of the three is missing. */
export function credentialsFromEnv(env: NodeJS.ProcessEnv = process.env): OkxCredentials | undefined {
  const apiKey = env.OKX_API_KEY?.trim();
  const secretKey = env.OKX_SECRET_KEY?.trim();
  const passphrase = env.OKX_API_PASSPHRASE?.trim();
  return apiKey && secretKey && passphrase ? { apiKey, secretKey, passphrase } : undefined;
}

type Query = Record<string, string | number | undefined>;

export class OkxClient {
  readonly #creds: OkxCredentials;
  readonly #o: Required<Omit<OkxClientOptions, "fetch">> & { fetch: typeof fetch };
  readonly #cache = new Map<string, { until: number; value: unknown }>();

  constructor(creds: OkxCredentials, opts: OkxClientOptions = {}) {
    this.#creds = creds;
    this.#o = {
      baseUrl: opts.baseUrl ?? OKX_BASE_URL,
      fetch: opts.fetch ?? fetch,
      timeoutMs: opts.timeoutMs ?? 10_000,
      attempts: opts.attempts ?? 3,
      now: opts.now ?? (() => new Date()),
      sleep: opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))),
    };
  }

  get<T>(path: string, query: Query = {}, opts: { cacheMs?: number } = {}): Promise<T> {
    const pairs: [string, string][] = [];
    for (const [k, v] of Object.entries(query)) if (v !== undefined) pairs.push([k, String(v)]);
    const qs = new URLSearchParams(pairs).toString();
    return this.#cached(`GET ${path}?${qs}`, opts.cacheMs, () => this.#send<T>("GET", qs ? `${path}?${qs}` : path, undefined, true));
  }

  /** @param retry false for calls that must not be repeated blindly */
  post<T>(path: string, body: unknown, opts: { cacheMs?: number; retry?: boolean } = {}): Promise<T> {
    const raw = JSON.stringify(body);
    return this.#cached(`POST ${path} ${raw}`, opts.cacheMs, () => this.#send<T>("POST", path, raw, opts.retry !== false));
  }

  async #cached<T>(key: string, ms: number | undefined, fn: () => Promise<T>): Promise<T> {
    if (!ms) return fn();
    const hit = this.#cache.get(key);
    const now = Date.now();
    if (hit && hit.until > now) return hit.value as T;
    const value = await fn();
    this.#cache.set(key, { until: now + ms, value });
    return value;
  }

  async #send<T>(method: "GET" | "POST", requestPath: string, body: string | undefined, retry: boolean): Promise<T> {
    const path = requestPath.split("?")[0]!;
    let last: OkxError | undefined;
    for (let attempt = 1; attempt <= (retry ? this.#o.attempts : 1); attempt++) {
      if (attempt > 1) await this.#o.sleep(250 * 2 ** (attempt - 2) + Math.floor(Math.random() * 100));
      const timestamp = this.#o.now().toISOString();
      const headers: Record<string, string> = {
        "OK-ACCESS-KEY": this.#creds.apiKey,
        "OK-ACCESS-SIGN": sign(this.#creds.secretKey, timestamp, method, requestPath, body ?? ""),
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": this.#creds.passphrase,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      };
      let res: Response;
      try {
        res = await this.#o.fetch(this.#o.baseUrl + requestPath, { method, headers, ...(body !== undefined ? { body } : {}), signal: AbortSignal.timeout(this.#o.timeoutMs) });
      } catch (err) {
        last = new OkxError(this.#redact(`network error: ${err instanceof Error ? err.message : String(err)}`), path);
        continue;
      }
      const text = await res.text();
      let parsed: { code?: string | number; msg?: string; data?: unknown } | undefined;
      try {
        parsed = JSON.parse(text) as typeof parsed;
      } catch {
        parsed = undefined;
      }
      if (res.status === 429 || res.status >= 500) {
        last = new OkxError(this.#redact(`HTTP ${res.status}${parsed?.msg ? `: ${parsed.msg}` : ""}`), path, parsed?.code?.toString(), res.status);
        continue;
      }
      if (!parsed) throw new OkxError(`HTTP ${res.status}: response is not JSON`, path, undefined, res.status);
      if (String(parsed.code) !== "0") {
        throw new OkxError(this.#redact(`OKX error ${parsed.code}: ${parsed.msg || "no message"}`), path, String(parsed.code), res.status);
      }
      return parsed.data as T;
    }
    throw last ?? new OkxError("request failed", path);
  }

  /** Error text never carries a credential, even if a server or proxy echoes one back. */
  #redact(text: string): string {
    let out = text;
    for (const v of [this.#creds.apiKey, this.#creds.secretKey, this.#creds.passphrase]) if (v) out = out.split(v).join("<redacted>");
    return out;
  }
}
