# CodeMentor frontend agent rules

Read `docs/architecture/frontend-architecture.md` before architecture-sensitive work.
Read `docs/UI_AUDIT_AND_PLAN.md` + `DESIGN-SYSTEM.md` before any UI work.

## Repository architecture

pnpm workspace (`apps/*`, `packages/*`) orchestrated by Turborepo.

| Path | Package name | Port | State |
| --- | --- | ---: | --- |
| `apps/web` | `@codementor/web` | 3000 | The real product: member/student app, all migrated routes and UI |
| `apps/lecturer` | `@codementor/lecturer` | 3010 | Built out: shell, auth, courses/exercises/roadmaps features |
| `apps/admin` | `@codementor/admin` | 3011 | Built out: shell, auth boundary, dashboard/section features |
| `packages/ui` | `@codementor/ui` | — | **The** primitive library — `Button`, `Card`, `Input`, `PageHeader`, `FilterBar`, `Select`, `SegmentedTabs`, `Modal`, `SideDrawer`, `DataTable`, `StatusBadge`, `ManagePage`, `DashboardShell`, `workspace/*`. Consumed by all three apps |
| `packages/editor` | `@codementor/editor` | — | Monaco code editor + TipTap rich-text editor. Used by web + lecturer |
| `packages/api-client` | `@codementor/api-client` | — | `createApiClient`, `ApiClientError`. Used by all three apps |
| `packages/auth` | `@codementor/auth` | — | Keycloak config types, `hasRole`/`hasAnyRole`. Used by all three apps |
| `packages/types` | `@codementor/types` | — | `Role`, `User`, `Pagination`, `ApiResponse`. Used by all three apps |
| `packages/utils` | `@codementor/utils` | — | `joinUrl`. Used by `api-client`, web, lecturer |
| `packages/eslint-config` | `@codementor/eslint-config` | — | Flat config consumed by root `eslint.config.mjs` |
| `packages/typescript-config` | `@codementor/typescript-config` | — | `base.json`, `nextjs.json` |

Keep this table accurate. It drifted badly once (it described `packages/ui` as "DashboardShell
only" long after three apps depended on its full primitive set), and a wrong table is worse than
no table. Update it in the same commit that changes a package's contents or consumers.

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

## UI rules (non-negotiable)

Full reasoning and the audit that produced these: `docs/UI_AUDIT_AND_PLAN.md`.
Token/component detail: `DESIGN-SYSTEM.md`.

1. **One page shell.** Every `(app)` page is `Breadcrumb → PageHeader → StatStrip? → content`,
   in that order. No page renders its own `<header>` or an `<h1>` outside `PageHeader`. A page's
   loading state uses the same header components as its loaded state.
2. **Breadcrumb everywhere.** Rendered by the shell, derived from
   `apps/web/src/lib/navigation/route-meta.ts`. Never hand-roll a `← Quay lại X` link — "back"
   is the previous crumb. A new route ships its `route-meta` entry in the same commit.
3. **Fluid width.** Only the app shell sets a width ceiling. No page sets `max-w-*` on its root.
   The one permitted clamp is `max-w-[72ch]` on prose (article body, lesson text). Data, grids,
   and tables never clamp.
4. **List orientation has one rule.** Grid when items are comparable and the user is choosing;
   list/table when items are scannable and the user is hunting. **Horizontal scroll strips are
   banned** in the app shell — overflow wraps, it does not scroll. One filter mechanism per page:
   `FilterBar` plus at most one `SegmentedTabs`.
5. **Stats are a strip, not a wall.** At most one `StatStrip` per page (≤64px, no cards, no
   icons), directly under `PageHeader`. A number earns a place only if it is computed from real
   data *and* actionable — hardcoded marketing figures are deleted, not styled. Per-entity
   metadata belongs on the entity's card, not in a page-level tile. Right rails cap at 2 cards,
   each carrying an action or a deadline.
6. **Two libraries, no ambiguity.** `packages/ui` holds primitives that more than one app uses
   and that are built on the shared token names. `apps/web/src/components/ui` holds the student
   product's own primitives — they are built on `navy`/`surface`/`on-ink`/`border-soft`, which
   lecturer and admin do not define, so moving them would create a shared package with one
   consumer. Where both libraries export the same name (`Button`, `Card`, `PageHeader`), eslint
   blocks the wrong import rather than one being deleted; they differ on purpose (web's `Button`
   is a 40px CTA that can render as a Link, the shared one is a 36px control for dense tables).
   Never add a third copy of a name, and never re-export one library through the other.
7. **Tokens only.** No `zinc-*` / `gray-*` / `slate-*` / `orange-*` / `bg-white` / `text-white`,
   no arbitrary type sizes (`text-[10px]`). Hardcoded colors are holes in dark mode. On a surface
   that stays dark in both themes (`bg-ink-fixed`) the foreground is `text-on-ink-fixed`, not
   `text-on-ink` — the latter inverts and would render near-black on near-black.
8. **One interaction language.** Hover and focus are a border or background delta —
   `transition-colors duration-150`. No `translate`, no `scale`, no hover shadow. Every
   interactive element has a visible `focus-visible` ring.

Rules 6–8 are enforced by eslint (`packages/eslint-config`), as errors in `apps/web` and as
warnings in `apps/lecturer`, `apps/admin`, and `packages/ui` until those get their own audit.
Promote an app to `error` in the same change that cleans it up. **Do not silence a rule to land
a change** — the whole point is that the convention runs rather than being remembered.
9. **Ship it or delete it.** No nav-reachable route may render a placeholder. Mock data is
   allowed only where the shape and interaction are the real ones and a backend is planned; a
   mock that exists to fill a grid gets deleted, along with its data file and components.

## Refactoring rules

- Preserve existing behavior, routes, UI, API contracts, and environment behavior — except where
  `docs/UI_AUDIT_AND_PLAN.md` explicitly schedules a route or surface for deletion.
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
