import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // Added to prevent process/env related undef errors
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Downgrade unused vars to warnings so they don't crash CI deployments
      // Explicitly ignore 'React' since React 17+ doesn't require it to be in scope
      "no-unused-vars": ["warn", { varsIgnorePattern: "^(React|_.*)$" }],
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);
