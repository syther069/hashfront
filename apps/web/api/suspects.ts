// Vercel Function: GET /api/suspects
import { depsFromEnv, getSuspects } from "./_handlers.ts";
import { manifestTexts } from "./_manifests.ts";
import { suspectsLoaderFromEnv } from "./_site.ts";

const deps = depsFromEnv();
const load = suspectsLoaderFromEnv(deps.env, manifestTexts);
export function GET(req: Request): Promise<Response> {
  return getSuspects(req, load);
}
