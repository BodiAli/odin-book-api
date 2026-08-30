import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import vitest from "@vitest/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { importX } from "eslint-plugin-import-x";
import node from "eslint-plugin-n";
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
      eslintConfigPrettier,
    ],
    plugins: {
      n: node,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
      ecmaVersion: "latest",
      parserOptions: {
        projectService: true,
      },
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
      "import-x/no-named-as-default-member": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "import-x/default": "off",
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends" },
      ],
      "@typescript-eslint/explicit-function-return-type": "error",
      "n/no-process-env": "error",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}"],
    extends: [vitest.configs.all],
    rules: {
      "@typescript-eslint/unbound-method": "off",
      "vitest/no-hooks": "off",
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
  },
]);
