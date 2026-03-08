import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    rules: {
      // Allow explicit any where needed (e.g. zustand middleware)
      "@typescript-eslint/no-explicit-any": "warn",
      // Non-null assertions are fine in internal code with known invariants
      "@typescript-eslint/no-non-null-assertion": "off",
      // Allow unused vars prefixed with _
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      // We use empty functions for noop callbacks
      "@typescript-eslint/no-empty-function": "off",
      // Template expressions are fine for action logging
      "@typescript-eslint/restrict-template-expressions": ["error", {
        allowNumber: true,
        allowBoolean: true,
      }],
      // Allow void for fire-and-forget promises (queueMicrotask etc.)
      "@typescript-eslint/no-confusing-void-expression": "off",
    },
  },
  // Prettier must be last to override formatting rules
  prettier,
  {
    ignores: ["dist/", "demo/", "node_modules/"],
  },
);
