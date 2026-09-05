import js from "@eslint/js";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { importX } from "eslint-plugin-import-x";
import node from "eslint-plugin-n";
import unicorn from "eslint-plugin-unicorn";
import { globalIgnores, defineConfig } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "./src/generated"]),
  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
      unicorn.configs.unopinionated,
      eslintPluginPrettierRecommended,
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
      "unicorn/consistent-boolean-name": "error",
      "unicorn/text-encoding-identifier-case": ["error", { withDash: true }],
      "unicorn/no-top-level-side-effects": "off",
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
