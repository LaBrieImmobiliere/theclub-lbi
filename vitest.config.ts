import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    // Vitest ne doit pas tenter de charger les tests Playwright (e2e/)
    // qui utilisent `test.describe` du package @playwright/test et explosent
    // sur import en environnement vitest.
    exclude: ["node_modules/**", "e2e/**", ".next/**", "dist/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
