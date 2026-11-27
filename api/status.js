import { i as getStatus, t as depsFromEnv } from "./__handlers-DV0s4ewm.js";
import { r as manifestTexts, t as statusLoaderFromEnv } from "./__site-3lMLs0ZZ.js";
// api/status.ts
var deps = depsFromEnv();
var load = statusLoaderFromEnv(deps.env, manifestTexts);
function GET(req) {
	return getStatus(req, load);
}
export { GET };
