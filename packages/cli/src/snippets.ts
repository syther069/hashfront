// Copy-paste snippets shared by the web app and `hashfront init`, so the two can never drift. Browser-safe.

/**
 * The badge iframe. allow-same-origin is required: without it the frame's origin is "null" and its module script is
 * blocked by CORS on a plain static host. It is safe because the badge is served from the status host, never from
 * the protocol's own origin.
 */
export function badgeSnippet(badgeUrl: string): string {
  return `<iframe src="${badgeUrl}" title="Hashfront status" width="240" height="32" style="border:0" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>`;
}

/** The verified DeWEB copy of a site: https://<policy circuit id>-2-409.tapekit.org/ (X Layer mainnet). */
export function dewebUrl(policyId: bigint | number): string {
  return `https://${policyId}-2-409.tapekit.org/`;
}

/**
 * TAP-10 endpoint id of a DeWEB container: uint32(0) | uint64(chainId) | address, as the TapeSend hub's endpointOf
 * returns it (checked against the live hub in contracts/test/fork/PolicyReuse.t.sol). Undefined for a bad address.
 */
export function tapesendEndpoint(container: string, chainId = 196): `0x${string}` | undefined {
  if (!/^0x[0-9a-fA-F]{40}$/.test(container.trim()) || !Number.isSafeInteger(chainId) || chainId <= 0) return undefined;
  return `0x${"0".repeat(8)}${chainId.toString(16).padStart(16, "0")}${container.trim().slice(2).toLowerCase()}`;
}
