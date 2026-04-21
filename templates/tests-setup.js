// tests/setup.js
// Ejecutado por Vitest ANTES de que cualquier módulo sea importado en los tests.
// Necesario porque la constitución exige validación de env vars al inicio del módulo;
// sin estas líneas, los módulos lanzarían "Missing required env vars" al cargarse.
//
// Ver vitest-patterns.md (patrón 3) para la razón detallada.
//
// IMPORTANTE: agregar aquí las env vars que tu repo valide en src/index.js o similar.
// Los valores son placeholders — no se usan para lógica real, solo para pasar la validación.

process.env.NODE_ENV = "test";

// --- Ejemplos de env vars comunes ---
// process.env.APP_SECRET = "test-app-secret";
// process.env.PRIVATE_KEY_B64 = "test-private-key-base64";
// process.env.DB_CLUSTER_ENDPOINT = "localhost";
// process.env.DB_USER = "testuser";
// process.env.DB_PASSWORD = "testpass";
// process.env.DB_NAME = "testdb";

// --- Agregar las específicas de este repo ---
// process.env.MI_VAR = "valor-test";
