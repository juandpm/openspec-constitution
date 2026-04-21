# Changelog

Todos los cambios notables a esta constitución se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.0.0] — 2026-04-21

### Added

Versión inicial de la constitución. Todas las decisiones codificadas vienen de la experiencia validada en el repo `flows` (WhatsApp Flows Lambda, 7 fases de mejora, 62 tests, 92% coverage).

**Documentos maestros:**

- `constitution.md` — 10 secciones de decisiones técnicas no negociables: runtime Node 22, ES modules, tooling (ESLint 9+, Prettier 3+, Vitest 4+ con coverage v8), umbrales de cobertura, CI/CD con gate `test → deploy`, convenciones de código (async/await, validación env al inicio, singletons DB, `Promise.all` para I/O paralelo), manejo de errores con `statusCode`, nomenclatura, estructura de directorios recomendada, y flujo OpenSpec.

- `playbook-legacy-onboarding.md` — Paso a paso para adoptar OpenSpec en un repo legacy: bootstrap (Paso 0), `document-current-project` reducido (Paso 1), gap analysis contra la constitución (Paso 2), fases canónicas en orden (Paso 3), hook post-archive (Paso 4). Incluye checklist Día 1 y tabla de anti-patrones.

- `phase-templates.md` — Plantillas completas de `proposal.md` y `tasks.md` para las 7 fases canónicas: quick-wins, code-quality-tooling, performance-optimizations, refactor-estructural, test-coverage, cleanup-e-integration-tests, tests-criticos-restantes. Cada fase con objetivo, cuándo aplica, cuándo saltar, criterios de done.

- `vitest-patterns.md` — 5 patrones críticos de testing con ES modules: preservar exports reales con `importOriginal`, mockear clases usadas con `new` (función regular, no arrow), env vars en `setupFiles` antes de evaluación del módulo, cadena de mocks para MongoDB, exclusión de servicios mockeados del coverage. Más bonus de encryption con claves RSA reales, checklist pre-test y tabla de anti-patrones.

**Templates listos para copiar en `templates/`:**

- `eslint.config.js` — flat config, perfil Node ESM con `eslint-plugin-n`, integración con Prettier.
- `.prettierrc` — valores constitucionales: `semi: true`, `singleQuote: false`, `trailingComma: "all"`, `printWidth: 100`.
- `vitest.config.js` — provider v8, umbrales constitucionales, `setupFiles`, exclusión de `src/services/**`.
- `tests-setup.js` — estructura base con variables de entorno comunes.
- `github-workflow.yml` — workflow con jobs separados `test` → `deploy`, artefacto de cobertura, descarga de certificado TLS.
- `claude-hooks/post-archive.js` — hook de Claude Code que gatilla valoración automática tras cada archive de OpenSpec.
- `claude-hooks/settings.local.json` — registro del hook para Claude Code.

### Deuda técnica fuera del alcance de v1.0.0

Items reconocidos pero sin decisión constitucional aún, que cada repo maneja según criterio:

- **Logging estructurado** (pino, winston): pendiente de decisión de plataforma de observabilidad.
- **Retry logic en clientes externos**: depende de SLA por servicio.
- **Observabilidad avanzada** (métricas custom, trazas distribuidas): pendiente de herramienta.
- **TypeScript**: adopción gradual, no obligatoria.

Cuando alguno de estos se resuelva globalmente, se incorpora a la constitución con bump de versión.

---

<!--
Plantilla para nuevas entradas:

## [X.Y.Z] — YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Deprecated
- ...

### Removed
- ...

### Fixed
- ...

### Security
- ...
-->
