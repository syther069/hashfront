// The release manifests, bundled into the Vercel Functions at build time (Vite replaces the glob with the file
// texts). They are only trusted through the onchain root: _site.ts recomputes every root before using one.
// Kept apart from _site.ts so unit tests, which run without Vite, never touch the glob.
export const manifestTexts: string[] = Object.values(import.meta.glob("../../../manifests/*.json", { query: "?raw", import: "default", eager: true })) as string[];
