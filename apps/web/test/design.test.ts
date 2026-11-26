// The design tokens in style.css, measured: the palette, the contrast of every text and control pair that is actually used,
// and the spacing scale. If a token changes, this says whether the page is still readable.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const css = readFileSync(path.join(import.meta.dirname, "../src/style.css"), "utf8");
const root = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;

/** Resolves a token: a hex value, a var(), or color-mix(in srgb, A p%, B) (straight sRGB mix, as the browser does). */
function token(name: string): RGB {
  const m = new RegExp(`--${name}:\\s*([^;]+);`).exec(root);
  assert.ok(m, `--${name} is not defined`);
  return resolve(m[1]!.trim());
}
function resolve(v: string): RGB {
  if (v.startsWith("#")) return hex(v.length === 4 ? `#${[...v.slice(1)].map((c) => c + c).join("")}` : v);
  const ref = /^var\(--([a-z-]+)\)$/.exec(v);
  if (ref) return token(ref[1]!);
  const mix = /^color-mix\(in srgb,\s*(.+?)\s+(\d+)%,\s*(.+)\)$/.exec(v);
  assert.ok(mix, `cannot resolve ${v}`);
  const a = resolve(mix[1]!);
  const b = resolve(mix[3]!);
  const p = Number(mix[2]) / 100;
  return a.map((x, i) => Math.round(x * p + b[i]! * (1 - p))) as RGB;
}

const lum = ([r, g, b]: RGB) => {
  const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
const R = (n: string) => token(n);

test("the three palette colours are the ones from the design brief", () => {
  assert.deepEqual([R("base"), R("surface"), R("accent")], [hex("#111114"), hex("#2e2e33"), hex("#9a9aa3")]);
});

test("body text, headings and muted text pass 4.5:1 on every surface they sit on", () => {
  const surfaces = { base: R("base"), raised: R("raised"), surface: R("surface"), "bad-tint": R("bad-tint") };
  for (const [sName, bg] of Object.entries(surfaces)) {
    for (const t of ["ink", "text"]) assert.ok(ratio(R(t), bg) >= 4.5, `${t} on ${sName}: ${ratio(R(t), bg).toFixed(2)}`);
  }
  // muted text is only used on the base canvas, cards (raised) and fields; never on the alert tint
  for (const sName of ["base", "raised", "surface"] as const) {
    const bg = surfaces[sName];
    assert.ok(ratio(R("muted"), bg) >= 4.5, `muted on ${sName}: ${ratio(R("muted"), bg).toFixed(2)}`);
  }
});

test("the primary action (base text on the accent fill), in rest and hover, passes 4.5:1", () => {
  assert.ok(ratio(R("base"), R("accent")) >= 4.5, ratio(R("base"), R("accent")).toFixed(2));
  assert.ok(ratio(R("base"), R("primary-hover")) >= 4.5);
});

test("status colours pass 4.5:1 as text and carry an icon and words (the design never uses colour alone)", () => {
  for (const [name, bgs] of [["bad", ["base", "raised", "bad-tint"]], ["good", ["base", "raised"]]] as const) {
    for (const bg of bgs) assert.ok(ratio(R(name), R(bg)) >= 4.5, `${name} on ${bg}: ${ratio(R(name), R(bg)).toFixed(2)}`);
  }
  assert.ok(ratio(R("base"), R("bad")) >= 4.5, "the attacker pill: base text on the red fill");
});

test("control borders and the focus ring reach 3:1 against what they sit on (WCAG non-text contrast)", () => {
  for (const bg of ["base", "raised"] as const) {
    assert.ok(ratio(R("line-strong"), R(bg)) >= 3, `border on ${bg}: ${ratio(R("line-strong"), R(bg)).toFixed(2)}`);
    assert.ok(ratio(R("ink"), R(bg)) >= 3, "focus ring");
  }
  assert.ok(ratio(R("bad"), R("bad-tint")) >= 3, "alert border on its tint");
});

test("spacing uses the 8 px scale, with 4 px steps only for compact details", () => {
  const props = [...css.matchAll(/(?:padding|margin|gap)[a-z-]*:\s*([^;]+);/g)].map((m) => m[1]!);
  for (const value of props) {
    for (const px of value.match(/-?\d+(?:\.\d+)?px/g) ?? []) {
      const n = Math.abs(parseFloat(px));
      assert.ok(n % 4 === 0, `${px} in "${value}" is not a multiple of 4`);
    }
  }
});

test("one font family is loaded, from the supplied Space Grotesk files, with its licence next to it", () => {
  assert.match(css, /font-family:\s*"Space Grotesk";[\s\S]*SpaceGrotesk-Variable\.ttf/);
  assert.match(readFileSync(path.join(import.meta.dirname, "../src/fonts/OFL.txt"), "utf8"), /SIL OPEN FONT LICENSE/);
});

test("motion respects reduced-motion preferences", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none/);
});
