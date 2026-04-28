# Prompt de actualización — Migrar repo onboardeado a openspec-constitution v2.2.3

> Para copiar y pegar en Claude Code en un repo que ya fue onboardeado con OpenSpec
> y que referencia una versión anterior a `v2.2.3`.
> Referencia: `openspec-constitution v2.2.3`

---

## Cuándo usar este prompt

Cuando el repo ya tiene OpenSpec activo (`openspec/project.md` con referencia a la constitución)
y necesita actualizarse a `v2.2.3`. La versión de origen puede ser `v1.x.x`, `v2.0.0`, `v2.1.x` o `v2.2.x`.

**No uses este prompt para repos sin onboarding previo.** Para esos, usa `prompt-onboarding.md`.

---

## COPIAR DESDE AQUÍ ⬇️

```
Actúa como mi agente de ingeniería. Este repo ya tiene OpenSpec activo y necesita
actualizarse a openspec-constitution v2.2.3 (https://github.com/juandpm/openspec-constitution).
Mi usuario de GitHub es juandpm.

REGLAS DE OPERACIÓN:
- Todo trabajo va por OpenSpec: propose → apply → archive. Sin excepción.
- No sobreescribas archivos sin avisarme primero.
- Al terminar cada paso, resumes lo hecho y pides mi confirmación antes de continuar.
- Si hay ambigüedad, preguntas. No asumes.
- Los comandos /opsx:propose y /opsx:archive los ejecuto YO cuando me avises.

═══════════════════════════════════════════════════════════════
PASO 1 — DIAGNÓSTICO DE VERSIÓN ACTUAL
═══════════════════════════════════════════════════════════════

1. Lee openspec/project.md y reporta:
   - Versión de constitución a la que adhiere actualmente
   - Cómo se declara (texto exacto de la primera línea o bloque)

2. Clasifica la brecha:

   CASO A — viene de v1.x.x (v1.0.0 o v1.1.0):
     Hay cuatro saltos acumulados: v1→v2.0.0 + v2.0.0→v2.1.0 + v2.1.0→v2.2.0 + v2.2.0→v2.2.3
     → Ir a RUTA A (migración completa desde v1.x.x)

   CASO B — viene de v2.0.0:
     Hay tres saltos: v2.0.0→v2.1.0 + v2.1.0→v2.2.0 + v2.2.0→v2.2.3
     → Ir a RUTA B (migración desde v2.0.0)

   CASO C — viene de v2.1.x (v2.1.0 o v2.1.1):
     Dos saltos: v2.1.x→v2.2.0 + v2.2.0→v2.2.3
     → Ir a RUTA C (migración desde v2.1.x)

   CASO D — viene de v2.2.x (v2.2.0, v2.2.1 o v2.2.2):
     Un salto PATCH: v2.2.x→v2.2.3 (solo correcciones de documentación y consistencia)
     → Ir a RUTA D (actualización mínima desde v2.2.x)

3. Reporta el caso detectado con evidencia y espera mi confirmación.

═══════════════════════════════════════════════════════════════
RUTA A — Migración desde v1.x.x a v2.2.3
═══════════════════════════════════════════════════════════════

Ejecuta A.1 → A.2 → A.3 → A.4 en orden, pausando entre cada uno.

A.1 DELTA v1→v2.0.0 (lo que falta de este salto):
  Ejecuta: /opsx:propose upgrade-constitution-v1-to-v2

  Verifica y completa si falta:
  □ CLAUDE.md en la raíz con las 9 secciones
    - Descargar base: curl -o CLAUDE.md https://raw.githubusercontent.com/juandpm/openspec-constitution/v2.2.3/templates/CLAUDE.md
    - Completar TODOS los [TODO:] con información real del repo
    - NO cerrar hasta que ninguna sección tenga placeholder pendiente
  □ .gitattributes en la raíz
    - Si no existe: curl -O https://raw.githubusercontent.com/juandpm/openspec-constitution/v2.2.3/templates/.gitattributes
  □ Hook post-archive robusto (maneja ausencia de improvement-plan.md)
    - Verificar que .claude/hooks/post-archive.js lee condicionalmente improvement-plan.md
    - Si es la versión vieja: curl -o .claude/hooks/post-archive.js https://raw.githubusercontent.com/juandpm/openspec-constitution/v2.2.3/templates/claude-hooks/post-archive.js
  □ Fase 8 ejecutada o planificada (documentación para agentes)
    - Si no se hizo: planificarla antes de pasar a A.2

  Avísame para /opsx:archive upgrade-constitution-v1-to-v2.

A.2 DELTA v2.0.0→v2.1.0 (ir a RUTA B después de A.1):
  Ver instrucciones de RUTA B sección B.1.

A.3 DELTA v2.1.0→v2.2.0 (ir a RUTA C después de A.2):
  Ver instrucciones de RUTA C.

A.4 DELTA v2.2.x→v2.2.3 (ir a RUTA D después de A.3):
  Ver instrucciones de RUTA D.

═══════════════════════════════════════════════════════════════
RUTA B — Migración desde v2.0.0 a v2.2.3
═══════════════════════════════════════════════════════════════

Ejecuta B.1 → B.2 → B.3 en orden, pausando entre cada uno.

B.1 DELTA v2.0.0→v2.1.0:
  Ejecuta: /opsx:propose upgrade-constitution-v2.0.0-to-v2.1.0

  Verifica y completa si falta:
  □ pino instalado como dependencia de PRODUCCIÓN:
      grep '"pino"' package.json
      → Si no aparece en "dependencies" (solo en devDeps o ausente):
        npm install pino
        npm install --save-dev pino-pretty
  □ src/config/logger.js existe con el singleton pino:
      ls src/config/logger.js
      → Si no existe:
        mkdir -p src/config
        curl -o src/config/logger.js https://raw.githubusercontent.com/juandpm/openspec-constitution/v2.2.3/templates/logger.js
  □ console.log reemplazado por logger en código de producción:
      grep -rn "console\.log\|console\.error\|console\.warn" src/
      → Si hay resultados: reemplazar uno por uno con la llamada logger correspondiente
        (logger.info / logger.error / logger.warn)
      → Los console en tests/ pueden quedarse (el ESLint los ignora ahí)
  □ LOG_LEVEL en .env.example:
      grep "LOG_LEVEL" .env.example
      → Si no existe, agregar:
        # --- Logging ---
        NODE_ENV=development
        LOG_LEVEL=debug
  □ ESLint: "no-console": "warn" en producción, "off" en tests/:
      grep "no-console" eslint.config.js
      → Si no está configurado así, actualizar eslint.config.js

  Avísame para /opsx:archive upgrade-constitution-v2.0.0-to-v2.1.0.

B.2 DELTA v2.1.0→v2.2.0:
  Ver instrucciones de RUTA C.

B.3 DELTA v2.2.x→v2.2.3:
  Ver instrucciones de RUTA D.

═══════════════════════════════════════════════════════════════
RUTA C — Migración desde v2.1.x a v2.2.3
═══════════════════════════════════════════════════════════════

Ejecuta: /opsx:propose upgrade-constitution-v2.1-to-v2.2

C.1 DIAGNÓSTICO DETALLADO (antes de escribir una línea):
  Lee estos archivos:
    - CLAUDE.md (¿tiene sección 9 "Position in ecosystem"? ¿tiene mini-diagrama Mermaid real?)
    - openspec/project.md (¿qué versión declara?)
    - https://raw.githubusercontent.com/juandpm/openspec-constitution/v2.2.3/docs/ecosystem.md
      (leerlo completo — es el mapa de referencia para saber upstream/downstream de este repo)

  Genera este checklist con estado real del repo:

    □ openspec/project.md referencia v2.2.3        [actual: vX.Y.Z]
    □ CLAUDE.md tiene sección 9                     [sí / no / incompleta]
    □ Sección 9: mini-diagrama Mermaid presente     [sí / no / placeholder TODO]
    □ Sección 9: upstream declarado (no placeholder)[sí / no]
    □ Sección 9: downstream declarado (no placeholder)[sí / no]
    □ Sección 9: nombre Lambda AWS exacto           [sí / no]
    □ Sección 9: referencia a docs/ecosystem.md     [sí / no]
    □ constitution.md §12 leído (nomenclatura AWS)  [pendiente]
    □ Nombres de recursos del repo vs §12 validados [pendiente]

  Muéstrame el checklist y espera confirmación antes de C.2.

C.2 COMPLETAR SECCIÓN 9 EN CLAUDE.md:
  Si la sección 9 no existe o tiene placeholders [TODO]:

  a) Lee docs/ecosystem.md de openspec-constitution (link arriba) para entender
     qué upstream y downstream le corresponden a ESTE repo en particular.

  b) Completa la sección 9 con información REAL (no placeholders):

     ## Position in ecosystem

     Reference: https://github.com/juandpm/openspec-constitution/blob/main/docs/ecosystem.md

     ```mermaid
     flowchart LR
         [upstream real del repo] -->|trigger/HTTP| THIS["[nombre-lambda-exacto]\n★ THIS REPO"]
         THIS -->|escribe/encola| [downstream real del repo]
     ```

     Upstream (what triggers or calls this service):
     - [lista real — SQS queue name, API Gateway route, S3 event, etc.]

     Downstream (what this service writes to or calls):
     - [lista real — SQS queue, DocumentDB, S3 bucket, external API, etc.]

     AWS Lambda function name: [nombre exacto tal como aparece en AWS]

  c) Valida que los nombres de colas SQS, rutas de API Gateway y nombre de DB
     son consistentes con los que aparecen en docs/ecosystem.md.
     Si hay diferencia, REPORTA antes de escribir — puede ser un typo histórico
     documentado o una inconsistencia real.

  Muéstrame la sección 9 propuesta y pide mi feedback antes de guardar.

C.3 VALIDAR NOMENCLATURA AWS (constitution §12):
  Lee constitution.md §12 de openspec-constitution v2.2.3:
    https://raw.githubusercontent.com/juandpm/openspec-constitution/v2.2.3/constitution.md

  Para este repo, verifica:
  □ Nombre de la Lambda sigue patrón lambda-{dominio}[-{variante}]
  □ Colas SQS siguen patrón {dominio}-queue[.fifo] o {dominio}-queue-{variante}.fifo
  □ Si hay typos históricos en nombres AWS, están documentados en "Non-obvious details"
    de CLAUDE.md (no se corrigen sin migración coordinada de todos los productores/consumidores)

  Reporta cualquier desviación o typo histórico encontrado.
  Si todo cumple, indica "§12 verificado ✅".

C.4 ACTUALIZAR REFERENCIA EN project.md:
  En openspec/project.md, cambiar la primera línea:
    Antes: > Adhiere a openspec-constitution vX.Y.Z
    Después: > Adhiere a openspec-constitution v2.2.3
             > https://github.com/juandpm/openspec-constitution/tree/v2.2.3

  Solo hacer este cambio cuando los puntos C.2 y C.3 estén completos.

C.5 VERIFICACIÓN FINAL:
  Ejecuta estos checks y reporta resultado:
    □ grep "v2.2.3" openspec/project.md         → debe aparecer
    □ grep "Position in ecosystem" CLAUDE.md    → debe aparecer
    □ grep "TODO" CLAUDE.md                     → idealmente 0 resultados
    □ grep -c "console\.log" src/ 2>/dev/null   → idealmente 0 en producción
    □ grep "pino" package.json                  → debe estar en "dependencies"

  Si todo pasa, avísame para /opsx:archive upgrade-constitution-v2.1-to-v2.2.

  Luego continúa con RUTA D para el salto PATCH final.

═══════════════════════════════════════════════════════════════
RUTA D — Actualización desde v2.2.x a v2.2.3 (PATCH)
═══════════════════════════════════════════════════════════════

v2.2.3 es un PATCH de limpieza de consistencia de versión. No hay cambios funcionales.
El único trabajo necesario es verificar la sección 9 del CLAUDE.md y actualizar project.md.

Ejecuta: /opsx:propose upgrade-constitution-v2.2-to-v2.2.3

D.1 VERIFICAR QUE LAS CORRECCIONES YA APLICAN:
  Estos son los cambios de v2.2.3 (ya están en los templates del tag):
  □ Todos los headers de documentos y templates referencian v2.2.3
  □ constitution.md §11 dice explícitamente "9 secciones" (antes decía 8)
  □ CLAUDE.md del repo tiene las 9 secciones documentadas (sección 9 = Position in ecosystem)
  □ Si el CLAUDE.md del repo fue generado desde un template anterior a v2.2.0,
    verificar que la sección 9 existe y no tiene [TODO:] pendientes

  Si la sección 9 del CLAUDE.md tiene [TODO:] pendientes:
  → Ejecutar C.2 y C.3 de RUTA C antes de continuar.

D.2 ACTUALIZAR REFERENCIA EN project.md:
  En openspec/project.md, cambiar la primera línea:
    Antes: > Adhiere a openspec-constitution v2.2.x
    Después: > Adhiere a openspec-constitution v2.2.3
             > https://github.com/juandpm/openspec-constitution/tree/v2.2.3

D.3 VERIFICACIÓN FINAL:
    □ grep "v2.2.3" openspec/project.md         → debe aparecer
    □ grep "Position in ecosystem" CLAUDE.md    → debe aparecer
    □ grep "TODO" CLAUDE.md                     → idealmente 0 resultados

  Si todo pasa, avísame para /opsx:archive upgrade-constitution-v2.2-to-v2.2.3.

═══════════════════════════════════════════════════════════════
DESPUÉS DE LA MIGRACIÓN — Verificación de fases
═══════════════════════════════════════════════════════════════

Una vez completada la migración de versión, evalúa el estado de las 8 fases
para confirmar que el repo está al día:

| Fase | Nombre                    | Estado | Evidencia clave |
|------|---------------------------|--------|-----------------|
| 1    | Quick wins                | ✅/⏳/N/A | archivo archivado + bugs resueltos |
| 2    | Code Quality Tooling      | ✅/⏳/N/A | ESLint + Prettier + Vitest + pino + logger.js + CI gate |
| 3    | Performance               | ✅/⏳/N/A | singletons de DB, Promise.all |
| 4    | Refactor estructural      | ✅/⏳/N/A | no hay archivos >400 líneas con mezcla de responsabilidades |
| 5    | Cobertura unitaria        | ✅/⏳/N/A | npm run test:coverage supera 80/80/70/80 |
| 6    | Integration tests         | ✅/⏳/N/A | tests del handler con mocks de services/ |
| 7    | Módulos críticos          | ✅/⏳/N/A | tests de entry point y crypto/auth |
| 8    | Documentación para agentes| ✅/⏳/N/A | CLAUDE.md 9 secciones + README.md + .gitattributes |

Si hay fases con ⏳: propón continuar con la siguiente pendiente antes de
arrancar cualquier trabajo nuevo. Todo nuevo trabajo va por OpenSpec.

Si todas las fases están ✅: el repo está al día con v2.2.3. Pregunta qué sigue.

═══════════════════════════════════════════════════════════════
INICIAR
═══════════════════════════════════════════════════════════════

Empieza ahora por el PASO 1 — diagnóstico de versión actual.
Lee openspec/project.md, reporta qué versión declara y espera mi confirmación.
```

## COPIAR HASTA AQUÍ ⬆️

---

## Qué hace cada ruta

| Desde | Ruta | Cambios principales |
|---|---|---|
| `v1.x.x` | A → B → C → D | CLAUDE.md + .gitattributes + hook + Fase 8 + pino + logger + sección 9 ecosistema |
| `v2.0.0` | B → C → D | pino + logger.js + console→logger + sección 9 ecosistema |
| `v2.1.x` | C → D | Sección 9 en CLAUDE.md con mini-diagrama Mermaid + validar §12 |
| `v2.2.x` | D | Verificar sección 9 completa + actualizar referencia en project.md (PATCH) |

## Tiempo estimado por ruta

| Ruta | Estimado |
|---|---|
| D (desde v2.2.x) | 5 min — verificar sección 9 y actualizar project.md |
| C (desde v2.1.x) | 20–40 min — principalmente completar sección 9 del CLAUDE.md |
| B (desde v2.0.0) | 1–2 h — instalar pino, migrar console.log, luego sección 9 |
| A (desde v1.x.x) | 2–4 h — todo lo anterior más CLAUDE.md completo y Fase 8 |

## Lo que NO hace este prompt

- No ejecuta las fases técnicas pendientes (1–7). Si al evaluar el estado hay fases
  incompletas, el agente las reporta y propone continuar, pero eso es trabajo aparte.
- No modifica código de producción más allá de migrar `console.log` → `logger` (RUTA B).
- No crea nuevos recursos AWS ni cambia infraestructura.
