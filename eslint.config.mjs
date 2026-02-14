import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/",
      "**/node_modules/",
      "**/coverage/",
      "**/storybook-static/",
      "**/cypress/",
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Shared + Backend: Node globals
  {
    files: ["shared/src/**/*.ts", "backend/src/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Frontend: browser globals + React Hooks rules
  {
    files: ["frontend/src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },

  // Global rule overrides
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
