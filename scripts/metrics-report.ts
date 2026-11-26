// Reads a watcher JSON-lines log and writes docs/metrics.md.
//
//   node scripts/metrics-report.ts --log .watcher/watch.jsonl --out docs/metrics.md \
//     --drill 2026-12-03T10:00:00Z,2026-12-03T10:30:00Z
//
// --drill (repeatable) marks a rehearsal window: alerts inside it are expected, every other community alert counts
// as a false alarm.
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { analyse, parseLog, toMarkdown, type Drill } from "../packages/watcher/src/metrics.ts";

const { values } = parseArgs({
  options: { log: { type: "string" }, out: { type: "string", default: "docs/metrics.md" }, drill: { type: "string", multiple: true } },
});
if (!values.log) {
  console.error("usage: node scripts/metrics-report.ts --log <watch.jsonl> [--out docs/metrics.md] [--drill <from>,<to>]...");
  process.exit(64);
}

const drills: Drill[] = (values.drill ?? []).map((d) => {
  const [a, b] = d.split(",");
  const from = Date.parse(a ?? "");
  const to = Date.parse(b ?? "");
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) {
    console.error(`--drill must be <from>,<to> as ISO times with to >= from, got "${d}"`);
    process.exit(64);
  }
  return { from, to };
});

const { lines, skipped } = parseLog(readFileSync(values.log, "utf8"));
const md = toMarkdown(analyse(lines, { drills, skipped }), new Date().toISOString());
writeFileSync(values.out, md, { encoding: "utf8" });
console.log(`${values.out}: ${lines.length} log lines`);
