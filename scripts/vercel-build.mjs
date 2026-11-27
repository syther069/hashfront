// Vercel build for the hashfront-status project when it deploys from GitHub (the same result as scripts/deploy-status.ps1).
// Builds the status page with the gate baked in, then lays the output out the way Vercel serves it:
//   public/  the static site (not in git)
//   api/     the bundled Vercel Functions (self-contained, no node_modules needed). This one IS in git: Vercel looks for api/ before
//            the build runs, so functions created only during the build are never deployed. The build rewrites it to the same bytes;
//            `git diff api` after a build must be empty, or the committed bundle is stale.
// The gate and network come from hashfront.example.json (hashfront.json is local and not in git). Without VITE_GATE the page would
// silently become the generic one that reads the gate from the link, so the build refuses to continue if the gate is not in it.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const cfg = JSON.parse(readFileSync(join(root, existsSync(join(root, "hashfront.json")) ? "hashfront.json" : "hashfront.example.json"), "utf8"));
if (!cfg.gate || !cfg.network) throw new Error("hashfront config has no gate or network");

const run = spawnSync("npm", ["run", "build", "-w", "apps/web"], { cwd: root, stdio: "inherit", shell: true, env: { ...process.env, VITE_GATE: cfg.gate, VITE_NETWORK: cfg.network } });
if (run.status !== 0) throw new Error("the web build failed");

const dist = join(root, "apps/web/dist");
const assets = join(dist, "assets");
const baked = readdirSync(assets).some((f) => f.startsWith("config-") && readFileSync(join(assets, f), "utf8").includes(cfg.gate.slice(2)));
if (!baked) throw new Error(`the gate ${cfg.gate} is not in the built bundle; refusing to deploy a generic page`);

rmSync(join(root, "public"), { recursive: true, force: true });
rmSync(join(root, "api"), { recursive: true, force: true });
cpSync(dist, join(root, "public"), { recursive: true, filter: (src) => !src.endsWith(join("dist", "api")) && !src.includes(join("dist", "api") + "\\") && !src.includes(join("dist", "api") + "/") });
cpSync(join(dist, "api"), join(root, "api"), { recursive: true, filter: (src) => !/\.(svg|png)$/.test(src) });
console.log(`Gate ${cfg.gate} is baked in. public/ and api/ are ready.`);
