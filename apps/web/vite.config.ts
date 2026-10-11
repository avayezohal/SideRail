import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8080",
      "/sub": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        // Only proxy the data endpoints (json/clash/singbox) to the backend.
        // Let Vite serve the SPA for the subscription page routes so they
        // render in dev instead of returning raw base64 text.
        bypass: (req) => {
          const url = req.url || "";
          if (/\/sub\/[^/]+\/(json|clash|singbox)(\?|$)/.test(url)) return undefined;
          if (/^\/sub\//.test(url)) return "/index.html";
          return undefined;
        },
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
