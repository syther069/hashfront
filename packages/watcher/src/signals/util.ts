import { createHash } from "node:crypto";

/** JSON with object keys sorted, so the same data always hashes the same. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v,
  );
}

/** sha256 of the canonical JSON: the `observed` evidence for ReleaseGate.alert(ALERT_DNS_CHANGED, ...). */
export function canonicalHash(value: unknown): `0x${string}` {
  return `0x${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

export const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));
