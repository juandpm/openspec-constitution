# Playbook — Onboarding de OpenSpec (legacy y greenfield)

> Versión: 2.2.1
> Aplicable a: cualquier repositorio Node.js que vaya a adoptar OpenSpec.
> Prerequisito: leer `constitution.md` antes de empezar.

---

## Cuándo usar este playbook

| Situación | Qué hacer |
|---|---|
| **Repo legacy** — código existente sin OpenSpec | Seguir este playbook completo desde el Paso 0.A |
| **Repo greenfield** — repo nuevo, aún vacío | Ir al Paso 0.B; luego seguir Paso 1 en adelante. Ver también `docs/greenfield-onboarding.md` para el flujo condensado |
| **Repo ya onboardeado** — tiene OpenSpec, quiere migrar a v2.2.0 | Ejecutar change `upgrade-constitution-vX-to-v2.2.0`: actualizar referencia en `project.md`, copiar templates nuevos |

---

## Cómo usar este playbook

Los pasos van en orden. No saltes ninguno. Cada paso tiene:

- **Qué hacer** — la acción concreta.
- **Por qué importa** — la razón, para que entiendas qué rompes si lo saltas.
- **Criterio de done** — cómo sabes que terminaste.

Si un paso no aplica a tu repo (ej: ya tiene Vitest), márcalo como `[x] N/A — justificación` y sigue.

---

## Paso 0 — Bootstrap del repo

### Paso 0.A — Legacy (repo existente)

#### Qué hacer

1. Verificar que OpenSpec esté instalado:
   ```bash
   openspec --version
   ```

2. Dentro de la raíz del repo:
   ```bash
   openspec init
   ```

3. Copiar los archivos base desde el repo `openspec-constitution` (usar el tag de versión que vas a adoptar):

   ```bash
   CONSTITUTION_VERSION="v2.2.0"
   REPO="https://raw.githubusercontent.com/juandpm/openspec-constitution/${CONSTITUTION_VERSION}"

   curl -O ${REPO}/templates/eslint.config.js
   curl -O ${REPO}/templates/.prettierrc
   curl -O ${REPO}/templates/vitest.config.js

   mkdir -p src/config && curl -o src/config/logger.js ${REPO}/templates/logger.js
   mkdir -p tests && curl -o tests/setup.js ${REPO}/templates/tests-setup.js
   mkdir -p .github/workflows && curl -o .github/workflows/deploy-lambda.yml ${REPO}/templates/github-workflow.yml
   mkdir -p .claude/hooks && curl -o .claude/hooks/post-archive.js ${REPO}/templates/claude-hooks/post-archive.js
   curl -o .claude/settings.local.json ${REPO}/templates/claude-hooks/settings.local.json
   curl -O ${REPO}/templates/.env.example
   curl -O ${REPO}/templates/.gitattributes
   curl -o CLAUDE.md ${REPO}/templates/CLAUDE.md
   ```

   | Origen en constitución                    | Destino en el repo                        |
   |-------------------------------------------|-------------------------------------------|
   | `templates/eslint.config.js`              | `eslint.config.js`                        |
   | `templates/.prettierrc`                   | `.prettierrc`                             |
   | `templates/vitest.config.js`              | `vitest.config.js`                        |
   | `templates/tests-setup.js`                | `tests/setup.js`                          |
   | `templates/github-workflow.yml`           | `.github/workflows/deploy-lambda.yml`     |
   | `templates/claude-hooks/post-archive.js`  | `.claude/hooks/post-archive.js`           |
   | `templates/claude-hooks/settings.local.json` | `.claude/settings.local.json`          |
   | `templates/.gitattributes`                | `.gitattributes`                          |
   | `templates/CLAUDE.md`                     | `CLAUDE.md`                               |
   | `templates/logger.js`                     | `src/config/logger.js`                    |

#### Por qué importa

- Las configs llegan ya validadas. No pierdes tiempo decidiendo `printWidth` ni estructura de workflow.
- El tag de versión queda grabado en el historial: si la constitución cambia después, sabes con qué versión fue construido este repo.

#### Criterio de done

- `openspec/` existe con `project.md` vacío, `specs/` y `changes/archive/`.
- Los archivos de config están en el repo (aún **no instalados** — eso pasa en Fase 2).
- El hook de Claude está en `.claude/hooks/post-archive.js`.
- `CLAUDE.md` y `.gitattributes` están en la raíz (se completan en Fase 8).

---

### Paso 0.B — Greenfield (repo nuevo)

#### Qué hacer

1. Crear el repo en GitHub, clonar localmente, inicializar:
   ```bash
   git init   # si no viene clonado
   npm init -y
   ```

2. Actualizar `package.json` con los valores mínimos constitucionales:
   ```json
   {
     "type": "module",
     "engines": { "node": ">=22" }
   }
   ```

3. Instalar devDependencies desde el primer commit:
   ```bash
   npm install -D vitest @vitest/coverage-v8 eslint @eslint/js eslint-plugin-n eslint-config-prettier prettier
   ```

4. Ejecutar `openspec init` y copiar templates igual que en el Paso 0.A (mismo bloque de `curl`).

5. No hay `improvement-plan.md` en repos greenfield — el hook `post-archive.js` lo maneja correctamente.

#### Criterio de done

Igual que Paso 0.A más:
- `devDependencies` instaladas y en `package.json`.
- `"type": "module"` y `engines` presentes.
- `npm test` corre (aunque sea 0 tests) sin error de configuración.

> Para el flujo greenfield completo condensado, ver `docs/greenfield-onboarding.md`.

---

## Paso 1 — `/opsx:propose document-current-project`

### Qué hacer

1. Lanzar el propose:
   ```
   /opsx:propose document-current-project
   ```

2. Antes de escribir una sola línea del `project.md`, **leer el código**. Orden recomendado:

   | Orden | Qué leer | Qué extraer |
   |---|---|---|
   | 1 | `package.json` | Versión Node, `"type": "module"`, dependencies prod vs dev, scripts existentes |
   | 2 | `README.md` si existe | Propósito declarado del sistema |
   | 3 | `.gitignore` | Pistas de qué está fuera del repo (`.env`, certificados, builds) |
   | 4 | `.github/workflows/` | Si hay CI/CD o no |
   | 5 | Punto de entrada (`src/index.js` o similar) | Cómo se invoca, qué rutas maneja, validación de firma/auth |
   | 6 | Estructura de `src/` | `ls -R src/` o Glob `src/**/*.{js,ts}` |
   | 7 | Archivos > 200 líneas | Ahí vive la deuda estructural |

3. Grep de señales de humo típicas en serverless:

   ```bash
   # Conexiones reabriéndose por request (gran pérdida de performance)
   grep -rn "new MongoClient\|createConnection\|new Pool" src/

   # SDK AWS v2 (deprecated)
   grep -rn "require('aws-sdk')\|from 'aws-sdk'" src/

   # Env vars sin validación previa
   grep -rn "process\.env\." src/ | head -30

   # Logging sin estructura
   grep -rnc "console\.\(log\|error\|warn\)" src/

   # Deuda autoadmitida
   grep -rniE "todo|fixme|hack|xxx" src/

   # Dependencias importadas pero no usadas (aproximación)
   # Después de tener ESLint: `npm run lint` con regla no-unused-imports
   ```

4. Completar `openspec/project.md` con esta estructura (plantilla reducida gracias a la constitución):

   ```markdown
   # Project: [nombre]

   > Adhiere a openspec-constitution v2.2.0
   > https://github.com/juandpm/openspec-constitution/tree/v2.2.0

   ## Stack específico del repo
   - [Dependencias de producción con versión y uso — tabla]
   - [Base de datos / infra específica]
   - [Servicios externos: WhatsApp, Stripe, Twilio, etc.]

   ## Estructura de directorios
   [árbol real con rol de cada archivo — una línea por item]

   ## Puntos de entrada
   [handlers, rutas, eventos SQS/S3/EventBridge con tabla si son varios]

   ## Desviaciones de la constitución
   [Si algo no sigue la constitución, aquí se justifica.
    Si no hay: "Ninguna."]

   ## Deuda técnica conocida
   [Lo que está mal aunque no se vaya a arreglar ya. Específico, no vago.]
   ```

5. Cuando el `project.md` esté completo:
   ```
   /opsx:archive document-current-project
   ```

### Por qué importa

- Sin un `project.md` sólido, todas las propuestas de fases posteriores salen genéricas e incorrectas.
- La sección "Convenciones de código" desaparece del `project.md` (vive en la constitución). Esto ahorra páginas de redacción y evita divergencia entre repos.

### Criterio de done

- `openspec/project.md` tiene las 5 secciones completas.
- Alguien externo al equipo entiende el repo solo leyéndolo.
- La propuesta `document-current-project` está en `changes/archive/`.

### Errores comunes

- **Escribir antes de leer**: genera un `project.md` teórico que no refleja la realidad.
- **Deuda técnica vaga**: "falta testing" no sirve. Mejor: "0 tests, sin framework configurado, sin gate de calidad en CI antes del deploy".
- **Mezclar deuda con nice-to-have**: "métricas en Datadog" no es deuda, es feature. Sepáralos.

---

## Paso 2 — Gap analysis contra la constitución

### Qué hacer

Abrir `constitution.md` y marcar punto por punto qué cumple el repo y qué no. Completar esta tabla:

```markdown
| Requisito constitución | Estado actual | Fase |
|---|---|---|
| ES modules (`"type": "module"`) | ✓ cumple / ✗ ausente | — / N |
| ESLint configurado | | |
| Prettier configurado | | |
| Vitest + coverage ≥ 80% | | |
| Gate `test → deploy` en CI | | |
| Validación env vars al inicio | | |
| Singleton DB con pooling | | |
| `Promise.all` para I/O paralelo | | |
| Errores con statusCode | | |
| Hook post-archive de Claude | | |
```

Cada fila "✗ ausente" es una tarea de fase. Además, listar los bugs específicos del repo encontrados en el Paso 1 en una segunda tabla:

```markdown
| Bug / Deuda específica | Ubicación | Fase |
|---|---|---|
| [descripción concreta] | `src/foo.js:123` | 1 |
```

### Por qué importa

Esto reemplaza la clasificación de 7 buckets genéricos de la guía original. Es más rápido y más completo: la constitución ya codificó qué es "correcto", así que solo marcas diferencias.

### Criterio de done

- Ambas tablas completas.
- Cada item de deuda tiene asignada una fase.
- Lo que no encaje en ninguna fase va a "Deuda técnica conocida — fuera del plan" del `project.md` con motivo de exclusión.

---

## Paso 3 — Ejecutar fases en orden canónico

### Orden y razón

Las fases van en este orden **no por estética, sino por dependencias reales**:

1. **Quick wins** — bugs de bajo riesgo, impacto inmediato. No toca estructura.
2. **Tooling** — habilita todo lo demás. **Este es el paso más importante del playbook**.
3. **Performance** — singleton DB, `Promise.all`, sin cambios de comportamiento observable.
4. **Refactor estructural** — mueve código, cambia firmas. Requiere tests existentes (ver advertencia abajo).
5. **Cobertura unitaria** — sobre código ya refactorizado y estable.
6. **Cleanup + tests de integración** — cierra huecos.
7. **Tests de módulos críticos restantes** — entry point, encryption, etc.
8. **Documentación para agentes** — `CLAUDE.md`, `README.md`, `.gitattributes`. Obligatoria siempre al final.

### ⚠️ La regla de oro

**No hagas refactors estructurales (Fase 4) sin tests (parte de Fase 2 y Fase 5).**

Si el código pre-refactor es difícil de testear unitariamente, acepta ese orden y compensa con tests de integración post-refactor en Fase 6 (así se resolvió en flows con `ScreenHandler`).

### ⚠️ El error más caro de evitar

**Configurar testing en la Fase 5 en lugar de la Fase 2.**

En el repo flows, Vitest se instaló en la Fase 5. Eso significó refactorizar a ciegas en la Fase 4. El playbook corrige ese error: **tests van en Fase 2**, antes de tocar estructura.

### Ciclo por fase

Para cada fase:

```
/opsx:propose phase-N-nombre-descriptivo
/opsx:apply phase-N-nombre-descriptivo
npm test && npm run lint
/opsx:archive phase-N-nombre-descriptivo
```

Las plantillas de cada fase (proposal, tasks, criterios de done) viven en `phase-templates.md` (8 fases documentadas).

### Cómo escribir un buen proposal

El campo **Why** es lo más importante. Pregunta: *¿qué problema concreto resuelve esto y por qué ahora?*

- **Bien**: "El codebase tiene 3 bugs concretos y 2 dependencias que inflan el ZIP en 1.7MB. Son correcciones de bajo riesgo que deben resolverse antes de cualquier refactor mayor."
- **Mal**: "Mejorar la calidad del código."

### Cómo escribir un buen `tasks.md`

Cada tarea debe ser:

- **Atómica**: un archivo o una función.
- **Verificable**: hay algo concreto que confirmar al terminar.
- **Ordenada**: dependencias primero.

Ejemplo:

```markdown
- [ ] 1.1 Cambiar lógica de receive_visibility en ScreenHandler.js:245
- [ ] 1.2 Eliminar import de axios en src/index.js y de package.json
- [ ] 1.3 Eliminar dependencia npm crypto del package.json
```

Marca `[x]` **inmediatamente al completar cada tarea**, no al final de todas.

### Si una fase no aplica

Si el gap analysis muestra que una fase no tiene tareas (ej: el repo ya tiene singleton DB bien implementado), la saltas. No todas las fases son obligatorias para todos los repos.

---

## Paso 4 — Hook post-archive ya está listo

Si copiaste los archivos del Paso 0, el hook ya está en `.claude/hooks/post-archive.js` y referenciado en `.claude/settings.local.json`. Tras cada `/opsx:archive`, Claude hará una valoración automática del estado del proyecto.

### Verificación

Después de tu primer `/opsx:archive`, deberías ver a Claude leer `openspec/project.md` automáticamente y recomendar próximos pasos.

---

## Paso 5 — Fase 8: Documentación para agentes

Al terminar todas las fases técnicas (1–7), ejecutar:

```
/opsx:propose phase-8-agent-documentation
```

Esta fase es obligatoria en v2.0.0. Genera `CLAUDE.md` completo, valida `README.md` y configura `.gitattributes`. Ver plantilla completa en `phase-templates.md` — Fase 8.

### Criterio de done

- `CLAUDE.md` existe con las 8 secciones, sin `[TODO:]` pendientes.
- `README.md` tiene las 6 secciones mínimas.
- `.gitattributes` excluye `coverage/` de Linguist.
- GitHub muestra el lenguaje principal correcto.

---

## Checklist — Día 1 en cualquier repositorio nuevo

```
[ ] Paso 0 — Bootstrap
    [ ] openspec --version verifica instalación
    [ ] openspec init ejecutado
    [ ] Archivos de templates/ copiados desde openspec-constitution@vX.Y.Z
    [ ] Hook de Claude copiado

[ ] Paso 1 — Documentar
    [ ] /opsx:propose document-current-project
    [ ] Código fuente leído (Glob + Grep antes de escribir)
    [ ] Señales de humo grep-eadas
    [ ] project.md con 5 secciones (referencia constitución en primera línea)
    [ ] /opsx:archive document-current-project

[ ] Paso 2 — Gap analysis
    [ ] Tabla de requisitos constitucionales vs estado actual
    [ ] Tabla de bugs específicos del repo
    [ ] Cada item asignado a una fase o a "fuera del plan"

[ ] Paso 3 — Fases
    [ ] /opsx:propose phase-1-quick-wins (si hay bugs concretos)
    [ ] /opsx:propose phase-2-code-quality-tooling ← CRÍTICO aquí
    [ ] [resto de fases según gap analysis]

[ ] Paso 4 — Hook verificado
    [ ] Tras el primer archive, Claude hizo valoración automática

[ ] Paso 5 — Fase 8: Documentación para agentes
    [ ] /opsx:propose phase-8-agent-documentation
    [ ] CLAUDE.md completo, sin [TODO:] pendientes
    [ ] README.md con 6 secciones mínimas
    [ ] .gitattributes excluye coverage/ de Linguist
    [ ] GitHub muestra lenguaje principal correcto
```

---

## Anti-patrones

Cosas que se han visto y no funcionan:

| Anti-patrón | Por qué falla | Qué hacer en su lugar |
|---|---|---|
| Saltar el Paso 1 porque "ya conoces el repo" | El acto de documentar revela deuda que no veías | Hacerlo aunque parezca redundante |
| Instalar Vitest en Fase 5 | Refactorizas a ciegas en Fase 4 | Vitest va en Fase 2, junto a ESLint y Prettier |
| Meter refactor + feature nueva en la misma fase | Imposible aislar qué rompió qué | Feature es fase aparte, después del refactor |
| Marcar todas las tareas `[x]` al final | Pierdes track de progreso real, si hay bug no sabes dónde | Marcar al completar cada tarea |
| `project.md` genérico copiado de otro repo | Deuda específica se pierde | Leer código de este repo antes de escribir |
| Deploy sin `needs: test` en CI | El CI no protege nada | `needs: test` siempre |
