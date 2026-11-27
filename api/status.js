import { i as getStatus, t as depsFromEnv } from "./__handlers-BWNGU2uu.js";
import { r as manifestTexts, t as statusLoaderFromEnv } from "./__site-SFRMacWE.js";
// api/status.ts
var deps = depsFromEnv();
var load = statusLoaderFromEnv(deps.env, manifestTexts);
function GET(req) {
	return getStatus(req, load);
}
export { GET };
