# Estructura de directorios recomendada

> Versión: 2.2.3
> Esta estructura es una recomendación por defecto para proyectos serverless Node.js
> que adopten `openspec-constitution`. Desviaciones requieren justificación en
> `openspec/project.md`, sección "Desviaciones de la constitución".

---

## Árbol completo

\`\`\`
mi-repo/
├── .claude/
│   ├── hooks/
│   │   └── post-archive.js           Hook de OpenSpec
│   └── settings.local.json
│
├── .github/
│   └── workflows/
│       └── deploy-lambda.yml         CI/CD con gate test→deploy
│
├── docs/                             Documentación técnica extendida (opcional)
│   ├── architecture.md
│   └── runbooks/
│       └── incident-response.md
│
├── openspec/                         Workflow OpenSpec
│   ├── config.yaml
│   ├── project.md                    Referencia la constitución
│   ├── improvement-plan.md           Historial de fases
│   ├── specs/
│   └── changes/
│       └── archive/
│
├── src/                              Código fuente
│   ├── index.js                      Punto de entrada Lambda
│   ├── handlers/                     Orquestadores de lógica
│   ├── services/                     Clientes externos (DB, S3, HTTP)
│   ├── config/                       Configuración estática
│   ├── utils/                        Funciones puras reutilizables
│   └── errors/                       Clases de error de dominio (opcional)
│
├── tests/                            Tests Vitest
│   ├── setup.js                      Env vars antes de evaluación
│   ├── unit/                         Tests unitarios
│   └── integration/                  Tests de integración con mocks
│
├── .env.example                      Template de env vars (sin secretos)
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── package.json
├── package-lock.json
├── README.md
└── vitest.config.js
\`\`\`

---

## Convenciones por carpeta

### `src/handlers/`
Orquestadores de lógica de negocio. Un handler por "capability" del sistema.
Ejemplo: `ScreenHandler.js` en flows coordina routing, DB, S3 y cálculos.

### `src/services/`
Clientes para servicios externos. Estos archivos **se mockean** en los tests y
por convención se excluyen del coverage (ver `vitest-patterns.md`, patrón 5).

Debe haber un servicio por sistema externo: `DatabaseService.js`, `S3Service.js`,
`HttpClient.js`, etc. Cada uno maneja su propia conexión (singleton para DBs).

### `src/config/`
Configuración estática: mapas de traducción, factores, constantes de dominio.
Nada que cambie en runtime.

### `src/utils/`
Funciones puras reutilizables. Alta cobertura de tests unitarios es requisito.
Sin side effects, sin I/O.

### `src/errors/` (opcional)
Clases de error de dominio. Si solo tienes 1-2 clases, pueden vivir en `utils/`.
Si superas 3, separar en su propia carpeta.

### `tests/unit/`
Tests que importan directamente funciones puras. Sin mocks de servicios externos
(no los necesitan).

### `tests/integration/`
Tests que ejercitan orquestadores (`handlers/`) y entry point (`index.js`) con
mocks de servicios externos. Suelen cubrir múltiples ramas de lógica.

---

## Diferencias con el repo `flows` de referencia

El repo `flows` no separa `tests/unit/` e `tests/integration/` — tiene todos los
archivos de test sueltos en `tests/`. Esto funcionó con 6 archivos, pero para
repos nuevos se recomienda la separación desde el día 1:

- Evita el refactor de estructura cuando el número de tests crece.
- Permite correr solo unitarios durante desarrollo (`vitest run tests/unit`).
- Separa claramente cobertura esperada (alta) de integrados (menor pero crítica).

---

## Archivos opcionales

| Archivo          | Cuándo incluirlo                                                 |
| ---------------- | ---------------------------------------------------------------- |
| `docs/`          | Cuando la documentación no cabe en `README.md`                   |
| `docs/runbooks/` | Cuando hay procedimientos operacionales repetibles               |
| `src/errors/`    | Cuando tienes 3+ clases de error de dominio                      |
| `.env.example`   | **Siempre**. Permite a cualquiera ver qué variables se necesitan |