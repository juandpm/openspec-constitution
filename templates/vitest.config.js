// vitest.config.js
// Configuración constitucional — openspec-constitution v1.0.0
//
// - environment: "node" porque nuestros proyectos son serverless/backend.
// - setupFiles: inyecta env vars antes de que los módulos sean evaluados
//   (necesario por la convención de validar env al inicio del módulo).
// - coverage.exclude: servicios que se mockean completamente no deben
//   arrastrar el promedio a 0% (ver vitest-patterns.md, patrón 5).

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.js"],

    // Por defecto tests/**/*.test.js. Ajustar si el repo usa otra convención.
    include: ["tests/**/*.test.js"],

    coverage: {
      provider: "v8",
      include: ["src/**/*.js"],
      exclude: [
        "src/services/**", // clientes externos que siempre se mockean en tests
        "**/*.config.js",
        "**/index.js", // a veces solo re-exporta; si tiene lógica, quitar esta línea
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      reporter: ["text", "lcov", "html"],
    },
  },
});
