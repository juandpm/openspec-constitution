# Documentación para agentes — Reglas para CLAUDE.md y README.md

> openspec-constitution v2.2.0
> Este documento define cómo escribir `CLAUDE.md` y `README.md` para que un agente de IA
> pueda usarlos sin interpretación ambigua y sin necesitar contexto verbal adicional.

---

## CLAUDE.md vs README.md: qué va en cada uno

| Aspecto | CLAUDE.md | README.md |
|---|---|---|
| **Audiencia** | Agente de IA (Claude Code) | Desarrollador humano nuevo |
| **Idioma** | Inglés | Español |
| **Nivel de detalle** | Máximo — cada gotcha documentado | Suficiente para onboarding rápido |
| **Foco** | Cómo funciona el código, qué no es obvio | Cómo instalar, usar y deployar |
| **Secciones** | 9 obligatorias (ver constitución §11 y §12) | 6 obligatorias (ver constitución §11) |
| **Duplicación** | Evitar duplicar con README.md | Evitar duplicar con CLAUDE.md |

**Regla de oro**: si el agente necesita saber algo para no cometer un error, va en `CLAUDE.md`. Si un humano nuevo necesita saber algo para hacer funcionar el repo en su máquina, va en `README.md`.

---

## Cómo escribir CLAUDE.md

### Sección "Project overview"

Debe responder en 3-5 oraciones:
- ¿Qué hace este repo?
- ¿Quién lo invoca / quién lo consume?
- ¿En qué entorno corre? (Lambda, container, CLI)

**Bien:**
```markdown
Lambda Node.js 22 that receives WhatsApp Flow events via HTTPS POST, decrypts
the payload (AES-256-GCM), routes to screen handlers, and returns an encrypted
response. Invoked by Meta's WhatsApp Business Platform. Deployed to AWS Lambda
behind API Gateway.
```

**Mal:**
```markdown
This is a Node.js project that handles some flow logic.
```

---

### Sección "Development commands"

No copies los scripts de `package.json` sin valor agregado. Añade **cuándo usar cada uno**:

**Bien:**
```markdown
npm test              # run once — use before committing
npm run test:watch    # use during active development, re-runs on file save
npm run test:coverage # use to check coverage thresholds before pushing
```

**Mal:**
```markdown
npm test — runs tests
npm run lint — runs lint
```

---

### Sección "Architecture"

Incluir un diagrama de flujo de datos textual, no solo una lista de módulos. El agente necesita entender qué llama a qué:

**Bien:**
```
handler (src/index.js)
  → validates HMAC signature
  → decrypts payload (src/encryption.js)
  → routes to ScreenHandler (src/handlers/ScreenHandler.js)
      → reads DB via DatabaseService (src/services/DatabaseService.js) → MongoDB Atlas
      → fetches S3 objects via S3Service (src/services/S3Service.js) → AWS S3
  → encrypts response
  → returns 200
```

**Mal:**
```
src/index.js — entry point
src/handlers/ — handlers
src/services/ — services
```

---

### Sección "Non-obvious details"

Es la sección más valiosa. Documenta lo que haría cometer un error a alguien que lee el código por primera vez:

**Ejemplos de buenas entradas:**
```markdown
- Lambda timeout is 29s (not 30s) — 1 second less than API Gateway's limit to ensure
  a clean error response reaches the caller before the gateway times out.
- `cachedSecrets` and `cachedClient` in src/clients.js are module-level singletons.
  They persist across warm invocations. Do not reassign them inside the handler.
- The `vi.hoisted()` pattern is required for AWS SDK mocks because ES module evaluation
  happens before vi.mock() would normally run. See tests/s3.test.js for the pattern.
- package-lock.json is committed. Do not delete it — CI uses `npm ci`.
```

**Evitar:**
```markdown
- The code uses async/await.
- Tests are in the tests/ folder.
```

---

## Anti-patrones en CLAUDE.md

| Anti-patrón | Por qué falla | Qué hacer |
|---|---|---|
| Documentar comandos que ya están en `package.json` sin contexto | El agente puede leer `package.json` solo | Añadir cuándo usarlos, no solo qué hacen |
| Duplicar la arquitectura entre CLAUDE.md y README.md | El agente no sabe cuál es la fuente de verdad | CLAUDE.md tiene el detalle técnico; README.md solo el resumen |
| Omitir la sección "Non-obvious details" | Es la más valiosa y la más frecuentemente vacía | Al menos 2-3 entradas reales, no genéricas |
| Dejar `[TODO:]` después de Phase 8 | El template sin completar es peor que no tenerlo | Completar todos antes de archivar Fase 8 |
| Escribir en español en CLAUDE.md | Modelos de IA procesan inglés con mayor precisión | Inglés siempre en CLAUDE.md |

---

## Anti-patrones en README.md

| Anti-patrón | Por qué falla | Qué hacer |
|---|---|---|
| Omitir la sección "Scripts" o dejarla vacía | El desarrollador nuevo corre comandos equivocados | Tabla de `npm run X` con descripción de cada uno |
| "Instalación" con pasos vagos ("configure your environment") | El desarrollador nuevo no sabe qué necesita | Pasos concretos desde cero, incluyendo `.env.example` |
| Sección "Deploy" ausente | El desarrollador no sabe cómo llegar a producción | Pipeline, trigger, secrets requeridos — aunque sea una línea |
| README en inglés | La audiencia del equipo es hispanohablante | Español siempre en README.md |

---

## Ejemplo de referencia: CLAUDE.md de lambda-transfer

El repo `lambda-transfer` tiene un buen ejemplo de CLAUDE.md. Puntos destacables:

- **Architecture**: diagrama textual con flechas que muestra el flujo completo desde el evento S3 hasta la escritura en destino.
- **Non-obvious details**: documenta el patrón de caché de clientes (`cachedSecrets`, `cachedClient`) y por qué es un singleton de módulo — incluye la consecuencia de no seguirlo (reconexión en cada invocación warm).
- **Testing**: explica el patrón `vi.hoisted()` con referencia al archivo de test específico donde se usa.

Usar ese CLAUDE.md como referencia antes de escribir el de un repo nuevo.

---

## Checklist antes de archivar Fase 8

```
[ ] CLAUDE.md tiene las 9 secciones (ninguna vacía ni con [TODO:])
[ ] Project overview: ≥ 3 oraciones con stack, entorno, quién invoca
[ ] Development commands: cada comando tiene "cuándo usarlo"
[ ] Architecture: hay un diagrama de flujo textual, no solo lista de módulos
[ ] Non-obvious details: ≥ 2 entradas reales (no genéricas)
[ ] Position in ecosystem (sección 9): mini-diagrama Mermaid con upstream/downstream reales
[ ]   → upstream y downstream no son placeholders [TODO]
[ ]   → referencia a docs/ecosystem.md de openspec-constitution
[ ]   → nombre exacto de la función Lambda en AWS
[ ] README.md tiene las 6 secciones en español
[ ] README.md "Instalación": pasos reproducibles desde cero
[ ] README.md "Deploy": pipeline, trigger y secrets documentados
[ ] .gitattributes excluye coverage/ y otros artefactos de Linguist
[ ] GitHub muestra el lenguaje principal correcto
```
