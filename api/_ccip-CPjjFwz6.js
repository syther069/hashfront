import { C as concat, S as encodeAbiParameters, _ as getAbortError, a as anySignal, b as stringify, c as createCcipReadBudget, d as call, f as getRevertErrorData, g as TimeoutError, h as ResponseBodyTooLargeError, i as withTimeout, l as localBatchGatewayRequest, m as HttpRequestError, o as readResponseBody, p as isAddressEqual, s as ccipReadLimit, v as getUrl, x as decodeErrorResult, y as isAbortError } from "./__site-SFRMacWE.js";
import { J as BaseError, X as isHex } from "./__handlers-BWNGU2uu.js";
// ../../node_modules/viem/_esm/errors/ccip.js
var OffchainLookupError = class extends BaseError {
	constructor({ callbackSelector, cause, data, extraData, sender, urls }) {
		super(cause.shortMessage || "An error occurred while fetching for an offchain result.", {
			cause,
			metaMessages: [
				...cause.metaMessages || [],
				cause.metaMessages?.length ? "" : [],
				"Offchain Gateway Call:",
				urls && ["  Gateway URL(s):", ...urls.map((url) => `    ${getUrl(url)}`)],
				`  Sender: ${sender}`,
				`  Data: ${data}`,
				`  Callback selector: ${callbackSelector}`,
				`  Extra data: ${extraData}`
			].flat(),
			name: "OffchainLookupError"
		});
	}
};
var OffchainLookupResponseMalformedError = class extends BaseError {
	constructor({ result, url }) {
		super("Offchain gateway response is malformed. Response data must be a hex value.", {
			metaMessages: [`Gateway URL: ${getUrl(url)}`, `Response: ${stringify(result)}`],
			name: "OffchainLookupResponseMalformedError"
		});
	}
};
var OffchainLookupSenderMismatchError = class extends BaseError {
	constructor({ sender, to }) {
		super("Reverted sender address does not match target contract address (`to`).", {
			metaMessages: [`Contract address: ${to}`, `OffchainLookup sender address: ${sender}`],
			name: "OffchainLookupSenderMismatchError"
		});
	}
};
// ../../node_modules/viem/_esm/utils/ccip.js
var ccipTimeout = 1e4;
var maxCcipResponseBytes = 10485760;
var offchainLookupSignature = "0x556f1830";
var offchainLookupAbiItem = {
	name: "OffchainLookup",
	type: "error",
	inputs: [
		{
			name: "sender",
			type: "address"
		},
		{
			name: "urls",
			type: "string[]"
		},
		{
			name: "callData",
			type: "bytes"
		},
		{
			name: "callbackFunction",
			type: "bytes4"
		},
		{
			name: "extraData",
			type: "bytes"
		}
	]
};
/**
* Performs an EIP-3668 CCIP-Read lookup for a reverted `OffchainLookup` call.
*
* Follows at most 4 nested callbacks. Every gateway request of the lookup,
* including nested local batches, draws from one query and concurrency budget.
* Each gateway request uses the client transport timeout.
*/
async function offchainLookup(client, { blockNumber, blockTag, budget = createCcipReadBudget(), data, depth = 0, requestOptions, to }) {
	const { args } = decodeErrorResult({
		data,
		abi: [offchainLookupAbiItem]
	});
	const [sender, urls, callData, callbackSelector, extraData] = args;
	const { ccipRead } = client;
	const ccipRequest_ = ccipRead && typeof ccipRead?.request === "function" ? ccipRead.request : ccipRequest;
	const timeout = getTransportTimeout(client.transport);
	try {
		if (depth >= ccipReadLimit.depth) throw new HttpRequestError({
			details: `CCIP Read exceeded the maximum callback depth (${ccipReadLimit.depth}).`,
			url: urls[0] ?? ""
		});
		if (!isAddressEqual(to, sender)) throw new OffchainLookupSenderMismatchError({
			sender,
			to
		});
		const result = await (async () => {
			if (urls.includes("x-batch-gateway:true")) return localBatchGatewayRequest({
				budget,
				ccipRequest: (parameters) => ccipRequest_({
					...parameters,
					requestOptions,
					timeout: parameters.timeout ?? timeout
				}),
				data: callData
			});
			if (budget.queries <= 0) throw new HttpRequestError({
				details: `CCIP Read exceeded the maximum number of queries (${ccipReadLimit.queries}).`,
				url: urls[0] ?? ""
			});
			const urls_ = urls.slice(0, budget.queries);
			budget.queries -= Math.max(1, urls_.length);
			return budget.run(() => ccipRequest_({
				data: callData,
				requestOptions,
				sender,
				timeout,
				urls: urls_
			}));
		})();
		const callbackData = concat([callbackSelector, encodeAbiParameters([{ type: "bytes" }, { type: "bytes" }], [result, extraData])]);
		try {
			const { data: data_ } = await call({
				...client,
				ccipRead: false
			}, {
				blockNumber,
				blockTag,
				data: callbackData,
				requestOptions,
				to
			});
			return data_;
		} catch (err) {
			const revertData = getRevertErrorData(err);
			if (revertData?.slice(0, 10) !== "0x556f1830") throw err;
			return await offchainLookup(client, {
				blockNumber,
				blockTag,
				budget,
				data: revertData,
				depth: depth + 1,
				requestOptions,
				to
			});
		}
	} catch (err) {
		if (requestOptions?.signal?.aborted) throw getAbortError(requestOptions.signal);
		if (isAbortError(err)) throw err;
		throw new OffchainLookupError({
			callbackSelector,
			cause: err,
			data,
			extraData,
			sender,
			urls
		});
	}
}
/**
* Requests a CCIP-Read gateway result.
*
* Tries each HTTP(S) URL in order. Each request, including the response body,
* times out after `timeout` (default 10 seconds) and reads at most 10 MiB.
*/
async function ccipRequest({ data, requestOptions, sender, timeout = ccipTimeout, urls }) {
	let error = /* @__PURE__ */ new Error("An unknown error occurred.");
	for (const url of urls) {
		if (requestOptions?.signal?.aborted) throw getAbortError(requestOptions.signal);
		const requestUrl = url.replace("{sender}", sender.toLowerCase()).replace("{data}", data);
		const method = url.includes("{data}") ? "GET" : "POST";
		const body = method === "POST" ? {
			data,
			sender
		} : void 0;
		const headers = method === "POST" ? { "Content-Type": "application/json" } : {};
		try {
			assertCcipUrl(requestUrl);
			const { response, responseBody } = await withTimeout(async ({ signal: timeoutSignal }) => {
				const { signal, cleanup } = anySignal([requestOptions?.signal, timeout > 0 ? timeoutSignal : null]);
				try {
					const response = await fetch(requestUrl, {
						body: JSON.stringify(body),
						headers,
						method,
						...signal ? { signal } : {}
					});
					return {
						response,
						responseBody: await readResponseBody(response, { maxResponseBodySize: maxCcipResponseBytes })
					};
				} finally {
					cleanup();
				}
			}, {
				errorInstance: new TimeoutError({
					body: body ?? {
						data,
						sender
					},
					url
				}),
				signal: true,
				timeout
			});
			let result;
			if (response.headers.get("Content-Type")?.startsWith("application/json")) result = JSON.parse(responseBody).data;
			else result = responseBody;
			if (!response.ok) {
				error = new HttpRequestError({
					body,
					details: result?.error ? stringify(result.error) : response.statusText,
					headers: response.headers,
					status: response.status,
					url
				});
				continue;
			}
			if (!isHex(result)) {
				error = new OffchainLookupResponseMalformedError({
					result,
					url
				});
				continue;
			}
			return result;
		} catch (err) {
			if (requestOptions?.signal?.aborted) throw getAbortError(requestOptions.signal);
			if (isAbortError(err)) throw err;
			if (err instanceof HttpRequestError || err instanceof TimeoutError || err instanceof ResponseBodyTooLargeError) {
				error = err;
				continue;
			}
			error = new HttpRequestError({
				body,
				cause: err,
				url
			});
		}
	}
	throw error;
}
function assertCcipUrl(url) {
	const parsed = (() => {
		try {
			return new URL(url);
		} catch {
			throw new HttpRequestError({
				details: "CCIP Read URL is invalid.",
				url
			});
		}
	})();
	if (parsed.protocol === "http:" || parsed.protocol === "https:") return;
	throw new HttpRequestError({
		details: `CCIP Read URL scheme "${parsed.protocol.slice(0, -1)}" is not allowed.`,
		url
	});
}
/**
* Returns the transport timeout. A wrapper that sets none (such as
* `fallback`) uses the longest timeout of its transports, since any of them
* may have served the call.
*/
function getTransportTimeout(transport) {
	const timeout = transport.timeout ?? transport.config?.timeout;
	if (timeout !== void 0) return timeout;
	const timeouts = (transport.transports ?? transport.value?.transports ?? []).map(getTransportTimeout).filter((timeout) => timeout !== void 0);
	return timeouts.length ? Math.max(...timeouts) : void 0;
}
export { offchainLookup, offchainLookupSignature };
