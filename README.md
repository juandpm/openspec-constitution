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

---

## Estructura del repo

```
openspec-constitution/
├── README.md                              ← este archivo
├── VERSION                                ← versión actual (SemVer)
├── CHANGELOG.md                           ← historial de cambios
│
├── constitution.md                        ← decisiones técnicas no negociables
├── playbook-onboarding.md          ← paso a paso para adoptar OpenSpec
├── phase-templates.md                     ← plantillas de proposals y tasks por fase
├── vitest-patterns.md                     ← patrones críticos de testing con ESM
│
└── templates/                             ← archivos de config listos para copiar
    ├── eslint.config.js
    ├── .prettierrc
    ├── vitest.config.js
    ├── tests-setup.js
    ├── github-workflow.yml
    └── claude-hooks/
        ├── post-archive.js
        └── settings.local.json
```

---

## Cómo usar este repo desde un proyecto

### 1. Referenciar la constitución

En el `openspec/project.md` de tu proyecto, la primera línea debe ser:

```markdown
> Adhiere a openspec-constitution v1.0.0
> https://github.com/juandpm/openspec-constitution/tree/v1.0.0
```

Siempre referencia un **tag de versión**, no `main`. Si la constitución evoluciona después, tu proyecto sigue apuntando a la versión con la que fue construido.

### 2. Copiar templates al bootstrap

El `playbook-onboarding.md` indica qué archivos copiar al iniciar un repo. Resumen:

```bash
CONSTITUTION_VERSION="v1.0.0"
REPO="https://raw.githubusercontent.com/juandpm/openspec-constitution/${CONSTITUTION_VERSION}"

curl -O ${REPO}/templates/eslint.config.js
curl -O ${REPO}/templates/.prettierrc
curl -O ${REPO}/templates/vitest.config.js

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

---

## Historia

Este repo nace de la experiencia del proyecto `flows` (WhatsApp Flows Lambda), donde la adopción de OpenSpec en 7 fases elevó el proyecto de código sin estructura a 62 tests, 92% de cobertura y CI con gate de calidad. Todas las decisiones codificadas aquí salen de esa experiencia.

Si encuentras algo que no cuadra, probablemente se descubrió después de `flows` y no está reflejado todavía. Abrir issue.
