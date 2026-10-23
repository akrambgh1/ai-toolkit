import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` matches the GitHub Pages URL: https://akrambgh1.github.io/ai-toolkit/
export default defineConfig({
  plugins: [react()],
  base: "/ai-toolkit/",
  worker: { format: "es" },
  optimizeDeps: { exclude: ["@huggingface/transformers"] },
});
