// Vercel Function: GET /api/price
import { depsFromEnv, getPrice } from "./_handlers.ts";

const deps = depsFromEnv();
export function GET(req: Request): Promise<Response> {
  return getPrice(req, deps);
}
