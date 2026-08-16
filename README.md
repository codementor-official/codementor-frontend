# CodeMentor Frontend

CodeMentor's frontend is a pnpm/Turborepo monorepo with three independently deployable Next.js applications:

```text
apps/client       Main member and student application — the full product today
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
  ui/           The primitive library — every app's buttons, cards, inputs, filters, tables
  editor/       Monaco code editor and TipTap rich-text editor
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
```

All three applications consume `ui`, `api-client`, `auth`, and `types`.

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
