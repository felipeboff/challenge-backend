import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    testTimeout: 10000,
    fileParallelism: false,
    coverage: {
      exclude: ["src/tests/**", "**/*.test.ts", "**/*.spec.ts"],
    },
  },
});
