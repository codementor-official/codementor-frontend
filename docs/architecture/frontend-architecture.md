# CodeMentor frontend architecture

This document is the source of truth for frontend structure and ownership. The repository is a pnpm workspace orchestrated by Turborepo. It contains three independent Next.js applications and a deliberately small set of shared packages.

## Architecture

```text
apps/
  web/          Main member/student experience
  lecturer/     Lecturer dashboard
  admin/        Administration dashboard
packages/
  ui/           Presentation components used by multiple apps
  api-client/   HTTP transport and error normalization
  auth/         Keycloak-facing types and role helpers
  types/        Cross-application TypeScript contracts
  utils/        Framework-independent shared utilities
  eslint-config/
  typescript-config/
```

Each application owns its routes, layouts, features, application-level components, route guards, navigation, environment configuration, and deployment.

### Application responsibilities

- `apps/web` owns the public site and member/student learning experience. The original application, its routes, assets, mock data, styles, and state live here.
- `apps/lecturer` owns lecturer-only teaching and review workflows.
- `apps/admin` owns platform administration workflows.

The backend is outside this repository. Frontend refactors must not change backend API contracts.

## Dependency rules

Allowed dependencies flow from applications into packages:

```text
apps/web       ─┐
apps/lecturer ─┼─> packages/*
apps/admin     ─┘
```

Shared packages may depend on another shared package when the dependency is explicit and acyclic. For example, `api-client` may use a framework-independent function from `utils`.

Forbidden dependencies:

- An app importing from another app.
- A shared package importing from any app.
- A path alias that bypasses these boundaries.
- Copying authentication or transport infrastructure into each app when one safe shared abstraction is sufficient.

Applications remain independently buildable and deployable. Production domains are deployment concerns and must not be hardcoded into feature logic.

## Component ownership

Use the narrowest correct owner:

- Used by one feature: `apps/<app>/src/features/<feature>/components`.
- Used by several features in one app: `apps/<app>/src/components`.
- Used by at least two apps with the same responsibility: `packages/ui`.

Do not move an existing web component into `packages/ui` until another application has the same concrete need. Application-specific components such as lecturer assignment review stay in their owning application.

## Feature organization

Substantial business capabilities should be feature-first:

```text
apps/web/src/features/exercises/
  api/
  components/
  hooks/
  types/
  utils/
  constants/
```

Create only the folders a feature needs and avoid deep nesting. Existing web code may be migrated toward this organization incrementally; architecture work must not force a risky bulk rewrite.

`src/app` is for App Router concerns: routing, layouts, route groups, loading/error boundaries, metadata, and page composition. Prefer a thin page:

```tsx
import { WorkspacePage } from "@/features/workspace";

export default function Page() {
  return <WorkspacePage />;
}
```

## Authentication

Keycloak is the identity and authorization provider. Shared browser-safe configuration types, session abstractions, token attachment hooks, and role helpers belong in `packages/auth`. Shared HTTP token attachment belongs in `packages/api-client`.

Each application owns its own route guards, allowed navigation, and required roles:

- Web: member/student roles.
- Lecturer: lecturer role.
- Admin: administrator role.

Hiding a control or redirecting in the frontend improves UX but does not enforce security. Backend services and Keycloak policies must authorize every protected operation. Never expose client secrets or privileged credentials through `NEXT_PUBLIC_*` variables.

## Environment variables

Each app documents browser-safe variables in its own `.env.example`. Developers should create an untracked `.env.local` beside the relevant app.

Keep server-only values unprefixed. Use `NEXT_PUBLIC_*` only when the value is safe to include in browser JavaScript. Shared packages receive configuration from the consuming application rather than reading unrelated app environment files.

## Local development

```bash
pnpm install
pnpm dev

pnpm dev:web
pnpm dev:lecturer
pnpm dev:admin
```

| App | Port |
| --- | ---: |
| web | 3000 |
| lecturer | 3001 |
| admin | 3002 |

Repository checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Adding a feature

1. Add the route or route group under `apps/<app>/src/app`.
2. Put the business implementation under `apps/<app>/src/features/<feature>`.
3. Keep feature-only components, hooks, API functions, types, constants, and utilities inside that feature.
4. Promote code to the app-level `src/components`, `src/hooks`, or `src/lib` only after multiple features in that app use it.
5. Keep route files small and compose the feature entry point from them.
6. Use `@/*` for imports within the same app.

Feature-specific APIs should remain near the feature. Put only shared request creation, response parsing, error normalization, and token attachment in `packages/api-client`.

## Adding shared code

Before adding code to `packages`, confirm that at least two applications need the same abstraction and that it has no application-specific routing, state, copy, or business behavior.

Use:

- `@codementor/ui` for shared presentation.
- `@codementor/types` for shared contracts, not page props.
- `@codementor/api-client` for transport primitives, not every feature endpoint.
- `@codementor/auth` for shared Keycloak infrastructure, not app-specific access rules.
- `@codementor/utils` for small framework-independent functions with real cross-app use.

Do not create generic repositories, dependency-injection layers, micro-frontends, or speculative packages.

## Import boundaries

Inside an app, `@/*` resolves only to that app's `src/*`. Shared code is imported by package name:

```ts
import { DashboardShell } from "@codementor/ui";
import type { User } from "@codementor/types";
```

Never configure aliases into another app. If two apps need the same code, extract the smallest stable abstraction to the appropriate shared package.

## Design documentation

`DESIGN-LANGUAGE.md`, `DESIGN-SYSTEM.md`, and the design documents under `docs/` currently describe the migrated web client. Their paths point to `apps/web/src`. They remain repository-level references and should be evaluated before applying the same visual system to lecturer or admin.
