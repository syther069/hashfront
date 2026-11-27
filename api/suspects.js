import { a as getSuspects, t as depsFromEnv } from "./__handlers-DV0s4ewm.js";
import { n as suspectsLoaderFromEnv, r as manifestTexts } from "./__site-3lMLs0ZZ.js";
// api/suspects.ts
var deps = depsFromEnv();
var load = suspectsLoaderFromEnv(deps.env, manifestTexts);
function GET(req) {
	return getSuspects(req, load);
}
export { GET };
