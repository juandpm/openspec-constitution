# [TODO: Nombre del repo]
<!-- openspec-constitution v2.2.3 — template README.md -->
<!-- Copiar a la raíz del repo. Reemplazar todos los [TODO: ...] antes de cerrar Fase 8. -->
<!-- Este archivo es para onboarding humano, en español. Para contexto de agentes, ver CLAUDE.md. -->

[TODO: Una línea describiendo qué hace este repo]

## Stack

| Tecnología | Versión | Rol |
|---|---|---|
| Node.js | 22 | Runtime |
| [TODO: framework/lib] | [TODO: versión] | [TODO: rol] |
| Vitest | 4+ | Testing |
| ESLint | 9+ | Linting |
| Prettier | 3+ | Formato |

## Instalación

```bash
# Clonar el repo
git clone [TODO: URL del repo]
cd [TODO: nombre del repo]

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales (ver sección Secrets en CLAUDE.md)
```

## Uso

[TODO: cómo invocar/usar el servicio en local o cómo triggerearlo]

```bash
# [TODO: ejemplo de invocación local si aplica]
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm test` | Corre los tests una vez (sin coverage) |
| `npm run test:coverage` | Corre tests con reporte de cobertura |
| `npm run test:watch` | Modo watch para desarrollo local |
| `npm run lint` | Verifica el código con ESLint |
| `npm run lint:fix` | Auto-corrige errores de ESLint |
| `npm run format` | Formatea con Prettier |
| `npm run format:check` | Verifica formato (usado en CI) |

[TODO: agregar scripts específicos del repo si existen]

## Tests y cobertura

```bash
npm run test:coverage
```

El reporte se genera en `coverage/`. Los umbrales mínimos son:

- Lines: ≥ 80%
- Functions: ≥ 80%
- Statements: ≥ 80%
- Branches: ≥ 70%

[TODO: indicar si hay tests de integración y cómo correrlos]

## Deploy

[TODO: describir el proceso de deploy]

- **Plataforma**: [TODO: e.g. AWS Lambda vía GitHub Actions]
- **Entornos**: [TODO: e.g. solo producción, rama `main`]
- **Trigger**: [TODO: e.g. push a `main` con todos los tests en verde]
- **Secrets requeridos**: ver CLAUDE.md sección CI/CD

```bash
# [TODO: si hay deploy manual, documentar el comando aquí]
```
