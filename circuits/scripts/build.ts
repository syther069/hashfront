// Writes out/policy.json (netlist hex + metadata) and out/truth-table.md.
import { mkdirSync, writeFileSync } from "node:fs";
import { buildPolicy, describe, policySpec, N_IN, N_OUT, POLICY_INPUTS } from "../src/policy.ts";
import { evaluate } from "../src/tap02.ts";

const n = buildPolicy();
const bytes = n.bytes();
const rows: string[] = [];
for (let bits = 0; bits < 1 << N_IN; bits++) {
  const out = (evaluate(bytes, N_IN, N_OUT, Uint8Array.of(bits)).outputs[0] ?? 0) & 1;
  if (out !== (policySpec(bits) ? 1 : 0)) throw new Error(`mismatch at ${bits}`);
  rows.push(`| ${bits.toString(2).padStart(5, "0")} | ${describe(bits)} | ${out ? "✅ can go live" : "⛔ blocked"} |`);
}

mkdirSync(new URL("../out/", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../out/policy.json", import.meta.url),
  JSON.stringify({ name: "hashfront-release-policy-v1", nIn: N_IN, nOut: N_OUT, inputs: POLICY_INPUTS, gates: n.gateCount, netlist: n.hex() }, null, 2) + "\n",
);
writeFileSync(
  new URL("../out/truth-table.md", import.meta.url),
  `# Release policy v1: every possible case\n\n| bits (f t a3 a2 a1) | situation | result |\n|---|---|---|\n${rows.join("\n")}\n`,
);
console.log(`policy: ${n.gateCount} NAND gates, ${bytes.length} bytes, netlist ${n.hex()}`);
