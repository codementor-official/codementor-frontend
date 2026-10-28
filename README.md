<div align="center">

# CodeMentor Frontend

**Three Next.js applications for CodeMentor — the learner app, the lecturer studio and the admin console — in one pnpm/Turborepo monorepo.**

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-EF4444?logo=turborepo&logoColor=white)

</div>

---

## Contents

- [Applications](#applications)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Quality checks](#quality-checks)
- [Project structure](#project-structure)
- [Design system](#design-system)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Documentation](#documentation)

## Applications

| Application | Package | Local URL | Audience |
| --- | --- | --- | --- |
| **Client** | `@codementor/client` | http://localhost:3000 | Learners: courses, learning paths, practice, study groups, AI tutor |
| **Lecturer** | `@codementor/lecturer` | http://localhost:3010 | Lecturers: course and exercise studio, revenue, payouts |
| **Admin** | `@codementor/admin` | http://localhost:3011 | Administrators: users, moderation, reports, commerce, system |

Each application deploys independently. All of them reach the backend through **one origin** — the
Kong gateway at `/api/v1` — and authenticate against Keycloak at `https://id.codementor.cloud`.

## Getting started

**Prerequisites:** Node.js ≥ 22 and pnpm 11 (pinned by `packageManager`; enable it with Corepack).

```bash
pnpm install

pnpm dev               # all three applications
pnpm dev:client        # or one of them
pnpm dev:lecturer
pnpm dev:admin
```

Ports 3001–3013 belong to backend services; frontend applications use 3000, 3010 and 3011.

## Configuration

Copy `apps/<app>/.env.example` to `apps/<app>/.env.local` and fill it in.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` · `API_INTERNAL_URL` | all | Gateway URL for the browser and for server-side calls |
| `NEXT_PUBLIC_KEYCLOAK_*` · `KEYCLOAK_*` | all | Realm, public client and the confidential BFF client |
| `KEYCLOAK_BFF_CLIENT_SECRET` · `AUTH_SESSION_SECRET` | all | Server-only secrets for the encrypted session cookie |
| `NEXT_PUBLIC_REALTIME_URL` | all | WebSocket origin |
| `NEXT_PUBLIC_CLIENT_URL` | lecturer, admin | Links into the learner app (admin "open content" sign-in) |
| `NEXT_PUBLIC_LECTURER_APP_URL` · `NEXT_PUBLIC_ADMIN_APP_URL` | client | Where lecturers and admins land after signing in |

Only browser-safe values may use the `NEXT_PUBLIC_` prefix — it is inlined into the client bundle.

## Quality checks

```bash
pnpm lint        # ESLint across the workspace, including UI rules
pnpm typecheck   # turbo run typecheck
pnpm test        # node:assert self-checks (*.test.ts), run with tsx
pnpm build       # turbo run build — the gate that catches prerender failures
```

Read the **exit code** of `pnpm build`; piping it through `tail` hides a failure. On a machine with
little memory, `pnpm build --concurrency=1` avoids running out of memory with three Next.js
compilers at once.

## Project structure

```text
apps/
  client/          Learner application
  lecturer/        Lecturer application
  admin/           Admin application
packages/
  ui/              The only home for UI primitives (buttons, cards, tables, filters, modals)
  editor/          Monaco code editor and TipTap rich-text editor
  solve/           The three-pane solve screen, shared by the client and the lecturer preview
  api-client/      Shared HTTP transport
  auth/            Keycloak roles, session helpers, admin-to-client sign-in handoff
  types/           Cross-application contracts
  utils/           Framework-independent helpers (CSV, validation, dates)
  eslint-config/ · typescript-config/
docs/              Architecture, design rules and feature notes
scripts/           Test runner and maintenance scripts
```

Application code is organised feature-first under `apps/<app>/src/features`; App Router files stay
thin. Applications never import from each other — shared code goes into a package. A workspace
package must be listed as `workspace:*` **and** added to `transpilePackages`, because packages ship
raw TypeScript.

## Design system

`packages/ui` is the single source of UI primitives; applications compose them in
`src/components`. Every page follows `Breadcrumb → PageHeader → StatStrip? → content`. Styling uses
design tokens only (no raw palette colours or arbitrary sizes), so light and dark themes stay
correct.

- Tokens and components: [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)
- The full UI rules and package table: [AGENTS.md](AGENTS.md) (authoritative when documents disagree)

## Authentication

Password sign-in runs through a **backend-for-frontend**: each application's `/api/auth/*` route
talks to Keycloak with a confidential client and keeps tokens in an encrypted, HTTP-only cookie —
the browser never sees an access or refresh token. Google and Facebook sign-in use a Keycloak
popup. API calls go through each application's `/api/backend/*` proxy, which attaches the token.

Suspended accounts are signed out within a minute and see the reason, the time left and the appeal
address on the sign-in page.

## Deployment

Each application is a separate Vercel project that builds from `main`. Set the variables from
[Configuration](#configuration) in every project; the BFF client secret must be the same across
all three.

## Documentation

| Document | Covers |
| --- | --- |
| [docs/architecture/frontend-architecture.md](docs/architecture/frontend-architecture.md) | Ownership, dependency boundaries, authentication, feature placement |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Tokens, typography, components |
| [docs/UI_AUDIT_AND_PLAN.md](docs/UI_AUDIT_AND_PLAN.md) | UI audit, rules and rebuild plan |
| [docs/PAGE_GUIDELINES.md](docs/PAGE_GUIDELINES.md) | Page shell and review checklist |
| [docs/COMPONENT_SPECIFICATION.md](docs/COMPONENT_SPECIFICATION.md) | Component props and open gaps |
| [docs/PROJECT_DESIGN_PRINCIPLES.md](docs/PROJECT_DESIGN_PRINCIPLES.md) | Why the rules are what they are |
| [docs/DASHBOARD_IMPLEMENTATION.md](docs/DASHBOARD_IMPLEMENTATION.md) | How the dashboards are built |
| [docs/AI_CODE_HINT_PIPELINE.md](docs/AI_CODE_HINT_PIPELINE.md) | The code-hint pipeline against ai-service |
| [docs/revenue-analytics-ui.md](docs/revenue-analytics-ui.md) · [docs/commerce-job-results-ui.md](docs/commerce-job-results-ui.md) | Revenue reports and commerce job results |

## Related repositories

- **codementor-backend** — NestJS and Python services behind the Kong gateway.
- **codementor-infra** — PostgreSQL schema, MongoDB, Keycloak and the data host stack.
