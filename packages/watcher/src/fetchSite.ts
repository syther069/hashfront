// Fetches release paths from the protocol's normal website exactly as a user's browser would get them.
import type { Fetched } from "./compare.ts";

export interface FetchOptions {
  timeoutMs?: number;
  /** larger responses are cut off and reported as a failure (SiteRegistry files are at most 8.4 MB) */
  maxBytes?: number;
  concurrency?: number;
  fetchImpl?: typeof fetch;
}

const DEFAULTS = { timeoutMs: 15_000, maxBytes: 9_000_000, concurrency: 6 } as const;

/** URL a release path is served at on the normal host. index.html is the site root, as users open it. */
export function urlFor(site: URL, releasePath: string): string {
  const base = site.href.endsWith("/") ? site.href : `${site.href}/`;
  if (releasePath === "index.html") return base;
  return new URL(releasePath.split("/").map(encodeURIComponent).join("/"), base).href;
}

async function readCapped(res: Response, maxBytes: number): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`response larger than ${maxBytes} bytes`);
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.byteLength;
  }
  return out;
}

export async function fetchOne(url: string, opts: FetchOptions = {}): Promise<Fetched> {
  const { timeoutMs, maxBytes } = { ...DEFAULTS, ...opts };
  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(url, {
      redirect: "follow",
      cache: "no-store",
      headers: { "cache-control": "no-cache", pragma: "no-cache", "user-agent": "hashfront-watcher/0.1" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 404 || res.status === 410) {
      await res.body?.cancel();
      return { ok: false, missing: true, error: `HTTP ${res.status}` };
    }
    if (!res.ok) {
      await res.body?.cancel();
      return { ok: false, missing: false, error: `HTTP ${res.status}` };
    }
    return { ok: true, bytes: await readCapped(res, maxBytes), finalUrl: res.url || url };
  } catch (err) {
    return { ok: false, missing: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Fetches every path (deduplicated) with bounded concurrency. */
export async function fetchServed(site: URL, paths: Iterable<string>, opts: FetchOptions = {}): Promise<Map<string, Fetched>> {
  const queue = [...new Set(paths)];
  const out = new Map<string, Fetched>();
  const workers = Array.from({ length: Math.min(opts.concurrency ?? DEFAULTS.concurrency, queue.length) }, async () => {
    for (let p = queue.shift(); p !== undefined; p = queue.shift()) out.set(p, await fetchOne(urlFor(site, p), opts));
  });
  await Promise.all(workers);
  return out;
}
