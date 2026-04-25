# Constitución técnica — Proyectos Node.js

> Versión: 2.1.0
> Alcance: todos los repositorios Node.js del equipo (Lambdas, servicios, CLIs, librerías internas).
> Este documento fija decisiones transversales que **no se rediscuten por repo**.
> Si un repo necesita desviarse de algún punto, debe documentarlo en su `openspec/project.md`
> bajo la sección "Desviaciones de la constitución" con justificación concreta.

---

## 1. Runtime y módulos

- **Node.js 22** como versión mínima. Fijada en `engines` del `package.json` y en el workflow de CI.
- **ES modules** siempre: `"type": "module"` en `package.json`. Nada de `require()` ni `module.exports`.
- **TypeScript no es default**. Si un repo lo justifica, se documenta en su `project.md`.
- Ficheros con extensión `.js` (no `.mjs` ni `.cjs`) salvo caso excepcional justificado.

## 2. Dependencias

- Separación estricta entre `dependencies` y `devDependencies`. Un paquete de testing, linting o build **nunca** va en `dependencies`.
- Antes de agregar una dependencia: ¿se puede resolver con Node nativo? Evitar `axios` si `fetch` basta, evitar `crypto` npm si el `crypto` nativo sirve, evitar `lodash` completo si solo necesitas una función.
- Imports no usados son deuda activa. Si lint los detecta, se eliminan, no se silencian.
- Las versiones de dependencias se fijan con `^` (minor updates permitidos). No se usa `*` ni `latest`.

## 3. Tooling obligatorio

Todo repo debe tener, desde el primer commit productivo:

| Herramienta | Propósito | Config canónica |
|---|---|---|
| ESLint 9+ | Linter | `eslint.config.js` (flat config), perfil Node ESM |
| Prettier 3+ | Formatter | `.prettierrc` con valores estándar (ver abajo) |
| Vitest 4+ | Framework de testing | `vitest.config.js` con coverage v8 |
| `@vitest/coverage-v8` | Reporte de cobertura | Integrado en `vitest.config.js` |
| `eslint-config-prettier` | Evita conflictos lint ↔ format | Incluido en `eslint.config.js` |
| `eslint-plugin-n` | Reglas específicas de Node | Incluido en `eslint.config.js` |

**Jest está prohibido.** Vitest es la única opción. La razón es compatibilidad nativa con ES modules sin `babel-jest` ni transformers.

### Configuración canónica de Prettier

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100
}
```

### Umbrales de cobertura mínimos

| Métrica | Umbral |
|---|---|
| Lines | ≥ 80% |
| Functions | ≥ 80% |
| Statements | ≥ 80% |
| Branches | ≥ 70% |

Servicios que se mockean completamente (clientes DB, S3, etc.) se **excluyen** del coverage. Si no se excluyen, marcarán 0% y harán fallar los umbrales aunque el código real esté bien cubierto.

### Scripts npm obligatorios

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

## 4. CI/CD

- **GitHub Actions** como plataforma estándar.
- El workflow debe tener **jobs separados** `test` y `deploy`.
- `deploy` debe declarar `needs: test`. **Sin esto no hay gate útil** y el CI no protege nada.
- El job `test` corre `npm run test:ci` y sube artefacto de cobertura con retención de 7 días.
- Secrets de AWS (y de cualquier proveedor) **nunca** en el código ni en el repo. Solo en GitHub Secrets.
- Certificados o archivos sensibles se descargan en el job `deploy` desde un bucket privado, no se commitean.

## 5. Convenciones de código

### Async

- `async/await` siempre. Nada de callbacks ni cadenas de `.then()`.
- Promesas sin `await` son un error, no una optimización. Si algo es fire-and-forget, se documenta explícitamente.

### Validación de entorno

- Variables de entorno requeridas se validan **al inicio del módulo** (top-level, antes del export del handler).
- Si falta alguna, la aplicación falla con un mensaje claro durante el cold start, no durante la primera invocación.
- Código de referencia:

```js
const REQUIRED_ENV = ["APP_SECRET", "DB_USER", "DB_PASSWORD"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}
```

### Conexiones externas (DB, cachés, colas)

- En entornos serverless (Lambda, Cloud Functions), las conexiones deben ser **singletons de módulo** reutilizables entre invocaciones warm.
- El patrón `connect()` → query → `disconnect()` por request está prohibido.
- Referencia: `DatabaseService` del repo `flows` usa un `MongoClient` como singleton, con `getDb()` que reutiliza la conexión existente.

### Operaciones I/O paralelas

- Cuando hay múltiples llamadas independientes (S3, HTTP, DB), usar `Promise.all`, no `for...of` con await.
- Ejemplo: descargar 5 imágenes de S3 toma el tiempo de la más lenta, no la suma de todas.

### Logging

- **Logger canónico: `pino`**. Se instala como dependencia de producción (`npm install pino`).
- `pino-pretty` como devDependency para output legible en desarrollo (`npm install --save-dev pino-pretty`).
- El logger vive en `src/config/logger.js` como **singleton de módulo**. Usar `templates/logger.js` como base. Ver `docs/logging.md` para la guía completa.
- Niveles de uso:
  - `logger.info()` — eventos de negocio normales (request recibida, operación completada).
  - `logger.warn()` — condiciones anómalas no fatales (fallback usado, retry, recurso no encontrado).
  - `logger.error()` — errores internos con detalle completo (van a CloudWatch).
  - `logger.debug()` — solo desarrollo (`LOG_LEVEL=debug`); inactivo en producción por defecto.
- `console.log`, `console.error`, `console.warn` están **deprecados** en código de producción. ESLint los reporta como `warn` para guiar la migración.
- **Nunca loguear**: secrets, tokens, claves privadas, payloads cifrados. El logger tiene redacción automática de campos comunes.
- Para contexto por request en Lambda: `const reqLogger = logger.child({ requestId: context.awsRequestId })`.

### Idioma

- **Mensajes al usuario final**: español (salvo decisión explícita por repo).
- **Código, nombres de variables, funciones y comentarios técnicos**: inglés.
- Esta separación evita ambigüedad: si un string está en inglés, es interno; si está en español, es de cara al usuario.

## 6. Errores y seguridad

- Errores de dominio se modelan como clases que extienden `Error` con un `statusCode` numérico.
- Patrón canónico: `FlowEndpointException` del repo `flows` — `class FlowEndpointException extends Error { constructor(statusCode, message) {...} }`.
- **Nunca exponer al usuario**: nombres de claves de base de datos, paths internos, stack traces, estructura del error original.
- `logger.error` con detalle interno → respuesta al usuario genérica sin filtrar internals.
- Errores de red (DB, S3) **no deben ser fatales silenciosos**: se loguean con `logger.error` y se devuelve una respuesta válida vacía o un error de dominio explícito.

## 7. Nomenclatura

| Tipo | Convención | Ejemplo |
|---|---|---|
| Archivos de clases / servicios | PascalCase | `ScreenHandler.js`, `S3Service.js` |
| Archivos de utilidades / config | camelCase | `flowUtils.js`, `calculations.js` |
| Variables y funciones | camelCase | `buildMongoKey`, `getUserTransaction` |
| Variables de entorno | UPPER_SNAKE_CASE | `APP_SECRET`, `DB_CLUSTER_ENDPOINT` |
| Claves de configuración interna | snake_case | `clp_flow`, `svc_flow_ves` |
| Claves de base de datos | kebab-case | `clp-usd`, `sv-cop-ves` |

## 8. Estructura de directorios recomendada

Para proyectos serverless o servicios pequeños:

```
src/
├── index.js              Punto de entrada (handler, validación, routing)
├── handlers/             Lógica de negocio orquestadora
├── services/             Clientes externos (DB, S3, HTTP) — típicamente se mockean en tests
├── config/               Configuración estática, mapas, constantes
└── utils/                Funciones puras reutilizables
tests/
├── setup.js              setupFiles de Vitest — env vars inyectadas antes de importar módulos
├── [modulo].test.js      Tests unitarios por módulo
└── [modulo].test.js      Tests de integración con mocks de services/
```

Esta estructura no es obligatoria pero sí **recomendada por defecto**. Desviarse requiere justificación en `project.md`.

## 9. OpenSpec

- Todo repo usa OpenSpec (`openspec init`) desde el primer commit de trabajo estructurado.
- El primer change propuesto siempre es `document-current-project`.
- El `project.md` de cada repo debe referenciar esta constitución por versión en su primera línea:
  ```markdown
  > Adhiere a openspec-constitution v2.0.0
  ```
- Las fases de mejora técnica siguen el orden canónico documentado en `playbook-onboarding.md`.
- Tras cada `/opsx:archive`, el hook `post-archive.js` gatilla una valoración automática del proyecto.

## 10. Evolución de esta constitución

- Cambios a este documento se hacen vía PR al repo `openspec-constitution`.
- Cada cambio bumpea la versión (`VERSION` + `CHANGELOG.md`) y crea un tag `vX.Y.Z`.
- Los repos existentes **no migran automáticamente**. Siguen apuntando a su versión hasta que el equipo decida actualizar.
- Migrar un repo a una nueva versión es un change OpenSpec explícito: `upgrade-constitution-vX-to-vY`.
- La migración de `v1.x.x` a `v2.0.0` se ejecuta con el change `upgrade-constitution-v1-to-v2` en cada repo. Implica añadir `CLAUDE.md`, `.gitattributes`, ejecutar Fase 8 y actualizar la referencia en `project.md`.

## 11. Documentación para agentes

Todo repo constitucional debe tener los siguientes tres artefactos en la raíz. Su ausencia equivale a deuda técnica activa y debe resolverse con Fase 8.

### `CLAUDE.md` (obligatorio, en inglés)

Archivo de contexto para agentes de IA (Claude Code y equivalentes). Debe contener exactamente estas 8 secciones, sin placeholders `[TODO:]` pendientes:

1. **Project overview** — qué hace el repo, stack, entorno de ejecución.
2. **Development commands** — comandos con explicación de cuándo usarlos.
3. **Architecture** — diagrama de flujo de datos y responsabilidades por módulo.
4. **Code conventions** — desviaciones locales de la constitución, si las hay.
5. **Testing** — estrategia de mocks, cómo correr tests, qué cubre.
6. **Secrets and environment** — variables requeridas y cómo obtenerlas (sin valores reales).
7. **CI/CD** — qué hace el pipeline y cuándo se activa el deploy.
8. **Non-obvious details** — gotchas, decisiones contraintuitivas, workarounds documentados.

Usar `templates/CLAUDE.md` como base. Ver `docs/agent-documentation.md` para reglas de redacción. El template ya referencia v2.1.0.

### `.gitattributes` (obligatorio)

Debe excluir del cálculo de GitHub Linguist al menos:

- `coverage/**` y `htmlcov/**` — `linguist-generated=true`
- `dist/**` y `build/**` — `linguist-generated=true`
- `node_modules/**` — `linguist-vendored=true`

Y normalizar line endings a LF para archivos de código (`.js`, `.ts`, `.json`, `.md`, `.yml`).

Usar `templates/.gitattributes` como base.

### `README.md` (obligatorio, en español)

Orientado a onboarding humano rápido. Debe tener estas 6 secciones mínimas:

1. **Stack** — tecnologías principales con versiones.
2. **Instalación** — pasos exactos desde cero.
3. **Uso** — cómo invocar / deployar.
4. **Scripts** — tabla de `npm run X` con descripción de cada uno.
5. **Tests y cobertura** — cómo correr y qué esperar.
6. **Deploy** — proceso, entornos, secrets necesarios.

Usar `templates/README.md` como base.

---

## Apéndice: deuda técnica conocida fuera del alcance

Los siguientes temas aparecen recurrentemente y **no tienen decisión constitucional aún**. Cada repo los trata según su criterio hasta que se resuelva globalmente:

- **Retry logic en clientes externos**: depende de SLA de cada servicio.
- **Observabilidad** (métricas custom, trazas distribuidas): pendiente de herramienta.
- **TypeScript**: adopción gradual, no obligatoria.

Cuando alguno de estos se resuelva, se incorpora a esta constitución y bumpea versión.
