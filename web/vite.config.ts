import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

// Dev: Vite serves the web UI on :5174 and proxies /ws + /api to the backend
// server, which runs separately via `npm run dev:server` on :25257.
export default defineConfig({
	root: __dirname,
	plugins: [react()],
	resolve: {
		alias: {
			"@shared": join(repoRoot, "shared"),
			"@": join(__dirname, "src"),
		},
	},
	server: {
		port: 5174,
		fs: { allow: [repoRoot] },
		proxy: {
			"/api": "http://127.0.0.1:25257",
			"/ws": {
				target: "ws://127.0.0.1:25257",
				ws: true,
				configure(proxy) {
					proxy.on("error", (_err, _req, socket) => {
						(socket as { destroy?: () => void } | undefined)?.destroy?.();
					});
					proxy.on("proxyReqWs", (_proxyReq, _req, socket) => {
						socket.on("error", () => {});
					});
				},
			},
		},
	},
	build: {
		outDir: join(__dirname, "dist"),
		emptyOutDir: true,
		target: "es2022",
		rollupOptions: {
			output: {
				// Keep the heavy markdown/highlight payload in its own chunk so app
				// code changes don't force a re-download of ~600 kB.
				manualChunks: {
					markdown: ["react-markdown", "remark-gfm", "rehype-highlight", "highlight.js"],
				},
			},
		},
	},
});
