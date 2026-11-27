import { n as getApprovals, t as depsFromEnv } from "./__handlers-DV0s4ewm.js";
import { n as suspectsLoaderFromEnv, r as manifestTexts } from "./__site-3lMLs0ZZ.js";
// api/approvals.ts
var base = depsFromEnv();
var deps = {
	...base,
	suspects: suspectsLoaderFromEnv(base.env, manifestTexts)
};
function GET(req) {
	return getApprovals(req, deps);
}
export { GET };
