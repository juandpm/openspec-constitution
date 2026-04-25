# Greenfield Onboarding — OpenSpec en repos nuevos

> openspec-constitution v2.1.0
> Para repos legacy o ya onboardeados, usa `playbook-onboarding.md`.

Este documento es el atajo para arrancar un repo nuevo con OpenSpec desde cero. No incluye la parte de diagnóstico de legacy porque no hay código previo que analizar.

---

## Cuándo usar este documento

Cuando el repo no existe todavía o existe pero está vacío (sin código de negocio). Si ya hay código, usa `playbook-onboarding.md` desde el Paso 0.A.

---

## Paso 1 — Inicializar el repo

```bash
# Crear repo en GitHub, luego:
git clone <url-del-repo>
cd <nombre-del-repo>

# package.json mínimo constitucional
npm init -y
# Editar package.json: agregar "type": "module" y "engines": {"node": ">=22"}

# Instalar devDependencies constitucionales desde el primer commit
npm install -D vitest @vitest/coverage-v8 eslint @eslint/js eslint-plugin-n eslint-config-prettier prettier
```

---

## Paso 2 — Copiar templates desde openspec-constitution

```bash
CONSTITUTION_VERSION="v2.1.0"
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

Verificar que `npm test` corre (0 tests, sin error de config) antes de continuar.

---

## Paso 3 — Inicializar OpenSpec

```bash
openspec init
```

Completar `openspec/project.md` con estructura mínima:

```markdown
# Project: [nombre]

> Adhiere a openspec-constitution v2.1.0
> https://github.com/juandpm/openspec-constitution/tree/v2.1.0

## Stack específico del repo
- [Dependencias de producción con versión y uso]

## Estructura de directorios
[árbol de src/ — actualizar a medida que se construye]

## Puntos de entrada
[handler, rutas, eventos]

## Desviaciones de la constitución
Ninguna.

## Deuda técnica conocida
Ninguna — repo greenfield.
```

Archivar:
```
/opsx:archive document-current-project
```

---

## Paso 4 — Flujo de desarrollo

En repos greenfield **no hay gap analysis** (no hay deuda previa). Las fases canónicas aplican según lo que se construya:

| Fase | ¿Aplica en greenfield? | Cuándo |
|---|---|---|
| Fase 1 — Quick wins | Raramente | Solo si se introduce un bug en desarrollo |
| Fase 2 — Tooling | **Siempre — ya hecha en Paso 1** | Está lista desde el inicio |
| Fase 3 — Performance | Cuando se implementan clientes externos | Antes de hacer `deploy` |
| Fase 4 — Refactor | Si el módulo creció más de lo esperado | Después de tener tests |
| Fase 5 — Cobertura unitaria | **Siempre** | Al completar cada módulo |
| Fase 6 — Tests integración | Cuando hay handlers con dependencias externas | Al estabilizar el handler |
| Fase 7 — Tests críticos | Si hay encryption, auth | Al completar esos módulos |
| Fase 8 — Docs para agentes | **Siempre, al final** | Antes del primer deploy a producción |

---

## Paso 5 — Cerrar con Fase 8

Antes del primer deploy productivo, ejecutar:

```
/opsx:propose phase-8-agent-documentation
```

Completar todos los `[TODO:]` en `CLAUDE.md` con información real. Verificar que `.gitattributes` clasifica bien en GitHub.

---

## Diferencias clave respecto al flujo legacy

| Aspecto | Legacy | Greenfield |
|---|---|---|
| `improvement-plan.md` | Existe (deuda histórica) | No existe — el hook lo maneja |
| Gap analysis | Obligatorio | No aplica |
| Fase 2 (tooling) | Se ejecuta como fase | Ya está desde el Paso 1 |
| `project.md` | Documenta estado actual | Documenta intención inicial |
| Fase 1 (quick wins) | Casi siempre aplica | Raramente aplica |
