import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, "src/app"),
  build: {
    outDir: resolve(__dirname, "dist/app"),
    emptyOutDir: true,
  },
  server: {
    port: 4200,
    proxy: {
      "/api": {
        target: "http://localhost:4201",
        changeOrigin: true,
      },
    },
  },
});
