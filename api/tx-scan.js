import { a as postTxScan, t as depsFromEnv } from "./__handlers-BWNGU2uu.js";
// api/tx-scan.ts
var deps = depsFromEnv();
function POST(req) {
	return postTxScan(req, deps);
}
export { POST };
