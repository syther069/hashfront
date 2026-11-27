import { r as getPrice, t as depsFromEnv } from "./__handlers-DV0s4ewm.js";
// api/price.ts
var deps = depsFromEnv();
function GET(req) {
	return getPrice(req, deps);
}
export { GET };
