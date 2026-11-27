import * as nc from "node:crypto";
import { createHmac } from "node:crypto";
// ../../node_modules/viem/node_modules/abitype/dist/esm/regex.js
function execTyped(regex, string) {
	return regex.exec(string)?.groups;
}
var bytesRegex = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
var integerRegex = /^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
var isTupleRegex = /^\(.+?\).*?$/;
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/formatAbiParameter.js
var tupleRegex = /^tuple(?<array>(\[(\d*)\])*)$/;
/**
* Formats {@link AbiParameter} to human-readable ABI parameter.
*
* @param abiParameter - ABI parameter
* @returns Human-readable ABI parameter
*
* @example
* const result = formatAbiParameter({ type: 'address', name: 'from' })
* //    ^? const result: 'address from'
*/
function formatAbiParameter(abiParameter) {
	let type = abiParameter.type;
	if (tupleRegex.test(abiParameter.type) && "components" in abiParameter) {
		type = "(";
		const length = abiParameter.components.length;
		for (let i = 0; i < length; i++) {
			const component = abiParameter.components[i];
			type += formatAbiParameter(component);
			if (i < length - 1) type += ", ";
		}
		const result = execTyped(tupleRegex, abiParameter.type);
		type += `)${result?.array || ""}`;
		return formatAbiParameter({
			...abiParameter,
			type
		});
	}
	if ("indexed" in abiParameter && abiParameter.indexed) type = `${type} indexed`;
	if (abiParameter.name) return `${type} ${abiParameter.name}`;
	return type;
}
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/formatAbiParameters.js
/**
* Formats {@link AbiParameter}s to human-readable ABI parameters.
*
* @param abiParameters - ABI parameters
* @returns Human-readable ABI parameters
*
* @example
* const result = formatAbiParameters([
*   //  ^? const result: 'address from, uint256 tokenId'
*   { type: 'address', name: 'from' },
*   { type: 'uint256', name: 'tokenId' },
* ])
*/
function formatAbiParameters(abiParameters) {
	let params = "";
	const length = abiParameters.length;
	for (let i = 0; i < length; i++) {
		const abiParameter = abiParameters[i];
		params += formatAbiParameter(abiParameter);
		if (i !== length - 1) params += ", ";
	}
	return params;
}
// ../../node_modules/viem/node_modules/abitype/dist/esm/human-readable/formatAbiItem.js
/**
* Formats ABI item (e.g. error, event, function) into human-readable ABI item
*
* @param abiItem - ABI item
* @returns Human-readable ABI item
*/
function formatAbiItem(abiItem) {
	if (abiItem.type === "function") return `function ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})${abiItem.stateMutability && abiItem.stateMutability !== "nonpayable" ? ` ${abiItem.stateMutability}` : ""}${abiItem.outputs?.length ? ` returns (${formatAbiParameters(abiItem.outputs)})` : ""}`;
	if (abiItem.type === "event") return `event ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})`;
	if (abiItem.type === "error") return `error ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})`;
	if (abiItem.type === "constructor") return `constructor(${formatAbiParameters(abiItem.inputs)})${abiItem.stateMutability === "payable" ? " payable" : ""}`;
	if (abiItem.type === "fallback") return `fallback() external${abiItem.stateMutability === "payable" ? " payable" : ""}`;
	return "receive() external payable";
}
// ../../node_modules/viem/_esm/utils/data/isHex.js
function isHex(value, { even = false, strict = true } = {}) {
	if (!value) return false;
	if (typeof value !== "string") return false;
	if (even && value.length % 2 !== 0) return false;
	return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith("0x");
}
// ../../node_modules/viem/_esm/utils/data/size.js
/**
* @description Retrieves the size of the value (in bytes).
*
* @param value The value (hex or byte array) to retrieve the size of.
* @returns The size of the value (in bytes).
*/
function size(value) {
	if (isHex(value, { strict: false })) return Math.ceil((value.length - 2) / 2);
	return value.length;
}
// ../../node_modules/viem/_esm/errors/version.js
var version = "2.57.16";
// ../../node_modules/viem/_esm/errors/base.js
var errorConfig = {
	getDocsUrl: ({ docsBaseUrl, docsPath = "", docsSlug }) => docsPath ? `${docsBaseUrl ?? "https://viem.sh"}${docsPath}${docsSlug ? `#${docsSlug}` : ""}` : void 0,
	version: `viem@${version}`
};
var BaseError = class BaseError extends Error {
	constructor(shortMessage, args = {}) {
		const details = (() => {
			if (args.cause instanceof BaseError) return args.cause.details;
			if (args.cause?.message) return args.cause.message;
			return args.details;
		})();
		const docsPath = (() => {
			if (args.cause instanceof BaseError) return args.cause.docsPath || args.docsPath;
			return args.docsPath;
		})();
		const docsUrl = errorConfig.getDocsUrl?.({
			...args,
			docsPath
		});
		const message = [
			shortMessage || "An error occurred.",
			"",
			...args.metaMessages ? [...args.metaMessages, ""] : [],
			...docsUrl ? [`Docs: ${docsUrl}`] : [],
			...details ? [`Details: ${details}`] : [],
			...errorConfig.version ? [`Version: ${errorConfig.version}`] : []
		].join("\n");
		super(message, args.cause ? { cause: args.cause } : void 0);
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
		Object.defineProperty(this, "version", {
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
		this.details = details;
		this.docsPath = docsPath;
		this.metaMessages = args.metaMessages;
		this.name = args.name ?? this.name;
		this.shortMessage = shortMessage;
		this.version = version;
	}
	walk(fn) {
		return walk(this, fn);
	}
};
function walk(err, fn) {
	if (fn?.(err)) return err;
	if (err && typeof err === "object" && "cause" in err && err.cause !== void 0) return walk(err.cause, fn);
	return fn ? null : err;
}
// ../../node_modules/viem/_esm/errors/data.js
var SliceOffsetOutOfBoundsError = class extends BaseError {
	constructor({ offset, position, size }) {
		super(`Slice ${position === "start" ? "starting" : "ending"} at offset "${offset}" is out-of-bounds (size: ${size}).`, { name: "SliceOffsetOutOfBoundsError" });
	}
};
var SizeExceedsPaddingSizeError = class extends BaseError {
	constructor({ size, targetSize, type }) {
		super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (${size}) exceeds padding size (${targetSize}).`, { name: "SizeExceedsPaddingSizeError" });
	}
};
var InvalidBytesLengthError = class extends BaseError {
	constructor({ size, targetSize, type }) {
		super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} is expected to be ${targetSize} ${type} long, but is ${size} ${type} long.`, { name: "InvalidBytesLengthError" });
	}
};
// ../../node_modules/viem/_esm/utils/data/pad.js
function pad(hexOrBytes, { dir, size = 32 } = {}) {
	if (typeof hexOrBytes === "string") return padHex(hexOrBytes, {
		dir,
		size
	});
	return padBytes(hexOrBytes, {
		dir,
		size
	});
}
function padHex(hex_, { dir, size = 32 } = {}) {
	if (size === null) return hex_;
	const hex = hex_.replace("0x", "");
	if (hex.length > size * 2) throw new SizeExceedsPaddingSizeError({
		size: Math.ceil(hex.length / 2),
		targetSize: size,
		type: "hex"
	});
	return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size * 2, "0")}`;
}
function padBytes(bytes, { dir, size = 32 } = {}) {
	if (size === null) return bytes;
	if (bytes.length > size) throw new SizeExceedsPaddingSizeError({
		size: bytes.length,
		targetSize: size,
		type: "bytes"
	});
	const paddedBytes = new Uint8Array(size);
	for (let i = 0; i < size; i++) {
		const padEnd = dir === "right";
		paddedBytes[padEnd ? i : size - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
	}
	return paddedBytes;
}
// ../../node_modules/viem/_esm/errors/encoding.js
var IntegerOutOfRangeError = class extends BaseError {
	constructor({ max, min, signed, size, value }) {
		super(`Number "${value}" is not in safe ${size ? `${size * 8}-bit ${signed ? "signed" : "unsigned"} ` : ""}integer range ${max ? `(${min} to ${max})` : `(above ${min})`}`, { name: "IntegerOutOfRangeError" });
	}
};
var InvalidBytesBooleanError = class extends BaseError {
	constructor(bytes) {
		super(`Bytes value "${bytes}" is not a valid boolean. The bytes array must contain a single byte of either a 0 or 1 value.`, { name: "InvalidBytesBooleanError" });
	}
};
var InvalidHexBooleanError = class extends BaseError {
	constructor(hex) {
		super(`Hex value "${hex}" is not a valid boolean. The hex value must be "0x0" (false) or "0x1" (true).`, { name: "InvalidHexBooleanError" });
	}
};
var SizeOverflowError = class extends BaseError {
	constructor({ givenSize, maxSize }) {
		super(`Size cannot exceed ${maxSize} bytes. Given size: ${givenSize} bytes.`, { name: "SizeOverflowError" });
	}
};
// ../../node_modules/viem/_esm/utils/data/trim.js
function trim(hexOrBytes, { dir = "left" } = {}) {
	let data = typeof hexOrBytes === "string" ? hexOrBytes.replace("0x", "") : hexOrBytes;
	let sliceLength = 0;
	for (let i = 0; i < data.length - 1; i++) if (data[dir === "left" ? i : data.length - i - 1].toString() === "0") sliceLength++;
	else break;
	data = dir === "left" ? data.slice(sliceLength) : data.slice(0, data.length - sliceLength);
	if (typeof hexOrBytes === "string") {
		if (data.length === 1 && dir === "right") data = `${data}0`;
		return `0x${data.length % 2 === 1 ? `0${data}` : data}`;
	}
	return data;
}
// ../../node_modules/viem/_esm/utils/encoding/fromHex.js
function assertSize(hexOrBytes, { size: size$1 }) {
	if (size(hexOrBytes) > size$1) throw new SizeOverflowError({
		givenSize: size(hexOrBytes),
		maxSize: size$1
	});
}
/**
* Decodes a hex value into a bigint.
*
* - Docs: https://viem.sh/docs/utilities/fromHex#hextobigint
*
* @param hex Hex value to decode.
* @param opts Options.
* @returns BigInt value.
*
* @example
* import { hexToBigInt } from 'viem'
* const data = hexToBigInt('0x1a4', { signed: true })
* // 420n
*
* @example
* import { hexToBigInt } from 'viem'
* const data = hexToBigInt('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
* // 420n
*/
function hexToBigInt(hex, opts = {}) {
	const { signed } = opts;
	if (opts.size) assertSize(hex, { size: opts.size });
	const value = BigInt(hex);
	if (!signed) return value;
	const size = Math.ceil((hex.length - 2) / 2);
	if (value <= (1n << BigInt(size) * 8n - 1n) - 1n) return value;
	return value - BigInt(`0x${"f".padStart(size * 2, "f")}`) - 1n;
}
/**
* Decodes a hex value into a boolean.
*
* - Docs: https://viem.sh/docs/utilities/fromHex#hextobool
*
* @param hex Hex value to decode.
* @param opts Options.
* @returns Boolean value.
*
* @example
* import { hexToBool } from 'viem'
* const data = hexToBool('0x01')
* // true
*
* @example
* import { hexToBool } from 'viem'
* const data = hexToBool('0x0000000000000000000000000000000000000000000000000000000000000001', { size: 32 })
* // true
*/
function hexToBool(hex_, opts = {}) {
	let hex = hex_;
	if (opts.size) {
		assertSize(hex, { size: opts.size });
		hex = trim(hex);
	}
	if (trim(hex) === "0x00") return false;
	if (trim(hex) === "0x01") return true;
	throw new InvalidHexBooleanError(hex);
}
/**
* Decodes a hex string into a number.
*
* - Docs: https://viem.sh/docs/utilities/fromHex#hextonumber
*
* @param hex Hex value to decode.
* @param opts Options.
* @returns Number value.
*
* @example
* import { hexToNumber } from 'viem'
* const data = hexToNumber('0x1a4')
* // 420
*
* @example
* import { hexToNumber } from 'viem'
* const data = hexToNumber('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
* // 420
*/
function hexToNumber(hex, opts = {}) {
	const value = hexToBigInt(hex, opts);
	const number = Number(value);
	if (!Number.isSafeInteger(number)) throw new IntegerOutOfRangeError({
		max: `${Number.MAX_SAFE_INTEGER}`,
		min: `${Number.MIN_SAFE_INTEGER}`,
		signed: opts.signed,
		size: opts.size,
		value: `${value}n`
	});
	return number;
}
// ../../node_modules/viem/_esm/utils/encoding/toHex.js
var hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
/**
* Encodes a string, number, bigint, or ByteArray into a hex string
*
* - Docs: https://viem.sh/docs/utilities/toHex
* - Example: https://viem.sh/docs/utilities/toHex#usage
*
* @param value Value to encode.
* @param opts Options.
* @returns Hex value.
*
* @example
* import { toHex } from 'viem'
* const data = toHex('Hello world')
* // '0x48656c6c6f20776f726c6421'
*
* @example
* import { toHex } from 'viem'
* const data = toHex(420)
* // '0x1a4'
*
* @example
* import { toHex } from 'viem'
* const data = toHex('Hello world', { size: 32 })
* // '0x48656c6c6f20776f726c64210000000000000000000000000000000000000000'
*/
function toHex(value, opts = {}) {
	if (typeof value === "number" || typeof value === "bigint") return numberToHex(value, opts);
	if (typeof value === "string") return stringToHex(value, opts);
	if (typeof value === "boolean") return boolToHex(value, opts);
	return bytesToHex(value, opts);
}
/**
* Encodes a boolean into a hex string
*
* - Docs: https://viem.sh/docs/utilities/toHex#booltohex
*
* @param value Value to encode.
* @param opts Options.
* @returns Hex value.
*
* @example
* import { boolToHex } from 'viem'
* const data = boolToHex(true)
* // '0x1'
*
* @example
* import { boolToHex } from 'viem'
* const data = boolToHex(false)
* // '0x0'
*
* @example
* import { boolToHex } from 'viem'
* const data = boolToHex(true, { size: 32 })
* // '0x0000000000000000000000000000000000000000000000000000000000000001'
*/
function boolToHex(value, opts = {}) {
	const hex = `0x${Number(value)}`;
	if (typeof opts.size === "number") {
		assertSize(hex, { size: opts.size });
		return pad(hex, { size: opts.size });
	}
	return hex;
}
/**
* Encodes a bytes array into a hex string
*
* - Docs: https://viem.sh/docs/utilities/toHex#bytestohex
*
* @param value Value to encode.
* @param opts Options.
* @returns Hex value.
*
* @example
* import { bytesToHex } from 'viem'
* const data = bytesToHex(Uint8Array.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
* // '0x48656c6c6f20576f726c6421'
*
* @example
* import { bytesToHex } from 'viem'
* const data = bytesToHex(Uint8Array.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]), { size: 32 })
* // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
*/
function bytesToHex(value, opts = {}) {
	let string = "";
	for (let i = 0; i < value.length; i++) string += hexes[value[i]];
	const hex = `0x${string}`;
	if (typeof opts.size === "number") {
		assertSize(hex, { size: opts.size });
		return pad(hex, {
			dir: "right",
			size: opts.size
		});
	}
	return hex;
}
/**
* Encodes a number or bigint into a hex string
*
* - Docs: https://viem.sh/docs/utilities/toHex#numbertohex
*
* @param value Value to encode.
* @param opts Options.
* @returns Hex value.
*
* @example
* import { numberToHex } from 'viem'
* const data = numberToHex(420)
* // '0x1a4'
*
* @example
* import { numberToHex } from 'viem'
* const data = numberToHex(420, { size: 32 })
* // '0x00000000000000000000000000000000000000000000000000000000000001a4'
*/
function numberToHex(value_, opts = {}) {
	const { signed, size } = opts;
	const value = BigInt(value_);
	let maxValue;
	if (size) {
		if (signed) maxValue = (1n << BigInt(size) * 8n - 1n) - 1n;
		else maxValue = 2n ** (BigInt(size) * 8n) - 1n;
	} else if (typeof value_ === "number") maxValue = BigInt(Number.MAX_SAFE_INTEGER);
	const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;
	if (maxValue && value > maxValue || value < minValue) {
		const suffix = typeof value_ === "bigint" ? "n" : "";
		throw new IntegerOutOfRangeError({
			max: maxValue ? `${maxValue}${suffix}` : void 0,
			min: `${minValue}${suffix}`,
			signed,
			size,
			value: `${value_}${suffix}`
		});
	}
	const hex = `0x${(signed && value < 0 ? (1n << BigInt(size * 8)) + BigInt(value) : value).toString(16)}`;
	if (size) return pad(hex, { size });
	return hex;
}
var encoder$1 = /*#__PURE__*/ new TextEncoder();
/**
* Encodes a UTF-8 string into a hex string
*
* - Docs: https://viem.sh/docs/utilities/toHex#stringtohex
*
* @param value Value to encode.
* @param opts Options.
* @returns Hex value.
*
* @example
* import { stringToHex } from 'viem'
* const data = stringToHex('Hello World!')
* // '0x48656c6c6f20576f726c6421'
*
* @example
* import { stringToHex } from 'viem'
* const data = stringToHex('Hello World!', { size: 32 })
* // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
*/
function stringToHex(value_, opts = {}) {
	return bytesToHex(encoder$1.encode(value_), opts);
}
// ../../node_modules/viem/_esm/utils/encoding/toBytes.js
var encoder = /*#__PURE__*/ new TextEncoder();
/**
* Encodes a UTF-8 string, hex value, bigint, number or boolean to a byte array.
*
* - Docs: https://viem.sh/docs/utilities/toBytes
* - Example: https://viem.sh/docs/utilities/toBytes#usage
*
* @param value Value to encode.
* @param opts Options.
* @returns Byte array value.
*
* @example
* import { toBytes } from 'viem'
* const data = toBytes('Hello world')
* // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
*
* @example
* import { toBytes } from 'viem'
* const data = toBytes(420)
* // Uint8Array([1, 164])
*
* @example
* import { toBytes } from 'viem'
* const data = toBytes(420, { size: 4 })
* // Uint8Array([0, 0, 1, 164])
*/
function toBytes$1(value, opts = {}) {
	if (typeof value === "number" || typeof value === "bigint") return numberToBytes(value, opts);
	if (typeof value === "boolean") return boolToBytes(value, opts);
	if (isHex(value)) return hexToBytes(value, opts);
	return stringToBytes(value, opts);
}
/**
* Encodes a boolean into a byte array.
*
* - Docs: https://viem.sh/docs/utilities/toBytes#booltobytes
*
* @param value Boolean value to encode.
* @param opts Options.
* @returns Byte array value.
*
* @example
* import { boolToBytes } from 'viem'
* const data = boolToBytes(true)
* // Uint8Array([1])
*
* @example
* import { boolToBytes } from 'viem'
* const data = boolToBytes(true, { size: 32 })
* // Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
*/
function boolToBytes(value, opts = {}) {
	const bytes = /* @__PURE__ */ new Uint8Array(1);
	bytes[0] = Number(value);
	if (typeof opts.size === "number") {
		assertSize(bytes, { size: opts.size });
		return pad(bytes, { size: opts.size });
	}
	return bytes;
}
var charCodeMap = {
	zero: 48,
	nine: 57,
	A: 65,
	F: 70,
	a: 97,
	f: 102
};
function charCodeToBase16(char) {
	if (char >= charCodeMap.zero && char <= charCodeMap.nine) return char - charCodeMap.zero;
	if (char >= charCodeMap.A && char <= charCodeMap.F) return char - (charCodeMap.A - 10);
	if (char >= charCodeMap.a && char <= charCodeMap.f) return char - (charCodeMap.a - 10);
}
/**
* Encodes a hex string into a byte array.
*
* - Docs: https://viem.sh/docs/utilities/toBytes#hextobytes
*
* @param hex Hex string to encode.
* @param opts Options.
* @returns Byte array value.
*
* @example
* import { hexToBytes } from 'viem'
* const data = hexToBytes('0x48656c6c6f20776f726c6421')
* // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
*
* @example
* import { hexToBytes } from 'viem'
* const data = hexToBytes('0x48656c6c6f20776f726c6421', { size: 32 })
* // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
*/
function hexToBytes(hex_, opts = {}) {
	let hex = hex_;
	if (opts.size) {
		assertSize(hex, { size: opts.size });
		hex = pad(hex, {
			dir: "right",
			size: opts.size
		});
	}
	let hexString = hex.slice(2);
	if (hexString.length % 2) hexString = `0${hexString}`;
	const length = hexString.length / 2;
	const bytes = new Uint8Array(length);
	for (let index = 0, j = 0; index < length; index++) {
		const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
		const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
		if (nibbleLeft === void 0 || nibbleRight === void 0) throw new BaseError(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
		bytes[index] = nibbleLeft * 16 + nibbleRight;
	}
	return bytes;
}
/**
* Encodes a number into a byte array.
*
* - Docs: https://viem.sh/docs/utilities/toBytes#numbertobytes
*
* @param value Number to encode.
* @param opts Options.
* @returns Byte array value.
*
* @example
* import { numberToBytes } from 'viem'
* const data = numberToBytes(420)
* // Uint8Array([1, 164])
*
* @example
* import { numberToBytes } from 'viem'
* const data = numberToBytes(420, { size: 4 })
* // Uint8Array([0, 0, 1, 164])
*/
function numberToBytes(value, opts) {
	return hexToBytes(numberToHex(value, opts));
}
/**
* Encodes a UTF-8 string into a byte array.
*
* - Docs: https://viem.sh/docs/utilities/toBytes#stringtobytes
*
* @param value String to encode.
* @param opts Options.
* @returns Byte array value.
*
* @example
* import { stringToBytes } from 'viem'
* const data = stringToBytes('Hello world!')
* // Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33])
*
* @example
* import { stringToBytes } from 'viem'
* const data = stringToBytes('Hello world!', { size: 32 })
* // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
*/
function stringToBytes(value, opts = {}) {
	const bytes = encoder.encode(value);
	if (typeof opts.size === "number") {
		assertSize(bytes, { size: opts.size });
		return pad(bytes, {
			dir: "right",
			size: opts.size
		});
	}
	return bytes;
}
// ../../node_modules/viem/node_modules/@noble/hashes/esm/_u64.js
/**
* Internal helpers for u64. BigUint64Array is too slow as per 2025, so we implement it using Uint32Array.
* @todo re-check https://issues.chromium.org/issues/42212588
* @module
*/
var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
	if (le) return {
		h: Number(n & U32_MASK64),
		l: Number(n >> _32n & U32_MASK64)
	};
	return {
		h: Number(n >> _32n & U32_MASK64) | 0,
		l: Number(n & U32_MASK64) | 0
	};
}
function split(lst, le = false) {
	const len = lst.length;
	let Ah = new Uint32Array(len);
	let Al = new Uint32Array(len);
	for (let i = 0; i < len; i++) {
		const { h, l } = fromBig(lst[i], le);
		[Ah[i], Al[i]] = [h, l];
	}
	return [Ah, Al];
}
var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
// ../../node_modules/viem/node_modules/@noble/hashes/esm/cryptoNode.js
/**
* Internal webcrypto alias.
* We prefer WebCrypto aka globalThis.crypto, which exists in node.js 16+.
* Falls back to Node.js built-in crypto for Node.js <=v14.
* See utils.ts for details.
* @module
*/
var crypto = nc && typeof nc === "object" && "webcrypto" in nc ? nc.webcrypto : nc && typeof nc === "object" && "randomBytes" in nc ? nc : void 0;
// ../../node_modules/viem/node_modules/@noble/hashes/esm/utils.js
/**
* Utilities for hex, bytes, CSPRNG.
* @module
*/
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
/** Checks if something is Uint8Array. Be careful: nodejs Buffer will return true. */
function isBytes(a) {
	return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
/** Asserts something is positive integer. */
function anumber(n) {
	if (!Number.isSafeInteger(n) || n < 0) throw new Error("positive integer expected, got " + n);
}
/** Asserts something is Uint8Array. */
function abytes(b, ...lengths) {
	if (!isBytes(b)) throw new Error("Uint8Array expected");
	if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
/** Asserts something is hash */
function ahash(h) {
	if (typeof h !== "function" || typeof h.create !== "function") throw new Error("Hash should be wrapped by utils.createHasher");
	anumber(h.outputLen);
	anumber(h.blockLen);
}
/** Asserts a hash instance has not been destroyed / finished */
function aexists(instance, checkFinished = true) {
	if (instance.destroyed) throw new Error("Hash instance has been destroyed");
	if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
}
/** Asserts output is properly-sized byte array */
function aoutput(out, instance) {
	abytes(out);
	const min = instance.outputLen;
	if (out.length < min) throw new Error("digestInto() expects output buffer of length at least " + min);
}
/** Cast u8 / u16 / u32 to u32. */
function u32(arr) {
	return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
/** Zeroize a byte array. Warning: JS provides no guarantees. */
function clean(...arrays) {
	for (let i = 0; i < arrays.length; i++) arrays[i].fill(0);
}
/** Create DataView of an array for easy byte-level manipulation. */
function createView(arr) {
	return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
/** The rotate right (circular right shift) operation for uint32 */
function rotr(word, shift) {
	return word << 32 - shift | word >>> shift;
}
/** Is current platform little-endian? Most are. Big-Endian platform: IBM */
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
/** The byte swap operation for uint32 */
function byteSwap(word) {
	return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
/** In place byte swap for Uint32Array */
function byteSwap32(arr) {
	for (let i = 0; i < arr.length; i++) arr[i] = byteSwap(arr[i]);
	return arr;
}
var swap32IfBE = isLE ? (u) => u : byteSwap32;
/**
* Converts string to bytes using UTF8 encoding.
* @example utf8ToBytes('abc') // Uint8Array.from([97, 98, 99])
*/
function utf8ToBytes(str) {
	if (typeof str !== "string") throw new Error("string expected");
	return new Uint8Array(new TextEncoder().encode(str));
}
/**
* Normalizes (non-hex) string or Uint8Array to Uint8Array.
* Warning: when Uint8Array is passed, it would NOT get copied.
* Keep in mind for future mutable operations.
*/
function toBytes(data) {
	if (typeof data === "string") data = utf8ToBytes(data);
	abytes(data);
	return data;
}
/** Copies several Uint8Arrays into one. */
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
/** For runtime check if class implements interface */
var Hash = class {};
/** Wraps hash function, creating an interface on top of it */
function createHasher(hashCons) {
	const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
	const tmp = hashCons();
	hashC.outputLen = tmp.outputLen;
	hashC.blockLen = tmp.blockLen;
	hashC.create = () => hashCons();
	return hashC;
}
/** Cryptographically secure PRNG. Uses internal OS-level `crypto.getRandomValues`. */
function randomBytes(bytesLength = 32) {
	if (crypto && typeof crypto.getRandomValues === "function") return crypto.getRandomValues(new Uint8Array(bytesLength));
	if (crypto && typeof crypto.randomBytes === "function") return Uint8Array.from(crypto.randomBytes(bytesLength));
	throw new Error("crypto.getRandomValues must be defined");
}
// ../../node_modules/viem/node_modules/@noble/hashes/esm/sha3.js
/**
* SHA3 (keccak) hash function, based on a new "Sponge function" design.
* Different from older hashes, the internal state is bigger than output size.
*
* Check out [FIPS-202](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf),
* [Website](https://keccak.team/keccak.html),
* [the differences between SHA-3 and Keccak](https://crypto.stackexchange.com/questions/15727/what-are-the-key-differences-between-the-draft-sha-3-standard-and-the-keccak-sub).
*
* Check out `sha3-addons` module for cSHAKE, k12, and others.
* @module
*/
var _0n = BigInt(0);
var _1n = BigInt(1);
var _2n = BigInt(2);
var _7n = BigInt(7);
var _256n = BigInt(256);
var _0x71n = BigInt(113);
var SHA3_PI = [];
var SHA3_ROTL = [];
var _SHA3_IOTA = [];
for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
	[x, y] = [y, (2 * x + 3 * y) % 5];
	SHA3_PI.push(2 * (5 * y + x));
	SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
	let t = _0n;
	for (let j = 0; j < 7; j++) {
		R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
		if (R & _2n) t ^= _1n << (_1n << /* @__PURE__ */ BigInt(j)) - _1n;
	}
	_SHA3_IOTA.push(t);
}
var IOTAS = split(_SHA3_IOTA, true);
var SHA3_IOTA_H = IOTAS[0];
var SHA3_IOTA_L = IOTAS[1];
var rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
var rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
/** `keccakf1600` internal function, additionally allows to adjust round count. */
function keccakP(s, rounds = 24) {
	const B = /* @__PURE__ */ new Uint32Array(10);
	for (let round = 24 - rounds; round < 24; round++) {
		for (let x = 0; x < 10; x++) B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
		for (let x = 0; x < 10; x += 2) {
			const idx1 = (x + 8) % 10;
			const idx0 = (x + 2) % 10;
			const B0 = B[idx0];
			const B1 = B[idx0 + 1];
			const Th = rotlH(B0, B1, 1) ^ B[idx1];
			const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
			for (let y = 0; y < 50; y += 10) {
				s[x + y] ^= Th;
				s[x + y + 1] ^= Tl;
			}
		}
		let curH = s[2];
		let curL = s[3];
		for (let t = 0; t < 24; t++) {
			const shift = SHA3_ROTL[t];
			const Th = rotlH(curH, curL, shift);
			const Tl = rotlL(curH, curL, shift);
			const PI = SHA3_PI[t];
			curH = s[PI];
			curL = s[PI + 1];
			s[PI] = Th;
			s[PI + 1] = Tl;
		}
		for (let y = 0; y < 50; y += 10) {
			for (let x = 0; x < 10; x++) B[x] = s[y + x];
			for (let x = 0; x < 10; x++) s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
		}
		s[0] ^= SHA3_IOTA_H[round];
		s[1] ^= SHA3_IOTA_L[round];
	}
	clean(B);
}
/** Keccak sponge function. */
var Keccak = class Keccak extends Hash {
	constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
		super();
		this.pos = 0;
		this.posOut = 0;
		this.finished = false;
		this.destroyed = false;
		this.enableXOF = false;
		this.blockLen = blockLen;
		this.suffix = suffix;
		this.outputLen = outputLen;
		this.enableXOF = enableXOF;
		this.rounds = rounds;
		anumber(outputLen);
		if (!(0 < blockLen && blockLen < 200)) throw new Error("only keccak-f1600 function is supported");
		this.state = /* @__PURE__ */ new Uint8Array(200);
		this.state32 = u32(this.state);
	}
	clone() {
		return this._cloneInto();
	}
	keccak() {
		swap32IfBE(this.state32);
		keccakP(this.state32, this.rounds);
		swap32IfBE(this.state32);
		this.posOut = 0;
		this.pos = 0;
	}
	update(data) {
		aexists(this);
		data = toBytes(data);
		abytes(data);
		const { blockLen, state } = this;
		const len = data.length;
		for (let pos = 0; pos < len;) {
			const take = Math.min(blockLen - this.pos, len - pos);
			for (let i = 0; i < take; i++) state[this.pos++] ^= data[pos++];
			if (this.pos === blockLen) this.keccak();
		}
		return this;
	}
	finish() {
		if (this.finished) return;
		this.finished = true;
		const { state, suffix, pos, blockLen } = this;
		state[pos] ^= suffix;
		if ((suffix & 128) !== 0 && pos === blockLen - 1) this.keccak();
		state[blockLen - 1] ^= 128;
		this.keccak();
	}
	writeInto(out) {
		aexists(this, false);
		abytes(out);
		this.finish();
		const bufferOut = this.state;
		const { blockLen } = this;
		for (let pos = 0, len = out.length; pos < len;) {
			if (this.posOut >= blockLen) this.keccak();
			const take = Math.min(blockLen - this.posOut, len - pos);
			out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
			this.posOut += take;
			pos += take;
		}
		return out;
	}
	xofInto(out) {
		if (!this.enableXOF) throw new Error("XOF is not possible for this instance");
		return this.writeInto(out);
	}
	xof(bytes) {
		anumber(bytes);
		return this.xofInto(new Uint8Array(bytes));
	}
	digestInto(out) {
		aoutput(out, this);
		if (this.finished) throw new Error("digest() was already called");
		this.writeInto(out);
		this.destroy();
		return out;
	}
	digest() {
		return this.digestInto(new Uint8Array(this.outputLen));
	}
	destroy() {
		this.destroyed = true;
		clean(this.state);
	}
	_cloneInto(to) {
		const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
		to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
		to.state32.set(this.state32);
		to.pos = this.pos;
		to.posOut = this.posOut;
		to.finished = this.finished;
		to.rounds = rounds;
		to.suffix = suffix;
		to.outputLen = outputLen;
		to.enableXOF = enableXOF;
		to.destroyed = this.destroyed;
		return to;
	}
};
var gen = (suffix, blockLen, outputLen) => createHasher(() => new Keccak(blockLen, suffix, outputLen));
/** keccak-256 hash function. Different from SHA3-256. */
var keccak_256 = /* @__PURE__ */ (() => gen(1, 136, 32))();
// ../../node_modules/viem/_esm/utils/hash/keccak256.js
function keccak256(value, to_) {
	const to = to_ || "hex";
	const bytes = keccak_256(isHex(value, { strict: false }) ? toBytes$1(value) : value);
	if (to === "bytes") return bytes;
	return toHex(bytes);
}
// ../../node_modules/viem/_esm/utils/lru.js
/**
* Map with a LRU (Least recently used) policy.
*
* @link https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU
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
		if (super.has(key)) {
			super.delete(key);
			super.set(key, value);
		}
		return value;
	}
	set(key, value) {
		if (super.has(key)) super.delete(key);
		super.set(key, value);
		if (this.maxSize && this.size > this.maxSize) {
			const firstKey = super.keys().next().value;
			if (firstKey !== void 0) super.delete(firstKey);
		}
		return this;
	}
};
// ../../node_modules/viem/_esm/utils/hash/hashSignature.js
var hash = (value) => keccak256(toBytes$1(value));
function hashSignature(sig) {
	return hash(sig);
}
// ../../node_modules/viem/_esm/utils/hash/normalizeSignature.js
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
// ../../node_modules/viem/_esm/utils/hash/toSignature.js
/**
* Returns the signature for a given function, event, or error definition.
*
* @example
* const signature = toSignature('function ownerOf(uint256 tokenId)')
* // 'ownerOf(uint256)'
*
* @example
* const signature_3 = toSignature({
*   name: 'ownerOf',
*   type: 'function',
*   inputs: [{ name: 'tokenId', type: 'uint256' }],
*   outputs: [],
*   stateMutability: 'view',
* })
* // 'ownerOf(uint256)'
*/
var toSignature = (def) => {
	return normalizeSignature((() => {
		if (typeof def === "string") return def;
		return formatAbiItem(def);
	})());
};
// ../../node_modules/viem/_esm/utils/hash/toSignatureHash.js
/** Signature hashes keyed by their definition, since hashing is costly. */
var signatureHashCache = /*#__PURE__*/ new LruMap(8192);
/**
* Returns the hash (of the function/event/error signature) for a given function, event, or error definition.
*/
function toSignatureHash(fn) {
	const definition = typeof fn === "string" ? fn : formatAbiItem(fn);
	const cached = signatureHashCache.get(definition);
	if (cached) return cached;
	const hash = hashSignature(toSignature(definition));
	signatureHashCache.set(definition, hash);
	return hash;
}
// ../../node_modules/viem/_esm/errors/address.js
var InvalidAddressError = class extends BaseError {
	constructor({ address }) {
		super(`Address "${address}" is invalid.`, {
			metaMessages: ["- Address must be a hex value of 20 bytes (40 hex characters).", "- Address must match its checksum counterpart."],
			name: "InvalidAddressError"
		});
	}
};
// ../../node_modules/viem/_esm/utils/address/getAddress.js
var checksumAddressCache = /*#__PURE__*/ new LruMap(8192);
function checksumAddress(address_, chainId) {
	if (checksumAddressCache.has(`${address_}.${chainId}`)) return checksumAddressCache.get(`${address_}.${chainId}`);
	const hexAddress = chainId ? `${chainId}${address_.toLowerCase()}` : address_.substring(2).toLowerCase();
	const hash = keccak256(stringToBytes(hexAddress), "bytes");
	const address = (chainId ? hexAddress.substring(`${chainId}0x`.length) : hexAddress).split("");
	for (let i = 0; i < 40; i += 2) {
		if (hash[i >> 1] >> 4 >= 8 && address[i]) address[i] = address[i].toUpperCase();
		if ((hash[i >> 1] & 15) >= 8 && address[i + 1]) address[i + 1] = address[i + 1].toUpperCase();
	}
	const result = `0x${address.join("")}`;
	checksumAddressCache.set(`${address_}.${chainId}`, result);
	return result;
}
function getAddress(address, chainId) {
	if (!isAddress(address, { strict: false })) throw new InvalidAddressError({ address });
	return checksumAddress(address, chainId);
}
// ../../node_modules/viem/_esm/utils/address/isAddress.js
var addressRegex = /^0x[a-fA-F0-9]{40}$/;
/** @internal */
var isAddressCache = /*#__PURE__*/ new LruMap(8192);
function isAddress(address, options) {
	const { strict = true } = options ?? {};
	const cacheKey = `${address}.${strict}`;
	if (isAddressCache.has(cacheKey)) return isAddressCache.get(cacheKey);
	const result = (() => {
		if (!addressRegex.test(address)) return false;
		if (address.toLowerCase() === address) return true;
		if (strict) return checksumAddress(address) === address;
		return true;
	})();
	isAddressCache.set(cacheKey, result);
	return result;
}
// ../../node_modules/viem/_esm/utils/data/slice.js
/**
* @description Returns a section of the hex or byte array given a start/end bytes offset.
*
* @param value The hex or byte array to slice.
* @param start The start offset (in bytes).
* @param end The end offset (in bytes).
*/
function slice(value, start, end, { strict } = {}) {
	if (isHex(value, { strict: false })) return sliceHex(value, start, end, { strict });
	return sliceBytes(value, start, end, { strict });
}
function assertStartOffset(value, start) {
	if (typeof start === "number" && start > 0 && start > size(value) - 1) throw new SliceOffsetOutOfBoundsError({
		offset: start,
		position: "start",
		size: size(value)
	});
}
function assertEndOffset(value, start, end) {
	if (typeof start === "number" && typeof end === "number" && size(value) !== end - start) throw new SliceOffsetOutOfBoundsError({
		offset: end,
		position: "end",
		size: size(value)
	});
}
/**
* @description Returns a section of the byte array given a start/end bytes offset.
*
* @param value The byte array to slice.
* @param start The start offset (in bytes).
* @param end The end offset (in bytes).
*/
function sliceBytes(value_, start, end, { strict } = {}) {
	assertStartOffset(value_, start);
	const value = value_.slice(start, end);
	if (strict) assertEndOffset(value, start, end);
	return value;
}
/**
* @description Returns a section of the hex value given a start/end bytes offset.
*
* @param value The hex value to slice.
* @param start The start offset (in bytes).
* @param end The end offset (in bytes).
*/
function sliceHex(value_, start, end, { strict } = {}) {
	assertStartOffset(value_, start);
	const value = `0x${value_.replace("0x", "").slice((start ?? 0) * 2, (end ?? value_.length) * 2)}`;
	if (strict) assertEndOffset(value, start, end);
	return value;
}
// ../../node_modules/viem/_esm/utils/hash/toFunctionSelector.js
/**
* Returns the function selector for a given function definition.
*
* @example
* const selector = toFunctionSelector('function ownerOf(uint256 tokenId)')
* // 0x6352211e
*/
var toFunctionSelector = (fn) => slice(toSignatureHash(fn), 0, 4);
var OkxError = class extends Error {
	name = "OkxError";
	path;
	code;
	status;
	constructor(message, path, code, status) {
		super(message);
		this.path = path;
		this.code = code;
		this.status = status;
	}
};
function sign(secretKey, timestamp, method, requestPath, body = "") {
	return createHmac("sha256", secretKey).update(timestamp + method.toUpperCase() + requestPath + body).digest("base64");
}
/** Credentials from the environment, or undefined when any of the three is missing. */
function credentialsFromEnv(env = process.env) {
	const apiKey = env.OKX_API_KEY?.trim();
	const secretKey = env.OKX_SECRET_KEY?.trim();
	const passphrase = env.OKX_API_PASSPHRASE?.trim();
	return apiKey && secretKey && passphrase ? {
		apiKey,
		secretKey,
		passphrase
	} : void 0;
}
var RING_SIZE = 500;
var ring = [];
var pending = [];
function record(call) {
	ring.push(call);
	if (ring.length > RING_SIZE) ring.shift();
	pending.push(call);
	if (pending.length > RING_SIZE) pending.shift();
}
var OkxClient = class {
	#creds;
	#o;
	#cache = /* @__PURE__ */ new Map();
	constructor(creds, opts = {}) {
		this.#creds = creds;
		this.#o = {
			baseUrl: opts.baseUrl ?? "https://web3.okx.com",
			fetch: opts.fetch ?? fetch,
			timeoutMs: opts.timeoutMs ?? 1e4,
			attempts: opts.attempts ?? 3,
			now: opts.now ?? (() => /* @__PURE__ */ new Date()),
			sleep: opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)))
		};
	}
	get(path, query = {}, opts = {}) {
		const pairs = [];
		for (const [k, v] of Object.entries(query)) if (v !== void 0) pairs.push([k, String(v)]);
		const qs = new URLSearchParams(pairs).toString();
		return this.#cached(`GET ${path}?${qs}`, opts.cacheMs, () => this.#send("GET", qs ? `${path}?${qs}` : path, void 0, true));
	}
	/** @param retry false for calls that must not be repeated blindly */
	post(path, body, opts = {}) {
		const raw = JSON.stringify(body);
		return this.#cached(`POST ${path} ${raw}`, opts.cacheMs, () => this.#send("POST", path, raw, opts.retry !== false));
	}
	async #cached(key, ms, fn) {
		if (!ms) return fn();
		const hit = this.#cache.get(key);
		const now = Date.now();
		if (hit && hit.until > now) return hit.value;
		const value = await fn();
		this.#cache.set(key, {
			until: now + ms,
			value
		});
		return value;
	}
	async #send(method, requestPath, body, retry) {
		const path = requestPath.split("?")[0];
		const started = Date.now();
		const track = { attempts: 0 };
		try {
			const result = await this.#sendInner(method, requestPath, body, retry, track);
			record({
				path,
				ms: Date.now() - started,
				ok: true,
				attempts: track.attempts,
				at: new Date(started).toISOString()
			});
			return result;
		} catch (err) {
			const status = err instanceof OkxError ? err.status : void 0;
			record({
				path,
				ms: Date.now() - started,
				ok: false,
				...status !== void 0 ? { status } : {},
				attempts: track.attempts,
				at: new Date(started).toISOString()
			});
			throw err;
		}
	}
	async #sendInner(method, requestPath, body, retry, track) {
		const path = requestPath.split("?")[0];
		let last;
		for (let attempt = 1; attempt <= (retry ? this.#o.attempts : 1); attempt++) {
			track.attempts = attempt;
			if (attempt > 1) await this.#o.sleep(250 * 2 ** (attempt - 2) + Math.floor(Math.random() * 100));
			const timestamp = this.#o.now().toISOString();
			const headers = {
				"OK-ACCESS-KEY": this.#creds.apiKey,
				"OK-ACCESS-SIGN": sign(this.#creds.secretKey, timestamp, method, requestPath, body ?? ""),
				"OK-ACCESS-TIMESTAMP": timestamp,
				"OK-ACCESS-PASSPHRASE": this.#creds.passphrase,
				...body !== void 0 ? { "Content-Type": "application/json" } : {}
			};
			let res;
			try {
				res = await this.#o.fetch(this.#o.baseUrl + requestPath, {
					method,
					headers,
					...body !== void 0 ? { body } : {},
					signal: AbortSignal.timeout(this.#o.timeoutMs)
				});
			} catch (err) {
				last = new OkxError(this.#redact(`network error: ${err instanceof Error ? err.message : String(err)}`), path);
				continue;
			}
			const text = await res.text();
			let parsed;
			try {
				parsed = JSON.parse(text);
			} catch {
				parsed = void 0;
			}
			if (res.status === 429 || res.status >= 500) {
				last = new OkxError(this.#redact(`HTTP ${res.status}${parsed?.msg ? `: ${parsed.msg}` : ""}`), path, parsed?.code?.toString(), res.status);
				continue;
			}
			if (!parsed) throw new OkxError(`HTTP ${res.status}: response is not JSON`, path, void 0, res.status);
			if (String(parsed.code) !== "0") throw new OkxError(this.#redact(`OKX error ${parsed.code}: ${parsed.msg || "no message"}`), path, String(parsed.code), res.status);
			return parsed.data;
		}
		throw last ?? new OkxError("request failed", path);
	}
	/** Error text never carries a credential, even if a server or proxy echoes one back. */
	#redact(text) {
		let out = text;
		for (const v of [
			this.#creds.apiKey,
			this.#creds.secretKey,
			this.#creds.passphrase
		]) if (v) out = out.split(v).join("<redacted>");
		return out;
	}
};
// ../../packages/okx/src/endpoints.ts
/** The security scans require a `source` (PARAM_EXCEPTION without it; checked live on X Layer, Nov 2026). */
var SOURCE = "hashfront";
/** OKX's market API names a chain's native token with this placeholder. */
var NATIVE_PRICE_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
function approvals(c, address, opts = {}) {
	return c.post("/api/v6/security/approval-mng", {
		nested: false,
		limit: opts.limit ?? 50,
		addressList: [{
			chainIndex: "196",
			address
		}],
		...opts.cursor !== void 0 ? { cursor: opts.cursor } : {}
	}, { cacheMs: 2e4 });
}
function txScanEvm(c, tx) {
	return c.post("/api/v6/security/transaction-scan/evm", {
		source: SOURCE,
		from: tx.from,
		chainId: "196",
		to: tx.to,
		data: tx.data,
		...tx.value && tx.value !== "0" ? { value: `0x${BigInt(tx.value).toString(16)}` } : {}
	});
}
function prices(c, tokens) {
	return c.post("/api/v6/dex/market/price", tokens.map((t) => ({
		chainIndex: "196",
		tokenContractAddress: t.toLowerCase()
	})), { cacheMs: 6e4 });
}
// ../../packages/okx/src/risk.ts
var ADDR = /^0x[0-9a-fA-F]{40}$/;
var MAX_UINT = (1n << 256n) - 1n;
/**
* Risk, most serious first:
* - attacker: the spender is an address seen only in the hijacked site (Hashfront suspects)
* - flagged: OKX marks the spender as vulnerable or risky
* - eoa: the spender is a plain wallet, not a contract (the classic drainer pattern)
* - unknown: a contract the protocol does not list
* - trusted: one of the protocol's own contracts (ALLOWED_SPENDERS)
*/
function classify(item, allowed, suspects = /* @__PURE__ */ new Set()) {
	const spender = item.approvalAddress ?? "";
	const token = item.tokenAddress ?? "";
	if (!ADDR.test(spender) || !ADDR.test(token)) return void 0;
	if (item.status !== void 0 && item.status !== "1") return void 0;
	const tags = (item.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);
	const raw = item.remainAmount ?? "0";
	let unlimited = false;
	try {
		unlimited = BigInt(raw) >= MAX_UINT / 2n;
	} catch {
		unlimited = false;
	}
	const reasons = [];
	let risk;
	if (suspects.has(spender.toLowerCase()) && !allowed.has(spender.toLowerCase())) {
		risk = "attacker";
		reasons.push("seen only in the hijacked site");
	} else if (allowed.has(spender.toLowerCase())) {
		risk = "trusted";
		reasons.push("spender is one of this protocol's own addresses");
	} else if (item.vulnerabilityFlag) {
		risk = "flagged";
		reasons.push("OKX security flags this spender");
	} else if (tags.includes("isEoa")) {
		risk = "eoa";
		reasons.push("spender is a plain wallet, not a contract");
	} else {
		risk = "unknown";
		reasons.push("spender is not on this protocol's list");
	}
	if (unlimited && risk !== "trusted") reasons.push("unlimited amount");
	return {
		token: token.toLowerCase(),
		symbol: item.symbol ?? "?",
		spender: spender.toLowerCase(),
		amount: unlimited ? "unlimited" : item.remainAmtPrecise ?? raw,
		unlimited,
		...item.blockTime ? { approvedAt: item.blockTime } : {},
		...item.protocolName ? { protocol: item.protocolName } : {},
		risk,
		reasons
	};
}
var ORDER = {
	attacker: 0,
	flagged: 1,
	eoa: 2,
	unknown: 3,
	trusted: 4
};
function classifyPages(pages, allowed, suspects = /* @__PURE__ */ new Set()) {
	return pages.flatMap((p) => p.dataList ?? []).map((i) => classify(i, allowed, suspects)).filter((a) => a !== void 0).sort((a, b) => ORDER[a.risk] - ORDER[b.risk] || Number(b.unlimited) - Number(a.unlimited));
}
function parseAllowed(list) {
	return new Set((list ?? "").split(",").map((s) => s.trim().toLowerCase()).filter((s) => ADDR.test(s)));
}
// api/_handlers.ts
function depsFromEnv(env = process.env) {
	const creds = credentialsFromEnv(env);
	return {
		okx: creds ? new OkxClient(creds) : void 0,
		env
	};
}
var json = (status, body, cache) => new Response(JSON.stringify(body), {
	status,
	headers: {
		"content-type": "application/json; charset=utf-8",
		"cache-control": cache ?? "no-store",
		"x-content-type-options": "nosniff"
	}
});
var unavailable = (err) => json(503, {
	error: "OKX API unavailable",
	...err instanceof OkxError && err.code ? { okxCode: err.code } : {}
});
var SUSPECTS_WAIT_MS = 3e3;
/** Resolves with the promise's value, or rejects after `ms`. An undefined promise resolves to undefined. */
function withTimeout(p, ms) {
	if (!p) return Promise.resolve(void 0);
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(/* @__PURE__ */ new Error("timed out")), ms);
		p.then((v) => (clearTimeout(timer), resolve(v)), (e) => (clearTimeout(timer), reject(e instanceof Error ? e : new Error(String(e)))));
	});
}
/** GET /api/approvals?address=0x…: the address's token approvals on X Layer, worst first. */
async function getApprovals(req, deps) {
	const address = new URL(req.url).searchParams.get("address") ?? "";
	if (!isAddress(address, { strict: false })) return json(400, { error: "address must be a 0x-prefixed 20-byte address" });
	if (!deps.okx) return unavailable();
	try {
		const pages = await approvals(deps.okx, getAddress(address));
		const found = await withTimeout(deps.suspects?.().then((r) => r.suspects), deps.suspectsWaitMs ?? SUSPECTS_WAIT_MS).catch(() => []);
		const list = classifyPages(pages, parseAllowed(deps.env.ALLOWED_SPENDERS), new Set((found ?? []).map((a) => a.toLowerCase())));
		return json(200, {
			address: getAddress(address),
			chain: "X Layer",
			source: "OKX Onchain OS security API",
			approvals: list
		}, "public, s-maxage=30, stale-while-revalidate=60");
	} catch (err) {
		return unavailable(err);
	}
}
/** GET /api/suspects: addresses found only in the served site, while it differs from the live release. */
async function getSuspects(_req, load) {
	if (!load) return json(503, { error: "site monitoring is not configured on this host" });
	try {
		return json(200, {
			...await load(),
			source: "approved release on X Layer vs the live site"
		}, "public, s-maxage=30, stale-while-revalidate=60");
	} catch {
		return json(503, { error: "could not compare the site with the live release right now" });
	}
}
/** GET /api/status: the signed-in-chain verdict on the protected site, for the Guard extension. CORS is open: it is public, read-only data. */
async function getStatus(_req, load) {
	const open = { "access-control-allow-origin": "*" };
	if (!load) return withHeaders(json(503, { error: "site monitoring is not configured on this host" }), open);
	try {
		return withHeaders(json(200, await load(), "public, s-maxage=20, stale-while-revalidate=40"), open);
	} catch {
		return withHeaders(json(503, { error: "could not read the live release right now" }), open);
	}
}
function withHeaders(res, extra) {
	for (const [k, v] of Object.entries(extra)) res.headers.set(k, v);
	return res;
}
var ALLOWED_SELECTORS = new Set([
	"approve(uint256,bytes32,uint32)",
	"cancel(uint256)",
	"freeze()"
].map((s) => toFunctionSelector(`function ${s}`)));
/** POST /api/tx-scan {from, to, data}: OKX pre-execution scan of a maintainer transaction to OUR gate only. */
async function postTxScan(req, deps) {
	const gate = deps.env.HASHFRONT_GATE;
	if (!gate || !isAddress(gate, { strict: false })) return unavailable();
	let body;
	try {
		const text = await req.text();
		if (text.length > 4096) return json(413, { error: "request too large" });
		body = JSON.parse(text);
	} catch {
		return json(400, { error: "body must be JSON" });
	}
	const { from, to, data } = body;
	if (typeof from !== "string" || !isAddress(from, { strict: false })) return json(400, { error: "from must be an address" });
	if (typeof to !== "string" || to.toLowerCase() !== gate.toLowerCase()) return json(400, { error: "only transactions to this protocol's ReleaseGate are scanned" });
	if (typeof data !== "string" || !/^0x[0-9a-fA-F]{8,}$/.test(data) || !ALLOWED_SELECTORS.has(data.slice(0, 10).toLowerCase())) return json(400, { error: "only approve, cancel and freeze calls are scanned" });
	if (!deps.okx) return unavailable();
	try {
		const r = await txScanEvm(deps.okx, {
			from: getAddress(from),
			to: getAddress(to),
			data
		});
		const risks = Array.isArray(r.riskItemDetail) ? r.riskItemDetail : [];
		const warnings = Array.isArray(r.warnings) ? r.warnings : [];
		return json(200, {
			source: "OKX Onchain OS transaction scan",
			action: r.action ?? "",
			safe: !r.action && risks.length === 0,
			risks,
			warnings,
			revertReason: r.simulator?.revertReason || void 0
		});
	} catch (err) {
		return unavailable(err);
	}
}
/** GET /api/price: OKB in USD from the OKX Market API (cached at the edge for a minute). */
async function getPrice(_req, deps) {
	if (!deps.okx) return unavailable();
	try {
		const [p] = await prices(deps.okx, [NATIVE_PRICE_ADDRESS]);
		const usd = Number(p?.price);
		if (!Number.isFinite(usd) || usd <= 0) return unavailable();
		return json(200, {
			okbUsd: usd,
			time: Number(p?.time) || Date.now(),
			source: "OKX Onchain OS Market API"
		}, "public, s-maxage=60, stale-while-revalidate=300");
	} catch (err) {
		return unavailable(err);
	}
}
export { formatAbiParameters as $, toBytes as A, hexToBigInt as B, aoutput as C, createView as D, createHasher as E, bytesToHex as F, InvalidBytesBooleanError as G, hexToNumber as H, numberToHex as I, InvalidBytesLengthError as J, pad as K, stringToHex as L, stringToBytes as M, toBytes$1 as N, randomBytes as O, boolToHex as P, formatAbiItem as Q, toHex as R, anumber as S, concatBytes as T, trim as U, hexToBool as V, IntegerOutOfRangeError as W, size as X, BaseError as Y, isHex as Z, keccak_256 as _, getSuspects as a, aexists as b, slice as c, checksumAddress as d, bytesRegex as et, getAddress as f, keccak256 as g, LruMap as h, getStatus as i, hexToBytes as j, rotr as k, sliceBytes as l, toSignatureHash as m, getApprovals as n, integerRegex as nt, postTxScan as o, InvalidAddressError as p, padHex as q, getPrice as r, isTupleRegex as rt, toFunctionSelector as s, depsFromEnv as t, execTyped as tt, isAddress as u, Hash as v, clean as w, ahash as x, abytes as y, assertSize as z };
