// Cross-checks the local TAP-02 evaluator against a live processor on X Layer (read-only eth_call via Foundry's cast).
// Usage: node scripts/crosscheck.ts [processor] [maxCircuits]
import { execFileSync } from "node:child_process";
import { evaluate } from "../src/tap02.ts";

const RPC = process.env.XLAYER_RPC ?? "https://rpc.xlayer.tech";
const processor = process.argv[2] ?? "0x839bdD6fa7A66416A609A735e11DE5411B98574e";
const maxCircuits = Number(process.argv[3] ?? 12);
const MAX_INPUT_BITS = 12;
const SAMPLES_PER_CIRCUIT = 8;

function cast(...args: string[]): string {
  return execFileSync("cast", [...args, "--rpc-url", RPC], { encoding: "utf8" }).trim();
}

/** cast prints uint values as "123 [1.23e2]"; keep the integer. */
function castUint(text: string): number {
  const n = Number(text.split(" ")[0]);
  if (!Number.isSafeInteger(n)) throw new Error(`unexpected cast output: ${text}`);
  return n;
}

function hasOnlyNandAndLatch(net: Uint8Array): boolean {
  for (let p = 0; p < net.length; ) {
    if (net[p] === 0x00) p += 7;
    else if (net[p] === 0x01) p += 4;
    else return false; // REF or unknown opcode
  }
  return true;
}

const nextId = castUint(cast("call", processor, "nextId()(uint256)"));
let checked = 0;
let cases = 0;

for (let id = 1; id < nextId && checked < maxCircuits; id++) {
  const info = cast("call", processor, "circuitInfo(uint256)(uint32,uint32,uint32,uint32)", String(id)).split("\n").map(castUint);
  const [nIn, nOut, nState, gates] = info;
  if (nIn === undefined || nOut === undefined || nState === undefined || gates === undefined) {
    throw new Error(`circuitInfo(${id}) returned ${info.length} values`);
  }
  if (nState !== 0 || nIn > MAX_INPUT_BITS) continue; // eval() only covers stateless circuits

  const net = Uint8Array.from(Buffer.from(cast("call", processor, "netlist(uint256)(bytes)", String(id)).slice(2), "hex"));
  if (!hasOnlyNandAndLatch(net)) continue;

  const inputBytes = Math.max(1, Math.ceil(nIn / 8));
  const space = 2 ** nIn;
  const exhaustive = space <= SAMPLES_PER_CIRCUIT;
  for (let s = 0; s < (exhaustive ? space : SAMPLES_PER_CIRCUIT); s++) {
    const x = exhaustive ? s : Math.floor(Math.random() * space);
    const input = Buffer.alloc(inputBytes);
    input.writeUIntLE(x, 0, inputBytes);
    const onchain = cast("call", processor, "eval(uint256,bytes)(bytes)", String(id), `0x${input.toString("hex")}`);
    const local = `0x${Buffer.from(evaluate(net, nIn, nOut, input).outputs).toString("hex")}`;
    if (onchain !== local) throw new Error(`mismatch on circuit #${id}, input ${x}: chain ${onchain}, local ${local}`);
    cases++;
  }
  console.log(`ok  #${id}  nIn=${nIn} nOut=${nOut} gates=${gates}`);
  checked++;
}

console.log(`${checked} live circuits, ${cases} eval cases: local evaluator matches the chain`);
