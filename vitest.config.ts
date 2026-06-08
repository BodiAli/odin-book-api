import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    setupFiles: "./src/tests/setup/setup.ts",
    alias: [
      { find: "#src", replacement: path.resolve(import.meta.dirname, "src") },
    ],
  },
});
