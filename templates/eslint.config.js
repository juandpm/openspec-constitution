// eslint.config.js
// Configuración constitucional — openspec-constitution v2.2.0
//
// Perfil: Node.js ES modules, flat config (ESLint 9+)
// Integración con Prettier vía eslint-config-prettier (desactiva reglas conflictivas).

import js from "@eslint/js";
import nodePlugin from "eslint-plugin-n";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  nodePlugin.configs["flat/recommended-module"],
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Globals de Node.js
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly",
      },
    },
    rules: {
      // Eliminar imports y variables sin usar es deuda activa, no aviso.
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

      // Forzar consistencia con la constitución
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      "no-console": "warn", // usar logger de src/config/logger.js en lugar de console

      // Promesas — la constitución exige async/await
      "no-async-promise-executor": "error",
      "require-await": "warn",

      // Reglas específicas de Node.js
      "n/no-missing-import": "off", // los imports relativos con .js los confunden en ESM a veces
      "n/no-unpublished-import": "off", // permitir imports de devDependencies en tests
      "n/no-process-exit": "warn",
    },
  },
  {
    // Relajar reglas en tests
    files: ["tests/**/*.js", "**/*.test.js"],
    rules: {
      "no-unused-vars": "off",
      "require-await": "off",
      "no-console": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "build/**",
      "*.zip",
      "global-bundle.pem",
    ],
  },
];
