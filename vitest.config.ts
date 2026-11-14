import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "toolkit/**/*.test.ts",
      "schemas/**/*.test.ts",
    ],
    globals: true,
    environment: "node",
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
