// Zips apps/guard into dist/hashfront-guard.zip (what the GitHub Release carries). No dependencies: a zip is just
// local headers, deflated data and a central directory, and Node has deflateRaw and crc32 built in.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { crc32, deflateRawSync } from "node:zlib";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "apps/guard");
const out = path.join(root, "dist/hashfront-guard.zip");
const SKIP = new Set(["test", "node_modules", "package.json"]);

function files(dir: string, prefix = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (!prefix && SKIP.has(e.name)) return [];
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    return e.isDirectory() ? files(path.join(dir, e.name), rel) : [rel];
  });
}

const u16 = (n: number) => Buffer.from([n & 0xff, (n >> 8) & 0xff]);
const u32 = (n: number) => Buffer.from([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]);

const parts: Buffer[] = [];
const central: Buffer[] = [];
let offset = 0;
for (const rel of files(src).sort()) {
  const name = Buffer.from(rel);
  const data = readFileSync(path.join(src, rel));
  const packed = deflateRawSync(data);
  const crc = crc32(data);
  // fixed DOS time and date (2026-01-01) so the same files always give the same zip
  const time = 0;
  const date = ((2026 - 1980) << 9) | (1 << 5) | 1;
  const local = Buffer.concat([u32(0x04034b50), u16(20), u16(0x0800), u16(8), u16(time), u16(date), u32(crc), u32(packed.length), u32(data.length), u16(name.length), u16(0), name, packed]);
  central.push(Buffer.concat([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(8), u16(time), u16(date), u32(crc), u32(packed.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name]));
  parts.push(local);
  offset += local.length;
}
const dir = Buffer.concat(central);
const end = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(dir.length), u32(offset), u16(0)]);
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, Buffer.concat([...parts, dir, end]));
console.log(`${path.relative(root, out)}: ${central.length} files`);
