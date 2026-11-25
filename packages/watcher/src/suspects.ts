// Names the attacker's addresses after a hijack: addresses that the served (changed) files contain and that no file
// of the approved release contains. Pure, with no I/O and no Node-only imports, so the status page backend uses the
// same code. This is triage, not proof: obfuscated addresses, or ones fetched at runtime, are not found.
import { getAddress, isAddress } from "viem";

const ADDRESS = /0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g;
const NATIVE_PLACEHOLDER = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ZERO = "0x0000000000000000000000000000000000000000";
const MAX_REFERENCED = 20;

/** Checksummed addresses in the bytes, without the zero address and the 0xeeee... native-token placeholder. */
export function extractAddresses(bytes: Uint8Array): Set<string> {
  const text = new TextDecoder("utf-8").decode(bytes);
  const out = new Set<string>();
  for (const m of text.matchAll(ADDRESS)) {
    if (!isAddress(m[0], { strict: false })) continue;
    const a = getAddress(m[0]);
    if (a !== ZERO && a !== NATIVE_PLACEHOLDER) out.add(a);
  }
  return out;
}

/** Addresses in `changed` that appear in none of the `approved` files, sorted. */
export function suspects(changed: Iterable<Uint8Array>, approved: Iterable<Uint8Array>): string[] {
  const known = new Set<string>();
  for (const b of approved) for (const a of extractAddresses(b)) known.add(a);
  const out = new Set<string>();
  for (const b of changed) for (const a of extractAddresses(b)) if (!known.has(a)) out.add(a);
  return [...out].sort();
}

/**
 * Same-origin scripts and styles an HTML page loads, as release-relative paths. A hijacked build usually ships a
 * differently named bundle, so the address is in a file the approved release does not list at all.
 */
export function referencedAssets(html: Uint8Array): string[] {
  const text = new TextDecoder("utf-8").decode(html);
  const out = new Set<string>();
  for (const m of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    const ref = m[1]!.split(/[?#]/)[0]!;
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) continue; // absolute or protocol-relative: another origin
    if (!/\.(?:m?js|css|json)$/i.test(ref)) continue;
    const path = ref.replace(/^\.\//, "").replace(/^\//, "");
    if (!path || path.split("/").includes("..")) continue;
    out.add(path);
    if (out.size >= MAX_REFERENCED) break;
  }
  return [...out];
}

/** Only text-like release files can hold an address worth comparing. */
export const isTextPath = (p: string): boolean => /\.(?:html?|m?js|css|json|txt)$/i.test(p);
