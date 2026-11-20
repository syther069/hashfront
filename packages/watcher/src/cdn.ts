// Cloudflare rewrites that a protocol's own CDN can apply to an approved index.html.
//
// Security rule: in a DNS hijack the attacker serves every path on the domain, /cdn-cgi/* included, so a
// "Cloudflare-looking" tag proves nothing about who injected it. We therefore only strip tags whose exact shape
// we know, and the caller reports the result as CDN_MODIFIED (unverified, never green) and only when the rest of
// the page is byte-identical to the approved release. Everything else stays a MISMATCH.

export type CdnFeature = "rocket-loader" | "web-analytics";

export interface StrippedTag {
  feature: CdnFeature;
  /** the exact markup removed, so the operator can see what was trusted */
  tag: string;
}

export interface CdnResult {
  /** served HTML with the known tags removed and Rocket Loader's script-type rewrite undone */
  html: string;
  stripped: StrippedTag[];
  /** rewrites we detect but cannot undo; they keep the page a MISMATCH and come with a fix hint */
  irreversible: string[];
}

// <script src="/cdn-cgi/scripts/7d0fa10a/cloudflare-static/rocket-loader.min.js" data-cf-settings="<24 hex>-|49" defer></script>
const ROCKET_LOADER =
  /<script src="\/cdn-cgi\/scripts\/[0-9a-f]{8}\/cloudflare-static\/rocket-loader\.min\.js" data-cf-settings="([0-9a-f]{24})-\|\d{1,3}" defer><\/script>/g;
// <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "<32 hex>"}'></script>
// The beacon is loaded from Cloudflare's own domain, not from the watched host, so a hijacker cannot change its code.
const WEB_ANALYTICS =
  /<script defer src='https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js' data-cf-beacon='\{"token": "[0-9a-f]{32}"\}'><\/script>/g;
const EMAIL_OBFUSCATION = /\/cdn-cgi\/l\/email-protection|class="__cf_email__"|email-decode\.min\.js/;
const BOT_DETECTION = /__CF\$cv\$params|\/cdn-cgi\/challenge-platform\//;

export const CDN_HINTS: Record<CdnFeature | "email-obfuscation" | "bot-detection", string> = {
  "rocket-loader": "Cloudflare Rocket Loader rewrites every script tag. Turn it off (Speed > Optimization) so the site can be verified.",
  "web-analytics": "Cloudflare Web Analytics injects a beacon. Install it in your build instead, or turn off automatic injection.",
  "email-obfuscation":
    "Cloudflare Email Address Obfuscation rewrote the page and cannot be undone. Turn it off (Scrape Shield) so the site can be verified.",
  "bot-detection":
    "Cloudflare JavaScript detections injected an inline script. Turn them off for this hostname, or allow-list the served hash.",
};

export function stripCloudflare(served: string): CdnResult {
  const stripped: StrippedTag[] = [];
  let html = served;

  const tokens = new Set<string>();
  html = html.replace(ROCKET_LOADER, (tag, token: string) => {
    tokens.add(token);
    stripped.push({ feature: "rocket-loader", tag });
    return "";
  });
  // Undo the type rewrite only for the token Rocket Loader itself announced on this page.
  for (const token of tokens) {
    html = html
      .replaceAll(` type="${token}-text/javascript"`, "")
      .replaceAll(` type="${token}-module"`, ` type="module"`);
  }

  html = html.replace(WEB_ANALYTICS, (tag) => {
    stripped.push({ feature: "web-analytics", tag });
    return "";
  });

  const irreversible: string[] = [];
  if (EMAIL_OBFUSCATION.test(served)) irreversible.push(CDN_HINTS["email-obfuscation"]);
  if (BOT_DETECTION.test(served)) irreversible.push(CDN_HINTS["bot-detection"]);
  return { html, stripped, irreversible };
}
