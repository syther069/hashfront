// Vercel Function: POST /api/tx-scan {from, to, data}
import { depsFromEnv, postTxScan } from "./_handlers.ts";

const deps = depsFromEnv();
export function POST(req: Request): Promise<Response> {
  return postTxScan(req, deps);
}
