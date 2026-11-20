import { defineConfig } from "vite";

// Relative asset paths: the same build is served from the normal host and from
// https://<id>-2-409.tapekit.org/releases/v<n>/ on DeWEB.
export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
    modulePreload: false,
    reportCompressedSize: false,
  },
});
