import { n as getApprovals, t as depsFromEnv } from "./__handlers-BWNGU2uu.js";
import { n as suspectsLoaderFromEnv, r as manifestTexts } from "./__site-SFRMacWE.js";
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
