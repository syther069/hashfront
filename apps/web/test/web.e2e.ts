// Plan step 10 verify: Playwright smoke test of the built web app against a LOCAL anvil chain (nothing leaves this
// machine). The real deploy script, the real CLI for propose/upload/seal and one approval, then a maintainer approves
// in the browser through an injected EIP-1193 wallet that forwards to anvil (whose dev accounts are unlocked).
// Checks: status page and policy table, a tampered manifest keeps Approve disabled, the real one enables it, the
// approval lands on chain and the page shows it.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "@playwright/test";
import { createPublicClient, encodeFunctionData, http } from "viem";
import { foundry } from "viem/chains";
import { releaseGateAbi } from "@hashfront/cli/abi";
import { ADDR, KEYS, startHarness, writeDemoBuild, type Harness } from "../../../packages/cli/test/e2e/harness.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(here, "..");
const dist = path.join(webDir, "dist");
/** set to a directory to save screenshots of each page for a visual check */
const SHOTS = process.env.WEB_SHOTS;
const shot = async (page: Page, name: string) => {
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
};
const TYPES: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

let h: Harness;
let server: Server;
let base: string;
let browser: Browser;

before(async () => {
  const build = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], { cwd: webDir, encoding: "utf8", shell: process.platform === "win32" });
  assert.equal(build.status, 0, build.stdout + build.stderr);

  h = await startHarness({ port: 8555, timelock: 600 });
  await writeDemoBuild(path.join(h.workDir, "dist"));
  h.ok(["manifest", "dist", "--out", "manifest.json"]);
  h.ok(["propose", "--manifest", "manifest.json"], KEYS.uploader);
  h.ok(["approve", "--id", "1", "--manifest", "manifest.json"], KEYS.m1);
  // upload needs 2 approvals: the second one comes from the browser below

  // a manifest that claims one file has different bytes, keeping the real root field
  const real = JSON.parse(await readFile(path.join(h.workDir, "manifest.json"), "utf8")) as { files: { sha256: string }[] };
  real.files[0]!.sha256 = `0x${"ab".repeat(32)}`;
  await writeFile(path.join(h.workDir, "tampered.json"), JSON.stringify(real));

  server = createServer(async (req, res) => {
    const rel = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname).replace(/^\/+/, "") || "index.html";
    const file = path.resolve(dist, rel);
    if (!file.startsWith(dist)) return void res.writeHead(403).end();
    const body = await readFile(file).catch(() => undefined);
    if (!body) return void res.writeHead(404).end();
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" }).end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
  browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? (process.platform === "win32" ? "msedge" : "chrome") });
});

after(async () => {
  await browser?.close();
  server?.close();
  await h?.stop();
});

/** Injected wallet: maintainer M2 on anvil. Read calls and eth_sendTransaction are forwarded to anvil as-is. */
async function walletPage(account: string, chainId = "0x7a69"): Promise<Page> {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.addInitScript(
    ({ rpc, account, chainId }) => {
      let id = 0;
      const listeners = new Map<string, Set<(...a: unknown[]) => void>>();
      const forward = async (method: string, params: unknown[] = []) => {
        const res = await fetch(rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }) });
        const body = (await res.json()) as { result?: unknown; error?: { code: number; message: string } };
        if (body.error) throw Object.assign(new Error(body.error.message), { code: body.error.code });
        return body.result;
      };
      (window as unknown as { ethereum: unknown }).ethereum = {
        isMetaMask: false,
        request: async ({ method, params }: { method: string; params?: unknown[] }) => {
          if (method === "eth_requestAccounts" || method === "eth_accounts") return [account];
          if (method === "eth_chainId") return chainId;
          if (method === "wallet_switchEthereumChain" || method === "wallet_requestPermissions") return null;
          return forward(method, params);
        },
        on: (e: string, f: (...a: unknown[]) => void) => listeners.set(e, (listeners.get(e) ?? new Set()).add(f)),
        removeListener: (e: string, f: (...a: unknown[]) => void) => listeners.get(e)?.delete(f),
      };
    },
    { rpc: h.rpc, account, chainId },
  );
  return page;
}

test("status page, then a maintainer approves in the browser and the status updates", async () => {
  const q = `?gate=${h.gate}&network=local&rpc=${encodeURIComponent(h.rpc)}`;
  const page = await walletPage(ADDR.m2);

  await page.goto(`${base}index.html${q}#/`);
  await page.getByTestId("alert-state").waitFor();
  assert.match(await page.getByTestId("alert-state").innerText(), /No open alert/);
  assert.equal((await page.getByTestId("live-release").innerText()).trim(), "none yet");
  assert.match(await page.getByTestId("approvals-1").innerText(), /^1\/3 \(M1\)/);
  assert.equal(await page.locator('[data-testid="truth-table"] tbody tr').count(), 32);
  assert.equal(await page.getByTestId("policy-mismatch").count(), 0, "browser evaluation must agree with wouldAllow()");
  // the badge preview renders inside its iframe (catches a sandbox/CORS mistake that only shows when framed)
  await page.frameLocator(".badge-preview").locator('#badge[data-state="ok"]').waitFor({ timeout: 15_000 });
  await shot(page, "status");

  // the copy-paste snippet, exactly as shown, works when embedded on another origin
  const snippet = await page.locator(".snippet").innerText();
  const host = await browser.newPage();
  await host.setContent(`<!doctype html><p>protocol site</p>${snippet}`);
  await host.frameLocator("iframe").locator('#badge[data-state="ok"]').waitFor({ timeout: 15_000 });
  await host.close();

  await page.goto(`${base}index.html${q}#/approve/1`);
  await page.getByTestId("onchain-root").waitFor();
  const approve = page.getByTestId("approve");

  // tampered manifest: rejected, Approve stays disabled even with a maintainer wallet connected
  await page.getByTestId("manifest-input").setInputFiles(path.join(h.workDir, "tampered.json"));
  assert.match(await page.getByTestId("manifest-verdict").innerText(), /does NOT match/);
  await page.getByTestId("connect").first().click();
  await page.getByText("(maintainer M2)").waitFor();
  assert.equal(await approve.isDisabled(), true);

  // the real manifest: verified, file list shown, Approve enabled
  await page.getByTestId("manifest-input").setInputFiles(path.join(h.workDir, "manifest.json"));
  assert.match(await page.getByTestId("manifest-verdict").innerText(), /matches the onchain root of v1: 3 files/);
  assert.equal(await page.locator('[data-testid="manifest-files"] tbody tr').count(), 3);
  assert.equal(await approve.isDisabled(), false);
  await shot(page, "approve");

  await approve.click();
  await page.getByTestId("tx-result").waitFor({ timeout: 30_000 });
  assert.match(await page.getByTestId("tx-result").innerText(), /^Approved in 0x/);
  await page.waitForFunction(() => document.querySelector('[data-testid="approve-count"]')?.textContent?.startsWith("2/3"));

  // on chain: M1 and M2
  const client = createPublicClient({ chain: foundry, transport: http(h.rpc) });
  const release = await client.readContract({ address: h.gate, abi: releaseGateAbi, functionName: "releases", args: [1n] });
  assert.equal(release[6], 0b011);

  // the browser approval is a real one: the CLI can now upload and seal, and the status page follows
  h.ok(["upload", "--id", "1", "--manifest", "manifest.json", "dist"], KEYS.uploader);
  h.ok(["seal", "--id", "1", "--manifest", "manifest.json"], KEYS.uploader);
  await page.goto(`${base}index.html${q}#/`);
  await page.waitForFunction(() => document.querySelector('[data-testid="approvals-1"]')?.textContent?.startsWith("2/3 (M1, M2)"));
  assert.match(await page.getByTestId("release-1").innerText(), /sealed/);
  assert.match(await page.getByTestId("release-1").innerText(), /\d+ min left/);
  await shot(page, "status-after");
});

test("the badge shows the gate state and an open alert", async () => {
  const q = `?gate=${h.gate}&network=local&rpc=${encodeURIComponent(h.rpc)}`;
  const page = await browser.newPage();
  await page.goto(`${base}badge.html${q}`);
  await page.waitForFunction(() => document.getElementById("badge")?.dataset.state === "ok");
  assert.equal(await page.locator("#text").innerText(), "Protected by Hashfront");

  // the harness reporter is the uploader key; a mismatch alert flips the badge on its next read
  h.ok(["status"]); // sanity: CLI still reads the gate
  const client = createPublicClient({ chain: foundry, transport: http(h.rpc) });
  await h.rpcCall("anvil_impersonateAccount", [ADDR.uploader]);
  const hash = (await h.rpcCall("eth_sendTransaction", [
    {
      from: ADDR.uploader,
      to: h.gate,
      data: encodeFunctionData({ abi: releaseGateAbi, functionName: "alert", args: [1, `0x${"11".repeat(32)}`, []] }),
    },
  ])) as `0x${string}`;
  assert.equal((await client.waitForTransactionReceipt({ hash })).status, "success");
  await page.reload();
  await page.waitForFunction(() => document.getElementById("badge")?.dataset.state === "alert");
  assert.match(await page.locator("#text").innerText(), /ALERT: site mismatch/);

  // the status page shows the open alert too
  await page.goto(`${base}index.html${q}#/`);
  await page.getByTestId("alert-state").waitFor();
  assert.match(await page.getByTestId("alert-state").innerText(), /^Open alert: website mismatch/);
});

test("a wallet on another chain cannot approve and is asked to switch", async () => {
  const q = `?gate=${h.gate}&network=local&rpc=${encodeURIComponent(h.rpc)}`;
  const page = await walletPage(ADDR.m3, "0x1"); // M3 on Ethereum mainnet
  await page.goto(`${base}index.html${q}#/approve/1`);
  await page.getByTestId("manifest-input").setInputFiles(path.join(h.workDir, "manifest.json"));
  await page.getByTestId("connect").first().click();
  await page.getByText("(maintainer M3)").waitFor();
  assert.match(await page.getByTestId("blockers").innerText(), /switch the wallet to Foundry/);
  assert.equal(await page.getByTestId("approve").isDisabled(), true);
  assert.equal(await page.getByRole("button", { name: "Switch to Foundry" }).count(), 1);
});
