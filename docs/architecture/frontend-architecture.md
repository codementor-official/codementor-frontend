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

- `apps/client` owns the public site and member/student learning experience. The original application, its routes, assets, mock data, styles, and state live here.
- `apps/lecturer` owns lecturer-only teaching and review workflows.
- `apps/admin` owns platform administration workflows.

The backend is outside this repository. Frontend refactors must not change backend API contracts.

### Current state

The split is structural; the product is not evenly distributed across it yet.

- `apps/client` holds every migrated route (`(app)` route group, `login`, `signup`, `solve`) and all
  real UI. It consumes no workspace package today.
- `apps/lecturer` and `apps/admin` are scaffolds: `src/app/layout.tsx`, one `src/app/page.tsx`
  rendering `DashboardShell` from `@codementor/ui`, and empty `components/`, `features/`, `hooks/`,
  `lib/`, `providers/` folders.
- `packages/ui` is consumed only by those two placeholder pages. `packages/api-client`,
  `packages/auth`, and `packages/types` have no consumer yet; `packages/utils` is used by
  `api-client` alone.

Those packages are prepared seams for the lecturer/admin build-out. Use them when an app needs
them; do not add new packages in their place, and do not delete them as dead code.

## Dependency rules

Allowed dependencies flow from applications into packages:

```text
apps/client       ─┐
apps/lecturer ─┼─> packages/*
apps/admin     ─┘
```

Shared packages may depend on another shared package when the dependency is explicit and acyclic. For example, `api-client` may use a framework-independent function from `utils`.

Forbidden dependencies:

- An app importing from another app.
- A shared package importing from any app.
- A path alias that bypasses these boundaries.
- Copying authentication or transport infrastructure into each app when one safe shared abstraction is sufficient.

No lint rule enforces this. The only mechanical guardrail is that each app's `@/*` alias resolves
to its own `src/*` and nothing else, so a cross-app import would have to be written as a relative
path escaping the app directory. Reject that in review.

Consuming a workspace package from a Next.js app takes two steps, because packages are published
as raw TypeScript from `src/index.ts`:

1. `"@codementor/<name>": "workspace:*"` in the app's `dependencies`.
2. The same name in `transpilePackages` in the app's `next.config.ts` (see `apps/admin/next.config.ts`).

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
apps/client/src/features/exercises/
  api/
  components/
  hooks/
  types/
  utils/
  constants/
```

Create only the folders a feature needs and avoid deep nesting.

`apps/client/src/features` is empty today. Migrated web code is organized by domain one level up:

```text
apps/client/src/
  app/          Routes: (app) group, login, signup, solve
  components/   ui/ primitives + domain folders (study-group, workspace, exercises, roadmap, …)
  lib/          Domain logic and stores (store/, practice/, roadmap/, study-group/, …)
  data/         Mock content standing in for backend responses
  types/        App-level TypeScript contracts
  hooks/        Cross-feature hooks
  providers/    Empty placeholder
```

New capabilities go in `features/`. Existing domains move there only when they are being reworked
for another reason; architecture work must not force a risky bulk rewrite.

`src/app` is for App Router concerns: routing, layouts, route groups, loading/error boundaries, metadata, and page composition. Prefer a thin page:

```tsx
import { StudyGroupBoard } from "@/components/study-group/study-group-board";
import { studyGroupService } from "@/lib/study-group/study-group-service";

export default async function Page() {
  const groups = await studyGroupService.getAll();
  return <StudyGroupBoard groups={groups} currentUserName={CURRENT_USER_NAME} />;
}
```

Most web pages already look like this. `dashboard`, `explore`, and `practice` still inline 245–345
lines of composition; pull that into components when you next touch those routes.

## Authentication

Keycloak is the identity and authorization provider. Shared role helpers belong in `packages/auth`, and shared HTTP transport belongs in `packages/api-client`.

The Admin application uses a Backend-for-Frontend (BFF) authorization-code flow with PKCE. Keycloak is proxied through the Admin host under `/auth`; the BFF validates state, nonce, issuer, audience, and signatures before creating an encrypted `HttpOnly` session cookie. Browser JavaScript never receives access or refresh tokens. Admin API calls go through `/api/backend`, where the BFF refreshes the session and attaches the bearer token server-side.

The Lecturer application keeps its access token in browser JavaScript (no BFF, no session cookie). Its one server-side route, `/api/copilotkit`, hosts the CopilotKit runtime that fronts the Lecter agent; it is a relay, not a BFF. The browser sends its own `Authorization` header, the runtime forwards it to ai-service, and ai-service verifies the Keycloak JWT. The route holds no credential of its own and cannot act on anyone's behalf.

Each application owns its own route guards, allowed navigation, and required roles:

- Web: member/student roles.
- Lecturer: lecturer role.
- Admin: administrator role.

Hiding a control or redirecting in the frontend improves UX but does not enforce security. Backend services and Keycloak policies must authorize every protected operation. Never expose client secrets or privileged credentials through `NEXT_PUBLIC_*` variables.

## Environment variables

Each app documents its variables in its own `.env.example`. Developers should create an untracked `.env.local` beside the relevant app. The Admin BFF variables are server-only and must not use the `NEXT_PUBLIC_*` prefix.

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

Any single script can also be targeted with `pnpm --filter @codementor/<name> <script>`.

Repository checks:

```bash
pnpm lint       # root: eslint over the workspace, reading packages/eslint-config
pnpm typecheck  # turbo: tsc --noEmit per app and package
pnpm build      # turbo: next build per app
```

`pnpm lint` is a plain root script rather than a Turborepo task, so it is neither cached nor
parallelized per package. `pnpm install` at the workspace root is required before any of the three
will run — a pre-migration single-app `node_modules` does not contain the `@codementor/*` links.

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

`DESIGN-SYSTEM.md` and the design documents under `docs/` currently describe the migrated web client. Their paths point to `apps/client/src`. They remain repository-level references and should be evaluated before applying the same visual system to lecturer or admin.
