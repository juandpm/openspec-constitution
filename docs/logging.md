# Logging estructurado con pino

> openspec-constitution v2.2.0

---

## Decisión

**pino** es la librería de logging constitucional para todos los proyectos Node.js. Razones:

- Output JSON nativo compatible con CloudWatch Logs Insights.
- ~5x menor overhead que winston (crítico en entornos serverless).
- API mínima: `logger.info()`, `.warn()`, `.error()`, `.debug()`.
- `pino-pretty` para desarrollo sin tocar código de producción.
- Redacción automática de campos sensibles configurable.

---

## Instalación

```bash
npm install pino                    # producción
npm install --save-dev pino-pretty  # solo desarrollo
```

---

## Singleton canónico

Copiar `templates/logger.js` a `src/config/logger.js` del repo. El singleton:

- Lee `LOG_LEVEL` del entorno (default: `info` en producción, `debug` en desarrollo).
- En `NODE_ENV=development` usa el transport `pino-pretty` para output legible.
- En producción (Lambda, CI) emite JSON limpio a stdout — CloudWatch lo captura automáticamente.
- Agrega el campo `service` a todos los logs con el valor de `npm_package_name`.
- Redacta automáticamente campos con nombres `password`, `token`, `secret`, `authorization`, `apiKey`, `privateKey`.

---

## Uso básico

```js
import logger from "../config/logger.js"; // ajustar path relativo

logger.info("Request received");
logger.info({ userId: "abc123", flow: "payment" }, "Processing payment");
logger.warn({ attemptCount: 3 }, "Retry limit approaching");
logger.error({ err: new Error("DB timeout") }, "Database operation failed");
```

### Niveles y cuándo usarlos

| Nivel | Cuándo |
|-------|--------|
| `logger.debug()` | Solo desarrollo: valores intermedios, flujo detallado. Activado solo con `LOG_LEVEL=debug`. |
| `logger.info()` | Eventos normales de negocio: request recibida, operación completada, resultado exitoso. |
| `logger.warn()` | Anomalías no fatales: recurso no encontrado pero hay fallback, retry disparado, valor por defecto usado. |
| `logger.error()` | Errores internos con detalle completo (stack, contexto). Nunca exponerlos al usuario final. |

---

## Logger hijo por request (Lambda)

En handlers de Lambda, crear un child logger con el `requestId` para trazabilidad por invocación:

```js
export const handler = async (event, context) => {
  const reqLogger = logger.child({
    requestId: event.requestContext?.requestId ?? context.awsRequestId,
  });

  reqLogger.info("Handler invoked");
  // pasar reqLogger a handlers/services según necesidad
};
```

---

## Redacción de campos sensibles

El logger redacta automáticamente los paths configurados en `redact`. Para campos adicionales específicos del repo, extender la lista en `src/config/logger.js`:

```js
redact: {
  paths: [
    "*.password", "*.token", "*.secret",
    "*.authorization", "*.apiKey", "*.privateKey",
    "payload.encryptedData",  // campo específico del repo
  ],
  censor: "[REDACTED]",
},
```

---

## Testing

Mockear el logger con `vi.mock()` para que los tests no emitan logs y permitan aserciones:

```js
// tests/MyHandler.test.js
import { vi, describe, it, expect } from "vitest";

vi.mock("../src/config/logger.js", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

// Para verificar que el logger fue llamado:
import logger from "../src/config/logger.js";
expect(logger.error).toHaveBeenCalledWith(
  expect.objectContaining({ err: expect.any(Error) }),
  expect.stringContaining("Database"),
);
```

---

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `NODE_ENV` | — | Si es `development`, activa pino-pretty. |
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) | Nivel mínimo: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. |

Agregar al `.env.example` del repo:

```dotenv
# --- Logging ---
NODE_ENV=development
LOG_LEVEL=debug
```

---

## CloudWatch

En Lambda, pino escribe JSON a stdout. CloudWatch captura stdout automáticamente. Ejemplo de consulta con Logs Insights:

```
fields @timestamp, level, msg, service, requestId, err.message
| filter level = "error"
| sort @timestamp desc
| limit 20
```

---

## ESLint

A partir de v2.1.0, `"no-console": "warn"` en `eslint.config.js`. Los `console.log` existentes en código de producción generan warnings que sirven de guía durante la migración. En archivos de tests, el override mantiene `"no-console": "off"` para no interferir con la suite.

Para encontrar todos los usos de console pendientes de reemplazar:

```bash
npm run lint
```
