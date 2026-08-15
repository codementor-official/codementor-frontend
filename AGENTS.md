# CodeMentor frontend agent rules

Read `docs/architecture/frontend-architecture.md` before architecture-sensitive work.

## Repository architecture

pnpm workspace (`apps/*`, `packages/*`) orchestrated by Turborepo.

| Path | Package name | Port | State |
| --- | --- | ---: | --- |
| `apps/web` | `@codementor/web` | 3000 | The real product: member/student app, all migrated routes and UI |
| `apps/lecturer` | `@codementor/lecturer` | 3010 | Scaffold: one placeholder page, empty `src/*` folders |
| `apps/admin` | `@codementor/admin` | 3011 | Scaffold: one placeholder page, empty `src/*` folders |
| `packages/ui` | `@codementor/ui` | — | `DashboardShell` + `styles.css`, used only by the two scaffolds |
| `packages/api-client` | `@codementor/api-client` | — | `createApiClient`, `ApiClientError`. No consumer yet |
| `packages/auth` | `@codementor/auth` | — | Keycloak config types, `hasRole`/`hasAnyRole`. No consumer yet |
| `packages/types` | `@codementor/types` | — | `Role`, `User`, `Pagination`, `ApiResponse`. No consumer yet |
| `packages/utils` | `@codementor/utils` | — | `joinUrl`. Used by `api-client` |
| `packages/eslint-config` | `@codementor/eslint-config` | — | Flat config consumed by root `eslint.config.mjs` |
| `packages/typescript-config` | `@codementor/typescript-config` | — | `base.json`, `nextjs.json` |

The unused packages are deliberate seams for the lecturer/admin build-out, not dead code. Wire an
app to them when that app actually needs them; do not invent new packages instead.

Never import from one app into another. Shared packages must never import from an app. Nothing
enforces this mechanically — `@/*` resolves only to the owning app's `src/*`, and that is the
whole guardrail.

A Next.js app that imports a workspace package must list it in `dependencies` as `workspace:*`
**and** add it to `transpilePackages` in its `next.config.ts` (packages ship raw TypeScript).
See `apps/admin/next.config.ts`.

## Placement and ownership

- Put new business features in `apps/<app>/src/features/<feature>`.
- `apps/web/src/features` is currently empty. Existing web code is organized by domain folders
  under `src/components/<domain>` and `src/lib/<domain>`, with `src/data` (mock data), `src/types`,
  `src/hooks`. Do not bulk-migrate it; move a domain into `features/` only when you are already
  reworking it.
- Keep Next.js route files focused on routing, layouts, boundaries, and page composition.
- Keep code used by one feature inside that feature.
- Keep code shared across features in one application under that application's `src/components`,
  `src/hooks`, or `src/lib`.
- Extract to `packages` only when a concrete cross-application abstraction exists. Do not extract
  code because it might be reusable later.

## Refactoring rules

- Preserve existing behavior, routes, UI, API contracts, and environment behavior.
- Do not introduce cross-app imports, unrelated UI changes, or unrequested dependency upgrades.
- Prefer small, reviewable changes.
- Keycloak and the backend enforce authorization. Client role checks are UX aids, not a security boundary.
- Never expose secrets through `NEXT_PUBLIC_*` variables or client bundles. Each app declares its
  browser-safe variables in `apps/<app>/.env.example`; developers copy it to an untracked `.env.local`.

## Next.js

This repository uses Next.js 16. APIs and conventions may differ from training data. Before changing framework behavior, read the relevant guide from the installed Next.js documentation under the app's resolved `node_modules/next/dist/docs/` and heed deprecation notices.

## Validation

After meaningful changes, run:

```bash
pnpm lint       # root eslint over the whole workspace, not a turbo task
pnpm typecheck  # turbo, per package
pnpm build      # turbo, per app
```

Single app: `pnpm dev:web`, `pnpm dev:lecturer`, `pnpm dev:admin`, or
`pnpm --filter @codementor/<name> <script>`.

There are no tests in this repository yet. Run relevant tests once tests exist.
