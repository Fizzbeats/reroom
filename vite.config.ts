import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Basis-Pfad kommt aus der CD-Pipeline (GitHub Pages liegt unter /<repo>/)
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  test: { environment: "node" },
});
