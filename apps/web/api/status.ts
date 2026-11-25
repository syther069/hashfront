// Vercel Function: GET /api/status
import { depsFromEnv, getStatus } from "./_handlers.ts";
import { manifestTexts } from "./_manifests.ts";
import { statusLoaderFromEnv } from "./_site.ts";

const deps = depsFromEnv();
const load = statusLoaderFromEnv(deps.env, manifestTexts);
export function GET(req: Request): Promise<Response> {
  return getStatus(req, load);
}
