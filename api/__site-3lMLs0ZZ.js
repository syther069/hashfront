import { $ as formatAbiParameters, A as toBytes$2, B as hexToBigInt, C as aoutput, D as createView, E as createHasher, F as bytesToHex$1, G as InvalidBytesBooleanError$1, H as hexToNumber$1, I as numberToHex, J as InvalidBytesLengthError, K as pad$2, L as stringToHex, M as stringToBytes, N as toBytes$1, O as randomBytes, P as boolToHex, Q as formatAbiItem$1, R as toHex, S as anumber, T as concatBytes$2, U as trim$1, V as hexToBool, W as IntegerOutOfRangeError$1, X as size$3, Y as BaseError$2, Z as isHex, _ as keccak_256, b as aexists, c as slice$2, d as checksumAddress, et as bytesRegex$2, f as getAddress, g as keccak256$1, h as LruMap$1, j as hexToBytes$1, k as rotr, l as sliceBytes, m as toSignatureHash, nt as integerRegex$2, p as InvalidAddressError$1, q as padHex, rt as isTupleRegex, s as toFunctionSelector, tt as execTyped, u as isAddress, v as Hash, w as clean, x as ahash, y as abytes$1, z as assertSize$2 } from "./__handlers-DV0s4ewm.js";
import { createHash } from "node:crypto";
// \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
// ../../node_modules/viem/node_modules/abitype/dist/esm/version.js
var version$1 = "1.2.3";
// ../../node_modules/viem/node_modules/abitype/dist/esm/errors.js
var BaseError$1 = class BaseError$1 extends Error {
	constructor(shortMessage, args = {}) {
		const details = args.cause instanceof BaseError$1 ? args.cause.details : args.cause?.message ? args.cause.message : args.details;
		const docsPath = args.cause instanceof BaseError$1 ? args.cause.docsPath || args.docsPath : args.docsPath;
		const message = [
			shortMessage || "An error occurred.",
			"",
			...args.metaMessages ? [...args.metaMessages, ""] : [],
			...docsPath ? [`Docs: https://abitype.dev${docsPath}`] : [],
			...details ? [`Details: ${details}`] : [],
			`Version: abitype@${version$1}`
		].join("\n");
		super(message);
		Object.defineProperty(this, "details", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "docsPath", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "metaMessages", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "shortMessage", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "AbiTypeError"
		});
		if (args.cause) this.cause = args.cause;
		this.details = details;
		this.docsPath = docsPath;
		this.metaMessages = args.metaMessages;
		this.shortMessage = shortMessage;
	}
};
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/runtime/signatures.js
var errorSignatureRegex = /^error (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)$/;
function isErrorSignature(signature) {
	return errorSignatureRegex.test(signature);
}
function execErrorSignature(signature) {
	return execTyped(errorSignatureRegex, signature);
}
var eventSignatureRegex = /^event (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)$/;
function isEventSignature(signature) {
	return eventSignatureRegex.test(signature);
}
function execEventSignature(signature) {
	return execTyped(eventSignatureRegex, signature);
}
var functionSignatureRegex = /^function (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)(?: (?<scope>external|public{1}))?(?: (?<stateMutability>pure|view|nonpayable|payable{1}))?(?: returns\s?\((?<returns>.*?)\))?$/;
function isFunctionSignature(signature) {
	return functionSignatureRegex.test(signature);
}
function execFunctionSignature(signature) {
	return execTyped(functionSignatureRegex, signature);
}
var structSignatureRegex = /^struct (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*) \{(?<properties>.*?)\}$/;
function isStructSignature(signature) {
	return structSignatureRegex.test(signature);
}
function execStructSignature(signature) {
	return execTyped(structSignatureRegex, signature);
}
var constructorSignatureRegex = /^constructor\((?<parameters>.*?)\)(?:\s(?<stateMutability>payable{1}))?$/;
function isConstructorSignature(signature) {
	return constructorSignatureRegex.test(signature);
}
function execConstructorSignature(signature) {
	return execTyped(constructorSignatureRegex, signature);
}
var fallbackSignatureRegex = /^fallback\(\) external(?:\s(?<stateMutability>payable{1}))?$/;
function isFallbackSignature(signature) {
	return fallbackSignatureRegex.test(signature);
}
function execFallbackSignature(signature) {
	return execTyped(fallbackSignatureRegex, signature);
}
var receiveSignatureRegex = /^receive\(\) external payable$/;
function isReceiveSignature(signature) {
	return receiveSignatureRegex.test(signature);
}
var modifiers = /* @__PURE__ */ new Set([
	"memory",
	"indexed",
	"storage",
	"calldata"
]);
var eventModifiers = /* @__PURE__ */ new Set(["indexed"]);
var functionModifiers = /* @__PURE__ */ new Set([
	"calldata",
	"memory",
	"storage"
]);
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/abiItem.js
var InvalidAbiItemError = class extends BaseError$1 {
	constructor({ signature }) {
		super("Failed to parse ABI item.", {
			details: `parseAbiItem(${JSON.stringify(signature, null, 2)})`,
			docsPath: "/api/human#parseabiitem-1"
		});
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "InvalidAbiItemError"
		});
	}
};
var UnknownTypeError = class extends BaseError$1 {
	constructor({ type }) {
		super("Unknown type.", { metaMessages: [`Type "${type}" is not a valid ABI type. Perhaps you forgot to include a struct signature?`] });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "UnknownTypeError"
		});
	}
};
var UnknownSolidityTypeError = class extends BaseError$1 {
	constructor({ type }) {
		super("Unknown type.", { metaMessages: [`Type "${type}" is not a valid ABI type.`] });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "UnknownSolidityTypeError"
		});
	}
};
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/abiParameter.js
var InvalidAbiParametersError = class extends BaseError$1 {
	constructor({ params }) {
		super("Failed to parse ABI parameters.", {
			details: `parseAbiParameters(${JSON.stringify(params, null, 2)})`,
			docsPath: "/api/human#parseabiparameters-1"
		});
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "InvalidAbiParametersError"
		});
	}
};
var InvalidParameterError = class extends BaseError$1 {
	constructor({ param }) {
		super("Invalid ABI parameter.", { details: param });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "InvalidParameterError"
		});
	}
};
var SolidityProtectedKeywordError = class extends BaseError$1 {
	constructor({ param, name }) {
		super("Invalid ABI parameter.", {
			details: param,
			metaMessages: [`"${name}" is a protected Solidity keyword. More info: https://docs.soliditylang.org/en/latest/cheatsheet.html`]
		});
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "SolidityProtectedKeywordError"
		});
	}
};
var InvalidModifierError = class extends BaseError$1 {
	constructor({ param, type, modifier }) {
		super("Invalid ABI parameter.", {
			details: param,
			metaMessages: [`Modifier "${modifier}" not allowed${type ? ` in "${type}" type` : ""}.`]
		});
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "InvalidModifierError"
		});
	}
};
var InvalidFunctionModifierError = class extends BaseError$1 {
	constructor({ param, type, modifier }) {
		super("Invalid ABI parameter.", {
			details: param,
			metaMessages: [`Modifier "${modifier}" not allowed${type ? ` in "${type}" type` : ""}.`, `Data location can only be specified for array, struct, or mapping types, but "${modifier}" was given.`]
		});
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "InvalidFunctionModifierError"
		});
	}
};
var InvalidAbiTypeParameterError = class extends BaseError$1 {
	constructor({ abiParameter }) {
		super("Invalid ABI parameter.", {
			details: JSON.stringify(abiParameter, null, 2),
			metaMessages: ["ABI parameter type is invalid."]
		});
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "InvalidAbiTypeParameterError"
		});
	}
};
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/signature.js
var InvalidSignatureError = class extends BaseError$1 {
	constructor({ signature, type }) {
		super(`Invalid ${type} signature.`, { details: signature });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "InvalidSignatureError"
		});
	}
};
var UnknownSignatureError = class extends BaseError$1 {
	constructor({ signature }) {
		super("Unknown signature.", { details: signature });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "UnknownSignatureError"
		});
	}
};
var InvalidStructSignatureError = class extends BaseError$1 {
	constructor({ signature }) {
		super("Invalid struct signature.", {
			details: signature,
			metaMessages: ["No properties exist."]
		});
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "InvalidStructSignatureError"
		});
	}
};
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/struct.js
var CircularReferenceError = class extends BaseError$1 {
	constructor({ type }) {
		super("Circular reference detected.", { metaMessages: [`Struct "${type}" is a circular reference.`] });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "CircularReferenceError"
		});
	}
};
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/errors/splitParameters.js
var InvalidParenthesisError = class extends BaseError$1 {
	constructor({ current, depth }) {
		super("Unbalanced parentheses.", {
			metaMessages: [`"${current.trim()}" has too many ${depth > 0 ? "opening" : "closing"} parentheses.`],
			details: `Depth "${depth}"`
		});
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "InvalidParenthesisError"
		});
	}
};
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/runtime/cache.js
/**
* Gets {@link parameterCache} cache key namespaced by {@link type} and {@link structs}. This prevents parameters from being accessible to types that don't allow them (e.g. `string indexed foo` not allowed outside of `type: 'event'`) and ensures different struct definitions with the same name are cached separately.
* @param param ABI parameter string
* @param type ABI parameter type
* @param structs Struct definitions to include in cache key
* @returns Cache key for {@link parameterCache}
*/
function getParameterCacheKey(param, type, structs) {
	let structKey = "";
	if (structs) for (const struct of Object.entries(structs)) {
		if (!struct) continue;
		let propertyKey = "";
		for (const property of struct[1]) propertyKey += `[${property.type}${property.name ? `:${property.name}` : ""}]`;
		structKey += `(${struct[0]}{${propertyKey}})`;
	}
	if (type) return `${type}:${param}${structKey}`;
	return `${param}${structKey}`;
}
/**
* Basic cache seeded with common ABI parameter strings.
*
* **Note: When seeding more parameters, make sure you benchmark performance. The current number is the ideal balance between performance and having an already existing cache.**
*/
var parameterCache = /* @__PURE__ */ new Map([
	["address", { type: "address" }],
	["bool", { type: "bool" }],
	["bytes", { type: "bytes" }],
	["bytes32", { type: "bytes32" }],
	["int", { type: "int256" }],
	["int256", { type: "int256" }],
	["string", { type: "string" }],
	["uint", { type: "uint256" }],
	["uint8", { type: "uint8" }],
	["uint16", { type: "uint16" }],
	["uint24", { type: "uint24" }],
	["uint32", { type: "uint32" }],
	["uint64", { type: "uint64" }],
	["uint96", { type: "uint96" }],
	["uint112", { type: "uint112" }],
	["uint160", { type: "uint160" }],
	["uint192", { type: "uint192" }],
	["uint256", { type: "uint256" }],
	["address owner", {
		type: "address",
		name: "owner"
	}],
	["address to", {
		type: "address",
		name: "to"
	}],
	["bool approved", {
		type: "bool",
		name: "approved"
	}],
	["bytes _data", {
		type: "bytes",
		name: "_data"
	}],
	["bytes data", {
		type: "bytes",
		name: "data"
	}],
	["bytes signature", {
		type: "bytes",
		name: "signature"
	}],
	["bytes32 hash", {
		type: "bytes32",
		name: "hash"
	}],
	["bytes32 r", {
		type: "bytes32",
		name: "r"
	}],
	["bytes32 root", {
		type: "bytes32",
		name: "root"
	}],
	["bytes32 s", {
		type: "bytes32",
		name: "s"
	}],
	["string name", {
		type: "string",
		name: "name"
	}],
	["string symbol", {
		type: "string",
		name: "symbol"
	}],
	["string tokenURI", {
		type: "string",
		name: "tokenURI"
	}],
	["uint tokenId", {
		type: "uint256",
		name: "tokenId"
	}],
	["uint8 v", {
		type: "uint8",
		name: "v"
	}],
	["uint256 balance", {
		type: "uint256",
		name: "balance"
	}],
	["uint256 tokenId", {
		type: "uint256",
		name: "tokenId"
	}],
	["uint256 value", {
		type: "uint256",
		name: "value"
	}],
	["event:address indexed from", {
		type: "address",
		name: "from",
		indexed: true
	}],
	["event:address indexed to", {
		type: "address",
		name: "to",
		indexed: true
	}],
	["event:uint indexed tokenId", {
		type: "uint256",
		name: "tokenId",
		indexed: true
	}],
	["event:uint256 indexed tokenId", {
		type: "uint256",
		name: "tokenId",
		indexed: true
	}]
]);
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/runtime/utils.js
function parseSignature(signature, structs = {}) {
	if (isFunctionSignature(signature)) return parseFunctionSignature(signature, structs);
	if (isEventSignature(signature)) return parseEventSignature(signature, structs);
	if (isErrorSignature(signature)) return parseErrorSignature(signature, structs);
	if (isConstructorSignature(signature)) return parseConstructorSignature(signature, structs);
	if (isFallbackSignature(signature)) return parseFallbackSignature(signature);
	if (isReceiveSignature(signature)) return {
		type: "receive",
		stateMutability: "payable"
	};
	throw new UnknownSignatureError({ signature });
}
function parseFunctionSignature(signature, structs = {}) {
	const match = execFunctionSignature(signature);
	if (!match) throw new InvalidSignatureError({
		signature,
		type: "function"
	});
	const inputParams = splitParameters(match.parameters);
	const inputs = [];
	const inputLength = inputParams.length;
	for (let i = 0; i < inputLength; i++) inputs.push(parseAbiParameter(inputParams[i], {
		modifiers: functionModifiers,
		structs,
		type: "function"
	}));
	const outputs = [];
	if (match.returns) {
		const outputParams = splitParameters(match.returns);
		const outputLength = outputParams.length;
		for (let i = 0; i < outputLength; i++) outputs.push(parseAbiParameter(outputParams[i], {
			modifiers: functionModifiers,
			structs,
			type: "function"
		}));
	}
	return {
		name: match.name,
		type: "function",
		stateMutability: match.stateMutability ?? "nonpayable",
		inputs,
		outputs
	};
}
function parseEventSignature(signature, structs = {}) {
	const match = execEventSignature(signature);
	if (!match) throw new InvalidSignatureError({
		signature,
		type: "event"
	});
	const params = splitParameters(match.parameters);
	const abiParameters = [];
	const length = params.length;
	for (let i = 0; i < length; i++) abiParameters.push(parseAbiParameter(params[i], {
		modifiers: eventModifiers,
		structs,
		type: "event"
	}));
	return {
		name: match.name,
		type: "event",
		inputs: abiParameters
	};
}
function parseErrorSignature(signature, structs = {}) {
	const match = execErrorSignature(signature);
	if (!match) throw new InvalidSignatureError({
		signature,
		type: "error"
	});
	const params = splitParameters(match.parameters);
	const abiParameters = [];
	const length = params.length;
	for (let i = 0; i < length; i++) abiParameters.push(parseAbiParameter(params[i], {
		structs,
		type: "error"
	}));
	return {
		name: match.name,
		type: "error",
		inputs: abiParameters
	};
}
function parseConstructorSignature(signature, structs = {}) {
	const match = execConstructorSignature(signature);
	if (!match) throw new InvalidSignatureError({
		signature,
		type: "constructor"
	});
	const params = splitParameters(match.parameters);
	const abiParameters = [];
	const length = params.length;
	for (let i = 0; i < length; i++) abiParameters.push(parseAbiParameter(params[i], {
		structs,
		type: "constructor"
	}));
	return {
		type: "constructor",
		stateMutability: match.stateMutability ?? "nonpayable",
		inputs: abiParameters
	};
}
function parseFallbackSignature(signature) {
	const match = execFallbackSignature(signature);
	if (!match) throw new InvalidSignatureError({
		signature,
		type: "fallback"
	});
	return {
		type: "fallback",
		stateMutability: match.stateMutability ?? "nonpayable"
	};
}
var abiParameterWithoutTupleRegex = /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*(?:\spayable)?)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z$_][a-zA-Z0-9$_]*))?$/;
var abiParameterWithTupleRegex = /^\((?<type>.+?)\)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z$_][a-zA-Z0-9$_]*))?$/;
var dynamicIntegerRegex = /^u?int$/;
function parseAbiParameter(param, options) {
	const parameterCacheKey = getParameterCacheKey(param, options?.type, options?.structs);
	if (parameterCache.has(parameterCacheKey)) return parameterCache.get(parameterCacheKey);
	const isTuple = isTupleRegex.test(param);
	const match = execTyped(isTuple ? abiParameterWithTupleRegex : abiParameterWithoutTupleRegex, param);
	if (!match) throw new InvalidParameterError({ param });
	if (match.name && isSolidityKeyword(match.name)) throw new SolidityProtectedKeywordError({
		param,
		name: match.name
	});
	const name = match.name ? { name: match.name } : {};
	const indexed = match.modifier === "indexed" ? { indexed: true } : {};
	const structs = options?.structs ?? {};
	let type;
	let components = {};
	if (isTuple) {
		type = "tuple";
		const params = splitParameters(match.type);
		const components_ = [];
		const length = params.length;
		for (let i = 0; i < length; i++) components_.push(parseAbiParameter(params[i], { structs }));
		components = { components: components_ };
	} else if (match.type in structs) {
		type = "tuple";
		components = { components: structs[match.type] };
	} else if (dynamicIntegerRegex.test(match.type)) type = `${match.type}256`;
	else if (match.type === "address payable") type = "address";
	else {
		type = match.type;
		if (!(options?.type === "struct") && !isSolidityType$1(type)) throw new UnknownSolidityTypeError({ type });
	}
	if (match.modifier) {
		if (!options?.modifiers?.has?.(match.modifier)) throw new InvalidModifierError({
			param,
			type: options?.type,
			modifier: match.modifier
		});
		if (functionModifiers.has(match.modifier) && !isValidDataLocation(type, !!match.array)) throw new InvalidFunctionModifierError({
			param,
			type: options?.type,
			modifier: match.modifier
		});
	}
	const abiParameter = {
		type: `${type}${match.array ?? ""}`,
		...name,
		...indexed,
		...components
	};
	parameterCache.set(parameterCacheKey, abiParameter);
	return abiParameter;
}
function splitParameters(params, result = [], current = "", depth = 0) {
	const length = params.trim().length;
	for (let i = 0; i < length; i++) {
		const char = params[i];
		const tail = params.slice(i + 1);
		switch (char) {
			case ",": return depth === 0 ? splitParameters(tail, [...result, current.trim()]) : splitParameters(tail, result, `${current}${char}`, depth);
			case "(": return splitParameters(tail, result, `${current}${char}`, depth + 1);
			case ")": return splitParameters(tail, result, `${current}${char}`, depth - 1);
			default: return splitParameters(tail, result, `${current}${char}`, depth);
		}
	}
	if (current === "") return result;
	if (depth !== 0) throw new InvalidParenthesisError({
		current,
		depth
	});
	result.push(current.trim());
	return result;
}
function isSolidityType$1(type) {
	return type === "address" || type === "bool" || type === "function" || type === "string" || bytesRegex$2.test(type) || integerRegex$2.test(type);
}
var protectedKeywordsRegex = /^(?:after|alias|anonymous|apply|auto|byte|calldata|case|catch|constant|copyof|default|defined|error|event|external|false|final|function|immutable|implements|in|indexed|inline|internal|let|mapping|match|memory|mutable|null|of|override|partial|private|promise|public|pure|reference|relocatable|return|returns|sizeof|static|storage|struct|super|supports|switch|this|true|try|typedef|typeof|var|view|virtual)$/;
/** @internal */
function isSolidityKeyword(name) {
	return name === "address" || name === "bool" || name === "function" || name === "string" || name === "tuple" || bytesRegex$2.test(name) || integerRegex$2.test(name) || protectedKeywordsRegex.test(name);
}
/** @internal */
function isValidDataLocation(type, isArray) {
	return isArray || type === "bytes" || type === "string" || type === "tuple";
}
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/runtime/structs.js
function parseStructs(signatures) {
	const shallowStructs = {};
	const signaturesLength = signatures.length;
	for (let i = 0; i < signaturesLength; i++) {
		const signature = signatures[i];
		if (!isStructSignature(signature)) continue;
		const match = execStructSignature(signature);
		if (!match) throw new InvalidSignatureError({
			signature,
			type: "struct"
		});
		const properties = match.properties.split(";");
		const components = [];
		const propertiesLength = properties.length;
		for (let k = 0; k < propertiesLength; k++) {
			const trimmed = properties[k].trim();
			if (!trimmed) continue;
			const abiParameter = parseAbiParameter(trimmed, { type: "struct" });
			components.push(abiParameter);
		}
		if (!components.length) throw new InvalidStructSignatureError({ signature });
		shallowStructs[match.name] = components;
	}
	const resolvedStructs = {};
	const entries = Object.entries(shallowStructs);
	const entriesLength = entries.length;
	for (let i = 0; i < entriesLength; i++) {
		const [name, parameters] = entries[i];
		resolvedStructs[name] = resolveStructs(parameters, shallowStructs);
	}
	return resolvedStructs;
}
var typeWithoutTupleRegex = /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*)(?<array>(?:\[\d*?\])+?)?$/;
function resolveStructs(abiParameters = [], structs = {}, ancestors = /* @__PURE__ */ new Set()) {
	const components = [];
	const length = abiParameters.length;
	for (let i = 0; i < length; i++) {
		const abiParameter = abiParameters[i];
		if (isTupleRegex.test(abiParameter.type)) components.push(abiParameter);
		else {
			const match = execTyped(typeWithoutTupleRegex, abiParameter.type);
			if (!match?.type) throw new InvalidAbiTypeParameterError({ abiParameter });
			const { array, type } = match;
			if (type in structs) {
				if (ancestors.has(type)) throw new CircularReferenceError({ type });
				components.push({
					...abiParameter,
					type: `tuple${array ?? ""}`,
					components: resolveStructs(structs[type], structs, /* @__PURE__ */ new Set([...ancestors, type]))
				});
			} else if (isSolidityType$1(type)) components.push(abiParameter);
			else throw new UnknownTypeError({ type });
		}
	}
	return components;
}
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/parseAbi.js
/**
* Parses human-readable ABI into JSON {@link Abi}
*
* @param signatures - Human-Readable ABI
* @returns Parsed {@link Abi}
*
* @example
* const abi = parseAbi([
*   //  ^? const abi: readonly [{ name: "balanceOf"; type: "function"; stateMutability:...
*   'function balanceOf(address owner) view returns (uint256)',
*   'event Transfer(address indexed from, address indexed to, uint256 amount)',
* ])
*/
function parseAbi(signatures) {
	const structs = parseStructs(signatures);
	const abi = [];
	const length = signatures.length;
	for (let i = 0; i < length; i++) {
		const signature = signatures[i];
		if (isStructSignature(signature)) continue;
		abi.push(parseSignature(signature, structs));
	}
	return abi;
}
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/parseAbiItem.js
/**
* Parses human-readable ABI item (e.g. error, event, function) into {@link Abi} item
*
* @param signature - Human-readable ABI item
* @returns Parsed {@link Abi} item
*
* @example
* const abiItem = parseAbiItem('function balanceOf(address owner) view returns (uint256)')
* //    ^? const abiItem: { name: "balanceOf"; type: "function"; stateMutability: "view";...
*
* @example
* const abiItem = parseAbiItem([
*   //  ^? const abiItem: { name: "foo"; type: "function"; stateMutability: "view"; inputs:...
*   'function foo(Baz bar) view returns (string)',
*   'struct Baz { string name; }',
* ])
*/
function parseAbiItem(signature) {
	let abiItem;
	if (typeof signature === "string") abiItem = parseSignature(signature);
	else {
		const structs = parseStructs(signature);
		const length = signature.length;
		for (let i = 0; i < length; i++) {
			const signature_ = signature[i];
			if (isStructSignature(signature_)) continue;
			abiItem = parseSignature(signature_, structs);
			break;
		}
	}
	if (!abiItem) throw new InvalidAbiItemError({ signature });
	return abiItem;
}
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/parseAbiParameters.js
/**
* Parses human-readable ABI parameters into {@link AbiParameter}s
*
* @param params - Human-readable ABI parameters
* @returns Parsed {@link AbiParameter}s
*
* @example
* const abiParameters = parseAbiParameters('address from, address to, uint256 amount')
* //    ^? const abiParameters: [{ type: "address"; name: "from"; }, { type: "address";...
*
* @example
* const abiParameters = parseAbiParameters([
*   //  ^? const abiParameters: [{ type: "tuple"; components: [{ type: "string"; name:...
*   'Baz bar',
*   'struct Baz { string name; }',
* ])
*/
function parseAbiParameters(params) {
	const abiParameters = [];
	if (typeof params === "string") {
		const parameters = splitParameters(params);
		const length = parameters.length;
		for (let i = 0; i < length; i++) abiParameters.push(parseAbiParameter(parameters[i], { modifiers }));
	} else {
		const structs = parseStructs(params);
		const length = params.length;
		for (let i = 0; i < length; i++) {
			const signature = params[i];
			if (isStructSignature(signature)) continue;
			const parameters = splitParameters(signature);
			const length = parameters.length;
			for (let k = 0; k < length; k++) abiParameters.push(parseAbiParameter(parameters[k], {
				modifiers,
				structs
			}));
		}
	}
	if (abiParameters.length === 0) throw new InvalidAbiParametersError({ params });
	return abiParameters;
}
// ../../node_modules/viem/_esm/utils/getAction.js
/**
* Retrieves and returns an action from the client (if exists), and falls
* back to the tree-shakable action.
*
* Useful for extracting overridden actions from a client (ie. if a consumer
* wants to override the `sendTransaction` implementation).
*/
function getAction(client, actionFn, name) {
	const action_implicit = client[actionFn.name];
	if (typeof action_implicit === "function") return action_implicit;
	const action_explicit = client[name];
	if (typeof action_explicit === "function") return action_explicit;
	return (params) => actionFn(client, params);
}
// ../../node_modules/viem/_esm/utils/abi/formatAbiItem.js
function formatAbiItem(abiItem, { includeName = false } = {}) {
	if (abiItem.type !== "function" && abiItem.type !== "event" && abiItem.type !== "error") throw new InvalidDefinitionTypeError(abiItem.type);
	return `${abiItem.name}(${formatAbiParams(abiItem.inputs, { includeName })})`;
}
function formatAbiParams(params, { includeName = false } = {}) {
	if (!params) return "";
	return params.map((param) => formatAbiParam(param, { includeName })).join(includeName ? ", " : ",");
}
function formatAbiParam(param, { includeName }) {
	if (param.type.startsWith("tuple")) return `(${formatAbiParams(param.components, { includeName })})${param.type.slice(5)}`;
	return param.type + (includeName && param.name ? ` ${param.name}` : "");
}
// ../../node_modules/viem/_esm/errors/abi.js
var AbiConstructorNotFoundError = class extends BaseError$2 {
	constructor({ docsPath }) {
		super(["A constructor was not found on the ABI.", "Make sure you are using the correct ABI and that the constructor exists on it."].join("\n"), {
			docsPath,
			name: "AbiConstructorNotFoundError"
		});
	}
};
var AbiConstructorParamsNotFoundError = class extends BaseError$2 {
	constructor({ docsPath }) {
		super(["Constructor arguments were provided (`args`), but a constructor parameters (`inputs`) were not found on the ABI.", "Make sure you are using the correct ABI, and that the `inputs` attribute on the constructor exists."].join("\n"), {
			docsPath,
			name: "AbiConstructorParamsNotFoundError"
		});
	}
};
var AbiDecodingDataSizeTooSmallError = class extends BaseError$2 {
	constructor({ data, params, size }) {
		super([`Data size of ${size} bytes is too small for given parameters.`].join("\n"), {
			metaMessages: [`Params: (${formatAbiParams(params, { includeName: true })})`, `Data:   ${data} (${size} bytes)`],
			name: "AbiDecodingDataSizeTooSmallError"
		});
		Object.defineProperty(this, "data", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "params", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "size", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.data = data;
		this.params = params;
		this.size = size;
	}
};
var AbiDecodingZeroDataError = class extends BaseError$2 {
	constructor({ cause } = {}) {
		super("Cannot decode zero data (\"0x\") with ABI parameters.", {
			name: "AbiDecodingZeroDataError",
			cause
		});
	}
};
var AbiEncodingArrayLengthMismatchError = class extends BaseError$2 {
	constructor({ expectedLength, givenLength, type }) {
		super([
			`ABI encoding array length mismatch for type ${type}.`,
			`Expected length: ${expectedLength}`,
			`Given length: ${givenLength}`
		].join("\n"), { name: "AbiEncodingArrayLengthMismatchError" });
	}
};
var AbiEncodingBytesSizeMismatchError = class extends BaseError$2 {
	constructor({ expectedSize, value }) {
		super(`Size of bytes "${value}" (bytes${size$3(value)}) does not match expected size (bytes${expectedSize}).`, { name: "AbiEncodingBytesSizeMismatchError" });
	}
};
var AbiEncodingLengthMismatchError = class extends BaseError$2 {
	constructor({ expectedLength, givenLength }) {
		super([
			"ABI encoding params/values length mismatch.",
			`Expected length (params): ${expectedLength}`,
			`Given length (values): ${givenLength}`
		].join("\n"), { name: "AbiEncodingLengthMismatchError" });
	}
};
var AbiErrorInputsNotFoundError = class extends BaseError$2 {
	constructor(errorName, { docsPath }) {
		super([
			`Arguments (\`args\`) were provided to "${errorName}", but "${errorName}" on the ABI does not contain any parameters (\`inputs\`).`,
			"Cannot encode error result without knowing what the parameter types are.",
			"Make sure you are using the correct ABI and that the inputs exist on it."
		].join("\n"), {
			docsPath,
			name: "AbiErrorInputsNotFoundError"
		});
	}
};
var AbiErrorNotFoundError = class extends BaseError$2 {
	constructor(errorName, { docsPath } = {}) {
		super([`Error ${errorName ? `"${errorName}" ` : ""}not found on ABI.`, "Make sure you are using the correct ABI and that the error exists on it."].join("\n"), {
			docsPath,
			name: "AbiErrorNotFoundError"
		});
	}
};
var AbiErrorSignatureNotFoundError = class extends BaseError$2 {
	constructor(signature, { docsPath, cause }) {
		super([
			`Encoded error signature "${signature}" not found on ABI.`,
			"Make sure you are using the correct ABI and that the error exists on it.",
			`You can look up the decoded signature here: https://4byte.sourcify.dev/?q=${signature}.`
		].join("\n"), {
			docsPath,
			name: "AbiErrorSignatureNotFoundError",
			cause
		});
		Object.defineProperty(this, "signature", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.signature = signature;
	}
};
var AbiEventSignatureEmptyTopicsError = class extends BaseError$2 {
	constructor({ docsPath }) {
		super("Cannot extract event signature from empty topics.", {
			docsPath,
			name: "AbiEventSignatureEmptyTopicsError"
		});
	}
};
var AbiEventSignatureNotFoundError = class extends BaseError$2 {
	constructor(signature, { docsPath }) {
		super([
			`Encoded event signature "${signature}" not found on ABI.`,
			"Make sure you are using the correct ABI and that the event exists on it.",
			`You can look up the signature here: https://4byte.sourcify.dev/?q=${signature}.`
		].join("\n"), {
			docsPath,
			name: "AbiEventSignatureNotFoundError"
		});
	}
};
var AbiEventNotFoundError = class extends BaseError$2 {
	constructor(eventName, { docsPath } = {}) {
		super([`Event ${eventName ? `"${eventName}" ` : ""}not found on ABI.`, "Make sure you are using the correct ABI and that the event exists on it."].join("\n"), {
			docsPath,
			name: "AbiEventNotFoundError"
		});
	}
};
var AbiFunctionNotFoundError = class extends BaseError$2 {
	constructor(functionName, { docsPath } = {}) {
		super([`Function ${functionName ? `"${functionName}" ` : ""}not found on ABI.`, "Make sure you are using the correct ABI and that the function exists on it."].join("\n"), {
			docsPath,
			name: "AbiFunctionNotFoundError"
		});
	}
};
var AbiFunctionOutputsNotFoundError = class extends BaseError$2 {
	constructor(functionName, { docsPath }) {
		super([
			`Function "${functionName}" does not contain any \`outputs\` on ABI.`,
			"Cannot decode function result without knowing what the parameter types are.",
			"Make sure you are using the correct ABI and that the function exists on it."
		].join("\n"), {
			docsPath,
			name: "AbiFunctionOutputsNotFoundError"
		});
	}
};
var AbiFunctionSignatureNotFoundError = class extends BaseError$2 {
	constructor(signature, { docsPath }) {
		super([
			`Encoded function signature "${signature}" not found on ABI.`,
			"Make sure you are using the correct ABI and that the function exists on it.",
			`You can look up the signature here: https://4byte.sourcify.dev/?q=${signature}.`
		].join("\n"), {
			docsPath,
			name: "AbiFunctionSignatureNotFoundError"
		});
	}
};
var AbiItemAmbiguityError = class extends BaseError$2 {
	constructor(x, y) {
		super("Found ambiguous types in overloaded ABI items.", {
			metaMessages: [
				`\`${x.type}\` in \`${formatAbiItem(x.abiItem)}\`, and`,
				`\`${y.type}\` in \`${formatAbiItem(y.abiItem)}\``,
				"",
				"These types encode differently and cannot be distinguished at runtime.",
				"Remove one of the ambiguous items in the ABI."
			],
			name: "AbiItemAmbiguityError"
		});
	}
};
var BytesSizeMismatchError$1 = class extends BaseError$2 {
	constructor({ expectedSize, givenSize }) {
		super(`Expected bytes${expectedSize}, got bytes${givenSize}.`, { name: "BytesSizeMismatchError" });
	}
};
var DecodeLogDataMismatch = class extends BaseError$2 {
	constructor({ abiItem, data, params, size }) {
		super([`Data size of ${size} bytes is too small for non-indexed event parameters.`].join("\n"), {
			metaMessages: [`Params: (${formatAbiParams(params, { includeName: true })})`, `Data:   ${data} (${size} bytes)`],
			name: "DecodeLogDataMismatch"
		});
		Object.defineProperty(this, "abiItem", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "data", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "params", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "size", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.abiItem = abiItem;
		this.data = data;
		this.params = params;
		this.size = size;
	}
};
var DecodeLogTopicsMismatch = class extends BaseError$2 {
	constructor({ abiItem, param }) {
		super([`Expected a topic for indexed event parameter${param.name ? ` "${param.name}"` : ""} on event "${formatAbiItem(abiItem, { includeName: true })}".`].join("\n"), { name: "DecodeLogTopicsMismatch" });
		Object.defineProperty(this, "abiItem", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.abiItem = abiItem;
	}
};
var InvalidAbiEncodingTypeError = class extends BaseError$2 {
	constructor(type, { docsPath }) {
		super([`Type "${type}" is not a valid encoding type.`, "Please provide a valid ABI type."].join("\n"), {
			docsPath,
			name: "InvalidAbiEncodingType"
		});
	}
};
var InvalidAbiDecodingTypeError = class extends BaseError$2 {
	constructor(type, { docsPath }) {
		super([`Type "${type}" is not a valid decoding type.`, "Please provide a valid ABI type."].join("\n"), {
			docsPath,
			name: "InvalidAbiDecodingType"
		});
	}
};
var InvalidArrayError$1 = class extends BaseError$2 {
	constructor(value) {
		super([`Value "${value}" is not a valid array.`].join("\n"), { name: "InvalidArrayError" });
	}
};
var InvalidDefinitionTypeError = class extends BaseError$2 {
	constructor(type) {
		super([`"${type}" is not a valid definition type.`, "Valid types: \"function\", \"event\", \"error\""].join("\n"), { name: "InvalidDefinitionTypeError" });
	}
};
// ../../node_modules/viem/_esm/errors/log.js
var FilterTypeNotSupportedError$1 = class extends BaseError$2 {
	constructor(type) {
		super(`Filter type "${type}" is not supported.`, { name: "FilterTypeNotSupportedError" });
	}
};
// ../../node_modules/viem/_esm/utils/hash/toEventSelector.js
/**
* Returns the event selector for a given event definition.
*
* @example
* const selector = toEventSelector('Transfer(address indexed from, address indexed to, uint256 amount)')
* // 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
*/
var toEventSelector = toSignatureHash;
// ../../node_modules/viem/_esm/utils/data/concat.js
function concat$1(values) {
	if (typeof values[0] === "string") return concatHex(values);
	return concatBytes$1(values);
}
function concatBytes$1(values) {
	let length = 0;
	for (const arr of values) length += arr.length;
	const result = new Uint8Array(length);
	let offset = 0;
	for (const arr of values) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}
function concatHex(values) {
	return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
}
// ../../node_modules/viem/_esm/utils/regex.js
var bytesRegex$1 = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
var integerRegex$1 = /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
// ../../node_modules/viem/_esm/utils/abi/encodeAbiParameters.js
/**
* @description Encodes a list of primitive values into an ABI-encoded hex value.
*
* - Docs: https://viem.sh/docs/abi/encodeAbiParameters#encodeabiparameters
*
*   Generates ABI encoded data using the [ABI specification](https://docs.soliditylang.org/en/latest/abi-spec), given a set of ABI parameters (inputs/outputs) and their corresponding values.
*
* @param params - a set of ABI Parameters (params), that can be in the shape of the inputs or outputs attribute of an ABI Item.
* @param values - a set of values (values) that correspond to the given params.
* @example
* ```typescript
* import { encodeAbiParameters } from 'viem'
*
* const encodedData = encodeAbiParameters(
*   [
*     { name: 'x', type: 'string' },
*     { name: 'y', type: 'uint' },
*     { name: 'z', type: 'bool' }
*   ],
*   ['wagmi', 420n, true]
* )
* ```
*
* You can also pass in Human Readable parameters with the parseAbiParameters utility.
*
* @example
* ```typescript
* import { encodeAbiParameters, parseAbiParameters } from 'viem'
*
* const encodedData = encodeAbiParameters(
*   parseAbiParameters('string x, uint y, bool z'),
*   ['wagmi', 420n, true]
* )
* ```
*/
function encodeAbiParameters(params, values) {
	if (params.length !== values.length) throw new AbiEncodingLengthMismatchError({
		expectedLength: params.length,
		givenLength: values.length
	});
	return encodeParams(prepareParams({
		params,
		values
	}));
}
function prepareParams({ params, values }) {
	const preparedParams = [];
	for (let i = 0; i < params.length; i++) preparedParams.push(prepareParam({
		param: params[i],
		value: values[i]
	}));
	return preparedParams;
}
function prepareParam({ param, value }) {
	const arrayComponents = getArrayComponents$1(param.type);
	if (arrayComponents) {
		const [length, type] = arrayComponents;
		return encodeArray$1(value, {
			length,
			param: {
				...param,
				type
			}
		});
	}
	if (param.type === "tuple") return encodeTuple$1(value, { param });
	if (param.type === "address") return encodeAddress$1(value);
	if (param.type === "bool") return encodeBool(value);
	if (param.type.startsWith("uint") || param.type.startsWith("int")) {
		const signed = param.type.startsWith("int");
		const [, , size = "256"] = integerRegex$1.exec(param.type) ?? [];
		return encodeNumber$1(value, {
			signed,
			size: Number(size)
		});
	}
	if (param.type.startsWith("bytes")) return encodeBytes$1(value, { param });
	if (param.type === "string") return encodeString$1(value);
	throw new InvalidAbiEncodingTypeError(param.type, { docsPath: "/docs/contract/encodeAbiParameters" });
}
function encodeParams(preparedParams) {
	let staticSize = 0;
	for (let i = 0; i < preparedParams.length; i++) {
		const { dynamic, encoded } = preparedParams[i];
		if (dynamic) staticSize += 32;
		else staticSize += size$3(encoded);
	}
	const staticParams = [];
	const dynamicParams = [];
	let dynamicSize = 0;
	for (let i = 0; i < preparedParams.length; i++) {
		const { dynamic, encoded } = preparedParams[i];
		if (dynamic) {
			staticParams.push(numberToHex(staticSize + dynamicSize, { size: 32 }));
			dynamicParams.push(encoded);
			dynamicSize += size$3(encoded);
		} else staticParams.push(encoded);
	}
	return concatHex([...staticParams, ...dynamicParams]);
}
function encodeAddress$1(value) {
	if (!isAddress(value)) throw new InvalidAddressError$1({ address: value });
	return {
		dynamic: false,
		encoded: padHex(value.toLowerCase())
	};
}
function encodeArray$1(value, { length, param }) {
	const dynamic = length === null;
	if (!Array.isArray(value)) throw new InvalidArrayError$1(value);
	if (!dynamic && value.length !== length) throw new AbiEncodingArrayLengthMismatchError({
		expectedLength: length,
		givenLength: value.length,
		type: `${param.type}[${length}]`
	});
	let dynamicChild = value.length === 0 && isDynamicType(param);
	const preparedParams = [];
	for (let i = 0; i < value.length; i++) {
		const preparedParam = prepareParam({
			param,
			value: value[i]
		});
		if (preparedParam.dynamic) dynamicChild = true;
		preparedParams.push(preparedParam);
	}
	if (dynamic || dynamicChild) {
		const data = encodeParams(preparedParams);
		if (dynamic) return {
			dynamic: true,
			encoded: concatHex([numberToHex(preparedParams.length, { size: 32 }), data])
		};
		if (dynamicChild) return {
			dynamic: true,
			encoded: data
		};
	}
	return {
		dynamic: false,
		encoded: concatHex(preparedParams.map(({ encoded }) => encoded))
	};
}
function encodeBytes$1(value, { param }) {
	const [, paramSize] = param.type.split("bytes");
	const bytesSize = size$3(value);
	if (!paramSize) {
		let value_ = value;
		if (bytesSize % 32 !== 0) value_ = padHex(value_, {
			dir: "right",
			size: Math.ceil((value.length - 2) / 2 / 32) * 32
		});
		return {
			dynamic: true,
			encoded: concatHex([padHex(numberToHex(bytesSize, { size: 32 })), value_])
		};
	}
	if (bytesSize !== Number.parseInt(paramSize, 10)) throw new AbiEncodingBytesSizeMismatchError({
		expectedSize: Number.parseInt(paramSize, 10),
		value
	});
	return {
		dynamic: false,
		encoded: padHex(value, { dir: "right" })
	};
}
function encodeBool(value) {
	if (typeof value !== "boolean") throw new BaseError$2(`Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`);
	return {
		dynamic: false,
		encoded: padHex(boolToHex(value))
	};
}
function encodeNumber$1(value, { signed, size = 256 }) {
	if (typeof size === "number") {
		const max = 2n ** (BigInt(size) - (signed ? 1n : 0n)) - 1n;
		const min = signed ? -max - 1n : 0n;
		if (value > max || value < min) throw new IntegerOutOfRangeError$1({
			max: max.toString(),
			min: min.toString(),
			signed,
			size: size / 8,
			value: value.toString()
		});
	}
	return {
		dynamic: false,
		encoded: numberToHex(value, {
			size: 32,
			signed
		})
	};
}
function encodeString$1(value) {
	const hexValue = stringToHex(value);
	const partsLength = Math.ceil(size$3(hexValue) / 32);
	const parts = [];
	for (let i = 0; i < partsLength; i++) parts.push(padHex(slice$2(hexValue, i * 32, (i + 1) * 32), { dir: "right" }));
	return {
		dynamic: true,
		encoded: concatHex([padHex(numberToHex(size$3(hexValue), { size: 32 })), ...parts])
	};
}
function encodeTuple$1(value, { param }) {
	let dynamic = false;
	const preparedParams = [];
	for (let i = 0; i < param.components.length; i++) {
		const param_ = param.components[i];
		const preparedParam = prepareParam({
			param: param_,
			value: value[Array.isArray(value) ? i : param_.name]
		});
		preparedParams.push(preparedParam);
		if (preparedParam.dynamic) dynamic = true;
	}
	return {
		dynamic,
		encoded: dynamic ? encodeParams(preparedParams) : concatHex(preparedParams.map(({ encoded }) => encoded))
	};
}
function getArrayComponents$1(type) {
	const matches = type.match(/^(.*)\[(\d+)?\]$/);
	return matches ? [matches[2] ? Number(matches[2]) : null, matches[1]] : void 0;
}
function isDynamicType(param) {
	const { type } = param;
	if (type === "string") return true;
	if (type === "bytes") return true;
	if (type.endsWith("[]")) return true;
	if (type === "tuple") return param.components.some(isDynamicType);
	const arrayComponents = getArrayComponents$1(type);
	if (arrayComponents) return isDynamicType({
		...param,
		type: arrayComponents[1]
	});
	return false;
}
// ../../node_modules/viem/_esm/utils/abi/getAbiItem.js
function getAbiItem(parameters) {
	const { abi, args = [], name } = parameters;
	const isSelector = isHex(name, { strict: false });
	const abiItems = abi.filter((abiItem) => {
		if (isSelector) {
			if (abiItem.type === "function") return toFunctionSelector(abiItem) === name;
			if (abiItem.type === "event") return toEventSelector(abiItem) === name;
			return false;
		}
		return "name" in abiItem && abiItem.name === name;
	});
	if (abiItems.length === 0) return void 0;
	if (abiItems.length === 1) return abiItems[0];
	let matchedAbiItem;
	for (const abiItem of abiItems) {
		if (!("inputs" in abiItem)) continue;
		if (!args || args.length === 0) {
			if (!abiItem.inputs || abiItem.inputs.length === 0) return abiItem;
			continue;
		}
		if (!abiItem.inputs) continue;
		if (abiItem.inputs.length === 0) continue;
		if (abiItem.inputs.length !== args.length) continue;
		if (args.every((arg, index) => {
			const abiParameter = "inputs" in abiItem && abiItem.inputs[index];
			if (!abiParameter) return false;
			return isArgOfType$1(arg, abiParameter);
		})) {
			if (matchedAbiItem && "inputs" in matchedAbiItem && matchedAbiItem.inputs) {
				const ambiguousTypes = getAmbiguousTypes$1(abiItem.inputs, matchedAbiItem.inputs, args);
				if (ambiguousTypes) throw new AbiItemAmbiguityError({
					abiItem,
					type: ambiguousTypes[0]
				}, {
					abiItem: matchedAbiItem,
					type: ambiguousTypes[1]
				});
			}
			matchedAbiItem = abiItem;
		}
	}
	if (matchedAbiItem) return matchedAbiItem;
	return abiItems[0];
}
/** @internal */
function isArgOfType$1(arg, abiParameter) {
	const argType = typeof arg;
	const abiParameterType = abiParameter.type;
	switch (abiParameterType) {
		case "address": return isAddress(arg, { strict: false });
		case "bool": return argType === "boolean";
		case "function": return argType === "string";
		case "string": return argType === "string";
		default: {
			if (abiParameterType === "tuple" && "components" in abiParameter) return Object.values(abiParameter.components).every((component, index) => {
				return argType === "object" && isArgOfType$1(getComponentValue$1(arg, component, index), component);
			});
			if (/^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/.test(abiParameterType)) {
				if (typeof arg !== "bigint" && typeof arg !== "number") return false;
				if (typeof arg === "number" && !Number.isInteger(arg)) return false;
				const signed = abiParameterType.startsWith("int");
				const bits = Number.parseInt(abiParameterType.replace(/^u?int/, "") || "256", 10);
				const max = 2n ** (BigInt(bits) - (signed ? 1n : 0n)) - 1n;
				return arg >= (signed ? -max - 1n : 0n) && arg <= max;
			}
			if (/^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/.test(abiParameterType)) {
				if (typeof arg !== "string" && !(arg instanceof Uint8Array)) return false;
				const bytes = abiParameterType.slice(5);
				if (!bytes) return true;
				if (typeof arg === "string" && !isHex(arg)) return false;
				return size$3(arg) === Number.parseInt(bytes, 10);
			}
			const arrayComponents = getArrayComponents$1(abiParameterType);
			if (arrayComponents) {
				const [length, type] = arrayComponents;
				return Array.isArray(arg) && (length === null || arg.length === length) && arg.every((x) => isArgOfType$1(x, {
					...abiParameter,
					type
				}));
			}
			return false;
		}
	}
}
/** @internal */
function getAmbiguousTypes$1(sourceParameters, targetParameters, args) {
	for (const parameterIndex in sourceParameters) {
		const sourceParameter = sourceParameters[parameterIndex];
		const targetParameter = targetParameters[parameterIndex];
		if (!targetParameter) continue;
		if (sourceParameter.type === "tuple" && targetParameter.type === "tuple" && "components" in sourceParameter && "components" in targetParameter) {
			const value = args[parameterIndex];
			const types = getAmbiguousTypes$1(sourceParameter.components, targetParameter.components, sourceParameter.components.map((component, index) => getComponentValue$1(value, component, index)));
			if (types) return types;
			continue;
		}
		const sourceArray = getArrayComponents$1(sourceParameter.type);
		const targetArray = getArrayComponents$1(targetParameter.type);
		if (sourceArray && targetArray) {
			const types = getAmbiguousTypes$1([{
				...sourceParameter,
				type: sourceArray[1]
			}], [{
				...targetParameter,
				type: targetArray[1]
			}], [args[parameterIndex]?.[0]]);
			if (types) return types;
			if (sourceArray[1] === targetArray[1] && sourceParameter.type !== targetParameter.type) return [sourceParameter.type, targetParameter.type];
			continue;
		}
		const types = [sourceParameter.type, targetParameter.type];
		const value = args[parameterIndex];
		if ((() => {
			if (types.includes("address") && (types.includes("string") || types.includes("bytes"))) return value === void 0 || isAddress(value, { strict: false });
			if (sourceParameter.type !== targetParameter.type) return true;
			return false;
		})()) return types;
	}
}
/** Reads a tuple component's value by index from arrays and by name from objects, like `encodeAbiParameters`. */
function getComponentValue$1(arg, component, index) {
	if (Array.isArray(arg)) return arg[index];
	return arg?.[component.name];
}
// ../../node_modules/viem/_esm/utils/abi/encodeEventTopics.js
var docsPath$6 = "/docs/contract/encodeEventTopics";
function encodeEventTopics(parameters) {
	const { abi, eventName, args } = parameters;
	let abiItem = abi[0];
	if (eventName) {
		const item = getAbiItem({
			abi,
			name: eventName
		});
		if (!item) throw new AbiEventNotFoundError(eventName, { docsPath: docsPath$6 });
		abiItem = item;
	}
	if (abiItem.type !== "event") throw new AbiEventNotFoundError(void 0, { docsPath: docsPath$6 });
	let topics = [];
	if (args && "inputs" in abiItem) {
		const indexedInputs = abiItem.inputs?.filter((param) => "indexed" in param && param.indexed);
		const args_ = Array.isArray(args) ? args : Object.values(args).length > 0 ? indexedInputs?.map((x) => args[x.name]) ?? [] : [];
		if (args_.length > 0) topics = indexedInputs?.map((param, i) => {
			if (Array.isArray(args_[i])) return args_[i].map((_, j) => encodeArg({
				param,
				value: args_[i][j]
			}));
			return typeof args_[i] !== "undefined" && args_[i] !== null ? encodeArg({
				param,
				value: args_[i]
			}) : null;
		}) ?? [];
	}
	if (abiItem.anonymous) return topics;
	return [toEventSelector(formatAbiItem(abiItem)), ...topics];
}
function encodeArg({ param, value }) {
	if (param.type === "string") return keccak256$1(stringToBytes(value));
	if (param.type === "bytes") return keccak256$1(toBytes$1(value));
	if (param.type === "tuple" || param.type.match(/^(.*)\[(\d+)?\]$/)) throw new FilterTypeNotSupportedError$1(param.type);
	return encodeAbiParameters([param], [value]);
}
// ../../node_modules/viem/_esm/utils/filters/createFilterRequestScope.js
/**
* Scopes `request` to the filter ID. If the client is a fallback, it will
* listen for responses and scope the child transport `request` function
* to the successful filter ID.
*/
function createFilterRequestScope(client, { method }) {
	const requestMap = {};
	if (client.transport.type === "fallback") client.transport.onResponse?.(({ method: method_, response: id, status, transport }) => {
		if (status === "success" && method === method_) requestMap[id] = transport.request;
	});
	return ((id) => requestMap[id] || client.request);
}
// ../../node_modules/viem/_esm/actions/public/createContractEventFilter.js
/**
* Creates a Filter to retrieve event logs that can be used with [`getFilterChanges`](https://viem.sh/docs/actions/public/getFilterChanges) or [`getFilterLogs`](https://viem.sh/docs/actions/public/getFilterLogs).
*
* - Docs: https://viem.sh/docs/contract/createContractEventFilter
*
* @param client - Client to use
* @param parameters - {@link CreateContractEventFilterParameters}
* @returns [`Filter`](https://viem.sh/docs/glossary/types#filter). {@link CreateContractEventFilterReturnType}
*
* @example
* import { createPublicClient, http, parseAbi } from 'viem'
* import { mainnet } from 'viem/chains'
* import { createContractEventFilter } from 'viem/contract'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const filter = await createContractEventFilter(client, {
*   abi: parseAbi(['event Transfer(address indexed, address indexed, uint256)']),
* })
*/
async function createContractEventFilter(client, parameters) {
	const { address, abi, args, eventName, fromBlock, strict, toBlock } = parameters;
	const getRequest = createFilterRequestScope(client, { method: "eth_newFilter" });
	const topics = eventName ? encodeEventTopics({
		abi,
		args,
		eventName
	}) : void 0;
	const id = await client.request({
		method: "eth_newFilter",
		params: [{
			address,
			fromBlock: typeof fromBlock === "bigint" ? numberToHex(fromBlock) : fromBlock,
			toBlock: typeof toBlock === "bigint" ? numberToHex(toBlock) : toBlock,
			topics
		}]
	});
	return {
		abi,
		args,
		eventName,
		id,
		request: getRequest(id),
		strict: Boolean(strict),
		type: "event"
	};
}
// ../../node_modules/viem/_esm/accounts/utils/parseAccount.js
function parseAccount(account) {
	if (typeof account === "string") return {
		address: account,
		type: "json-rpc"
	};
	return account;
}
// ../../node_modules/viem/_esm/utils/abi/prepareEncodeFunctionData.js
var docsPath$5 = "/docs/contract/encodeFunctionData";
function prepareEncodeFunctionData(parameters) {
	const { abi, args, functionName } = parameters;
	let abiItem = abi[0];
	if (functionName) {
		const item = getAbiItem({
			abi,
			args,
			name: functionName
		});
		if (!item) throw new AbiFunctionNotFoundError(functionName, { docsPath: docsPath$5 });
		abiItem = item;
	}
	if (abiItem.type !== "function") throw new AbiFunctionNotFoundError(void 0, { docsPath: docsPath$5 });
	return {
		abi: [abiItem],
		functionName: toFunctionSelector(formatAbiItem(abiItem))
	};
}
// ../../node_modules/viem/_esm/utils/abi/encodeFunctionData.js
function encodeFunctionData(parameters) {
	const { args } = parameters;
	const { abi, functionName } = (() => {
		if (parameters.abi.length === 1 && parameters.functionName?.startsWith("0x")) return parameters;
		return prepareEncodeFunctionData(parameters);
	})();
	const abiItem = abi[0];
	return concatHex([functionName, ("inputs" in abiItem && abiItem.inputs ? encodeAbiParameters(abiItem.inputs, args ?? []) : void 0) ?? "0x"]);
}
// ../../node_modules/viem/_esm/constants/solidity.js
var panicReasons = {
	1: "An `assert` condition failed.",
	17: "Arithmetic operation resulted in underflow or overflow.",
	18: "Division or modulo by zero (e.g. `5 / 0` or `23 % 0`).",
	33: "Attempted to convert to an invalid type.",
	34: "Attempted to access a storage byte array that is incorrectly encoded.",
	49: "Performed `.pop()` on an empty array",
	50: "Array index is out of bounds.",
	65: "Allocated too much memory or created an array which is too large.",
	81: "Attempted to call a zero-initialized variable of internal function type."
};
var solidityError = {
	inputs: [{
		name: "message",
		type: "string"
	}],
	name: "Error",
	type: "error"
};
var solidityPanic = {
	inputs: [{
		name: "reason",
		type: "uint256"
	}],
	name: "Panic",
	type: "error"
};
// ../../node_modules/viem/_esm/errors/cursor.js
var NegativeOffsetError$1 = class extends BaseError$2 {
	constructor({ offset }) {
		super(`Offset \`${offset}\` cannot be negative.`, { name: "NegativeOffsetError" });
	}
};
var PositionOutOfBoundsError$1 = class extends BaseError$2 {
	constructor({ length, position }) {
		super(`Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`, { name: "PositionOutOfBoundsError" });
	}
};
var RecursiveReadLimitExceededError$1 = class extends BaseError$2 {
	constructor({ count, limit }) {
		super(`Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`, { name: "RecursiveReadLimitExceededError" });
	}
};
// ../../node_modules/viem/_esm/utils/cursor.js
var staticCursor$1 = {
	bytes: /* @__PURE__ */ new Uint8Array(),
	dataView: /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(0)),
	position: 0,
	positionReadCount: /* @__PURE__ */ new Map(),
	recursiveReadCount: 0,
	recursiveReadLimit: Number.POSITIVE_INFINITY,
	assertReadLimit() {
		if (this.recursiveReadCount >= this.recursiveReadLimit) throw new RecursiveReadLimitExceededError$1({
			count: this.recursiveReadCount + 1,
			limit: this.recursiveReadLimit
		});
	},
	assertPosition(position) {
		if (position < 0 || position > this.bytes.length - 1) throw new PositionOutOfBoundsError$1({
			length: this.bytes.length,
			position
		});
	},
	decrementPosition(offset) {
		if (offset < 0) throw new NegativeOffsetError$1({ offset });
		const position = this.position - offset;
		this.assertPosition(position);
		this.position = position;
	},
	getReadCount(position) {
		return this.positionReadCount.get(position || this.position) || 0;
	},
	incrementPosition(offset) {
		if (offset < 0) throw new NegativeOffsetError$1({ offset });
		const position = this.position + offset;
		this.assertPosition(position);
		this.position = position;
	},
	inspectByte(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position);
		return this.bytes[position];
	},
	inspectBytes(length, position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position + length - 1);
		return this.bytes.subarray(position, position + length);
	},
	inspectUint8(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position);
		return this.bytes[position];
	},
	inspectUint16(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position + 1);
		return this.dataView.getUint16(position);
	},
	inspectUint24(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position + 2);
		return (this.dataView.getUint16(position) << 8) + this.dataView.getUint8(position + 2);
	},
	inspectUint32(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position + 3);
		return this.dataView.getUint32(position);
	},
	pushByte(byte) {
		this.assertPosition(this.position);
		this.bytes[this.position] = byte;
		this.position++;
	},
	pushBytes(bytes) {
		this.assertPosition(this.position + bytes.length - 1);
		this.bytes.set(bytes, this.position);
		this.position += bytes.length;
	},
	pushUint8(value) {
		this.assertPosition(this.position);
		this.bytes[this.position] = value;
		this.position++;
	},
	pushUint16(value) {
		this.assertPosition(this.position + 1);
		this.dataView.setUint16(this.position, value);
		this.position += 2;
	},
	pushUint24(value) {
		this.assertPosition(this.position + 2);
		this.dataView.setUint16(this.position, value >> 8);
		this.dataView.setUint8(this.position + 2, value & 255);
		this.position += 3;
	},
	pushUint32(value) {
		this.assertPosition(this.position + 3);
		this.dataView.setUint32(this.position, value);
		this.position += 4;
	},
	readByte() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectByte();
		this.position++;
		return value;
	},
	readBytes(length, size) {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectBytes(length);
		this.position += size ?? length;
		return value;
	},
	readUint8() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectUint8();
		this.position += 1;
		return value;
	},
	readUint16() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectUint16();
		this.position += 2;
		return value;
	},
	readUint24() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectUint24();
		this.position += 3;
		return value;
	},
	readUint32() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectUint32();
		this.position += 4;
		return value;
	},
	get remaining() {
		return this.bytes.length - this.position;
	},
	setPosition(position) {
		const oldPosition = this.position;
		this.assertPosition(position);
		this.position = position;
		return () => this.position = oldPosition;
	},
	_touch() {
		if (this.recursiveReadLimit === Number.POSITIVE_INFINITY) return;
		const count = this.getReadCount();
		this.positionReadCount.set(this.position, count + 1);
		if (count > 0) this.recursiveReadCount++;
	}
};
function createCursor(bytes, { recursiveReadLimit = 8192 } = {}) {
	const cursor = Object.create(staticCursor$1);
	cursor.bytes = bytes;
	cursor.dataView = new DataView(bytes.buffer ?? bytes, bytes.byteOffset, bytes.byteLength);
	cursor.positionReadCount = /* @__PURE__ */ new Map();
	cursor.recursiveReadLimit = recursiveReadLimit;
	return cursor;
}
// ../../node_modules/viem/_esm/utils/encoding/fromBytes.js
/**
* Decodes a byte array into a bigint.
*
* - Docs: https://viem.sh/docs/utilities/fromBytes#bytestobigint
*
* @param bytes Byte array to decode.
* @param opts Options.
* @returns BigInt value.
*
* @example
* import { bytesToBigInt } from 'viem'
* const data = bytesToBigInt(new Uint8Array([1, 164]))
* // 420n
*/
function bytesToBigInt(bytes, opts = {}) {
	if (typeof opts.size !== "undefined") assertSize$2(bytes, { size: opts.size });
	const hex = bytesToHex$1(bytes);
	return hexToBigInt(hex, opts);
}
/**
* Decodes a byte array into a boolean.
*
* - Docs: https://viem.sh/docs/utilities/fromBytes#bytestobool
*
* @param bytes Byte array to decode.
* @param opts Options.
* @returns Boolean value.
*
* @example
* import { bytesToBool } from 'viem'
* const data = bytesToBool(new Uint8Array([1]))
* // true
*/
function bytesToBool(bytes_, opts = {}) {
	let bytes = bytes_;
	if (typeof opts.size !== "undefined") {
		assertSize$2(bytes, { size: opts.size });
		bytes = trim$1(bytes);
	}
	if (bytes.length > 1 || bytes[0] > 1) throw new InvalidBytesBooleanError$1(bytes);
	return Boolean(bytes[0]);
}
/**
* Decodes a byte array into a number.
*
* - Docs: https://viem.sh/docs/utilities/fromBytes#bytestonumber
*
* @param bytes Byte array to decode.
* @param opts Options.
* @returns Number value.
*
* @example
* import { bytesToNumber } from 'viem'
* const data = bytesToNumber(new Uint8Array([1, 164]))
* // 420
*/
function bytesToNumber(bytes, opts = {}) {
	if (typeof opts.size !== "undefined") assertSize$2(bytes, { size: opts.size });
	const hex = bytesToHex$1(bytes);
	return hexToNumber$1(hex, opts);
}
/**
* Decodes a byte array into a UTF-8 string.
*
* - Docs: https://viem.sh/docs/utilities/fromBytes#bytestostring
*
* @param bytes Byte array to decode.
* @param opts Options.
* @returns String value.
*
* @example
* import { bytesToString } from 'viem'
* const data = bytesToString(new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
* // 'Hello world'
*/
function bytesToString(bytes_, opts = {}) {
	let bytes = bytes_;
	if (typeof opts.size !== "undefined") {
		assertSize$2(bytes, { size: opts.size });
		bytes = trim$1(bytes, { dir: "right" });
	}
	return new TextDecoder().decode(bytes);
}
// ../../node_modules/viem/_esm/utils/abi/decodeAbiParameters.js
function decodeAbiParameters(params, data) {
	const bytes = typeof data === "string" ? hexToBytes$1(data) : data;
	const cursor = createCursor(bytes);
	if (size$3(bytes) === 0 && params.length > 0) throw new AbiDecodingZeroDataError();
	if (size$3(data) && size$3(data) < 32) throw new AbiDecodingDataSizeTooSmallError({
		data: typeof data === "string" ? data : bytesToHex$1(data),
		params,
		size: size$3(data)
	});
	let consumed = 0;
	const values = [];
	for (let i = 0; i < params.length; ++i) {
		const param = params[i];
		if (consumed < bytes.length) cursor.setPosition(consumed);
		const [data, consumed_] = decodeParameter$1(cursor, param, { staticPosition: 0 });
		consumed += consumed_;
		values.push(data);
	}
	return values;
}
function decodeParameter$1(cursor, param, { staticPosition }) {
	const arrayComponents = getArrayComponents$1(param.type);
	if (arrayComponents) {
		const [length, type] = arrayComponents;
		return decodeArray$1(cursor, {
			...param,
			type
		}, {
			length,
			staticPosition
		});
	}
	if (param.type === "tuple") return decodeTuple$1(cursor, param, { staticPosition });
	if (param.type === "address") return decodeAddress$2(cursor);
	if (param.type === "bool") return decodeBool$1(cursor);
	if (param.type.startsWith("bytes")) return decodeBytes$1(cursor, param, { staticPosition });
	if (param.type.startsWith("uint") || param.type.startsWith("int")) return decodeNumber$1(cursor, param);
	if (param.type === "string") return decodeString$1(cursor, { staticPosition });
	throw new InvalidAbiDecodingTypeError(param.type, { docsPath: "/docs/contract/decodeAbiParameters" });
}
var sizeOfLength$1 = 32;
var sizeOfOffset$1 = 32;
function decodeAddress$2(cursor) {
	const value = cursor.readBytes(32);
	return [checksumAddress(bytesToHex$1(sliceBytes(value, -20))), 32];
}
function decodeArray$1(cursor, param, { length, staticPosition }) {
	if (length === null) {
		const start = staticPosition + bytesToNumber(cursor.readBytes(sizeOfOffset$1));
		const startOfData = start + sizeOfLength$1;
		cursor.setPosition(start);
		const length = bytesToNumber(cursor.readBytes(sizeOfLength$1));
		const dynamicChild = hasDynamicChild$1(param);
		let consumed = 0;
		const value = [];
		for (let i = 0; i < length; ++i) {
			cursor.setPosition(startOfData + (dynamicChild ? i * 32 : consumed));
			const [data, consumed_] = decodeParameter$1(cursor, param, { staticPosition: startOfData });
			consumed += consumed_;
			value.push(data);
			if (consumed_ === 0) {
				cursor.assertReadLimit();
				cursor._touch();
			}
		}
		cursor.setPosition(staticPosition + 32);
		return [value, 32];
	}
	if (hasDynamicChild$1(param)) {
		const start = staticPosition + bytesToNumber(cursor.readBytes(sizeOfOffset$1));
		const value = [];
		for (let i = 0; i < length; ++i) {
			cursor.setPosition(start + i * 32);
			const [data] = decodeParameter$1(cursor, param, { staticPosition: start });
			value.push(data);
		}
		cursor.setPosition(staticPosition + 32);
		return [value, 32];
	}
	let consumed = 0;
	const value = [];
	for (let i = 0; i < length; ++i) {
		const [data, consumed_] = decodeParameter$1(cursor, param, { staticPosition: staticPosition + consumed });
		consumed += consumed_;
		value.push(data);
		if (consumed_ === 0) {
			cursor.assertReadLimit();
			cursor._touch();
		}
	}
	return [value, consumed];
}
function decodeBool$1(cursor) {
	return [bytesToBool(cursor.readBytes(32), { size: 32 }), 32];
}
function decodeBytes$1(cursor, param, { staticPosition }) {
	const [_, size] = param.type.split("bytes");
	if (!size) {
		const offset = bytesToNumber(cursor.readBytes(32));
		cursor.setPosition(staticPosition + offset);
		const length = bytesToNumber(cursor.readBytes(32));
		if (length === 0) {
			cursor.setPosition(staticPosition + 32);
			return ["0x", 32];
		}
		const data = cursor.readBytes(length);
		cursor.setPosition(staticPosition + 32);
		return [bytesToHex$1(data), 32];
	}
	return [bytesToHex$1(cursor.readBytes(Number.parseInt(size, 10), 32)), 32];
}
function decodeNumber$1(cursor, param) {
	const signed = param.type.startsWith("int");
	const size = Number.parseInt(param.type.split("int")[1] || "256", 10);
	const value = cursor.readBytes(32);
	return [size > 48 ? bytesToBigInt(value, { signed }) : bytesToNumber(value, { signed }), 32];
}
function decodeTuple$1(cursor, param, { staticPosition }) {
	const hasUnnamedChild = param.components.length === 0 || param.components.some(({ name }) => !name);
	const value = hasUnnamedChild ? [] : {};
	let consumed = 0;
	if (hasDynamicChild$1(param)) {
		const start = staticPosition + bytesToNumber(cursor.readBytes(sizeOfOffset$1));
		for (let i = 0; i < param.components.length; ++i) {
			const component = param.components[i];
			cursor.setPosition(start + consumed);
			const [data, consumed_] = decodeParameter$1(cursor, component, { staticPosition: start });
			consumed += consumed_;
			value[hasUnnamedChild ? i : component?.name] = data;
		}
		cursor.setPosition(staticPosition + 32);
		return [value, 32];
	}
	for (let i = 0; i < param.components.length; ++i) {
		const component = param.components[i];
		const [data, consumed_] = decodeParameter$1(cursor, component, { staticPosition });
		value[hasUnnamedChild ? i : component?.name] = data;
		consumed += consumed_;
	}
	return [value, consumed];
}
function decodeString$1(cursor, { staticPosition }) {
	const start = staticPosition + bytesToNumber(cursor.readBytes(32));
	cursor.setPosition(start);
	const length = bytesToNumber(cursor.readBytes(32));
	if (length === 0) {
		cursor.setPosition(staticPosition + 32);
		return ["", 32];
	}
	const value = bytesToString(cursor.readBytes(length, 32));
	cursor.setPosition(staticPosition + 32);
	return [value, 32];
}
function hasDynamicChild$1(param) {
	const { type } = param;
	if (type === "string") return true;
	if (type === "bytes") return true;
	if (type.endsWith("[]")) return true;
	if (type === "tuple") return param.components?.some(hasDynamicChild$1);
	const arrayComponents = getArrayComponents$1(param.type);
	if (arrayComponents && hasDynamicChild$1({
		...param,
		type: arrayComponents[1]
	})) return true;
	return false;
}
// ../../node_modules/viem/_esm/utils/abi/decodeErrorResult.js
function decodeErrorResult(parameters) {
	const { abi, data, cause } = parameters;
	const signature = slice$2(data, 0, 4);
	if (signature === "0x") throw new AbiDecodingZeroDataError({ cause });
	const abiItem = [
		...abi || [],
		solidityError,
		solidityPanic
	].find((x) => x.type === "error" && signature === toFunctionSelector(formatAbiItem(x)));
	if (!abiItem) throw new AbiErrorSignatureNotFoundError(signature, {
		docsPath: "/docs/contract/decodeErrorResult",
		cause
	});
	return {
		abiItem,
		args: "inputs" in abiItem && abiItem.inputs && abiItem.inputs.length > 0 ? decodeAbiParameters(abiItem.inputs, slice$2(data, 4)) : void 0,
		errorName: abiItem.name
	};
}
// ../../node_modules/viem/_esm/utils/stringify.js
var stringify$1 = (value, replacer, space) => JSON.stringify(value, (key, value_) => {
	const value = typeof value_ === "bigint" ? value_.toString() : value_;
	return typeof replacer === "function" ? replacer(key, value) : value;
}, space);
// ../../node_modules/viem/_esm/utils/abi/formatAbiItemWithArgs.js
function formatAbiItemWithArgs({ abiItem, args, includeFunctionName = true, includeName = false }) {
	if (!("name" in abiItem)) return;
	if (!("inputs" in abiItem)) return;
	if (!abiItem.inputs) return;
	return `${includeFunctionName ? abiItem.name : ""}(${abiItem.inputs.map((input, i) => `${includeName && input.name ? `${input.name}: ` : ""}${typeof args[i] === "object" ? stringify$1(args[i]) : args[i]}`).join(", ")})`;
}
// ../../node_modules/viem/_esm/utils/unit/Value.js
/** @see https://ethereum.github.io/yellowpaper/paper.pdf */
var exponents = {
	wei: 0,
	gwei: 9,
	szabo: 12,
	finney: 15,
	ether: 18
};
/**
* Formats a `bigint` Value to its string representation (divided by the given exponent).
*
* @example
* ```ts twoslash
* import { Value } from 'ox'
*
* Value.format(420_000_000_000n, 9)
* // @log: '420'
* ```
*
* @param value - The `bigint` Value to format.
* @param decimals - The exponent to divide the `bigint` Value by.
* @returns The string representation of the Value.
*/
function format$2(value, decimals = 0) {
	if (!Number.isInteger(decimals) || decimals < 0) throw new InvalidDecimalsError({ decimals });
	let display = value.toString();
	const negative = display.startsWith("-");
	if (negative) display = display.slice(1);
	display = display.padStart(decimals, "0");
	let [integer, fraction] = [display.slice(0, display.length - decimals), display.slice(display.length - decimals)];
	fraction = fraction.replace(/(0+)$/, "");
	return `${negative ? "-" : ""}${integer || "0"}${fraction ? `.${fraction}` : ""}`;
}
/**
* Formats a `bigint` Value (default: wei) to a string representation of Ether.
*
* @example
* ```ts twoslash
* import { Value } from 'ox'
*
* Value.formatEther(1_000_000_000_000_000_000n)
* // @log: '1'
* ```
*
* @param wei - The Value to format.
* @param unit - The unit to format the Value in. @default 'wei'.
* @returns The Ether string representation of the Value.
*/
function formatEther$1(wei, unit = "wei") {
	return format$2(wei, exponents.ether - exponents[unit]);
}
/**
* Formats a `bigint` Value (default: wei) to a string representation of Gwei.
*
* @example
* ```ts twoslash
* import { Value } from 'ox'
*
* Value.formatGwei(1_000_000_000n)
* // @log: '1'
* ```
*
* @param wei - The Value to format.
* @param unit - The unit to format the Value in. @default 'wei'.
* @returns The Gwei string representation of the Value.
*/
function formatGwei$1(wei, unit = "wei") {
	return format$2(wei, exponents.gwei - exponents[unit]);
}
/**
* Thrown when the `decimals` argument is not a non-negative integer.
*
* @example
* ```ts twoslash
* import { Value } from 'ox'
*
* Value.from('1', -1)
* // @error: Value.InvalidDecimalsError: `decimals` must be a non-negative integer. Got `-1`.
* ```
*/
var InvalidDecimalsError = class extends Error {
	constructor({ decimals }) {
		super(`\`decimals\` must be a non-negative integer. Got \`${decimals}\`.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Value.InvalidDecimalsError"
		});
	}
};
// ../../node_modules/viem/_esm/utils/unit/formatEther.js
/**
* Converts numerical wei to a string representation of ether.
*
* - Docs: https://viem.sh/docs/utilities/formatEther
*
* @example
* import { formatEther } from 'viem'
*
* formatEther(1000000000000000000n)
* // '1'
*/
function formatEther(wei, unit = "wei") {
	return formatEther$1(wei, unit);
}
// ../../node_modules/viem/_esm/utils/unit/formatGwei.js
/**
* Converts numerical wei to a string representation of gwei.
*
* - Docs: https://viem.sh/docs/utilities/formatGwei
*
* @example
* import { formatGwei } from 'viem'
*
* formatGwei(1000000000n)
* // '1'
*/
function formatGwei(wei, unit = "wei") {
	return formatGwei$1(wei, unit);
}
// ../../node_modules/viem/_esm/errors/stateOverride.js
var AccountStateConflictError = class extends BaseError$2 {
	constructor({ address }) {
		super(`State for account "${address}" is set multiple times.`, { name: "AccountStateConflictError" });
	}
};
var StateAssignmentConflictError = class extends BaseError$2 {
	constructor() {
		super("state and stateDiff are set on the same account.", { name: "StateAssignmentConflictError" });
	}
};
/** @internal */
function prettyStateMapping(stateMapping) {
	return stateMapping.reduce((pretty, { slot, value }) => {
		return `${pretty}        ${slot}: ${value}\n`;
	}, "");
}
function prettyStateOverride(stateOverride) {
	return stateOverride.reduce((pretty, { address, ...state }) => {
		let val = `${pretty}    ${address}:\n`;
		if (state.nonce) val += `      nonce: ${state.nonce}\n`;
		if (state.balance) val += `      balance: ${state.balance}\n`;
		if (state.code) val += `      code: ${state.code}\n`;
		if (state.state) {
			val += "      state:\n";
			val += prettyStateMapping(state.state);
		}
		if (state.stateDiff) {
			val += "      stateDiff:\n";
			val += prettyStateMapping(state.stateDiff);
		}
		return val;
	}, "  State Override:\n").slice(0, -1);
}
// ../../node_modules/viem/_esm/errors/transaction.js
function prettyPrint$1(args) {
	const entries = Object.entries(args).map(([key, value]) => {
		if (value === void 0 || value === false) return null;
		return [key, value];
	}).filter(Boolean);
	const maxLength = entries.reduce((acc, [key]) => Math.max(acc, key.length), 0);
	return entries.map(([key, value]) => `  ${`${key}:`.padEnd(maxLength + 1)}  ${value}`).join("\n");
}
var FeePayerNonceMismatchError = class extends BaseError$2 {
	constructor({ filledNonce, requestedNonce }) {
		super("The filled transaction nonce does not match the requested nonce.", {
			metaMessages: [`Requested Nonce: ${requestedNonce}`, `Filled Nonce: ${filledNonce}`],
			name: "FeePayerNonceMismatchError"
		});
	}
};
var InvalidYParityError$1 = class extends BaseError$2 {
	constructor({ yParity }) {
		super(`Invalid \`yParity\` value "${yParity}". Expected 0 or 1.`, { name: "InvalidYParityError" });
	}
};
var InvalidSerializableTransactionError = class extends BaseError$2 {
	constructor({ transaction }) {
		super("Cannot infer a transaction type from provided transaction.", {
			metaMessages: [
				"Provided Transaction:",
				"{",
				prettyPrint$1(transaction),
				"}",
				"",
				"To infer the type, either provide:",
				"- a `type` to the Transaction, or",
				"- an EIP-1559 Transaction with `maxFeePerGas`, or",
				"- an EIP-2930 Transaction with `gasPrice` & `accessList`, or",
				"- an EIP-4844 Transaction with `blobs`, `blobVersionedHashes`, `sidecars`, or",
				"- an EIP-7702 Transaction with `authorizationList`, or",
				"- a Legacy Transaction with `gasPrice`"
			],
			name: "InvalidSerializableTransactionError"
		});
	}
};
var TransactionExecutionError = class extends BaseError$2 {
	constructor(cause, { account, docsPath, chain, data, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce, to, value }) {
		const prettyArgs = prettyPrint$1({
			chain: chain && `${chain?.name} (id: ${chain?.id})`,
			from: account?.address,
			to,
			value: typeof value !== "undefined" && `${formatEther(value)} ${chain?.nativeCurrency?.symbol || "ETH"}`,
			data,
			gas,
			gasPrice: typeof gasPrice !== "undefined" && `${formatGwei(gasPrice)} gwei`,
			maxFeePerGas: typeof maxFeePerGas !== "undefined" && `${formatGwei(maxFeePerGas)} gwei`,
			maxPriorityFeePerGas: typeof maxPriorityFeePerGas !== "undefined" && `${formatGwei(maxPriorityFeePerGas)} gwei`,
			nonce
		});
		super(cause.shortMessage, {
			cause,
			docsPath,
			metaMessages: [
				...cause.metaMessages ? [...cause.metaMessages, " "] : [],
				"Request Arguments:",
				prettyArgs
			].filter(Boolean),
			name: "TransactionExecutionError"
		});
		Object.defineProperty(this, "cause", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.cause = cause;
	}
};
var TransactionNotFoundError = class extends BaseError$2 {
	constructor({ blockHash, blockNumber, blockTag, hash, index }) {
		let identifier = "Transaction";
		if (blockTag && index !== void 0) identifier = `Transaction at block time "${blockTag}" at index "${index}"`;
		if (blockHash && index !== void 0) identifier = `Transaction at block hash "${blockHash}" at index "${index}"`;
		if (blockNumber && index !== void 0) identifier = `Transaction at block number "${blockNumber}" at index "${index}"`;
		if (hash) identifier = `Transaction with hash "${hash}"`;
		super(`${identifier} could not be found.`, { name: "TransactionNotFoundError" });
	}
};
var TransactionReceiptNotFoundError = class extends BaseError$2 {
	constructor({ hash }) {
		super(`Transaction receipt with hash "${hash}" could not be found. The Transaction may not be processed on a block yet.`, { name: "TransactionReceiptNotFoundError" });
	}
};
var TransactionReceiptRevertedError = class extends BaseError$2 {
	constructor({ receipt }) {
		super(`Transaction with hash "${receipt.transactionHash}" reverted.`, {
			metaMessages: [
				"The receipt marked the transaction as \"reverted\". This could mean that the function on the contract you are trying to call threw an error.",
				" ",
				"You can attempt to extract the revert reason by:",
				"- calling the `simulateContract` or `simulateCalls` Action with the `abi` and `functionName` of the contract",
				"- using the `call` Action with raw `data`"
			],
			name: "TransactionReceiptRevertedError"
		});
		Object.defineProperty(this, "receipt", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.receipt = receipt;
	}
};
var WaitForTransactionReceiptTimeoutError = class extends BaseError$2 {
	constructor({ hash }) {
		super(`Timed out while waiting for transaction with hash "${hash}" to be confirmed.`, { name: "WaitForTransactionReceiptTimeoutError" });
	}
};
// ../../node_modules/viem/_esm/errors/utils.js
var getContractAddress = (address) => address;
function getAbortError(signal) {
	if (signal?.reason) return signal.reason;
	if (typeof DOMException === "function") return new DOMException("This operation was aborted", "AbortError");
	const error = /* @__PURE__ */ new Error("This operation was aborted");
	error.name = "AbortError";
	return error;
}
function isAbortError(error) {
	return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}
/**
* Returns the URL with any embedded basic-auth credentials stripped, so
* error messages and logs don't leak secrets when an RPC URL like
* `https://user:pass@host` is used.
*/
var getUrl = (url) => {
	try {
		const parsed = new URL(url);
		if (!parsed.username && !parsed.password) return url;
		parsed.username = "";
		parsed.password = "";
		return parsed.toString();
	} catch {
		return url;
	}
};
// ../../node_modules/viem/_esm/errors/contract.js
var CallExecutionError = class extends BaseError$2 {
	constructor(cause, { account: account_, docsPath, chain, data, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce, to, value, stateOverride }) {
		let prettyArgs = prettyPrint$1({
			from: (account_ ? parseAccount(account_) : void 0)?.address,
			to,
			value: typeof value !== "undefined" && `${formatEther(value)} ${chain?.nativeCurrency?.symbol || "ETH"}`,
			data,
			gas,
			gasPrice: typeof gasPrice !== "undefined" && `${formatGwei(gasPrice)} gwei`,
			maxFeePerGas: typeof maxFeePerGas !== "undefined" && `${formatGwei(maxFeePerGas)} gwei`,
			maxPriorityFeePerGas: typeof maxPriorityFeePerGas !== "undefined" && `${formatGwei(maxPriorityFeePerGas)} gwei`,
			nonce
		});
		if (stateOverride) prettyArgs += `\n${prettyStateOverride(stateOverride)}`;
		super(cause.shortMessage, {
			cause,
			docsPath,
			metaMessages: [
				...cause.metaMessages ? [...cause.metaMessages, " "] : [],
				"Raw Call Arguments:",
				prettyArgs
			].filter(Boolean),
			name: "CallExecutionError"
		});
		Object.defineProperty(this, "cause", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.cause = cause;
	}
};
var ContractFunctionExecutionError = class extends BaseError$2 {
	constructor(cause, { abi, args, contractAddress, docsPath, functionName, sender }) {
		const abiItem = getAbiItem({
			abi,
			args,
			name: functionName
		});
		const formattedArgs = abiItem ? formatAbiItemWithArgs({
			abiItem,
			args,
			includeFunctionName: false,
			includeName: false
		}) : void 0;
		const functionWithParams = abiItem ? formatAbiItem(abiItem, { includeName: true }) : void 0;
		const prettyArgs = prettyPrint$1({
			address: contractAddress && getContractAddress(contractAddress),
			function: functionWithParams,
			args: formattedArgs && formattedArgs !== "()" && `${[...Array(functionName?.length ?? 0).keys()].map(() => " ").join("")}${formattedArgs}`,
			sender
		});
		super(cause.shortMessage || `An unknown error occurred while executing the contract function "${functionName}".`, {
			cause,
			docsPath,
			metaMessages: [
				...cause.metaMessages ? [...cause.metaMessages, " "] : [],
				prettyArgs && "Contract Call:",
				prettyArgs
			].filter(Boolean),
			name: "ContractFunctionExecutionError"
		});
		Object.defineProperty(this, "abi", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "args", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "cause", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "contractAddress", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "formattedArgs", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "functionName", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "sender", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.abi = abi;
		this.args = args;
		this.cause = cause;
		this.contractAddress = contractAddress;
		this.functionName = functionName;
		this.sender = sender;
	}
};
var ContractFunctionRevertedError = class extends BaseError$2 {
	constructor({ abi, data, functionName, message, cause: error }) {
		let cause;
		let decodedData;
		let metaMessages;
		let reason;
		if (data && data !== "0x") try {
			decodedData = decodeErrorResult({
				abi,
				data,
				cause: error
			});
			const { abiItem, errorName, args: errorArgs } = decodedData;
			if (errorName === "Error") reason = errorArgs[0];
			else if (errorName === "Panic") {
				const [firstArg] = errorArgs;
				reason = panicReasons[firstArg];
			} else {
				const errorWithParams = abiItem ? formatAbiItem(abiItem, { includeName: true }) : void 0;
				const formattedArgs = abiItem && errorArgs ? formatAbiItemWithArgs({
					abiItem,
					args: errorArgs,
					includeFunctionName: false,
					includeName: false
				}) : void 0;
				metaMessages = [errorWithParams ? `Error: ${errorWithParams}` : "", formattedArgs && formattedArgs !== "()" ? `       ${[...Array(errorName?.length ?? 0).keys()].map(() => " ").join("")}${formattedArgs}` : ""];
			}
		} catch (err) {
			cause = err;
		}
		else if (message) reason = message;
		let signature;
		if (cause instanceof AbiErrorSignatureNotFoundError) {
			signature = cause.signature;
			metaMessages = [
				`Unable to decode signature "${signature}" as it was not found on the provided ABI.`,
				"Make sure you are using the correct ABI and that the error exists on it.",
				`You can look up the decoded signature here: https://4byte.sourcify.dev/?q=${signature}.`
			];
		}
		super(reason && reason !== "execution reverted" || signature ? [`The contract function "${functionName}" reverted with the following ${signature ? "signature" : "reason"}:`, reason || signature].join("\n") : `The contract function "${functionName}" reverted.`, {
			cause: cause ?? error,
			metaMessages,
			name: "ContractFunctionRevertedError"
		});
		Object.defineProperty(this, "data", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "raw", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "reason", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "signature", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.data = decodedData;
		this.raw = data;
		this.reason = reason;
		this.signature = signature;
	}
};
var ContractFunctionZeroDataError = class extends BaseError$2 {
	constructor({ functionName, cause }) {
		super(`The contract function "${functionName}" returned no data ("0x").`, {
			metaMessages: [
				"This could be due to any of the following:",
				`  - The contract does not have the function "${functionName}",`,
				"  - The parameters passed to the contract function may be invalid, or",
				"  - The address is not a contract."
			],
			name: "ContractFunctionZeroDataError",
			cause
		});
	}
};
var CounterfactualDeploymentFailedError = class extends BaseError$2 {
	constructor({ factory }) {
		super(`Deployment for counterfactual contract call failed${factory ? ` for factory "${factory}".` : ""}`, {
			metaMessages: [
				"Please ensure:",
				"- The `factory` is a valid contract deployment factory (ie. Create2 Factory, ERC-4337 Factory, etc).",
				"- The `factoryData` is a valid encoded function call for contract deployment function on the factory."
			],
			name: "CounterfactualDeploymentFailedError"
		});
	}
};
var RawContractError = class extends BaseError$2 {
	constructor({ data, message }) {
		super(message || "", { name: "RawContractError" });
		Object.defineProperty(this, "code", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: 3
		});
		Object.defineProperty(this, "data", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.data = data;
	}
};
// ../../node_modules/viem/_esm/errors/request.js
var HttpRequestError = class extends BaseError$2 {
	constructor({ body, cause, details, headers, status, url }) {
		super("HTTP request failed.", {
			cause,
			details,
			metaMessages: [
				status && `Status: ${status}`,
				`URL: ${getUrl(url)}`,
				body && `Request body: ${stringify$1(body)}`
			].filter(Boolean),
			name: "HttpRequestError"
		});
		Object.defineProperty(this, "body", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "headers", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "status", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "url", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.body = body;
		this.headers = headers;
		this.status = status;
		this.url = url;
	}
};
var ResponseBodyTooLargeError = class extends BaseError$2 {
	constructor({ maxSize, size }) {
		super("HTTP response body exceeded the size limit.", {
			metaMessages: [`Max: ${maxSize} bytes`, `Received: ${size} bytes`],
			name: "ResponseBodyTooLargeError"
		});
		Object.defineProperty(this, "maxSize", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "size", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.maxSize = maxSize;
		this.size = size;
	}
};
var RpcRequestError = class extends BaseError$2 {
	constructor({ body, error, headers, status, url }) {
		super("RPC Request failed.", {
			cause: error,
			details: error.message,
			metaMessages: [
				status && `Status: ${status}`,
				`URL: ${getUrl(url)}`,
				`Request body: ${stringify$1(body)}`
			].filter(Boolean),
			name: "RpcRequestError"
		});
		Object.defineProperty(this, "code", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "data", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		/** Response headers, when the error came from a non-2xx HTTP response. */
		Object.defineProperty(this, "headers", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		/** Response status, when the error came from a non-2xx HTTP response. */
		Object.defineProperty(this, "status", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "url", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.code = error.code;
		this.data = error.data;
		this.headers = headers;
		this.status = status;
		this.url = url;
	}
};
var TimeoutError = class extends BaseError$2 {
	constructor({ body, url }) {
		super("The request took too long to respond.", {
			details: "The request timed out.",
			metaMessages: [`URL: ${getUrl(url)}`, `Request body: ${stringify$1(body)}`],
			name: "TimeoutError"
		});
		Object.defineProperty(this, "url", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.url = url;
	}
};
// ../../node_modules/viem/_esm/errors/rpc.js
var unknownErrorCode = -1;
var RpcError = class extends BaseError$2 {
	constructor(cause, { code, docsPath, metaMessages, name, shortMessage }) {
		super(shortMessage, {
			cause,
			docsPath,
			metaMessages: metaMessages || cause?.metaMessages,
			name: name || "RpcError"
		});
		Object.defineProperty(this, "code", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.name = name || cause.name;
		this.code = cause instanceof RpcRequestError ? cause.code : code ?? unknownErrorCode;
	}
};
var ProviderRpcError = class extends RpcError {
	constructor(cause, options) {
		super(cause, options);
		Object.defineProperty(this, "data", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.data = options.data;
	}
};
var ParseRpcError = class ParseRpcError extends RpcError {
	constructor(cause) {
		super(cause, {
			code: ParseRpcError.code,
			name: "ParseRpcError",
			shortMessage: "Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text."
		});
	}
};
Object.defineProperty(ParseRpcError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32700
});
var InvalidRequestRpcError = class InvalidRequestRpcError extends RpcError {
	constructor(cause) {
		super(cause, {
			code: InvalidRequestRpcError.code,
			name: "InvalidRequestRpcError",
			shortMessage: "JSON is not a valid request object."
		});
	}
};
Object.defineProperty(InvalidRequestRpcError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32600
});
var MethodNotFoundRpcError = class MethodNotFoundRpcError extends RpcError {
	constructor(cause, { method } = {}) {
		super(cause, {
			code: MethodNotFoundRpcError.code,
			name: "MethodNotFoundRpcError",
			shortMessage: `The method${method ? ` "${method}"` : ""} does not exist / is not available.`
		});
	}
};
Object.defineProperty(MethodNotFoundRpcError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32601
});
var InvalidParamsRpcError = class InvalidParamsRpcError extends RpcError {
	constructor(cause) {
		super(cause, {
			code: InvalidParamsRpcError.code,
			name: "InvalidParamsRpcError",
			shortMessage: ["Invalid parameters were provided to the RPC method.", "Double check you have provided the correct parameters."].join("\n")
		});
	}
};
Object.defineProperty(InvalidParamsRpcError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32602
});
var InternalRpcError = class InternalRpcError extends RpcError {
	constructor(cause) {
		super(cause, {
			code: InternalRpcError.code,
			name: "InternalRpcError",
			shortMessage: "An internal error was received."
		});
	}
};
Object.defineProperty(InternalRpcError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32603
});
var InvalidInputRpcError = class InvalidInputRpcError extends RpcError {
	constructor(cause) {
		super(cause, {
			code: InvalidInputRpcError.code,
			name: "InvalidInputRpcError",
			shortMessage: ["Missing or invalid parameters.", "Double check you have provided the correct parameters."].join("\n")
		});
	}
};
Object.defineProperty(InvalidInputRpcError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32e3
});
var ResourceNotFoundRpcError = class ResourceNotFoundRpcError extends RpcError {
	constructor(cause) {
		super(cause, {
			code: ResourceNotFoundRpcError.code,
			name: "ResourceNotFoundRpcError",
			shortMessage: "Requested resource not found."
		});
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "ResourceNotFoundRpcError"
		});
	}
};
Object.defineProperty(ResourceNotFoundRpcError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32001
});
var ResourceUnavailableRpcError = class ResourceUnavailableRpcError extends RpcError {
	constructor(cause) {
		super(cause, {
			code: ResourceUnavailableRpcError.code,
			name: "ResourceUnavailableRpcError",
			shortMessage: "Requested resource not available."
		});
	}
};
Object.defineProperty(ResourceUnavailableRpcError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32002
});
var TransactionRejectedRpcError = class TransactionRejectedRpcError extends RpcError {
	constructor(cause) {
		super(cause, {
			code: TransactionRejectedRpcError.code,
			name: "TransactionRejectedRpcError",
			shortMessage: "Transaction creation failed."
		});
	}
};
Object.defineProperty(TransactionRejectedRpcError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32003
});
var MethodNotSupportedRpcError = class MethodNotSupportedRpcError extends RpcError {
	constructor(cause, { method } = {}) {
		super(cause, {
			code: MethodNotSupportedRpcError.code,
			name: "MethodNotSupportedRpcError",
			shortMessage: `Method${method ? ` "${method}"` : ""} is not supported.`
		});
	}
};
Object.defineProperty(MethodNotSupportedRpcError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32004
});
var LimitExceededRpcError = class LimitExceededRpcError extends RpcError {
	constructor(cause) {
		super(cause, {
			code: LimitExceededRpcError.code,
			name: "LimitExceededRpcError",
			shortMessage: "Request exceeds defined limit."
		});
	}
};
Object.defineProperty(LimitExceededRpcError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32005
});
var JsonRpcVersionUnsupportedError = class JsonRpcVersionUnsupportedError extends RpcError {
	constructor(cause) {
		super(cause, {
			code: JsonRpcVersionUnsupportedError.code,
			name: "JsonRpcVersionUnsupportedError",
			shortMessage: "Version of JSON-RPC protocol is not supported."
		});
	}
};
Object.defineProperty(JsonRpcVersionUnsupportedError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: -32006
});
var UserRejectedRequestError = class UserRejectedRequestError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: UserRejectedRequestError.code,
			name: "UserRejectedRequestError",
			shortMessage: "User rejected the request."
		});
	}
};
Object.defineProperty(UserRejectedRequestError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 4001
});
var UnauthorizedProviderError = class UnauthorizedProviderError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: UnauthorizedProviderError.code,
			name: "UnauthorizedProviderError",
			shortMessage: "The requested method and/or account has not been authorized by the user."
		});
	}
};
Object.defineProperty(UnauthorizedProviderError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 4100
});
var UnsupportedProviderMethodError = class UnsupportedProviderMethodError extends ProviderRpcError {
	constructor(cause, { method } = {}) {
		super(cause, {
			code: UnsupportedProviderMethodError.code,
			name: "UnsupportedProviderMethodError",
			shortMessage: `The Provider does not support the requested method${method ? ` " ${method}"` : ""}.`
		});
	}
};
Object.defineProperty(UnsupportedProviderMethodError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 4200
});
var ProviderDisconnectedError = class ProviderDisconnectedError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: ProviderDisconnectedError.code,
			name: "ProviderDisconnectedError",
			shortMessage: "The Provider is disconnected from all chains."
		});
	}
};
Object.defineProperty(ProviderDisconnectedError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 4900
});
var ChainDisconnectedError = class ChainDisconnectedError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: ChainDisconnectedError.code,
			name: "ChainDisconnectedError",
			shortMessage: "The Provider is not connected to the requested chain."
		});
	}
};
Object.defineProperty(ChainDisconnectedError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 4901
});
var SwitchChainError = class SwitchChainError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: SwitchChainError.code,
			name: "SwitchChainError",
			shortMessage: "An error occurred when attempting to switch chain."
		});
	}
};
Object.defineProperty(SwitchChainError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 4902
});
var UnsupportedNonOptionalCapabilityError = class UnsupportedNonOptionalCapabilityError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: UnsupportedNonOptionalCapabilityError.code,
			name: "UnsupportedNonOptionalCapabilityError",
			shortMessage: "This Wallet does not support a capability that was not marked as optional."
		});
	}
};
Object.defineProperty(UnsupportedNonOptionalCapabilityError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 5700
});
var UnsupportedChainIdError = class UnsupportedChainIdError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: UnsupportedChainIdError.code,
			name: "UnsupportedChainIdError",
			shortMessage: "This Wallet does not support the requested chain ID."
		});
	}
};
Object.defineProperty(UnsupportedChainIdError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 5710
});
var DuplicateIdError = class DuplicateIdError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: DuplicateIdError.code,
			name: "DuplicateIdError",
			shortMessage: "There is already a bundle submitted with this ID."
		});
	}
};
Object.defineProperty(DuplicateIdError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 5720
});
var UnknownBundleIdError = class UnknownBundleIdError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: UnknownBundleIdError.code,
			name: "UnknownBundleIdError",
			shortMessage: "This bundle id is unknown / has not been submitted"
		});
	}
};
Object.defineProperty(UnknownBundleIdError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 5730
});
var BundleTooLargeError = class BundleTooLargeError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: BundleTooLargeError.code,
			name: "BundleTooLargeError",
			shortMessage: "The call bundle is too large for the Wallet to process."
		});
	}
};
Object.defineProperty(BundleTooLargeError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 5740
});
var AtomicReadyWalletRejectedUpgradeError = class AtomicReadyWalletRejectedUpgradeError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: AtomicReadyWalletRejectedUpgradeError.code,
			name: "AtomicReadyWalletRejectedUpgradeError",
			shortMessage: "The Wallet can support atomicity after an upgrade, but the user rejected the upgrade."
		});
	}
};
Object.defineProperty(AtomicReadyWalletRejectedUpgradeError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 5750
});
var AtomicityNotSupportedError = class AtomicityNotSupportedError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: AtomicityNotSupportedError.code,
			name: "AtomicityNotSupportedError",
			shortMessage: "The wallet does not support atomic execution but the request requires it."
		});
	}
};
Object.defineProperty(AtomicityNotSupportedError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 5760
});
var WalletConnectSessionSettlementError = class WalletConnectSessionSettlementError extends ProviderRpcError {
	constructor(cause) {
		super(cause, {
			code: WalletConnectSessionSettlementError.code,
			name: "WalletConnectSessionSettlementError",
			shortMessage: "WalletConnect session settlement failed."
		});
	}
};
Object.defineProperty(WalletConnectSessionSettlementError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 7e3
});
var UnknownRpcError = class extends RpcError {
	constructor(cause) {
		super(cause, {
			name: "UnknownRpcError",
			shortMessage: "An unknown RPC error occurred."
		});
	}
};
// ../../node_modules/viem/_esm/utils/errors/getContractError.js
var EXECUTION_REVERTED_ERROR_CODE = 3;
function getContractError(err, { abi, address, args, docsPath, functionName, sender }) {
	const error = err instanceof RawContractError ? err : err instanceof BaseError$2 ? err.walk((err) => typeof err === "object" && err !== null && "data" in err) || err.walk() : {};
	const { code, data, details, message, shortMessage } = error;
	return new ContractFunctionExecutionError((() => {
		if (err instanceof AbiDecodingZeroDataError) return new ContractFunctionZeroDataError({
			functionName,
			cause: err
		});
		if ([EXECUTION_REVERTED_ERROR_CODE, InternalRpcError.code].includes(code) && (data || details || message || shortMessage) || code === InvalidInputRpcError.code && details === "execution reverted" && data) return new ContractFunctionRevertedError({
			abi,
			data: typeof data === "object" ? data.data : data,
			functionName,
			message: error instanceof RpcRequestError ? details : shortMessage ?? message,
			cause: err
		});
		return err;
	})(), {
		abi,
		args,
		contractAddress: address,
		docsPath,
		functionName,
		sender
	});
}
// ../../node_modules/viem/_esm/accounts/utils/publicKeyToAddress.js
/**
* @description Converts an ECDSA public key to an address.
*
* @param publicKey The public key to convert.
*
* @returns The address.
*/
function publicKeyToAddress(publicKey) {
	const address = keccak256$1(`0x${publicKey.substring(4)}`).substring(26);
	return checksumAddress(`0x${address}`);
}
// ../../node_modules/viem/_esm/utils/signature/recoverPublicKey.js
async function recoverPublicKey({ hash, signature }) {
	const hashHex = isHex(hash) ? hash : toHex(hash);
	const { secp256k1 } = await Promise.resolve().then(() => secp256k1_exports);
	return `0x${(() => {
		if (typeof signature === "object" && "r" in signature && "s" in signature) {
			const { r, s, v, yParity } = signature;
			const recoveryBit = toRecoveryBit(Number(yParity ?? v));
			return new secp256k1.Signature(hexToBigInt(r), hexToBigInt(s)).addRecoveryBit(recoveryBit);
		}
		const signatureHex = isHex(signature) ? signature : toHex(signature);
		if (size$3(signatureHex) !== 65) throw new Error("invalid signature length");
		const recoveryBit = toRecoveryBit(hexToNumber$1(`0x${signatureHex.slice(130)}`));
		return secp256k1.Signature.fromCompact(signatureHex.substring(2, 130)).addRecoveryBit(recoveryBit);
	})().recoverPublicKey(hashHex.substring(2)).toHex(false)}`;
}
function toRecoveryBit(yParityOrV) {
	if (yParityOrV === 0 || yParityOrV === 1) return yParityOrV;
	if (yParityOrV === 27) return 0;
	if (yParityOrV === 28) return 1;
	throw new Error("Invalid yParityOrV value");
}
// ../../node_modules/viem/_esm/utils/signature/recoverAddress.js
async function recoverAddress({ hash, signature }) {
	return publicKeyToAddress(await recoverPublicKey({
		hash,
		signature
	}));
}
// ../../node_modules/viem/_esm/utils/encoding/toRlp.js
function toRlp(bytes, to = "hex") {
	const encodable = getEncodable(bytes);
	const cursor = createCursor(new Uint8Array(encodable.length));
	encodable.encode(cursor);
	if (to === "hex") return bytesToHex$1(cursor.bytes);
	return cursor.bytes;
}
function getEncodable(bytes) {
	if (Array.isArray(bytes)) return getEncodableList(bytes.map((x) => getEncodable(x)));
	return getEncodableBytes(bytes);
}
function getEncodableList(list) {
	const bodyLength = list.reduce((acc, x) => acc + x.length, 0);
	const sizeOfBodyLength = getSizeOfLength(bodyLength);
	return {
		length: (() => {
			if (bodyLength <= 55) return 1 + bodyLength;
			return 1 + sizeOfBodyLength + bodyLength;
		})(),
		encode(cursor) {
			if (bodyLength <= 55) cursor.pushByte(192 + bodyLength);
			else {
				cursor.pushByte(247 + sizeOfBodyLength);
				if (sizeOfBodyLength === 1) cursor.pushUint8(bodyLength);
				else if (sizeOfBodyLength === 2) cursor.pushUint16(bodyLength);
				else if (sizeOfBodyLength === 3) cursor.pushUint24(bodyLength);
				else cursor.pushUint32(bodyLength);
			}
			for (const { encode } of list) encode(cursor);
		}
	};
}
function getEncodableBytes(bytesOrHex) {
	const bytes = typeof bytesOrHex === "string" ? hexToBytes$1(bytesOrHex) : bytesOrHex;
	const sizeOfBytesLength = getSizeOfLength(bytes.length);
	return {
		length: (() => {
			if (bytes.length === 1 && bytes[0] < 128) return 1;
			if (bytes.length <= 55) return 1 + bytes.length;
			return 1 + sizeOfBytesLength + bytes.length;
		})(),
		encode(cursor) {
			if (bytes.length === 1 && bytes[0] < 128) cursor.pushBytes(bytes);
			else if (bytes.length <= 55) {
				cursor.pushByte(128 + bytes.length);
				cursor.pushBytes(bytes);
			} else {
				cursor.pushByte(183 + sizeOfBytesLength);
				if (sizeOfBytesLength === 1) cursor.pushUint8(bytes.length);
				else if (sizeOfBytesLength === 2) cursor.pushUint16(bytes.length);
				else if (sizeOfBytesLength === 3) cursor.pushUint24(bytes.length);
				else cursor.pushUint32(bytes.length);
				cursor.pushBytes(bytes);
			}
		}
	};
}
function getSizeOfLength(length) {
	if (length < 256) return 1;
	if (length < 2 ** 16) return 2;
	if (length < 2 ** 24) return 3;
	if (length < 2 ** 32) return 4;
	throw new BaseError$2("Length is too large.");
}
// ../../node_modules/viem/_esm/utils/authorization/hashAuthorization.js
/**
* Computes an Authorization hash in [EIP-7702 format](https://eips.ethereum.org/EIPS/eip-7702): `keccak256('0x05' || rlp([chain_id, address, nonce]))`.
*/
function hashAuthorization(parameters) {
	const { chainId, nonce, to } = parameters;
	const address = parameters.contractAddress ?? parameters.address;
	const hash = keccak256$1(concatHex(["0x05", toRlp([
		chainId ? numberToHex(chainId) : "0x",
		address,
		nonce ? numberToHex(nonce) : "0x"
	])]));
	if (to === "bytes") return hexToBytes$1(hash);
	return hash;
}
// ../../node_modules/viem/_esm/utils/authorization/recoverAuthorizationAddress.js
async function recoverAuthorizationAddress(parameters) {
	const { authorization } = parameters;
	const signature = parameters.signature ?? authorization;
	if (typeof signature === "object" && typeof signature.yParity === "number" && signature.yParity !== 0 && signature.yParity !== 1) throw new InvalidYParityError$1({ yParity: BigInt(signature.yParity) });
	return recoverAddress({
		hash: hashAuthorization(authorization),
		signature
	});
}
// ../../node_modules/viem/_esm/errors/estimateGas.js
var EstimateGasExecutionError = class extends BaseError$2 {
	constructor(cause, { account, docsPath, chain, data, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce, to, value }) {
		const prettyArgs = prettyPrint$1({
			from: account?.address,
			to,
			value: typeof value !== "undefined" && `${formatEther(value)} ${chain?.nativeCurrency?.symbol || "ETH"}`,
			data,
			gas,
			gasPrice: typeof gasPrice !== "undefined" && `${formatGwei(gasPrice)} gwei`,
			maxFeePerGas: typeof maxFeePerGas !== "undefined" && `${formatGwei(maxFeePerGas)} gwei`,
			maxPriorityFeePerGas: typeof maxPriorityFeePerGas !== "undefined" && `${formatGwei(maxPriorityFeePerGas)} gwei`,
			nonce
		});
		super(cause.shortMessage, {
			cause,
			docsPath,
			metaMessages: [
				...cause.metaMessages ? [...cause.metaMessages, " "] : [],
				"Estimate Gas Arguments:",
				prettyArgs
			].filter(Boolean),
			name: "EstimateGasExecutionError"
		});
		Object.defineProperty(this, "cause", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.cause = cause;
	}
};
// ../../node_modules/viem/_esm/errors/node.js
var ExecutionRevertedError = class extends BaseError$2 {
	constructor({ cause, message } = {}) {
		const reason = message?.replace("execution reverted: ", "")?.replace("execution reverted", "");
		super(`Execution reverted ${reason ? `with reason: ${reason}` : "for an unknown reason"}.`, {
			cause,
			name: "ExecutionRevertedError"
		});
	}
};
Object.defineProperty(ExecutionRevertedError, "code", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: 3
});
Object.defineProperty(ExecutionRevertedError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /execution reverted|gas required exceeds allowance/
});
var FeeCapTooHighError = class extends BaseError$2 {
	constructor({ cause, maxFeePerGas } = {}) {
		super(`The fee cap (\`maxFeePerGas\`${typeof maxFeePerGas === "bigint" ? ` = ${formatGwei(maxFeePerGas)} gwei` : ""}) cannot be higher than the maximum allowed value (2^256-1).`, {
			cause,
			name: "FeeCapTooHighError"
		});
	}
};
Object.defineProperty(FeeCapTooHighError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /max fee per gas higher than 2\^256-1|fee cap higher than 2\^256-1/
});
var FeeCapTooLowError = class extends BaseError$2 {
	constructor({ cause, maxFeePerGas } = {}) {
		super(`The fee cap (\`maxFeePerGas\`${typeof maxFeePerGas === "bigint" ? ` = ${formatGwei(maxFeePerGas)} gwei` : ""}) cannot be lower than the block base fee.`, {
			cause,
			name: "FeeCapTooLowError"
		});
	}
};
Object.defineProperty(FeeCapTooLowError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /max fee per gas less than block base fee|fee cap less than block base fee|transaction is outdated/
});
var NonceTooHighError = class extends BaseError$2 {
	constructor({ cause, nonce } = {}) {
		super(`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}is higher than the next one expected.`, {
			cause,
			name: "NonceTooHighError"
		});
	}
};
Object.defineProperty(NonceTooHighError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /nonce too high/
});
var NonceTooLowError = class extends BaseError$2 {
	constructor({ cause, nonce } = {}) {
		super([`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}is lower than the current nonce of the account.`, "Try increasing the nonce or find the latest nonce with `getTransactionCount`."].join("\n"), {
			cause,
			name: "NonceTooLowError"
		});
	}
};
Object.defineProperty(NonceTooLowError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /nonce too low|transaction already imported|already known/
});
var NonceMaxValueError = class extends BaseError$2 {
	constructor({ cause, nonce } = {}) {
		super(`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}exceeds the maximum allowed nonce.`, {
			cause,
			name: "NonceMaxValueError"
		});
	}
};
Object.defineProperty(NonceMaxValueError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /nonce has max value/
});
var InsufficientFundsError = class extends BaseError$2 {
	constructor({ cause } = {}) {
		super(["The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account."].join("\n"), {
			cause,
			metaMessages: [
				"This error could arise when the account does not have enough funds to:",
				" - pay for the total gas fee,",
				" - pay for the value to send.",
				" ",
				"The cost of the transaction is calculated as `gas * gas fee + value`, where:",
				" - `gas` is the amount of gas needed for transaction to execute,",
				" - `gas fee` is the gas fee,",
				" - `value` is the amount of ether to send to the recipient."
			],
			name: "InsufficientFundsError"
		});
	}
};
Object.defineProperty(InsufficientFundsError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /insufficient funds|exceeds transaction sender account balance|outoffunds/
});
var IntrinsicGasTooHighError = class extends BaseError$2 {
	constructor({ cause, gas } = {}) {
		super(`The amount of gas ${gas ? `(${gas}) ` : ""}provided for the transaction exceeds the limit allowed for the block.`, {
			cause,
			name: "IntrinsicGasTooHighError"
		});
	}
};
Object.defineProperty(IntrinsicGasTooHighError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /intrinsic gas too high|gas limit reached/
});
var IntrinsicGasTooLowError = class extends BaseError$2 {
	constructor({ cause, gas } = {}) {
		super(`The amount of gas ${gas ? `(${gas}) ` : ""}provided for the transaction is too low.`, {
			cause,
			name: "IntrinsicGasTooLowError"
		});
	}
};
Object.defineProperty(IntrinsicGasTooLowError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /intrinsic gas too low/
});
var TransactionTypeNotSupportedError = class extends BaseError$2 {
	constructor({ cause }) {
		super("The transaction type is not supported for this chain.", {
			cause,
			name: "TransactionTypeNotSupportedError"
		});
	}
};
Object.defineProperty(TransactionTypeNotSupportedError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /transaction type not valid/
});
var TipAboveFeeCapError = class extends BaseError$2 {
	constructor({ cause, maxPriorityFeePerGas, maxFeePerGas } = {}) {
		super([`The provided tip (\`maxPriorityFeePerGas\`${typeof maxPriorityFeePerGas === "bigint" ? ` = ${formatGwei(maxPriorityFeePerGas)} gwei` : ""}) cannot be higher than the fee cap (\`maxFeePerGas\`${typeof maxFeePerGas === "bigint" ? ` = ${formatGwei(maxFeePerGas)} gwei` : ""}).`].join("\n"), {
			cause,
			name: "TipAboveFeeCapError"
		});
	}
};
Object.defineProperty(TipAboveFeeCapError, "nodeMessage", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: /max priority fee per gas higher than max fee per gas|tip higher than fee cap/
});
var UnknownNodeError = class extends BaseError$2 {
	constructor({ cause }) {
		super(`An error occurred while executing: ${cause?.shortMessage}`, {
			cause,
			name: "UnknownNodeError"
		});
	}
};
// ../../node_modules/viem/_esm/utils/errors/getNodeError.js
function getNodeError(err, args) {
	const message = (err.details || "").toLowerCase();
	const executionRevertedError = err instanceof BaseError$2 ? err.walk((e) => e?.code === ExecutionRevertedError.code) : err;
	if (executionRevertedError instanceof BaseError$2) return new ExecutionRevertedError({
		cause: err,
		message: executionRevertedError.details
	});
	if (ExecutionRevertedError.nodeMessage.test(message)) return new ExecutionRevertedError({
		cause: err,
		message: err.details
	});
	if (FeeCapTooHighError.nodeMessage.test(message)) return new FeeCapTooHighError({
		cause: err,
		maxFeePerGas: args?.maxFeePerGas
	});
	if (FeeCapTooLowError.nodeMessage.test(message)) return new FeeCapTooLowError({
		cause: err,
		maxFeePerGas: args?.maxFeePerGas
	});
	if (NonceTooHighError.nodeMessage.test(message)) return new NonceTooHighError({
		cause: err,
		nonce: args?.nonce
	});
	if (NonceTooLowError.nodeMessage.test(message)) return new NonceTooLowError({
		cause: err,
		nonce: args?.nonce
	});
	if (NonceMaxValueError.nodeMessage.test(message)) return new NonceMaxValueError({
		cause: err,
		nonce: args?.nonce
	});
	if (InsufficientFundsError.nodeMessage.test(message)) return new InsufficientFundsError({ cause: err });
	if (IntrinsicGasTooHighError.nodeMessage.test(message)) return new IntrinsicGasTooHighError({
		cause: err,
		gas: args?.gas
	});
	if (IntrinsicGasTooLowError.nodeMessage.test(message)) return new IntrinsicGasTooLowError({
		cause: err,
		gas: args?.gas
	});
	if (TransactionTypeNotSupportedError.nodeMessage.test(message)) return new TransactionTypeNotSupportedError({ cause: err });
	if (TipAboveFeeCapError.nodeMessage.test(message)) return new TipAboveFeeCapError({
		cause: err,
		maxFeePerGas: args?.maxFeePerGas,
		maxPriorityFeePerGas: args?.maxPriorityFeePerGas
	});
	return new UnknownNodeError({ cause: err });
}
// ../../node_modules/viem/_esm/utils/errors/getEstimateGasError.js
function getEstimateGasError(err, { docsPath, ...args }) {
	return new EstimateGasExecutionError((() => {
		const cause = getNodeError(err, args);
		if (cause instanceof UnknownNodeError) return err;
		return cause;
	})(), {
		docsPath,
		...args
	});
}
// ../../node_modules/viem/_esm/utils/formatters/extract.js
/**
* @description Picks out the keys from `value` that exist in the formatter..
*/
function extract(value_, { format }) {
	if (!format) return {};
	const value = {};
	function extract_(formatted) {
		const keys = Object.keys(formatted);
		for (const key of keys) {
			if (key in value_) value[key] = value_[key];
			if (formatted[key] && typeof formatted[key] === "object" && !Array.isArray(formatted[key])) extract_(formatted[key]);
		}
	}
	extract_(format(value_ || {}));
	return value;
}
// ../../node_modules/viem/_esm/utils/formatters/transactionRequest.js
var rpcTransactionType = {
	legacy: "0x0",
	eip2930: "0x1",
	eip1559: "0x2",
	eip4844: "0x3",
	eip7702: "0x4"
};
function formatTransactionRequest(request, _) {
	const rpcRequest = {};
	if (typeof request.authorizationList !== "undefined") rpcRequest.authorizationList = formatAuthorizationList$1(request.authorizationList);
	if (typeof request.accessList !== "undefined") rpcRequest.accessList = request.accessList;
	if (typeof request.blobVersionedHashes !== "undefined") rpcRequest.blobVersionedHashes = request.blobVersionedHashes;
	if (typeof request.blobs !== "undefined") {
		if (typeof request.blobs[0] !== "string") rpcRequest.blobs = request.blobs.map((x) => bytesToHex$1(x));
		else rpcRequest.blobs = request.blobs;
	}
	if (typeof request.data !== "undefined") rpcRequest.data = request.data;
	if (request.account) rpcRequest.from = request.account.address;
	if (typeof request.from !== "undefined") rpcRequest.from = request.from;
	if (typeof request.gas !== "undefined") rpcRequest.gas = numberToHex(request.gas);
	if (typeof request.gasPrice !== "undefined") rpcRequest.gasPrice = numberToHex(request.gasPrice);
	if (typeof request.maxFeePerBlobGas !== "undefined") rpcRequest.maxFeePerBlobGas = numberToHex(request.maxFeePerBlobGas);
	if (typeof request.maxFeePerGas !== "undefined") rpcRequest.maxFeePerGas = numberToHex(request.maxFeePerGas);
	if (typeof request.maxPriorityFeePerGas !== "undefined") rpcRequest.maxPriorityFeePerGas = numberToHex(request.maxPriorityFeePerGas);
	if (typeof request.nonce !== "undefined") rpcRequest.nonce = numberToHex(request.nonce);
	if (typeof request.to !== "undefined") rpcRequest.to = request.to;
	if (typeof request.type !== "undefined") rpcRequest.type = rpcTransactionType[request.type];
	if (typeof request.value !== "undefined") rpcRequest.value = numberToHex(request.value);
	return rpcRequest;
}
function formatAuthorizationList$1(authorizationList) {
	return authorizationList.map((authorization) => ({
		address: authorization.address,
		r: authorization.r ? numberToHex(BigInt(authorization.r)) : authorization.r,
		s: authorization.s ? numberToHex(BigInt(authorization.s)) : authorization.s,
		chainId: numberToHex(authorization.chainId),
		nonce: numberToHex(authorization.nonce),
		...typeof authorization.yParity !== "undefined" ? { yParity: numberToHex(authorization.yParity) } : {},
		...typeof authorization.v !== "undefined" && typeof authorization.yParity === "undefined" ? { v: numberToHex(authorization.v) } : {}
	}));
}
// ../../node_modules/viem/_esm/utils/stateOverride.js
/** @internal */
function serializeStateMapping(stateMapping) {
	if (!stateMapping || stateMapping.length === 0) return void 0;
	return stateMapping.reduce((acc, { slot, value }) => {
		if (slot.length !== 66) throw new InvalidBytesLengthError({
			size: slot.length,
			targetSize: 66,
			type: "hex"
		});
		if (value.length !== 66) throw new InvalidBytesLengthError({
			size: value.length,
			targetSize: 66,
			type: "hex"
		});
		acc[slot] = value;
		return acc;
	}, {});
}
/** @internal */
function serializeAccountStateOverride(parameters) {
	const { balance, nonce, state, stateDiff, code } = parameters;
	const rpcAccountStateOverride = {};
	if (code !== void 0) rpcAccountStateOverride.code = code;
	if (balance !== void 0) rpcAccountStateOverride.balance = numberToHex(balance);
	if (nonce !== void 0) rpcAccountStateOverride.nonce = numberToHex(nonce);
	if (state !== void 0) rpcAccountStateOverride.state = serializeStateMapping(state);
	if (stateDiff !== void 0) {
		if (rpcAccountStateOverride.state) throw new StateAssignmentConflictError();
		rpcAccountStateOverride.stateDiff = serializeStateMapping(stateDiff);
	}
	return rpcAccountStateOverride;
}
/** @internal */
function serializeStateOverride(parameters) {
	if (!parameters) return void 0;
	const rpcStateOverride = {};
	for (const { address, ...accountState } of parameters) {
		if (!isAddress(address, { strict: false })) throw new InvalidAddressError$1({ address });
		if (rpcStateOverride[address]) throw new AccountStateConflictError({ address });
		rpcStateOverride[address] = serializeAccountStateOverride(accountState);
	}
	return rpcStateOverride;
}
2n ** (8n - 1n) - 1n;
2n ** (16n - 1n) - 1n;
2n ** (24n - 1n) - 1n;
2n ** (32n - 1n) - 1n;
2n ** (40n - 1n) - 1n;
2n ** (48n - 1n) - 1n;
2n ** (56n - 1n) - 1n;
2n ** (64n - 1n) - 1n;
2n ** (72n - 1n) - 1n;
2n ** (80n - 1n) - 1n;
2n ** (88n - 1n) - 1n;
2n ** (96n - 1n) - 1n;
2n ** (104n - 1n) - 1n;
2n ** (112n - 1n) - 1n;
2n ** (120n - 1n) - 1n;
2n ** (128n - 1n) - 1n;
2n ** (136n - 1n) - 1n;
2n ** (144n - 1n) - 1n;
2n ** (152n - 1n) - 1n;
2n ** (160n - 1n) - 1n;
2n ** (168n - 1n) - 1n;
2n ** (176n - 1n) - 1n;
2n ** (184n - 1n) - 1n;
2n ** (192n - 1n) - 1n;
2n ** (200n - 1n) - 1n;
2n ** (208n - 1n) - 1n;
2n ** (216n - 1n) - 1n;
2n ** (224n - 1n) - 1n;
2n ** (232n - 1n) - 1n;
2n ** (240n - 1n) - 1n;
2n ** (248n - 1n) - 1n;
2n ** (256n - 1n) - 1n;
-(2n ** (8n - 1n));
-(2n ** (16n - 1n));
-(2n ** (24n - 1n));
-(2n ** (32n - 1n));
-(2n ** (40n - 1n));
-(2n ** (48n - 1n));
-(2n ** (56n - 1n));
-(2n ** (64n - 1n));
-(2n ** (72n - 1n));
-(2n ** (80n - 1n));
-(2n ** (88n - 1n));
-(2n ** (96n - 1n));
-(2n ** (104n - 1n));
-(2n ** (112n - 1n));
-(2n ** (120n - 1n));
-(2n ** (128n - 1n));
-(2n ** (136n - 1n));
-(2n ** (144n - 1n));
-(2n ** (152n - 1n));
-(2n ** (160n - 1n));
-(2n ** (168n - 1n));
-(2n ** (176n - 1n));
-(2n ** (184n - 1n));
-(2n ** (192n - 1n));
-(2n ** (200n - 1n));
-(2n ** (208n - 1n));
-(2n ** (216n - 1n));
-(2n ** (224n - 1n));
-(2n ** (232n - 1n));
-(2n ** (240n - 1n));
-(2n ** (248n - 1n));
-(2n ** (256n - 1n));
var maxUint256$1 = 2n ** 256n - 1n;
// ../../node_modules/viem/_esm/utils/transaction/assertRequest.js
function assertRequest(args) {
	const { account: account_, maxFeePerGas, maxPriorityFeePerGas, to } = args;
	const account = account_ ? parseAccount(account_) : void 0;
	if (account && !isAddress(account.address)) throw new InvalidAddressError$1({ address: account.address });
	if (to && !isAddress(to)) throw new InvalidAddressError$1({ address: to });
	if (maxFeePerGas && maxFeePerGas > maxUint256$1) throw new FeeCapTooHighError({ maxFeePerGas });
	if (typeof maxPriorityFeePerGas === "bigint" && typeof maxFeePerGas === "bigint" && maxPriorityFeePerGas > maxFeePerGas) throw new TipAboveFeeCapError({
		maxFeePerGas,
		maxPriorityFeePerGas
	});
}
// ../../node_modules/viem/_esm/errors/fee.js
var BaseFeeScalarError = class extends BaseError$2 {
	constructor() {
		super("`baseFeeMultiplier` must be greater than 1.", { name: "BaseFeeScalarError" });
	}
};
var Eip1559FeesNotSupportedError = class extends BaseError$2 {
	constructor() {
		super("Chain does not support EIP-1559 fees.", { name: "Eip1559FeesNotSupportedError" });
	}
};
var MaxFeePerGasTooLowError = class extends BaseError$2 {
	constructor({ maxPriorityFeePerGas }) {
		super(`\`maxFeePerGas\` cannot be less than the \`maxPriorityFeePerGas\` (${formatGwei(maxPriorityFeePerGas)} gwei).`, { name: "MaxFeePerGasTooLowError" });
	}
};
// ../../node_modules/viem/_esm/errors/block.js
var BlockNotFoundError = class extends BaseError$2 {
	constructor({ blockHash, blockNumber }) {
		let identifier = "Block";
		if (blockHash) identifier = `Block at hash "${blockHash}"`;
		if (blockNumber) identifier = `Block at number "${blockNumber}"`;
		super(`${identifier} could not be found.`, { name: "BlockNotFoundError" });
	}
};
// ../../node_modules/viem/_esm/utils/formatters/transaction.js
var transactionType = {
	"0x0": "legacy",
	"0x1": "eip2930",
	"0x2": "eip1559",
	"0x3": "eip4844",
	"0x4": "eip7702"
};
function formatTransaction(transaction, _) {
	const transaction_ = {
		...transaction,
		blockHash: transaction.blockHash ? transaction.blockHash : null,
		blockNumber: transaction.blockNumber ? BigInt(transaction.blockNumber) : null,
		...transaction.blockTimestamp != null && { blockTimestamp: BigInt(transaction.blockTimestamp) },
		chainId: transaction.chainId ? hexToNumber$1(transaction.chainId) : void 0,
		gas: transaction.gas ? BigInt(transaction.gas) : void 0,
		gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice) : void 0,
		maxFeePerBlobGas: transaction.maxFeePerBlobGas ? BigInt(transaction.maxFeePerBlobGas) : void 0,
		maxFeePerGas: transaction.maxFeePerGas ? BigInt(transaction.maxFeePerGas) : void 0,
		maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ? BigInt(transaction.maxPriorityFeePerGas) : void 0,
		nonce: transaction.nonce ? hexToNumber$1(transaction.nonce) : void 0,
		to: transaction.to ? transaction.to : null,
		transactionIndex: transaction.transactionIndex ? Number(transaction.transactionIndex) : null,
		type: transaction.type ? transactionType[transaction.type] : void 0,
		typeHex: transaction.type ? transaction.type : void 0,
		value: transaction.value ? BigInt(transaction.value) : void 0,
		v: transaction.v ? BigInt(transaction.v) : void 0
	};
	if (transaction.authorizationList) transaction_.authorizationList = formatAuthorizationList(transaction.authorizationList);
	transaction_.yParity = (() => {
		if (transaction.yParity) return Number(transaction.yParity);
		if (typeof transaction_.v === "bigint") {
			if (transaction_.v === 0n || transaction_.v === 27n) return 0;
			if (transaction_.v === 1n || transaction_.v === 28n) return 1;
			if (transaction_.v >= 35n) return transaction_.v % 2n === 0n ? 1 : 0;
		}
	})();
	if (transaction_.type === "legacy") {
		delete transaction_.accessList;
		delete transaction_.maxFeePerBlobGas;
		delete transaction_.maxFeePerGas;
		delete transaction_.maxPriorityFeePerGas;
		delete transaction_.yParity;
	}
	if (transaction_.type === "eip2930") {
		delete transaction_.maxFeePerBlobGas;
		delete transaction_.maxFeePerGas;
		delete transaction_.maxPriorityFeePerGas;
	}
	if (transaction_.type === "eip1559") delete transaction_.maxFeePerBlobGas;
	return transaction_;
}
function formatAuthorizationList(authorizationList) {
	return authorizationList.map((authorization) => ({
		address: authorization.address,
		chainId: Number(authorization.chainId),
		nonce: Number(authorization.nonce),
		r: authorization.r,
		s: authorization.s,
		yParity: Number(authorization.yParity)
	}));
}
// ../../node_modules/viem/_esm/utils/formatters/block.js
function formatBlock(block, _) {
	const transactions = (block.transactions ?? []).map((transaction) => {
		if (typeof transaction === "string") return transaction;
		return formatTransaction(transaction);
	});
	return {
		...block,
		baseFeePerGas: block.baseFeePerGas ? BigInt(block.baseFeePerGas) : null,
		blobGasUsed: block.blobGasUsed ? BigInt(block.blobGasUsed) : void 0,
		difficulty: block.difficulty ? BigInt(block.difficulty) : void 0,
		excessBlobGas: block.excessBlobGas ? BigInt(block.excessBlobGas) : void 0,
		gasLimit: block.gasLimit ? BigInt(block.gasLimit) : void 0,
		gasUsed: block.gasUsed ? BigInt(block.gasUsed) : void 0,
		hash: block.hash ? block.hash : null,
		logsBloom: block.logsBloom ? block.logsBloom : null,
		nonce: block.nonce ? block.nonce : null,
		number: block.number ? BigInt(block.number) : null,
		size: block.size ? BigInt(block.size) : void 0,
		timestamp: block.timestamp ? BigInt(block.timestamp) : void 0,
		transactions,
		totalDifficulty: block.totalDifficulty ? BigInt(block.totalDifficulty) : null
	};
}
// ../../node_modules/viem/_esm/actions/public/getBlock.js
/**
* Returns information about a block at a block number, hash, or tag.
*
* - Docs: https://viem.sh/docs/actions/public/getBlock
* - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/blocks_fetching-blocks
* - JSON-RPC Methods:
*   - Calls [`eth_getBlockByNumber`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getblockbynumber) for `blockNumber` & `blockTag`.
*   - Calls [`eth_getBlockByHash`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getblockbyhash) for `blockHash`.
*
* @param client - Client to use
* @param parameters - {@link GetBlockParameters}
* @returns Information about the block. {@link GetBlockReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getBlock } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const block = await getBlock(client)
*/
async function getBlock(client, { blockHash, blockNumber, blockTag = client.experimental_blockTag ?? "latest", includeTransactions: includeTransactions_ } = {}) {
	const includeTransactions = includeTransactions_ ?? false;
	const blockNumberHex = blockNumber !== void 0 ? numberToHex(blockNumber) : void 0;
	let block = null;
	if (blockHash) block = await client.request({
		method: "eth_getBlockByHash",
		params: [blockHash, includeTransactions]
	}, { dedupe: true });
	else block = await client.request({
		method: "eth_getBlockByNumber",
		params: [blockNumberHex || blockTag, includeTransactions]
	}, { dedupe: Boolean(blockNumberHex) });
	if (!block) throw new BlockNotFoundError({
		blockHash,
		blockNumber
	});
	return (client.chain?.formatters?.block?.format || formatBlock)(block, "getBlock");
}
// ../../node_modules/viem/_esm/actions/public/getGasPrice.js
/**
* Returns the current price of gas (in wei).
*
* - Docs: https://viem.sh/docs/actions/public/getGasPrice
* - JSON-RPC Methods: [`eth_gasPrice`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_gasprice)
*
* @param client - Client to use
* @returns The gas price (in wei). {@link GetGasPriceReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getGasPrice } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const gasPrice = await getGasPrice(client)
*/
async function getGasPrice(client) {
	const gasPrice = await client.request({ method: "eth_gasPrice" });
	return BigInt(gasPrice);
}
// ../../node_modules/viem/_esm/actions/public/estimateMaxPriorityFeePerGas.js
/**
* Returns an estimate for the max priority fee per gas (in wei) for a
* transaction to be likely included in the next block.
* Defaults to [`chain.fees.defaultPriorityFee`](/docs/clients/chains#fees-defaultpriorityfee) if set.
*
* - Docs: https://viem.sh/docs/actions/public/estimateMaxPriorityFeePerGas
*
* @param client - Client to use
* @returns An estimate (in wei) for the max priority fee per gas. {@link EstimateMaxPriorityFeePerGasReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { estimateMaxPriorityFeePerGas } from 'viem/actions'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const maxPriorityFeePerGas = await estimateMaxPriorityFeePerGas(client)
* // 10000000n
*/
async function estimateMaxPriorityFeePerGas(client, args) {
	return internal_estimateMaxPriorityFeePerGas(client, args);
}
async function internal_estimateMaxPriorityFeePerGas(client, args) {
	const { block: block_, chain = client.chain, request } = args || {};
	try {
		const maxPriorityFeePerGas = chain?.fees?.maxPriorityFeePerGas ?? chain?.fees?.defaultPriorityFee;
		if (typeof maxPriorityFeePerGas === "function") {
			const maxPriorityFeePerGas_ = await maxPriorityFeePerGas({
				block: block_ || await getAction(client, getBlock, "getBlock")({}),
				client,
				request
			});
			if (maxPriorityFeePerGas_ === null) throw new Error();
			return maxPriorityFeePerGas_;
		}
		if (typeof maxPriorityFeePerGas !== "undefined") return maxPriorityFeePerGas;
		const maxPriorityFeePerGasHex = await client.request({ method: "eth_maxPriorityFeePerGas" });
		return hexToBigInt(maxPriorityFeePerGasHex);
	} catch {
		const [block, gasPrice] = await Promise.all([block_ ? Promise.resolve(block_) : getAction(client, getBlock, "getBlock")({}), getAction(client, getGasPrice, "getGasPrice")({})]);
		if (typeof block.baseFeePerGas !== "bigint") throw new Eip1559FeesNotSupportedError();
		const maxPriorityFeePerGas = gasPrice - block.baseFeePerGas;
		if (maxPriorityFeePerGas < 0n) return 0n;
		return maxPriorityFeePerGas;
	}
}
// ../../node_modules/viem/_esm/actions/public/estimateFeesPerGas.js
/**
* Returns an estimate for the fees per gas (in wei) for a
* transaction to be likely included in the next block.
* Defaults to [`chain.fees.estimateFeesPerGas`](/docs/clients/chains#fees-estimatefeespergas) if set.
*
* - Docs: https://viem.sh/docs/actions/public/estimateFeesPerGas
*
* @param client - Client to use
* @param parameters - {@link EstimateFeesPerGasParameters}
* @returns An estimate (in wei) for the fees per gas. {@link EstimateFeesPerGasReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { estimateFeesPerGas } from 'viem/actions'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const maxPriorityFeePerGas = await estimateFeesPerGas(client)
* // { maxFeePerGas: ..., maxPriorityFeePerGas: ... }
*/
async function estimateFeesPerGas(client, args) {
	return internal_estimateFeesPerGas(client, args);
}
async function internal_estimateFeesPerGas(client, args) {
	const { block: block_, chain = client.chain, request, type = "eip1559" } = args || {};
	const baseFeeMultiplier = await (async () => {
		if (typeof chain?.fees?.baseFeeMultiplier === "function") return chain.fees.baseFeeMultiplier({
			block: block_,
			client,
			request
		});
		return chain?.fees?.baseFeeMultiplier ?? 1.2;
	})();
	if (baseFeeMultiplier < 1) throw new BaseFeeScalarError();
	const denominator = 10 ** (baseFeeMultiplier.toString().split(".")[1]?.length ?? 0);
	const multiply = (base) => base * BigInt(Math.round(baseFeeMultiplier * denominator)) / BigInt(denominator);
	const block = block_ ? block_ : await getAction(client, getBlock, "getBlock")({});
	if (typeof chain?.fees?.estimateFeesPerGas === "function") {
		const fees = await chain.fees.estimateFeesPerGas({
			block: block_,
			client,
			multiply,
			request,
			type
		});
		if (fees !== null) return fees;
	}
	if (type === "eip1559") {
		if (typeof block.baseFeePerGas !== "bigint") throw new Eip1559FeesNotSupportedError();
		const maxPriorityFeePerGas = typeof request?.maxPriorityFeePerGas === "bigint" ? request.maxPriorityFeePerGas : await internal_estimateMaxPriorityFeePerGas(client, {
			block,
			chain,
			request
		});
		const baseFeePerGas = multiply(block.baseFeePerGas);
		return {
			maxFeePerGas: request?.maxFeePerGas ?? baseFeePerGas + maxPriorityFeePerGas,
			maxPriorityFeePerGas
		};
	}
	return { gasPrice: request?.gasPrice ?? multiply(await getAction(client, getGasPrice, "getGasPrice")({})) };
}
// ../../node_modules/viem/_esm/utils/block/formatBlockParameter.js
/**
* Formats block parameters for RPC calls according to EIP-1898.
*
* @param parameters - Block parameters
* @returns Formatted block parameter for RPC call
*
* @example
* // Using block tag
* formatBlockParameter({ blockTag: 'latest' })
* // => 'latest'
*
* @example
* // Using block number
* formatBlockParameter({ blockNumber: 69420n })
* // => '0x10f2c'
*
* @example
* // Using block hash (EIP-1898)
* formatBlockParameter({ blockHash: '0x...' })
* // => { blockHash: '0x...' }
*
* @example
* // Using block hash with requireCanonical (EIP-1898)
* formatBlockParameter({ blockHash: '0x...', requireCanonical: true })
* // => { blockHash: '0x...', requireCanonical: true }
*/
function formatBlockParameter(parameters) {
	const { blockHash, blockNumber, blockTag, requireCanonical } = parameters;
	if (requireCanonical !== void 0 && !blockHash) throw new BaseError$2("`requireCanonical` can only be provided when `blockHash` is set.");
	if (blockHash) return requireCanonical ? {
		blockHash,
		requireCanonical
	} : { blockHash };
	if (typeof blockNumber === "bigint") return numberToHex(blockNumber);
	return blockTag ?? "latest";
}
// ../../node_modules/viem/_esm/actions/public/getTransactionCount.js
/**
* Returns the number of [Transactions](https://viem.sh/docs/glossary/terms#transaction) an Account has sent.
*
* - Docs: https://viem.sh/docs/actions/public/getTransactionCount
* - JSON-RPC Methods: [`eth_getTransactionCount`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_gettransactioncount)
*
* @param client - Client to use
* @param parameters - {@link GetTransactionCountParameters}
* @returns The number of transactions an account has sent. {@link GetTransactionCountReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getTransactionCount } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const transactionCount = await getTransactionCount(client, {
*   address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
* })
*/
async function getTransactionCount(client, { address, blockHash, blockNumber, blockTag = "latest", requireCanonical }) {
	const block = formatBlockParameter({
		blockHash,
		blockNumber,
		blockTag,
		requireCanonical
	});
	const count = await client.request({
		method: "eth_getTransactionCount",
		params: [address, block]
	}, { dedupe: typeof blockNumber === "bigint" || blockHash !== void 0 });
	return hexToNumber$1(count);
}
// ../../node_modules/viem/_esm/utils/blob/blobsToCommitments.js
/**
* Compute commitments from a list of blobs.
*
* @example
* ```ts
* import { blobsToCommitments, toBlobs } from 'viem'
* import { kzg } from './kzg'
*
* const blobs = toBlobs({ data: '0x1234' })
* const commitments = blobsToCommitments({ blobs, kzg })
* ```
*/
function blobsToCommitments(parameters) {
	const { kzg } = parameters;
	const to = parameters.to ?? (typeof parameters.blobs[0] === "string" ? "hex" : "bytes");
	const blobs = typeof parameters.blobs[0] === "string" ? parameters.blobs.map((x) => hexToBytes$1(x)) : parameters.blobs;
	const commitments = [];
	for (const blob of blobs) commitments.push(Uint8Array.from(kzg.blobToKzgCommitment(blob)));
	return to === "bytes" ? commitments : commitments.map((x) => bytesToHex$1(x));
}
// ../../node_modules/viem/_esm/utils/blob/blobsToProofs.js
/**
* Compute the proofs for a list of blobs and their commitments.
*
* @example
* ```ts
* import {
*   blobsToCommitments,
*   toBlobs
* } from 'viem'
* import { kzg } from './kzg'
*
* const blobs = toBlobs({ data: '0x1234' })
* const commitments = blobsToCommitments({ blobs, kzg })
* const proofs = blobsToProofs({ blobs, commitments, kzg })
* ```
*/
function blobsToProofs(parameters) {
	const { kzg } = parameters;
	const to = parameters.to ?? (typeof parameters.blobs[0] === "string" ? "hex" : "bytes");
	const blobs = typeof parameters.blobs[0] === "string" ? parameters.blobs.map((x) => hexToBytes$1(x)) : parameters.blobs;
	const commitments = typeof parameters.commitments[0] === "string" ? parameters.commitments.map((x) => hexToBytes$1(x)) : parameters.commitments;
	const proofs = [];
	for (let i = 0; i < blobs.length; i++) {
		const blob = blobs[i];
		const commitment = commitments[i];
		proofs.push(Uint8Array.from(kzg.computeBlobKzgProof(blob, commitment)));
	}
	return to === "bytes" ? proofs : proofs.map((x) => bytesToHex$1(x));
}
// ../../node_modules/viem/node_modules/@noble/hashes/esm/_md.js
/**
* Internal Merkle-Damgard hash utils.
* @module
*/
/** Polyfill for Safari 14. https://caniuse.com/mdn-javascript_builtins_dataview_setbiguint64 */
function setBigUint64(view, byteOffset, value, isLE) {
	if (typeof view.setBigUint64 === "function") return view.setBigUint64(byteOffset, value, isLE);
	const _32n = BigInt(32);
	const _u32_max = BigInt(4294967295);
	const wh = Number(value >> _32n & _u32_max);
	const wl = Number(value & _u32_max);
	const h = isLE ? 4 : 0;
	const l = isLE ? 0 : 4;
	view.setUint32(byteOffset + h, wh, isLE);
	view.setUint32(byteOffset + l, wl, isLE);
}
/** Choice: a ? b : c */
function Chi(a, b, c) {
	return a & b ^ ~a & c;
}
/** Majority function, true if any two inputs is true. */
function Maj(a, b, c) {
	return a & b ^ a & c ^ b & c;
}
/**
* Merkle-Damgard hash construction base class.
* Could be used to create MD5, RIPEMD, SHA1, SHA2.
*/
var HashMD = class extends Hash {
	constructor(blockLen, outputLen, padOffset, isLE) {
		super();
		this.finished = false;
		this.length = 0;
		this.pos = 0;
		this.destroyed = false;
		this.blockLen = blockLen;
		this.outputLen = outputLen;
		this.padOffset = padOffset;
		this.isLE = isLE;
		this.buffer = new Uint8Array(blockLen);
		this.view = createView(this.buffer);
	}
	update(data) {
		aexists(this);
		data = toBytes$2(data);
		abytes$1(data);
		const { view, buffer, blockLen } = this;
		const len = data.length;
		for (let pos = 0; pos < len;) {
			const take = Math.min(blockLen - this.pos, len - pos);
			if (take === blockLen) {
				const dataView = createView(data);
				for (; blockLen <= len - pos; pos += blockLen) this.process(dataView, pos);
				continue;
			}
			buffer.set(data.subarray(pos, pos + take), this.pos);
			this.pos += take;
			pos += take;
			if (this.pos === blockLen) {
				this.process(view, 0);
				this.pos = 0;
			}
		}
		this.length += data.length;
		this.roundClean();
		return this;
	}
	digestInto(out) {
		aexists(this);
		aoutput(out, this);
		this.finished = true;
		const { buffer, view, blockLen, isLE } = this;
		let { pos } = this;
		buffer[pos++] = 128;
		clean(this.buffer.subarray(pos));
		if (this.padOffset > blockLen - pos) {
			this.process(view, 0);
			pos = 0;
		}
		for (let i = pos; i < blockLen; i++) buffer[i] = 0;
		setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
		this.process(view, 0);
		const oview = createView(out);
		const len = this.outputLen;
		if (len % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
		const outLen = len / 4;
		const state = this.get();
		if (outLen > state.length) throw new Error("_sha2: outputLen bigger than state");
		for (let i = 0; i < outLen; i++) oview.setUint32(4 * i, state[i], isLE);
	}
	digest() {
		const { buffer, outputLen } = this;
		this.digestInto(buffer);
		const res = buffer.slice(0, outputLen);
		this.destroy();
		return res;
	}
	_cloneInto(to) {
		to || (to = new this.constructor());
		to.set(...this.get());
		const { blockLen, buffer, length, finished, destroyed, pos } = this;
		to.destroyed = destroyed;
		to.finished = finished;
		to.length = length;
		to.pos = pos;
		if (length % blockLen) to.buffer.set(buffer);
		return to;
	}
	clone() {
		return this._cloneInto();
	}
};
/**
* Initial SHA-2 state: fractional parts of square roots of first 16 primes 2..53.
* Check out `test/misc/sha2-gen-iv.js` for recomputation guide.
*/
/** Initial SHA256 state. Bits 0..32 of frac part of sqrt of primes 2..19 */
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
	1779033703,
	3144134277,
	1013904242,
	2773480762,
	1359893119,
	2600822924,
	528734635,
	1541459225
]);
// ../../node_modules/viem/node_modules/@noble/hashes/esm/sha2.js
/**
* SHA2 hash function. A.k.a. sha256, sha384, sha512, sha512_224, sha512_256.
* SHA256 is the fastest hash implementable in JS, even faster than Blake3.
* Check out [RFC 4634](https://datatracker.ietf.org/doc/html/rfc4634) and
* [FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf).
* @module
*/
/**
* Round constants:
* First 32 bits of fractional parts of the cube roots of the first 64 primes 2..311)
*/
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
	1116352408,
	1899447441,
	3049323471,
	3921009573,
	961987163,
	1508970993,
	2453635748,
	2870763221,
	3624381080,
	310598401,
	607225278,
	1426881987,
	1925078388,
	2162078206,
	2614888103,
	3248222580,
	3835390401,
	4022224774,
	264347078,
	604807628,
	770255983,
	1249150122,
	1555081692,
	1996064986,
	2554220882,
	2821834349,
	2952996808,
	3210313671,
	3336571891,
	3584528711,
	113926993,
	338241895,
	666307205,
	773529912,
	1294757372,
	1396182291,
	1695183700,
	1986661051,
	2177026350,
	2456956037,
	2730485921,
	2820302411,
	3259730800,
	3345764771,
	3516065817,
	3600352804,
	4094571909,
	275423344,
	430227734,
	506948616,
	659060556,
	883997877,
	958139571,
	1322822218,
	1537002063,
	1747873779,
	1955562222,
	2024104815,
	2227730452,
	2361852424,
	2428436474,
	2756734187,
	3204031479,
	3329325298
]);
/** Reusable temporary buffer. "W" comes straight from spec. */
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA256 = class extends HashMD {
	constructor(outputLen = 32) {
		super(64, outputLen, 8, false);
		this.A = SHA256_IV[0] | 0;
		this.B = SHA256_IV[1] | 0;
		this.C = SHA256_IV[2] | 0;
		this.D = SHA256_IV[3] | 0;
		this.E = SHA256_IV[4] | 0;
		this.F = SHA256_IV[5] | 0;
		this.G = SHA256_IV[6] | 0;
		this.H = SHA256_IV[7] | 0;
	}
	get() {
		const { A, B, C, D, E, F, G, H } = this;
		return [
			A,
			B,
			C,
			D,
			E,
			F,
			G,
			H
		];
	}
	set(A, B, C, D, E, F, G, H) {
		this.A = A | 0;
		this.B = B | 0;
		this.C = C | 0;
		this.D = D | 0;
		this.E = E | 0;
		this.F = F | 0;
		this.G = G | 0;
		this.H = H | 0;
	}
	process(view, offset) {
		for (let i = 0; i < 16; i++, offset += 4) SHA256_W[i] = view.getUint32(offset, false);
		for (let i = 16; i < 64; i++) {
			const W15 = SHA256_W[i - 15];
			const W2 = SHA256_W[i - 2];
			const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
			const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
			SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
		}
		let { A, B, C, D, E, F, G, H } = this;
		for (let i = 0; i < 64; i++) {
			const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
			const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
			const T2 = (rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22)) + Maj(A, B, C) | 0;
			H = G;
			G = F;
			F = E;
			E = D + T1 | 0;
			D = C;
			C = B;
			B = A;
			A = T1 + T2 | 0;
		}
		A = A + this.A | 0;
		B = B + this.B | 0;
		C = C + this.C | 0;
		D = D + this.D | 0;
		E = E + this.E | 0;
		F = F + this.F | 0;
		G = G + this.G | 0;
		H = H + this.H | 0;
		this.set(A, B, C, D, E, F, G, H);
	}
	roundClean() {
		clean(SHA256_W);
	}
	destroy() {
		this.set(0, 0, 0, 0, 0, 0, 0, 0);
		clean(this.buffer);
	}
};
/**
* SHA2-256 hash function from RFC 4634.
*
* It is the fastest JS hash, even faster than Blake3.
* To break sha256 using birthday attack, attackers need to try 2^128 hashes.
* BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
*/
var sha256$3 = /* @__PURE__ */ createHasher(() => new SHA256());
// ../../node_modules/viem/node_modules/@noble/hashes/esm/sha256.js
/**
* SHA2-256 a.k.a. sha256. In JS, it is the fastest hash, even faster than Blake3.
*
* To break sha256 using birthday attack, attackers need to try 2^128 hashes.
* BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
*
* Check out [FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf).
* @module
* @deprecated
*/
/** @deprecated Use import from `noble/hashes/sha2` module */
var sha256$2 = sha256$3;
// ../../node_modules/viem/_esm/utils/hash/sha256.js
function sha256$1(value, to_) {
	const to = to_ || "hex";
	const bytes = sha256$2(isHex(value, { strict: false }) ? toBytes$1(value) : value);
	if (to === "bytes") return bytes;
	return toHex(bytes);
}
// ../../node_modules/viem/_esm/utils/blob/commitmentToVersionedHash.js
/**
* Transform a commitment to it's versioned hash.
*
* @example
* ```ts
* import {
*   blobsToCommitments,
*   commitmentToVersionedHash,
*   toBlobs
* } from 'viem'
* import { kzg } from './kzg'
*
* const blobs = toBlobs({ data: '0x1234' })
* const [commitment] = blobsToCommitments({ blobs, kzg })
* const versionedHash = commitmentToVersionedHash({ commitment })
* ```
*/
function commitmentToVersionedHash(parameters) {
	const { commitment, version = 1 } = parameters;
	const to = parameters.to ?? (typeof commitment === "string" ? "hex" : "bytes");
	const versionedHash = sha256$1(commitment, "bytes");
	versionedHash.set([version], 0);
	return to === "bytes" ? versionedHash : bytesToHex$1(versionedHash);
}
// ../../node_modules/viem/_esm/utils/blob/commitmentsToVersionedHashes.js
/**
* Transform a list of commitments to their versioned hashes.
*
* @example
* ```ts
* import {
*   blobsToCommitments,
*   commitmentsToVersionedHashes,
*   toBlobs
* } from 'viem'
* import { kzg } from './kzg'
*
* const blobs = toBlobs({ data: '0x1234' })
* const commitments = blobsToCommitments({ blobs, kzg })
* const versionedHashes = commitmentsToVersionedHashes({ commitments })
* ```
*/
function commitmentsToVersionedHashes(parameters) {
	const { commitments, version } = parameters;
	const to = parameters.to ?? (typeof commitments[0] === "string" ? "hex" : "bytes");
	const hashes = [];
	for (const commitment of commitments) hashes.push(commitmentToVersionedHash({
		commitment,
		to,
		version
	}));
	return hashes;
}
// ../../node_modules/viem/_esm/constants/blob.js
/** Blob limit per transaction. */
var blobsPerTransaction = 6;
/** The number of field elements in a blob. */
var fieldElementsPerBlob = 4096;
/** The number of bytes in a blob. */
var bytesPerBlob = 32 * fieldElementsPerBlob;
/** Blob bytes limit per transaction. */
var maxBytesPerTransaction = bytesPerBlob * blobsPerTransaction - 1 - 1 * fieldElementsPerBlob * blobsPerTransaction;
// ../../node_modules/viem/_esm/errors/blob.js
var BlobSizeTooLargeError = class extends BaseError$2 {
	constructor({ maxSize, size }) {
		super("Blob size is too large.", {
			metaMessages: [`Max: ${maxSize} bytes`, `Given: ${size} bytes`],
			name: "BlobSizeTooLargeError"
		});
	}
};
var EmptyBlobError = class extends BaseError$2 {
	constructor() {
		super("Blob data must not be empty.", { name: "EmptyBlobError" });
	}
};
// ../../node_modules/viem/_esm/utils/blob/toBlobs.js
/**
* Transforms arbitrary data to blobs.
*
* @example
* ```ts
* import { toBlobs, stringToHex } from 'viem'
*
* const blobs = toBlobs({ data: stringToHex('hello world') })
* ```
*/
function toBlobs(parameters) {
	const to = parameters.to ?? (typeof parameters.data === "string" ? "hex" : "bytes");
	const data = typeof parameters.data === "string" ? hexToBytes$1(parameters.data) : parameters.data;
	const size_ = size$3(data);
	if (!size_) throw new EmptyBlobError();
	if (size_ > 761855) throw new BlobSizeTooLargeError({
		maxSize: maxBytesPerTransaction,
		size: size_
	});
	const blobs = [];
	let active = true;
	let position = 0;
	while (active) {
		const blob = createCursor(new Uint8Array(bytesPerBlob));
		let size = 0;
		while (size < fieldElementsPerBlob) {
			const bytes = data.slice(position, position + 31);
			blob.pushByte(0);
			blob.pushBytes(bytes);
			if (bytes.length < 31) {
				blob.pushByte(128);
				active = false;
				break;
			}
			size++;
			position += 31;
		}
		blobs.push(blob);
	}
	return to === "bytes" ? blobs.map((x) => x.bytes) : blobs.map((x) => bytesToHex$1(x.bytes));
}
// ../../node_modules/viem/_esm/utils/blob/toBlobSidecars.js
/**
* Transforms arbitrary data (or blobs, commitments, & proofs) into a sidecar array.
*
* @example
* ```ts
* import { toBlobSidecars, stringToHex } from 'viem'
*
* const sidecars = toBlobSidecars({ data: stringToHex('hello world') })
* ```
*
* @example
* ```ts
* import {
*   blobsToCommitments,
*   toBlobs,
*   blobsToProofs,
*   toBlobSidecars,
*   stringToHex
* } from 'viem'
*
* const blobs = toBlobs({ data: stringToHex('hello world') })
* const commitments = blobsToCommitments({ blobs, kzg })
* const proofs = blobsToProofs({ blobs, commitments, kzg })
*
* const sidecars = toBlobSidecars({ blobs, commitments, proofs })
* ```
*/
function toBlobSidecars(parameters) {
	const { data, kzg, to } = parameters;
	const blobs = parameters.blobs ?? toBlobs({
		data,
		to
	});
	const commitments = parameters.commitments ?? blobsToCommitments({
		blobs,
		kzg,
		to
	});
	const proofs = parameters.proofs ?? blobsToProofs({
		blobs,
		commitments,
		kzg,
		to
	});
	const sidecars = [];
	for (let i = 0; i < blobs.length; i++) sidecars.push({
		blob: blobs[i],
		commitment: commitments[i],
		proof: proofs[i]
	});
	return sidecars;
}
// ../../node_modules/viem/_esm/utils/transaction/getTransactionType.js
function getTransactionType(transaction) {
	if (transaction.type) return transaction.type;
	if (typeof transaction.authorizationList !== "undefined") return "eip7702";
	if (typeof transaction.blobs !== "undefined" || typeof transaction.blobVersionedHashes !== "undefined" || typeof transaction.maxFeePerBlobGas !== "undefined" || typeof transaction.sidecars !== "undefined") return "eip4844";
	if (typeof transaction.maxFeePerGas !== "undefined" || typeof transaction.maxPriorityFeePerGas !== "undefined") return "eip1559";
	if (typeof transaction.gasPrice !== "undefined") {
		if (typeof transaction.accessList !== "undefined") return "eip2930";
		return "legacy";
	}
	throw new InvalidSerializableTransactionError({ transaction });
}
// ../../node_modules/viem/_esm/utils/errors/getTransactionError.js
function getTransactionError(err, { docsPath, ...args }) {
	return new TransactionExecutionError((() => {
		const cause = getNodeError(err, args);
		if (cause instanceof UnknownNodeError) return err;
		return cause;
	})(), {
		docsPath,
		...args
	});
}
// ../../node_modules/viem/_esm/actions/public/getChainId.js
/**
* Returns the chain ID associated with the current network.
*
* - Docs: https://viem.sh/docs/actions/public/getChainId
* - JSON-RPC Methods: [`eth_chainId`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_chainid)
*
* @param client - Client to use
* @returns The current chain ID. {@link GetChainIdReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getChainId } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const chainId = await getChainId(client)
* // 1
*/
async function getChainId(client) {
	const chainIdHex = await client.request({ method: "eth_chainId" }, { dedupe: true });
	return hexToNumber$1(chainIdHex);
}
// ../../node_modules/viem/_esm/actions/public/fillTransaction.js
/**
* Fills a transaction request with the necessary fields to be signed over.
*
* - Docs: https://viem.sh/docs/actions/public/fillTransaction
*
* @param client - Client to use
* @param parameters - {@link FillTransactionParameters}
* @returns The filled transaction. {@link FillTransactionReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { fillTransaction } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const result = await fillTransaction(client, {
*   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
*   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
*   value: parseEther('1'),
* })
*/
async function fillTransaction(client, parameters) {
	const { account = client.account, accessList, authorizationList, chain = client.chain, blobVersionedHashes, blobs, data, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, nonce: nonce_, nonceManager, to, type, value, ...rest } = parameters;
	const nonce = await (async () => {
		if (!account) return nonce_;
		if (!nonceManager) return nonce_;
		if (typeof nonce_ !== "undefined") return nonce_;
		const account_ = parseAccount(account);
		const chainId = chain ? chain.id : await getAction(client, getChainId, "getChainId")({});
		return await nonceManager.consume({
			address: account_.address,
			chainId,
			client
		});
	})();
	assertRequest(parameters);
	const chainFormat = chain?.formatters?.transactionRequest?.format;
	const request = (chainFormat || formatTransactionRequest)({
		...extract(rest, { format: chainFormat }),
		account: account ? parseAccount(account) : void 0,
		accessList,
		authorizationList,
		blobs,
		blobVersionedHashes,
		data,
		gas,
		gasPrice,
		maxFeePerBlobGas,
		maxFeePerGas,
		maxPriorityFeePerGas,
		nonce,
		to,
		type,
		value
	}, "fillTransaction");
	try {
		const response = await client.request({
			method: "eth_fillTransaction",
			params: [request]
		});
		const transaction = (chain?.formatters?.transaction?.format || formatTransaction)(response.tx);
		delete transaction.blockHash;
		delete transaction.blockNumber;
		delete transaction.r;
		delete transaction.s;
		delete transaction.transactionIndex;
		delete transaction.v;
		delete transaction.yParity;
		if (typeof transaction.maxFeePerGas !== "undefined") delete transaction.gasPrice;
		transaction.data = transaction.input;
		const hasFeePayerSignature = typeof transaction.feePayerSignature !== "undefined" && transaction.feePayerSignature !== null;
		if (hasFeePayerSignature && typeof nonce !== "undefined" && BigInt(transaction.nonce) !== BigInt(nonce)) throw new FeePayerNonceMismatchError({
			filledNonce: transaction.nonce,
			requestedNonce: nonce
		});
		if (!hasFeePayerSignature) {
			if (transaction.gas) transaction.gas = parameters.gas ?? transaction.gas;
			if (transaction.gasPrice) transaction.gasPrice = parameters.gasPrice ?? transaction.gasPrice;
			if (transaction.maxFeePerBlobGas) transaction.maxFeePerBlobGas = parameters.maxFeePerBlobGas ?? transaction.maxFeePerBlobGas;
			if (transaction.maxFeePerGas) transaction.maxFeePerGas = parameters.maxFeePerGas ?? transaction.maxFeePerGas;
			if (transaction.maxPriorityFeePerGas) transaction.maxPriorityFeePerGas = parameters.maxPriorityFeePerGas ?? transaction.maxPriorityFeePerGas;
			if (typeof transaction.nonce !== "undefined" && typeof parameters.nonce !== "undefined") transaction.nonce = typeof transaction.nonce === "bigint" ? BigInt(parameters.nonce) : parameters.nonce;
			const feeMultiplier = await (async () => {
				if (typeof chain?.fees?.baseFeeMultiplier === "function") {
					const block = await getAction(client, getBlock, "getBlock")({});
					return chain.fees.baseFeeMultiplier({
						block,
						client,
						request: parameters
					});
				}
				return chain?.fees?.baseFeeMultiplier ?? 1.2;
			})();
			if (feeMultiplier < 1) throw new BaseFeeScalarError();
			const denominator = 10 ** (feeMultiplier.toString().split(".")[1]?.length ?? 0);
			const multiplyFee = (base) => base * BigInt(Math.round(feeMultiplier * denominator)) / BigInt(denominator);
			if (transaction.maxFeePerGas && !parameters.maxFeePerGas) transaction.maxFeePerGas = multiplyFee(transaction.maxFeePerGas);
			if (transaction.gasPrice && !parameters.gasPrice) transaction.gasPrice = multiplyFee(transaction.gasPrice);
		}
		return {
			raw: response.raw,
			transaction: {
				from: request.from,
				...transaction
			},
			...response.capabilities ? { capabilities: response.capabilities } : {}
		};
	} catch (err) {
		throw getTransactionError(err, {
			...parameters,
			chain: client.chain
		});
	}
}
// ../../node_modules/viem/_esm/actions/wallet/prepareTransactionRequest.js
var defaultParameters = [
	"blobVersionedHashes",
	"chainId",
	"fees",
	"gas",
	"nonce",
	"type"
];
/** @internal */
var eip1559NetworkCache = /*#__PURE__*/ new Map();
/** @internal */
var supportsFillTransaction = /*#__PURE__*/ new LruMap$1(128);
/**
* Prepares a transaction request for signing.
*
* - Docs: https://viem.sh/docs/actions/wallet/prepareTransactionRequest
*
* @param args - {@link PrepareTransactionRequestParameters}
* @returns The transaction request. {@link PrepareTransactionRequestReturnType}
*
* @example
* import { createWalletClient, custom } from 'viem'
* import { mainnet } from 'viem/chains'
* import { prepareTransactionRequest } from 'viem/actions'
*
* const client = createWalletClient({
*   chain: mainnet,
*   transport: custom(window.ethereum),
* })
* const request = await prepareTransactionRequest(client, {
*   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
*   to: '0x0000000000000000000000000000000000000000',
*   value: 1n,
* })
*
* @example
* // Account Hoisting
* import { createWalletClient, http } from 'viem'
* import { privateKeyToAccount } from 'viem/accounts'
* import { mainnet } from 'viem/chains'
* import { prepareTransactionRequest } from 'viem/actions'
*
* const client = createWalletClient({
*   account: privateKeyToAccount('0x…'),
*   chain: mainnet,
*   transport: custom(window.ethereum),
* })
* const request = await prepareTransactionRequest(client, {
*   to: '0x0000000000000000000000000000000000000000',
*   value: 1n,
* })
*/
async function prepareTransactionRequest(client, args) {
	let request = args;
	request.account ??= client.account;
	request.parameters ??= defaultParameters;
	const { account: account_, chain = client.chain, nonceManager, parameters } = request;
	const prepareTransactionRequest = (() => {
		if (typeof chain?.prepareTransactionRequest === "function") return {
			fn: chain.prepareTransactionRequest,
			runAt: ["beforeFillTransaction"]
		};
		if (Array.isArray(chain?.prepareTransactionRequest)) return {
			fn: chain.prepareTransactionRequest[0],
			runAt: chain.prepareTransactionRequest[1].runAt
		};
	})();
	let chainId;
	async function getChainId$1() {
		if (chainId) return chainId;
		if (typeof request.chainId !== "undefined") return request.chainId;
		if (chain) return chain.id;
		chainId = await getAction(client, getChainId, "getChainId")({});
		return chainId;
	}
	let account = account_ ? parseAccount(account_) : account_;
	let nonce = request.nonce;
	if (prepareTransactionRequest?.fn && prepareTransactionRequest.runAt?.includes("beforeFillTransaction")) {
		request = await prepareTransactionRequest.fn({
			...request,
			chain
		}, {
			client,
			phase: "beforeFillTransaction"
		});
		nonce ??= request.nonce;
		const sender = request.account ?? request.from;
		account = sender ? parseAccount(sender) : void 0;
	}
	if (parameters.includes("nonce") && typeof nonce === "undefined" && account && nonceManager) {
		const chainId = await getChainId$1();
		nonce = await nonceManager.consume({
			address: account.address,
			chainId,
			client
		});
	}
	const fillResult = (() => {
		if ((parameters.includes("blobVersionedHashes") || parameters.includes("sidecars")) && request.kzg && request.blobs) return false;
		if (parameters.length > 0 && "feePayer" in request && request.feePayer && !("feePayerSignature" in request && request.feePayerSignature)) return true;
		if (supportsFillTransaction.get(client.uid) === false) return false;
		if (!["fees", "gas"].some((parameter) => parameters.includes(parameter))) return false;
		if (parameters.includes("chainId") && typeof request.chainId !== "number") return true;
		if (parameters.includes("nonce") && typeof nonce !== "number") return true;
		if (parameters.includes("fees") && typeof request.gasPrice !== "bigint" && (typeof request.maxFeePerGas !== "bigint" || typeof request.maxPriorityFeePerGas !== "bigint")) return true;
		if (parameters.includes("gas") && typeof request.gas !== "bigint") return true;
		return false;
	})() ? await getAction(client, fillTransaction, "fillTransaction")({
		...request,
		nonce
	}).then((result) => {
		const { chainId, from, gas, gasPrice, nonce, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, type, ...rest } = result.transaction;
		const feeToken = "feeToken" in rest ? rest.feeToken : void 0;
		const hasFilledFeePayerSignature = "feePayerSignature" in rest && rest.feePayerSignature !== null && typeof rest.feePayerSignature !== "undefined";
		const shouldUseFilledFeeToken = typeof feeToken !== "undefined" && feeToken !== null && (!("feeToken" in request) || hasFilledFeePayerSignature);
		supportsFillTransaction.set(client.uid, true);
		const { feeToken: _feeToken, ...unsponsored } = request;
		return {
			...hasFilledFeePayerSignature ? unsponsored : request,
			...from ? { from } : {},
			...type && !request.type ? { type } : {},
			...typeof chainId !== "undefined" ? { chainId } : {},
			...typeof gas !== "undefined" ? { gas } : {},
			...typeof gasPrice !== "undefined" ? { gasPrice } : {},
			...typeof nonce !== "undefined" ? { nonce } : {},
			...typeof maxFeePerBlobGas !== "undefined" && request.type !== "legacy" && request.type !== "eip2930" ? { maxFeePerBlobGas } : {},
			...typeof maxFeePerGas !== "undefined" && request.type !== "legacy" && request.type !== "eip2930" ? { maxFeePerGas } : {},
			...typeof maxPriorityFeePerGas !== "undefined" && request.type !== "legacy" && request.type !== "eip2930" ? { maxPriorityFeePerGas } : {},
			..."nonceKey" in rest && typeof rest.nonceKey !== "undefined" ? { nonceKey: rest.nonceKey } : {},
			..."validBefore" in rest && rest.validBefore !== null && typeof rest.validBefore !== "undefined" ? { validBefore: rest.validBefore } : {},
			..."validAfter" in rest && rest.validAfter !== null && typeof rest.validAfter !== "undefined" ? { validAfter: rest.validAfter } : {},
			..."keyAuthorization" in rest && typeof rest.keyAuthorization !== "undefined" && rest.keyAuthorization !== null && !("keyAuthorization" in request) ? { keyAuthorization: rest.keyAuthorization } : {},
			..."feePayerSignature" in rest && typeof rest.feePayerSignature !== "undefined" && rest.feePayerSignature !== null ? { feePayerSignature: rest.feePayerSignature } : {},
			...shouldUseFilledFeeToken ? { feeToken } : {},
			...result.capabilities ? { _capabilities: result.capabilities } : {}
		};
	}).catch((e) => {
		const error = e;
		if (error.name !== "TransactionExecutionError") return request;
		if (error.walk?.((error) => error instanceof FeePayerNonceMismatchError)) throw e;
		if (error.walk?.((e) => {
			return e.name === "ExecutionRevertedError";
		})) throw e;
		if (error.walk?.((e) => {
			const error = e;
			return error.name === "MethodNotFoundRpcError" || error.name === "MethodNotSupportedRpcError" || error.message?.includes("eth_fillTransaction is not available");
		})) supportsFillTransaction.set(client.uid, false);
		return request;
	}) : request;
	nonce ??= fillResult.nonce;
	request = {
		...fillResult,
		...account ? { from: account?.address } : {},
		...typeof nonce !== "undefined" ? { nonce } : {}
	};
	const { blobs, gas, kzg, type } = request;
	if (prepareTransactionRequest?.fn && prepareTransactionRequest.runAt?.includes("beforeFillParameters")) request = await prepareTransactionRequest.fn({
		...request,
		chain
	}, {
		client,
		phase: "beforeFillParameters"
	});
	let block;
	async function getBlock$1() {
		if (block) return block;
		block = await getAction(client, getBlock, "getBlock")({ blockTag: "latest" });
		return block;
	}
	if (parameters.includes("nonce") && typeof nonce === "undefined" && account && !nonceManager) request.nonce = await getAction(client, getTransactionCount, "getTransactionCount")({
		address: account.address,
		blockTag: "pending"
	});
	if ((parameters.includes("blobVersionedHashes") || parameters.includes("sidecars")) && blobs && kzg) {
		const commitments = blobsToCommitments({
			blobs,
			kzg
		});
		if (parameters.includes("blobVersionedHashes")) {
			const versionedHashes = commitmentsToVersionedHashes({
				commitments,
				to: "hex"
			});
			request.blobVersionedHashes = versionedHashes;
		}
		if (parameters.includes("sidecars")) {
			const sidecars = toBlobSidecars({
				blobs,
				commitments,
				proofs: blobsToProofs({
					blobs,
					commitments,
					kzg
				}),
				to: "hex"
			});
			request.sidecars = sidecars;
		}
	}
	if (parameters.includes("chainId")) request.chainId = await getChainId$1();
	if ((parameters.includes("fees") || parameters.includes("type")) && typeof type === "undefined") try {
		request.type = getTransactionType(request);
	} catch {
		let isEip1559Network = eip1559NetworkCache.get(client.uid);
		if (typeof isEip1559Network === "undefined") {
			isEip1559Network = typeof (await getBlock$1())?.baseFeePerGas === "bigint";
			eip1559NetworkCache.set(client.uid, isEip1559Network);
		}
		request.type = isEip1559Network ? "eip1559" : "legacy";
	}
	if (parameters.includes("fees")) {
		if (request.type !== "legacy" && request.type !== "eip2930") {
			if (typeof request.maxFeePerGas === "undefined" || typeof request.maxPriorityFeePerGas === "undefined") {
				const { maxFeePerGas, maxPriorityFeePerGas } = await internal_estimateFeesPerGas(client, {
					block: await getBlock$1(),
					chain,
					request
				});
				if (typeof request.maxPriorityFeePerGas === "undefined" && typeof request.maxFeePerGas === "bigint" && request.maxFeePerGas < maxPriorityFeePerGas) throw new MaxFeePerGasTooLowError({ maxPriorityFeePerGas });
				request.maxPriorityFeePerGas = maxPriorityFeePerGas;
				request.maxFeePerGas = maxFeePerGas;
			}
		} else {
			if (typeof request.maxFeePerGas !== "undefined" || typeof request.maxPriorityFeePerGas !== "undefined") throw new Eip1559FeesNotSupportedError();
			if (typeof request.gasPrice === "undefined") {
				const { gasPrice: gasPrice_ } = await internal_estimateFeesPerGas(client, {
					block: await getBlock$1(),
					chain,
					request,
					type: "legacy"
				});
				request.gasPrice = gasPrice_;
			}
		}
	}
	if (parameters.includes("gas") && typeof gas === "undefined") request.gas = await getAction(client, estimateGas, "estimateGas")({
		...request,
		account,
		prepare: account?.type === "local" ? [] : ["blobVersionedHashes"]
	});
	if (prepareTransactionRequest?.fn && prepareTransactionRequest.runAt?.includes("afterFillParameters")) request = await prepareTransactionRequest.fn({
		...request,
		chain
	}, {
		client,
		phase: "afterFillParameters"
	});
	assertRequest(request);
	delete request.parameters;
	return request;
}
// ../../node_modules/viem/_esm/actions/public/estimateGas.js
/**
* Estimates the gas necessary to complete a transaction without submitting it to the network.
*
* - Docs: https://viem.sh/docs/actions/public/estimateGas
* - JSON-RPC Methods: [`eth_estimateGas`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_estimategas)
*
* @param client - Client to use
* @param parameters - {@link EstimateGasParameters}
* @returns The gas estimate (in gas units). {@link EstimateGasReturnType}
*
* @example
* import { createPublicClient, http, parseEther } from 'viem'
* import { mainnet } from 'viem/chains'
* import { estimateGas } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const gasEstimate = await estimateGas(client, {
*   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
*   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
*   value: parseEther('1'),
* })
*/
async function estimateGas(client, args) {
	const { account: account_ = client.account, prepare = true } = args;
	const account = account_ ? parseAccount(account_) : void 0;
	const hasContext = args.stateOverride !== void 0 || typeof args.blockNumber === "bigint" || args.blockTag !== void 0;
	const parameters = (() => {
		if (Array.isArray(prepare)) return prepare;
		if (account?.type !== "local" || hasContext) return ["blobVersionedHashes"];
	})();
	try {
		const to = await (async () => {
			if (args.to) return args.to;
			if (args.authorizationList && args.authorizationList.length > 0) return await recoverAuthorizationAddress({ authorization: args.authorizationList[0] }).catch(() => {
				throw new BaseError$2("`to` is required. Could not infer from `authorizationList`");
			});
		})();
		const { accessList, authorizationList, blobs, blobVersionedHashes, blockNumber, blockTag, data, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, nonce, value, stateOverride, ...rest } = prepare ? await prepareTransactionRequest(client, {
			...args,
			parameters,
			to
		}) : args;
		if (gas && args.gas !== gas && !hasContext) return gas;
		const block = (typeof blockNumber === "bigint" ? numberToHex(blockNumber) : void 0) || blockTag;
		const rpcStateOverride = serializeStateOverride(stateOverride);
		assertRequest(args);
		const chainFormat = client.chain?.formatters?.transactionRequest?.format;
		const request = (chainFormat || formatTransactionRequest)({
			...extract(rest, { format: chainFormat }),
			account,
			accessList,
			authorizationList,
			blobs,
			blobVersionedHashes,
			data,
			gasPrice,
			maxFeePerBlobGas,
			maxFeePerGas,
			maxPriorityFeePerGas,
			nonce,
			to,
			value
		}, "estimateGas");
		return BigInt(await client.request({
			method: "eth_estimateGas",
			params: rpcStateOverride ? [
				request,
				block ?? client.experimental_blockTag ?? "latest",
				rpcStateOverride
			] : block ? [request, block] : [request]
		}));
	} catch (err) {
		throw getEstimateGasError(err, {
			...args,
			account,
			chain: client.chain
		});
	}
}
// ../../node_modules/viem/_esm/actions/public/estimateContractGas.js
/**
* Estimates the gas required to successfully execute a contract write function call.
*
* - Docs: https://viem.sh/docs/contract/estimateContractGas
*
* Internally, uses a [Public Client](https://viem.sh/docs/clients/public) to call the [`estimateGas` action](https://viem.sh/docs/actions/public/estimateGas) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData).
*
* @param client - Client to use
* @param parameters - {@link EstimateContractGasParameters}
* @returns The gas estimate (in wei). {@link EstimateContractGasReturnType}
*
* @example
* import { createPublicClient, http, parseAbi } from 'viem'
* import { mainnet } from 'viem/chains'
* import { estimateContractGas } from 'viem/contract'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const gas = await estimateContractGas(client, {
*   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
*   abi: parseAbi(['function mint() public']),
*   functionName: 'mint',
*   account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
* })
*/
async function estimateContractGas(client, parameters) {
	const { abi, address, args, functionName, dataSuffix = typeof client.dataSuffix === "string" ? client.dataSuffix : client.dataSuffix?.value, ...request } = parameters;
	const data = encodeFunctionData({
		abi,
		args,
		functionName
	});
	try {
		return await getAction(client, estimateGas, "estimateGas")({
			data: `${data}${dataSuffix ? dataSuffix.replace("0x", "") : ""}`,
			to: address,
			...request
		});
	} catch (error) {
		throw getContractError(error, {
			abi,
			address,
			args,
			docsPath: "/docs/contract/estimateContractGas",
			functionName,
			sender: (request.account ? parseAccount(request.account) : void 0)?.address
		});
	}
}
// ../../node_modules/viem/_esm/utils/address/isAddressEqual.js
function isAddressEqual(a, b) {
	if (!isAddress(a, { strict: false })) throw new InvalidAddressError$1({ address: a });
	if (!isAddress(b, { strict: false })) throw new InvalidAddressError$1({ address: b });
	return a.toLowerCase() === b.toLowerCase();
}
// ../../node_modules/viem/_esm/utils/formatters/log.js
function formatLog(log, { args, eventName } = {}) {
	return {
		...log,
		blockHash: log.blockHash ? log.blockHash : null,
		blockNumber: log.blockNumber ? BigInt(log.blockNumber) : null,
		blockTimestamp: log.blockTimestamp ? BigInt(log.blockTimestamp) : log.blockTimestamp === null ? null : void 0,
		logIndex: log.logIndex ? Number(log.logIndex) : null,
		transactionHash: log.transactionHash ? log.transactionHash : null,
		transactionIndex: log.transactionIndex ? Number(log.transactionIndex) : null,
		...eventName ? {
			args,
			eventName
		} : {}
	};
}
// ../../node_modules/viem/_esm/utils/abi/decodeEventLog.js
var docsPath$4 = "/docs/contract/decodeEventLog";
function decodeEventLog(parameters) {
	const { abi, data, eventName, strict: strict_, topics } = parameters;
	const strict = strict_ ?? true;
	const events = abi.filter((item) => item.type === "event" && "name" in item);
	const signature = topics[0];
	const bySelector = signature ? events.find((item) => !item.anonymous && signature === toEventSelector(formatAbiItem(item))) : void 0;
	const candidates = bySelector ? [bySelector] : anonymousCandidates(events, topics.length, eventName);
	if (candidates.length > 1) throw new AbiEventAmbiguityError(candidates.map((item) => item.name));
	const abiItem = candidates[0];
	if (!abiItem) {
		if (!signature) throw new AbiEventSignatureEmptyTopicsError({ docsPath: docsPath$4 });
		throw new AbiEventSignatureNotFoundError(signature, { docsPath: docsPath$4 });
	}
	return decodeMatchedEventLog({
		abiItem,
		argTopics: abiItem.anonymous ? topics : topics.slice(1),
		data,
		strict
	});
}
function anonymousCandidates(events, topicCount, eventName) {
	return (() => {
		if (eventName) return events.filter((item) => item.name === eventName);
		if (events.every((item) => item.anonymous)) return events;
		return [];
	})().filter((item) => item.anonymous && indexedCount(item) === topicCount);
}
function indexedCount(item) {
	return item.inputs?.filter((input) => input.indexed).length ?? 0;
}
function decodeMatchedEventLog({ abiItem, argTopics, data, strict }) {
	const { name, inputs } = abiItem;
	const isUnnamed = inputs?.some((x) => !("name" in x && x.name));
	const args = isUnnamed ? [] : {};
	const indexedInputs = inputs.map((x, i) => [x, i]).filter(([x]) => "indexed" in x && x.indexed);
	const missingIndexedInputs = [];
	for (let i = 0; i < indexedInputs.length; i++) {
		const [param, argIndex] = indexedInputs[i];
		const topic = argTopics[i];
		if (!topic) {
			if (strict) throw new DecodeLogTopicsMismatch({
				abiItem,
				param
			});
			missingIndexedInputs.push([param, argIndex]);
			continue;
		}
		args[isUnnamed ? argIndex : param.name || argIndex] = decodeTopic({
			param,
			value: topic
		});
	}
	const nonIndexedInputs = inputs.filter((x) => !("indexed" in x && x.indexed));
	const inputsToDecode = strict ? nonIndexedInputs : [...missingIndexedInputs.map(([param]) => param), ...nonIndexedInputs];
	if (inputsToDecode.length > 0) {
		if (data && data !== "0x") try {
			const decodedData = decodeAbiParameters(inputsToDecode, data);
			if (decodedData) {
				let dataIndex = 0;
				if (!strict) for (const [param, argIndex] of missingIndexedInputs) args[isUnnamed ? argIndex : param.name || argIndex] = decodedData[dataIndex++];
				if (isUnnamed) {
					for (let i = 0; i < inputs.length; i++) if (args[i] === void 0 && dataIndex < decodedData.length) args[i] = decodedData[dataIndex++];
				} else for (let i = 0; i < nonIndexedInputs.length; i++) args[nonIndexedInputs[i].name] = decodedData[dataIndex++];
			}
		} catch (err) {
			if (strict) {
				if (err instanceof AbiDecodingDataSizeTooSmallError || err instanceof PositionOutOfBoundsError$1) throw new DecodeLogDataMismatch({
					abiItem,
					data,
					params: inputsToDecode,
					size: size$3(data)
				});
				throw err;
			}
		}
		else if (strict) throw new DecodeLogDataMismatch({
			abiItem,
			data: "0x",
			params: inputsToDecode,
			size: 0
		});
	}
	return {
		eventName: name,
		args: Object.values(args).length > 0 ? args : void 0
	};
}
function decodeTopic({ param, value }) {
	if (param.type === "string" || param.type === "bytes" || param.type === "tuple" || param.type.match(/^(.*)\[(\d+)?\]$/)) return value;
	return (decodeAbiParameters([param], value) || [])[0];
}
/**
* Thrown by {@link decodeEventLog} when an anonymous event log fits more than
* one requested anonymous event with the same number of indexed inputs.
*/
var AbiEventAmbiguityError = class extends BaseError$2 {
	constructor(eventNames) {
		const distinct = new Set(eventNames).size === eventNames.length;
		super("Ambiguous anonymous event log.", {
			docsPath: docsPath$4,
			metaMessages: [
				`Matched ${eventNames.map((name) => `\`${name}\``).join(", ")}.`,
				"These events take the same number of indexed topics.",
				distinct ? "Pass `eventName` to choose one." : "Pass an `abi` that holds only the event to decode."
			],
			name: "AbiEventAmbiguityError"
		});
	}
};
// ../../node_modules/viem/_esm/utils/abi/parseEventLogs.js
/**
* Extracts & decodes logs matching the provided signature(s) (`abi` + optional `eventName`)
* from a set of opaque logs.
*
* @param parameters - {@link ParseEventLogsParameters}
* @returns The logs. {@link ParseEventLogsReturnType}
*
* @example
* import { createClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { parseEventLogs } from 'viem/op-stack'
*
* const client = createClient({
*   chain: mainnet,
*   transport: http(),
* })
*
* const receipt = await getTransactionReceipt(client, {
*   hash: '0xec23b2ba4bc59ba61554507c1b1bc91649e6586eb2dd00c728e8ed0db8bb37ea',
* })
*
* const logs = parseEventLogs({ logs: receipt.logs })
* // [{ args: { ... }, eventName: 'TransactionDeposited', ... }, ...]
*/
function parseEventLogs(parameters) {
	const { abi, args, logs, strict = true } = parameters;
	const eventName = (() => {
		if (!parameters.eventName) return void 0;
		if (Array.isArray(parameters.eventName)) return parameters.eventName;
		return [parameters.eventName];
	})();
	const abiTopics = abi.filter((abiItem) => abiItem.type === "event").map((abiItem) => ({
		abi: abiItem,
		selector: toEventSelector(abiItem)
	}));
	const anonymousTopics = (() => {
		if (eventName) return abiTopics.filter((item) => item.abi.anonymous && eventName.includes(item.abi.name));
		if (abiTopics.every((item) => item.abi.anonymous)) return abiTopics;
		return [];
	})();
	return logs.map((log) => {
		const formattedLog = typeof log.blockNumber === "string" ? formatLog(log) : log;
		const bySelector = abiTopics.filter((item) => !item.abi.anonymous && formattedLog.topics[0] === item.selector);
		const abiItems = (() => {
			if (bySelector.length > 0) {
				if (!eventName) return bySelector;
				return bySelector.filter((item) => eventName.includes(item.abi.name));
			}
			const anonymous = anonymousTopics.filter((item) => (item.abi.inputs?.filter((input) => input.indexed).length ?? 0) === formattedLog.topics.length);
			if (anonymous.length === 1) return anonymous;
			return [];
		})();
		if (abiItems.length === 0) return null;
		let event;
		let abiItem;
		for (const item of abiItems) try {
			event = decodeEventLog({
				...formattedLog,
				abi: [item.abi],
				strict: true
			});
			abiItem = item;
			break;
		} catch {}
		if (!event && !strict) {
			const fallback = abiItems[0];
			if (!fallback || fallback.abi.anonymous) return null;
			abiItem = fallback;
			try {
				event = decodeEventLog({
					data: formattedLog.data,
					topics: formattedLog.topics,
					abi: [abiItem.abi],
					strict: false
				});
			} catch {
				const isUnnamed = abiItem.abi.inputs?.some((x) => !("name" in x && x.name));
				event = {
					eventName: abiItem.abi.name,
					args: isUnnamed ? [] : {}
				};
			}
		}
		if (!event || !abiItem) return null;
		if (eventName && !eventName.includes(event.eventName)) return null;
		if (!includesArgs({
			anonymous: abiItem.abi.anonymous,
			args: event.args,
			inputs: abiItem.abi.inputs,
			matchArgs: args,
			topics: formattedLog.topics
		})) return null;
		return {
			...event,
			...formattedLog
		};
	}).filter(Boolean);
}
function includesArgs(parameters) {
	const { anonymous, args, inputs, matchArgs, topics } = parameters;
	if (!matchArgs) return true;
	if (!args) return false;
	const topicInputs = inputs.filter((input) => input.indexed).slice(0, anonymous ? topics.length : topics.length - 1);
	function isEqual(input, value, arg) {
		try {
			if (input.type === "address") return isAddressEqual(value, arg);
			if (topicInputs.includes(input) && (input.type === "string" || input.type === "bytes")) {
				const bytes = input.type === "string" ? stringToBytes(value) : toBytes$1(value);
				return keccak256$1(bytes) === arg;
			}
			if (typeof value === "string" && typeof arg === "string" && bytesRegex$1.test(input.type)) return value.toLowerCase() === arg.toLowerCase();
			return value === arg;
		} catch {
			return false;
		}
	}
	if (Array.isArray(args) && Array.isArray(matchArgs)) return matchArgs.every((value, index) => {
		if (value === null || value === void 0) return true;
		const input = inputs[index];
		if (!input) return false;
		return (Array.isArray(value) ? value : [value]).some((value) => isEqual(input, value, args[index]));
	});
	if (typeof args === "object" && !Array.isArray(args) && typeof matchArgs === "object" && !Array.isArray(matchArgs)) return Object.entries(matchArgs).every(([key, value]) => {
		if (value === null || value === void 0) return true;
		const input = inputs.find((input) => input.name === key);
		if (!input) return false;
		return (Array.isArray(value) ? value : [value]).some((value) => isEqual(input, value, args[key]));
	});
	return false;
}
// ../../node_modules/viem/_esm/actions/public/getLogs.js
/**
* Returns a list of event logs matching the provided parameters.
*
* - Docs: https://viem.sh/docs/actions/public/getLogs
* - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/logs_event-logs
* - JSON-RPC Methods: [`eth_getLogs`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs)
*
* @param client - Client to use
* @param parameters - {@link GetLogsParameters}
* @returns A list of event logs. {@link GetLogsReturnType}
*
* @example
* import { createPublicClient, http, parseAbiItem } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getLogs } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const logs = await getLogs(client)
*/
async function getLogs(client, { address, blockHash, fromBlock, toBlock, event, events: events_, args, strict: strict_ } = {}) {
	const strict = strict_ ?? false;
	const events = events_ ?? (event ? [event] : void 0);
	let topics = [];
	if (events) {
		topics = [events.flatMap((event) => encodeEventTopics({
			abi: [event],
			eventName: event.name,
			args: events_ ? void 0 : args
		}))];
		if (event) topics = topics[0];
	}
	let logs;
	if (blockHash) logs = await client.request({
		method: "eth_getLogs",
		params: [{
			address,
			topics,
			blockHash
		}]
	});
	else logs = await client.request({
		method: "eth_getLogs",
		params: [{
			address,
			topics,
			fromBlock: typeof fromBlock === "bigint" ? numberToHex(fromBlock) : fromBlock,
			toBlock: typeof toBlock === "bigint" ? numberToHex(toBlock) : toBlock
		}]
	});
	const formattedLogs = logs.map((log) => formatLog(log));
	if (!events) return formattedLogs;
	return parseEventLogs({
		abi: events,
		args,
		logs: formattedLogs,
		strict
	});
}
// ../../node_modules/viem/_esm/actions/public/getContractEvents.js
/**
* Returns a list of event logs emitted by a contract.
*
* - Docs: https://viem.sh/docs/contract/getContractEvents#getcontractevents
* - JSON-RPC Methods: [`eth_getLogs`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs)
*
* @param client - Client to use
* @param parameters - {@link GetContractEventsParameters}
* @returns A list of event logs. {@link GetContractEventsReturnType}
*
* @example
* import { createClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getContractEvents } from 'viem/public'
* import { wagmiAbi } from './abi'
*
* const client = createClient({
*   chain: mainnet,
*   transport: http(),
* })
* const logs = await getContractEvents(client, {
*  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
*  abi: wagmiAbi,
*  eventName: 'Transfer'
* })
*/
async function getContractEvents(client, parameters) {
	const { abi, address, args, blockHash, eventName, fromBlock, toBlock, strict } = parameters;
	const event = eventName ? getAbiItem({
		abi,
		name: eventName
	}) : void 0;
	const events = !event ? abi.filter((x) => x.type === "event") : void 0;
	return getAction(client, getLogs, "getLogs")({
		address,
		args,
		blockHash,
		event,
		events,
		fromBlock,
		toBlock,
		strict
	});
}
// ../../node_modules/viem/_esm/utils/abi/decodeFunctionResult.js
var docsPath$3 = "/docs/contract/decodeFunctionResult";
function decodeFunctionResult(parameters) {
	const { abi, args, functionName, data } = parameters;
	let abiItem = abi[0];
	if (functionName) {
		const item = getAbiItem({
			abi,
			args,
			name: functionName
		});
		if (!item) throw new AbiFunctionNotFoundError(functionName, { docsPath: docsPath$3 });
		abiItem = item;
	}
	if (abiItem.type !== "function") throw new AbiFunctionNotFoundError(void 0, { docsPath: docsPath$3 });
	if (!abiItem.outputs) throw new AbiFunctionOutputsNotFoundError(abiItem.name, { docsPath: docsPath$3 });
	const values = decodeAbiParameters(abiItem.outputs, data);
	if (values && values.length > 1) return values;
	if (values && values.length === 1) return values[0];
}
// ../../node_modules/viem/node_modules/@noble/curves/esm/abstract/utils.js
/**
* Hex, bytes and number utilities.
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n$4 = /* @__PURE__ */ BigInt(0);
var _1n$4 = /* @__PURE__ */ BigInt(1);
function isBytes(a) {
	return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes(item) {
	if (!isBytes(item)) throw new Error("Uint8Array expected");
}
function abool(title, value) {
	if (typeof value !== "boolean") throw new Error(title + " boolean expected, got " + value);
}
function numberToHexUnpadded(num) {
	const hex = num.toString(16);
	return hex.length & 1 ? "0" + hex : hex;
}
function hexToNumber(hex) {
	if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
	return hex === "" ? _0n$4 : BigInt("0x" + hex);
}
var hasHexBuiltin = typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function";
var hexes$1 = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
/**
* Convert byte array to hex string. Uses built-in function, when available.
* @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
*/
function bytesToHex(bytes) {
	abytes(bytes);
	if (hasHexBuiltin) return bytes.toHex();
	let hex = "";
	for (let i = 0; i < bytes.length; i++) hex += hexes$1[bytes[i]];
	return hex;
}
var asciis = {
	_0: 48,
	_9: 57,
	A: 65,
	F: 70,
	a: 97,
	f: 102
};
function asciiToBase16(ch) {
	if (ch >= asciis._0 && ch <= asciis._9) return ch - asciis._0;
	if (ch >= asciis.A && ch <= asciis.F) return ch - (asciis.A - 10);
	if (ch >= asciis.a && ch <= asciis.f) return ch - (asciis.a - 10);
}
/**
* Convert hex string to byte array. Uses built-in function, when available.
* @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
*/
function hexToBytes(hex) {
	if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
	if (hasHexBuiltin) return Uint8Array.fromHex(hex);
	const hl = hex.length;
	const al = hl / 2;
	if (hl % 2) throw new Error("hex string expected, got unpadded hex of length " + hl);
	const array = new Uint8Array(al);
	for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
		const n1 = asciiToBase16(hex.charCodeAt(hi));
		const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
		if (n1 === void 0 || n2 === void 0) {
			const char = hex[hi] + hex[hi + 1];
			throw new Error("hex string expected, got non-hex character \"" + char + "\" at index " + hi);
		}
		array[ai] = n1 * 16 + n2;
	}
	return array;
}
function bytesToNumberBE(bytes) {
	return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
	abytes(bytes);
	return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
}
function numberToBytesBE(n, len) {
	return hexToBytes(n.toString(16).padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
	return numberToBytesBE(n, len).reverse();
}
/**
* Takes hex string or Uint8Array, converts to Uint8Array.
* Validates output length.
* Will throw error for other types.
* @param title descriptive title for an error e.g. 'private key'
* @param hex hex string or Uint8Array
* @param expectedLength optional, will compare to result array's length
* @returns
*/
function ensureBytes(title, hex, expectedLength) {
	let res;
	if (typeof hex === "string") try {
		res = hexToBytes(hex);
	} catch (e) {
		throw new Error(title + " must be hex string or Uint8Array, cause: " + e);
	}
	else if (isBytes(hex)) res = Uint8Array.from(hex);
	else throw new Error(title + " must be hex string or Uint8Array");
	const len = res.length;
	if (typeof expectedLength === "number" && len !== expectedLength) throw new Error(title + " of length " + expectedLength + " expected, got " + len);
	return res;
}
/**
* Copies several Uint8Arrays into one.
*/
function concatBytes(...arrays) {
	let sum = 0;
	for (let i = 0; i < arrays.length; i++) {
		const a = arrays[i];
		abytes(a);
		sum += a.length;
	}
	const res = new Uint8Array(sum);
	for (let i = 0, pad = 0; i < arrays.length; i++) {
		const a = arrays[i];
		res.set(a, pad);
		pad += a.length;
	}
	return res;
}
var isPosBig = (n) => typeof n === "bigint" && _0n$4 <= n;
function inRange(n, min, max) {
	return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
/**
* Asserts min <= n < max. NOTE: It's < max and not <= max.
* @example
* aInRange('x', x, 1n, 256n); // would assume x is in (1n..255n)
*/
function aInRange(title, n, min, max) {
	if (!inRange(n, min, max)) throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
/**
* Calculates amount of bits in a bigint.
* Same as `n.toString(2).length`
* TODO: merge with nLength in modular
*/
function bitLen(n) {
	let len = 0;
	for (; n > _0n$4; n >>= _1n$4, len += 1);
	return len;
}
/**
* Calculate mask for N bits. Not using ** operator with bigints because of old engines.
* Same as BigInt(`0b${Array(i).fill('1').join('')}`)
*/
var bitMask = (n) => (_1n$4 << BigInt(n)) - _1n$4;
var u8n = (len) => new Uint8Array(len);
var u8fr = (arr) => Uint8Array.from(arr);
/**
* Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
* @returns function that will call DRBG until 2nd arg returns something meaningful
* @example
*   const drbg = createHmacDRBG<Key>(32, 32, hmac);
*   drbg(seed, bytesToKey); // bytesToKey must return Key or undefined
*/
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
	if (typeof hashLen !== "number" || hashLen < 2) throw new Error("hashLen must be a number");
	if (typeof qByteLen !== "number" || qByteLen < 2) throw new Error("qByteLen must be a number");
	if (typeof hmacFn !== "function") throw new Error("hmacFn must be a function");
	let v = u8n(hashLen);
	let k = u8n(hashLen);
	let i = 0;
	const reset = () => {
		v.fill(1);
		k.fill(0);
		i = 0;
	};
	const h = (...b) => hmacFn(k, v, ...b);
	const reseed = (seed = u8n(0)) => {
		k = h(u8fr([0]), seed);
		v = h();
		if (seed.length === 0) return;
		k = h(u8fr([1]), seed);
		v = h();
	};
	const gen = () => {
		if (i++ >= 1e3) throw new Error("drbg: tried 1000 values");
		let len = 0;
		const out = [];
		while (len < qByteLen) {
			v = h();
			const sl = v.slice();
			out.push(sl);
			len += v.length;
		}
		return concatBytes(...out);
	};
	const genUntil = (seed, pred) => {
		reset();
		reseed(seed);
		let res = void 0;
		while (!(res = pred(gen()))) reseed();
		reset();
		return res;
	};
	return genUntil;
}
var validatorFns = {
	bigint: (val) => typeof val === "bigint",
	function: (val) => typeof val === "function",
	boolean: (val) => typeof val === "boolean",
	string: (val) => typeof val === "string",
	stringOrUint8Array: (val) => typeof val === "string" || isBytes(val),
	isSafeInteger: (val) => Number.isSafeInteger(val),
	array: (val) => Array.isArray(val),
	field: (val, object) => object.Fp.isValid(val),
	hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
};
function validateObject(object, validators, optValidators = {}) {
	const checkField = (fieldName, type, isOptional) => {
		const checkVal = validatorFns[type];
		if (typeof checkVal !== "function") throw new Error("invalid validator function");
		const val = object[fieldName];
		if (isOptional && val === void 0) return;
		if (!checkVal(val, object)) throw new Error("param " + String(fieldName) + " is invalid. Expected " + type + ", got " + val);
	};
	for (const [fieldName, type] of Object.entries(validators)) checkField(fieldName, type, false);
	for (const [fieldName, type] of Object.entries(optValidators)) checkField(fieldName, type, true);
	return object;
}
/**
* Memoizes (caches) computation result.
* Uses WeakMap: the value is going auto-cleaned by GC after last reference is removed.
*/
function memoized(fn) {
	const map = /* @__PURE__ */ new WeakMap();
	return (arg, ...args) => {
		const val = map.get(arg);
		if (val !== void 0) return val;
		const computed = fn(arg, ...args);
		map.set(arg, computed);
		return computed;
	};
}
// ../../node_modules/viem/node_modules/ox/_esm/core/version.js
/** @internal */
var version = "0.1.1";
// ../../node_modules/viem/node_modules/ox/_esm/core/internal/errors.js
/** @internal */
function getVersion() {
	return version;
}
// ../../node_modules/viem/node_modules/ox/_esm/core/Errors.js
/**
* Base error class inherited by all errors thrown by ox.
*
* @example
* ```ts
* import { Errors } from 'ox'
* throw new Errors.BaseError('An error occurred')
* ```
*/
var BaseError = class BaseError extends Error {
	static setStaticOptions(options) {
		BaseError.prototype.docsOrigin = options.docsOrigin;
		BaseError.prototype.showVersion = options.showVersion;
		BaseError.prototype.version = options.version;
	}
	constructor(shortMessage, options = {}) {
		const details = (() => {
			if (options.cause instanceof BaseError) {
				if (options.cause.details) return options.cause.details;
				if (options.cause.shortMessage) return options.cause.shortMessage;
			}
			if (options.cause && "details" in options.cause && typeof options.cause.details === "string") return options.cause.details;
			if (options.cause?.message) return options.cause.message;
			return options.details;
		})();
		const docsPath = (() => {
			if (options.cause instanceof BaseError) return options.cause.docsPath || options.docsPath;
			return options.docsPath;
		})();
		const docsBaseUrl = options.docsOrigin ?? BaseError.prototype.docsOrigin;
		const docs = `${docsBaseUrl}${docsPath ?? ""}`;
		const showVersion = Boolean(options.version ?? BaseError.prototype.showVersion);
		const version = options.version ?? BaseError.prototype.version;
		const message = [
			shortMessage || "An error occurred.",
			...options.metaMessages ? ["", ...options.metaMessages] : [],
			...details || docsPath || showVersion ? [
				"",
				details ? `Details: ${details}` : void 0,
				docsPath ? `See: ${docs}` : void 0,
				showVersion ? `Version: ${version}` : void 0
			] : []
		].filter((x) => typeof x === "string").join("\n");
		super(message, options.cause ? { cause: options.cause } : void 0);
		Object.defineProperty(this, "details", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "docs", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "docsOrigin", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "docsPath", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "shortMessage", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "showVersion", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "version", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "cause", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "BaseError"
		});
		this.cause = options.cause;
		this.details = details;
		this.docs = docs;
		this.docsOrigin = docsBaseUrl;
		this.docsPath = docsPath;
		this.shortMessage = shortMessage;
		this.showVersion = showVersion;
		this.version = version;
	}
	walk(fn) {
		return walk(this, fn);
	}
};
Object.defineProperty(BaseError, "defaultStaticOptions", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: {
		docsOrigin: "https://oxlib.sh",
		showVersion: false,
		version: `ox@${getVersion()}`
	}
});
(() => {
	BaseError.setStaticOptions(BaseError.defaultStaticOptions);
})();
/** @internal */
function walk(err, fn) {
	if (fn?.(err)) return err;
	if (err && typeof err === "object" && "cause" in err && err.cause) return walk(err.cause, fn);
	return fn ? null : err;
}
// ../../node_modules/viem/node_modules/ox/_esm/core/internal/bytes.js
/** @internal */
function assertSize$1(bytes, size_) {
	if (size$2(bytes) > size_) throw new SizeOverflowError$1({
		givenSize: size$2(bytes),
		maxSize: size_
	});
}
/** @internal */
function assertStartOffset$1(value, start) {
	if (typeof start === "number" && start > 0 && start > size$2(value) - 1) throw new SliceOffsetOutOfBoundsError$1({
		offset: start,
		position: "start",
		size: size$2(value)
	});
}
/** @internal */
function assertEndOffset$1(value, start, end) {
	if (typeof start === "number" && typeof end === "number" && size$2(value) !== end - start) throw new SliceOffsetOutOfBoundsError$1({
		offset: end,
		position: "end",
		size: size$2(value)
	});
}
/** @internal */
var charCodeMap = {
	zero: 48,
	nine: 57,
	A: 65,
	F: 70,
	a: 97,
	f: 102
};
/** @internal */
function charCodeToBase16(char) {
	if (char >= charCodeMap.zero && char <= charCodeMap.nine) return char - charCodeMap.zero;
	if (char >= charCodeMap.A && char <= charCodeMap.F) return char - (charCodeMap.A - 10);
	if (char >= charCodeMap.a && char <= charCodeMap.f) return char - (charCodeMap.a - 10);
}
/** @internal */
function pad$1(bytes, options = {}) {
	const { dir, size = 32 } = options;
	if (size === 0) return bytes;
	if (bytes.length > size) throw new SizeExceedsPaddingSizeError$1({
		size: bytes.length,
		targetSize: size,
		type: "Bytes"
	});
	const paddedBytes = new Uint8Array(size);
	for (let i = 0; i < size; i++) {
		const padEnd = dir === "right";
		paddedBytes[padEnd ? i : size - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
	}
	return paddedBytes;
}
/** @internal */
function trim(value, options = {}) {
	const { dir = "left" } = options;
	let data = value;
	let sliceLength = 0;
	for (let i = 0; i < data.length - 1; i++) if (data[dir === "left" ? i : data.length - i - 1].toString() === "0") sliceLength++;
	else break;
	data = dir === "left" ? data.slice(sliceLength) : data.slice(0, data.length - sliceLength);
	return data;
}
// ../../node_modules/viem/node_modules/ox/_esm/core/internal/hex.js
/** @internal */
function assertSize(hex, size_) {
	if (size$1(hex) > size_) throw new SizeOverflowError({
		givenSize: size$1(hex),
		maxSize: size_
	});
}
/** @internal */
function assertStartOffset(value, start) {
	if (typeof start === "number" && start > 0 && start > size$1(value) - 1) throw new SliceOffsetOutOfBoundsError({
		offset: start,
		position: "start",
		size: size$1(value)
	});
}
/** @internal */
function assertEndOffset(value, start, end) {
	if (typeof start === "number" && typeof end === "number" && size$1(value) !== end - start) throw new SliceOffsetOutOfBoundsError({
		offset: end,
		position: "end",
		size: size$1(value)
	});
}
/** @internal */
function pad(hex_, options = {}) {
	const { dir, size = 32 } = options;
	if (size === 0) return hex_;
	const hex = hex_.replace("0x", "");
	if (hex.length > size * 2) throw new SizeExceedsPaddingSizeError({
		size: Math.ceil(hex.length / 2),
		targetSize: size,
		type: "Hex"
	});
	return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size * 2, "0")}`;
}
// ../../node_modules/viem/node_modules/ox/_esm/core/Json.js
var bigIntSuffix = "#__bigint";
/**
* Stringifies a value to its JSON representation, with support for `bigint`.
*
* @example
* ```ts twoslash
* import { Json } from 'ox'
*
* const json = Json.stringify({
*   foo: 'bar',
*   baz: 69420694206942069420694206942069420694206942069420n,
* })
* // @log: '{"foo":"bar","baz":"69420694206942069420694206942069420694206942069420#__bigint"}'
* ```
*
* @param value - The value to stringify.
* @param replacer - A function that transforms the results. It is passed the key and value of the property, and must return the value to be used in the JSON string. If this function returns `undefined`, the property is not included in the resulting JSON string.
* @param space - A string or number that determines the indentation of the JSON string. If it is a number, it indicates the number of spaces to use as indentation; if it is a string (e.g. `'\t'`), it uses the string as the indentation character.
* @returns The JSON string.
*/
function stringify(value, replacer, space) {
	return JSON.stringify(value, (key, value) => {
		if (typeof replacer === "function") return replacer(key, value);
		if (typeof value === "bigint") return value.toString() + bigIntSuffix;
		return value;
	}, space);
}
// ../../node_modules/viem/node_modules/ox/_esm/core/Bytes.js
var decoder$2 = /*#__PURE__*/ new TextDecoder();
var encoder$2 = /*#__PURE__*/ new TextEncoder();
/**
* Instantiates a {@link ox#Bytes.Bytes} value from a `Uint8Array`, a hex string, or an array of unsigned 8-bit integers.
*
* :::tip
*
* To instantiate from a **Boolean**, **String**, or **Number**, use one of the following:
*
* - `Bytes.fromBoolean`
*
* - `Bytes.fromString`
*
* - `Bytes.fromNumber`
*
* :::
*
* @example
* ```ts twoslash
* // @noErrors
* import { Bytes } from 'ox'
*
* const data = Bytes.from([255, 124, 5, 4])
* // @log: Uint8Array([255, 124, 5, 4])
*
* const data = Bytes.from('0xdeadbeef')
* // @log: Uint8Array([222, 173, 190, 239])
* ```
*
* @param value - Value to convert.
* @returns A {@link ox#Bytes.Bytes} instance.
*/
function from$7(value) {
	if (value instanceof Uint8Array) return value;
	if (typeof value === "string") return fromHex(value);
	return fromArray(value);
}
/**
* Converts an array of unsigned 8-bit integers into {@link ox#Bytes.Bytes}.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* const data = Bytes.fromArray([255, 124, 5, 4])
* // @log: Uint8Array([255, 124, 5, 4])
* ```
*
* @param value - Value to convert.
* @returns A {@link ox#Bytes.Bytes} instance.
*/
function fromArray(value) {
	return value instanceof Uint8Array ? value : new Uint8Array(value);
}
/**
* Encodes a {@link ox#Hex.Hex} value into {@link ox#Bytes.Bytes}.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* const data = Bytes.fromHex('0x48656c6c6f20776f726c6421')
* // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
* ```
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* const data = Bytes.fromHex('0x48656c6c6f20776f726c6421', { size: 32 })
* // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
* ```
*
* @param value - {@link ox#Hex.Hex} value to encode.
* @param options - Encoding options.
* @returns Encoded {@link ox#Bytes.Bytes}.
*/
function fromHex(value, options = {}) {
	const { size } = options;
	let hex = value;
	if (size) {
		assertSize(value, size);
		hex = padRight(value, size);
	}
	let hexString = hex.slice(2);
	if (hexString.length % 2) hexString = `0${hexString}`;
	const length = hexString.length / 2;
	const bytes = new Uint8Array(length);
	for (let index = 0, j = 0; index < length; index++) {
		const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
		const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
		if (nibbleLeft === void 0 || nibbleRight === void 0) throw new BaseError(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
		bytes[index] = nibbleLeft << 4 | nibbleRight;
	}
	return bytes;
}
/**
* Encodes a string into {@link ox#Bytes.Bytes}.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* const data = Bytes.fromString('Hello world!')
* // @log: Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33])
* ```
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* const data = Bytes.fromString('Hello world!', { size: 32 })
* // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
* ```
*
* @param value - String to encode.
* @param options - Encoding options.
* @returns Encoded {@link ox#Bytes.Bytes}.
*/
function fromString$2(value, options = {}) {
	const { size } = options;
	const bytes = encoder$2.encode(value);
	if (typeof size === "number") {
		assertSize$1(bytes, size);
		return padRight$1(bytes, size);
	}
	return bytes;
}
/**
* Pads a {@link ox#Bytes.Bytes} value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* Bytes.padRight(Bytes.from([1]), 4)
* // @log: Uint8Array([1, 0, 0, 0])
* ```
*
* @param value - {@link ox#Bytes.Bytes} value to pad.
* @param size - Size to pad the {@link ox#Bytes.Bytes} value to.
* @returns Padded {@link ox#Bytes.Bytes} value.
*/
function padRight$1(value, size) {
	return pad$1(value, {
		dir: "right",
		size
	});
}
/**
* Retrieves the size of a {@link ox#Bytes.Bytes} value.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* Bytes.size(Bytes.from([1, 2, 3, 4]))
* // @log: 4
* ```
*
* @param value - {@link ox#Bytes.Bytes} value.
* @returns Size of the {@link ox#Bytes.Bytes} value.
*/
function size$2(value) {
	return value.length;
}
/**
* Returns a section of a {@link ox#Bytes.Bytes} value given a start/end bytes offset.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* Bytes.slice(
*   Bytes.from([1, 2, 3, 4, 5, 6, 7, 8, 9]),
*   1,
*   4,
* )
* // @log: Uint8Array([2, 3, 4])
* ```
*
* @param value - The {@link ox#Bytes.Bytes} value.
* @param start - Start offset.
* @param end - End offset.
* @param options - Slice options.
* @returns Sliced {@link ox#Bytes.Bytes} value.
*/
function slice$1(value, start, end, options = {}) {
	const { strict } = options;
	assertStartOffset$1(value, start);
	const value_ = value.slice(start, end);
	if (strict) assertEndOffset$1(value_, start, end);
	return value_;
}
/**
* Decodes a {@link ox#Bytes.Bytes} into a bigint.
*
* @example
* ```ts
* import { Bytes } from 'ox'
*
* Bytes.toBigInt(Bytes.from([1, 164]))
* // @log: 420n
* ```
*
* @param bytes - The {@link ox#Bytes.Bytes} to decode.
* @param options - Decoding options.
* @returns Decoded bigint.
*/
function toBigInt$1(bytes, options = {}) {
	const { size } = options;
	if (typeof size !== "undefined") assertSize$1(bytes, size);
	return toBigInt(fromBytes$1(bytes, options), options);
}
/**
* Decodes a {@link ox#Bytes.Bytes} into a boolean.
*
* @example
* ```ts
* import { Bytes } from 'ox'
*
* Bytes.toBoolean(Bytes.from([1]))
* // @log: true
* ```
*
* @param bytes - The {@link ox#Bytes.Bytes} to decode.
* @param options - Decoding options.
* @returns Decoded boolean.
*/
function toBoolean(bytes, options = {}) {
	const { size } = options;
	let bytes_ = bytes;
	if (typeof size !== "undefined") {
		assertSize$1(bytes_, size);
		bytes_ = trimLeft(bytes_);
	}
	if (bytes_.length > 1 || bytes_[0] > 1) throw new InvalidBytesBooleanError(bytes_);
	return Boolean(bytes_[0]);
}
/**
* Decodes a {@link ox#Bytes.Bytes} into a number.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* Bytes.toNumber(Bytes.from([1, 164]))
* // @log: 420
* ```
*/
function toNumber$1(bytes, options = {}) {
	const { size } = options;
	if (typeof size !== "undefined") assertSize$1(bytes, size);
	return toNumber(fromBytes$1(bytes, options), options);
}
/**
* Decodes a {@link ox#Bytes.Bytes} into a string.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* const data = Bytes.toString(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
* // @log: 'Hello world'
* ```
*
* @param bytes - The {@link ox#Bytes.Bytes} to decode.
* @param options - Options.
* @returns Decoded string.
*/
function toString$1(bytes, options = {}) {
	const { size } = options;
	let bytes_ = bytes;
	if (typeof size !== "undefined") {
		assertSize$1(bytes_, size);
		bytes_ = trimRight(bytes_);
	}
	return decoder$2.decode(bytes_);
}
/**
* Trims leading zeros from a {@link ox#Bytes.Bytes} value.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* Bytes.trimLeft(Bytes.from([0, 0, 0, 0, 1, 2, 3]))
* // @log: Uint8Array([1, 2, 3])
* ```
*
* @param value - {@link ox#Bytes.Bytes} value.
* @returns Trimmed {@link ox#Bytes.Bytes} value.
*/
function trimLeft(value) {
	return trim(value, { dir: "left" });
}
/**
* Trims trailing zeros from a {@link ox#Bytes.Bytes} value.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* Bytes.trimRight(Bytes.from([1, 2, 3, 0, 0, 0, 0]))
* // @log: Uint8Array([1, 2, 3])
* ```
*
* @param value - {@link ox#Bytes.Bytes} value.
* @returns Trimmed {@link ox#Bytes.Bytes} value.
*/
function trimRight(value) {
	return trim(value, { dir: "right" });
}
/**
* Thrown when the bytes value cannot be represented as a boolean.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* Bytes.toBoolean(Bytes.from([5]))
* // @error: Bytes.InvalidBytesBooleanError: Bytes value `[5]` is not a valid boolean.
* // @error: The bytes array must contain a single byte of either a `0` or `1` value.
* ```
*/
var InvalidBytesBooleanError = class extends BaseError {
	constructor(bytes) {
		super(`Bytes value \`${bytes}\` is not a valid boolean.`, { metaMessages: ["The bytes array must contain a single byte of either a `0` or `1` value."] });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Bytes.InvalidBytesBooleanError"
		});
	}
};
/**
* Thrown when a size exceeds the maximum allowed size.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* Bytes.fromString('Hello World!', { size: 8 })
* // @error: Bytes.SizeOverflowError: Size cannot exceed `8` bytes. Given size: `12` bytes.
* ```
*/
var SizeOverflowError$1 = class extends BaseError {
	constructor({ givenSize, maxSize }) {
		super(`Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Bytes.SizeOverflowError"
		});
	}
};
/**
* Thrown when a slice offset is out-of-bounds.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* Bytes.slice(Bytes.from([1, 2, 3]), 4)
* // @error: Bytes.SliceOffsetOutOfBoundsError: Slice starting at offset `4` is out-of-bounds (size: `3`).
* ```
*/
var SliceOffsetOutOfBoundsError$1 = class extends BaseError {
	constructor({ offset, position, size }) {
		super(`Slice ${position === "start" ? "starting" : "ending"} at offset \`${offset}\` is out-of-bounds (size: \`${size}\`).`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Bytes.SliceOffsetOutOfBoundsError"
		});
	}
};
/**
* Thrown when a the padding size exceeds the maximum allowed size.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* Bytes.padLeft(Bytes.fromString('Hello World!'), 8)
* // @error: [Bytes.SizeExceedsPaddingSizeError: Bytes size (`12`) exceeds padding size (`8`).
* ```
*/
var SizeExceedsPaddingSizeError$1 = class extends BaseError {
	constructor({ size, targetSize, type }) {
		super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (\`${size}\`) exceeds padding size (\`${targetSize}\`).`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Bytes.SizeExceedsPaddingSizeError"
		});
	}
};
// ../../node_modules/viem/node_modules/ox/_esm/core/Hex.js
var encoder$1 = /*#__PURE__*/ new TextEncoder();
var hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
/**
* Asserts if the given value is {@link ox#Hex.Hex}.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.assert('abc')
* // @error: InvalidHexValueTypeError:
* // @error: Value `"abc"` of type `string` is an invalid hex type.
* // @error: Hex types must be represented as `"0x\${string}"`.
* ```
*
* @param value - The value to assert.
* @param options - Options.
*/
function assert$4(value, options = {}) {
	const { even = false, strict = false } = options;
	if (!value) throw new InvalidHexTypeError(value);
	if (typeof value !== "string") throw new InvalidHexTypeError(value);
	if (strict) {
		if (!/^0x[0-9a-fA-F]*$/.test(value)) throw new InvalidHexValueError(value);
	}
	if (!value.startsWith("0x")) throw new InvalidHexValueError(value);
	if (even && value.length % 2 !== 0) throw new InvalidLengthError(value);
}
/**
* Concatenates two or more {@link ox#Hex.Hex}.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.concat('0x123', '0x456')
* // @log: '0x123456'
* ```
*
* @param values - The {@link ox#Hex.Hex} values to concatenate.
* @returns The concatenated {@link ox#Hex.Hex} value.
*/
function concat(...values) {
	return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
}
/**
* Encodes a boolean into a {@link ox#Hex.Hex} value.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.fromBoolean(true)
* // @log: '0x1'
*
* Hex.fromBoolean(false)
* // @log: '0x0'
*
* Hex.fromBoolean(true, { size: 32 })
* // @log: '0x0000000000000000000000000000000000000000000000000000000000000001'
* ```
*
* @param value - The boolean value to encode.
* @param options - Options.
* @returns The encoded {@link ox#Hex.Hex} value.
*/
function fromBoolean(value, options = {}) {
	const hex = `0x${Number(value)}`;
	if (typeof options.size === "number") {
		assertSize(hex, options.size);
		return padLeft(hex, options.size);
	}
	return hex;
}
/**
* Encodes a {@link ox#Bytes.Bytes} value into a {@link ox#Hex.Hex} value.
*
* @example
* ```ts twoslash
* import { Bytes, Hex } from 'ox'
*
* Hex.fromBytes(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
* // @log: '0x48656c6c6f20576f726c6421'
* ```
*
* @param value - The {@link ox#Bytes.Bytes} value to encode.
* @param options - Options.
* @returns The encoded {@link ox#Hex.Hex} value.
*/
function fromBytes$1(value, options = {}) {
	let string = "";
	for (let i = 0; i < value.length; i++) string += hexes[value[i]];
	const hex = `0x${string}`;
	if (typeof options.size === "number") {
		assertSize(hex, options.size);
		return padRight(hex, options.size);
	}
	return hex;
}
/**
* Encodes a number or bigint into a {@link ox#Hex.Hex} value.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.fromNumber(420)
* // @log: '0x1a4'
*
* Hex.fromNumber(420, { size: 32 })
* // @log: '0x00000000000000000000000000000000000000000000000000000000000001a4'
* ```
*
* @param value - The number or bigint value to encode.
* @param options - Options.
* @returns The encoded {@link ox#Hex.Hex} value.
*/
function fromNumber(value, options = {}) {
	const { signed, size } = options;
	const value_ = BigInt(value);
	let maxValue;
	if (size) {
		if (signed) maxValue = (1n << BigInt(size) * 8n - 1n) - 1n;
		else maxValue = 2n ** (BigInt(size) * 8n) - 1n;
	} else if (typeof value === "number") maxValue = BigInt(Number.MAX_SAFE_INTEGER);
	const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;
	if (maxValue && value_ > maxValue || value_ < minValue) {
		const suffix = typeof value === "bigint" ? "n" : "";
		throw new IntegerOutOfRangeError({
			max: maxValue ? `${maxValue}${suffix}` : void 0,
			min: `${minValue}${suffix}`,
			signed,
			size,
			value: `${value}${suffix}`
		});
	}
	const hex = `0x${(signed && value_ < 0 ? BigInt.asUintN(size * 8, BigInt(value_)) : value_).toString(16)}`;
	if (size) return padLeft(hex, size);
	return hex;
}
/**
* Encodes a string into a {@link ox#Hex.Hex} value.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
* Hex.fromString('Hello World!')
* // '0x48656c6c6f20576f726c6421'
*
* Hex.fromString('Hello World!', { size: 32 })
* // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
* ```
*
* @param value - The string value to encode.
* @param options - Options.
* @returns The encoded {@link ox#Hex.Hex} value.
*/
function fromString$1(value, options = {}) {
	return fromBytes$1(encoder$1.encode(value), options);
}
/**
* Pads a {@link ox#Hex.Hex} value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.padLeft('0x1234', 4)
* // @log: '0x00001234'
* ```
*
* @param value - The {@link ox#Hex.Hex} value to pad.
* @param size - The size (in bytes) of the output hex value.
* @returns The padded {@link ox#Hex.Hex} value.
*/
function padLeft(value, size) {
	return pad(value, {
		dir: "left",
		size
	});
}
/**
* Pads a {@link ox#Hex.Hex} value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).
*
* @example
* ```ts
* import { Hex } from 'ox'
*
* Hex.padRight('0x1234', 4)
* // @log: '0x12340000'
* ```
*
* @param value - The {@link ox#Hex.Hex} value to pad.
* @param size - The size (in bytes) of the output hex value.
* @returns The padded {@link ox#Hex.Hex} value.
*/
function padRight(value, size) {
	return pad(value, {
		dir: "right",
		size
	});
}
/**
* Returns a section of a {@link ox#Bytes.Bytes} value given a start/end bytes offset.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.slice('0x0123456789', 1, 4)
* // @log: '0x234567'
* ```
*
* @param value - The {@link ox#Hex.Hex} value to slice.
* @param start - The start offset (in bytes).
* @param end - The end offset (in bytes).
* @param options - Options.
* @returns The sliced {@link ox#Hex.Hex} value.
*/
function slice(value, start, end, options = {}) {
	const { strict } = options;
	assertStartOffset(value, start);
	const value_ = `0x${value.replace("0x", "").slice((start ?? 0) * 2, (end ?? value.length) * 2)}`;
	if (strict) assertEndOffset(value_, start, end);
	return value_;
}
/**
* Retrieves the size of a {@link ox#Hex.Hex} value (in bytes).
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.size('0xdeadbeef')
* // @log: 4
* ```
*
* @param value - The {@link ox#Hex.Hex} value to get the size of.
* @returns The size of the {@link ox#Hex.Hex} value (in bytes).
*/
function size$1(value) {
	return Math.ceil((value.length - 2) / 2);
}
/**
* Decodes a {@link ox#Hex.Hex} value into a BigInt.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.toBigInt('0x1a4')
* // @log: 420n
*
* Hex.toBigInt('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
* // @log: 420n
* ```
*
* @param hex - The {@link ox#Hex.Hex} value to decode.
* @param options - Options.
* @returns The decoded BigInt.
*/
function toBigInt(hex, options = {}) {
	const { signed } = options;
	if (options.size) assertSize(hex, options.size);
	const value = BigInt(hex);
	if (!signed) return value;
	const size = (hex.length - 2) / 2;
	const max_unsigned = (1n << BigInt(size) * 8n) - 1n;
	if (value <= max_unsigned >> 1n) return value;
	return value - max_unsigned - 1n;
}
/**
* Decodes a {@link ox#Hex.Hex} value into a number.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.toNumber('0x1a4')
* // @log: 420
*
* Hex.toNumber('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
* // @log: 420
* ```
*
* @param hex - The {@link ox#Hex.Hex} value to decode.
* @param options - Options.
* @returns The decoded number.
*/
function toNumber(hex, options = {}) {
	const { signed, size } = options;
	if (!signed && !size) return Number(hex);
	return Number(toBigInt(hex, options));
}
/**
* Checks if the given value is {@link ox#Hex.Hex}.
*
* @example
* ```ts twoslash
* import { Bytes, Hex } from 'ox'
*
* Hex.validate('0xdeadbeef')
* // @log: true
*
* Hex.validate(Bytes.from([1, 2, 3]))
* // @log: false
* ```
*
* @param value - The value to check.
* @param options - Options.
* @returns `true` if the value is a {@link ox#Hex.Hex}, `false` otherwise.
*/
function validate$3(value, options = {}) {
	const { even = false, strict = false } = options;
	try {
		assert$4(value, {
			even,
			strict
		});
		return true;
	} catch {
		return false;
	}
}
/**
* Thrown when the provided integer is out of range, and cannot be represented as a hex value.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.fromNumber(420182738912731283712937129)
* // @error: Hex.IntegerOutOfRangeError: Number \`4.2018273891273126e+26\` is not in safe unsigned integer range (`0` to `9007199254740991`)
* ```
*/
var IntegerOutOfRangeError = class extends BaseError {
	constructor({ max, min, signed, size, value }) {
		super(`Number \`${value}\` is not in safe${size ? ` ${size * 8}-bit` : ""}${signed ? " signed" : " unsigned"} integer range ${max ? `(\`${min}\` to \`${max}\`)` : `(above \`${min}\`)`}`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Hex.IntegerOutOfRangeError"
		});
	}
};
/**
* Thrown when the provided value is not a valid hex type.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.assert(1)
* // @error: Hex.InvalidHexTypeError: Value `1` of type `number` is an invalid hex type.
* ```
*/
var InvalidHexTypeError = class extends BaseError {
	constructor(value) {
		super(`Value \`${typeof value === "object" ? stringify(value) : value}\` of type \`${typeof value}\` is an invalid hex type.`, { metaMessages: ["Hex types must be represented as `\"0x${string}\"`."] });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Hex.InvalidHexTypeError"
		});
	}
};
/**
* Thrown when the provided hex value is invalid.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.assert('0x0123456789abcdefg')
* // @error: Hex.InvalidHexValueError: Value `0x0123456789abcdefg` is an invalid hex value.
* // @error: Hex values must start with `"0x"` and contain only hexadecimal characters (0-9, a-f, A-F).
* ```
*/
var InvalidHexValueError = class extends BaseError {
	constructor(value) {
		super(`Value \`${value}\` is an invalid hex value.`, { metaMessages: ["Hex values must start with `\"0x\"` and contain only hexadecimal characters (0-9, a-f, A-F)."] });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Hex.InvalidHexValueError"
		});
	}
};
/**
* Thrown when the provided hex value is an odd length.
*
* @example
* ```ts twoslash
* import { Bytes } from 'ox'
*
* Bytes.fromHex('0xabcde')
* // @error: Hex.InvalidLengthError: Hex value `"0xabcde"` is an odd length (5 nibbles).
* ```
*/
var InvalidLengthError = class extends BaseError {
	constructor(value) {
		super(`Hex value \`"${value}"\` is an odd length (${value.length - 2} nibbles).`, { metaMessages: ["It must be an even length."] });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Hex.InvalidLengthError"
		});
	}
};
/**
* Thrown when the size of the value exceeds the expected max size.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.fromString('Hello World!', { size: 8 })
* // @error: Hex.SizeOverflowError: Size cannot exceed `8` bytes. Given size: `12` bytes.
* ```
*/
var SizeOverflowError = class extends BaseError {
	constructor({ givenSize, maxSize }) {
		super(`Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Hex.SizeOverflowError"
		});
	}
};
/**
* Thrown when the slice offset exceeds the bounds of the value.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.slice('0x0123456789', 6)
* // @error: Hex.SliceOffsetOutOfBoundsError: Slice starting at offset `6` is out-of-bounds (size: `5`).
* ```
*/
var SliceOffsetOutOfBoundsError = class extends BaseError {
	constructor({ offset, position, size }) {
		super(`Slice ${position === "start" ? "starting" : "ending"} at offset \`${offset}\` is out-of-bounds (size: \`${size}\`).`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Hex.SliceOffsetOutOfBoundsError"
		});
	}
};
/**
* Thrown when the size of the value exceeds the pad size.
*
* @example
* ```ts twoslash
* import { Hex } from 'ox'
*
* Hex.padLeft('0x1a4e12a45a21323123aaa87a897a897a898a6567a578a867a98778a667a85a875a87a6a787a65a675a6a9', 32)
* // @error: Hex.SizeExceedsPaddingSizeError: Hex size (`43`) exceeds padding size (`32`).
* ```
*/
var SizeExceedsPaddingSizeError = class extends BaseError {
	constructor({ size, targetSize, type }) {
		super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (\`${size}\`) exceeds padding size (\`${targetSize}\`).`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Hex.SizeExceedsPaddingSizeError"
		});
	}
};
// ../../node_modules/viem/node_modules/ox/_esm/core/Withdrawal.js
/**
* Converts a {@link ox#Withdrawal.Withdrawal} to an {@link ox#Withdrawal.Rpc}.
*
* @example
* ```ts twoslash
* import { Withdrawal } from 'ox'
*
* const withdrawal = Withdrawal.toRpc({
*   address: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
*   amount: 6423331n,
*   index: 0,
*   validatorIndex: 1,
* })
* // @log: {
* // @log:   address: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
* // @log:   amount: '0x620323',
* // @log:   index: '0x0',
* // @log:   validatorIndex: '0x1',
* // @log: }
* ```
*
* @param withdrawal - The Withdrawal to convert.
* @returns An RPC Withdrawal.
*/
function toRpc$1(withdrawal) {
	return {
		address: withdrawal.address,
		amount: fromNumber(withdrawal.amount),
		index: fromNumber(withdrawal.index),
		validatorIndex: fromNumber(withdrawal.validatorIndex)
	};
}
// ../../node_modules/viem/node_modules/ox/_esm/core/BlockOverrides.js
/**
* Converts an {@link ox#BlockOverrides.BlockOverrides} to an {@link ox#BlockOverrides.Rpc}.
*
* @example
* ```ts twoslash
* import { BlockOverrides } from 'ox'
*
* const blockOverrides = BlockOverrides.toRpc({
*   baseFeePerGas: 1n,
*   blobBaseFee: 2n,
*   feeRecipient: '0x0000000000000000000000000000000000000000',
*   gasLimit: 4n,
*   number: 5n,
*   prevRandao: 6n,
*   time: 78187493520n,
*   withdrawals: [
*     {
*       address: '0x0000000000000000000000000000000000000000',
*       amount: 1n,
*       index: 0,
*       validatorIndex: 1,
*     },
*   ],
* })
* ```
*
* @param blockOverrides - The block overrides to convert.
* @returns An instantiated {@link ox#BlockOverrides.Rpc}.
*/
function toRpc(blockOverrides) {
	return {
		...typeof blockOverrides.baseFeePerGas === "bigint" && { baseFeePerGas: fromNumber(blockOverrides.baseFeePerGas) },
		...typeof blockOverrides.blobBaseFee === "bigint" && { blobBaseFee: fromNumber(blockOverrides.blobBaseFee) },
		...typeof blockOverrides.feeRecipient === "string" && { feeRecipient: blockOverrides.feeRecipient },
		...typeof blockOverrides.gasLimit === "bigint" && { gasLimit: fromNumber(blockOverrides.gasLimit) },
		...typeof blockOverrides.number === "bigint" && { number: fromNumber(blockOverrides.number) },
		...typeof blockOverrides.prevRandao === "bigint" && { prevRandao: fromNumber(blockOverrides.prevRandao) },
		...typeof blockOverrides.time === "bigint" && { time: fromNumber(blockOverrides.time) },
		...blockOverrides.withdrawals && { withdrawals: blockOverrides.withdrawals.map(toRpc$1) }
	};
}
// ../../node_modules/viem/_esm/constants/abis.js
var multicall3Abi = [
	{
		inputs: [{
			components: [
				{
					name: "target",
					type: "address"
				},
				{
					name: "allowFailure",
					type: "bool"
				},
				{
					name: "callData",
					type: "bytes"
				}
			],
			name: "calls",
			type: "tuple[]"
		}],
		name: "aggregate3",
		outputs: [{
			components: [{
				name: "success",
				type: "bool"
			}, {
				name: "returnData",
				type: "bytes"
			}],
			name: "returnData",
			type: "tuple[]"
		}],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [{
			name: "addr",
			type: "address"
		}],
		name: "getEthBalance",
		outputs: [{
			name: "balance",
			type: "uint256"
		}],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [],
		name: "getCurrentBlockTimestamp",
		outputs: [{
			internalType: "uint256",
			name: "timestamp",
			type: "uint256"
		}],
		stateMutability: "view",
		type: "function"
	}
];
var batchGatewayAbi = [{
	name: "query",
	type: "function",
	stateMutability: "view",
	inputs: [{
		type: "tuple[]",
		name: "queries",
		components: [
			{
				type: "address",
				name: "sender"
			},
			{
				type: "string[]",
				name: "urls"
			},
			{
				type: "bytes",
				name: "data"
			}
		]
	}],
	outputs: [{
		type: "bool[]",
		name: "failures"
	}, {
		type: "bytes[]",
		name: "responses"
	}]
}, {
	name: "HttpError",
	type: "error",
	inputs: [{
		type: "uint16",
		name: "status"
	}, {
		type: "string",
		name: "message"
	}]
}];
var universalResolverErrors = [
	{
		inputs: [{
			name: "dns",
			type: "bytes"
		}],
		name: "DNSDecodingFailed",
		type: "error"
	},
	{
		inputs: [{
			name: "ens",
			type: "string"
		}],
		name: "DNSEncodingFailed",
		type: "error"
	},
	{
		inputs: [],
		name: "EmptyAddress",
		type: "error"
	},
	{
		inputs: [{
			name: "status",
			type: "uint16"
		}, {
			name: "message",
			type: "string"
		}],
		name: "HttpError",
		type: "error"
	},
	{
		inputs: [],
		name: "InvalidBatchGatewayResponse",
		type: "error"
	},
	{
		inputs: [{
			name: "errorData",
			type: "bytes"
		}],
		name: "ResolverError",
		type: "error"
	},
	{
		inputs: [{
			name: "name",
			type: "bytes"
		}, {
			name: "resolver",
			type: "address"
		}],
		name: "ResolverNotContract",
		type: "error"
	},
	{
		inputs: [{
			name: "name",
			type: "bytes"
		}],
		name: "ResolverNotFound",
		type: "error"
	},
	{
		inputs: [{
			name: "primary",
			type: "string"
		}, {
			name: "primaryAddress",
			type: "bytes"
		}],
		name: "ReverseAddressMismatch",
		type: "error"
	},
	{
		inputs: [{
			internalType: "bytes4",
			name: "selector",
			type: "bytes4"
		}],
		name: "UnsupportedResolverProfile",
		type: "error"
	}
];
var universalResolverResolveAbi = [...universalResolverErrors, {
	name: "resolveWithGateways",
	type: "function",
	stateMutability: "view",
	inputs: [
		{
			name: "name",
			type: "bytes"
		},
		{
			name: "data",
			type: "bytes"
		},
		{
			name: "gateways",
			type: "string[]"
		}
	],
	outputs: [{
		name: "",
		type: "bytes"
	}, {
		name: "address",
		type: "address"
	}]
}];
var universalResolverReverseAbi = [...universalResolverErrors, {
	name: "reverseWithGateways",
	type: "function",
	stateMutability: "view",
	inputs: [
		{
			type: "bytes",
			name: "reverseName"
		},
		{
			type: "uint256",
			name: "coinType"
		},
		{
			type: "string[]",
			name: "gateways"
		}
	],
	outputs: [
		{
			type: "string",
			name: "resolvedName"
		},
		{
			type: "address",
			name: "resolver"
		},
		{
			type: "address",
			name: "reverseResolver"
		}
	]
}];
var textResolverAbi = [{
	name: "text",
	type: "function",
	stateMutability: "view",
	inputs: [{
		name: "name",
		type: "bytes32"
	}, {
		name: "key",
		type: "string"
	}],
	outputs: [{
		name: "",
		type: "string"
	}]
}];
var addressResolverAbi = [{
	name: "addr",
	type: "function",
	stateMutability: "view",
	inputs: [{
		name: "name",
		type: "bytes32"
	}],
	outputs: [{
		name: "",
		type: "address"
	}]
}, {
	name: "addr",
	type: "function",
	stateMutability: "view",
	inputs: [{
		name: "name",
		type: "bytes32"
	}, {
		name: "coinType",
		type: "uint256"
	}],
	outputs: [{
		name: "",
		type: "bytes"
	}]
}];
/** @internal */
var erc1271Abi = [{
	name: "isValidSignature",
	type: "function",
	stateMutability: "view",
	inputs: [{
		name: "hash",
		type: "bytes32"
	}, {
		name: "signature",
		type: "bytes"
	}],
	outputs: [{
		name: "",
		type: "bytes4"
	}]
}];
var erc6492SignatureValidatorAbi = [{
	inputs: [
		{
			name: "_signer",
			type: "address"
		},
		{
			name: "_hash",
			type: "bytes32"
		},
		{
			name: "_signature",
			type: "bytes"
		}
	],
	stateMutability: "nonpayable",
	type: "constructor"
}, {
	inputs: [
		{
			name: "_signer",
			type: "address"
		},
		{
			name: "_hash",
			type: "bytes32"
		},
		{
			name: "_signature",
			type: "bytes"
		}
	],
	outputs: [{ type: "bool" }],
	stateMutability: "nonpayable",
	type: "function",
	name: "isValidSig"
}];
/** [ERC-20 Token Standard](https://ethereum.org/en/developers/docs/standards/tokens/erc-20) */
var erc20Abi = [
	{
		type: "event",
		name: "Approval",
		inputs: [
			{
				indexed: true,
				name: "owner",
				type: "address"
			},
			{
				indexed: true,
				name: "spender",
				type: "address"
			},
			{
				indexed: false,
				name: "value",
				type: "uint256"
			}
		]
	},
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{
				indexed: true,
				name: "from",
				type: "address"
			},
			{
				indexed: true,
				name: "to",
				type: "address"
			},
			{
				indexed: false,
				name: "value",
				type: "uint256"
			}
		]
	},
	{
		type: "function",
		name: "allowance",
		stateMutability: "view",
		inputs: [{
			name: "owner",
			type: "address"
		}, {
			name: "spender",
			type: "address"
		}],
		outputs: [{ type: "uint256" }]
	},
	{
		type: "function",
		name: "approve",
		stateMutability: "nonpayable",
		inputs: [{
			name: "spender",
			type: "address"
		}, {
			name: "amount",
			type: "uint256"
		}],
		outputs: [{ type: "bool" }]
	},
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{
			name: "account",
			type: "address"
		}],
		outputs: [{ type: "uint256" }]
	},
	{
		type: "function",
		name: "decimals",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint8" }]
	},
	{
		type: "function",
		name: "name",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "string" }]
	},
	{
		type: "function",
		name: "symbol",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "string" }]
	},
	{
		type: "function",
		name: "totalSupply",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }]
	},
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [{
			name: "recipient",
			type: "address"
		}, {
			name: "amount",
			type: "uint256"
		}],
		outputs: [{ type: "bool" }]
	},
	{
		type: "function",
		name: "transferFrom",
		stateMutability: "nonpayable",
		inputs: [
			{
				name: "sender",
				type: "address"
			},
			{
				name: "recipient",
				type: "address"
			},
			{
				name: "amount",
				type: "uint256"
			}
		],
		outputs: [{ type: "bool" }]
	}
];
// ../../node_modules/viem/_esm/constants/contracts.js
var deploylessCallViaBytecodeBytecode = "0x608060405234801561001057600080fd5b5060405161018e38038061018e83398101604081905261002f91610124565b6000808351602085016000f59050803b61004857600080fd5b6000808351602085016000855af16040513d6000823e81610067573d81fd5b3d81f35b634e487b7160e01b600052604160045260246000fd5b600082601f83011261009257600080fd5b81516001600160401b038111156100ab576100ab61006b565b604051601f8201601f19908116603f011681016001600160401b03811182821017156100d9576100d961006b565b6040528181528382016020018510156100f157600080fd5b60005b82811015610110576020818601810151838301820152016100f4565b506000918101602001919091529392505050565b6000806040838503121561013757600080fd5b82516001600160401b0381111561014d57600080fd5b61015985828601610081565b602085015190935090506001600160401b0381111561017757600080fd5b61018385828601610081565b915050925092905056fe";
var deploylessCallViaFactoryBytecode = "0x608060405234801561001057600080fd5b506040516102c03803806102c083398101604081905261002f916101e6565b836001600160a01b03163b6000036100e457600080836001600160a01b03168360405161005c9190610270565b6000604051808303816000865af19150503d8060008114610099576040519150601f19603f3d011682016040523d82523d6000602084013e61009e565b606091505b50915091508115806100b857506001600160a01b0386163b155b156100e1578060405163101bb98d60e01b81526004016100d8919061028c565b60405180910390fd5b50505b6000808451602086016000885af16040513d6000823e81610103573d81fd5b3d81f35b80516001600160a01b038116811461011e57600080fd5b919050565b634e487b7160e01b600052604160045260246000fd5b60005b8381101561015457818101518382015260200161013c565b50506000910152565b600082601f83011261016e57600080fd5b81516001600160401b0381111561018757610187610123565b604051601f8201601f19908116603f011681016001600160401b03811182821017156101b5576101b5610123565b6040528181528382016020018510156101cd57600080fd5b6101de826020830160208701610139565b949350505050565b600080600080608085870312156101fc57600080fd5b61020585610107565b60208601519094506001600160401b0381111561022157600080fd5b61022d8782880161015d565b93505061023c60408601610107565b60608601519092506001600160401b0381111561025857600080fd5b6102648782880161015d565b91505092959194509250565b60008251610282818460208701610139565b9190910192915050565b60208152600082518060208401526102ab816040850160208701610139565b601f01601f1916919091016040019291505056fe";
var erc6492SignatureValidatorByteCode = "0x608060405234801561001057600080fd5b5060405161069438038061069483398101604081905261002f9161051e565b600061003c848484610048565b9050806000526001601ff35b60007f64926492649264926492649264926492649264926492649264926492649264926100748361040c565b036101e7576000606080848060200190518101906100929190610577565b60405192955090935091506000906001600160a01b038516906100b69085906105dd565b6000604051808303816000865af19150503d80600081146100f3576040519150601f19603f3d011682016040523d82523d6000602084013e6100f8565b606091505b50509050876001600160a01b03163b60000361016057806101605760405162461bcd60e51b815260206004820152601e60248201527f5369676e617475726556616c696461746f723a206465706c6f796d656e74000060448201526064015b60405180910390fd5b604051630b135d3f60e11b808252906001600160a01b038a1690631626ba7e90610190908b9087906004016105f9565b602060405180830381865afa1580156101ad573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101d19190610633565b6001600160e01b03191614945050505050610405565b6001600160a01b0384163b1561027a57604051630b135d3f60e11b808252906001600160a01b03861690631626ba7e9061022790879087906004016105f9565b602060405180830381865afa158015610244573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102689190610633565b6001600160e01b031916149050610405565b81516041146102df5760405162461bcd60e51b815260206004820152603a602482015260008051602061067483398151915260448201527f3a20696e76616c6964207369676e6174757265206c656e6774680000000000006064820152608401610157565b6102e7610425565b5060208201516040808401518451859392600091859190811061030c5761030c61065d565b016020015160f81c9050601b811480159061032b57508060ff16601c14155b1561038c5760405162461bcd60e51b815260206004820152603b602482015260008051602061067483398151915260448201527f3a20696e76616c6964207369676e617475726520762076616c756500000000006064820152608401610157565b60408051600081526020810180835289905260ff83169181019190915260608101849052608081018390526001600160a01b0389169060019060a0016020604051602081039080840390855afa1580156103ea573d6000803e3d6000fd5b505050602060405103516001600160a01b0316149450505050505b9392505050565b600060208251101561041d57600080fd5b508051015190565b60405180606001604052806003906020820280368337509192915050565b6001600160a01b038116811461045857600080fd5b50565b634e487b7160e01b600052604160045260246000fd5b60005b8381101561048c578181015183820152602001610474565b50506000910152565b600082601f8301126104a657600080fd5b81516001600160401b038111156104bf576104bf61045b565b604051601f8201601f19908116603f011681016001600160401b03811182821017156104ed576104ed61045b565b60405281815283820160200185101561050557600080fd5b610516826020830160208701610471565b949350505050565b60008060006060848603121561053357600080fd5b835161053e81610443565b6020850151604086015191945092506001600160401b0381111561056157600080fd5b61056d86828701610495565b9150509250925092565b60008060006060848603121561058c57600080fd5b835161059781610443565b60208501519093506001600160401b038111156105b357600080fd5b6105bf86828701610495565b604086015190935090506001600160401b0381111561056157600080fd5b600082516105ef818460208701610471565b9190910192915050565b828152604060208201526000825180604084015261061e816060850160208701610471565b601f01601f1916919091016060019392505050565b60006020828403121561064557600080fd5b81516001600160e01b03198116811461040557600080fd5b634e487b7160e01b600052603260045260246000fdfe5369676e617475726556616c696461746f72237265636f7665725369676e6572";
var multicall3Bytecode = "0x608060405234801561001057600080fd5b506115b9806100206000396000f3fe6080604052600436106100f35760003560e01c80634d2301cc1161008a578063a8b0574e11610059578063a8b0574e14610325578063bce38bd714610350578063c3077fa914610380578063ee82ac5e146103b2576100f3565b80634d2301cc1461026257806372425d9d1461029f57806382ad56cb146102ca57806386d516e8146102fa576100f3565b80633408e470116100c65780633408e470146101af578063399542e9146101da5780633e64a6961461020c57806342cbb15c14610237576100f3565b80630f28c97d146100f8578063174dea7114610123578063252dba421461015357806327e86d6e14610184575b600080fd5b34801561010457600080fd5b5061010d6103ef565b60405161011a9190610c0a565b60405180910390f35b61013d60048036038101906101389190610c94565b6103f7565b60405161014a9190610e94565b60405180910390f35b61016d60048036038101906101689190610f0c565b610615565b60405161017b92919061101b565b60405180910390f35b34801561019057600080fd5b506101996107ab565b6040516101a69190611064565b60405180910390f35b3480156101bb57600080fd5b506101c46107b7565b6040516101d19190610c0a565b60405180910390f35b6101f460048036038101906101ef91906110ab565b6107bf565b6040516102039392919061110b565b60405180910390f35b34801561021857600080fd5b506102216107e1565b60405161022e9190610c0a565b60405180910390f35b34801561024357600080fd5b5061024c6107e9565b6040516102599190610c0a565b60405180910390f35b34801561026e57600080fd5b50610289600480360381019061028491906111a7565b6107f1565b6040516102969190610c0a565b60405180910390f35b3480156102ab57600080fd5b506102b4610812565b6040516102c19190610c0a565b60405180910390f35b6102e460048036038101906102df919061122a565b61081a565b6040516102f19190610e94565b60405180910390f35b34801561030657600080fd5b5061030f6109e4565b60405161031c9190610c0a565b60405180910390f35b34801561033157600080fd5b5061033a6109ec565b6040516103479190611286565b60405180910390f35b61036a600480360381019061036591906110ab565b6109f4565b6040516103779190610e94565b60405180910390f35b61039a60048036038101906103959190610f0c565b610ba6565b6040516103a99392919061110b565b60405180910390f35b3480156103be57600080fd5b506103d960048036038101906103d491906112cd565b610bca565b6040516103e69190611064565b60405180910390f35b600042905090565b60606000808484905090508067ffffffffffffffff81111561041c5761041b6112fa565b5b60405190808252806020026020018201604052801561045557816020015b610442610bd5565b81526020019060019003908161043a5790505b5092503660005b828110156105c957600085828151811061047957610478611329565b5b6020026020010151905087878381811061049657610495611329565b5b90506020028101906104a89190611367565b925060008360400135905080860195508360000160208101906104cb91906111a7565b73ffffffffffffffffffffffffffffffffffffffff16818580606001906104f2919061138f565b604051610500929190611431565b60006040518083038185875af1925050503d806000811461053d576040519150601f19603f3d011682016040523d82523d6000602084013e610542565b606091505b5083600001846020018290528215151515815250505081516020850135176105bc577f08c379a000000000000000000000000000000000000000000000000000000000600052602060045260176024527f4d756c746963616c6c333a2063616c6c206661696c656400000000000000000060445260846000fd5b826001019250505061045c565b5082341461060c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610603906114a7565b60405180910390fd5b50505092915050565b6000606043915060008484905090508067ffffffffffffffff81111561063e5761063d6112fa565b5b60405190808252806020026020018201604052801561067157816020015b606081526020019060019003908161065c5790505b5091503660005b828110156107a157600087878381811061069557610694611329565b5b90506020028101906106a791906114c7565b92508260000160208101906106bc91906111a7565b73ffffffffffffffffffffffffffffffffffffffff168380602001906106e2919061138f565b6040516106f0929190611431565b6000604051808303816000865af19150503d806000811461072d576040519150601f19603f3d011682016040523d82523d6000602084013e610732565b606091505b5086848151811061074657610745611329565b5b60200260200101819052819250505080610795576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161078c9061153b565b60405180910390fd5b81600101915050610678565b5050509250929050565b60006001430340905090565b600046905090565b6000806060439250434091506107d68686866109f4565b905093509350939050565b600048905090565b600043905090565b60008173ffffffffffffffffffffffffffffffffffffffff16319050919050565b600044905090565b606060008383905090508067ffffffffffffffff81111561083e5761083d6112fa565b5b60405190808252806020026020018201604052801561087757816020015b610864610bd5565b81526020019060019003908161085c5790505b5091503660005b828110156109db57600084828151811061089b5761089a611329565b5b602002602001015190508686838181106108b8576108b7611329565b5b90506020028101906108ca919061155b565b92508260000160208101906108df91906111a7565b73ffffffffffffffffffffffffffffffffffffffff16838060400190610905919061138f565b604051610913929190611431565b6000604051808303816000865af19150503d8060008114610950576040519150601f19603f3d011682016040523d82523d6000602084013e610955565b606091505b5082600001836020018290528215151515815250505080516020840135176109cf577f08c379a000000000000000000000000000000000000000000000000000000000600052602060045260176024527f4d756c746963616c6c333a2063616c6c206661696c656400000000000000000060445260646000fd5b8160010191505061087e565b50505092915050565b600045905090565b600041905090565b606060008383905090508067ffffffffffffffff811115610a1857610a176112fa565b5b604051908082528060200260200182016040528015610a5157816020015b610a3e610bd5565b815260200190600190039081610a365790505b5091503660005b82811015610b9c576000848281518110610a7557610a74611329565b5b60200260200101519050868683818110610a9257610a91611329565b5b9050602002810190610aa491906114c7565b9250826000016020810190610ab991906111a7565b73ffffffffffffffffffffffffffffffffffffffff16838060200190610adf919061138f565b604051610aed929190611431565b6000604051808303816000865af19150503d8060008114610b2a576040519150601f19603f3d011682016040523d82523d6000602084013e610b2f565b606091505b508260000183602001829052821515151581525050508715610b90578060000151610b8f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b869061153b565b60405180910390fd5b5b81600101915050610a58565b5050509392505050565b6000806060610bb7600186866107bf565b8093508194508295505050509250925092565b600081409050919050565b6040518060400160405280600015158152602001606081525090565b6000819050919050565b610c0481610bf1565b82525050565b6000602082019050610c1f6000830184610bfb565b92915050565b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b60008083601f840112610c5457610c53610c2f565b5b8235905067ffffffffffffffff811115610c7157610c70610c34565b5b602083019150836020820283011115610c8d57610c8c610c39565b5b9250929050565b60008060208385031215610cab57610caa610c25565b5b600083013567ffffffffffffffff811115610cc957610cc8610c2a565b5b610cd585828601610c3e565b92509250509250929050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b60008115159050919050565b610d2281610d0d565b82525050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610d62578082015181840152602081019050610d47565b83811115610d71576000848401525b50505050565b6000601f19601f8301169050919050565b6000610d9382610d28565b610d9d8185610d33565b9350610dad818560208601610d44565b610db681610d77565b840191505092915050565b6000604083016000830151610dd96000860182610d19565b5060208301518482036020860152610df18282610d88565b9150508091505092915050565b6000610e0a8383610dc1565b905092915050565b6000602082019050919050565b6000610e2a82610ce1565b610e348185610cec565b935083602082028501610e4685610cfd565b8060005b85811015610e825784840389528151610e638582610dfe565b9450610e6e83610e12565b925060208a01995050600181019050610e4a565b50829750879550505050505092915050565b60006020820190508181036000830152610eae8184610e1f565b905092915050565b60008083601f840112610ecc57610ecb610c2f565b5b8235905067ffffffffffffffff811115610ee957610ee8610c34565b5b602083019150836020820283011115610f0557610f04610c39565b5b9250929050565b60008060208385031215610f2357610f22610c25565b5b600083013567ffffffffffffffff811115610f4157610f40610c2a565b5b610f4d85828601610eb6565b92509250509250929050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b6000610f918383610d88565b905092915050565b6000602082019050919050565b6000610fb182610f59565b610fbb8185610f64565b935083602082028501610fcd85610f75565b8060005b858110156110095784840389528151610fea8582610f85565b9450610ff583610f99565b925060208a01995050600181019050610fd1565b50829750879550505050505092915050565b60006040820190506110306000830185610bfb565b81810360208301526110428184610fa6565b90509392505050565b6000819050919050565b61105e8161104b565b82525050565b60006020820190506110796000830184611055565b92915050565b61108881610d0d565b811461109357600080fd5b50565b6000813590506110a58161107f565b92915050565b6000806000604084860312156110c4576110c3610c25565b5b60006110d286828701611096565b935050602084013567ffffffffffffffff8111156110f3576110f2610c2a565b5b6110ff86828701610eb6565b92509250509250925092565b60006060820190506111206000830186610bfb565b61112d6020830185611055565b818103604083015261113f8184610e1f565b9050949350505050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061117482611149565b9050919050565b61118481611169565b811461118f57600080fd5b50565b6000813590506111a18161117b565b92915050565b6000602082840312156111bd576111bc610c25565b5b60006111cb84828501611192565b91505092915050565b60008083601f8401126111ea576111e9610c2f565b5b8235905067ffffffffffffffff81111561120757611206610c34565b5b60208301915083602082028301111561122357611222610c39565b5b9250929050565b6000806020838503121561124157611240610c25565b5b600083013567ffffffffffffffff81111561125f5761125e610c2a565b5b61126b858286016111d4565b92509250509250929050565b61128081611169565b82525050565b600060208201905061129b6000830184611277565b92915050565b6112aa81610bf1565b81146112b557600080fd5b50565b6000813590506112c7816112a1565b92915050565b6000602082840312156112e3576112e2610c25565b5b60006112f1848285016112b8565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b600080fd5b600080fd5b600080fd5b60008235600160800383360303811261138357611382611358565b5b80830191505092915050565b600080833560016020038436030381126113ac576113ab611358565b5b80840192508235915067ffffffffffffffff8211156113ce576113cd61135d565b5b6020830192506001820236038313156113ea576113e9611362565b5b509250929050565b600081905092915050565b82818337600083830152505050565b600061141883856113f2565b93506114258385846113fd565b82840190509392505050565b600061143e82848661140c565b91508190509392505050565b600082825260208201905092915050565b7f4d756c746963616c6c333a2076616c7565206d69736d61746368000000000000600082015250565b6000611491601a8361144a565b915061149c8261145b565b602082019050919050565b600060208201905081810360008301526114c081611484565b9050919050565b6000823560016040038336030381126114e3576114e2611358565b5b80830191505092915050565b7f4d756c746963616c6c333a2063616c6c206661696c6564000000000000000000600082015250565b600061152560178361144a565b9150611530826114ef565b602082019050919050565b6000602082019050818103600083015261155481611518565b9050919050565b60008235600160600383360303811261157757611576611358565b5b8083019150509291505056fea264697066735822122020c1bc9aacf8e4a6507193432a895a8e77094f45a1395583f07b24e860ef06cd64736f6c634300080c0033";
// ../../node_modules/viem/_esm/errors/chain.js
var ChainDoesNotSupportContract = class extends BaseError$2 {
	constructor({ blockNumber, chain, contract }) {
		super(`Chain "${chain.name}" does not support contract "${contract.name}".`, {
			metaMessages: ["This could be due to any of the following:", ...blockNumber && contract.blockCreated && contract.blockCreated > blockNumber ? [`- The contract "${contract.name}" was not deployed until block ${contract.blockCreated} (current block ${blockNumber}).`] : [`- The chain does not have the contract "${contract.name}" configured.`]],
			name: "ChainDoesNotSupportContract"
		});
	}
};
var ClientChainNotConfiguredError = class extends BaseError$2 {
	constructor() {
		super("No chain was provided to the Client.", { name: "ClientChainNotConfiguredError" });
	}
};
// ../../node_modules/viem/_esm/utils/abi/encodeDeployData.js
var docsPath$2 = "/docs/contract/encodeDeployData";
function encodeDeployData(parameters) {
	const { abi, args, bytecode } = parameters;
	if (!args || args.length === 0) return bytecode;
	const description = abi.find((x) => "type" in x && x.type === "constructor");
	if (!description) throw new AbiConstructorNotFoundError({ docsPath: docsPath$2 });
	if (!("inputs" in description)) throw new AbiConstructorParamsNotFoundError({ docsPath: docsPath$2 });
	if (!description.inputs || description.inputs.length === 0) throw new AbiConstructorParamsNotFoundError({ docsPath: docsPath$2 });
	return concatHex([bytecode, encodeAbiParameters(description.inputs, args)]);
}
// ../../node_modules/viem/_esm/utils/chain/getChainContractAddress.js
function getChainContractAddress({ blockNumber, chain, contract: name }) {
	const contract = chain?.contracts?.[name];
	if (!contract) throw new ChainDoesNotSupportContract({
		chain,
		contract: { name }
	});
	if (blockNumber && contract.blockCreated && contract.blockCreated > blockNumber) throw new ChainDoesNotSupportContract({
		blockNumber,
		chain,
		contract: {
			name,
			blockCreated: contract.blockCreated
		}
	});
	return contract.address;
}
// ../../node_modules/viem/_esm/utils/errors/getCallError.js
function getCallError(err, { docsPath, ...args }) {
	return new CallExecutionError((() => {
		const cause = getNodeError(err, args);
		if (cause instanceof UnknownNodeError) return err;
		return cause;
	})(), {
		docsPath,
		...args
	});
}
// ../../node_modules/viem/_esm/utils/promise/withResolvers.js
/** @internal */
function withResolvers() {
	let resolve = () => void 0;
	let reject = () => void 0;
	return {
		promise: new Promise((resolve_, reject_) => {
			resolve = resolve_;
			reject = reject_;
		}),
		resolve,
		reject
	};
}
// ../../node_modules/viem/_esm/utils/promise/createBatchScheduler.js
var schedulerCache = /*#__PURE__*/ new Map();
/** @internal */
function createBatchScheduler({ fn, id, shouldSplitBatch, wait = 0, sort }) {
	const exec = async () => {
		const scheduler = getScheduler();
		flush();
		const args = scheduler.map(({ args }) => args);
		if (args.length === 0) return;
		fn(args).then((data) => {
			if (sort && Array.isArray(data)) data.sort(sort);
			for (let i = 0; i < scheduler.length; i++) {
				const { resolve } = scheduler[i];
				resolve?.([data[i], data]);
			}
		}).catch((err) => {
			for (let i = 0; i < scheduler.length; i++) {
				const { reject } = scheduler[i];
				reject?.(err);
			}
		});
	};
	const flush = () => schedulerCache.delete(id);
	const getBatchedArgs = () => getScheduler().map(({ args }) => args);
	const getScheduler = () => schedulerCache.get(id) || [];
	const setScheduler = (item) => schedulerCache.set(id, [...getScheduler(), item]);
	return {
		flush,
		async schedule(args) {
			const { promise, resolve, reject } = withResolvers();
			if (shouldSplitBatch?.([...getBatchedArgs(), args])) exec();
			if (getScheduler().length > 0) {
				setScheduler({
					args,
					resolve,
					reject
				});
				return promise;
			}
			setScheduler({
				args,
				resolve,
				reject
			});
			setTimeout(exec, wait);
			return promise;
		}
	};
}
// ../../node_modules/viem/_esm/actions/public/call.js
/**
* Executes a new message call immediately without submitting a transaction to the network.
*
* - Docs: https://viem.sh/docs/actions/public/call
* - JSON-RPC Methods: [`eth_call`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_call)
*
* @param client - Client to use
* @param parameters - {@link CallParameters}
* @returns The call data. {@link CallReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { call } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const data = await call(client, {
*   account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
*   data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
*   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
* })
*/
async function call(client, args) {
	const { account: account_ = client.account, authorizationList, batch = Boolean(client.batch?.multicall), blockHash, blockNumber, blockTag = client.experimental_blockTag ?? "latest", requireCanonical, accessList, blobs, blockOverrides, code, data: data_, factory, factoryData, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, nonce, requestOptions, to, value, stateOverride, ...rest } = args;
	const account = account_ ? parseAccount(account_) : void 0;
	if (code && (factory || factoryData)) throw new BaseError$2("Cannot provide both `code` & `factory`/`factoryData` as parameters.");
	if (code && to) throw new BaseError$2("Cannot provide both `code` & `to` as parameters.");
	const deploylessCallViaBytecode = code && data_;
	const deploylessCallViaFactory = factory && factoryData && to && data_;
	const deploylessCall = deploylessCallViaBytecode || deploylessCallViaFactory;
	const data = (() => {
		if (deploylessCallViaBytecode) return toDeploylessCallViaBytecodeData({
			code,
			data: data_
		});
		if (deploylessCallViaFactory) return toDeploylessCallViaFactoryData({
			data: data_,
			factory,
			factoryData,
			to
		});
		return data_;
	})();
	try {
		assertRequest(args);
		const block = formatBlockParameter({
			blockHash,
			blockNumber,
			blockTag,
			requireCanonical
		});
		const rpcBlockOverrides = blockOverrides ? toRpc(blockOverrides) : void 0;
		const rpcStateOverride = serializeStateOverride(stateOverride);
		const chainFormat = client.chain?.formatters?.transactionRequest?.format;
		const request = (chainFormat || formatTransactionRequest)({
			...extract(rest, { format: chainFormat }),
			accessList,
			account,
			authorizationList,
			blobs,
			data,
			gas,
			gasPrice,
			maxFeePerBlobGas,
			maxFeePerGas,
			maxPriorityFeePerGas,
			nonce,
			to: deploylessCall ? void 0 : to,
			value
		}, "call");
		if (batch && shouldPerformMulticall({ request }) && !rpcBlockOverrides && blockHash === void 0) try {
			const { deployless = false } = typeof client.batch?.multicall === "object" ? client.batch.multicall : {};
			const multicallAddress = getMulticallAddress(client, {
				blockNumber,
				deployless
			});
			if (!multicallAddress || !hasStateOverrideForAddress(rpcStateOverride, multicallAddress)) return await scheduleMulticall$1(client, {
				...request,
				blockHash,
				blockNumber,
				blockTag,
				multicallAddress,
				requestOptions,
				requireCanonical,
				rpcStateOverride
			});
		} catch (err) {
			if (!(err instanceof ClientChainNotConfiguredError) && !(err instanceof ChainDoesNotSupportContract)) throw err;
		}
		const params = (() => {
			const base = [request, block];
			if (rpcStateOverride && rpcBlockOverrides) return [
				...base,
				rpcStateOverride,
				rpcBlockOverrides
			];
			if (rpcStateOverride) return [...base, rpcStateOverride];
			if (rpcBlockOverrides) return [
				...base,
				{},
				rpcBlockOverrides
			];
			return base;
		})();
		const response = await client.request({
			method: "eth_call",
			params
		}, requestOptions);
		if (response === "0x") return { data: void 0 };
		return { data: response };
	} catch (err) {
		if (requestOptions?.signal?.aborted) throw getAbortError(requestOptions.signal);
		if (isAbortError(err)) throw err;
		const data = getRevertErrorData(err);
		const { offchainLookup, offchainLookupSignature } = await import("./_ccip-6nO9pUKg.js");
		if (client.ccipRead !== false && data?.slice(0, 10) === offchainLookupSignature && to) return { data: await offchainLookup(client, {
			data,
			requestOptions,
			to
		}) };
		if (deploylessCall && data?.slice(0, 10) === "0x101bb98d") throw new CounterfactualDeploymentFailedError({ factory });
		throw getCallError(err, {
			...args,
			account,
			chain: client.chain
		});
	}
}
function shouldPerformMulticall({ request }) {
	const { data, to, ...request_ } = request;
	if (!data) return false;
	if (data.startsWith("0x82ad56cb")) return false;
	if (!to) return false;
	if (Object.values(request_).filter((x) => typeof x !== "undefined").length > 0) return false;
	return true;
}
var requestOptionsId = 0;
var requestOptionsIds = /* @__PURE__ */ new WeakMap();
function getRequestOptionsId(requestOptions) {
	if (!requestOptions) return "default";
	const id = requestOptionsIds.get(requestOptions);
	if (id !== void 0) return id;
	const nextId = requestOptionsId++;
	requestOptionsIds.set(requestOptions, nextId);
	return nextId;
}
async function scheduleMulticall$1(client, args) {
	const { batchSize = 1024, deployless = false, wait = 0 } = typeof client.batch?.multicall === "object" ? client.batch.multicall : {};
	const { blockHash, blockNumber, blockTag = client.experimental_blockTag ?? "latest", requireCanonical, data, multicallAddress: multicallAddress_, requestOptions, rpcStateOverride, to } = args;
	const multicallAddress = multicallAddress_ !== void 0 ? multicallAddress_ : getMulticallAddress(client, {
		blockNumber,
		deployless
	});
	const block = formatBlockParameter({
		blockHash,
		blockNumber,
		blockTag,
		requireCanonical
	});
	const blockId = typeof block === "string" ? block : JSON.stringify(block);
	const stateOverrideKey = rpcStateOverride ? `.${JSON.stringify(rpcStateOverride)}` : "";
	const { schedule } = createBatchScheduler({
		id: `${client.uid}.${blockId}.${getRequestOptionsId(requestOptions)}${stateOverrideKey}`,
		wait,
		shouldSplitBatch(args) {
			return args.reduce((size, { data }) => size + (data.length - 2), 0) > batchSize * 2;
		},
		fn: async (requests) => {
			const calls = requests.map((request) => ({
				allowFailure: true,
				callData: request.data,
				target: request.to
			}));
			const calldata = encodeFunctionData({
				abi: multicall3Abi,
				args: [calls],
				functionName: "aggregate3"
			});
			const multicallRequest = { ...multicallAddress === null ? { data: toDeploylessCallViaBytecodeData({
				code: multicall3Bytecode,
				data: calldata
			}) } : {
				to: multicallAddress,
				data: calldata
			} };
			const data = await client.request({
				method: "eth_call",
				params: rpcStateOverride ? [
					multicallRequest,
					block,
					rpcStateOverride
				] : [multicallRequest, block]
			}, requestOptions);
			return decodeFunctionResult({
				abi: multicall3Abi,
				args: [calls],
				functionName: "aggregate3",
				data: data || "0x"
			});
		}
	});
	const [{ returnData, success }] = await schedule({
		data,
		to
	});
	if (!success) throw new RawContractError({ data: returnData });
	if (returnData === "0x") return { data: void 0 };
	return { data: returnData };
}
function getMulticallAddress(client, parameters) {
	const { blockNumber, deployless } = parameters;
	if (deployless) return null;
	if (client.chain) return getChainContractAddress({
		blockNumber,
		chain: client.chain,
		contract: "multicall3"
	});
	throw new ClientChainNotConfiguredError();
}
function hasStateOverrideForAddress(rpcStateOverride, address) {
	if (!rpcStateOverride) return false;
	return Object.keys(rpcStateOverride).some((stateOverrideAddress) => isAddressEqual(stateOverrideAddress, address));
}
function toDeploylessCallViaBytecodeData(parameters) {
	const { code, data } = parameters;
	return encodeDeployData({
		abi: parseAbi(["constructor(bytes, bytes)"]),
		bytecode: deploylessCallViaBytecodeBytecode,
		args: [code, data]
	});
}
function toDeploylessCallViaFactoryData(parameters) {
	const { data, factory, factoryData, to } = parameters;
	return encodeDeployData({
		abi: parseAbi(["constructor(address, bytes, address, bytes)"]),
		bytecode: deploylessCallViaFactoryBytecode,
		args: [
			to,
			data,
			factory,
			factoryData
		]
	});
}
/** @internal */
function getRevertErrorData(err) {
	if (!(err instanceof BaseError$2)) return void 0;
	const error = err.walk();
	return typeof error?.data === "object" ? error.data?.data : error.data;
}
// ../../node_modules/viem/_esm/actions/public/readContract.js
/**
* Calls a read-only function on a contract, and returns the response.
*
* - Docs: https://viem.sh/docs/contract/readContract
* - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/contracts_reading-contracts
*
* A "read-only" function (constant function) on a Solidity contract is denoted by a `view` or `pure` keyword. They can only read the state of the contract, and cannot make any changes to it. Since read-only methods do not change the state of the contract, they do not require any gas to be executed, and can be called by any user without the need to pay for gas.
*
* Internally, uses a [Public Client](https://viem.sh/docs/clients/public) to call the [`call` action](https://viem.sh/docs/actions/public/call) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData).
*
* @param client - Client to use
* @param parameters - {@link ReadContractParameters}
* @returns The response from the contract. Type is inferred. {@link ReadContractReturnType}
*
* @example
* import { createPublicClient, http, parseAbi } from 'viem'
* import { mainnet } from 'viem/chains'
* import { readContract } from 'viem/contract'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const result = await readContract(client, {
*   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
*   abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
*   functionName: 'balanceOf',
*   args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
* })
* // 424122n
*/
async function readContract(client, parameters) {
	const { abi, address, args, functionName, ...rest } = parameters;
	const calldata = encodeFunctionData({
		abi,
		args,
		functionName
	});
	try {
		const { data } = await getAction(client, call, "call")({
			...rest,
			data: calldata,
			to: address
		});
		return decodeFunctionResult({
			abi,
			args,
			functionName,
			data: data || "0x"
		});
	} catch (error) {
		throw getContractError(error, {
			abi,
			address,
			args,
			docsPath: "/docs/contract/readContract",
			functionName
		});
	}
}
// ../../node_modules/viem/_esm/actions/public/simulateContract.js
/**
* Simulates/validates a contract interaction. This is useful for retrieving **return data** and **revert reasons** of contract write functions.
*
* - Docs: https://viem.sh/docs/contract/simulateContract
* - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/contracts_writing-to-contracts
*
* This function does not require gas to execute and _**does not**_ change the state of the blockchain. It is almost identical to [`readContract`](https://viem.sh/docs/contract/readContract), but also supports contract write functions.
*
* Internally, uses a [Public Client](https://viem.sh/docs/clients/public) to call the [`call` action](https://viem.sh/docs/actions/public/call) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData).
*
* @param client - Client to use
* @param parameters - {@link SimulateContractParameters}
* @returns The simulation result and write request. {@link SimulateContractReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { simulateContract } from 'viem/contract'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const result = await simulateContract(client, {
*   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
*   abi: parseAbi(['function mint(uint32) view returns (uint32)']),
*   functionName: 'mint',
*   args: ['69420'],
*   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
* })
*/
async function simulateContract(client, parameters) {
	const { abi, address, args, functionName, dataSuffix = typeof client.dataSuffix === "string" ? client.dataSuffix : client.dataSuffix?.value, ...callRequest } = parameters;
	const account = callRequest.account ? parseAccount(callRequest.account) : client.account;
	const calldata = encodeFunctionData({
		abi,
		args,
		functionName
	});
	try {
		const { data } = await getAction(client, call, "call")({
			batch: false,
			data: `${calldata}${dataSuffix ? dataSuffix.replace("0x", "") : ""}`,
			to: address,
			...callRequest,
			account
		});
		return {
			result: decodeFunctionResult({
				abi,
				args,
				functionName,
				data: data || "0x"
			}),
			request: {
				abi: abi.filter((abiItem) => "name" in abiItem && abiItem.name === parameters.functionName),
				address,
				args,
				dataSuffix,
				functionName,
				...callRequest,
				account
			}
		};
	} catch (error) {
		throw getContractError(error, {
			abi,
			address,
			args,
			docsPath: "/docs/contract/simulateContract",
			functionName,
			sender: account?.address
		});
	}
}
// ../../node_modules/viem/_esm/utils/observe.js
/** @internal */
var listenersCache = /*#__PURE__*/ new Map();
/** @internal */
var cleanupCache = /*#__PURE__*/ new Map();
var callbackCount = 0;
/**
* @description Sets up an observer for a given function. If another function
* is set up under the same observer id, the function will only be called once
* for both instances of the observer.
*/
function observe(observerId, callbacks, fn) {
	const callbackId = ++callbackCount;
	const getListeners = () => listenersCache.get(observerId) || [];
	const unsubscribe = () => {
		const nextListeners = getListeners().filter((cb) => cb.id !== callbackId);
		if (nextListeners.length === 0) {
			listenersCache.delete(observerId);
			cleanupCache.delete(observerId);
			return;
		}
		listenersCache.set(observerId, nextListeners);
	};
	const unwatch = () => {
		const listeners = getListeners();
		if (!listeners.some((cb) => cb.id === callbackId)) return;
		const cleanup = cleanupCache.get(observerId);
		if (listeners.length === 1 && cleanup) {
			const p = cleanup();
			if (p instanceof Promise) p.catch(() => {});
		}
		unsubscribe();
	};
	const listeners = getListeners();
	listenersCache.set(observerId, [...listeners, {
		id: callbackId,
		fns: callbacks
	}]);
	if (listeners && listeners.length > 0) return unwatch;
	const emit = {};
	for (const key in callbacks) emit[key] = ((...args) => {
		const listeners = getListeners();
		if (listeners.length === 0) return;
		for (const listener of listeners) listener.fns[key]?.(...args);
	});
	const cleanup = fn(emit);
	if (typeof cleanup === "function") cleanupCache.set(observerId, cleanup);
	return unwatch;
}
// ../../node_modules/viem/_esm/utils/wait.js
async function wait(time, { signal } = {}) {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(getAbortError(signal));
			return;
		}
		const cleanup = () => signal?.removeEventListener("abort", onAbort);
		const timeout = setTimeout(() => {
			cleanup();
			resolve();
		}, Math.min(time, 2 ** 31 - 1));
		const onAbort = () => {
			clearTimeout(timeout);
			cleanup();
			reject(getAbortError(signal));
		};
		signal?.addEventListener("abort", onAbort, { once: true });
	});
}
// ../../node_modules/viem/_esm/utils/poll.js
/**
* @description Polls a function at a specified interval.
*/
function poll(fn, { emitOnBegin, initialWaitTime, interval }) {
	let active = true;
	const unwatch = () => active = false;
	const watch = async () => {
		let data;
		if (emitOnBegin) data = await fn({ unpoll: unwatch });
		await wait(await initialWaitTime?.(data) ?? interval);
		const poll = async () => {
			if (!active) return;
			await fn({ unpoll: unwatch });
			await wait(interval);
			poll();
		};
		poll();
	};
	watch();
	return unwatch;
}
// ../../node_modules/viem/_esm/utils/promise/withCache.js
/** @internal */
var promiseCache$1 = /*#__PURE__*/ new Map();
/** @internal */
var responseCache = /*#__PURE__*/ new Map();
function getCache(cacheKey) {
	const buildCache = (cacheKey, cache) => ({
		clear: () => cache.delete(cacheKey),
		get: () => cache.get(cacheKey),
		set: (data) => cache.set(cacheKey, data)
	});
	const promise = buildCache(cacheKey, promiseCache$1);
	const response = buildCache(cacheKey, responseCache);
	return {
		clear: () => {
			promise.clear();
			response.clear();
		},
		promise,
		response
	};
}
/**
* @description Returns the result of a given promise, and caches the result for
* subsequent invocations against a provided cache key.
*/
async function withCache(fn, { cacheKey, cacheTime = Number.POSITIVE_INFINITY }) {
	const cache = getCache(cacheKey);
	const response = cache.response.get();
	if (response && cacheTime > 0) {
		if (Date.now() - response.created.getTime() < cacheTime) return response.data;
	}
	let promise = cache.promise.get();
	if (!promise) {
		promise = fn();
		cache.promise.set(promise);
	}
	try {
		const data = await promise;
		cache.response.set({
			created: /* @__PURE__ */ new Date(),
			data
		});
		return data;
	} finally {
		cache.promise.clear();
	}
}
// ../../node_modules/viem/_esm/actions/public/getBlockNumber.js
var cacheKey = (id) => `blockNumber.${id}`;
/**
* Returns the number of the most recent block seen.
*
* - Docs: https://viem.sh/docs/actions/public/getBlockNumber
* - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/blocks_fetching-blocks
* - JSON-RPC Methods: [`eth_blockNumber`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_blocknumber)
*
* @param client - Client to use
* @param parameters - {@link GetBlockNumberParameters}
* @returns The number of the block. {@link GetBlockNumberReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getBlockNumber } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const blockNumber = await getBlockNumber(client)
* // 69420n
*/
async function getBlockNumber(client, { cacheTime = client.cacheTime } = {}) {
	const blockNumberHex = await withCache(() => client.request({ method: "eth_blockNumber" }), {
		cacheKey: cacheKey(client.uid),
		cacheTime
	});
	return BigInt(blockNumberHex);
}
// ../../node_modules/viem/_esm/actions/public/getFilterChanges.js
/**
* Returns a list of logs or hashes based on a [Filter](/docs/glossary/terms#filter) since the last time it was called.
*
* - Docs: https://viem.sh/docs/actions/public/getFilterChanges
* - JSON-RPC Methods: [`eth_getFilterChanges`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getfilterchanges)
*
* A Filter can be created from the following actions:
*
* - [`createBlockFilter`](https://viem.sh/docs/actions/public/createBlockFilter)
* - [`createContractEventFilter`](https://viem.sh/docs/contract/createContractEventFilter)
* - [`createEventFilter`](https://viem.sh/docs/actions/public/createEventFilter)
* - [`createPendingTransactionFilter`](https://viem.sh/docs/actions/public/createPendingTransactionFilter)
*
* Depending on the type of filter, the return value will be different:
*
* - If the filter was created with `createContractEventFilter` or `createEventFilter`, it returns a list of logs.
* - If the filter was created with `createPendingTransactionFilter`, it returns a list of transaction hashes.
* - If the filter was created with `createBlockFilter`, it returns a list of block hashes.
*
* @param client - Client to use
* @param parameters - {@link GetFilterChangesParameters}
* @returns Logs or hashes. {@link GetFilterChangesReturnType}
*
* @example
* // Blocks
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { createBlockFilter, getFilterChanges } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const filter = await createBlockFilter(client)
* const hashes = await getFilterChanges(client, { filter })
*
* @example
* // Contract Events
* import { createPublicClient, http, parseAbi } from 'viem'
* import { mainnet } from 'viem/chains'
* import { createContractEventFilter, getFilterChanges } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const filter = await createContractEventFilter(client, {
*   address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
*   abi: parseAbi(['event Transfer(address indexed, address indexed, uint256)']),
*   eventName: 'Transfer',
* })
* const logs = await getFilterChanges(client, { filter })
*
* @example
* // Raw Events
* import { createPublicClient, http, parseAbiItem } from 'viem'
* import { mainnet } from 'viem/chains'
* import { createEventFilter, getFilterChanges } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const filter = await createEventFilter(client, {
*   address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
*   event: parseAbiItem('event Transfer(address indexed, address indexed, uint256)'),
* })
* const logs = await getFilterChanges(client, { filter })
*
* @example
* // Transactions
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { createPendingTransactionFilter, getFilterChanges } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const filter = await createPendingTransactionFilter(client)
* const hashes = await getFilterChanges(client, { filter })
*/
async function getFilterChanges(_client, { filter }) {
	const strict = "strict" in filter && filter.strict;
	const logs = await filter.request({
		method: "eth_getFilterChanges",
		params: [filter.id]
	});
	if (typeof logs[0] === "string") return logs;
	const formattedLogs = logs.map((log) => formatLog(log));
	if (!("abi" in filter) || !filter.abi) return formattedLogs;
	return parseEventLogs({
		abi: filter.abi,
		eventName: filter.eventName,
		logs: formattedLogs,
		strict
	});
}
// ../../node_modules/viem/_esm/actions/public/uninstallFilter.js
/**
* Destroys a [`Filter`](https://viem.sh/docs/glossary/types#filter).
*
* - Docs: https://viem.sh/docs/actions/public/uninstallFilter
* - JSON-RPC Methods: [`eth_uninstallFilter`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_uninstallFilter)
*
* Destroys a Filter that was created from one of the following Actions:
* - [`createBlockFilter`](https://viem.sh/docs/actions/public/createBlockFilter)
* - [`createEventFilter`](https://viem.sh/docs/actions/public/createEventFilter)
* - [`createPendingTransactionFilter`](https://viem.sh/docs/actions/public/createPendingTransactionFilter)
*
* @param client - Client to use
* @param parameters - {@link UninstallFilterParameters}
* @returns A boolean indicating if the Filter was successfully uninstalled. {@link UninstallFilterReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { createPendingTransactionFilter, uninstallFilter } from 'viem/public'
*
* const filter = await createPendingTransactionFilter(client)
* const uninstalled = await uninstallFilter(client, { filter })
* // true
*/
async function uninstallFilter(_client, { filter }) {
	return filter.request({
		method: "eth_uninstallFilter",
		params: [filter.id]
	});
}
// ../../node_modules/viem/_esm/actions/public/watchContractEvent.js
/**
* Watches and returns emitted contract event logs.
*
* - Docs: https://viem.sh/docs/contract/watchContractEvent
*
* This Action will batch up all the event logs found within the [`pollingInterval`](https://viem.sh/docs/contract/watchContractEvent#pollinginterval-optional), and invoke them via [`onLogs`](https://viem.sh/docs/contract/watchContractEvent#onLogs).
*
* `watchContractEvent` will attempt to create an [Event Filter](https://viem.sh/docs/contract/createContractEventFilter) and listen to changes to the Filter per polling interval, however, if the RPC Provider does not support Filters (e.g. `eth_newFilter`), then `watchContractEvent` will fall back to using [`getLogs`](https://viem.sh/docs/actions/public/getLogs) instead. If `getLogs` fails for a block range, `watchContractEvent` will retry with smaller block ranges and may call `onLogs` more than once per polling interval.
*
* @param client - Client to use
* @param parameters - {@link WatchContractEventParameters}
* @returns A function that can be invoked to stop watching for new event logs. {@link WatchContractEventReturnType}
*
* @example
* import { createPublicClient, http, parseAbi } from 'viem'
* import { mainnet } from 'viem/chains'
* import { watchContractEvent } from 'viem/contract'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const unwatch = watchContractEvent(client, {
*   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
*   abi: parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)']),
*   eventName: 'Transfer',
*   args: { from: '0xc961145a54C96E3aE9bAA048c4F4D6b04C13916b' },
*   onLogs: (logs) => console.log(logs),
* })
*/
function watchContractEvent(client, parameters) {
	const { abi, address, args, batch = true, eventName, fromBlock, onError, onLogs, poll: poll_, pollingInterval = client.pollingInterval, strict: strict_ } = parameters;
	const enablePolling = (() => {
		if (typeof poll_ !== "undefined") return poll_;
		if (typeof fromBlock === "bigint") return true;
		if (client.transport.type === "webSocket" || client.transport.type === "ipc") return false;
		if (client.transport.type === "fallback" && (client.transport.transports[0].config.type === "webSocket" || client.transport.transports[0].config.type === "ipc")) return false;
		return true;
	})();
	const pollContractEvent = () => {
		const strict = strict_ ?? false;
		return observe(stringify$1([
			"watchContractEvent",
			address,
			args,
			batch,
			client.uid,
			eventName,
			pollingInterval,
			strict,
			fromBlock
		]), {
			onLogs,
			onError
		}, (emit) => {
			let active = true;
			let previousBlockNumber = fromBlock === void 0 ? void 0 : fromBlock - 1n;
			let filter;
			let initialized = false;
			const emitLogs = (logs) => {
				if (logs.length === 0) return;
				if (batch) emit.onLogs(logs);
				else for (const log of logs) emit.onLogs([log]);
			};
			const getLogsInRange = (from, to) => getAction(client, getContractEvents, "getContractEvents")({
				abi,
				address,
				args,
				eventName,
				fromBlock: from,
				toBlock: to,
				strict
			});
			const unwatch = poll(async () => {
				if (!initialized) {
					try {
						filter = await getAction(client, createContractEventFilter, "createContractEventFilter")({
							abi,
							address,
							args,
							eventName,
							strict,
							fromBlock
						});
					} catch {}
					initialized = true;
					if (filter) return;
				}
				try {
					if (filter) {
						const logs = await getAction(client, getFilterChanges, "getFilterChanges")({ filter });
						emitLogs(logs);
						return;
					}
					const blockNumber = await getAction(client, getBlockNumber, "getBlockNumber")({});
					previousBlockNumber ??= blockNumber;
					let size = blockNumber - previousBlockNumber;
					while (previousBlockNumber < blockNumber) {
						const from = previousBlockNumber + 1n;
						const end = previousBlockNumber + size;
						const to = end < blockNumber ? end : blockNumber;
						const logs = await getLogsInRange(from, to).catch((error) => {
							if (from === to || !isRangeError$1(error)) throw error;
						});
						if (!active) return;
						if (!logs) {
							size = (to - from + 1n) / 2n;
							continue;
						}
						previousBlockNumber = to;
						emitLogs(logs);
					}
				} catch (err) {
					if (filter && err instanceof InvalidInputRpcError) initialized = false;
					emit.onError?.(err);
				}
			}, {
				emitOnBegin: true,
				interval: pollingInterval
			});
			return async () => {
				active = false;
				if (filter) await getAction(client, uninstallFilter, "uninstallFilter")({ filter });
				unwatch();
			};
		});
	};
	const subscribeContractEvent = () => {
		const strict = strict_ ?? false;
		const observerId = stringify$1([
			"watchContractEvent",
			address,
			args,
			batch,
			client.uid,
			eventName,
			pollingInterval,
			strict
		]);
		let active = true;
		let unsubscribe = () => active = false;
		return observe(observerId, {
			onLogs,
			onError
		}, (emit) => {
			(async () => {
				try {
					const transport = (() => {
						if (client.transport.type === "fallback") {
							const transport = client.transport.transports.find((transport) => transport.config.type === "webSocket" || transport.config.type === "ipc");
							if (!transport) return client.transport;
							return transport.value;
						}
						return client.transport;
					})();
					const skipUnmatched = Boolean(eventName || strict_);
					const topics = eventName ? encodeEventTopics({
						abi,
						eventName,
						args
					}) : [];
					const { unsubscribe: unsubscribe_ } = await transport.subscribe({
						params: ["logs", {
							address,
							topics
						}],
						onData(data) {
							if (!active) return;
							const log = data.result;
							try {
								const decoded = decodeEventLog({
									abi,
									data: log.data,
									eventName,
									topics: log.topics,
									strict: strict_
								});
								const formatted = formatLog(log, {
									args: decoded.args,
									eventName: decoded.eventName
								});
								emit.onLogs([formatted]);
							} catch (err) {
								if (skipUnmatched && (err instanceof AbiEventAmbiguityError || err instanceof AbiEventSignatureEmptyTopicsError || err instanceof AbiEventSignatureNotFoundError)) return;
								let eventName;
								let isUnnamed;
								if (err instanceof DecodeLogDataMismatch || err instanceof DecodeLogTopicsMismatch) {
									if (strict_) return;
									eventName = err.abiItem.name;
									isUnnamed = err.abiItem.inputs?.some((x) => !("name" in x && x.name));
								}
								const formatted = formatLog(log, {
									args: isUnnamed ? [] : {},
									eventName
								});
								emit.onLogs([formatted]);
							}
						},
						onError(error) {
							emit.onError?.(error);
						}
					});
					unsubscribe = unsubscribe_;
					if (!active) unsubscribe();
				} catch (err) {
					onError?.(err);
				}
			})();
			return () => unsubscribe();
		});
	};
	return enablePolling ? pollContractEvent() : subscribeContractEvent();
}
/** Returns whether a failed `eth_getLogs` request may succeed with a smaller block range. */
function isRangeError$1(error) {
	if (!(error instanceof BaseError$2)) return true;
	const cause = error.walk((err) => err instanceof HttpRequestError || err instanceof RpcRequestError);
	if (!cause) return true;
	if (cause instanceof RpcRequestError && cause.code === 429) return false;
	if (cause instanceof HttpRequestError && cause.status === void 0) return false;
	return cause.status !== 401 && cause.status !== 403 && cause.status !== 429;
}
// ../../node_modules/viem/_esm/errors/account.js
var AccountNotFoundError = class extends BaseError$2 {
	constructor({ docsPath } = {}) {
		super(["Could not find an Account to execute with this Action.", "Please provide an Account with the `account` argument on the Action, or by supplying an `account` to the Client."].join("\n"), {
			docsPath,
			docsSlug: "account",
			name: "AccountNotFoundError"
		});
	}
};
// ../../node_modules/viem/_esm/actions/wallet/sendRawTransaction.js
/**
* Sends a **signed** transaction to the network
*
* - Docs: https://viem.sh/docs/actions/wallet/sendRawTransaction
* - JSON-RPC Method: [`eth_sendRawTransaction`](https://ethereum.github.io/execution-apis/api-documentation/)
*
* @param client - Client to use
* @param parameters - {@link SendRawTransactionParameters}
* @returns The transaction hash. {@link SendRawTransactionReturnType}
*
* @example
* import { createWalletClient, custom } from 'viem'
* import { mainnet } from 'viem/chains'
* import { sendRawTransaction } from 'viem/wallet'
*
* const client = createWalletClient({
*   chain: mainnet,
*   transport: custom(window.ethereum),
* })
*
* const hash = await sendRawTransaction(client, {
*   serializedTransaction: '0x02f850018203118080825208808080c080a04012522854168b27e5dc3d5839bab5e6b39e1a0ffd343901ce1622e3d64b48f1a04e00902ae0502c4728cbf12156290df99c3ed7de85b1dbfe20b5c36931733a33'
* })
*/
async function sendRawTransaction(client, { serializedTransaction }) {
	return client.request({
		method: "eth_sendRawTransaction",
		params: [serializedTransaction]
	}, { retryCount: 0 });
}
// ../../node_modules/viem/_esm/utils/promise/withRetry.js
function withRetry(fn, { delay: delay_ = 100, retryCount = 2, shouldRetry = () => true, signal } = {}) {
	return new Promise((resolve, reject) => {
		const onAbort = () => reject(getAbortError(signal));
		signal?.addEventListener("abort", onAbort, { once: true });
		const attemptRetry = async ({ count = 0 } = {}) => {
			if (signal?.aborted) {
				reject(getAbortError(signal));
				return;
			}
			const retry = async ({ error }) => {
				const delay = typeof delay_ === "function" ? delay_({
					count,
					error
				}) : delay_;
				if (delay) try {
					await wait(delay, { signal });
				} catch (err) {
					reject(err);
					return;
				}
				return attemptRetry({ count: count + 1 });
			};
			try {
				resolve(await fn());
			} catch (err) {
				if (signal?.aborted) {
					reject(getAbortError(signal));
					return;
				}
				if (isAbortError(err)) {
					reject(err);
					return;
				}
				if (count < retryCount && await shouldRetry({
					count,
					error: err
				})) return retry({ error: err });
				reject(err);
			}
		};
		attemptRetry().catch(reject).finally(() => signal?.removeEventListener("abort", onAbort));
	});
}
// ../../node_modules/viem/_esm/utils/formatters/transactionReceipt.js
var receiptStatuses = {
	"0x0": "reverted",
	"0x1": "success"
};
function formatTransactionReceipt(transactionReceipt, _) {
	const receipt = {
		...transactionReceipt,
		blockNumber: transactionReceipt.blockNumber ? BigInt(transactionReceipt.blockNumber) : null,
		contractAddress: transactionReceipt.contractAddress ? transactionReceipt.contractAddress : null,
		cumulativeGasUsed: transactionReceipt.cumulativeGasUsed ? BigInt(transactionReceipt.cumulativeGasUsed) : null,
		effectiveGasPrice: transactionReceipt.effectiveGasPrice ? BigInt(transactionReceipt.effectiveGasPrice) : null,
		gasUsed: transactionReceipt.gasUsed ? BigInt(transactionReceipt.gasUsed) : null,
		logs: transactionReceipt.logs ? transactionReceipt.logs.map((log) => formatLog(log)) : null,
		to: transactionReceipt.to ? transactionReceipt.to : null,
		transactionIndex: transactionReceipt.transactionIndex ? hexToNumber$1(transactionReceipt.transactionIndex) : null,
		status: transactionReceipt.status ? receiptStatuses[transactionReceipt.status] : null,
		type: transactionReceipt.type ? transactionType[transactionReceipt.type] || transactionReceipt.type : null
	};
	if (transactionReceipt.blobGasPrice) receipt.blobGasPrice = BigInt(transactionReceipt.blobGasPrice);
	if (transactionReceipt.blobGasUsed) receipt.blobGasUsed = BigInt(transactionReceipt.blobGasUsed);
	return receipt;
}
// ../../node_modules/viem/_esm/utils/uid.js
var size = 256;
var index = size;
var buffer;
function uid(length = 11) {
	if (!buffer || index + length > size * 2) {
		buffer = "";
		index = 0;
		for (let i = 0; i < size; i++) buffer += (256 + Math.random() * 256 | 0).toString(16).substring(1);
	}
	return buffer.substring(index, index++ + length);
}
// ../../node_modules/viem/_esm/clients/createClient.js
function createClient(parameters) {
	const { batch, chain, ccipRead, dataSuffix, key = "base", name = "Base Client", tokens, type = "base" } = parameters;
	const experimental_blockTag = parameters.experimental_blockTag ?? (typeof chain?.experimental_preconfirmationTime === "number" ? "pending" : void 0);
	const blockTime = chain?.blockTime ?? 12e3;
	const defaultPollingInterval = Math.min(Math.max(Math.floor(blockTime / 2), 500), 4e3);
	const pollingInterval = parameters.pollingInterval ?? defaultPollingInterval;
	const cacheTime = parameters.cacheTime ?? Math.min(pollingInterval, Math.floor(blockTime / 2));
	const account = parameters.account ? parseAccount(parameters.account) : void 0;
	const { config, request, value } = parameters.transport({
		account,
		chain,
		pollingInterval
	});
	return decorate({
		account,
		batch,
		cacheTime,
		ccipRead,
		chain,
		dataSuffix,
		key,
		name,
		pollingInterval,
		request,
		tokens,
		transport: {
			...config,
			...value
		},
		type,
		uid: uid(),
		...experimental_blockTag ? { experimental_blockTag } : {}
	});
}
/** Built-in `scope` functions, which an extension named `scope` takes precedence over. */
var scopes_builtin = /* @__PURE__ */ new WeakSet();
var scopeId = 0;
/**
* Attaches `extend` and `scope` to a base Client. Base keys other than
* `scope` are reserved, so extensions cannot override them.
*/
function decorate(client) {
	function extend(base, extensions) {
		return (extendFn) => {
			const extended = extendFn(base);
			for (const key in client) if (key !== "scope") delete extended[key];
			const combined = {
				...base,
				...extended
			};
			for (const key in extended) {
				const a = base[key];
				const b = extended[key];
				if (isPlainObject(a) && isPlainObject(b)) combined[key] = {
					...a,
					...b
				};
			}
			const next = [...extensions, extendFn];
			const { scope: scope_combined } = combined;
			return Object.assign(combined, {
				extend: extend(combined, next),
				scope: typeof scope_combined === "function" && scopes_builtin.has(scope_combined) ? scope(next) : scope_combined
			});
		};
	}
	function scope(extensions) {
		const scopes = /* @__PURE__ */ new WeakMap();
		const fn = (options = {}) => {
			const cached = options.signal && scopes.get(options.signal);
			if (cached) return cached;
			const id = `scope.${scopeId++}`;
			const controller = new AbortController();
			const { signal } = options;
			if (signal?.aborted) controller.abort(signal.reason);
			else signal?.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
			const request = (args, options_request) => client.request(args, {
				...options_request,
				signal: options_request?.signal ?? controller.signal,
				uid: options_request?.uid ?? id
			});
			const scoped = extensions.reduce((base, extendFn) => base.extend(extendFn), decorate({
				...client,
				request,
				uid: id
			}));
			if (signal) scopes.set(signal, scoped);
			return scoped;
		};
		scopes_builtin.add(fn);
		return fn;
	}
	return Object.assign(client, {
		extend: extend(client, []),
		scope: scope([])
	});
}
/** Whether `value` is a plain object (`{}`), as opposed to a function, array,
* or class instance. Used to decide which extension namespaces to merge. */
function isPlainObject(value) {
	if (typeof value !== "object" || value === null) return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
/**
* Binds an action function to a `client`, returning a parameter-only version
* along with any helpers the action exposes. Helpers that need a client
* (`.call`, `.calls`, `.callWithPeriod`, `.estimateGas`, `.prepare`,
* `.prepareRecipient`, `.predict`, `.simulate`) are bound to `client`;
* pure helpers (`.extractEvent`, `.extractEvents`) are copied as-is. Used
* by decorators that attach namespaced actions to a Client.
* @internal
*/
function bindActionDecorators(client, action) {
	const wrapped = (parameters = {}) => action(client, parameters);
	for (const key of [
		"call",
		"calls",
		"callWithPeriod",
		"estimateGas",
		"prepare",
		"prepareRecipient",
		"predict",
		"simulate"
	]) if (Object.hasOwn(action, key)) {
		const helper = action[key];
		wrapped[key] = (args = {}) => {
			if (helper.length === 1) return helper(args);
			return helper(client, args);
		};
	}
	for (const key of ["extractEvent", "extractEvents"]) if (Object.hasOwn(action, key)) wrapped[key] = action[key];
	return wrapped;
}
// ../../node_modules/viem/_esm/utils/ens/errors.js
function isNullUniversalResolverError(err) {
	if (!(err instanceof BaseError$2)) return false;
	const cause = err.walk((e) => e instanceof ContractFunctionRevertedError);
	if (!(cause instanceof ContractFunctionRevertedError)) return false;
	if (cause.data?.errorName === "HttpError") return true;
	if (cause.data?.errorName === "ResolverError") return true;
	if (cause.data?.errorName === "ResolverNotContract") return true;
	if (cause.data?.errorName === "ResolverNotFound") return true;
	if (cause.data?.errorName === "ReverseAddressMismatch") return true;
	if (cause.data?.errorName === "UnsupportedResolverProfile") return true;
	return false;
}
// ../../node_modules/viem/_esm/utils/abi/decodeFunctionData.js
function decodeFunctionData(parameters) {
	const { abi, data } = parameters;
	const signature = slice$2(data, 0, 4);
	const description = abi.find((x) => x.type === "function" && signature === toFunctionSelector(formatAbiItem(x)));
	if (!description) throw new AbiFunctionSignatureNotFoundError(signature, { docsPath: "/docs/contract/decodeFunctionData" });
	return {
		functionName: description.name,
		args: "inputs" in description && description.inputs && description.inputs.length > 0 ? decodeAbiParameters(description.inputs, slice$2(data, 4)) : void 0
	};
}
// ../../node_modules/viem/_esm/utils/abi/encodeErrorResult.js
var docsPath$1 = "/docs/contract/encodeErrorResult";
function encodeErrorResult(parameters) {
	const { abi, errorName, args } = parameters;
	let abiItem = abi[0];
	if (errorName) {
		const item = getAbiItem({
			abi,
			args,
			name: errorName
		});
		if (!item) throw new AbiErrorNotFoundError(errorName, { docsPath: docsPath$1 });
		abiItem = item;
	}
	if (abiItem.type !== "error") throw new AbiErrorNotFoundError(void 0, { docsPath: docsPath$1 });
	const definition = formatAbiItem(abiItem);
	const signature = toFunctionSelector(definition);
	let data = "0x";
	if (args && args.length > 0) {
		if (!abiItem.inputs) throw new AbiErrorInputsNotFoundError(abiItem.name, { docsPath: docsPath$1 });
		data = encodeAbiParameters(abiItem.inputs, args);
	}
	return concatHex([signature, data]);
}
// ../../node_modules/viem/_esm/utils/abi/encodeFunctionResult.js
var docsPath = "/docs/contract/encodeFunctionResult";
function encodeFunctionResult(parameters) {
	const { abi, functionName, result } = parameters;
	let abiItem = abi[0];
	if (functionName) {
		const item = getAbiItem({
			abi,
			name: functionName
		});
		if (!item) throw new AbiFunctionNotFoundError(functionName, { docsPath });
		abiItem = item;
	}
	if (abiItem.type !== "function") throw new AbiFunctionNotFoundError(void 0, { docsPath });
	if (!abiItem.outputs) throw new AbiFunctionOutputsNotFoundError(abiItem.name, { docsPath });
	const values = (() => {
		if (abiItem.outputs.length === 0) return [];
		if (abiItem.outputs.length === 1) return [result];
		if (Array.isArray(result)) return result;
		throw new InvalidArrayError$1(result);
	})();
	return encodeAbiParameters(abiItem.outputs, values);
}
// ../../node_modules/viem/_esm/utils/ens/localBatchGatewayRequest.js
var localBatchGatewayUrl = "x-batch-gateway:true";
/**
* Caps for one CCIP-Read lookup.
*
* - `concurrency`: gateway requests in flight at once, across nested batches.
* - `depth`: nested callbacks, and separately, nested local batches.
* - `queries`: gateway requests in total, across callbacks and nested batches.
*   Each contract-chosen URL counts once, and a query with none counts once.
*   Gateways a custom `ccipRead.request` adds (such as `ccipReadTunnel`'s
*   `batchGateways`) are the caller's own and are not counted separately.
*/
var ccipReadLimit = {
	concurrency: 16,
	depth: 4,
	queries: 256
};
/** Creates the budget for one CCIP-Read lookup. */
function createCcipReadBudget() {
	let active = 0;
	const queue = [];
	return {
		queries: ccipReadLimit.queries,
		async run(fn) {
			if (active >= ccipReadLimit.concurrency) await new Promise((resolve) => queue.push(resolve));
			else active++;
			try {
				return await fn();
			} finally {
				const next = queue.shift();
				if (next) next();
				else active--;
			}
		}
	};
}
async function localBatchGatewayRequest(parameters) {
	const { data, ccipRequest, budget = createCcipReadBudget(), depth = 0 } = parameters;
	const { args: [queries] } = decodeFunctionData({
		abi: batchGatewayAbi,
		data
	});
	const failures = [];
	const responses = [];
	await Promise.all(queries.map(async (query, i) => {
		try {
			const nested = query.urls.includes(localBatchGatewayUrl);
			if (nested && depth + 1 >= ccipReadLimit.depth) throw new HttpRequestError({
				details: `CCIP Read exceeded the maximum batch depth (${ccipReadLimit.depth}).`,
				url: localBatchGatewayUrl
			});
			if (nested) responses[i] = await localBatchGatewayRequest({
				data: query.data,
				ccipRequest,
				budget,
				depth: depth + 1
			});
			else {
				if (budget.queries <= 0) throw new HttpRequestError({
					details: `CCIP Read exceeded the maximum number of queries (${ccipReadLimit.queries}).`,
					url: query.urls[0] ?? ""
				});
				const urls = query.urls.slice(0, budget.queries);
				budget.queries -= Math.max(1, urls.length);
				responses[i] = await budget.run(() => ccipRequest({
					...query,
					urls
				}));
			}
			failures[i] = false;
		} catch (err) {
			failures[i] = true;
			responses[i] = encodeError(err);
		}
	}));
	return encodeFunctionResult({
		abi: batchGatewayAbi,
		functionName: "query",
		result: [failures, responses]
	});
}
function encodeError(error) {
	if (error.name === "HttpRequestError" && error.status) return encodeErrorResult({
		abi: batchGatewayAbi,
		errorName: "HttpError",
		args: [error.status, error.shortMessage]
	});
	return encodeErrorResult({
		abi: [solidityError],
		errorName: "Error",
		args: ["shortMessage" in error ? error.shortMessage : error.message]
	});
}
// ../../node_modules/viem/_esm/utils/ens/encodedLabelToLabelhash.js
function encodedLabelToLabelhash(label) {
	if (label.length !== 66) return null;
	if (label.indexOf("[") !== 0) return null;
	if (label.indexOf("]") !== 65) return null;
	const hash = `0x${label.slice(1, 65)}`;
	if (!isHex(hash)) return null;
	return hash;
}
// ../../node_modules/viem/_esm/utils/ens/namehash.js
/**
* @description Hashes ENS name
*
* - Since ENS names prohibit certain forbidden characters (e.g. underscore) and have other validation rules, you likely want to [normalize ENS names](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) with [UTS-46 normalization](https://unicode.org/reports/tr46) before passing them to `namehash`. You can use the built-in [`normalize`](https://viem.sh/docs/ens/utilities/normalize) function for this.
*
* @example
* namehash('wevm.eth')
* '0x08c85f2f4059e930c45a6aeff9dcd3bd95dc3c5c1cddef6a0626b31152248560'
*
* @link https://eips.ethereum.org/EIPS/eip-137
*/
function namehash(name) {
	let result = (/* @__PURE__ */ new Uint8Array(32)).fill(0);
	if (!name) return bytesToHex$1(result);
	const labels = name.split(".");
	for (let i = labels.length - 1; i >= 0; i -= 1) {
		const hashFromEncodedLabel = encodedLabelToLabelhash(labels[i]);
		const hashed = hashFromEncodedLabel ? toBytes$1(hashFromEncodedLabel) : keccak256$1(stringToBytes(labels[i]), "bytes");
		result = keccak256$1(concat$1([result, hashed]), "bytes");
	}
	return bytesToHex$1(result);
}
// ../../node_modules/viem/_esm/utils/ens/encodeLabelhash.js
function encodeLabelhash(hash) {
	return `[${hash.slice(2)}]`;
}
// ../../node_modules/viem/_esm/utils/ens/labelhash.js
/**
* @description Hashes ENS label
*
* - Since ENS labels prohibit certain forbidden characters (e.g. underscore) and have other validation rules, you likely want to [normalize ENS labels](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) with [UTS-46 normalization](https://unicode.org/reports/tr46) before passing them to `labelhash`. You can use the built-in [`normalize`](https://viem.sh/docs/ens/utilities/normalize) function for this.
*
* @example
* labelhash('eth')
* '0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0'
*/
function labelhash(label) {
	const result = (/* @__PURE__ */ new Uint8Array(32)).fill(0);
	if (!label) return bytesToHex$1(result);
	return encodedLabelToLabelhash(label) || keccak256$1(stringToBytes(label));
}
// ../../node_modules/viem/_esm/utils/ens/packetToBytes.js
function packetToBytes(packet) {
	const value = packet.replace(/^\.|\.$/gm, "");
	if (value.length === 0) return /* @__PURE__ */ new Uint8Array(1);
	const bytes = new Uint8Array(stringToBytes(value).byteLength + 2);
	let offset = 0;
	const list = value.split(".");
	for (let i = 0; i < list.length; i++) {
		let encoded = stringToBytes(list[i]);
		if (encoded.byteLength > 255) encoded = stringToBytes(encodeLabelhash(labelhash(list[i])));
		bytes[offset] = encoded.length;
		bytes.set(encoded, offset + 1);
		offset += encoded.length + 1;
	}
	if (bytes.byteLength !== offset + 1) return bytes.slice(0, offset + 1);
	return bytes;
}
// ../../node_modules/viem/_esm/actions/ens/getEnsAddress.js
/**
* Gets address for ENS name.
*
* - Docs: https://viem.sh/docs/ens/actions/getEnsAddress
* - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/ens
*
* Calls `resolve(bytes, bytes)` on ENS Universal Resolver Contract.
*
* Since ENS names prohibit certain forbidden characters (e.g. underscore) and have other validation rules, you likely want to [normalize ENS names](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) with [UTS-46 normalization](https://unicode.org/reports/tr46) before passing them to `getEnsAddress`. You can use the built-in [`normalize`](https://viem.sh/docs/ens/utilities/normalize) function for this.
*
* @param client - Client to use
* @param parameters - {@link GetEnsAddressParameters}
* @returns Address for ENS name or `null` if not found. {@link GetEnsAddressReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getEnsAddress, normalize } from 'viem/ens'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const ensAddress = await getEnsAddress(client, {
*   name: normalize('wevm.eth'),
* })
* // '0xd2135CfB216b74109775236E36d4b433F1DF507B'
*/
async function getEnsAddress(client, parameters) {
	const { blockNumber, blockTag, coinType, name, gatewayUrls, strict } = parameters;
	const { chain } = client;
	const universalResolverAddress = (() => {
		if (parameters.universalResolverAddress) return parameters.universalResolverAddress;
		if (!chain) throw new Error("client chain not configured. universalResolverAddress is required.");
		return getChainContractAddress({
			blockNumber,
			chain,
			contract: "ensUniversalResolver"
		});
	})();
	const tlds = chain?.ensTlds;
	if (tlds && !tlds.some((tld) => name.endsWith(tld))) return null;
	const args = (() => {
		if (coinType != null) return [namehash(name), BigInt(coinType)];
		return [namehash(name)];
	})();
	try {
		const functionData = encodeFunctionData({
			abi: addressResolverAbi,
			functionName: "addr",
			args
		});
		const readContractParameters = {
			address: universalResolverAddress,
			abi: universalResolverResolveAbi,
			functionName: "resolveWithGateways",
			args: [
				toHex(packetToBytes(name)),
				functionData,
				gatewayUrls ?? ["x-batch-gateway:true"]
			],
			blockNumber,
			blockTag
		};
		const res = await getAction(client, readContract, "readContract")(readContractParameters);
		if (res[0] === "0x") return null;
		const address = decodeAddress$1({
			coinType,
			data: res[0],
			args
		});
		if (address === "0x") return null;
		if (trim$1(address) === "0x00") return null;
		return address;
	} catch (err) {
		if (strict) throw err;
		if (isNullUniversalResolverError(err)) return null;
		throw err;
	}
}
function decodeAddress$1({ coinType, data, args }) {
	try {
		return decodeFunctionResult({
			abi: addressResolverAbi,
			args,
			functionName: "addr",
			data
		});
	} catch (err) {
		if (coinType == null) throw err;
		const address = trim$1(data);
		if (size$3(address) === 20) return getAddress(address);
		throw err;
	}
}
// ../../node_modules/viem/node_modules/ox/_esm/core/Base64.js
var encoder = /*#__PURE__*/ new TextEncoder();
var decoder$1 = /*#__PURE__*/ new TextDecoder();
var integerToCharacter = /*#__PURE__*/ Object.fromEntries(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/").map((a, i) => [i, a.charCodeAt(0)]));
var characterToInteger = {
	...Object.fromEntries(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/").map((a, i) => [a.charCodeAt(0), i])),
	["=".charCodeAt(0)]: 0,
	["-".charCodeAt(0)]: 62,
	["_".charCodeAt(0)]: 63
};
/**
* Encodes a {@link ox#Bytes.Bytes} to a Base64-encoded string (with optional padding and/or URL-safe characters).
*
* @example
* ```ts twoslash
* import { Base64, Bytes } from 'ox'
*
* const value = Base64.fromBytes(Bytes.fromString('hello world'))
* // @log: 'aGVsbG8gd29ybGQ='
* ```
*
* @example
* ### No Padding
*
* Turn off [padding of encoded data](https://datatracker.ietf.org/doc/html/rfc4648#section-3.2) with the `pad` option:
*
* ```ts twoslash
* import { Base64, Bytes } from 'ox'
*
* const value = Base64.fromBytes(Bytes.fromString('hello world'), { pad: false })
* // @log: 'aGVsbG8gd29ybGQ'
* ```
*
* ### URL-safe Encoding
*
* Turn on [URL-safe encoding](https://datatracker.ietf.org/doc/html/rfc4648#section-5) (Base64 URL) with the `url` option:
*
* ```ts twoslash
* import { Base64, Bytes } from 'ox'
*
* const value = Base64.fromBytes(Bytes.fromString('hello wod'), { url: true })
* // @log: 'aGVsbG8gd29_77-9ZA=='
* ```
*
* @param value - The byte array to encode.
* @param options - Encoding options.
* @returns The Base64 encoded string.
*/
function fromBytes(value, options = {}) {
	const { pad = true, url = false } = options;
	const encoded = new Uint8Array(Math.ceil(value.length / 3) * 4);
	for (let i = 0, j = 0; j < value.length; i += 4, j += 3) {
		const y = (value[j] << 16) + (value[j + 1] << 8) + (value[j + 2] | 0);
		encoded[i] = integerToCharacter[y >> 18];
		encoded[i + 1] = integerToCharacter[y >> 12 & 63];
		encoded[i + 2] = integerToCharacter[y >> 6 & 63];
		encoded[i + 3] = integerToCharacter[y & 63];
	}
	const k = value.length % 3;
	const end = Math.floor(value.length / 3) * 4 + (k && k + 1);
	let base64 = decoder$1.decode(new Uint8Array(encoded.buffer, 0, end));
	if (pad && k === 1) base64 += "==";
	if (pad && k === 2) base64 += "=";
	if (url) base64 = base64.replaceAll("+", "-").replaceAll("/", "_");
	return base64;
}
/**
* Encodes a string to a Base64-encoded string (with optional padding and/or URL-safe characters).
*
* @example
* ```ts twoslash
* import { Base64 } from 'ox'
*
* const value = Base64.fromString('hello world')
* // @log: 'aGVsbG8gd29ybGQ='
* ```
*
* @example
* ### No Padding
*
* Turn off [padding of encoded data](https://datatracker.ietf.org/doc/html/rfc4648#section-3.2) with the `pad` option:
*
* ```ts twoslash
* import { Base64 } from 'ox'
*
* const value = Base64.fromString('hello world', { pad: false })
* // @log: 'aGVsbG8gd29ybGQ'
* ```
*
* ### URL-safe Encoding
*
* Turn on [URL-safe encoding](https://datatracker.ietf.org/doc/html/rfc4648#section-5) (Base64 URL) with the `url` option:
*
* ```ts twoslash
* import { Base64 } from 'ox'
*
* const value = Base64.fromString('hello wod', { url: true })
* // @log: 'aGVsbG8gd29_77-9ZA=='
* ```
*
* @param value - The string to encode.
* @param options - Encoding options.
* @returns The Base64 encoded string.
*/
function fromString(value, options = {}) {
	return fromBytes(fromString$2(value), options);
}
/**
* Decodes a Base64-encoded string (with optional padding and/or URL-safe characters) to {@link ox#Bytes.Bytes}.
*
* @example
* ```ts twoslash
* import { Base64, Bytes } from 'ox'
*
* const value = Base64.toBytes('aGVsbG8gd29ybGQ=')
* // @log: Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])
* ```
*
* @param value - The string, hex value, or byte array to encode.
* @returns The Base64 decoded {@link ox#Bytes.Bytes}.
*/
function toBytes(value) {
	const base64 = value.replace(/=+$/, "");
	const size = base64.length;
	const decoded = new Uint8Array(size + 3);
	encoder.encodeInto(base64 + "===", decoded);
	for (let i = 0, j = 0; i < base64.length; i += 4, j += 3) {
		const x = (characterToInteger[decoded[i]] << 18) + (characterToInteger[decoded[i + 1]] << 12) + (characterToInteger[decoded[i + 2]] << 6) + characterToInteger[decoded[i + 3]];
		decoded[j] = x >> 16;
		decoded[j + 1] = x >> 8 & 255;
		decoded[j + 2] = x & 255;
	}
	const decodedSize = (size >> 2) * 3 + (size % 4 && size % 4 - 1);
	return new Uint8Array(decoded.buffer, 0, decodedSize);
}
/**
* Decodes a Base64-encoded string (with optional padding and/or URL-safe characters) to a string.
*
* @example
* ```ts twoslash
* import { Base64 } from 'ox'
*
* const value = Base64.toString('aGVsbG8gd29ybGQ=')
* // @log: 'hello world'
* ```
*
* @param value - The string, hex value, or byte array to encode.
* @returns The Base64 decoded string.
*/
function toString(value) {
	return toString$1(toBytes(value));
}
// ../../node_modules/viem/_esm/errors/ens.js
var EnsAvatarInvalidMetadataError = class extends BaseError$2 {
	constructor({ data }) {
		super("Unable to extract image from metadata. The metadata may be malformed or invalid.", {
			metaMessages: [
				"- Metadata must be a JSON object with at least an `image`, `image_url` or `image_data` property.",
				"",
				`Provided data: ${JSON.stringify(data)}`
			],
			name: "EnsAvatarInvalidMetadataError"
		});
	}
};
var EnsAvatarInvalidNftUriError = class extends BaseError$2 {
	constructor({ reason }) {
		super(`ENS NFT avatar URI is invalid. ${reason}`, { name: "EnsAvatarInvalidNftUriError" });
	}
};
var EnsAvatarUriResolutionError = class extends BaseError$2 {
	constructor({ uri }) {
		super(`Unable to resolve ENS avatar URI "${uri}". The URI may be malformed, invalid, or does not respond with a valid image.`, { name: "EnsAvatarUriResolutionError" });
	}
};
var EnsAvatarUnsupportedNamespaceError = class extends BaseError$2 {
	constructor({ namespace }) {
		super(`ENS NFT avatar namespace "${namespace}" is not supported. Must be "erc721" or "erc1155".`, { name: "EnsAvatarUnsupportedNamespaceError" });
	}
};
// ../../node_modules/viem/_esm/utils/ens/avatar/utils.js
var networkRegex = /(?<protocol>https?:\/\/[^/]*|ipfs:\/|ipns:\/|ar:\/)?(?<root>\/)?(?<subpath>ipfs\/|ipns\/)?(?<target>[\w\-.]+)(?<subtarget>\/.*)?/;
var ipfsHashRegex = /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,})(\/(?<target>[\w\-.]+))?(?<subtarget>\/.*)?$/;
var base64Regex = /^data:([a-zA-Z\-/+]*);base64,([^"].*)/;
var dataURIRegex = /^data:([a-zA-Z\-/+]*)?(;[a-zA-Z0-9].*?)?(,)/;
/** @internal */
async function isImageUri(uri) {
	try {
		const res = await fetch(uri, { method: "HEAD" });
		if (res.status === 200) return res.headers.get("content-type")?.startsWith("image/");
		return false;
	} catch (error) {
		if (typeof error === "object" && typeof error.response !== "undefined") return false;
		if (!Object.hasOwn(globalThis, "Image")) return false;
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => {
				resolve(true);
			};
			img.onerror = () => {
				resolve(false);
			};
			img.src = uri;
		});
	}
}
/** @internal */
function getGateway(custom, defaultGateway) {
	if (!custom) return defaultGateway;
	if (custom.endsWith("/")) return custom.slice(0, -1);
	return custom;
}
function resolveAvatarUri({ uri, gatewayUrls }) {
	const isEncoded = base64Regex.test(uri);
	if (isEncoded) return {
		uri,
		isOnChain: true,
		isEncoded
	};
	const ipfsGateway = getGateway(gatewayUrls?.ipfs, "https://ipfs.io");
	const arweaveGateway = getGateway(gatewayUrls?.arweave, "https://arweave.net");
	const { protocol, subpath, target, subtarget = "" } = uri.match(networkRegex)?.groups || {};
	const isIPNS = protocol === "ipns:/" || subpath === "ipns/";
	const isIPFS = protocol === "ipfs:/" || subpath === "ipfs/" || ipfsHashRegex.test(uri);
	if (uri.startsWith("http") && !isIPNS && !isIPFS) {
		let replacedUri = uri;
		if (gatewayUrls?.arweave) replacedUri = uri.replace(/https:\/\/arweave.net/g, gatewayUrls?.arweave);
		return {
			uri: replacedUri,
			isOnChain: false,
			isEncoded: false
		};
	}
	if ((isIPNS || isIPFS) && target) return {
		uri: `${ipfsGateway}/${isIPNS ? "ipns" : "ipfs"}/${target}${subtarget}`,
		isOnChain: false,
		isEncoded: false
	};
	if (protocol === "ar:/" && target) return {
		uri: `${arweaveGateway}/${target}${subtarget || ""}`,
		isOnChain: false,
		isEncoded: false
	};
	let parsedUri = uri.replace(dataURIRegex, "");
	if (parsedUri.startsWith("<svg")) parsedUri = `data:image/svg+xml;base64,${fromString(parsedUri)}`;
	if (parsedUri.startsWith("data:") || parsedUri.startsWith("{")) return {
		uri: parsedUri,
		isOnChain: true,
		isEncoded: false
	};
	throw new EnsAvatarUriResolutionError({ uri });
}
function getJsonImage(data) {
	if (typeof data !== "object" || !("image" in data) && !("image_url" in data) && !("image_data" in data)) throw new EnsAvatarInvalidMetadataError({ data });
	return data.image || data.image_url || data.image_data;
}
async function getMetadataAvatarUri({ gatewayUrls, uri }) {
	try {
		return await parseAvatarUri({
			gatewayUrls,
			uri: getJsonImage(await fetch(uri).then((res) => res.json()))
		});
	} catch {
		throw new EnsAvatarUriResolutionError({ uri });
	}
}
async function parseAvatarUri({ gatewayUrls, uri }) {
	const { uri: resolvedURI, isOnChain } = resolveAvatarUri({
		uri,
		gatewayUrls
	});
	if (isOnChain) return resolvedURI;
	if (await isImageUri(resolvedURI)) return resolvedURI;
	throw new EnsAvatarUriResolutionError({ uri });
}
function parseNftUri(uri_) {
	let uri = uri_;
	if (uri.startsWith("did:nft:")) uri = uri.replace("did:nft:", "").replace(/_/g, "/");
	const [reference, asset_namespace, tokenID] = uri.split("/");
	const [eip_namespace, chainID] = reference.split(":");
	const [erc_namespace, contractAddress] = asset_namespace.split(":");
	if (!eip_namespace || eip_namespace.toLowerCase() !== "eip155") throw new EnsAvatarInvalidNftUriError({ reason: "Only EIP-155 supported" });
	if (!chainID) throw new EnsAvatarInvalidNftUriError({ reason: "Chain ID not found" });
	if (!contractAddress) throw new EnsAvatarInvalidNftUriError({ reason: "Contract address not found" });
	if (!tokenID) throw new EnsAvatarInvalidNftUriError({ reason: "Token ID not found" });
	if (!erc_namespace) throw new EnsAvatarInvalidNftUriError({ reason: "ERC namespace not found" });
	return {
		chainID: Number.parseInt(chainID, 10),
		namespace: erc_namespace.toLowerCase(),
		contractAddress,
		tokenID
	};
}
async function getNftTokenUri(client, { nft }) {
	if (nft.namespace === "erc721") return readContract(client, {
		address: nft.contractAddress,
		abi: [{
			name: "tokenURI",
			type: "function",
			stateMutability: "view",
			inputs: [{
				name: "tokenId",
				type: "uint256"
			}],
			outputs: [{
				name: "",
				type: "string"
			}]
		}],
		functionName: "tokenURI",
		args: [BigInt(nft.tokenID)]
	});
	if (nft.namespace === "erc1155") return readContract(client, {
		address: nft.contractAddress,
		abi: [{
			name: "uri",
			type: "function",
			stateMutability: "view",
			inputs: [{
				name: "_id",
				type: "uint256"
			}],
			outputs: [{
				name: "",
				type: "string"
			}]
		}],
		functionName: "uri",
		args: [BigInt(nft.tokenID)]
	});
	throw new EnsAvatarUnsupportedNamespaceError({ namespace: nft.namespace });
}
/**
* Substitutes the `{id}` placeholder of an NFT metadata URI with the token ID.
*
* ERC-1155 requires the ID to be substituted as lowercase hex, without a `0x`
* prefix and zero-padded to 64 characters.
*
* @see https://eips.ethereum.org/EIPS/eip-1155#metadata
*/
function getNftMetadataUri({ nft, uri }) {
	const tokenId = nft.namespace === "erc1155" ? numberToHex(BigInt(nft.tokenID), { size: 32 }).slice(2) : nft.tokenID;
	return uri.replace(/(?:0x)?{id}/, tokenId);
}
// ../../node_modules/viem/_esm/utils/ens/avatar/parseAvatarRecord.js
async function parseAvatarRecord(client, { gatewayUrls, record }) {
	if (/eip155:/i.test(record)) return parseNftAvatarUri(client, {
		gatewayUrls,
		record
	});
	return parseAvatarUri({
		uri: record,
		gatewayUrls
	});
}
async function parseNftAvatarUri(client, { gatewayUrls, record }) {
	const nft = parseNftUri(record);
	const { uri: resolvedNftUri, isOnChain, isEncoded } = resolveAvatarUri({
		uri: await getNftTokenUri(client, { nft }),
		gatewayUrls
	});
	if (isOnChain && (resolvedNftUri.includes("data:application/json;base64,") || resolvedNftUri.startsWith("{"))) {
		const encodedJson = isEncoded ? toString(resolvedNftUri.replace("data:application/json;base64,", "").replace(/\s/g, "")) : resolvedNftUri;
		return parseAvatarUri({
			uri: getJsonImage(JSON.parse(encodedJson)),
			gatewayUrls
		});
	}
	return getMetadataAvatarUri({
		gatewayUrls,
		uri: getNftMetadataUri({
			nft,
			uri: resolvedNftUri
		})
	});
}
// ../../node_modules/viem/_esm/actions/ens/getEnsText.js
/**
* Gets a text record for specified ENS name.
*
* - Docs: https://viem.sh/docs/ens/actions/getEnsResolver
* - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/ens
*
* Calls `resolve(bytes, bytes)` on ENS Universal Resolver Contract.
*
* Since ENS names prohibit certain forbidden characters (e.g. underscore) and have other validation rules, you likely want to [normalize ENS names](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) with [UTS-46 normalization](https://unicode.org/reports/tr46) before passing them to `getEnsAddress`. You can use the built-in [`normalize`](https://viem.sh/docs/ens/utilities/normalize) function for this.
*
* @param client - Client to use
* @param parameters - {@link GetEnsTextParameters}
* @returns Address for ENS resolver. {@link GetEnsTextReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getEnsText, normalize } from 'viem/ens'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const twitterRecord = await getEnsText(client, {
*   name: normalize('wevm.eth'),
*   key: 'com.twitter',
* })
* // 'wevm_dev'
*/
async function getEnsText(client, parameters) {
	const { blockNumber, blockTag, key, name, gatewayUrls, strict } = parameters;
	const { chain } = client;
	const universalResolverAddress = (() => {
		if (parameters.universalResolverAddress) return parameters.universalResolverAddress;
		if (!chain) throw new Error("client chain not configured. universalResolverAddress is required.");
		return getChainContractAddress({
			blockNumber,
			chain,
			contract: "ensUniversalResolver"
		});
	})();
	const tlds = chain?.ensTlds;
	if (tlds && !tlds.some((tld) => name.endsWith(tld))) return null;
	try {
		const readContractParameters = {
			address: universalResolverAddress,
			abi: universalResolverResolveAbi,
			args: [
				toHex(packetToBytes(name)),
				encodeFunctionData({
					abi: textResolverAbi,
					functionName: "text",
					args: [namehash(name), key]
				}),
				gatewayUrls ?? ["x-batch-gateway:true"]
			],
			functionName: "resolveWithGateways",
			blockNumber,
			blockTag
		};
		const res = await getAction(client, readContract, "readContract")(readContractParameters);
		if (res[0] === "0x") return null;
		const record = decodeFunctionResult({
			abi: textResolverAbi,
			functionName: "text",
			data: res[0]
		});
		return record === "" ? null : record;
	} catch (err) {
		if (strict) throw err;
		if (isNullUniversalResolverError(err)) return null;
		throw err;
	}
}
// ../../node_modules/viem/_esm/actions/ens/getEnsAvatar.js
/**
* Gets the avatar of an ENS name.
*
* - Docs: https://viem.sh/docs/ens/actions/getEnsAvatar
* - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/ens
*
* Calls [`getEnsText`](https://viem.sh/docs/ens/actions/getEnsText) with `key` set to `'avatar'`.
*
* Since ENS names prohibit certain forbidden characters (e.g. underscore) and have other validation rules, you likely want to [normalize ENS names](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) with [UTS-46 normalization](https://unicode.org/reports/tr46) before passing them to `getEnsAddress`. You can use the built-in [`normalize`](https://viem.sh/docs/ens/utilities/normalize) function for this.
*
* @param client - Client to use
* @param parameters - {@link GetEnsAvatarParameters}
* @returns Avatar URI or `null` if not found. {@link GetEnsAvatarReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getEnsAvatar, normalize } from 'viem/ens'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const ensAvatar = await getEnsAvatar(client, {
*   name: normalize('wevm.eth'),
* })
* // 'https://ipfs.io/ipfs/Qma8mnp6xV3J2cRNf3mTth5C8nV11CAnceVinc3y8jSbio'
*/
async function getEnsAvatar(client, { blockNumber, blockTag, assetGatewayUrls, name, gatewayUrls, strict, universalResolverAddress }) {
	const record = await getAction(client, getEnsText, "getEnsText")({
		blockNumber,
		blockTag,
		key: "avatar",
		name,
		universalResolverAddress,
		gatewayUrls,
		strict
	});
	if (!record) return null;
	try {
		return await parseAvatarRecord(client, {
			record,
			gatewayUrls: assetGatewayUrls
		});
	} catch {
		return null;
	}
}
// ../../node_modules/viem/_esm/actions/ens/getEnsName.js
/**
* Gets primary name for specified address.
*
* - Docs: https://viem.sh/docs/ens/actions/getEnsName
* - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/ens
*
* Calls `reverse(bytes)` on ENS Universal Resolver Contract to "reverse resolve" the address to the primary ENS name.
*
* @param client - Client to use
* @param parameters - {@link GetEnsNameParameters}
* @returns Name or `null` if not found. {@link GetEnsNameReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getEnsName } from 'viem/ens'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const ensName = await getEnsName(client, {
*   address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
* })
* // 'wevm.eth'
*/
async function getEnsName(client, parameters) {
	const { address, blockNumber, blockTag, coinType = 60n, gatewayUrls, strict } = parameters;
	const { chain } = client;
	const universalResolverAddress = (() => {
		if (parameters.universalResolverAddress) return parameters.universalResolverAddress;
		if (!chain) throw new Error("client chain not configured. universalResolverAddress is required.");
		return getChainContractAddress({
			blockNumber,
			chain,
			contract: "ensUniversalResolver"
		});
	})();
	try {
		const readContractParameters = {
			address: universalResolverAddress,
			abi: universalResolverReverseAbi,
			args: [
				address,
				coinType,
				gatewayUrls ?? ["x-batch-gateway:true"]
			],
			functionName: "reverseWithGateways",
			blockNumber,
			blockTag
		};
		const [name] = await getAction(client, readContract, "readContract")(readContractParameters);
		return name || null;
	} catch (err) {
		if (strict) throw err;
		if (isNullUniversalResolverError(err)) return null;
		throw err;
	}
}
// ../../node_modules/viem/_esm/actions/ens/getEnsResolver.js
/**
* Gets resolver for ENS name.
*
* - Docs: https://viem.sh/docs/ens/actions/getEnsResolver
* - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/ens
*
* Calls `findResolver(bytes)` on ENS Universal Resolver Contract to retrieve the resolver of an ENS name.
*
* Since ENS names prohibit certain forbidden characters (e.g. underscore) and have other validation rules, you likely want to [normalize ENS names](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) with [UTS-46 normalization](https://unicode.org/reports/tr46) before passing them to `getEnsAddress`. You can use the built-in [`normalize`](https://viem.sh/docs/ens/utilities/normalize) function for this.
*
* @param client - Client to use
* @param parameters - {@link GetEnsResolverParameters}
* @returns Address for ENS resolver. {@link GetEnsResolverReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getEnsResolver, normalize } from 'viem/ens'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const resolverAddress = await getEnsResolver(client, {
*   name: normalize('wevm.eth'),
* })
* // '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41'
*/
async function getEnsResolver(client, parameters) {
	const { blockNumber, blockTag, name } = parameters;
	const { chain } = client;
	const universalResolverAddress = (() => {
		if (parameters.universalResolverAddress) return parameters.universalResolverAddress;
		if (!chain) throw new Error("client chain not configured. universalResolverAddress is required.");
		return getChainContractAddress({
			blockNumber,
			chain,
			contract: "ensUniversalResolver"
		});
	})();
	const tlds = chain?.ensTlds;
	if (tlds && !tlds.some((tld) => name.endsWith(tld))) throw new Error(`${name} is not a valid ENS TLD (${tlds?.join(", ")}) for chain "${chain.name}" (id: ${chain.id}).`);
	const [resolverAddress] = await getAction(client, readContract, "readContract")({
		address: universalResolverAddress,
		abi: [{
			inputs: [{ type: "bytes" }],
			name: "findResolver",
			outputs: [
				{ type: "address" },
				{ type: "bytes32" },
				{ type: "uint256" }
			],
			stateMutability: "view",
			type: "function"
		}],
		functionName: "findResolver",
		args: [toHex(packetToBytes(name))],
		blockNumber,
		blockTag
	});
	return resolverAddress;
}
// ../../node_modules/viem/_esm/actions/public/createAccessList.js
/**
* Creates an EIP-2930 access list.
*
* - Docs: https://viem.sh/docs/actions/public/createAccessList
* - JSON-RPC Methods: `eth_createAccessList`
*
* @param client - Client to use
* @param parameters - {@link CreateAccessListParameters}
* @returns The access list. {@link CreateAccessListReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { createAccessList } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const data = await createAccessList(client, {
*   account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
*   data: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
*   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
* })
*/
async function createAccessList(client, args) {
	const { account: account_ = client.account, blockNumber, blockTag = "latest", blobs, data, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, to, value, ...rest } = args;
	const account = account_ ? parseAccount(account_) : void 0;
	try {
		assertRequest(args);
		const block = (typeof blockNumber === "bigint" ? numberToHex(blockNumber) : void 0) || blockTag;
		const chainFormat = client.chain?.formatters?.transactionRequest?.format;
		const request = (chainFormat || formatTransactionRequest)({
			...extract(rest, { format: chainFormat }),
			account,
			blobs,
			data,
			gas,
			gasPrice,
			maxFeePerBlobGas,
			maxFeePerGas,
			maxPriorityFeePerGas,
			to,
			value
		}, "createAccessList");
		const response = await client.request({
			method: "eth_createAccessList",
			params: [request, block]
		});
		if (response.error) throw new BaseError$2(response.error, { details: response.error });
		return {
			accessList: response.accessList,
			gasUsed: BigInt(response.gasUsed)
		};
	} catch (err) {
		throw getCallError(err, {
			...args,
			account,
			chain: client.chain
		});
	}
}
// ../../node_modules/viem/_esm/actions/public/createBlockFilter.js
/**
* Creates a [`Filter`](https://viem.sh/docs/glossary/types#filter) to listen for new block hashes that can be used with [`getFilterChanges`](https://viem.sh/docs/actions/public/getFilterChanges).
*
* - Docs: https://viem.sh/docs/actions/public/createBlockFilter
* - JSON-RPC Methods: [`eth_newBlockFilter`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_newBlockFilter)
*
* @param client - Client to use
* @returns [`Filter`](https://viem.sh/docs/glossary/types#filter). {@link CreateBlockFilterReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { createBlockFilter } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const filter = await createBlockFilter(client)
* // { id: "0x345a6572337856574a76364e457a4366", type: 'block' }
*/
async function createBlockFilter(client) {
	const getRequest = createFilterRequestScope(client, { method: "eth_newBlockFilter" });
	const id = await client.request({ method: "eth_newBlockFilter" });
	return {
		id,
		request: getRequest(id),
		type: "block"
	};
}
// ../../node_modules/viem/_esm/actions/public/createEventFilter.js
/**
* Creates a [`Filter`](https://viem.sh/docs/glossary/types#filter) to listen for new events that can be used with [`getFilterChanges`](https://viem.sh/docs/actions/public/getFilterChanges).
*
* - Docs: https://viem.sh/docs/actions/public/createEventFilter
* - JSON-RPC Methods: [`eth_newFilter`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_newfilter)
*
* @param client - Client to use
* @param parameters - {@link CreateEventFilterParameters}
* @returns [`Filter`](https://viem.sh/docs/glossary/types#filter). {@link CreateEventFilterReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { createEventFilter } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const filter = await createEventFilter(client, {
*   address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
* })
*/
async function createEventFilter(client, { address, args, event, events: events_, fromBlock, strict, toBlock } = {}) {
	const events = events_ ?? (event ? [event] : void 0);
	const getRequest = createFilterRequestScope(client, { method: "eth_newFilter" });
	let topics = [];
	if (events) {
		topics = [events.flatMap((event) => encodeEventTopics({
			abi: [event],
			eventName: event.name,
			args
		}))];
		if (event) topics = topics[0];
	}
	const id = await client.request({
		method: "eth_newFilter",
		params: [{
			address,
			fromBlock: typeof fromBlock === "bigint" ? numberToHex(fromBlock) : fromBlock,
			toBlock: typeof toBlock === "bigint" ? numberToHex(toBlock) : toBlock,
			...topics.length ? { topics } : {}
		}]
	});
	return {
		abi: events,
		args,
		eventName: event ? event.name : void 0,
		fromBlock,
		id,
		request: getRequest(id),
		strict: Boolean(strict),
		toBlock,
		type: "event"
	};
}
// ../../node_modules/viem/_esm/actions/public/createPendingTransactionFilter.js
/**
* Creates a Filter to listen for new pending transaction hashes that can be used with [`getFilterChanges`](https://viem.sh/docs/actions/public/getFilterChanges).
*
* - Docs: https://viem.sh/docs/actions/public/createPendingTransactionFilter
* - JSON-RPC Methods: [`eth_newPendingTransactionFilter`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_newpendingtransactionfilter)
*
* @param client - Client to use
* @returns [`Filter`](https://viem.sh/docs/glossary/types#filter). {@link CreateBlockFilterReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { createPendingTransactionFilter } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const filter = await createPendingTransactionFilter(client)
* // { id: "0x345a6572337856574a76364e457a4366", type: 'transaction' }
*/
async function createPendingTransactionFilter(client) {
	const getRequest = createFilterRequestScope(client, { method: "eth_newPendingTransactionFilter" });
	const id = await client.request({ method: "eth_newPendingTransactionFilter" });
	return {
		id,
		request: getRequest(id),
		type: "transaction"
	};
}
// ../../node_modules/viem/_esm/actions/public/getBalance.js
/**
* Returns the balance of an address in wei.
*
* - Docs: https://viem.sh/docs/actions/public/getBalance
* - JSON-RPC Methods: [`eth_getBalance`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getbalance)
*
* You can convert the balance to ether units with [`formatEther`](https://viem.sh/docs/utilities/formatEther).
*
* ```ts
* const balance = await getBalance(client, {
*   address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
*   blockTag: 'safe'
* })
* const balanceAsEther = formatEther(balance)
* // "6.942"
* ```
*
* @param client - Client to use
* @param parameters - {@link GetBalanceParameters}
* @returns The balance of the address in wei. {@link GetBalanceReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getBalance } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const balance = await getBalance(client, {
*   address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
* })
* // 10000000000000000000000n (wei)
*/
async function getBalance$1(client, { address, blockHash, blockNumber, blockTag = client.experimental_blockTag ?? "latest", requireCanonical }) {
	const block = formatBlockParameter({
		blockHash,
		blockNumber,
		blockTag,
		requireCanonical
	});
	if (client.batch?.multicall && client.chain?.contracts?.multicall3) {
		const multicall3Address = client.chain.contracts.multicall3.address;
		const calldata = encodeFunctionData({
			abi: multicall3Abi,
			functionName: "getEthBalance",
			args: [address]
		});
		const { data } = await getAction(client, call, "call")({
			to: multicall3Address,
			data: calldata,
			blockHash,
			blockNumber,
			blockTag,
			requireCanonical
		});
		return decodeFunctionResult({
			abi: multicall3Abi,
			functionName: "getEthBalance",
			args: [address],
			data: data || "0x"
		});
	}
	const balance = await client.request({
		method: "eth_getBalance",
		params: [address, block]
	});
	return BigInt(balance);
}
// ../../node_modules/viem/_esm/actions/public/getBlobBaseFee.js
/**
* Returns the base fee per blob gas in wei.
*
* - Docs: https://viem.sh/docs/actions/public/getBlobBaseFee
* - JSON-RPC Methods: [`eth_blobBaseFee`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_blobBaseFee)
*
* @param client - Client to use
* @returns The blob base fee (in wei). {@link GetBlobBaseFeeReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getBlobBaseFee } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const blobBaseFee = await getBlobBaseFee(client)
*/
async function getBlobBaseFee(client) {
	const baseFee = await client.request({ method: "eth_blobBaseFee" });
	return BigInt(baseFee);
}
// ../../node_modules/viem/_esm/actions/public/getBlockReceipts.js
/**
* Returns the transaction receipts of a block at a block number, hash, or tag.
*
* - Docs: https://viem.sh/docs/actions/public/getBlockReceipts
* - JSON-RPC Methods: [`eth_getBlockReceipts`](https://ethereum.github.io/execution-apis/api/methods/eth_getBlockReceipts/)
*
* @param client - Client to use
* @param parameters - {@link GetBlockReceiptsParameters}
* @returns The transaction receipts. {@link GetBlockReceiptsReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getBlockReceipts } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const receipts = await getBlockReceipts(client, {
*   blockNumber: 69420n,
* })
*/
async function getBlockReceipts(client, { blockHash, blockNumber, blockTag = client.experimental_blockTag ?? "latest" } = {}) {
	const blockNumberHex = blockNumber !== void 0 ? numberToHex(blockNumber) : void 0;
	const receipts = await client.request({
		method: "eth_getBlockReceipts",
		params: [blockHash || blockNumberHex || blockTag]
	}, { dedupe: Boolean(blockHash || blockNumberHex) });
	if (!receipts) throw new BlockNotFoundError({
		blockHash,
		blockNumber
	});
	const format = client.chain?.formatters?.transactionReceipt?.format || formatTransactionReceipt;
	return receipts.map((receipt) => format(receipt, "getBlockReceipts"));
}
// ../../node_modules/viem/_esm/actions/public/getBlockTransactionCount.js
/**
* Returns the number of Transactions at a block number, hash, or tag.
*
* - Docs: https://viem.sh/docs/actions/public/getBlockTransactionCount
* - JSON-RPC Methods:
*   - Calls [`eth_getBlockTransactionCountByNumber`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getblocktransactioncountbynumber) for `blockNumber` & `blockTag`.
*   - Calls [`eth_getBlockTransactionCountByHash`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getblocktransactioncountbyhash) for `blockHash`.
*
* @param client - Client to use
* @param parameters - {@link GetBlockTransactionCountParameters}
* @returns The block transaction count. {@link GetBlockTransactionCountReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getBlockTransactionCount } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const count = await getBlockTransactionCount(client)
*/
async function getBlockTransactionCount(client, { blockHash, blockNumber, blockTag = "latest" } = {}) {
	const blockNumberHex = blockNumber !== void 0 ? numberToHex(blockNumber) : void 0;
	let count;
	if (blockHash) count = await client.request({
		method: "eth_getBlockTransactionCountByHash",
		params: [blockHash]
	}, { dedupe: true });
	else count = await client.request({
		method: "eth_getBlockTransactionCountByNumber",
		params: [blockNumberHex || blockTag]
	}, { dedupe: Boolean(blockNumberHex) });
	return hexToNumber$1(count);
}
// ../../node_modules/viem/_esm/actions/public/getCode.js
/**
* Retrieves the bytecode at an address.
*
* - Docs: https://viem.sh/docs/contract/getCode
* - JSON-RPC Methods: [`eth_getCode`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getcode)
*
* @param client - Client to use
* @param parameters - {@link GetCodeParameters}
* @returns The contract's bytecode. {@link GetCodeReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getCode } from 'viem/contract'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const code = await getCode(client, {
*   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
* })
*/
async function getCode(client, { address, blockHash, blockNumber, blockTag = "latest", requireCanonical }) {
	const block = formatBlockParameter({
		blockHash,
		blockNumber,
		blockTag,
		requireCanonical
	});
	const hex = await client.request({
		method: "eth_getCode",
		params: [address, block]
	}, { dedupe: typeof blockNumber === "bigint" || blockHash !== void 0 });
	if (hex === "0x") return void 0;
	return hex;
}
// ../../node_modules/viem/_esm/actions/public/getDelegation.js
/**
* Returns the address that an account has delegated to via EIP-7702.
*
* - Docs: https://viem.sh/docs/actions/public/getDelegation
*
* @param client - Client to use
* @param parameters - {@link GetDelegationParameters}
* @returns The delegated address, or undefined if not delegated. {@link GetDelegationReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getDelegation } from 'viem/actions'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const delegation = await getDelegation(client, {
*   address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
* })
*/
async function getDelegation(client, { address, blockNumber, blockTag = "latest" }) {
	const code = await getCode(client, {
		address,
		...blockNumber !== void 0 ? { blockNumber } : { blockTag }
	});
	if (!code) return void 0;
	if (size$3(code) !== 23) return void 0;
	if (!code.startsWith("0xef0100")) return void 0;
	return getAddress(slice$2(code, 3, 23));
}
// ../../node_modules/viem/_esm/errors/eip712.js
var Eip712DomainNotFoundError = class extends BaseError$2 {
	constructor({ address }) {
		super(`No EIP-712 domain found on contract "${address}".`, {
			metaMessages: [
				"Ensure that:",
				`- The contract is deployed at the address "${address}".`,
				"- `eip712Domain()` function exists on the contract.",
				"- `eip712Domain()` function matches signature to ERC-5267 specification."
			],
			name: "Eip712DomainNotFoundError"
		});
	}
};
// ../../node_modules/viem/_esm/actions/public/getEip712Domain.js
/**
* Reads the EIP-712 domain from a contract, based on the ERC-5267 specification.
*
* @param client - A {@link Client} instance.
* @param parameters - The parameters of the action. {@link GetEip712DomainParameters}
* @returns The EIP-712 domain, fields, and extensions. {@link GetEip712DomainReturnType}
*
* @example
* ```ts
* import { createPublicClient, http, getEip712Domain } from 'viem'
* import { mainnet } from 'viem/chains'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
*
* const domain = await getEip712Domain(client, {
*   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
* })
* // {
* //   domain: {
* //     name: 'ExampleContract',
* //     version: '1',
* //     chainId: 1,
* //     verifyingContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
* //   },
* //   fields: '0x0f',
* //   extensions: [],
* // }
* ```
*/
async function getEip712Domain(client, parameters) {
	const { address, factory, factoryData } = parameters;
	try {
		const [fields, name, version, chainId, verifyingContract, salt, extensions] = await getAction(client, readContract, "readContract")({
			abi,
			address,
			functionName: "eip712Domain",
			factory,
			factoryData
		});
		return {
			domain: {
				name,
				version,
				chainId: Number(chainId),
				verifyingContract,
				salt
			},
			extensions,
			fields
		};
	} catch (e) {
		const error = e;
		if (error.name === "ContractFunctionExecutionError" && error.cause.name === "ContractFunctionZeroDataError") throw new Eip712DomainNotFoundError({ address });
		throw error;
	}
}
var abi = [{
	inputs: [],
	name: "eip712Domain",
	outputs: [
		{
			name: "fields",
			type: "bytes1"
		},
		{
			name: "name",
			type: "string"
		},
		{
			name: "version",
			type: "string"
		},
		{
			name: "chainId",
			type: "uint256"
		},
		{
			name: "verifyingContract",
			type: "address"
		},
		{
			name: "salt",
			type: "bytes32"
		},
		{
			name: "extensions",
			type: "uint256[]"
		}
	],
	stateMutability: "view",
	type: "function"
}];
// ../../node_modules/viem/_esm/utils/formatters/feeHistory.js
function formatFeeHistory(feeHistory) {
	return {
		baseFeePerGas: feeHistory.baseFeePerGas.map((value) => BigInt(value)),
		gasUsedRatio: feeHistory.gasUsedRatio,
		oldestBlock: BigInt(feeHistory.oldestBlock),
		reward: feeHistory.reward?.map((reward) => reward.map((value) => BigInt(value)))
	};
}
// ../../node_modules/viem/_esm/actions/public/getFeeHistory.js
/**
* Returns a collection of historical gas information.
*
* - Docs: https://viem.sh/docs/actions/public/getFeeHistory
* - JSON-RPC Methods: [`eth_feeHistory`](https://docs.alchemy.com/reference/eth-feehistory)
*
* @param client - Client to use
* @param parameters - {@link GetFeeHistoryParameters}
* @returns The gas estimate (in wei). {@link GetFeeHistoryReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getFeeHistory } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const feeHistory = await getFeeHistory(client, {
*   blockCount: 4,
*   rewardPercentiles: [25, 75],
* })
*/
async function getFeeHistory(client, { blockCount, blockNumber, blockTag = "latest", rewardPercentiles }) {
	const blockNumberHex = typeof blockNumber === "bigint" ? numberToHex(blockNumber) : void 0;
	return formatFeeHistory(await client.request({
		method: "eth_feeHistory",
		params: [
			numberToHex(blockCount),
			blockNumberHex || blockTag,
			rewardPercentiles
		]
	}, { dedupe: Boolean(blockNumberHex) }));
}
// ../../node_modules/viem/_esm/actions/public/getFilterLogs.js
/**
* Returns a list of event logs since the filter was created.
*
* - Docs: https://viem.sh/docs/actions/public/getFilterLogs
* - JSON-RPC Methods: [`eth_getFilterLogs`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getfilterlogs)
*
* `getFilterLogs` is only compatible with **event filters**.
*
* @param client - Client to use
* @param parameters - {@link GetFilterLogsParameters}
* @returns A list of event logs. {@link GetFilterLogsReturnType}
*
* @example
* import { createPublicClient, http, parseAbiItem } from 'viem'
* import { mainnet } from 'viem/chains'
* import { createEventFilter, getFilterLogs } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const filter = await createEventFilter(client, {
*   address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
*   event: parseAbiItem('event Transfer(address indexed, address indexed, uint256)'),
* })
* const logs = await getFilterLogs(client, { filter })
*/
async function getFilterLogs(_client, { filter }) {
	const strict = filter.strict ?? false;
	const formattedLogs = (await filter.request({
		method: "eth_getFilterLogs",
		params: [filter.id]
	})).map((log) => formatLog(log));
	if (!filter.abi) return formattedLogs;
	return parseEventLogs({
		abi: filter.abi,
		eventName: filter.eventName,
		logs: formattedLogs,
		strict
	});
}
// ../../node_modules/viem/_esm/utils/authorization/verifyAuthorization.js
/**
* Verify that an Authorization object was signed by the provided address.
*
* - Docs {@link https://viem.sh/docs/utilities/verifyAuthorization}
*
* @param parameters - {@link VerifyAuthorizationParameters}
* @returns Whether or not the signature is valid. {@link VerifyAuthorizationReturnType}
*/
async function verifyAuthorization({ address, authorization, signature }) {
	const recovered = await (async () => {
		try {
			return await recoverAuthorizationAddress({
				authorization,
				signature
			});
		} catch (error) {
			if (error instanceof InvalidYParityError$1) return void 0;
			throw error;
		}
	})();
	if (!recovered) return false;
	return isAddressEqual(getAddress(address), recovered);
}
// ../../node_modules/viem/_esm/utils/promise/withDedupe.js
/** @internal */
var promiseCache = /*#__PURE__*/ new LruMap$1(8192);
/** Deduplicates in-flight promises. */
function withDedupe(fn, { enabled = true, id }) {
	if (!enabled || !id) return fn();
	if (promiseCache.get(id)) return promiseCache.get(id);
	const promise = fn().finally(() => promiseCache.delete(id));
	promiseCache.set(id, promise);
	return promise;
}
// ../../node_modules/viem/_esm/utils/buildRequest.js
function buildRequest(request, options = {}) {
	return async (args, overrideOptions = {}) => {
		const { dedupe = false, methods, retryDelay = 150, retryCount = 3, signal, uid } = {
			...options,
			...overrideOptions
		};
		const { method } = args;
		if (methods?.exclude?.includes(method)) throw new MethodNotSupportedRpcError(/* @__PURE__ */ new Error("method not supported"), { method });
		if (methods?.include && !methods.include.includes(method)) throw new MethodNotSupportedRpcError(/* @__PURE__ */ new Error("method not supported"), { method });
		if (signal?.aborted) throw getAbortError(signal);
		return withDedupe(() => withRetry(async () => {
			try {
				return await request(args, signal ? { signal } : void 0);
			} catch (err_) {
				if (signal?.aborted) throw getAbortError(signal);
				if (isAbortError(err_)) throw err_;
				const err = err_;
				switch (err.code) {
					case ParseRpcError.code: throw new ParseRpcError(err);
					case InvalidRequestRpcError.code: throw new InvalidRequestRpcError(err);
					case MethodNotFoundRpcError.code: throw new MethodNotFoundRpcError(err, { method: args.method });
					case InvalidParamsRpcError.code: throw new InvalidParamsRpcError(err);
					case InternalRpcError.code: throw new InternalRpcError(err);
					case InvalidInputRpcError.code: throw new InvalidInputRpcError(err);
					case ResourceNotFoundRpcError.code: throw new ResourceNotFoundRpcError(err);
					case ResourceUnavailableRpcError.code: throw new ResourceUnavailableRpcError(err);
					case TransactionRejectedRpcError.code: throw new TransactionRejectedRpcError(err);
					case MethodNotSupportedRpcError.code: throw new MethodNotSupportedRpcError(err, { method: args.method });
					case LimitExceededRpcError.code: throw new LimitExceededRpcError(err);
					case JsonRpcVersionUnsupportedError.code: throw new JsonRpcVersionUnsupportedError(err);
					case UserRejectedRequestError.code: throw new UserRejectedRequestError(err);
					case UnauthorizedProviderError.code: throw new UnauthorizedProviderError(err);
					case UnsupportedProviderMethodError.code: throw new UnsupportedProviderMethodError(err);
					case ProviderDisconnectedError.code: throw new ProviderDisconnectedError(err);
					case ChainDisconnectedError.code: throw new ChainDisconnectedError(err);
					case SwitchChainError.code: throw new SwitchChainError(err);
					case UnsupportedNonOptionalCapabilityError.code: throw new UnsupportedNonOptionalCapabilityError(err);
					case UnsupportedChainIdError.code: throw new UnsupportedChainIdError(err);
					case DuplicateIdError.code: throw new DuplicateIdError(err);
					case UnknownBundleIdError.code: throw new UnknownBundleIdError(err);
					case BundleTooLargeError.code: throw new BundleTooLargeError(err);
					case AtomicReadyWalletRejectedUpgradeError.code: throw new AtomicReadyWalletRejectedUpgradeError(err);
					case AtomicityNotSupportedError.code: throw new AtomicityNotSupportedError(err);
					case 5e3: throw new UserRejectedRequestError(err);
					case WalletConnectSessionSettlementError.code: throw new WalletConnectSessionSettlementError(err);
					default:
						if (err_ instanceof BaseError$2) throw err_;
						throw new UnknownRpcError(err);
				}
			}
		}, {
			delay: ({ count, error }) => {
				const retryAfter = getHttpError(error)?.headers?.get("Retry-After");
				if (retryAfter) {
					const seconds = Number.parseInt(retryAfter, 10);
					if (!Number.isNaN(seconds)) return seconds * 1e3;
					const delay = Date.parse(retryAfter) - Date.now();
					if (delay > 0) return delay;
				}
				return ~~(1 << count) * retryDelay;
			},
			retryCount,
			signal,
			shouldRetry: ({ error }) => shouldRetry(error)
		}), {
			enabled: dedupe,
			id: dedupe ? hashString(`${uid}.${stringify$1(args)}`) : void 0
		});
	};
}
/** @internal */
function shouldRetry(error) {
	if (isAbortError(error)) return false;
	const status = getHttpError(error)?.status;
	if ("code" in error && typeof error.code === "number") {
		if (error.code === -1) return true;
		if (error.code === LimitExceededRpcError.code) return true;
		if (error.code === InternalRpcError.code) return true;
		if (error.code === 429) return true;
		if (error.code === -32007) return true;
		if (error.code === MethodNotFoundRpcError.code) return false;
		if (error.code === MethodNotSupportedRpcError.code) return false;
		if (!status) return false;
	}
	if (status) {
		if (status === 403) return true;
		if (status === 408) return true;
		if (status === 413) return true;
		if (status === 429) return true;
		if (status === 500) return true;
		if (status === 502) return true;
		if (status === 503) return true;
		if (status === 504) return true;
		return false;
	}
	return true;
}
/** Returns the error in the cause chain that carries the HTTP response. */
function getHttpError(error) {
	if (!(error instanceof BaseError$2)) return void 0;
	return error.walk((err) => err instanceof HttpRequestError || err instanceof RpcRequestError);
}
/** @internal cyrb53 – fast, non-cryptographic 53-bit string hash */
function hashString(str, seed = 0) {
	let h1 = 3735928559 ^ seed;
	let h2 = 1103547991 ^ seed;
	for (let i = 0; i < str.length; i++) {
		const ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507);
	h1 ^= Math.imul(h2 ^ h2 >>> 16, 3266489909);
	h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507);
	h2 ^= Math.imul(h1 ^ h1 >>> 16, 3266489909);
	return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
// ../../node_modules/viem/_esm/utils/internal/http.js
/**
* Returns a signal that aborts as soon as any of `signals` aborts, and a
* `cleanup` function that detaches the listeners added to `signals`.
*/
function anySignal(signals) {
	const signals_ = signals.filter((signal) => !!signal);
	if (signals_.length < 2) return {
		signal: signals_[0] ?? null,
		cleanup: () => {}
	};
	const controller = new AbortController();
	const onAbort = () => {
		cleanup();
		controller.abort(signals_.find((signal) => signal.aborted)?.reason);
	};
	const cleanup = () => {
		for (const signal of signals_) signal.removeEventListener("abort", onAbort);
	};
	for (const signal of signals_) {
		if (signal.aborted) {
			cleanup();
			controller.abort(signal.reason);
			break;
		}
		signal.addEventListener("abort", onAbort);
	}
	return {
		signal: controller.signal,
		cleanup
	};
}
/**
* Reads a response body as text, throwing once it exceeds
* `maxResponseBodySize` bytes (`false` reads it whole).
*/
async function readResponseBody(response, { maxResponseBodySize }) {
	if (maxResponseBodySize === false) return response.text();
	const contentLength = response.headers.get("Content-Length");
	if (contentLength) {
		const size = Number(contentLength);
		if (size > maxResponseBodySize) {
			await response.body?.cancel();
			throw new ResponseBodyTooLargeError({
				maxSize: maxResponseBodySize,
				size
			});
		}
	}
	if (!response.body) {
		const body = await response.text();
		const size = new TextEncoder().encode(body).length;
		if (size > maxResponseBodySize) throw new ResponseBodyTooLargeError({
			maxSize: maxResponseBodySize,
			size
		});
		return body;
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let body = "";
	let size = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > maxResponseBodySize) {
				await reader.cancel();
				throw new ResponseBodyTooLargeError({
					maxSize: maxResponseBodySize,
					size
				});
			}
			body += decoder.decode(value, { stream: true });
		}
		body += decoder.decode();
		return body;
	} finally {
		reader.releaseLock();
	}
}
// ../../node_modules/viem/_esm/utils/promise/withTimeout.js
function withTimeout(fn, { errorInstance = /* @__PURE__ */ new Error("timed out"), timeout, signal }) {
	return new Promise((resolve, reject) => {
		(async () => {
			let timeoutId;
			const controller = new AbortController();
			try {
				if (timeout > 0) timeoutId = setTimeout(() => {
					if (signal) controller.abort();
					else reject(errorInstance);
				}, timeout);
				resolve(await fn({ signal: controller?.signal || null }));
			} catch (err) {
				if (controller?.signal.aborted && isAbortError(err)) {
					reject(errorInstance);
					return;
				}
				reject(err);
			} finally {
				clearTimeout(timeoutId);
			}
		})();
	});
}
// ../../node_modules/viem/_esm/utils/chain/defineChain.js
function defineChain(chain) {
	const chainInstance = {
		formatters: void 0,
		fees: void 0,
		serializers: void 0,
		...chain
	};
	function extend(base) {
		return (fnOrExtended) => {
			const properties = typeof fnOrExtended === "function" ? fnOrExtended(base) : fnOrExtended;
			const combined = {
				...base,
				...properties
			};
			return Object.assign(combined, { extend: extend(combined) });
		};
	}
	return Object.assign(chainInstance, { extend: extend(chainInstance) });
}
// ../../node_modules/viem/_esm/utils/rpc/id.js
function createIdStore() {
	return {
		current: 0,
		take() {
			return this.current++;
		},
		reset() {
			this.current = 0;
		}
	};
}
var idCache = /*#__PURE__*/ createIdStore();
// ../../node_modules/viem/_esm/utils/rpc/http.js
var defaultMaxResponseBodySize = 10485760;
/**
* Rejection of a request that timed out. Replaced by a `TimeoutError`, which
* serializes the request body, only once a request actually times out.
*/
var timedOut = /*#__PURE__*/ new Error("timed out");
function getHttpRpcClient(url_, options = {}) {
	const { url, headers: headers_url } = parseUrl(url_);
	return { async request(params) {
		const { body, fetchFn = options.fetchFn ?? fetch, maxResponseBodySize = options.maxResponseBodySize ?? defaultMaxResponseBodySize, onRequest = options.onRequest, onResponse = options.onResponse, timeout = options.timeout ?? 1e4 } = params;
		const fetchOptions = {
			...options.fetchOptions ?? {},
			...params.fetchOptions ?? {}
		};
		const { headers, method, signal: signal_ } = fetchOptions;
		try {
			const { response, responseBody } = await withTimeout(async ({ signal: timeoutSignal }) => {
				const { signal, cleanup } = anySignal([signal_, timeout > 0 ? timeoutSignal : null]);
				try {
					const init = {
						...fetchOptions,
						body: Array.isArray(body) ? stringify$1(body.map((body) => ({
							jsonrpc: "2.0",
							id: body.id ?? idCache.take(),
							...body
						}))) : stringify$1({
							jsonrpc: "2.0",
							id: body.id ?? idCache.take(),
							...body
						}),
						headers: {
							...headers_url,
							"Content-Type": "application/json",
							...headers
						},
						method: method || "POST",
						signal
					};
					const args = (onRequest && await onRequest(new Request(url, init), init)) ?? {
						...init,
						url
					};
					const response = await fetchFn(args.url ?? url, args);
					if (onResponse) await onResponse(response);
					return {
						response,
						responseBody: await readResponseBody(response, { maxResponseBodySize })
					};
				} finally {
					cleanup();
				}
			}, {
				errorInstance: timedOut,
				timeout,
				signal: true
			});
			let data;
			if (response.headers.get("Content-Type")?.startsWith("application/json")) data = JSON.parse(responseBody);
			else {
				data = responseBody;
				try {
					data = JSON.parse(data || "{}");
				} catch (err) {
					if (response.ok) throw err;
					data = { error: data };
				}
			}
			const error = Array.isArray(body) && Array.isArray(data) && data.length === 1 ? data[0] : data;
			if (!response.ok) {
				if (isRpcError(error)) throw new RpcRequestError({
					body,
					error: error.error,
					headers: response.headers,
					status: response.status,
					url
				});
				throw new HttpRequestError({
					body,
					details: stringify$1(data.error) || response.statusText,
					headers: response.headers,
					status: response.status,
					url
				});
			}
			if (!Array.isArray(body) || !body.length) return data;
			if (Array.isArray(data) && data.length >= body.length) return data;
			if (!isRpcError(error)) throw new Error(`Expected ${body.length} responses to batch request.`);
			return body.map(() => error);
		} catch (err) {
			if (signal_?.aborted) throw getAbortError(signal_);
			if (err === timedOut) throw new TimeoutError({
				body,
				url
			});
			if (isAbortError(err)) throw err;
			if (err instanceof HttpRequestError) throw err;
			if (err instanceof ResponseBodyTooLargeError) throw err;
			if (err instanceof RpcRequestError) throw err;
			if (err instanceof TimeoutError) throw err;
			throw new HttpRequestError({
				body,
				cause: err,
				url
			});
		}
	} };
}
function isRpcError(data) {
	return typeof data?.error?.code === "number" && typeof data?.error?.message === "string";
}
/** @internal */
function parseUrl(url_) {
	try {
		const url = new URL(url_);
		const result = (() => {
			if (url.username) {
				const credentials = `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`;
				url.username = "";
				url.password = "";
				return {
					url: url.toString(),
					headers: { Authorization: `Basic ${btoa(credentials)}` }
				};
			}
		})();
		return {
			url: url.toString(),
			...result
		};
	} catch {
		return { url: url_ };
	}
}
// ../../node_modules/viem/_esm/constants/strings.js
var presignMessagePrefix = "Ethereum Signed Message:\n";
// ../../node_modules/viem/_esm/utils/signature/toPrefixedMessage.js
function toPrefixedMessage(message_) {
	const message = (() => {
		if (typeof message_ === "string") return stringToHex(message_);
		if (typeof message_.raw === "string") return message_.raw;
		return bytesToHex$1(message_.raw);
	})();
	return concat$1([stringToHex(`${presignMessagePrefix}${size$3(message)}`), message]);
}
// ../../node_modules/viem/_esm/utils/signature/hashMessage.js
function hashMessage(message, to_) {
	return keccak256$1(toPrefixedMessage(message), to_);
}
// ../../node_modules/viem/_esm/errors/typedData.js
var InvalidDomainError = class extends BaseError$2 {
	constructor({ domain }) {
		super(`Invalid domain "${stringify$1(domain)}".`, { metaMessages: ["Must be a valid EIP-712 domain."] });
	}
};
var InvalidPrimaryTypeError = class extends BaseError$2 {
	constructor({ primaryType, types }) {
		super(`Invalid primary type \`${primaryType}\` must be one of \`${JSON.stringify(Object.keys(types))}\`.`, {
			docsPath: "/api/glossary/Errors#typeddatainvalidprimarytypeerror",
			metaMessages: ["Check that the primary type is a key in `types`."]
		});
	}
};
var InvalidStructTypeError = class extends BaseError$2 {
	constructor({ type }) {
		super(`Struct type "${type}" is invalid.`, {
			metaMessages: ["Struct type must contain only letters, digits, \"_\" and \"$\", and must not be a Solidity type."],
			name: "InvalidStructTypeError"
		});
	}
};
var InvalidTypedDataTypeError = class extends BaseError$2 {
	constructor({ type }) {
		const isAlias = /^u?int(\[[0-9]*\])*$/.test(type);
		super(`Type "${type}" is not a valid EIP-712 type.`, {
			metaMessages: isAlias ? [`Use "${type.replace(/^(u?int)/, "$&256")}" instead.`] : void 0,
			name: "InvalidTypedDataTypeError"
		});
	}
};
// ../../node_modules/viem/_esm/utils/typedData.js
function validateTypedData(parameters) {
	const { domain, message, primaryType, types } = parameters;
	const validateData = (struct, data) => {
		for (const param of struct) {
			const { name, type } = param;
			const value = data[name];
			const integerMatch = type.match(integerRegex$1);
			if (integerMatch && (typeof value === "number" || typeof value === "bigint")) {
				const [_type, base, size_] = integerMatch;
				numberToHex(value, {
					signed: base === "int",
					size: Number.parseInt(size_, 10) / 8
				});
			}
			if (type === "address" && typeof value === "string" && !isAddress(value)) throw new InvalidAddressError$1({ address: value });
			const bytesMatch = type.match(bytesRegex$1);
			if (bytesMatch) {
				const [_type, size_] = bytesMatch;
				if (size_ && size$3(value) !== Number.parseInt(size_, 10)) throw new BytesSizeMismatchError$1({
					expectedSize: Number.parseInt(size_, 10),
					givenSize: size$3(value)
				});
			}
			if (Object.hasOwn(types, type)) validateData(types[type], value);
		}
	};
	for (const type of Object.keys(types)) validateReference(type);
	for (const struct of Object.values(types)) for (const field of struct ?? []) validateField$1(field.type, types);
	if (types.EIP712Domain && domain) {
		if (typeof domain !== "object") throw new InvalidDomainError({ domain });
		validateData(types.EIP712Domain, domain);
	}
	if (primaryType !== "EIP712Domain") {
		if (types[primaryType]) validateData(types[primaryType], message);
		else throw new InvalidPrimaryTypeError({
			primaryType,
			types
		});
	}
}
function getTypesForEIP712Domain({ domain }) {
	return [
		typeof domain?.name === "string" && {
			name: "name",
			type: "string"
		},
		typeof domain?.version === "string" && {
			name: "version",
			type: "string"
		},
		(typeof domain?.chainId === "number" || typeof domain?.chainId === "bigint") && {
			name: "chainId",
			type: "uint256"
		},
		domain?.verifyingContract && {
			name: "verifyingContract",
			type: "address"
		},
		domain?.salt && {
			name: "salt",
			type: "bytes32"
		}
	].filter(Boolean);
}
/** @internal */
function validateField$1(type, types) {
	const baseType = type.replace(/(\[[0-9]*\])+$/, "");
	if (baseType === "int" || baseType === "uint") throw new InvalidTypedDataTypeError({ type });
	if (!Object.hasOwn(types, baseType) && !isSolidityType(baseType)) throw new InvalidTypedDataTypeError({ type });
}
/** @internal */
function isSolidityType(type) {
	return type === "address" || type === "bool" || type === "string" || bytesRegex$1.test(type) || integerRegex$1.test(type);
}
/** @internal */
function validateReference(type) {
	if (!/^[A-Za-z0-9_$]+$/.test(type) || type === "address" || type === "bool" || type === "string" || /^(u?int|bytes)[0-9]*$/.test(type)) throw new InvalidStructTypeError({ type });
}
// ../../node_modules/viem/_esm/utils/signature/hashTypedData.js
function hashTypedData(parameters) {
	const { domain = {}, message, primaryType } = parameters;
	const types = {
		EIP712Domain: getTypesForEIP712Domain({ domain }),
		...parameters.types
	};
	validateTypedData({
		domain,
		message,
		primaryType,
		types
	});
	const parts = ["0x1901"];
	if (domain) parts.push(hashDomain({
		domain,
		types
	}));
	if (primaryType !== "EIP712Domain") parts.push(hashStruct({
		data: message,
		primaryType,
		types
	}));
	return keccak256$1(concat$1(parts));
}
function hashDomain({ domain, types }) {
	return hashStruct({
		data: domain,
		primaryType: "EIP712Domain",
		types
	});
}
function hashStruct({ data, primaryType, types }) {
	const encoded = encodeData$1({
		data,
		primaryType,
		types
	});
	return keccak256$1(encoded);
}
function encodeData$1({ data, primaryType, types }) {
	const encodedTypes = [{ type: "bytes32" }];
	const encodedValues = [hashType({
		primaryType,
		types
	})];
	for (const field of types[primaryType]) {
		const [type, value] = encodeField({
			types,
			name: field.name,
			type: field.type,
			value: data[field.name]
		});
		encodedTypes.push(type);
		encodedValues.push(value);
	}
	return encodeAbiParameters(encodedTypes, encodedValues);
}
function hashType({ primaryType, types }) {
	const encodedHashType = toHex(encodeType({
		primaryType,
		types
	}));
	return keccak256$1(encodedHashType);
}
function encodeType({ primaryType, types }) {
	let result = "";
	const unsortedDeps = findTypeDependencies({
		primaryType,
		types
	});
	unsortedDeps.delete(primaryType);
	const deps = [primaryType, ...Array.from(unsortedDeps).sort()];
	for (const type of deps) result += `${type}(${types[type].map(({ name, type: t }) => `${t} ${name}`).join(",")})`;
	return result;
}
function findTypeDependencies({ primaryType: primaryType_, types }, results = /* @__PURE__ */ new Set()) {
	const primaryType = primaryType_.replace(/(\[[0-9]*\])+$/, "");
	if (results.has(primaryType) || types[primaryType] === void 0) return results;
	results.add(primaryType);
	for (const field of types[primaryType]) findTypeDependencies({
		primaryType: field.type,
		types
	}, results);
	return results;
}
function encodeField({ types, name, type, value }) {
	if (types[type] !== void 0) return [{ type: "bytes32" }, keccak256$1(encodeData$1({
		data: value,
		primaryType: type,
		types
	}))];
	if (type === "bytes") return [{ type: "bytes32" }, keccak256$1(value)];
	if (type === "string") return [{ type: "bytes32" }, keccak256$1(toHex(value))];
	if (type.lastIndexOf("]") === type.length - 1) {
		const parsedType = type.slice(0, type.lastIndexOf("["));
		const typeValuePairs = value.map((item) => encodeField({
			name,
			type: parsedType,
			types,
			value: item
		}));
		return [{ type: "bytes32" }, keccak256$1(encodeAbiParameters(typeValuePairs.map(([t]) => t), typeValuePairs.map(([, v]) => v)))];
	}
	return [{ type }, value];
}
// ../../node_modules/viem/node_modules/ox/_esm/core/internal/lru.js
/**
* @internal
*
* Map with a LRU (Least recently used) policy.
* @see https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU
*/
var LruMap = class extends Map {
	constructor(size) {
		super();
		Object.defineProperty(this, "maxSize", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0
		});
		this.maxSize = size;
	}
	get(key) {
		const value = super.get(key);
		if (super.has(key) && value !== void 0) {
			this.delete(key);
			super.set(key, value);
		}
		return value;
	}
	set(key, value) {
		super.set(key, value);
		if (this.maxSize && this.size > this.maxSize) {
			const firstKey = this.keys().next().value;
			if (firstKey) this.delete(firstKey);
		}
		return this;
	}
};
var checksum$1 = { checksum: /*#__PURE__*/ new LruMap(8192) }.checksum;
// ../../node_modules/viem/node_modules/@noble/hashes/esm/hmac.js
/**
* HMAC: RFC2104 message authentication code.
* @module
*/
var HMAC = class extends Hash {
	constructor(hash, _key) {
		super();
		this.finished = false;
		this.destroyed = false;
		ahash(hash);
		const key = toBytes$2(_key);
		this.iHash = hash.create();
		if (typeof this.iHash.update !== "function") throw new Error("Expected instance of class which extends utils.Hash");
		this.blockLen = this.iHash.blockLen;
		this.outputLen = this.iHash.outputLen;
		const blockLen = this.blockLen;
		const pad = new Uint8Array(blockLen);
		pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
		for (let i = 0; i < pad.length; i++) pad[i] ^= 54;
		this.iHash.update(pad);
		this.oHash = hash.create();
		for (let i = 0; i < pad.length; i++) pad[i] ^= 106;
		this.oHash.update(pad);
		clean(pad);
	}
	update(buf) {
		aexists(this);
		this.iHash.update(buf);
		return this;
	}
	digestInto(out) {
		aexists(this);
		abytes$1(out, this.outputLen);
		this.finished = true;
		this.iHash.digestInto(out);
		this.oHash.update(out);
		this.oHash.digestInto(out);
		this.destroy();
	}
	digest() {
		const out = new Uint8Array(this.oHash.outputLen);
		this.digestInto(out);
		return out;
	}
	_cloneInto(to) {
		to || (to = Object.create(Object.getPrototypeOf(this), {}));
		const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
		to = to;
		to.finished = finished;
		to.destroyed = destroyed;
		to.blockLen = blockLen;
		to.outputLen = outputLen;
		to.oHash = oHash._cloneInto(to.oHash);
		to.iHash = iHash._cloneInto(to.iHash);
		return to;
	}
	clone() {
		return this._cloneInto();
	}
	destroy() {
		this.destroyed = true;
		this.oHash.destroy();
		this.iHash.destroy();
	}
};
/**
* HMAC: RFC2104 message authentication code.
* @param hash - function that would be used e.g. sha256
* @param key - message key
* @param message - message data
* @example
* import { hmac } from '@noble/hashes/hmac';
* import { sha256 } from '@noble/hashes/sha2';
* const mac1 = hmac(sha256, 'key', 'message');
*/
var hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
hmac.create = (hash, key) => new HMAC(hash, key);
// ../../node_modules/viem/node_modules/ox/_esm/core/Hash.js
/**
* Calculates the [Keccak256](https://en.wikipedia.org/wiki/SHA-3) hash of a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
*
* This function is a re-export of `keccak_256` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes), an audited & minimal JS hashing library.
*
* @example
* ```ts twoslash
* import { Hash } from 'ox'
*
* Hash.keccak256('0xdeadbeef')
* // @log: '0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1'
* ```
*
* @example
* ### Calculate Hash of a String
*
* ```ts twoslash
* import { Hash, Hex } from 'ox'
*
* Hash.keccak256(Hex.fromString('hello world'))
* // @log: '0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0'
* ```
*
* @example
* ### Configure Return Type
*
* ```ts twoslash
* import { Hash } from 'ox'
*
* Hash.keccak256('0xdeadbeef', { as: 'Bytes' })
* // @log: Uint8Array [...]
* ```
*
* @param value - {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
* @param options - Options.
* @returns Keccak256 hash.
*/
function keccak256(value, options = {}) {
	const { as = typeof value === "string" ? "Hex" : "Bytes" } = options;
	const bytes = keccak_256(from$7(value));
	if (as === "Bytes") return bytes;
	return fromBytes$1(bytes);
}
// ../../node_modules/viem/node_modules/ox/_esm/core/Address.js
var addressRegex = /^0x[a-fA-F0-9]{40}$/;
/**
* Asserts that the given value is a valid {@link ox#Address.Address}.
*
* @example
* ```ts twoslash
* import { Address } from 'ox'
*
* Address.assert('0xA0Cf798816D4b9b9866b5330EEa46a18382f251e')
* ```
*
* @example
* ```ts twoslash
* import { Address } from 'ox'
*
* Address.assert('0xdeadbeef')
* // @error: InvalidAddressError: Address "0xdeadbeef" is invalid.
* ```
*
* @param value - Value to assert if it is a valid address.
* @param options - Assertion options.
*/
function assert$3(value, options = {}) {
	const { strict = true } = options;
	if (!addressRegex.test(value)) throw new InvalidAddressError({
		address: value,
		cause: new InvalidInputError()
	});
	if (strict) {
		if (value.toLowerCase() === value) return;
		if (checksum(value) !== value) throw new InvalidAddressError({
			address: value,
			cause: new InvalidChecksumError()
		});
	}
}
/**
* Computes the checksum address for the given {@link ox#Address.Address}.
*
* @example
* ```ts twoslash
* import { Address } from 'ox'
*
* Address.checksum('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
* // @log: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
* ```
*
* @param address - The address to compute the checksum for.
* @returns The checksummed address.
*/
function checksum(address) {
	if (checksum$1.has(address)) return checksum$1.get(address);
	assert$3(address, { strict: false });
	const hexAddress = address.substring(2).toLowerCase();
	const hash = keccak256(fromString$2(hexAddress), { as: "Bytes" });
	const characters = hexAddress.split("");
	for (let i = 0; i < 40; i += 2) {
		if (hash[i >> 1] >> 4 >= 8 && characters[i]) characters[i] = characters[i].toUpperCase();
		if ((hash[i >> 1] & 15) >= 8 && characters[i + 1]) characters[i + 1] = characters[i + 1].toUpperCase();
	}
	const result = `0x${characters.join("")}`;
	checksum$1.set(address, result);
	return result;
}
/**
* Checks if the given address is a valid {@link ox#Address.Address}.
*
* @example
* ```ts twoslash
* import { Address } from 'ox'
*
* Address.validate('0xA0Cf798816D4b9b9866b5330EEa46a18382f251e')
* // @log: true
* ```
*
* @example
* ```ts twoslash
* import { Address } from 'ox'
*
* Address.validate('0xdeadbeef')
* // @log: false
* ```
*
* @param address - Value to check if it is a valid address.
* @param options - Check options.
* @returns Whether the address is a valid address.
*/
function validate$2(address, options = {}) {
	const { strict = true } = options ?? {};
	try {
		assert$3(address, { strict });
		return true;
	} catch {
		return false;
	}
}
/**
* Thrown when an address is invalid.
*
* @example
* ```ts twoslash
* import { Address } from 'ox'
*
* Address.from('0x123')
* // @error: Address.InvalidAddressError: Address `0x123` is invalid.
* ```
*/
var InvalidAddressError = class extends BaseError {
	constructor({ address, cause }) {
		super(`Address "${address}" is invalid.`, { cause });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Address.InvalidAddressError"
		});
	}
};
/** Thrown when an address is not a 20 byte (40 hexadecimal character) value. */
var InvalidInputError = class extends BaseError {
	constructor() {
		super("Address is not a 20 byte (40 hexadecimal character) value.");
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Address.InvalidInputError"
		});
	}
};
/** Thrown when an address does not match its checksum counterpart. */
var InvalidChecksumError = class extends BaseError {
	constructor() {
		super("Address does not match its checksum counterpart.");
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Address.InvalidChecksumError"
		});
	}
};
// ../../node_modules/viem/node_modules/ox/_esm/core/Solidity.js
var arrayRegex = /^(.*)\[([0-9]*)\]$/;
var bytesRegex = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
var integerRegex = /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
2n ** (8n - 1n) - 1n;
2n ** (16n - 1n) - 1n;
2n ** (24n - 1n) - 1n;
2n ** (32n - 1n) - 1n;
2n ** (40n - 1n) - 1n;
2n ** (48n - 1n) - 1n;
2n ** (56n - 1n) - 1n;
2n ** (64n - 1n) - 1n;
2n ** (72n - 1n) - 1n;
2n ** (80n - 1n) - 1n;
2n ** (88n - 1n) - 1n;
2n ** (96n - 1n) - 1n;
2n ** (104n - 1n) - 1n;
2n ** (112n - 1n) - 1n;
2n ** (120n - 1n) - 1n;
2n ** (128n - 1n) - 1n;
2n ** (136n - 1n) - 1n;
2n ** (144n - 1n) - 1n;
2n ** (152n - 1n) - 1n;
2n ** (160n - 1n) - 1n;
2n ** (168n - 1n) - 1n;
2n ** (176n - 1n) - 1n;
2n ** (184n - 1n) - 1n;
2n ** (192n - 1n) - 1n;
2n ** (200n - 1n) - 1n;
2n ** (208n - 1n) - 1n;
2n ** (216n - 1n) - 1n;
2n ** (224n - 1n) - 1n;
2n ** (232n - 1n) - 1n;
2n ** (240n - 1n) - 1n;
2n ** (248n - 1n) - 1n;
2n ** (256n - 1n) - 1n;
-(2n ** (8n - 1n));
-(2n ** (16n - 1n));
-(2n ** (24n - 1n));
-(2n ** (32n - 1n));
-(2n ** (40n - 1n));
-(2n ** (48n - 1n));
-(2n ** (56n - 1n));
-(2n ** (64n - 1n));
-(2n ** (72n - 1n));
-(2n ** (80n - 1n));
-(2n ** (88n - 1n));
-(2n ** (96n - 1n));
-(2n ** (104n - 1n));
-(2n ** (112n - 1n));
-(2n ** (120n - 1n));
-(2n ** (128n - 1n));
-(2n ** (136n - 1n));
-(2n ** (144n - 1n));
-(2n ** (152n - 1n));
-(2n ** (160n - 1n));
-(2n ** (168n - 1n));
-(2n ** (176n - 1n));
-(2n ** (184n - 1n));
-(2n ** (192n - 1n));
-(2n ** (200n - 1n));
-(2n ** (208n - 1n));
-(2n ** (216n - 1n));
-(2n ** (224n - 1n));
-(2n ** (232n - 1n));
-(2n ** (240n - 1n));
-(2n ** (248n - 1n));
-(2n ** (256n - 1n));
var maxUint256 = 2n ** 256n - 1n;
// ../../node_modules/viem/node_modules/ox/_esm/core/internal/abiParameters.js
/** @internal */
function decodeParameter(cursor, param, options) {
	const { checksumAddress, staticPosition } = options;
	const arrayComponents = getArrayComponents(param.type);
	if (arrayComponents) {
		const [length, type] = arrayComponents;
		return decodeArray(cursor, {
			...param,
			type
		}, {
			checksumAddress,
			length,
			staticPosition
		});
	}
	if (param.type === "tuple") return decodeTuple(cursor, param, {
		checksumAddress,
		staticPosition
	});
	if (param.type === "address") return decodeAddress(cursor, { checksum: checksumAddress });
	if (param.type === "bool") return decodeBool(cursor);
	if (param.type.startsWith("bytes")) return decodeBytes(cursor, param, { staticPosition });
	if (param.type.startsWith("uint") || param.type.startsWith("int")) return decodeNumber(cursor, param);
	if (param.type === "string") return decodeString(cursor, { staticPosition });
	throw new InvalidTypeError(param.type);
}
var sizeOfLength = 32;
var sizeOfOffset = 32;
/** @internal */
function decodeAddress(cursor, options = {}) {
	const { checksum: checksum$2 = false } = options;
	const value = cursor.readBytes(32);
	const wrap = (address) => checksum$2 ? checksum(address) : address;
	return [wrap(fromBytes$1(slice$1(value, -20))), 32];
}
/** @internal */
function decodeArray(cursor, param, options) {
	const { checksumAddress, length, staticPosition } = options;
	if (length === null) {
		const start = staticPosition + toNumber$1(cursor.readBytes(sizeOfOffset));
		const startOfData = start + sizeOfLength;
		cursor.setPosition(start);
		const length = toNumber$1(cursor.readBytes(sizeOfLength));
		const dynamicChild = hasDynamicChild(param);
		let consumed = 0;
		const value = [];
		for (let i = 0; i < length; ++i) {
			cursor.setPosition(startOfData + (dynamicChild ? i * 32 : consumed));
			const [data, consumed_] = decodeParameter(cursor, param, {
				checksumAddress,
				staticPosition: startOfData
			});
			consumed += consumed_;
			value.push(data);
			if (consumed_ === 0) {
				cursor.assertReadLimit();
				cursor._touch();
			}
		}
		cursor.setPosition(staticPosition + 32);
		return [value, 32];
	}
	if (hasDynamicChild(param)) {
		const start = staticPosition + toNumber$1(cursor.readBytes(sizeOfOffset));
		const value = [];
		for (let i = 0; i < length; ++i) {
			cursor.setPosition(start + i * 32);
			const [data] = decodeParameter(cursor, param, {
				checksumAddress,
				staticPosition: start
			});
			value.push(data);
		}
		cursor.setPosition(staticPosition + 32);
		return [value, 32];
	}
	let consumed = 0;
	const value = [];
	for (let i = 0; i < length; ++i) {
		const [data, consumed_] = decodeParameter(cursor, param, {
			checksumAddress,
			staticPosition: staticPosition + consumed
		});
		consumed += consumed_;
		value.push(data);
		if (consumed_ === 0) {
			cursor.assertReadLimit();
			cursor._touch();
		}
	}
	return [value, consumed];
}
/** @internal */
function decodeBool(cursor) {
	return [toBoolean(cursor.readBytes(32), { size: 32 }), 32];
}
/** @internal */
function decodeBytes(cursor, param, { staticPosition }) {
	const [_, size] = param.type.split("bytes");
	if (!size) {
		const offset = toNumber$1(cursor.readBytes(32));
		cursor.setPosition(staticPosition + offset);
		const length = toNumber$1(cursor.readBytes(32));
		if (length === 0) {
			cursor.setPosition(staticPosition + 32);
			return ["0x", 32];
		}
		const data = cursor.readBytes(length);
		cursor.setPosition(staticPosition + 32);
		return [fromBytes$1(data), 32];
	}
	return [fromBytes$1(cursor.readBytes(Number.parseInt(size, 10), 32)), 32];
}
/** @internal */
function decodeNumber(cursor, param) {
	const signed = param.type.startsWith("int");
	const size = Number.parseInt(param.type.split("int")[1] || "256", 10);
	const value = cursor.readBytes(32);
	return [size > 48 ? toBigInt$1(value, { signed }) : toNumber$1(value, { signed }), 32];
}
/** @internal */
function decodeTuple(cursor, param, options) {
	const { checksumAddress, staticPosition } = options;
	const hasUnnamedChild = param.components.length === 0 || param.components.some(({ name }) => !name);
	const value = hasUnnamedChild ? [] : {};
	let consumed = 0;
	if (hasDynamicChild(param)) {
		const start = staticPosition + toNumber$1(cursor.readBytes(sizeOfOffset));
		for (let i = 0; i < param.components.length; ++i) {
			const component = param.components[i];
			cursor.setPosition(start + consumed);
			const [data, consumed_] = decodeParameter(cursor, component, {
				checksumAddress,
				staticPosition: start
			});
			consumed += consumed_;
			value[hasUnnamedChild ? i : component?.name] = data;
		}
		cursor.setPosition(staticPosition + 32);
		return [value, 32];
	}
	for (let i = 0; i < param.components.length; ++i) {
		const component = param.components[i];
		const [data, consumed_] = decodeParameter(cursor, component, {
			checksumAddress,
			staticPosition
		});
		value[hasUnnamedChild ? i : component?.name] = data;
		consumed += consumed_;
	}
	return [value, consumed];
}
/** @internal */
function decodeString(cursor, { staticPosition }) {
	const start = staticPosition + toNumber$1(cursor.readBytes(32));
	cursor.setPosition(start);
	const length = toNumber$1(cursor.readBytes(32));
	if (length === 0) {
		cursor.setPosition(staticPosition + 32);
		return ["", 32];
	}
	const value = toString$1(trimLeft(cursor.readBytes(length, 32)));
	cursor.setPosition(staticPosition + 32);
	return [value, 32];
}
/** @internal */
function prepareParameters({ checksumAddress, parameters, values }) {
	const preparedParameters = [];
	for (let i = 0; i < parameters.length; i++) preparedParameters.push(prepareParameter({
		checksumAddress,
		parameter: parameters[i],
		value: values[i]
	}));
	return preparedParameters;
}
/** @internal */
function prepareParameter({ checksumAddress = false, parameter: parameter_, value }) {
	const parameter = parameter_;
	const arrayComponents = getArrayComponents(parameter.type);
	if (arrayComponents) {
		const [length, type] = arrayComponents;
		return encodeArray(value, {
			checksumAddress,
			length,
			parameter: {
				...parameter,
				type
			}
		});
	}
	if (parameter.type === "tuple") return encodeTuple(value, {
		checksumAddress,
		parameter
	});
	if (parameter.type === "address") return encodeAddress(value, { checksum: checksumAddress });
	if (parameter.type === "bool") return encodeBoolean(value);
	if (parameter.type.startsWith("uint") || parameter.type.startsWith("int")) {
		const signed = parameter.type.startsWith("int");
		const [, , size = "256"] = integerRegex.exec(parameter.type) ?? [];
		return encodeNumber(value, {
			signed,
			size: Number(size)
		});
	}
	if (parameter.type.startsWith("bytes")) return encodeBytes(value, { type: parameter.type });
	if (parameter.type === "string") return encodeString(value);
	throw new InvalidTypeError(parameter.type);
}
/** @internal */
function encode$2(preparedParameters) {
	let staticSize = 0;
	for (let i = 0; i < preparedParameters.length; i++) {
		const { dynamic, encoded } = preparedParameters[i];
		if (dynamic) staticSize += 32;
		else staticSize += size$1(encoded);
	}
	const staticParameters = [];
	const dynamicParameters = [];
	let dynamicSize = 0;
	for (let i = 0; i < preparedParameters.length; i++) {
		const { dynamic, encoded } = preparedParameters[i];
		if (dynamic) {
			staticParameters.push(fromNumber(staticSize + dynamicSize, { size: 32 }));
			dynamicParameters.push(encoded);
			dynamicSize += size$1(encoded);
		} else staticParameters.push(encoded);
	}
	return concat(...staticParameters, ...dynamicParameters);
}
/** @internal */
function encodeAddress(value, options) {
	const { checksum = false } = options;
	assert$3(value, { strict: checksum });
	return {
		dynamic: false,
		encoded: padLeft(value.toLowerCase())
	};
}
/** @internal */
function encodeArray(value, options) {
	const { checksumAddress, length, parameter } = options;
	const dynamic = length === null;
	if (!Array.isArray(value)) throw new InvalidArrayError(value);
	if (!dynamic && value.length !== length) throw new ArrayLengthMismatchError({
		expectedLength: length,
		givenLength: value.length,
		type: `${parameter.type}[${length}]`
	});
	let dynamicChild = value.length === 0 && hasDynamicChild(parameter);
	const preparedParameters = [];
	for (let i = 0; i < value.length; i++) {
		const preparedParam = prepareParameter({
			checksumAddress,
			parameter,
			value: value[i]
		});
		if (preparedParam.dynamic) dynamicChild = true;
		preparedParameters.push(preparedParam);
	}
	if (dynamic || dynamicChild) {
		const data = encode$2(preparedParameters);
		if (dynamic) {
			const length = fromNumber(preparedParameters.length, { size: 32 });
			return {
				dynamic: true,
				encoded: preparedParameters.length > 0 ? concat(length, data) : length
			};
		}
		if (dynamicChild) return {
			dynamic: true,
			encoded: data
		};
	}
	return {
		dynamic: false,
		encoded: concat(...preparedParameters.map(({ encoded }) => encoded))
	};
}
/** @internal */
function encodeBytes(value, { type }) {
	const [, parametersize] = type.split("bytes");
	const bytesSize = size$1(value);
	if (!parametersize) {
		let value_ = value;
		if (bytesSize % 32 !== 0) value_ = padRight(value_, Math.ceil((value.length - 2) / 2 / 32) * 32);
		return {
			dynamic: true,
			encoded: concat(padLeft(fromNumber(bytesSize, { size: 32 })), value_)
		};
	}
	if (bytesSize !== Number.parseInt(parametersize, 10)) throw new BytesSizeMismatchError({
		expectedSize: Number.parseInt(parametersize, 10),
		value
	});
	return {
		dynamic: false,
		encoded: padRight(value)
	};
}
/** @internal */
function encodeBoolean(value) {
	if (typeof value !== "boolean") throw new BaseError(`Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`);
	return {
		dynamic: false,
		encoded: padLeft(fromBoolean(value))
	};
}
/** @internal */
function encodeNumber(value, { signed, size }) {
	if (typeof size === "number") {
		const max = 2n ** (BigInt(size) - (signed ? 1n : 0n)) - 1n;
		const min = signed ? -max - 1n : 0n;
		if (value > max || value < min) throw new IntegerOutOfRangeError({
			max: max.toString(),
			min: min.toString(),
			signed,
			size: size / 8,
			value: value.toString()
		});
	}
	return {
		dynamic: false,
		encoded: fromNumber(value, {
			size: 32,
			signed
		})
	};
}
/** @internal */
function encodeString(value) {
	const hexValue = fromString$1(value);
	const partsLength = Math.ceil(size$1(hexValue) / 32);
	const parts = [];
	for (let i = 0; i < partsLength; i++) parts.push(padRight(slice(hexValue, i * 32, (i + 1) * 32)));
	return {
		dynamic: true,
		encoded: concat(padRight(fromNumber(size$1(hexValue), { size: 32 })), ...parts)
	};
}
/** @internal */
function encodeTuple(value, options) {
	const { checksumAddress, parameter } = options;
	let dynamic = false;
	const preparedParameters = [];
	for (let i = 0; i < parameter.components.length; i++) {
		const param_ = parameter.components[i];
		const preparedParam = prepareParameter({
			checksumAddress,
			parameter: param_,
			value: value[Array.isArray(value) ? i : param_.name]
		});
		preparedParameters.push(preparedParam);
		if (preparedParam.dynamic) dynamic = true;
	}
	return {
		dynamic,
		encoded: dynamic ? encode$2(preparedParameters) : concat(...preparedParameters.map(({ encoded }) => encoded))
	};
}
/** @internal */
function getArrayComponents(type) {
	const matches = type.match(/^(.*)\[(\d+)?\]$/);
	return matches ? [matches[2] ? Number(matches[2]) : null, matches[1]] : void 0;
}
/** @internal */
function hasDynamicChild(param) {
	const { type } = param;
	if (type === "string") return true;
	if (type === "bytes") return true;
	if (type.endsWith("[]")) return true;
	if (type === "tuple") return param.components?.some(hasDynamicChild);
	const arrayComponents = getArrayComponents(param.type);
	if (arrayComponents && hasDynamicChild({
		...param,
		type: arrayComponents[1]
	})) return true;
	return false;
}
// ../../node_modules/viem/node_modules/ox/_esm/core/internal/cursor.js
var staticCursor = {
	bytes: /* @__PURE__ */ new Uint8Array(),
	dataView: /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(0)),
	position: 0,
	positionReadCount: /* @__PURE__ */ new Map(),
	recursiveReadCount: 0,
	recursiveReadLimit: Number.POSITIVE_INFINITY,
	assertReadLimit() {
		if (this.recursiveReadCount >= this.recursiveReadLimit) throw new RecursiveReadLimitExceededError({
			count: this.recursiveReadCount + 1,
			limit: this.recursiveReadLimit
		});
	},
	assertPosition(position) {
		if (position < 0 || position > this.bytes.length - 1) throw new PositionOutOfBoundsError({
			length: this.bytes.length,
			position
		});
	},
	decrementPosition(offset) {
		if (offset < 0) throw new NegativeOffsetError({ offset });
		const position = this.position - offset;
		this.assertPosition(position);
		this.position = position;
	},
	getReadCount(position) {
		return this.positionReadCount.get(position || this.position) || 0;
	},
	incrementPosition(offset) {
		if (offset < 0) throw new NegativeOffsetError({ offset });
		const position = this.position + offset;
		this.assertPosition(position);
		this.position = position;
	},
	inspectByte(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position);
		return this.bytes[position];
	},
	inspectBytes(length, position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position + length - 1);
		return this.bytes.subarray(position, position + length);
	},
	inspectUint8(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position);
		return this.bytes[position];
	},
	inspectUint16(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position + 1);
		return this.dataView.getUint16(position);
	},
	inspectUint24(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position + 2);
		return (this.dataView.getUint16(position) << 8) + this.dataView.getUint8(position + 2);
	},
	inspectUint32(position_) {
		const position = position_ ?? this.position;
		this.assertPosition(position + 3);
		return this.dataView.getUint32(position);
	},
	pushByte(byte) {
		this.assertPosition(this.position);
		this.bytes[this.position] = byte;
		this.position++;
	},
	pushBytes(bytes) {
		this.assertPosition(this.position + bytes.length - 1);
		this.bytes.set(bytes, this.position);
		this.position += bytes.length;
	},
	pushUint8(value) {
		this.assertPosition(this.position);
		this.bytes[this.position] = value;
		this.position++;
	},
	pushUint16(value) {
		this.assertPosition(this.position + 1);
		this.dataView.setUint16(this.position, value);
		this.position += 2;
	},
	pushUint24(value) {
		this.assertPosition(this.position + 2);
		this.dataView.setUint16(this.position, value >> 8);
		this.dataView.setUint8(this.position + 2, value & 255);
		this.position += 3;
	},
	pushUint32(value) {
		this.assertPosition(this.position + 3);
		this.dataView.setUint32(this.position, value);
		this.position += 4;
	},
	readByte() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectByte();
		this.position++;
		return value;
	},
	readBytes(length, size) {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectBytes(length);
		this.position += size ?? length;
		return value;
	},
	readUint8() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectUint8();
		this.position += 1;
		return value;
	},
	readUint16() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectUint16();
		this.position += 2;
		return value;
	},
	readUint24() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectUint24();
		this.position += 3;
		return value;
	},
	readUint32() {
		this.assertReadLimit();
		this._touch();
		const value = this.inspectUint32();
		this.position += 4;
		return value;
	},
	get remaining() {
		return this.bytes.length - this.position;
	},
	setPosition(position) {
		const oldPosition = this.position;
		this.assertPosition(position);
		this.position = position;
		return () => this.position = oldPosition;
	},
	_touch() {
		if (this.recursiveReadLimit === Number.POSITIVE_INFINITY) return;
		const count = this.getReadCount();
		this.positionReadCount.set(this.position, count + 1);
		if (count > 0) this.recursiveReadCount++;
	}
};
/** @internal */
function create(bytes, { recursiveReadLimit = 8192 } = {}) {
	const cursor = Object.create(staticCursor);
	cursor.bytes = bytes;
	cursor.dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	cursor.positionReadCount = /* @__PURE__ */ new Map();
	cursor.recursiveReadLimit = recursiveReadLimit;
	return cursor;
}
/** @internal */
var NegativeOffsetError = class extends BaseError {
	constructor({ offset }) {
		super(`Offset \`${offset}\` cannot be negative.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Cursor.NegativeOffsetError"
		});
	}
};
/** @internal */
var PositionOutOfBoundsError = class extends BaseError {
	constructor({ length, position }) {
		super(`Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Cursor.PositionOutOfBoundsError"
		});
	}
};
/** @internal */
var RecursiveReadLimitExceededError = class extends BaseError {
	constructor({ count, limit }) {
		super(`Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Cursor.RecursiveReadLimitExceededError"
		});
	}
};
// ../../node_modules/viem/node_modules/ox/_esm/core/AbiParameters.js
function decode(parameters, data, options = {}) {
	const { as = "Array", checksumAddress = false } = options;
	const bytes = typeof data === "string" ? fromHex(data) : data;
	const cursor = create(bytes);
	if (size$2(bytes) === 0 && parameters.length > 0) throw new ZeroDataError();
	if (size$2(bytes) && size$2(bytes) < 32) throw new DataSizeTooSmallError({
		data: typeof data === "string" ? data : fromBytes$1(data),
		parameters,
		size: size$2(bytes)
	});
	let consumed = 0;
	const values = as === "Array" ? [] : {};
	for (let i = 0; i < parameters.length; ++i) {
		const param = parameters[i];
		if (consumed < bytes.length) cursor.setPosition(consumed);
		const [data, consumed_] = decodeParameter(cursor, param, {
			checksumAddress,
			staticPosition: 0
		});
		consumed += consumed_;
		if (as === "Array") values.push(data);
		else values[param.name ?? i] = data;
	}
	return values;
}
/**
* Encodes primitive values into ABI encoded data as per the [Application Binary Interface (ABI) Specification](https://docs.soliditylang.org/en/latest/abi-spec).
*
* @example
* ```ts twoslash
* import { AbiParameters } from 'ox'
*
* const data = AbiParameters.encode(
*   AbiParameters.from(['string', 'uint', 'bool']),
*   ['wagmi', 420n, true],
* )
* ```
*
* @example
* ### JSON Parameters
*
* Specify **JSON ABI** Parameters as schema:
*
* ```ts twoslash
* import { AbiParameters } from 'ox'
*
* const data = AbiParameters.encode(
*   [
*     { type: 'string', name: 'name' },
*     { type: 'uint', name: 'age' },
*     { type: 'bool', name: 'isOwner' },
*   ],
*   ['wagmi', 420n, true],
* )
* ```
*
* @param parameters - The set of ABI parameters to encode, in the shape of the `inputs` or `outputs` attribute of an ABI Item. These parameters must include valid [ABI types](https://docs.soliditylang.org/en/latest/types.html).
* @param values - The set of primitive values that correspond to the ABI types defined in `parameters`.
* @returns ABI encoded data.
*/
function encode$1(parameters, values, options) {
	const { checksumAddress = false } = options ?? {};
	if (parameters.length !== values.length) throw new LengthMismatchError({
		expectedLength: parameters.length,
		givenLength: values.length
	});
	const data = encode$2(prepareParameters({
		checksumAddress,
		parameters,
		values
	}));
	if (data.length === 0) return "0x";
	return data;
}
/**
* Encodes an array of primitive values to a [packed ABI encoding](https://docs.soliditylang.org/en/latest/abi-spec.html#non-standard-packed-mode).
*
* @example
* ```ts twoslash
* import { AbiParameters } from 'ox'
*
* const encoded = AbiParameters.encodePacked(
*   ['address', 'string'],
*   ['0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 'hello world'],
* )
* // @log: '0xd8da6bf26964af9d7eed9e03e53415d37aa9604568656c6c6f20776f726c64'
* ```
*
* @param types - Set of ABI types to pack encode.
* @param values - The set of primitive values that correspond to the ABI types defined in `types`.
* @returns The encoded packed data.
*/
function encodePacked(types, values) {
	if (types.length !== values.length) throw new LengthMismatchError({
		expectedLength: types.length,
		givenLength: values.length
	});
	const data = [];
	for (let i = 0; i < types.length; i++) {
		const type = types[i];
		const value = values[i];
		data.push(encodePacked.encode(type, value));
	}
	return concat(...data);
}
(function(encodePacked) {
	function encode(type, value, isArray = false) {
		if (type === "address") {
			const address = value;
			assert$3(address);
			return padLeft(address.toLowerCase(), isArray ? 32 : 0);
		}
		if (type === "string") return fromString$1(value);
		if (type === "bytes") return value;
		if (type === "bool") return padLeft(fromBoolean(value), isArray ? 32 : 1);
		const intMatch = type.match(integerRegex);
		if (intMatch) {
			const [_type, baseType, bits = "256"] = intMatch;
			const size = Number.parseInt(bits, 10) / 8;
			return fromNumber(value, {
				size: isArray ? 32 : size,
				signed: baseType === "int"
			});
		}
		const bytesMatch = type.match(bytesRegex);
		if (bytesMatch) {
			const [_type, size] = bytesMatch;
			if (Number.parseInt(size, 10) !== (value.length - 2) / 2) throw new BytesSizeMismatchError({
				expectedSize: Number.parseInt(size, 10),
				value
			});
			return padRight(value, isArray ? 32 : 0);
		}
		const arrayMatch = type.match(arrayRegex);
		if (arrayMatch && Array.isArray(value)) {
			const [_type, childType] = arrayMatch;
			const data = [];
			for (let i = 0; i < value.length; i++) data.push(encode(childType, value[i], true));
			if (data.length === 0) return "0x";
			return concat(...data);
		}
		throw new InvalidTypeError(type);
	}
	encodePacked.encode = encode;
})(encodePacked || (encodePacked = {}));
/**
* Parses arbitrary **JSON ABI Parameters** or **Human Readable ABI Parameters** into typed {@link ox#AbiParameters.AbiParameters}.
*
* @example
* ### JSON Parameters
*
* ```ts twoslash
* import { AbiParameters } from 'ox'
*
* const parameters = AbiParameters.from([
*   {
*     name: 'spender',
*     type: 'address',
*   },
*   {
*     name: 'amount',
*     type: 'uint256',
*   },
* ])
*
* parameters
* //^?
*
*
*
*
*
*
*
* ```
*
* @example
* ### Human Readable Parameters
*
* Human Readable ABI Parameters can be parsed into a typed {@link ox#AbiParameters.AbiParameters}:
*
* ```ts twoslash
* import { AbiParameters } from 'ox'
*
* const parameters = AbiParameters.from('address spender, uint256 amount')
*
* parameters
* //^?
*
*
*
*
*
*
*
* ```
*
* @example
* It is possible to specify `struct`s along with your definitions:
*
* ```ts twoslash
* import { AbiParameters } from 'ox'
*
* const parameters = AbiParameters.from([
*   'struct Foo { address spender; uint256 amount; }', // [!code hl]
*   'Foo foo, address bar',
* ])
*
* parameters
* //^?
*
*
*
*
*
*
*
*
*
*
*
*
* ```
*
*
*
* @param parameters - The ABI Parameters to parse.
* @returns The typed ABI Parameters.
*/
function from$5(parameters) {
	if (Array.isArray(parameters) && typeof parameters[0] === "string") return parseAbiParameters(parameters);
	if (typeof parameters === "string") return parseAbiParameters(parameters);
	return parameters;
}
/**
* Throws when the data size is too small for the given parameters.
*
* @example
* ```ts twoslash
* import { AbiParameters } from 'ox'
*
* AbiParameters.decode([{ type: 'uint256' }], '0x010f')
* //                                             ↑ ❌ 2 bytes
* // @error: AbiParameters.DataSizeTooSmallError: Data size of 2 bytes is too small for given parameters.
* // @error: Params: (uint256)
* // @error: Data:   0x010f (2 bytes)
* ```
*
* ### Solution
*
* Pass a valid data size.
*
* ```ts twoslash
* import { AbiParameters } from 'ox'
*
* AbiParameters.decode([{ type: 'uint256' }], '0x00000000000000000000000000000000000000000000000000000000000010f')
* //                                             ↑ ✅ 32 bytes
* ```
*/
var DataSizeTooSmallError = class extends BaseError {
	constructor({ data, parameters, size }) {
		super(`Data size of ${size} bytes is too small for given parameters.`, { metaMessages: [`Params: (${formatAbiParameters(parameters)})`, `Data:   ${data} (${size} bytes)`] });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "AbiParameters.DataSizeTooSmallError"
		});
	}
};
/**
* Throws when zero data is provided, but data is expected.
*
* @example
* ```ts twoslash
* import { AbiParameters } from 'ox'
*
* AbiParameters.decode([{ type: 'uint256' }], '0x')
* //                                           ↑ ❌ zero data
* // @error: AbiParameters.DataSizeTooSmallError: Data size of 2 bytes is too small for given parameters.
* // @error: Params: (uint256)
* // @error: Data:   0x010f (2 bytes)
* ```
*
* ### Solution
*
* Pass valid data.
*
* ```ts twoslash
* import { AbiParameters } from 'ox'
*
* AbiParameters.decode([{ type: 'uint256' }], '0x00000000000000000000000000000000000000000000000000000000000010f')
* //                                             ↑ ✅ 32 bytes
* ```
*/
var ZeroDataError = class extends BaseError {
	constructor() {
		super("Cannot decode zero data (\"0x\") with ABI parameters.");
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "AbiParameters.ZeroDataError"
		});
	}
};
/**
* The length of the array value does not match the length specified in the corresponding ABI parameter.
*
* ### Example
*
* ```ts twoslash
* // @noErrors
* import { AbiParameters } from 'ox'
* // ---cut---
* AbiParameters.encode(AbiParameters.from('uint256[3]'), [[69n, 420n]])
* //                                               ↑ expected: 3  ↑ ❌ length: 2
* // @error: AbiParameters.ArrayLengthMismatchError: ABI encoding array length mismatch
* // @error: for type `uint256[3]`. Expected: `3`. Given: `2`.
* ```
*
* ### Solution
*
* Pass an array of the correct length.
*
* ```ts twoslash
* import { AbiParameters } from 'ox'
* // ---cut---
* AbiParameters.encode(AbiParameters.from(['uint256[3]']), [[69n, 420n, 69n]])
* //                                                         ↑ ✅ length: 3
* ```
*/
var ArrayLengthMismatchError = class extends BaseError {
	constructor({ expectedLength, givenLength, type }) {
		super(`Array length mismatch for type \`${type}\`. Expected: \`${expectedLength}\`. Given: \`${givenLength}\`.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "AbiParameters.ArrayLengthMismatchError"
		});
	}
};
/**
* The size of the bytes value does not match the size specified in the corresponding ABI parameter.
*
* ### Example
*
* ```ts twoslash
* // @noErrors
* import { AbiParameters } from 'ox'
* // ---cut---
* AbiParameters.encode(AbiParameters.from('bytes8'), [['0xdeadbeefdeadbeefdeadbeef']])
* //                                            ↑ expected: 8 bytes  ↑ ❌ size: 12 bytes
* // @error: BytesSizeMismatchError: Size of bytes "0xdeadbeefdeadbeefdeadbeef"
* // @error: (bytes12) does not match expected size (bytes8).
* ```
*
* ### Solution
*
* Pass a bytes value of the correct size.
*
* ```ts twoslash
* import { AbiParameters } from 'ox'
* // ---cut---
* AbiParameters.encode(AbiParameters.from(['bytes8']), ['0xdeadbeefdeadbeef'])
* //                                                       ↑ ✅ size: 8 bytes
* ```
*/
var BytesSizeMismatchError = class extends BaseError {
	constructor({ expectedSize, value }) {
		super(`Size of bytes "${value}" (bytes${size$1(value)}) does not match expected size (bytes${expectedSize}).`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "AbiParameters.BytesSizeMismatchError"
		});
	}
};
/**
* The length of the values to encode does not match the length of the ABI parameters.
*
* ### Example
*
* ```ts twoslash
* // @noErrors
* import { AbiParameters } from 'ox'
* // ---cut---
* AbiParameters.encode(AbiParameters.from(['string', 'uint256']), ['hello'])
* // @error: LengthMismatchError: ABI encoding params/values length mismatch.
* // @error: Expected length (params): 2
* // @error: Given length (values): 1
* ```
*
* ### Solution
*
* Pass the correct number of values to encode.
*
* ### Solution
*
* Pass a [valid ABI type](https://docs.soliditylang.org/en/develop/abi-spec.html#types).
*/
var LengthMismatchError = class extends BaseError {
	constructor({ expectedLength, givenLength }) {
		super([
			"ABI encoding parameters/values length mismatch.",
			`Expected length (parameters): ${expectedLength}`,
			`Given length (values): ${givenLength}`
		].join("\n"));
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "AbiParameters.LengthMismatchError"
		});
	}
};
/**
* The value provided is not a valid array as specified in the corresponding ABI parameter.
*
* ### Example
*
* ```ts twoslash
* // @noErrors
* import { AbiParameters } from 'ox'
* // ---cut---
* AbiParameters.encode(AbiParameters.from(['uint256[3]']), [69])
* ```
*
* ### Solution
*
* Pass an array value.
*/
var InvalidArrayError = class extends BaseError {
	constructor(value) {
		super(`Value \`${value}\` is not a valid array.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "AbiParameters.InvalidArrayError"
		});
	}
};
/**
* Throws when the ABI parameter type is invalid.
*
* @example
* ```ts twoslash
* import { AbiParameters } from 'ox'
*
* AbiParameters.decode([{ type: 'lol' }], '0x00000000000000000000000000000000000000000000000000000000000010f')
* //                             ↑ ❌ invalid type
* // @error: AbiParameters.InvalidTypeError: Type `lol` is not a valid ABI Type.
* ```
*/
var InvalidTypeError = class extends BaseError {
	constructor(type) {
		super(`Type \`${type}\` is not a valid ABI Type.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "AbiParameters.InvalidTypeError"
		});
	}
};
// ../../node_modules/viem/node_modules/@noble/curves/esm/abstract/modular.js
/**
* Utils for modular division and finite fields.
* A finite field over 11 is integer number operations `mod 11`.
* There is no division: it is replaced by modular multiplicative inverse.
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n$3 = BigInt(0);
var _1n$3 = BigInt(1);
var _2n$1 = /* @__PURE__ */ BigInt(2);
var _3n$1 = /* @__PURE__ */ BigInt(3);
var _4n$1 = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _8n = /* @__PURE__ */ BigInt(8);
function mod(a, b) {
	const result = a % b;
	return result >= _0n$3 ? result : b + result;
}
/** Does `x^(2^power)` mod p. `pow2(30, 4)` == `30^(2^4)` */
function pow2(x, power, modulo) {
	let res = x;
	while (power-- > _0n$3) {
		res *= res;
		res %= modulo;
	}
	return res;
}
/**
* Inverses number over modulo.
* Implemented using [Euclidean GCD](https://brilliant.org/wiki/extended-euclidean-algorithm/).
*/
function invert(number, modulo) {
	if (number === _0n$3) throw new Error("invert: expected non-zero number");
	if (modulo <= _0n$3) throw new Error("invert: expected positive modulus, got " + modulo);
	let a = mod(number, modulo);
	let b = modulo;
	let x = _0n$3, y = _1n$3, u = _1n$3, v = _0n$3;
	while (a !== _0n$3) {
		const q = b / a;
		const r = b % a;
		const m = x - u * q;
		const n = y - v * q;
		b = a, a = r, x = u, y = v, u = m, v = n;
	}
	if (b !== _1n$3) throw new Error("invert: does not exist");
	return mod(x, modulo);
}
function sqrt3mod4(Fp, n) {
	const p1div4 = (Fp.ORDER + _1n$3) / _4n$1;
	const root = Fp.pow(n, p1div4);
	if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
	return root;
}
function sqrt5mod8(Fp, n) {
	const p5div8 = (Fp.ORDER - _5n) / _8n;
	const n2 = Fp.mul(n, _2n$1);
	const v = Fp.pow(n2, p5div8);
	const nv = Fp.mul(n, v);
	const i = Fp.mul(Fp.mul(nv, _2n$1), v);
	const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
	if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
	return root;
}
/**
* Tonelli-Shanks square root search algorithm.
* 1. https://eprint.iacr.org/2012/685.pdf (page 12)
* 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
* @param P field order
* @returns function that takes field Fp (created from P) and number n
*/
function tonelliShanks(P) {
	if (P < BigInt(3)) throw new Error("sqrt is not defined for small field");
	let Q = P - _1n$3;
	let S = 0;
	while (Q % _2n$1 === _0n$3) {
		Q /= _2n$1;
		S++;
	}
	let Z = _2n$1;
	const _Fp = Field(P);
	while (FpLegendre(_Fp, Z) === 1) if (Z++ > 1e3) throw new Error("Cannot find square root: probably non-prime P");
	if (S === 1) return sqrt3mod4;
	let cc = _Fp.pow(Z, Q);
	const Q1div2 = (Q + _1n$3) / _2n$1;
	return function tonelliSlow(Fp, n) {
		if (Fp.is0(n)) return n;
		if (FpLegendre(Fp, n) !== 1) throw new Error("Cannot find square root");
		let M = S;
		let c = Fp.mul(Fp.ONE, cc);
		let t = Fp.pow(n, Q);
		let R = Fp.pow(n, Q1div2);
		while (!Fp.eql(t, Fp.ONE)) {
			if (Fp.is0(t)) return Fp.ZERO;
			let i = 1;
			let t_tmp = Fp.sqr(t);
			while (!Fp.eql(t_tmp, Fp.ONE)) {
				i++;
				t_tmp = Fp.sqr(t_tmp);
				if (i === M) throw new Error("Cannot find square root");
			}
			const exponent = _1n$3 << BigInt(M - i - 1);
			const b = Fp.pow(c, exponent);
			M = i;
			c = Fp.sqr(b);
			t = Fp.mul(t, c);
			R = Fp.mul(R, b);
		}
		return R;
	};
}
/**
* Square root for a finite field. Will try optimized versions first:
*
* 1. P ≡ 3 (mod 4)
* 2. P ≡ 5 (mod 8)
* 3. Tonelli-Shanks algorithm
*
* Different algorithms can give different roots, it is up to user to decide which one they want.
* For example there is FpSqrtOdd/FpSqrtEven to choice root based on oddness (used for hash-to-curve).
*/
function FpSqrt(P) {
	if (P % _4n$1 === _3n$1) return sqrt3mod4;
	if (P % _8n === _5n) return sqrt5mod8;
	return tonelliShanks(P);
}
var FIELD_FIELDS = [
	"create",
	"isValid",
	"is0",
	"neg",
	"inv",
	"sqrt",
	"sqr",
	"eql",
	"add",
	"sub",
	"mul",
	"pow",
	"div",
	"addN",
	"subN",
	"mulN",
	"sqrN"
];
function validateField(field) {
	return validateObject(field, FIELD_FIELDS.reduce((map, val) => {
		map[val] = "function";
		return map;
	}, {
		ORDER: "bigint",
		MASK: "bigint",
		BYTES: "isSafeInteger",
		BITS: "isSafeInteger"
	}));
}
/**
* Same as `pow` but for Fp: non-constant-time.
* Unsafe in some contexts: uses ladder, so can expose bigint bits.
*/
function FpPow(Fp, num, power) {
	if (power < _0n$3) throw new Error("invalid exponent, negatives unsupported");
	if (power === _0n$3) return Fp.ONE;
	if (power === _1n$3) return num;
	let p = Fp.ONE;
	let d = num;
	while (power > _0n$3) {
		if (power & _1n$3) p = Fp.mul(p, d);
		d = Fp.sqr(d);
		power >>= _1n$3;
	}
	return p;
}
/**
* Efficiently invert an array of Field elements.
* Exception-free. Will return `undefined` for 0 elements.
* @param passZero map 0 to 0 (instead of undefined)
*/
function FpInvertBatch(Fp, nums, passZero = false) {
	const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : void 0);
	const multipliedAcc = nums.reduce((acc, num, i) => {
		if (Fp.is0(num)) return acc;
		inverted[i] = acc;
		return Fp.mul(acc, num);
	}, Fp.ONE);
	const invertedAcc = Fp.inv(multipliedAcc);
	nums.reduceRight((acc, num, i) => {
		if (Fp.is0(num)) return acc;
		inverted[i] = Fp.mul(acc, inverted[i]);
		return Fp.mul(acc, num);
	}, invertedAcc);
	return inverted;
}
/**
* Legendre symbol.
* Legendre constant is used to calculate Legendre symbol (a | p)
* which denotes the value of a^((p-1)/2) (mod p).
*
* * (a | p) ≡ 1    if a is a square (mod p), quadratic residue
* * (a | p) ≡ -1   if a is not a square (mod p), quadratic non residue
* * (a | p) ≡ 0    if a ≡ 0 (mod p)
*/
function FpLegendre(Fp, n) {
	const p1mod2 = (Fp.ORDER - _1n$3) / _2n$1;
	const powered = Fp.pow(n, p1mod2);
	const yes = Fp.eql(powered, Fp.ONE);
	const zero = Fp.eql(powered, Fp.ZERO);
	const no = Fp.eql(powered, Fp.neg(Fp.ONE));
	if (!yes && !zero && !no) throw new Error("invalid Legendre symbol result");
	return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
	if (nBitLength !== void 0) anumber(nBitLength);
	const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
	return {
		nBitLength: _nBitLength,
		nByteLength: Math.ceil(_nBitLength / 8)
	};
}
/**
* Initializes a finite field over prime.
* Major performance optimizations:
* * a) denormalized operations like mulN instead of mul
* * b) same object shape: never add or remove keys
* * c) Object.freeze
* Fragile: always run a benchmark on a change.
* Security note: operations don't check 'isValid' for all elements for performance reasons,
* it is caller responsibility to check this.
* This is low-level code, please make sure you know what you're doing.
* @param ORDER prime positive bigint
* @param bitLen how many bits the field consumes
* @param isLE (def: false) if encoding / decoding should be in little-endian
* @param redef optional faster redefinitions of sqrt and other methods
*/
function Field(ORDER, bitLen, isLE = false, redef = {}) {
	if (ORDER <= _0n$3) throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
	const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen);
	if (BYTES > 2048) throw new Error("invalid field: expected ORDER of <= 2048 bytes");
	let sqrtP;
	const f = Object.freeze({
		ORDER,
		isLE,
		BITS,
		BYTES,
		MASK: bitMask(BITS),
		ZERO: _0n$3,
		ONE: _1n$3,
		create: (num) => mod(num, ORDER),
		isValid: (num) => {
			if (typeof num !== "bigint") throw new Error("invalid field element: expected bigint, got " + typeof num);
			return _0n$3 <= num && num < ORDER;
		},
		is0: (num) => num === _0n$3,
		isOdd: (num) => (num & _1n$3) === _1n$3,
		neg: (num) => mod(-num, ORDER),
		eql: (lhs, rhs) => lhs === rhs,
		sqr: (num) => mod(num * num, ORDER),
		add: (lhs, rhs) => mod(lhs + rhs, ORDER),
		sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
		mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
		pow: (num, power) => FpPow(f, num, power),
		div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
		sqrN: (num) => num * num,
		addN: (lhs, rhs) => lhs + rhs,
		subN: (lhs, rhs) => lhs - rhs,
		mulN: (lhs, rhs) => lhs * rhs,
		inv: (num) => invert(num, ORDER),
		sqrt: redef.sqrt || ((n) => {
			if (!sqrtP) sqrtP = FpSqrt(ORDER);
			return sqrtP(f, n);
		}),
		toBytes: (num) => isLE ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES),
		fromBytes: (bytes) => {
			if (bytes.length !== BYTES) throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
			return isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
		},
		invertBatch: (lst) => FpInvertBatch(f, lst),
		cmov: (a, b, c) => c ? b : a
	});
	return Object.freeze(f);
}
/**
* Returns total number of bytes consumed by the field element.
* For example, 32 bytes for usual 256-bit weierstrass curve.
* @param fieldOrder number of field elements, usually CURVE.n
* @returns byte length of field
*/
function getFieldBytesLength(fieldOrder) {
	if (typeof fieldOrder !== "bigint") throw new Error("field order must be bigint");
	const bitLength = fieldOrder.toString(2).length;
	return Math.ceil(bitLength / 8);
}
/**
* Returns minimal amount of bytes that can be safely reduced
* by field order.
* Should be 2^-128 for 128-bit curve such as P256.
* @param fieldOrder number of field elements, usually CURVE.n
* @returns byte length of target hash
*/
function getMinHashLength(fieldOrder) {
	const length = getFieldBytesLength(fieldOrder);
	return length + Math.ceil(length / 2);
}
/**
* "Constant-time" private key generation utility.
* Can take (n + n/2) or more bytes of uniform input e.g. from CSPRNG or KDF
* and convert them into private scalar, with the modulo bias being negligible.
* Needs at least 48 bytes of input for 32-byte private key.
* https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/
* FIPS 186-5, A.2 https://csrc.nist.gov/publications/detail/fips/186/5/final
* RFC 9380, https://www.rfc-editor.org/rfc/rfc9380#section-5
* @param hash hash output from SHA3 or a similar function
* @param groupOrder size of subgroup - (e.g. secp256k1.CURVE.n)
* @param isLE interpret hash bytes as LE num
* @returns valid private scalar
*/
function mapHashToField(key, fieldOrder, isLE = false) {
	const len = key.length;
	const fieldLen = getFieldBytesLength(fieldOrder);
	const minLen = getMinHashLength(fieldOrder);
	if (len < 16 || len < minLen || len > 1024) throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
	const reduced = mod(isLE ? bytesToNumberLE(key) : bytesToNumberBE(key), fieldOrder - _1n$3) + _1n$3;
	return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}
// ../../node_modules/viem/node_modules/@noble/curves/esm/abstract/curve.js
/**
* Methods for elliptic curve multiplication by scalars.
* Contains wNAF, pippenger
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n$2 = BigInt(0);
var _1n$2 = BigInt(1);
function constTimeNegate(condition, item) {
	const neg = item.negate();
	return condition ? neg : item;
}
function validateW(W, bits) {
	if (!Number.isSafeInteger(W) || W <= 0 || W > bits) throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
}
function calcWOpts(W, scalarBits) {
	validateW(W, scalarBits);
	const windows = Math.ceil(scalarBits / W) + 1;
	const windowSize = 2 ** (W - 1);
	const maxNumber = 2 ** W;
	return {
		windows,
		windowSize,
		mask: bitMask(W),
		maxNumber,
		shiftBy: BigInt(W)
	};
}
function calcOffsets(n, window, wOpts) {
	const { windowSize, mask, maxNumber, shiftBy } = wOpts;
	let wbits = Number(n & mask);
	let nextN = n >> shiftBy;
	if (wbits > windowSize) {
		wbits -= maxNumber;
		nextN += _1n$2;
	}
	const offsetStart = window * windowSize;
	const offset = offsetStart + Math.abs(wbits) - 1;
	const isZero = wbits === 0;
	const isNeg = wbits < 0;
	const isNegF = window % 2 !== 0;
	return {
		nextN,
		offset,
		isZero,
		isNeg,
		isNegF,
		offsetF: offsetStart
	};
}
function validateMSMPoints(points, c) {
	if (!Array.isArray(points)) throw new Error("array expected");
	points.forEach((p, i) => {
		if (!(p instanceof c)) throw new Error("invalid point at index " + i);
	});
}
function validateMSMScalars(scalars, field) {
	if (!Array.isArray(scalars)) throw new Error("array of scalars expected");
	scalars.forEach((s, i) => {
		if (!field.isValid(s)) throw new Error("invalid scalar at index " + i);
	});
}
var pointPrecomputes = /* @__PURE__ */ new WeakMap();
var pointWindowSizes = /* @__PURE__ */ new WeakMap();
function getW(P) {
	return pointWindowSizes.get(P) || 1;
}
/**
* Elliptic curve multiplication of Point by scalar. Fragile.
* Scalars should always be less than curve order: this should be checked inside of a curve itself.
* Creates precomputation tables for fast multiplication:
* - private scalar is split by fixed size windows of W bits
* - every window point is collected from window's table & added to accumulator
* - since windows are different, same point inside tables won't be accessed more than once per calc
* - each multiplication is 'Math.ceil(CURVE_ORDER / 𝑊) + 1' point additions (fixed for any scalar)
* - +1 window is neccessary for wNAF
* - wNAF reduces table size: 2x less memory + 2x faster generation, but 10% slower multiplication
*
* @todo Research returning 2d JS array of windows, instead of a single window.
* This would allow windows to be in different memory locations
*/
function wNAF(c, bits) {
	return {
		constTimeNegate,
		hasPrecomputes(elm) {
			return getW(elm) !== 1;
		},
		unsafeLadder(elm, n, p = c.ZERO) {
			let d = elm;
			while (n > _0n$2) {
				if (n & _1n$2) p = p.add(d);
				d = d.double();
				n >>= _1n$2;
			}
			return p;
		},
		/**
		* Creates a wNAF precomputation window. Used for caching.
		* Default window size is set by `utils.precompute()` and is equal to 8.
		* Number of precomputed points depends on the curve size:
		* 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
		* - 𝑊 is the window size
		* - 𝑛 is the bitlength of the curve order.
		* For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
		* @param elm Point instance
		* @param W window size
		* @returns precomputed point tables flattened to a single array
		*/
		precomputeWindow(elm, W) {
			const { windows, windowSize } = calcWOpts(W, bits);
			const points = [];
			let p = elm;
			let base = p;
			for (let window = 0; window < windows; window++) {
				base = p;
				points.push(base);
				for (let i = 1; i < windowSize; i++) {
					base = base.add(p);
					points.push(base);
				}
				p = base.double();
			}
			return points;
		},
		/**
		* Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
		* @param W window size
		* @param precomputes precomputed tables
		* @param n scalar (we don't check here, but should be less than curve order)
		* @returns real and fake (for const-time) points
		*/
		wNAF(W, precomputes, n) {
			let p = c.ZERO;
			let f = c.BASE;
			const wo = calcWOpts(W, bits);
			for (let window = 0; window < wo.windows; window++) {
				const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
				n = nextN;
				if (isZero) f = f.add(constTimeNegate(isNegF, precomputes[offsetF]));
				else p = p.add(constTimeNegate(isNeg, precomputes[offset]));
			}
			return {
				p,
				f
			};
		},
		/**
		* Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
		* @param W window size
		* @param precomputes precomputed tables
		* @param n scalar (we don't check here, but should be less than curve order)
		* @param acc accumulator point to add result of multiplication
		* @returns point
		*/
		wNAFUnsafe(W, precomputes, n, acc = c.ZERO) {
			const wo = calcWOpts(W, bits);
			for (let window = 0; window < wo.windows; window++) {
				if (n === _0n$2) break;
				const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
				n = nextN;
				if (isZero) continue;
				else {
					const item = precomputes[offset];
					acc = acc.add(isNeg ? item.negate() : item);
				}
			}
			return acc;
		},
		getPrecomputes(W, P, transform) {
			let comp = pointPrecomputes.get(P);
			if (!comp) {
				comp = this.precomputeWindow(P, W);
				if (W !== 1) pointPrecomputes.set(P, transform(comp));
			}
			return comp;
		},
		wNAFCached(P, n, transform) {
			const W = getW(P);
			return this.wNAF(W, this.getPrecomputes(W, P, transform), n);
		},
		wNAFCachedUnsafe(P, n, transform, prev) {
			const W = getW(P);
			if (W === 1) return this.unsafeLadder(P, n, prev);
			return this.wNAFUnsafe(W, this.getPrecomputes(W, P, transform), n, prev);
		},
		setWindowSize(P, W) {
			validateW(W, bits);
			pointWindowSizes.set(P, W);
			pointPrecomputes.delete(P);
		}
	};
}
/**
* Pippenger algorithm for multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
* 30x faster vs naive addition on L=4096, 10x faster than precomputes.
* For N=254bit, L=1, it does: 1024 ADD + 254 DBL. For L=5: 1536 ADD + 254 DBL.
* Algorithmically constant-time (for same L), even when 1 point + scalar, or when scalar = 0.
* @param c Curve Point constructor
* @param fieldN field over CURVE.N - important that it's not over CURVE.P
* @param points array of L curve points
* @param scalars array of L scalars (aka private keys / bigints)
*/
function pippenger(c, fieldN, points, scalars) {
	validateMSMPoints(points, c);
	validateMSMScalars(scalars, fieldN);
	const plength = points.length;
	const slength = scalars.length;
	if (plength !== slength) throw new Error("arrays of points and scalars must have equal length");
	const zero = c.ZERO;
	const wbits = bitLen(BigInt(plength));
	let windowSize = 1;
	if (wbits > 12) windowSize = wbits - 3;
	else if (wbits > 4) windowSize = wbits - 2;
	else if (wbits > 0) windowSize = 2;
	const MASK = bitMask(windowSize);
	const buckets = new Array(Number(MASK) + 1).fill(zero);
	const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
	let sum = zero;
	for (let i = lastBits; i >= 0; i -= windowSize) {
		buckets.fill(zero);
		for (let j = 0; j < slength; j++) {
			const scalar = scalars[j];
			const wbits = Number(scalar >> BigInt(i) & MASK);
			buckets[wbits] = buckets[wbits].add(points[j]);
		}
		let resI = zero;
		for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
			sumI = sumI.add(buckets[j]);
			resI = resI.add(sumI);
		}
		sum = sum.add(resI);
		if (i !== 0) for (let j = 0; j < windowSize; j++) sum = sum.double();
	}
	return sum;
}
function validateBasic(curve) {
	validateField(curve.Fp);
	validateObject(curve, {
		n: "bigint",
		h: "bigint",
		Gx: "field",
		Gy: "field"
	}, {
		nBitLength: "isSafeInteger",
		nByteLength: "isSafeInteger"
	});
	return Object.freeze({
		...nLength(curve.n, curve.nBitLength),
		...curve,
		p: curve.Fp.ORDER
	});
}
// ../../node_modules/viem/node_modules/@noble/curves/esm/abstract/weierstrass.js
/**
* Short Weierstrass curve methods. The formula is: y² = x³ + ax + b.
*
* ### Parameters
*
* To initialize a weierstrass curve, one needs to pass following params:
*
* * a: formula param
* * b: formula param
* * Fp: finite field of prime characteristic P; may be complex (Fp2). Arithmetics is done in field
* * n: order of prime subgroup a.k.a total amount of valid curve points
* * Gx: Base point (x, y) aka generator point. Gx = x coordinate
* * Gy: ...y coordinate
* * h: cofactor, usually 1. h*n = curve group order (n is only subgroup order)
* * lowS: whether to enable (default) or disable "low-s" non-malleable signatures
*
* ### Design rationale for types
*
* * Interaction between classes from different curves should fail:
*   `k256.Point.BASE.add(p256.Point.BASE)`
* * For this purpose we want to use `instanceof` operator, which is fast and works during runtime
* * Different calls of `curve()` would return different classes -
*   `curve(params) !== curve(params)`: if somebody decided to monkey-patch their curve,
*   it won't affect others
*
* TypeScript can't infer types for classes created inside a function. Classes is one instance
* of nominative types in TypeScript and interfaces only check for shape, so it's hard to create
* unique type for every function call.
*
* We can use generic types via some param, like curve opts, but that would:
*     1. Enable interaction between `curve(params)` and `curve(params)` (curves of same params)
*     which is hard to debug.
*     2. Params can be generic and we can't enforce them to be constant value:
*     if somebody creates curve from non-constant params,
*     it would be allowed to interact with other curves with non-constant params
*
* @todo https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#unique-symbol
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function validateSigVerOpts(opts) {
	if (opts.lowS !== void 0) abool("lowS", opts.lowS);
	if (opts.prehash !== void 0) abool("prehash", opts.prehash);
}
function validatePointOpts(curve) {
	const opts = validateBasic(curve);
	validateObject(opts, {
		a: "field",
		b: "field"
	}, {
		allowInfinityPoint: "boolean",
		allowedPrivateKeyLengths: "array",
		clearCofactor: "function",
		fromBytes: "function",
		isTorsionFree: "function",
		toBytes: "function",
		wrapPrivateKey: "boolean"
	});
	const { endo, Fp, a } = opts;
	if (endo) {
		if (!Fp.eql(a, Fp.ZERO)) throw new Error("invalid endo: CURVE.a must be 0");
		if (typeof endo !== "object" || typeof endo.beta !== "bigint" || typeof endo.splitScalar !== "function") throw new Error("invalid endo: expected \"beta\": bigint and \"splitScalar\": function");
	}
	return Object.freeze({ ...opts });
}
var DERErr = class extends Error {
	constructor(m = "") {
		super(m);
	}
};
/**
* ASN.1 DER encoding utilities. ASN is very complex & fragile. Format:
*
*     [0x30 (SEQUENCE), bytelength, 0x02 (INTEGER), intLength, R, 0x02 (INTEGER), intLength, S]
*
* Docs: https://letsencrypt.org/docs/a-warm-welcome-to-asn1-and-der/, https://luca.ntop.org/Teaching/Appunti/asn1.html
*/
var DER = {
	Err: DERErr,
	_tlv: {
		encode: (tag, data) => {
			const { Err: E } = DER;
			if (tag < 0 || tag > 256) throw new E("tlv.encode: wrong tag");
			if (data.length & 1) throw new E("tlv.encode: unpadded data");
			const dataLen = data.length / 2;
			const len = numberToHexUnpadded(dataLen);
			if (len.length / 2 & 128) throw new E("tlv.encode: long form length too big");
			const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
			return numberToHexUnpadded(tag) + lenLen + len + data;
		},
		decode(tag, data) {
			const { Err: E } = DER;
			let pos = 0;
			if (tag < 0 || tag > 256) throw new E("tlv.encode: wrong tag");
			if (data.length < 2 || data[pos++] !== tag) throw new E("tlv.decode: wrong tlv");
			const first = data[pos++];
			const isLong = !!(first & 128);
			let length = 0;
			if (!isLong) length = first;
			else {
				const lenLen = first & 127;
				if (!lenLen) throw new E("tlv.decode(long): indefinite length not supported");
				if (lenLen > 4) throw new E("tlv.decode(long): byte length is too big");
				const lengthBytes = data.subarray(pos, pos + lenLen);
				if (lengthBytes.length !== lenLen) throw new E("tlv.decode: length bytes not complete");
				if (lengthBytes[0] === 0) throw new E("tlv.decode(long): zero leftmost byte");
				for (const b of lengthBytes) length = length << 8 | b;
				pos += lenLen;
				if (length < 128) throw new E("tlv.decode(long): not minimal encoding");
			}
			const v = data.subarray(pos, pos + length);
			if (v.length !== length) throw new E("tlv.decode: wrong value length");
			return {
				v,
				l: data.subarray(pos + length)
			};
		}
	},
	_int: {
		encode(num) {
			const { Err: E } = DER;
			if (num < _0n$1) throw new E("integer: negative integers are not allowed");
			let hex = numberToHexUnpadded(num);
			if (Number.parseInt(hex[0], 16) & 8) hex = "00" + hex;
			if (hex.length & 1) throw new E("unexpected DER parsing assertion: unpadded hex");
			return hex;
		},
		decode(data) {
			const { Err: E } = DER;
			if (data[0] & 128) throw new E("invalid signature integer: negative");
			if (data[0] === 0 && !(data[1] & 128)) throw new E("invalid signature integer: unnecessary leading zero");
			return bytesToNumberBE(data);
		}
	},
	toSig(hex) {
		const { Err: E, _int: int, _tlv: tlv } = DER;
		const data = ensureBytes("signature", hex);
		const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
		if (seqLeftBytes.length) throw new E("invalid signature: left bytes after parsing");
		const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
		const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
		if (sLeftBytes.length) throw new E("invalid signature: left bytes after parsing");
		return {
			r: int.decode(rBytes),
			s: int.decode(sBytes)
		};
	},
	hexFromSig(sig) {
		const { _tlv: tlv, _int: int } = DER;
		const seq = tlv.encode(2, int.encode(sig.r)) + tlv.encode(2, int.encode(sig.s));
		return tlv.encode(48, seq);
	}
};
function numToSizedHex(num, size) {
	return bytesToHex(numberToBytesBE(num, size));
}
var _0n$1 = BigInt(0);
var _1n$1 = BigInt(1);
var _3n = BigInt(3);
var _4n = BigInt(4);
function weierstrassPoints(opts) {
	const CURVE = validatePointOpts(opts);
	const { Fp } = CURVE;
	const Fn = Field(CURVE.n, CURVE.nBitLength);
	const toBytes = CURVE.toBytes || ((_c, point, _isCompressed) => {
		const a = point.toAffine();
		return concatBytes(Uint8Array.from([4]), Fp.toBytes(a.x), Fp.toBytes(a.y));
	});
	const fromBytes = CURVE.fromBytes || ((bytes) => {
		const tail = bytes.subarray(1);
		return {
			x: Fp.fromBytes(tail.subarray(0, Fp.BYTES)),
			y: Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES))
		};
	});
	/**
	* y² = x³ + ax + b: Short weierstrass curve formula. Takes x, returns y².
	* @returns y²
	*/
	function weierstrassEquation(x) {
		const { a, b } = CURVE;
		const x2 = Fp.sqr(x);
		const x3 = Fp.mul(x2, x);
		return Fp.add(Fp.add(x3, Fp.mul(x, a)), b);
	}
	function isValidXY(x, y) {
		const left = Fp.sqr(y);
		const right = weierstrassEquation(x);
		return Fp.eql(left, right);
	}
	if (!isValidXY(CURVE.Gx, CURVE.Gy)) throw new Error("bad curve params: generator point");
	const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n), _4n);
	const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
	if (Fp.is0(Fp.add(_4a3, _27b2))) throw new Error("bad curve params: a or b");
	function isWithinCurveOrder(num) {
		return inRange(num, _1n$1, CURVE.n);
	}
	function normPrivateKeyToScalar(key) {
		const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n: N } = CURVE;
		if (lengths && typeof key !== "bigint") {
			if (isBytes(key)) key = bytesToHex(key);
			if (typeof key !== "string" || !lengths.includes(key.length)) throw new Error("invalid private key");
			key = key.padStart(nByteLength * 2, "0");
		}
		let num;
		try {
			num = typeof key === "bigint" ? key : bytesToNumberBE(ensureBytes("private key", key, nByteLength));
		} catch (error) {
			throw new Error("invalid private key, expected hex or " + nByteLength + " bytes, got " + typeof key);
		}
		if (wrapPrivateKey) num = mod(num, N);
		aInRange("private key", num, _1n$1, N);
		return num;
	}
	function aprjpoint(other) {
		if (!(other instanceof Point)) throw new Error("ProjectivePoint expected");
	}
	const toAffineMemo = memoized((p, iz) => {
		const { px: x, py: y, pz: z } = p;
		if (Fp.eql(z, Fp.ONE)) return {
			x,
			y
		};
		const is0 = p.is0();
		if (iz == null) iz = is0 ? Fp.ONE : Fp.inv(z);
		const ax = Fp.mul(x, iz);
		const ay = Fp.mul(y, iz);
		const zz = Fp.mul(z, iz);
		if (is0) return {
			x: Fp.ZERO,
			y: Fp.ZERO
		};
		if (!Fp.eql(zz, Fp.ONE)) throw new Error("invZ was invalid");
		return {
			x: ax,
			y: ay
		};
	});
	const assertValidMemo = memoized((p) => {
		if (p.is0()) {
			if (CURVE.allowInfinityPoint && !Fp.is0(p.py)) return;
			throw new Error("bad point: ZERO");
		}
		const { x, y } = p.toAffine();
		if (!Fp.isValid(x) || !Fp.isValid(y)) throw new Error("bad point: x or y not FE");
		if (!isValidXY(x, y)) throw new Error("bad point: equation left != right");
		if (!p.isTorsionFree()) throw new Error("bad point: not in prime-order subgroup");
		return true;
	});
	/**
	* Projective Point works in 3d / projective (homogeneous) coordinates: (X, Y, Z) ∋ (x=X/Z, y=Y/Z)
	* Default Point works in 2d / affine coordinates: (x, y)
	* We're doing calculations in projective, because its operations don't require costly inversion.
	*/
	class Point {
		constructor(px, py, pz) {
			if (px == null || !Fp.isValid(px)) throw new Error("x required");
			if (py == null || !Fp.isValid(py) || Fp.is0(py)) throw new Error("y required");
			if (pz == null || !Fp.isValid(pz)) throw new Error("z required");
			this.px = px;
			this.py = py;
			this.pz = pz;
			Object.freeze(this);
		}
		static fromAffine(p) {
			const { x, y } = p || {};
			if (!p || !Fp.isValid(x) || !Fp.isValid(y)) throw new Error("invalid affine point");
			if (p instanceof Point) throw new Error("projective point not allowed");
			const is0 = (i) => Fp.eql(i, Fp.ZERO);
			if (is0(x) && is0(y)) return Point.ZERO;
			return new Point(x, y, Fp.ONE);
		}
		get x() {
			return this.toAffine().x;
		}
		get y() {
			return this.toAffine().y;
		}
		/**
		* Takes a bunch of Projective Points but executes only one
		* inversion on all of them. Inversion is very slow operation,
		* so this improves performance massively.
		* Optimization: converts a list of projective points to a list of identical points with Z=1.
		*/
		static normalizeZ(points) {
			const toInv = FpInvertBatch(Fp, points.map((p) => p.pz));
			return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
		}
		/**
		* Converts hash string or Uint8Array to Point.
		* @param hex short/long ECDSA hex
		*/
		static fromHex(hex) {
			const P = Point.fromAffine(fromBytes(ensureBytes("pointHex", hex)));
			P.assertValidity();
			return P;
		}
		static fromPrivateKey(privateKey) {
			return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
		}
		static msm(points, scalars) {
			return pippenger(Point, Fn, points, scalars);
		}
		_setWindowSize(windowSize) {
			wnaf.setWindowSize(this, windowSize);
		}
		assertValidity() {
			assertValidMemo(this);
		}
		hasEvenY() {
			const { y } = this.toAffine();
			if (Fp.isOdd) return !Fp.isOdd(y);
			throw new Error("Field doesn't support isOdd");
		}
		/**
		* Compare one point to another.
		*/
		equals(other) {
			aprjpoint(other);
			const { px: X1, py: Y1, pz: Z1 } = this;
			const { px: X2, py: Y2, pz: Z2 } = other;
			const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
			const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
			return U1 && U2;
		}
		/**
		* Flips point to one corresponding to (x, -y) in Affine coordinates.
		*/
		negate() {
			return new Point(this.px, Fp.neg(this.py), this.pz);
		}
		double() {
			const { a, b } = CURVE;
			const b3 = Fp.mul(b, _3n);
			const { px: X1, py: Y1, pz: Z1 } = this;
			let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
			let t0 = Fp.mul(X1, X1);
			let t1 = Fp.mul(Y1, Y1);
			let t2 = Fp.mul(Z1, Z1);
			let t3 = Fp.mul(X1, Y1);
			t3 = Fp.add(t3, t3);
			Z3 = Fp.mul(X1, Z1);
			Z3 = Fp.add(Z3, Z3);
			X3 = Fp.mul(a, Z3);
			Y3 = Fp.mul(b3, t2);
			Y3 = Fp.add(X3, Y3);
			X3 = Fp.sub(t1, Y3);
			Y3 = Fp.add(t1, Y3);
			Y3 = Fp.mul(X3, Y3);
			X3 = Fp.mul(t3, X3);
			Z3 = Fp.mul(b3, Z3);
			t2 = Fp.mul(a, t2);
			t3 = Fp.sub(t0, t2);
			t3 = Fp.mul(a, t3);
			t3 = Fp.add(t3, Z3);
			Z3 = Fp.add(t0, t0);
			t0 = Fp.add(Z3, t0);
			t0 = Fp.add(t0, t2);
			t0 = Fp.mul(t0, t3);
			Y3 = Fp.add(Y3, t0);
			t2 = Fp.mul(Y1, Z1);
			t2 = Fp.add(t2, t2);
			t0 = Fp.mul(t2, t3);
			X3 = Fp.sub(X3, t0);
			Z3 = Fp.mul(t2, t1);
			Z3 = Fp.add(Z3, Z3);
			Z3 = Fp.add(Z3, Z3);
			return new Point(X3, Y3, Z3);
		}
		add(other) {
			aprjpoint(other);
			const { px: X1, py: Y1, pz: Z1 } = this;
			const { px: X2, py: Y2, pz: Z2 } = other;
			let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
			const a = CURVE.a;
			const b3 = Fp.mul(CURVE.b, _3n);
			let t0 = Fp.mul(X1, X2);
			let t1 = Fp.mul(Y1, Y2);
			let t2 = Fp.mul(Z1, Z2);
			let t3 = Fp.add(X1, Y1);
			let t4 = Fp.add(X2, Y2);
			t3 = Fp.mul(t3, t4);
			t4 = Fp.add(t0, t1);
			t3 = Fp.sub(t3, t4);
			t4 = Fp.add(X1, Z1);
			let t5 = Fp.add(X2, Z2);
			t4 = Fp.mul(t4, t5);
			t5 = Fp.add(t0, t2);
			t4 = Fp.sub(t4, t5);
			t5 = Fp.add(Y1, Z1);
			X3 = Fp.add(Y2, Z2);
			t5 = Fp.mul(t5, X3);
			X3 = Fp.add(t1, t2);
			t5 = Fp.sub(t5, X3);
			Z3 = Fp.mul(a, t4);
			X3 = Fp.mul(b3, t2);
			Z3 = Fp.add(X3, Z3);
			X3 = Fp.sub(t1, Z3);
			Z3 = Fp.add(t1, Z3);
			Y3 = Fp.mul(X3, Z3);
			t1 = Fp.add(t0, t0);
			t1 = Fp.add(t1, t0);
			t2 = Fp.mul(a, t2);
			t4 = Fp.mul(b3, t4);
			t1 = Fp.add(t1, t2);
			t2 = Fp.sub(t0, t2);
			t2 = Fp.mul(a, t2);
			t4 = Fp.add(t4, t2);
			t0 = Fp.mul(t1, t4);
			Y3 = Fp.add(Y3, t0);
			t0 = Fp.mul(t5, t4);
			X3 = Fp.mul(t3, X3);
			X3 = Fp.sub(X3, t0);
			t0 = Fp.mul(t3, t1);
			Z3 = Fp.mul(t5, Z3);
			Z3 = Fp.add(Z3, t0);
			return new Point(X3, Y3, Z3);
		}
		subtract(other) {
			return this.add(other.negate());
		}
		is0() {
			return this.equals(Point.ZERO);
		}
		wNAF(n) {
			return wnaf.wNAFCached(this, n, Point.normalizeZ);
		}
		/**
		* Non-constant-time multiplication. Uses double-and-add algorithm.
		* It's faster, but should only be used when you don't care about
		* an exposed private key e.g. sig verification, which works over *public* keys.
		*/
		multiplyUnsafe(sc) {
			const { endo, n: N } = CURVE;
			aInRange("scalar", sc, _0n$1, N);
			const I = Point.ZERO;
			if (sc === _0n$1) return I;
			if (this.is0() || sc === _1n$1) return this;
			if (!endo || wnaf.hasPrecomputes(this)) return wnaf.wNAFCachedUnsafe(this, sc, Point.normalizeZ);
			/** See docs for {@link EndomorphismOpts} */
			let { k1neg, k1, k2neg, k2 } = endo.splitScalar(sc);
			let k1p = I;
			let k2p = I;
			let d = this;
			while (k1 > _0n$1 || k2 > _0n$1) {
				if (k1 & _1n$1) k1p = k1p.add(d);
				if (k2 & _1n$1) k2p = k2p.add(d);
				d = d.double();
				k1 >>= _1n$1;
				k2 >>= _1n$1;
			}
			if (k1neg) k1p = k1p.negate();
			if (k2neg) k2p = k2p.negate();
			k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
			return k1p.add(k2p);
		}
		/**
		* Constant time multiplication.
		* Uses wNAF method. Windowed method may be 10% faster,
		* but takes 2x longer to generate and consumes 2x memory.
		* Uses precomputes when available.
		* Uses endomorphism for Koblitz curves.
		* @param scalar by which the point would be multiplied
		* @returns New point
		*/
		multiply(scalar) {
			const { endo, n: N } = CURVE;
			aInRange("scalar", scalar, _1n$1, N);
			let point, fake;
			/** See docs for {@link EndomorphismOpts} */
			if (endo) {
				const { k1neg, k1, k2neg, k2 } = endo.splitScalar(scalar);
				let { p: k1p, f: f1p } = this.wNAF(k1);
				let { p: k2p, f: f2p } = this.wNAF(k2);
				k1p = wnaf.constTimeNegate(k1neg, k1p);
				k2p = wnaf.constTimeNegate(k2neg, k2p);
				k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
				point = k1p.add(k2p);
				fake = f1p.add(f2p);
			} else {
				const { p, f } = this.wNAF(scalar);
				point = p;
				fake = f;
			}
			return Point.normalizeZ([point, fake])[0];
		}
		/**
		* Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
		* Not using Strauss-Shamir trick: precomputation tables are faster.
		* The trick could be useful if both P and Q are not G (not in our case).
		* @returns non-zero affine point
		*/
		multiplyAndAddUnsafe(Q, a, b) {
			const G = Point.BASE;
			const mul = (P, a) => a === _0n$1 || a === _1n$1 || !P.equals(G) ? P.multiplyUnsafe(a) : P.multiply(a);
			const sum = mul(this, a).add(mul(Q, b));
			return sum.is0() ? void 0 : sum;
		}
		toAffine(iz) {
			return toAffineMemo(this, iz);
		}
		isTorsionFree() {
			const { h: cofactor, isTorsionFree } = CURVE;
			if (cofactor === _1n$1) return true;
			if (isTorsionFree) return isTorsionFree(Point, this);
			throw new Error("isTorsionFree() has not been declared for the elliptic curve");
		}
		clearCofactor() {
			const { h: cofactor, clearCofactor } = CURVE;
			if (cofactor === _1n$1) return this;
			if (clearCofactor) return clearCofactor(Point, this);
			return this.multiplyUnsafe(CURVE.h);
		}
		toRawBytes(isCompressed = true) {
			abool("isCompressed", isCompressed);
			this.assertValidity();
			return toBytes(Point, this, isCompressed);
		}
		toHex(isCompressed = true) {
			abool("isCompressed", isCompressed);
			return bytesToHex(this.toRawBytes(isCompressed));
		}
	}
	Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
	Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
	const { endo, nBitLength } = CURVE;
	const wnaf = wNAF(Point, endo ? Math.ceil(nBitLength / 2) : nBitLength);
	return {
		CURVE,
		ProjectivePoint: Point,
		normPrivateKeyToScalar,
		weierstrassEquation,
		isWithinCurveOrder
	};
}
function validateOpts(curve) {
	const opts = validateBasic(curve);
	validateObject(opts, {
		hash: "hash",
		hmac: "function",
		randomBytes: "function"
	}, {
		bits2int: "function",
		bits2int_modN: "function",
		lowS: "boolean"
	});
	return Object.freeze({
		lowS: true,
		...opts
	});
}
/**
* Creates short weierstrass curve and ECDSA signature methods for it.
* @example
* import { Field } from '@noble/curves/abstract/modular';
* // Before that, define BigInt-s: a, b, p, n, Gx, Gy
* const curve = weierstrass({ a, b, Fp: Field(p), n, Gx, Gy, h: 1n })
*/
function weierstrass(curveDef) {
	const CURVE = validateOpts(curveDef);
	const { Fp, n: CURVE_ORDER, nByteLength, nBitLength } = CURVE;
	const compressedLen = Fp.BYTES + 1;
	const uncompressedLen = 2 * Fp.BYTES + 1;
	function modN(a) {
		return mod(a, CURVE_ORDER);
	}
	function invN(a) {
		return invert(a, CURVE_ORDER);
	}
	const { ProjectivePoint: Point, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder } = weierstrassPoints({
		...CURVE,
		toBytes(_c, point, isCompressed) {
			const a = point.toAffine();
			const x = Fp.toBytes(a.x);
			const cat = concatBytes;
			abool("isCompressed", isCompressed);
			if (isCompressed) return cat(Uint8Array.from([point.hasEvenY() ? 2 : 3]), x);
			else return cat(Uint8Array.from([4]), x, Fp.toBytes(a.y));
		},
		fromBytes(bytes) {
			const len = bytes.length;
			const head = bytes[0];
			const tail = bytes.subarray(1);
			if (len === compressedLen && (head === 2 || head === 3)) {
				const x = bytesToNumberBE(tail);
				if (!inRange(x, _1n$1, Fp.ORDER)) throw new Error("Point is not on curve");
				const y2 = weierstrassEquation(x);
				let y;
				try {
					y = Fp.sqrt(y2);
				} catch (sqrtError) {
					const suffix = sqrtError instanceof Error ? ": " + sqrtError.message : "";
					throw new Error("Point is not on curve" + suffix);
				}
				const isYOdd = (y & _1n$1) === _1n$1;
				if ((head & 1) === 1 !== isYOdd) y = Fp.neg(y);
				return {
					x,
					y
				};
			} else if (len === uncompressedLen && head === 4) return {
				x: Fp.fromBytes(tail.subarray(0, Fp.BYTES)),
				y: Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES))
			};
			else {
				const cl = compressedLen;
				const ul = uncompressedLen;
				throw new Error("invalid Point, expected length of " + cl + ", or uncompressed " + ul + ", got " + len);
			}
		}
	});
	function isBiggerThanHalfOrder(number) {
		return number > CURVE_ORDER >> _1n$1;
	}
	function normalizeS(s) {
		return isBiggerThanHalfOrder(s) ? modN(-s) : s;
	}
	const slcNum = (b, from, to) => bytesToNumberBE(b.slice(from, to));
	/**
	* ECDSA signature with its (r, s) properties. Supports DER & compact representations.
	*/
	class Signature {
		constructor(r, s, recovery) {
			aInRange("r", r, _1n$1, CURVE_ORDER);
			aInRange("s", s, _1n$1, CURVE_ORDER);
			this.r = r;
			this.s = s;
			if (recovery != null) this.recovery = recovery;
			Object.freeze(this);
		}
		static fromCompact(hex) {
			const l = nByteLength;
			hex = ensureBytes("compactSignature", hex, l * 2);
			return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
		}
		static fromDER(hex) {
			const { r, s } = DER.toSig(ensureBytes("DER", hex));
			return new Signature(r, s);
		}
		/**
		* @todo remove
		* @deprecated
		*/
		assertValidity() {}
		addRecoveryBit(recovery) {
			return new Signature(this.r, this.s, recovery);
		}
		recoverPublicKey(msgHash) {
			const { r, s, recovery: rec } = this;
			const h = bits2int_modN(ensureBytes("msgHash", msgHash));
			if (rec == null || ![
				0,
				1,
				2,
				3
			].includes(rec)) throw new Error("recovery id invalid");
			const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
			if (radj >= Fp.ORDER) throw new Error("recovery id 2 or 3 invalid");
			const prefix = (rec & 1) === 0 ? "02" : "03";
			const R = Point.fromHex(prefix + numToSizedHex(radj, Fp.BYTES));
			const ir = invN(radj);
			const u1 = modN(-h * ir);
			const u2 = modN(s * ir);
			const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
			if (!Q) throw new Error("point at infinify");
			Q.assertValidity();
			return Q;
		}
		hasHighS() {
			return isBiggerThanHalfOrder(this.s);
		}
		normalizeS() {
			return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
		}
		toDERRawBytes() {
			return hexToBytes(this.toDERHex());
		}
		toDERHex() {
			return DER.hexFromSig(this);
		}
		toCompactRawBytes() {
			return hexToBytes(this.toCompactHex());
		}
		toCompactHex() {
			const l = nByteLength;
			return numToSizedHex(this.r, l) + numToSizedHex(this.s, l);
		}
	}
	const utils = {
		isValidPrivateKey(privateKey) {
			try {
				normPrivateKeyToScalar(privateKey);
				return true;
			} catch (error) {
				return false;
			}
		},
		normPrivateKeyToScalar,
		/**
		* Produces cryptographically secure private key from random of size
		* (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
		*/
		randomPrivateKey: () => {
			const length = getMinHashLength(CURVE.n);
			return mapHashToField(CURVE.randomBytes(length), CURVE.n);
		},
		/**
		* Creates precompute table for an arbitrary EC point. Makes point "cached".
		* Allows to massively speed-up `point.multiply(scalar)`.
		* @returns cached point
		* @example
		* const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
		* fast.multiply(privKey); // much faster ECDH now
		*/
		precompute(windowSize = 8, point = Point.BASE) {
			point._setWindowSize(windowSize);
			point.multiply(BigInt(3));
			return point;
		}
	};
	/**
	* Computes public key for a private key. Checks for validity of the private key.
	* @param privateKey private key
	* @param isCompressed whether to return compact (default), or full key
	* @returns Public key, full when isCompressed=false; short when isCompressed=true
	*/
	function getPublicKey(privateKey, isCompressed = true) {
		return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
	}
	/**
	* Quick and dirty check for item being public key. Does not validate hex, or being on-curve.
	*/
	function isProbPub(item) {
		if (typeof item === "bigint") return false;
		if (item instanceof Point) return true;
		const len = ensureBytes("key", item).length;
		const fpl = Fp.BYTES;
		const compLen = fpl + 1;
		const uncompLen = 2 * fpl + 1;
		if (CURVE.allowedPrivateKeyLengths || nByteLength === compLen) return;
		else return len === compLen || len === uncompLen;
	}
	/**
	* ECDH (Elliptic Curve Diffie Hellman).
	* Computes shared public key from private key and public key.
	* Checks: 1) private key validity 2) shared key is on-curve.
	* Does NOT hash the result.
	* @param privateA private key
	* @param publicB different public key
	* @param isCompressed whether to return compact (default), or full key
	* @returns shared public key
	*/
	function getSharedSecret(privateA, publicB, isCompressed = true) {
		if (isProbPub(privateA) === true) throw new Error("first arg must be private key");
		if (isProbPub(publicB) === false) throw new Error("second arg must be public key");
		return Point.fromHex(publicB).multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
	}
	const bits2int = CURVE.bits2int || function(bytes) {
		if (bytes.length > 8192) throw new Error("input is too large");
		const num = bytesToNumberBE(bytes);
		const delta = bytes.length * 8 - nBitLength;
		return delta > 0 ? num >> BigInt(delta) : num;
	};
	const bits2int_modN = CURVE.bits2int_modN || function(bytes) {
		return modN(bits2int(bytes));
	};
	const ORDER_MASK = bitMask(nBitLength);
	/**
	* Converts to bytes. Checks if num in `[0..ORDER_MASK-1]` e.g.: `[0..2^256-1]`.
	*/
	function int2octets(num) {
		aInRange("num < 2^" + nBitLength, num, _0n$1, ORDER_MASK);
		return numberToBytesBE(num, nByteLength);
	}
	function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
		if (["recovered", "canonical"].some((k) => k in opts)) throw new Error("sign() legacy options not supported");
		const { hash, randomBytes } = CURVE;
		let { lowS, prehash, extraEntropy: ent } = opts;
		if (lowS == null) lowS = true;
		msgHash = ensureBytes("msgHash", msgHash);
		validateSigVerOpts(opts);
		if (prehash) msgHash = ensureBytes("prehashed msgHash", hash(msgHash));
		const h1int = bits2int_modN(msgHash);
		const d = normPrivateKeyToScalar(privateKey);
		const seedArgs = [int2octets(d), int2octets(h1int)];
		if (ent != null && ent !== false) {
			const e = ent === true ? randomBytes(Fp.BYTES) : ent;
			seedArgs.push(ensureBytes("extraEntropy", e));
		}
		const seed = concatBytes(...seedArgs);
		const m = h1int;
		function k2sig(kBytes) {
			const k = bits2int(kBytes);
			if (!isWithinCurveOrder(k)) return;
			const ik = invN(k);
			const q = Point.BASE.multiply(k).toAffine();
			const r = modN(q.x);
			if (r === _0n$1) return;
			const s = modN(ik * modN(m + r * d));
			if (s === _0n$1) return;
			let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n$1);
			let normS = s;
			if (lowS && isBiggerThanHalfOrder(s)) {
				normS = normalizeS(s);
				recovery ^= 1;
			}
			return new Signature(r, normS, recovery);
		}
		return {
			seed,
			k2sig
		};
	}
	const defaultSigOpts = {
		lowS: CURVE.lowS,
		prehash: false
	};
	const defaultVerOpts = {
		lowS: CURVE.lowS,
		prehash: false
	};
	/**
	* Signs message hash with a private key.
	* ```
	* sign(m, d, k) where
	*   (x, y) = G × k
	*   r = x mod n
	*   s = (m + dr)/k mod n
	* ```
	* @param msgHash NOT message. msg needs to be hashed to `msgHash`, or use `prehash`.
	* @param privKey private key
	* @param opts lowS for non-malleable sigs. extraEntropy for mixing randomness into k. prehash will hash first arg.
	* @returns signature with recovery param
	*/
	function sign(msgHash, privKey, opts = defaultSigOpts) {
		const { seed, k2sig } = prepSig(msgHash, privKey, opts);
		const C = CURVE;
		return createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac)(seed, k2sig);
	}
	Point.BASE._setWindowSize(8);
	/**
	* Verifies a signature against message hash and public key.
	* Rejects lowS signatures by default: to override,
	* specify option `{lowS: false}`. Implements section 4.1.4 from https://www.secg.org/sec1-v2.pdf:
	*
	* ```
	* verify(r, s, h, P) where
	*   U1 = hs^-1 mod n
	*   U2 = rs^-1 mod n
	*   R = U1⋅G - U2⋅P
	*   mod(R.x, n) == r
	* ```
	*/
	function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
		const sg = signature;
		msgHash = ensureBytes("msgHash", msgHash);
		publicKey = ensureBytes("publicKey", publicKey);
		const { lowS, prehash, format } = opts;
		validateSigVerOpts(opts);
		if ("strict" in opts) throw new Error("options.strict was renamed to lowS");
		if (format !== void 0 && format !== "compact" && format !== "der") throw new Error("format must be compact or der");
		const isHex = typeof sg === "string" || isBytes(sg);
		const isObj = !isHex && !format && typeof sg === "object" && sg !== null && typeof sg.r === "bigint" && typeof sg.s === "bigint";
		if (!isHex && !isObj) throw new Error("invalid signature, expected Uint8Array, hex string or Signature instance");
		let _sig = void 0;
		let P;
		try {
			if (isObj) _sig = new Signature(sg.r, sg.s);
			if (isHex) {
				try {
					if (format !== "compact") _sig = Signature.fromDER(sg);
				} catch (derError) {
					if (!(derError instanceof DER.Err)) throw derError;
				}
				if (!_sig && format !== "der") _sig = Signature.fromCompact(sg);
			}
			P = Point.fromHex(publicKey);
		} catch (error) {
			return false;
		}
		if (!_sig) return false;
		if (lowS && _sig.hasHighS()) return false;
		if (prehash) msgHash = CURVE.hash(msgHash);
		const { r, s } = _sig;
		const h = bits2int_modN(msgHash);
		const is = invN(s);
		const u1 = modN(h * is);
		const u2 = modN(r * is);
		const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine();
		if (!R) return false;
		return modN(R.x) === r;
	}
	return {
		CURVE,
		getPublicKey,
		getSharedSecret,
		sign,
		verify,
		ProjectivePoint: Point,
		Signature,
		utils
	};
}
// ../../node_modules/viem/node_modules/@noble/curves/esm/_shortw_utils.js
/**
* Utilities for short weierstrass curves, combined with noble-hashes.
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
/** connects noble-curves to noble-hashes */
function getHash(hash) {
	return {
		hash,
		hmac: (key, ...msgs) => hmac(hash, key, concatBytes$2(...msgs)),
		randomBytes
	};
}
function createCurve(curveDef, defHash) {
	const create = (hash) => weierstrass({
		...curveDef,
		...getHash(hash)
	});
	return {
		...create(defHash),
		create
	};
}
// ../../node_modules/viem/node_modules/@noble/curves/esm/secp256k1.js
/**
* NIST secp256k1. See [pdf](https://www.secg.org/sec2-v2.pdf).
*
* Seems to be rigid (not backdoored)
* [as per discussion](https://bitcointalk.org/index.php?topic=289795.msg3183975#msg3183975).
*
* secp256k1 belongs to Koblitz curves: it has efficiently computable endomorphism.
* Endomorphism uses 2x less RAM, speeds up precomputation by 2x and ECDH / key recovery by 20%.
* For precomputed wNAF it trades off 1/2 init time & 1/3 ram for 20% perf hit.
* [See explanation](https://gist.github.com/paulmillr/eb670806793e84df628a7c434a873066).
* @module
*/
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var secp256k1_exports = /* @__PURE__ */ __exportAll({ secp256k1: () => secp256k1 });
var secp256k1P = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f");
var secp256k1N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
var _0n = BigInt(0);
var _1n = BigInt(1);
var _2n = BigInt(2);
var divNearest = (a, b) => (a + b / _2n) / b;
/**
* √n = n^((p+1)/4) for fields p = 3 mod 4. We unwrap the loop and multiply bit-by-bit.
* (P+1n/4n).toString(2) would produce bits [223x 1, 0, 22x 1, 4x 0, 11, 00]
*/
function sqrtMod(y) {
	const P = secp256k1P;
	const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
	const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
	const b2 = y * y * y % P;
	const b3 = b2 * b2 * y % P;
	const b11 = pow2(pow2(pow2(b3, _3n, P) * b3 % P, _3n, P) * b3 % P, _2n, P) * b2 % P;
	const b22 = pow2(b11, _11n, P) * b11 % P;
	const b44 = pow2(b22, _22n, P) * b22 % P;
	const b88 = pow2(b44, _44n, P) * b44 % P;
	const root = pow2(pow2(pow2(pow2(pow2(pow2(b88, _88n, P) * b88 % P, _44n, P) * b44 % P, _3n, P) * b3 % P, _23n, P) * b22 % P, _6n, P) * b2 % P, _2n, P);
	if (!Fpk1.eql(Fpk1.sqr(root), y)) throw new Error("Cannot find square root");
	return root;
}
var Fpk1 = Field(secp256k1P, void 0, void 0, { sqrt: sqrtMod });
/**
* secp256k1 curve, ECDSA and ECDH methods.
*
* Field: `2n**256n - 2n**32n - 2n**9n - 2n**8n - 2n**7n - 2n**6n - 2n**4n - 1n`
*
* @example
* ```js
* import { secp256k1 } from '@noble/curves/secp256k1';
* const priv = secp256k1.utils.randomPrivateKey();
* const pub = secp256k1.getPublicKey(priv);
* const msg = new Uint8Array(32).fill(1); // message hash (not message) in ecdsa
* const sig = secp256k1.sign(msg, priv); // `{prehash: true}` option is available
* const isValid = secp256k1.verify(sig, msg, pub) === true;
* ```
*/
var secp256k1 = createCurve({
	a: _0n,
	b: BigInt(7),
	Fp: Fpk1,
	n: secp256k1N,
	Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
	Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
	h: BigInt(1),
	lowS: true,
	endo: {
		beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
		splitScalar: (k) => {
			const n = secp256k1N;
			const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
			const b1 = -_1n * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
			const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
			const b2 = a1;
			const POW_2_128 = BigInt("0x100000000000000000000000000000000");
			const c1 = divNearest(b2 * k, n);
			const c2 = divNearest(-b1 * k, n);
			let k1 = mod(k - c1 * a1 - c2 * a2, n);
			let k2 = mod(-c1 * b1 - c2 * b2, n);
			const k1neg = k1 > POW_2_128;
			const k2neg = k2 > POW_2_128;
			if (k1neg) k1 = n - k1;
			if (k2neg) k2 = n - k2;
			if (k1 > POW_2_128 || k2 > POW_2_128) throw new Error("splitScalar: Endomorphism failed, k=" + k);
			return {
				k1neg,
				k1,
				k2neg,
				k2
			};
		}
	}
}, sha256$3);
// ../../node_modules/viem/node_modules/ox/_esm/core/Signature.js
/**
* Asserts that a Signature is valid.
*
* @example
* ```ts twoslash
* import { Signature } from 'ox'
*
* Signature.assert({
*   r: -49782753348462494199823712700004552394425719014458918871452329774910450607807n,
*   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
*   yParity: 1,
* })
* // @error: InvalidSignatureRError:
* // @error: Value `-549...n` is an invalid r value.
* // @error: r must be a positive integer less than 2^256.
* ```
*
* @param signature - The signature object to assert.
*/
function assert$2(signature, options = {}) {
	const { recovered } = options;
	if (typeof signature.r === "undefined") throw new MissingPropertiesError({ signature });
	if (typeof signature.s === "undefined") throw new MissingPropertiesError({ signature });
	if (recovered && typeof signature.yParity === "undefined") throw new MissingPropertiesError({ signature });
	if (signature.r < 0n || signature.r > maxUint256) throw new InvalidRError({ value: signature.r });
	if (signature.s < 0n || signature.s > maxUint256) throw new InvalidSError({ value: signature.s });
	if (typeof signature.yParity === "number" && signature.yParity !== 0 && signature.yParity !== 1) throw new InvalidYParityError({ value: signature.yParity });
}
/**
* Converts a {@link ox#Signature.Rpc} into a {@link ox#Signature.Signature}.
*
* @example
* ```ts twoslash
* import { Signature } from 'ox'
*
* const signature = Signature.fromRpc({
*   r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
*   s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
*   yParity: '0x0',
* })
* ```
*
* @param signature - The {@link ox#Signature.Rpc} to convert.
* @returns The converted {@link ox#Signature.Signature}.
*/
function fromRpc$1(signature) {
	const yParity = (() => {
		const v = signature.v ? Number(signature.v) : void 0;
		let yParity = signature.yParity ? Number(signature.yParity) : void 0;
		if (typeof v === "number" && typeof yParity !== "number") yParity = vToYParity(v);
		if (typeof yParity !== "number") throw new InvalidYParityError({ value: signature.yParity });
		return yParity;
	})();
	return {
		r: BigInt(signature.r),
		s: BigInt(signature.s),
		yParity
	};
}
/**
* Converts a ECDSA `v` value to a `yParity` value.
*
* @example
* ```ts twoslash
* import { Signature } from 'ox'
*
* const yParity = Signature.vToYParity(28)
* // @log: 1
* ```
*
* @param v - The ECDSA `v` value to convert.
* @returns The `yParity` value.
*/
function vToYParity(v) {
	if (v === 0 || v === 27) return 0;
	if (v === 1 || v === 28) return 1;
	if (v >= 35) return v % 2 === 0 ? 1 : 0;
	throw new InvalidVError({ value: v });
}
/** Thrown when the signature is missing either an `r`, `s`, or `yParity` property. */
var MissingPropertiesError = class extends BaseError {
	constructor({ signature }) {
		super(`Signature \`${stringify(signature)}\` is missing either an \`r\`, \`s\`, or \`yParity\` property.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Signature.MissingPropertiesError"
		});
	}
};
/** Thrown when the signature has an invalid `r` value. */
var InvalidRError = class extends BaseError {
	constructor({ value }) {
		super(`Value \`${value}\` is an invalid r value. r must be a positive integer less than 2^256.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Signature.InvalidRError"
		});
	}
};
/** Thrown when the signature has an invalid `s` value. */
var InvalidSError = class extends BaseError {
	constructor({ value }) {
		super(`Value \`${value}\` is an invalid s value. s must be a positive integer less than 2^256.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Signature.InvalidSError"
		});
	}
};
/** Thrown when the signature has an invalid `yParity` value. */
var InvalidYParityError = class extends BaseError {
	constructor({ value }) {
		super(`Value \`${value}\` is an invalid y-parity value. Y-parity must be 0 or 1.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Signature.InvalidYParityError"
		});
	}
};
/** Thrown when the signature has an invalid `v` value. */
var InvalidVError = class extends BaseError {
	constructor({ value }) {
		super(`Value \`${value}\` is an invalid v value. v must be 27, 28 or >=35.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "Signature.InvalidVError"
		});
	}
};
// ../../node_modules/viem/node_modules/ox/_esm/core/Authorization.js
/**
* Converts an [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization object into a typed {@link ox#Authorization.Authorization}.
*
* @example
* An Authorization can be instantiated from an [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization tuple in object format.
*
* ```ts twoslash
* import { Authorization } from 'ox'
*
* const authorization = Authorization.from({
*   address: '0x1234567890abcdef1234567890abcdef12345678',
*   chainId: 1,
*   nonce: 69n,
* })
* ```
*
* @example
* ### Attaching Signatures
*
* A {@link ox#Signature.Signature} can be attached with the `signature` option. The example below demonstrates signing
* an Authorization with {@link ox#Secp256k1.(sign:function)}.
*
* ```ts twoslash
* import { Authorization, Secp256k1 } from 'ox'
*
* const authorization = Authorization.from({
*   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
*   chainId: 1,
*   nonce: 40n,
* })
*
* const signature = Secp256k1.sign({
*   payload: Authorization.getSignPayload(authorization),
*   privateKey: '0x...',
* })
*
* const authorization_signed = Authorization.from(authorization, { signature }) // [!code focus]
* ```
*
* @param authorization - An [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization tuple in object format.
* @param options - Authorization options.
* @returns The {@link ox#Authorization.Authorization}.
*/
function from$4(authorization, options = {}) {
	if (typeof authorization.chainId === "string") return fromRpc(authorization);
	return {
		...authorization,
		...options.signature
	};
}
/**
* Converts an {@link ox#Authorization.Rpc} to an {@link ox#Authorization.Authorization}.
*
* @example
* ```ts twoslash
* import { Authorization } from 'ox'
*
* const authorization = Authorization.fromRpc({
*   address: '0x0000000000000000000000000000000000000000',
*   chainId: '0x1',
*   nonce: '0x1',
*   r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
*   s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
*   yParity: '0x0',
* })
* ```
*
* @param authorization - The RPC-formatted Authorization.
* @returns A signed {@link ox#Authorization.Authorization}.
*/
function fromRpc(authorization) {
	const { address, chainId, nonce } = authorization;
	const signature = fromRpc$1(authorization);
	assert$2({
		r: signature.r,
		s: signature.s
	});
	assertYParity(signature.yParity);
	return {
		address,
		chainId: Number(chainId),
		nonce: BigInt(nonce),
		...signature
	};
}
function assertYParity(yParity) {
	if (Number.isInteger(yParity) && yParity >= 0 && yParity < 256) return;
	throw new IntegerOutOfRangeError({
		max: "255",
		min: "0",
		signed: false,
		size: 1,
		value: `${yParity}`
	});
}
/** Suffix ABI parameters for the ERC-8010 wrapped signature. */
var suffixParameters = from$5("(uint256 chainId, address delegation, uint256 nonce, uint8 yParity, uint256 r, uint256 s), address to, bytes data");
/**
* Asserts that the wrapped signature is valid.
*
* @example
* ```ts twoslash
* import { SignatureErc8010 } from 'ox/erc8010'
*
* SignatureErc8010.assert('0xdeadbeef')
* // @error: InvalidWrappedSignatureError: Value `0xdeadbeef` is an invalid ERC-8010 wrapped signature.
* ```
*
* @param value - The value to assert.
*/
function assert$1(value) {
	if (typeof value === "string") {
		if (slice(value, -32) !== "0x8010801080108010801080108010801080108010801080108010801080108010") throw new InvalidWrappedSignatureError$1(value);
	} else assert$2(value.authorization);
}
/**
* Unwraps an [ERC-8010 wrapped signature](https://github.com/jxom/ERCs/blob/16f7e3891fff2e1e9c25dea0485497739db8a816/ERCS/erc-8010.md) into its constituent parts.
*
* @example
* ```ts twoslash
* import { SignatureErc8010 } from 'ox/erc8010'
*
* const { authorization, data, signature } = SignatureErc8010.unwrap('0x...')
* ```
*
* @param wrapped - Wrapped signature to unwrap.
* @returns Unwrapped signature.
*/
function unwrap(wrapped) {
	assert$1(wrapped);
	const suffixLength = toNumber(slice(wrapped, -64, -32));
	const suffix = slice(wrapped, -suffixLength - 64, -64);
	const signature = slice(wrapped, 0, -suffixLength - 64);
	const [auth, to, data] = decode(suffixParameters, suffix);
	return {
		authorization: from$4({
			address: auth.delegation,
			chainId: Number(auth.chainId),
			nonce: auth.nonce,
			yParity: auth.yParity,
			r: auth.r,
			s: auth.s
		}),
		signature,
		...data && data !== "0x" ? {
			data,
			to
		} : {}
	};
}
/**
* Validates a wrapped signature. Returns `true` if the wrapped signature is valid, `false` otherwise.
*
* @example
* ```ts twoslash
* import { SignatureErc8010 } from 'ox/erc8010'
*
* const valid = SignatureErc8010.validate('0xdeadbeef')
* // @log: false
* ```
*
* @param value - The value to validate.
* @returns `true` if the value is valid, `false` otherwise.
*/
function validate$1(value) {
	try {
		assert$1(value);
		return true;
	} catch {
		return false;
	}
}
/** Thrown when the ERC-8010 wrapped signature is invalid. */
var InvalidWrappedSignatureError$1 = class extends BaseError {
	constructor(wrapped) {
		super(`Value \`${wrapped}\` is an invalid ERC-8010 wrapped signature.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "SignatureErc8010.InvalidWrappedSignatureError"
		});
	}
};
// ../../node_modules/viem/_esm/utils/unit/formatUnits.js
/**
*  Divides a number by a given exponent of base 10 (10exponent), and formats it into a string representation of the number..
*
* - Docs: https://viem.sh/docs/utilities/formatUnits
*
* @example
* import { formatUnits } from 'viem'
*
* formatUnits(420000000000n, 9)
* // '420'
*/
function formatUnits(value, decimals) {
	return format$2(value, decimals);
}
// ../../node_modules/viem/_esm/utils/formatters/proof.js
function formatStorageProof(storageProof) {
	return storageProof.map((proof) => ({
		...proof,
		value: BigInt(proof.value)
	}));
}
function formatProof(proof) {
	return {
		...proof,
		balance: proof.balance ? BigInt(proof.balance) : void 0,
		nonce: proof.nonce ? hexToNumber$1(proof.nonce) : void 0,
		storageProof: proof.storageProof ? formatStorageProof(proof.storageProof) : void 0
	};
}
// ../../node_modules/viem/_esm/actions/public/getProof.js
/**
* Returns the account and storage values of the specified account including the Merkle-proof.
*
* - Docs: https://viem.sh/docs/actions/public/getProof
* - JSON-RPC Methods:
*   - Calls [`eth_getProof`](https://eips.ethereum.org/EIPS/eip-1186)
*
* @param client - Client to use
* @param parameters - {@link GetProofParameters}
* @returns Proof data. {@link GetProofReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getProof } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const block = await getProof(client, {
*  address: '0x...',
*  storageKeys: ['0x...'],
* })
*/
async function getProof(client, { address, blockHash, blockNumber, blockTag = "latest", requireCanonical, storageKeys }) {
	const block = formatBlockParameter({
		blockHash,
		blockNumber,
		blockTag,
		requireCanonical
	});
	return formatProof(await client.request({
		method: "eth_getProof",
		params: [
			address,
			storageKeys,
			block
		]
	}));
}
// ../../node_modules/viem/_esm/actions/public/getRawTransaction.js
/**
* Returns the raw, serialized [Transaction](https://viem.sh/docs/glossary/terms#transaction) given a hash.
*
* - Docs: https://viem.sh/docs/actions/public/getRawTransaction
* - JSON-RPC Methods: `eth_getRawTransactionByHash`
*
* @param client - Client to use
* @param parameters - {@link GetRawTransactionParameters}
* @returns The raw, serialized transaction. {@link GetRawTransactionReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getRawTransaction } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const rawTransaction = await getRawTransaction(client, {
*   hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
* })
*/
async function getRawTransaction(client, { hash }) {
	const rawTransaction = await client.request({
		method: "eth_getRawTransactionByHash",
		params: [hash]
	}, { dedupe: true });
	if (!rawTransaction) throw new TransactionNotFoundError({ hash });
	return rawTransaction;
}
// ../../node_modules/viem/_esm/actions/public/getStorageAt.js
/**
* Returns the value from a storage slot at a given address.
*
* - Docs: https://viem.sh/docs/contract/getStorageAt
* - JSON-RPC Methods: [`eth_getStorageAt`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getstorageat)
*
* @param client - Client to use
* @param parameters - {@link GetStorageAtParameters}
* @returns The value of the storage slot. {@link GetStorageAtReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getStorageAt } from 'viem/contract'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const code = await getStorageAt(client, {
*   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
*   slot: toHex(0),
* })
*/
async function getStorageAt(client, { address, blockHash, blockNumber, blockTag = "latest", requireCanonical, slot }) {
	const block = formatBlockParameter({
		blockHash,
		blockNumber,
		blockTag,
		requireCanonical
	});
	return await client.request({
		method: "eth_getStorageAt",
		params: [
			address,
			slot,
			block
		]
	});
}
// ../../node_modules/viem/_esm/actions/public/getStorageValues.js
/**
* Returns values from multiple storage slots for multiple adddresses at a given block.
*
* - Docs: https://viem.sh/docs/actions/public/getStorageValues
* - JSON-RPC Methods: [`eth_getStorageValues`](https://github.com/ethereum/execution-apis/issues/752)
*
* @param client - Client to use
* @param parameters - {@link GetStorageValuesParameters}
* @returns The values of the requested storage slots. {@link GetStorageValuesReturnType}
*
* @example
* import { createPublicClient, http, toHex } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getStorageValues } from 'viem/actions'
*
* const client = createPublicClient({ chain: mainnet, transport: http() })
* const values = await getStorageValues(client, {
*   requests: {
*     '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2': [
*       toHex(0, { size: 32 }),
*       toHex(1, { size: 32 }),
*     ],
*   },
* })
*/
async function getStorageValues(client, { blockHash, blockNumber, blockTag = "latest", requireCanonical, requests }) {
	const block = formatBlockParameter({
		blockHash,
		blockNumber,
		blockTag,
		requireCanonical
	});
	return client.request({
		method: "eth_getStorageValues",
		params: [requests, block]
	});
}
// ../../node_modules/viem/_esm/actions/public/getTransaction.js
/**
* Returns information about a [Transaction](https://viem.sh/docs/glossary/terms#transaction) given a hash or block identifier.
*
* - Docs: https://viem.sh/docs/actions/public/getTransaction
* - Example: https://stackblitz.com/github/wevm/viem/tree/main/examples/transactions_fetching-transactions
* - JSON-RPC Methods: [`eth_getTransactionByHash`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getTransactionByHash)
*
* @param client - Client to use
* @param parameters - {@link GetTransactionParameters}
* @returns The transaction information. {@link GetTransactionReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getTransaction } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const transaction = await getTransaction(client, {
*   hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
* })
*/
async function getTransaction(client, { blockHash, blockNumber, blockTag: blockTag_, hash, index, sender, nonce }) {
	const blockTag = blockTag_ || "latest";
	const blockNumberHex = blockNumber !== void 0 ? numberToHex(blockNumber) : void 0;
	let transaction = null;
	if (hash) transaction = await client.request({
		method: "eth_getTransactionByHash",
		params: [hash]
	}, { dedupe: true });
	else if (blockHash) transaction = await client.request({
		method: "eth_getTransactionByBlockHashAndIndex",
		params: [blockHash, numberToHex(index)]
	}, { dedupe: true });
	else if ((blockNumberHex || blockTag) && typeof index === "number") transaction = await client.request({
		method: "eth_getTransactionByBlockNumberAndIndex",
		params: [blockNumberHex || blockTag, numberToHex(index)]
	}, { dedupe: Boolean(blockNumberHex) });
	else if (sender && typeof nonce === "number") transaction = await client.request({
		method: "eth_getTransactionBySenderAndNonce",
		params: [sender, numberToHex(nonce)]
	}, { dedupe: true });
	if (!transaction) throw new TransactionNotFoundError({
		blockHash,
		blockNumber,
		blockTag,
		hash,
		index
	});
	return (client.chain?.formatters?.transaction?.format || formatTransaction)(transaction, "getTransaction");
}
// ../../node_modules/viem/_esm/actions/public/getTransactionConfirmations.js
/**
* Returns the number of blocks passed (confirmations) since the transaction was processed on a block.
*
* - Docs: https://viem.sh/docs/actions/public/getTransactionConfirmations
* - Example: https://stackblitz.com/github/wevm/viem/tree/main/examples/transactions_fetching-transactions
* - JSON-RPC Methods: [`eth_getTransactionConfirmations`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getTransactionConfirmations)
*
* @param client - Client to use
* @param parameters - {@link GetTransactionConfirmationsParameters}
* @returns The number of blocks passed since the transaction was processed. If confirmations is 0, then the Transaction has not been confirmed & processed yet. {@link GetTransactionConfirmationsReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getTransactionConfirmations } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const confirmations = await getTransactionConfirmations(client, {
*   hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
* })
*/
async function getTransactionConfirmations(client, { hash, transactionReceipt }) {
	const [blockNumber, transaction] = await Promise.all([getAction(client, getBlockNumber, "getBlockNumber")({}), hash ? getAction(client, getTransaction, "getTransaction")({ hash }) : void 0]);
	const transactionBlockNumber = transactionReceipt?.blockNumber || transaction?.blockNumber;
	if (!transactionBlockNumber) return 0n;
	const headBlockNumber = blockNumber < transactionBlockNumber ? await getAction(client, getBlockNumber, "getBlockNumber")({ cacheTime: 0 }) : blockNumber;
	if (headBlockNumber < transactionBlockNumber) return 1n;
	return headBlockNumber - transactionBlockNumber + 1n;
}
// ../../node_modules/viem/_esm/actions/public/getTransactionReceipt.js
/**
* Returns the [Transaction Receipt](https://viem.sh/docs/glossary/terms#transaction-receipt) given a [Transaction](https://viem.sh/docs/glossary/terms#transaction) hash.
*
* - Docs: https://viem.sh/docs/actions/public/getTransactionReceipt
* - Example: https://stackblitz.com/github/wevm/viem/tree/main/examples/transactions_fetching-transactions
* - JSON-RPC Methods: [`eth_getTransactionReceipt`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_gettransactionreceipt)
*
* @param client - Client to use
* @param parameters - {@link GetTransactionReceiptParameters}
* @returns The transaction receipt. {@link GetTransactionReceiptReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { getTransactionReceipt } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const transactionReceipt = await getTransactionReceipt(client, {
*   hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
* })
*/
async function getTransactionReceipt(client, { hash }) {
	const receipt = await client.request({
		method: "eth_getTransactionReceipt",
		params: [hash]
	}, { dedupe: true });
	if (!receipt) throw new TransactionReceiptNotFoundError({ hash });
	return (client.chain?.formatters?.transactionReceipt?.format || formatTransactionReceipt)(receipt, "getTransactionReceipt");
}
// ../../node_modules/viem/_esm/actions/public/multicall.js
/**
* Similar to [`readContract`](https://viem.sh/docs/contract/readContract), but batches up multiple functions on a contract in a single RPC call via the [`multicall3` contract](https://github.com/mds1/multicall).
*
* - Docs: https://viem.sh/docs/contract/multicall
*
* @param client - Client to use
* @param parameters - {@link MulticallParameters}
* @returns An array of results with accompanying status. {@link MulticallReturnType}
*
* @example
* import { createPublicClient, http, parseAbi } from 'viem'
* import { mainnet } from 'viem/chains'
* import { multicall } from 'viem/contract'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const abi = parseAbi([
*   'function balanceOf(address) view returns (uint256)',
*   'function totalSupply() view returns (uint256)',
* ])
* const results = await multicall(client, {
*   contracts: [
*     {
*       address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
*       abi,
*       functionName: 'balanceOf',
*       args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
*     },
*     {
*       address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
*       abi,
*       functionName: 'totalSupply',
*     },
*   ],
* })
* // [{ result: 424122n, status: 'success' }, { result: 1000000n, status: 'success' }]
*/
async function multicall(client, parameters) {
	const { account, authorizationList, allowFailure = true, blockHash, blockNumber, blockOverrides, blockTag, requireCanonical, stateOverride } = parameters;
	const contracts = parameters.contracts;
	const batch = typeof client.batch?.multicall === "object" ? client.batch.multicall : {};
	const batchSize = parameters.batchSize ?? batch.batchSize ?? 1024;
	const deployless = parameters.deployless ?? batch.deployless ?? false;
	const multicallAddress = (() => {
		if (parameters.multicallAddress) return parameters.multicallAddress;
		if (deployless) return null;
		if (client.chain) return getChainContractAddress({
			blockNumber,
			chain: client.chain,
			contract: "multicall3"
		});
		throw new Error("client chain not configured. multicallAddress is required.");
	})();
	const chunkedCalls = [[]];
	let currentChunk = 0;
	let currentChunkSize = 0;
	for (let i = 0; i < contracts.length; i++) {
		const { abi, address, args, functionName } = contracts[i];
		try {
			const callData = encodeFunctionData({
				abi,
				args,
				functionName
			});
			currentChunkSize += (callData.length - 2) / 2;
			if (batchSize > 0 && currentChunkSize > batchSize && chunkedCalls[currentChunk].length > 0) {
				currentChunk++;
				currentChunkSize = (callData.length - 2) / 2;
				chunkedCalls[currentChunk] = [];
			}
			chunkedCalls[currentChunk] = [...chunkedCalls[currentChunk], {
				allowFailure: true,
				callData,
				target: address
			}];
		} catch (err) {
			const error = getContractError(err, {
				abi,
				address,
				args,
				docsPath: "/docs/contract/multicall",
				functionName,
				sender: account
			});
			if (!allowFailure) throw error;
			chunkedCalls[currentChunk] = [...chunkedCalls[currentChunk], {
				allowFailure: true,
				callData: "0x",
				target: address
			}];
		}
	}
	const batching = Boolean(client.batch?.multicall);
	const batches = batching ? chunkedCalls.flatMap((calls) => calls.map((call) => [call])) : chunkedCalls;
	const aggregate3Results = await Promise.allSettled(batches.map((calls) => {
		if (batching) return scheduleMulticall(client, {
			account,
			authorizationList,
			batchSize,
			blockHash,
			blockNumber,
			blockOverrides,
			blockTag,
			call: calls[0],
			multicallAddress,
			requireCanonical,
			stateOverride
		}).then((result) => [result]);
		return getAction(client, readContract, "readContract")({
			...multicallAddress === null ? { code: multicall3Bytecode } : { address: multicallAddress },
			abi: multicall3Abi,
			account,
			args: [calls],
			authorizationList,
			blockHash,
			blockNumber,
			blockOverrides,
			blockTag,
			functionName: "aggregate3",
			requireCanonical,
			stateOverride
		});
	}));
	const results = [];
	for (let i = 0; i < aggregate3Results.length; i++) {
		const result = aggregate3Results[i];
		if (result.status === "rejected") {
			if (!allowFailure) throw result.reason;
			for (let j = 0; j < batches[i].length; j++) results.push({
				status: "failure",
				error: result.reason,
				result: void 0
			});
			continue;
		}
		const aggregate3Result = result.value;
		for (let j = 0; j < aggregate3Result.length; j++) {
			const { returnData, success } = aggregate3Result[j];
			const { callData } = batches[i][j];
			const { abi, address, functionName, args } = contracts[results.length];
			try {
				if (callData === "0x") throw new AbiDecodingZeroDataError();
				if (!success) throw new RawContractError({ data: returnData });
				const result = decodeFunctionResult({
					abi,
					args,
					data: returnData,
					functionName
				});
				results.push(allowFailure ? {
					result,
					status: "success"
				} : result);
			} catch (err) {
				const error = getContractError(err, {
					abi,
					address,
					args,
					docsPath: "/docs/contract/multicall",
					functionName
				});
				if (!allowFailure) throw error;
				results.push({
					error,
					result: void 0,
					status: "failure"
				});
			}
		}
	}
	if (results.length !== contracts.length) throw new BaseError$2("multicall results mismatch");
	return results;
}
async function scheduleMulticall(client, parameters) {
	const { batchSize, call, multicallAddress, ...rest } = parameters;
	const { wait = 0 } = typeof client.batch?.multicall === "object" ? client.batch.multicall : {};
	const { schedule } = createBatchScheduler({
		id: stringify$1([
			"multicall",
			client.uid,
			batchSize,
			multicallAddress,
			rest
		]),
		wait,
		shouldSplitBatch(calls) {
			if (batchSize === 0) return false;
			return calls.reduce((size, { callData }) => size + (callData.length - 2) / 2, 0) > batchSize;
		},
		fn: (calls) => getAction(client, readContract, "readContract")({
			...multicallAddress === null ? { code: multicall3Bytecode } : { address: multicallAddress },
			...rest,
			abi: multicall3Abi,
			args: [calls],
			functionName: "aggregate3"
		})
	});
	const [result] = await schedule(call);
	return result;
}
// ../../node_modules/viem/_esm/actions/public/simulateBlocks.js
/**
* Simulates a set of calls on block(s) with optional block and state overrides.
*
* @example
* ```ts
* import { createClient, http, parseEther } from 'viem'
* import { simulate } from 'viem/actions'
* import { mainnet } from 'viem/chains'
*
* const client = createClient({
*   chain: mainnet,
*   transport: http(),
* })
*
* const result = await simulate(client, {
*   blocks: [{
*     blockOverrides: {
*       number: 69420n,
*     },
*     calls: [{
*       {
*         account: '0x5a0b54d5dc17e482fe8b0bdca5320161b95fb929',
*         data: '0xdeadbeef',
*         to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
*       },
*       {
*         account: '0x5a0b54d5dc17e482fe8b0bdca5320161b95fb929',
*         to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
*         value: parseEther('1'),
*       },
*     }],
*     stateOverrides: [{
*       address: '0x5a0b54d5dc17e482fe8b0bdca5320161b95fb929',
*       balance: parseEther('10'),
*     }],
*   }]
* })
* ```
*
* @param client - Client to use.
* @param parameters - {@link SimulateBlocksParameters}
* @returns Simulated blocks. {@link SimulateBlocksReturnType}
*/
async function simulateBlocks(client, parameters) {
	const { blockNumber, blockTag = client.experimental_blockTag ?? "latest", blocks, returnFullTransactions, traceTransfers, validation } = parameters;
	try {
		const blockStateCalls = [];
		for (const block of blocks) {
			const blockOverrides = block.blockOverrides ? toRpc(block.blockOverrides) : void 0;
			const calls = block.calls.map((call_) => {
				const call = call_;
				const account = call.account ? parseAccount(call.account) : void 0;
				const data = call.abi ? encodeFunctionData(call) : call.data;
				const request = {
					...call,
					account,
					data: call.dataSuffix ? concat$1([data || "0x", call.dataSuffix]) : data,
					from: call.from ?? account?.address
				};
				assertRequest(request);
				return formatTransactionRequest(request);
			});
			const stateOverrides = block.stateOverrides ? serializeStateOverride(block.stateOverrides) : void 0;
			blockStateCalls.push({
				blockOverrides,
				calls,
				stateOverrides
			});
		}
		const block = (typeof blockNumber === "bigint" ? numberToHex(blockNumber) : void 0) || blockTag;
		return (await client.request({
			method: "eth_simulateV1",
			params: [{
				blockStateCalls,
				returnFullTransactions,
				traceTransfers,
				validation
			}, block]
		})).map((block, i) => ({
			...formatBlock(block),
			calls: block.calls.map((call, j) => {
				const { abi, args, functionName, to } = blocks[i].calls[j];
				const data = call.error?.data ?? call.returnData;
				const gasUsed = BigInt(call.gasUsed);
				const maxUsedGas = call.maxUsedGas === void 0 ? void 0 : BigInt(call.maxUsedGas);
				const logs = call.logs?.map((log) => formatLog(log));
				const status = call.status === "0x1" ? "success" : "failure";
				const result = abi && status === "success" && data !== "0x" ? decodeFunctionResult({
					abi,
					data,
					functionName
				}) : null;
				const error = (() => {
					if (status === "success") return void 0;
					let error;
					if (data === "0x") error = new AbiDecodingZeroDataError();
					else if (data) error = new RawContractError({ data });
					if (!error) return void 0;
					return getContractError(error, {
						abi: abi ?? [],
						address: to ?? "0x",
						args,
						functionName: functionName ?? "<unknown>"
					});
				})();
				return {
					data,
					gasUsed,
					logs,
					...maxUsedGas === void 0 ? {} : { maxUsedGas },
					status,
					...status === "success" ? { result } : { error }
				};
			})
		}));
	} catch (e) {
		const cause = e;
		const error = getNodeError(cause, {});
		if (error instanceof UnknownNodeError) throw cause;
		throw error;
	}
}
// ../../node_modules/viem/node_modules/ox/_esm/core/internal/abiItem.js
/** @internal */
function normalizeSignature(signature) {
	let active = true;
	let current = "";
	let level = 0;
	let result = "";
	let valid = false;
	for (let i = 0; i < signature.length; i++) {
		const char = signature[i];
		if ([
			"(",
			")",
			","
		].includes(char)) active = true;
		if (char === "(") level++;
		if (char === ")") level--;
		if (!active) continue;
		if (level === 0) {
			if (char === " " && [
				"event",
				"function",
				"error",
				""
			].includes(result)) result = "";
			else {
				result += char;
				if (char === ")") {
					valid = true;
					break;
				}
			}
			continue;
		}
		if (char === " ") {
			if (!current.endsWith(",") && !current.endsWith("(")) {
				current = "";
				active = false;
			}
			continue;
		}
		result += char;
		current += char;
	}
	if (!valid) throw new BaseError("Unable to normalize signature.");
	return result;
}
/** @internal */
function isArgOfType(arg, abiParameter) {
	const argType = typeof arg;
	const abiParameterType = abiParameter.type;
	switch (abiParameterType) {
		case "address": return validate$2(arg, { strict: false });
		case "bool": return argType === "boolean";
		case "function": return argType === "string";
		case "string": return argType === "string";
		default: {
			if (abiParameterType === "tuple" && "components" in abiParameter) return Object.values(abiParameter.components).every((component, index) => {
				return argType === "object" && isArgOfType(getComponentValue(arg, component, index), component);
			});
			if (/^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/.test(abiParameterType)) return argType === "number" || argType === "bigint";
			if (/^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/.test(abiParameterType)) return argType === "string" || arg instanceof Uint8Array;
			const arrayComponents = getArrayComponents(abiParameterType);
			if (arrayComponents) {
				const [length, type] = arrayComponents;
				return Array.isArray(arg) && (length === null || arg.length === length) && arg.every((x) => isArgOfType(x, {
					...abiParameter,
					type
				}));
			}
			return false;
		}
	}
}
/** @internal */
function getAmbiguousTypes(sourceParameters, targetParameters, args) {
	for (const parameterIndex in sourceParameters) {
		const sourceParameter = sourceParameters[parameterIndex];
		const targetParameter = targetParameters[parameterIndex];
		if (!targetParameter) continue;
		if (sourceParameter.type === "tuple" && targetParameter.type === "tuple" && "components" in sourceParameter && "components" in targetParameter) {
			const value = args[parameterIndex];
			const types = getAmbiguousTypes(sourceParameter.components, targetParameter.components, sourceParameter.components.map((component, index) => getComponentValue(value, component, index)));
			if (types) return types;
			continue;
		}
		const sourceArray = getArrayComponents(sourceParameter.type);
		const targetArray = getArrayComponents(targetParameter.type);
		if (sourceArray && targetArray) {
			const types = getAmbiguousTypes([{
				...sourceParameter,
				type: sourceArray[1]
			}], [{
				...targetParameter,
				type: targetArray[1]
			}], [args[parameterIndex]?.[0]]);
			if (types) return types;
			continue;
		}
		const types = [sourceParameter.type, targetParameter.type];
		const value = args[parameterIndex];
		if ((() => {
			if (types.includes("address") && types.includes("bytes20")) return true;
			if (types.includes("address") && (types.includes("string") || types.includes("bytes"))) return value === void 0 || validate$2(value, { strict: false });
			return false;
		})()) return types;
	}
}
function getComponentValue(arg, component, index) {
	if (Array.isArray(arg)) return arg[index];
	return arg?.[component.name];
}
// ../../node_modules/viem/node_modules/ox/_esm/core/AbiItem.js
/**
* Parses an arbitrary **JSON ABI Item** or **Human Readable ABI Item** into a typed {@link ox#AbiItem.AbiItem}.
*
* @example
* ### JSON ABIs
*
* ```ts twoslash
* import { AbiItem } from 'ox'
*
* const abiItem = AbiItem.from({
*   type: 'function',
*   name: 'approve',
*   stateMutability: 'nonpayable',
*   inputs: [
*     {
*       name: 'spender',
*       type: 'address',
*     },
*     {
*       name: 'amount',
*       type: 'uint256',
*     },
*   ],
*   outputs: [{ type: 'bool' }],
* })
*
* abiItem
* //^?
*
*
*
*
*
*
*
*
*
*
*
*
* ```
*
* @example
* ### Human Readable ABIs
*
* A Human Readable ABI can be parsed into a typed ABI object:
*
* ```ts twoslash
* import { AbiItem } from 'ox'
*
* const abiItem = AbiItem.from(
*   'function approve(address spender, uint256 amount) returns (bool)' // [!code hl]
* )
*
* abiItem
* //^?
*
*
*
*
*
*
*
*
*
*
*
*
*
* ```
*
* @example
* It is possible to specify `struct`s along with your definitions:
*
* ```ts twoslash
* import { AbiItem } from 'ox'
*
* const abiItem = AbiItem.from([
*   'struct Foo { address spender; uint256 amount; }', // [!code hl]
*   'function approve(Foo foo) returns (bool)',
* ])
*
* abiItem
* //^?
*
*
*
*
*
*
*
*
*
*
*
*
* ```
*
*
*
* @param abiItem - The ABI Item to parse.
* @returns The typed ABI Item.
*/
function from$3(abiItem, options = {}) {
	const { prepare = true } = options;
	const item = (() => {
		if (Array.isArray(abiItem)) return parseAbiItem(abiItem);
		if (typeof abiItem === "string") return parseAbiItem(abiItem);
		return abiItem;
	})();
	return {
		...item,
		...prepare ? { hash: getSignatureHash(item) } : {}
	};
}
/**
* Extracts an {@link ox#AbiItem.AbiItem} from an {@link ox#Abi.Abi} given a name and optional arguments.
*
* @example
* ABI Items can be extracted by their name using the `name` option:
*
* ```ts twoslash
* import { Abi, AbiItem } from 'ox'
*
* const abi = Abi.from([
*   'function foo()',
*   'event Transfer(address owner, address to, uint256 tokenId)',
*   'function bar(string a) returns (uint256 x)',
* ])
*
* const item = AbiItem.fromAbi(abi, 'Transfer') // [!code focus]
* //    ^?
*
*
*
*
*
*
* ```
*
* @example
* ### Extracting by Selector
*
* ABI Items can be extract by their selector when {@link ox#Hex.Hex} is provided to `name`.
*
* ```ts twoslash
* import { Abi, AbiItem } from 'ox'
*
* const abi = Abi.from([
*   'function foo()',
*   'event Transfer(address owner, address to, uint256 tokenId)',
*   'function bar(string a) returns (uint256 x)',
* ])
* const item = AbiItem.fromAbi(abi, '0x095ea7b3') // [!code focus]
* //    ^?
*
*
*
*
*
*
*
*
*
*
*
*
*
* ```
*
* :::note
*
* Extracting via a hex selector is useful when extracting an ABI Item from an `eth_call` RPC response,
* a Transaction `input`, or from Event Log `topics`.
*
* :::
*
* @param abi - The ABI to extract from.
* @param name - The name (or selector) of the ABI item to extract.
* @param options - Extraction options.
* @returns The ABI item.
*/
function fromAbi$2(abi, name, options) {
	const { args = [], prepare = true } = options ?? {};
	const isSelector = validate$3(name, { strict: false });
	const abiItems = abi.filter((abiItem) => {
		if (isSelector) {
			if (abiItem.type === "function" || abiItem.type === "error") return getSelector$2(abiItem) === slice(name, 0, 4);
			if (abiItem.type === "event") return getSignatureHash(abiItem) === name;
			return false;
		}
		return "name" in abiItem && abiItem.name === name;
	});
	if (abiItems.length === 0) throw new NotFoundError({ name });
	if (abiItems.length === 1) return {
		...abiItems[0],
		...prepare ? { hash: getSignatureHash(abiItems[0]) } : {}
	};
	let matchedAbiItem;
	for (const abiItem of abiItems) {
		if (!("inputs" in abiItem)) continue;
		if (!args || args.length === 0) {
			if (!abiItem.inputs || abiItem.inputs.length === 0) return {
				...abiItem,
				...prepare ? { hash: getSignatureHash(abiItem) } : {}
			};
			continue;
		}
		if (!abiItem.inputs) continue;
		if (abiItem.inputs.length === 0) continue;
		if (abiItem.inputs.length !== args.length) continue;
		if (args.every((arg, index) => {
			const abiParameter = "inputs" in abiItem && abiItem.inputs[index];
			if (!abiParameter) return false;
			return isArgOfType(arg, abiParameter);
		})) {
			if (matchedAbiItem && "inputs" in matchedAbiItem && matchedAbiItem.inputs) {
				const ambiguousTypes = getAmbiguousTypes(abiItem.inputs, matchedAbiItem.inputs, args);
				if (ambiguousTypes) throw new AmbiguityError({
					abiItem,
					type: ambiguousTypes[0]
				}, {
					abiItem: matchedAbiItem,
					type: ambiguousTypes[1]
				});
			}
			matchedAbiItem = abiItem;
		}
	}
	const abiItem = (() => {
		if (matchedAbiItem) return matchedAbiItem;
		const [abiItem, ...overloads] = abiItems;
		return {
			...abiItem,
			overloads
		};
	})();
	if (!abiItem) throw new NotFoundError({ name });
	return {
		...abiItem,
		...prepare ? { hash: getSignatureHash(abiItem) } : {}
	};
}
function getSelector$2(...parameters) {
	return slice(getSignatureHash((() => {
		if (Array.isArray(parameters[0])) {
			const [abi, name] = parameters;
			return fromAbi$2(abi, name);
		}
		return parameters[0];
	})()), 0, 4);
}
function getSignature(...parameters) {
	const abiItem = (() => {
		if (Array.isArray(parameters[0])) {
			const [abi, name] = parameters;
			return fromAbi$2(abi, name);
		}
		return parameters[0];
	})();
	return normalizeSignature((() => {
		if (typeof abiItem === "string") return abiItem;
		return formatAbiItem$1(abiItem);
	})());
}
function getSignatureHash(...parameters) {
	const abiItem = (() => {
		if (Array.isArray(parameters[0])) {
			const [abi, name] = parameters;
			return fromAbi$2(abi, name);
		}
		return parameters[0];
	})();
	if (typeof abiItem !== "string" && "hash" in abiItem && abiItem.hash) return abiItem.hash;
	return keccak256(fromString$1(getSignature(abiItem)));
}
/**
* Throws when ambiguous types are found on overloaded ABI items.
*
* @example
* ```ts twoslash
* import { Abi, AbiFunction } from 'ox'
*
* const foo = Abi.from(['function foo(address)', 'function foo(bytes20)'])
* AbiFunction.fromAbi(foo, 'foo', {
*   args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
* })
* // @error: AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.
* // @error: `bytes20` in `foo(bytes20)`, and
* // @error: `address` in `foo(address)`
* // @error: These types encode differently and cannot be distinguished at runtime.
* // @error: Remove one of the ambiguous items in the ABI.
* ```
*
* ### Solution
*
* Remove one of the ambiguous types from the ABI.
*
* ```ts twoslash
* import { Abi, AbiFunction } from 'ox'
*
* const foo = Abi.from([
*   'function foo(address)',
*   'function foo(bytes20)' // [!code --]
* ])
* AbiFunction.fromAbi(foo, 'foo', {
*   args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
* })
* // @error: AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.
* // @error: `bytes20` in `foo(bytes20)`, and
* // @error: `address` in `foo(address)`
* // @error: These types encode differently and cannot be distinguished at runtime.
* // @error: Remove one of the ambiguous items in the ABI.
* ```
*/
var AmbiguityError = class extends BaseError {
	constructor(x, y) {
		super("Found ambiguous types in overloaded ABI Items.", { metaMessages: [
			`\`${x.type}\` in \`${normalizeSignature(formatAbiItem$1(x.abiItem))}\`, and`,
			`\`${y.type}\` in \`${normalizeSignature(formatAbiItem$1(y.abiItem))}\``,
			"",
			"These types encode differently and cannot be distinguished at runtime.",
			"Remove one of the ambiguous items in the ABI."
		] });
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "AbiItem.AmbiguityError"
		});
	}
};
/**
* Throws when an ABI item is not found in the ABI.
*
* @example
* ```ts twoslash
* // @noErrors
* import { Abi, AbiFunction } from 'ox'
*
* const foo = Abi.from([
*   'function foo(address)',
*   'function bar(uint)'
* ])
* AbiFunction.fromAbi(foo, 'baz')
* // @error: AbiItem.NotFoundError: ABI function with name "baz" not found.
* ```
*
* ### Solution
*
* Ensure the ABI item exists on the ABI.
*
* ```ts twoslash
* // @noErrors
* import { Abi, AbiFunction } from 'ox'
*
* const foo = Abi.from([
*   'function foo(address)',
*   'function bar(uint)',
*   'function baz(bool)' // [!code ++]
* ])
* AbiFunction.fromAbi(foo, 'baz')
* ```
*/
var NotFoundError = class extends BaseError {
	constructor({ name, data, type = "item" }) {
		const selector = (() => {
			if (name) return ` with name "${name}"`;
			if (data) return ` with data "${data}"`;
			return "";
		})();
		super(`ABI ${type}${selector} not found.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "AbiItem.NotFoundError"
		});
	}
};
// ../../node_modules/viem/node_modules/ox/_esm/core/AbiConstructor.js
function encode(...parameters) {
	const [abiConstructor, options] = (() => {
		if (Array.isArray(parameters[0])) {
			const [abi, options] = parameters;
			return [fromAbi$1(abi), options];
		}
		return parameters;
	})();
	const { bytecode, args } = options;
	return concat(bytecode, abiConstructor.inputs?.length && args?.length ? encode$1(abiConstructor.inputs, args) : "0x");
}
/** @internal */
function from$2(abiConstructor) {
	return from$3(abiConstructor);
}
/** @internal */
function fromAbi$1(abi) {
	const item = abi.find((item) => item.type === "constructor");
	if (!item) throw new NotFoundError({ name: "constructor" });
	return item;
}
/**
* Parses an arbitrary **JSON ABI Event** or **Human Readable ABI Event** into a typed {@link ox#AbiEvent.AbiEvent}.
*
* @example
* ### JSON ABIs
*
* ```ts twoslash
* import { AbiEvent } from 'ox'
*
* const transfer = AbiEvent.from({
*   name: 'Transfer',
*   type: 'event',
*   inputs: [
*     { name: 'from', type: 'address', indexed: true },
*     { name: 'to', type: 'address', indexed: true },
*     { name: 'value', type: 'uint256' },
*   ],
* })
*
* transfer
* //^?
*
*
*
*
*
*
*
*
*
*
*
*
* ```
*
* @example
* ### Human Readable ABIs
*
* A Human Readable ABI can be parsed into a typed ABI object:
*
* ```ts twoslash
* import { AbiEvent } from 'ox'
*
* const transfer = AbiEvent.from(
*   'event Transfer(address indexed from, address indexed to, uint256 value)' // [!code hl]
* )
*
* transfer
* //^?
*
*
*
*
*
*
*
*
*
*
*
*
*
* ```
*
* @param abiEvent - The ABI Event to parse.
* @returns Typed ABI Event.
*/
function from$1(abiEvent, options = {}) {
	return from$3(abiEvent, options);
}
/**
* Computes the event selector (hash of event signature) for an {@link ox#AbiEvent.AbiEvent}.
*
* @example
* ```ts twoslash
* import { AbiEvent } from 'ox'
*
* const selector = AbiEvent.getSelector('event Transfer(address indexed from, address indexed to, uint256 value)')
* // @log: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f556a2'
* ```
*
* @example
* ```ts twoslash
* import { AbiEvent } from 'ox'
*
* const selector = AbiEvent.getSelector({
*   name: 'Transfer',
*   type: 'event',
*   inputs: [
*     { name: 'from', type: 'address', indexed: true },
*     { name: 'to', type: 'address', indexed: true },
*     { name: 'value', type: 'uint256' }
*   ]
* })
* // @log: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f556a2'
* ```
*
* @param abiItem - The ABI event to compute the selector for.
* @returns The {@link ox#Hash.(keccak256:function)} hash of the event signature.
*/
function getSelector$1(abiItem) {
	return getSignatureHash(abiItem);
}
// ../../node_modules/viem/node_modules/ox/_esm/core/AbiFunction.js
function decodeResult(...parameters) {
	const [abiFunction, data, options = {}] = (() => {
		if (Array.isArray(parameters[0])) {
			const [abi, name, data, options] = parameters;
			return [
				fromAbi(abi, name),
				data,
				options
			];
		}
		return parameters;
	})();
	const values = decode(abiFunction.outputs, data, options);
	if (values && Object.keys(values).length === 0) return void 0;
	if (values && Object.keys(values).length === 1) {
		if (Array.isArray(values)) return values[0];
		return Object.values(values)[0];
	}
	return values;
}
function encodeData(...parameters) {
	const [abiFunction, args = []] = (() => {
		if (Array.isArray(parameters[0])) {
			const [abi, name, args] = parameters;
			return [fromAbi(abi, name, { args }), args];
		}
		const [abiFunction, args] = parameters;
		return [abiFunction, args];
	})();
	const { overloads } = abiFunction;
	const item = overloads ? fromAbi([abiFunction, ...overloads], abiFunction.name, { args }) : abiFunction;
	const selector = getSelector(item);
	const data = args.length > 0 ? encode$1(item.inputs, args) : void 0;
	return data ? concat(selector, data) : selector;
}
/**
* Parses an arbitrary **JSON ABI Function** or **Human Readable ABI Function** into a typed {@link ox#AbiFunction.AbiFunction}.
*
* @example
* ### JSON ABIs
*
* ```ts twoslash
* import { AbiFunction } from 'ox'
*
* const approve = AbiFunction.from({
*   type: 'function',
*   name: 'approve',
*   stateMutability: 'nonpayable',
*   inputs: [
*     {
*       name: 'spender',
*       type: 'address',
*     },
*     {
*       name: 'amount',
*       type: 'uint256',
*     },
*   ],
*   outputs: [{ type: 'bool' }],
* })
*
* approve
* //^?
*
*
*
*
*
*
*
*
*
*
*
*
* ```
*
* @example
* ### Human Readable ABIs
*
* A Human Readable ABI can be parsed into a typed ABI object:
*
* ```ts twoslash
* import { AbiFunction } from 'ox'
*
* const approve = AbiFunction.from(
*   'function approve(address spender, uint256 amount) returns (bool)' // [!code hl]
* )
*
* approve
* //^?
*
*
*
*
*
*
*
*
*
*
*
*
*
* ```
*
* @example
* It is possible to specify `struct`s along with your definitions:
*
* ```ts twoslash
* import { AbiFunction } from 'ox'
*
* const approve = AbiFunction.from([
*   'struct Foo { address spender; uint256 amount; }', // [!code hl]
*   'function approve(Foo foo) returns (bool)',
* ])
*
* approve
* //^?
*
*
*
*
*
*
*
*
*
*
*
*
* ```
*
*
*
* @param abiFunction - The ABI Function to parse.
* @returns Typed ABI Function.
*/
function from(abiFunction, options = {}) {
	return from$3(abiFunction, options);
}
/**
* Extracts an {@link ox#AbiFunction.AbiFunction} from an {@link ox#Abi.Abi} given a name and optional arguments.
*
* @example
* ### Extracting by Name
*
* ABI Functions can be extracted by their name using the `name` option:
*
* ```ts twoslash
* import { Abi, AbiFunction } from 'ox'
*
* const abi = Abi.from([
*   'function foo()',
*   'event Transfer(address owner, address to, uint256 tokenId)',
*   'function bar(string a) returns (uint256 x)',
* ])
*
* const item = AbiFunction.fromAbi(abi, 'foo') // [!code focus]
* //    ^?
*
*
*
*
*
*
* ```
*
* @example
* ### Extracting by Selector
*
* ABI Functions can be extract by their selector when {@link ox#Hex.Hex} is provided to `name`.
*
* ```ts twoslash
* import { Abi, AbiFunction } from 'ox'
*
* const abi = Abi.from([
*   'function foo()',
*   'event Transfer(address owner, address to, uint256 tokenId)',
*   'function bar(string a) returns (uint256 x)',
* ])
* const item = AbiFunction.fromAbi(abi, '0x095ea7b3') // [!code focus]
* //    ^?
*
*
*
*
*
*
*
*
*
* ```
*
* :::note
*
* Extracting via a hex selector is useful when extracting an ABI Function from an `eth_call` RPC response or
* from a Transaction `input`.
*
* :::
*
* @param abi - The ABI to extract from.
* @param name - The name (or selector) of the ABI item to extract.
* @param options - Extraction options.
* @returns The ABI item.
*/
function fromAbi(abi, name, options) {
	const item = fromAbi$2(abi, name, options);
	if (item.type !== "function") throw new NotFoundError({
		name,
		type: "function"
	});
	return item;
}
/**
* Computes the [4-byte selector](https://solidity-by-example.org/function-selector/) for an {@link ox#AbiFunction.AbiFunction}.
*
* Useful for computing function selectors for calldata.
*
* @example
* ```ts twoslash
* import { AbiFunction } from 'ox'
*
* const selector = AbiFunction.getSelector('function ownerOf(uint256 tokenId)')
* // @log: '0x6352211e'
* ```
*
* @example
* ```ts twoslash
* import { AbiFunction } from 'ox'
*
* const selector = AbiFunction.getSelector({
*   inputs: [{ type: 'uint256' }],
*   name: 'ownerOf',
*   outputs: [],
*   stateMutability: 'view',
*   type: 'function'
* })
* // @log: '0x6352211e'
* ```
*
* @param abiItem - The ABI item to compute the selector for.
* @returns The first 4 bytes of the {@link ox#Hash.(keccak256:function)} hash of the function signature.
*/
function getSelector(abiItem) {
	return getSelector$2(abiItem);
}
// ../../node_modules/viem/_esm/constants/address.js
var ethAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
var zeroAddress = "0x0000000000000000000000000000000000000000";
// ../../node_modules/viem/_esm/actions/public/simulateCalls.js
var getBalanceCode = "0x6080604052348015600e575f80fd5b5061016d8061001c5f395ff3fe608060405234801561000f575f80fd5b5060043610610029575f3560e01c8063f8b2cb4f1461002d575b5f80fd5b610047600480360381019061004291906100db565b61005d565b604051610054919061011e565b60405180910390f35b5f8173ffffffffffffffffffffffffffffffffffffffff16319050919050565b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6100aa82610081565b9050919050565b6100ba816100a0565b81146100c4575f80fd5b50565b5f813590506100d5816100b1565b92915050565b5f602082840312156100f0576100ef61007d565b5b5f6100fd848285016100c7565b91505092915050565b5f819050919050565b61011881610106565b82525050565b5f6020820190506101315f83018461010f565b9291505056fea26469706673582212203b9fe929fe995c7cf9887f0bdba8a36dd78e8b73f149b17d2d9ad7cd09d2dc6264736f6c634300081a0033";
var staticCallCode = "0x608060405234801561000f575f5ffd5b5060043610610029575f3560e01c8063fd00430c1461002d575b5f5ffd5b6100476004803603810190610042919061012b565b610049565b005b80825f375f5f825f865afa610060573d5f5f3e3d5ffd5b3d5f5f3e3d5ff35b5f5ffd5b5f5ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61009982610070565b9050919050565b6100a98161008f565b81146100b3575f5ffd5b50565b5f813590506100c4816100a0565b92915050565b5f5ffd5b5f5ffd5b5f5ffd5b5f5f83601f8401126100eb576100ea6100ca565b5b8235905067ffffffffffffffff811115610108576101076100ce565b5b602083019150836001820283011115610124576101236100d2565b5b9250929050565b5f5f5f6040848603121561014257610141610068565b5b5f61014f868287016100b6565b935050602084013567ffffffffffffffff8111156101705761016f61006c565b5b61017c868287016100d6565b9250925050925092509256fea2646970667358221220635ed99185cacf3f2acba6921f23687c969cec2bbaf5f9ad599f507e6e105e6964736f6c63430008230033";
var assetProbeGas = 1000000n;
var staticCallAddressBase = 3735928559n;
var transferEventSelector = getSelector$1(from$1("event Transfer(address indexed from, address indexed to, uint256 value)"));
var balanceOfFunction = from("function balanceOf(address) returns (uint256)");
var decimalsFunction = from("function decimals() returns (uint256)");
var tokenUriFunction = from("function tokenURI(uint256) returns (string)");
var symbolFunction = from("function symbol() returns (string)");
var staticCallFunction = from("function query(address target, bytes data)");
/**
* Simulates execution of a batch of calls.
*
* @param client - Client to use
* @param parameters - {@link SimulateCallsParameters}
* @returns Results. {@link SimulateCallsReturnType}
*
* @example
* ```ts
* import { createPublicClient, http, parseEther } from 'viem'
* import { mainnet } from 'viem/chains'
* import { simulateCalls } from 'viem/actions'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
*
* const result = await simulateCalls(client, {
*   account: '0x5a0b54d5dc17e482fe8b0bdca5320161b95fb929',
*   calls: [{
*     {
*       data: '0xdeadbeef',
*       to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
*     },
*     {
*       to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
*       value: parseEther('1'),
*     },
*   ]
* })
* ```
*/
async function simulateCalls(client, parameters) {
	const { blockNumber, blockTag, calls, stateOverrides, traceAssetChanges, traceTransfers, validation } = parameters;
	const account = parameters.account ? parseAccount(parameters.account) : void 0;
	if (traceAssetChanges && !account) throw new BaseError$2("`account` is required when `traceAssetChanges` is true");
	const getBalanceData = account ? encode(from$2("constructor(bytes, bytes)"), {
		bytecode: deploylessCallViaBytecodeBytecode,
		args: [getBalanceCode, encodeData(from("function getBalance(address)"), [account.address])]
	}) : void 0;
	const blockTag_ = blockTag ?? client.experimental_blockTag ?? "latest";
	let baseBlockNumber = blockNumber;
	if (traceAssetChanges && typeof baseBlockNumber !== "bigint" && blockTag_ !== "earliest" && blockTag_ !== "pending") {
		if (blockTag_ === "latest") baseBlockNumber = await getBlockNumber(client, { cacheTime: 0 });
		else {
			const block = await getBlock(client, { blockTag: blockTag_ });
			if (typeof block.number !== "bigint") throw new BaseError$2(`Block tag \`${blockTag_}\` did not resolve to a number.`);
			baseBlockNumber = block.number;
		}
	}
	const block_ = typeof baseBlockNumber === "bigint" ? { blockNumber: baseBlockNumber } : { blockTag: blockTag_ };
	const discovery = traceAssetChanges ? await simulateBlocks(client, {
		...block_,
		blocks: [{
			calls: calls.map((call) => ({
				...call,
				from: account.address
			})),
			stateOverrides
		}],
		traceTransfers,
		validation
	}) : void 0;
	const assetAddresses = discovery ? [.../* @__PURE__ */ new Set([...tokensFromLogs(discovery[0].calls.flatMap((call) => call.logs ?? []), account.address), ...parameters.calls.map((call) => call.to?.toLowerCase())])].filter((address) => Boolean(address) && address !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" && address !== "0x0000000000000000000000000000000000000000") : [];
	const staticCallAddress = getStaticCallAddress([
		...account ? [account.address] : [],
		...assetAddresses,
		...stateOverrides?.map(({ address }) => address) ?? []
	]);
	const staticCallStateOverrides = [{
		address: staticCallAddress,
		code: staticCallCode
	}];
	const [balanceCallsPre, blocks] = await Promise.all([traceAssetChanges ? Promise.all([readBalance(client, {
		account: account.address,
		...block_,
		data: getBalanceData,
		stateOverride: stateOverrides
	}), ...assetAddresses.map((address) => readBalance(client, {
		account: account.address,
		address,
		...block_,
		data: encodeData(balanceOfFunction, [account.address]),
		staticCallAddress,
		stateOverride: stateOverrides
	}))]) : [], simulateBlocks(client, {
		...block_,
		blocks: [{
			calls: [...calls, { to: zeroAddress }].map((call) => ({
				...call,
				from: account?.address
			})),
			stateOverrides
		}, ...traceAssetChanges ? [
			{ calls: [{ data: getBalanceData }] },
			{
				calls: assetAddresses.map((address) => ({
					to: staticCallAddress,
					gas: assetProbeGas,
					data: encodeStaticCall(address, encodeData(balanceOfFunction, [account.address]))
				})),
				stateOverrides: staticCallStateOverrides
			},
			{
				calls: assetAddresses.map((address) => ({
					to: staticCallAddress,
					gas: assetProbeGas,
					data: encodeStaticCall(address, encodeData(decimalsFunction))
				})),
				stateOverrides: staticCallStateOverrides
			},
			{
				calls: assetAddresses.map((address) => ({
					to: staticCallAddress,
					gas: assetProbeGas,
					data: encodeStaticCall(address, encodeData(tokenUriFunction, [0n]))
				})),
				stateOverrides: staticCallStateOverrides
			},
			{
				calls: assetAddresses.map((address) => ({
					to: staticCallAddress,
					gas: assetProbeGas,
					data: encodeStaticCall(address, encodeData(symbolFunction))
				})),
				stateOverrides: staticCallStateOverrides
			}
		] : []],
		traceTransfers,
		validation
	})]);
	const block_results = blocks[0];
	const [block_ethPost, block_assetsPost, block_decimals, block_tokenURI, block_symbols] = traceAssetChanges ? blocks.slice(1) : [];
	const { calls: block_calls, ...block } = block_results;
	const results = block_calls.slice(0, -1);
	const balancesPre = balanceCallsPre.map((call) => isBalance(call) ? hexToBigInt(call.data) : null);
	const ethPost = block_ethPost?.calls ?? [];
	const assetsPost = block_assetsPost?.calls ?? [];
	const balancesPost = [...ethPost, ...assetsPost].map((call) => isBalance(call) ? hexToBigInt(call.data) : null);
	const decimals = (block_decimals?.calls ?? []).map((call) => decodeAssetResult(call, decimalsFunction));
	const symbols = (block_symbols?.calls ?? []).map((call) => decodeAssetResult(call, symbolFunction));
	const tokenURI = (block_tokenURI?.calls ?? []).map((call) => decodeAssetResult(call, tokenUriFunction));
	const changes = [];
	for (const [i, balancePost] of balancesPost.entries()) {
		const balancePre_ = balancesPre[i];
		const preCall = balanceCallsPre[i];
		const balancePre = typeof balancePre_ === "bigint" ? balancePre_ : i > 0 && preCall?.status === "success" && preCall.data === "0x" ? 0n : null;
		if (typeof balancePost !== "bigint") continue;
		if (typeof balancePre !== "bigint") continue;
		const decimals_ = decimals[i - 1];
		const symbol_ = symbols[i - 1];
		const tokenURI_ = tokenURI[i - 1];
		const token = (() => {
			if (i === 0) return {
				address: ethAddress,
				decimals: 18,
				symbol: "ETH"
			};
			return {
				address: assetAddresses[i - 1],
				decimals: tokenURI_ || decimals_ ? Number(decimals_ ?? 1) : void 0,
				symbol: symbol_ ?? void 0
			};
		})();
		changes.push({
			token,
			value: {
				pre: balancePre,
				post: balancePost,
				diff: balancePost - balancePre
			}
		});
	}
	return {
		assetChanges: changes,
		block,
		results
	};
}
function encodeStaticCall(address, data) {
	return encodeData(staticCallFunction, [address, data]);
}
function tokensFromLogs(logs, account) {
	const account_ = pad$2(account.toLowerCase(), { size: 32 });
	return logs.filter((log) => {
		if (log.topics[0]?.toLowerCase() !== transferEventSelector) return false;
		if (log.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") return false;
		return log.topics[1]?.toLowerCase() === account_ || log.topics[2]?.toLowerCase() === account_;
	}).map((log) => log.address.toLowerCase());
}
function isBalance(call) {
	return call.status === "success" && /^0x[\da-f]{64}$/i.test(call.data);
}
function decodeAssetResult(call, abiFunction) {
	if (call.status === "failure" || call.data === "0x") return null;
	try {
		return decodeResult(abiFunction, call.data);
	} catch {
		return null;
	}
}
async function readBalance(client, parameters) {
	const { account, address, blockNumber, blockTag, data, staticCallAddress, stateOverride } = parameters;
	try {
		return {
			data: (await call({
				...client,
				ccipRead: false
			}, {
				account: address ? "0x0000000000000000000000000000000000000000" : account,
				data: address ? encodeStaticCall(address, data) : data,
				stateOverride: address && staticCallAddress ? [...stateOverride ?? [], {
					address: staticCallAddress,
					code: staticCallCode
				}] : stateOverride,
				...address ? {
					gas: assetProbeGas,
					to: staticCallAddress
				} : {},
				...typeof blockNumber === "bigint" ? { blockNumber } : { blockTag }
			})).data ?? "0x",
			status: "success"
		};
	} catch (error) {
		if (!(error instanceof CallExecutionError) || !(error.cause instanceof ExecutionRevertedError)) throw error;
		return {
			data: "0x",
			status: "failure"
		};
	}
}
function getStaticCallAddress(addresses) {
	const occupied = new Set(addresses.map((address) => address.toLowerCase()));
	let value = staticCallAddressBase;
	while (occupied.has(`0x${value.toString(16).padStart(40, "0")}`)) value++;
	return `0x${value.toString(16).padStart(40, "0")}`;
}
// ../../node_modules/viem/node_modules/ox/_esm/erc6492/SignatureErc6492.js
/**
* Magic bytes used to identify ERC-6492 wrapped signatures.
*/
var magicBytes = "0x6492649264926492649264926492649264926492649264926492649264926492";
/**
* Asserts that the wrapped signature is valid.
*
* @example
* ```ts twoslash
* import { SignatureErc6492 } from 'ox/erc6492'
*
* SignatureErc6492.assert('0xdeadbeef')
* // @error: InvalidWrappedSignatureError: Value `0xdeadbeef` is an invalid ERC-6492 wrapped signature.
* ```
*
* @param wrapped - The wrapped signature to assert.
*/
function assert(wrapped) {
	if (slice(wrapped, -32) !== "0x6492649264926492649264926492649264926492649264926492649264926492") throw new InvalidWrappedSignatureError(wrapped);
}
/**
* Serializes an [ERC-6492 wrapped signature](https://eips.ethereum.org/EIPS/eip-6492#specification).
*
* @example
* ```ts twoslash
* import { Secp256k1, Signature } from 'ox'
* import { SignatureErc6492 } from 'ox/erc6492' // [!code focus]
*
* const signature = Secp256k1.sign({
*   payload: '0x...',
*   privateKey: '0x...',
* })
*
* const wrapped = SignatureErc6492.wrap({ // [!code focus]
*   data: '0xdeadbeef', // [!code focus]
*   signature: Signature.toHex(signature), // [!code focus]
*   to: '0x00000000219ab540356cBB839Cbe05303d7705Fa', // [!code focus]
* }) // [!code focus]
* ```
*
* @param value - Wrapped signature to serialize.
* @returns Serialized wrapped signature.
*/
function wrap(value) {
	const { data, signature, to } = value;
	return concat(encode$1(from$5("address, bytes, bytes"), [
		to,
		data,
		signature
	]), magicBytes);
}
/**
* Validates a wrapped signature. Returns `true` if the wrapped signature is valid, `false` otherwise.
*
* @example
* ```ts twoslash
* import { SignatureErc6492 } from 'ox/erc6492'
*
* const valid = SignatureErc6492.validate('0xdeadbeef')
* // @log: false
* ```
*
* @param wrapped - The wrapped signature to validate.
* @returns `true` if the wrapped signature is valid, `false` otherwise.
*/
function validate(wrapped) {
	try {
		assert(wrapped);
		return true;
	} catch {
		return false;
	}
}
/** Thrown when the ERC-6492 wrapped signature is invalid. */
var InvalidWrappedSignatureError = class extends BaseError {
	constructor(wrapped) {
		super(`Value \`${wrapped}\` is an invalid ERC-6492 wrapped signature.`);
		Object.defineProperty(this, "name", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "SignatureErc6492.InvalidWrappedSignatureError"
		});
	}
};
// ../../node_modules/viem/_esm/utils/signature/serializeSignature.js
/**
* @description Converts a signature into hex format.
*
* @param signature The signature to convert.
* @returns The signature in hex format.
*
* @example
* serializeSignature({
*   r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
*   s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
*   yParity: 1
* })
* // "0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c"
*/
function serializeSignature({ r, s, to = "hex", v, yParity }) {
	const yParity_ = (() => {
		if (yParity === 0 || yParity === 1) return yParity;
		if (v && (v === 27n || v === 28n || v >= 35n)) return v % 2n === 0n ? 1 : 0;
		throw new Error("Invalid `v` or `yParity` value");
	})();
	const signature = `0x${new secp256k1.Signature(hexToBigInt(r), hexToBigInt(s)).toCompactHex()}${yParity_ === 0 ? "1b" : "1c"}`;
	if (to === "hex") return signature;
	return hexToBytes$1(signature);
}
// ../../node_modules/viem/_esm/actions/public/verifyHash.js
/**
* Verifies a message hash onchain using ERC-6492.
*
* @param client - Client to use.
* @param parameters - {@link VerifyHashParameters}
* @returns Whether or not the signature is valid. {@link VerifyHashReturnType}
*/
async function verifyHash(client, parameters) {
	const { address, chain = client.chain, hash, erc6492VerifierAddress: verifierAddress = parameters.universalSignatureVerifierAddress ?? chain?.contracts?.erc6492Verifier?.address, multicallAddress = parameters.multicallAddress ?? chain?.contracts?.multicall3?.address, mode = "auto" } = parameters;
	if (chain?.verifyHash) return await chain.verifyHash(client, parameters);
	const signature = (() => {
		const signature = parameters.signature;
		if (isHex(signature)) return signature;
		if (typeof signature === "object" && "r" in signature && "s" in signature) return serializeSignature(signature);
		return bytesToHex$1(signature);
	})();
	try {
		if (mode === "eoa") try {
			if (isAddressEqual(getAddress(address), await recoverAddress({
				hash,
				signature
			}))) return true;
		} catch {}
		if (validate$1(signature)) return await verifyErc8010(client, {
			...parameters,
			multicallAddress,
			signature
		});
		return await verifyErc6492(client, {
			...parameters,
			verifierAddress,
			signature
		});
	} catch (error) {
		if (mode !== "eoa") try {
			if (isAddressEqual(getAddress(address), await recoverAddress({
				hash,
				signature
			}))) return true;
		} catch {}
		if (error instanceof VerificationError) return false;
		throw error;
	}
}
/** @internal */
async function verifyErc8010(client, parameters) {
	const { address, blockHash, blockNumber, blockTag, hash, multicallAddress, requireCanonical } = parameters;
	const { authorization: authorization_ox, data: initData, signature, to } = unwrap(parameters.signature);
	if (await getCode(client, {
		address,
		blockHash,
		blockNumber,
		blockTag,
		requireCanonical
	}) === concatHex(["0xef0100", authorization_ox.address])) return await verifyErc1271(client, {
		...parameters,
		signature
	});
	const authorization = {
		address: authorization_ox.address,
		chainId: Number(authorization_ox.chainId),
		nonce: Number(authorization_ox.nonce),
		r: numberToHex(authorization_ox.r, { size: 32 }),
		s: numberToHex(authorization_ox.s, { size: 32 }),
		yParity: authorization_ox.yParity
	};
	if (!await verifyAuthorization({
		address,
		authorization
	})) throw new VerificationError();
	const results = await getAction(client, readContract, "readContract")({
		...multicallAddress ? { address: multicallAddress } : { code: multicall3Bytecode },
		authorizationList: [authorization],
		abi: multicall3Abi,
		blockHash,
		blockNumber,
		blockTag: "pending",
		functionName: "aggregate3",
		requireCanonical,
		args: [[...initData ? [{
			allowFailure: true,
			target: to ?? address,
			callData: initData
		}] : [], {
			allowFailure: true,
			target: address,
			callData: encodeFunctionData({
				abi: erc1271Abi,
				functionName: "isValidSignature",
				args: [hash, signature]
			})
		}]]
	});
	if ((results[results.length - 1]?.returnData)?.startsWith("0x1626ba7e")) return true;
	throw new VerificationError();
}
/** @internal */
async function verifyErc6492(client, parameters) {
	const { address, factory, factoryData, hash, signature, verifierAddress, ...rest } = parameters;
	const wrappedSignature = await (async () => {
		if (!factory && !factoryData) return signature;
		if (validate(signature)) return signature;
		return wrap({
			data: factoryData,
			signature,
			to: factory
		});
	})();
	const args = verifierAddress ? {
		to: verifierAddress,
		data: encodeFunctionData({
			abi: erc6492SignatureValidatorAbi,
			functionName: "isValidSig",
			args: [
				address,
				hash,
				wrappedSignature
			]
		}),
		...rest
	} : {
		data: encodeDeployData({
			abi: erc6492SignatureValidatorAbi,
			args: [
				address,
				hash,
				wrappedSignature
			],
			bytecode: erc6492SignatureValidatorByteCode
		}),
		...rest
	};
	const { data } = await getAction(client, call, "call")(args).catch((error) => {
		if (error instanceof CallExecutionError) throw new VerificationError();
		throw error;
	});
	if (hexToBool(data ?? "0x0")) return true;
	throw new VerificationError();
}
/** @internal */
async function verifyErc1271(client, parameters) {
	const { address, blockHash, blockNumber, blockTag, hash, requireCanonical, signature } = parameters;
	if ((await getAction(client, readContract, "readContract")({
		address,
		abi: erc1271Abi,
		args: [hash, signature],
		blockHash,
		blockNumber,
		blockTag,
		functionName: "isValidSignature",
		requireCanonical
	}).catch((error) => {
		if (error instanceof ContractFunctionExecutionError) throw new VerificationError();
		throw error;
	})).startsWith("0x1626ba7e")) return true;
	throw new VerificationError();
}
var VerificationError = class extends Error {};
// ../../node_modules/viem/_esm/actions/public/verifyMessage.js
/**
* Verify that a message was signed by the provided address.
*
* Compatible with Smart Contract Accounts & Externally Owned Accounts via [ERC-6492](https://eips.ethereum.org/EIPS/eip-6492).
*
* - Docs {@link https://viem.sh/docs/actions/public/verifyMessage}
*
* @param client - Client to use.
* @param parameters - {@link VerifyMessageParameters}
* @returns Whether or not the signature is valid. {@link VerifyMessageReturnType}
*/
async function verifyMessage(client, { address, message, factory, factoryData, signature, ...callRequest }) {
	const hash = hashMessage(message);
	return getAction(client, verifyHash, "verifyHash")({
		address,
		factory,
		factoryData,
		hash,
		signature,
		...callRequest
	});
}
// ../../node_modules/viem/_esm/actions/public/verifyTypedData.js
/**
* Verify that typed data was signed by the provided address.
*
* - Docs {@link https://viem.sh/docs/actions/public/verifyTypedData}
*
* @param client - Client to use.
* @param parameters - {@link VerifyTypedDataParameters}
* @returns Whether or not the signature is valid. {@link VerifyTypedDataReturnType}
*/
async function verifyTypedData(client, parameters) {
	const { address, factory, factoryData, signature, message, primaryType, types, domain, ...callRequest } = parameters;
	const hash = hashTypedData({
		message,
		primaryType,
		types,
		domain
	});
	return getAction(client, verifyHash, "verifyHash")({
		address,
		factory,
		factoryData,
		hash,
		signature,
		...callRequest
	});
}
// ../../node_modules/viem/_esm/actions/public/watchBlockNumber.js
/**
* Watches and returns incoming block numbers.
*
* - Docs: https://viem.sh/docs/actions/public/watchBlockNumber
* - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/blocks_watching-blocks
* - JSON-RPC Methods:
*   - When `poll: true`, calls [`eth_blockNumber`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_blocknumber) on a polling interval.
*   - When `poll: false` & WebSocket Transport, uses a WebSocket subscription via [`eth_subscribe`](https://docs.alchemy.com/reference/eth-subscribe-polygon) and the `"newHeads"` event.
*
* @param client - Client to use
* @param parameters - {@link WatchBlockNumberParameters}
* @returns A function that can be invoked to stop watching for new block numbers. {@link WatchBlockNumberReturnType}
*
* @example
* import { createPublicClient, watchBlockNumber, http } from 'viem'
* import { mainnet } from 'viem/chains'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const unwatch = watchBlockNumber(client, {
*   onBlockNumber: (blockNumber) => console.log(blockNumber),
* })
*/
function watchBlockNumber(client, { emitOnBegin = false, emitMissed: emitMissed_, onBlockNumber, onError, poll: poll_, pollingInterval = client.pollingInterval }) {
	const enablePolling = (() => {
		if (typeof poll_ !== "undefined") return poll_;
		if (client.transport.type === "webSocket" || client.transport.type === "ipc") return false;
		if (client.transport.type === "fallback" && (client.transport.transports[0].config.type === "webSocket" || client.transport.transports[0].config.type === "ipc")) return false;
		return true;
	})();
	const blockTime = client.chain?.blockTime;
	const emitMissed = emitMissed_ ?? (blockTime !== void 0 && pollingInterval > blockTime / 2);
	let prevBlockNumber;
	const pollBlockNumber = () => {
		return observe(stringify$1([
			"watchBlockNumber",
			client.uid,
			emitOnBegin,
			emitMissed,
			pollingInterval
		]), {
			onBlockNumber,
			onError
		}, (emit) => poll(async () => {
			try {
				const blockNumber = await getAction(client, getBlockNumber, "getBlockNumber")({ cacheTime: 0 });
				if (prevBlockNumber !== void 0) {
					if (blockNumber === prevBlockNumber) return;
					if (blockNumber - prevBlockNumber > 1 && emitMissed) for (let i = prevBlockNumber + 1n; i < blockNumber; i++) {
						emit.onBlockNumber(i, prevBlockNumber);
						prevBlockNumber = i;
					}
				}
				if (prevBlockNumber === void 0 || blockNumber > prevBlockNumber) {
					emit.onBlockNumber(blockNumber, prevBlockNumber);
					prevBlockNumber = blockNumber;
				}
			} catch (err) {
				emit.onError?.(err);
			}
		}, {
			emitOnBegin,
			interval: pollingInterval
		}));
	};
	const subscribeBlockNumber = () => {
		return observe(stringify$1([
			"watchBlockNumber",
			client.uid,
			emitOnBegin,
			emitMissed
		]), {
			onBlockNumber,
			onError
		}, (emit) => {
			let active = true;
			let unsubscribe = () => active = false;
			(async () => {
				try {
					const { unsubscribe: unsubscribe_ } = await (() => {
						if (client.transport.type === "fallback") {
							const transport = client.transport.transports.find((transport) => transport.config.type === "webSocket" || transport.config.type === "ipc");
							if (!transport) return client.transport;
							return transport.value;
						}
						return client.transport;
					})().subscribe({
						params: ["newHeads"],
						onData(data) {
							if (!active) return;
							const blockNumber = hexToBigInt(data.result?.number);
							emit.onBlockNumber(blockNumber, prevBlockNumber);
							prevBlockNumber = blockNumber;
						},
						onError(error) {
							emit.onError?.(error);
						}
					});
					unsubscribe = unsubscribe_;
					if (!active) unsubscribe();
				} catch (err) {
					onError?.(err);
				}
			})();
			return () => unsubscribe();
		});
	};
	return enablePolling ? pollBlockNumber() : subscribeBlockNumber();
}
// ../../node_modules/viem/_esm/actions/public/waitForTransactionReceipt.js
/**
* Waits for the [Transaction](https://viem.sh/docs/glossary/terms#transaction) to be included on a [Block](https://viem.sh/docs/glossary/terms#block) (one confirmation), and then returns the [Transaction Receipt](https://viem.sh/docs/glossary/terms#transaction-receipt).
*
* - Docs: https://viem.sh/docs/actions/public/waitForTransactionReceipt
* - Example: https://stackblitz.com/github/wevm/viem/tree/main/examples/transactions_sending-transactions
* - JSON-RPC Methods:
*   - Polls [`eth_getTransactionReceipt`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getTransactionReceipt) on each block until it has been processed.
*   - If a Transaction has been replaced:
*     - Calls [`eth_getBlockByNumber`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getblockbynumber) and extracts the transactions
*     - Checks if one of the Transactions is a replacement
*     - If so, calls [`eth_getTransactionReceipt`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getTransactionReceipt).
*   - If the Transaction is not found and `replacement` is provided:
*     - Calls `eth_getTransactionBySenderAndNonce` to find the Transaction in its nonce slot
*     - If it is a replacement, calls [`eth_getTransactionReceipt`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getTransactionReceipt).
*
* The `waitForTransactionReceipt` action additionally supports Replacement detection (e.g. sped up Transactions).
*
* Transactions can be replaced when a user modifies their transaction in their wallet (to speed up or cancel). Transactions are replaced when they are sent from the same nonce.
*
* There are 3 types of Transaction Replacement reasons:
*
* - `repriced`: The gas price has been modified (e.g. different `maxFeePerGas`)
* - `cancelled`: The Transaction has been cancelled (e.g. `value === 0n`)
* - `replaced`: The Transaction has been replaced (e.g. different `value` or `data`)
*
* @param client - Client to use
* @param parameters - {@link WaitForTransactionReceiptParameters}
* @returns The transaction receipt. {@link WaitForTransactionReceiptReturnType}
*
* @example
* import { createPublicClient, waitForTransactionReceipt, http } from 'viem'
* import { mainnet } from 'viem/chains'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const transactionReceipt = await waitForTransactionReceipt(client, {
*   hash: '0x4ca7ee652d57678f26e887c149ab0735f41de37bcad58c9f6d3ed5824f15b74d',
* })
*/
async function waitForTransactionReceipt(client, parameters) {
	const { checkReplacement = client.chain?.supportsTransactionReplacementDetection ?? true, confirmations = 1, hash, onReplaced, retryCount = 6, retryDelay = ({ count }) => ~~(1 << count) * 200, timeout = 18e4 } = parameters;
	const replacement = client.chain?.transactionReplacement?.getKey ? void 0 : parameters.replacement;
	const getReplacementKey = (transaction) => client.chain?.transactionReplacement?.getKey?.(transaction) ?? String(transaction.nonce);
	const pollingInterval = (() => {
		if (parameters.pollingInterval) return parameters.pollingInterval;
		if (client.chain?.experimental_preconfirmationTime) return client.chain.experimental_preconfirmationTime;
		return client.pollingInterval;
	})();
	const observerId = stringify$1([
		"waitForTransactionReceipt",
		client.uid,
		hash,
		{
			checkReplacement,
			confirmations,
			pollingInterval,
			replacement,
			retryCount,
			timeout
		}
	]);
	let transaction;
	let receipt;
	let replacementResponse;
	let retrying = false;
	let _unobserve;
	let _unwatch;
	const { promise, resolve, reject } = withResolvers();
	const timer = timeout ? setTimeout(() => {
		_unwatch?.();
		_unobserve?.();
		reject(new WaitForTransactionReceiptTimeoutError({ hash }));
	}, timeout) : void 0;
	_unobserve = observe(observerId, {
		onReplaced,
		resolve,
		reject
	}, async (emit) => {
		receipt = await getAction(client, getTransactionReceipt, "getTransactionReceipt")({ hash }).catch(() => void 0);
		if (receipt && confirmations <= 1) {
			clearTimeout(timer);
			emit.resolve(receipt);
			_unobserve?.();
			return;
		}
		_unwatch = getAction(client, watchBlockNumber, "watchBlockNumber")({
			emitMissed: true,
			emitOnBegin: true,
			poll: true,
			pollingInterval,
			async onBlockNumber(blockNumber_) {
				const done = (fn) => {
					clearTimeout(timer);
					_unwatch?.();
					fn();
					_unobserve?.();
				};
				let blockNumber = blockNumber_;
				if (retrying) return;
				try {
					if (receipt) {
						if (confirmations > 1 && (!receipt.blockNumber || blockNumber - receipt.blockNumber + 1n < confirmations)) return;
						done(() => {
							if (replacementResponse) emit.onReplaced?.(replacementResponse);
							emit.resolve(receipt);
						});
						return;
					}
					if (checkReplacement && !transaction) {
						retrying = true;
						await withRetry(async () => {
							transaction = await getAction(client, getTransaction, "getTransaction")({ hash });
							if (transaction.blockNumber) blockNumber = transaction.blockNumber;
						}, {
							delay: retryDelay,
							retryCount,
							shouldRetry: ({ error }) => !(replacement && error instanceof TransactionNotFoundError)
						});
						retrying = false;
					}
					receipt = await getAction(client, getTransactionReceipt, "getTransactionReceipt")({ hash });
					if (confirmations > 1 && (!receipt.blockNumber || blockNumber - receipt.blockNumber + 1n < confirmations)) return;
					done(() => emit.resolve(receipt));
				} catch (err) {
					if (err instanceof TransactionNotFoundError || err instanceof TransactionReceiptNotFoundError) {
						retrying = false;
						const replaced = transaction ?? (checkReplacement && replacement ? {
							...replacement,
							hash: hash.toLowerCase()
						} : void 0);
						if (!replaced) return;
						if (replaced.blockNumber) return;
						try {
							if (!transaction) {
								retrying = true;
								const found = await getAction(client, getTransaction, "getTransaction")({
									nonce: replaced.nonce,
									sender: replaced.from
								}).catch((error) => {
									if (error instanceof MethodNotFoundRpcError || error instanceof MethodNotSupportedRpcError) transaction = replaced;
								});
								retrying = false;
								if (found?.hash.toLowerCase() === replaced.hash) {
									transaction = found;
									return;
								}
								if (found) {
									const replacementReceipt = await getAction(client, getTransactionReceipt, "getTransactionReceipt")({ hash: found.hash }).catch((error) => {
										if (error instanceof TransactionReceiptNotFoundError) return void 0;
										throw error;
									});
									if (!replacementReceipt) return;
									receipt = replacementReceipt;
									replacementResponse = {
										reason: client.chain?.transactionReplacement?.getReason?.({
											replaced,
											replacement: found
										}) ?? getReplacementReason(replaced, found),
										replacedTransaction: replaced,
										transaction: found,
										transactionReceipt: receipt
									};
									if (confirmations > 1 && (!receipt.blockNumber || blockNumber - receipt.blockNumber + 1n < confirmations)) return;
									done(() => {
										emit.onReplaced?.(replacementResponse);
										emit.resolve(receipt);
									});
									return;
								}
							}
							retrying = true;
							const block = await withRetry(() => getAction(client, getBlock, "getBlock")({
								blockNumber,
								includeTransactions: true
							}), {
								delay: retryDelay,
								retryCount,
								shouldRetry: ({ error }) => error instanceof BlockNotFoundError
							});
							retrying = false;
							const replacedKey = getReplacementKey(replaced);
							const replacementTransaction = block.transactions.find((candidate) => isAddressEqual(candidate.from, replaced.from) && candidate.hash !== replaced.hash && getReplacementKey(candidate) === replacedKey);
							if (!replacementTransaction) return;
							receipt = await getAction(client, getTransactionReceipt, "getTransactionReceipt")({ hash: replacementTransaction.hash });
							replacementResponse = {
								reason: client.chain?.transactionReplacement?.getReason?.({
									replaced,
									replacement: replacementTransaction
								}) ?? getReplacementReason(replaced, replacementTransaction),
								replacedTransaction: replaced,
								transaction: replacementTransaction,
								transactionReceipt: receipt
							};
							if (confirmations > 1 && (!receipt.blockNumber || blockNumber - receipt.blockNumber + 1n < confirmations)) return;
							done(() => {
								emit.onReplaced?.(replacementResponse);
								emit.resolve(receipt);
							});
						} catch (err_) {
							done(() => emit.reject(err_));
						}
					} else done(() => emit.reject(err));
				}
			}
		});
	});
	return promise.finally(() => {
		clearTimeout(timer);
		_unobserve?.();
	});
}
function getReplacementReason(replaced, replacement) {
	if ((replacement.to && replaced.to ? isAddressEqual(replacement.to, replaced.to) : replacement.to === replaced.to) && replacement.value === replaced.value && replacement.input === replaced.input) return "repriced";
	if (replacement.from === replacement.to && replacement.value === 0n) return "cancelled";
	return "replaced";
}
// ../../node_modules/viem/_esm/actions/public/watchBlockHeaders.js
var blockFields = [
	"size",
	"totalDifficulty",
	"transactions",
	"uncles",
	"withdrawals"
];
/**
* Watches and returns incoming block headers.
*
* - Docs: https://viem.sh/docs/actions/public/watchBlockHeaders
* - JSON-RPC Methods: Uses a WebSocket or IPC subscription via [`eth_subscribe`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_subscribe) and the `"newHeads"` event.
*
* @param client - Client to use
* @param parameters - {@link WatchBlockHeadersParameters}
* @returns A function that can be invoked to stop watching for new block headers. {@link WatchBlockHeadersReturnType}
*
* @example
* import { createPublicClient, webSocket } from 'viem'
* import { watchBlockHeaders } from 'viem/actions'
* import { mainnet } from 'viem/chains'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: webSocket(),
* })
* const unwatch = watchBlockHeaders(client, {
*   onBlockHeader: (blockHeader) => console.log(blockHeader),
* })
*/
function watchBlockHeaders(client, { onBlockHeader, onError }) {
	let prevBlockHeader;
	return observe(stringify$1(["watchBlockHeaders", client.uid]), {
		onBlockHeader,
		onError
	}, (emit) => {
		let active = true;
		let subscribed = false;
		let unsubscribe = () => active = false;
		(async () => {
			try {
				const { unsubscribe: unsubscribe_ } = await (() => {
					if (client.transport.type === "fallback") {
						const transport = client.transport.transports.find((transport) => transport.config.type === "webSocket" || transport.config.type === "ipc");
						if (!transport) return client.transport;
						return transport.value;
					}
					return client.transport;
				})().subscribe({
					params: ["newHeads"],
					onData(data) {
						if (!active) return;
						const blockHeader = (client.chain?.formatters?.block?.format || formatBlock)(data.result, "watchBlockHeaders");
						for (const field of blockFields) delete blockHeader[field];
						emit.onBlockHeader(blockHeader, prevBlockHeader);
						prevBlockHeader = blockHeader;
					},
					onError(error) {
						if (subscribed) emit.onError?.(error);
					}
				});
				subscribed = true;
				unsubscribe = unsubscribe_;
				if (!active) unsubscribe();
			} catch (err) {
				emit.onError?.(err);
			}
		})();
		return () => unsubscribe();
	});
}
// ../../node_modules/viem/_esm/actions/public/watchBlocks.js
/**
* Watches and returns information for incoming blocks.
*
* - Docs: https://viem.sh/docs/actions/public/watchBlocks
* - Examples: https://stackblitz.com/github/wevm/viem/tree/main/examples/blocks_watching-blocks
* - JSON-RPC Methods:
*   - When `poll: true`, calls [`eth_getBlockByNumber`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getBlockByNumber) on a polling interval.
*   - When `poll: false` & WebSocket Transport, uses a WebSocket subscription via [`eth_subscribe`](https://docs.alchemy.com/reference/eth-subscribe-polygon) and the `"newHeads"` event.
*
* @param client - Client to use
* @param parameters - {@link WatchBlocksParameters}
* @returns A function that can be invoked to stop watching for new block numbers. {@link WatchBlocksReturnType}
*
* @example
* import { createPublicClient, watchBlocks, http } from 'viem'
* import { mainnet } from 'viem/chains'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const unwatch = watchBlocks(client, {
*   onBlock: (block) => console.log(block),
* })
*/
function watchBlocks(client, { blockTag = client.experimental_blockTag ?? "latest", emitMissed: emitMissed_, emitOnBegin = false, onBlock, onError, includeTransactions: includeTransactions_, poll: poll_, pollingInterval = client.pollingInterval }) {
	const enablePolling = (() => {
		if (typeof poll_ !== "undefined") return poll_;
		if (client.transport.type === "webSocket" || client.transport.type === "ipc") return false;
		if (client.transport.type === "fallback" && (client.transport.transports[0].config.type === "webSocket" || client.transport.transports[0].config.type === "ipc")) return false;
		return true;
	})();
	const includeTransactions = includeTransactions_ ?? false;
	const blockTime = client.chain?.blockTime;
	const emitMissed = emitMissed_ ?? ((blockTag === "latest" || blockTag === "pending") && blockTime !== void 0 && pollingInterval > blockTime / 2);
	const maxMissed = emitMissed_ === void 0 ? 100 : Number.POSITIVE_INFINITY;
	let prevBlock;
	const pollBlocks = () => {
		return observe(stringify$1([
			"watchBlocks",
			client.uid,
			blockTag,
			emitMissed,
			emitOnBegin,
			includeTransactions,
			maxMissed,
			pollingInterval
		]), {
			onBlock,
			onError
		}, (emit) => poll(async () => {
			try {
				const block = await getAction(client, getBlock, "getBlock")({
					blockTag,
					includeTransactions
				});
				if (block.number !== null && prevBlock?.number != null) {
					if (block.number === prevBlock.number) return;
					const missed = Number(block.number - prevBlock.number) - 1;
					if (missed > 0 && missed <= maxMissed && emitMissed) {
						const batchSize = 10;
						const start = prevBlock.number + 1n;
						for (let i = 0; i < missed; i += batchSize) {
							const blocks = await Promise.all(Array.from({ length: Math.min(batchSize, missed - i) }, (_, j) => getAction(client, getBlock, "getBlock")({
								blockNumber: start + BigInt(i + j),
								includeTransactions
							})));
							for (const block of blocks) {
								emit.onBlock(block, prevBlock);
								prevBlock = block;
							}
						}
					}
				}
				if (prevBlock?.number == null || blockTag === "pending" && block?.number == null || block.number !== null && block.number > prevBlock.number) {
					emit.onBlock(block, prevBlock);
					prevBlock = block;
				}
			} catch (err) {
				emit.onError?.(err);
			}
		}, {
			emitOnBegin,
			interval: pollingInterval
		}));
	};
	const subscribeBlocks = () => {
		let active = true;
		let emitFetched = true;
		let unsubscribe = () => active = false;
		(async () => {
			try {
				if (emitOnBegin) getAction(client, getBlock, "getBlock")({
					blockTag,
					includeTransactions
				}).then((block) => {
					if (!active) return;
					if (!emitFetched) return;
					onBlock(block, void 0);
					emitFetched = false;
				}).catch(onError);
				const { unsubscribe: unsubscribe_ } = await (() => {
					if (client.transport.type === "fallback") {
						const transport = client.transport.transports.find((transport) => transport.config.type === "webSocket" || transport.config.type === "ipc");
						if (!transport) return client.transport;
						return transport.value;
					}
					return client.transport;
				})().subscribe({
					params: ["newHeads"],
					async onData(data) {
						if (!active) return;
						const block = await getAction(client, getBlock, "getBlock")({
							blockNumber: data.result?.number,
							includeTransactions
						}).catch(() => {});
						if (!active) return;
						onBlock(block, prevBlock);
						emitFetched = false;
						prevBlock = block;
					},
					onError(error) {
						onError?.(error);
					}
				});
				unsubscribe = unsubscribe_;
				if (!active) unsubscribe();
			} catch (err) {
				onError?.(err);
			}
		})();
		return () => unsubscribe();
	};
	return enablePolling ? pollBlocks() : subscribeBlocks();
}
// ../../node_modules/viem/_esm/actions/public/watchEvent.js
/**
* Watches and returns emitted [Event Logs](https://viem.sh/docs/glossary/terms#event-log).
*
* - Docs: https://viem.sh/docs/actions/public/watchEvent
* - JSON-RPC Methods:
*   - **RPC Provider supports `eth_newFilter`:**
*     - Calls [`eth_newFilter`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_newfilter) to create a filter (called on initialize).
*     - On a polling interval, it will call [`eth_getFilterChanges`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getfilterchanges).
*   - **RPC Provider does not support `eth_newFilter`:**
*     - Calls [`eth_getLogs`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getlogs) for each block between the polling interval.
*
* This Action will batch up all the Event Logs found within the [`pollingInterval`](https://viem.sh/docs/actions/public/watchEvent#pollinginterval-optional), and invoke them via [`onLogs`](https://viem.sh/docs/actions/public/watchEvent#onLogs).
*
* `watchEvent` will attempt to create an [Event Filter](https://viem.sh/docs/actions/public/createEventFilter) and listen to changes to the Filter per polling interval, however, if the RPC Provider does not support Filters (e.g. `eth_newFilter`), then `watchEvent` will fall back to using [`getLogs`](https://viem.sh/docs/actions/public/getLogs) instead. If `getLogs` fails for a block range, `watchEvent` will retry with smaller block ranges and may call `onLogs` more than once per polling interval.
*
* @param client - Client to use
* @param parameters - {@link WatchEventParameters}
* @returns A function that can be invoked to stop watching for new Event Logs. {@link WatchEventReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { watchEvent } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const unwatch = watchEvent(client, {
*   onLogs: (logs) => console.log(logs),
* })
*/
function watchEvent(client, { address, args, batch = true, event, events, fromBlock, onError, onLogs, poll: poll_, pollingInterval = client.pollingInterval, strict: strict_ }) {
	const enablePolling = (() => {
		if (typeof poll_ !== "undefined") return poll_;
		if (typeof fromBlock === "bigint") return true;
		if (client.transport.type === "webSocket" || client.transport.type === "ipc") return false;
		if (client.transport.type === "fallback" && (client.transport.transports[0].config.type === "webSocket" || client.transport.transports[0].config.type === "ipc")) return false;
		return true;
	})();
	const strict = strict_ ?? false;
	const pollEvent = () => {
		return observe(stringify$1([
			"watchEvent",
			address,
			args,
			batch,
			client.uid,
			event,
			events,
			pollingInterval,
			strict,
			fromBlock
		]), {
			onLogs,
			onError
		}, (emit) => {
			let active = true;
			let previousBlockNumber = fromBlock === void 0 ? void 0 : fromBlock - 1n;
			let filter;
			let initialized = false;
			const emitLogs = (logs) => {
				if (logs.length === 0) return;
				if (batch) emit.onLogs(logs);
				else for (const log of logs) emit.onLogs([log]);
			};
			const getLogsInRange = (from, to) => getAction(client, getLogs, "getLogs")({
				address,
				args,
				event,
				events,
				fromBlock: from,
				strict,
				toBlock: to
			});
			const unwatch = poll(async () => {
				if (!initialized) {
					try {
						filter = await getAction(client, createEventFilter, "createEventFilter")({
							address,
							args,
							event,
							events,
							strict,
							fromBlock
						});
					} catch {}
					initialized = true;
					if (filter) return;
				}
				try {
					if (filter) {
						const logs = await getAction(client, getFilterChanges, "getFilterChanges")({ filter });
						emitLogs(logs);
						return;
					}
					const blockNumber = await getAction(client, getBlockNumber, "getBlockNumber")({});
					previousBlockNumber ??= blockNumber;
					let size = blockNumber - previousBlockNumber;
					while (previousBlockNumber < blockNumber) {
						const from = previousBlockNumber + 1n;
						const end = previousBlockNumber + size;
						const to = end < blockNumber ? end : blockNumber;
						const logs = await getLogsInRange(from, to).catch((error) => {
							if (from === to || !isRangeError(error)) throw error;
						});
						if (!active) return;
						if (!logs) {
							size = (to - from + 1n) / 2n;
							continue;
						}
						previousBlockNumber = to;
						emitLogs(logs);
					}
				} catch (err) {
					if (filter && err instanceof InvalidInputRpcError) initialized = false;
					emit.onError?.(err);
				}
			}, {
				emitOnBegin: true,
				interval: pollingInterval
			});
			return async () => {
				active = false;
				if (filter) await getAction(client, uninstallFilter, "uninstallFilter")({ filter });
				unwatch();
			};
		});
	};
	const subscribeEvent = () => {
		let active = true;
		let unsubscribe = () => active = false;
		(async () => {
			try {
				const transport = (() => {
					if (client.transport.type === "fallback") {
						const transport = client.transport.transports.find((transport) => transport.config.type === "webSocket" || transport.config.type === "ipc");
						if (!transport) return client.transport;
						return transport.value;
					}
					return client.transport;
				})();
				const events_ = events ?? (event ? [event] : void 0);
				let topics = [];
				if (events_) {
					topics = [events_.flatMap((event) => encodeEventTopics({
						abi: [event],
						eventName: event.name,
						args
					}))];
					if (event) topics = topics[0];
				}
				const { unsubscribe: unsubscribe_ } = await transport.subscribe({
					params: ["logs", {
						address,
						topics
					}],
					onData(data) {
						if (!active) return;
						const log = data.result;
						try {
							const { eventName, args } = decodeEventLog({
								abi: events_ ?? [],
								data: log.data,
								topics: log.topics,
								strict
							});
							onLogs([formatLog(log, {
								args,
								eventName
							})]);
						} catch (err) {
							if ((events_ || strict_) && (err instanceof AbiEventAmbiguityError || err instanceof AbiEventSignatureEmptyTopicsError || err instanceof AbiEventSignatureNotFoundError)) return;
							let eventName;
							let isUnnamed;
							if (err instanceof DecodeLogDataMismatch || err instanceof DecodeLogTopicsMismatch) {
								if (strict_) return;
								eventName = err.abiItem.name;
								isUnnamed = err.abiItem.inputs?.some((x) => !("name" in x && x.name));
							}
							onLogs([formatLog(log, {
								args: isUnnamed ? [] : {},
								eventName
							})]);
						}
					},
					onError(error) {
						onError?.(error);
					}
				});
				unsubscribe = unsubscribe_;
				if (!active) unsubscribe();
			} catch (err) {
				onError?.(err);
			}
		})();
		return () => unsubscribe();
	};
	return enablePolling ? pollEvent() : subscribeEvent();
}
/** Returns whether a failed `eth_getLogs` request may succeed with a smaller block range. */
function isRangeError(error) {
	if (!(error instanceof BaseError$2)) return true;
	const cause = error.walk((err) => err instanceof HttpRequestError || err instanceof RpcRequestError);
	if (!cause) return true;
	if (cause instanceof RpcRequestError && cause.code === 429) return false;
	if (cause instanceof HttpRequestError && cause.status === void 0) return false;
	return cause.status !== 401 && cause.status !== 403 && cause.status !== 429;
}
// ../../node_modules/viem/_esm/actions/public/watchPendingTransactions.js
/**
* Watches and returns pending transaction hashes.
*
* - Docs: https://viem.sh/docs/actions/public/watchPendingTransactions
* - JSON-RPC Methods:
*   - When `poll: true`
*     - Calls [`eth_newPendingTransactionFilter`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_newpendingtransactionfilter) to initialize the filter.
*     - Calls [`eth_getFilterChanges`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_getFilterChanges) on a polling interval.
*   - When `poll: false` & WebSocket Transport, uses a WebSocket subscription via [`eth_subscribe`](https://docs.alchemy.com/reference/eth-subscribe-polygon) and the `"newPendingTransactions"` event.
*
* This Action will batch up all the pending transactions found within the [`pollingInterval`](https://viem.sh/docs/actions/public/watchPendingTransactions#pollinginterval-optional), and invoke them via [`onTransactions`](https://viem.sh/docs/actions/public/watchPendingTransactions#ontransactions).
*
* @param client - Client to use
* @param parameters - {@link WatchPendingTransactionsParameters}
* @returns A function that can be invoked to stop watching for new pending transaction hashes. {@link WatchPendingTransactionsReturnType}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { watchPendingTransactions } from 'viem/public'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
* const unwatch = await watchPendingTransactions(client, {
*   onTransactions: (hashes) => console.log(hashes),
* })
*/
function watchPendingTransactions(client, { batch = true, onError, onTransactions, poll: poll_, pollingInterval = client.pollingInterval }) {
	const enablePolling = typeof poll_ !== "undefined" ? poll_ : client.transport.type !== "webSocket" && client.transport.type !== "ipc";
	const pollPendingTransactions = () => {
		return observe(stringify$1([
			"watchPendingTransactions",
			client.uid,
			batch,
			pollingInterval
		]), {
			onTransactions,
			onError
		}, (emit) => {
			let filter;
			const unwatch = poll(async () => {
				try {
					if (!filter) try {
						filter = await getAction(client, createPendingTransactionFilter, "createPendingTransactionFilter")({});
						return;
					} catch (err) {
						unwatch();
						throw err;
					}
					const hashes = await getAction(client, getFilterChanges, "getFilterChanges")({ filter });
					if (hashes.length === 0) return;
					if (batch) emit.onTransactions(hashes);
					else for (const hash of hashes) emit.onTransactions([hash]);
				} catch (err) {
					emit.onError?.(err);
				}
			}, {
				emitOnBegin: true,
				interval: pollingInterval
			});
			return async () => {
				if (filter) await getAction(client, uninstallFilter, "uninstallFilter")({ filter });
				unwatch();
			};
		});
	};
	const subscribePendingTransactions = () => {
		let active = true;
		let unsubscribe = () => active = false;
		(async () => {
			try {
				const { unsubscribe: unsubscribe_ } = await client.transport.subscribe({
					params: ["newPendingTransactions"],
					onData(data) {
						if (!active) return;
						const transaction = data.result;
						onTransactions([transaction]);
					},
					onError(error) {
						onError?.(error);
					}
				});
				unsubscribe = unsubscribe_;
				if (!active) unsubscribe();
			} catch (err) {
				onError?.(err);
			}
		})();
		return () => unsubscribe();
	};
	return enablePolling ? pollPendingTransactions() : subscribePendingTransactions();
}
// ../../node_modules/viem/_esm/utils/siwe/parseSiweMessage.js
var siweDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
function isValidSiweDateTime(value) {
	if (!siweDateTimeRegex.test(value)) return false;
	return !Number.isNaN(new Date(value).getTime());
}
function parseSiweDateTime(value) {
	if (!isValidSiweDateTime(value)) return /* @__PURE__ */ new Date(NaN);
	return new Date(value);
}
/**
* @description Parses EIP-4361 formatted message into message fields object.
*
* @see https://eips.ethereum.org/EIPS/eip-4361
*
* @returns EIP-4361 fields object
*/
function parseSiweMessage(message) {
	const { scheme, statement, ...prefix } = message.match(prefixRegex)?.groups ?? {};
	const { chainId, expirationTime, issuedAt, notBefore, requestId, resources: resources_, ...suffix } = message.match(suffixRegex)?.groups ?? {};
	const resources = resources_?.split("\n- ").slice(1);
	return {
		...prefix,
		...suffix,
		...chainId ? { chainId: Number(chainId) } : {},
		...expirationTime ? { expirationTime: parseSiweDateTime(expirationTime) } : {},
		...issuedAt ? { issuedAt: parseSiweDateTime(issuedAt) } : {},
		...notBefore ? { notBefore: parseSiweDateTime(notBefore) } : {},
		...requestId ? { requestId } : {},
		...resources ? { resources } : {},
		...scheme ? { scheme } : {},
		...statement ? { statement } : {}
	};
}
var prefixRegex = /^(?:(?<scheme>[a-zA-Z][a-zA-Z0-9+\-.]*):\/\/)?(?<domain>[a-zA-Z0-9+-.]*(?::[0-9]{1,5})?) (?:wants you to sign in with your Ethereum account:\n)(?<address>0x[a-fA-F0-9]{40})\n\n(?:(?<statement>.*)\n\n)?/;
var suffixRegex = /(?:URI: (?<uri>.+))\n(?:Version: (?<version>.+))\n(?:Chain ID: (?<chainId>\d+))\n(?:Nonce: (?<nonce>[a-zA-Z0-9]+))\n(?:Issued At: (?<issuedAt>.+))(?:\nExpiration Time: (?<expirationTime>.+))?(?:\nNot Before: (?<notBefore>.+))?(?:\nRequest ID: (?<requestId>.*))?(?:\nResources:(?<resources>(?:\n- .+)*))?/;
// ../../node_modules/viem/_esm/utils/siwe/validateSiweMessage.js
/**
* @description Validates EIP-4361 message.
*
* @see https://eips.ethereum.org/EIPS/eip-4361
*/
function validateSiweMessage(parameters) {
	const { address, domain, message, nonce, scheme, time = /* @__PURE__ */ new Date() } = parameters;
	if (domain && message.domain !== domain) return false;
	if (nonce && message.nonce !== nonce) return false;
	if (scheme && message.scheme !== scheme) return false;
	if (Number.isNaN(time.getTime())) return false;
	if (message.expirationTime) {
		if (Number.isNaN(message.expirationTime.getTime())) return false;
		if (time >= message.expirationTime) return false;
	}
	if (message.notBefore) {
		if (Number.isNaN(message.notBefore.getTime())) return false;
		if (time < message.notBefore) return false;
	}
	try {
		if (!message.address) return false;
		if (!isAddress(message.address, { strict: false })) return false;
		if (address && !isAddressEqual(message.address, address)) return false;
	} catch {
		return false;
	}
	return true;
}
// ../../node_modules/viem/_esm/actions/siwe/verifySiweMessage.js
/**
* Verifies [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) formatted message was signed.
*
* Compatible with Smart Contract Accounts & Externally Owned Accounts via [ERC-6492](https://eips.ethereum.org/EIPS/eip-6492).
*
* - Docs {@link https://viem.sh/docs/siwe/actions/verifySiweMessage}
*
* @param client - Client to use.
* @param parameters - {@link VerifySiweMessageParameters}
* @returns Whether or not the signature is valid. {@link VerifySiweMessageReturnType}
*/
async function verifySiweMessage(client, parameters) {
	const { address, domain, message, nonce, scheme, signature, time = /* @__PURE__ */ new Date(), ...callRequest } = parameters;
	const parsed = parseSiweMessage(message);
	if (!parsed.address) return false;
	if (!validateSiweMessage({
		address,
		domain,
		message: parsed,
		nonce,
		scheme,
		time
	})) return false;
	const hash = hashMessage(message);
	return verifyHash(client, {
		address: parsed.address,
		hash,
		signature,
		...callRequest
	});
}
// ../../node_modules/viem/_esm/actions/token/internal.js
/**
* Shapes a base-unit value into an {@link Amount} (base units, `decimals`, and
* human-readable `formatted` string).
*
* @param amount - Amount in base units.
* @param decimals - Token decimals used to format the amount.
* @returns The {@link Amount}.
*/
function toAmount(amount, decimals) {
	return {
		amount,
		decimals,
		formatted: formatUnits(amount, decimals)
	};
}
/**
* Resolves the token contract `address` and `decimals` from a `token`, which is
* either the symbol of a token declared on the client's `tokens` array or a
* contract `address`.
*
* When `token` is a declared symbol, the `address` and `decimals` are resolved
* from the Client's `tokens` array for the Client's `chain.id` (`decimals` can
* be overridden via the explicit `decimals`). When `token` is an address, its
* `decimals` is inferred from the Client's `tokens` array when the address
* matches a declared token, otherwise taken from the explicit `decimals`.
*
* @param client - Client.
* @param parameters - Parameters.
* @returns The resolved `address` and `decimals`.
*/
function resolveToken(client, parameters) {
	const { decimals, token } = parameters;
	const declared = findDeclaredToken(client, token);
	if (declared) return {
		address: declared.address,
		decimals: decimals ?? declared.decimals
	};
	if (isAddress(token, { strict: false })) return {
		address: token,
		decimals: decimals ?? inferDecimals(client, token)
	};
	throw new Error(`Token "${token}" is not a declared ERC-20 token on the client's \`tokens\` array (with an address for the client's chain), and is not a valid address.`);
}
/**
* Finds the declared token on the Client's `tokens` array matching `token`
* (either a token symbol or contract `address`), resolved to a {@link ResolvedToken}
* for the Client's `chain.id`. Returns `undefined` when no declared token
* matches, or the matching token has no address for the Client's chain.
*
* @param client - Client.
* @param token - Token symbol (declared on the client's `tokens` array) or contract address.
* @returns The matching resolved token config, or `undefined`.
*/
function findDeclaredToken(client, token) {
	const tokens = client.tokens;
	const chainId = client.chain?.id;
	if (!tokens || chainId === void 0) return void 0;
	const bySymbol = findTokenBySymbol(tokens, token);
	if (bySymbol) return resolveTokenForChain(bySymbol, chainId);
	if (isAddress(token, { strict: false })) for (const token_ of tokens) {
		const resolved = resolveTokenForChain(token_, chainId);
		if (resolved && isAddressEqual(resolved.address, token)) return resolved;
	}
}
/**
* Resolves a {@link Token} to a {@link ResolvedToken} for `chainId`, or
* `undefined` when the token has no address for `chainId`. @internal
*/
function resolveTokenForChain(token, chainId) {
	const address = token.addresses[chainId];
	if (!address) return void 0;
	return {
		address,
		currency: token.currency,
		decimals: token.decimals,
		name: token.name,
		popular: token.popular,
		symbol: token.symbol
	};
}
/** Finds a {@link Token} by symbol (case-insensitively) on a `tokens` array. @internal */
function findTokenBySymbol(tokens, symbol) {
	const lowerSymbol = symbol.toLowerCase();
	for (const token of tokens) if (token.symbol?.toLowerCase() === lowerSymbol) return token;
}
/**
* Infers a token's `decimals` from the Client's `tokens` array by matching
* `address` against each token's address for the Client's `chain.id`.
* @internal
*/
function inferDecimals(client, address) {
	const tokens = client.tokens;
	const chainId = client.chain?.id;
	if (tokens && chainId !== void 0) for (const token of tokens) {
		const resolved = resolveTokenForChain(token, chainId);
		if (resolved && isAddressEqual(resolved.address, address)) return resolved.decimals;
	}
}
/**
* Resolves token decimals, fetching from the token contract when they are not
* provided explicitly or declared on the client.
* @internal
*/
async function resolveTokenWithDecimals(client, parameters) {
	const { address, decimals } = resolveToken(client, parameters);
	if (decimals !== void 0) return {
		address,
		decimals
	};
	return {
		address,
		decimals: await readContract(client, {
			abi: erc20Abi,
			address,
			functionName: "decimals"
		})
	};
}
function defineCall(call) {
	return {
		...call,
		data: encodeFunctionData(call),
		to: call.address
	};
}
// ../../node_modules/viem/_esm/actions/wallet/sendRawTransactionSync.js
/**
* Sends a **signed** transaction to the network synchronously,
* and waits for the transaction to be included in a block.
*
* - Docs: https://viem.sh/docs/actions/wallet/sendRawTransactionSync
* - JSON-RPC Method: [`eth_sendRawTransactionSync`](https://eips.ethereum.org/EIPS/eip-7966)
*
* @param client - Client to use
* @param parameters - {@link SendRawTransactionParameters}
* @returns The transaction receipt. {@link SendRawTransactionSyncReturnType}
*
* @example
* import { createWalletClient, custom } from 'viem'
* import { mainnet } from 'viem/chains'
* import { sendRawTransactionSync } from 'viem/wallet'
*
* const client = createWalletClient({
*   chain: mainnet,
*   transport: custom(window.ethereum),
* })
*
* const receipt = await sendRawTransactionSync(client, {
*   serializedTransaction: '0x02f850018203118080825208808080c080a04012522854168b27e5dc3d5839bab5e6b39e1a0ffd343901ce1622e3d64b48f1a04e00902ae0502c4728cbf12156290df99c3ed7de85b1dbfe20b5c36931733a33'
* })
*/
async function sendRawTransactionSync(client, { serializedTransaction, throwOnReceiptRevert, timeout }) {
	const receipt = await client.request({
		method: "eth_sendRawTransactionSync",
		params: timeout ? [serializedTransaction, timeout] : [serializedTransaction]
	}, { retryCount: 0 });
	const formatted = (client.chain?.formatters?.transactionReceipt?.format || formatTransactionReceipt)(receipt);
	if (formatted.status === "reverted" && throwOnReceiptRevert) throw new TransactionReceiptRevertedError({ receipt: formatted });
	return formatted;
}
// ../../node_modules/viem/_esm/actions/token/getAllowance.js
/**
* Gets the ERC-20 allowance a spender has over an account's tokens.
*
* @example
* ```ts
* import { createClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { token } from 'viem/actions'
*
* const client = createClient({ chain: mainnet, transport: http() })
*
* const allowance = await token.getAllowance(client, {
*   account: '0x...',
*   spender: '0x...',
*   token: '0x...',
* })
* ```
*
* @param client - Client.
* @param parameters - Parameters.
* @returns The allowance, in base units and human-readable form.
*/
async function getAllowance(client, parameters) {
	const { account, decimals, spender, token, ...rest } = parameters;
	const [amount, { decimals: resolved }] = await Promise.all([readContract(client, {
		...rest,
		...getAllowance.call(client, {
			account,
			spender,
			token
		})
	}), resolveTokenWithDecimals(client, {
		decimals,
		token
	})]);
	return toAmount(amount, resolved);
}
(function(getAllowance) {
	/**
	* Defines a call to the `allowance` function.
	*
	* Can be passed as a parameter to `multicall`, `simulateContract`, or any
	* other action that accepts a contract call. The token is selected by `token`
	* symbol (resolved from the client's `tokens` array) or contract address.
	*
	* @param client - Client.
	* @param args - Arguments.
	* @returns The call.
	*/
	function call(client, args) {
		return defineCall({
			address: resolveToken(client, args).address,
			abi: erc20Abi,
			functionName: "allowance",
			args: [args.account, args.spender]
		});
	}
	Object.defineProperty(getAllowance, "call", {
		configurable: true,
		enumerable: true,
		value: call,
		writable: true
	});
})(getAllowance || (getAllowance = {}));
// ../../node_modules/viem/_esm/actions/token/getBalance.js
/**
* Gets the ERC-20 token balance of an account.
*
* @example
* ```ts
* import { createClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { token } from 'viem/actions'
*
* const client = createClient({ chain: mainnet, transport: http() })
*
* const balance = await token.getBalance(client, {
*   account: '0x...',
*   token: '0x...',
* })
* ```
*
* @param client - Client.
* @param parameters - Parameters.
* @returns The token balance, in base units and human-readable form.
*/
async function getBalance(client, parameters) {
	const { account: account_ = client.account, decimals, token, ...rest } = parameters;
	if (!account_) throw new AccountNotFoundError();
	const account = parseAccount(account_).address;
	const [amount, { decimals: resolved }] = await Promise.all([readContract(client, {
		...rest,
		...getBalance.call(client, {
			account,
			token
		})
	}), resolveTokenWithDecimals(client, {
		decimals,
		token
	})]);
	return toAmount(amount, resolved);
}
(function(getBalance) {
	/**
	* Defines a call to the `balanceOf` function.
	*
	* Can be passed as a parameter to `multicall`, `simulateContract`, or any
	* other action that accepts a contract call. The token is selected by `token`
	* symbol (resolved from the client's `tokens` array) or contract address.
	*
	* @param client - Client.
	* @param args - Arguments.
	* @returns The call.
	*/
	function call(client, args) {
		const account_ = args.account ?? client.account;
		if (!account_) throw new AccountNotFoundError();
		const account = parseAccount(account_).address;
		return defineCall({
			address: resolveToken(client, args).address,
			abi: erc20Abi,
			functionName: "balanceOf",
			args: [account]
		});
	}
	Object.defineProperty(getBalance, "call", {
		configurable: true,
		enumerable: true,
		value: call,
		writable: true
	});
})(getBalance || (getBalance = {}));
// ../../node_modules/viem/_esm/actions/token/getMetadata.js
/**
* Gets the metadata (`decimals`, `name`, `symbol`) of an ERC-20 token.
*
* Fields declared on the Client's `tokens` array are used as-is; any missing
* field is fetched from the token contract.
*
* @example
* ```ts
* import { createClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { token } from 'viem/actions'
*
* const client = createClient({ chain: mainnet, transport: http() })
*
* const metadata = await token.getMetadata(client, {
*   token: '0x...',
* })
* ```
*
* @param client - Client.
* @param parameters - Parameters.
* @returns The token metadata (`decimals`, `name`, `symbol`).
*/
async function getMetadata(client, parameters) {
	const { token, ...rest } = parameters;
	const { address } = resolveToken(client, { token });
	const declared = findDeclaredToken(client, token);
	const [decimals_, name, symbol] = await Promise.all([
		declared?.decimals ?? readContract(client, {
			...rest,
			abi: erc20Abi,
			address,
			functionName: "decimals"
		}),
		declared?.name ?? readContract(client, {
			...rest,
			abi: erc20Abi,
			address,
			functionName: "name"
		}),
		declared?.symbol ?? readContract(client, {
			...rest,
			abi: erc20Abi,
			address,
			functionName: "symbol"
		})
	]);
	return {
		decimals: decimals_,
		name,
		symbol
	};
}
// ../../node_modules/viem/_esm/actions/token/getTotalSupply.js
/**
* Gets the total supply of an ERC-20 token.
*
* @example
* ```ts
* import { createClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
* import { token } from 'viem/actions'
*
* const client = createClient({ chain: mainnet, transport: http() })
*
* const totalSupply = await token.getTotalSupply(client, {
*   token: '0x...',
* })
* ```
*
* @param client - Client.
* @param parameters - Parameters.
* @returns The token total supply, in base units and human-readable form.
*/
async function getTotalSupply(client, parameters) {
	const { decimals, token, ...rest } = parameters;
	const [amount, { decimals: resolved }] = await Promise.all([readContract(client, {
		...rest,
		...getTotalSupply.call(client, { token })
	}), resolveTokenWithDecimals(client, {
		decimals,
		token
	})]);
	return toAmount(amount, resolved);
}
(function(getTotalSupply) {
	/**
	* Defines a call to the `totalSupply` function.
	*
	* Can be passed as a parameter to `multicall`, `simulateContract`, or any
	* other action that accepts a contract call. The token is selected by `token`
	* symbol (resolved from the client's `tokens` array) or contract address.
	*
	* @param client - Client.
	* @param args - Arguments.
	* @returns The call.
	*/
	function call(client, args) {
		return defineCall({
			address: resolveToken(client, args).address,
			abi: erc20Abi,
			args: [],
			functionName: "totalSupply"
		});
	}
	Object.defineProperty(getTotalSupply, "call", {
		configurable: true,
		enumerable: true,
		value: call,
		writable: true
	});
})(getTotalSupply || (getTotalSupply = {}));
// ../../node_modules/viem/_esm/clients/decorators/public.js
function publicActions(client) {
	return {
		call: (args) => call(client, args),
		createAccessList: (args) => createAccessList(client, args),
		createBlockFilter: () => createBlockFilter(client),
		createContractEventFilter: (args) => createContractEventFilter(client, args),
		createEventFilter: (args) => createEventFilter(client, args),
		createPendingTransactionFilter: () => createPendingTransactionFilter(client),
		estimateContractGas: (args) => estimateContractGas(client, args),
		estimateGas: (args) => estimateGas(client, args),
		getBalance: (args) => getBalance$1(client, args),
		getBlobBaseFee: () => getBlobBaseFee(client),
		getBlock: (args) => getBlock(client, args),
		getBlockNumber: (args) => getBlockNumber(client, args),
		getBlockReceipts: (args) => getBlockReceipts(client, args),
		getBlockTransactionCount: (args) => getBlockTransactionCount(client, args),
		getBytecode: (args) => getCode(client, args),
		getChainId: () => getChainId(client),
		getCode: (args) => getCode(client, args),
		getContractEvents: (args) => getContractEvents(client, args),
		getDelegation: (args) => getDelegation(client, args),
		getEip712Domain: (args) => getEip712Domain(client, args),
		getEnsAddress: (args) => getEnsAddress(client, args),
		getEnsAvatar: (args) => getEnsAvatar(client, args),
		getEnsName: (args) => getEnsName(client, args),
		getEnsResolver: (args) => getEnsResolver(client, args),
		getEnsText: (args) => getEnsText(client, args),
		getFeeHistory: (args) => getFeeHistory(client, args),
		estimateFeesPerGas: (args) => estimateFeesPerGas(client, args),
		getFilterChanges: (args) => getFilterChanges(client, args),
		getFilterLogs: (args) => getFilterLogs(client, args),
		getGasPrice: () => getGasPrice(client),
		getLogs: (args) => getLogs(client, args),
		getProof: (args) => getProof(client, args),
		estimateMaxPriorityFeePerGas: (args) => estimateMaxPriorityFeePerGas(client, args),
		fillTransaction: (args) => fillTransaction(client, args),
		getRawTransaction: (args) => getRawTransaction(client, args),
		getStorageAt: (args) => getStorageAt(client, args),
		getStorageValues: (args) => getStorageValues(client, args),
		getTransaction: (args) => getTransaction(client, args),
		getTransactionConfirmations: (args) => getTransactionConfirmations(client, args),
		getTransactionCount: (args) => getTransactionCount(client, args),
		getTransactionReceipt: (args) => getTransactionReceipt(client, args),
		multicall: (args) => multicall(client, args),
		prepareTransactionRequest: (args) => prepareTransactionRequest(client, args),
		readContract: (args) => readContract(client, args),
		sendRawTransaction: (args) => sendRawTransaction(client, args),
		sendRawTransactionSync: (args) => sendRawTransactionSync(client, args),
		simulate: (args) => simulateBlocks(client, args),
		simulateBlocks: (args) => simulateBlocks(client, args),
		simulateCalls: (args) => simulateCalls(client, args),
		simulateContract: (args) => simulateContract(client, args),
		verifyHash: (args) => verifyHash(client, args),
		verifyMessage: (args) => verifyMessage(client, args),
		verifySiweMessage: (args) => verifySiweMessage(client, args),
		verifyTypedData: (args) => verifyTypedData(client, args),
		uninstallFilter: (args) => uninstallFilter(client, args),
		waitForTransactionReceipt: (args) => waitForTransactionReceipt(client, args),
		watchBlockHeaders: (args) => watchBlockHeaders(client, args),
		watchBlocks: (args) => watchBlocks(client, args),
		watchBlockNumber: (args) => watchBlockNumber(client, args),
		watchContractEvent: (args) => watchContractEvent(client, args),
		watchEvent: (args) => watchEvent(client, args),
		watchPendingTransactions: (args) => watchPendingTransactions(client, args),
		token: bindPublicToken(client)
	};
}
/**
* Binds the read-only ERC-20 actions (and their `.call` helpers) to `client`.
* Merged with the write actions from {@link walletActions} (when present) by the
* Client's `extend`, which shallow-merges conflicting plain-object namespaces.
* @internal
*/
function bindPublicToken(client) {
	return {
		getAllowance: bindActionDecorators(client, getAllowance),
		getBalance: bindActionDecorators(client, getBalance),
		getMetadata: bindActionDecorators(client, getMetadata),
		getTotalSupply: bindActionDecorators(client, getTotalSupply)
	};
}
// ../../node_modules/viem/_esm/clients/createPublicClient.js
/**
* Creates a Public Client with a given [Transport](https://viem.sh/docs/clients/intro) configured for a [Chain](https://viem.sh/docs/clients/chains).
*
* - Docs: https://viem.sh/docs/clients/public
*
* A Public Client is an interface to "public" [JSON-RPC API](https://ethereum.org/en/developers/docs/apis/json-rpc/) methods such as retrieving block numbers, transactions, reading from smart contracts, etc through [Public Actions](/docs/actions/public/introduction).
*
* @param config - {@link PublicClientConfig}
* @returns A Public Client. {@link PublicClient}
*
* @example
* import { createPublicClient, http } from 'viem'
* import { mainnet } from 'viem/chains'
*
* const client = createPublicClient({
*   chain: mainnet,
*   transport: http(),
* })
*/
function createPublicClient(parameters) {
	const { key = "public", name = "Public Client" } = parameters;
	return createClient({
		...parameters,
		key,
		name,
		type: "publicClient"
	}).extend(publicActions);
}
// ../../node_modules/viem/_esm/clients/transports/createTransport.js
/**
* @description Creates an transport intended to be used with a client.
*/
function createTransport({ key, methods, name, request, retryCount = 3, retryDelay = 150, timeout, type }, value) {
	const uid$1 = uid();
	return {
		config: {
			key,
			methods,
			name,
			request,
			retryCount,
			retryDelay,
			timeout,
			type
		},
		request: buildRequest(request, {
			methods,
			retryCount,
			retryDelay,
			uid: uid$1
		}),
		value
	};
}
// ../../node_modules/viem/_esm/errors/transport.js
var UrlRequiredError = class extends BaseError$2 {
	constructor() {
		super("No URL was provided to the Transport. Please provide a valid RPC URL to the Transport.", {
			docsPath: "/docs/clients/intro",
			name: "UrlRequiredError"
		});
	}
};
// ../../node_modules/viem/_esm/clients/transports/http.js
var signalId = 0;
var signalIds = /* @__PURE__ */ new WeakMap();
function getSignalId(signal) {
	if (!signal) return "default";
	const id = signalIds.get(signal);
	if (id !== void 0) return id;
	const nextId = signalId++;
	signalIds.set(signal, nextId);
	return nextId;
}
/**
* @description Creates a HTTP transport that connects to a JSON-RPC API.
*/
function http(url, config = {}) {
	const { batch, fetchFn, fetchOptions, key = "http", maxResponseBodySize, methods, name = "HTTP JSON-RPC", onFetchRequest, onFetchResponse, retryDelay, raw } = config;
	return ({ chain, retryCount: retryCount_, timeout: timeout_ }) => {
		const { batchSize = 1e3, wait = 0 } = typeof batch === "object" ? batch : {};
		const retryCount = config.retryCount ?? retryCount_;
		const timeout = timeout_ ?? config.timeout ?? 1e4;
		const url_ = url || chain?.rpcUrls.default.http[0];
		if (!url_) throw new UrlRequiredError();
		const rpcClient = getHttpRpcClient(url_, {
			fetchFn,
			fetchOptions,
			maxResponseBodySize,
			onRequest: onFetchRequest,
			onResponse: onFetchResponse,
			timeout
		});
		return createTransport({
			key,
			methods,
			name,
			async request({ method, params }, options) {
				const body = {
					method,
					params
				};
				const fetchOptions = options?.signal ? { signal: options.signal } : void 0;
				const { schedule } = createBatchScheduler({
					id: `${url_}.${getSignalId(options?.signal)}`,
					wait,
					shouldSplitBatch(requests) {
						return requests.length > batchSize;
					},
					fn: (body) => rpcClient.request({
						body,
						fetchOptions
					}),
					sort: (a, b) => a.id - b.id
				});
				const fn = async (body) => batch ? schedule(body) : [await rpcClient.request({
					body,
					fetchOptions
				})];
				const [{ error, result }] = await fn(body).catch((err) => {
					if (raw && err instanceof RpcRequestError) return [{
						error: err.cause,
						result: void 0
					}];
					throw err;
				});
				if (raw) return {
					error,
					result
				};
				if (error) throw new RpcRequestError({
					body,
					error,
					url: url_
				});
				return result;
			},
			retryCount,
			retryDelay,
			timeout,
			type: "http"
		}, {
			fetchOptions,
			url: url_
		});
	};
}
// api/_manifests.ts
var manifestTexts = Object.values(["{\n  \"version\": 2,\n  \"root\": \"0x041b0ec5a5236a13eeb50970a73178941f723f2d40c65f729007f18743d5bd0e\",\n  \"totalChunks\": 4,\n  \"totalBytes\": 39415,\n  \"files\": [\n    {\n      \"path\": \"assets/index-BNGgKh-G.js\",\n      \"size\": 36211,\n      \"sha256\": \"0x17158e62d1fcd2e85183b6ef5e50bef66e7c3698bded177451a617451db067d5\",\n      \"contentType\": \"text/javascript; charset=utf-8\",\n      \"chunks\": [\n        {\n          \"index\": 0,\n          \"size\": 24000,\n          \"sha256\": \"0x3176f7dc2e484d0ab8509a2594e57436952fea4b89970e5bb52b8e09bba4dfa7\",\n          \"leaf\": \"0x8a18a9df467229dacebd906d8b28a19d3473381c0f906c2982bb757338de4196\",\n          \"proof\": [\n            \"0x5f3310c3a9a2e21763fd4522269463c107f803f2e750363b995194f02675cf6f\",\n            \"0x5333c36294d27ccf8dbde220c4b23b12871d9955b1d8b507c96a9f4f5f9b74ad\"\n          ]\n        },\n        {\n          \"index\": 1,\n          \"size\": 12211,\n          \"sha256\": \"0x9a68446570ec400fe3c507e73dcfecede006446b2884ababc5d12f4e1c6b85ab\",\n          \"leaf\": \"0x5f3310c3a9a2e21763fd4522269463c107f803f2e750363b995194f02675cf6f\",\n          \"proof\": [\n            \"0x8a18a9df467229dacebd906d8b28a19d3473381c0f906c2982bb757338de4196\",\n            \"0x5333c36294d27ccf8dbde220c4b23b12871d9955b1d8b507c96a9f4f5f9b74ad\"\n          ]\n        }\n      ]\n    },\n    {\n      \"path\": \"assets/index-CuJ_pYa4.css\",\n      \"size\": 1596,\n      \"sha256\": \"0xf64399e50bf6569e0fb5ddaaa294a6504a957332cd96dbf10920fe2306f3186f\",\n      \"contentType\": \"text/css; charset=utf-8\",\n      \"chunks\": [\n        {\n          \"index\": 0,\n          \"size\": 1596,\n          \"sha256\": \"0xf64399e50bf6569e0fb5ddaaa294a6504a957332cd96dbf10920fe2306f3186f\",\n          \"leaf\": \"0x7eabff165abcef24a2a5fd9529902a284018790892821b1e043a0f4ffed8ba91\",\n          \"proof\": [\n            \"0x0b1c5adc9f12997d36c4df3460384a6087861463e17c6066520652cf4460b91f\",\n            \"0xb69fcf2b9c8af199c44f1e0d92b3850f5793260a383a399cfb1e5f2abfd0d69e\"\n          ]\n        }\n      ]\n    },\n    {\n      \"path\": \"index.html\",\n      \"size\": 1608,\n      \"sha256\": \"0x8290627461063fe8e6e7ea9fbbe6f6c5e4ef91e2d58efb9fee57f7f32c8531bf\",\n      \"contentType\": \"text/html; charset=utf-8\",\n      \"chunks\": [\n        {\n          \"index\": 0,\n          \"size\": 1608,\n          \"sha256\": \"0x8290627461063fe8e6e7ea9fbbe6f6c5e4ef91e2d58efb9fee57f7f32c8531bf\",\n          \"leaf\": \"0x0b1c5adc9f12997d36c4df3460384a6087861463e17c6066520652cf4460b91f\",\n          \"proof\": [\n            \"0x7eabff165abcef24a2a5fd9529902a284018790892821b1e043a0f4ffed8ba91\",\n            \"0xb69fcf2b9c8af199c44f1e0d92b3850f5793260a383a399cfb1e5f2abfd0d69e\"\n          ]\n        }\n      ]\n    }\n  ]\n}\n", "{\n  \"version\": 2,\n  \"root\": \"0x352185e470f5e23d9e536807e175e7128130e1a174b60cb8d457b68c16c73d58\",\n  \"totalChunks\": 4,\n  \"totalBytes\": 39415,\n  \"files\": [\n    {\n      \"path\": \"assets/index-CuJ_pYa4.css\",\n      \"size\": 1596,\n      \"sha256\": \"0xf64399e50bf6569e0fb5ddaaa294a6504a957332cd96dbf10920fe2306f3186f\",\n      \"contentType\": \"text/css; charset=utf-8\",\n      \"chunks\": [\n        {\n          \"index\": 0,\n          \"size\": 1596,\n          \"sha256\": \"0xf64399e50bf6569e0fb5ddaaa294a6504a957332cd96dbf10920fe2306f3186f\",\n          \"leaf\": \"0x7eabff165abcef24a2a5fd9529902a284018790892821b1e043a0f4ffed8ba91\",\n          \"proof\": [\n            \"0xd0d7d8106561c3acbcd51b5d5e9561d755dd1f8d261b74743775c7af6556f2ee\",\n            \"0x95933a7e7de0706684faef7a65ac692f9957c18e1ca93cfa93c0985aa9a3436c\"\n          ]\n        }\n      ]\n    },\n    {\n      \"path\": \"assets/index-CxvcAB4J.js\",\n      \"size\": 36211,\n      \"sha256\": \"0xda7b091f6be084e6b0d00bcf98d86199ac5bd75abb7a6ae1b35a213371c04ee4\",\n      \"contentType\": \"text/javascript; charset=utf-8\",\n      \"chunks\": [\n        {\n          \"index\": 0,\n          \"size\": 24000,\n          \"sha256\": \"0x3176f7dc2e484d0ab8509a2594e57436952fea4b89970e5bb52b8e09bba4dfa7\",\n          \"leaf\": \"0xd0d7d8106561c3acbcd51b5d5e9561d755dd1f8d261b74743775c7af6556f2ee\",\n          \"proof\": [\n            \"0x7eabff165abcef24a2a5fd9529902a284018790892821b1e043a0f4ffed8ba91\",\n            \"0x95933a7e7de0706684faef7a65ac692f9957c18e1ca93cfa93c0985aa9a3436c\"\n          ]\n        },\n        {\n          \"index\": 1,\n          \"size\": 12211,\n          \"sha256\": \"0x92f2b25f55ab674eaa6fb5f2b9f3b8c709d622a73a25f6af094946fc9bd9ebd5\",\n          \"leaf\": \"0xa70c08bb5c90f9fd2ff2b45cd60e7527f34c8d91257946db7d025fc507c3f5db\",\n          \"proof\": [\n            \"0x251fc94629a719f2cf350644f35d1c4909913b71964af7713196d9300d78f471\",\n            \"0xdb484feb62b066884a40af3bafb5afb1d09756103fddd3a0b0bd92d9354e2462\"\n          ]\n        }\n      ]\n    },\n    {\n      \"path\": \"index.html\",\n      \"size\": 1608,\n      \"sha256\": \"0x78c006ded8c1338d5ea300d85db1cd3e39a2620dfcfe7d13872a52a3d5319732\",\n      \"contentType\": \"text/html; charset=utf-8\",\n      \"chunks\": [\n        {\n          \"index\": 0,\n          \"size\": 1608,\n          \"sha256\": \"0x78c006ded8c1338d5ea300d85db1cd3e39a2620dfcfe7d13872a52a3d5319732\",\n          \"leaf\": \"0x251fc94629a719f2cf350644f35d1c4909913b71964af7713196d9300d78f471\",\n          \"proof\": [\n            \"0xa70c08bb5c90f9fd2ff2b45cd60e7527f34c8d91257946db7d025fc507c3f5db\",\n            \"0xdb484feb62b066884a40af3bafb5afb1d09756103fddd3a0b0bd92d9354e2462\"\n          ]\n        }\n      ]\n    }\n  ]\n}\n"]);
// ../../packages/cli/src/abi.ts
var releaseGateAbi = [
	{
		"type": "constructor",
		"inputs": [
			{
				"name": "processor_",
				"type": "address",
				"internalType": "contract ITapeOutProcessor"
			},
			{
				"name": "policyId_",
				"type": "uint256",
				"internalType": "uint256"
			},
			{
				"name": "registry_",
				"type": "address",
				"internalType": "contract ISiteRegistry"
			},
			{
				"name": "container_",
				"type": "address",
				"internalType": "address"
			},
			{
				"name": "maintainers_",
				"type": "address[3]",
				"internalType": "address[3]"
			},
			{
				"name": "uploader_",
				"type": "address",
				"internalType": "address"
			},
			{
				"name": "reporter_",
				"type": "address",
				"internalType": "address"
			},
			{
				"name": "hub_",
				"type": "address",
				"internalType": "contract ITapeSendHub"
			},
			{
				"name": "timelock_",
				"type": "uint64",
				"internalType": "uint64"
			}
		],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "ALERT_DNS_CHANGED",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "uint8",
			"internalType": "uint8"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "ALERT_MISMATCH",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "uint8",
			"internalType": "uint8"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "ALERT_RESOLVED",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "uint8",
			"internalType": "uint8"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "ALERT_SEND_GAS",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "MAX_ALERT_RECIPIENTS",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "activate",
		"inputs": [{
			"name": "id",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "alert",
		"inputs": [
			{
				"name": "kind",
				"type": "uint8",
				"internalType": "uint8"
			},
			{
				"name": "observed",
				"type": "bytes32",
				"internalType": "bytes32"
			},
			{
				"name": "to",
				"type": "bytes32[]",
				"internalType": "bytes32[]"
			}
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "alertPayload",
		"inputs": [{
			"name": "kind",
			"type": "uint8",
			"internalType": "uint8"
		}, {
			"name": "observed",
			"type": "bytes32",
			"internalType": "bytes32"
		}],
		"outputs": [{
			"name": "",
			"type": "bytes",
			"internalType": "bytes"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "approvalCount",
		"inputs": [{
			"name": "id",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"outputs": [{
			"name": "",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "approve",
		"inputs": [
			{
				"name": "id",
				"type": "uint256",
				"internalType": "uint256"
			},
			{
				"name": "root",
				"type": "bytes32",
				"internalType": "bytes32"
			},
			{
				"name": "totalChunks",
				"type": "uint32",
				"internalType": "uint32"
			}
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "cancel",
		"inputs": [{
			"name": "id",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "chunkWritten",
		"inputs": [{
			"name": "id",
			"type": "uint256",
			"internalType": "uint256"
		}, {
			"name": "leaf",
			"type": "bytes32",
			"internalType": "bytes32"
		}],
		"outputs": [{
			"name": "",
			"type": "bool",
			"internalType": "bool"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "container",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "address",
			"internalType": "address"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "epoch",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "uint32",
			"internalType": "uint32"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "freeze",
		"inputs": [],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "frozen",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "bool",
			"internalType": "bool"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "hub",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "address",
			"internalType": "contract ITapeSendHub"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "lastAlert",
		"inputs": [],
		"outputs": [
			{
				"name": "kind",
				"type": "uint8",
				"internalType": "uint8"
			},
			{
				"name": "at",
				"type": "uint64",
				"internalType": "uint64"
			},
			{
				"name": "release",
				"type": "uint64",
				"internalType": "uint64"
			},
			{
				"name": "observed",
				"type": "bytes32",
				"internalType": "bytes32"
			}
		],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "leaf",
		"inputs": [
			{
				"name": "relPath",
				"type": "string",
				"internalType": "string"
			},
			{
				"name": "contentType",
				"type": "string",
				"internalType": "string"
			},
			{
				"name": "fileSha256",
				"type": "bytes32",
				"internalType": "bytes32"
			},
			{
				"name": "index",
				"type": "uint256",
				"internalType": "uint256"
			},
			{
				"name": "chunkSha256",
				"type": "bytes32",
				"internalType": "bytes32"
			}
		],
		"outputs": [{
			"name": "",
			"type": "bytes32",
			"internalType": "bytes32"
		}],
		"stateMutability": "pure"
	},
	{
		"type": "function",
		"name": "liveRelease",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "maintainers",
		"inputs": [{
			"name": "",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"outputs": [{
			"name": "",
			"type": "address",
			"internalType": "address"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "migrated",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "bool",
			"internalType": "bool"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "onERC721Received",
		"inputs": [
			{
				"name": "",
				"type": "address",
				"internalType": "address"
			},
			{
				"name": "",
				"type": "address",
				"internalType": "address"
			},
			{
				"name": "",
				"type": "uint256",
				"internalType": "uint256"
			},
			{
				"name": "",
				"type": "bytes",
				"internalType": "bytes"
			}
		],
		"outputs": [{
			"name": "",
			"type": "bytes4",
			"internalType": "bytes4"
		}],
		"stateMutability": "pure"
	},
	{
		"type": "function",
		"name": "policyBits",
		"inputs": [{
			"name": "id",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"outputs": [{
			"name": "bits",
			"type": "uint8",
			"internalType": "uint8"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "policyId",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "processor",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "address",
			"internalType": "contract ITapeOutProcessor"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "propose",
		"inputs": [{
			"name": "root",
			"type": "bytes32",
			"internalType": "bytes32"
		}, {
			"name": "totalChunks",
			"type": "uint32",
			"internalType": "uint32"
		}],
		"outputs": [{
			"name": "id",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "registry",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "address",
			"internalType": "contract ISiteRegistry"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "releaseCount",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "releases",
		"inputs": [{
			"name": "id",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"outputs": [
			{
				"name": "root",
				"type": "bytes32",
				"internalType": "bytes32"
			},
			{
				"name": "proposedAt",
				"type": "uint64",
				"internalType": "uint64"
			},
			{
				"name": "sealedAt",
				"type": "uint64",
				"internalType": "uint64"
			},
			{
				"name": "totalChunks",
				"type": "uint32",
				"internalType": "uint32"
			},
			{
				"name": "uploadedChunks",
				"type": "uint32",
				"internalType": "uint32"
			},
			{
				"name": "epoch",
				"type": "uint32",
				"internalType": "uint32"
			},
			{
				"name": "approvals",
				"type": "uint8",
				"internalType": "uint8"
			},
			{
				"name": "cancelled",
				"type": "bool",
				"internalType": "bool"
			},
			{
				"name": "activated",
				"type": "bool",
				"internalType": "bool"
			}
		],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "reporter",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "address",
			"internalType": "address"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "rootHtml",
		"inputs": [{
			"name": "id",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"outputs": [{
			"name": "",
			"type": "bytes",
			"internalType": "bytes"
		}],
		"stateMutability": "pure"
	},
	{
		"type": "function",
		"name": "seal",
		"inputs": [{
			"name": "id",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "timelock",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "uint64",
			"internalType": "uint64"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "uploader",
		"inputs": [],
		"outputs": [{
			"name": "",
			"type": "address",
			"internalType": "address"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "voteMigrate",
		"inputs": [{
			"name": "to",
			"type": "address",
			"internalType": "address"
		}],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "voteReplaceMaintainer",
		"inputs": [{
			"name": "slot",
			"type": "uint8",
			"internalType": "uint8"
		}, {
			"name": "next",
			"type": "address",
			"internalType": "address"
		}],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "voteSetReporter",
		"inputs": [{
			"name": "next",
			"type": "address",
			"internalType": "address"
		}],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "voteSetUploader",
		"inputs": [{
			"name": "next",
			"type": "address",
			"internalType": "address"
		}],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "voteUnfreeze",
		"inputs": [],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "votes",
		"inputs": [{
			"name": "epoch",
			"type": "uint32",
			"internalType": "uint32"
		}, {
			"name": "action",
			"type": "bytes32",
			"internalType": "bytes32"
		}],
		"outputs": [{
			"name": "",
			"type": "uint8",
			"internalType": "uint8"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "wouldAllow",
		"inputs": [{
			"name": "id",
			"type": "uint256",
			"internalType": "uint256"
		}],
		"outputs": [{
			"name": "",
			"type": "bool",
			"internalType": "bool"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "writeChunk",
		"inputs": [{
			"name": "id",
			"type": "uint256",
			"internalType": "uint256"
		}, {
			"name": "c",
			"type": "tuple",
			"internalType": "struct ReleaseGate.Chunk",
			"components": [
				{
					"name": "path",
					"type": "string",
					"internalType": "string"
				},
				{
					"name": "contentType",
					"type": "string",
					"internalType": "string"
				},
				{
					"name": "fileSha256",
					"type": "bytes32",
					"internalType": "bytes32"
				},
				{
					"name": "index",
					"type": "uint256",
					"internalType": "uint256"
				},
				{
					"name": "data",
					"type": "bytes",
					"internalType": "bytes"
				},
				{
					"name": "proof",
					"type": "bytes32[]",
					"internalType": "bytes32[]"
				}
			]
		}],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "event",
		"name": "Activated",
		"inputs": [
			{
				"name": "id",
				"type": "uint256",
				"indexed": true,
				"internalType": "uint256"
			},
			{
				"name": "root",
				"type": "bytes32",
				"indexed": false,
				"internalType": "bytes32"
			},
			{
				"name": "policyBits",
				"type": "uint8",
				"indexed": false,
				"internalType": "uint8"
			}
		],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "Alert",
		"inputs": [
			{
				"name": "kind",
				"type": "uint8",
				"indexed": true,
				"internalType": "uint8"
			},
			{
				"name": "observed",
				"type": "bytes32",
				"indexed": false,
				"internalType": "bytes32"
			},
			{
				"name": "liveRelease",
				"type": "uint256",
				"indexed": false,
				"internalType": "uint256"
			},
			{
				"name": "delivered",
				"type": "uint256",
				"indexed": false,
				"internalType": "uint256"
			},
			{
				"name": "failed",
				"type": "uint256",
				"indexed": false,
				"internalType": "uint256"
			}
		],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "Approved",
		"inputs": [
			{
				"name": "id",
				"type": "uint256",
				"indexed": true,
				"internalType": "uint256"
			},
			{
				"name": "maintainer",
				"type": "address",
				"indexed": true,
				"internalType": "address"
			},
			{
				"name": "root",
				"type": "bytes32",
				"indexed": false,
				"internalType": "bytes32"
			}
		],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "Cancelled",
		"inputs": [{
			"name": "id",
			"type": "uint256",
			"indexed": true,
			"internalType": "uint256"
		}, {
			"name": "by",
			"type": "address",
			"indexed": true,
			"internalType": "address"
		}],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "ChunkWritten",
		"inputs": [
			{
				"name": "id",
				"type": "uint256",
				"indexed": true,
				"internalType": "uint256"
			},
			{
				"name": "path",
				"type": "string",
				"indexed": false,
				"internalType": "string"
			},
			{
				"name": "index",
				"type": "uint256",
				"indexed": false,
				"internalType": "uint256"
			}
		],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "Frozen",
		"inputs": [{
			"name": "by",
			"type": "address",
			"indexed": true,
			"internalType": "address"
		}],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "MaintainerReplaced",
		"inputs": [
			{
				"name": "slot",
				"type": "uint8",
				"indexed": true,
				"internalType": "uint8"
			},
			{
				"name": "previous",
				"type": "address",
				"indexed": false,
				"internalType": "address"
			},
			{
				"name": "next",
				"type": "address",
				"indexed": false,
				"internalType": "address"
			},
			{
				"name": "epoch",
				"type": "uint32",
				"indexed": false,
				"internalType": "uint32"
			}
		],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "Proposed",
		"inputs": [
			{
				"name": "id",
				"type": "uint256",
				"indexed": true,
				"internalType": "uint256"
			},
			{
				"name": "root",
				"type": "bytes32",
				"indexed": false,
				"internalType": "bytes32"
			},
			{
				"name": "totalChunks",
				"type": "uint32",
				"indexed": false,
				"internalType": "uint32"
			}
		],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "ReporterChanged",
		"inputs": [{
			"name": "reporter",
			"type": "address",
			"indexed": false,
			"internalType": "address"
		}],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "Sealed",
		"inputs": [{
			"name": "id",
			"type": "uint256",
			"indexed": true,
			"internalType": "uint256"
		}],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "SiteMigrated",
		"inputs": [{
			"name": "to",
			"type": "address",
			"indexed": false,
			"internalType": "address"
		}],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "Unfrozen",
		"inputs": [],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "UploaderChanged",
		"inputs": [{
			"name": "uploader",
			"type": "address",
			"indexed": false,
			"internalType": "address"
		}],
		"anonymous": false
	},
	{
		"type": "event",
		"name": "Voted",
		"inputs": [
			{
				"name": "action",
				"type": "bytes32",
				"indexed": true,
				"internalType": "bytes32"
			},
			{
				"name": "maintainer",
				"type": "address",
				"indexed": true,
				"internalType": "address"
			},
			{
				"name": "votes",
				"type": "uint8",
				"indexed": false,
				"internalType": "uint8"
			}
		],
		"anonymous": false
	},
	{
		"type": "error",
		"name": "AlertGas",
		"inputs": []
	},
	{
		"type": "error",
		"name": "AlreadyLive",
		"inputs": []
	},
	{
		"type": "error",
		"name": "AlreadyMaintainer",
		"inputs": []
	},
	{
		"type": "error",
		"name": "AlreadySealed",
		"inputs": []
	},
	{
		"type": "error",
		"name": "BadAlert",
		"inputs": []
	},
	{
		"type": "error",
		"name": "BadPath",
		"inputs": []
	},
	{
		"type": "error",
		"name": "BadProof",
		"inputs": []
	},
	{
		"type": "error",
		"name": "BadSlot",
		"inputs": []
	},
	{
		"type": "error",
		"name": "ChunkAlreadyWritten",
		"inputs": []
	},
	{
		"type": "error",
		"name": "Incomplete",
		"inputs": [{
			"name": "uploaded",
			"type": "uint32",
			"internalType": "uint32"
		}, {
			"name": "total",
			"type": "uint32",
			"internalType": "uint32"
		}]
	},
	{
		"type": "error",
		"name": "NotEnoughApprovals",
		"inputs": []
	},
	{
		"type": "error",
		"name": "NotMaintainer",
		"inputs": []
	},
	{
		"type": "error",
		"name": "NotNewer",
		"inputs": []
	},
	{
		"type": "error",
		"name": "NotSealed",
		"inputs": []
	},
	{
		"type": "error",
		"name": "NotUploader",
		"inputs": []
	},
	{
		"type": "error",
		"name": "PolicyRejected",
		"inputs": [{
			"name": "bits",
			"type": "uint8",
			"internalType": "uint8"
		}]
	},
	{
		"type": "error",
		"name": "ReleaseCancelled",
		"inputs": []
	},
	{
		"type": "error",
		"name": "SiteGone",
		"inputs": []
	},
	{
		"type": "error",
		"name": "UnknownRelease",
		"inputs": []
	},
	{
		"type": "error",
		"name": "WrongManifest",
		"inputs": []
	},
	{
		"type": "error",
		"name": "ZeroValue",
		"inputs": []
	}
];
var siteRegistryAbi = [
	{
		"type": "function",
		"name": "appendChunk",
		"inputs": [
			{
				"name": "container",
				"type": "address",
				"internalType": "address"
			},
			{
				"name": "path",
				"type": "string",
				"internalType": "string"
			},
			{
				"name": "expectIndex",
				"type": "uint256",
				"internalType": "uint256"
			},
			{
				"name": "data",
				"type": "bytes",
				"internalType": "bytes"
			}
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "fallbackPath",
		"inputs": [{
			"name": "container",
			"type": "address",
			"internalType": "address"
		}],
		"outputs": [{
			"name": "",
			"type": "string",
			"internalType": "string"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "fileInfo",
		"inputs": [{
			"name": "container",
			"type": "address",
			"internalType": "address"
		}, {
			"name": "path",
			"type": "string",
			"internalType": "string"
		}],
		"outputs": [
			{
				"name": "size",
				"type": "uint32",
				"internalType": "uint32"
			},
			{
				"name": "contentType",
				"type": "string",
				"internalType": "string"
			},
			{
				"name": "sha256Hash",
				"type": "bytes32",
				"internalType": "bytes32"
			},
			{
				"name": "updatedAt",
				"type": "uint40",
				"internalType": "uint40"
			},
			{
				"name": "chunkCount",
				"type": "uint256",
				"internalType": "uint256"
			}
		],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "putFile",
		"inputs": [
			{
				"name": "container",
				"type": "address",
				"internalType": "address"
			},
			{
				"name": "path",
				"type": "string",
				"internalType": "string"
			},
			{
				"name": "contentType",
				"type": "string",
				"internalType": "string"
			},
			{
				"name": "sha256Hash",
				"type": "bytes32",
				"internalType": "bytes32"
			},
			{
				"name": "data",
				"type": "bytes",
				"internalType": "bytes"
			}
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "readRange",
		"inputs": [
			{
				"name": "container",
				"type": "address",
				"internalType": "address"
			},
			{
				"name": "path",
				"type": "string",
				"internalType": "string"
			},
			{
				"name": "offset",
				"type": "uint256",
				"internalType": "uint256"
			},
			{
				"name": "len",
				"type": "uint256",
				"internalType": "uint256"
			}
		],
		"outputs": [{
			"name": "",
			"type": "bytes",
			"internalType": "bytes"
		}],
		"stateMutability": "view"
	},
	{
		"type": "function",
		"name": "removeFile",
		"inputs": [{
			"name": "container",
			"type": "address",
			"internalType": "address"
		}, {
			"name": "path",
			"type": "string",
			"internalType": "string"
		}],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "setFallback",
		"inputs": [{
			"name": "container",
			"type": "address",
			"internalType": "address"
		}, {
			"name": "path",
			"type": "string",
			"internalType": "string"
		}],
		"outputs": [],
		"stateMutability": "nonpayable"
	},
	{
		"type": "function",
		"name": "setOperator",
		"inputs": [
			{
				"name": "container",
				"type": "address",
				"internalType": "address"
			},
			{
				"name": "op",
				"type": "address",
				"internalType": "address"
			},
			{
				"name": "ttl",
				"type": "uint256",
				"internalType": "uint256"
			}
		],
		"outputs": [],
		"stateMutability": "nonpayable"
	}
];
// ../../node_modules/viem/_esm/chains/definitions/foundry.js
var foundry = /*#__PURE__*/ defineChain({
	id: 31337,
	name: "Foundry",
	nativeCurrency: {
		decimals: 18,
		name: "Ether",
		symbol: "ETH"
	},
	rpcUrls: { default: {
		http: ["http://127.0.0.1:8545"],
		webSocket: ["ws://127.0.0.1:8545"]
	} }
});
var NETWORKS = {
	xlayer: defineChain({
		id: 196,
		name: "X Layer",
		nativeCurrency: {
			name: "OKB",
			symbol: "OKB",
			decimals: 18
		},
		rpcUrls: { default: { http: ["https://rpc.xlayer.tech", "https://xlayerrpc.okx.com"] } },
		blockExplorers: { default: {
			name: "OKLink",
			url: "https://www.oklink.com/xlayer"
		} }
	}),
	"xlayer-testnet": defineChain({
		id: 1952,
		name: "X Layer Testnet",
		nativeCurrency: {
			name: "OKB",
			symbol: "OKB",
			decimals: 18
		},
		rpcUrls: { default: { http: ["https://testrpc.xlayer.tech/terigon", "https://xlayertestrpc.okx.com/terigon"] } },
		blockExplorers: { default: {
			name: "OKLink",
			url: "https://www.oklink.com/x-layer-testnet"
		} },
		testnet: true
	}),
	local: foundry
};
/** Errors caused by bad input; printed without a stack trace. */
var UsageError = class extends Error {
	name = "UsageError";
};
// ../../packages/cli/src/gate.ts
var stagedPath = (id, rel) => `releases/v${id}/${rel}`;
function approvalCount(mask) {
	return (mask & 1) + (mask >> 1 & 1) + (mask >> 2 & 1);
}
async function readGateInfo(ctx) {
	const code = await ctx.publicClient.getCode({ address: ctx.gate });
	if (!code || code === "0x") throw new UsageError(`no contract at ${ctx.gate} on ${ctx.chain.name}`);
	const contract = {
		address: ctx.gate,
		abi: releaseGateAbi
	};
	const pc = ctx.publicClient;
	const [registry, container, processor, policyId, timelock, frozen, releaseCount, liveRelease, uploader, m0, m1, m2, epoch, migrated] = await Promise.all([
		pc.readContract({
			...contract,
			functionName: "registry"
		}),
		pc.readContract({
			...contract,
			functionName: "container"
		}),
		pc.readContract({
			...contract,
			functionName: "processor"
		}),
		pc.readContract({
			...contract,
			functionName: "policyId"
		}),
		pc.readContract({
			...contract,
			functionName: "timelock"
		}),
		pc.readContract({
			...contract,
			functionName: "frozen"
		}),
		pc.readContract({
			...contract,
			functionName: "releaseCount"
		}),
		pc.readContract({
			...contract,
			functionName: "liveRelease"
		}),
		pc.readContract({
			...contract,
			functionName: "uploader"
		}),
		pc.readContract({
			...contract,
			functionName: "maintainers",
			args: [0n]
		}),
		pc.readContract({
			...contract,
			functionName: "maintainers",
			args: [1n]
		}),
		pc.readContract({
			...contract,
			functionName: "maintainers",
			args: [2n]
		}),
		pc.readContract({
			...contract,
			functionName: "epoch"
		}),
		pc.readContract({
			...contract,
			functionName: "migrated"
		})
	]);
	return {
		registry,
		container,
		processor,
		policyId,
		timelock,
		frozen,
		releaseCount,
		liveRelease,
		uploader,
		maintainers: [
			m0,
			m1,
			m2
		],
		epoch,
		migrated
	};
}
async function readRelease(ctx, id) {
	const contract = {
		address: ctx.gate,
		abi: releaseGateAbi
	};
	const [release, epoch] = await Promise.all([ctx.publicClient.readContract({
		...contract,
		functionName: "releases",
		args: [id]
	}), ctx.publicClient.readContract({
		...contract,
		functionName: "epoch"
	})]);
	const [root, proposedAt, sealedAt, totalChunks, uploadedChunks, releaseEpoch, rawApprovals, cancelled, activated] = release;
	if (proposedAt === 0n) throw new UsageError(`release ${id} does not exist on gate ${ctx.gate}`);
	const approvals = releaseEpoch === epoch ? rawApprovals : 0;
	return {
		id,
		root,
		proposedAt,
		sealedAt,
		totalChunks,
		uploadedChunks,
		approvals,
		approvalCount: approvalCount(approvals),
		cancelled,
		activated
	};
}
async function readFile(ctx, registry, container, fullPath) {
	const [size, , sha256, , chunkCount] = await ctx.publicClient.readContract({
		address: registry,
		abi: siteRegistryAbi,
		functionName: "fileInfo",
		args: [container, fullPath]
	});
	return {
		size,
		sha256,
		chunkCount: Number(chunkCount)
	};
}
// ../../packages/cli/src/merkle.ts
var LEAF_PARAMS = [
	{ type: "string" },
	{ type: "string" },
	{ type: "bytes32" },
	{ type: "uint256" },
	{ type: "bytes32" }
];
/**
* Leaf hash for one chunk. Must match `ReleaseGate.leaf(path, contentType, fileSha256, index, chunkSha256)`:
*   keccak256(bytes.concat(keccak256(abi.encode(path, contentType, fileSha256, index, chunkSha256))))
* Double hashing keeps leaves distinct from 64-byte internal nodes.
*/
function leafHash(c) {
	const inner = keccak256$1(encodeAbiParameters(LEAF_PARAMS, [
		c.path,
		c.contentType,
		c.fileSha256,
		BigInt(c.index),
		c.chunkSha256
	]));
	return keccak256$1(inner);
}
/** Sorted-pair hash, identical to `ReleaseGate._verify` (abi.encode of two bytes32 == concatenation). */
function hashPair(a, b) {
	return BigInt(a) < BigInt(b) ? keccak256$1(concatHex([a, b])) : keccak256$1(concatHex([b, a]));
}
/**
* Builds a sorted-pair Merkle tree. An unpaired node at the end of a level is
* carried up unchanged, so every proof is just the list of siblings that exist.
*/
function buildTree(leaves) {
	if (leaves.length === 0) throw new Error("cannot build a Merkle tree with no leaves");
	const proofs = leaves.map(() => []);
	let position = leaves.map((_, i) => i);
	let level = [...leaves];
	while (level.length > 1) {
		const next = [];
		for (let i = 0; i < level.length; i += 2) {
			const left = level[i];
			const right = level[i + 1];
			next.push(right === void 0 ? left : hashPair(left, right));
		}
		position = position.map((p, leafIndex) => {
			const sibling = p % 2 === 0 ? level[p + 1] : level[p - 1];
			if (sibling !== void 0) proofs[leafIndex].push(sibling);
			return Math.floor(p / 2);
		});
		level = next;
	}
	return {
		root: level[0],
		proofs
	};
}
// ../../packages/cli/src/release.ts
/** SiteRegistry limits (TAP-10 Appendix B.5). */
var CHUNK_SIZE = 24e3;
/**
* Validates a release-relative path against the rules ReleaseGate and SiteRegistry enforce:
* forward slashes, no leading slash, no empty, "." or ".." segments, no control characters.
*/
function assertValidPath(rel) {
	if (rel.length === 0) throw new Error("empty path");
	if (rel.startsWith("/")) throw new Error(`path must be relative: ${rel}`);
	if (rel.includes("\\")) throw new Error(`path must use forward slashes: ${rel}`);
	for (const segment of rel.split("/")) if (segment === "" || segment === "." || segment === "..") throw new Error(`invalid path segment in: ${rel}`);
	for (let i = 0; i < rel.length; i++) {
		const code = rel.charCodeAt(i);
		if (code < 32 || code === 127) throw new Error(`control character in path: ${JSON.stringify(rel)}`);
	}
}
var isHash = (v) => typeof v === "string" && /^0x[0-9a-fA-F]{64}$/.test(v);
var isCount = (v) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
/**
* Parses and shape-checks a manifest. Manifests come from CI artifacts, repos or a maintainer's upload, so every
* field is treated as untrusted; trust comes only from recomputeRoot() matching the onchain root.
*/
function parseManifest(json) {
	const m = JSON.parse(json);
	if (m.version !== 2) throw new Error(`unsupported manifest version ${String(m.version)} (expected 2); rebuild it`);
	if (!isHash(m.root) || !isCount(m.totalChunks) || !Array.isArray(m.files) || m.files.length === 0) throw new Error("malformed manifest");
	for (const f of m.files) {
		const file = f;
		if (typeof file?.path !== "string" || !isCount(file.size) || !isHash(file.sha256) || typeof file.contentType !== "string" || !Array.isArray(file.chunks)) throw new Error("malformed manifest: bad file entry");
		assertValidPath(file.path);
		for (const c of file.chunks) {
			const chunk = c;
			if (!isCount(chunk?.index) || !isCount(chunk.size) || !isHash(chunk.sha256)) throw new Error(`malformed manifest: bad chunk in ${file.path}`);
		}
	}
	return m;
}
/** Recomputes the Merkle root from the manifest's file and chunk fields; ignores its stored leaves, proofs and root. */
function recomputeRoot(m) {
	const leaves = [];
	for (const file of m.files) {
		const expectedChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
		if (file.chunks.length !== expectedChunks) throw new Error(`${file.path}: ${file.chunks.length} chunks for ${file.size} bytes`);
		file.chunks.forEach((chunk, i) => {
			if (chunk.index !== i) throw new Error(`${file.path}: chunk ${i} has index ${chunk.index}`);
			leaves.push(leafHash({
				path: file.path,
				contentType: file.contentType,
				fileSha256: file.sha256,
				index: i,
				chunkSha256: chunk.sha256
			}));
		});
	}
	return {
		root: buildTree(leaves).root,
		totalChunks: leaves.length
	};
}
// ../../packages/watcher/src/cdn.ts
var ROCKET_LOADER = /<script src="\/cdn-cgi\/scripts\/[0-9a-f]{8}\/cloudflare-static\/rocket-loader\.min\.js" data-cf-settings="([0-9a-f]{24})-\|\d{1,3}" defer><\/script>/g;
var WEB_ANALYTICS = /<script defer src='https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js' data-cf-beacon='\{"token": "[0-9a-f]{32}"\}'><\/script>/g;
var EMAIL_OBFUSCATION = /\/cdn-cgi\/l\/email-protection|class="__cf_email__"|email-decode\.min\.js/;
var BOT_DETECTION = /__CF\$cv\$params|\/cdn-cgi\/challenge-platform\//;
var CDN_HINTS = {
	"rocket-loader": "Cloudflare Rocket Loader rewrites every script tag. Turn it off (Speed > Optimization) so the site can be verified.",
	"web-analytics": "Cloudflare Web Analytics injects a beacon. Install it in your build instead, or turn off automatic injection.",
	"email-obfuscation": "Cloudflare Email Address Obfuscation rewrote the page and cannot be undone. Turn it off (Scrape Shield) so the site can be verified.",
	"bot-detection": "Cloudflare JavaScript detections injected an inline script. Turn them off for this hostname, or allow-list the served hash."
};
function stripCloudflare(served) {
	const stripped = [];
	let html = served;
	const tokens = /* @__PURE__ */ new Set();
	html = html.replace(ROCKET_LOADER, (tag, token) => {
		tokens.add(token);
		stripped.push({
			feature: "rocket-loader",
			tag
		});
		return "";
	});
	for (const token of tokens) html = html.replaceAll(` type="${token}-text/javascript"`, "").replaceAll(` type="${token}-module"`, ` type="module"`);
	html = html.replace(WEB_ANALYTICS, (tag) => {
		stripped.push({
			feature: "web-analytics",
			tag
		});
		return "";
	});
	const irreversible = [];
	if (EMAIL_OBFUSCATION.test(served)) irreversible.push(CDN_HINTS["email-obfuscation"]);
	if (BOT_DETECTION.test(served)) irreversible.push(CDN_HINTS["bot-detection"]);
	return {
		html,
		stripped,
		irreversible
	};
}
// ../../packages/watcher/src/compare.ts
var ZERO_HASH = `0x${"0".repeat(64)}`;
function sha256(bytes) {
	return `0x${createHash("sha256").update(bytes).digest("hex")}`;
}
function sameOrigin(url, origin) {
	try {
		return new URL(url).origin === origin;
	} catch {
		return false;
	}
}
/** Diffs one release against what is served. An empty list means every listed file matches. */
function diffRelease(release, input) {
	const diffs = [];
	const allowed = [];
	for (const file of release.files) {
		const got = input.served.get(file.path);
		if (!got) {
			diffs.push({
				path: file.path,
				kind: "fetch-failed",
				expected: file.sha256,
				detail: "not fetched"
			});
			continue;
		}
		if (!got.ok) {
			diffs.push({
				path: file.path,
				kind: got.missing ? "missing" : "fetch-failed",
				expected: file.sha256,
				detail: got.error
			});
			continue;
		}
		if (!sameOrigin(got.finalUrl, input.siteOrigin)) {
			diffs.push({
				path: file.path,
				kind: "off-origin",
				expected: file.sha256,
				detail: `redirected to ${got.finalUrl}`
			});
			continue;
		}
		const served = sha256(got.bytes);
		if (served === file.sha256) continue;
		if (input.allow?.get(file.path)?.has(served)) {
			allowed.push(file.path);
			continue;
		}
		diffs.push({
			path: file.path,
			kind: "changed",
			served,
			expected: file.sha256
		});
	}
	return {
		diffs,
		allowed
	};
}
var decoder = new TextDecoder("utf-8", { fatal: false });
function compare(input) {
	const root = input.served.get("index.html");
	const base = {
		liveRelease: input.live.id,
		observed: root?.ok ? sha256(root.bytes) : ZERO_HASH,
		stripped: [],
		hints: []
	};
	if (!root || !root.ok && !root.missing) {
		const detail = root && !root.ok ? root.error : "not fetched";
		return {
			...base,
			status: "UNREACHABLE",
			diffs: [],
			allowed: [],
			hints: [`root page: ${detail}`]
		};
	}
	const live = diffRelease(input.live, input);
	const hard = live.diffs.filter((d) => d.kind !== "fetch-failed");
	if (live.diffs.length === 0) return {
		...base,
		status: "MATCH",
		diffs: [],
		allowed: live.allowed
	};
	if (hard.length > 0) for (const other of input.others) {
		if (diffRelease(other, input).diffs.length > 0) continue;
		if (other.state === "previous") return {
			...base,
			status: "HOST_BEHIND",
			matchedRelease: other.id,
			diffs: live.diffs,
			allowed: []
		};
		if (other.state === "staged" || other.state === "sealed") return {
			...base,
			status: "DEPLOYED_BEFORE_ACTIVATION",
			matchedRelease: other.id,
			diffs: live.diffs,
			allowed: [],
			hints: [`release v${other.id} is ${other.state} but not active yet: deploy to the host only after \`hashfront wait-active\``]
		};
		base.hints.push(`the host serves cancelled release v${other.id}`);
	}
	if (root.ok) {
		const cdn = stripCloudflare(decoder.decode(root.bytes));
		base.hints.push(...cdn.irreversible);
		const onlyIndex = hard.length === 1 && hard[0]?.path === "index.html" && hard[0].kind === "changed";
		const otherFailures = live.diffs.some((d) => d.kind === "fetch-failed");
		if (onlyIndex && !otherFailures && cdn.stripped.length > 0 && input.liveIndex) {
			const approved = decoder.decode(input.liveIndex);
			if (cdn.html === approved) {
				const features = [...new Set(cdn.stripped.map((s) => s.feature))];
				return {
					...base,
					status: "CDN_MODIFIED",
					diffs: live.diffs,
					allowed: live.allowed,
					stripped: cdn.stripped,
					hints: [...base.hints, ...features.map((f) => CDN_HINTS[f])]
				};
			}
		}
	}
	if (hard.length === 0) return {
		...base,
		status: "UNVERIFIABLE",
		diffs: live.diffs,
		allowed: live.allowed
	};
	return {
		...base,
		status: "MISMATCH",
		diffs: live.diffs,
		allowed: live.allowed
	};
}
// ../../packages/watcher/src/fetchSite.ts
var DEFAULTS = {
	timeoutMs: 15e3,
	maxBytes: 9e6,
	concurrency: 6
};
/** URL a release path is served at on the normal host. index.html is the site root, as users open it. */
function urlFor(site, releasePath) {
	const base = site.href.endsWith("/") ? site.href : `${site.href}/`;
	if (releasePath === "index.html") return base;
	return new URL(releasePath.split("/").map(encodeURIComponent).join("/"), base).href;
}
async function readCapped(res, maxBytes) {
	const reader = res.body?.getReader();
	if (!reader) return /* @__PURE__ */ new Uint8Array();
	const parts = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > maxBytes) {
			await reader.cancel();
			throw new Error(`response larger than ${maxBytes} bytes`);
		}
		parts.push(value);
	}
	const out = new Uint8Array(total);
	let offset = 0;
	for (const p of parts) {
		out.set(p, offset);
		offset += p.byteLength;
	}
	return out;
}
async function fetchOne(url, opts = {}) {
	const { timeoutMs, maxBytes } = {
		...DEFAULTS,
		...opts
	};
	const doFetch = opts.fetchImpl ?? fetch;
	try {
		const res = await doFetch(url, {
			redirect: "follow",
			cache: "no-store",
			headers: {
				"cache-control": "no-cache",
				pragma: "no-cache",
				"user-agent": "hashfront-watcher/0.1"
			},
			signal: AbortSignal.timeout(timeoutMs)
		});
		if (res.status === 404 || res.status === 410) {
			await res.body?.cancel();
			return {
				ok: false,
				missing: true,
				error: `HTTP ${res.status}`
			};
		}
		if (!res.ok) {
			await res.body?.cancel();
			return {
				ok: false,
				missing: false,
				error: `HTTP ${res.status}`
			};
		}
		return {
			ok: true,
			bytes: await readCapped(res, maxBytes),
			finalUrl: res.url || url
		};
	} catch (err) {
		return {
			ok: false,
			missing: false,
			error: err instanceof Error ? err.message : String(err)
		};
	}
}
/** Fetches every path (deduplicated) with bounded concurrency. */
async function fetchServed(site, paths, opts = {}) {
	const queue = [...new Set(paths)];
	const out = /* @__PURE__ */ new Map();
	const workers = Array.from({ length: Math.min(opts.concurrency ?? DEFAULTS.concurrency, queue.length) }, async () => {
		for (let p = queue.shift(); p !== void 0; p = queue.shift()) out.set(p, await fetchOne(urlFor(site, p), opts));
	});
	await Promise.all(workers);
	return out;
}
/** Approved bytes of a release file, read back from SiteRegistry in 24 KB ranges. */
async function readReleaseFile(ctx, info, id, rel) {
	const full = stagedPath(id, rel);
	const meta = await readFile(ctx, info.registry, info.container, full);
	const offsets = [];
	for (let offset = 0; offset < meta.size; offset += CHUNK_SIZE) offsets.push(offset);
	const parts = new Array(offsets.length);
	let next = 0;
	const worker = async () => {
		for (let i = next++; i < offsets.length; i = next++) parts[i] = await ctx.publicClient.readContract({
			address: info.registry,
			abi: siteRegistryAbi,
			functionName: "readRange",
			args: [
				info.container,
				full,
				BigInt(offsets[i]),
				BigInt(CHUNK_SIZE)
			]
		});
	};
	await Promise.all(Array.from({ length: Math.min(8, offsets.length) }, worker));
	return parts.length === 0 ? /* @__PURE__ */ new Uint8Array() : hexToBytes$1(concatHex(parts));
}
// ../../packages/watcher/src/suspects.ts
var ADDRESS = /0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g;
var NATIVE_PLACEHOLDER = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
var ZERO = "0x0000000000000000000000000000000000000000";
var MAX_REFERENCED = 20;
/** Checksummed addresses in the bytes, without the zero address and the 0xeeee... native-token placeholder. */
function extractAddresses(bytes) {
	const text = new TextDecoder("utf-8").decode(bytes);
	const out = /* @__PURE__ */ new Set();
	for (const m of text.matchAll(ADDRESS)) {
		if (!isAddress(m[0], { strict: false })) continue;
		const a = getAddress(m[0]);
		if (a !== ZERO && a !== NATIVE_PLACEHOLDER) out.add(a);
	}
	return out;
}
/** Addresses in `changed` that appear in none of the `approved` files, sorted. */
function suspects(changed, approved) {
	const known = /* @__PURE__ */ new Set();
	for (const b of approved) for (const a of extractAddresses(b)) known.add(a);
	const out = /* @__PURE__ */ new Set();
	for (const b of changed) for (const a of extractAddresses(b)) if (!known.has(a)) out.add(a);
	return [...out].sort();
}
/**
* Same-origin scripts and styles an HTML page loads, as release-relative paths. A hijacked build usually ships a
* differently named bundle, so the address is in a file the approved release does not list at all.
*/
function referencedAssets(html) {
	const text = new TextDecoder("utf-8").decode(html);
	const out = /* @__PURE__ */ new Set();
	for (const m of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
		const ref = m[1].split(/[?#]/)[0];
		if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) continue;
		if (!/\.(?:m?js|css|json)$/i.test(ref)) continue;
		const path = ref.replace(/^\.\//, "").replace(/^\//, "");
		if (!path || path.split("/").includes("..")) continue;
		out.add(path);
		if (out.size >= MAX_REFERENCED) break;
	}
	return [...out];
}
/** Only text-like release files can hold an address worth comparing. */
var isTextPath = (p) => /\.(?:html?|m?js|css|json|txt)$/i.test(p);
// ../../packages/watcher/src/triage.ts
/** Verified approved bytes per gate, release id and path; a live release never changes. */
var approvedCache = /* @__PURE__ */ new Map();
/**
* Compares the addresses of what the host serves with every text file of the live release. The served side is the
* changed files plus the scripts the served index.html loads: a hijack usually ships a differently named bundle.
*/
async function findSuspects(i) {
	const changed = [];
	for (const d of i.diffs) {
		const f = d.kind === "changed" ? i.served.get(d.path) : void 0;
		if (f?.ok) changed.push(f.bytes);
	}
	const root = i.served.get("index.html");
	if (root?.ok) {
		const extra = referencedAssets(root.bytes).filter((p) => !i.served.has(p));
		for (const f of (await fetchServed(i.site, extra, i.fetch)).values()) if (f.ok) changed.push(f.bytes);
	}
	const approved = [];
	for (const file of i.live.files) {
		if (!isTextPath(file.path)) continue;
		const key = `${i.ctx.gate}:${i.live.id}:${file.path}`;
		let bytes = approvedCache.get(key);
		if (!bytes) {
			bytes = await readReleaseFile(i.ctx, i.info, i.live.id, file.path);
			if (sha256(bytes) !== file.sha256) throw new Error(`${file.path} read from the registry does not match the approved hash`);
			approvedCache.set(key, bytes);
		}
		approved.push(bytes);
	}
	return suspects(changed, approved);
}
// api/_site.ts
async function readSite(d) {
	const chain = NETWORKS.xlayer;
	const ctx = {
		chain,
		publicClient: d.client ?? createPublicClient({
			chain,
			transport: http(d.rpcUrl)
		}),
		walletClient: void 0,
		account: void 0,
		gate: d.gate,
		log: () => {}
	};
	const info = await readGateInfo(ctx);
	if (info.liveRelease === 0n) throw new Error("the gate has no live release yet");
	const rel = await readRelease(ctx, info.liveRelease);
	let files;
	for (const text of d.manifests) try {
		const m = parseManifest(text);
		const r = recomputeRoot(m);
		if (r.root.toLowerCase() === rel.root.toLowerCase() && r.totalChunks === rel.totalChunks && m.root.toLowerCase() === r.root.toLowerCase()) {
			files = m.files.map((f) => ({
				path: f.path,
				size: f.size,
				sha256: f.sha256.toLowerCase()
			}));
			break;
		}
	} catch {}
	if (!files) throw new Error(`no bundled manifest reproduces the root of live release v${info.liveRelease}`);
	const live = {
		id: info.liveRelease,
		state: "live",
		files
	};
	const served = await fetchServed(d.site, files.map((f) => f.path), d.fetchImpl ? { fetchImpl: d.fetchImpl } : {});
	return {
		ctx,
		info,
		live,
		served,
		verdict: compare({
			siteOrigin: d.site.origin,
			live,
			others: [],
			served
		})
	};
}
/** Suspects only while the content is a MISMATCH: a host that is merely behind or unreachable names no one. */
async function loadSuspects(d, now = () => /* @__PURE__ */ new Date()) {
	const r = await readSite(d);
	const status = r.verdict.status === "MATCH" ? "match" : r.verdict.status === "MISMATCH" ? "mismatch" : "other";
	const suspects = status === "mismatch" ? await findSuspects({
		ctx: r.ctx,
		info: r.info,
		live: r.live,
		served: r.served,
		diffs: r.verdict.diffs,
		site: d.site,
		...d.fetchImpl ? { fetch: { fetchImpl: d.fetchImpl } } : {}
	}) : [];
	return {
		status,
		liveRelease: Number(r.live.id),
		suspects,
		checkedAt: now().toISOString()
	};
}
/** The feed the Guard extension (and any wallet that wants it) reads. */
async function loadStatus(d, now = () => /* @__PURE__ */ new Date()) {
	const r = await readSite(d);
	const [kind] = await r.ctx.publicClient.readContract({
		address: d.gate,
		abi: releaseGateAbi,
		functionName: "lastAlert"
	});
	const alertOpen = kind === 1 || kind === 2;
	const v = r.verdict.status;
	const status = alertOpen || v === "MISMATCH" ? "alert" : v === "MATCH" ? "ok" : "unknown";
	const suspects = v === "MISMATCH" ? await findSuspects({
		ctx: r.ctx,
		info: r.info,
		live: r.live,
		served: r.served,
		diffs: r.verdict.diffs,
		site: d.site,
		...d.fetchImpl ? { fetch: { fetchImpl: d.fetchImpl } } : {}
	}).catch(() => []) : [];
	const assets = Object.fromEntries(r.live.files.map((f) => [f.path, f.sha256]));
	return {
		site: d.site.origin,
		status,
		liveRelease: Number(r.live.id),
		rootHash: assets["index.html"] ?? "",
		assets,
		suspects,
		checkedAt: now().toISOString()
	};
}
/** Builds a cached loader from env, or undefined when the site is not configured. */
function siteLoaderFromEnv(env, manifests, load, ttlMs = 2e4, now = Date.now) {
	const { HASHFRONT_SITE: site, HASHFRONT_GATE: gate, HASHFRONT_RPC: rpc } = env;
	if (!site || !gate || !/^0x[0-9a-fA-F]{40}$/.test(gate)) return void 0;
	let url;
	try {
		url = new URL(site);
	} catch {
		return;
	}
	if (url.protocol !== "https:") return void 0;
	const deps = {
		site: url,
		gate,
		manifests,
		...rpc ? { rpcUrl: rpc } : {}
	};
	let hit;
	return () => {
		if (hit && now() - hit.at < ttlMs) return hit.value;
		const value = load(deps);
		hit = {
			at: now(),
			value
		};
		value.catch(() => {
			if (hit?.value === value) hit = void 0;
		});
		return value;
	};
}
function suspectsLoaderFromEnv(env, manifests, ttlMs = 3e4, now = Date.now) {
	return siteLoaderFromEnv(env, manifests, (d) => loadSuspects(d), ttlMs, now);
}
function statusLoaderFromEnv(env, manifests, ttlMs = 2e4, now = Date.now) {
	return siteLoaderFromEnv(env, manifests, (d) => loadStatus(d), ttlMs, now);
}
export { concat$1 as C, encodeAbiParameters as S, getAbortError as _, anySignal as a, stringify$1 as b, createCcipReadBudget as c, call as d, getRevertErrorData as f, TimeoutError as g, ResponseBodyTooLargeError as h, withTimeout as i, localBatchGatewayRequest as l, HttpRequestError as m, suspectsLoaderFromEnv as n, readResponseBody as o, isAddressEqual as p, manifestTexts as r, ccipReadLimit as s, statusLoaderFromEnv as t, localBatchGatewayUrl as u, getUrl as v, decodeErrorResult as x, isAbortError as y };
