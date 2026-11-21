// Vercel Function: GET /api/approvals?address=0x…
import { depsFromEnv, getApprovals } from "./_handlers.ts";

const deps = depsFromEnv();
export function GET(req: Request): Promise<Response> {
  return getApprovals(req, deps);
}
