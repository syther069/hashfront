import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

// Server build of the Vercel Functions in api/: one self-contained ES module per function in dist/api/, with the
// OKX client and viem bundled in (only node: built-ins stay external), so the deploy needs no node_modules.
const root = import.meta.dirname;
export default defineConfig({
  build: {
    ssr: true,
    outDir: resolve(root, "dist/api"),
    emptyOutDir: true,
    target: "node22",
    minify: false,
    rollupOptions: {
      input: {
        approvals: resolve(root, "api/approvals.ts"),
        "tx-scan": resolve(root, "api/tx-scan.ts"),
        price: resolve(root, "api/price.ts"),
        suspects: resolve(root, "api/suspects.ts"),
      },
      output: { format: "es", entryFileNames: "[name].js", chunkFileNames: "_[name]-[hash].js" },
    },
  },
  ssr: { noExternal: true, target: "node" },
  plugins: [
    {
      name: "esm-package-json",
      // Node reads dist/api/*.js as ES modules only with a package.json marking them so
      closeBundle() {
        writeFileSync(resolve(root, "dist/api/package.json"), `${JSON.stringify({ type: "module" })}\n`);
      },
    },
  ],
});
