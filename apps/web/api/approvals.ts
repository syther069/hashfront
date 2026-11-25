// Vercel Function: GET /api/approvals?address=0x…
import { depsFromEnv, getApprovals } from "./_handlers.ts";
import { manifestTexts } from "./_manifests.ts";
import { suspectsLoaderFromEnv } from "./_site.ts";

const base = depsFromEnv();
const deps = { ...base, suspects: suspectsLoaderFromEnv(base.env, manifestTexts) };
export function GET(req: Request): Promise<Response> {
  return getApprovals(req, deps);
}
