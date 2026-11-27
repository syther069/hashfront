import { r as getPrice, t as depsFromEnv } from "./__handlers-BWNGU2uu.js";
// api/price.ts
var deps = depsFromEnv();
function GET(req) {
	return getPrice(req, deps);
}
export { GET };
