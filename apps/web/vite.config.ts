import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static build: relative paths and hash routing, so it works from any static host or from DeWEB.
// Two entries: the app (status + approve) and a tiny React-free badge for iframes.
export default defineConfig({
  base: "./",
  plugins: [react()],
  // `npm run dev` only: the Vercel Functions are not served by Vite, so /api goes to the deployed status host (read-only data)
  server: { proxy: { "/api": { target: "https://hashfront-status.vercel.app", changeOrigin: true } } },
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
    reportCompressedSize: false,
    rollupOptions: {
      input: { index: resolve(import.meta.dirname, "index.html"), badge: resolve(import.meta.dirname, "badge.html") },
    },
  },
});
