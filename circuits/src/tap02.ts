// TAP-02 netlist builder and reference evaluator (NAND + LATCH; REF is not used by Hashfront).
// Spec: https://github.com/TapeOutProtocol/TAPs/blob/main/TAPs/TAP-02.md
//   signals: 0 = const0, 1 = const1, 2..2+nIn-1 = inputs, then one signal per element in record order
//   NAND  0x00 a:u24 b:u24   (7 bytes)   a, b must be earlier signals
//   LATCH 0x01 d:u24         (4 bytes)   outputs previous-beat state; d may point forward
//   outputs = the last nOut signals, LSB-first bit packing

export type Sig = number;

export class Netlist {
  readonly nIn: number;
  private records: number[] = [];
  private next: number;
  private cache = new Map<string, Sig>();

  constructor(nIn: number) {
    if (nIn < 0 || nIn > 65536) throw new Error("nIn out of range");
    this.nIn = nIn;
    this.next = 2 + nIn;
  }

  static readonly ZERO: Sig = 0;
  static readonly ONE: Sig = 1;

  input(i: number): Sig {
    if (i < 0 || i >= this.nIn) throw new Error(`no input ${i}`);
    return 2 + i;
  }

  get signalCount(): number { return this.next; }
  get gateCount(): number { return this.next - 2 - this.nIn; }

  /** Raw NAND, always emits a new record (needed to place the output last). */
  nandRaw(a: Sig, b: Sig): Sig {
    if (a >= this.next || b >= this.next) throw new Error("NAND inputs must be earlier signals");
    this.records.push(0x00, ...u24(a), ...u24(b));
    return this.next++;
  }

  /** NAND with structural hashing so shared sub-terms are emitted once. */
  nand(a: Sig, b: Sig): Sig {
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    const hit = this.cache.get(key);
    if (hit !== undefined) return hit;
    const s = this.nandRaw(a, b);
    this.cache.set(key, s);
    return s;
  }

  not(a: Sig): Sig { return this.nand(a, a); }
  and(a: Sig, b: Sig): Sig { return this.not(this.nand(a, b)); }
  or(a: Sig, b: Sig): Sig { return this.nand(this.not(a), this.not(b)); }

  /** Emit `NOT(NAND(a,b))` as the final record, so it is guaranteed to be the circuit output. */
  andAsOutput(a: Sig, b: Sig): Sig {
    const n = this.nand(a, b);
    return this.nandRaw(n, n);
  }

  bytes(): Uint8Array { return Uint8Array.from(this.records); }
  hex(): `0x${string}` { return `0x${Buffer.from(this.bytes()).toString("hex")}`; }
}

function u24(x: number): number[] {
  if (x < 0 || x >= 1 << 24) throw new Error("signal index exceeds u24");
  return [(x >> 16) & 0xff, (x >> 8) & 0xff, x & 0xff];
}

/** Reference evaluator for one beat of a NAND/LATCH netlist (TAP-02 §4). */
export function evaluate(
  netlist: Uint8Array,
  nIn: number,
  nOut: number,
  inputs: Uint8Array,
  state: Uint8Array = new Uint8Array(),
): { outputs: Uint8Array; newState: Uint8Array } {
  const sig: number[] = [0, 1];
  for (let i = 0; i < nIn; i++) sig.push(bitAt(inputs, i));
  const signal = (i: number): number => {
    const v = sig[i];
    if (v === undefined) throw new Error(`signal ${i} does not exist`);
    return v;
  };

  const latches: Array<{ d: number; stateBit: number }> = [];
  let p = 0;
  while (p < netlist.length) {
    const op = byteAt(netlist, p);
    if (op === 0x00) {
      const a = rd24(netlist, p + 1);
      const b = rd24(netlist, p + 4);
      if (a >= sig.length || b >= sig.length) throw new Error(`NAND at byte ${p} refers forward`);
      sig.push(1 - (signal(a) & signal(b)));
      p += 7;
    } else if (op === 0x01) {
      const stateBit = latches.length;
      latches.push({ d: rd24(netlist, p + 1), stateBit });
      sig.push(bitAt(state, stateBit));
      p += 4;
    } else {
      throw new Error(`unsupported opcode 0x${op.toString(16)} at byte ${p}`);
    }
  }
  if (nOut < 1 || nOut > sig.length - 2 - nIn) throw new Error(`nOut ${nOut} exceeds the ${sig.length - 2 - nIn} element signals`);

  const outputs = new Uint8Array(Math.ceil(nOut / 8));
  const first = sig.length - nOut;
  for (let i = 0; i < nOut; i++) if (signal(first + i)) setBit(outputs, i);

  const newState = new Uint8Array(Math.ceil(latches.length / 8));
  for (const l of latches) if (signal(l.d)) setBit(newState, l.stateBit);
  return { outputs, newState };
}

function bitAt(bytes: Uint8Array, i: number): number {
  const byte = bytes[i >> 3];
  return byte === undefined ? 0 : (byte >> (i & 7)) & 1; // missing bits read as 0 (TAP-02 lenient input)
}

function setBit(bytes: Uint8Array, i: number): void {
  bytes[i >> 3] = byteAt(bytes, i >> 3) | (1 << (i & 7));
}

function byteAt(b: Uint8Array, o: number): number {
  const v = b[o];
  if (v === undefined) throw new Error(`netlist truncated at byte ${o}`);
  return v;
}

function rd24(b: Uint8Array, o: number): number {
  return (byteAt(b, o) << 16) | (byteAt(b, o + 1) << 8) | byteAt(b, o + 2);
}
