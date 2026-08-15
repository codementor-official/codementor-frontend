# CodeMentor Frontend

CodeMentor's frontend is a pnpm/Turborepo monorepo with three independently deployable Next.js applications:

```text
apps/web       Main member and student application — the full product today
apps/lecturer  Lecturer dashboard — scaffold, one placeholder page
apps/admin     Administration dashboard — scaffold, one placeholder page
```

The backend and Keycloak deployment are maintained independently.

## Requirements

- Node.js 20 or newer
- pnpm 11 (the exact version is declared in `package.json`)

## Install

```bash
pnpm install
```

Copy the relevant `apps/<app>/.env.example` to `.env.local` when an application needs environment configuration. Only browser-safe values may use the `NEXT_PUBLIC_*` prefix.

## Development

Start all applications:

```bash
pnpm dev
```

Or start one application:

```bash
pnpm dev:web
pnpm dev:lecturer
pnpm dev:admin
```

| Application | Local URL |
| --- | --- |
| Web | http://localhost:3000 |
| Lecturer | http://localhost:3010 |
| Admin | http://localhost:3011 |

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Project structure

```text
apps/
  web/          Existing member/student product
  lecturer/     Lecturer product
  admin/        Administration product
packages/
  ui/           UI shared by multiple applications (DashboardShell)
  api-client/   Shared HTTP transport — no consumer yet
  auth/         Shared Keycloak-facing auth primitives — no consumer yet
  types/        Cross-application contracts — no consumer yet
  utils/        Framework-independent shared utilities
  eslint-config/
  typescript-config/
docs/
  architecture/frontend-architecture.md
```

The empty packages are prepared seams for the lecturer and admin build-out, not dead code.

See [Frontend architecture](docs/architecture/frontend-architecture.md) for ownership rules, dependency boundaries, authentication guidance, and feature placement.
