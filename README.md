# CodeMentor Frontend

CodeMentor's frontend is a pnpm/Turborepo monorepo with three independently deployable Next.js applications:

```text
apps/client     Member and student application — 28 routes
apps/lecturer   Lecturer dashboard — 18 routes: shell, auth, courses/exercises/roadmaps, studio
apps/admin      Administration dashboard — 12 routes: shell, auth boundary, dashboard/sections
```

All three are built out; none is a placeholder scaffold. `AGENTS.md` carries the authoritative
per-package table — when the two disagree, `AGENTS.md` wins.

The backend and Keycloak deployment are maintained independently. Keycloak is reached at
`https://id.codementor.cloud`; the backend is reached through the Kong gateway, never per-service.

## Requirements

- Node.js 22 or newer (the backend pins 22+)
- pnpm 11.19.0 (pinned by `packageManager` in `package.json`; run through Corepack)

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
pnpm dev:client
pnpm dev:lecturer
pnpm dev:admin
```

| Application | Package | Local URL |
| --- | --- | --- |
| Client | `@codementor/client` | http://localhost:3000 |
| Lecturer | `@codementor/lecturer` | http://localhost:3010 |
| Admin | `@codementor/admin` | http://localhost:3011 |

Ports 3001–3013 belong to the backend services. Frontend apps start at 3010, never below.

## Quality checks

```bash
pnpm lint        # eslint over the whole workspace
pnpm typecheck   # turbo run typecheck
pnpm build       # turbo run build
```

`pnpm build` is the gate that catches what `typecheck` does not — Next.js prerendering runs at
build time and fails on server-only code reached during static generation. Read its **exit code**;
`pnpm build | tail` reports the pipe's status, so a red build reads as green.

Turbo builds the three apps in parallel by default. On a machine without much headroom that is
three Next.js compilers at once and the run dies with exit 137 (the OOM killer, not a code error);
`pnpm build --concurrency=1` trades about a minute for surviving it.

Lint is clean at **zero errors**. It still reports warnings, all of them accepted and explained in
`AGENTS.md` → Validation — mostly `react-hooks/set-state-in-effect`, a React Compiler performance
hint on effects that have to stay effects.

There is no test runner. The `*.test.ts` files present are self-checks that need `tsx`, which is
not installed — see `AGENTS.md` before citing them.

## Project structure

```text
apps/
  client/       Member/student product
  lecturer/     Lecturer product
  admin/        Administration product
packages/
  ui/           The primitive library — every app's buttons, cards, inputs, filters, tables
  editor/       Monaco code editor and TipTap rich-text editor
  solve/        SolvePreview, the three-pane solve screen. Used by lecturer's preview
  api-client/   Shared HTTP transport used by application API adapters
  auth/         Shared Keycloak-facing role and authentication primitives
  types/        Cross-application contracts
  utils/        Framework-independent shared utilities
  eslint-config/
  typescript-config/
docs/
  architecture/frontend-architecture.md
  UI_AUDIT_AND_PLAN.md          The UI audit, its rules, and the rebuild plan
  PAGE_GUIDELINES.md            The page shell and the per-page review checklist
  COMPONENT_SPECIFICATION.md    Component props, and the gaps still open
  PROJECT_DESIGN_PRINCIPLES.md  Why the rules are what they are
  DASHBOARD_IMPLEMENTATION.md   How the dashboards are put together
  AI_CODE_HINT_PIPELINE.md      The hint pipeline against ai-service
  superpowers/                  Specs and plans for in-flight work
```

All three applications consume `ui`, `api-client`, `auth`, and `types`. A workspace package must
be listed as `workspace:*` in the app's `dependencies` **and** added to `transpilePackages` in its
`next.config.ts` — the packages ship raw TypeScript.

## Design system

`packages/ui` is the **only** home for UI primitives — an app never defines its own `Button`,
`Card`, or `PageHeader`. Application `src/components/` holds composed, domain-aware components
only.

Nine UI rules govern every page. The short version:

- Every page is `Breadcrumb → PageHeader → StatStrip? → content`, in that order.
- The breadcrumb is rendered by the shell and derived from `route-meta.ts` — never hand-rolled.
- Only the shell sets a width ceiling; pages fill it. `max-w-[72ch]` on prose is the one clamp.
- Grid when the user is choosing between items, list when hunting for one. No horizontal scroll
  strips — overflow wraps.
- One `StatStrip` per page, real numbers only. Stats never displace the page's actual content.
- Tokens only: no `zinc-*`/`orange-*`/`bg-white`, no arbitrary type sizes. Hardcoded colors break
  dark mode.
- Hover and focus are a border/background delta at 150ms. No translate, scale, or hover shadow.
- No nav-reachable route may render a placeholder.

Full rules: [AGENTS.md](AGENTS.md) → UI rules.
Tokens and components: [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
Audit and rebuild plan: [docs/UI_AUDIT_AND_PLAN.md](docs/UI_AUDIT_AND_PLAN.md).

See [Frontend architecture](docs/architecture/frontend-architecture.md) for ownership rules, dependency boundaries, authentication guidance, and feature placement.
