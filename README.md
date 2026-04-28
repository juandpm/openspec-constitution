# openspec-constitution

> Constitución técnica y playbook de adopción de OpenSpec para todos los proyectos Node.js del equipo.

Este repo es la **fuente única de verdad** para decisiones técnicas transversales: qué linter usamos, qué testing framework, qué estructura de CI/CD, cómo organizamos código, cómo nombramos archivos, cómo manejamos errores, cómo adoptamos OpenSpec en un repo nuevo.

No es código. Son documentos y plantillas. Cada proyecto Node.js del equipo referencia una **versión específica** de este repo en su `openspec/project.md`.

---

## Para quién es

- **Tú, empezando un repo nuevo**: sigue `playbook-onboarding.md`.
- **Tú, arreglando un repo legacy**: sigue `playbook-onboarding.md`. Mismo proceso.
- **Tú, dudando sobre una decisión técnica**: consulta `constitution.md`. Si no está, probablemente es decisión de repo.
- **Tú, escribiendo tests con Vitest**: `vitest-patterns.md` tiene los trucos no obvios.
- **Tú, generando propuestas de fase en OpenSpec**: `phase-templates.md` tiene las plantillas.
- **Tú, configurando logging estructurado**: `docs/logging.md` tiene la guía completa de pino.
- **Tú, entendiendo cómo encajan todos los repos**: `docs/ecosystem.md` tiene el diagrama completo de arquitectura con todos los repositorios, colas SQS, API Gateway, storage y servicios externos.
- **Tú, migrando un repo ya onboardeado a v2.2.0**: `prompt-update.md` tiene el prompt listo para pegar en Claude Code.

---

## Estructura del repo

```
openspec-constitution/
├── README.md                              ← este archivo
├── VERSION                                ← versión actual (SemVer)
├── CHANGELOG.md                           ← historial de cambios
│
├── constitution.md                        ← decisiones técnicas no negociables (12 secciones)
├── playbook-onboarding.md                 ← paso a paso para adoptar OpenSpec (legacy y greenfield)
├── phase-templates.md                     ← plantillas de proposals y tasks por fase (8 fases)
├── vitest-patterns.md                     ← patrones críticos de testing con ESM (7 patrones)
├── prompt-onboarding.md                   ← prompt para Claude Code: onboarding de repo nuevo o legacy
├── prompt-update.md                       ← prompt para Claude Code: migrar repo ya onboardeado a v2.2.0
│
├── docs/
│   ├── structure.md                       ← estructura de directorios recomendada
│   ├── greenfield-onboarding.md           ← flujo condensado para repos nuevos
│   ├── agent-documentation.md            ← reglas para escribir CLAUDE.md y README.md
│   ├── logging.md                        ← nuevo en v2.1.0: guía de logging con pino
│   └── ecosystem.md                      ← nuevo en v2.2.0: arquitectura completa del ecosistema
│
└── templates/                             ← archivos de config listos para copiar
    ├── eslint.config.js
    ├── .prettierrc
    ├── vitest.config.js
    ├── tests-setup.js
    ├── github-workflow.yml
    ├── .env.example
    ├── .gitattributes                     ← nuevo en v2.0.0: exclusiones Linguist + LF
    ├── CLAUDE.md                          ← nuevo en v2.0.0: plantilla para agentes IA
    ├── README.md                          ← nuevo en v2.0.0: plantilla de README en español
    ├── logger.js                          ← nuevo en v2.1.0: singleton pino para src/config/
    └── claude-hooks/
        ├── post-archive.js
        └── settings.local.json
```

---

## Cómo usar este repo desde un proyecto

### 1. Referenciar la constitución

En el `openspec/project.md` de tu proyecto, la primera línea debe ser:

```markdown
> Adhiere a openspec-constitution v2.2.0
> https://github.com/juandpm/openspec-constitution/tree/v2.2.0
```

Siempre referencia un **tag de versión**, no `main`. Si la constitución evoluciona después, tu proyecto sigue apuntando a la versión con la que fue construido.

### 2. Copiar templates al bootstrap

El `playbook-onboarding.md` indica qué archivos copiar al iniciar un repo. Resumen:

```bash
CONSTITUTION_VERSION="v2.2.0"
REPO="https://raw.githubusercontent.com/juandpm/openspec-constitution/${CONSTITUTION_VERSION}"

curl -O ${REPO}/templates/eslint.config.js
curl -O ${REPO}/templates/.prettierrc
curl -O ${REPO}/templates/vitest.config.js
curl -O ${REPO}/templates/.env.example
curl -O ${REPO}/templates/.gitattributes
curl -o CLAUDE.md ${REPO}/templates/CLAUDE.md

mkdir -p src/config && curl -o src/config/logger.js ${REPO}/templates/logger.js
mkdir -p tests && curl -o tests/setup.js ${REPO}/templates/tests-setup.js
mkdir -p .github/workflows && curl -o .github/workflows/deploy-lambda.yml ${REPO}/templates/github-workflow.yml
mkdir -p .claude/hooks && curl -o .claude/hooks/post-archive.js ${REPO}/templates/claude-hooks/post-archive.js
curl -o .claude/settings.local.json ${REPO}/templates/claude-hooks/settings.local.json
```

### 3. Seguir el playbook

Ver `playbook-onboarding.md`. Los pasos son: bootstrap → documentar → gap analysis → fases canónicas.

---

## Principios

1. **Lo que ya se decidió no se rediscute.** Si un repo necesita desviarse de la constitución, lo documenta como "desviación" con justificación. No como "esa regla no aplica aquí".

2. **Versionado estricto.** La constitución evoluciona con SemVer. Los repos existentes migran cuando deciden, no automáticamente. No hay sorpresas.

3. **Prioridad a lo probado.** Toda decisión en `constitution.md` viene de un repo real (empezando por `flows`) donde ya se validó. Nada teórico.

4. **Documentación es para leerse.** Los `.md` están pensados para que un humano los lea en < 30 minutos y un agente (Claude) los use como contexto de trabajo.

---

## Versionado

La versión actual está en el archivo `VERSION` y se refleja en tags `vX.Y.Z`. Criterios:

| Bump | Cuándo |
|---|---|
| **MAJOR** (`v2.0.0`) | Cambio incompatible: prohibir algo que antes era permitido, o al revés. Requiere migración explícita en repos existentes. |
| **MINOR** (`v1.1.0`) | Nueva sección, nuevo template, nueva fase canónica. Repos existentes pueden adoptar opcionalmente. |
| **PATCH** (`v1.0.1`) | Clarificaciones, typos, ejemplos adicionales. Repos existentes no necesitan acción. |

Cada cambio se registra en `CHANGELOG.md`.

### Qué cambió en v2.2.0

- **`docs/ecosystem.md`** — Visión completa de la arquitectura de Solution Station SPA: diagrama Mermaid de todos los repos, colas SQS, API Gateway, storage y servicios externos.
- **Sección 9 en `templates/CLAUDE.md`** — Mini-diagrama Mermaid con la posición del repo en el ecosistema (upstream + downstream). Obligatoria antes de cerrar Fase 8.
- **Sección 12 en `constitution.md`** — Convenciones de nomenclatura para recursos AWS y criterios de cuándo crear una nueva Lambda vs extender una existente.
- **Fase 8 actualizada** — Tareas 8.7 y 8.8 para completar el mini-diagrama de ecosistema.

Los repos en `v2.1.x` **no se rompen**. Migrar a v2.2.0 es un change OpenSpec `upgrade-constitution-v2.1-to-v2.2`.

### Qué cambió en v2.1.0

- **Logging constitucional con pino** — `constitution.md` §5 reemplaza la política provisional de `console.log` por pino como decisión no negociable.
- **`templates/logger.js`** — singleton pino listo para copiar a `src/config/logger.js`. JSON estructurado en producción, pino-pretty en desarrollo, redacción automática de campos sensibles.
- **`docs/logging.md`** — guía completa: instalación, niveles, child loggers, testing con `vi.mock()`, consultas CloudWatch Logs Insights.
- **`templates/.env.example`** — añade `LOG_LEVEL` con comentario de valores válidos.
- **`templates/CLAUDE.md`** y **`templates/eslint.config.js`** — actualizados para reflejar el patrón de logger.

Los repos en `v2.0.0` **no se rompen**. Migrar a v2.1.0 es un change OpenSpec `upgrade-constitution-v2.0.0-to-v2.1.0`.

### Qué cambió en v2.0.0

- **Fase 8 obligatoria** — Documentación para agentes al final de todo ciclo: `CLAUDE.md`, `README.md` validado, `.gitattributes`.
- **3 templates nuevos** — `templates/CLAUDE.md`, `templates/.gitattributes`, `templates/README.md`.
- **2 docs nuevos** — `docs/greenfield-onboarding.md` (repos nuevos), `docs/agent-documentation.md` (reglas de escritura).
- **Playbook unificado** — `playbook-legacy-onboarding.md` renombrado a `playbook-onboarding.md`; cubre legacy y greenfield.
- **Sección 11 en `constitution.md`** — Obliga `CLAUDE.md` y `.gitattributes` en todo repo constitucional.
- **Patrones 6 y 7 en `vitest-patterns.md`** — `vi.hoisted()` para AWS SDK; caché de clientes por instancia Lambda.

Los repos en `v1.0.0` o `v1.1.0` **no se rompen**. Migrar a v2.0.0 es un change OpenSpec explícito `upgrade-constitution-v1-to-v2`.

---

## Historia

Este repo nace de la experiencia del proyecto `flows` (WhatsApp Flows Lambda), donde la adopción de OpenSpec en 7 fases elevó el proyecto de código sin estructura a 62 tests, 92% de cobertura y CI con gate de calidad. Todas las decisiones codificadas aquí salen de esa experiencia.

Si encuentras algo que no cuadra, probablemente se descubrió después de `flows` y no está reflejado todavía. Abrir issue.
