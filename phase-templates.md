# Plantillas de fases canónicas

> Versión: 2.0.0
> Uso: al lanzar `/opsx:propose phase-N-...`, Claude consulta este archivo para
> generar el proposal y el tasks.md base adaptados al repo específico.

---

## Estructura de cada fase

Cada fase documentada aquí tiene:

- **Objetivo** — qué se logra al completarla.
- **Cuándo aplica** — señales concretas de que este repo la necesita.
- **Cuándo saltar** — condiciones para marcarla N/A.
- **Plantilla de proposal** — el "Why" canónico, a adaptar con detalles del repo.
- **Plantilla de tasks** — las tareas típicas, ordenadas.
- **Criterios de done** — qué verificar al terminar.

---

## Fase 1 — Quick Wins

### Objetivo

Arreglar bugs de comportamiento incorrecto y limpiar dependencias fantasma. Bajo riesgo, alto impacto visible.

### Cuándo aplica

- El Paso 1 del playbook reveló bugs concretos (lógica invertida, mutación de parámetros, queries duplicadas sin justificación).
- Hay imports no usados o dependencias npm sin referencia en el código.
- Hay errores que exponen detalles internos al usuario (claves de DB, stack traces).

### Cuándo saltar

- El repo es nuevo y el gap analysis no encontró bugs ni dependencias fantasma.

### Plantilla de proposal

```markdown
## Why

El codebase tiene [N] bugs concretos identificados en el Paso 1 y [M] dependencias
que inflan el bundle en [X]MB. Son correcciones atómicas de bajo riesgo que deben
resolverse antes de cualquier refactor mayor porque:

1. Cambios de comportamiento tardíos complican el análisis de regresiones post-refactor.
2. Dependencias fantasma afectan tiempos de cold start en Lambda.
3. Errores que filtran internos son un riesgo de seguridad que no espera.

## What

[Lista exacta de bugs con ubicación: `src/foo.js:123`]
[Lista exacta de dependencias a eliminar]
[Lista exacta de respuestas de error a sanitizar]

## Non-goals

- No refactorizar estructura de módulos (eso es Fase 4).
- No agregar tests nuevos (eso es Fase 5).
- No tocar configuración de tooling (eso es Fase 2).
```

### Plantilla de tasks

```markdown
- [ ] 1.1 [bug específico] en `src/archivo.js:línea`
- [ ] 1.2 Eliminar import de `[paquete]` en `src/archivo.js`
- [ ] 1.3 Eliminar `[paquete]` de `package.json` y correr `npm install`
- [ ] 1.4 Sanitizar respuesta de error en `src/handler.js:línea`:
         reemplazar mensaje que expone clave MongoDB con mensaje genérico
- [ ] 1.5 `npm install` final, verificar que `package-lock.json` refleja los cambios
```

### Criterios de done

- Todos los bugs listados corregidos y verificados manualmente.
- `package.json` sin dependencias fantasma (verificar con `npx depcheck` si hace falta).
- Respuestas de error al usuario no contienen nombres de tablas, claves o paths internos.
- El repo sigue funcionando tal como antes (verificación manual del happy path).

---

## Fase 2 — Code Quality Tooling

### Objetivo

Configurar ESLint, Prettier, Vitest y el gate `test → deploy` en CI. **Esta fase habilita todas las siguientes.**

### Cuándo aplica

Siempre que el repo no tenga ya todo el tooling de la constitución. Casi todos los repos legacy necesitan esta fase completa.

### Cuándo saltar

- El repo ya tiene ESLint 9+, Prettier 3+, Vitest 4+ con coverage v8, y CI con `needs: test`.
- (Raro — usualmente falta al menos una pieza.)

### Plantilla de proposal

```markdown
## Why

El repo carece de infraestructura de calidad. Sin ella:

- No se pueden detectar imports no usados, variables sin uso ni antipatrones.
- No se puede refactorizar con confianza (no hay red de seguridad).
- El CI puede desplegar código roto sin ningún gate.
- Formateo inconsistente genera diffs ruidosos en code review.

Esta fase instala el stack constitucional completo y activa el gate `test → deploy`.
Es prerequisito para cualquier trabajo posterior.

## What

- ESLint 9+ con `eslint.config.js` (perfil Node ESM).
- Prettier 3+ con `.prettierrc` estándar.
- Vitest 4+ con `vitest.config.js` y coverage v8 con umbrales constitucionales.
- `tests/setup.js` con env vars para que módulos que validan al inicio no fallen.
- Workflow `.github/workflows/deploy-lambda.yml` con jobs `test` y `deploy` separados.
- Validación de env vars requeridas al inicio de `src/index.js`.

## Non-goals

- No escribir tests unitarios todavía (Fase 5).
- No refactorizar código existente (Fase 4).
- No cambiar comportamiento de la aplicación.
```

### Plantilla de tasks

```markdown
- [ ] 2.1 Instalar devDependencies:
         `npm install -D vitest @vitest/coverage-v8 eslint @eslint/js eslint-plugin-n eslint-config-prettier prettier`
- [ ] 2.2 Adaptar scripts en `package.json` (test, test:watch, test:coverage, test:ci, lint, lint:fix, format, format:check)
- [ ] 2.3 Verificar que `eslint.config.js` (copiado en Paso 0) funciona: `npm run lint`
         Corregir violaciones triviales o agregarlas a `tasks.md` si son grandes
- [ ] 2.4 Verificar que `.prettierrc` funciona: `npm run format:check`
         Correr `npm run format` una sola vez para normalizar todo el repo
- [ ] 2.5 Verificar `vitest.config.js`: `npm test` (debería correr 0 tests sin errores)
- [ ] 2.6 Agregar validación de env vars al inicio de `src/index.js`:
```
```js
         const REQUIRED_ENV = [/* lista específica del repo */];
         const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
         if (missing.length > 0) {
           throw new Error(`Missing required env vars: ${missing.join(", ")}`);
         }
```
```markdown
- [ ] 2.7 Adaptar `.github/workflows/deploy-lambda.yml` al nombre real del Lambda y secrets del repo
- [ ] 2.8 Verificar que CI corre: push a branch, confirmar que `test` job ejecuta `npm run test:ci`
         y que `deploy` tiene `needs: test`
- [ ] 2.9 Commit único de esta fase: "Phase 2: code quality tooling"
```

### Criterios de done

- `npm run lint` pasa sin errores.
- `npm run format:check` pasa sin cambios pendientes.
- `npm test` corre (aunque sean 0 tests) sin configuración rota.
- Cold start falla con mensaje claro si falta una env var requerida.
- CI bloquea el deploy si `test` job falla.

---

## Fase 3 — Performance Optimizations

### Objetivo

Optimizaciones sin cambio de comportamiento observable: connection pooling, paralelización de I/O.

### Cuándo aplica

- Conexiones a DB se abren/cierran por request.
- Llamadas I/O independientes se hacen secuencialmente con `for...of`.
- SDK AWS v2 en lugar de v3.

### Cuándo saltar

- El repo ya usa singletons de módulo para DB y `Promise.all` para I/O paralelo.
- No hay operaciones I/O relevantes (repo puramente CPU-bound).

### Plantilla de proposal

```markdown
## Why

La Lambda reconecta a [DB/servicio] en cada invocación, incluso en warm starts.
Esto añade [X]ms de latencia innecesaria por request y genera carga inútil sobre
el pool de conexiones del cluster.

Además, las [N] descargas de [S3/HTTP] se hacen secuencialmente cuando son
independientes. Paralelizar reduce el tiempo total al de la más lenta.

Estas optimizaciones no cambian el comportamiento observable del sistema y son
seguras de aplicar ahora que tenemos Vitest configurado.

## What

- Refactorizar cliente de DB a singleton de módulo reutilizable entre warm invocations.
- Reemplazar `for...of` con `await` por `Promise.all` donde las operaciones son independientes.
- [Si aplica] Migrar de AWS SDK v2 a v3.

## Non-goals

- No cambiar la interfaz pública de servicios (eso es Fase 4).
- No agregar retry logic ni circuit breakers (decisión fuera de esta fase).
```

### Plantilla de tasks

```markdown
- [ ] 3.1 Refactorizar `src/services/DatabaseService.js`: `MongoClient` como singleton de módulo
- [ ] 3.2 Eliminar llamadas a `disconnect()` post-request (el singleton persiste)
- [ ] 3.3 Cambiar `for...of` con await por `Promise.all` en `src/services/S3Service.js` (o equivalente)
- [ ] 3.4 [Si aplica] Migrar imports de `aws-sdk` a `@aws-sdk/client-*` (SDK v3)
- [ ] 3.5 Smoke test manual: invocar la Lambda con un request válido, verificar respuesta correcta
```

### Criterios de done

- El cliente DB se instancia una sola vez por warm container.
- Operaciones I/O paralelas usan `Promise.all`.
- Latencia end-to-end en warm invocation baja medible (verificar en CloudWatch si es posible).
- Smoke test manual pasa.

---

## Fase 4 — Refactor Estructural

> **⚠️ NO ENTRAR A ESTA FASE SIN FASE 2 CERRADA.** El error más caro documentado en el repo `flows` fue refactorizar sin red de seguridad. Si `npm test` corre 0 tests, esta fase se pospone. Tests no-opcionales en Fase 2 previenen refactor a ciegas.

### Objetivo

Reorganizar código: extraer módulos, eliminar duplicación severa, reducir archivos monolíticos.

### Cuándo aplica

- Hay archivos > 400 líneas con múltiples responsabilidades.
- Hay bloques duplicados de > 50 líneas.
- La estructura actual dificulta agregar features.

### ⚠️ Requisito crítico

**Esta fase requiere red de seguridad.** Idealmente tests unitarios existentes. Si no se puede testear el código pre-refactor unitariamente, compensar con:

- Smoke tests manuales documentados antes del refactor.
- Tests de integración post-refactor en Fase 6.

### Cuándo saltar

- No hay archivos monolíticos ni duplicación severa.

### Plantilla de proposal

```markdown
## Why

`src/[archivo].js` tiene [N] líneas y mezcla [responsabilidades]. Esto causa:

1. Cada nueva feature toca el archivo, aumentando riesgo de regresión.
2. Duplicación de [X] líneas entre [bloque A] y [bloque B].
3. Lógica de [normalización/routing/cálculo] dispersa es difícil de testear.

Refactorizar ahora —con tooling ya instalado en Fase 2— permite añadir tests
unitarios al código extraído en Fase 5 sobre una base limpia.

## What

- Extraer [función/módulo] a `src/utils/[nombre].js` como función pura.
- Consolidar los bloques duplicados en una única función [nombre] con `resolveFlowContext`-style.
- Reducir `[archivo monolítico]` de [X] a ~[Y] líneas.

## Non-goals

- No cambiar comportamiento observable.
- No agregar features nuevas.
- No cambiar firmas de export públicos (salvo documentado).
```

### Plantilla de tasks

```markdown
- [ ] 4.1 Extraer `[función]` a `src/utils/[archivo].js` como función pura
- [ ] 4.2 Reemplazar llamadas internas por import de la nueva ubicación
- [ ] 4.3 Consolidar bloques duplicados [A] y [B] en función única
- [ ] 4.4 Smoke test manual: flujos [X], [Y], [Z] siguen funcionando
- [ ] 4.5 Verificar que `npm run lint` pasa y el diff es razonable
```

### Criterios de done

- Archivo monolítico reducido al target documentado.
- Sin duplicación detectable en los bloques refactorizados.
- Smoke tests manuales pasan.
- Lint sin errores.

---

## Fase 5 — Cobertura Unitaria

### Objetivo

Tests unitarios para módulos puros y funciones críticas de negocio.

### Cuándo aplica

Siempre. Esta es la fase donde se amortiza todo el trabajo de Fase 2 y 4.

### Cuándo saltar

- El repo ya tiene cobertura ≥ 80% con tests que efectivamente prueban lógica (no placeholders).

### Plantilla de proposal

```markdown
## Why

El motor de [cálculo/transformación/validación] del repo no tiene tests.
Cualquier cambio es impredecible y el gate de CI de Fase 2 no protege nada
sin tests que validar.

Esta fase cubre:
- Motor de cálculo / transformación / funciones puras de utils.
- Normalización de claves [DB / cache / URL].
- Helpers de datos (transformObject y similares).

Tests de integración del handler principal van en Fase 6.

## What

Tests unitarios para:
- `src/utils/calculations.js` — happy path + edge cases (valores null, ceros, overflow).
- `src/utils/[otro].js` — cada función pura con casos cubriendo sus ramas.

Umbral de cobertura para esta fase: cumplir los mínimos de constitución
(lines ≥ 80%, functions ≥ 80%, branches ≥ 70%, statements ≥ 80%).

## Non-goals

- Tests de integración del handler (Fase 6).
- Tests de encryption o entry point (Fase 7).
```

### Plantilla de tasks

```markdown
- [ ] 5.1 `tests/calculations.test.js` — happy path para cada función exportada
- [ ] 5.2 `tests/calculations.test.js` — edge cases (null, 0, valores extremos)
- [ ] 5.3 `tests/[otro].test.js` — cubrir cada función pura de utils
- [ ] 5.4 Correr `npm run test:coverage` — verificar que supera umbrales
- [ ] 5.5 Excluir del coverage servicios que se mockean completamente (`src/services/**`)
- [ ] 5.6 Commit: "Phase 5: unit test coverage"
```

### Criterios de done

- `npm run test:coverage` pasa los umbrales constitucionales.
- Cada función pública de utils tiene tests de happy path y edge cases.
- Reporte de cobertura no tiene falsos positivos (servicios mockeados excluidos).

---

## Fase 6 — Cleanup + Tests de Integración

### Objetivo

Cerrar huecos de cobertura del orquestador principal con tests de integración que mockean servicios externos.

### Cuándo aplica

Después de Fase 5, si el handler principal / orquestador de negocio no está cubierto porque depende de DB, S3 u otros clientes externos.

### Cuándo saltar

- El orquestador ya está cubierto por Fase 5 (raro, solo si es puramente funcional).

### Plantilla de proposal

```markdown
## Why

El orquestador `src/handlers/[Handler].js` no se puede testear unitariamente
porque depende de DB y S3. Pero es el módulo donde vive la lógica de negocio
más compleja (routing de acciones, ramas por tipo de flujo, manejo de errores).

Tests de integración con mocks de servicios externos validan que:
- El routing de acciones funciona.
- Los errores de servicios se manejan sin exponer internos.
- Cada tipo de flujo produce la respuesta esperada.

## What

- `tests/[Handler].test.js` con `vi.mock` para DatabaseService y S3Service.
- Cobertura para: happy paths de cada tipo de flujo, manejo de errores, early returns.
- Objetivo de cobertura del handler: ≥ 85% lines / ≥ 70% branches.

## Non-goals

- Tests del entry point (Fase 7).
- Tests de encryption (Fase 7).
```

### Plantilla de tasks

```markdown
- [ ] 6.1 `tests/[Handler].test.js` — setup de mocks con `vi.mock("../src/services/...")`
- [ ] 6.2 Tests para cada acción del protocolo (ping, INIT, data_exchange, BACK)
- [ ] 6.3 Tests de manejo de errores (DB falla, S3 falla)
- [ ] 6.4 Actualizar umbrales en `vitest.config.js` al alza si la cobertura real los supera
- [ ] 6.5 Limpieza residual de código muerto detectado al escribir los tests
```

### Criterios de done

- Cobertura del handler supera los objetivos internos de la fase.
- Tests de integración corren en < 5 segundos totales.
- Umbrales de `vitest.config.js` actualizados si procede.

---

## Fase 7 — Tests de Módulos Críticos Restantes

### Objetivo

Cerrar cobertura de entry point y módulos de seguridad/criptografía.

### Cuándo aplica

- El entry point (`src/index.js`) no está cubierto.
- Hay módulos críticos (encryption, auth) sin tests.

### Cuándo saltar

- Todo lo crítico ya quedó cubierto en fases anteriores.

### Plantilla de proposal

```markdown
## Why

El entry point y el módulo de encryption (o auth) son los puntos de mayor
riesgo de regresión silenciosa:

- Un fallo en la validación de firma HMAC compromete seguridad.
- Un fallo en decryption de payload rompe 100% de las invocaciones.
- Un cambio en el formato de respuesta rompe la integración con el invocador.

Esta fase cierra la cobertura de ambos módulos con tests que usan claves
reales (sin mocks) para encryption y mocks para el entry point.

## What

- `tests/encryption.test.js` — tests unitarios con claves RSA reales.
- `tests/index.test.js` — tests de integración mockeando encryption y ScreenHandler.

## Non-goals

- Tests E2E reales contra WhatsApp (fuera del alcance de OpenSpec).
```

### Plantilla de tasks

```markdown
- [ ] 7.1 `tests/encryption.test.js` — round-trip con claves RSA reales, IV invertido
- [ ] 7.2 Tests de error: clave privada incorrecta → FlowEndpointException(421)
- [ ] 7.3 Tests de error: auth tag AES-GCM corrupto → throws
- [ ] 7.4 `tests/index.test.js` — mock de encryption + ScreenHandler con `importOriginal`
- [ ] 7.5 Tests: firma HMAC inválida → 403, flujo cifrado completo → 200
- [ ] 7.6 Tests: rutas desconocidas → 404, GET / → 200 html
- [ ] 7.7 Verificar cobertura global ≥ 90% lines
```

### Criterios de done

- `src/encryption.js` cerca de 100% cobertura.
- `src/index.js` ≥ 90% cobertura.
- Cobertura global del repo ≥ 90% lines.
- Test suite total corre en < 10 segundos.

---

## Fase 8 — Documentación para agentes

### Objetivo

Dejar el repo legible para futuros agentes de IA y correctamente clasificado en GitHub Linguist.

### Por qué importa

Cada vez que abres una sesión nueva con Claude Code pierdes 5-10 minutos explicando el repo desde cero: qué hace, cómo se testea, qué convenciones usa, dónde están los gotchas. Un `CLAUDE.md` bien hecho elimina ese costo de forma permanente. Además, si `coverage/` o `dist/` no están excluidos de Linguist, GitHub puede clasificar el repo como "HTML" o "CSS" cuando en realidad es JavaScript — confunde a herramientas automáticas y a personas nuevas.

### Cuándo aplica

Siempre al final del ciclo de fases. También cuando:
- Linguist clasifica mal el lenguaje principal del repo (p.ej. dice "HTML" porque el reporte de cobertura pesa más que el código).
- No existe `CLAUDE.md` o está incompleto (tiene `[TODO:]` pendientes).

### Cuándo saltar

Solo si los tres artefactos ya existen con las secciones exigidas **y** la clasificación de Linguist es correcta. (En repos recién onboardeados esto nunca es el caso.)

### Plantilla de proposal

```markdown
## Why

Cada sesión nueva con Claude Code requiere 5-10 minutos de contexto verbal
sobre el repo. Un `CLAUDE.md` completo elimina ese costo. Adicionalmente,
GitHub clasifica este repo como [HTML/CSS/incorrecto] porque [coverage/dist/build]
no está excluido del cálculo de Linguist.

Esta fase deja el repo en estado "agent-ready": cualquier sesión futura
arranca con contexto completo sin explicación manual.

## What

- Crear/actualizar `CLAUDE.md` desde `templates/CLAUDE.md` con información real del repo.
- Verificar que `README.md` tiene las 6 secciones mínimas.
- Crear `.gitattributes` desde `templates/.gitattributes` para corregir Linguist.

## Non-goals

- No cambiar comportamiento del código.
- No agregar tests.
```

### Plantilla de tasks

```markdown
- [ ] 8.1 Crear/actualizar `CLAUDE.md` desde `templates/CLAUDE.md`
- [ ] 8.2 Completar todos los placeholders `[TODO: ...]` con info real del repo
- [ ] 8.3 Verificar que `README.md` tiene las 6 secciones mínimas
         (Stack, Instalación, Uso, Scripts, Tests y cobertura, Deploy)
- [ ] 8.4 Crear `.gitattributes` desde `templates/.gitattributes`
- [ ] 8.5 Commit → push → verificar en GitHub que Linguist clasifica el lenguaje correctamente
- [ ] 8.6 Si Linguist sigue mal: ajustar `.gitattributes` (añadir más rutas) y repetir 8.5
```

### Criterios de done

- `CLAUDE.md` existe con las 8 secciones, sin `[TODO:]` pendientes.
- `README.md` tiene las 6 secciones mínimas en español.
- `.gitattributes` excluye al menos `coverage/` del cálculo de Linguist.
- GitHub muestra el lenguaje principal correcto (JavaScript, TypeScript, etc. — no HTML ni CSS).

---

## Checklist general por fase

Antes de hacer `/opsx:archive phase-N-...`:

```
[ ] Todas las tareas del tasks.md marcadas [x]
[ ] npm test pasa
[ ] npm run lint pasa
[ ] npm run format:check pasa
[ ] Criterios de done de esta fase cumplidos
[ ] Smoke test manual del happy path (fases 1, 3, 4)
[ ] Cobertura verificada (fases 5, 6, 7)
[ ] CLAUDE.md y .gitattributes sin TODO pendientes (fase 8)
[ ] Proposal refleja lo que realmente se hizo (editar si cambió en camino)
```
