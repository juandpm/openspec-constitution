# Patrones críticos de Vitest con ES modules

> Versión: 1.0.0
> Uso: consultar durante las fases 5, 6 y 7 cuando surjan problemas de mocking,
> env vars o cobertura.

---

## Contexto

Vitest es el único framework de testing aceptado por la constitución. Pero testing con ES modules tiene varias trampas que no aparecen con CommonJS. Este documento compila las que ya se resolvieron en proyectos reales.

Si alguno de estos patrones no te funciona, probablemente la causa está más arriba:

1. ¿Estás usando ESM de verdad (`"type": "module"` en `package.json`)?
2. ¿Vitest está en la versión 4+? Los patrones de abajo asumen API moderna.
3. ¿`vitest.config.js` está bien configurado (`environment: "node"`, `setupFiles`)?

---

## Patrón 1 — Preservar exports reales, mockear solo algunos

### Problema

Necesitas mockear `decryptRequest` y `encryptResponse` de `src/encryption.js`, pero **preservar** `FlowEndpointException` real para que `instanceof` funcione en los tests.

### Síntoma si lo haces mal

```
TypeError: FlowEndpointException is not a constructor
```

Porque `vi.mock` por defecto reemplaza el módulo entero con stubs.

### Solución

```js
import { vi } from "vitest";

vi.mock("../src/encryption.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,              // preserva FlowEndpointException, constantes, etc.
    decryptRequest: vi.fn(),
    encryptResponse: vi.fn(),
  };
});
```

La clave es `importOriginal()` + spread `...actual`. Así mockeas solo lo que declares explícitamente y todo lo demás se mantiene real.

---

## Patrón 2 — Mockear una clase usada con `new`

### Problema

`S3Service` es una clase que se instancia con `new S3Service()` dentro del código. Necesitas mockear sus métodos sin romper la construcción.

### Síntoma si lo haces mal

```js
// ❌ FALLA
S3Service.mockImplementation(() => ({
  getImagesMappingByKeys: vi.fn().mockResolvedValue({}),
}));
```

Error: `TypeError: S3Service is not a constructor`. Las arrow functions no pueden ser constructores.

### Solución

```js
// ✅ CORRECTO
S3Service.mockImplementation(function () {
  this.getImagesMappingByKeys = vi.fn().mockResolvedValue({
    "clp-usd": "base64-image-data",
  });
});
```

Función regular (no arrow) + asignación a `this`. Así `new S3Service()` funciona y cada instancia tiene sus métodos mockeados.

### Setup completo con vi.mock

```js
import { vi, beforeEach } from "vitest";
import { S3Service } from "../src/services/S3Service.js";

vi.mock("../src/services/S3Service.js", () => ({
  S3Service: vi.fn(),
}));

beforeEach(() => {
  S3Service.mockImplementation(function () {
    this.getImagesMappingByKeys = vi.fn().mockResolvedValue({});
  });
});
```

---

## Patrón 3 — Variables de entorno antes de que el módulo se evalúe

### Problema

Tu `src/index.js` valida env vars al inicio del módulo (convención constitucional):

```js
const REQUIRED_ENV = ["APP_SECRET", "DB_USER"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) throw new Error(...);
```

Si haces `process.env.APP_SECRET = "test"` en un `beforeAll`, **llegas tarde**. ES modules se evalúan al importarse, antes que `beforeAll` corra.

### Síntoma si lo haces mal

```
Error: Missing required env vars: APP_SECRET, DB_USER
  at src/index.js:5
```

Incluso cuando `beforeAll` asigna las variables correctamente.

### Solución — usar `setupFiles`

Crear `tests/setup.js`:

```js
// tests/setup.js
// Este archivo se ejecuta ANTES de que cualquier módulo sea importado.
process.env.APP_SECRET = "test-secret";
process.env.PRIVATE_KEY_B64 = "test-key-base64";
process.env.DB_CLUSTER_ENDPOINT = "localhost";
process.env.DB_USER = "testuser";
process.env.DB_PASSWORD = "testpass";
```

Referenciarlo en `vitest.config.js`:

```js
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.js"],   // ← esto
    coverage: { /* ... */ },
  },
});
```

### Por qué funciona

`setupFiles` corre en la fase de inicialización del worker de Vitest, **antes** de resolver el primer `import`. Cuando tu test hace `import { handler } from "../src/index.js"`, las env vars ya están.

---

## Patrón 4 — Cadena de mocks para MongoDB

### Problema

El driver de MongoDB se usa así:

```js
const db = await getDb();
const docs = await db.collection("admin").find({ key: "clp-usd" }).toArray();
```

Cada punto es una llamada que devuelve un objeto con más métodos. Mockear esto a mano se vuelve ilegible.

### Solución — factory de mocks reutilizable

```js
function makeDbMock(rows) {
  return {
    collection: vi.fn().mockReturnValue({
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(rows),
      }),
      findOne: vi.fn().mockResolvedValue(rows[0] ?? null),
      insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-id" }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    }),
  };
}
```

### Uso en tests

```js
import { getDb } from "../src/services/DatabaseService.js";

vi.mock("../src/services/DatabaseService.js", () => ({
  getDb: vi.fn(),
}));

beforeEach(() => {
  getDb.mockResolvedValue(
    makeDbMock([
      { key: "clp-usd", value: 950, timestamp: 1713000000 },
      { key: "usd-cop", value: 4200, timestamp: 1713000000 },
    ])
  );
});
```

### Variantes útiles

```js
// DB que falla
getDb.mockRejectedValue(new Error("connection refused"));

// DB sin resultados
getDb.mockResolvedValue(makeDbMock([]));

// DB con comportamiento por colección
getDb.mockResolvedValue({
  collection: vi.fn((name) => {
    if (name === "admin") return adminMock();
    if (name === "users") return usersMock();
    throw new Error(`unexpected collection: ${name}`);
  }),
});
```

---

## Patrón 5 — Exclusión de servicios mockeados del coverage

### Problema

Cubres `ScreenHandler.js` al 90% con tests que mockean `DatabaseService` y `S3Service`. Pero el reporte muestra 0% en esos servicios, y los umbrales globales fallan.

### Síntoma si lo haces mal

```
Coverage threshold for lines (80%) not met: 67%
  src/services/DatabaseService.js: 0%
  src/services/S3Service.js: 0%
```

Aunque tu código real está bien cubierto, los servicios mockeados arrastran el promedio.

### Solución — `exclude` en coverage

```js
// vitest.config.js
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.js"],
      exclude: [
        "src/services/**",              // se mockean siempre
        "src/utils/streamUtils.js",     // si también se mockea
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
```

### Regla general

Si un archivo se mockea completamente en el 100% de los tests que lo tocan, no tiene sentido medirle cobertura. Excluirlo no oculta deuda — la deuda sería no mockearlo y tener tests frágiles que rompen con cambios externos.

### Cuando sí medir cobertura de un servicio

Si `DatabaseService` tiene lógica propia (construcción de queries, parseo de resultados), esa lógica **debe** tener tests unitarios y **no** excluirse. Solo excluir cuando la única lógica del archivo es `return await client.method()`.

---

## Patrón bonus — Encryption con claves reales

### Problema

`src/encryption.js` es criptografía pura. Mockearla en sus propios tests es absurdo: estarías probando tus mocks, no el código.

### Solución

Generar claves RSA reales al inicio del archivo de test:

```js
import { generateKeyPairSync } from "crypto";
import { beforeAll, describe, it, expect } from "vitest";

let publicKey, privateKey;

beforeAll(() => {
  const pair = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  publicKey = pair.publicKey;
  privateKey = pair.privateKey;
});

describe("encryption round-trip", () => {
  it("encripta y desencripta correctamente", () => {
    // ... usar publicKey y privateKey reales
  });
});
```

Esto corre en < 100ms y prueba crypto de verdad.

---

## Checklist antes de escribir el primer test

```
[ ] vitest.config.js tiene `environment: "node"`
[ ] vitest.config.js tiene `setupFiles: ["./tests/setup.js"]`
[ ] tests/setup.js existe con env vars requeridas del módulo
[ ] coverage.exclude incluye servicios que mockearás completamente
[ ] Entiendes la diferencia entre vi.mock (hoisted) y vi.doMock (no hoisted)
[ ] Si hay clases, sabes usar función regular (no arrow) en mockImplementation
```

## Anti-patrones frecuentes

| Anti-patrón | Por qué falla | Qué hacer |
|---|---|---|
| `beforeAll` para env vars | ES modules se evalúan antes | `setupFiles` |
| Arrow function en `mockImplementation` de clase | No es constructor | Función regular con `this.foo = ...` |
| Mockear módulo entero cuando solo necesitas 2 funciones | `instanceof` rompe con clases reemplazadas | `importOriginal` + spread |
| No excluir services mockeados del coverage | Umbrales fallan por 0% ficticio | `coverage.exclude` |
| Mockear encryption en tests de encryption | Pruebas tus mocks, no tu código | Claves RSA reales |
| `vi.mock` dentro de `describe` | No se hoistea, no tiene efecto | `vi.mock` a nivel top del archivo |
