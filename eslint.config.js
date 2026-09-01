import js from "@eslint/js";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { importX } from "eslint-plugin-import-x";
import node from "eslint-plugin-n";
import unicorn from "eslint-plugin-unicorn";
import { globalIgnores, defineConfig } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
      unicorn.configs.unopinionated,
      eslintConfigPrettier,
    ],
    plugins: {
      n: node,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    settings: {
      "import-x/ignore": ["node_modules"],
    },
    rules: {
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "index",
            "sibling",
            "parent",
            "object",
            "type",
          ],
        },
      ],
      "import-x/no-cycle": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends" },
      ],
      "@typescript-eslint/explicit-function-return-type": "error",
      "n/no-process-env": "error",
      "unicorn/comment-content": "error",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}"],
    extends: [vitest.configs.all],
    rules: {
      "@typescript-eslint/unbound-method": "off",
      "vitest/no-hooks": "off",
      "vitest/prefer-importing-vitest-globals": "off",
      "vitest/no-importing-vitest-globals": "warn",
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
  },
]);
