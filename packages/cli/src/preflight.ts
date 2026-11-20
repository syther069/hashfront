// Pre-flight check of a static build before it becomes a release (plan step 12).
//
// A Hashfront release is served from two places: the protocol's normal host at "/", and DeWEB under
// "/releases/v<n>/". Anything that assumes it lives at "/" breaks on DeWEB, which is exactly the copy users fall back
// to during a hijack. Errors make the build unusable there; warnings are heuristics worth a look.
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { listFiles } from "./manifest.ts";
import { assertValidPath, MAX_FILE_SIZE } from "./release.ts";

export interface PreflightResult {
  errors: string[];
  warnings: string[];
  files: number;
  bytes: number;
}

/** Server-side output that a static release cannot run. */
const SERVER_MARKERS: [string, string][] = [
  [".next/", "a Next.js server build (.next/); use a static export (output: 'export') and point at its out/ directory"],
  [".nuxt/", "a Nuxt server build (.nuxt/); use `nuxi generate` and point at .output/public"],
  [".svelte-kit/", "a SvelteKit server build; use adapter-static"],
  [".vercel/output/functions/", "Vercel serverless functions; only static files can be released"],
  ["_worker.js", "a Cloudflare Pages worker (_worker.js); only static files can be released"],
  ["functions/", "a functions/ directory (serverless code); only static files can be released"],
  ["server/", "a server/ directory; only static files can be released"],
];

// root-absolute references: "/x" but not "//cdn" (protocol-relative is a different problem, reported separately)
const ABS_SRC = /\bsrc\s*=\s*["']?\/(?!\/)([^"'\s>]*)/gi;
const LINK_HREF = /<link\b[^>]*\bhref\s*=\s*["']?\/(?!\/)([^"'\s>]*)/gi;
// Angular's default <base href="/"> makes every relative path root-absolute
const BASE_HREF = /<base\b[^>]*\bhref\s*=\s*["']?\/(?!\/)([^"'\s>]*)/gi;
const ANCHOR_HREF = /<a\b[^>]*\bhref\s*=\s*["']?\/(?!\/)([^"'\s>]*)/gi;
const CSS_URL = /url\(\s*["']?\/(?!\/)([^"')\s]*)/gi;
const REMOTE_SCRIPT = /<script\b[^>]*\bsrc\s*=\s*["']?(?:https?:)?\/\/([^"'\s>/]+)/gi;
const BROWSER_ROUTER = /\b(createBrowserRouter|BrowserRouter|createWebHistory)\b/;
const HASH_ROUTER = /\b(createHashRouter|HashRouter|createWebHashHistory)\b/;
const JS_ABS_ASSET = /["'`]\/assets\//;

/** The captured group of the first match: a path without its leading "/", or a host for REMOTE_SCRIPT. */
const first = (re: RegExp, text: string): string | undefined => {
  re.lastIndex = 0;
  return re.exec(text)?.[1];
};

export async function preflight(dir: string): Promise<PreflightResult> {
  const info = await stat(dir).catch(() => undefined);
  if (!info?.isDirectory()) return { errors: [`not a directory: ${dir}`], warnings: [], files: 0, bytes: 0 };

  const errors: string[] = [];
  const warnings: string[] = [];
  let paths: string[];
  try {
    paths = await listFiles(dir);
  } catch (e) {
    return { errors: [(e as Error).message], warnings, files: 0, bytes: 0 };
  }
  if (!paths.includes("index.html")) errors.push("no index.html at the root of the build directory");

  for (const [marker, why] of SERVER_MARKERS) {
    if (paths.some((p) => (marker.endsWith("/") ? p.startsWith(marker) : p === marker))) errors.push(`found ${why}`);
  }

  let bytes = 0;
  let browserRouter = false;
  let hashRouter = false;
  let jsAbsolute: string | undefined;
  for (const rel of paths) {
    try {
      assertValidPath(rel);
    } catch (e) {
      errors.push((e as Error).message);
      continue;
    }
    const abs = path.join(dir, rel);
    const size = (await stat(abs)).size;
    bytes += size;
    if (size > MAX_FILE_SIZE) errors.push(`${rel} is ${size} bytes; DeWEB stores at most ${MAX_FILE_SIZE} bytes per file`);

    const ext = path.extname(rel).toLowerCase();
    if (ext !== ".html" && ext !== ".htm" && ext !== ".css" && ext !== ".js" && ext !== ".mjs") continue;
    const text = await readFile(abs, "utf8");
    if (ext === ".html" || ext === ".htm") {
      const src = first(ABS_SRC, text) ?? first(LINK_HREF, text);
      if (src !== undefined) errors.push(`${rel}: root-absolute asset path /${src} breaks under /releases/v<n>/ on DeWEB; build with relative paths (Vite: base: "./")`);
      const base = first(BASE_HREF, text);
      if (base !== undefined) errors.push(`${rel}: <base href="/${base}"> makes every relative path root-absolute, which breaks under /releases/v<n>/ on DeWEB; use <base href="./"> (Angular: --base-href ./)`);
      const a = first(ANCHOR_HREF, text);
      if (a !== undefined) warnings.push(`${rel}: link to /${a} points at the domain root; on DeWEB that is the onchain index, not this page`);
      const remote = first(REMOTE_SCRIPT, text);
      if (remote !== undefined) warnings.push(`${rel}: loads a script from another origin (${remote}); that code is not part of the approved release`);
    } else if (ext === ".css") {
      const url = first(CSS_URL, text);
      if (url !== undefined) errors.push(`${rel}: root-absolute url(/${url}) breaks under /releases/v<n>/ on DeWEB; use relative URLs`);
    } else {
      if (BROWSER_ROUTER.test(text)) browserRouter = true;
      if (HASH_ROUTER.test(text)) hashRouter = true;
      if (!jsAbsolute && JS_ABS_ASSET.test(text)) jsAbsolute = rel;
    }
  }
  if (browserRouter && !hashRouter) {
    warnings.push("the bundle uses history-based routing; on DeWEB the app lives under /releases/v<n>/, so use a hash router (or a router base of \"./\")");
  }
  if (jsAbsolute) warnings.push(`${jsAbsolute} mentions "/assets/…"; if those are lazy-loaded chunks, build with relative paths (Vite: base: "./")`);
  return { errors, warnings, files: paths.length, bytes };
}
