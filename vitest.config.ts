import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    setupFiles: "./tests/setup/setup.ts",
    alias: [
      { find: "#src", replacement: path.resolve(import.meta.dirname, "src") },
    ],
    reporters: ["dot"],
  },
});
