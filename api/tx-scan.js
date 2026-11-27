import { o as postTxScan, t as depsFromEnv } from "./__handlers-DV0s4ewm.js";
// api/tx-scan.ts
var deps = depsFromEnv();
function POST(req) {
	return postTxScan(req, deps);
}
export { POST };
