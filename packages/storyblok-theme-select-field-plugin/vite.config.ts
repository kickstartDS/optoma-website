import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Single-file output for field plugin deployment
        entryFileNames: "field-plugin.js",
        assetFileNames: "field-plugin.[ext]",
      },
    },
  },
});
