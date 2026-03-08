import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "zform/react": resolve(__dirname, "../src/react/index.ts"),
      "zform": resolve(__dirname, "../src/index.ts"),
      "test": resolve(__dirname, "../test"),
    },
  },
});
