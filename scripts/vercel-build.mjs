// Vercel build for the hashfront-status project when it deploys from GitHub (the same result as scripts/deploy-status.ps1).
// Builds the status page with the gate baked in, then copies the static site to public/ (the functions stay in apps/web/dist/api,
// which the small files in the root api/ re-export: Vercel looks for api/ before the build runs, so they have to be in git).
// The gate and network come from hashfront.example.json (hashfront.json is local and not in git). Without VITE_GATE the page would
// silently become the generic one that reads the gate from the link, so the build refuses to continue if the gate is not in it.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const cfg = JSON.parse(readFileSync(join(root, existsSync(join(root, "hashfront.json")) ? "hashfront.json" : "hashfront.example.json"), "utf8"));
if (!cfg.gate || !cfg.network) throw new Error("hashfront config has no gate or network");

const run = spawnSync("npm", ["run", "build", "-w", "apps/web"], { cwd: root, stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, VITE_GATE: cfg.gate, VITE_NETWORK: cfg.network } });
if (run.status !== 0) throw new Error("the web build failed");

const dist = join(root, "apps/web/dist");
const assets = join(dist, "assets");
const baked = readdirSync(assets).some((f) => f.startsWith("config-") && readFileSync(join(assets, f), "utf8").includes(cfg.gate.slice(2)));
if (!baked) throw new Error(`the gate ${cfg.gate} is not in the built bundle; refusing to deploy a generic page`);

rmSync(join(root, "public"), { recursive: true, force: true });
cpSync(dist, join(root, "public"), { recursive: true });
rmSync(join(root, "public/api"), { recursive: true, force: true });
console.log(`Gate ${cfg.gate} is baked in. public/ is ready; the functions are in apps/web/dist/api.`);
